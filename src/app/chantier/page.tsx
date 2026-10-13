'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, HardHat, Pencil, Plus, Trash2, Users, Wallet, CheckCircle2 } from 'lucide-react';
import { useWorkLogStore } from '@/stores/workLogStore';
import { usePlanStore } from '@/stores/planStore';
import { useHydrated } from '@/lib/useHydrated';
import { IS_READONLY } from '@/lib/readonly';
import { formatDate } from '@/lib/format';
import {
  STATUS_LABELS,
  TRADES,
  TRADE_COLORS,
  TRADE_LABELS,
  personDays,
  summarize,
  taskCost,
  type GroupTotal,
} from '@/lib/worklog';
import { WorkTaskForm } from '@/components/worklog/WorkTaskForm';
import type { WorkStatus, WorkTask } from '@/types/worklog';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;
const days = (v: number) => {
  const r = Math.round(v * 10) / 10;
  return `${r.toLocaleString('fr-FR')} jour${r > 1 ? 's' : ''}`;
};

const STATUS_BADGE: Record<WorkStatus, string> = {
  done: 'badge-success',
  in_progress: 'badge-warning',
  planned: 'badge-muted',
};

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return 'Sans date';
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Bars({ groups, total }: { groups: GroupTotal[]; total: number }) {
  if (groups.length === 0) return <p className="text-sm text-ink-faint">Rien à afficher.</p>;
  const max = Math.max(...groups.map((g) => g.cost), 1);
  return (
    <ul className="space-y-3">
      {groups.map((g) => (
        <li key={g.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{g.label}</span>
            <span className="whitespace-nowrap tabular-nums text-ink-soft">
              {peso(g.cost)}
              <span className="ml-1.5 text-xs text-ink-faint">
                {total > 0 ? `${Math.round((g.cost / total) * 100)} %` : ''} · {days(g.days)}
              </span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-app)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(g.cost / max) * 100}%`, background: g.color ?? 'var(--color-brand, #B4552F)' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ChantierPage() {
  const hydrated = useHydrated();
  const { tasks, removeTask } = useWorkLogStore();
  const rooms = usePlanStore((s) => s.rooms);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkTask | undefined>();
  const [statusFilter, setStatusFilter] = useState<WorkStatus | ''>('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [highlight, setHighlight] = useState<string | null>(null);

  const roomNames = useMemo(() => new Map(rooms.map((r) => [r.id, r.name])), [rooms]);
  const summary = useMemo(() => summarize(tasks, roomNames), [tasks, roomNames]);

  // Arriving from a cost line (?tache=<id>): scroll to that task and open it.
  useEffect(() => {
    if (!hydrated) return;
    const id = new URLSearchParams(window.location.search).get('tache');
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setHighlight(id);
    window.setTimeout(() => document.getElementById(`tache-${id}`)?.scrollIntoView({ block: 'center' }), 100);
    if (!IS_READONLY) {
      setEditing(task);
      setFormOpen(true);
    }
    // Only on arrival, not on every task edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => (!statusFilter || t.status === statusFilter) && (!tradeFilter || t.trade === tradeFilter))
        .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')),
    [tasks, statusFilter, tradeFilter]
  );

  const byMonth = useMemo(() => {
    const groups = new Map<string, WorkTask[]>();
    for (const t of visible) {
      const key = (t.startDate || '').slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }
    return Array.from(groups.entries());
  }, [visible]);

  const usedTrades = TRADES.filter((tr) => tasks.some((t) => t.trade === tr));

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 md:px-8 md:py-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Rénovation</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Suivi du chantier</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Ce que les ouvriers ont fait, combien de temps ça a pris et combien ça a coûté.
            </p>
          </div>
          {!IS_READONLY && (
            <button onClick={openNew} className="btn-primary">
              <Plus size={16} /> Ajouter une tâche
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:space-y-7 md:px-8 md:py-8">
        {tasks.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
              <HardHat size={26} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">Aucune tâche enregistrée</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              {IS_READONLY
                ? 'Les travaux apparaîtront ici dès qu’ils auront été saisis.'
                : 'Notez chaque travail terminé : le métier, la durée approximative, le nombre d’ouvriers et le coût. Le total et la répartition se calculent tout seuls.'}
            </p>
            {!IS_READONLY && (
              <button onClick={openNew} className="btn-primary mt-5">
                <Plus size={16} /> Ajouter la première tâche
              </button>
            )}
          </div>
        ) : (
          <>
            {/* The four numbers an investor asks for */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"><Wallet size={13} /> Coût des travaux</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{peso(summary.totalCost)}</p>
                <p className="text-xs text-ink-faint">
                  main d&apos;œuvre {peso(summary.laborCost)} · matériaux {peso(summary.materialCost)}
                </p>
              </div>
              <div className="rounded-xl border border-pine-100 bg-pine-50/60 p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"><Clock size={13} /> Temps de travail</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">≈ {days(summary.days)}</p>
                <p className="text-xs text-ink-faint">soit {days(summary.personDays)}-ouvrier</p>
              </div>
              <div className="rounded-xl border border-accent-100 bg-accent-50/60 p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"><Users size={13} /> Coût d&apos;un ouvrier</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
                  {summary.dailyRate ? peso(summary.dailyRate) : '—'}
                </p>
                <p className="text-xs text-ink-faint">en moyenne, par jour</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white p-5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"><CheckCircle2 size={13} /> Avancement</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
                  {summary.done} / {tasks.length}
                </p>
                <p className="text-xs text-ink-faint">
                  terminées · {summary.inProgress} en cours · {summary.planned} à faire
                </p>
              </div>
            </div>

            {summary.firstDate && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <CalendarDays size={14} /> Chantier du {formatDate(summary.firstDate)} au{' '}
                {formatDate(summary.lastDate ?? summary.firstDate)}
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h2 className="section-title mb-4">Par métier</h2>
                <Bars groups={summary.byTrade} total={summary.totalCost} />
              </div>
              <div className="card p-6">
                <h2 className="section-title mb-4">Par pièce</h2>
                <Bars groups={summary.byRoom} total={summary.totalCost} />
                {tasks.some((t) => t.roomIds.length > 1) && (
                  <p className="mt-3 text-xs text-ink-faint">
                    Une tâche sur plusieurs pièces est répartie à parts égales entre elles.
                  </p>
                )}
              </div>
            </div>

            {/* Journal */}
            <div className="card p-4 md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">Journal des travaux</h2>
                <div className="flex flex-wrap gap-2">
                  <div className="flex rounded-lg bg-[var(--bg-app)] p-1 text-xs">
                    {(['', 'done', 'in_progress', 'planned'] as const).map((s) => (
                      <button
                        key={s || 'all'}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-md px-2.5 py-1 font-medium ${
                          statusFilter === s ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
                        }`}
                      >
                        {s ? STATUS_LABELS[s] : 'Toutes'}
                      </button>
                    ))}
                  </div>
                  {usedTrades.length > 1 && (
                    <select
                      value={tradeFilter}
                      onChange={(e) => setTradeFilter(e.target.value)}
                      className="input w-auto py-1.5 text-xs"
                      aria-label="Filtrer par métier"
                    >
                      <option value="">Tous les métiers</option>
                      {usedTrades.map((t) => (
                        <option key={t} value={t}>{TRADE_LABELS[t]}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {byMonth.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">Aucune tâche pour ce filtre.</p>}

              <div className="space-y-6">
                {byMonth.map(([month, list]) => (
                  <section key={month}>
                    <div className="mb-2 flex items-baseline justify-between border-b border-[var(--border)] pb-1.5">
                      <h3 className="text-sm font-semibold text-ink">{monthLabel(month)}</h3>
                      <span className="text-xs tabular-nums text-ink-muted">
                        {peso(list.reduce((s, t) => s + taskCost(t), 0))} · {days(list.reduce((s, t) => s + t.durationDays, 0))}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {list.map((t) => (
                        <li
                          key={t.id}
                          id={`tache-${t.id}`}
                          className={`rounded-xl border p-3.5 transition-shadow md:p-4 ${
                            highlight === t.id ? 'border-brand-400 ring-2 ring-brand-200' : 'border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: TRADE_COLORS[t.trade] }} />
                                <span className="font-semibold text-ink">{t.title}</span>
                                <span className={STATUS_BADGE[t.status]}>{STATUS_LABELS[t.status]}</span>
                              </div>
                              <p className="mt-1 text-xs text-ink-muted">
                                {TRADE_LABELS[t.trade]} · {formatDate(t.startDate)}
                                {t.endDate && t.endDate !== t.startDate ? ` → ${formatDate(t.endDate)}` : ''}
                                {t.roomIds.length > 0 &&
                                  ` · ${t.roomIds.map((id) => roomNames.get(id) ?? 'pièce supprimée').join(', ')}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold tabular-nums text-ink">{peso(taskCost(t))}</p>
                              {!t.linkCosts && taskCost(t) > 0 && (
                                <p className="text-[11px] text-ink-faint" title="Non reporté dans Coûts & ROI">hors Coûts</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                            <span className="inline-flex items-center gap-1"><Clock size={12} /> ≈ {days(t.durationDays)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Users size={12} /> {t.workers || 1} ouvrier{(t.workers || 1) > 1 ? 's' : ''}
                              {t.workerNames ? ` (${t.workerNames})` : ''}
                            </span>
                            {t.laborCost > 0 && <span>Main d&apos;œuvre {peso(t.laborCost)}</span>}
                            {t.materialCost > 0 && <span>Matériaux {peso(t.materialCost)}</span>}
                            {t.laborCost > 0 && personDays(t) > 0 && (
                              <span className="text-ink-faint">≈ {peso(t.laborCost / personDays(t))}/ouvrier/jour</span>
                            )}
                          </div>
                          {t.notes && <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{t.notes}</p>}

                          {!IS_READONLY && (
                            <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-2.5">
                              <button
                                onClick={() => {
                                  setEditing(t);
                                  setFormOpen(true);
                                }}
                                className="btn-ghost btn-sm"
                              >
                                <Pencil size={13} /> Modifier
                              </button>
                              <button
                                onClick={() => {
                                  const linked = t.linkCosts && taskCost(t) > 0;
                                  if (
                                    window.confirm(
                                      `Supprimer « ${t.title} » ?${linked ? '\nSes dépenses dans Coûts & ROI seront supprimées aussi.' : ''}`
                                    )
                                  )
                                    removeTask(t.id);
                                }}
                                className="btn-ghost btn-sm text-rose-600"
                              >
                                <Trash2 size={13} /> Supprimer
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {formOpen && !IS_READONLY && (
        <WorkTaskForm
          task={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(undefined);
          }}
        />
      )}
    </main>
  );
}
