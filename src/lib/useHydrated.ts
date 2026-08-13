'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true only after the component has mounted on the client.
 * Use this to guard rendering of data that comes from persisted (localStorage)
 * Zustand stores, avoiding React hydration mismatches with the static export.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
