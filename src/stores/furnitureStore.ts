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
  getPlacementsByRoom: (roomId: string) => FurniturePlacement[];
}

const defaultCatalog: CatalogItem[] = [
  {
    id: uuidv4(),
    name: 'Lit simple',
    category: 'bed',
    defaultWidth: 90,
    defaultHeight: 200,
    color: '#D4A574',
  },
  {
    id: uuidv4(),
    name: 'Lit double',
    category: 'bed',
    defaultWidth: 140,
    defaultHeight: 200,
    color: '#D4A574',
  },
  {
    id: uuidv4(),
    name: 'Armoire',
    category: 'storage',
    defaultWidth: 60,
    defaultHeight: 80,
    color: '#8B4513',
  },
  {
    id: uuidv4(),
    name: 'Bureau',
    category: 'desk',
    defaultWidth: 120,
    defaultHeight: 60,
    color: '#8B4513',
  },
  {
    id: uuidv4(),
    name: 'Chaise',
    category: 'chair',
    defaultWidth: 45,
    defaultHeight: 45,
    color: '#A0522D',
  },
  {
    id: uuidv4(),
    name: 'Table',
    category: 'table',
    defaultWidth: 120,
    defaultHeight: 80,
    color: '#8B4513',
  },
  {
    id: uuidv4(),
    name: 'Étagère',
    category: 'storage',
    defaultWidth: 80,
    defaultHeight: 30,
    color: '#8B4513',
  },
  {
    id: uuidv4(),
    name: 'Commode',
    category: 'storage',
    defaultWidth: 80,
    defaultHeight: 45,
    color: '#8B4513',
  },
  {
    id: uuidv4(),
    name: 'Lavabo',
    category: 'bathroom',
    defaultWidth: 60,
    defaultHeight: 45,
    color: '#E8E8E8',
  },
  {
    id: uuidv4(),
    name: 'WC',
    category: 'bathroom',
    defaultWidth: 40,
    defaultHeight: 60,
    color: '#E8E8E8',
  },
  {
    id: uuidv4(),
    name: 'Douche',
    category: 'bathroom',
    defaultWidth: 90,
    defaultHeight: 90,
    color: '#E8E8E8',
  },
  {
    id: uuidv4(),
    name: 'Évier cuisine',
    category: 'kitchen',
    defaultWidth: 80,
    defaultHeight: 60,
    color: '#E8E8E8',
  },
  {
    id: uuidv4(),
    name: 'Plan de travail',
    category: 'kitchen',
    defaultWidth: 180,
    defaultHeight: 60,
    color: '#D3D3D3',
  },
  {
    id: uuidv4(),
    name: 'Réfrigérateur',
    category: 'kitchen',
    defaultWidth: 60,
    defaultHeight: 60,
    color: '#C0C0C0',
  },
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

      getPlacementsByRoom: (roomId: string) => {
        return get().placements.filter((p) => p.roomId === roomId);
      },
    }),
    {
      name: 'renovapp-furniture',
    }
  )
);
