import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { InspirationImage, InspirationBoard } from '@/types/inspiration';

interface InspirationState {
  images: InspirationImage[];
  boards: InspirationBoard[];
  addImage: (image: Omit<InspirationImage, 'id'>) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, updates: Partial<InspirationImage>) => void;
  addBoard: (name: string) => void;
  removeBoard: (id: string) => void;
  addImageToBoard: (boardId: string, imageId: string) => void;
}

export const useInspirationStore = create<InspirationState>()(
  persist(
    (set) => ({
      images: [],
      boards: [],

      addImage: (image: Omit<InspirationImage, 'id'>) =>
        set((state) => ({
          images: [
            ...state.images,
            {
              ...image,
              id: uuidv4(),
            },
          ],
        })),

      removeImage: (id: string) =>
        set((state) => ({
          images: state.images.filter((img) => img.id !== id),
          boards: state.boards.map((board) => ({
            ...board,
            imageIds: board.imageIds.filter((imgId) => imgId !== id),
          })),
        })),

      updateImage: (id: string, updates: Partial<InspirationImage>) =>
        set((state) => ({
          images: state.images.map((img) =>
            img.id === id ? { ...img, ...updates } : img
          ),
        })),

      addBoard: (name: string) =>
        set((state) => ({
          boards: [
            ...state.boards,
            {
              id: uuidv4(),
              name,
              imageIds: [],
            },
          ],
        })),

      removeBoard: (id: string) =>
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
        })),

      addImageToBoard: (boardId: string, imageId: string) =>
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  imageIds: b.imageIds.includes(imageId)
                    ? b.imageIds
                    : [...b.imageIds, imageId],
                }
              : b
          ),
        })),
    }),
    {
      name: 'renovapp-inspiration',
    }
  )
);
