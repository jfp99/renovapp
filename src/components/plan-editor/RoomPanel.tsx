'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { Room, RoomType, DoorPlacement, WindowPlacement } from '@/types/plan';
import { Trash2, Plus, X } from 'lucide-react';

const ROOM_TYPES: RoomType[] = ['bedroom', 'bathroom', 'kitchen', 'common', 'storage', 'hallway'];
const WALLS = ['top', 'bottom', 'left', 'right'] as const;

const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#dbeafe',
  bathroom: '#d1fae5',
  kitchen: '#fef3c7',
  common: '#fce7f3',
  storage: '#f3e8ff',
  hallway: '#f1f5f9',
};

interface RoomPanelProps {
  room: Room;
}

export default function RoomPanel({ room }: RoomPanelProps) {
  const { updateRoom, removeRoom, addDoor, removeDoor, addWindow, removeWindow, setSelectedRoom } =
    usePlanStore();

  const [showAddDoor, setShowAddDoor] = useState(false);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [doorForm, setDoorForm] = useState<{
    wall: 'top' | 'bottom' | 'left' | 'right';
    position: number;
    width: number;
  }>({
    wall: 'top',
    position: 0.5,
    width: 90,
  });
  const [windowForm, setWindowForm] = useState<{
    wall: 'top' | 'bottom' | 'left' | 'right';
    position: number;
    width: number;
  }>({
    wall: 'top',
    position: 0.5,
    width: 100,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateRoom = (updates: Partial<Room>) => {
    updateRoom(room.id, updates);
  };

  const handleAddDoor = () => {
    addDoor(room.id, {
      wall: doorForm.wall,
      position: doorForm.position,
      width: doorForm.width,
    });
    setShowAddDoor(false);
  };

  const handleAddWindow = () => {
    addWindow(room.id, {
      wall: windowForm.wall,
      position: windowForm.position,
      width: windowForm.width,
    });
    setShowAddWindow(false);
  };

  const handleDeleteRoom = () => {
    removeRoom(room.id);
    setSelectedRoom(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Room Details</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Info</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={room.name}
                onChange={(e) => handleUpdateRoom({ name: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Room Type
              </label>
              <select
                value={room.type}
                onChange={(e) => {
                  const newType = e.target.value as RoomType;
                  handleUpdateRoom({
                    type: newType,
                    color: ROOM_COLORS[newType],
                  });
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(ROOM_COLORS).map(([type, color]) => (
                  <button
                    key={color}
                    onClick={() => handleUpdateRoom({ color })}
                    className={`w-8 h-8 rounded border-2 ${
                      room.color === color
                        ? 'border-gray-900 shadow-md'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={type}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Width (cm)
              </label>
              <input
                type="number"
                value={room.width}
                onChange={(e) =>
                  handleUpdateRoom({ width: parseInt(e.target.value) })
                }
                min="50"
                max="1000"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={room.height}
                onChange={(e) =>
                  handleUpdateRoom({ height: parseInt(e.target.value) })
                }
                min="50"
                max="1000"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </section>

        {/* Doors */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Doors</h4>
            <button
              onClick={() => setShowAddDoor(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
            </button>
          </div>

          {room.doors.length === 0 ? (
            <p className="text-xs text-gray-500">No doors added</p>
          ) : (
            <div className="space-y-2">
              {room.doors.map((door) => (
                <div
                  key={door.id}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs"
                >
                  <span>
                    {door.wall} wall - {door.width}cm @ {(door.position * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => removeDoor(room.id, door.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddDoor && (
            <div className="mt-3 p-3 border border-gray-200 rounded bg-gray-50 space-y-2">
              <select
                value={doorForm.wall}
                onChange={(e) =>
                  setDoorForm({
                    ...doorForm,
                    wall: e.target.value as 'top' | 'bottom' | 'left' | 'right',
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {WALLS.map((wall) => (
                  <option key={wall} value={wall}>
                    {wall.charAt(0).toUpperCase() + wall.slice(1)} wall
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Position (0-1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={doorForm.position}
                  onChange={(e) =>
                    setDoorForm({ ...doorForm, position: parseFloat(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="50"
                  max="150"
                  value={doorForm.width}
                  onChange={(e) =>
                    setDoorForm({ ...doorForm, width: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddDoor}
                  className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddDoor(false)}
                  className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Windows */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Windows</h4>
            <button
              onClick={() => setShowAddWindow(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
            </button>
          </div>

          {room.windows.length === 0 ? (
            <p className="text-xs text-gray-500">No windows added</p>
          ) : (
            <div className="space-y-2">
              {room.windows.map((window) => (
                <div
                  key={window.id}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs"
                >
                  <span>
                    {window.wall} wall - {window.width}cm @ {(window.position * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => removeWindow(room.id, window.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddWindow && (
            <div className="mt-3 p-3 border border-gray-200 rounded bg-gray-50 space-y-2">
              <select
                value={windowForm.wall}
                onChange={(e) =>
                  setWindowForm({
                    ...windowForm,
                    wall: e.target.value as 'top' | 'bottom' | 'left' | 'right',
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {WALLS.map((wall) => (
                  <option key={wall} value={wall}>
                    {wall.charAt(0).toUpperCase() + wall.slice(1)} wall
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Position (0-1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={windowForm.position}
                  onChange={(e) =>
                    setWindowForm({
                      ...windowForm,
                      position: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  min="50"
                  max="200"
                  value={windowForm.width}
                  onChange={(e) =>
                    setWindowForm({ ...windowForm, width: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddWindow}
                  className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddWindow(false)}
                  className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer - Delete Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-600">Delete this room?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-sm transition-colors"
          >
            <Trash2 size={16} />
            Delete Room
          </button>
        )}
      </div>
    </div>
  );
}
