import React, { useState, useRef } from 'react';
import { Icons } from './Icon';

interface DatasetCleanerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DatasetCleanerModal: React.FC<DatasetCleanerModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [cleanedFileName, setCleanedFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('');
            setDownloadUrl(null);
            setProgress(0);
        }
    };

    const cleanDataset = async () => {
        if (!file) return;

        setIsProcessing(true);
        setStatus('正在读取文件...');
        setProgress(10);

        try {
            const text = await file.text();
            setStatus('正在清洗格式...');
            setProgress(30);

            // 1. Split by lines
            const lines = text.split(/\r?\n/);
            const cleanedLines: string[] = [];
            const totalLines = lines.length;

            for (let i = 0; i < totalLines; i++) {
                let line = lines[i].trim();

                if (i % 1000 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                    setProgress(30 + Math.floor((i / totalLines) * 60));
                }

                // Skip empty lines
                if (!line) continue;

                // 2. Remove Markdown code blocks (```json, ```)
                if (line.startsWith('```')) continue;

                // 3. Remove trailing comma
                if (line.endsWith(',')) {
                    line = line.slice(0, -1);
                }

                // 4. Unwrap {"text": "..."} if present (often from API responses)
                // Heuristic: if line starts with {"text": and ends with }
                // But be careful not to break valid JSONL that just happens to have a text field.
                // The user's specific case was: {"text": "{\"messages\": ...}"}
                // So we check if the content of "text" is ITSELF a JSON string that needs parsing.

                try {
                    // First, try to parse the line as JSON
                    const obj = JSON.parse(line);

                    // Check if it matches the specific wrapper pattern: { "text": "..." }
                    // And the content inside "text" looks like a JSON object (starts with {)
                    if (obj.text && typeof obj.text === 'string') {
                        let innerContent = obj.text.trim();

                        // Fix: Handle literal "\n" sequences which might occur if double escaped
                        if (innerContent.includes('\\n')) {
                            innerContent = innerContent.replace(/\\n/g, '\n');
                        }

                        // Relaxed check: Look for the first '{'
                        const firstBrace = innerContent.indexOf('{');
                        if (firstBrace !== -1) {
                            // If there is preamble, ignore it
                            if (firstBrace > 0) {
                                innerContent = innerContent.substring(firstBrace);
                            }

                            // Try to split by newlines first to handle multiple JSON objects
                            const innerLines = innerContent.split(/\r?\n/);
                            let hasValidInner = false;

                            for (const innerLine of innerLines) {
                                const trimmedInner = innerLine.trim();
                                if (!trimmedInner) continue;

                                // Remove trailing comma from inner line too if present
                                let lineToParse = trimmedInner;
                                if (lineToParse.endsWith(',')) {
                                    lineToParse = lineToParse.slice(0, -1);
                                }

                                try {
                                    const innerObj = JSON.parse(lineToParse);
                                    // Validate it has "messages" or looks like what we want?
                                    // For now just valid JSON object is enough
                                    if (typeof innerObj === 'object' && innerObj !== null) {
                                        cleanedLines.push(JSON.stringify(innerObj));
                                        hasValidInner = true;
                                    }
                                } catch (e) {
                                    // Ignore parse errors for individual lines
                                }
                            }

                            if (hasValidInner) {
                                continue;
                            }

                            // If splitting didn't work, try parsing the whole block
                            try {
                                const innerObj = JSON.parse(innerContent);
                                if (typeof innerObj === 'object' && innerObj !== null) {
                                    cleanedLines.push(JSON.stringify(innerObj));
                                    continue;
                                }
                            } catch (e) {
                                // Inner content wasn't valid JSON
                            }
                        }
                    }

                    // If it wasn't the wrapper case, just keep the valid JSON line
                    cleanedLines.push(JSON.stringify(obj));

                } catch (e) {
                    // 5. If line is not valid JSON, maybe it has a trailing comma we missed or other issues?
                    // Try removing trailing comma again just in case regex missed something (unlikely with endsWith)
                    // Or maybe it's the "}, {" case on one line?
                    // If the user pasted multiple JSON objects on one line: {"a":1}{"b":2}
                    // This is hard to fix without a stream parser.
                    // For now, let's try to fix simple trailing comma again if JSON parse failed.
                    if (line.endsWith(',')) {
                        const fixedLine = line.slice(0, -1);
                        try {
                            JSON.parse(fixedLine);
                            cleanedLines.push(fixedLine);
                            continue;
                        } catch (e2) {
                            // Still invalid
                        }
                    }

                    // If still invalid, we skip it or log it? 
                    // Let's skip invalid lines to ensure output is clean.
                    console.warn('Skipping invalid JSON line:', line);
                }
            }

            if (cleanedLines.length === 0) {
                setStatus('未找到有效的 JSONL 内容');
                setIsProcessing(false);
                return;
            }

            setStatus(`已清洗 ${cleanedLines.length} 行数据，正在生成文件...`);
            setProgress(90);

            const outputContent = cleanedLines.join('\n');
            const blob = new Blob([outputContent], { type: 'application/jsonl' });
            const url = URL.createObjectURL(blob);

            setDownloadUrl(url);
            setCleanedFileName(`cleaned_dataset_${new Date().getTime()}.jsonl`);

            setStatus(`完成！共清洗 ${cleanedLines.length} 条数据。`);
            setProgress(100);

        } catch (error) {
            console.error(error);
            setStatus('处理出错: ' + (error as any).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icons.Eraser className="w-5 h-5 text-blue-400" />
                        语料格式清洗工具
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json,.jsonl,.txt"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            {file ? file.name : "选择文件"}
                        </button>
                        <p className="text-gray-400 text-sm mt-2">
                            支持 .jsonl, .txt (自动去除 Markdown、逗号，提取内容)
                        </p>
                    </div>

                    {status && (
                        <div className="text-sm text-gray-300">
                            <p>{status}</p>
                            {progress > 0 && progress < 100 && (
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>

                        {downloadUrl ? (
                            <a
                                href={downloadUrl}
                                download={cleanedFileName}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors flex items-center gap-2"
                            >
                                <Icons.Download className="w-4 h-4" />
                                下载清洗后文件
                            </a>
                        ) : (
                            <button
                                onClick={cleanDataset}
                                disabled={!file || isProcessing}
                                className={`px-4 py-2 rounded flex items-center gap-2 ${!file || isProcessing
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                            >
                                <Icons.Eraser className="w-4 h-4" />
                                {isProcessing ? '清洗中...' : '开始清洗'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetCleanerModal;
