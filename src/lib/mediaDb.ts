'use client';

/**
 * Media storage backed by IndexedDB (Dexie).
 *
 * Rationale: blueprints and inspiration images used to be persisted as base64
 * data URLs inside localStorage, whose quota is ~5 MB per origin. A couple of
 * floor plans was enough to blow it, and zustand's persist middleware swallowed
 * the resulting QuotaExceededError silently — meaning every later write was
 * lost without any visible warning.
 *
 * Binary payloads now live here (IndexedDB, hundreds of MB), while the zustand
 * stores keep only lightweight metadata plus a `fileId` reference.
 */

import Dexie, { type Table } from 'dexie';

export interface MediaRecord {
  id: string;
  blob: Blob;
  mime: string;
  name: string;
  size: number;
  createdAt: string;
}

class MediaDatabase extends Dexie {
  media!: Table<MediaRecord, string>;

  constructor() {
    super('renovapp-media');
    this.version(1).stores({ media: 'id, createdAt' });
  }
}

let instance: MediaDatabase | null = null;

/** Lazily instantiate Dexie — never during SSR, where indexedDB is absent. */
function db(): MediaDatabase {
  if (typeof window === 'undefined') {
    throw new Error('mediaDb is client-only');
  }
  if (!instance) instance = new MediaDatabase();
  return instance;
}

export function isMediaAvailable(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Store a File/Blob and return its media id. */
export async function putMediaBlob(blob: Blob, name: string): Promise<string> {
  const id = newId();
  await db().media.put({
    id,
    blob,
    mime: blob.type || 'application/octet-stream',
    name,
    size: blob.size,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** Store a base64 data URL. Used by the legacy-data migration. */
export async function putMediaDataUrl(dataUrl: string, name: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  return putMediaBlob(blob, name);
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  if (!isMediaAvailable()) return undefined;
  const record = await db().media.get(id);
  return record?.blob;
}

/** Read a media back as a base64 data URL — needed for the JSON project export. */
export async function getMediaDataUrl(id: string): Promise<string | undefined> {
  const blob = await getMediaBlob(id);
  if (!blob) return undefined;
  return blobToDataUrl(blob);
}

export async function deleteMedia(id: string): Promise<void> {
  if (!isMediaAvailable()) return;
  await db().media.delete(id);
}

/** Rough footprint of everything stored, in bytes. */
export async function getMediaUsage(): Promise<number> {
  if (!isMediaAvailable()) return 0;
  const all = await db().media.toArray();
  return all.reduce((sum, record) => sum + record.size, 0);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  if (!header.includes('base64')) {
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
