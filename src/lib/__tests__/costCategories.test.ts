import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  useCostStore,
  defaultCategories,
  withDefaultCategories,
} from '@/stores/costStore';

/**
 * Regression guard for the bug that emptied the expense category dropdown.
 *
 * A persisted `categories: []` used to survive rehydration untouched, because
 * zustand's default merge is a shallow spread of the persisted state over the
 * initial one. The expense form builds its <select> from that array, so the
 * dropdown rendered empty AND the form refused to submit (categoryId stayed
 * ''), with no error shown anywhere. The failure was completely silent.
 */
describe('cost categories — never empty', () => {
  beforeEach(() => {
    useCostStore.setState({ categories: defaultCategories, entries: [] });
  });

  it('seeds defaults when the list is missing, null or empty', () => {
    expect(withDefaultCategories(undefined)).toEqual(defaultCategories);
    expect(withDefaultCategories(null)).toEqual(defaultCategories);
    expect(withDefaultCategories([])).toEqual(defaultCategories);
  });

  it('leaves a non-empty list alone', () => {
    const custom = [
      { id: 'x', name: 'Perso', color: '#000', budgetAllocation: 0, defaultNature: 'capex' as const },
    ];
    expect(withDefaultCategories(custom)).toBe(custom);
  });

  it('uses stable ids, so re-seeding does not orphan entries', () => {
    const ids = defaultCategories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      // A uuid would change on every module load and break existing entries.
      expect(id).toMatch(/^cat-[a-z-]+$/);
    }
  });

  it('refuses to leave zero categories when the last one is deleted', () => {
    useCostStore.setState({
      categories: [
        { id: 'only', name: 'Seule', color: '#000', budgetAllocation: 0, defaultNature: 'capex' },
      ],
      entries: [],
    });
    useCostStore.getState().removeCategory('only');
    expect(useCostStore.getState().categories.length).toBeGreaterThan(0);
  });

  it('resetCategories restores the defaults and keeps budgets already set', () => {
    useCostStore.setState({
      categories: [{ ...defaultCategories[0], budgetAllocation: 25_000 }],
      entries: [],
    });
    useCostStore.getState().resetCategories();
    const restored = useCostStore.getState().categories;
    expect(restored).toHaveLength(defaultCategories.length);
    expect(restored.find((c) => c.id === defaultCategories[0].id)?.budgetAllocation).toBe(25_000);
  });

  it('deleting a category drops only its own entries', () => {
    useCostStore.setState({
      categories: defaultCategories,
      entries: [
        {
          id: 'e1', categoryId: 'cat-materiaux', description: 'ciment', amount: 100,
          currency: 'PHP', exchangeRate: 1, date: '2026-01-01', linkedRoomIds: [],
          status: 'paid', nature: 'capex',
        },
        {
          id: 'e2', categoryId: 'cat-meubles', description: 'lit', amount: 200,
          currency: 'PHP', exchangeRate: 1, date: '2026-01-01', linkedRoomIds: [],
          status: 'paid', nature: 'capex',
        },
      ],
    });
    useCostStore.getState().removeCategory('cat-materiaux');
    const entries = useCostStore.getState().entries;
    expect(entries.map((e) => e.id)).toEqual(['e2']);
  });
});

/**
 * Source-level guards. These read the files rather than exercise them, because
 * the failure modes are structural: a missing `merge`, or a dropdown with no
 * placeholder, cannot be caught by rendering a healthy store.
 */
describe('cost store — persistence is self-healing', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8');

  it('the persist config defines a merge that reseeds categories', () => {
    const src = read('src/stores/costStore.ts');
    expect(src).toMatch(/merge:\s*\(persisted,\s*current\)/);
    const merge = src.slice(src.indexOf('merge:'));
    expect(merge).toContain('withDefaultCategories(p.categories)');
  });

  it('migrate funnels categories through withDefaultCategories', () => {
    const src = read('src/stores/costStore.ts');
    const migrate = src.slice(src.indexOf('migrate:'), src.indexOf('merge:'));
    expect(migrate).toContain('withDefaultCategories');
  });

  it('the expense form shows a placeholder instead of a blank select', () => {
    const src = read('src/components/costs/CostForm.tsx');
    expect(src).toContain('Aucune catégorie');
    expect(src).toMatch(/disabled=\{categories\.length === 0\}/);
  });
});
