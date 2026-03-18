'use client';

import { useState, useMemo } from 'react';
import { useBlueprintStore } from '@/stores/blueprintStore';
import { usePlanStore } from '@/stores/planStore';
import { Blueprint } from '@/types/blueprint';
import BlueprintUpload from '@/components/blueprints/BlueprintUpload';
import BlueprintGrid from '@/components/blueprints/BlueprintGrid';
import BlueprintDetail from '@/components/blueprints/BlueprintDetail';
import { Filter, X } from 'lucide-react';

export default function BlueprintsPage() {
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Blueprint Vault</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage floor plans and design blueprints
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <BlueprintUpload />
        </div>

        {/* Filters */}
        {(allTags.length > 0 || rooms.length > 0) && (
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>

            <div className="space-y-4">
              {/* Tag filters */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Room filters */}
              {rooms.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Rooms
                  </p>
                  <select
                    value={selectedRoomId || ''}
                    onChange={(e) => setSelectedRoomId(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Rooms</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear filters */}
              {(selectedTags.length > 0 || selectedRoomId) && (
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setSelectedRoomId(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results info */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredBlueprints.length} of {blueprints.length} blueprints
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
