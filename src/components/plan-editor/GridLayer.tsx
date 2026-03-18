'use client';

import dynamic from 'next/dynamic';

const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), {
  ssr: false,
});

interface GridLayerProps {
  width: number;
  height: number;
  spacing: number;
}

export default function GridLayer({ width, height, spacing }: GridLayerProps) {
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += spacing) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e5e7eb"
        strokeWidth={0.5}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += spacing) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e5e7eb"
        strokeWidth={0.5}
      />
    );
  }

  return <>{lines}</>;
}
