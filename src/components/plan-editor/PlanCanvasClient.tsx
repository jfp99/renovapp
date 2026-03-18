'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Group, Rect, Text, Line } from 'react-konva';
import { usePlanStore } from '@/stores/planStore';
import { Room, DoorPlacement, WindowPlacement } from '@/types/plan';
import {
  ZoomIn, ZoomOut, Maximize2, Grid3x3, FileDown, MousePointer
} from 'lucide-react';
import type Konva from 'konva';

const SCALE = 2;          // 1 cm = 2 px
const GRID_CM = 50;       // grid every 50 cm
const GRID_PX = GRID_CM * SCALE;
const CANVAS_LOGICAL = { w: 3000, h: 2000 }; // logical canvas size in px

const ROOM_TYPE_COLORS: Record<string, string> = {
  bedroom: '#dbeafe',
  bathroom: '#d1fae5',
  kitchen: '#fef3c7',
  common: '#fce7f3',
  storage: '#f3e8ff',
  hallway: '#f1f5f9',
};

/* ─── Sub-components (all run client-side since this file is dynamically imported) ─── */

function GridLayer({ width, height, spacing, show }: { width: number; height: number; spacing: number; show: boolean }) {
  if (!show) return null;
  const lines = [];
  for (let x = 0; x <= width; x += spacing) {
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#cbd5e1" strokeWidth={0.5} listening={false} />);
  }
  for (let y = 0; y <= height; y += spacing) {
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#cbd5e1" strokeWidth={0.5} listening={false} />);
  }
  return <>{lines}</>;
}

function DoorMarker({ door, rw, rh }: { door: DoorPlacement; rw: number; rh: number }) {
  const dw = door.width * SCALE;
  let x = 0, y = 0, w = dw, h = 8;
  switch (door.wall) {
    case 'top':    x = door.position * rw - dw / 2; y = -4; w = dw; h = 8; break;
    case 'bottom': x = door.position * rw - dw / 2; y = rh - 4; w = dw; h = 8; break;
    case 'left':   x = -4; y = door.position * rh - dw / 2; w = 8; h = dw; break;
    case 'right':  x = rw - 4; y = door.position * rh - dw / 2; w = 8; h = dw; break;
  }
  return (
    <Group listening={false}>
      <Rect x={x} y={y} width={w} height={h} fill="#92400e" cornerRadius={1} />
    </Group>
  );
}

function WindowMarker({ win, rw, rh }: { win: WindowPlacement; rw: number; rh: number }) {
  const ww = win.width * SCALE;
  let x = 0, y = 0, w = ww, h = 6;
  switch (win.wall) {
    case 'top':    x = win.position * rw - ww / 2; y = -3; w = ww; h = 6; break;
    case 'bottom': x = win.position * rw - ww / 2; y = rh - 3; w = ww; h = 6; break;
    case 'left':   x = -3; y = win.position * rh - ww / 2; w = 6; h = ww; break;
    case 'right':  x = rw - 3; y = win.position * rh - ww / 2; w = 6; h = ww; break;
  }
  return (
    <Group listening={false}>
      <Rect x={x} y={y} width={w} height={h} fill="#3b82f6" />
    </Group>
  );
}

function RoomShape({ room, isSelected, onSelect, onDragEnd }: {
  room: Room; isSelected: boolean; onSelect: () => void; onDragEnd: (x: number, y: number) => void;
}) {
  const rw = room.width * SCALE;
  const rh = room.height * SCALE;
  const color = room.color || ROOM_TYPE_COLORS[room.type] || '#f1f5f9';

  return (
    <Group x={room.x} y={room.y} draggable onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())} onClick={onSelect} onTap={onSelect}>
      {/* Shadow */}
      <Rect width={rw} height={rh} offsetX={-3} offsetY={-3} fill="rgba(0,0,0,0.08)" cornerRadius={4} listening={false} />
      {/* Fill */}
      <Rect
        width={rw} height={rh} fill={color}
        stroke={isSelected ? '#2563eb' : '#64748b'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        cornerRadius={3}
      />
      {/* Selection glow */}
      {isSelected && <Rect width={rw} height={rh} fill="transparent" stroke="#93c5fd" strokeWidth={6} cornerRadius={3} opacity={0.4} listening={false} />}
      {/* Room name */}
      <Text x={8} y={rh / 2 - 18} width={rw - 16} text={room.name} fontSize={Math.max(11, Math.min(15, rw / 20))} fontStyle="bold" fontFamily="Inter, Arial, sans-serif" fill="#1e293b" align="center" listening={false} />
      {/* Dimensions */}
      <Text x={8} y={rh / 2 + 2} width={rw - 16} text={`${room.width} × ${room.height} cm`} fontSize={Math.max(9, Math.min(12, rw / 28))} fontFamily="Inter, Arial, sans-serif" fill="#64748b" align="center" listening={false} />
      {/* Area */}
      <Text x={8} y={rh / 2 + 18} width={rw - 16} text={`${((room.width * room.height) / 10000).toFixed(1)} m²`} fontSize={Math.max(9, Math.min(11, rw / 32))} fontFamily="Inter, Arial, sans-serif" fill="#94a3b8" align="center" listening={false} />
      {/* Doors & Windows */}
      {room.doors.map((d) => <DoorMarker key={d.id} door={d} rw={rw} rh={rh} />)}
      {room.windows.map((w) => <WindowMarker key={w.id} win={w} rw={rw} rh={rh} />)}
    </Group>
  );
}

/* ─── Main Canvas ─── */
export default function PlanCanvasClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const { rooms, selectedFloorId, selectedRoomId, setSelectedRoom, updateRoom } = usePlanStore();
  const floorRooms = selectedFloorId ? rooms.filter((r) => r.floorId === selectedFloorId) : [];

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) setSize({ w: width, h: height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fit all rooms on first load
  const fitRooms = useCallback(() => {
    if (floorRooms.length === 0) { setZoom(1); setPan({ x: 40, y: 40 }); return; }
    const minX = Math.min(...floorRooms.map((r) => r.x));
    const minY = Math.min(...floorRooms.map((r) => r.y));
    const maxX = Math.max(...floorRooms.map((r) => r.x + r.width * SCALE));
    const maxY = Math.max(...floorRooms.map((r) => r.y + r.height * SCALE));
    const pad = 80;
    const scaleX = (size.w - pad * 2) / (maxX - minX || 1);
    const scaleY = (size.h - pad * 2) / (maxY - minY || 1);
    const newZoom = Math.min(scaleX, scaleY, 2);
    setZoom(newZoom);
    setPan({ x: pad - minX * newZoom, y: pad - minY * newZoom });
  }, [floorRooms, size]);

  // Wheel zoom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.2, Math.min(4, zoom + delta));
    const mousePointTo = { x: (pointer.x - pan.x) / zoom, y: (pointer.y - pan.y) / zoom };
    setZoom(newZoom);
    setPan({ x: pointer.x - mousePointTo.x * newZoom, y: pointer.y - mousePointTo.y * newZoom });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = (e: any) => {
    if (e.evt.button === 1 || e.evt.button === 2) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX - pan.x, y: e.evt.clientY - pan.y });
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (isPanning) { setPan({ x: e.evt.clientX - panStart.x, y: e.evt.clientY - panStart.y }); }
  };

  // PDF export
  const exportToPDF = () => {
    const stage = stageRef.current;
    if (!stage) return;
    setIsPdfExporting(true);

    // Temporarily reset transform for full export
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const w = window.open('', '_blank');
    if (!w) { setIsPdfExporting(false); return; }

    const floorName = rooms.length > 0 ? `Plan — ${floorRooms.length} pièce(s)` : 'Plan RenovApp';
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>RenovApp — ${floorName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: Arial, sans-serif; }
    .header { padding: 16px 24px; border-bottom: 2px solid #2563eb; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 18px; color: #1e293b; }
    .header p { font-size: 11px; color: #64748b; }
    .canvas-wrap { padding: 24px; display: flex; justify-content: center; }
    img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; }
    .legend { padding: 16px 24px; display: flex; gap: 24px; flex-wrap: wrap; border-top: 1px solid #e2e8f0; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #475569; }
    .dot { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #94a3b8; flex-shrink: 0; }
    .door { width: 14px; height: 8px; background: #92400e; border-radius: 2px; }
    .window { width: 14px; height: 6px; background: #3b82f6; }
    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>RenovApp — Plan de masse</h1>
      <p>${floorName} · Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">⬇ Imprimer / Enregistrer PDF</button>
  </div>
  <div class="canvas-wrap"><img src="${dataUrl}" /></div>
  <div class="legend">
    <div class="legend-item"><div class="dot" style="background:#dbeafe"></div> Chambre</div>
    <div class="legend-item"><div class="dot" style="background:#d1fae5"></div> Salle de bain</div>
    <div class="legend-item"><div class="dot" style="background:#fef3c7"></div> Cuisine</div>
    <div class="legend-item"><div class="dot" style="background:#fce7f3"></div> Pièce commune</div>
    <div class="legend-item"><div class="dot" style="background:#f3e8ff"></div> Rangement</div>
    <div class="legend-item"><div class="dot" style="background:#f1f5f9"></div> Couloir</div>
    <div class="legend-item"><div class="door"></div> Porte</div>
    <div class="legend-item"><div class="window"></div> Fenêtre</div>
  </div>
</body>
</html>`);
    w.document.close();
    setIsPdfExporting(false);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        {/* Zoom controls */}
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 4))} title="Zoom in" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors">
          <ZoomIn size={16} />
        </button>
        <span className="text-xs text-slate-500 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.2))} title="Zoom out" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors">
          <ZoomOut size={16} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Fit */}
        <button onClick={fitRooms} title="Ajuster la vue" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors">
          <Maximize2 size={16} />
        </button>

        {/* Grid toggle */}
        <button onClick={() => setShowGrid((g) => !g)} title="Afficher/masquer la grille"
          className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}>
          <Grid3x3 size={16} />
        </button>

        <div className="flex-1" />

        {/* Legend hint */}
        <div className="hidden sm:flex items-center gap-3 mr-2">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-amber-800 opacity-80" /> Porte
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="inline-block w-3 h-1.5 bg-blue-500" /> Fenêtre
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MousePointer size={11} className="text-slate-400" /> Clic droit = pan
          </span>
        </div>

        {/* PDF Export */}
        <button
          onClick={exportToPDF}
          disabled={isPdfExporting || floorRooms.length === 0}
          title="Exporter en PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
        >
          <FileDown size={14} />
          {isPdfExporting ? 'Export…' : 'Export PDF'}
        </button>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-50 cursor-crosshair">
        {size.w > 0 && size.h > 0 && (
          <Stage
            ref={stageRef}
            width={size.w}
            height={size.h}
            scaleX={zoom}
            scaleY={zoom}
            x={pan.x}
            y={pan.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsPanning(false)}
            onClick={(e) => { if (e.target === e.target.getStage()) setSelectedRoom(null); }}
            onContextMenu={(e) => e.evt.preventDefault()}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            <Layer>
              <GridLayer width={CANVAS_LOGICAL.w} height={CANVAS_LOGICAL.h} spacing={GRID_PX} show={showGrid} />
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
        )}

        {/* Empty state overlay */}
        {floorRooms.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Aucune pièce sur cet étage</p>
              <p className="text-slate-300 text-xs mt-1">Utilisez le panneau gauche pour ajouter des pièces</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
