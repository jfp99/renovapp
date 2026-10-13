'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTenancyStore } from '@/stores/tenancyStore';
import { today } from '@/lib/tenancy';
import type { BedSlot } from '@/types/tenancy';

interface Props {
  slot: BedSlot;
  onClose: () => void;
}

/** Move a tenant into a specific bed: person + contract in one step. */
export const TenancyForm: React.FC<Props> = ({ slot, onClose }) => {
  const { tenants, addTenant, addTenancy } = useTenancyStore();

  const [existingTenantId, setExistingTenantId] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    school: '',
    emergencyContact: '',
    startDate: today(),
    monthlyRent: 0,
    depositAmount: 0,
    advanceAmount: 0,
    dueDay: 5,
    status: 'active' as 'active' | 'reserved',
    notes: '',
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!existingTenantId && !form.name.trim()) {
      alert('Indiquez le nom du locataire.');
      return;
    }
    if (form.monthlyRent <= 0) {
      alert('Indiquez le loyer mensuel.');
      return;
    }

    const tenantId =
      existingTenantId ||
      addTenant({
        name: form.name.trim(),
        phone: form.phone || undefined,
        school: form.school || undefined,
        emergencyContact: form.emergencyContact || undefined,
      });

    addTenancy({
      tenantId,
      bedSlotId: slot.id,
      startDate: form.startDate,
      monthlyRent: form.monthlyRent,
      depositAmount: form.depositAmount,
      advanceAmount: form.advanceAmount,
      status: form.status,
      dueDay: form.dueDay,
      notes: form.notes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-float animate-scale-in">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Attribuer ce lit</h2>
            <p className="text-sm text-ink-muted">
              {slot.roomName} · {slot.label}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {tenants.length > 0 && (
            <div>
              <label className="label" htmlFor="tenancyform-f1">Locataire existant</label>
              <select id="tenancyform-f1"
                value={existingTenantId}
                onChange={(e) => setExistingTenantId(e.target.value)}
                className="input"
              >
                <option value="">— Nouveau locataire —</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!existingTenantId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label" htmlFor="tenancyform-f2">Nom *</label>
                <input id="tenancyform-f2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Ex : Maria Santos"
                />
              </div>
              <div>
                <label className="label" htmlFor="tenancyform-f3">Téléphone</label>
                <input id="tenancyform-f3"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div>
                <label className="label" htmlFor="tenancyform-f4">École</label>
                <input id="tenancyform-f4"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="tenancyform-f5">Contact d&apos;urgence</label>
                <input id="tenancyform-f5"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  className="input"
                  placeholder="Nom et téléphone d'un proche"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="tenancyform-f6">Date d&apos;entrée</label>
              <input id="tenancyform-f6"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tenancyform-f7">Statut</label>
              <select id="tenancyform-f7"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'reserved' })}
                className="input"
              >
                <option value="active">Occupé</option>
                <option value="reserved">Réservé</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="tenancyform-f8">Loyer mensuel (₱) *</label>
              <input id="tenancyform-f8"
                type="number"
                min="0"
                value={form.monthlyRent}
                onChange={(e) => setForm({ ...form, monthlyRent: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tenancyform-f9">Jour d&apos;échéance</label>
              <input id="tenancyform-f9"
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value, 10) || 1 })}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tenancyform-f10">Avance (₱)</label>
              <input id="tenancyform-f10"
                type="number"
                min="0"
                value={form.advanceAmount}
                onChange={(e) => setForm({ ...form, advanceAmount: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="tenancyform-f11">Dépôt de garantie (₱)</label>
              <input id="tenancyform-f11"
                type="number"
                min="0"
                value={form.depositAmount}
                onChange={(e) => setForm({ ...form, depositAmount: parseFloat(e.target.value) || 0 })}
                className="input"
              />
              <p className="mt-1 text-xs text-ink-faint">Encaissé, mais dû au locataire à sa sortie.</p>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="tenancyform-f12">Notes</label>
            <textarea id="tenancyform-f12"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input"
            />
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
