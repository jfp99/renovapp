'use client';

import { useFurnitureStore } from '@/stores/furnitureStore';
import { Trash2, X } from 'lucide-react';

interface FurnitureDetailPanelProps {
  placementId: string;
  roomId: string;
  onClose: () => void;
}

export default function FurnitureDetailPanel({
  placementId,
  roomId,
  onClose,
}: FurnitureDetailPanelProps) {
  const { placements, updatePlacement, removePlacement, catalog } = useFurnitureStore();

  const placement = placements.find((p) => p.id === placementId);
  const catalogItem = placement ? catalog.find((c) => c.id === placement.catalogItemId) : null;

  if (!placement || !catalogItem) {
    return null;
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePlacement(placementId, {
      customLabel: e.target.value || undefined,
    });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = Math.max(10, parseFloat(e.target.value) || placement.width);
    updatePlacement(placementId, { width });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = Math.max(10, parseFloat(e.target.value) || placement.height);
    updatePlacement(placementId, { height });
  };

  const handleRotationChange = (rotation: number) => {
    updatePlacement(placementId, { rotation });
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce meuble?')) {
      removePlacement(placementId);
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Détails</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Catalog info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Catégorie</p>
          <p className="text-sm font-semibold text-gray-900">{catalogItem.category}</p>
          <p className="text-xs text-gray-600 mt-2">Modèle: {catalogItem.name}</p>
        </div>

        {/* Color indicator */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Couleur</p>
          <div
            className="w-full h-10 rounded-lg border border-gray-300"
            style={{ backgroundColor: catalogItem.color }}
          />
        </div>

        {/* Custom label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Étiquette personnalisée
          </label>
          <input
            type="text"
            value={placement.customLabel || ''}
            onChange={handleLabelChange}
            placeholder={catalogItem.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Largeur (cm)
          </label>
          <input
            type="number"
            value={placement.width}
            onChange={handleWidthChange}
            min={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Profondeur (cm)
          </label>
          <input
            type="number"
            value={placement.height}
            onChange={handleHeightChange}
            min={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Position info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="text-xs text-gray-600">Position</p>
          <p className="text-sm font-semibold text-gray-900">
            X: {Math.round(placement.x / 2)} cm
          </p>
          <p className="text-sm font-semibold text-gray-900">
            Y: {Math.round(placement.y / 2)} cm
          </p>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 90, 180, 270].map((rotation) => (
              <button
                key={rotation}
                onClick={() => handleRotationChange(rotation)}
                className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  placement.rotation === rotation
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {rotation}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}
