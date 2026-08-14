'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  HelpCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useComplianceStore } from '@/stores/complianceStore';
import { usePlanStore } from '@/stores/planStore';
import { useHydrated } from '@/lib/useHydrated';
import {
  PERMIT_CATALOG,
  expiringPermits,
  permitDefinition,
  remainingPermitCost,
  runChecks,
} from '@/lib/compliance';
import type { CheckSeverity, PermitStatus } from '@/types/compliance';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;

const STATUS_LABEL: Record<PermitStatus, string> = {
  not_started: 'À faire',
  in_progress: 'En cours',
  obtained: 'Obtenu',
  expired: 'Expiré',
};

const STATUS_STYLE: Record<PermitStatus, string> = {
  not_started: 'border-[var(--border)] bg-[var(--bg-surface)] text-ink-muted',
  in_progress: 'border-accent-200 bg-accent-50 text-accent-700',
  obtained: 'border-pine-100 bg-pine-50 text-pine-700',
  expired: 'border-red-200 bg-red-50 text-red-700',
};

const SEVERITY_STYLE: Record<CheckSeverity, string> = {
  ok: 'border-pine-100 bg-pine-50',
  warning: 'border-accent-200 bg-accent-50',
  blocking: 'border-red-200 bg-red-50',
  unknown: 'border-[var(--border)] bg-[var(--bg-surface)]',
};

const SEVERITY_ICON: Record<CheckSeverity, React.ReactNode> = {
  ok: <CheckCircle2 className="h-4 w-4 text-pine-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-accent-600" />,
  blocking: <ShieldAlert className="h-4 w-4 text-red-600" />,
  unknown: <HelpCircle className="h-4 w-4 text-ink-faint" />,
};

export default function ConformitePage() {
  const hydrated = useHydrated();
  const rooms = usePlanStore((s) => s.rooms);
  const { permits, settings, setStatus, updatePermit, updateSettings } = useComplianceStore();

  const checks = useMemo(() => runChecks(rooms, settings), [rooms, settings]);
  const expiring = useMemo(() => expiringPermits(permits), [permits]);
  const budget = useMemo(() => remainingPermitCost(permits), [permits]);

  const blocking = checks.filter((c) => c.severity === 'blocking');
  const obtained = permits.filter((p) => p.status === 'obtained').length;

  if (!hydrated) {
    return (
      <main className="min-h-screen p-8">
        <div className="skeleton h-40" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="bg-mesh border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-8 py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Avant d&apos;engager
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Conformité</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Permis à obtenir et règles vérifiées sur votre propre plan. Ce sont ces points qui
            décident si l&apos;activité est légale — bien avant le rendement.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-7 px-8 py-8">
        {blocking.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="text-red-800">
              <p className="font-semibold">
                {blocking.length} point{blocking.length > 1 ? 's' : ''} bloquant
                {blocking.length > 1 ? 's' : ''} à régler avant d&apos;engager des dépenses
              </p>
              <p className="mt-0.5">{blocking.map((c) => c.label).join(' · ')}</p>
            </div>
          </div>
        )}

        {/* ── Hypotheses feeding the checks ── */}
        <div className="card p-6">
          <h2 className="mb-5 text-sm font-semibold text-ink">Votre situation</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Occupants prévus</label>
              <input
                type="number"
                min={0}
                value={settings.plannedOccupants}
                onChange={(e) =>
                  updateSettings({ plannedOccupants: parseInt(e.target.value, 10) || 0 })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Loyer par lit (₱/mois)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={settings.monthlyRentPerBed}
                onChange={(e) =>
                  updateSettings({ monthlyRentPerBed: parseFloat(e.target.value) || 0 })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Surface prise en compte</label>
              <select
                value={settings.areaBasis}
                onChange={(e) =>
                  updateSettings({ areaBasis: e.target.value as 'bedrooms' | 'all' })
                }
                className="input"
              >
                <option value="bedrooms">Chambres seules</option>
                <option value="all">Toutes les pièces louées</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={settings.womenOnly}
                  onChange={(e) => updateSettings({ womenOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-brand-600"
                />
                Étudiantes uniquement
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={settings.operatorIsForeign}
                  onChange={(e) => updateSettings({ operatorIsForeign: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-brand-600"
                />
                Exploitant étranger
              </label>
            </div>
          </div>
        </div>

        {/* ── Rules measured against the plan ── */}
        <div className="card p-6">
          <h2 className="mb-1 text-sm font-semibold text-ink">Règles vérifiées sur votre plan</h2>
          <p className="mb-5 text-xs text-ink-muted">
            Calculé à partir des pièces dessinées dans le module Plans.
          </p>
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.key}
                className={`rounded-xl border p-4 ${SEVERITY_STYLE[check.severity]}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {SEVERITY_ICON[check.severity]}
                    <span className="text-sm font-semibold text-ink">{check.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold tabular-nums text-ink">{check.value}</span>
                    <span className="ml-2 text-xs text-ink-muted">{check.requirement}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Permit tracker ── */}
        <div className="card p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Permis et autorisations</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {obtained} / {PERMIT_CATALOG.length} obtenus · reste à budgéter{' '}
                {peso(budget.low)} à {peso(budget.high)}
              </p>
            </div>
            {expiring.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                <CalendarClock className="h-3.5 w-3.5" />
                {expiring.length} à renouveler sous 60 jours
              </span>
            )}
          </div>

          <div className="space-y-3">
            {PERMIT_CATALOG.map((def) => {
              const item = permits.find((p) => p.key === def.key);
              if (!item) return null;
              return (
                <div key={def.key} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-faint">{def.order}</span>
                        <span className="text-sm font-semibold text-ink">{def.name}</span>
                        {def.blocking && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                            bloquant
                          </span>
                        )}
                        <span className="text-xs text-ink-faint">
                          {def.renewal === 'annual'
                            ? 'annuel'
                            : def.renewal === 'once'
                              ? 'une fois'
                              : 'continu'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{def.authority}</p>
                      <p className="mt-1.5 text-sm text-ink-soft">{def.why}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => setStatus(def.key, e.target.value as PermitStatus)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}
                      >
                        {(Object.keys(STATUS_LABEL) as PermitStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      {def.renewal !== 'once' && (
                        <input
                          type="date"
                          value={item.expiryDate ?? ''}
                          onChange={(e) => updatePermit(def.key, { expiryDate: e.target.value })}
                          className="input w-40 py-1 text-xs"
                          title="Date d'expiration"
                        />
                      )}
                      <input
                        type="number"
                        min={0}
                        placeholder={def.costLow ? `${def.costLow}` : 'coût'}
                        value={item.cost ?? ''}
                        onChange={(e) =>
                          updatePermit(def.key, { cost: parseFloat(e.target.value) || undefined })
                        }
                        className="input w-24 py-1 text-xs"
                        title="Coût payé (₱)"
                      />
                    </div>
                  </div>

                  {item.status !== 'not_started' && (
                    <input
                      type="text"
                      placeholder="Numéro de référence, notes…"
                      value={item.notes ?? ''}
                      onChange={(e) => updatePermit(def.key, { notes: e.target.value })}
                      className="input mt-3 py-1 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-xs text-ink-muted">
          <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Ces règles sont des repères issus de la réglementation nationale. Les seuils exacts, les
          montants et les prorogations varient selon la LGU et évoluent : à confirmer auprès de la
          mairie de Bacolod, du Bureau of Fire Protection et d&apos;un conseil juridique local.
        </p>
      </div>
    </main>
  );
}
