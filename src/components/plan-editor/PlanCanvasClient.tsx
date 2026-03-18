'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Group, Rect, Text, Line } from 'react-konva';
import { usePlanStore } from '@/stores/planStore';
import { Room, DoorPlacement, WindowPlacement } from '@/types/plan';

const SCALE = 2;
const GRID_SPACING = 50 * SCALE;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const ROOM_TYPE_COLORS: Record<string, string> = {
  bedroom: '#dbeafe',
  bathroom: '#d1fae5',
  kitchen: '#fef3c7',
  common: '#fce7f3',
  storage: '#f3e8ff',
  hallway: '#f1f5f9',
};

// --- Grid ---
function GridLayer({ width, height, spacing }: { width: number; height: number; spacing: number }) {
  const lines = [];
  for (let x = 0; x <= width; x += spacing) {
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} />);
  }
  for (let y = 0; y <= height; y += spacing) {
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} />);
  }
  return <>{lines}</>;
}

// --- Door Marker ---
function DoorMarker({ door, roomWidth, roomHeight }: { door: DoorPlacement; roomWidth: number; roomHeight: number }) {
  const doorWidthPx = door.width * SCALE;
  let x = 0, y = 0, w = doorWidthPx, h = 6;
  switch (door.wall) {
    case 'top':    x = door.position * roomWidth - doorWidthPx / 2; y = -3; w = doorWidthPx; h = 6; break;
    case 'bottom': x = door.position * roomWidth - doorWidthPx / 2; y = roomHeight - 3; w = doorWidthPx; h = 6; break;
    case 'left':   x = -3; y = door.position * roomHeight - doorWidthPx / 2; w = 6; h = doorWidthPx; break;
    case 'right':  x = roomWidth - 3; y = door.position * roomHeight - doorWidthPx / 2; w = 6; h = doorWidthPx; break;
  }
  return <Rect x={x} y={y} width={w} height={h} fill="#92400e" cornerRadius={1} />;
}

// --- Window Marker ---
function WindowMarker({ window: win, roomWidth, roomHeight }: { window: WindowPlacement; roomWidth: number; roomHeight: number }) {
  const winWidthPx = win.width * SCALE;
  let x = 0, y = 0, w = winWidthPx, h = 6;
  switch (win.wall) {
    case 'top':    x = win.position * roomWidth - winWidthPx / 2; y = -3; w = winWidthPx; h = 6; break;
    case 'bottom': x = win.position * roomWidth - winWidthPx / 2; y = roomHeight - 3; w = winWidthPx; h = 6; break;
    case 'left':   x = -3; y = win.position * roomHeight - winWidthPx / 2; w = 6; h = winWidthPx; break;
    case 'right':  x = roomWidth - 3; y = win.position * roomHeight - winWidthPx / 2; w = 6; h = winWidthPx; break;
  }
  return <Rect x={x} y={y} width={w} height={h} fill="#3b82f6" cornerRadius={1} />;
}

// --- Room Shape ---
function RoomShape({ room, isSelected, onSelect, onDragEnd }: {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const widthPx = room.width * SCALE;
  const heightPx = room.height * SCALE;

  return (
    <Group
      x={room.x}
      y={room.y}
      draggable
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onClick={onSelect}
      onTap={onSelect}
    >
      <Rect
        width={widthPx}
        height={heightPx}
        fill={room.color || ROOM_TYPE_COLORS[room.type] || '#f1f5f9'}
        stroke={isSelected ? '#2563eb' : '#475569'}
        strokeWidth={isSelected ? 3 : 1.5}
        cornerRadius={2}
        shadowColor={isSelected ? '#2563eb' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.3}
      />
      <Text
        x={8}
        y={heightPx / 2 - 18}
        width={widthPx - 16}
        text={room.name}
        fontSize={14}
        fontStyle="bold"
        fontFamily="Arial"
        fill="#1e293b"
        align="center"
      />
      <Text
        x={8}
        y={heightPx / 2 + 2}
        width={widthPx - 16}
        text={`${room.width} × ${room.height} cm`}
        fontSize={11}
        fontFamily="Arial"
        fill="#64748b"
        align="center"
      />
      {room.doors.map((door) => (
        <DoorMarker key={door.id} door={door} roomWidth={widthPx} roomHeight={heightPx} />
      ))}
      {room.windows.map((win) => (
        <WindowMarker key={win.id} window={win} roomWidth={widthPx} roomHeight={heightPx} />
      ))}
    </Group>
  );
}

// --- Main Canvas ---
export default function PlanCanvasClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const { rooms, selectedFloorId, selectedRoomId, setSelectedRoom, updateRoom } = usePlanStore();

  const floorRooms = selectedFloorId ? rooms.filter((r) => r.floorId === selectedFloorId) : [];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: width || CANVAS_WIDTH, height: height || CANVAS_HEIGHT });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    let newScale = zoom + (e.evt.deltaY > 0 ? -0.1 : 0.1);
    newScale = Math.max(0.3, Math.min(4, newScale));
    const mousePointTo = { x: (pointer.x - panX) / zoom, y: (pointer.y - panY) / zoom };
    setZoom(newScale);
    setPanX(pointer.x - mousePointTo.x * newScale);
    setPanY(pointer.y - mousePointTo.y * newScale);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = (e: any) => {
    if (e.evt.button === 1 || e.evt.button === 2) {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX - panX, y: e.evt.clientY - panY });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (isPanning) {
      setPanX(e.evt.clientX - panStart.x);
      setPanY(e.evt.clientY - panStart.y);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200">
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onClick={(e) => { if (e.target === e.target.getStage()) setSelectedRoom(null); }}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer>
          <GridLayer width={CANVAS_WIDTH * 2} height={CANVAS_HEIGHT * 2} spacing={GRID_SPACING} />
          {floorRooms.map((room) => (
            <RoomShape
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onSelect={() => setSelectedRoom(room.id)}
              onDragEnd={(x, y) => updateRoom(room.id, { x, y })}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
