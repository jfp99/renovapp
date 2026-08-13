'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { putMediaDataUrl, isMediaAvailable } from '@/lib/mediaDb';
import { STORAGE_ERROR_EVENT, type StorageErrorDetail } from '@/lib/safeStorage';

/**
 * Two jobs, both about not losing the user's data:
 *
 * 1. Migrate legacy inline base64 payloads (blueprints / inspiration images
 *    created before the IndexedDB switch) out of localStorage and into Dexie.
 *    This runs on every mount and is idempotent — records that already carry a
 *    `fileId` are skipped.
 * 2. Surface storage write failures. They used to be swallowed entirely, which
 *    is how a full localStorage quietly discarded everything typed after it.
 */
export default function StorageGuard() {
  const [error, setError] = useState<StorageErrorDetail | null>(null);
  const [migrated, setMigrated] = useState(0);

  useEffect(() => {
    const onError = (event: Event) => {
      setError((event as CustomEvent<StorageErrorDetail>).detail);
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onError);
  }, []);

  useEffect(() => {
    if (!isMediaAvailable()) return;
    let cancelled = false;

    // Let zustand finish rehydrating before touching the stores.
    const timer = window.setTimeout(async () => {
      let moved = 0;

      try {
        const blueprints = useBlueprintStore.getState().blueprints;
        for (const blueprint of blueprints) {
          if (cancelled) return;
          if (!blueprint.fileData || blueprint.fileId) continue;
          const fileId = await putMediaDataUrl(blueprint.fileData, blueprint.name || 'blueprint');
          useBlueprintStore
            .getState()
            .updateBlueprint(blueprint.id, { fileId, fileData: undefined });
          moved += 1;
        }

        const images = useInspirationStore.getState().images;
        for (const image of images) {
          if (cancelled) return;
          if (!image.fileData || image.fileId) continue;
          const fileId = await putMediaDataUrl(image.fileData, 'inspiration');
          useInspirationStore.getState().updateImage(image.id, { fileId, fileData: undefined });
          moved += 1;
        }
      } catch (migrationError) {
        console.error('[RenovApp] Migration des médias interrompue :', migrationError);
      }

      if (!cancelled && moved > 0) {
        setMigrated(moved);
        window.setTimeout(() => setMigrated(0), 6000);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (error) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100] border-b border-red-200 bg-red-50 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-red-800">
              {error.quotaExceeded
                ? 'Stockage saturé — vos dernières modifications ne sont pas sauvegardées'
                : "Échec d'écriture du stockage local"}
            </p>
            <p className="mt-0.5 text-red-700">
              {error.quotaExceeded
                ? 'Exportez votre projet immédiatement (bouton « Sauvegarder »), puis supprimez des images pour libérer de la place.'
                : error.message}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-red-600 hover:bg-red-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (migrated > 0) {
    return (
      <div className="fixed bottom-5 right-5 z-[100] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-card">
        {migrated} fichier{migrated > 1 ? 's' : ''} déplacé{migrated > 1 ? 's' : ''} vers le stockage
        durable.
      </div>
    );
  }

  return null;
}
