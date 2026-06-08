'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import UserFormModal from '@/components/admin/UserFormModal';
import ConfirmActionModal from '@/components/admin/ConfirmActionModal';
import {
  Plus, Search, Filter, MoreHorizontal, ChevronUp, ChevronDown,
  UserCheck, UserX, Trash2, Pencil, Shield, Activity, Zap,
} from 'lucide-react';

/* ── Mock data (UI only) ── */
type UserStatus = 'actif' | 'suspendu';
type UserRole = 'Utilisateur' | 'Juriste' | 'Manager' | 'Administrateur';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsage: number;
  monthlyUsage: number;
  joinedAt: string;
  lastActive: string;
}

const MOCK_USERS: AdminUser[] = [
  {
    id: '1', fullName: 'Amadou Bah', email: 'amadou.bah@sli.gn',
    role: 'Administrateur', status: 'actif',
    dailyLimit: 200, monthlyLimit: 5000, dailyUsage: 34, monthlyUsage: 890,
    joinedAt: '2024-01-15', lastActive: 'Il y a 2 min',
  },
  {
    id: '2', fullName: 'Fatoumata Diallo', email: 'fdiallo@cabinet-juridique.gn',
    role: 'Juriste', status: 'actif',
    dailyLimit: 80, monthlyLimit: 1200, dailyUsage: 45, monthlyUsage: 672,
    joinedAt: '2024-03-22', lastActive: 'Il y a 1 h',
  },
  {
    id: '3', fullName: 'Mamadou Soumah', email: 'msoumah@lex.gn',
    role: 'Juriste', status: 'actif',
    dailyLimit: 80, monthlyLimit: 1200, dailyUsage: 12, monthlyUsage: 231,
    joinedAt: '2024-04-10', lastActive: 'Hier',
  },
  {
    id: '4', fullName: 'Ibrahima Camara', email: 'i.camara@affaires.gn',
    role: 'Manager', status: 'suspendu',
    dailyLimit: 120, monthlyLimit: 2000, dailyUsage: 0, monthlyUsage: 54,
    joinedAt: '2024-02-08', lastActive: 'Il y a 5 j',
  },
  {
    id: '5', fullName: 'Aissatou Barry', email: 'a.barry@notariat.gn',
    role: 'Utilisateur', status: 'actif',
    dailyLimit: 50, monthlyLimit: 500, dailyUsage: 8, monthlyUsage: 142,
    joinedAt: '2024-05-01', lastActive: 'Il y a 3 h',
  },
  {
    id: '6', fullName: 'Cellou Baldé', email: 'cbalde@droit-affaires.gn',
    role: 'Utilisateur', status: 'actif',
    dailyLimit: 50, monthlyLimit: 500, dailyUsage: 50, monthlyUsage: 487,
    joinedAt: '2024-05-18', lastActive: 'Il y a 10 min',
  },
  {
    id: '7', fullName: 'Mariama Kouyaté', email: 'mkouyate@lex.gn',
    role: 'Juriste', status: 'suspendu',
    dailyLimit: 80, monthlyLimit: 1200, dailyUsage: 0, monthlyUsage: 12,
    joinedAt: '2024-06-02', lastActive: 'Il y a 12 j',
  },
];

const ROLE_COLORS: Record<UserRole, { text: string; bg: string }> = {
  'Administrateur': { text: 'var(--primary)', bg: 'var(--primary-muted)' },
  'Manager': { text: 'var(--accent-title)', bg: 'var(--accent-title-bg)' },
  'Juriste': { text: 'var(--accent-article)', bg: 'var(--accent-article-bg)' },
  'Utilisateur': { text: 'var(--muted-foreground)', bg: 'var(--secondary)' },
};

type SortKey = 'fullName' | 'role' | 'status' | 'monthlyUsage';
type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'suspend' | 'reactivate' | 'delete'; user: AdminUser }
  | null;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortAsc, setSortAsc] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = MOCK_USERS
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (statusFilter === 'all' || u.status === statusFilter) &&
        (roleFilter === 'all' || u.role === roleFilter)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const totalActive = MOCK_USERS.filter((u) => u.status === 'actif').length;
  const totalSuspended = MOCK_USERS.filter((u) => u.status === 'suspendu').length;
  const totalRequests = MOCK_USERS.reduce((acc, u) => acc + u.monthlyUsage, 0);

  return (
    <AdminShell
      pageTitle="Gestion des Utilisateurs"
      pageSubtitle={`${MOCK_USERS.length} comptes enregistrés · ${totalActive} actifs`}
      actions={
        <button
          id="admin-create-user-btn"
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--primary)] text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus size={15} />
          Nouveau compte
        </button>
      }
    >
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard icon={<UserCheck size={16} />} label="Comptes actifs" value={totalActive} color="primary" />
        <KPICard icon={<UserX size={16} />} label="Comptes suspendus" value={totalSuspended} color="warning" />
        <KPICard icon={<Zap size={16} />} label="Requêtes ce mois" value={String(totalRequests)} color="accent" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            id="admin-user-search"
            type="text"
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 p-1 bg-[var(--card)] border border-[var(--border)] rounded-xl">
          {(['all', 'actif', 'suspendu'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                statusFilter === s
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              {s === 'all' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--muted-foreground)] text-sm">
          <Filter size={13} />
          <select
            id="admin-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="bg-transparent text-[13px] text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="Administrateur">Administrateur</option>
            <option value="Manager">Manager</option>
            <option value="Juriste">Juriste</option>
            <option value="Utilisateur">Utilisateur</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <SortTh label="Utilisateur" sortKey="fullName" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortTh label="Rôle" sortKey="role" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortTh label="Statut" sortKey="status" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide whitespace-nowrap">
                  Limites
                </th>
                <SortTh label="Consommation" sortKey="monthlyUsage" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide whitespace-nowrap">
                  Dernière activité
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-b border-[var(--border-subtle)] hover:bg-[var(--primary-muted)] transition-colors group ${
                    idx === filtered.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {/* User info */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-muted)] to-[var(--secondary)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                        <span className="text-[11px] font-bold text-[var(--primary)]">
                          {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--foreground)] truncate">{user.fullName}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Limits */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] text-[var(--foreground-muted)]">
                        <span className="text-[var(--foreground)] font-medium">{user.dailyLimit}</span>/j
                      </span>
                      <span className="text-[12px] text-[var(--foreground-muted)]">
                        <span className="text-[var(--foreground)] font-medium">{user.monthlyLimit}</span>/mois
                      </span>
                    </div>
                  </td>

                  {/* Usage with progress bars */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <UsageBar label="Jour" used={user.dailyUsage} limit={user.dailyLimit} />
                      <UsageBar label="Mois" used={user.monthlyUsage} limit={user.monthlyLimit} />
                    </div>
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Activity size={11} className="text-[var(--muted-foreground)] shrink-0" />
                      <span className="text-[12px] text-[var(--muted-foreground)]">{user.lastActive}</span>
                    </div>
                  </td>

                  {/* Actions menu */}
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        id={`admin-user-menu-${user.id}`}
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {openMenu === user.id && (
                        <DropdownMenu
                          user={user}
                          onEdit={() => { setModal({ type: 'edit', user }); setOpenMenu(null); }}
                          onSuspend={() => { setModal({ type: 'suspend', user }); setOpenMenu(null); }}
                          onReactivate={() => { setModal({ type: 'reactivate', user }); setOpenMenu(null); }}
                          onDelete={() => { setModal({ type: 'delete', user }); setOpenMenu(null); }}
                          onClose={() => setOpenMenu(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)]">
                    Aucun utilisateur ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between">
          <span className="text-[12px] text-[var(--muted-foreground)]">
            {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 text-xs rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-all disabled:opacity-40" disabled>
              Précédent
            </button>
            <span className="px-3 py-1 text-xs bg-[var(--primary-muted)] text-[var(--primary)] rounded-lg font-medium">1</span>
            <button className="px-2.5 py-1 text-xs rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-all disabled:opacity-40" disabled>
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <UserFormModal
          isOpen
          onClose={() => setModal(null)}
          mode={modal.type}
          initialData={modal.type === 'edit' ? {
            fullName: modal.user.fullName,
            email: modal.user.email,
            role: modal.user.role,
            dailyLimit: modal.user.dailyLimit,
            monthlyLimit: modal.user.monthlyLimit,
          } : undefined}
        />
      )}

      {(modal?.type === 'suspend' || modal?.type === 'reactivate' || modal?.type === 'delete') && (
        <ConfirmActionModal
          isOpen
          onClose={() => setModal(null)}
          action={modal.type}
          userName={modal.user.fullName}
        />
      )}
    </AdminShell>
  );
}

/* ── Sub-components ── */

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: 'primary' | 'warning' | 'accent' }) {
  const styles = {
    primary: { iconBg: 'var(--primary-muted)', iconColor: 'var(--primary)', border: 'var(--primary)' },
    warning: { iconBg: 'var(--accent-title-bg)', iconColor: 'var(--accent-title)', border: 'var(--accent-title)' },
    accent: { iconBg: 'var(--accent-article-bg)', iconColor: 'var(--accent-article)', border: 'var(--accent-article)' },
  }[color];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
        style={{ background: styles.iconBg, borderColor: `${styles.border}33` }}
      >
        <span style={{ color: styles.iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-[12px] text-[var(--muted-foreground)] font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
      style={{ color: c.text, background: c.bg, borderColor: `${c.text}33` }}
    >
      <Shield size={10} />
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const isActive = status === 'actif';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        isActive
          ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
          : 'bg-[var(--destructive-muted)] text-[var(--destructive)]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[var(--primary)]' : 'bg-[var(--destructive)]'}`} />
      {isActive ? 'Actif' : 'Suspendu'}
    </span>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct >= 85;
  const color = isHigh ? 'var(--accent-title)' : 'var(--primary)';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--muted-foreground)] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-[var(--muted-foreground)] w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
}

function SortTh({ label, sortKey, current, asc, onSort }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
        isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
      }`}>
        {label}
        {isActive ? (asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}
      </span>
    </th>
  );
}

function DropdownMenu({ user, onEdit, onSuspend, onReactivate, onDelete, onClose }: {
  user: AdminUser;
  onEdit: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors text-left"
        >
          <Pencil size={13} className="text-[var(--muted-foreground)]" /> Modifier le compte
        </button>

        {user.status === 'actif' ? (
          <button
            onClick={onSuspend}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--accent-title)] hover:bg-[var(--accent-title-bg)] transition-colors text-left"
          >
            <UserX size={13} /> Suspendre
          </button>
        ) : (
          <button
            onClick={onReactivate}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--primary-muted)] transition-colors text-left"
          >
            <UserCheck size={13} /> Réactiver
          </button>
        )}

        <div className="border-t border-[var(--border)]" />
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--destructive)] hover:bg-[var(--destructive-muted)] transition-colors text-left"
        >
          <Trash2 size={13} /> Supprimer le compte
        </button>
      </div>
    </>
  );
}
