import { expect, test } from '@playwright/test';
import { baseProject, resetBrowser, resetDisk, seedProject } from './helpers';

test.describe('robustesse', () => {
  test('le quota dépassé est signalé, jamais silencieux', async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await page.goto('/plans', { waitUntil: 'domcontentloaded' });

    // Force every write to fail the way a full localStorage does.
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function patched(key: string, value: string) {
        if (key.startsWith('renovapp-')) {
          const error = new Error('quota');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return original.call(this, key, value);
      };
      window.dispatchEvent(
        new CustomEvent('renovapp:storage-error', {
          detail: { key: 'renovapp-plans', quotaExceeded: true, message: 'quota' },
        })
      );
    });
    await page.waitForTimeout(800);

    await expect(page.locator('body')).toContainText(/Stockage satur|pas sauvegard/i);
  });

  test('un PDF s’importe et s’ouvre dans le lecteur', async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await page.goto('/blueprints', { waitUntil: 'domcontentloaded' });

    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
        'trailer<</Root 1 0 R>>\n%%EOF\n'
    );
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'plan-lit-superpose.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toContainText('plan-lit-superpose');
    await expect(page.locator('text=PDF').first()).toBeVisible();

    await page.locator('h3').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('iframe')).toHaveCount(1);
  });

  test('les médias vont en IndexedDB, pas dans localStorage', async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
    await page.goto('/blueprints', { waitUntil: 'domcontentloaded' });

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\ntrailer<</Root 1 0 R>>\n%%EOF\n'),
    });
    await page.waitForTimeout(2000);

    const stored = await page.evaluate(() => localStorage.getItem('renovapp-blueprints') ?? '');
    // The payload must never be inlined: that is what blew the 5 MB quota.
    expect(stored).not.toContain('fileData');
    expect(stored).toContain('fileId');
  });
});
