import React from 'react';
import JobCard from '../JobCard';
import { Job, JobStatus } from '../../types';
import { Icons } from '../Icon';

interface JobQueueProps {
    jobs: Job[];
    filter: 'all' | 'pending' | 'completed' | 'failed';
    onFilterChange: (filter: 'all' | 'pending' | 'completed' | 'failed') => void;
    onRetryJob: (id: string) => void;
    onDeleteJob: (id: string) => void;
}

export const JobQueue: React.FC<JobQueueProps> = ({
    jobs,
    filter,
    onFilterChange,
    onRetryJob,
    onDeleteJob
}) => {

    const filteredJobs = jobs.filter(job => {
        if (filter === 'all') return true;
        if (filter === 'pending') return job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING;
        if (filter === 'completed') return job.status === JobStatus.COMPLETED;
        if (filter === 'failed') return job.status === JobStatus.FAILED || job.status === JobStatus.VALIDATION_FAILED;
        return true;
    });

    return (
        <div className="bg-transparent flex flex-col h-full w-full">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <h3 className="font-semibold text-zinc-300 text-sm flex items-center gap-2">
                    <Icons.List className="w-4 h-4 text-zinc-500" />
                    任务列表
                    <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-indigo-500/20 leading-none">
                        {filteredJobs.length}
                    </span>
                </h3>

                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                    {(['all', 'pending', 'completed', 'failed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${filter === f
                                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}
                        >
                            {{
                                all: '全部',
                                pending: '待办',
                                completed: '完成',
                                failed: '失败'
                            }[f]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar bg-black/10">
                {filteredJobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <Icons.List className="w-10 h-10 opacity-20" />
                        <p className="text-xs font-medium">暂无任务</p>
                    </div>
                ) : (
                    filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onRetry={() => onRetryJob(job.id)}
                            onRemove={() => onDeleteJob(job.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
