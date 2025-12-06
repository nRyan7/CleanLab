import { useState, useEffect, useCallback } from 'react';
import { AISettings } from '../types';
import { MODEL_NAME, DEFAULT_PROMPT, DEFAULT_MAX_CONCURRENT_JOBS, CUSTOM_PROMPT_KEY } from '../constants';
import { testLocalConnection } from '../services/geminiService';

const SETTINGS_KEY = 'novel_rewriter_settings_v1';

export const useSettings = (addLog: (message: string, type: 'info' | 'error' | 'success' | 'warning') => void) => {
    const [settings, setSettings] = useState<AISettings>({
        provider: 'gemini',
        localBaseUrl: 'http://localhost:1234/v1',
        localModelName: 'local-model',
        geminiModelName: MODEL_NAME,
        systemPrompt: DEFAULT_PROMPT,
        maxConcurrentJobs: DEFAULT_MAX_CONCURRENT_JOBS,
        validation: {
            minRatio: 0.7,
            requireFirstPerson: true,
        },
    });

    const [showSettings, setShowSettings] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [testResultMessage, setTestResultMessage] = useState<string | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        try {
            const settingsString = localStorage.getItem(SETTINGS_KEY);
            if (settingsString) {
                const parsedSettings = JSON.parse(settingsString);
                setSettings(prev => ({
                    ...prev,
                    ...parsedSettings,
                    maxConcurrentJobs: parsedSettings.maxConcurrentJobs ?? DEFAULT_MAX_CONCURRENT_JOBS,
                    validation: {
                        minRatio: parsedSettings.validation?.minRatio ?? (parsedSettings as any).minRatio ?? prev.validation.minRatio,
                        requireFirstPerson: parsedSettings.validation?.requireFirstPerson ?? (parsedSettings as any).requireFirstPerson ?? prev.validation.requireFirstPerson,
                    },
                }));
            }

            // Also load custom prompt if it exists (legacy support/override)
            const customPromptString = localStorage.getItem(CUSTOM_PROMPT_KEY);
            if (customPromptString) {
                const parsedPrompt = JSON.parse(customPromptString);
                setSettings(prev => ({ ...prev, systemPrompt: parsedPrompt }));
            }

        } catch (e) {
            console.error("Failed to load settings", e);
            addLog("Failed to load settings, using defaults", 'error');
        }
    }, [addLog]);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
            addLog("Failed to save settings to local storage", 'error');
        }
    }, [settings, addLog]);

    const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const runConnectionTest = async () => {
        setIsTestingConnection(true);
        setAvailableModels([]);
        setTestResultMessage(null);
        try {
            const result = await testLocalConnection(settings.localBaseUrl);
            setTestResultMessage(result.message);
            if (result.success && result.models) {
                setAvailableModels(result.models);
            }
        } catch (e: any) {
            setTestResultMessage(`❌ Error: ${e.message}`);
        } finally {
            setIsTestingConnection(false);
        }
    };

    const setPreset = (type: 'lmstudio' | 'ollama') => {
        const presets = {
            lmstudio: { localBaseUrl: 'http://localhost:1234/v1', localModelName: 'local-model' },
            ollama: { localBaseUrl: 'http://localhost:11434/v1', localModelName: 'llama3' }
        };
        setSettings(prev => ({ ...prev, ...presets[type] }));
    };

    return {
        settings,
        updateSettings,
        showSettings,
        setShowSettings,
        isTestingConnection,
        availableModels,
        testResultMessage,
        runConnectionTest,
        setPreset
    };
};
