import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { countBeds } from '@/lib/beds';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { missingInstalments } from '@/lib/recurrence';
import { deleteMedia } from '@/lib/mediaDb';
import {
  CostCategory,
  CostEntry,
  CostNature,
  CostSettings,
  Currency,
  ROIConfig,
  RoiMetrics,
} from '@/types/cost';

interface CostState {
  categories: CostCategory[];
  entries: CostEntry[];
  roiConfig: ROIConfig;
  settings: CostSettings;
  updateSettings: (updates: Partial<CostSettings>) => void;
  /** Reference rate for a currency, used when an entry doesn't override it. */
  getRate: (currency: Currency) => number;
  /**
   * Create the instalments recurring templates still owe, up to `until`.
   * Idempotent, and everything it creates is 'planned' — never 'paid'.
   * Returns how many were added.
   */
  materializeRecurrences: (until?: string) => number;
  addCategory: (name: string, color: string, budgetAllocation: number, defaultNature?: CostNature) => void;
  updateCategory: (id: string, updates: Partial<CostCategory>) => void;
  removeCategory: (id: string) => void;
  /** Restore the seed categories, keeping the budgets already set on them. */
  resetCategories: () => void;
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

/**
 * Seed ids are FIXED strings, not uuids. Re-seeding has to be idempotent: if
 * the defaults were regenerated with fresh uuids, every entry still pointing at
 * the old ids would be orphaned and its amount would drop out of the totals.
 */
const mkCategory = (
  id: string,
  name: string,
  color: string,
  defaultNature: CostNature
): CostCategory => ({
  id,
  name,
  color,
  budgetAllocation: 0,
  defaultNature,
});

export const defaultCategories: CostCategory[] = [
  mkCategory('cat-materiaux', 'Matériaux', '#B4552F', 'capex'),
  mkCategory('cat-main-doeuvre', "Main d'œuvre", '#C98A2E', 'capex'),
  mkCategory('cat-meubles', 'Meubles', '#2E5A4E', 'capex'),
  mkCategory('cat-permis-admin', 'Permis & Admin', '#A89A82', 'capex'),
  mkCategory('cat-plomberie', 'Plomberie', '#3E7C6B', 'capex'),
  mkCategory('cat-electricite', 'Électricité', '#C97A55', 'capex'),
  mkCategory('cat-charges-courantes', 'Charges courantes', '#DCA24B', 'opex'),
  mkCategory('cat-divers', 'Divers', '#6B5E49', 'capex'),
];

/**
 * An empty category list is never a legitimate state: the expense form builds
 * its dropdown from it, so zero categories means no expense can be recorded at
 * all — and it fails silently, because an empty <select> just looks like it is
 * still loading. Every rehydration path funnels through here.
 */
export function withDefaultCategories(
  categories: CostCategory[] | undefined | null
): CostCategory[] {
  return categories && categories.length > 0 ? categories : defaultCategories;
}

const defaultSettings: CostSettings = {
  // Indicative starting points — set your bank's actual rate in the UI.
  exchangeRates: { EUR: 58, USD: 52 },
  displayCurrency: 'PHP',
};

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
function toPHP(entry: CostEntry, fallbackRates?: CostSettings['exchangeRates']): number {
  if (entry.currency === 'PHP') return entry.amount;
  const rate =
    entry.exchangeRate && entry.exchangeRate > 0
      ? entry.exchangeRate
      : fallbackRates?.[entry.currency] ?? 1;
  return entry.amount * rate;
}

export const useCostStore = create<CostState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      entries: [],
      roiConfig: defaultROIConfig,
      settings: defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      getRate: (currency) =>
        currency === 'PHP' ? 1 : get().settings.exchangeRates[currency] ?? 1,

      materializeRecurrences: (until = new Date().toISOString().slice(0, 10)) => {
        const entries = get().entries;
        const created = entries
          .filter((e) => e.recurrence && e.recurrence !== 'none' && !e.recurrenceParentId)
          .flatMap((template) => missingInstalments(template, entries, until));

        if (created.length === 0) return 0;
        set((state) => ({
          entries: [...state.entries, ...created.map((e) => ({ ...e, id: uuidv4() }))],
        }));
        return created.length;
      },

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
        set((state) => {
          const categories = state.categories.filter((c) => c.id !== id);
          const entries = state.entries.filter((e) => e.categoryId !== id);
          // Deleting the last category would leave the expense form unusable.
          return { categories: withDefaultCategories(categories), entries };
        }),

      resetCategories: () =>
        set((state) => ({
          // Fixed ids, so entries filed under a default category survive.
          categories: defaultCategories.map((d) => {
            const existing = state.categories.find((c) => c.id === d.id);
            return existing ? { ...d, budgetAllocation: existing.budgetAllocation } : d;
          }),
        })),

      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, { ...entry, id: uuidv4() }],
        })),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      removeEntry: (id) => {
        const doomed = get().entries.filter((e) => e.id === id || e.recurrenceParentId === id);
        doomed.forEach((e) => {
          if (e.receiptFileId) void deleteMedia(e.receiptFileId);
        });
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id && e.recurrenceParentId !== id),
        }));
      },

      updateROIConfig: (config) =>
        set((state) => ({ roiConfig: { ...state.roiConfig, ...config } })),

      getTotalPaid: () =>
        get()
          .entries.filter((e) => e.status === 'paid')
          .reduce((sum, e) => sum + toPHP(e, get().settings.exchangeRates), 0),

      getTotalCommitted: () =>
        get()
          .entries.filter((e) => e.status !== 'cancelled')
          .reduce((sum, e) => sum + toPHP(e, get().settings.exchangeRates), 0),

      getPaidByNature: (nature) =>
        get()
          .entries.filter((e) => e.status === 'paid' && (e.nature ?? 'capex') === nature)
          .reduce((sum, e) => sum + toPHP(e, get().settings.exchangeRates), 0),

      getTotalBudget: () =>
        get().categories.reduce((sum, cat) => sum + cat.budgetAllocation, 0),

      getSpentByCategory: () => {
        const result: Record<string, number> = {};
        get()
          .entries.filter((e) => e.status === 'paid')
          .forEach((entry) => {
            result[entry.categoryId] = (result[entry.categoryId] || 0) + toPHP(entry, get().settings.exchangeRates);
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
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as {
          categories?: CostCategory[];
          entries?: CostEntry[];
          roiConfig?: Partial<ROIConfig>;
        };
        if (version >= 3 || !state) return state as never;

        // v1 had no CAPEX/OPEX split. Everything recorded back then was
        // renovation spending, so CAPEX is the correct default.
        return {
          ...state,
          categories: withDefaultCategories(
            (state.categories ?? []).map((c) => ({
              ...c,
              defaultNature: c.defaultNature ?? 'capex',
            }))
          ),
          entries: (state.entries ?? []).map((e) => ({ ...e, nature: e.nature ?? 'capex' })),
          roiConfig: { ...defaultROIConfig, ...(state.roiConfig ?? {}) },
          settings: defaultSettings,
        } as never;
      },
      /**
       * The default merge is a shallow spread, so a persisted `categories: []`
       * silently overwrites the seeded defaults — and nothing ever puts them
       * back. This is what emptied the expense dropdown. Repair on every
       * rehydration, including the disk-restore path, which bypasses migrate
       * whenever the version already matches.
       */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CostState>;
        return {
          ...current,
          ...p,
          categories: withDefaultCategories(p.categories),
          settings: { ...defaultSettings, ...(p.settings ?? {}) },
          roiConfig: { ...defaultROIConfig, ...(p.roiConfig ?? {}) },
        };
      },
    }
  )
);
