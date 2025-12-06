

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VALIDATION_FAILED = 'validation_failed',
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
}

export interface Job {
  id: string;
  fileName: string;
  folderName?: string; // Added for folder grouping
  originalText?: string; // This will now be undefined in state after creation/completion
  rewrittenText?: string; // This will now be undefined in state after creation/completion
  originalTextLength?: number; // New: Length of original text
  rewrittenTextLength?: number; // New: Length of rewritten text
  status: JobStatus;
  error?: string;
  validationErrors?: string[];
  startedAt?: number; // New: Timestamp when job started processing
  completedAt?: number; // New: Timestamp when job completed/failed
}

export interface ValidationConfig {
  minRatio: number;
  requireFirstPerson: boolean;
}

export type AIProvider = 'gemini' | 'local';

export interface AISettings {
  provider: AIProvider;
  localBaseUrl: string;
  localModelName: string;
  geminiModelName: string;
  systemPrompt: string;
  maxConcurrentJobs: number; // New: Maximum number of jobs to process concurrently
  validation: ValidationConfig; // Added: Validation configuration is now part of AISettings
  apiKey?: string; // Added: API Key for cloud providers (Gemini)
}

export type ExportFormat = 'jsonl';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface CrashLog {
  id: string;
  timestamp: string; // ISO string
  type: 'unhandledError' | 'unhandledRejection';
  message: string;
  stack?: string;
  source?: string; // For unhandledError
  lineno?: number; // For unhandledError
  colno?: number; // For unhandledError
}