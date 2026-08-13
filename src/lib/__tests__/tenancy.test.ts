import { describe, expect, it } from 'vitest';
import {
  coversDate,
  duePeriods,
  heldDeposits,
  isOverdue,
  missingRentPayments,
  occupancyOn,
} from '../tenancy';
import { buildBedSlots } from '../bedSlots';
import type { Tenancy } from '@/types/tenancy';
import type { CatalogItem, FurniturePlacement } from '@/types/furniture';
import type { Room } from '@/types/plan';

const tenancy: Tenancy = {
  id: 't1',
  tenantId: 'p1',
  bedSlotId: 'bed-a#0',
  startDate: '2026-08-01',
  monthlyRent: 3500,
  depositAmount: 3500,
  advanceAmount: 3500,
  status: 'active',
  dueDay: 5,
};

describe('buildBedSlots', () => {
  const catalog: CatalogItem[] = [
    { id: 'c-single', name: 'Lit simple', category: 'bed', defaultWidth: 90, defaultHeight: 200, color: '#000' },
    { id: 'c-bunk', name: 'Lit superposé', category: 'bed', defaultWidth: 90, defaultHeight: 200, color: '#000' },
    { id: 'c-desk', name: 'Bureau', category: 'desk', defaultWidth: 120, defaultHeight: 60, color: '#000' },
  ];
  const rooms = [{ id: 'r1', name: 'Chambre A' } as Room];
  const place = (id: string, catalogItemId: string): FurniturePlacement => ({
    id, roomId: 'r1', catalogItemId, x: 0, y: 0, rotation: 0, width: 90, height: 200,
  });

  it('gives a bunk two sleeping places and a single bed one', () => {
    const slots = buildBedSlots([place('b1', 'c-single'), place('b2', 'c-bunk')], catalog, rooms);
    expect(slots).toHaveLength(3);
    expect(slots.filter((s) => s.placementId === 'b2')).toHaveLength(2);
  });

  it('ignores furniture that is not a bed', () => {
    const slots = buildBedSlots([place('d1', 'c-desk')], catalog, rooms);
    expect(slots).toEqual([]);
  });

  it('labels the two levels of a bunk distinctly', () => {
    const slots = buildBedSlots([place('b2', 'c-bunk')], catalog, rooms);
    expect(slots.map((s) => s.label)).toEqual(['Lit superposé — bas', 'Lit superposé — haut']);
  });
});

describe('coversDate', () => {
  it('covers dates from the start onwards when open-ended', () => {
    expect(coversDate(tenancy, '2026-07-31')).toBe(false);
    expect(coversDate(tenancy, '2026-08-01')).toBe(true);
    expect(coversDate(tenancy, '2030-01-01')).toBe(true);
  });

  it('stops covering after the end date', () => {
    const ended = { ...tenancy, endDate: '2026-12-31', status: 'ended' as const };
    expect(coversDate(ended, '2026-12-31')).toBe(true);
    expect(coversDate(ended, '2027-01-01')).toBe(false);
  });
});

describe('occupancyOn', () => {
  const slots = ['bed-a#0', 'bed-a#1', 'bed-b#0', 'bed-b#1'];

  it('measures the real rate rather than assuming it', () => {
    const result = occupancyOn(slots, [tenancy], '2026-09-01');
    expect(result).toEqual({ occupied: 1, total: 4, rate: 0.25 });
  });

  it('does not count a reservation as an occupied bed', () => {
    const reserved = { ...tenancy, id: 't2', bedSlotId: 'bed-b#0', status: 'reserved' as const };
    expect(occupancyOn(slots, [tenancy, reserved], '2026-09-01').occupied).toBe(1);
  });

  it('reports zero when the plan has no beds', () => {
    expect(occupancyOn([], [tenancy], '2026-09-01')).toEqual({ occupied: 0, total: 0, rate: 0 });
  });
});

describe('duePeriods', () => {
  it('bills one period per month from the start', () => {
    expect(duePeriods(tenancy, '2026-10-15')).toEqual([
      { period: '2026-08', dueDate: '2026-08-05' },
      { period: '2026-09', dueDate: '2026-09-05' },
      { period: '2026-10', dueDate: '2026-10-05' },
    ]);
  });

  it('clamps the due day to a shorter month', () => {
    const late = { ...tenancy, startDate: '2027-01-31', dueDay: 31 };
    expect(duePeriods(late, '2027-02-28')[1]).toEqual({ period: '2027-02', dueDate: '2027-02-28' });
  });
});

describe('missingRentPayments', () => {
  it('only creates the periods not already recorded', () => {
    const existing = [
      { id: 'p1', tenancyId: 't1', period: '2026-08', dueDate: '2026-08-05', amount: 3500, paidDate: '2026-08-03' },
    ];
    const created = missingRentPayments(tenancy, existing, '2026-09-20');
    expect(created.map((p) => p.period)).toEqual(['2026-09']);
  });

  it('leaves new instalments unpaid', () => {
    const created = missingRentPayments(tenancy, [], '2026-09-20');
    expect(created.every((p) => p.paidDate === undefined)).toBe(true);
  });
});

describe('isOverdue', () => {
  const payment = { id: 'p', tenancyId: 't1', period: '2026-08', dueDate: '2026-08-05', amount: 3500 };

  it('flags an unpaid instalment past its due date', () => {
    expect(isOverdue(payment, '2026-08-06')).toBe(true);
    expect(isOverdue(payment, '2026-08-04')).toBe(false);
  });

  it('never flags a paid instalment', () => {
    expect(isOverdue({ ...payment, paidDate: '2026-08-10' }, '2026-12-01')).toBe(false);
  });
});

describe('heldDeposits', () => {
  it('counts deposits of running tenancies as money owed back', () => {
    const ended = { ...tenancy, id: 't3', status: 'ended' as const };
    expect(heldDeposits([tenancy, ended])).toBe(3500);
  });
});
