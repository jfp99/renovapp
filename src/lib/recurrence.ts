import type { CostEntry, Recurrence } from '@/types/cost';

const STEP_MONTHS: Record<Exclude<Recurrence, 'none'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** Add months to an ISO date, clamping the day to the target month's length. */
export function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function isTemplate(entry: CostEntry): boolean {
  return Boolean(entry.recurrence && entry.recurrence !== 'none' && !entry.recurrenceParentId);
}

/**
 * Dates a recurring template should have produced between its start and `until`.
 * The template's own date counts as the first instalment.
 */
export function dueDates(entry: CostEntry, until: string): string[] {
  if (!isTemplate(entry)) return [];
  const step = STEP_MONTHS[entry.recurrence as Exclude<Recurrence, 'none'>];
  if (!step) return [];

  const end = entry.recurrenceEndDate && entry.recurrenceEndDate < until ? entry.recurrenceEndDate : until;

  const dates: string[] = [];
  let cursor = entry.date;
  // 600 iterations caps a 50-year monthly series — a runaway guard, not a limit.
  for (let i = 0; i < 600 && cursor <= end; i += 1) {
    dates.push(cursor);
    cursor = addMonths(entry.date, step * (i + 1));
  }
  return dates;
}

/**
 * Instalments a template still owes, as entries ready to be added.
 *
 * Generated instalments are always 'planned', never 'paid': the app must not
 * decide on its own that money left your pocket. You confirm each one.
 */
export function missingInstalments(
  template: CostEntry,
  existing: CostEntry[],
  until: string
): Array<Omit<CostEntry, 'id'>> {
  const already = new Set(
    existing.filter((e) => e.recurrenceParentId === template.id).map((e) => e.date)
  );

  return dueDates(template, until)
    .filter((date) => date !== template.date && !already.has(date))
    .map((date) => ({
      categoryId: template.categoryId,
      description: template.description,
      amount: template.amount,
      currency: template.currency,
      exchangeRate: template.exchangeRate,
      date,
      vendor: template.vendor,
      linkedRoomIds: [...template.linkedRoomIds],
      status: 'planned' as const,
      nature: template.nature,
      paymentMethod: template.paymentMethod,
      recurrenceParentId: template.id,
    }));
}
