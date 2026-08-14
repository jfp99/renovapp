'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useCostStore } from '@/stores/costStore';
import { CostCategory } from '@/types/cost';

const COLOR_PRESETS = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#6b7280',
  '#ec4899',
  '#14b8a6',
  '#f43f5e',
];

interface CategoryEditForm {
  name: string;
  color: string;
  budgetAllocation: number;
}

export const CategoryEditor: React.FC = () => {
  const { categories, addCategory, updateCategory, removeCategory } = useCostStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryEditForm>({
    name: '',
    color: COLOR_PRESETS[0],
    budgetAllocation: 0,
  });

  const handleAddNew = () => {
    if (!formData.name || formData.budgetAllocation < 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    addCategory(formData.name, formData.color, formData.budgetAllocation, 'capex');
    setFormData({
      name: '',
      color: COLOR_PRESETS[0],
      budgetAllocation: 0,
    });
    setIsAddingNew(false);
  };

  const handleEditCategory = (category: CostCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      color: category.color,
      budgetAllocation: category.budgetAllocation,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !formData.name || formData.budgetAllocation < 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    // Proper in-place update — keeps the category id so linked expenses stay attached
    updateCategory(editingId, {
      name: formData.name,
      color: formData.color,
      budgetAllocation: formData.budgetAllocation,
    });
    setEditingId(null);
    setFormData({ name: '', color: COLOR_PRESETS[0], budgetAllocation: 0 });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      color: COLOR_PRESETS[0],
      budgetAllocation: 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Catégories</h3>
        {!isAddingNew && !editingId && (
          <button onClick={() => setIsAddingNew(true)} className="btn-primary btn-sm">
            <Plus size={15} /> Nouvelle catégorie
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-app)] p-4">
          <div className="space-y-4">
            <div>
              <label className="label">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex : Matériaux"
                className="input"
              />
            </div>

            <div>
              <label className="label">Couleur</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-9 w-9 rounded-lg border-2 transition-transform hover:scale-110 ${
                      formData.color === color ? 'border-ink scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label">Budget alloué (₱)</label>
              <input
                type="number"
                value={formData.budgetAllocation}
                onChange={(e) => setFormData({ ...formData, budgetAllocation: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="100"
                className="input"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn-secondary btn-sm flex-1">Annuler</button>
              <button onClick={editingId ? handleSaveEdit : handleAddNew} className="btn-primary btn-sm flex-1">
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-ink-faint">Aucune catégorie</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-3.5 transition-shadow hover:shadow-card-hover"
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="h-9 w-9 flex-shrink-0 rounded-lg" style={{ backgroundColor: category.color }} />
                <div className="flex-1">
                  <p className="font-medium text-ink">{category.name}</p>
                  <p className="text-sm text-ink-muted">
                    Budget : ₱{category.budgetAllocation.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEditCategory(category)} className="rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50" title="Modifier">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) removeCategory(category.id);
                  }}
                  className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
