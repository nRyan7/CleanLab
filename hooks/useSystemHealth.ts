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
            let hint = `警告: 获取存储状态失败: ${e.message || '未知错误'}。本地数据存储可能已损坏。`;
            if (e.name === 'QuotaExceededError') {
                hint = `警告: 获取存储状态失败，存储已满。`;
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
            addLog(`已加载 ${logs.length} 条崩溃日志`, 'info');
        } catch (error) {
            addLog(`加载崩溃日志失败: ${(error as any).message}`, 'error');
        } finally {
            setIsRefreshingCrashLogs(false);
        }
    }, [addLog]);

    const handleClearCrashLogs = async () => {
        try {
            await clearCrashLogsService();
            setCrashLogsDisplayed([]);
            addLog("所有崩溃日志已清空。", 'success');
            refreshStorageEstimate();
        } catch (error) {
            addLog(`清空崩溃日志失败: ${(error as any).message}`, 'error');
        }
    };

    // Global Error Handlers & Initialization
    useEffect(() => {
        // Initialize DB
        openJobStore().then(() => {
            addLog("系统初始化完成", 'info');
            refreshStorageEstimate();

            // Check crash marker
            const lastCrashMarker = localStorage.getItem(CRASH_MARKER_KEY);
            if (lastCrashMarker) {
                try {
                    const crashInfo = JSON.parse(lastCrashMarker);
                    const msg = `上次应用崩溃，时间：${new Date(crashInfo.timestamp).toLocaleString()}，消息：${crashInfo.message || '未知'}`;
                    addLog(msg, 'error');
                    setCorruptionHintMessage("警告: 上次应用崩溃。这可能导致本地数据损坏。");
                    localStorage.removeItem(CRASH_MARKER_KEY);
                } catch (e) {
                    console.error("Failed to parse crash marker");
                }
            }
        }).catch(e => {
            addLog(`IndexedDB 初始化失败: ${e.message}`, 'error');
            setCorruptionHintMessage(`警告: 数据存储初始化失败 (${e.message})`);
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
                addLog('捕获到未处理的错误并已记录。', 'error');
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
                addLog('捕获到未处理的 Promise 拒绝并已记录。', 'error');
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
