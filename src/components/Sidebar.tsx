'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Hammer } from 'lucide-react';
import { NAV_LINKS as navLinks } from '@/lib/nav';
import { IS_READONLY } from '@/lib/readonly';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden md:flex h-screen w-[260px] flex-col bg-ink text-[#b8a88e] border-r border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[70px] border-b border-white/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
          <Hammer className="h-5 w-5 text-[#F4EEE2]" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[18px] font-extrabold text-[#FBF7EF] tracking-tight">RenovApp</p>
          <p className="font-mono text-[9px] uppercase tracking-[.08em] text-[#7d6f59] mt-0.5">Pilotage de réno</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="font-mono px-3 pb-2 text-[9px] font-bold uppercase tracking-[.1em] text-[#6b5e49]">
          Modules
        </p>
        <div className="space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-3 rounded-[9px] px-3 py-2.5 transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-600/[0.16] text-[#FBF7EF]'
                    : 'text-[#b8a88e] hover:bg-white/[0.05] hover:text-[#e5dcc9]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-[3px] bg-accent-500" />
                )}
                <span className="flex-none">{link.icon}</span>
                <span className={`text-[13.5px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-5 py-4">
        <div className="font-mono flex items-center gap-2 text-[10px] text-[#7d6f59]">
          <span className="h-1.5 w-1.5 rounded-full bg-pine-500 shadow-[0_0_0_3px_rgba(46,90,78,0.25)]" />
          {IS_READONLY ? 'Copie en lecture seule' : 'Stockage local actif'}
        </div>
      </div>
    </aside>
  );
}
