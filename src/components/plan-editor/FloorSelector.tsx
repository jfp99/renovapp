'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { Plus } from 'lucide-react';

export default function FloorSelector() {
  const { floors, selectedFloorId, setSelectedFloor, addFloor } = usePlanStore();
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [floorName, setFloorName] = useState('');

  const handleAddFloor = () => {
    if (!floorName.trim()) return;
    addFloor(floorName);
    setFloorName('');
    setShowAddFloor(false);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Floor
        </label>
        <select
          value={selectedFloorId || ''}
          onChange={(e) => setSelectedFloor(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
        >
          <option value="">-- Choose a floor --</option>
          {floors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
        </select>
      </div>

      {showAddFloor ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            placeholder="Floor name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFloor();
            }}
          />
          <button
            onClick={handleAddFloor}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddFloor(false);
              setFloorName('');
            }}
            className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddFloor(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          Add Floor
        </button>
      )}
    </div>
  );
}
