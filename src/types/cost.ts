export type CostStatus = 'planned' | 'paid' | 'cancelled';
export type Currency = 'PHP' | 'EUR' | 'USD';

export interface CostCategory {
  id: string;
  name: string;
  color: string;
  budgetAllocation: number;
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
}

export interface ROIConfig {
  totalRenovationBudget: number;
  monthlyRentPerBed: number;
  numberOfBeds: number;
  occupancyRate: number;
  monthlyExpenses: number;
  propertyPurchasePrice: number;
}
