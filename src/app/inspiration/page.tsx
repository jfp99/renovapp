'use client';

import { useState, useMemo } from 'react';
import { useInspirationStore } from '@/stores/inspirationStore';
import { usePlanStore } from '@/stores/planStore';
import { InspirationImage } from '@/types/inspiration';
import ImageUpload from '@/components/inspiration/ImageUpload';
import InspirationGrid from '@/components/inspiration/InspirationGrid';
import ImageDetailModal from '@/components/inspiration/ImageDetailModal';
import { Filter, X } from 'lucide-react';

export default function InspirationPage() {
  const images = useInspirationStore((state) => state.images);
  const rooms = usePlanStore((state) => state.rooms);
  const [selectedImage, setSelectedImage] = useState<InspirationImage | null>(
    null
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    images.forEach((img) => {
      img.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [images]);

  // Filter images
  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => image.tags.includes(tag));

      const matchesRoom =
        selectedRoomId === null ||
        image.linkedRoomIds.includes(selectedRoomId);

      return matchesTags && matchesRoom;
    });
  }, [images, selectedTags, selectedRoomId]);

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
          <h1 className="text-4xl font-bold text-gray-900">
            Inspiration Board
          </h1>
          <p className="text-gray-600 mt-2">
            Collect and organize inspiration images for your renovation project
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <ImageUpload />
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
                            ? 'bg-purple-600 text-white'
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
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
          {filteredImages.length} of {images.length} images
        </div>

        {/* Grid */}
        <InspirationGrid
          images={filteredImages}
          rooms={rooms}
          onSelectImage={setSelectedImage}
        />

        {/* Detail Modal */}
        {selectedImage && (
          <ImageDetailModal
            image={selectedImage}
            rooms={rooms}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </div>
    </div>
  );
}
