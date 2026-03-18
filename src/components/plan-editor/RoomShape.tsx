'use client';

import dynamic from 'next/dynamic';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { Room } from '@/types/plan';
import { useState } from 'react';
import React from 'react';

const DoorMarker = dynamic(() => import('./DoorMarker'), { ssr: false });
const WindowMarker = dynamic(() => import('./WindowMarker'), { ssr: false });

interface RoomShapeProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  scale: number;
}

export default function RoomShape({
  room,
  isSelected,
  onSelect,
  onDragEnd,
  scale,
}: RoomShapeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = React.useRef<Konva.Group>(null);

  const widthPx = room.width * scale;
  const heightPx = room.height * scale;

  const handleDragStart = () => {
    setIsDragging(true);
    onSelect();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    onDragEnd(e.target.x(), e.target.y());
  };

  return (
    <Group
      ref={groupRef}
      x={room.x}
      y={room.y}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
    >
      {/* Room background */}
      <Rect
        width={widthPx}
        height={heightPx}
        fill={room.color}
        stroke={isSelected ? '#000' : '#333'}
        strokeWidth={isSelected ? 3 : 1.5}
        cornerRadius={2}
      />

      {/* Room label */}
      <Text
        x={0}
        y={heightPx / 2 - 20}
        width={widthPx}
        text={room.name}
        fontSize={14}
        fontFamily="Arial"
        fill="#000"
        align="center"
        verticalAlign="middle"
      />

      {/* Dimensions */}
      <Text
        x={0}
        y={heightPx / 2 + 5}
        width={widthPx}
        text={`${room.width}cm × ${room.height}cm`}
        fontSize={11}
        fontFamily="Arial"
        fill="#666"
        align="center"
        verticalAlign="middle"
      />

      {/* Doors */}
      {room.doors.map((door) => (
        <DoorMarker
          key={door.id}
          door={door}
          roomWidth={widthPx}
          roomHeight={heightPx}
          scale={scale}
        />
      ))}

      {/* Windows */}
      {room.windows.map((window) => (
        <WindowMarker
          key={window.id}
          window={window}
          roomWidth={widthPx}
          roomHeight={heightPx}
          scale={scale}
        />
      ))}
    </Group>
  );
}
