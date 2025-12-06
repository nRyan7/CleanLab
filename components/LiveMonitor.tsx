
import React, { useEffect, useRef } from 'react';
import { Icons } from './Icon';
import { Job, LogEntry } from '../types';

interface LiveMonitorProps {
  activeJob: Job | undefined;
  logs: LogEntry[];
  queueProgress: number; // New prop for global queue progress
  estimatedRemainingTimeString: string; // New prop for estimated time
  totalJobsCount: number; // New prop for total jobs
  isGlobalProcessing: boolean; // New prop to indicate if global queue is active
  currentModelName: string; // New: Current model name
  elapsedProcessingTimeString: string; // New: Formatted elapsed time
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({
  activeJob,
  logs,
  queueProgress, // Destructure new props
  estimatedRemainingTimeString,
  totalJobsCount,
  isGlobalProcessing,
  currentModelName, // New prop
  elapsedProcessingTimeString, // New prop
}) => {
  const textScrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const rewrittenTextContentRef = useRef<HTMLDivElement>(null); // New ref for direct text content updates

  // Auto-scroll text output
  useEffect(() => {
    if (textScrollRef.current) {
      textScrollRef.current.scrollTop = textScrollRef.current.scrollHeight;
    }
  }, [activeJob?.rewrittenText]);

  // Update rewritten text content directly to avoid full component re-renders on every chunk
  useEffect(() => {
    if (rewrittenTextContentRef.current && activeJob?.rewrittenText !== undefined) {
      rewrittenTextContentRef.current.textContent = activeJob.rewrittenText;
    }
  }, [activeJob?.rewrittenText]); // Triggers when activeJob.rewrittenText changes

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/40 overflow-hidden">
      {/* Top Section: Active Job Output (Main View) */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-white/5 relative">
        {/* Changed to flex-row and justify-between for horizontal alignment */}
        <div className="px-6 py-3 bg-white/5 backdrop-blur-sm border-b border-white/5 flex items-center justify-between gap-4 shadow-sm z-10">
          {/* Left side: Title and optional active job badge */}
          <div className="flex items-center gap-4 flex-grow-0"> {/* Use flex-grow-0 to prevent it from taking too much space */}
            <div className="flex items-center gap-3">
              <Icons.Preview className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-zinc-200 tracking-wide text-lg whitespace-nowrap">Output</span> {/* Prevent wrapping */}
              {isGlobalProcessing && ( // Only show if processing
                <span className="text-xs font-medium text-zinc-500 ml-4 whitespace-nowrap">
                  Model: <span className="text-indigo-400 font-mono">{currentModelName}</span>
                </span>
              )}
            </div>
            {activeJob && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Processing</span>
              </div>
            )}
          </div>

          {/* Right side: Global Progress Section */}
          {(totalJobsCount > 0 && isGlobalProcessing) && (
            <div className="flex flex-col items-end flex-grow min-w-[200px] sm:min-w-[250px]"> {/* Changed to flex-col items-end, and added min-width */}
              {/* Progress Text Above */}
              <div className="flex items-center justify-end text-[10px] font-medium text-zinc-500 gap-4 mb-1"> {/* Align text to right */}
                {isGlobalProcessing && ( // Only show if global processing is active
                  <span>
                    Duration: <span className="text-zinc-300 font-mono">{elapsedProcessingTimeString}</span>
                  </span>
                )}
                <span>Total: <span className="text-indigo-400 font-mono">{queueProgress.toFixed(0)}%</span></span>
                {totalJobsCount > 0 && isGlobalProcessing && (
                  <span>
                    Est. Remaining: <span className="text-zinc-300 font-mono">{estimatedRemainingTimeString}</span> {/* Prevent wrapping */}
                  </span>
                )}
              </div>
              {/* Progress Bar Itself */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"> {/* Added mt-1 for spacing */}
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${queueProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div
          ref={textScrollRef}
          className="flex-1 p-8 overflow-y-auto font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-transparent custom-scrollbar selection:bg-indigo-500/30"
        >
          {activeJob ? (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 pb-2 border-b border-white/5 flex items-center gap-3">
                <Icons.FileText className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-500 text-sm">{activeJob.fileName}</span>
              </div>
              <div className="prose prose-invert prose-zinc max-w-none">
                {/* Render a placeholder or initial empty state */}
                {!activeJob.rewrittenText && <span className="text-zinc-600 italic animate-pulse">Waiting for model response...</span>}
                {/* This div will be updated directly by the ref */}
                <div ref={rewrittenTextContentRef} />
                <span className="inline-block w-2 h-5 bg-indigo-500 align-middle ml-1 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
              <div className="p-6 rounded-full bg-white/5 border border-white/5">
                <Icons.Terminal className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-zinc-500">Waiting for Jobs</p>
                <p className="text-sm text-zinc-700">Add files or folders to start processing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: System Logs */}
      <div className="h-64 flex flex-col bg-black/30 border-t border-gray-800 flex-shrink-0">
        <div className="px-4 py-3 bg-gray-800/70 backdrop-blur-sm border-b border-gray-700/50 flex items-center gap-2">
          <Icons.Terminal className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Logs</span>
        </div>
        <div
          ref={logScrollRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar"
        >
          {logs.length === 0 && <div className="text-gray-600 italic px-3">System logs ready...</div>}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 px-3 py-1 hover:bg-white/5 rounded group">
              <span className="text-gray-600 select-none flex-shrink-0 w-24 text-right opacity-60 group-hover:opacity-100 transition-opacity">
                {log.timestamp}
              </span>
              <span className={`flex-1 ${getLogColor(log.type)} break-all`}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
