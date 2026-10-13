'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkLogStore } from '@/stores/workLogStore';
import { usePlanStore } from '@/stores/planStore';
import { todayIso } from '@/lib/localDate';
import { daysInclusive, STATUS_LABELS, TRADES, TRADE_LABELS } from '@/lib/worklog';
import type { WorkStatus, WorkTask, WorkTrade } from '@/types/worklog';

interface Props {
  task?: WorkTask;
  onClose: () => void;
}

const STATUSES: WorkStatus[] = ['done', 'in_progress', 'planned'];

/** Number inputs hold strings while typing, so "" doesn't snap back to 0. */
const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function WorkTaskForm({ task, onClose }: Props) {
  const { addTask, updateTask } = useWorkLogStore();
  const rooms = usePlanStore((s) => s.rooms);

  const [form, setForm] = useState({
    title: task?.title ?? '',
    trade: (task?.trade ?? 'maconnerie') as WorkTrade,
    status: (task?.status ?? 'done') as WorkStatus,
    startDate: task?.startDate ?? todayIso(),
    endDate: task?.endDate ?? '',
    durationDays: task ? String(task.durationDays || '') : '1',
    workers: task ? String(task.workers || '') : '1',
    workerNames: task?.workerNames ?? '',
    roomIds: task?.roomIds ?? ([] as string[]),
    laborCost: task ? String(task.laborCost || '') : '',
    materialCost: task ? String(task.materialCost || '') : '',
    linkCosts: task?.linkCosts ?? true,
    costPaid: task?.costPaid ?? true,
    notes: task?.notes ?? '',
  });
  // Once the duration is typed by hand, dates stop overwriting it.
  const [durationTouched, setDurationTouched] = useState(Boolean(task));
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDate = (key: 'startDate' | 'endDate', value: string) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      const span = daysInclusive(next.startDate, next.endDate);
      if (!durationTouched && span > 0) next.durationDays = String(span);
      return next;
    });

  const total = num(form.laborCost) + num(form.materialCost);
  const personDays = num(form.durationDays) * Math.max(1, num(form.workers));
  const dailyRate = num(form.laborCost) > 0 && personDays > 0 ? num(form.laborCost) / personDays : 0;

  const sortedRooms = useMemo(() => [...rooms].sort((a, b) => a.name.localeCompare(b.name)), [rooms]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('Décrivez la tâche en quelques mots.');
    if (form.endDate && form.endDate < form.startDate)
      return setError('La date de fin est avant la date de début.');

    const data: Omit<WorkTask, 'id'> = {
      title: form.title.trim(),
      trade: form.trade,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      durationDays: num(form.durationDays),
      workers: Math.round(num(form.workers)),
      workerNames: form.workerNames.trim() || undefined,
      roomIds: form.roomIds,
      laborCost: num(form.laborCost),
      materialCost: num(form.materialCost),
      linkCosts: form.linkCosts,
      costPaid: form.costPaid,
      notes: form.notes.trim() || undefined,
    };
    if (task) updateTask(task.id, data);
    else addTask(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-float animate-scale-in sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{task ? 'Modifier la tâche' : 'Nouvelle tâche de chantier'}</h2>
            <p className="text-sm text-ink-muted">Ce qui a été fait, par qui, combien de temps et pour combien.</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink-soft" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="label" htmlFor="wt-title">Tâche réalisée *</label>
            <input
              id="wt-title"
              className="input"
              placeholder="Ex : Carrelage salle de bain"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="wt-trade">Métier</label>
              <select id="wt-trade" className="input" value={form.trade} onChange={(e) => set('trade', e.target.value as WorkTrade)}>
                {TRADES.map((t) => (
                  <option key={t} value={t}>{TRADE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Avancement</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--bg-app)] p-1">
                {STATUSES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => set('status', s)}
                    className={`rounded-md px-1 py-1.5 text-xs font-medium transition-colors ${
                      form.status === s ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-[var(--border)] p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Temps</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="wt-start">Début</label>
                <input id="wt-start" type="date" className="input" value={form.startDate} onChange={(e) => setDate('startDate', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wt-end">Fin (si connue)</label>
                <input id="wt-end" type="date" className="input" value={form.endDate} onChange={(e) => setDate('endDate', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wt-days">Durée approx. (jours)</label>
                <input
                  id="wt-days"
                  inputMode="decimal"
                  className="input"
                  value={form.durationDays}
                  onChange={(e) => {
                    setDurationTouched(true);
                    set('durationDays', e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="label" htmlFor="wt-workers">Nombre d&apos;ouvriers</label>
                <input id="wt-workers" inputMode="numeric" className="input" value={form.workers} onChange={(e) => set('workers', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="wt-names">Qui (facultatif)</label>
              <input
                id="wt-names"
                className="input"
                placeholder="Ex : Tonio + 2 aides"
                value={form.workerNames}
                onChange={(e) => set('workerNames', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-[var(--border)] p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Coût (₱)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="wt-labor">Main d&apos;œuvre</label>
                <input id="wt-labor" inputMode="decimal" className="input" placeholder="0" value={form.laborCost} onChange={(e) => set('laborCost', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="wt-mat">Matériaux</label>
                <input id="wt-mat" inputMode="decimal" className="input" placeholder="0" value={form.materialCost} onChange={(e) => set('materialCost', e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Total <strong className="text-ink">₱{Math.round(total).toLocaleString('fr-FR')}</strong>
              {dailyRate > 0 && (
                <> · soit ≈ ₱{Math.round(dailyRate).toLocaleString('fr-FR')} par ouvrier et par jour</>
              )}
            </p>
            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input type="checkbox" className="mt-0.5" checked={form.linkCosts} onChange={(e) => set('linkCosts', e.target.checked)} />
              <span>
                Reporter dans <strong>Coûts &amp; ROI</strong>
                <span className="block text-xs text-ink-muted">
                  Décochez si ces montants y sont déjà saisis, pour ne pas les compter deux fois.
                </span>
              </span>
            </label>
            {form.linkCosts && (
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={form.costPaid} onChange={(e) => set('costPaid', e.target.checked)} />
                Déjà payé (sinon compté comme prévu)
              </label>
            )}
          </fieldset>

          {sortedRooms.length > 0 && (
            <div>
              <span className="label">Pièces concernées</span>
              <div className="flex flex-wrap gap-1.5">
                {sortedRooms.map((room) => {
                  const on = form.roomIds.includes(room.id);
                  return (
                    <button
                      type="button"
                      key={room.id}
                      onClick={() =>
                        set('roomIds', on ? form.roomIds.filter((id) => id !== room.id) : [...form.roomIds, room.id])
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-[var(--border)] text-ink-muted hover:border-brand-300'
                      }`}
                      aria-pressed={on}
                    >
                      {room.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-ink-faint">Aucune sélection = toute la maison.</p>
            </div>
          )}

          <div>
            <label className="label" htmlFor="wt-notes">Notes</label>
            <textarea
              id="wt-notes"
              className="input min-h-[72px]"
              placeholder="Problème rencontré, qualité du travail, à refaire…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-[var(--border)] bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" className="btn-primary flex-1">{task ? 'Enregistrer' : 'Ajouter la tâche'}</button>
        </div>
      </form>
    </div>
  );
}
