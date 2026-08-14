'use client';

import { useFurnitureStore } from '@/stores/furnitureStore';
import type { FurnitureCategory } from '@/types/furniture';
import { Trash2, X, Copy, RotateCw } from 'lucide-react';

const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  bed: 'Lit',
  storage: 'Rangement',
  desk: 'Bureau',
  chair: 'Assise',
  table: 'Table',
  bathroom: 'Salle de bain',
  kitchen: 'Cuisine',
};

interface Props {
  placementId: string;
  roomId: string;
  onClose: () => void;
}

export default function FurnitureDetailPanel({ placementId, onClose }: Props) {
  const { placements, updatePlacement, removePlacement, duplicatePlacement, catalog } = useFurnitureStore();

  const placement = placements.find((p) => p.id === placementId);
  const item = placement ? catalog.find((c) => c.id === placement.catalogItemId) : null;
  if (!placement || !item) return null;

  const set = (u: Partial<typeof placement>) => updatePlacement(placementId, u);

  return (
    <div className="flex h-full w-72 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 h-[60px]">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md border border-black/5" style={{ background: item.color }} />
          <h2 className="text-sm font-bold text-ink">Détails du meuble</h2>
        </div>
        <button onClick={onClose} className="text-ink-faint hover:text-ink-soft" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="rounded-xl bg-[var(--bg-app)] p-3">
          <p className="text-xs text-ink-faint">Modèle · {CATEGORY_LABELS[item.category]}</p>
          <p className="text-sm font-semibold text-ink">{item.name}</p>
        </div>

        <div>
          <label className="label">Étiquette personnalisée</label>
          <input
            type="text"
            value={placement.customLabel || ''}
            onChange={(e) => set({ customLabel: e.target.value || undefined })}
            placeholder={item.name}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Largeur (cm)</label>
            <input
              type="number"
              value={placement.width}
              min={10}
              onChange={(e) => set({ width: Math.max(10, parseFloat(e.target.value) || placement.width) })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Profondeur (cm)</label>
            <input
              type="number"
              value={placement.height}
              min={10}
              onChange={(e) => set({ height: Math.max(10, parseFloat(e.target.value) || placement.height) })}
              className="input"
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0">Rotation</label>
            <span className="font-mono text-xs text-ink-muted">{placement.rotation}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            value={placement.rotation}
            onChange={(e) => set({ rotation: parseInt(e.target.value) })}
            className="w-full accent-brand-600"
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[0, 90, 180, 270].map((r) => (
              <button
                key={r}
                onClick={() => set({ rotation: r })}
                className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  placement.rotation === r ? 'bg-brand-600 text-white' : 'bg-[var(--bg-app)] text-ink-muted hover:bg-[var(--border)]'
                }`}
              >
                {r}°
              </button>
            ))}
          </div>
          <button
            onClick={() => set({ rotation: (placement.rotation + 90) % 360 })}
            className="btn-secondary btn-sm mt-2 w-full"
          >
            <RotateCw size={14} /> Pivoter 90° <span className="text-ink-faint">(R)</span>
          </button>
        </div>

        <div className="rounded-xl bg-[var(--bg-app)] p-3 text-xs text-ink-muted">
          Position : X {Math.round(placement.x / 2)} cm · Y {Math.round(placement.y / 2)} cm
        </div>
      </div>

      {/* Footer actions */}
      <div className="space-y-2 border-t border-[var(--border)] p-4">
        <button onClick={() => duplicatePlacement(placementId)} className="btn-secondary btn-sm w-full">
          <Copy size={14} /> Dupliquer <span className="text-ink-faint">(Ctrl+D)</span>
        </button>
        <button
          onClick={() => { removePlacement(placementId); onClose(); }}
          className="btn-danger btn-sm w-full"
        >
          <Trash2 size={14} /> Retirer
        </button>
      </div>
    </div>
  );
}
