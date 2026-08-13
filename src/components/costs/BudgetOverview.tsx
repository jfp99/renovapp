'use client';

import React from 'react';
import { useCostStore } from '@/stores/costStore';

export const BudgetOverview: React.FC = () => {
  const { categories, getSpentByCategory, getTotalPaid, getTotalBudget } =
    useCostStore();

  const spentByCategory = getSpentByCategory();
  const totalSpent = getTotalPaid();
  const totalBudget = getTotalBudget();

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs font-medium text-ink-muted">Budget total</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">
            ₱{totalBudget.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-xs font-medium text-ink-muted">Payé</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">
            ₱{totalSpent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-xs font-medium text-ink-muted">Reste</p>
          <p className="mt-1.5 text-2xl font-bold text-ink">
            ₱{Math.max(0, totalBudget - totalSpent).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Budget Bars */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Par catégorie</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const spent = spentByCategory[category.id] || 0;
            const allocated = category.budgetAllocation;
            const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-700">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ₱{spent.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}{' '}
                    / ₱
                    {allocated.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor:
                        percentage > 100 ? '#ef4444' : category.color,
                    }}
                  />
                </div>
                <div className="text-right text-xs text-gray-600">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
