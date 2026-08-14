'use client';

import { useState } from 'react';
import { InspirationImage } from '@/types/inspiration';
import { Room } from '@/types/plan';
import { useInspirationStore } from '@/stores/inspirationStore';
import { X, Trash2 } from 'lucide-react';
import { useMediaUrl } from '@/lib/useMediaUrl';

interface ImageDetailModalProps {
  image: InspirationImage;
  rooms: Room[];
  onClose: () => void;
}

export default function ImageDetailModal({
  image,
  rooms,
  onClose,
}: ImageDetailModalProps) {
  const fileUrl = useMediaUrl(image.fileId, image.fileData);
  const [note, setNote] = useState(image.note);
  const [tags, setTags] = useState(image.tags);
  const [tagInput, setTagInput] = useState('');
  const [linkedRoomIds, setLinkedRoomIds] = useState(image.linkedRoomIds);
  const [source, setSource] = useState(image.source || '');

  const updateImage = useInspirationStore((state) => state.updateImage);
  const removeImage = useInspirationStore((state) => state.removeImage);

  const handleSave = () => {
    updateImage(image.id, {
      note,
      tags,
      linkedRoomIds,
      source: source || undefined,
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
    if (confirm('Retirer cette image du tableau d\'inspiration ?')) {
      removeImage(image.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-float animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Détails de l&apos;image</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink-soft">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Image */}
            <div>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-app)]">
                <img src={fileUrl} alt="Inspiration" className="h-auto max-h-96 w-full object-contain" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-5">
              <div>
                <label className="label">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Vos notes sur cette inspiration…"
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="label">URL source</label>
                <input type="url" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…" className="input" />
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
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-ink-faint">Aucune pièce créée</p>
                  ) : (
                    rooms.map((room) => (
                      <label key={room.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-[var(--bg-app)]">
                        <input
                          type="checkbox"
                          checked={linkedRoomIds.includes(room.id)}
                          onChange={() => handleRoomToggle(room.id)}
                          className="h-4 w-4 rounded border-[var(--border-strong)] accent-brand-600"
                        />
                        <span className="text-sm text-ink-soft">{room.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-1 border-t border-[var(--border)] pt-4 text-xs text-ink-faint">
                <p>Ajoutée le : {new Date(image.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-[var(--border)] bg-[var(--bg-app)] px-6 py-4">
          <button onClick={handleDelete} className="btn-danger btn-sm">
            <Trash2 className="h-4 w-4" /> Retirer
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
