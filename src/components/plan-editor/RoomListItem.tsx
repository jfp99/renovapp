'use client';

import { Room } from '@/types/plan';

const ROOM_TYPE_LABELS: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  common: 'Common',
  storage: 'Storage',
  hallway: 'Hallway',
};

interface RoomListItemProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RoomListItem({ room, isSelected, onSelect }: RoomListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
        isSelected
          ? 'bg-blue-100 border-2 border-blue-500'
          : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
      }`}
    >
      {/* Color dot */}
      <div
        className="w-4 h-4 rounded border border-gray-400 flex-shrink-0"
        style={{ backgroundColor: room.color }}
      />

      {/* Room info */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 text-sm truncate">{room.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="bg-gray-200 px-1.5 py-0.5 rounded">
            {ROOM_TYPE_LABELS[room.type] || room.type}
          </span>
          <span className="truncate">
            {room.width}×{room.height}cm
          </span>
        </div>
      </div>
    </button>
  );
}
