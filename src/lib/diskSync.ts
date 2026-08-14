'use client';

import { buildProjectExport, importProjectExport, type ProjectExport } from './projectData';

const ENDPOINT = './__data';

export type SyncState = 'idle' | 'saving' | 'saved' | 'unavailable' | 'error';

/** Is anything actually stored in the browser right now? */
export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  const keys = [
    'renovapp-plans',
    'renovapp-furniture',
    'renovapp-blueprints',
    'renovapp-inspiration',
    'renovapp-costs',
    'renovapp-tenancy',
  ];

  return keys.some((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? {};
      // A freshly-seeded store holds only defaults; that isn't real data.
      return Object.values(state).some((value) => Array.isArray(value) && value.length > 0);
    } catch {
      return false;
    }
  });
}

/** Fetch the project saved on disk. Returns null when there is none. */
export async function loadFromDisk(): Promise<ProjectExport | null> {
  try {
    const response = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as ProjectExport;
  } catch {
    // Running under `next dev`, or the local server is gone.
    return null;
  }
}

/** Write the whole project to disk. Throws so the caller can surface failures. */
export async function saveToDisk(): Promise<string> {
  const data = await buildProjectExport();
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Echec de la sauvegarde (${response.status})`);
  }

  const result = await response.json();
  return result.savedAt as string;
}

/** Restore the browser stores from a disk snapshot. */
export async function restoreFromDisk(data: ProjectExport): Promise<string | null> {
  return importProjectExport(JSON.stringify(data));
}

/** Does this build have the local server behind it? */
export async function isDiskSyncAvailable(): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINT, { method: 'GET', cache: 'no-store' });
    // 404 means "no save yet" — the endpoint itself answered, so it exists.
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}
