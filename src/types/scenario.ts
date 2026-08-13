export type OccupancyMode = 'flat' | 'academic' | 'custom';

export interface OccupancyProfile {
  mode: OccupancyMode;
  /** Used when mode === 'flat'. 0–1. */
  flatRate: number;
  /** 12 values, 0–1, index 0 = January. Used for 'academic' and 'custom'. */
  monthly: number[];
}

export interface ScenarioAssumptions {
  // ── Capacity & revenue ─────────────────────────────
  bedCountSource: 'plan' | 'manual';
  numberOfBeds: number;
  monthlyRentPerBed: number;
  /** Laundry, drinking water, parking… */
  otherMonthlyRevenue: number;
  occupancy: OccupancyProfile;
  /** Months needed to reach full occupancy, and where filling starts. */
  rampUpMonths: number;
  rampUpStartRate: number;
  /** Share of rent never collected. Never zero in practice. */
  badDebtRate: number;

  // ── Building ───────────────────────────────────────
  propertyMode: 'purchase' | 'lease';
  propertyPurchasePrice: number;
  monthlyBaseRent: number;
  /** Head-lease duration. If payback runs past it, the model flags the risk. */
  leaseTermMonths: number;
  /** Annual escalation applied to both the head lease and the bed rents. */
  rentIndexationRate: number;

  // ── Running costs ──────────────────────────────────
  /** Electricity + water per OCCUPIED bed — the line that kills dorm margins. */
  utilitiesPerOccupiedBed: number;
  /** Internet, caretaker, cleaning, consumables… */
  fixedMonthlyCosts: number;
  /** Annual maintenance, as a share of the invested CAPEX. */
  maintenanceRateOfCapex: number;
  /** Monthly provision to replace mattresses, fans, paint. */
  replacementReserveMonthly: number;
  costInflationRate: number;

  // ── Investment ─────────────────────────────────────
  renovationBudget: number;
  /** Contingency on the renovation envelope. 10–20% is the usual range. */
  contingencyRate: number;

  // ── Financial ──────────────────────────────────────
  horizonMonths: number;
  discountRateAnnual: number;
  taxRate: number;
  /** Calendar month the project starts. 0 = January. */
  startMonth: number;
}

export interface Scenario {
  id: string;
  name: string;
  assumptions: ScenarioAssumptions;
}

export interface MonthPoint {
  index: number;
  label: string;
  occupancy: number;
  occupiedBeds: number;
  grossRevenue: number;
  operatingCost: number;
  ebitda: number;
  tax: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  discountedCashFlow: number;
}

export interface ProjectionResult {
  months: MonthPoint[];
  totalInvestment: number;
  /** Month index where cumulative cash-flow first turns positive. */
  paybackMonth: number | null;
  npv: number;
  /** Annualised IRR, or null when it cannot be solved. */
  irrAnnual: number | null;
  /** Occupied beds needed to cover monthly running costs. */
  breakEvenBeds: number;
  /** Deepest point of the cumulative curve — the cash you must have upfront. */
  minCashPosition: number;
  minCashMonth: number;
  averageOccupancy: number;
  totalNetCashFlow: number;
  /** True when payback runs past the head lease. */
  leaseRisk: boolean;
}

export interface SensitivityEntry {
  key: string;
  label: string;
  /** NPV when the driver moves down / up by the swing. */
  lowNpv: number;
  highNpv: number;
  /** Signed spread — drives the tornado ordering. */
  spread: number;
}
