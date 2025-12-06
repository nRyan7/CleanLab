export const DEFAULT_PROMPT = `
请重写以下文章，使其更具吸引力，保持原意但优化文笔：

{TEXT}
`;

export const MODEL_NAME = "gemini-2.5-flash";

export const DEFAULT_MAX_CONCURRENT_JOBS = 1; // New: Default max concurrent jobs
export const DEFAULT_ESTIMATED_JOB_TIME_MS = 15000; // 15 seconds, default for initial estimation
export const MAX_LOG_ENTRIES = 500; // New: Max number of log entries to keep in memory
export const CUSTOM_PROMPT_KEY = 'novel_rewriter_custom_prompt_v1'; // New: Key for custom prompt
export const CRASH_LOG_STORE_NAME = 'crashLogs'; // New: Store name for crash logs
export const STORAGE_KEY = 'novel_rewriter_jobs_v1';
export const STORAGE_QUOTA_MB = 500; // New: Storage quota in MB