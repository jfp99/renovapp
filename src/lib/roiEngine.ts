import type {
  MonthPoint,
  OccupancyProfile,
  ProjectionResult,
  ScenarioAssumptions,
  SensitivityEntry,
} from '@/types/scenario';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

/**
 * Philippine academic year: classes run roughly August → May, so beds empty out
 * over the June/July break. A flat 100% occupancy assumption overstates annual
 * revenue by about a fifth — this profile is the honest default.
 */
export const ACADEMIC_PH_PROFILE: number[] = [
  1, 1, 1, 1, 0.95, 0.3, 0.4, 0.85, 1, 1, 1, 1,
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Occupancy for a given calendar month, before ramp-up is applied. */
export function seasonalOccupancy(profile: OccupancyProfile, calendarMonth: number): number {
  if (profile.mode === 'flat') return clamp(profile.flatRate, 0, 1);
  const value = profile.monthly[calendarMonth % 12];
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

/**
 * Fill-up factor for month `index` (1-based): a dorm does not open full.
 * Rises linearly from `startRate` to 1 over `rampMonths`.
 */
export function rampFactor(index: number, rampMonths: number, startRate: number): number {
  if (rampMonths <= 1) return 1;
  if (index >= rampMonths) return 1;
  const progress = (index - 1) / (rampMonths - 1);
  return clamp(startRate + (1 - startRate) * progress, 0, 1);
}

/** Total upfront investment: renovation + contingency, plus the building if bought. */
export function totalInvestment(a: ScenarioAssumptions): number {
  const renovation = a.renovationBudget * (1 + a.contingencyRate);
  const building = a.propertyMode === 'purchase' ? a.propertyPurchasePrice : 0;
  return renovation + building;
}

/** Occupied beds required to cover monthly running costs. */
export function breakEvenBeds(a: ScenarioAssumptions): number {
  const contributionPerBed = a.monthlyRentPerBed * (1 - a.badDebtRate) - a.utilitiesPerOccupiedBed;
  if (contributionPerBed <= 0) return Infinity;

  const investment = totalInvestment(a);
  const fixedCosts =
    a.fixedMonthlyCosts +
    (a.propertyMode === 'lease' ? a.monthlyBaseRent : 0) +
    a.replacementReserveMonthly +
    (investment * a.maintenanceRateOfCapex) / 12 -
    a.otherMonthlyRevenue;

  return Math.max(0, fixedCosts / contributionPerBed);
}

/** Build the month-by-month cash-flow projection. */
export function projectScenario(a: ScenarioAssumptions): ProjectionResult {
  const investment = totalInvestment(a);
  const horizon = Math.max(1, Math.round(a.horizonMonths));
  const monthlyDiscount = Math.pow(1 + a.discountRateAnnual, 1 / 12) - 1;

  const months: MonthPoint[] = [];
  let cumulative = -investment;
  let occupancySum = 0;
  let discountedSum = 0;

  for (let index = 1; index <= horizon; index += 1) {
    const calendarMonth = (a.startMonth + index - 1) % 12;
    const yearIndex = Math.floor((index - 1) / 12);

    // Escalations compound once a year, not every month.
    const indexation = Math.pow(1 + a.rentIndexationRate, yearIndex);
    const inflation = Math.pow(1 + a.costInflationRate, yearIndex);

    const occupancy = clamp(
      seasonalOccupancy(a.occupancy, calendarMonth) *
        rampFactor(index, a.rampUpMonths, a.rampUpStartRate),
      0,
      1
    );
    const occupiedBeds = a.numberOfBeds * occupancy;

    const rent = occupiedBeds * a.monthlyRentPerBed * indexation;
    const grossRevenue = rent + a.otherMonthlyRevenue * indexation;
    const collectedRevenue = grossRevenue * (1 - a.badDebtRate);

    const leaseCost = a.propertyMode === 'lease' ? a.monthlyBaseRent * indexation : 0;
    const utilities = occupiedBeds * a.utilitiesPerOccupiedBed * inflation;
    const maintenance = ((investment * a.maintenanceRateOfCapex) / 12) * inflation;
    const operatingCost =
      leaseCost +
      utilities +
      a.fixedMonthlyCosts * inflation +
      a.replacementReserveMonthly * inflation +
      maintenance;

    const ebitda = collectedRevenue - operatingCost;
    const tax = ebitda > 0 ? ebitda * a.taxRate : 0;
    const netCashFlow = ebitda - tax;

    cumulative += netCashFlow;
    occupancySum += occupancy;

    const discountedCashFlow = netCashFlow / Math.pow(1 + monthlyDiscount, index);
    discountedSum += discountedCashFlow;

    months.push({
      index,
      label: `${MONTH_LABELS[calendarMonth]} A${yearIndex + 1}`,
      occupancy,
      occupiedBeds,
      grossRevenue: collectedRevenue,
      operatingCost,
      ebitda,
      tax,
      netCashFlow,
      cumulativeCashFlow: cumulative,
      discountedCashFlow,
    });
  }

  const payback = months.find((m) => m.cumulativeCashFlow >= 0);
  const trough = months.reduce(
    (worst, m) => (m.cumulativeCashFlow < worst.cumulativeCashFlow ? m : worst),
    months[0]
  );

  return {
    months,
    totalInvestment: investment,
    paybackMonth: payback ? payback.index : null,
    npv: -investment + discountedSum,
    irrAnnual: computeIrr(investment, months.map((m) => m.netCashFlow)),
    breakEvenBeds: breakEvenBeds(a),
    minCashPosition: Math.min(trough.cumulativeCashFlow, -investment),
    minCashMonth: trough.cumulativeCashFlow < -investment ? trough.index : 0,
    averageOccupancy: horizon > 0 ? occupancySum / horizon : 0,
    totalNetCashFlow: months.reduce((sum, m) => sum + m.netCashFlow, 0),
    leaseRisk:
      a.propertyMode === 'lease' &&
      payback !== undefined &&
      a.leaseTermMonths > 0 &&
      payback.index > a.leaseTermMonths,
  };
}

/**
 * Monthly IRR, annualised. Returns null only when an IRR is genuinely
 * meaningless (nothing invested, or the project never repays itself).
 *
 * The first implementation bracketed the root between -0.9 and 1 and gave up
 * when both ends shared a sign. With a seasonal profile the final month can be
 * a loss, which flips the sign at the low end and made the function abandon
 * perfectly profitable projects. It also evaluated rates close to -1, where
 * dividing by (1+r)^60 overflows. Now we scan a sane grid for an actual sign
 * change, then bisect inside it.
 */
export function computeIrr(investment: number, cashFlows: number[]): number | null {
  if (investment <= 0 || cashFlows.length === 0) return null;
  if (cashFlows.reduce((sum, cf) => sum + cf, 0) <= investment) return null;

  const npvAt = (rate: number): number =>
    cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i + 1), -investment);

  // Monthly rates from -50% to +300% cover anything a real project can show.
  const STEP = 0.005;
  let low: number | null = null;
  let high: number | null = null;
  let prevRate = -0.5;
  let prevValue = npvAt(prevRate);

  for (let rate = -0.5 + STEP; rate <= 3; rate += STEP) {
    const value = npvAt(rate);
    if (Number.isFinite(prevValue) && Number.isFinite(value) && prevValue * value <= 0) {
      low = prevRate;
      high = rate;
      break;
    }
    prevRate = rate;
    prevValue = value;
  }

  if (low === null || high === null) return null;

  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    const value = npvAt(mid);
    if (Math.abs(value) < 1e-6) return Math.pow(1 + mid, 12) - 1;
    if (npvAt(low) * value < 0) high = mid;
    else low = mid;
  }

  return Math.pow(1 + (low + high) / 2, 12) - 1;
}

interface Driver {
  key: string;
  label: string;
  apply: (a: ScenarioAssumptions, factor: number) => ScenarioAssumptions;
}

const DRIVERS: Driver[] = [
  {
    key: 'occupancy',
    label: 'Taux d’occupation',
    apply: (a, f) => ({
      ...a,
      occupancy: {
        ...a.occupancy,
        flatRate: clamp(a.occupancy.flatRate * f, 0, 1),
        monthly: a.occupancy.monthly.map((v) => clamp(v * f, 0, 1)),
      },
    }),
  },
  {
    key: 'rent',
    label: 'Loyer par lit',
    apply: (a, f) => ({ ...a, monthlyRentPerBed: a.monthlyRentPerBed * f }),
  },
  {
    key: 'utilities',
    label: 'Électricité / eau',
    apply: (a, f) => ({ ...a, utilitiesPerOccupiedBed: a.utilitiesPerOccupiedBed * f }),
  },
  {
    key: 'baseRent',
    label: 'Loyer du bail',
    apply: (a, f) => ({ ...a, monthlyBaseRent: a.monthlyBaseRent * f }),
  },
  {
    key: 'renovation',
    label: 'Budget rénovation',
    apply: (a, f) => ({ ...a, renovationBudget: a.renovationBudget * f }),
  },
  {
    key: 'fixedCosts',
    label: 'Charges fixes',
    apply: (a, f) => ({ ...a, fixedMonthlyCosts: a.fixedMonthlyCosts * f }),
  },
];

/**
 * Tornado analysis: move each driver by ±`swing` and measure the NPV spread.
 * Answers "which assumption actually decides this project?" — usually not the
 * one people spend the most time debating.
 */
export function computeSensitivity(
  assumptions: ScenarioAssumptions,
  swing = 0.2
): SensitivityEntry[] {
  return DRIVERS.map((driver) => {
    const lowNpv = projectScenario(driver.apply(assumptions, 1 - swing)).npv;
    const highNpv = projectScenario(driver.apply(assumptions, 1 + swing)).npv;
    return {
      key: driver.key,
      label: driver.label,
      lowNpv,
      highNpv,
      spread: Math.abs(highNpv - lowNpv),
    };
  }).sort((a, b) => b.spread - a.spread);
}
