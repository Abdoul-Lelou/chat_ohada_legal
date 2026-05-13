import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SOVEREIGN LEGAL INTELLIGENCE-SLI',
  description: 'Assistant juridique IA expert en droit OHADA et guinéen. Analyse de textes officiels, articles de loi et jurisprudence.',
  keywords: ['OHADA', 'droit', 'juridique', 'IA', 'Guinée', 'assistant', 'legal'],
};

import { ThemeProvider } from '@/context/ThemeContext';

import { preinit } from 'react-dom';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use React 19 preinit to inject blocking theme script without warnings
  preinit('/theme-init.js', { as: 'script' });

  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased h-screen w-screen overflow-hidden`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            },
          }}
        />
      </body>
    </html>
  );
}
