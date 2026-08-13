'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { usePlanStore } from '@/stores/planStore';
import { CostEntry, CostStatus, Currency } from '@/types/cost';

interface CostFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingEntry?: CostEntry;
}

const CurrencySymbols: Record<Currency, string> = {
  PHP: '₱',
  EUR: '€',
  USD: '$',
};

const ExchangeRates: Record<Exclude<Currency, 'PHP'>, number> = {
  EUR: 58,
  USD: 52,
};

export const CostForm: React.FC<CostFormProps> = ({
  isOpen,
  onClose,
  editingEntry,
}) => {
  const { categories, addEntry, updateEntry } = useCostStore();
  const { rooms } = usePlanStore();

  const [formData, setFormData] = useState({
    description: '',
    categoryId: categories[0]?.id || '',
    amount: 0,
    currency: 'PHP' as Currency,
    exchangeRate: 1,
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    linkedRoomIds: [] as string[],
    status: 'planned' as CostStatus,
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        description: editingEntry.description,
        categoryId: editingEntry.categoryId,
        amount: editingEntry.amount,
        currency: editingEntry.currency,
        exchangeRate: editingEntry.exchangeRate,
        date: editingEntry.date,
        vendor: editingEntry.vendor || '',
        linkedRoomIds: editingEntry.linkedRoomIds,
        status: editingEntry.status,
      });
    } else {
      setFormData({
        description: '',
        categoryId: categories[0]?.id || '',
        amount: 0,
        currency: 'PHP',
        exchangeRate: 1,
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        linkedRoomIds: [],
        status: 'planned',
      });
    }
  }, [editingEntry, isOpen, categories]);

  const handleCurrencyChange = (currency: Currency) => {
    setFormData({
      ...formData,
      currency,
      exchangeRate: currency === 'PHP' ? 1 : ExchangeRates[currency as Exclude<Currency, 'PHP'>],
    });
  };

  const handleRoomToggle = (roomId: string) => {
    setFormData({
      ...formData,
      linkedRoomIds: formData.linkedRoomIds.includes(roomId)
        ? formData.linkedRoomIds.filter((id) => id !== roomId)
        : [...formData.linkedRoomIds, roomId],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.categoryId || formData.amount <= 0) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (editingEntry) {
      updateEntry(editingEntry.id, formData);
    } else {
      addEntry(formData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-float animate-scale-in">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">
            {editingEntry ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Description */}
          <div>
            <label className="label">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Peinture salon"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="label">
                Catégorie *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CostStatus,
                  })
                }
                className="input"
              >
                <option value="planned">Prévu</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="label">
                Montant *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <label className="label">
                Devise
              </label>
              <div className="flex gap-2">
                {(['PHP', 'EUR', 'USD'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      formData.currency === curr
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-ink-muted hover:bg-slate-200'
                    }`}
                  >
                    {curr} ({CurrencySymbols[curr]})
                  </button>
                ))}
              </div>
              {formData.currency !== 'PHP' && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  ≈ ₱{(formData.amount * formData.exchangeRate).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                  {' '}(taux : {formData.exchangeRate} ₱/{formData.currency})
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="label">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="input"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="label">
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                placeholder="Ex: Leroy Merlin"
                className="input"
              />
            </div>
          </div>

          {/* Linked Rooms */}
          {rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pièces liées
              </label>
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => (
                  <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.linkedRoomIds.includes(room.id)}
                      onChange={() => handleRoomToggle(room.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                    />
                    <span className="text-sm text-ink-soft">{room.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingEntry ? 'Mettre à jour' : 'Ajouter la dépense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
