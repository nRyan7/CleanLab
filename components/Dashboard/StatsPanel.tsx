import React from 'react';
import { Icons } from '../Icon';

interface StatsPanelProps {
    storageUsage: number | null;
    storageQuota: number | null;
    statusSummary: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    formatBytes: (bytes: number | null) => string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
    storageUsage,
    storageQuota,
    statusSummary,
    formatBytes
}) => {

    const usagePercent = (storageUsage && storageQuota)
        ? Math.min(100, (storageUsage / storageQuota) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">存储使用</p>
                    <p className="text-2xl font-bold text-gray-900">{formatBytes(storageUsage)}</p>
                    <div className="w-full bg-gray-100 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePercent}%` }}></div>
                    </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                    <Icons.Database className="w-5 h-5 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">待处理</p>
                    <p className="text-2xl font-bold text-gray-900">{statusSummary.pending}</p>
                </div>
                <div className="bg-orange-50 p-2 rounded-lg">
                    <Icons.Clock className="w-5 h-5 text-orange-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">处理中</p>
                    <p className="text-2xl font-bold text-indigo-600">{statusSummary.processing}</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg">
                    <Icons.Zap className="w-5 h-5 text-indigo-600" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">已完成</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-green-600">{statusSummary.completed}</p>
                        {statusSummary.failed > 0 && (
                            <span className="text-sm text-red-500 font-medium">{statusSummary.failed} 失败</span>
                        )}
                    </div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                    <Icons.Check className="w-5 h-5 text-green-600" />
                </div>
            </div>
        </div>
    );
};
