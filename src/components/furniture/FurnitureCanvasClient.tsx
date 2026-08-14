'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import { Room } from '@/types/plan';
import { useFurnitureStore } from '@/stores/furnitureStore';
import { ROOM_COLORS } from '@/lib/rooms';
import type Konva from 'konva';

const SCALE = 2;
const SNAP_CM = 5;
const SNAP_PX = SNAP_CM * SCALE;
const GRID_PX = 50 * SCALE;

interface Props {
  room: Room;
  selectedPlacementId: string | null;
  onSelectPlacement: (id: string | null) => void;
}

/** Axis-aligned bounding footprint (px) of a possibly-rotated item. */
function footprint(wPx: number, hPx: number, rotDeg: number) {
  const r = (rotDeg * Math.PI) / 180;
  const aw = Math.abs(wPx * Math.cos(r)) + Math.abs(hPx * Math.sin(r));
  const ah = Math.abs(wPx * Math.sin(r)) + Math.abs(hPx * Math.cos(r));
  return { aw, ah };
}

export default function FurnitureCanvasClient({ room, selectedPlacementId, onSelectPlacement }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const { placements, updatePlacement, removePlacement, duplicatePlacement, catalog } = useFurnitureStore();

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) setSize({ width, height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const roomPlacements = placements.filter((p) => p.roomId === room.id);
  const roomWidth = room.width * SCALE;
  const roomHeight = room.height * SCALE;

  // Fit room within canvas with padding (auto-scale large rooms down)
  const pad = 56;
  const fitScale = Math.min(1, (size.width - pad * 2) / roomWidth, (size.height - pad * 2) / roomHeight) || 1;
  const dispW = roomWidth * fitScale;
  const dispH = roomHeight * fitScale;
  const offsetX = (size.width - dispW) / 2;
  const offsetY = (size.height - dispH) / 2;

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!selectedPlacementId) return;
      const p = placements.find((x) => x.id === selectedPlacementId);
      if (!p) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removePlacement(selectedPlacementId); onSelectPlacement(null); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicatePlacement(selectedPlacementId); }
      else if (e.key.toLowerCase() === 'r') { e.preventDefault(); updatePlacement(selectedPlacementId, { rotation: (p.rotation + (e.shiftKey ? -90 : 90) + 360) % 360 }); }
      else if (e.key === 'Escape') onSelectPlacement(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPlacementId, placements, removePlacement, duplicatePlacement, updatePlacement, onSelectPlacement]);

  // collisions / out of bounds (room-local px space, unscaled by fit)
  const boxes = roomPlacements.map((p) => {
    const { aw, ah } = footprint(p.width * SCALE, p.height * SCALE, p.rotation);
    const cx = p.x + (p.width * SCALE) / 2;
    const cy = p.y + (p.height * SCALE) / 2;
    return { id: p.id, x1: cx - aw / 2, y1: cy - ah / 2, x2: cx + aw / 2, y2: cy + ah / 2 };
  });
  const flagged = new Set<string>();
  for (const b of boxes) {
    if (b.x1 < -0.5 || b.y1 < -0.5 || b.x2 > roomWidth + 0.5 || b.y2 > roomHeight + 0.5) flagged.add(b.id);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1) { flagged.add(a.id); flagged.add(b.id); }
    }

  const handleDragEnd = useCallback(
    (placementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const p = roomPlacements.find((x) => x.id === placementId);
      if (!p) return;
      const fw = p.width * SCALE, fh = p.height * SCALE;
      const { aw, ah } = footprint(fw, fh, p.rotation);
      // node position is the CENTER (offset set to half) in stage coords → to room-local
      let cxLocal = (e.target.x() - offsetX) / fitScale;
      let cyLocal = (e.target.y() - offsetY) / fitScale;
      // clamp center so footprint stays inside the room
      cxLocal = Math.max(aw / 2, Math.min(cxLocal, roomWidth - aw / 2));
      cyLocal = Math.max(ah / 2, Math.min(cyLocal, roomHeight - ah / 2));
      // snap top-left
      let nx = cxLocal - fw / 2;
      let ny = cyLocal - fh / 2;
      nx = Math.round(nx / SNAP_PX) * SNAP_PX;
      ny = Math.round(ny / SNAP_PX) * SNAP_PX;
      updatePlacement(placementId, { x: nx, y: ny });
    },
    [roomPlacements, offsetX, offsetY, fitScale, roomWidth, roomHeight, updatePlacement]
  );

  // area used
  const usedCm2 = roomPlacements.reduce((s, p) => s + p.width * p.height, 0);
  const roomCm2 = room.width * room.height;
  const usedPct = roomCm2 > 0 ? Math.round((usedCm2 / roomCm2) * 100) : 0;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-xl bg-[#fbfcfe]">
      {/* overlay HUD */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <span className="badge-muted pointer-events-none w-fit">
          {roomPlacements.length} meuble{roomPlacements.length > 1 ? 's' : ''}
        </span>
        <span
          className={`badge pointer-events-none w-fit ${
            usedPct > 85 ? 'bg-rose-50 text-rose-700' : usedPct > 60 ? 'bg-accent-50 text-accent-700' : 'bg-pine-50 text-pine-600'
          }`}
        >
          {usedPct}% de surface occupée
        </span>
        {flagged.size > 0 && (
          <span className="badge bg-rose-50 text-rose-700 pointer-events-none w-fit">
            ⚠ {flagged.size} conflit{flagged.size > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {size.width > 0 && size.height > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          onClick={(e) => { if (e.target === e.target.getStage()) onSelectPlacement(null); }}
        >
          <Layer>
            {/* Room footprint */}
            <Group x={offsetX} y={offsetY} scaleX={fitScale} scaleY={fitScale}>
              <Rect width={roomWidth} height={roomHeight} fill={ROOM_COLORS[room.type]} opacity={0.45} listening={false} />
              {/* interior grid */}
              {Array.from({ length: Math.floor(roomWidth / GRID_PX) }, (_, i) => (
                <Line key={`v${i}`} points={[(i + 1) * GRID_PX, 0, (i + 1) * GRID_PX, roomHeight]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
              ))}
              {Array.from({ length: Math.floor(roomHeight / GRID_PX) }, (_, i) => (
                <Line key={`h${i}`} points={[0, (i + 1) * GRID_PX, roomWidth, (i + 1) * GRID_PX]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
              ))}
              <Rect width={roomWidth} height={roomHeight} stroke="#475569" strokeWidth={2} listening={false} />
            </Group>

            {/* dimension labels */}
            <Text x={offsetX} y={offsetY - 22} width={dispW} text={`${room.width} cm`} fontSize={12} fontFamily="Inter, sans-serif" fill="#64748b" align="center" listening={false} />
            <Text x={offsetX - 40} y={offsetY + dispH / 2} width={dispH} text={`${room.height} cm`} fontSize={12} fontFamily="Inter, sans-serif" fill="#64748b" align="center" rotation={-90} offsetX={dispH / 2} listening={false} />
            <Text x={offsetX} y={offsetY + dispH + 8} width={dispW} text={room.name} fontSize={12} fontFamily="Inter, sans-serif" fontStyle="600" fill="#94a3b8" align="center" listening={false} />

            {/* Furniture */}
            {roomPlacements.map((p) => {
              const item = catalog.find((c) => c.id === p.catalogItemId);
              if (!item) return null;
              const isSel = p.id === selectedPlacementId;
              const bad = flagged.has(p.id);
              const fw = p.width * SCALE;
              const fh = p.height * SCALE;
              // center position in stage coords
              const cx = offsetX + (p.x + fw / 2) * fitScale;
              const cy = offsetY + (p.y + fh / 2) * fitScale;
              return (
                <Group
                  key={p.id}
                  x={cx}
                  y={cy}
                  offsetX={fw / 2}
                  offsetY={fh / 2}
                  scaleX={fitScale}
                  scaleY={fitScale}
                  rotation={p.rotation}
                  draggable
                  onClick={() => onSelectPlacement(p.id)}
                  onTap={() => onSelectPlacement(p.id)}
                  onDragEnd={(e) => handleDragEnd(p.id, e)}
                  onMouseEnter={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'move'; }}
                  onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'default'; }}
                >
                  <Rect
                    width={fw}
                    height={fh}
                    fill={item.color}
                    stroke={bad ? '#ef4444' : isSel ? '#4f46e5' : '#64748b'}
                    strokeWidth={isSel ? 2.5 : 1.25}
                    cornerRadius={3}
                    shadowColor="#0f172a"
                    shadowBlur={isSel ? 10 : 3}
                    shadowOpacity={isSel ? 0.25 : 0.12}
                    shadowOffsetY={2}
                  />
                  {/* front indicator (top edge) */}
                  <Line points={[3, 3, fw - 3, 3]} stroke="rgba(15,23,42,0.35)" strokeWidth={1.5} listening={false} />
                  <Text
                    x={2} y={fh / 2 - 7}
                    width={fw - 4}
                    text={p.customLabel || item.name}
                    fontSize={Math.max(8, Math.min(11, fw / 9))}
                    fontFamily="Inter, sans-serif"
                    fontStyle="600"
                    fill="#0f172a"
                    align="center"
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      )}

      {/* keyboard hint */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden md:block text-[11px] text-ink-faint">
        <span className="rounded bg-white/80 px-2 py-1 shadow-card">R : pivoter · Ctrl+D : dupliquer · Suppr : retirer</span>
      </div>
    </div>
  );
}
