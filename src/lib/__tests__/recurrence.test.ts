import { describe, expect, it } from 'vitest';
import { addMonths, dueDates, isTemplate, missingInstalments } from '../recurrence';
import type { CostEntry } from '@/types/cost';

const template: CostEntry = {
  id: 'tpl',
  categoryId: 'cat',
  description: 'Loyer bail principal',
  amount: 18000,
  currency: 'PHP',
  exchangeRate: 1,
  date: '2026-01-15',
  linkedRoomIds: [],
  status: 'paid',
  nature: 'opex',
  recurrence: 'monthly',
};

describe('addMonths', () => {
  it('clamps to the last day of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 3)).toBe('2026-04-30');
  });

  it('crosses the year boundary', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });
});

describe('isTemplate', () => {
  it('recognises a repeating entry', () => {
    expect(isTemplate(template)).toBe(true);
  });

  it('does not treat a generated instalment as a template', () => {
    expect(isTemplate({ ...template, recurrenceParentId: 'tpl' })).toBe(false);
    expect(isTemplate({ ...template, recurrence: 'none' })).toBe(false);
  });
});

describe('dueDates', () => {
  it('lists every monthly date up to the cutoff, start included', () => {
    expect(dueDates(template, '2026-04-20')).toEqual([
      '2026-01-15',
      '2026-02-15',
      '2026-03-15',
      '2026-04-15',
    ]);
  });

  it('stops at the recurrence end date', () => {
    const bounded = { ...template, recurrenceEndDate: '2026-03-01' };
    expect(dueDates(bounded, '2026-12-31')).toEqual(['2026-01-15', '2026-02-15']);
  });

  it('steps by three months when quarterly', () => {
    const quarterly = { ...template, recurrence: 'quarterly' as const };
    expect(dueDates(quarterly, '2026-08-01')).toEqual(['2026-01-15', '2026-04-15', '2026-07-15']);
  });
});

describe('missingInstalments', () => {
  it('never marks a generated instalment as paid', () => {
    const created = missingInstalments(template, [], '2026-03-20');
    expect(created).toHaveLength(2);
    expect(created.every((e) => e.status === 'planned')).toBe(true);
    expect(created.every((e) => e.recurrenceParentId === 'tpl')).toBe(true);
  });

  it('is idempotent — already generated dates are skipped', () => {
    const existing: CostEntry[] = [
      { ...template, id: 'inst-1', date: '2026-02-15', recurrenceParentId: 'tpl', recurrence: undefined },
    ];
    const created = missingInstalments(template, existing, '2026-03-20');
    expect(created.map((e) => e.date)).toEqual(['2026-03-15']);
  });

  it('produces nothing for a one-off expense', () => {
    expect(missingInstalments({ ...template, recurrence: 'none' }, [], '2027-01-01')).toEqual([]);
  });
});
