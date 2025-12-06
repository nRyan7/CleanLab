import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Icons } from './Icon';

interface CorpusSplitterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CorpusSplitterModal: React.FC<CorpusSplitterModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [zipFileName, setZipFileName] = useState<string>('');
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

    const splitCorpus = async () => {
        if (!file) return;

        setIsProcessing(true);
        setStatus('正在读取文件...');
        setProgress(10);

        try {
            const text = await file.text();
            setStatus('正在解析内容...');
            setProgress(30);

            const zip = new JSZip();
            const folder = zip.folder("corpus_split");

            let count = 0;
            const totalLen = text.length;

            // Strategy 1: Try JSONL (Line by line)
            // This is efficient and handles the "v2-data.jsonl" case best if it's standard JSONL.
            const lines = text.split(/\r?\n/);
            let isJsonl = false;

            // Heuristic check for JSONL: check first few non-empty lines
            let validJsonCount = 0;
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                if (lines[i].trim()) {
                    try {
                        JSON.parse(lines[i]);
                        validJsonCount++;
                    } catch (e) {
                        // Not JSON
                    }
                }
            }

            if (validJsonCount > 0) {
                isJsonl = true;
                setStatus('检测到 JSONL 格式，正在逐行处理...');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    if (i % 500 === 0) {
                        await new Promise(r => setTimeout(r, 0));
                        setProgress(30 + Math.floor((i / lines.length) * 60));
                    }

                    try {
                        const obj = JSON.parse(line);
                        // Support various keys: text, content, body, or just the first string value
                        const content = obj.text || obj.content || obj.body || Object.values(obj).find(v => typeof v === 'string');

                        if (content && typeof content === 'string') {
                            folder?.file(`article_${count}.txt`, content);
                            count++;
                        }
                    } catch (e) {
                        // Ignore malformed lines
                    }
                }
            }

            // Strategy 2: Fallback to marker search if not JSONL or no results found
            if (count === 0) {
                setStatus('尝试使用标记解析...');
                let idx = 0;
                // Support both unquoted {text: and quoted {"text":
                // We'll look for "text" followed by colon
                const regex = /\{[\s\n]*("text"|text|'text')[\s\n]*:/g;

                let match;
                while ((match = regex.exec(text)) !== null) {
                    const startPos = match.index;

                    if (count % 100 === 0) {
                        await new Promise(r => setTimeout(r, 0));
                        setProgress(30 + Math.floor((idx / totalLen) * 60));
                    }

                    // Find matching closing brace
                    // This is still a simple heuristic: find next '}' that balances? 
                    // Or just next '}' for speed/simplicity as before?
                    // Let's try to be slightly smarter: find next '}'

                    const contentStart = regex.lastIndex;
                    const endPos = text.indexOf("}", contentStart);

                    if (endPos !== -1) {
                        // Extract content, removing potential quotes if it was a string
                        let rawContent = text.substring(contentStart, endPos).trim();

                        // Remove leading/trailing quotes if present
                        if ((rawContent.startsWith('"') && rawContent.endsWith('"')) ||
                            (rawContent.startsWith("'") && rawContent.endsWith("'"))) {
                            rawContent = rawContent.slice(1, -1);
                        }

                        // Handle escaped newlines/quotes if it was JSON string
                        try {
                            // If it looks like a JSON string, try to unescape it
                            rawContent = JSON.parse(`"${rawContent.replace(/"/g, '\\"')}"`);
                        } catch (e) {
                            // Keep raw if fail
                        }

                        folder?.file(`article_${count}.txt`, rawContent);
                        count++;
                        idx = endPos + 1;
                        regex.lastIndex = idx; // Update regex position
                    } else {
                        break;
                    }
                }
            }

            if (count === 0) {
                setStatus('未找到符合格式的内容 (支持 JSONL 或 {text:...})');
                setIsProcessing(false);
                return;
            }

            setStatus(`已拆分 ${count} 篇文章，正在打包...`);
            setProgress(90);

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            setDownloadUrl(url);
            setZipFileName(`corpus_split_${new Date().getTime()}.zip`);

            setStatus(`完成！共拆分 ${count} 个文件。`);
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
                    <h2 className="text-xl font-bold text-white">语料文件拆分工具</h2>
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
                            accept=".txt,.json,.jsonl"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            {file ? file.name : "选择文件"}
                        </button>
                        <p className="text-gray-400 text-sm mt-2">
                            支持 .txt, .json 格式 (需包含 &#123;text: ...&#125; 结构)
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
                                download={zipFileName}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors flex items-center gap-2"
                                onClick={() => {
                                    // Optional: close after download? No, let user decide.
                                }}
                            >
                                <Icons.Download className="w-4 h-4" />
                                下载 ZIP
                            </a>
                        ) : (
                            <button
                                onClick={splitCorpus}
                                disabled={!file || isProcessing}
                                className={`px-4 py-2 rounded flex items-center gap-2 ${!file || isProcessing
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                            >
                                {isProcessing ? '处理中...' : '开始拆分'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorpusSplitterModal;
