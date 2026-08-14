import { expect, test } from '@playwright/test';
import { EXPECTED_BEDS, baseProject, resetBrowser, resetDisk, seedProject } from './helpers';

/**
 * The chain that makes this app worth using: beds drawn on the plan become
 * rentable places, occupancy is measured from real tenancies, and the ROI
 * reads its capacity from the plan instead of a hand-typed number.
 *
 * This is the 6-versus-8 trap from the very first audit, encoded as a test.
 */
test.describe('parcours plan → lits → location → ROI', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDisk(request);
    await resetBrowser(page);
  });

  test('les lits du plan deviennent des places louables', async ({ page }) => {
    await seedProject(page, baseProject(), '/location');

    await expect(page.locator('body')).toContainText('CHAMBRE 1');
    await expect(page.locator('body')).toContainText(`0 / ${EXPECTED_BEDS} lits`);
    // A bunk must yield two distinct places, not one.
    await expect(page.locator('body')).toContainText('Lit superposé — bas');
    await expect(page.locator('body')).toContainText('Lit superposé — haut');
  });

  test('attribuer un lit fait monter l’occupation mesurée', async ({ page }) => {
    await seedProject(page, baseProject(), '/location');

    await page.getByRole('button', { name: /Lit simple/ }).first().click();
    await page.getByRole('button', { name: /Attribuer/ }).click();

    await page.getByPlaceholder('Ex : Maria Santos').fill('Maria Santos');
    // Monthly rent is the first money field in the contract block.
    await page.locator('input[type="number"]').first().fill('3500');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator('body')).toContainText(`1 / ${EXPECTED_BEDS} lits`);
    await expect(page.locator('body')).toContainText('Maria Santos');
  });

  test('la capacité du ROI vient du plan, pas d’une saisie', async ({ page }) => {
    await seedProject(page, baseProject(), '/costs');
    await page.getByRole('button', { name: 'Projection' }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator('body')).toContainText(`Depuis le plan (${EXPECTED_BEDS})`);
  });

  test('un écart entre plan et saisie manuelle est signalé', async ({ page }) => {
    await seedProject(page, {
      ...baseProject(),
      'renovapp-costs': {
        categories: [],
        entries: [],
        settings: { exchangeRates: { EUR: 58, USD: 52 }, displayCurrency: 'PHP' },
        roiConfig: {
          propertyMode: 'lease', propertyPurchasePrice: 0, monthlyBaseRent: 18000,
          totalRenovationBudget: 300000, monthlyRentPerBed: 3500,
          numberOfBeds: 8, bedCountSource: 'manual', occupancyRate: 0.9, monthlyExpenses: 9000,
        },
      },
    }, '/costs');

    await page.getByRole('button', { name: 'ROI', exact: true }).click();
    await page.waitForTimeout(1200);

    // 8 typed against 3 on the plan: the model must say so, loudly.
    await expect(page.locator('body')).toContainText('8 lits');
    await expect(page.locator('body')).toContainText(`${EXPECTED_BEDS}`);
    await expect(page.locator('body')).toContainText(/Vérifiez lequel fait foi/i);
  });
});
