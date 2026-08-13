import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safeStorage';
import { deleteMedia } from '@/lib/mediaDb';
import { v4 as uuidv4 } from 'uuid';
import { Blueprint } from '@/types/blueprint';

interface BlueprintState {
  blueprints: Blueprint[];
  addBlueprint: (blueprint: Omit<Blueprint, 'id'>) => void;
  updateBlueprint: (id: string, updates: Partial<Blueprint>) => void;
  removeBlueprint: (id: string) => void;
  getBlueprintsByRoom: (roomId: string) => Blueprint[];
}

export const useBlueprintStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      blueprints: [],

      addBlueprint: (blueprint: Omit<Blueprint, 'id'>) =>
        set((state) => ({
          blueprints: [
            ...state.blueprints,
            {
              ...blueprint,
              id: uuidv4(),
            },
          ],
        })),

      updateBlueprint: (id: string, updates: Partial<Blueprint>) =>
        set((state) => ({
          blueprints: state.blueprints.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      removeBlueprint: (id: string) => {
        const target = get().blueprints.find((b) => b.id === id);
        if (target?.fileId) void deleteMedia(target.fileId);
        set((state) => ({
          blueprints: state.blueprints.filter((b) => b.id !== id),
        }));
      },

      getBlueprintsByRoom: (roomId: string) => {
        return get().blueprints.filter((b) =>
          b.linkedRoomIds.includes(roomId)
        );
      },
    }),
    {
      name: 'renovapp-blueprints',
      storage: createJSONStorage(() => safeStorage),
      // Never let full-resolution payloads reach localStorage.
      partialize: (state) => ({
        blueprints: state.blueprints.map(({ fileData: _fileData, ...rest }) => rest),
      }),
    }
  )
);
