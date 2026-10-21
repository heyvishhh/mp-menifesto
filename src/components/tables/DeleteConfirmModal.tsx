'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PromiseRecord } from '@/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  promise: PromiseRecord | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  promise,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen || !promise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              वादा विलोपन की पुष्टि (Confirm Deletion)
            </h3>
            <p className="text-xs text-slate-500">
              क्या आप वास्तव में इस संकल्प पत्र वादे को हटाना चाहते हैं?
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">
            क्रमांक #{promise.id}: {promise.title}
          </div>
          <div className="text-[11px] text-slate-500">
            श्रेणी: {promise.category} | स्थिति: {promise.statusRaw}
          </div>
        </div>

        <div className="text-[11px] text-rose-600 font-medium">
          चेतावनी: यह क्रिया चयनित रिकॉर्ड को सक्रिय डेटासेट से स्थायी रूप से हटा देगी और ऑडिट लॉग में दर्ज की जाएगी।
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'हटाया जा रहा है...' : 'हाँ, वादा हटाएं (Delete)'}
          </button>
        </div>
      </div>
    </div>
  );
}
