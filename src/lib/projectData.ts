'use client';

import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { useCostStore } from '@/stores/costStore';
import { useTenancyStore } from '@/stores/tenancyStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useComplianceStore } from '@/stores/complianceStore';
import { useWorkLogStore } from '@/stores/workLogStore';
import { getMediaDataUrl, putMediaDataUrl } from '@/lib/mediaDb';
import type { Blueprint } from '@/types/blueprint';
import type { InspirationImage } from '@/types/inspiration';
import { todayIso } from './localDate';

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
  compliance?: { permits: unknown; settings: unknown };
  worklog?: { tasks: unknown };
}

/**
 * v2: media payloads live in IndexedDB, so the export has to inline them again
 * as base64 — otherwise the backup file would reference blobs it doesn't carry
 * and restoring on another machine would produce an album of broken images.
 */
/**
 * v5 adds the Chantier work log and inlines receipt photos and permit
 * documents, which until then stayed in the browser only and were lost with it.
 * v4 added compliance tracking; v3 tenancy and ROI scenarios.
 */
const EXPORT_VERSION = 5;

/** Inline the IndexedDB payload behind `idKey` as `dataKey`, for the backup file. */
async function inlineMedia<T extends object>(items: T[], idKey: keyof T, dataKey: string): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const id = item[idKey] as unknown as string | undefined;
      if (!id) return item;
      const data = await getMediaDataUrl(id).catch(() => undefined);
      return data ? { ...item, [dataKey]: data } : item;
    })
  );
}

/** Reverse of inlineMedia: store the payload in IndexedDB and keep only the id. */
async function storeInlinedMedia<T extends object>(
  items: T[],
  idKey: string,
  dataKey: string,
  label: string
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const record = item as Record<string, unknown>;
      const data = record[dataKey] as string | undefined;
      if (!data) return item;
      const { [dataKey]: _dropped, ...rest } = record;
      try {
        return { ...rest, [idKey]: await putMediaDataUrl(data, label) } as T;
      } catch {
        return rest as T;
      }
    })
  );
}

/** Snapshot every store into a single serialisable object, media included. */
export async function buildProjectExport(): Promise<ProjectExport> {
  const plan = usePlanStore.getState();
  const furniture = useFurnitureStore.getState();
  const blueprint = useBlueprintStore.getState();
  const inspiration = useInspirationStore.getState();
  const cost = useCostStore.getState();
  const tenancy = useTenancyStore.getState();
  const scenario = useScenarioStore.getState();
  const compliance = useComplianceStore.getState();
  const worklog = useWorkLogStore.getState();

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
      entries: await inlineMedia(cost.entries, 'receiptFileId', 'receiptData'),
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
    compliance: {
      permits: await inlineMedia(compliance.permits, 'fileId', 'fileData'),
      settings: compliance.settings,
    },
    worklog: { tasks: worklog.tasks },
  };
}

/** Trigger a download of the full project as JSON. */
export async function downloadProjectExport(): Promise<void> {
  const data = await buildProjectExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = todayIso();
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
        entries: (await storeInlinedMedia(
          (data.costs.entries as object[]) ?? [],
          'receiptFileId',
          'receiptData',
          'receipt'
        )) as never,
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
    if (data.compliance) {
      useComplianceStore.setState({
        permits: (await storeInlinedMedia(
          (data.compliance.permits as object[]) ?? [],
          'fileId',
          'fileData',
          'permit'
        )) as never,
        ...(data.compliance.settings ? { settings: data.compliance.settings as never } : {}),
      });
    }
    if (data.worklog) {
      useWorkLogStore.setState({ tasks: (data.worklog.tasks as never) ?? [] });
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
