import { expect, test } from '@playwright/test';
import { isNavigationNoise, resetBrowser, resetDisk } from './helpers';

/**
 * Cold start: a brand-new install must open every page without a console
 * error and without pretending to hold data it doesn't have.
 */
test.describe('démarrage à froid', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
  });

  const PAGES = [
    { path: '/', title: 'Tableau de bord' },
    { path: '/plans', title: 'Plans' },
    { path: '/furniture', title: 'Meubles' },
    { path: '/blueprints', title: 'blueprints' },
    { path: '/inspiration', title: 'Inspiration' },
    { path: '/costs', title: 'rentabilité' },
    { path: '/location', title: 'Location' },
  ];

  for (const { path, title } of PAGES) {
    test(`${path} s'ouvre sans erreur`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        if (!isNavigationNoise(error.message)) errors.push(error.message);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !isNavigationNoise(msg.text())) errors.push(msg.text());
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      await expect(page.locator('body')).toContainText(new RegExp(title, 'i'));
      expect(errors, `erreurs sur ${path} : ${errors.join(' | ')}`).toEqual([]);
    });
  }

  test('une app vide ne montre pas de faux chiffres', async ({ page }) => {
    await page.goto('/location', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    // No beds on the plan means 0 %, never a misleading 100 %.
    await expect(page.locator('body')).toContainText('0 %');
    await expect(page.locator('body')).toContainText('Aucun lit sur le plan');
  });
});
