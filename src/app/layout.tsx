import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Sidebar from '@/components/Sidebar';
import StorageGuard from '@/components/StorageGuard';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import AutoSave from '@/components/AutoSave';
import './globals.css';

/**
 * Fonts are committed to the repo and loaded from disk, not fetched from Google
 * at build time. `next/font/google` needs network access during `next build` —
 * and this app rebuilds itself whenever `out/` is missing, so a build on a bad
 * connection would leave you unable to open it at all. Offline-first has to
 * hold for the build too, not just the runtime.
 */
const display = localFont({
  variable: '--font-display-atelier',
  display: 'swap',
  src: [
    { path: '../fonts/bricolage-grotesque-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/bricolage-grotesque-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/bricolage-grotesque-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
});

const sans = localFont({
  variable: '--font-sans-atelier',
  display: 'swap',
  src: [
    { path: '../fonts/hanken-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
});

const mono = localFont({
  variable: '--font-mono-atelier',
  display: 'swap',
  src: [{ path: '../fonts/space-mono-latin-400-normal.woff2', weight: '400', style: 'normal' }],
});

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
  themeColor: '#B4552F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <StorageGuard />
        <ServiceWorkerRegistrar />
        <AutoSave />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="md:ml-[260px] flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
