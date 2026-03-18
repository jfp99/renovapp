'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Konva from 'konva';
import { usePlanStore } from '@/stores/planStore';

// Dynamic import for SSR compatibility
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), {
  ssr: false,
});
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), {
  ssr: false,
});
const Rect = dynamic(() => import('react-konva').then((mod) => mod.Rect), {
  ssr: false,
});
const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), {
  ssr: false,
});

const RoomShape = dynamic(() => import('./RoomShape'), { ssr: false });
const GridLayer = dynamic(() => import('./GridLayer'), { ssr: false });

const SCALE = 2; // 1 cm = 2 pixels
const GRID_SPACING = 50 * SCALE; // 50 cm grid = 100 px
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

export default function PlanCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const {
    rooms,
    selectedFloorId,
    selectedRoomId,
    setSelectedRoom,
    updateRoom,
  } = usePlanStore();

  const floorRooms = selectedFloorId
    ? rooms.filter((r) => r.floorId === selectedFloorId)
    : [];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle wheel for zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    let newScale = zoom + (e.evt.deltaY > 0 ? -0.1 : 0.1);
    newScale = Math.max(0.5, Math.min(3, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setZoom(newScale);
    setPanX(pointer.x - mousePointTo.x * newScale);
    setPanY(pointer.y - mousePointTo.y * newScale);
  };

  // Handle pan (right-click drag or middle-click drag)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 2 || e.evt.button === 1) {
      // Right-click or middle-click
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX - panX, y: e.evt.clientY - panY });
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      setPanX(e.evt.clientX - panStart.x);
      setPanY(e.evt.clientY - panStart.y);
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);
  };

  // Deselect room when clicking empty space
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      setSelectedRoom(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        draggable={false}
      >
        <Layer>
          {/* Grid */}
          <GridLayer width={CANVAS_WIDTH} height={CANVAS_HEIGHT} spacing={GRID_SPACING} />

          {/* Rooms */}
          {floorRooms.map((room) => (
            <RoomShape
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onSelect={() => setSelectedRoom(room.id)}
              onDragEnd={(x, y) => {
                updateRoom(room.id, { x, y });
              }}
              scale={SCALE}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
