export type RoomType = 'bedroom' | 'bathroom' | 'kitchen' | 'common' | 'storage' | 'hallway';

export interface Room {
  id: string;
  floorId: string;
  name: string;
  type: RoomType;
  x: number; // position on canvas in pixels
  y: number;
  width: number; // dimensions in cm
  height: number; // dimensions in cm
  color: string;
  doors: DoorPlacement[];
  windows: WindowPlacement[];
}

export interface DoorPlacement {
  id: string;
  wall: 'top' | 'bottom' | 'left' | 'right';
  position: number; // 0-1 along the wall
  width: number; // cm
}

export interface WindowPlacement {
  id: string;
  wall: 'top' | 'bottom' | 'left' | 'right';
  position: number;
  width: number; // cm
}

export interface Floor {
  id: string;
  name: string;
  order: number;
}
