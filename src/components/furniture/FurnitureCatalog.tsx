'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { usePlanStore } from '@/stores/planStore';
import { CatalogItem, FurnitureCategory } from '@/types/furniture';
import {
  Bed,
  Package,
  Monitor,
  Armchair,
  Table,
  Droplets,
  UtensilsCrossed,
  Plus,
  Search,
} from 'lucide-react';

const categoryConfig: Record<FurnitureCategory, { label: string; icon: React.ReactNode }> = {
  bed: { label: 'Lits', icon: <Bed className="w-4 h-4" /> },
  storage: { label: 'Rangements', icon: <Package className="w-4 h-4" /> },
  desk: { label: 'Bureaux', icon: <Monitor className="w-4 h-4" /> },
  chair: { label: 'Assises', icon: <Armchair className="w-4 h-4" /> },
  table: { label: 'Tables', icon: <Table className="w-4 h-4" /> },
  bathroom: { label: 'Salle de bain', icon: <Droplets className="w-4 h-4" /> },
  kitchen: { label: 'Cuisine', icon: <UtensilsCrossed className="w-4 h-4" /> },
};

const ORDER: FurnitureCategory[] = ['bed', 'storage', 'desk', 'chair', 'table', 'bathroom', 'kitchen'];

export default function FurnitureCatalog() {
  const { catalog, addPlacement } = useFurnitureStore();
  const { selectedRoomId, rooms } = usePlanStore();
  const [query, setQuery] = useState('');

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  if (!selectedRoom) return null;

  const filtered = catalog.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  const grouped = filtered.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const handleAdd = (item: CatalogItem) => {
    const cx = Math.max(0, (selectedRoom.width * 2) / 2 - item.defaultWidth);
    const cy = Math.max(0, (selectedRoom.height * 2) / 2 - item.defaultHeight);
    addPlacement({
      roomId: selectedRoom.id,
      catalogItemId: item.id,
      x: cx,
      y: cy,
      rotation: 0,
      width: item.defaultWidth,
      height: item.defaultHeight,
    });
  };

  return (
    <div className="p-4">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un meuble…"
          className="input pl-8 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-4">
        {ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <div key={cat}>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {categoryConfig[cat].icon}
              {categoryConfig[cat].label}
            </h3>
            <div className="space-y-1">
              {grouped[cat].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAdd(item)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition-all hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="h-7 w-7 flex-shrink-0 rounded-md border border-black/5" style={{ background: item.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                    <span className="block text-[11px] text-ink-faint">{item.defaultWidth} × {item.defaultHeight} cm</span>
                  </span>
                  <Plus className="h-4 w-4 flex-shrink-0 text-ink-faint transition-colors group-hover:text-brand-600" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">Aucun meuble trouvé.</p>
        )}
      </div>
    </div>
  );
}
