'use client';

import { useFurnitureStore } from '@/stores/furnitureStore';
import type { CatalogItem, FurniturePlacement } from '@/types/furniture';

/** A bunk bed sleeps two. Anything else in the 'bed' category sleeps one. */
function sleepingCapacity(item: CatalogItem): number {
  return /superpos|bunk/i.test(item.name) ? 2 : 1;
}

export function countBeds(placements: FurniturePlacement[], catalog: CatalogItem[]): number {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return placements.reduce((total, placement) => {
    const item = byId.get(placement.catalogItemId);
    if (!item || item.category !== 'bed') return total;
    return total + sleepingCapacity(item);
  }, 0);
}

/**
 * Sleeping capacity derived from the beds actually placed on the plan.
 *
 * Before this existed, the ROI took a hand-typed bed count while the plan held
 * its own reality — which is exactly how a floor plan showing 6 beds ends up
 * backing a business case built on 8.
 */
export function useBedCountFromPlan(): number {
  const placements = useFurnitureStore((state) => state.placements);
  const catalog = useFurnitureStore((state) => state.catalog);
  return countBeds(placements, catalog);
}
