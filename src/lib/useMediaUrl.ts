'use client';

import { useEffect, useState } from 'react';
import { getMediaBlob } from './mediaDb';

/**
 * Resolve a media reference to a displayable URL.
 *
 * `fileId` points at an IndexedDB record (current storage). `fallbackDataUrl`
 * is the legacy inline base64 still present on records created before the
 * migration — it keeps old projects rendering while MediaMigrator catches up.
 */
export function useMediaUrl(fileId?: string, fallbackDataUrl?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(fallbackDataUrl);

  useEffect(() => {
    if (!fileId) {
      setUrl(fallbackDataUrl);
      return;
    }

    let objectUrl: string | undefined;
    let cancelled = false;

    getMediaBlob(fileId)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(fallbackDataUrl);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, fallbackDataUrl]);

  return url;
}
