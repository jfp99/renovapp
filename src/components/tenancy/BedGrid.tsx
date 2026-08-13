'use client';

import React from 'react';
import { BedDouble, Wrench } from 'lucide-react';
import type { BedSlot, MaintenanceBlock, Tenancy, Tenant } from '@/types/tenancy';
import { coversDate, isBlocked } from '@/lib/tenancy';

interface Props {
  slots: BedSlot[];
  tenancies: Tenancy[];
  tenants: Tenant[];
  maintenance: MaintenanceBlock[];
  date: string;
  onSelect: (slot: BedSlot) => void;
  selectedId?: string;
}

const STATE_STYLES = {
  occupied: 'border-emerald-300 bg-emerald-50',
  reserved: 'border-amber-300 bg-amber-50',
  maintenance: 'border-slate-300 bg-slate-100',
  free: 'border-dashed border-[var(--border-strong)] bg-white',
} as const;

const STATE_LABELS = {
  occupied: 'Occupé',
  reserved: 'Réservé',
  maintenance: 'Maintenance',
  free: 'Libre',
} as const;

/** One card per sleeping place, grouped by room — the daily operations view. */
export const BedGrid: React.FC<Props> = ({
  slots,
  tenancies,
  tenants,
  maintenance,
  date,
  onSelect,
  selectedId,
}) => {
  const tenantById = new Map(tenants.map((t) => [t.id, t]));

  const rooms = Array.from(new Set(slots.map((s) => s.roomId))).map((roomId) => ({
    roomId,
    roomName: slots.find((s) => s.roomId === roomId)?.roomName ?? '',
    slots: slots.filter((s) => s.roomId === roomId),
  }));

  const resolve = (slot: BedSlot) => {
    const active = tenancies.find(
      (t) => t.bedSlotId === slot.id && t.status !== 'reserved' && coversDate(t, date)
    );
    if (active) return { state: 'occupied' as const, tenancy: active };

    const reserved = tenancies.find(
      (t) => t.bedSlotId === slot.id && t.status === 'reserved' && (!t.endDate || t.endDate >= date)
    );
    if (reserved) return { state: 'reserved' as const, tenancy: reserved };

    if (isBlocked(maintenance, slot.id, date)) return { state: 'maintenance' as const, tenancy: undefined };
    return { state: 'free' as const, tenancy: undefined };
  };

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-10 text-center">
        <BedDouble className="mx-auto h-8 w-8 text-ink-faint" />
        <p className="mt-3 font-medium text-ink">Aucun lit sur le plan</p>
        <p className="mt-1 text-sm text-ink-muted">
          Placez des lits dans l&apos;onglet Meubles : chaque lit devient une place louable, et un
          lit superposé en compte deux.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rooms.map((room) => (
        <div key={room.roomId}>
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            {room.roomName}
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {room.slots.map((slot) => {
              const { state, tenancy } = resolve(slot);
              const tenant = tenancy ? tenantById.get(tenancy.tenantId) : undefined;
              return (
                <button
                  key={slot.id}
                  onClick={() => onSelect(slot)}
                  className={`rounded-xl border p-3.5 text-left transition-all hover:shadow-card ${
                    STATE_STYLES[state]
                  } ${selectedId === slot.id ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{slot.label}</span>
                    {state === 'maintenance' && <Wrench size={14} className="text-ink-faint" />}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{STATE_LABELS[state]}</p>
                  {tenant && (
                    <p className="mt-1.5 truncate text-sm font-medium text-ink-soft">{tenant.name}</p>
                  )}
                  {tenancy && (
                    <p className="text-xs tabular-nums text-ink-faint">
                      ₱{tenancy.monthlyRent.toLocaleString('fr-FR')}/mois
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
