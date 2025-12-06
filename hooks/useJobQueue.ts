import { useState, useRef, useEffect, useCallback } from 'react';
import { Job, JobStatus, AISettings } from '../types';
import {
    putJobContent,
    getJobContent,
    deleteJobContent,
    clearJobStore
} from '../services/jobStore';
import { streamRewrite } from '../services/geminiService';
import { DEFAULT_ESTIMATED_JOB_TIME_MS, STORAGE_KEY } from '../constants';

const formatDuration = (ms: number): string => {
    // Simplified for brevity, logic identical to original
    if (ms <= 0) return "0 秒";
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 3600));
    const parts = [];
    if (hours > 0) parts.push(`${hours} 小时`);
    if (minutes > 0) parts.push(`${minutes} 分`);
    parts.push(`${seconds} 秒`);
    return parts.join(" ");
};

export const useJobQueue = (
    settings: AISettings,
    addLog: (msg: string, type: 'info' | 'error' | 'success' | 'warning') => void,
    refreshStorageEstimate: () => void
) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);

    // Stats
    const [estimatedTimePerJobMs, setEstimatedTimePerJobMs] = useState(DEFAULT_ESTIMATED_JOB_TIME_MS);
    const [queueProgress, setQueueProgress] = useState(0);
    const [statusSummary, setStatusSummary] = useState({ available: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
    const [elapsedProcessingTimeMs, setElapsedProcessingTimeMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    const jobsRef = useRef<Job[]>([]);
    jobsRef.current = jobs;
    const processingRef = useRef(false);
    const activeWorkerPromisesRef = useRef<Set<Promise<void>>>(new Set());

    // Load Jobs from LocalStorage
    useEffect(() => {
        try {
            const jobsString = localStorage.getItem(STORAGE_KEY);
            if (jobsString) {
                const loadedJobs = JSON.parse(jobsString);
                // Reset processing to pending
                const fixedJobs = loadedJobs.map((j: Job) => ({
                    ...j,
                    status: j.status === JobStatus.PROCESSING ? JobStatus.PENDING : j.status,
                    originalText: undefined, // ensure clean
                    rewrittenText: undefined
                }));
                setJobs(fixedJobs);
            }
        } catch (e) {
            console.error("Failed to load jobs", e);
            addLog("无法恢复之前的任务列表", 'error');
        }
    }, [addLog]);

    // Save Jobs to LocalStorage
    useEffect(() => {
        if (jobs.length > 0) {
            const lightweightJobs = jobs.map(job => ({
                ...job,
                originalText: undefined,
                rewrittenText: undefined
            }));
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightJobs));
            } catch (e) {
                // Silent fail or minimal log to avoid spamming
            }
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }

        // Update stats
        const counts = { available: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
        jobs.forEach(j => {
            if (j.status === JobStatus.PENDING) counts.pending++;
            if (j.status === JobStatus.PROCESSING) counts.processing++;
            if (j.status === JobStatus.COMPLETED) counts.completed++;
            if (j.status === JobStatus.FAILED || j.status === JobStatus.VALIDATION_FAILED) counts.failed++;
        });
        counts.available = counts.pending; // "Available" usually means actionable
        setStatusSummary(counts);

    }, [jobs]);

    // Progress & Estimation Logic
    useEffect(() => {
        const completedOrFailed = jobs.filter(j =>
            (j.status === JobStatus.COMPLETED || j.status === JobStatus.FAILED) && j.completedAt && j.startedAt
        );
        let totalTime = 0;
        completedOrFailed.forEach(j => totalTime += ((j.completedAt || 0) - (j.startedAt || 0)));

        if (completedOrFailed.length > 0) {
            setEstimatedTimePerJobMs(totalTime / completedOrFailed.length);
        }

        const total = jobs.length;
        const processed = completedOrFailed.length;
        setQueueProgress(total > 0 ? (processed / total) * 100 : 0);

    }, [jobs]);


    // Queue Processor
    useEffect(() => {
        if (!isProcessing) {
            processingRef.current = false;
            return;
        }

        if (processingRef.current) return; // Already running
        processingRef.current = true;
        setStopRequested(false);
        // Queue start time removed as it was unused logic

        addLog("任务队列已启动", 'info');

        const processQueue = async () => {
            while (processingRef.current) {
                if (stopRequested) {
                    setIsProcessing(false);
                    break;
                }

                const currentJobs = jobsRef.current;
                const pendingJobs = currentJobs.filter(j => j.status === JobStatus.PENDING);
                const activeCount = activeWorkerPromisesRef.current.size;

                if (pendingJobs.length === 0 && activeCount === 0) {
                    setIsProcessing(false);
                    addLog("所有任务处理完成", 'success');
                    break;
                }

                if (pendingJobs.length > 0 && activeCount < settings.maxConcurrentJobs) {
                    const jobToStart = pendingJobs[0];
                    startJobWorker(jobToStart);
                    // Minimal delay to prevent race conditions or UI freeze
                    await new Promise(r => setTimeout(r, 50));
                } else {
                    // Wait a bit if full or no pending jobs
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            processingRef.current = false;
        };

        processQueue();

    }, [isProcessing, stopRequested, settings.maxConcurrentJobs, addLog]); // settings is dependency

    // Elapsed Time Timer
    useEffect(() => {
        let interval: any;
        if (isProcessing) {
            if (!startTimeRef.current) startTimeRef.current = Date.now();
            interval = setInterval(() => {
                setElapsedProcessingTimeMs(Date.now() - (startTimeRef.current || Date.now()));
            }, 1000);
        } else {
            startTimeRef.current = null;
            setElapsedProcessingTimeMs(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isProcessing]);

    const startJobWorker = (job: Job) => {
        // Update status to processing
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: JobStatus.PROCESSING, startedAt: Date.now() } : j));

        const workerLogic = async () => {
            try {
                // Fetch content
                const originalText = await getJobContent(job.id, 'originalText');
                if (!originalText) throw new Error("Could not read source text from DB");

                let streamedText = "";
                await streamRewrite(
                    originalText,
                    settings,
                    (updatedText) => {
                        streamedText = updatedText; // Service returns full text

                        // Update UI with partial result
                        setJobs(prev => prev.map(j => j.id === job.id ? {
                            ...j,
                            rewrittenText: streamedText,
                            progress: Math.min(99, Math.round((streamedText.length / originalText.length) * 80))
                        } : j));
                    }
                );

                // Save result
                await putJobContent(job.id, 'rewrittenText', streamedText);

                setJobs(prev => prev.map(j => j.id === job.id ? {
                    ...j,
                    status: JobStatus.COMPLETED,
                    completedAt: Date.now(),
                    progress: 100
                } : j));

            } catch (e: any) {
                console.error(`Job ${job.id} failed:`, e);
                setJobs(prev => prev.map(j => j.id === job.id ? {
                    ...j,
                    status: JobStatus.FAILED,
                    errorMessage: e.message
                } : j));
            } finally {
                // Remove self from active set
                // We need to find the promise in the set that corresponds to this execution
                // Since we can't easily reference the promise itself inside its own execution without a wrapper,
                // we'll rely on the fact that we can store the promise *after* creation if we manage the set differently.
                // OR: just rely on the fact that we add it below. 
                // Fix: Clean up is tricky with closure. 
                // Alternative: Wrapper function that returns the promise, and we delete it using a refined approach or just ignoring the strict verification.
                // Simplest consistent fix: 
                refreshStorageEstimate();
            }
        };

        const workerPromise = workerLogic();

        // Add to set
        activeWorkerPromisesRef.current.add(workerPromise);

        // Remove from set when done (using .then to access the promise instance safely)
        workerPromise.finally(() => {
            activeWorkerPromisesRef.current.delete(workerPromise);
        });
    };

    const addJobs = useCallback((newJobs: Job[]) => {
        setJobs(prev => [...prev, ...newJobs]);
    }, []);

    const clearJobs = useCallback(async () => {
        setJobs([]);
        try {
            await clearJobStore(); // Clears IndexedDB content
            localStorage.removeItem(STORAGE_KEY);
            addLog("任务列表已清空", 'info');
            refreshStorageEstimate();
        } catch (e) {
            addLog("清空任务失败", 'error');
        }
    }, [addLog, refreshStorageEstimate]);

    const retryFailedJobs = useCallback(() => {
        setJobs(prev => prev.map(j => (j.status === JobStatus.FAILED || j.status === JobStatus.VALIDATION_FAILED) ? { ...j, status: JobStatus.PENDING, errorMessage: undefined } : j));
        setIsProcessing(true);
    }, []);

    // Toggle start/stop
    const toggleProcessing = useCallback(() => {
        if (isProcessing) {
            setStopRequested(true);
            addLog("正在停止队列...", 'info');
        } else {
            setIsProcessing(true);
        }
    }, [isProcessing, addLog]);

    return {
        jobs,
        setJobs, // Exposed for manual edits/deletes if needed
        addJobs,
        clearJobs,
        retryFailedJobs,
        isProcessing,
        toggleProcessing,
        stopRequested,
        queueProgress,
        statusSummary,
        estimatedTimePerJobMs,
        elapsedProcessingTimeMs,
        formatDuration
    };
};
