'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  PencilRuler,
  Armchair,
  FileImage,
  Camera,
  Calculator,
  Hammer,
} from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  desc: string;
}

const navLinks: NavLink[] = [
  { name: 'Tableau de bord', href: '/', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, desc: "Vue d'ensemble" },
  { name: 'Plans', href: '/plans', icon: <PencilRuler className="w-[18px] h-[18px]" />, desc: 'Éditeur de pièces' },
  { name: 'Meubles', href: '/furniture', icon: <Armchair className="w-[18px] h-[18px]" />, desc: 'Aménagement' },
  { name: 'Blueprints', href: '/blueprints', icon: <FileImage className="w-[18px] h-[18px]" />, desc: 'Plans techniques' },
  { name: 'Inspiration', href: '/inspiration', icon: <Camera className="w-[18px] h-[18px]" />, desc: 'Moodboard' },
  { name: 'Coûts & ROI', href: '/costs', icon: <Calculator className="w-[18px] h-[18px]" />, desc: 'Budget & rentabilité' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden md:flex h-screen w-[260px] flex-col bg-[#0c1322] text-slate-300 border-r border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
          <Hammer className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white tracking-tight">RenovApp</p>
          <p className="text-[11px] text-slate-500">Pilotage de rénovation</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Modules
        </p>
        <div className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.07] text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />
                )}
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {link.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{link.name}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">{link.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Données stockées localement
        </div>
        <p className="mt-1 text-[11px] text-slate-600">Maison Philippines · Dortoirs</p>
      </div>
    </aside>
  );
}
