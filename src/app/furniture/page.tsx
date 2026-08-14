'use client';

import { useState } from 'react';
import RoomSelector from '@/components/furniture/RoomSelector';
import FurnitureCatalog from '@/components/furniture/FurnitureCatalog';
import FurnitureCanvas from '@/components/furniture/FurnitureCanvas';
import FurnitureDetailPanel from '@/components/furniture/FurnitureDetailPanel';
import { usePlanStore } from '@/stores/planStore';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { useHydrated } from '@/lib/useHydrated';
import { formatArea } from '@/lib/format';
import { Armchair } from 'lucide-react';

export default function FurniturePage() {
  const hydrated = useHydrated();
  const { selectedRoomId, rooms } = usePlanStore();
  const { placements } = useFurnitureStore();
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const roomPlacements = selectedRoomId ? placements.filter((p) => p.roomId === selectedRoomId) : [];

  // counts by item
  const counts = roomPlacements.reduce<Record<string, number>>((acc, p) => {
    acc[p.catalogItemId] = (acc[p.catalogItemId] ?? 0) + 1;
    return acc;
  }, {});
  const { catalog } = useFurnitureStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-5 h-[60px] flex items-center gap-2 border-b border-[var(--border)]">
          <Armchair className="h-5 w-5 text-brand-600" />
          <div>
            <h1 className="text-[15px] font-bold text-ink leading-tight">Aménagement</h1>
            <p className="text-[11px] text-ink-faint leading-tight">Placez vos meubles</p>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <RoomSelector />
        </div>

        {selectedRoom ? (
          <div className="flex-1 overflow-y-auto">
            <FurnitureCatalog />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-ink-faint">Choisissez une pièce pour afficher le catalogue.</p>
          </div>
        )}

        {selectedRoom && hydrated && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-app)]/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Meubles placés</span>
              <span className="font-bold text-ink">{roomPlacements.length}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-ink-faint">{selectedRoom.width} × {selectedRoom.height} cm</span>
              <span className="font-semibold text-ink-muted">{formatArea(selectedRoom.width, selectedRoom.height)}</span>
            </div>
            {Object.keys(counts).length > 0 && (
              <div className="mt-3 space-y-1">
                {Object.entries(counts).map(([id, n]) => {
                  const item = catalog.find((c) => c.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-semibold text-ink">×{n}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CENTER CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f1f3f9]">
        {selectedRoom ? (
          <div className="flex-1 p-6 min-h-0">
            <div className="h-full card overflow-hidden">
              <FurnitureCanvas
                room={selectedRoom}
                selectedPlacementId={selectedPlacementId}
                onSelectPlacement={setSelectedPlacementId}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <Armchair className="h-7 w-7 text-[var(--border-strong)]" />
            </div>
            <p className="text-ink-muted font-medium">Sélectionnez une pièce pour commencer</p>
            <p className="text-sm text-ink-faint mt-1">Les pièces sont créées dans l&apos;onglet Plans</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className={`flex-shrink-0 bg-white border-l border-[var(--border)] overflow-y-auto transition-all duration-200 ${selectedPlacementId && selectedRoom ? 'w-72' : 'w-0'}`}>
        {selectedPlacementId && selectedRoom && (
          <FurnitureDetailPanel
            placementId={selectedPlacementId}
            roomId={selectedRoom.id}
            onClose={() => setSelectedPlacementId(null)}
          />
        )}
      </div>
    </div>
  );
}
