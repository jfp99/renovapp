'use client';

import React, { useState } from 'react';
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
      <div className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Configuration du ROI</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(roiConfig); setIsEditing(false); }}
                className="btn-secondary btn-sm"
              >
                Annuler
              </button>
              <button onClick={handleSave} className="btn-primary btn-sm">Enregistrer</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm">Modifier</button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Budget Total Rénovation (₱)
              </label>
              <input
                type="number"
                value={formData.totalRenovationBudget}
                onChange={(e) =>
                  handleInputChange('totalRenovationBudget', parseFloat(e.target.value) || 0)
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Prix d'Achat Propriété (₱)
              </label>
              <input
                type="number"
                value={formData.propertyPurchasePrice}
                onChange={(e) =>
                  handleInputChange('propertyPurchasePrice', parseFloat(e.target.value) || 0)
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Loyer par Lit (₱/mois)
              </label>
              <input
                type="number"
                value={formData.monthlyRentPerBed}
                onChange={(e) =>
                  handleInputChange('monthlyRentPerBed', parseFloat(e.target.value) || 0)
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Nombre de Lits
              </label>
              <input
                type="number"
                value={formData.numberOfBeds}
                onChange={(e) =>
                  handleInputChange('numberOfBeds', parseFloat(e.target.value) || 0)
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">
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
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Dépenses Mensuelles (₱)
              </label>
              <input
                type="number"
                value={formData.monthlyExpenses}
                onChange={(e) =>
                  handleInputChange('monthlyExpenses', parseFloat(e.target.value) || 0)
                }
                className="input"
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
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <TrendingUp size={16} /> Revenu mensuel brut
          </p>
          <p className="mt-2 text-3xl font-bold text-ink">
            ₱{(roiConfig.monthlyRentPerBed * roiConfig.numberOfBeds * roiConfig.occupancyRate).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-6">
          <p className="text-sm font-medium text-ink-muted">Revenu mensuel net</p>
          <p className="mt-2 text-3xl font-bold text-ink">
            ₱{monthlyNetIncome.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
          <p className="text-sm font-medium text-ink-muted">ROI annuel</p>
          <p className="mt-2 text-3xl font-bold text-ink">{annualROI.toFixed(1)}%</p>
        </div>

        <div className="rounded-xl border border-accent-200 bg-accent-50/60 p-6">
          <p className="text-sm font-medium text-ink-muted">Retour sur investissement</p>
          <p className="mt-2 text-3xl font-bold text-ink">
            {roiMonths > 0 ? `${(roiMonths / 12).toFixed(1)} ans` : '—'}
          </p>
        </div>
      </div>

      {/* Charts */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="card p-6">
            <h4 className="mb-4 text-sm font-semibold text-ink">Répartition des dépenses</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { name?: string | number; percent?: number }) => {
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
            <div className="card p-6">
              <h4 className="mb-4 text-sm font-semibold text-ink">Budget vs Réel</h4>
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
