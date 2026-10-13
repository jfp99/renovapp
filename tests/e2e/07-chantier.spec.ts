import { expect, test } from '@playwright/test';
import { resetBrowser, resetDisk } from './helpers';

/**
 * Chantier: one entry must land on disk AND in Coûts & ROI, exactly once,
 * and follow the task through edits and deletion.
 */
test.describe('suivi du chantier', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
  });

  test('une tâche est sauvegardée et reportée dans les coûts, sans doublon', async ({ page, request }) => {
    page.on('dialog', (d) => d.accept());
    await page.goto('/chantier');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Ajouter la première tâche' }).click();
    await page.fill('#wt-title', 'Carrelage cuisine');
    await page.selectOption('#wt-trade', 'carrelage');
    await page.fill('#wt-start', '2026-09-10');
    await page.fill('#wt-end', '2026-09-13');
    // Dates fill the duration in on their own.
    await expect(page.locator('#wt-days')).toHaveValue('4');
    await page.fill('#wt-workers', '2');
    await page.fill('#wt-labor', '8000');
    await page.fill('#wt-mat', '15500');
    await page.getByRole('button', { name: 'Ajouter la tâche' }).click();

    await expect(page.getByText('₱23 500').first()).toBeVisible();
    await expect(page.getByText('₱1 000').first()).toBeVisible(); // 8000 / (4 j × 2)
    await page.waitForTimeout(2500);

    let saved = await (await request.get('/__data')).json();
    expect(saved.worklog.tasks).toHaveLength(1);
    let linked = saved.costs.entries.filter((e: { workTaskId?: string }) => e.workTaskId);
    expect(linked.map((e: { amount: number }) => e.amount).sort()).toEqual([15500, 8000]);

    // Edit: amounts follow, no duplicate rows.
    await page.getByRole('button', { name: 'Modifier' }).click();
    await page.fill('#wt-labor', '9000');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.waitForTimeout(2500);
    saved = await (await request.get('/__data')).json();
    linked = saved.costs.entries.filter((e: { workTaskId?: string }) => e.workTaskId);
    expect(linked).toHaveLength(2);
    expect(linked.find((e: { workCostKind: string }) => e.workCostKind === 'labor').amount).toBe(9000);

    // The cost table sends you back to the task instead of editing a copy.
    await page.goto('/costs');
    await page.waitForTimeout(1500);
    await expect(page.locator('a[href*="tache="]:visible').first()).toBeVisible();

    // Delete: its cost rows go with it.
    await page.goto('/chantier');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
    await page.waitForTimeout(2500);
    saved = await (await request.get('/__data')).json();
    expect(saved.worklog.tasks).toHaveLength(0);
    expect(saved.costs.entries.filter((e: { workTaskId?: string }) => e.workTaskId)).toHaveLength(0);
  });
});

test.describe('pièces jointes', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
  });

  test('un reçu joint part dans la sauvegarde disque et revient après un effacement', async ({ page, request }) => {
    await page.goto('/costs');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Ajouter une dépense' }).first().click();
    await page.getByPlaceholder('Ex: Peinture salon').fill('Ciment');
    await page.getByPlaceholder('0.00').fill('1200');
    // 1×1 PNG
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.locator('input[type="file"]').setInputFiles({ name: 'recu.png', mimeType: 'image/png', buffer: png });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Ajouter la dépense' }).click();
    await page.waitForTimeout(3000);

    const saved = await (await request.get('/__data')).json();
    const entry = saved.costs.entries.find((e: { description: string }) => e.description === 'Ciment');
    expect(entry.receiptData).toMatch(/^data:image\/png;base64,/);

    // Wipe the browser completely (localStorage + IndexedDB) and reopen.
    await resetBrowser(page);
    await page.goto('/costs');
    await page.waitForTimeout(4500); // restore from disk + reload
    const restoredId = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('renovapp-costs') || '{}');
      const e = (raw.state?.entries || []).find((x: { description: string }) => x.description === 'Ciment');
      return { id: e?.receiptFileId, inline: Boolean(e?.receiptData) };
    });
    expect(restoredId.id).toBeTruthy();
    expect(restoredId.inline).toBe(false); // back in IndexedDB, not bloating localStorage
  });
});
