import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/Sidebar';
import StorageGuard from '@/components/StorageGuard';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'RenovApp — Pilotage de rénovation',
  description:
    'Hub central pour planifier, agencer et budgéter votre projet de rénovation : plans, meubles, blueprints, inspirations et suivi des coûts.',
  manifest: './manifest.json',
  applicationName: 'RenovApp',
  appleWebApp: { capable: true, title: 'RenovApp', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: './icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: './icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: './apple-touch-icon.png',
    shortcut: './favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <StorageGuard />
        <ServiceWorkerRegistrar />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="md:ml-[260px] flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
