'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Stage, Layer, Group, Rect, Text, Line, Arc } from 'react-konva';
import { usePlanStore } from '@/stores/planStore';
import { Room, DoorPlacement, WindowPlacement } from '@/types/plan';
import {
  ZoomIn, ZoomOut, Maximize2, Grid3x3, FileDown, Magnet, Copy, Trash2, Move,
} from 'lucide-react';
import { ROOM_COLORS, ROOM_TYPE_LABELS } from '@/lib/rooms';
import { areaM2 } from '@/lib/format';
import type Konva from 'konva';

const SCALE = 2;          // 1 cm = 2 px
const GRID_CM = 50;       // major grid every 50 cm
const GRID_PX = GRID_CM * SCALE;
const SNAP_CM = 10;       // snap step when magnet on
const SNAP_PX = SNAP_CM * SCALE;
const MIN_CM = 50;
const CANVAS_LOGICAL = { w: 4000, h: 3000 };

const snap = (v: number, on: boolean) => (on ? Math.round(v / SNAP_PX) * SNAP_PX : v);

/* ─── Door with swing arc ─── */
function DoorMarker({ door, rw, rh }: { door: DoorPlacement; rw: number; rh: number }) {
  const dw = door.width * SCALE;
  const t = 7;
  let gap: { x: number; y: number; w: number; h: number };
  let arc: { x: number; y: number; rotation: number } | null = null;
  switch (door.wall) {
    case 'top':    gap = { x: door.position * rw - dw / 2, y: -t / 2, w: dw, h: t }; arc = { x: door.position * rw - dw / 2, y: 0, rotation: 0 }; break;
    case 'bottom': gap = { x: door.position * rw - dw / 2, y: rh - t / 2, w: dw, h: t }; arc = { x: door.position * rw - dw / 2, y: rh, rotation: 270 }; break;
    case 'left':   gap = { x: -t / 2, y: door.position * rh - dw / 2, w: t, h: dw }; arc = { x: 0, y: door.position * rh - dw / 2, rotation: 90 }; break;
    default:       gap = { x: rw - t / 2, y: door.position * rh - dw / 2, w: t, h: dw }; arc = { x: rw, y: door.position * rh - dw / 2, rotation: 180 }; break;
  }
  return (
    <Group listening={false}>
      {/* opening cut (white) */}
      <Rect x={gap.x} y={gap.y} width={gap.w} height={gap.h} fill="#ffffff" />
      {/* swing arc */}
      {arc && (
        <Arc x={arc.x} y={arc.y} innerRadius={0} outerRadius={dw} angle={90} rotation={arc.rotation}
          stroke="#b45309" strokeWidth={1} dash={[3, 3]} fill="rgba(180,83,9,0.06)" />
      )}
      {/* hinge jamb */}
      <Rect x={gap.x} y={gap.y} width={gap.w} height={gap.h} stroke="#b45309" strokeWidth={1.2} />
    </Group>
  );
}

/* ─── Window as double line ─── */
function WindowMarker({ win, rw, rh }: { win: WindowPlacement; rw: number; rh: number }) {
  const ww = win.width * SCALE;
  let bg: { x: number; y: number; w: number; h: number };
  let lines: number[][];
  switch (win.wall) {
    case 'top':    bg = { x: win.position * rw - ww / 2, y: -3, w: ww, h: 6 }; lines = [[bg.x, 0, bg.x + ww, 0]]; break;
    case 'bottom': bg = { x: win.position * rw - ww / 2, y: rh - 3, w: ww, h: 6 }; lines = [[bg.x, rh, bg.x + ww, rh]]; break;
    case 'left':   bg = { x: -3, y: win.position * rh - ww / 2, w: 6, h: ww }; lines = [[0, bg.y, 0, bg.y + ww]]; break;
    default:       bg = { x: rw - 3, y: win.position * rh - ww / 2, w: 6, h: ww }; lines = [[rw, bg.y, rw, bg.y + ww]]; break;
  }
  return (
    <Group listening={false}>
      <Rect x={bg.x} y={bg.y} width={bg.w} height={bg.h} fill="#ffffff" stroke="#2563eb" strokeWidth={1} />
      {lines.map((p, i) => <Line key={i} points={p} stroke="#2563eb" strokeWidth={1.5} />)}
    </Group>
  );
}

/* ─── Room ─── */
function RoomShape({
  room, isSelected, overlapping, snapOn, onSelect, onChange,
}: {
  room: Room; isSelected: boolean; overlapping: boolean; snapOn: boolean;
  onSelect: () => void; onChange: (u: Partial<Room>) => void;
}) {
  const rw = room.width * SCALE;
  const rh = room.height * SCALE;
  const color = room.color || ROOM_COLORS[room.type] || '#f1f5f9';
  const stroke = overlapping ? '#ef4444' : isSelected ? '#4f46e5' : '#475569';

  // resize handle helper
  const handles: { key: string; x: number; y: number }[] = [
    { key: 'tl', x: 0, y: 0 }, { key: 'tr', x: rw, y: 0 },
    { key: 'bl', x: 0, y: rh }, { key: 'br', x: rw, y: rh },
  ];

  const onHandleDrag = (key: string, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    let hx = e.target.x();
    let hy = e.target.y();
    hx = snap(hx, snapOn);
    hy = snap(hy, snapOn);
    let nx = room.x, ny = room.y, nw = rw, nh = rh;
    if (key === 'br') { nw = hx; nh = hy; }
    if (key === 'tl') { nx = room.x + hx; ny = room.y + hy; nw = rw - hx; nh = rh - hy; }
    if (key === 'tr') { ny = room.y + hy; nw = hx; nh = rh - hy; }
    if (key === 'bl') { nx = room.x + hx; nw = rw - hx; nh = hy; }
    const minPx = MIN_CM * SCALE;
    if (nw < minPx || nh < minPx) return;
    onChange({
      x: nx, y: ny,
      width: Math.round(nw / SCALE),
      height: Math.round(nh / SCALE),
    });
  };

  return (
    <Group
      x={room.x} y={room.y} draggable
      onClick={onSelect} onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(e) => onChange({ x: snap(e.target.x(), snapOn), y: snap(e.target.y(), snapOn) })}
    >
      {/* soft shadow */}
      <Rect width={rw} height={rh} x={2} y={3} fill="rgba(15,23,42,0.07)" cornerRadius={4} listening={false} />
      {/* fill + wall */}
      <Rect width={rw} height={rh} fill={color} stroke={stroke} strokeWidth={isSelected ? 2.5 : 1.75} cornerRadius={3} />
      {isSelected && <Rect width={rw} height={rh} stroke="#a5b4fc" strokeWidth={6} cornerRadius={3} opacity={0.35} listening={false} />}

      {/* labels */}
      <Text x={6} y={rh / 2 - 20} width={rw - 12} text={room.name} fontSize={Math.max(11, Math.min(15, rw / 18))} fontStyle="700" fontFamily="Inter, sans-serif" fill="#0f172a" align="center" listening={false} />
      <Text x={6} y={rh / 2 + 1} width={rw - 12} text={`${room.width} × ${room.height} cm`} fontSize={Math.max(9, Math.min(12, rw / 26))} fontFamily="Inter, sans-serif" fill="#475569" align="center" listening={false} />
      <Text x={6} y={rh / 2 + 17} width={rw - 12} text={`${areaM2(room.width, room.height).toFixed(1)} m²`} fontSize={Math.max(8, Math.min(11, rw / 30))} fontFamily="Inter, sans-serif" fill="#94a3b8" align="center" listening={false} />

      {/* openings */}
      {room.doors.map((d) => <DoorMarker key={d.id} door={d} rw={rw} rh={rh} />)}
      {room.windows.map((w) => <WindowMarker key={w.id} win={w} rw={rw} rh={rh} />)}

      {/* resize handles */}
      {isSelected && handles.map((h) => (
        <Rect
          key={h.key} x={h.x - 5} y={h.y - 5} width={10} height={10}
          fill="#ffffff" stroke="#4f46e5" strokeWidth={1.5} cornerRadius={2}
          draggable
          onDragStart={(e) => { e.cancelBubble = true; }}
          onDragMove={(e) => onHandleDrag(h.key, e)}
          onMouseEnter={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = h.key === 'tl' || h.key === 'br' ? 'nwse-resize' : 'nesw-resize'; }}
          onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'default'; }}
        />
      ))}
    </Group>
  );
}

function roomsOverlap(a: Room, b: Room): boolean {
  const ax2 = a.x + a.width * SCALE, ay2 = a.y + a.height * SCALE;
  const bx2 = b.x + b.width * SCALE, by2 = b.y + b.height * SCALE;
  return a.x < bx2 && ax2 > b.x && a.y < by2 && ay2 > b.y;
}

/* ─── Main ─── */
export default function PlanCanvasClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapOn, setSnapOn] = useState(true);

  const { rooms, selectedFloorId, selectedRoomId, setSelectedRoom, updateRoom, removeRoom, duplicateRoom } = usePlanStore();
  // Memoised: a fresh array on every render would invalidate the useCallback
  // below and re-create the export handler each time.
  const floorRooms = useMemo(
    () => (selectedFloorId ? rooms.filter((r) => r.floorId === selectedFloorId) : []),
    [rooms, selectedFloorId]
  );

  // overlap set
  const overlapIds = new Set<string>();
  for (let i = 0; i < floorRooms.length; i++)
    for (let j = i + 1; j < floorRooms.length; j++)
      if (roomsOverlap(floorRooms[i], floorRooms[j])) { overlapIds.add(floorRooms[i].id); overlapIds.add(floorRooms[j].id); }

  // measure
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

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!selectedRoomId) return;
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (!room) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeRoom(selectedRoomId); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateRoom(selectedRoomId); }
      else if (e.key === 'Escape') setSelectedRoom(null);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? SNAP_PX * 5 : SNAP_PX;
        const deltas: Record<string, [number, number]> = {
          ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        };
        const d = deltas[e.key];
        if (d) updateRoom(selectedRoomId, { x: room.x + d[0], y: room.y + d[1] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedRoomId, rooms, removeRoom, duplicateRoom, updateRoom, setSelectedRoom]);

  const fitRooms = useCallback(() => {
    if (floorRooms.length === 0) { setZoom(1); setPan({ x: 40, y: 40 }); return; }
    const minX = Math.min(...floorRooms.map((r) => r.x));
    const minY = Math.min(...floorRooms.map((r) => r.y));
    const maxX = Math.max(...floorRooms.map((r) => r.x + r.width * SCALE));
    const maxY = Math.max(...floorRooms.map((r) => r.y + r.height * SCALE));
    const pad = 80;
    const z = Math.min((size.w - pad * 2) / (maxX - minX || 1), (size.h - pad * 2) / (maxY - minY || 1), 2);
    setZoom(z);
    setPan({ x: pad - minX * z, y: pad - minY * z });
  }, [floorRooms, size]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const delta = e.evt.deltaY > 0 ? -0.12 : 0.12;
    const newZoom = Math.max(0.2, Math.min(4, zoom * (1 + delta)));
    const mp = { x: (pointer.x - pan.x) / zoom, y: (pointer.y - pan.y) / zoom };
    setZoom(newZoom);
    setPan({ x: pointer.x - mp.x * newZoom, y: pointer.y - mp.y * newZoom });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = (e: any) => {
    if (e.evt.button === 1 || e.evt.button === 2) {
      e.evt.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.evt.clientX - pan.x, y: e.evt.clientY - pan.y };
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (isPanning) setPan({ x: e.evt.clientX - panStart.current.x, y: e.evt.clientY - panStart.current.y });
  };

  const exportToPDF = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const w = window.open('', '_blank');
    if (!w) return;
    const floorName = `Plan — ${floorRooms.length} pièce(s)`;
    const legendRows = (Object.keys(ROOM_TYPE_LABELS) as (keyof typeof ROOM_TYPE_LABELS)[])
      .map((t) => `<div class="legend-item"><div class="dot" style="background:${ROOM_COLORS[t]}"></div> ${ROOM_TYPE_LABELS[t]}</div>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>RenovApp — ${floorName}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff;font-family:Inter,Arial,sans-serif;color:#0f172a}
.header{padding:18px 28px;border-bottom:2px solid #4f46e5;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:18px}.header p{font-size:11px;color:#64748b;margin-top:2px}
.canvas-wrap{padding:28px;display:flex;justify-content:center}img{max-width:100%;border:1px solid #e2e8f0;border-radius:10px}
.legend{padding:16px 28px;display:flex;gap:22px;flex-wrap:wrap;border-top:1px solid #e2e8f0}
.legend-item{display:flex;align-items:center;gap:8px;font-size:11px;color:#475569}
.dot{width:14px;height:14px;border-radius:3px;border:1px solid #94a3b8}.door{width:14px;height:8px;border:1.5px solid #b45309}.window{width:14px;height:0;border-top:2px solid #2563eb}
@media print{.no-print{display:none!important}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
<body><div class="header"><div><h1>RenovApp — Plan de masse</h1><p>${floorName} · Exporté le ${new Date().toLocaleDateString('fr-FR')}</p></div>
<button class="no-print" onclick="window.print()" style="padding:9px 16px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">⬇ Imprimer / PDF</button></div>
<div class="canvas-wrap"><img src="${dataUrl}" /></div>
<div class="legend">${legendRows}<div class="legend-item"><div class="door"></div> Porte</div><div class="legend-item"><div class="window"></div> Fenêtre</div></div></body></html>`);
    w.document.close();
  };

  const ToolBtn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button onClick={onClick} title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${active ? 'bg-brand-50 text-brand-600' : 'text-ink-muted hover:bg-slate-100'}`}>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-[var(--border)] flex-shrink-0">
        <ToolBtn onClick={() => setZoom((z) => Math.min(z + 0.2, 4))} title="Zoom avant"><ZoomIn size={16} /></ToolBtn>
        <span className="text-xs text-ink-faint w-11 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <ToolBtn onClick={() => setZoom((z) => Math.max(z - 0.2, 0.2))} title="Zoom arrière"><ZoomOut size={16} /></ToolBtn>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <ToolBtn onClick={fitRooms} title="Ajuster la vue"><Maximize2 size={16} /></ToolBtn>
        <ToolBtn active={showGrid} onClick={() => setShowGrid((g) => !g)} title="Grille"><Grid3x3 size={16} /></ToolBtn>
        <ToolBtn active={snapOn} onClick={() => setSnapOn((s) => !s)} title="Aimant (snap 10 cm)"><Magnet size={16} /></ToolBtn>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <ToolBtn onClick={() => selectedRoomId && duplicateRoom(selectedRoomId)} title="Dupliquer (Ctrl+D)"><Copy size={16} /></ToolBtn>
        <ToolBtn onClick={() => selectedRoomId && removeRoom(selectedRoomId)} title="Supprimer (Suppr)"><Trash2 size={16} /></ToolBtn>

        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-3 mr-2 text-xs text-ink-faint">
          <span className="flex items-center gap-1"><Move size={11} /> Clic droit = déplacer la vue</span>
          {overlapIds.size > 0 && <span className="text-rose-500 font-medium">⚠ {overlapIds.size} chevauchement(s)</span>}
        </div>
        <button onClick={exportToPDF} disabled={floorRooms.length === 0} className="btn-primary btn-sm">
          <FileDown size={14} /> Export PDF
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#fbfcfe]">
        {size.w > 0 && size.h > 0 && (
          <Stage
            ref={stageRef} width={size.w} height={size.h}
            scaleX={zoom} scaleY={zoom} x={pan.x} y={pan.y}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={() => setIsPanning(false)} onMouseLeave={() => setIsPanning(false)}
            onClick={(e) => { if (e.target === e.target.getStage()) setSelectedRoom(null); }}
            onContextMenu={(e) => e.evt.preventDefault()}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            <Layer listening={false}>
              {showGrid && <GridLayer width={CANVAS_LOGICAL.w} height={CANVAS_LOGICAL.h} />}
            </Layer>
            <Layer>
              {floorRooms.map((room) => (
                <RoomShape
                  key={room.id} room={room}
                  isSelected={room.id === selectedRoomId}
                  overlapping={overlapIds.has(room.id)}
                  snapOn={snapOn}
                  onSelect={() => setSelectedRoom(room.id)}
                  onChange={(u) => updateRoom(room.id, u)}
                />
              ))}
            </Layer>
          </Stage>
        )}

        {floorRooms.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Grid3x3 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-ink-faint text-sm font-medium">Aucune pièce sur cet étage</p>
            <p className="text-slate-300 text-xs mt-1">Ajoutez des pièces depuis le panneau de gauche</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GridLayer({ width, height }: { width: number; height: number }) {
  const lines = [];
  for (let x = 0; x <= width; x += GRID_PX) {
    const major = (x / GRID_PX) % 2 === 0;
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke={major ? '#e2e8f0' : '#eef2f7'} strokeWidth={major ? 1 : 0.5} listening={false} />);
  }
  for (let y = 0; y <= height; y += GRID_PX) {
    const major = (y / GRID_PX) % 2 === 0;
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke={major ? '#e2e8f0' : '#eef2f7'} strokeWidth={major ? 1 : 0.5} listening={false} />);
  }
  return <>{lines}</>;
}
