import { expect, test } from '@playwright/test';
import { baseProject, resetBrowser, resetDisk, seedProject, waitForAutosave } from './helpers';

/**
 * The incident this suite exists for: a full evening of data entry vanished
 * because the browser was the only copy. Disk is now the durable store, and
 * these tests hold that line.
 */
test.describe('persistance des données', () => {
  test('le projet survit à un effacement complet du navigateur', async ({ page, context, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await seedProject(page, baseProject(), '/plans');
    await waitForAutosave(page);

    // Exactly what a privacy setting or a "clear site data" does.
    await page.evaluate(() => localStorage.clear());
    await context.clearCookies();

    await page.goto('/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000); // restore + automatic reload

    const rooms = await page.evaluate(() => {
      const raw = localStorage.getItem('renovapp-plans');
      return raw ? JSON.parse(raw).state.rooms.map((r: { name: string }) => r.name) : [];
    });
    expect(rooms).toContain('CHAMBRE 1');
  });

  test('une restauration n’écrase jamais un travail en cours', async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await seedProject(page, baseProject(), '/plans');
    await waitForAutosave(page);

    // Different work now present in the browser; disk still holds the old copy.
    await seedProject(page, {
      'renovapp-plans': {
        floors: [{ id: 'f1', name: 'Rez-de-chaussée', order: 0 }],
        rooms: [{ id: 'r9', floorId: 'f1', name: 'PIECE PLUS RECENTE', type: 'bedroom', x: 0, y: 0, width: 300, height: 300, color: '#F0DDC9', doors: [], windows: [] }],
      },
    });

    await page.goto('/plans', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const rooms = await page.evaluate(() => {
      const raw = localStorage.getItem('renovapp-plans');
      return raw ? JSON.parse(raw).state.rooms.map((r: { name: string }) => r.name) : [];
    });
    // The browser wins: restore only fills a genuinely empty app.
    expect(rooms).toContain('PIECE PLUS RECENTE');
    expect(rooms).not.toContain('CHAMBRE 1');
  });

  test('la sauvegarde disque contient toutes les sections', async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await seedProject(page, baseProject(), '/plans');
    await waitForAutosave(page);

    // The first flush can land before the seeded project is in the stores.
    await expect
      .poll(async () => {
        const body = await (await request.get('/__data')).json();
        return body.plans?.rooms?.map((r: { name: string }) => r.name) ?? [];
      }, { timeout: 20_000 })
      .toContain('CHAMBRE 1');

    const saved = await (await request.get('/__data')).json();
    for (const section of ['plans', 'furniture', 'blueprints', 'inspiration', 'costs', 'tenancy', 'scenarios']) {
      expect(saved, `section absente : ${section}`).toHaveProperty(section);
    }
  });

  test('le serveur refuse une sauvegarde corrompue', async ({ request }) => {
    // A truncated upload must never replace a good project file.
    // `data` with a string would be JSON-encoded into a valid document;
    // send raw bytes so the server really sees malformed JSON.
    const response = await request.post('/__data', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{"app":"renovapp", tronqué'),
    });
    expect(response.status()).toBe(400);
  });

  test('une écriture valide reste relisible', async ({ request }) => {
    const payload = { app: 'renovapp', version: 3, exportedAt: '', plans: { floors: [], rooms: [] } };
    expect((await request.post('/__data', { data: payload })).ok()).toBe(true);
    const back = await (await request.get('/__data')).json();
    expect(back.app).toBe('renovapp');
  });
});
