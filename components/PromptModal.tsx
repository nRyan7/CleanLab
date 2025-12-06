import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';

interface PromptModalProps {
  isOpen: boolean;
  currentPrompt: string;
  onSave: (newPrompt: string) => void;
  onCancel: () => void;
  onReset: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  currentPrompt,
  onSave,
  onCancel,
  onReset,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedPrompt(currentPrompt); // Reset editedPrompt when modal opens
      setSaveSuccess(false); // Reset save success state
    }
  }, [isOpen, currentPrompt]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate async saving
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(editedPrompt);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2 seconds
  };

  const handleReset = () => {
    onReset();
    setEditedPrompt(currentPrompt); // Update local state to reflect the reset
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-2xl font-semibold text-white">自定义提示词</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700/50">
            <Icons.Error className="w-6 h-6" />
          </button>
        </div>
        <div className="p-7 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="flex-1 w-full h-auto min-h-[200px] bg-gray-900 border border-gray-600 rounded-lg p-4 text-sm text-gray-200 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar"
            placeholder="输入您的自定义提示词..."
          />
          <p className="text-xs text-gray-500 mt-3">
            <span className="font-bold text-blue-400">重要: </span>
            请确保提示词中包含 <code className="bg-gray-700 px-1 py-0.5 rounded text-blue-300">{' {TEXT} '}</code> 占位符，它将用于注入原始文本。
          </p>
        </div>
        <div className="flex justify-between items-center p-5 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-colors shadow-sm"
          >
            重置为默认
          </button>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-green-400 text-sm flex items-center gap-1.5 animate-in fade-in">
                <Icons.Check className="w-4 h-4" />
                已保存
              </span>
            )}
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-colors shadow-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;