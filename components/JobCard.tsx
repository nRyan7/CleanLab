
import React, { useState, useEffect } from 'react';
import { Job, JobStatus } from '../types';
import { Icons } from './Icon';
import { getJobContent } from '../services/jobStore'; // Import the new service

interface JobCardProps {
  job: Job;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onRetry, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const [loadedOriginalText, setLoadedOriginalText] = useState<string | undefined>(undefined);
  const [loadedRewrittenText, setLoadedRewrittenText] = useState<string | undefined>(undefined);
  const [loadingContent, setLoadingContent] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false); // New state for temporary visual feedback

  // Effect to load content from IndexedDB when expanded
  useEffect(() => {
    if (expanded && !loadedOriginalText && !loadingContent) { // Check !loadedOriginalText, as job.originalText is cleared
      setLoadingContent(true);
      const loadContent = async () => {
        const original = await getJobContent(job.id, 'originalText');
        const rewritten = await getJobContent(job.id, 'rewrittenText');
        setLoadedOriginalText(original);
        setLoadedRewrittenText(rewritten);
        setLoadingContent(false);
      };
      loadContent();
    } else if (!expanded && (loadedOriginalText || loadedRewrittenText)) {
      // Clear loaded content when collapsing to free memory
      setLoadedOriginalText(undefined);
      setLoadedRewrittenText(undefined);
    }
  }, [expanded, job.id, loadedOriginalText, loadedRewrittenText, loadingContent]);

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30';
      case JobStatus.PROCESSING: return 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 ring-1 ring-indigo-500/20';
      case JobStatus.FAILED: return 'border-red-500/20 bg-red-500/5 hover:border-red-500/30';
      case JobStatus.VALIDATION_FAILED: return 'border-orange-500/20 bg-orange-500/5 hover:border-orange-500/30';
      default: return 'border-white/5 bg-zinc-800/40 hover:bg-zinc-800/60 hover:border-white/10';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return <Icons.Check className="w-4 h-4 text-emerald-400" />;
      case JobStatus.PROCESSING: return <Icons.Retry className="w-4 h-4 text-indigo-400 animate-spin" />;
      case JobStatus.FAILED: return <Icons.Error className="w-4 h-4 text-red-400" />;
      case JobStatus.VALIDATION_FAILED: return <Icons.Alert className="w-4 h-4 text-orange-400" />;
      default: return <Icons.FileText className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getProgress = () => {
    let originalLen = 0;
    let rewrittenLen = 0;

    if (job.status === JobStatus.PROCESSING) {
      // During processing, originalText and rewrittenText are temporarily in job state
      originalLen = job.originalText?.length || 1;
      rewrittenLen = job.rewrittenText?.length || 0;
    } else {
      // For all other states (PENDING, COMPLETED, FAILED, VALIDATION_FAILED)
      // we use the stored lengths, or if not present (legacy data), fall back to 0
      originalLen = job.originalTextLength || 1;
      rewrittenLen = job.rewrittenTextLength || 0;
    }

    if (rewrittenLen === 0) return 0;
    const ratio = (rewrittenLen / originalLen) * 100;
    return Math.min(ratio, 100);
  };

  // Determine which text to display for length and preview
  // For previews, we still need full text (either from state or loaded)
  const previewOriginalText = job.originalText || loadedOriginalText;
  const previewRewrittenText = job.rewrittenText || loadedRewrittenText;


  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${getStatusColor(job.status)}`}>
      {/* Changed p-5 to p-4 for more compact card height */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 opacity-80">
              {getStatusIcon(job.status)}
            </div>
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              {/* Adjusted alignment for filename and foldername */}
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate text-sm text-zinc-200" title={job.fileName}>
                  {job.fileName}
                </h3>
                {job.folderName && job.folderName !== "Uncategorized" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-zinc-400 rounded border border-white/5 flex-shrink-0">
                    {job.folderName}
                  </span>
                )}
              </div>

              {/* Changed text-sm to text-xs, and adjusted widths for better fit */}
              <div className="text-[10px] opacity-70 flex items-center gap-2 text-zinc-400 font-mono">
                {/* Use job.originalTextLength directly */}
                <span className="flex-shrink-0">原:{job.originalTextLength ?? '-'}</span>

                {/* Use job.rewrittenTextLength directly */}
                <span className="flex-shrink-0">
                  {job.rewrittenTextLength !== undefined && job.rewrittenTextLength > 0 ? `→ 改:${job.rewrittenTextLength}` : (
                    job.status === JobStatus.PROCESSING && job.rewrittenText?.length !== undefined && job.rewrittenText.length > 0 ? `→ 改:${job.rewrittenText.length}` : ''
                  )}
                </span>
                <span className={`flex-shrink-0 text-indigo-300`}>
                  {job.status === JobStatus.PROCESSING && job.rewrittenText?.length !== undefined && job.rewrittenText.length > 0 ? `(${getProgress().toFixed(0)}%)` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2.5 hover:bg-white/15 rounded-md transition-colors text-gray-300"
              title="查看详情"
            >
              {expanded ? <Icons.ChevronUp className="w-5 h-5" /> : <Icons.ChevronDown className="w-5 h-5" />}
            </button>

            {(job.status === JobStatus.FAILED || job.status === JobStatus.VALIDATION_FAILED) && (
              <button
                onClick={() => onRetry(job.id)}
                className="p-2.5 hover:bg-blue-600/20 rounded-md transition-colors text-blue-300"
                title="重试"
              >
                <Icons.Retry className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                console.log(`[DEBUG] Trash button clicked for ID: ${job.id}`); // Added for debugging
                setIsRemoving(true); // Start visual feedback
                setTimeout(() => setIsRemoving(false), 200); // Stop visual feedback after 200ms
                onRemove(job.id);
              }}
              // Removed 'relative' and direct z-index
              className={`p-2.5 rounded-md transition-colors text-red-400 cursor-pointer ${isRemoving ? 'bg-red-600/50' : 'hover:bg-red-600/20'}`}
              title="删除"
            >
              <Icons.Trash className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explicit Error Box (Always visible if failed) */}
        {job.status === JobStatus.FAILED && job.error && (
          <div className="mt-4 p-3 bg-red-900/40 border border-red-500/30 rounded-lg text-xs text-red-200 font-mono break-all">
            <span className="font-bold text-red-400">[错误]</span> {job.error}
          </div>
        )}

        {/* Validation Warning Box */}
        {job.status === JobStatus.VALIDATION_FAILED && job.validationErrors && (
          <div className="mt-4 p-3 bg-orange-900/40 border border-orange-500/30 rounded-lg text-xs text-orange-200">
            <span className="font-bold text-orange-400">[警告]</span> {job.validationErrors.join(", ")}
          </div>
        )}

        {/* Progress Bar for Processing */}
        {job.status === JobStatus.PROCESSING && (
          <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, getProgress())}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Expanded Details Panel */}
      {expanded && (
        <div className="border-t border-white/10 p-5 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">原文预览</span>
            <textarea
              readOnly
              className="w-full h-52 bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none focus:outline-none custom-scrollbar"
              value={loadingContent ? "(加载中...)" : (previewOriginalText || "(内容不可用)")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">改写预览</span>
            <textarea
              readOnly
              className="w-full h-52 bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none focus:outline-none custom-scrollbar"
              value={loadingContent ? "(加载中...)" : (previewRewrittenText || "(等待生成/内容不可用)")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
