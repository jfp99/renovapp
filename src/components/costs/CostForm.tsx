'use client';

import React, { useState, useEffect } from 'react';
import { Paperclip, Repeat, Trash2, X } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { usePlanStore } from '@/stores/planStore';
import { CostEntry, CostNature, CostStatus, Currency, PaymentMethod, Recurrence } from '@/types/cost';
import { putMediaBlob, deleteMedia } from '@/lib/mediaDb';
import { useMediaUrl } from '@/lib/useMediaUrl';

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



const ReceiptPreview: React.FC<{ fileId: string }> = ({ fileId }) => {
  const url = useMediaUrl(fileId);
  if (!url) return <span className="text-sm text-ink-faint">Reçu joint</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-sm text-brand-600 underline"
    >
      <span className="h-9 w-9 overflow-hidden rounded border border-[var(--border)] bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </span>
      Voir le reçu
    </a>
  );
};

export const CostForm: React.FC<CostFormProps> = ({
  isOpen,
  onClose,
  editingEntry,
}) => {
  const { categories, addEntry, updateEntry, getRate, settings, updateSettings } = useCostStore();
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
    nature: 'capex' as CostNature,
    recurrence: 'none' as Recurrence,
    recurrenceEndDate: '',
    paymentMethod: 'cash' as PaymentMethod,
    receiptFileId: undefined as string | undefined,
  });
  const [uploading, setUploading] = useState(false);

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
        nature: editingEntry.nature ?? 'capex',
        recurrence: editingEntry.recurrence ?? 'none',
        recurrenceEndDate: editingEntry.recurrenceEndDate ?? '',
        paymentMethod: editingEntry.paymentMethod ?? 'cash',
        receiptFileId: editingEntry.receiptFileId,
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
        nature: categories[0]?.defaultNature ?? 'capex',
        recurrence: 'none',
        recurrenceEndDate: '',
        paymentMethod: 'cash',
        receiptFileId: undefined,
      });
    }
  }, [editingEntry, isOpen, categories]);

  const handleCurrencyChange = (currency: Currency) => {
    setFormData({
      ...formData,
      currency,
      exchangeRate: getRate(currency),
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

    const payload = {
      ...formData,
      recurrenceEndDate: formData.recurrenceEndDate || undefined,
      // A generated instalment must never become a template itself.
      recurrence: editingEntry?.recurrenceParentId ? 'none' : formData.recurrence,
    };

    if (editingEntry) {
      updateEntry(editingEntry.id, payload);
    } else {
      addEntry(payload);
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

            {/* Nature: CAPEX vs OPEX — drives where the amount lands in the ROI */}
            <div className="col-span-2">
              <label className="label">Nature de la dépense</label>
              <div className="mt-1 flex gap-2">
                {(
                  [
                    ['capex', 'Investissement', 'Rénovation, mobilier — à rentabiliser'],
                    ['opex', 'Charge récurrente', 'Loyer, électricité, salaire — mensuel'],
                  ] as Array<[CostNature, string, string]>
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, nature: value })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      formData.nature === value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-[var(--border)] text-ink-muted hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">{label}</span>
                    <span className="block text-xs text-ink-faint">{hint}</span>
                  </button>
                ))}
              </div>
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

          {/* Payment method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Moyen de paiement</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                }
                className="input"
              >
                <option value="cash">Espèces</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="transfer">Virement</option>
                <option value="card">Carte</option>
                <option value="other">Autre</option>
              </select>
              {formData.paymentMethod === 'cash' && (
                <p className="mt-1 text-xs text-amber-700">
                  Les espèces ne laissent aucune trace : joignez le reçu.
                </p>
              )}
            </div>

            {/* Receipt */}
            <div>
              <label className="label">Reçu</label>
              {formData.receiptFileId ? (
                <div className="mt-1 flex items-center gap-2">
                  <ReceiptPreview fileId={formData.receiptFileId} />
                  <button
                    type="button"
                    onClick={() => {
                      const id = formData.receiptFileId;
                      setFormData({ ...formData, receiptFileId: undefined });
                      if (id) void deleteMedia(id);
                    }}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Retirer le reçu"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-2 text-sm text-ink-muted hover:bg-slate-50">
                  <Paperclip size={15} />
                  {uploading ? 'Ajout…' : 'Joindre une photo ou un PDF'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const fileId = await putMediaBlob(file, file.name);
                        setFormData((prev) => ({ ...prev, receiptFileId: fileId }));
                      } catch (error) {
                        console.error('[RenovApp] Reçu non enregistré :', error);
                        alert("Le reçu n'a pas pu être enregistré.");
                      } finally {
                        setUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Recurrence */}
          {!editingEntry?.recurrenceParentId && (
            <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-4">
              <div className="flex items-center gap-2">
                <Repeat size={15} className="text-brand-600" />
                <label className="text-sm font-medium text-ink-soft">Dépense récurrente</label>
              </div>
              <p className="mt-0.5 text-xs text-ink-faint">
                Loyer, internet, salaire… Les échéances sont créées automatiquement, en
                &laquo;&nbsp;prévu&nbsp;&raquo; : à vous de confirmer chaque paiement.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <select
                  value={formData.recurrence}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence: e.target.value as Recurrence })
                  }
                  className="input"
                >
                  <option value="none">Ponctuelle</option>
                  <option value="monthly">Tous les mois</option>
                  <option value="quarterly">Tous les trimestres</option>
                  <option value="yearly">Tous les ans</option>
                </select>

                {formData.recurrence !== 'none' && (
                  <div>
                    <input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) =>
                        setFormData({ ...formData, recurrenceEndDate: e.target.value })
                      }
                      className="input"
                    />
                    <p className="mt-1 text-xs text-ink-faint">Fin (optionnel)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exchange rate — project-wide, so two expenses can't disagree */}
          {formData.currency !== 'PHP' && (
            <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-4">
              <label className="text-sm font-medium text-ink-soft">
                Taux de référence du projet — 1 {formData.currency} =
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.exchangeRates[formData.currency as Exclude<Currency, 'PHP'>] ?? 0}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    updateSettings({
                      exchangeRates: {
                        ...settings.exchangeRates,
                        [formData.currency as Exclude<Currency, 'PHP'>]: rate,
                      },
                    });
                    setFormData((prev) => ({ ...prev, exchangeRate: rate }));
                  }}
                  className="input w-32"
                />
                <span className="text-sm text-ink-muted">₱</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Modifie le taux de tout le projet, pour éviter deux dépenses converties
                différemment.
              </p>
            </div>
          )}

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
