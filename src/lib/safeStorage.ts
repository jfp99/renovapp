'use client';

/**
 * localStorage wrapper for zustand's persist middleware.
 *
 * The default implementation lets a QuotaExceededError bubble up and vanish:
 * the write fails, the UI carries on as if nothing happened, and everything
 * entered since the last successful write is gone on the next reload.
 *
 * Here we catch it, flag it, and broadcast an event so the UI can warn the user
 * instead of losing their data in silence.
 */

import { type StateStorage } from 'zustand/middleware';

export const STORAGE_ERROR_EVENT = 'renovapp:storage-error';

export interface StorageErrorDetail {
  key: string;
  quotaExceeded: boolean;
  message: string;
}

let lastError: StorageErrorDetail | null = null;

export function getLastStorageError(): StorageErrorDetail | null {
  return lastError;
}

export function clearStorageError(): void {
  lastError = null;
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(error.message)
  );
}

function report(key: string, error: unknown): void {
  const detail: StorageErrorDetail = {
    key,
    quotaExceeded: isQuotaError(error),
    message: error instanceof Error ? error.message : String(error),
  };
  lastError = detail;

  console.error(
    `[RenovApp] Échec d'écriture du stockage local pour "${key}".`,
    detail.quotaExceeded
      ? 'Quota localStorage dépassé — les données ne sont PAS sauvegardées.'
      : error
  );

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<StorageErrorDetail>(STORAGE_ERROR_EVENT, { detail }));
  }
}

export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch (error) {
      report(name, error);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
      if (lastError?.key === name) clearStorageError();
    } catch (error) {
      report(name, error);
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch (error) {
      report(name, error);
    }
  },
};
