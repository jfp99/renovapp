'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import PlanCanvas from '@/components/plan-editor/PlanCanvas';
import RoomPanel from '@/components/plan-editor/RoomPanel';
import FloorSelector from '@/components/plan-editor/FloorSelector';
import RoomListItem from '@/components/plan-editor/RoomListItem';
import { Plus, X } from 'lucide-react';
import { Room, RoomType } from '@/types/plan';

const ROOM_TYPES: RoomType[] = ['bedroom', 'bathroom', 'kitchen', 'common', 'storage', 'hallway'];

export default function PlansPage() {
  const {
    floors,
    rooms,
    selectedFloorId,
    selectedRoomId,
    setSelectedRoom,
    addRoom,
  } = usePlanStore();

  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'common' as RoomType,
    width: 400,
    height: 300,
  });

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);
  const currentRooms = selectedFloorId
    ? rooms.filter((r) => r.floorId === selectedFloorId)
    : [];
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleAddRoom = () => {
    if (!selectedFloorId || !formData.name.trim()) return;

    const ROOM_COLORS: Record<RoomType, string> = {
      bedroom: '#dbeafe',
      bathroom: '#d1fae5',
      kitchen: '#fef3c7',
      common: '#fce7f3',
      storage: '#f3e8ff',
      hallway: '#f1f5f9',
    };

    const newRoom: Omit<Room, 'id'> = {
      floorId: selectedFloorId,
      name: formData.name,
      type: formData.type,
      x: 50,
      y: 50,
      width: formData.width,
      height: formData.height,
      color: ROOM_COLORS[formData.type],
      doors: [],
      windows: [],
    };

    addRoom(selectedFloorId, newRoom);
    setFormData({
      name: '',
      type: 'common',
      width: 400,
      height: 300,
    });
    setShowAddRoomForm(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white shadow-lg flex flex-col border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Plan Editor</h1>
        </div>

        <div className="p-4 border-b border-gray-200">
          <FloorSelector />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {selectedFloor ? `Rooms - ${selectedFloor.name}` : 'No floor selected'}
            </h2>
            <div className="space-y-2">
              {currentRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  onSelect={() => setSelectedRoom(room.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowAddRoomForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Room
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-50 p-4">
          <PlanCanvas />
        </div>

        {selectedRoom && (
          <div className="w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
            <RoomPanel room={selectedRoom} />
          </div>
        )}
      </div>

      {/* ADD ROOM MODAL */}
      {showAddRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Room</h3>
              <button
                onClick={() => setShowAddRoomForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Master Bedroom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as RoomType,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) =>
                    setFormData({ ...formData, width: parseInt(e.target.value) })
                  }
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: parseInt(e.target.value) })
                  }
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddRoomForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoom}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
