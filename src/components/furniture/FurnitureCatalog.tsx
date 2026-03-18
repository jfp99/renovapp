'use client';

import { useFurnitureStore } from '@/stores/furnitureStore';
import { usePlanStore } from '@/stores/planStore';
import { CatalogItem, FurnitureCategory } from '@/types/furniture';
import {
  Bed,
  Package,
  Monitor,
  Circle,
  Utensils,
  Droplets,
  UtensilsCrossed,
} from 'lucide-react';

const categoryConfig: Record<
  FurnitureCategory,
  { label: string; icon: React.ReactNode }
> = {
  bed: { label: 'Lits', icon: <Bed className="w-4 h-4" /> },
  storage: { label: 'Rangements', icon: <Package className="w-4 h-4" /> },
  desk: { label: 'Bureaux', icon: <Monitor className="w-4 h-4" /> },
  chair: { label: 'Chaises', icon: <Circle className="w-4 h-4" /> },
  table: { label: 'Tables', icon: <Utensils className="w-4 h-4" /> },
  bathroom: { label: 'Salle de bain', icon: <Droplets className="w-4 h-4" /> },
  kitchen: { label: 'Cuisine', icon: <UtensilsCrossed className="w-4 h-4" /> },
};

export default function FurnitureCatalog() {
  const { catalog, addPlacement } = useFurnitureStore();
  const { selectedRoomId, rooms } = usePlanStore();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  if (!selectedRoom) return null;

  // Group catalog by category
  const groupedByCategory = catalog.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<FurnitureCategory, CatalogItem[]>
  );

  const handleAddItem = (item: CatalogItem) => {
    const centerX = (selectedRoom.width * 2) / 2 - item.defaultWidth; // SCALE=2, center horizontally
    const centerY = (selectedRoom.height * 2) / 2 - item.defaultHeight; // center vertically

    addPlacement({
      roomId: selectedRoom.id,
      catalogItemId: item.id,
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      rotation: 0,
      width: item.defaultWidth,
      height: item.defaultHeight,
    });
  };

  return (
    <div className="p-4 space-y-4">
      {Object.entries(groupedByCategory)
        .filter(([_, items]) => items.length > 0)
        .map(([category, items]) => {
          const config = categoryConfig[category as FurnitureCategory];
          return (
            <div key={category}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                {config.icon}
                {config.label}
              </h3>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-900 text-sm transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500">
                        {item.defaultWidth}×{item.defaultHeight}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
