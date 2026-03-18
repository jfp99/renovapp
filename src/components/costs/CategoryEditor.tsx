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
  const { categories, addCategory, removeCategory } = useCostStore();
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
    addCategory(formData.name, formData.color, formData.budgetAllocation);
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
    if (editingId && !formData.name || formData.budgetAllocation < 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    // Note: We need to update the category in the store
    // For now, we'll remove and re-add
    if (editingId) {
      removeCategory(editingId);
      addCategory(formData.name, formData.color, formData.budgetAllocation);
      setEditingId(null);
      setFormData({
        name: '',
        color: COLOR_PRESETS[0],
        budgetAllocation: 0,
      });
    }
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Catégories</h3>
        {!isAddingNew && !editingId && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus size={18} />
            Nouvelle Catégorie
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Matériaux"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-transform ${
                      formData.color === color
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Allocation (₱)
              </label>
              <input
                type="number"
                value={formData.budgetAllocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetAllocation: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                min="0"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={editingId ? handleSaveEdit : handleAddNew}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune catégorie</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-600">
                    Budget: ₱
                    {category.budgetAllocation.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Êtes-vous sûr de vouloir supprimer cette catégorie ?'
                      )
                    ) {
                      removeCategory(category.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
