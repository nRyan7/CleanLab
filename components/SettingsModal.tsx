import React from 'react';
import { Icons } from './Icon';
import { AISettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AISettings;
    onUpdateSettings: (s: Partial<AISettings>) => void;
    isTestingConnection: boolean;
    testResultMessage: string | null;
    availableModels: string[];
    onRunConnectionTest: () => void;
    onSetPreset: (type: 'lmstudio' | 'ollama') => void;
    onOpenSystemLogs: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    isTestingConnection,
    testResultMessage,
    availableModels,
    onRunConnectionTest,
    onSetPreset,
    onOpenSystemLogs
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Icons.Settings className="w-5 h-5 text-gray-500" />
                        系统设置
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Provider Selection */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Cpu className="w-4 h-4 text-indigo-500" />
                            模型服务提供商
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onUpdateSettings({ provider: 'gemini' })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${settings.provider === 'gemini'
                                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 mb-1">Google Gemini</div>
                                <div className="text-xs text-gray-500">使用 Google 的 API 服务，需要 API Key</div>
                            </button>
                            <button
                                onClick={() => onUpdateSettings({ provider: 'local' })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${settings.provider === 'local'
                                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 mb-1">本地模型 (OpenAI Compatible)</div>
                                <div className="text-xs text-gray-500">连接 LMStudio, Ollama 等本地服务</div>
                            </button>
                        </div>
                    </section>

                    {/* Local Settings */}
                    {settings.provider === 'local' && (
                        <section className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">本地服务配置</h3>
                                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                                    <button onClick={() => onSetPreset('lmstudio')} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600 rounded hover:bg-gray-50">LM Studio</button>
                                    <div className="w-px bg-gray-200 my-1" />
                                    <button onClick={() => onSetPreset('ollama')} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600 rounded hover:bg-gray-50">Ollama</button>
                                </div>
                            </div>

                            {/* Command Hint Block */}
                            {settings.localBaseUrl.includes('11434') && (
                                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100 font-mono">
                                    <div className="font-bold mb-1">Ollama 启动命令 (解决跨域):</div>
                                    <code>OLLAMA_ORIGINS="*" ollama serve</code>
                                </div>
                            )}
                            {settings.localBaseUrl.includes('1234') && (
                                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100 font-mono">
                                    <div className="font-bold mb-1">LM Studio 启动配置:</div>
                                    <div>请在 Developer 侧边栏开启 "CORS" 选项 (默认端口 1234)</div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={settings.localBaseUrl}
                                            onChange={(e) => onUpdateSettings({ localBaseUrl: e.target.value })}
                                            placeholder="e.g., http://localhost:1234/v1"
                                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white"
                                        />
                                        <button
                                            onClick={onRunConnectionTest}
                                            disabled={isTestingConnection}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {isTestingConnection ? '测试中...' : '测试连接'}
                                        </button>
                                    </div>
                                    {testResultMessage && (
                                        <div className={`mt-2 text-sm p-2 rounded-lg ${testResultMessage.includes('✅') ||
                                            testResultMessage.includes('成功') ||
                                            testResultMessage.includes('Success')
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {testResultMessage}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                    {availableModels.length > 0 ? (
                                        <select
                                            value={settings.localModelName}
                                            onChange={(e) => onUpdateSettings({ localModelName: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                                        >
                                            {availableModels.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={settings.localModelName}
                                            onChange={(e) => onUpdateSettings({ localModelName: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white"
                                        />
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Validation Settings */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Shield className="w-4 h-4 text-green-500" />
                            质量验证阈值
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    最小压缩率 (Min Ratio) <span className="text-gray-400 font-normal ml-1">{settings.validation.minRatio}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.5"
                                    step="0.1"
                                    value={settings.validation.minRatio}
                                    onChange={(e) => onUpdateSettings({ validation: { ...settings.validation, minRatio: parseFloat(e.target.value) } })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="mt-1 text-xs text-gray-500">输出长度 / 输入长度。过低可能意味着内容丢失。</p>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.validation.requireFirstPerson}
                                        onChange={(e) => onUpdateSettings({ validation: { ...settings.validation, requireFirstPerson: e.target.checked } })}
                                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-700">强制第一人称检查</span>
                                        <span className="block text-xs text-gray-500 mt-0.5">确保输出包含 "我" 等第一人称代词</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                            onClick={onOpenSystemLogs}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <Icons.FileText className="w-4 h-4" />
                            查看系统/崩溃日志
                        </button>

                        <div className="text-xs text-gray-400">
                            Settings auto-save to localStorage
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
