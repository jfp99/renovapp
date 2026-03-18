'use client';

import { useState } from 'react';
import { InspirationImage } from '@/types/inspiration';
import { Room } from '@/types/plan';
import { useInspirationStore } from '@/stores/inspirationStore';
import { X, Trash2 } from 'lucide-react';

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
    if (confirm('Delete this image from your inspiration board?')) {
      removeImage(image.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Image Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Image */}
            <div className="col-span-1">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.fileData}
                  alt="Inspiration"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            </div>

            {/* Details */}
            <div className="col-span-1 space-y-6">
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this inspiration image..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Source URL
                </label>
                <input
                  type="url"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-purple-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Linked Rooms
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-gray-500">No rooms created yet</p>
                  ) : (
                    rooms.map((room) => (
                      <label
                        key={room.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={linkedRoomIds.includes(room.id)}
                          onChange={() => handleRoomToggle(room.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{room.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                <p>Added: {new Date(image.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
