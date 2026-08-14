'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { Room, RoomType } from '@/types/plan';
import { Trash2, Plus, X, DoorOpen, RectangleHorizontal, Copy } from 'lucide-react';
import { ROOM_TYPES, ROOM_TYPE_LABELS, ROOM_COLORS } from '@/lib/rooms';
import { formatArea } from '@/lib/format';

type Wall = 'top' | 'bottom' | 'left' | 'right';
const WALLS: Wall[] = ['top', 'bottom', 'left', 'right'];
const WALL_LABELS: Record<Wall, string> = { top: 'Haut', bottom: 'Bas', left: 'Gauche', right: 'Droite' };

export default function RoomPanel({ room }: { room: Room }) {
  const { updateRoom, removeRoom, duplicateRoom, addDoor, removeDoor, addWindow, removeWindow, setSelectedRoom } =
    usePlanStore();

  const [showAddDoor, setShowAddDoor] = useState(false);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [doorForm, setDoorForm] = useState<{ wall: Wall; position: number; width: number }>({ wall: 'top', position: 0.5, width: 90 });
  const [windowForm, setWindowForm] = useState<{ wall: Wall; position: number; width: number }>({ wall: 'top', position: 0.5, width: 100 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const up = (u: Partial<Room>) => updateRoom(room.id, u);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 h-[60px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-6 w-6 flex-shrink-0 rounded-md border border-black/5" style={{ background: room.color }} />
          <h3 className="truncate text-sm font-bold text-ink">{room.name}</h3>
        </div>
        <button onClick={() => setSelectedRoom(null)} className="text-ink-faint hover:text-ink-soft">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* area badge */}
        <div className="flex items-center justify-between rounded-xl bg-[var(--bg-app)] px-3 py-2.5">
          <span className="text-xs text-ink-muted">Surface</span>
          <span className="text-sm font-bold text-ink">{formatArea(room.width, room.height)}</span>
        </div>

        {/* Basic info */}
        <section>
          <h4 className="section-title mb-3">Informations</h4>
          <div className="space-y-3">
            <div>
              <label className="label">Nom de la pièce</label>
              <input type="text" value={room.name} onChange={(e) => up({ name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={room.type}
                onChange={(e) => {
                  const t = e.target.value as RoomType;
                  up({ type: t, color: ROOM_COLORS[t] });
                }}
                className="input"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Couleur</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => up({ color: ROOM_COLORS[t] })}
                    className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                      room.color === ROOM_COLORS[t] ? 'border-ink shadow-md' : 'border-[var(--border)]'
                    }`}
                    style={{ background: ROOM_COLORS[t] }}
                    title={ROOM_TYPE_LABELS[t]}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section>
          <h4 className="section-title mb-3">Dimensions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Largeur (cm)</label>
              <input type="number" value={room.width} min="50" max="2000"
                onChange={(e) => up({ width: Math.max(50, parseInt(e.target.value) || 50) })} className="input" />
            </div>
            <div>
              <label className="label">Hauteur (cm)</label>
              <input type="number" value={room.height} min="50" max="2000"
                onChange={(e) => up({ height: Math.max(50, parseInt(e.target.value) || 50) })} className="input" />
            </div>
          </div>
        </section>

        {/* Doors */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="section-title flex items-center gap-1.5"><DoorOpen size={13} /> Portes</h4>
            <button onClick={() => setShowAddDoor((s) => !s)} className="text-brand-600 hover:text-brand-700"><Plus size={16} /></button>
          </div>
          {room.doors.length === 0 ? (
            <p className="text-xs text-ink-faint">Aucune porte</p>
          ) : (
            <div className="space-y-1.5">
              {room.doors.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
                  <span className="text-ink-muted">Mur {WALL_LABELS[d.wall].toLowerCase()} · {d.width} cm · {(d.position * 100).toFixed(0)}%</span>
                  <button onClick={() => removeDoor(room.id, d.id)} className="text-rose-500 hover:text-rose-700"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {showAddDoor && (
            <OpeningForm
              form={doorForm} setForm={setDoorForm} widthMin={50} widthMax={150}
              onAdd={() => { addDoor(room.id, doorForm); setShowAddDoor(false); }}
              onCancel={() => setShowAddDoor(false)}
            />
          )}
        </section>

        {/* Windows */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="section-title flex items-center gap-1.5"><RectangleHorizontal size={13} /> Fenêtres</h4>
            <button onClick={() => setShowAddWindow((s) => !s)} className="text-brand-600 hover:text-brand-700"><Plus size={16} /></button>
          </div>
          {room.windows.length === 0 ? (
            <p className="text-xs text-ink-faint">Aucune fenêtre</p>
          ) : (
            <div className="space-y-1.5">
              {room.windows.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-app)] px-2.5 py-1.5 text-xs">
                  <span className="text-ink-muted">Mur {WALL_LABELS[w.wall].toLowerCase()} · {w.width} cm · {(w.position * 100).toFixed(0)}%</span>
                  <button onClick={() => removeWindow(room.id, w.id)} className="text-rose-500 hover:text-rose-700"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {showAddWindow && (
            <OpeningForm
              form={windowForm} setForm={setWindowForm} widthMin={50} widthMax={250}
              onAdd={() => { addWindow(room.id, windowForm); setShowAddWindow(false); }}
              onCancel={() => setShowAddWindow(false)}
            />
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t border-[var(--border)] p-4">
        <button onClick={() => duplicateRoom(room.id)} className="btn-secondary btn-sm w-full">
          <Copy size={14} /> Dupliquer la pièce
        </button>
        {showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-muted">Supprimer définitivement cette pièce ?</p>
            <div className="flex gap-2">
              <button onClick={() => { removeRoom(room.id); setSelectedRoom(null); }} className="btn btn-sm flex-1 bg-rose-600 text-white hover:bg-rose-700">
                Supprimer
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary btn-sm flex-1">Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger btn-sm w-full">
            <Trash2 size={14} /> Supprimer la pièce
          </button>
        )}
      </div>
    </div>
  );
}

function OpeningForm({
  form, setForm, widthMin, widthMax, onAdd, onCancel,
}: {
  form: { wall: Wall; position: number; width: number };
  setForm: (f: { wall: Wall; position: number; width: number }) => void;
  widthMin: number; widthMax: number;
  onAdd: () => void; onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-app)] p-3">
      <div>
        <label className="label">Mur</label>
        <select value={form.wall} onChange={(e) => setForm({ ...form, wall: e.target.value as Wall })} className="input py-1.5 text-xs">
          {WALLS.map((w) => <option key={w} value={w}>{WALL_LABELS[w]}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Position le long du mur ({Math.round(form.position * 100)}%)</label>
        <input type="range" min="0" max="1" step="0.05" value={form.position}
          onChange={(e) => setForm({ ...form, position: parseFloat(e.target.value) })} className="w-full accent-brand-600" />
      </div>
      <div>
        <label className="label">Largeur (cm)</label>
        <input type="number" min={widthMin} max={widthMax} value={form.width}
          onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || widthMin })} className="input py-1.5 text-xs" />
      </div>
      <div className="flex gap-2">
        <button onClick={onAdd} className="btn-primary btn-sm flex-1">Ajouter</button>
        <button onClick={onCancel} className="btn-secondary btn-sm flex-1">Annuler</button>
      </div>
    </div>
  );
}
