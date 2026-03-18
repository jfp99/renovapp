'use client';

import React, { useState } from 'react';
import type { PieLabelRenderProps } from 'recharts';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';

export const ROICalculator: React.FC = () => {
  const {
    roiConfig,
    updateROIConfig,
    getTotalSpent,
    getMonthlyNetIncome,
    getROIMonths,
    categories,
    getSpentByCategory,
  } = useCostStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(roiConfig);

  const totalSpent = getTotalSpent();
  const monthlyNetIncome = getMonthlyNetIncome();
  const roiMonths = getROIMonths();
  const annualROI =
    roiConfig.totalRenovationBudget > 0
      ? ((monthlyNetIncome * 12) / roiConfig.totalRenovationBudget) * 100
      : 0;

  // Prepare chart data
  const spentByCategory = getSpentByCategory();
  const pieData = categories
    .filter((cat) => spentByCategory[cat.id] && spentByCategory[cat.id] > 0)
    .map((cat) => ({
      name: cat.name,
      value: Math.round(spentByCategory[cat.id]),
      color: cat.color,
    }));

  const budgetByCategory = categories
    .filter((cat) => cat.budgetAllocation > 0 || spentByCategory[cat.id])
    .map((cat) => ({
      name: cat.name,
      budget: cat.budgetAllocation,
      actual: spentByCategory[cat.id] || 0,
      color: cat.color,
    }));

  const handleSave = () => {
    updateROIConfig(formData);
    setIsEditing(false);
  };

  const handleInputChange = (
    field: keyof typeof roiConfig,
    value: number
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* ROI Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Configuration ROI
          </h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormData(roiConfig);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Enregistrer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Total Rénovation (₱)
              </label>
              <input
                type="number"
                value={formData.totalRenovationBudget}
                onChange={(e) =>
                  handleInputChange('totalRenovationBudget', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix d'Achat Propriété (₱)
              </label>
              <input
                type="number"
                value={formData.propertyPurchasePrice}
                onChange={(e) =>
                  handleInputChange('propertyPurchasePrice', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loyer par Lit (₱/mois)
              </label>
              <input
                type="number"
                value={formData.monthlyRentPerBed}
                onChange={(e) =>
                  handleInputChange('monthlyRentPerBed', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Lits
              </label>
              <input
                type="number"
                value={formData.numberOfBeds}
                onChange={(e) =>
                  handleInputChange('numberOfBeds', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux d'Occupation (%)
              </label>
              <input
                type="number"
                value={formData.occupancyRate * 100}
                onChange={(e) =>
                  handleInputChange('occupancyRate', parseFloat(e.target.value) / 100 || 0)
                }
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dépenses Mensuelles (₱)
              </label>
              <input
                type="number"
                value={formData.monthlyExpenses}
                onChange={(e) =>
                  handleInputChange('monthlyExpenses', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Budget Total Rénovation:</span>
              <p className="font-semibold text-gray-900">
                ₱{roiConfig.totalRenovationBudget.toLocaleString('fr-FR')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Nombre de Lits:</span>
              <p className="font-semibold text-gray-900">
                {roiConfig.numberOfBeds}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Loyer par Lit:</span>
              <p className="font-semibold text-gray-900">
                ₱{roiConfig.monthlyRentPerBed.toLocaleString('fr-FR')}/mois
              </p>
            </div>
            <div>
              <span className="text-gray-600">Taux d'Occupation:</span>
              <p className="font-semibold text-gray-900">
                {(roiConfig.occupancyRate * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <span className="text-gray-600">Dépenses Mensuelles:</span>
              <p className="font-semibold text-gray-900">
                ₱{roiConfig.monthlyExpenses.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ROI Results */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
            <TrendingUp size={16} /> Revenu Mensuel Brut
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₱{(roiConfig.monthlyRentPerBed *
              roiConfig.numberOfBeds *
              roiConfig.occupancyRate).toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
            })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <p className="text-sm text-gray-600 font-medium">
            Revenu Mensuel Net
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₱{monthlyNetIncome.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
            })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <p className="text-sm text-gray-600 font-medium">ROI Annuel</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {annualROI.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
          <p className="text-sm text-gray-600 font-medium">
            Retour sur Investissement
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {roiMonths > 0
              ? `${(roiMonths / 12).toFixed(1)} ans`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Charts */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des Dépenses
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const n = typeof props.name === 'string' ? props.name : '';
                    const p = typeof props.percent === 'number' ? props.percent : 0;
                    return `${n} ${(p * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `₱${(value as number).toLocaleString('fr-FR')}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          {budgetByCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Budget vs Réel
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `₱${(value as number).toLocaleString('fr-FR')}`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="budget"
                    fill="#8b5cf6"
                    name="Budget"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    fill="#ef4444"
                    name="Réel"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
