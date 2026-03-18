'use client';

import dynamic from 'next/dynamic';
import { Room } from '@/types/plan';

const FurnitureCanvasClient = dynamic(() => import('./FurnitureCanvasClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-slate-200">
      <div className="text-slate-400 text-sm">Chargement du canvas...</div>
    </div>
  ),
});

interface FurnitureCanvasProps {
  room: Room;
  selectedPlacementId: string | null;
  onSelectPlacement: (placementId: string | null) => void;
}

export default function FurnitureCanvas({ room, selectedPlacementId, onSelectPlacement }: FurnitureCanvasProps) {
  return <FurnitureCanvasClient room={room} selectedPlacementId={selectedPlacementId} onSelectPlacement={onSelectPlacement} />;
}
