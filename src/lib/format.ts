/**
 * Formatting helpers — currency (PHP-first), areas, dates, numbers.
 * Single source of truth so the whole app stays consistent.
 */

import type { Currency } from '@/types/cost';

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  PHP: '₱',
  EUR: '€',
  USD: '$',
};

/** Format an amount in Philippine pesos (default app currency). */
export function formatPHP(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals = 0 } = opts;
  if (!Number.isFinite(value)) value = 0;

  if (compact && Math.abs(value) >= 1_000_000) {
    return `₱${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `₱${(value / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`;
  }
  return `₱${value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Format any currency amount with its symbol. */
export function formatMoney(value: number, currency: Currency = 'PHP', decimals = 0): string {
  if (!Number.isFinite(value)) value = 0;
  return `${CURRENCY_SYMBOL[currency]}${value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Convert an entry amount into PHP using its exchange rate. */
export function toPHP(amount: number, currency: Currency, exchangeRate: number): number {
  if (currency === 'PHP') return amount;
  return amount * (exchangeRate || 0);
}

/** Square metres from cm dimensions. */
export function areaM2(widthCm: number, heightCm: number): number {
  return (widthCm * heightCm) / 10_000;
}

export function formatArea(widthCm: number, heightCm: number, decimals = 1): string {
  return `${areaM2(widthCm, heightCm).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} m²`;
}

/** Format a percentage (0-100) with no decimals by default. */
export function formatPct(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) value = 0;
  return `${value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/** Human duration in months → "X an(s) Y mois". */
export function formatMonths(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return '—';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} mois`;
  if (rem === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} ${rem} mois`;
}

/** Format an ISO date string as DD/MM/YYYY. */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
