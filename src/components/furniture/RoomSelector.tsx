'use client';

import { usePlanStore } from '@/stores/planStore';
import { ChevronDown } from 'lucide-react';

export default function RoomSelector() {
  const { rooms, selectedRoomId, setSelectedRoom } = usePlanStore();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoom(e.target.value || null);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pièce
      </label>
      <div className="relative">
        <select
          value={selectedRoomId || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Sélectionnez une pièce --</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} ({room.type}) - {room.width}×{room.height}cm
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      {selectedRoom && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p>
            <span className="font-semibold">{selectedRoom.name}</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {selectedRoom.width} cm × {selectedRoom.height} cm
          </p>
        </div>
      )}
    </div>
  );
}
