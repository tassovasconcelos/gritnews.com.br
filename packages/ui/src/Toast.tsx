import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ToastPropsSingle {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible?: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastPropsSingle> = ({ message, type = 'success', isVisible = true, onClose }) => {
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
