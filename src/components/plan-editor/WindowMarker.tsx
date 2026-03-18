'use client';

import { Rect } from 'react-konva';
import { WindowPlacement } from '@/types/plan';

interface WindowMarkerProps {
  window: WindowPlacement;
  roomWidth: number;
  roomHeight: number;
  scale: number;
}

export default function WindowMarker({
  window,
  roomWidth,
  roomHeight,
  scale,
}: WindowMarkerProps) {
  const windowWidthPx = window.width * scale;
  const markerSize = 6;

  let x = 0;
  let y = 0;

  switch (window.wall) {
    case 'top':
      x = roomWidth * window.position - markerSize / 2;
      y = -markerSize;
      break;
    case 'bottom':
      x = roomWidth * window.position - markerSize / 2;
      y = roomHeight;
      break;
    case 'left':
      x = -markerSize;
      y = roomHeight * window.position - markerSize / 2;
      break;
    case 'right':
      x = roomWidth;
      y = roomHeight * window.position - markerSize / 2;
      break;
  }

  return (
    <Rect
      x={x}
      y={y}
      width={markerSize}
      height={markerSize}
      fill="#3b82f6"
      stroke="#1e40af"
      strokeWidth={1}
    />
  );
}
