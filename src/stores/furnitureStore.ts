import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CatalogItem, FurniturePlacement } from '@/types/furniture';

interface FurnitureState {
  placements: FurniturePlacement[];
  catalog: CatalogItem[];
  addPlacement: (placement: Omit<FurniturePlacement, 'id'>) => void;
  updatePlacement: (id: string, updates: Partial<FurniturePlacement>) => void;
  removePlacement: (id: string) => void;
  duplicatePlacement: (id: string) => void;
  getPlacementsByRoom: (roomId: string) => FurniturePlacement[];
}

const mk = (
  name: string,
  category: CatalogItem['category'],
  defaultWidth: number,
  defaultHeight: number,
  color: string
): CatalogItem => ({ id: uuidv4(), name, category, defaultWidth, defaultHeight, color });

const defaultCatalog: CatalogItem[] = [
  // Beds — essential for dorms
  mk('Lit simple', 'bed', 90, 200, '#93c5fd'),
  mk('Lit superposé', 'bed', 90, 200, '#60a5fa'),
  mk('Lit double', 'bed', 140, 200, '#3b82f6'),
  // Storage
  mk('Casier / Locker', 'storage', 40, 50, '#c4b5fd'),
  mk('Armoire', 'storage', 100, 60, '#a78bfa'),
  mk('Commode', 'storage', 80, 45, '#8b5cf6'),
  mk('Étagère', 'storage', 80, 30, '#a78bfa'),
  // Desk & seating
  mk('Bureau', 'desk', 120, 60, '#fdba74'),
  mk('Table de chevet', 'desk', 40, 40, '#fb923c'),
  mk('Chaise', 'chair', 45, 45, '#fcd34d'),
  mk('Table', 'table', 120, 80, '#f59e0b'),
  // Bathroom
  mk('Lavabo', 'bathroom', 60, 45, '#67e8f9'),
  mk('WC', 'bathroom', 40, 60, '#22d3ee'),
  mk('Douche', 'bathroom', 90, 90, '#06b6d4'),
  // Kitchen
  mk('Évier cuisine', 'kitchen', 80, 60, '#6ee7b7'),
  mk('Plan de travail', 'kitchen', 180, 60, '#34d399'),
  mk('Réfrigérateur', 'kitchen', 60, 60, '#10b981'),
];

export const useFurnitureStore = create<FurnitureState>()(
  persist(
    (set, get) => ({
      placements: [],
      catalog: defaultCatalog,

      addPlacement: (placement: Omit<FurniturePlacement, 'id'>) =>
        set((state) => ({
          placements: [
            ...state.placements,
            {
              ...placement,
              id: uuidv4(),
            },
          ],
        })),

      updatePlacement: (id: string, updates: Partial<FurniturePlacement>) =>
        set((state) => ({
          placements: state.placements.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removePlacement: (id: string) =>
        set((state) => ({
          placements: state.placements.filter((p) => p.id !== id),
        })),

      duplicatePlacement: (id: string) =>
        set((state) => {
          const src = state.placements.find((p) => p.id === id);
          if (!src) return {};
          return {
            placements: [
              ...state.placements,
              {
                ...src,
                id: uuidv4(),
                x: src.x + 20,
                y: src.y + 20,
                customLabel: src.customLabel ? `${src.customLabel} (copie)` : undefined,
              },
            ],
          };
        }),

      getPlacementsByRoom: (roomId: string) => {
        return get().placements.filter((p) => p.roomId === roomId);
      },
    }),
    {
      name: 'renovapp-furniture',
    }
  )
);
