import { useState, useEffect, useCallback } from 'react';
import { CrashLog } from '../types';
import {
    getStorageEstimate,
    openJobStore,
    putCrashLog,
    getCrashLogs,
    clearCrashLogs as clearCrashLogsService
} from '../services/jobStore';

const CRASH_MARKER_KEY = '__cleanlab_last_crash_marker__';
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useSystemHealth = (addLog: (msg: string, type: any) => void) => {
    // Storage States
    const [storageQuota, setStorageQuota] = useState<number | null>(null);
    const [storageUsage, setStorageUsage] = useState<number | null>(null);
    const [indexedDBUsage, setIndexedDBUsage] = useState<number>(0);
    const [isEstimatingStorage, setIsEstimatingStorage] = useState(false);

    // Crash Log States
    const [crashLogsDisplayed, setCrashLogsDisplayed] = useState<CrashLog[]>([]);
    const [isRefreshingCrashLogs, setIsRefreshingCrashLogs] = useState(false);
    const [corruptionHintMessage, setCorruptionHintMessage] = useState<string | null>(null);

    const refreshStorageEstimate = useCallback(async () => {
        setIsEstimatingStorage(true);
        try {
            const { totalBytes, usedBytes, indexedDBBytes } = await getStorageEstimate();
            setStorageQuota(totalBytes);
            setStorageUsage(usedBytes);
            setIndexedDBUsage(indexedDBBytes);
            // setCorruptionHintMessage(null); // Optional: clear hint on success?
        } catch (error) {
            const e = error as DOMException;
            let hint = `Warning: Failed to get storage status: ${e.message || 'Unknown Error'}. Local storage might be corrupted.`;
            if (e.name === 'QuotaExceededError') {
                hint = `Warning: Failed to get storage status, storage full.`;
            }
            addLog(hint, 'error');
            setCorruptionHintMessage(hint);
        } finally {
            setIsEstimatingStorage(false);
        }
    }, [addLog]);

    const refreshCrashLogs = useCallback(async () => {
        setIsRefreshingCrashLogs(true);
        try {
            const logs = await getCrashLogs();
            setCrashLogsDisplayed(logs);
            addLog(`Loaded ${logs.length} crash logs`, 'info');
        } catch (error) {
            addLog(`Failed to load crash logs: ${(error as any).message}`, 'error');
        } finally {
            setIsRefreshingCrashLogs(false);
        }
    }, [addLog]);

    const handleClearCrashLogs = async () => {
        try {
            await clearCrashLogsService();
            setCrashLogsDisplayed([]);
            addLog("All crash logs cleared.", 'success');
            refreshStorageEstimate();
        } catch (error) {
            addLog(`Failed to clear crash logs: ${(error as any).message}`, 'error');
        }
    };

    // Global Error Handlers & Initialization
    useEffect(() => {
        // Initialize DB
        openJobStore().then(() => {
            addLog("System initialized", 'info');
            refreshStorageEstimate();

            // Check crash marker
            const lastCrashMarker = localStorage.getItem(CRASH_MARKER_KEY);
            if (lastCrashMarker) {
                try {
                    const crashInfo = JSON.parse(lastCrashMarker);
                    const msg = `App crashed last time at: ${new Date(crashInfo.timestamp).toLocaleString()}. Message: ${crashInfo.message || 'Unknown'}`;
                    addLog(msg, 'error');
                    setCorruptionHintMessage("Warning: App crashed last time. Local data might be corrupted.");
                    localStorage.removeItem(CRASH_MARKER_KEY);
                } catch (e) {
                    console.error("Failed to parse crash marker");
                }
            }
        }).catch(e => {
            addLog(`IndexedDB Initialization failed: ${e.message}`, 'error');
            setCorruptionHintMessage(`Warning: Storage init failed (${e.message})`);
        });

        // Error Listeners
        const handleUncaughtError = (event: ErrorEvent) => {
            console.error('[CRASH HANDLER] Uncaught:', event);
            const crashLog: CrashLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'unhandledError',
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
            };

            putCrashLog(crashLog).then(() => {
                addLog('Captured unhandled error and logged.', 'error');
            }).catch(() => {
                // Fallback to localStorage
                try {
                    localStorage.setItem(CRASH_MARKER_KEY, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        message: event.message
                    }));
                } catch (e) { console.error("Fallback crash save failed", e); }
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('[CRASH HANDLER] Unhandled Rejection:', event.reason);
            const reason = event.reason;
            const crashLog: CrashLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'unhandledRejection',
                message: reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined,
            };
            putCrashLog(crashLog).then(() => {
                addLog('Captured unhandled Promise rejection and logged.', 'error');
            }).catch(() => {
                try {
                    localStorage.setItem(CRASH_MARKER_KEY, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        message: String(reason)
                    }));
                } catch (e) { console.error("Fallback crash save failed", e); }
            });
        };

        window.addEventListener('error', handleUncaughtError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleUncaughtError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [addLog, refreshStorageEstimate]);

    return {
        storageQuota,
        storageUsage,
        indexedDBUsage,
        isEstimatingStorage,
        refreshStorageEstimate,
        crashLogsDisplayed,
        isRefreshingCrashLogs,
        refreshCrashLogs,
        handleClearCrashLogs,
        corruptionHintMessage,
        setCorruptionHintMessage
    };
};
