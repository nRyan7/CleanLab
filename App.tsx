import React, { useState } from 'react';
import { STORAGE_QUOTA_MB } from './constants';
import { useSettings } from './hooks/useSettings';
import { useLogger } from './hooks/useLogger';
import { useSystemHealth } from './hooks/useSystemHealth';
import { useJobQueue } from './hooks/useJobQueue';
import { useFileHandler } from './hooks/useFileHandler';
import { JobStatus } from './types';
import { getJobContent } from './services/jobStore';

import { Header } from './components/Dashboard/Header';
import { JobQueue } from './components/Dashboard/JobQueue';
import LiveMonitor from './components/LiveMonitor';

import { SettingsModal } from './components/SettingsModal';
import { SystemLogsModal } from './components/SystemLogsModal';
import ConfirmationModal from './components/ConfirmationModal';
import PromptModal from './components/PromptModal';
import CorpusSplitterModal from './components/CorpusSplitterModal';
import DatasetCleanerModal from './components/DatasetCleanerModal';



const App: React.FC = () => {
  // --- Hooks ---
  const { logs, addLog } = useLogger();
  const {
    settings, updateSettings, showSettings, setShowSettings,
    isTestingConnection, testResultMessage, availableModels, runConnectionTest, setPreset
  } = useSettings(addLog);

  const {
    indexedDBUsage,
    crashLogsDisplayed, isRefreshingCrashLogs, refreshCrashLogs, handleClearCrashLogs,
    corruptionHintMessage, setCorruptionHintMessage
  } = useSystemHealth(addLog);

  const {
    jobs, addJobs, setJobs, clearJobs,
    isProcessing, toggleProcessing, stopRequested,
    queueProgress, statusSummary, formatDuration,
    estimatedTimePerJobMs, elapsedProcessingTimeMs
  } = useJobQueue(settings, addLog, () => { });

  const { isUploading, uploadProgress, processFiles } = useFileHandler(addJobs, addLog, () => { }, jobs);

  // --- UI State ---
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showSplitterModal, setShowSplitterModal] = useState(false);
  const [showCleanerModal, setShowCleanerModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false); // For custom prompt
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [jobFilter, setJobFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  // --- Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDownloadResults = async () => {
    // Filter for completed jobs (ignoring whether rewrittenText is in memory)
    const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED);

    if (completedJobs.length === 0) {
      alert("No completed jobs available for download.");
      return;
    }

    const jsonlLines: string[] = [];

    // Use for...of loop to handle async await correctly
    for (const job of completedJobs) {
      let content = job.rewrittenText;

      // If content is missing in memory (e.g. after refresh), fetch from DB
      if (!content) {
        try {
          content = await getJobContent(job.id, 'rewrittenText');
        } catch (e) {
          console.error(`Failed to load content for job ${job.id}`, e);
        }
      }

      if (content) {
        // Format as JSONL line: { "text": "content" }
        // Ensure content is properly escaped by JSON.stringify
        jsonlLines.push(JSON.stringify({ text: content }));
      }
    }

    if (jsonlLines.length === 0) {
      alert("There are completed jobs, but their content could not be retrieved (possibly lost or corrupted).");
      return;
    }

    // Create a Blob from the JSONL lines joined by newlines
    const blob = new Blob([jsonlLines.join('\n')], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Filename: corpus_refined_[timestamp].jsonl
    link.download = `corpus_refined_${new Date().getTime()}.jsonl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`Downloaded results for ${jsonlLines.length} files as JSONL`, 'success');
  };

  const activeJob = jobs.find(j => j.status === JobStatus.PROCESSING);

  // Calculate stats for Sidebar Header
  // const pendingCount = jobs.filter(j => j.status === JobStatus.PENDING).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col overflow-hidden h-screen selection:bg-indigo-500/30 selection:text-indigo-200">

      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenSplitter={() => setShowSplitterModal(true)}
        onOpenCleaner={() => setShowCleanerModal(true)}
        onOpenPrompt={() => setShowPromptModal(true)}

        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isProcessing={isProcessing}
        stopRequested={stopRequested}
        hasJobs={jobs.length > 0}
        onFileUpload={handleFileUpload}
        onFolderUpload={handleFolderUpload}
        onToggleProcessing={toggleProcessing}
        onClearAll={() => setShowClearConfirm(true)}
        onDownloadResults={handleDownloadResults}
        currentModelName={settings.provider === 'local' ? settings.localModelName : settings.geminiModelName}
      />

      {/* Warning Banners (Absolute or inside main) */}
      {corruptionHintMessage && (
        <div className="bg-red-50 border-b border-red-500 p-2 flex items-center justify-between text-xs text-red-700">
          <span>{corruptionHintMessage}</span>
          <button onClick={() => setCorruptionHintMessage(null)} className="underline">Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Job Queue */}
        <div className="w-80 flex flex-col z-0 relative bg-zinc-950/50 border-r border-white/5">
          <JobQueue
            jobs={jobs}
            filter={jobFilter}
            onFilterChange={setJobFilter}
            onRetryJob={(id) => {
              setJobs(prev => prev.map(j => j.id === id ? { ...j, status: JobStatus.PENDING, errorMessage: undefined } : j));
            }}
            onDeleteJob={(id) => {
              setJobs(prev => prev.filter(j => j.id !== id));
            }}
          />

          {/* Storage Stat in Sidebar Footer (Moved inside JobQueue or kept here if JobQueue adjusts) */}
          <div className="p-2 border-t border-white/5 text-[10px] text-center text-zinc-600 bg-zinc-900/50 font-mono">
            Storage: {indexedDBUsage ? (indexedDBUsage / 1024 / 1024).toFixed(1) : '0.0'} / {STORAGE_QUOTA_MB} MB
          </div>
        </div>

        {/* Main Content: Live Monitor */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            {/* Live Monitor takes full space */}
            <LiveMonitor
              activeJob={activeJob}
              logs={logs}
              queueProgress={queueProgress}
              estimatedRemainingTimeString={formatDuration(estimatedTimePerJobMs * statusSummary.pending)}
              totalJobsCount={jobs.length}
              isGlobalProcessing={isProcessing}
              currentModelName={settings.provider === 'local' ? settings.localModelName : settings.geminiModelName}
              elapsedProcessingTimeString={formatDuration(elapsedProcessingTimeMs || 0)}
            />
          </div>
        </div>

      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        isTestingConnection={isTestingConnection}
        testResultMessage={testResultMessage}
        availableModels={availableModels}
        onRunConnectionTest={runConnectionTest}
        onSetPreset={setPreset}
        onOpenSystemLogs={() => { setShowSettings(false); setShowSystemLogs(true); refreshCrashLogs(); }}
      />

      <SystemLogsModal
        isOpen={showSystemLogs}
        onClose={() => setShowSystemLogs(false)}
        logs={crashLogsDisplayed}
        isRefreshing={isRefreshingCrashLogs}
        onRefresh={refreshCrashLogs}
        onClear={handleClearCrashLogs}
      />

      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear All Jobs"
        message="Are you sure you want to clear all jobs? This will delete all imported files and results, and cannot be undone."
        onConfirm={() => {
          clearJobs();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <PromptModal
        isOpen={showPromptModal}
        onCancel={() => setShowPromptModal(false)}
        currentPrompt={settings.systemPrompt}
        onSave={(newPrompt) => updateSettings({ systemPrompt: newPrompt })}
        onReset={() => updateSettings({ systemPrompt: settings.systemPrompt })}
      />

      {showSplitterModal && (
        <CorpusSplitterModal
          isOpen={showSplitterModal}
          onClose={() => setShowSplitterModal(false)}
        />
      )}

      {showCleanerModal && (
        <DatasetCleanerModal
          isOpen={showCleanerModal}
          onClose={() => setShowCleanerModal(false)}
        />
      )}

    </div>
  );
};

export default App;
