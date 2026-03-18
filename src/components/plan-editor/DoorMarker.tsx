'use client';

import { Rect } from 'react-konva';
import { DoorPlacement } from '@/types/plan';

interface DoorMarkerProps {
  door: DoorPlacement;
  roomWidth: number;
  roomHeight: number;
  scale: number;
}

export default function DoorMarker({
  door,
  roomWidth,
  roomHeight,
  scale,
}: DoorMarkerProps) {
  const doorWidthPx = door.width * scale;
  const markerSize = 6;

  let x = 0;
  let y = 0;

  switch (door.wall) {
    case 'top':
      x = roomWidth * door.position - markerSize / 2;
      y = -markerSize;
      break;
    case 'bottom':
      x = roomWidth * door.position - markerSize / 2;
      y = roomHeight;
      break;
    case 'left':
      x = -markerSize;
      y = roomHeight * door.position - markerSize / 2;
      break;
    case 'right':
      x = roomWidth;
      y = roomHeight * door.position - markerSize / 2;
      break;
  }

  return (
    <Rect
      x={x}
      y={y}
      width={markerSize}
      height={markerSize}
      fill="#8b4513"
      stroke="#654321"
      strokeWidth={1}
    />
  );
}
