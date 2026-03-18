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
    if (confirm('Delete this blueprint?')) {
      removeBlueprint(blueprint.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Blueprint Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Image viewer */}
            <div className="col-span-2">
              <div className="bg-gray-100 rounded-lg overflow-hidden relative">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center',
                    }}
                    className="transition-transform"
                  >
                    <img
                      src={blueprint.fileData}
                      alt={blueprint.name}
                      className="max-w-full h-auto max-h-[400px]"
                    />
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                    className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="px-3 py-2 bg-white rounded-lg shadow text-sm font-medium">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                    className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-1 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Linked Rooms
                </label>
                <div className="space-y-2">
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
                <p>Created: {new Date(blueprint.createdAt).toLocaleString()}</p>
                <p>Type: {blueprint.fileType}</p>
              </div>
            </div>
          </div>

          {/* Annotations */}
          {blueprint.annotations.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Annotations</h3>
              <div className="space-y-3">
                {blueprint.annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 uppercase">
                          {annotation.type}
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {annotation.content}
                        </p>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: annotation.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
