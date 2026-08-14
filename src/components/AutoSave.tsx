'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CloudOff, HardDriveDownload, Check, Loader2, AlertTriangle } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { useInspirationStore } from '@/stores/inspirationStore';
import { useCostStore } from '@/stores/costStore';
import { useTenancyStore } from '@/stores/tenancyStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import {
  hasContent,
  hasLocalData,
  isDiskSyncAvailable,
  loadFromDisk,
  restoreFromDisk,
  saveToDisk,
  saveToDiskOnUnload,
  type SyncState,
} from '@/lib/diskSync';

const DEBOUNCE_MS = 2500;

/**
 * Keeps the project mirrored to a file on disk.
 *
 * The browser is no longer the only copy: clearing site data, a quota error or
 * a privacy setting used to be enough to lose everything. Disk is now the
 * durable store, the browser a working cache in front of it.
 *
 * Restore is deliberately one-way and conservative: the disk copy is only
 * pulled in when the browser holds nothing at all, so a save can never
 * overwrite work you have in front of you.
 */
export default function AutoSave() {
  const [state, setState] = useState<SyncState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const ready = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(async () => {
    setState('saving');
    try {
      const at = await saveToDisk();
      setSavedAt(at);
      setState('saved');
    } catch (error) {
      console.error('[RenovApp] Sauvegarde disque impossible :', error);
      setState('error');
    }
  }, []);

  // First pass: is the server there, and does the browser need seeding?
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const available = await isDiskSyncAvailable();
      if (cancelled) return;

      if (!available) {
        setState('unavailable');
        return;
      }

      if (!hasLocalData()) {
        const disk = await loadFromDisk();
        if (cancelled) return;
        // Restoring an empty snapshot is pointless and costs a page reload
        // that would discard anything typed in the meantime.
        if (hasContent(disk)) {
          const error = await restoreFromDisk(disk);
          if (!error) {
            setRestored(true);
            // Stores were replaced wholesale; reload so every view rebinds.
            window.setTimeout(() => window.location.reload(), 1400);
            return;
          }
        }
      }

      ready.current = true;
      setState('idle');

      // Stores rehydrate without emitting a change, so nothing would trigger
      // the first write. Mirror the current state once, right away.
      if (hasLocalData()) void flush();
    })();

    return () => {
      cancelled = true;
    };
  }, [flush]);

  // Mirror every store change to disk, debounced.
  useEffect(() => {
    const schedule = () => {
      if (!ready.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, DEBOUNCE_MS);
    };

    const unsubscribers = [
      usePlanStore.subscribe(schedule),
      useFurnitureStore.subscribe(schedule),
      useBlueprintStore.subscribe(schedule),
      useInspirationStore.subscribe(schedule),
      useCostStore.subscribe(schedule),
      useTenancyStore.subscribe(schedule),
      useScenarioStore.subscribe(schedule),
    ];

    // A pending save must not be lost when the window closes. fetch would be
    // cancelled by the unload; sendBeacon is delivered anyway.
    const onHide = () => {
      if (!ready.current) return;
      window.clearTimeout(timer.current);
      void saveToDiskOnUnload();
    };
    window.addEventListener('pagehide', onHide);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      window.removeEventListener('pagehide', onHide);
      window.clearTimeout(timer.current);
    };
  }, [flush]);

  if (restored) {
    return (
      <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-xl border border-pine-100 bg-pine-50 px-4 py-3 text-sm text-pine-700 shadow-card">
        <HardDriveDownload className="h-4 w-4" />
        Projet restauré depuis le disque. Rechargement…
      </div>
    );
  }

  const label =
    state === 'saving' ? (
      <>
        <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde…
      </>
    ) : state === 'saved' ? (
      <>
        <Check className="h-3 w-3" />
        Sauvegardé{savedAt ? ` à ${new Date(savedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </>
    ) : state === 'error' ? (
      <>
        <AlertTriangle className="h-3 w-3" /> Sauvegarde disque en échec
      </>
    ) : state === 'unavailable' ? (
      <>
        <CloudOff className="h-3 w-3" /> Navigateur uniquement
      </>
    ) : null;

  if (!label) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-[90] flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-card ${
        state === 'error'
          ? 'border border-red-200 bg-red-50 text-red-700'
          : state === 'unavailable'
            ? 'border border-[var(--border)] bg-[var(--bg-surface)] text-ink-faint'
            : 'border border-pine-100 bg-pine-50 text-pine-700'
      }`}
      title={
        state === 'unavailable'
          ? "Les données ne sont stockées que dans le navigateur. Lancez l'app par le raccourci du Bureau pour activer la sauvegarde sur disque."
          : 'Les données sont écrites dans data/projet.json'
      }
    >
      {label}
    </div>
  );
}
