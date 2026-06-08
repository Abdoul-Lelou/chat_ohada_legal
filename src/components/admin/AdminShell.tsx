'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
  {
    group: 'Gestion',
    items: [
      { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
      { href: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
    ],
  },
  {
    group: 'Contrôle',
    items: [
      { href: '/admin/roles', icon: ShieldCheck, label: 'Rôles & Permissions' },
      { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminShell({ children, pageTitle, pageSubtitle, actions }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col h-screen bg-[var(--card)] border-r border-[var(--border)] transition-all duration-200 ease-in-out shrink-0 ${
          collapsed ? 'w-[4.5rem]' : 'w-[17rem]'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-[var(--card)] border border-[var(--border)] rounded-full p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] shadow-sm z-40 transition-colors flex items-center justify-center"
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        {/* Brand */}
        <div className={`p-4 shrink-0 ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-2.5 mb-6 ${collapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
              <Scale size={16} className="text-[var(--primary)]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[var(--foreground)] tracking-tight leading-none">SOVEREIGN</span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-medium tracking-wide truncate">LEGAL INTELLIGENCE-SLI</span>
              </div>
            )}
          </div>

          {/* Admin badge */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/20 mb-2">
              <ShieldCheck size={13} className="text-[var(--primary)] shrink-0" />
              <span className="text-[11px] font-semibold text-[var(--primary)] tracking-wide uppercase">Back-Office Admin</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-2 py-1 space-y-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <h3 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.12em] px-3 mb-1.5">
                  {group.group}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const isActive = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                        collapsed ? 'justify-center px-0' : ''
                      } ${
                        isActive
                          ? 'bg-[var(--primary-muted)] text-[var(--primary)] font-medium'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {!collapsed && isActive && (
                        <ChevronRight size={13} className="ml-auto shrink-0 opacity-60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-[var(--border)] shrink-0 space-y-0.5 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title={collapsed ? `Mode ${resolvedTheme === 'dark' ? 'Clair' : 'Sombre'}` : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span className="truncate">Mode {resolvedTheme === 'dark' ? 'Clair' : 'Sombre'}</span>}
          </button>

          <Link
            href="/"
            title={collapsed ? 'Retour au Chat' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive-muted)] transition-all ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">Retour au Chat</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-[13px] text-[var(--muted-foreground)]">{pageSubtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            {/* Notification bell (placeholder) */}
            <button className="relative p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            </button>
            {/* Admin avatar */}
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/30 flex items-center justify-center">
              <ShieldCheck size={15} className="text-[var(--primary)]" />
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
