import {
  Armchair,
  BedDouble,
  Calculator,
  Camera,
  FileImage,
  LayoutDashboard,
  PencilRuler,
  ShieldCheck,
} from 'lucide-react';

export interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * Single source of truth for the navigation, shared by the desktop sidebar and
 * the mobile drawer. Keeping two copies is how a section ends up reachable on
 * one form factor and invisible on the other.
 */
export const NAV_LINKS: NavLink[] = [
  { name: 'Tableau de bord', href: '/', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
  { name: 'Plans', href: '/plans', icon: <PencilRuler className="h-[18px] w-[18px]" /> },
  { name: 'Meubles', href: '/furniture', icon: <Armchair className="h-[18px] w-[18px]" /> },
  { name: 'Blueprints', href: '/blueprints', icon: <FileImage className="h-[18px] w-[18px]" /> },
  { name: 'Inspiration', href: '/inspiration', icon: <Camera className="h-[18px] w-[18px]" /> },
  { name: 'Coûts & ROI', href: '/costs', icon: <Calculator className="h-[18px] w-[18px]" /> },
  { name: 'Location', href: '/location', icon: <BedDouble className="h-[18px] w-[18px]" /> },
  { name: 'Conformité', href: '/conformite', icon: <ShieldCheck className="h-[18px] w-[18px]" /> },
];
