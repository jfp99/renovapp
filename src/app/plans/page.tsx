'use client';

import { useState } from 'react';
import { usePlanStore } from '@/stores/planStore';
import PlanCanvas from '@/components/plan-editor/PlanCanvas';
import RoomPanel from '@/components/plan-editor/RoomPanel';
import FloorSelector from '@/components/plan-editor/FloorSelector';
import RoomListItem from '@/components/plan-editor/RoomListItem';
import { Plus, X } from 'lucide-react';
import { Room, RoomType } from '@/types/plan';

const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#dbeafe',
  bathroom: '#d1fae5',
  kitchen: '#fef3c7',
  common: '#fce7f3',
  storage: '#f3e8ff',
  hallway: '#f1f5f9',
};

const ROOM_TYPES: RoomType[] = ['bedroom', 'bathroom', 'kitchen', 'common', 'storage', 'hallway'];
const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: 'Chambre',
  bathroom: 'Salle de bain',
  kitchen: 'Cuisine',
  common: 'Pièce commune',
  storage: 'Rangement',
  hallway: 'Couloir',
};

export default function PlansPage() {
  const { floors, rooms, selectedFloorId, selectedRoomId, setSelectedRoom, addRoom } = usePlanStore();
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
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
    // Full remaining height — layout main has ml-60, so this fills the viewport
    <div className="flex overflow-hidden bg-slate-100" style={{ height: '100vh' }}>

      {/* ── LEFT PANEL : floors + room list ── */}
      <div className="w-72 flex-shrink-0 bg-white shadow-md flex flex-col border-r border-slate-200 z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h1 className="text-lg font-bold text-slate-900">Plan Editor</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dessinez les pièces de votre maison</p>
        </div>

        {/* Floor selector */}
        <div className="px-4 py-3 border-b border-slate-200">
          <FloorSelector />
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {selectedFloor ? selectedFloor.name : 'Aucun étage'}
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {currentRooms.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {currentRooms.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Aucune pièce. Cliquez sur "Ajouter" pour commencer.
              </p>
            )}
            {currentRooms.map((room) => (
              <RoomListItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onSelect={() => setSelectedRoom(room.id)}
              />
            ))}
          </div>
        </div>

        {/* Add room button */}
        <div className="px-4 py-4 border-t border-slate-200">
          <button
            onClick={() => setShowAddRoomForm(true)}
            disabled={!selectedFloorId}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Ajouter une pièce
          </button>
        </div>
      </div>

      {/* ── CENTER : canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PlanCanvas />
      </div>

      {/* ── RIGHT PANEL : room details (slides in when a room is selected) ── */}
      <div
        className={`flex-shrink-0 bg-white shadow-md border-l border-slate-200 overflow-y-auto transition-all duration-200 ${
          selectedRoom ? 'w-80' : 'w-0'
        }`}
      >
        {selectedRoom && <RoomPanel room={selectedRoom} />}
      </div>

      {/* ── ADD ROOM MODAL ── */}
      {showAddRoomForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Nouvelle pièce</h3>
              <button onClick={() => setShowAddRoomForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la pièce *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="ex. Chambre 1, Cuisine..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type, color: ROOM_COLORS[type] } as typeof formData & { color: string })}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-all ${
                        formData.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {ROOM_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Largeur (cm)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Math.max(50, parseInt(e.target.value) || 50) })}
                    min="50" max="2000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hauteur (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Math.max(50, parseInt(e.target.value) || 50) })}
                    min="50" max="2000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Preview swatch */}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: ROOM_COLORS[formData.type] }}>
                <div className="w-8 h-8 rounded border-2 border-slate-400 flex-shrink-0" style={{ background: ROOM_COLORS[formData.type] }} />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{formData.name || 'Nouvelle pièce'}</p>
                  <p className="text-xs text-slate-600">{formData.width} × {formData.height} cm = {((formData.width * formData.height) / 10000).toFixed(1)} m²</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowAddRoomForm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddRoom}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Créer la pièce
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
