import { useState, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import { putJobContent } from '../services/jobStore';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useFileHandler = (
    addJobs: (jobs: Job[]) => void,
    addLog: (msg: string, type: 'info' | 'error' | 'success' | 'warning') => void,
    refreshStorageEstimate: () => void,
    existingJobs: Job[]
) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const processFiles = useCallback(async (files: File[]) => {
        // console.log(`[DEBUG] processFiles called with ${files.length} files.`);
        const textFiles = files.filter(f => f.name.toLowerCase().endsWith('.txt'));

        if (textFiles.length === 0) {
            addLog(`No .txt files found (Total ${files.length} files)`, 'warning');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        addLog(`Started processing ${textFiles.length} files...`, 'info');

        const CHUNK_SIZE = 50;
        const totalFiles = textFiles.length;
        let processedCount = 0;

        const readFileContent = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        };

        for (let i = 0; i < totalFiles; i += CHUNK_SIZE) {
            const chunk = textFiles.slice(i, i + CHUNK_SIZE);
            const newJobsToAdd: Job[] = [];

            await Promise.all(chunk.map(async (file) => {
                try {
                    const text = await readFileContent(file);

                    let folderName = "Uncategorized";
                    const relativePath = (file as any).webkitRelativePath;
                    if (relativePath) {
                        const parts = relativePath.split('/');
                        if (parts.length > 1) folderName = parts[0];
                    }

                    // Check for duplicate in *existing* jobs (passed as prop)
                    // Note: stale closure risk if existingJobs isn't updated, but here we run in a loop?
                    // Actually, existingJobs comes from props. If we rely on it inside this async loop, it might be stale.
                    // However, we can just check against the `existingJobs` available when `processFiles` was called.
                    // For a huge list upload, this is acceptable. 
                    const isDuplicate = existingJobs.some(j => j.fileName === file.name && j.folderName === folderName);
                    if (isDuplicate) return;

                    const newJobId = generateId();
                    await putJobContent(newJobId, 'originalText', text);

                    newJobsToAdd.push({
                        id: newJobId,
                        fileName: file.name,
                        folderName,
                        originalText: undefined,
                        rewrittenText: undefined,
                        originalTextLength: text.length,
                        status: JobStatus.PENDING
                    });
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                }
            }));

            if (newJobsToAdd.length > 0) {
                addJobs(newJobsToAdd);
            }

            processedCount += chunk.length;
            setUploadProgress(Math.min(100, Math.round((processedCount / totalFiles) * 100)));

            // Yield to main thread
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        setIsUploading(false);
        setUploadProgress(0);
        addLog(`Successfully added ${processedCount} files to queue`, 'success');
        refreshStorageEstimate();
    }, [addJobs, addLog, refreshStorageEstimate, existingJobs]);

    return { isUploading, uploadProgress, processFiles };
};
