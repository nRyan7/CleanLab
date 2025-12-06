import React from 'react';
import { Icons } from './Icon';
import { CrashLog } from '../types';

interface SystemLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: CrashLog[];
    isRefreshing: boolean;
    onRefresh: () => void;
    onClear: () => void;
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({
    isOpen,
    onClose,
    logs,
    isRefreshing,
    onRefresh,
    onClear
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-red-500" />
                        系统崩溃日志
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                            <Icons.Refresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Icons.X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {logs.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <Icons.Check className="w-12 h-12 mb-2 text-green-500" />
                            <p>没有检测到崩溃日志</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 uppercase">{log.type}</span>
                                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="font-semibold text-gray-900 mb-2">{log.message}</p>
                                    {log.stack && (
                                        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto font-mono">
                                            {log.stack}
                                        </pre>
                                    )}
                                    {log.source && (
                                        <div className="mt-2 text-xs text-gray-500 flex gap-4">
                                            <span>Source: {log.source}</span>
                                            <span>Line: {log.lineno}:{log.colno}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                    <span className="text-xs text-gray-500">仅显示最近记录。严重错误会自动保存到本地 IndexedDB。</span>
                    {logs.length > 0 && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                        >
                            <Icons.Trash className="w-4 h-4" />
                            清空所有日志
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
