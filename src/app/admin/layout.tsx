import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Back-Office — SOVEREIGN LEGAL INTELLIGENCE-SLI',
  description: 'Interface d\'administration et de gestion des utilisateurs de la plateforme SLI.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
