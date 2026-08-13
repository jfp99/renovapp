'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker.
 *
 * Skipped on file:// and on non-secure origins, where registration throws —
 * localhost counts as secure, so the desktop launcher is covered.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (window.location.protocol === 'file:') return;

    const register = () => {
      navigator.serviceWorker
        .register('./sw.js')
        .catch((error) => console.warn('[RenovApp] Service worker non enregistré :', error));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
