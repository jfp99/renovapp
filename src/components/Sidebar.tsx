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
} from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Plans',
    href: '/plans',
    icon: <PencilRuler className="w-5 h-5" />,
  },
  {
    name: 'Meubles',
    href: '/furniture',
    icon: <Armchair className="w-5 h-5" />,
  },
  {
    name: 'Blueprints',
    href: '/blueprints',
    icon: <FileImage className="w-5 h-5" />,
  },
  {
    name: 'Inspiration',
    href: '/inspiration',
    icon: <Camera className="w-5 h-5" />,
  },
  {
    name: 'Coûts',
    href: '/costs',
    icon: <Calculator className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 text-white shadow-lg overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">RenovApp</h1>
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {link.icon}
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
