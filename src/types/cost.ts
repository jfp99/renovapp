export type CostStatus = 'planned' | 'paid' | 'cancelled';
export type Currency = 'PHP' | 'EUR' | 'USD';

/**
 * CAPEX = one-off investment (renovation, furniture). Sits at the DENOMINATOR
 * of the ROI: it is the money you have to earn back.
 * OPEX  = recurring running cost (utilities, salary, head lease). Sits in the
 * monthly cash-flow: it is what eats into the rent every month.
 *
 * Mixing the two is the single most common way to get a property business plan
 * wrong — it inflates the payback and hides the real monthly margin.
 */
export type CostNature = 'capex' | 'opex';

/** Whether the building is bought or rented — drives what enters the ROI. */
export type PropertyMode = 'purchase' | 'lease';

export interface CostCategory {
  id: string;
  name: string;
  color: string;
  budgetAllocation: number;
  /** Pre-selected nature when adding an expense in this category. */
  defaultNature: CostNature;
}

export interface CostEntry {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  date: string;
  vendor?: string;
  linkedRoomIds: string[];
  status: CostStatus;
  nature: CostNature;
  /** CAPEX only — used to provision replacement (mattresses, paint...). */
  amortizationYears?: number;
}

export interface ROIConfig {
  /** Bought or leased. Determines which cost line enters the model. */
  propertyMode: PropertyMode;
  /** Purchase mode: acquisition price. Part of the total investment. */
  propertyPurchasePrice: number;
  /** Lease mode: monthly head-lease rent paid to the owner. An OPEX. */
  monthlyBaseRent: number;
  /** Planned renovation envelope — the "forecast" side of the ROI. */
  totalRenovationBudget: number;
  monthlyRentPerBed: number;
  numberOfBeds: number;
  /**
   * 'plan'   → capacity is derived from the beds actually placed on the plan.
   * 'manual' → capacity is overridden by hand (shown explicitly in the UI).
   */
  bedCountSource: 'plan' | 'manual';
  occupancyRate: number;
  /** Other recurring monthly charges (utilities, internet, caretaker...). */
  monthlyExpenses: number;
}

/** Everything the ROI panel needs, computed on one consistent basis. */
export interface RoiMetrics {
  /** 'planned' = budget-based forecast · 'actual' = money really paid out. */
  basis: 'planned' | 'actual';
  totalInvestment: number;
  grossMonthlyIncome: number;
  monthlyOperatingCost: number;
  netMonthlyIncome: number;
  annualROIPercent: number;
  paybackMonths: number | null;
}
