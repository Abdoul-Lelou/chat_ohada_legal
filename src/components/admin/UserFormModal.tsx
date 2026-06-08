'use client';

import { useEffect, useRef } from 'react';
import { X, User, Mail, Lock, BarChart2, Shield, AlertCircle } from 'lucide-react';

export type UserFormData = {
  fullName: string;
  email: string;
  password: string;
  role: string;
  dailyLimit: number;
  monthlyLimit: number;
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: Partial<UserFormData>;
}

const ROLES = ['Utilisateur', 'Juriste', 'Manager', 'Administrateur'];

export default function UserFormModal({ isOpen, onClose, mode, initialData }: UserFormModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center border border-[var(--primary)]/20">
              <User size={15} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--foreground)] leading-tight">
                {isEdit ? 'Modifier le compte' : 'Créer un compte'}
              </h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                {isEdit ? 'Mise à jour des informations utilisateur' : 'Nouvel utilisateur sur la plateforme SLI'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Full Name */}
          <FormField
            label="Nom complet"
            icon={<User size={14} />}
            type="text"
            placeholder="Ex : Amadou Diallo"
            defaultValue={initialData?.fullName}
            id="admin-user-fullname"
          />

          {/* Email */}
          <FormField
            label="Adresse e-mail"
            icon={<Mail size={14} />}
            type="email"
            placeholder="utilisateur@domaine.com"
            defaultValue={initialData?.email}
            id="admin-user-email"
          />

          {/* Password (only on create, optional on edit) */}
          <FormField
            label={isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            icon={<Lock size={14} />}
            type="password"
            placeholder={isEdit ? 'Laisser vide pour conserver' : 'Minimum 8 caractères'}
            id="admin-user-password"
          />

          {/* Role */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              <Shield size={12} /> Rôle
            </label>
            <select
              id="admin-user-role"
              defaultValue={initialData?.role ?? 'Utilisateur'}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all appearance-none cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Limite / jour"
              icon={<BarChart2 size={14} />}
              type="number"
              placeholder="Ex : 50"
              defaultValue={String(initialData?.dailyLimit ?? 50)}
              id="admin-user-daily"
              min={0}
            />
            <FormField
              label="Limite / mois"
              icon={<BarChart2 size={14} />}
              type="number"
              placeholder="Ex : 500"
              defaultValue={String(initialData?.monthlyLimit ?? 500)}
              id="admin-user-monthly"
              min={0}
            />
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--primary-muted)] border border-[var(--primary)]/15">
            <AlertCircle size={13} className="text-[var(--primary)] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--primary)] leading-relaxed">
              Les identifiants seront transmis à l'utilisateur par e-mail. Assurez-vous que les informations sont correctes avant de valider.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            className="px-5 py-2 text-sm font-semibold bg-[var(--primary)] text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
          >
            {isEdit ? 'Enregistrer les modifications' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Field ── */
function FormField({
  label,
  icon,
  type,
  placeholder,
  defaultValue,
  id,
  min,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  defaultValue?: string;
  id: string;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide"
      >
        {icon} {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
      />
    </div>
  );
}
