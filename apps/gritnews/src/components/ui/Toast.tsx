import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export interface ToastPropsSingle {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastPropsSingle> = ({ message, type = 'success', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#22A06B] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#145EDB] shrink-0" />
  };

  const borders = {
    success: 'border-l-4 border-l-[#22A06B]',
    error: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-[#145EDB]'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-auto flex items-center justify-between p-4 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full transition-all">
      <div className="flex items-center gap-3 pr-2">
        {icons[type]}
        <p className="text-xs font-bold text-[#10233F]">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#22A06B] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#145EDB] shrink-0" />
  };

  const borders = {
    success: 'border-l-4 border-l-[#22A06B]',
    error: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-[#145EDB]'
  };

  return (
    <div className={`pointer-events-auto flex items-center justify-between p-4 bg-white rounded-lg shadow-lg border border-[#E2E8F0] ${borders[toast.type]} transition-all animate-slideUp`}>
      <div className="flex items-center gap-3 pr-2">
        {icons[toast.type]}
        <p className="text-sm font-medium text-[#10233F]">{toast.text}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
