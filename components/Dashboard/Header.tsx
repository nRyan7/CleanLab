import React, { useRef } from 'react';
import { Icons } from '../Icon';

interface HeaderProps {
    onOpenSettings: () => void;
    onOpenSplitter: () => void;
    onOpenCleaner: () => void;
    onOpenPrompt: () => void;

    // Queue Control Props
    isUploading: boolean;
    uploadProgress: number;
    isProcessing: boolean;
    stopRequested: boolean;
    hasJobs: boolean;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleProcessing: () => void;
    onClearAll: () => void;
    onDownloadResults?: () => void; // New download handler
    currentModelName: string;
}

export const Header: React.FC<HeaderProps> = ({
    onOpenSettings,
    onOpenSplitter,
    onOpenCleaner,
    onOpenPrompt,
    isUploading,
    uploadProgress,
    isProcessing,
    stopRequested,
    hasJobs,
    onFileUpload,
    onFolderUpload,
    onToggleProcessing,
    onClearAll,
    onDownloadResults,
    currentModelName
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    return (
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/20 gap-4">
            {/* Left Group: Logo & Start Button */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 text-indigo-400">
                    <Icons.Zap className="w-6 h-6" />
                    <h1 className="text-xl font-bold tracking-tight text-zinc-100 hidden sm:block">Corpus Refinery</h1>
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-white/10" />

                <div className="flex items-center gap-3">
                    {/* Start/Pause Button - Always visible on left as requested */}
                    <button onClick={onToggleProcessing} disabled={stopRequested || !hasJobs}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all whitespace-nowrap border border-white/5 ${isProcessing
                            ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none'
                            }`}>
                        {isProcessing ? (
                            <><Icons.Pause className="w-4 h-4" /> Pause Processing</>
                        ) : (
                            <><Icons.Play className="w-4 h-4" /> Start Processing</>
                        )}
                    </button>

                    {/* Model Name Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg border border-white/5 shadow-sm">
                        <Icons.Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-medium text-zinc-300 max-w-[150px] truncate">
                            {currentModelName || 'No Model Selected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center Group: Import & Prompt */}
            <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto custom-scrollbar pb-1 sm:pb-0">

                {/* File Inputs (Hidden) */}
                <input type="file" multiple accept=".txt" ref={fileInputRef} className="hidden" onChange={onFileUpload} />
                <input type="file" multiple ref={folderInputRef} className="hidden" onChange={onFolderUpload}
                    {...{ webkitdirectory: "", directory: "" } as any}
                />

                {/* Center Group: Import & Prompt */}
                <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1 border border-white/5 flex-shrink-0">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap" title="Import Files">
                        <Icons.Upload className="w-4 h-4" />
                        Files
                    </button>
                    <button onClick={() => folderInputRef.current?.click()} disabled={isUploading || isProcessing}
                        className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap" title="Import Folder">
                        <Icons.Folder className="w-4 h-4" />
                        Folder
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1"></div>

                    <button onClick={onOpenCleaner} className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all text-sm font-medium whitespace-nowrap" title="Dataset Cleaner">
                        <Icons.Wand className="w-4 h-4" />
                        Cleaner
                    </button>
                    <button onClick={onOpenSplitter} className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all text-sm font-medium whitespace-nowrap" title="Corpus Splitter">
                        <Icons.Scissors className="w-4 h-4" />
                        Splitter
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={onOpenPrompt} className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition-all text-sm font-medium whitespace-nowrap" title="Set Prompt">
                        <Icons.FilePen className="w-4 h-4" />
                        Prompt
                    </button>

                    {isUploading && (
                        <div className="flex items-center gap-2 px-2 border-l border-white/10 ml-1">
                            <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Group: Download, Clear, System Tools */}
            <div className="flex items-center gap-3 flex-shrink-0">

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {hasJobs && onDownloadResults && (
                        <button onClick={onDownloadResults} className="flex items-center gap-2 px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/20 transition-all text-sm font-medium" title="Download Results">
                            <Icons.Download className="w-4 h-4" />
                            Download
                        </button>
                    )}

                    {hasJobs && (
                        <button onClick={onClearAll} disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap" title="Clear Jobs">
                            <Icons.Trash className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="h-6 w-px bg-white/10" />

                {/* System Tools */}
                <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-white/5">
                    <button onClick={onOpenSettings} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors" title="Settings">
                        <Icons.Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};
