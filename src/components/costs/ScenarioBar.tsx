'use client';

import React, { useState } from 'react';
import { Copy, Plus, Trash2, Check, PencilLine } from 'lucide-react';
import { useScenarioStore } from '@/stores/scenarioStore';

/** Scenario switcher: name, duplicate, rename, delete. */
export const ScenarioBar: React.FC = () => {
  const { scenarios, activeId, setActive, addScenario, duplicateScenario, renameScenario, removeScenario } =
    useScenarioStore();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  const startRename = () => {
    setDraftName(active.name);
    setEditing(true);
  };

  const commitRename = () => {
    if (draftName.trim()) renameScenario(active.id, draftName.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setActive(scenario.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              scenario.id === activeId
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                : 'border-[var(--border)] text-ink-muted hover:bg-[var(--bg-app)]'
            }`}
          >
            {scenario.name}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {editing ? (
          <>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="input w-44 py-1 text-sm"
            />
            <button onClick={commitRename} className="btn-primary btn-sm" aria-label="Valider">
              <Check size={14} />
            </button>
          </>
        ) : (
          <button onClick={startRename} className="btn-secondary btn-sm" title="Renommer">
            <PencilLine size={14} />
          </button>
        )}
        <button
          onClick={() => duplicateScenario(active.id)}
          className="btn-secondary btn-sm"
          title="Dupliquer ce scénario"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => addScenario(`Scénario ${scenarios.length + 1}`)}
          className="btn-secondary btn-sm"
          title="Nouveau scénario"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => removeScenario(active.id)}
          disabled={scenarios.length <= 1}
          className="btn-secondary btn-sm text-red-600 disabled:opacity-40"
          title="Supprimer ce scénario"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
