import React from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { ModalShell } from '../ui/ModalShell';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <ModalShell open={isOpen} onClose={onCancel} size="md">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-alert/20 text-alert' : 'bg-ebc-straw/20 text-ebc-straw'
            }`}>
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-cave-50">{title}</h3>
              <p className="text-xs sm:text-sm text-cave-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t border-cave-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-cave-700 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold text-sm transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition shadow-md ${
              isDanger
                ? 'bg-alert hover:bg-alert text-white'
                : 'bg-ebc-straw hover:bg-ebc-gold text-cave-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

