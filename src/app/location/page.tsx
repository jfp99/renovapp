'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BedDouble, LogOut, Trash2, Wrench } from 'lucide-react';
import { useTenancyStore } from '@/stores/tenancyStore';
import { useBedSlots } from '@/lib/bedSlots';
import { useHydrated } from '@/lib/useHydrated';
import { coversDate, heldDeposits, isOverdue, occupancyOn, today } from '@/lib/tenancy';
import { BedGrid } from '@/components/tenancy/BedGrid';
import { TenancyForm } from '@/components/tenancy/TenancyForm';
import type { BedSlot } from '@/types/tenancy';

const peso = (v: number) => `₱${Math.round(v).toLocaleString('fr-FR')}`;

export default function LocationPage() {
  const hydrated = useHydrated();
  const slots = useBedSlots();
  const {
    tenants,
    tenancies,
    payments,
    maintenance,
    materializeRent,
    markPaid,
    markUnpaid,
    endTenancy,
    removeTenancy,
    addMaintenance,
    removeMaintenance,
  } = useTenancyStore();

  const [selected, setSelected] = useState<BedSlot | null>(null);
  const [formSlot, setFormSlot] = useState<BedSlot | null>(null);
  const date = today();

  // Rent instalments are generated as unpaid; you confirm each one.
  useEffect(() => {
    materializeRent();
  }, [materializeRent, tenancies.length]);

  const occupancy = useMemo(
    () => occupancyOn(slots.map((s) => s.id), tenancies, date),
    [slots, tenancies, date]
  );

  const overdue = useMemo(
    () => payments.filter((p) => isOverdue(p, date)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [payments, date]
  );

  const upcoming = useMemo(
    () =>
      payments
        .filter((p) => !p.paidDate && p.dueDate >= date)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 8),
    [payments, date]
  );

  const collectedThisMonth = payments
    .filter((p) => p.paidDate?.startsWith(date.slice(0, 7)))
    .reduce((sum, p) => sum + p.amount, 0);

  const tenantById = new Map(tenants.map((t) => [t.id, t]));
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const tenancyById = new Map(tenancies.map((t) => [t.id, t]));

  const selectedTenancy = selected
    ? tenancies.find((t) => t.bedSlotId === selected.id && t.status !== 'ended' && coversDate(t, date)) ??
      tenancies.find((t) => t.bedSlotId === selected.id && t.status === 'reserved')
    : undefined;

  const selectedBlock = selected
    ? maintenance.find((b) => b.bedSlotId === selected.id && (!b.endDate || b.endDate >= date))
    : undefined;

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
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Exploitation</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Location</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Occupation réelle, contrats et encaissements — de quoi remplacer les hypothèses par des
            mesures.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:space-y-7 md:px-8 md:py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-5">
            <p className="text-xs font-medium text-ink-muted">Occupation aujourd&apos;hui</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
              {(occupancy.rate * 100).toFixed(0)} %
            </p>
            <p className="text-xs text-ink-faint">
              {occupancy.occupied} / {occupancy.total} lits
            </p>
          </div>
          <div className="rounded-xl border border-pine-100 bg-pine-50/60 p-5">
            <p className="text-xs font-medium text-ink-muted">Encaissé ce mois</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{peso(collectedThisMonth)}</p>
          </div>
          <div
            className={`rounded-xl border p-5 ${
              overdue.length > 0 ? 'border-red-200 bg-red-50/60' : 'border-[var(--border)] bg-white'
            }`}
          >
            <p className="text-xs font-medium text-ink-muted">Loyers en retard</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{overdue.length}</p>
            {overdue.length > 0 && (
              <p className="text-xs text-red-700">
                {peso(overdue.reduce((s, p) => s + p.amount, 0))} à recouvrer
              </p>
            )}
          </div>
          <div className="rounded-xl border border-accent-100 bg-accent-50/60 p-5">
            <p className="text-xs font-medium text-ink-muted">Dépôts détenus</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
              {peso(heldDeposits(tenancies))}
            </p>
            <p className="text-xs text-ink-faint">dus aux locataires</p>
          </div>
        </div>

        {overdue.length > 0 && (
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <h2 className="text-sm font-semibold text-ink">Loyers en retard</h2>
            </div>
            <div className="space-y-2">
              {overdue.map((payment) => {
                const tenancy = tenancyById.get(payment.tenancyId);
                const tenant = tenancy ? tenantById.get(tenancy.tenantId) : undefined;
                const slot = tenancy ? slotById.get(tenancy.bedSlotId) : undefined;
                return (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 py-2.5"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-ink">{tenant?.name ?? 'Locataire'}</span>
                      <span className="text-ink-muted"> · {slot?.label ?? 'lit supprimé'}</span>
                      <span className="text-ink-faint">
                        {' '}
                        · échéance du {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums text-ink">{peso(payment.amount)}</span>
                      <button onClick={() => markPaid(payment.id, date)} className="btn-primary btn-sm">
                        Marquer payé
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bed map */}
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-semibold text-ink">Plan des lits</h2>
          <BedGrid
            slots={slots}
            tenancies={tenancies}
            tenants={tenants}
            maintenance={maintenance}
            date={date}
            onSelect={setSelected}
            selectedId={selected?.id}
          />
        </div>

        {/* Selected bed */}
        {selected && (
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{selected.label}</h2>
                <p className="text-sm text-ink-muted">{selected.roomName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedTenancy && (
                  <button onClick={() => setFormSlot(selected)} className="btn-primary btn-sm">
                    <BedDouble size={14} /> Attribuer
                  </button>
                )}
                {selectedTenancy && (
                  <>
                    <button
                      onClick={() => endTenancy(selectedTenancy.id, date)}
                      className="btn-secondary btn-sm"
                    >
                      <LogOut size={14} /> Fin de séjour
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce contrat et ses échéances ?')) {
                          removeTenancy(selectedTenancy.id);
                        }
                      }}
                      className="btn-secondary btn-sm text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {selectedBlock ? (
                  <button
                    onClick={() => removeMaintenance(selectedBlock.id)}
                    className="btn-secondary btn-sm"
                  >
                    <Wrench size={14} /> Fin de maintenance
                  </button>
                ) : (
                  !selectedTenancy && (
                    <button
                      onClick={() => {
                        const reason = prompt('Motif de la maintenance ?') ?? '';
                        if (reason) addMaintenance({ bedSlotId: selected.id, startDate: date, reason });
                      }}
                      className="btn-secondary btn-sm"
                    >
                      <Wrench size={14} /> Mettre en maintenance
                    </button>
                  )
                )}
              </div>
            </div>

            {selectedTenancy && (
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                <Detail label="Locataire" value={tenantById.get(selectedTenancy.tenantId)?.name ?? '—'} />
                <Detail label="Loyer" value={`${peso(selectedTenancy.monthlyRent)}/mois`} />
                <Detail
                  label="Depuis le"
                  value={new Date(selectedTenancy.startDate).toLocaleDateString('fr-FR')}
                />
                <Detail label="Dépôt" value={peso(selectedTenancy.depositAmount)} />
                {tenantById.get(selectedTenancy.tenantId)?.phone && (
                  <Detail label="Téléphone" value={tenantById.get(selectedTenancy.tenantId)!.phone!} />
                )}
                {tenantById.get(selectedTenancy.tenantId)?.school && (
                  <Detail label="École" value={tenantById.get(selectedTenancy.tenantId)!.school!} />
                )}
              </div>
            )}

            {selectedBlock && (
              <p className="mt-4 rounded-lg bg-[var(--bg-app)] px-3 py-2 text-sm text-ink-muted">
                En maintenance depuis le{' '}
                {new Date(selectedBlock.startDate).toLocaleDateString('fr-FR')} — {selectedBlock.reason}
              </p>
            )}
          </div>
        )}

        {/* Upcoming rent */}
        {upcoming.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">Prochaines échéances</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="pb-2 font-medium">Échéance</th>
                  <th className="pb-2 font-medium">Locataire</th>
                  <th className="pb-2 font-medium">Lit</th>
                  <th className="pb-2 text-right font-medium">Montant</th>
                  <th className="pb-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {upcoming.map((payment) => {
                  const tenancy = tenancyById.get(payment.tenancyId);
                  const tenant = tenancy ? tenantById.get(tenancy.tenantId) : undefined;
                  const slot = tenancy ? slotById.get(tenancy.bedSlotId) : undefined;
                  return (
                    <tr key={payment.id} className="text-ink-soft">
                      <td className="py-2.5">{new Date(payment.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2.5">{tenant?.name ?? '—'}</td>
                      <td className="py-2.5">{slot?.label ?? '—'}</td>
                      <td className="py-2.5 text-right tabular-nums">{peso(payment.amount)}</td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => markPaid(payment.id, date)} className="btn-secondary btn-sm">
                          Payé
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment history */}
        {payments.some((p) => p.paidDate) && (
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">Encaissements</h2>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[var(--border)]">
                  {payments
                    .filter((p) => p.paidDate)
                    .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))
                    .map((payment) => {
                      const tenancy = tenancyById.get(payment.tenancyId);
                      const tenant = tenancy ? tenantById.get(tenancy.tenantId) : undefined;
                      return (
                        <tr key={payment.id} className="text-ink-soft">
                          <td className="py-2">
                            {new Date(payment.paidDate!).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-2">{tenant?.name ?? '—'}</td>
                          <td className="py-2 text-ink-faint">{payment.period}</td>
                          <td className="py-2 text-right tabular-nums">{peso(payment.amount)}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => markUnpaid(payment.id)}
                              className="text-xs text-ink-faint underline hover:text-ink-soft"
                            >
                              Annuler
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {formSlot && <TenancyForm slot={formSlot} onClose={() => setFormSlot(null)} />}
    </main>
  );
}

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-ink-muted">{label} :</span>
    <p className="font-semibold text-ink">{value}</p>
  </div>
);
