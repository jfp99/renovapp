import { describe, expect, it } from 'vitest';
import {
  ACADEMIC_PH_PROFILE,
  breakEvenBeds,
  computeIrr,
  computeSensitivity,
  projectScenario,
  rampFactor,
  seasonalOccupancy,
  totalInvestment,
} from '../roiEngine';
import type { ScenarioAssumptions } from '@/types/scenario';

/** A deliberately simple, fully-let scenario: easy to verify by hand. */
const base: ScenarioAssumptions = {
  bedCountSource: 'manual',
  numberOfBeds: 6,
  monthlyRentPerBed: 3000,
  otherMonthlyRevenue: 0,
  occupancy: { mode: 'flat', flatRate: 1, monthly: Array(12).fill(1) },
  rampUpMonths: 1,
  rampUpStartRate: 1,
  badDebtRate: 0,
  propertyMode: 'lease',
  propertyPurchasePrice: 0,
  monthlyBaseRent: 6000,
  leaseTermMonths: 60,
  rentIndexationRate: 0,
  utilitiesPerOccupiedBed: 0,
  fixedMonthlyCosts: 0,
  maintenanceRateOfCapex: 0,
  replacementReserveMonthly: 0,
  costInflationRate: 0,
  renovationBudget: 120000,
  contingencyRate: 0,
  horizonMonths: 60,
  discountRateAnnual: 0,
  taxRate: 0,
  startMonth: 0,
};

describe('totalInvestment', () => {
  it('applies the contingency to the renovation envelope', () => {
    expect(totalInvestment({ ...base, contingencyRate: 0.15 })).toBe(138000);
  });

  it('includes the building only when it is bought', () => {
    const purchase = { ...base, propertyMode: 'purchase' as const, propertyPurchasePrice: 500000 };
    expect(totalInvestment(purchase)).toBe(620000);
    expect(totalInvestment({ ...base, propertyPurchasePrice: 500000 })).toBe(120000);
  });
});

describe('projectScenario', () => {
  it('computes a payback that matches the hand calculation', () => {
    // 6 beds x 3000 = 18000 revenue, minus 6000 lease = 12000 net/month.
    // 120000 / 12000 = 10 months.
    const result = projectScenario(base);
    expect(result.months[0].netCashFlow).toBe(12000);
    expect(result.paybackMonth).toBe(10);
  });

  it('treats a lease as a running cost and a purchase as investment', () => {
    const purchase = projectScenario({
      ...base,
      propertyMode: 'purchase',
      propertyPurchasePrice: 240000,
      monthlyBaseRent: 6000,
    });
    // The 6000 lease line must disappear from the monthly cost when buying.
    expect(purchase.months[0].netCashFlow).toBe(18000);
    expect(purchase.totalInvestment).toBe(360000);
  });

  it('never reports payback when the monthly result is negative', () => {
    const result = projectScenario({ ...base, monthlyBaseRent: 30000 });
    expect(result.months[0].netCashFlow).toBeLessThan(0);
    expect(result.paybackMonth).toBeNull();
  });

  it('flags the lease risk when payback runs past the head lease', () => {
    const result = projectScenario({ ...base, leaseTermMonths: 6 });
    expect(result.paybackMonth).toBe(10);
    expect(result.leaseRisk).toBe(true);
  });

  it('reports the trough of the curve as the cash required upfront', () => {
    const result = projectScenario(base);
    expect(result.minCashPosition).toBe(-120000);
  });

  it('deepens the cash trough when the ramp-up delays revenue', () => {
    const slow = projectScenario({ ...base, rampUpMonths: 6, rampUpStartRate: 0 });
    const fast = projectScenario(base);
    expect(slow.paybackMonth!).toBeGreaterThan(fast.paybackMonth!);
  });

  it('taxes only positive results', () => {
    const result = projectScenario({ ...base, taxRate: 0.25 });
    expect(result.months[0].tax).toBe(3000);
    const loss = projectScenario({ ...base, monthlyBaseRent: 30000, taxRate: 0.25 });
    expect(loss.months[0].tax).toBe(0);
  });

  it('loses revenue to bad debt', () => {
    const result = projectScenario({ ...base, badDebtRate: 0.05 });
    expect(result.months[0].grossRevenue).toBeCloseTo(17100, 5);
  });

  it('charges utilities per occupied bed, not per bed', () => {
    const half = projectScenario({
      ...base,
      occupancy: { mode: 'flat', flatRate: 0.5, monthly: Array(12).fill(0.5) },
      utilitiesPerOccupiedBed: 500,
    });
    // 3 occupied beds x 500 = 1500, not 6 x 500.
    expect(half.months[0].operatingCost).toBe(6000 + 1500);
  });
});

describe('seasonality', () => {
  it('empties the dorm over the Philippine academic break', () => {
    const profile = { mode: 'academic' as const, flatRate: 1, monthly: ACADEMIC_PH_PROFILE };
    expect(seasonalOccupancy(profile, 5)).toBe(0.3); // June
    expect(seasonalOccupancy(profile, 0)).toBe(1); // January
  });

  it('produces a materially lower average than a flat assumption', () => {
    const seasonal = projectScenario({
      ...base,
      occupancy: { mode: 'academic', flatRate: 1, monthly: ACADEMIC_PH_PROFILE },
    });
    expect(seasonal.averageOccupancy).toBeLessThan(0.9);
    expect(seasonal.paybackMonth!).toBeGreaterThan(projectScenario(base).paybackMonth!);
  });
});

describe('rampFactor', () => {
  it('starts low and reaches full occupancy on the last ramp month', () => {
    expect(rampFactor(1, 4, 0.25)).toBeCloseTo(0.25, 5);
    expect(rampFactor(4, 4, 0.25)).toBe(1);
    expect(rampFactor(9, 4, 0.25)).toBe(1);
  });

  it('is a no-op when there is no ramp', () => {
    expect(rampFactor(1, 1, 0)).toBe(1);
  });
});

describe('breakEvenBeds', () => {
  it('divides fixed costs by the contribution of one bed', () => {
    // 6000 lease / 3000 per bed = 2 beds.
    expect(breakEvenBeds(base)).toBeCloseTo(2, 5);
  });

  it('is unreachable when a bed costs more than it earns', () => {
    expect(breakEvenBeds({ ...base, utilitiesPerOccupiedBed: 4000 })).toBe(Infinity);
  });
});

describe('computeIrr', () => {
  it('solves a flat annuity to the expected annual rate', () => {
    const irr = computeIrr(1000, Array(24).fill(100));
    expect(irr).not.toBeNull();
    // 100/month on 1000 invested over 24 months is a very high annual rate.
    expect(irr!).toBeGreaterThan(1);
  });

  it('returns null when the project never repays itself', () => {
    expect(computeIrr(1000, Array(12).fill(10))).toBeNull();
  });

  it('still solves when the last month is a seasonal loss', () => {
    // Regression: a negative final month used to flip the sign at the low
    // bracket, and a profitable project reported no IRR at all.
    const flows = Array.from({ length: 60 }, (_, i) => (i % 12 === 10 ? -3000 : 11000));
    const irr = computeIrr(325000, flows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0);
  });

  it('reports an IRR whenever the NPV is clearly positive', () => {
    const result = projectScenario({
      ...base,
      occupancy: { mode: 'academic', flatRate: 1, monthly: ACADEMIC_PH_PROFILE },
      numberOfBeds: 6,
      monthlyRentPerBed: 5000,
      monthlyBaseRent: 0,
      propertyMode: 'purchase',
      utilitiesPerOccupiedBed: 800,
      fixedMonthlyCosts: 8000,
      renovationBudget: 325000,
    });
    expect(result.npv).toBeGreaterThan(0);
    expect(result.irrAnnual, 'un projet a VAN positive doit avoir un TRI').not.toBeNull();
  });
});

describe('computeSensitivity', () => {
  it('ranks drivers by how much they move the NPV', () => {
    const entries = computeSensitivity({ ...base, utilitiesPerOccupiedBed: 800 });
    expect(entries.length).toBeGreaterThan(0);
    // Sorted descending by spread.
    for (let i = 1; i < entries.length; i += 1) {
      expect(entries[i - 1].spread).toBeGreaterThanOrEqual(entries[i].spread);
    }
    // Rent is the dominant driver in this scenario.
    expect(entries[0].key).toBe('rent');
  });

  it('makes a higher cost driver reduce the NPV', () => {
    const utilities = computeSensitivity({ ...base, utilitiesPerOccupiedBed: 800 }).find(
      (e) => e.key === 'utilities'
    )!;
    expect(utilities.highNpv).toBeLessThan(utilities.lowNpv);
  });
});
