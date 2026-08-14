'use client';

import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { useCostStore } from '@/stores/costStore';
import { useTenancyStore } from '@/stores/tenancyStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { getMediaDataUrl, putMediaDataUrl } from '@/lib/mediaDb';
import type { Blueprint } from '@/types/blueprint';
import type { InspirationImage } from '@/types/inspiration';

export interface ProjectExport {
  app: 'renovapp';
  version: number;
  exportedAt: string;
  plans: { floors: unknown; rooms: unknown };
  furniture: { placements: unknown; catalog: unknown };
  blueprints: unknown;
  inspiration: { images: unknown; boards: unknown };
  costs: { categories: unknown; entries: unknown; roiConfig: unknown; settings?: unknown };
  tenancy?: { tenants: unknown; tenancies: unknown; payments: unknown; maintenance: unknown };
  scenarios?: { scenarios: unknown; activeId: unknown };
}

/**
 * v2: media payloads live in IndexedDB, so the export has to inline them again
 * as base64 — otherwise the backup file would reference blobs it doesn't carry
 * and restoring on another machine would produce an album of broken images.
 */
/** v3 adds tenancy and ROI scenarios — v2 exports silently dropped both. */
const EXPORT_VERSION = 3;

/** Snapshot every store into a single serialisable object, media included. */
export async function buildProjectExport(): Promise<ProjectExport> {
  const plan = usePlanStore.getState();
  const furniture = useFurnitureStore.getState();
  const blueprint = useBlueprintStore.getState();
  const inspiration = useInspirationStore.getState();
  const cost = useCostStore.getState();
  const tenancy = useTenancyStore.getState();
  const scenario = useScenarioStore.getState();

  const blueprints = await Promise.all(
    blueprint.blueprints.map(async (item) => ({
      ...item,
      fileData: item.fileData ?? (item.fileId ? await getMediaDataUrl(item.fileId) : undefined),
    }))
  );

  const images = await Promise.all(
    inspiration.images.map(async (item) => ({
      ...item,
      fileData: item.fileData ?? (item.fileId ? await getMediaDataUrl(item.fileId) : undefined),
    }))
  );

  return {
    app: 'renovapp',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    plans: { floors: plan.floors, rooms: plan.rooms },
    furniture: { placements: furniture.placements, catalog: furniture.catalog },
    blueprints,
    inspiration: { images, boards: inspiration.boards },
    costs: {
      categories: cost.categories,
      entries: cost.entries,
      roiConfig: cost.roiConfig,
      settings: cost.settings,
    },
    tenancy: {
      tenants: tenancy.tenants,
      tenancies: tenancy.tenancies,
      payments: tenancy.payments,
      maintenance: tenancy.maintenance,
    },
    scenarios: { scenarios: scenario.scenarios, activeId: scenario.activeId },
  };
}

/** Trigger a download of the full project as JSON. */
export async function downloadProjectExport(): Promise<void> {
  const data = await buildProjectExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `renovapp-projet-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Move any inlined base64 back into IndexedDB and keep only the reference. */
async function rehydrateMedia<T extends { fileId?: string; fileData?: string }>(
  items: T[],
  label: string
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.fileData) return item;
      try {
        const fileId = await putMediaDataUrl(item.fileData, label);
        return { ...item, fileId, fileData: undefined };
      } catch {
        // Storing failed — keep the inline copy so the image is at least visible.
        return item;
      }
    })
  );
}

/** Restore every store from a previously exported file. Returns an error string or null. */
export async function importProjectExport(json: string): Promise<string | null> {
  let data: Partial<ProjectExport>;
  try {
    data = JSON.parse(json);
  } catch {
    return 'Fichier illisible (JSON invalide).';
  }
  if (!data || data.app !== 'renovapp') {
    return "Ce fichier n'est pas une sauvegarde RenovApp.";
  }

  try {
    if (data.plans) {
      usePlanStore.setState({
        floors: (data.plans.floors as never) ?? [],
        rooms: (data.plans.rooms as never) ?? [],
      });
    }
    if (data.furniture) {
      useFurnitureStore.setState({
        placements: (data.furniture.placements as never) ?? [],
        ...(data.furniture.catalog ? { catalog: data.furniture.catalog as never } : {}),
      });
    }
    if (data.blueprints) {
      const restored = await rehydrateMedia((data.blueprints as Blueprint[]) ?? [], 'blueprint');
      useBlueprintStore.setState({ blueprints: restored as never });
    }
    if (data.inspiration) {
      const restored = await rehydrateMedia(
        (data.inspiration.images as InspirationImage[]) ?? [],
        'inspiration'
      );
      useInspirationStore.setState({
        images: restored as never,
        boards: (data.inspiration.boards as never) ?? [],
      });
    }
    if (data.costs) {
      useCostStore.setState({
        categories: (data.costs.categories as never) ?? [],
        entries: (data.costs.entries as never) ?? [],
        ...(data.costs.roiConfig ? { roiConfig: data.costs.roiConfig as never } : {}),
        ...(data.costs.settings ? { settings: data.costs.settings as never } : {}),
      });
    }
    if (data.tenancy) {
      useTenancyStore.setState({
        tenants: (data.tenancy.tenants as never) ?? [],
        tenancies: (data.tenancy.tenancies as never) ?? [],
        payments: (data.tenancy.payments as never) ?? [],
        maintenance: (data.tenancy.maintenance as never) ?? [],
      });
    }
    if (data.scenarios) {
      const list = (data.scenarios.scenarios as Array<{ id: string }>) ?? [];
      if (list.length > 0) {
        useScenarioStore.setState({
          scenarios: list as never,
          activeId: (data.scenarios.activeId as string) ?? list[0].id,
        });
      }
    }
  } catch {
    return "Erreur lors de l'import des données.";
  }
  return null;
}
