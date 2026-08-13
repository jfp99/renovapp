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
        <label className="label">Étage</label>
        <select
          value={selectedFloorId || ''}
          onChange={(e) => setSelectedFloor(e.target.value || null)}
          className="input"
        >
          <option value="">— Choisir un étage —</option>
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
            placeholder="Nom de l'étage"
            className="input flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFloor();
              if (e.key === 'Escape') { setShowAddFloor(false); setFloorName(''); }
            }}
          />
          <button onClick={handleAddFloor} className="btn-primary btn-sm">
            Ajouter
          </button>
          <button
            onClick={() => { setShowAddFloor(false); setFloorName(''); }}
            className="btn-secondary btn-sm"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAddFloor(true)} className="btn-secondary btn-sm w-full">
          <Plus size={15} /> Ajouter un étage
        </button>
      )}
    </div>
  );
}
