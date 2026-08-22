'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Hammer, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '@/lib/nav';
import { IS_READONLY } from '@/lib/readonly';

/**
 * The desktop <Sidebar> is `hidden md:flex`, so before this component existed a
 * phone got NO navigation at all — every page was reachable only by typing its
 * URL. This is the mobile counterpart: a compact top bar plus a full-screen
 * drawer, with 48px touch targets.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on navigation, otherwise the drawer stays over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Don't let the page behind scroll while the drawer is up.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const current = NAV_LINKS.find((l) => l.href === pathname);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/5 bg-ink px-3 pt-[env(safe-area-inset-top)] text-[#F4EEE2] md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl hover:bg-white/10 active:bg-white/15"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-600">
            <Hammer className="h-4 w-4 text-[#F4EEE2]" />
          </div>
          <span className="truncate font-display text-[15px] font-extrabold tracking-tight">
            {current ? current.name : 'RenovApp'}
          </span>
        </div>
        {IS_READONLY && (
          <span className="flex-none rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider">
            Lecture
          </span>
        )}
      </header>

      {/* Spacer so page content is never hidden under the fixed bar. */}
      <div className="h-14 pt-[env(safe-area-inset-top)] md:hidden" aria-hidden="true" />

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink/60 backdrop-blur-sm"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-ink text-[#b8a88e] shadow-float">
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4 pt-[env(safe-area-inset-top)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                  <Hammer className="h-4.5 w-4.5 text-[#F4EEE2]" />
                </div>
                <p className="font-display text-[17px] font-extrabold tracking-tight text-[#FBF7EF]">
                  RenovApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#b8a88e] hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex min-h-[48px] items-center gap-3 rounded-xl px-3 ${
                      isActive
                        ? 'bg-brand-600/[0.18] font-semibold text-[#FBF7EF]'
                        : 'text-[#b8a88e] active:bg-white/[0.06]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-accent-500" />
                    )}
                    <span className="flex-none">{link.icon}</span>
                    <span className="text-[15px]">{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-white/5 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <p className="font-mono text-[10px] text-[#7d6f59]">
                {IS_READONLY ? 'Copie en lecture seule' : 'Stockage local actif'}
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
