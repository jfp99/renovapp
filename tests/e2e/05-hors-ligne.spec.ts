import { expect, test } from '@playwright/test';
import { baseProject, resetBrowser, resetDisk, seedProject } from './helpers';

/**
 * Offline is the whole point of a local, self-hosted app: a dorm in Bacolod
 * cannot depend on the connection being up. This spec runs in its own
 * Playwright project, the only one where the service worker stays enabled.
 */
test.describe('hors ligne', () => {
  test("l'app fonctionne entièrement hors ligne", async ({ page, context, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await seedProject(page, baseProject());

    // Warm the service worker cache the way normal use would.
    for (const path of ['/', '/plans', '/location', '/costs']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.goto('/location', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await expect(page.locator('body')).toContainText('Location');
    await expect(page.locator('body')).toContainText('CHAMBRE 1');
    await context.setOffline(false);
  });

});
