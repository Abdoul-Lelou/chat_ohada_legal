'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'suspend' | 'reactivate' | 'delete';
  userName: string;
}

const ACTION_CONFIG = {
  suspend: {
    title: 'Suspendre le compte',
    description: (name: string) =>
      `Le compte de ${name} sera suspendu. L'utilisateur ne pourra plus accéder à la plateforme jusqu'à réactivation.`,
    confirmLabel: 'Suspendre',
    color: 'var(--accent-title)',
    bg: 'var(--accent-title-bg)',
  },
  reactivate: {
    title: 'Réactiver le compte',
    description: (name: string) =>
      `Le compte de ${name} sera réactivé. L'utilisateur pourra de nouveau accéder à la plateforme.`,
    confirmLabel: 'Réactiver',
    color: 'var(--primary)',
    bg: 'var(--primary-muted)',
  },
  delete: {
    title: 'Supprimer le compte',
    description: (name: string) =>
      `Le compte de ${name} sera définitivement supprimé. Cette action est irréversible et toutes les données associées seront perdues.`,
    confirmLabel: 'Supprimer définitivement',
    color: 'var(--destructive)',
    bg: 'var(--destructive-muted)',
  },
};

export default function ConfirmActionModal({ isOpen, onClose, action, userName }: ConfirmActionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const config = ACTION_CONFIG[action];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ background: config.bg, borderColor: `${config.color}33` }}
            >
              <AlertTriangle size={15} style={{ color: config.color }} />
            </div>
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
            {config.description(userName)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl active:scale-[0.98] transition-all shadow-sm"
            style={{ background: config.color }}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
