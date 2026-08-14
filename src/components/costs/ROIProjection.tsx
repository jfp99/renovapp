'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useBedCountFromPlan } from '@/lib/beds';
import { computeSensitivity, projectScenario } from '@/lib/roiEngine';
import { ScenarioBar } from './ScenarioBar';
import { AssumptionsPanel } from './AssumptionsPanel';
import { ProjectionCharts } from './ProjectionCharts';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;

export const ROIProjection: React.FC = () => {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeId = useScenarioStore((s) => s.activeId);
  const planBeds = useBedCountFromPlan();

  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  // The plan is the source of truth for capacity unless explicitly overridden.
  const assumptions = useMemo(
    () =>
      active.assumptions.bedCountSource === 'plan'
        ? { ...active.assumptions, numberOfBeds: planBeds }
        : active.assumptions,
    [active.assumptions, planBeds]
  );

  const projection = useMemo(() => projectScenario(assumptions), [assumptions]);
  const sensitivity = useMemo(() => computeSensitivity(assumptions), [assumptions]);

  const comparisons = useMemo(
    () =>
      scenarios.map((scenario) => {
        const a =
          scenario.assumptions.bedCountSource === 'plan'
            ? { ...scenario.assumptions, numberOfBeds: planBeds }
            : scenario.assumptions;
        return { scenario, result: projectScenario(a) };
      }),
    [scenarios, planBeds]
  );

  const noRevenue = assumptions.numberOfBeds === 0 || assumptions.monthlyRentPerBed === 0;

  return (
    <div className="space-y-6">
      <ScenarioBar />

      {noRevenue && (
        <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-brand-800">
            Renseignez au moins le nombre de lits et le loyer par lit pour que la projection ait du
            sens. Placez des lits sur le plan, ou passez la capacité en saisie manuelle.
          </p>
        </div>
      )}

      {/* ── Alerts ── */}
      {projection.leaseRisk && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="text-red-800">
            <p className="font-semibold">Le retour sur investissement dépasse la durée du bail</p>
            <p className="mt-0.5">
              Rentabilisé en {projection.paybackMonth} mois pour un bail de{' '}
              {assumptions.leaseTermMonths} mois. Tout le mobilier est perdu si le bail n&apos;est pas
              reconduit — à sécuriser par écrit avant d&apos;engager quoi que ce soit.
            </p>
          </div>
        </div>
      )}

      {projection.paybackMonth === null && !noRevenue && (
        <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
          <p className="text-accent-700">
            Sur {Math.round(assumptions.horizonMonths / 12)} ans, ce scénario ne rembourse jamais
            l&apos;investissement. Le levier le plus efficace ici :{' '}
            <strong>{sensitivity[0]?.label.toLowerCase()}</strong>.
          </p>
        </div>
      )}

      {/* ── Headline KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi
          label="Retour sur investissement"
          value={
            projection.paybackMonth
              ? `${(projection.paybackMonth / 12).toFixed(1)} ans`
              : 'Jamais'
          }
          hint={projection.paybackMonth ? `${projection.paybackMonth} mois` : 'sur l’horizon retenu'}
          tone={projection.paybackMonth ? 'positive' : 'negative'}
        />
        <Kpi
          label="VAN"
          value={peso(projection.npv)}
          hint={`actualisée à ${(assumptions.discountRateAnnual * 100).toFixed(1)} %/an`}
          tone={projection.npv > 0 ? 'positive' : 'negative'}
        />
        <Kpi
          label="TRI annuel"
          value={projection.irrAnnual === null ? '—' : `${(projection.irrAnnual * 100).toFixed(1)} %`}
          hint="taux de rentabilité interne"
        />
        <Kpi
          label="Trésorerie minimale"
          value={peso(Math.abs(projection.minCashPosition))}
          hint="le creux à financer avant les premiers loyers"
          tone="warning"
        />
        <Kpi
          label="Point mort"
          value={
            Number.isFinite(projection.breakEvenBeds)
              ? `${projection.breakEvenBeds.toFixed(1)} lits`
              : 'inatteignable'
          }
          hint={`sur ${assumptions.numberOfBeds} lits`}
          tone={
            Number.isFinite(projection.breakEvenBeds) &&
            projection.breakEvenBeds > assumptions.numberOfBeds
              ? 'negative'
              : undefined
          }
        />
        <Kpi
          label="Occupation moyenne"
          value={`${(projection.averageOccupancy * 100).toFixed(0)} %`}
          hint="sur tout l’horizon, saisonnalité comprise"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <ProjectionCharts projection={projection} sensitivity={sensitivity} />

          {/* ── Scenario comparison ── */}
          {scenarios.length > 1 && (
            <div className="card p-6">
              <h4 className="mb-4 text-sm font-semibold text-ink">Comparaison des scénarios</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 font-medium">Scénario</th>
                      <th className="pb-2 text-right font-medium">Investissement</th>
                      <th className="pb-2 text-right font-medium">Retour</th>
                      <th className="pb-2 text-right font-medium">VAN</th>
                      <th className="pb-2 text-right font-medium">TRI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {comparisons.map(({ scenario, result }) => (
                      <tr
                        key={scenario.id}
                        className={scenario.id === activeId ? 'font-semibold text-ink' : 'text-ink-soft'}
                      >
                        <td className="py-2.5">{scenario.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{peso(result.totalInvestment)}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {result.paybackMonth ? `${(result.paybackMonth / 12).toFixed(1)} ans` : '—'}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{peso(result.npv)}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {result.irrAnnual === null ? '—' : `${(result.irrAnnual * 100).toFixed(1)} %`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="card h-fit p-6">
          <AssumptionsPanel scenario={active} />
        </div>
      </div>
    </div>
  );
};

const TONES = {
  positive: 'border-pine-100 bg-pine-50/60',
  negative: 'border-red-100 bg-red-50/60',
  warning: 'border-accent-100 bg-accent-50/60',
  neutral: 'border-[var(--border)] bg-white',
} as const;

const Kpi: React.FC<{
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof TONES;
}> = ({ label, value, hint, tone = 'neutral' }) => (
  <div className={`rounded-xl border p-5 ${TONES[tone]}`}>
    <p className="text-xs font-medium text-ink-muted">{label}</p>
    <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
  </div>
);
