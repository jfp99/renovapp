import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { resetBrowser, resetDisk } from './helpers';

/**
 * The traps found while preparing for real data entry (2026-10-10).
 */
test.describe('saisie des dépenses', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
  });

  test('une charge récurrente est mensuelle par défaut et génère ses échéances tout de suite', async ({ page, request }) => {
    await page.goto('/costs');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click();
    await page.getByRole('button', { name: /Charge récurrente/ }).click();

    // An electricity bill left on "Ponctuelle / Matériaux" was counted once, as renovation.
    await expect(page.locator('select option:checked', { hasText: 'Tous les mois' })).toHaveCount(1);
    await expect(page.locator('select option:checked', { hasText: 'Charges courantes' })).toHaveCount(1);

    await page.getByPlaceholder('Ex: Peinture salon').fill('Loyer test');
    await page.getByPlaceholder('0.00').fill('18000');
    // Three months back: the overdue instalments must appear without leaving the page.
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 2);
    const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
    await page.locator('input[type="date"]').first().fill(iso);
    await page.getByRole('button', { name: 'Ajouter la dépense' }).click();
    await page.waitForTimeout(3000);

    const saved = await (await request.get('/__data')).json();
    const rent = saved.costs.entries.filter((e: { description: string }) => e.description === 'Loyer test');
    expect(rent.length).toBe(3); // the template + 2 instalments already due
  });

  test('le formulaire propose la date du jour locale', async ({ page }) => {
    await page.goto('/costs');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click();
    const today = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    await expect(page.locator('input[type="date"]').first()).toHaveValue(today);
  });

  test('une copie du jour est conservée à côté des copies glissantes', async ({ request }) => {
    await request.post('/__data', { data: { app: 'renovapp', version: 3, exportedAt: 'a' } });
    await request.post('/__data', { data: { app: 'renovapp', version: 3, exportedAt: 'b' } });
    const dir = join(__dirname, '..', '.data', 'backups');
    expect(existsSync(dir)).toBe(true);
    expect(readdirSync(dir).some((f) => /^jour-\d{4}-\d{2}-\d{2}\.json$/.test(f))).toBe(true);
  });
});
