'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Konva from 'konva';
import { Room } from '@/types/plan';
import { useFurnitureStore } from '@/stores/furnitureStore';

const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), {
  ssr: false,
});
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), {
  ssr: false,
});
const Rect = dynamic(() => import('react-konva').then((mod) => mod.Rect), {
  ssr: false,
});
const Text = dynamic(() => import('react-konva').then((mod) => mod.Text), {
  ssr: false,
});
const Group = dynamic(() => import('react-konva').then((mod) => mod.Group), {
  ssr: false,
});

const SCALE = 2; // 1cm = 2px

interface FurnitureCanvasProps {
  room: Room;
  selectedPlacementId: string | null;
  onSelectPlacement: (placementId: string | null) => void;
}

export default function FurnitureCanvas({
  room,
  selectedPlacementId,
  onSelectPlacement,
}: FurnitureCanvasProps) {
  const { placements, updatePlacement, catalog } = useFurnitureStore();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const roomPlacements = placements.filter((p) => p.roomId === room.id);

  const roomWidth = room.width * SCALE;
  const roomHeight = room.height * SCALE;

  const handleFurnitureDragEnd = (placementId: string, position: { x: number; y: number }) => {
    // Clamp position to room bounds
    const placement = roomPlacements.find((p) => p.id === placementId);
    if (!placement) return;

    const clampedX = Math.max(0, Math.min(position.x, roomWidth - placement.width * SCALE));
    const clampedY = Math.max(0, Math.min(position.y, roomHeight - placement.height * SCALE));

    updatePlacement(placementId, {
      x: clampedX,
      y: clampedY,
    });
  };

  if (!isClient) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400">Chargement...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
        <Stage
          ref={stageRef}
          width={typeof window !== 'undefined' ? window.innerWidth - 632 : 800}
          height={typeof window !== 'undefined' ? window.innerHeight - 32 : 600}
          className="bg-white"
        >
          <Layer>
            {/* Room outline */}
            <Rect
              x={20}
              y={20}
              width={roomWidth}
              height={roomHeight}
              stroke="#999"
              strokeWidth={2}
              fill="#f9fafb"
              listening={false}
            />

            {/* Dimension labels */}
            <Text
              x={20 + roomWidth / 2}
              y={10}
              text={`${room.width} cm`}
              fontSize={12}
              fill="#666"
              align="center"
              listening={false}
            />
            <Text
              x={10}
              y={20 + roomHeight / 2}
              text={`${room.height} cm`}
              fontSize={12}
              fill="#666"
              align="center"
              angle={-90}
              listening={false}
            />

            {/* Furniture placements */}
            {roomPlacements.map((placement) => {
              const catalogItem = catalog.find((c) => c.id === placement.catalogItemId);
              if (!catalogItem) return null;

              const isSelected = placement.id === selectedPlacementId;
              const furnitureWidth = placement.width * SCALE;
              const furnitureHeight = placement.height * SCALE;

              return (
                <Group key={placement.id} x={20 + placement.x} y={20 + placement.y}>
                  <Rect
                    width={furnitureWidth}
                    height={furnitureHeight}
                    fill={catalogItem.color}
                    stroke={isSelected ? '#2563eb' : '#ccc'}
                    strokeWidth={isSelected ? 2 : 1}
                    rotation={placement.rotation}
                    onClick={() => onSelectPlacement(placement.id)}
                    draggable
                    onDragEnd={(e) => {
                      handleFurnitureDragEnd(placement.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                  />

                  {/* Selection box with resize handles indicator */}
                  {isSelected && (
                    <>
                      {/* Corner indicators (visual only) */}
                      <Rect
                        x={0}
                        y={0}
                        width={8}
                        height={8}
                        fill="#2563eb"
                        listening={false}
                      />
                      <Rect
                        x={furnitureWidth - 8}
                        y={0}
                        width={8}
                        height={8}
                        fill="#2563eb"
                        listening={false}
                      />
                      <Rect
                        x={0}
                        y={furnitureHeight - 8}
                        width={8}
                        height={8}
                        fill="#2563eb"
                        listening={false}
                      />
                      <Rect
                        x={furnitureWidth - 8}
                        y={furnitureHeight - 8}
                        width={8}
                        height={8}
                        fill="#2563eb"
                        listening={false}
                      />
                    </>
                  )}

                  {/* Label */}
                  <Text
                    x={5}
                    y={5}
                    text={placement.customLabel || catalogItem.name}
                    fontSize={10}
                    fill="#000"
                    width={furnitureWidth - 10}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
