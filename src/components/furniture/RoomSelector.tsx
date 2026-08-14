'use client';

import { usePlanStore } from '@/stores/planStore';
import { useHydrated } from '@/lib/useHydrated';
import { roomLabel, ROOM_ACCENT } from '@/lib/rooms';
import { formatArea } from '@/lib/format';
import { ChevronDown } from 'lucide-react';

export default function RoomSelector() {
  const hydrated = useHydrated();
  const { rooms, selectedRoomId, setSelectedRoom } = usePlanStore();
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="w-full">
      <label className="label">Pièce active</label>
      <div className="relative">
        <select
          value={selectedRoomId || ''}
          onChange={(e) => setSelectedRoom(e.target.value || null)}
          className="input appearance-none pr-9"
        >
          <option value="">— Sélectionnez une pièce —</option>
          {hydrated &&
            rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} · {roomLabel(room.type)} · {room.width}×{room.height} cm
              </option>
            ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
      </div>

      {selectedRoom && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-app)]/60 p-3">
          <span className="h-9 w-9 flex-shrink-0 rounded-lg" style={{ background: ROOM_ACCENT[selectedRoom.type] }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{selectedRoom.name}</p>
            <p className="text-xs text-ink-faint">
              {roomLabel(selectedRoom.type)} · {formatArea(selectedRoom.width, selectedRoom.height)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
