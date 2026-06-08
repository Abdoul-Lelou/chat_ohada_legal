'use client';

import AdminShell from '@/components/admin/AdminShell';
import { Settings, Globe, Bell, ShieldCheck, Database, Save, AlertCircle } from 'lucide-react';

const SECTIONS = [
  {
    id: 'general',
    title: 'Paramètres généraux',
    icon: <Globe size={15} />,
    fields: [
      { id: 'settings-platform-name', label: 'Nom de la plateforme', type: 'text', defaultValue: 'SOVEREIGN LEGAL INTELLIGENCE-SLI', description: 'Nom affiché dans l\'interface et les e-mails.' },
      { id: 'settings-support-email', label: 'E-mail de support', type: 'email', defaultValue: 'support@sli.gn', description: 'Adresse utilisée pour les communications système.' },
      { id: 'settings-default-lang', label: 'Langue par défaut', type: 'select', options: ['Français', 'English', 'Anglais'], description: 'Langue de l\'interface pour les nouveaux comptes.' },
    ],
  },
  {
    id: 'limits',
    title: 'Limites globales par défaut',
    icon: <Database size={15} />,
    fields: [
      { id: 'settings-default-daily', label: 'Limite journalière (défaut)', type: 'number', defaultValue: '50', description: 'Appliquée automatiquement à tout nouveau compte.' },
      { id: 'settings-default-monthly', label: 'Limite mensuelle (défaut)', type: 'number', defaultValue: '500', description: 'Appliquée automatiquement à tout nouveau compte.' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications administrateur',
    icon: <Bell size={15} />,
    toggles: [
      { id: 'settings-notif-new-user', label: 'Nouveau compte créé', description: 'Recevoir un e-mail à chaque création de compte.', defaultOn: true },
      { id: 'settings-notif-quota', label: 'Dépassement de quota', description: 'Alerte quand un utilisateur atteint 90% de sa limite.', defaultOn: true },
      { id: 'settings-notif-suspend', label: 'Compte suspendu', description: 'Notification lors d\'une suspension de compte.', defaultOn: false },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité & Accès',
    icon: <ShieldCheck size={15} />,
    toggles: [
      { id: 'settings-sec-2fa', label: 'Double authentification obligatoire', description: 'Force 2FA pour tous les comptes Administrateur.', defaultOn: true },
      { id: 'settings-sec-session', label: 'Déconnexion automatique (30 min)', description: 'Déconnecte les sessions inactives après 30 minutes.', defaultOn: false },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AdminShell
      pageTitle="Paramètres Système"
      pageSubtitle="Configuration globale de la plateforme SLI"
      actions={
        <button
          id="admin-save-settings-btn"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--primary)] text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
        >
          <Save size={14} />
          Enregistrer
        </button>
      }
    >
      <div className="max-w-2xl space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)]">
              <span className="text-[var(--primary)]">{section.icon}</span>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">{section.title}</h2>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Input fields */}
              {section.fields?.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label htmlFor={field.id} className="text-[12px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={field.id}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all appearance-none cursor-pointer"
                    >
                      {field.options?.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type}
                      defaultValue={field.defaultValue}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
                    />
                  )}
                  {field.description && (
                    <p className="text-[11px] text-[var(--muted-foreground)]">{field.description}</p>
                  )}
                </div>
              ))}

              {/* Toggles */}
              {section.toggles?.map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--foreground)]">{toggle.label}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{toggle.description}</p>
                  </div>
                  <label htmlFor={toggle.id} className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id={toggle.id}
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked={toggle.defaultOn}
                    />
                    <div className="w-9 h-5 bg-[var(--secondary)] border border-[var(--border)] rounded-full peer peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="bg-[var(--card)] border border-[var(--destructive)]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--destructive)]/20 bg-[var(--destructive-muted)]">
            <AlertCircle size={15} className="text-[var(--destructive)]" />
            <h2 className="text-[14px] font-semibold text-[var(--destructive)]">Zone dangereuse</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--foreground)]">Réinitialiser tous les quotas</p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Remet à zéro les compteurs de requêtes de tous les utilisateurs.</p>
              </div>
              <button className="shrink-0 px-4 py-2 text-xs font-semibold text-[var(--destructive)] border border-[var(--destructive)]/40 rounded-xl hover:bg-[var(--destructive-muted)] transition-all">
                Réinitialiser
              </button>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--foreground)]">Vider le cache de la plateforme</p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Force le rechargement de tous les index de documents RAG.</p>
              </div>
              <button className="shrink-0 px-4 py-2 text-xs font-semibold text-[var(--destructive)] border border-[var(--destructive)]/40 rounded-xl hover:bg-[var(--destructive-muted)] transition-all">
                Vider
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
