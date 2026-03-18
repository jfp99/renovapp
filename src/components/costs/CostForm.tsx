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
      alert('Please fill in all required fields');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {editingEntry ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Peinture salon"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <div className="flex gap-2">
                {(['PHP', 'EUR', 'USD'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      formData.currency === curr
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {curr} ({CurrencySymbols[curr]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                placeholder="Ex: Leroy Merlin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label key={room.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.linkedRoomIds.includes(room.id)}
                      onChange={() => handleRoomToggle(room.id)}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-700">{room.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              {editingEntry ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
