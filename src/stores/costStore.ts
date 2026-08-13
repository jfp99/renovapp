import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { countBeds } from '@/lib/beds';
import { useFurnitureStore } from '@/stores/furnitureStore';
import {
  CostCategory,
  CostEntry,
  CostNature,
  ROIConfig,
  RoiMetrics,
} from '@/types/cost';

interface CostState {
  categories: CostCategory[];
  entries: CostEntry[];
  roiConfig: ROIConfig;
  addCategory: (name: string, color: string, budgetAllocation: number, defaultNature?: CostNature) => void;
  updateCategory: (id: string, updates: Partial<CostCategory>) => void;
  removeCategory: (id: string) => void;
  addEntry: (entry: Omit<CostEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<CostEntry>) => void;
  removeEntry: (id: string) => void;
  updateROIConfig: (config: Partial<ROIConfig>) => void;
  /** Money actually paid out (status 'paid'). */
  getTotalPaid: () => number;
  /** Paid + planned — what the project is committed to. */
  getTotalCommitted: () => number;
  getPaidByNature: (nature: CostNature) => number;
  getTotalBudget: () => number;
  getSpentByCategory: () => Record<string, number>;
  /** Single source of truth for every ROI figure shown in the UI. */
  getRoiMetrics: (basis?: 'planned' | 'actual') => RoiMetrics;
  /** Sleeping capacity actually used by the model. */
  getEffectiveBedCount: () => number;
  /** Capacity implied by the beds placed on the plan. */
  getPlanBedCount: () => number;
}

const mkCategory = (
  name: string,
  color: string,
  defaultNature: CostNature
): CostCategory => ({
  id: uuidv4(),
  name,
  color,
  budgetAllocation: 0,
  defaultNature,
});

const defaultCategories: CostCategory[] = [
  mkCategory('Matériaux', '#f59e0b', 'capex'),
  mkCategory("Main d'œuvre", '#3b82f6', 'capex'),
  mkCategory('Meubles', '#10b981', 'capex'),
  mkCategory('Permis & Admin', '#8b5cf6', 'capex'),
  mkCategory('Plomberie', '#06b6d4', 'capex'),
  mkCategory('Électricité', '#f97316', 'capex'),
  mkCategory('Charges courantes', '#14b8a6', 'opex'),
  mkCategory('Divers', '#6b7280', 'capex'),
];

const defaultROIConfig: ROIConfig = {
  propertyMode: 'lease',
  propertyPurchasePrice: 0,
  monthlyBaseRent: 0,
  totalRenovationBudget: 0,
  monthlyRentPerBed: 0,
  numberOfBeds: 0,
  bedCountSource: 'plan',
  occupancyRate: 0,
  monthlyExpenses: 0,
};

/** Convert an entry to PHP, the reference currency of the project. */
function toPHP(entry: CostEntry): number {
  return entry.currency === 'PHP' ? entry.amount : entry.amount * entry.exchangeRate;
}

export const useCostStore = create<CostState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      entries: [],
      roiConfig: defaultROIConfig,

      addCategory: (name, color, budgetAllocation, defaultNature = 'capex') =>
        set((state) => ({
          categories: [
            ...state.categories,
            { id: uuidv4(), name, color, budgetAllocation, defaultNature },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          entries: state.entries.filter((e) => e.categoryId !== id),
        })),

      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, { ...entry, id: uuidv4() }],
        })),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      updateROIConfig: (config) =>
        set((state) => ({ roiConfig: { ...state.roiConfig, ...config } })),

      getTotalPaid: () =>
        get()
          .entries.filter((e) => e.status === 'paid')
          .reduce((sum, e) => sum + toPHP(e), 0),

      getTotalCommitted: () =>
        get()
          .entries.filter((e) => e.status !== 'cancelled')
          .reduce((sum, e) => sum + toPHP(e), 0),

      getPaidByNature: (nature) =>
        get()
          .entries.filter((e) => e.status === 'paid' && (e.nature ?? 'capex') === nature)
          .reduce((sum, e) => sum + toPHP(e), 0),

      getTotalBudget: () =>
        get().categories.reduce((sum, cat) => sum + cat.budgetAllocation, 0),

      getSpentByCategory: () => {
        const result: Record<string, number> = {};
        get()
          .entries.filter((e) => e.status === 'paid')
          .forEach((entry) => {
            result[entry.categoryId] = (result[entry.categoryId] || 0) + toPHP(entry);
          });
        return result;
      },

      getPlanBedCount: () => {
        const furniture = useFurnitureStore.getState();
        return countBeds(furniture.placements, furniture.catalog);
      },

      getEffectiveBedCount: () => {
        const config = get().roiConfig;
        return config.bedCountSource === 'plan'
          ? get().getPlanBedCount()
          : config.numberOfBeds;
      },

      getRoiMetrics: (basis = 'actual') => {
        const config = get().roiConfig;
        const isPurchase = config.propertyMode === 'purchase';

        // One denominator, used by every KPI on screen. The forecast basis uses
        // the planned envelope, the actual basis uses CAPEX really paid — and
        // the acquisition price is included in both when the building is bought.
        const renovation =
          basis === 'planned' ? config.totalRenovationBudget : get().getPaidByNature('capex');
        const totalInvestment = renovation + (isPurchase ? config.propertyPurchasePrice : 0);

        // Capacity comes from the plan by default, so the model can no longer
        // drift away from the beds actually drawn.
        const bedCount = get().getEffectiveBedCount();
        const grossMonthlyIncome =
          config.monthlyRentPerBed * bedCount * config.occupancyRate;

        // A lease payment is a running cost, not an investment.
        const monthlyOperatingCost =
          config.monthlyExpenses + (isPurchase ? 0 : config.monthlyBaseRent);

        const netMonthlyIncome = grossMonthlyIncome - monthlyOperatingCost;

        const annualROIPercent =
          totalInvestment > 0 ? ((netMonthlyIncome * 12) / totalInvestment) * 100 : 0;

        const paybackMonths =
          netMonthlyIncome > 0 && totalInvestment > 0
            ? Math.ceil(totalInvestment / netMonthlyIncome)
            : null;

        return {
          basis,
          totalInvestment,
          grossMonthlyIncome,
          monthlyOperatingCost,
          netMonthlyIncome,
          annualROIPercent,
          paybackMonths,
        };
      },
    }),
    {
      name: 'renovapp-costs',
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as {
          categories?: CostCategory[];
          entries?: CostEntry[];
          roiConfig?: Partial<ROIConfig>;
        };
        if (version >= 2 || !state) return state as never;

        // v1 had no CAPEX/OPEX split. Everything recorded back then was
        // renovation spending, so CAPEX is the correct default.
        return {
          ...state,
          categories: (state.categories ?? []).map((c) => ({
            ...c,
            defaultNature: c.defaultNature ?? 'capex',
          })),
          entries: (state.entries ?? []).map((e) => ({ ...e, nature: e.nature ?? 'capex' })),
          roiConfig: { ...defaultROIConfig, ...(state.roiConfig ?? {}) },
        } as never;
      },
    }
  )
);
