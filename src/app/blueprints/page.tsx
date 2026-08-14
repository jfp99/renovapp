'use client';

import { useState, useMemo } from 'react';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { usePlanStore } from '@/stores/planStore';
import { Blueprint } from '@/types/blueprint';
import BlueprintUpload from '@/components/blueprints/BlueprintUpload';
import BlueprintGrid from '@/components/blueprints/BlueprintGrid';
import BlueprintDetail from '@/components/blueprints/BlueprintDetail';
import { Filter, X, FileImage } from 'lucide-react';
import { useHydrated } from '@/lib/useHydrated';

export default function BlueprintsPage() {
  const hydrated = useHydrated();
  const blueprints = useBlueprintStore((state) => state.blueprints);
  const rooms = usePlanStore((state) => state.rooms);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(
    null
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blueprints.forEach((b) => {
      b.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [blueprints]);

  // Filter blueprints
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((blueprint) => {
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => blueprint.tags.includes(tag));

      const matchesRoom =
        selectedRoomId === null ||
        blueprint.linkedRoomIds.includes(selectedRoomId);

      return matchesTags && matchesRoom;
    });
  }, [blueprints, selectedTags, selectedRoomId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen">
      <div className="bg-mesh border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-8 py-7">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            <FileImage size={13} /> Plans techniques
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink tracking-tight">Coffre à blueprints</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Importez et organisez vos plans techniques (électricité, plomberie, structure) et liez-les aux pièces.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Upload Area */}
        <div className="mb-8">
          <BlueprintUpload />
        </div>

        {/* Filters */}
        {hydrated && (allTags.length > 0 || rooms.length > 0) && (
          <div className="mb-6 card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-muted" />
              <h3 className="font-semibold text-ink">Filtres</h3>
            </div>

            <div className="space-y-4">
              {allTags.length > 0 && (
                <div>
                  <p className="label">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-brand-600 text-white'
                            : 'bg-[var(--bg-app)] text-ink-muted hover:bg-[var(--border)]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {rooms.length > 0 && (
                <div>
                  <p className="label">Pièce liée</p>
                  <select
                    value={selectedRoomId || ''}
                    onChange={(e) => setSelectedRoomId(e.target.value || null)}
                    className="input w-auto"
                  >
                    <option value="">Toutes les pièces</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedTags.length > 0 || selectedRoomId) && (
                <button
                  onClick={() => { setSelectedTags([]); setSelectedRoomId(null); }}
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <X className="h-3 w-3" /> Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results info */}
        <div className="mb-4 text-sm text-ink-muted">
          {hydrated ? `${filteredBlueprints.length} sur ${blueprints.length} blueprint(s)` : '…'}
        </div>

        {/* Grid */}
        <BlueprintGrid
          blueprints={filteredBlueprints}
          onSelectBlueprint={setSelectedBlueprint}
        />

        {/* Detail Modal */}
        {selectedBlueprint && (
          <BlueprintDetail
            blueprint={selectedBlueprint}
            rooms={rooms}
            onClose={() => setSelectedBlueprint(null)}
          />
        )}
      </div>
    </div>
  );
}
