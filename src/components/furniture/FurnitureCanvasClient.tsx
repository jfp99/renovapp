'use client';

import { useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { Room } from '@/types/plan';
import { useFurnitureStore } from '@/stores/furnitureStore';

const SCALE = 2;

interface Props {
  room: Room;
  selectedPlacementId: string | null;
  onSelectPlacement: (id: string | null) => void;
}

export default function FurnitureCanvasClient({ room, selectedPlacementId, onSelectPlacement }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { placements, updatePlacement, catalog } = useFurnitureStore();
  const [size] = useState({ width: 800, height: 600 });

  const roomPlacements = placements.filter((p) => p.roomId === room.id);
  const roomWidth = room.width * SCALE;
  const roomHeight = room.height * SCALE;
  const offsetX = 40;
  const offsetY = 40;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (placementId: string, e: any) => {
    const placement = roomPlacements.find((p) => p.id === placementId);
    if (!placement) return;
    const x = Math.max(0, Math.min(e.target.x() - offsetX, roomWidth - placement.width * SCALE));
    const y = Math.max(0, Math.min(e.target.y() - offsetY, roomHeight - placement.height * SCALE));
    updatePlacement(placementId, { x, y });
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 rounded-lg overflow-hidden border border-slate-200">
      <Stage width={size.width} height={size.height}>
        <Layer>
          {/* Room outline */}
          <Rect x={offsetX} y={offsetY} width={roomWidth} height={roomHeight}
            stroke="#94a3b8" strokeWidth={2} fill="#f8fafc" listening={false} />

          {/* Dimension top */}
          <Text x={offsetX} y={offsetY - 20} width={roomWidth}
            text={`${room.width} cm`} fontSize={12} fill="#64748b" align="center" listening={false} />

          {/* Dimension left */}
          <Text x={4} y={offsetY} width={30}
            text={`${room.height}`} fontSize={11} fill="#64748b" listening={false} />

          {/* Furniture */}
          {roomPlacements.map((placement) => {
            const item = catalog.find((c) => c.id === placement.catalogItemId);
            if (!item) return null;
            const isSelected = placement.id === selectedPlacementId;
            const fw = placement.width * SCALE;
            const fh = placement.height * SCALE;
            return (
              <Group
                key={placement.id}
                x={offsetX + placement.x}
                y={offsetY + placement.y}
                rotation={placement.rotation}
                draggable
                onClick={() => onSelectPlacement(placement.id)}
                onTap={() => onSelectPlacement(placement.id)}
                onDragEnd={(e) => handleDragEnd(placement.id, e)}
              >
                <Rect width={fw} height={fh} fill={item.color}
                  stroke={isSelected ? '#2563eb' : '#94a3b8'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  cornerRadius={2}
                  shadowColor={isSelected ? '#2563eb' : undefined}
                  shadowBlur={isSelected ? 6 : 0}
                  shadowOpacity={0.4}
                />
                <Text x={4} y={fh / 2 - 10} width={fw - 8}
                  text={placement.customLabel || item.name}
                  fontSize={10} fill="#1e293b" align="center"
                  listening={false}
                />
                {isSelected && [
                  [0, 0], [fw - 7, 0], [0, fh - 7], [fw - 7, fh - 7]
                ].map(([cx, cy], i) => (
                  <Rect key={i} x={cx} y={cy} width={7} height={7}
                    fill="#2563eb" listening={false} />
                ))}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
