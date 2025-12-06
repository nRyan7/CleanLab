import { useState, useCallback } from 'react';
import { LogEntry } from '../types';
import { MAX_LOG_ENTRIES } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useLogger = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        const newLog: LogEntry = {
            id: generateId(),
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            message,
            type
        };
        setLogs(prev => {
            const updatedLogs = [...prev, newLog];
            if (updatedLogs.length > MAX_LOG_ENTRIES) {
                return updatedLogs.slice(updatedLogs.length - MAX_LOG_ENTRIES);
            }
            return updatedLogs;
        });
    }, []);

    const clearLogs = useCallback(() => setLogs([]), []);

    return { logs, addLog, clearLogs };
};
