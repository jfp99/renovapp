import type { RoomType, Room } from '@/types/plan';

export const ROOM_TYPES: RoomType[] = [
  'bedroom',
  'bathroom',
  'kitchen',
  'common',
  'storage',
  'hallway',
];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: 'Chambre',
  bathroom: 'Salle de bain',
  kitchen: 'Cuisine',
  common: 'Pièce commune',
  storage: 'Rangement',
  hallway: 'Couloir',
};

/** Soft fill colours used on canvases. */
export const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#F0DDC9',
  bathroom: '#DCEBE4',
  kitchen: '#F7E8C9',
  common: '#DCEBE6',
  storage: '#EFE9DD',
  hallway: '#ECE3D2',
};

/** Stronger accent colour matching each type (borders, dots). */
export const ROOM_ACCENT: Record<RoomType, string> = {
  bedroom: '#B4552F',
  bathroom: '#2E5A4E',
  kitchen: '#C98A2E',
  common: '#3E7C6B',
  storage: '#A89A82',
  hallway: '#8A7C66',
};

export function roomLabel(type: RoomType): string {
  return ROOM_TYPE_LABELS[type] ?? type;
}

/** Number of beds a room can host, inferred from furniture placements is done elsewhere. */

export interface RoomCompletion {
  hasPlan: boolean;       // dimensions set (always true once created)
  hasFurniture: boolean;  // at least one placement
  hasBlueprint: boolean;  // linked blueprint
  hasCost: boolean;       // linked cost entry
  hasOpening: boolean;    // at least one door or window
  percent: number;        // 0-100 weighted completion
}

/**
 * Real, deterministic completion score for a room based on cross-module data.
 * Each of the 4 milestones is worth 25%.
 */
export function computeRoomCompletion(
  room: Room,
  opts: {
    furnitureCount: number;
    blueprintCount: number;
    costCount: number;
  }
): RoomCompletion {
  const hasPlan = room.width > 0 && room.height > 0;
  const hasOpening = room.doors.length > 0 || room.windows.length > 0;
  const hasFurniture = opts.furnitureCount > 0;
  const hasBlueprint = opts.blueprintCount > 0;
  const hasCost = opts.costCount > 0;

  const milestones = [
    hasPlan && hasOpening, // plan complete = shape + at least one opening
    hasFurniture,
    hasBlueprint,
    hasCost,
  ];
  const percent = Math.round((milestones.filter(Boolean).length / milestones.length) * 100);

  return { hasPlan, hasOpening, hasFurniture, hasBlueprint, hasCost, percent };
}
