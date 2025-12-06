
// import { GoogleGenAI } from "@google/genai";
import { AISettings } from "../types";

// let client: GoogleGenAI | null = null;
// let client: any = null;

// Constants for chunking
const MAX_CHUNK_SIZE = 4000; // Characters per chunk (conservative limit for stable output)

/**
 * Smartly splits text into chunks ensuring paragraphs aren't broken.
 */
const splitTextIntoChunks = (text: string): string[] => {
  if (text.length <= MAX_CHUNK_SIZE) return [text];

  const lines = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    // If adding this line exceeds max size, push current chunk and start new
    if (currentChunk.length + line.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = "";
    }

    // If a single line is massive (unlikely in novels, but possible), we have to split it hard
    if (line.length > MAX_CHUNK_SIZE) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      // Split massive line by hard limit
      let tempLine = line;
      while (tempLine.length > 0) {
        chunks.push(tempLine.slice(0, MAX_CHUNK_SIZE));
        tempLine = tempLine.slice(MAX_CHUNK_SIZE);
      }
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

/**
 * Test the connection to the local LLM provider
 */
export const testLocalConnection = async (baseUrl: string): Promise<{ success: boolean; message: string; models?: string[] }> => {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const targetUrl = `${cleanUrl}/models`; // Standard OpenAI endpoint to list models

  // 1. Check for Mixed Content (HTTPS vs HTTP)
  if (window.location.protocol === 'https:' && cleanUrl.startsWith('http:')) {
    return {
      success: false,
      message: "[Environment Error] You are accessing a local HTTP service from an HTTPS site. The browser has blocked the request. Please download the project and run it locally (npm run dev)."
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];
      const modelCount = models.length;

      return {
        success: true,
        message: `Connection successful! Found ${modelCount} loaded models.`,
        models: models
      };
    } else {
      return {
        success: false,
        message: `Service connected but returned error: ${response.status} ${response.statusText}. Please check service logs.`
      };
    }
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      // Check if it looks like Ollama port
      if (baseUrl.includes('11434')) {
        return {
          success: false,
          message: "Connection failed (Ollama). If CORS issue, stop Ollama and run: OLLAMA_ORIGINS=\"*\" ollama serve"
        };
      }
      // Check if it looks like LM Studio port
      if (baseUrl.includes('1234')) {
        return {
          success: false,
          message: "Connection failed (LM Studio). If CORS issue, run: lms server start --cors"
        };
      }
      return {
        success: false,
        message: "Connection failed. Please check: 1. Service started? 2. CORS enabled?"
      };
    }
    return {
      success: false,
      message: `Unknown error occurred: ${error.message}`
    };
  }
};

/**
 * Core function to call AI for a single chunk
 */
const processChunk = async (
  chunkText: string,
  settings: AISettings,
  onChunkDelta: (delta: string) => void
): Promise<string> => {
  const prompt = settings.systemPrompt.replace("{TEXT}", chunkText);
  let chunkResult = "";

  // --- STRATEGY: GEMINI (REST API) ---
  if (settings.provider === 'gemini') {
    if (!settings.apiKey) {
      throw new Error("Please configure Gemini API Key in settings");
    }

    const API_KEY = settings.apiKey;
    const MODEL = settings.geminiModelName || "gemini-1.5-flash";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${API_KEY}`;

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7, // Slightly higher for creativity in rewriting
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
      }

      if (!response.body) throw new Error("No response body from Gemini API");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Refined parsing logic for Gemini REST Stream
        // The stream often comes as `[{...}]\n[{...}]` or `[{...},\r\n{...}]`
        // We need to extract valid JSON objects.

        let boundary = buffer.indexOf('}\n');
        if (boundary === -1) boundary = buffer.indexOf('},\r\n');

        // If no simple boundary, try bracket matching?
        // Let's use a simpler approach: splitting by `\n` but accumulating if JSON is invalid.

        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep the last incomplete line

        for (const line of lines) {
          const trimmed = line.trim().replace(/^,/, '').trim();
          if (!trimmed || trimmed === '[' || trimmed === ']') continue;

          try {
            const data = JSON.parse(trimmed);
            // Extract text candidate
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              chunkResult += textPart;
              onChunkDelta(textPart);
            }
          } catch (e) {
            // If simple parse fails, it might be a multi-line JSON object. 
            // This manual parsing is tricky without a true tokenizer.
            // For now, let's assume one-object-per-line which is standard for most SSE/stream setups.
            // If Gemini breaks this rule, we might need a library like `json-stream`.
            console.warn("Failed to parse chunk line:", trimmed);
          }
        }
      }

    } catch (error) {
      console.error("Gemini REST API Error:", error);
      throw error;
    }
  }
  // --- STRATEGY: LOCAL / OPENAI COMPATIBLE ---
  else {
    try {
      const baseUrl = settings.localBaseUrl.replace(/\/$/, '');
      const url = `${baseUrl}/chat/completions`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.localModelName,
          messages: [
            { role: "system", content: "You are a helpful writing assistant." },
            { role: "user", content: prompt }
          ],
          stream: true,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Local API Error ${response.status}: ${errText || response.statusText}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                chunkResult += content;
                onChunkDelta(content);
              }
            } catch (e) {
              // Ignore individual parse errors for robustness
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Local API Error:", error);

      // Enhanced Error Diagnosis
      if (error instanceof TypeError || error.message === 'Load failed' || error.message === 'Failed to fetch') {
        const isHttps = window.location.protocol === 'https:';
        const isLocalHttp = settings.localBaseUrl.startsWith('http:');

        if (isHttps && isLocalHttp) {
          throw new Error("[HTTPS Mixed Content Block] Cannot connect to HTTP local service from HTTPS site. Please run locally.");
        }

        if (settings.localBaseUrl.includes('11434')) {
          throw new Error("Ollama Connection Failed (CORS). Stop Ollama and run: OLLAMA_ORIGINS=\"*\" ollama serve");
        }

        if (settings.localBaseUrl.includes('1234')) {
          throw new Error("LM Studio Connection Failed (CORS). Run: lms server start --cors");
        }

        throw new Error("Cannot connect to local model. Check: 1. Service running? 2. Model loaded? 3. CORS enabled?");
      }

      throw error;
    }
  }

  return chunkResult;
};

export const streamRewrite = async (
  text: string,
  settings: AISettings,
  onChunk: (fullTextSoFar: string) => void
): Promise<string> => {

  // 1. Split text into manageable chunks
  const chunks = splitTextIntoChunks(text);
  let fullFinalText = "";

  console.log(`[Splitter] Text length: ${text.length}, Chunks: ${chunks.length}`);

  // 2. Process chunks sequentially
  let lastUpdate = 0;
  const THROTTLE_MS = 200; // Throttle UI updates to max 5fps to prevent "jumping" artifacts with fast local models

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[Processing] Chunk ${i + 1}/${chunks.length}, size: ${chunk.length}`);

    // Reset accumulator for the current chunk
    let currentChunkAccumulator = "";

    await processChunk(chunk, settings, (delta) => {
      // Accumulate the delta locally for this chunk
      currentChunkAccumulator += delta;

      // Throttle the UI update
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_MS) {
        onChunk(fullFinalText + currentChunkAccumulator);
        lastUpdate = now;
      }
    }).then((finalChunkText) => {
      // Commit this chunk to the global text
      fullFinalText += finalChunkText;
      // Ensure final state is synced immediately at end of chunk
      onChunk(fullFinalText);
      lastUpdate = Date.now();
    });
  }

  return fullFinalText;
};