'use client';

import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { useCostStore } from '@/stores/costStore';

export interface ProjectExport {
  app: 'renovapp';
  version: number;
  exportedAt: string;
  plans: { floors: unknown; rooms: unknown };
  furniture: { placements: unknown; catalog: unknown };
  blueprints: unknown;
  inspiration: { images: unknown; boards: unknown };
  costs: { categories: unknown; entries: unknown; roiConfig: unknown };
}

const EXPORT_VERSION = 1;

/** Snapshot every store into a single serialisable object. */
export function buildProjectExport(): ProjectExport {
  const plan = usePlanStore.getState();
  const furniture = useFurnitureStore.getState();
  const blueprint = useBlueprintStore.getState();
  const inspiration = useInspirationStore.getState();
  const cost = useCostStore.getState();

  return {
    app: 'renovapp',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    plans: { floors: plan.floors, rooms: plan.rooms },
    furniture: { placements: furniture.placements, catalog: furniture.catalog },
    blueprints: blueprint.blueprints,
    inspiration: { images: inspiration.images, boards: inspiration.boards },
    costs: { categories: cost.categories, entries: cost.entries, roiConfig: cost.roiConfig },
  };
}

/** Trigger a download of the full project as JSON. */
export function downloadProjectExport(): void {
  const data = buildProjectExport();
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

/** Restore every store from a previously exported file. Returns an error string or null. */
export function importProjectExport(json: string): string | null {
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
      useBlueprintStore.setState({ blueprints: (data.blueprints as never) ?? [] });
    }
    if (data.inspiration) {
      useInspirationStore.setState({
        images: (data.inspiration.images as never) ?? [],
        boards: (data.inspiration.boards as never) ?? [],
      });
    }
    if (data.costs) {
      useCostStore.setState({
        categories: (data.costs.categories as never) ?? [],
        entries: (data.costs.entries as never) ?? [],
        ...(data.costs.roiConfig ? { roiConfig: data.costs.roiConfig as never } : {}),
      });
    }
  } catch {
    return "Erreur lors de l'import des données.";
  }
  return null;
}
