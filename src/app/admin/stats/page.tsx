'use client';

import AdminShell from '@/components/admin/AdminShell';
import {
  TrendingUp, Users, Zap, Clock, BarChart3, Calendar,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';

/* ── Mock stats (UI only) ── */
const MONTHLY_DATA = [
  { month: 'Jan', requests: 1200, users: 3 },
  { month: 'Fév', requests: 1850, users: 4 },
  { month: 'Mar', requests: 2400, users: 5 },
  { month: 'Avr', requests: 2100, users: 5 },
  { month: 'Mai', requests: 3100, users: 7 },
  { month: 'Jun', requests: 2488, users: 7 },
];

const TOP_USERS = [
  { name: 'Amadou Bah', email: 'amadou.bah@sli.gn', requests: 890, trend: 'up' },
  { name: 'Fatoumata Diallo', email: 'fdiallo@cabinet-juridique.gn', requests: 672, trend: 'up' },
  { name: 'Aissatou Barry', email: 'a.barry@notariat.gn', requests: 487, trend: 'down' },
  { name: 'Mamadou Soumah', email: 'msoumah@lex.gn', requests: 231, trend: 'up' },
  { name: 'Cellou Baldé', email: 'cbalde@droit-affaires.gn', requests: 142, trend: 'down' },
];

const DISTRIBUTION = [
  { role: 'Juriste', count: 3, pct: 43, color: 'var(--accent-article)' },
  { role: 'Utilisateur', count: 2, pct: 28, color: 'var(--muted-foreground)' },
  { role: 'Manager', count: 1, pct: 15, color: 'var(--accent-title)' },
  { role: 'Administrateur', count: 1, pct: 14, color: 'var(--primary)' },
];

const maxRequests = Math.max(...MONTHLY_DATA.map((d) => d.requests));

export default function StatsPage() {
  return (
    <AdminShell
      pageTitle="Statistiques d'Utilisation"
      pageSubtitle="Vue globale de l'activité de la plateforme"
    >
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={16} />} label="Utilisateurs actifs" value="5" delta="+2 ce mois" positive color="primary" />
        <StatCard icon={<Zap size={16} />} label="Requêtes ce mois" value="2 488" delta="+23 %" positive color="accent" />
        <StatCard icon={<TrendingUp size={16} />} label="Moy. requêtes/user" value="355" delta="+18 %" positive color="primary" />
        <StatCard icon={<Clock size={16} />} label="Taux de saturation" value="12 %" delta="-5 %" positive={false} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* ── Bar Chart ── */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Requêtes mensuelles</h2>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Volume de requêtes par mois</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--primary)] bg-[var(--primary-muted)] px-2.5 py-1 rounded-lg border border-[var(--primary)]/20">
              <Calendar size={11} />
              6 derniers mois
            </div>
          </div>

          {/* Bar chart visual */}
          <div className="flex items-end justify-between gap-2 h-36">
            {MONTHLY_DATA.map((d) => {
              const heightPct = Math.round((d.requests / maxRequests) * 100);
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.requests}
                  </span>
                  <div className="w-full relative rounded-t-lg overflow-hidden bg-[var(--secondary)]" style={{ height: '96px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        background: 'linear-gradient(to top, var(--primary), var(--primary-hover))',
                        opacity: d.month === 'Jun' ? 0.7 : 1,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] font-medium">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Role Distribution ── */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Distribution des rôles</h2>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Répartition par type de compte</p>
          </div>

          <div className="space-y-3">
            {DISTRIBUTION.map((d) => (
              <div key={d.role}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-[var(--foreground)]">{d.role}</span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{d.count} · {d.pct}%</span>
                </div>
                <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.pct}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Donut legend */}
          <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-2">
            {DISTRIBUTION.map((d) => (
              <div key={d.role} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[11px] text-[var(--muted-foreground)] truncate">{d.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Users ── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[var(--primary)]" />
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Top utilisateurs</h2>
          </div>
          <span className="text-[11px] text-[var(--muted-foreground)]">Par volume de requêtes ce mois</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Utilisateur</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Requêtes</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {TOP_USERS.map((u, i) => (
              <tr key={u.email} className="border-b border-[var(--border-subtle)] hover:bg-[var(--primary-muted)] transition-colors last:border-b-0">
                <td className="px-5 py-3">
                  <span className="text-[13px] font-bold text-[var(--muted-foreground)]">#{i + 1}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[var(--primary)]">
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--foreground)]">{u.name}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--foreground)]">{u.requests}</span>
                    <div className="flex-1 max-w-[80px] h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(u.requests / TOP_USERS[0].requests) * 100}%`, background: 'var(--primary)' }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    u.trend === 'up'
                      ? 'text-[var(--primary)] bg-[var(--primary-muted)]'
                      : 'text-[var(--destructive)] bg-[var(--destructive-muted)]'
                  }`}>
                    {u.trend === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {u.trend === 'up' ? 'Hausse' : 'Baisse'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon, label, value, delta, positive, color }: {
  icon: React.ReactNode; label: string; value: string;
  delta: string; positive: boolean; color: 'primary' | 'accent' | 'warning';
}) {
  const styles = {
    primary: { iconBg: 'var(--primary-muted)', iconColor: 'var(--primary)' },
    accent: { iconBg: 'var(--accent-article-bg)', iconColor: 'var(--accent-article)' },
    warning: { iconBg: 'var(--accent-title-bg)', iconColor: 'var(--accent-title)' },
  }[color];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: styles.iconBg }}>
          <span style={{ color: styles.iconColor }}>{icon}</span>
        </div>
        <span className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{value}</p>
      <div className="flex items-center gap-1 mt-1.5">
        {positive ? <ArrowUpRight size={12} className="text-[var(--primary)]" /> : <ArrowDownRight size={12} className="text-[var(--destructive)]" />}
        <span className={`text-[11px] font-medium ${positive ? 'text-[var(--primary)]' : 'text-[var(--destructive)]'}`}>{delta}</span>
        <span className="text-[11px] text-[var(--muted-foreground)]">vs mois dernier</span>
      </div>
    </div>
  );
}
