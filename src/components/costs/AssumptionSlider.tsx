'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface AssumptionSliderProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Rendered next to the label, e.g. "₱3 000" or "85 %". */
  format: (value: number) => string;
  onChange: (value: number) => void;
  locked?: boolean;
  onToggleLock?: () => void;
}

/**
 * Slider + numeric input for one assumption. The lock lets you pin a driver
 * while sweeping the others — "I hold the rent, I vary occupancy".
 */
export const AssumptionSlider: React.FC<AssumptionSliderProps> = ({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
  locked = false,
  onToggleLock,
}) => (
  <div className={locked ? 'opacity-60' : undefined}>
    <div className="flex items-baseline justify-between gap-2">
      <label className="text-sm font-medium text-ink-soft">{label}</label>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold tabular-nums text-ink">{format(value)}</span>
        {onToggleLock && (
          <button
            type="button"
            onClick={onToggleLock}
            className="rounded p-1 text-ink-faint transition-colors hover:bg-[var(--bg-app)] hover:text-ink-soft"
            aria-label={locked ? `Déverrouiller ${label}` : `Verrouiller ${label}`}
            title={locked ? 'Déverrouiller' : 'Figer cette hypothèse'}
          >
            {locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        )}
      </div>
    </div>

    <div className="mt-1.5 flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-brand-600 disabled:cursor-not-allowed"
      />
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input w-28 py-1 text-sm tabular-nums disabled:cursor-not-allowed"
      />
    </div>

    {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
  </div>
);
