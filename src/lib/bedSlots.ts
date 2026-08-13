'use client';

import { useFurnitureStore } from '@/stores/furnitureStore';
import { usePlanStore } from '@/stores/planStore';
import type { CatalogItem, FurniturePlacement } from '@/types/furniture';
import type { Room } from '@/types/plan';
import type { BedSlot } from '@/types/tenancy';

export function isBunk(item: CatalogItem): boolean {
  return /superpos|bunk/i.test(item.name);
}

/**
 * Turn the beds drawn on the plan into rentable sleeping places.
 *
 * This is what lets occupancy be measured rather than assumed: every slot here
 * can be occupied by exactly one tenancy at a time.
 */
export function buildBedSlots(
  placements: FurniturePlacement[],
  catalog: CatalogItem[],
  rooms: Room[]
): BedSlot[] {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const slots: BedSlot[] = [];

  placements.forEach((placement) => {
    const item = catalogById.get(placement.catalogItemId);
    if (!item || item.category !== 'bed') return;

    const room = roomById.get(placement.roomId);
    const roomName = room?.name ?? 'Pièce inconnue';
    const bunk = isBunk(item);
    const base = placement.customLabel?.trim() || item.name;

    const levels = bunk ? 2 : 1;
    for (let level = 0; level < levels; level += 1) {
      slots.push({
        id: `${placement.id}#${level}`,
        placementId: placement.id,
        level,
        label: bunk ? `${base} — ${level === 0 ? 'bas' : 'haut'}` : base,
        roomId: placement.roomId,
        roomName,
        isBunk: bunk,
      });
    }
  });

  return slots.sort((a, b) => a.roomName.localeCompare(b.roomName) || a.label.localeCompare(b.label));
}

export function useBedSlots(): BedSlot[] {
  const placements = useFurnitureStore((state) => state.placements);
  const catalog = useFurnitureStore((state) => state.catalog);
  const rooms = usePlanStore((state) => state.rooms);
  return buildBedSlots(placements, catalog, rooms);
}
