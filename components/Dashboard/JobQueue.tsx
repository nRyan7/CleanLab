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
            <div className="px-4 py-4 border-b border-white/5 flex flex-col gap-3 bg-white/5 backdrop-blur-md">
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Icons.List className="w-4 h-4 text-zinc-500" />
                        Job List
                    </div>
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md text-xs font-mono border border-white/5">
                        {filteredJobs.length}
                    </span>
                </h3>

                <div className="grid grid-cols-4 gap-2 bg-black/20 p-1 rounded-lg border border-white/5 w-full">
                    {(['all', 'pending', 'completed', 'failed'] as const).map((f) => {
                        const isActive = filter === f;
                        let activeClass = '';
                        let inactiveClass = 'text-zinc-500 hover:bg-white/5';

                        switch (f) {
                            case 'all':
                                activeClass = 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20';
                                break;
                            case 'pending':
                                activeClass = 'bg-amber-500/20 text-amber-500 border border-amber-500/20';
                                inactiveClass = 'text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10';
                                break;
                            case 'completed':
                                activeClass = 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20';
                                inactiveClass = 'text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10';
                                break;
                            case 'failed':
                                activeClass = 'bg-red-500/20 text-red-500 border border-red-500/20';
                                inactiveClass = 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10';
                                break;
                        }

                        return (
                            <button
                                key={f}
                                onClick={() => onFilterChange(f)}
                                className={`px-2 py-1.5 text-[10px] font-medium rounded-md transition-all flex justify-center items-center ${isActive ? activeClass : inactiveClass
                                    }`}
                            >
                                {{
                                    all: 'All',
                                    pending: 'Pending',
                                    completed: 'Done',
                                    failed: 'Failed'
                                }[f]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar bg-black/10">
                {filteredJobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <Icons.List className="w-10 h-10 opacity-20" />
                        <p className="text-xs font-medium">No Jobs</p>
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
