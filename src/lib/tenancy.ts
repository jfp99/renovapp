import { addMonths } from './recurrence';
import type { MaintenanceBlock, RentPayment, Tenancy } from '@/types/tenancy';

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Does a tenancy cover this date? An empty endDate means still running. */
export function coversDate(tenancy: Tenancy, date: string): boolean {
  if (tenancy.status === 'ended' && tenancy.endDate && tenancy.endDate < date) return false;
  if (tenancy.startDate > date) return false;
  return !tenancy.endDate || tenancy.endDate >= date;
}

export function isBlocked(blocks: MaintenanceBlock[], bedSlotId: string, date: string): boolean {
  return blocks.some(
    (block) =>
      block.bedSlotId === bedSlotId &&
      block.startDate <= date &&
      (!block.endDate || block.endDate >= date)
  );
}

/**
 * Occupied slots on a given date, as a share of all slots.
 * This is the measured counterpart of the ROI's occupancy assumption.
 */
export function occupancyOn(
  slotIds: string[],
  tenancies: Tenancy[],
  date: string
): { occupied: number; total: number; rate: number } {
  const total = slotIds.length;
  if (total === 0) return { occupied: 0, total: 0, rate: 0 };

  const occupied = slotIds.filter((slotId) =>
    tenancies.some(
      (tenancy) =>
        tenancy.bedSlotId === slotId && tenancy.status !== 'reserved' && coversDate(tenancy, date)
    )
  ).length;

  return { occupied, total, rate: occupied / total };
}

/** Rent periods a tenancy owes between its start and `until`. */
export function duePeriods(tenancy: Tenancy, until: string): Array<{ period: string; dueDate: string }> {
  const end = tenancy.endDate && tenancy.endDate < until ? tenancy.endDate : until;
  const periods: Array<{ period: string; dueDate: string }> = [];

  for (let i = 0; i < 600; i += 1) {
    const anchor = addMonths(tenancy.startDate, i);
    if (anchor > end) break;

    const [year, month] = anchor.split('-');
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const day = String(Math.min(tenancy.dueDay || 1, lastDay)).padStart(2, '0');
    periods.push({ period: `${year}-${month}`, dueDate: `${year}-${month}-${day}` });
  }
  return periods;
}

/** Rent instalments not yet recorded for a tenancy. */
export function missingRentPayments(
  tenancy: Tenancy,
  existing: RentPayment[],
  until: string
): Array<Omit<RentPayment, 'id'>> {
  const already = new Set(
    existing.filter((p) => p.tenancyId === tenancy.id).map((p) => p.period)
  );

  return duePeriods(tenancy, until)
    .filter(({ period }) => !already.has(period))
    .map(({ period, dueDate }) => ({
      tenancyId: tenancy.id,
      period,
      dueDate,
      amount: tenancy.monthlyRent,
    }));
}

export function isOverdue(payment: RentPayment, date = today()): boolean {
  return !payment.paidDate && payment.dueDate < date;
}

/** Deposits are cash you hold but do not own — they must be repaid on exit. */
export function heldDeposits(tenancies: Tenancy[]): number {
  return tenancies
    .filter((t) => t.status !== 'ended')
    .reduce((sum, t) => sum + t.depositAmount, 0);
}
