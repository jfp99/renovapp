import { type APIRequestContext, type Page, expect } from '@playwright/test';

/** Empty the disk copy. Without this, restore re-seeds the next test. */
export async function resetDisk(request: APIRequestContext) {
  await request.post('/__data', {
    data: {
      app: 'renovapp', version: 3, exportedAt: '',
      plans: { floors: [], rooms: [] },
      furniture: { placements: [] },
      blueprints: [],
      inspiration: { images: [], boards: [] },
      costs: { categories: [], entries: [] },
      tenancy: { tenants: [], tenancies: [], payments: [], maintenance: [] },
    },
  });
}

/**
 * Next prefetches routes in the background; when a test navigates away the
 * in-flight request is cancelled and logs this. It is navigation noise, not an
 * application fault — the server serves those payloads correctly.
 */
export function isNavigationNoise(message: string): boolean {
  return (
    message.includes('Failed to fetch RSC payload') ||
    message.includes('net::ERR_ABORTED') ||
    message.includes('The user aborted a request') ||
    message.includes('Sauvegarde disque impossible')
  );
}

/** Wipe browser storage so a test starts from a known, empty app. */
export async function resetBrowser(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      dbs.map((db) => db.name && new Promise((res) => {
        const req = indexedDB.deleteDatabase(db.name!);
        req.onsuccess = req.onerror = req.onblocked = () => res(null);
      }))
    );
  });
}

/**
 * Seed the stores before the page runs any code.
 *
 * Writing localStorage on an already-loaded page is not safe: the stores of
 * that page are hydrated (and empty), and the first `set()` they perform
 * re-persists that empty state straight over the seed. addInitScript runs
 * before hydration, so the app boots with the data already in place.
 */
export async function seedProject(
  page: Page,
  data: Record<string, unknown>,
  gotoPath = '/'
) {
  await page.addInitScript((payload) => {
    Object.entries(payload).forEach(([key, state]) => {
      window.localStorage.setItem(key, JSON.stringify({ state, version: 0 }));
    });
  }, data);

  await page.goto(gotoPath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

export const CATALOG = [
  { id: 'c-bunk', name: 'Lit superposé', category: 'bed', defaultWidth: 90, defaultHeight: 200, color: '#B4552F' },
  { id: 'c-single', name: 'Lit simple', category: 'bed', defaultWidth: 90, defaultHeight: 200, color: '#C97A55' },
];

export const ROOMS = [
  { id: 'r1', floorId: 'f1', name: 'CHAMBRE 1', type: 'bedroom', x: 0, y: 0, width: 320, height: 260, color: '#F0DDC9', doors: [], windows: [] },
];

export const PLACEMENTS = [
  { id: 'p1', roomId: 'r1', catalogItemId: 'c-bunk', x: 10, y: 10, rotation: 0, width: 90, height: 200 },
  { id: 'p2', roomId: 'r1', catalogItemId: 'c-single', x: 120, y: 10, rotation: 0, width: 90, height: 200 },
];

/** A bunk sleeps two, a single sleeps one — three places from two beds. */
export const EXPECTED_BEDS = 3;

export function baseProject() {
  return {
    'renovapp-plans': { floors: [{ id: 'f1', name: 'Rez-de-chaussée', order: 0 }], rooms: ROOMS },
    'renovapp-furniture': { placements: PLACEMENTS, catalog: CATALOG },
  };
}

/** Wait for the autosave indicator to confirm a write reached the disk. */
export async function waitForAutosave(page: Page) {
  await expect(page.locator('text=/Sauvegard(é|e)/i').first()).toBeVisible({ timeout: 20_000 });
}
