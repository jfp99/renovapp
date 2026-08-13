'use client';

import { useState } from 'react';
import { Blueprint } from '@/types/blueprint';
import { Room } from '@/types/plan';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { X, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

interface BlueprintDetailProps {
  blueprint: Blueprint;
  rooms: Room[];
  onClose: () => void;
}

export default function BlueprintDetail({
  blueprint,
  rooms,
  onClose,
}: BlueprintDetailProps) {
  const [name, setName] = useState(blueprint.name);
  const [description, setDescription] = useState(blueprint.description);
  const [tags, setTags] = useState(blueprint.tags);
  const [tagInput, setTagInput] = useState('');
  const [linkedRoomIds, setLinkedRoomIds] = useState(blueprint.linkedRoomIds);
  const [zoom, setZoom] = useState(1);

  const updateBlueprint = useBlueprintStore((state) => state.updateBlueprint);
  const removeBlueprint = useBlueprintStore((state) => state.removeBlueprint);

  const handleSave = () => {
    updateBlueprint(blueprint.id, {
      name,
      description,
      tags,
      linkedRoomIds,
    });
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleRoomToggle = (roomId: string) => {
    setLinkedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleDelete = () => {
    if (confirm('Supprimer ce blueprint ?')) {
      removeBlueprint(blueprint.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-float animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Détails du blueprint</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink-soft">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Image viewer */}
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-slate-100">
                <div className="flex min-h-[400px] items-center justify-center">
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="transition-transform">
                    <img src={blueprint.fileData} alt={blueprint.name} className="h-auto max-h-[400px] max-w-full" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-xl bg-white p-1 shadow-card">
                  <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="rounded-lg p-2 text-ink-muted hover:bg-slate-100">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm text-ink-muted">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="rounded-lg p-2 text-ink-muted hover:bg-slate-100">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5 lg:col-span-1">
              <div>
                <label className="label">Nom</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input resize-none" />
              </div>
              <div>
                <label className="label">Tags</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Ajouter un tag puis Entrée…"
                  className="input mb-2 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="text-brand-400 hover:text-brand-700">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Pièces liées</label>
                <div className="space-y-1.5">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-ink-faint">Aucune pièce créée</p>
                  ) : (
                    rooms.map((room) => (
                      <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={linkedRoomIds.includes(room.id)}
                          onChange={() => handleRoomToggle(room.id)}
                          className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                        />
                        <span className="text-sm text-ink-soft">{room.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-1 border-t border-[var(--border)] pt-4 text-xs text-ink-faint">
                <p>Créé le : {new Date(blueprint.createdAt).toLocaleString('fr-FR')}</p>
                <p>Type : {blueprint.fileType}</p>
              </div>
            </div>
          </div>

          {blueprint.annotations.length > 0 && (
            <div className="mt-6 border-t border-[var(--border)] pt-6">
              <h3 className="mb-3 font-semibold text-ink">Annotations</h3>
              <div className="space-y-2">
                {blueprint.annotations.map((annotation) => (
                  <div key={annotation.id} className="rounded-xl border border-[var(--border)] bg-slate-50 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase text-ink-faint">{annotation.type}</p>
                        <p className="mt-1 text-sm text-ink">{annotation.content}</p>
                      </div>
                      <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: annotation.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-[var(--border)] bg-slate-50 px-6 py-4">
          <button onClick={handleDelete} className="btn-danger btn-sm">
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary btn-sm">Annuler</button>
            <button onClick={handleSave} className="btn-primary btn-sm">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
