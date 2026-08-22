'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import PlanCanvas from '@/components/plan-editor/PlanCanvas';
import RoomPanel from '@/components/plan-editor/RoomPanel';
import FloorSelector from '@/components/plan-editor/FloorSelector';
import RoomListItem from '@/components/plan-editor/RoomListItem';
import { Plus, X, PencilRuler, List, Map } from 'lucide-react';
import { RoomType } from '@/types/plan';
import { useHydrated } from '@/lib/useHydrated';
import { ROOM_COLORS, ROOM_TYPES, ROOM_TYPE_LABELS, ROOM_ACCENT } from '@/lib/rooms';
import { areaM2 } from '@/lib/format';
import { IS_READONLY } from '@/lib/readonly';

export default function PlansPage() {
  const hydrated = useHydrated();
  const { floors, rooms, selectedFloorId, selectedRoomId, setSelectedRoom, addRoom } = usePlanStore();
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  /**
   * Mobile only. The desktop layout puts the list, the canvas and the room
   * panel side by side; at 390px that leaves ~100px for the drawing. On a
   * phone we show one at a time and let the user switch.
   */
  const [mobileView, setMobileView] = useState<'list' | 'canvas'>('list');
  const [formData, setFormData] = useState({ name: '', type: 'bedroom' as RoomType, width: 400, height: 300 });

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);
  const currentRooms = selectedFloorId ? rooms.filter((r) => r.floorId === selectedFloorId) : [];
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleAddRoom = () => {
    if (!selectedFloorId || !formData.name.trim()) return;
    addRoom(selectedFloorId, {
      floorId: selectedFloorId,
      name: formData.name,
      type: formData.type,
      x: 60,
      y: 60,
      width: formData.width,
      height: formData.height,
      color: ROOM_COLORS[formData.type],
      doors: [],
      windows: [],
    });
    setFormData({ name: '', type: 'bedroom', width: 400, height: 300 });
    setShowAddRoomForm(false);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:h-screen md:flex-row">
      {/* ── MOBILE SWITCH ── */}
      <div className="flex gap-1 border-b border-[var(--border)] bg-white p-2 md:hidden">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold ${
            mobileView === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted'
          }`}
        >
          <List className="mr-1.5 inline h-4 w-4" /> Pièces
        </button>
        <button
          onClick={() => setMobileView('canvas')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold ${
            mobileView === 'canvas' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted'
          }`}
        >
          <Map className="mr-1.5 inline h-4 w-4" /> Plan
        </button>
      </div>

      {/* ── LEFT PANEL ── */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} w-full min-h-0 flex-1 flex-col border-r border-[var(--border)] bg-white z-10 md:flex md:w-72 md:flex-none`}>
        <div className="hidden h-[60px] items-center gap-2 border-b border-[var(--border)] px-5 md:flex">
          <PencilRuler className="h-5 w-5 text-brand-600" />
          <div>
            <h1 className="text-[15px] font-bold text-ink leading-tight">Éditeur de plan</h1>
            <p className="text-[11px] text-ink-faint leading-tight">Dessinez vos pièces</p>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[var(--border)]">
          <FloorSelector />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">{selectedFloor ? selectedFloor.name : 'Aucun étage'}</h2>
            <span className="badge-muted">{hydrated ? currentRooms.length : 0}</span>
          </div>
          <div className="space-y-1.5">
            {hydrated && currentRooms.length === 0 && (
              <p className="py-8 text-center text-xs text-ink-faint">
                Aucune pièce. Cliquez sur « Ajouter » pour commencer.
              </p>
            )}
            {hydrated &&
              currentRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isSelected={selectedRoomId === room.id}
                  onSelect={() => setSelectedRoom(room.id)}
                />
              ))}
          </div>
        </div>

        <div className={`border-t border-[var(--border)] px-4 py-4 ${IS_READONLY ? 'hidden' : ''}`}>
          <button
            onClick={() => setShowAddRoomForm(true)}
            disabled={!selectedFloorId}
            className="btn-primary w-full"
          >
            <Plus size={16} /> Ajouter une pièce
          </button>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div className={`${mobileView === 'canvas' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex`}>
        <PlanCanvas />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className={`overflow-y-auto border-[var(--border)] bg-white transition-all duration-200 md:flex-shrink-0 md:border-l ${
          selectedRoom
            ? 'max-h-[45dvh] w-full border-t md:max-h-none md:w-80'
            : 'hidden w-0 md:block'
        }`}
      >
        {selectedRoom && <RoomPanel room={selectedRoom} />}
      </div>

      {/* ── ADD ROOM MODAL ── */}
      {showAddRoomForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm animate-fade-in sm:items-center">
          <div className="mx-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-float animate-scale-in sm:mx-4 sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-app)] px-6 py-4">
              <h3 className="text-base font-semibold text-ink">Nouvelle pièce</h3>
              <button onClick={() => setShowAddRoomForm(false)} className="text-ink-faint hover:text-ink-soft">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="label">Nom de la pièce *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="ex. Dortoir A, Cuisine…"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${
                        formData.type === type
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-[var(--border)] text-ink-muted hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {ROOM_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Largeur (cm)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Math.max(50, parseInt(e.target.value) || 50) })}
                    min="50"
                    max="2000"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Hauteur (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Math.max(50, parseInt(e.target.value) || 50) })}
                    min="50"
                    max="2000"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <div
                  className="h-10 w-10 flex-shrink-0 rounded-lg border-2"
                  style={{ background: ROOM_COLORS[formData.type], borderColor: ROOM_ACCENT[formData.type] }}
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{formData.name || 'Nouvelle pièce'}</p>
                  <p className="text-xs text-ink-muted">
                    {formData.width} × {formData.height} cm · {areaM2(formData.width, formData.height).toFixed(1)} m²
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-[var(--border)] bg-[var(--bg-app)] px-6 py-4">
              <button onClick={() => setShowAddRoomForm(false)} className="btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={handleAddRoom} disabled={!formData.name.trim()} className="btn-primary flex-1">
                Créer la pièce
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
