import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OHADA AI - Assistant Juridique',
  description: 'Assistant juridique intelligent expert en droit OHADA et guinéen.',
};

import { ThemeProvider } from '@/context/ThemeContext';

import { preinit } from 'react-dom';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🛡️ Expert Logic: Use React 19 preinit to inject blocking script without warnings
  preinit('/theme-init.js', { as: 'script' });

  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased h-screen w-screen overflow-hidden selection:bg-emerald-500 selection:text-white`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
