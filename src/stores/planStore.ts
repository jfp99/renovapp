import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Floor, Room, DoorPlacement, WindowPlacement } from '@/types/plan';

interface PlanState {
  floors: Floor[];
  rooms: Room[];
  selectedFloorId: string | null;
  selectedRoomId: string | null;
  addFloor: (name: string) => void;
  removeFloor: (floorId: string) => void;
  addRoom: (floorId: string, room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  addDoor: (roomId: string, door: Omit<DoorPlacement, 'id'>) => void;
  removeDoor: (roomId: string, doorId: string) => void;
  addWindow: (roomId: string, window: Omit<WindowPlacement, 'id'>) => void;
  removeWindow: (roomId: string, windowId: string) => void;
  setSelectedFloor: (floorId: string | null) => void;
  setSelectedRoom: (roomId: string | null) => void;
}

const defaultFloor: Floor = {
  id: 'floor-1',
  name: 'Rez-de-chaussée',
  order: 0,
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      floors: [defaultFloor],
      rooms: [],
      selectedFloorId: 'floor-1',
      selectedRoomId: null,

      addFloor: (name: string) =>
        set((state) => ({
          floors: [
            ...state.floors,
            {
              id: uuidv4(),
              name,
              order: Math.max(...state.floors.map((f) => f.order), -1) + 1,
            },
          ],
        })),

      removeFloor: (floorId: string) =>
        set((state) => ({
          floors: state.floors.filter((f) => f.id !== floorId),
          rooms: state.rooms.filter((r) => r.floorId !== floorId),
          selectedFloorId:
            state.selectedFloorId === floorId
              ? state.floors.find((f) => f.id !== floorId)?.id || null
              : state.selectedFloorId,
        })),

      addRoom: (floorId: string, room: Omit<Room, 'id'>) =>
        set((state) => ({
          rooms: [
            ...state.rooms,
            {
              ...room,
              id: uuidv4(),
              floorId,
            },
          ],
        })),

      updateRoom: (roomId: string, updates: Partial<Room>) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId ? { ...r, ...updates } : r
          ),
        })),

      removeRoom: (roomId: string) =>
        set((state) => ({
          rooms: state.rooms.filter((r) => r.id !== roomId),
          selectedRoomId:
            state.selectedRoomId === roomId ? null : state.selectedRoomId,
        })),

      addDoor: (roomId: string, door: Omit<DoorPlacement, 'id'>) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  doors: [
                    ...r.doors,
                    {
                      ...door,
                      id: uuidv4(),
                    },
                  ],
                }
              : r
          ),
        })),

      removeDoor: (roomId: string, doorId: string) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  doors: r.doors.filter((d) => d.id !== doorId),
                }
              : r
          ),
        })),

      addWindow: (roomId: string, window: Omit<WindowPlacement, 'id'>) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  windows: [
                    ...r.windows,
                    {
                      ...window,
                      id: uuidv4(),
                    },
                  ],
                }
              : r
          ),
        })),

      removeWindow: (roomId: string, windowId: string) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  windows: r.windows.filter((w) => w.id !== windowId),
                }
              : r
          ),
        })),

      setSelectedFloor: (floorId: string | null) =>
        set({ selectedFloorId: floorId }),

      setSelectedRoom: (roomId: string | null) =>
        set({ selectedRoomId: roomId }),
    }),
    {
      name: 'renovapp-plans',
    }
  )
);
