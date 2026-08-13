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
import { TrendingUp, Info, Link2, PencilLine } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { useBedCountFromPlan } from '@/lib/beds';
import type { PropertyMode } from '@/types/cost';

const peso = (value: number) =>
  `₱${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`;

export const ROICalculator: React.FC = () => {
  const {
    roiConfig,
    updateROIConfig,
    getRoiMetrics,
    getEffectiveBedCount,
    categories,
    getSpentByCategory,
  } = useCostStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(roiConfig);

  const planBedCount = useBedCountFromPlan();
  const effectiveBeds = getEffectiveBedCount();
  const actual = getRoiMetrics('actual');
  const planned = getRoiMetrics('planned');
  const isPurchase = roiConfig.propertyMode === 'purchase';

  const spentByCategory = getSpentByCategory();
  const pieData = categories
    .filter((cat) => spentByCategory[cat.id] && spentByCategory[cat.id] > 0)
    .map((cat) => ({ name: cat.name, value: Math.round(spentByCategory[cat.id]), color: cat.color }));

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

  const setField = <K extends keyof typeof roiConfig>(field: K, value: (typeof roiConfig)[K]) =>
    setFormData({ ...formData, [field]: value });

  const num = (field: keyof typeof roiConfig) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [field]: parseFloat(event.target.value) || 0 });

  return (
    <div className="space-y-6">
      {/* ---------- Hypotheses ---------- */}
      <div className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Hypothèses du modèle</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormData(roiConfig);
                  setIsEditing(false);
                }}
                className="btn-secondary btn-sm"
              >
                Annuler
              </button>
              <button onClick={handleSave} className="btn-primary btn-sm">
                Enregistrer
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm">
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-5">
            {/* Property mode */}
            <div>
              <label className="label">Le bâtiment est…</label>
              <div className="mt-1 flex gap-2">
                {(
                  [
                    ['lease', 'Loué (bail principal)'],
                    ['purchase', 'Acheté'],
                  ] as Array<[PropertyMode, string]>
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setField('propertyMode', mode)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      formData.propertyMode === mode
                        ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                        : 'border-[var(--border)] text-ink-muted hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.propertyMode === 'purchase' ? (
                <div>
                  <label className="label">Prix d&apos;achat de la propriété (₱)</label>
                  <input
                    type="number"
                    value={formData.propertyPurchasePrice}
                    onChange={num('propertyPurchasePrice')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-ink-faint">Compté dans l&apos;investissement total.</p>
                </div>
              ) : (
                <div>
                  <label className="label">Loyer du bail principal (₱/mois)</label>
                  <input
                    type="number"
                    value={formData.monthlyBaseRent}
                    onChange={num('monthlyBaseRent')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-ink-faint">Charge mensuelle, pas un investissement.</p>
                </div>
              )}

              <div>
                <label className="label">Budget rénovation prévu (₱)</label>
                <input
                  type="number"
                  value={formData.totalRenovationBudget}
                  onChange={num('totalRenovationBudget')}
                  className="input"
                />
                <p className="mt-1 text-xs text-ink-faint">Sert au scénario « Prévu ».</p>
              </div>

              <div>
                <label className="label">Loyer par lit (₱/mois)</label>
                <input
                  type="number"
                  value={formData.monthlyRentPerBed}
                  onChange={num('monthlyRentPerBed')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Taux d&apos;occupation (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(formData.occupancyRate * 100)}
                  onChange={(e) =>
                    setField('occupancyRate', (parseFloat(e.target.value) || 0) / 100)
                  }
                  className="input"
                />
              </div>

              <div className="col-span-2">
                <label className="label">Nombre de lits</label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setField('bedCountSource', 'plan')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      formData.bedCountSource === 'plan'
                        ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                        : 'border-[var(--border)] text-ink-muted hover:bg-slate-50'
                    }`}
                  >
                    <Link2 size={14} /> Depuis le plan ({planBedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setField('bedCountSource', 'manual')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      formData.bedCountSource === 'manual'
                        ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                        : 'border-[var(--border)] text-ink-muted hover:bg-slate-50'
                    }`}
                  >
                    <PencilLine size={14} /> Saisie manuelle
                  </button>
                  {formData.bedCountSource === 'manual' && (
                    <input
                      type="number"
                      min="0"
                      value={formData.numberOfBeds}
                      onChange={num('numberOfBeds')}
                      className="input w-28"
                    />
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="label">Autres charges mensuelles (₱)</label>
                <input
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={num('monthlyExpenses')}
                  className="input"
                />
                <p className="mt-1 text-xs text-ink-faint">
                  Électricité, eau, internet, ménage, maintenance…
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Readout label="Bâtiment" value={isPurchase ? 'Acheté' : 'Loué'} />
            {isPurchase ? (
              <Readout label="Prix d'achat" value={peso(roiConfig.propertyPurchasePrice)} />
            ) : (
              <Readout label="Loyer bail principal" value={`${peso(roiConfig.monthlyBaseRent)}/mois`} />
            )}
            <Readout label="Budget rénovation prévu" value={peso(roiConfig.totalRenovationBudget)} />
            <Readout label="Loyer par lit" value={`${peso(roiConfig.monthlyRentPerBed)}/mois`} />
            <Readout
              label="Nombre de lits"
              value={`${effectiveBeds}`}
              hint={roiConfig.bedCountSource === 'plan' ? 'depuis le plan' : 'saisie manuelle'}
            />
            <Readout
              label="Taux d'occupation"
              value={`${(roiConfig.occupancyRate * 100).toFixed(0)}%`}
            />
            <Readout label="Autres charges" value={`${peso(roiConfig.monthlyExpenses)}/mois`} />
          </div>
        )}

        {/* Capacity mismatch warning — the 6-vs-8 trap. */}
        {roiConfig.bedCountSource === 'manual' && planBedCount !== roiConfig.numberOfBeds && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-amber-800">
              Le modèle utilise <strong>{roiConfig.numberOfBeds} lits</strong> alors que le plan en
              contient <strong>{planBedCount}</strong>. Vérifiez lequel fait foi avant de vous
              appuyer sur ces chiffres.
            </p>
          </div>
        )}
      </div>

      {/* ---------- Results ---------- */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-600" />
          <h3 className="text-sm font-semibold text-ink">Résultats</h3>
          <span className="text-xs text-ink-faint">
            · « Réel » = dépenses payées · « Prévu » = budget annoncé
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="pb-2 font-medium">Indicateur</th>
                <th className="pb-2 text-right font-medium">Réel</th>
                <th className="pb-2 text-right font-medium">Prévu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <Row label="Investissement total" a={peso(actual.totalInvestment)} b={peso(planned.totalInvestment)} />
              <Row label="Revenu mensuel brut" a={peso(actual.grossMonthlyIncome)} b={peso(planned.grossMonthlyIncome)} />
              <Row label="Charges mensuelles" a={peso(actual.monthlyOperatingCost)} b={peso(planned.monthlyOperatingCost)} />
              <Row
                label="Revenu mensuel net"
                a={peso(actual.netMonthlyIncome)}
                b={peso(planned.netMonthlyIncome)}
                strong
              />
              <Row
                label="ROI annuel"
                a={`${actual.annualROIPercent.toFixed(1)}%`}
                b={`${planned.annualROIPercent.toFixed(1)}%`}
                strong
              />
              <Row
                label="Retour sur investissement"
                a={actual.paybackMonths ? `${(actual.paybackMonths / 12).toFixed(1)} ans` : '—'}
                b={planned.paybackMonths ? `${(planned.paybackMonths / 12).toFixed(1)} ans` : '—'}
                strong
              />
            </tbody>
          </table>
        </div>

        {actual.netMonthlyIncome <= 0 && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-muted">
            Revenu net négatif ou nul : aucun retour sur investissement n&apos;est calculable en
            l&apos;état.
          </p>
        )}
      </div>

      {/* ---------- Charts ---------- */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h4 className="mb-4 text-sm font-semibold text-ink">Répartition des dépenses payées</h4>
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
                <Tooltip formatter={(value) => peso(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {budgetByCategory.length > 0 && (
            <div className="card p-6">
              <h4 className="mb-4 text-sm font-semibold text-ink">Budget vs payé</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => peso(value as number)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#8b5cf6" name="Budget" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="actual" fill="#ef4444" name="Payé" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Readout: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div>
    <span className="text-ink-muted">{label} :</span>
    <p className="font-semibold text-ink">
      {value}
      {hint && <span className="ml-1 text-xs font-normal text-ink-faint">({hint})</span>}
    </p>
  </div>
);

const Row: React.FC<{ label: string; a: string; b: string; strong?: boolean }> = ({
  label,
  a,
  b,
  strong,
}) => (
  <tr className={strong ? 'font-semibold text-ink' : 'text-ink-soft'}>
    <td className="py-2.5">{label}</td>
    <td className="py-2.5 text-right tabular-nums">{a}</td>
    <td className="py-2.5 text-right tabular-nums text-ink-muted">{b}</td>
  </tr>
);
