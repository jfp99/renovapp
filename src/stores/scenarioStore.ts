import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { ACADEMIC_PH_PROFILE } from '@/lib/roiEngine';
import type { Scenario, ScenarioAssumptions } from '@/types/scenario';
import type { ROIConfig } from '@/types/cost';

/**
 * Structural defaults are deliberately conservative rather than flattering:
 * a real dorm does not open full, students leave over the summer break, some
 * rent is never collected, and renovation always overruns a little.
 */
export const DEFAULT_ASSUMPTIONS: ScenarioAssumptions = {
  bedCountSource: 'plan',
  numberOfBeds: 0,
  monthlyRentPerBed: 0,
  otherMonthlyRevenue: 0,
  occupancy: { mode: 'academic', flatRate: 0.9, monthly: [...ACADEMIC_PH_PROFILE] },
  rampUpMonths: 3,
  rampUpStartRate: 0.3,
  badDebtRate: 0.03,
  propertyMode: 'lease',
  propertyPurchasePrice: 0,
  monthlyBaseRent: 0,
  leaseTermMonths: 36,
  rentIndexationRate: 0.05,
  utilitiesPerOccupiedBed: 0,
  fixedMonthlyCosts: 0,
  maintenanceRateOfCapex: 0.03,
  replacementReserveMonthly: 0,
  costInflationRate: 0.05,
  renovationBudget: 0,
  contingencyRate: 0.15,
  horizonMonths: 60,
  discountRateAnnual: 0.06,
  taxRate: 0,
  startMonth: new Date().getMonth(),
};

const baseScenarioId = uuidv4();

interface ScenarioState {
  scenarios: Scenario[];
  activeId: string;
  addScenario: (name: string) => void;
  duplicateScenario: (id: string, name?: string) => void;
  renameScenario: (id: string, name: string) => void;
  removeScenario: (id: string) => void;
  setActive: (id: string) => void;
  updateAssumptions: (id: string, updates: Partial<ScenarioAssumptions>) => void;
  getActive: () => Scenario;
  /** Carry the legacy single-shot ROI config over into the active scenario. */
  seedFromRoiConfig: (config: ROIConfig, planBedCount: number) => void;
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      scenarios: [
        { id: baseScenarioId, name: 'Scénario de base', assumptions: { ...DEFAULT_ASSUMPTIONS } },
      ],
      activeId: baseScenarioId,

      addScenario: (name) => {
        const scenario: Scenario = {
          id: uuidv4(),
          name,
          assumptions: { ...DEFAULT_ASSUMPTIONS },
        };
        set((state) => ({ scenarios: [...state.scenarios, scenario], activeId: scenario.id }));
      },

      duplicateScenario: (id, name) => {
        const source = get().scenarios.find((s) => s.id === id);
        if (!source) return;
        const copy: Scenario = {
          id: uuidv4(),
          name: name ?? `${source.name} (copie)`,
          assumptions: {
            ...source.assumptions,
            occupancy: {
              ...source.assumptions.occupancy,
              monthly: [...source.assumptions.occupancy.monthly],
            },
          },
        };
        set((state) => ({ scenarios: [...state.scenarios, copy], activeId: copy.id }));
      },

      renameScenario: (id, name) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, name } : s)),
        })),

      removeScenario: (id) =>
        set((state) => {
          if (state.scenarios.length <= 1) return state;
          const scenarios = state.scenarios.filter((s) => s.id !== id);
          return {
            scenarios,
            activeId: state.activeId === id ? scenarios[0].id : state.activeId,
          };
        }),

      setActive: (id) => set({ activeId: id }),

      updateAssumptions: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, assumptions: { ...s.assumptions, ...updates } } : s
          ),
        })),

      getActive: () => {
        const state = get();
        return state.scenarios.find((s) => s.id === state.activeId) ?? state.scenarios[0];
      },

      seedFromRoiConfig: (config, planBedCount) => {
        const active = get().getActive();
        get().updateAssumptions(active.id, {
          bedCountSource: config.bedCountSource,
          numberOfBeds:
            config.bedCountSource === 'plan' ? planBedCount : config.numberOfBeds,
          monthlyRentPerBed: config.monthlyRentPerBed,
          propertyMode: config.propertyMode,
          propertyPurchasePrice: config.propertyPurchasePrice,
          monthlyBaseRent: config.monthlyBaseRent,
          renovationBudget: config.totalRenovationBudget,
          fixedMonthlyCosts: config.monthlyExpenses,
          occupancy: {
            ...active.assumptions.occupancy,
            flatRate: config.occupancyRate || active.assumptions.occupancy.flatRate,
          },
        });
      },
    }),
    {
      name: 'renovapp-scenarios',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
