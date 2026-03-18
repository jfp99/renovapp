import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'RenovApp - Project Management',
  description: 'Manage your renovation projects efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans">
        <div className="flex h-screen">
          <Sidebar />
          <main className="ml-60 flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
