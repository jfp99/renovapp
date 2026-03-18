'use client';

import React from 'react';
import { useCostStore } from '@/stores/costStore';

export const BudgetOverview: React.FC = () => {
  const { categories, getSpentByCategory, getTotalSpent, getTotalBudget } =
    useCostStore();

  const spentByCategory = getSpentByCategory();
  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Budget Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₱{totalBudget.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Dépenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₱{totalSpent.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Reste</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₱{Math.max(0, totalBudget - totalSpent).toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Budget Bars */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Par Catégorie</h3>
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
