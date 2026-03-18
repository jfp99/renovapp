'use client';

import { useState } from 'react';
import RoomSelector from '@/components/furniture/RoomSelector';
import FurnitureCatalog from '@/components/furniture/FurnitureCatalog';
import FurnitureCanvas from '@/components/furniture/FurnitureCanvas';
import FurnitureDetailPanel from '@/components/furniture/FurnitureDetailPanel';
import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';

export default function FurniturePage() {
  const { selectedRoomId, rooms } = usePlanStore();
  const { placements } = useFurnitureStore();
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const roomPlacements = selectedRoomId
    ? placements.filter((p) => p.roomId === selectedRoomId)
    : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Aménagement</h1>
        </div>

        <div className="p-4 border-b border-gray-200">
          <RoomSelector />
        </div>

        {selectedRoom && (
          <div className="flex-1 overflow-y-auto">
            <FurnitureCatalog />
          </div>
        )}

        {selectedRoom && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-semibold">{roomPlacements.length}</span> meubles
                placés
              </p>
              <p className="text-xs mt-1">
                {selectedRoom.width} cm × {selectedRoom.height} cm =
                <span className="font-semibold ml-1">
                  {(selectedRoom.width * selectedRoom.height / 10000).toFixed(1)} m²
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER CANVAS */}
      <div className="flex-1 flex items-center justify-center p-8">
        {selectedRoom ? (
          <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <FurnitureCanvas
              room={selectedRoom}
              selectedPlacementId={selectedPlacementId}
              onSelectPlacement={setSelectedPlacementId}
            />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-lg">Sélectionnez une pièce pour commencer</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
        {selectedPlacementId && selectedRoom ? (
          <FurnitureDetailPanel
            placementId={selectedPlacementId}
            roomId={selectedRoom.id}
            onClose={() => setSelectedPlacementId(null)}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>Sélectionnez un meuble pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  );
}
