import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CostCategory, CostEntry, ROIConfig } from '@/types/cost';

interface CostState {
  categories: CostCategory[];
  entries: CostEntry[];
  roiConfig: ROIConfig;
  addCategory: (name: string, color: string, budgetAllocation: number) => void;
  removeCategory: (id: string) => void;
  addEntry: (entry: Omit<CostEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<CostEntry>) => void;
  removeEntry: (id: string) => void;
  updateROIConfig: (config: Partial<ROIConfig>) => void;
  getTotalSpent: () => number;
  getTotalBudget: () => number;
  getMonthlyNetIncome: () => number;
  getROIMonths: () => number;
  getSpentByCategory: () => Record<string, number>;
}

const defaultCategories: CostCategory[] = [
  {
    id: uuidv4(),
    name: 'Matériaux',
    color: '#f59e0b',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Main d\'œuvre',
    color: '#3b82f6',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Meubles',
    color: '#10b981',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Permis & Admin',
    color: '#8b5cf6',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Plomberie',
    color: '#06b6d4',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Électricité',
    color: '#f97316',
    budgetAllocation: 0,
  },
  {
    id: uuidv4(),
    name: 'Divers',
    color: '#6b7280',
    budgetAllocation: 0,
  },
];

const defaultROIConfig: ROIConfig = {
  totalRenovationBudget: 0,
  monthlyRentPerBed: 0,
  numberOfBeds: 0,
  occupancyRate: 0,
  monthlyExpenses: 0,
  propertyPurchasePrice: 0,
};

export const useCostStore = create<CostState>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,
      entries: [],
      roiConfig: defaultROIConfig,

      addCategory: (name: string, color: string, budgetAllocation: number) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              id: uuidv4(),
              name,
              color,
              budgetAllocation,
            },
          ],
        })),

      removeCategory: (id: string) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          entries: state.entries.filter((e) => e.categoryId !== id),
        })),

      addEntry: (entry: Omit<CostEntry, 'id'>) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: uuidv4(),
            },
          ],
        })),

      updateEntry: (id: string, updates: Partial<CostEntry>) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      removeEntry: (id: string) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      updateROIConfig: (config: Partial<ROIConfig>) =>
        set((state) => ({
          roiConfig: {
            ...state.roiConfig,
            ...config,
          },
        })),

      getTotalSpent: () => {
        const entries = get().entries.filter((e) => e.status !== 'cancelled');
        return entries.reduce((sum, entry) => {
          const amountInPHP =
            entry.currency === 'PHP'
              ? entry.amount
              : entry.amount * entry.exchangeRate;
          return sum + amountInPHP;
        }, 0);
      },

      getTotalBudget: () => {
        return get().categories.reduce((sum, cat) => sum + cat.budgetAllocation, 0);
      },

      getMonthlyNetIncome: () => {
        const config = get().roiConfig;
        return (
          config.monthlyRentPerBed * config.numberOfBeds * config.occupancyRate -
          config.monthlyExpenses
        );
      },

      getROIMonths: () => {
        const totalSpent = get().getTotalSpent();
        const monthlyNetIncome = get().getMonthlyNetIncome();
        if (monthlyNetIncome <= 0) return 0;
        return Math.ceil(totalSpent / monthlyNetIncome);
      },

      getSpentByCategory: () => {
        const entries = get().entries.filter((e) => e.status !== 'cancelled');
        const result: Record<string, number> = {};
        entries.forEach((entry) => {
          const categoryId = entry.categoryId;
          const amountInPHP =
            entry.currency === 'PHP'
              ? entry.amount
              : entry.amount * entry.exchangeRate;
          result[categoryId] = (result[categoryId] || 0) + amountInPHP;
        });
        return result;
      },
    }),
    {
      name: 'renovapp-costs',
    }
  )
);
