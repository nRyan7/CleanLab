import React from 'react';
import { Icons } from './Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-500',
  cancelButtonClass = 'bg-gray-700 hover:bg-gray-600',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md p-6 animate-in zoom-in-90 ease-out duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700/50">
            <Icons.Error className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-300 mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-5 py-2 rounded-md font-medium transition-colors ${cancelButtonClass}`}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-md font-medium text-white transition-colors ${confirmButtonClass}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;