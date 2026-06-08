'use client';

import AdminShell from '@/components/admin/AdminShell';
import { Shield, Check, Lock, Edit3 } from 'lucide-react';

const ROLES = [
  {
    name: 'Administrateur',
    description: 'Accès total à la plateforme. Gestion des utilisateurs, des rôles et des paramètres.',
    color: 'var(--primary)',
    bg: 'var(--primary-muted)',
    permissions: [
      'Créer / modifier / supprimer des comptes',
      'Suspendre / réactiver des utilisateurs',
      'Définir les limites de requêtes',
      'Accéder aux statistiques globales',
      'Gérer les rôles et permissions',
      'Modifier les paramètres système',
      'Accéder à tous les documents RAG',
      'Contrôle complet de la plateforme',
    ],
    userCount: 1,
    locked: true,
  },
  {
    name: 'Manager',
    description: 'Supervision des équipes. Consultation des statistiques et gestion partielle des utilisateurs.',
    color: 'var(--accent-title)',
    bg: 'var(--accent-title-bg)',
    permissions: [
      'Consulter la liste des utilisateurs',
      'Accéder aux statistiques d\'équipe',
      'Modifier ses propres limites (dans quota)',
      'Accéder aux documents RAG partagés',
      'Exporter les rapports d\'activité',
    ],
    userCount: 1,
    locked: false,
  },
  {
    name: 'Juriste',
    description: 'Accès étendu au chatbot juridique. Volume de requêtes plus élevé.',
    color: 'var(--accent-article)',
    bg: 'var(--accent-article-bg)',
    permissions: [
      'Accès complet au chatbot OHADA',
      'Historique illimité des conversations',
      'Accéder aux documents RAG partagés',
      'Exporter les réponses en PDF',
      'Volume de requêtes : 80/jour, 1 200/mois',
    ],
    userCount: 3,
    locked: false,
  },
  {
    name: 'Utilisateur',
    description: 'Accès standard au chatbot. Volume de requêtes limité.',
    color: 'var(--muted-foreground)',
    bg: 'var(--secondary)',
    permissions: [
      'Accès au chatbot OHADA',
      'Historique des conversations (30 jours)',
      'Documents RAG en lecture seule',
      'Volume de requêtes : 50/jour, 500/mois',
    ],
    userCount: 2,
    locked: false,
  },
];

export default function RolesPage() {
  return (
    <AdminShell
      pageTitle="Rôles & Permissions"
      pageSubtitle="Définissez les droits d'accès pour chaque profil utilisateur"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ROLES.map((role) => (
          <div key={role.name} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border)]" style={{ background: role.bg }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{ background: role.bg, borderColor: `${role.color}33` }}
                  >
                    <Shield size={17} style={{ color: role.color }} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--foreground)]">{role.name}</h3>
                    <p className="text-[11px]" style={{ color: role.color }}>
                      {role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    role.locked
                      ? 'text-[var(--muted-foreground)] bg-[var(--secondary)] cursor-not-allowed opacity-60'
                      : 'text-[var(--foreground)] hover:bg-[var(--secondary)]'
                  }`}
                  disabled={role.locked}
                  title={role.locked ? 'Rôle système protégé' : 'Modifier les permissions'}
                >
                  {role.locked ? <Lock size={11} /> : <Edit3 size={11} />}
                  {role.locked ? 'Protégé' : 'Modifier'}
                </button>
              </div>
              <p className="text-[12px] text-[var(--muted-foreground)] mt-2 leading-relaxed">{role.description}</p>
            </div>

            {/* Permissions list */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">Permissions incluses</p>
              <ul className="space-y-2">
                {role.permissions.map((perm) => (
                  <li key={perm} className="flex items-start gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: role.bg }}
                    >
                      <Check size={9} style={{ color: role.color }} />
                    </span>
                    <span className="text-[12px] text-[var(--foreground-muted)] leading-relaxed">{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-4 flex items-start gap-3 px-4 py-3.5 bg-[var(--primary-muted)] border border-[var(--primary)]/20 rounded-xl">
        <Lock size={13} className="text-[var(--primary)] mt-0.5 shrink-0" />
        <p className="text-[12px] text-[var(--primary)] leading-relaxed">
          Le rôle <strong>Administrateur</strong> est un rôle système protégé. Ses permissions ne peuvent pas être modifiées afin de garantir la sécurité et l'intégrité de la plateforme.
        </p>
      </div>
    </AdminShell>
  );
}
