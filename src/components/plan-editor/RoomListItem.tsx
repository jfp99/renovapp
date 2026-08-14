'use client';

import { Room } from '@/types/plan';
import { roomLabel } from '@/lib/rooms';
import { areaM2 } from '@/lib/format';

interface RoomListItemProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RoomListItem({ room, isSelected, onSelect }: RoomListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${
        isSelected
          ? 'border-brand-300 bg-brand-50 shadow-glow'
          : 'border-transparent bg-[var(--bg-app)] hover:bg-[var(--bg-app)]'
      }`}
    >
      <span
        className="h-8 w-8 flex-shrink-0 rounded-lg border border-black/5"
        style={{ backgroundColor: room.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{room.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-ink-faint">
          <span className="rounded bg-[var(--border)]/70 px-1.5 py-0.5 font-medium text-ink-muted">
            {roomLabel(room.type)}
          </span>
          <span className="truncate">
            {room.width}×{room.height} cm · {areaM2(room.width, room.height).toFixed(1)} m²
          </span>
        </div>
      </div>
    </button>
  );
}
