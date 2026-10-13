import { describe, expect, it } from 'vitest';
import { costDraftsFor, daysInclusive, summarize, syncTaskEntries } from '../worklog';
import type { CostEntry } from '@/types/cost';
import type { WorkTask } from '@/types/worklog';

const task = (over: Partial<WorkTask> = {}): WorkTask => ({
  id: 'w1',
  title: 'Carrelage cuisine',
  trade: 'carrelage',
  status: 'done',
  startDate: '2026-09-10',
  durationDays: 4,
  workers: 2,
  roomIds: ['r-cuisine'],
  laborCost: 8000,
  materialCost: 15500,
  linkCosts: true,
  costPaid: true,
  ...over,
});

let n = 0;
const id = () => `id${++n}`;

describe('daysInclusive', () => {
  it('compte le premier et le dernier jour', () => {
    expect(daysInclusive('2026-09-01', '2026-09-03')).toBe(3);
    expect(daysInclusive('2026-09-01', '2026-09-01')).toBe(1);
  });
  it('vaut 0 si une date manque ou si la fin précède le début', () => {
    expect(daysInclusive('2026-09-03', '2026-09-01')).toBe(0);
    expect(daysInclusive('2026-09-03', '')).toBe(0);
  });
  it('traverse un changement de mois', () => {
    expect(daysInclusive('2026-09-29', '2026-10-02')).toBe(4);
  });
});

describe('report dans Coûts & ROI', () => {
  it('crée une ligne main d’œuvre et une ligne matériaux, en CAPEX payé', () => {
    const drafts = costDraftsFor(task());
    expect(drafts.map((d) => [d.categoryId, d.amount, d.status, d.nature])).toEqual([
      ['cat-main-doeuvre', 8000, 'paid', 'capex'],
      ['cat-materiaux', 15500, 'paid', 'capex'],
    ]);
    expect(drafts.every((d) => d.workTaskId === 'w1' && d.currency === 'PHP')).toBe(true);
  });

  it('ne crée rien quand le report est décoché — pas de double comptage', () => {
    expect(costDraftsFor(task({ linkCosts: false }))).toEqual([]);
  });

  it('saute un montant nul', () => {
    expect(costDraftsFor(task({ materialCost: 0 })).map((d) => d.workCostKind)).toEqual(['labor']);
  });

  it('compte en prévu ce qui n’est pas encore payé', () => {
    expect(costDraftsFor(task({ costPaid: false }))[0].status).toBe('planned');
  });

  it('date la dépense à la fin du travail quand elle est connue', () => {
    expect(costDraftsFor(task({ endDate: '2026-09-14' }))[0].date).toBe('2026-09-14');
  });

  it('une modification remplace les lignes sans en dupliquer, en gardant leurs ids', () => {
    const other: CostEntry = { ...costDraftsFor(task())[0], id: 'manual', workTaskId: undefined, workCostKind: undefined };
    const first = syncTaskEntries([other], 'w1', task(), id);
    const laborId = first.find((e) => e.workCostKind === 'labor')!.id;

    const second = syncTaskEntries(first, 'w1', task({ laborCost: 9000, materialCost: 0 }), id);
    expect(second).toHaveLength(2); // the manual entry + labour only
    expect(second.find((e) => e.id === 'manual')).toBeDefined();
    const labor = second.find((e) => e.workCostKind === 'labor')!;
    expect(labor.id).toBe(laborId);
    expect(labor.amount).toBe(9000);
  });

  it('supprimer la tâche supprime ses lignes, et seulement elles', () => {
    const synced = syncTaskEntries([], 'w1', task(), id);
    const withOther = syncTaskEntries(synced, 'w2', task({ id: 'w2' }), id);
    const after = syncTaskEntries(withOther, 'w1', null, id);
    expect(after.every((e) => e.workTaskId === 'w2')).toBe(true);
    expect(after).toHaveLength(2);
  });
});

describe('résumé pour l’investisseur', () => {
  const rooms = new Map([
    ['r1', 'CHAMBRE 1'],
    ['r2', 'CHAMBRE 2'],
    ['r-cuisine', 'CUISINE'],
  ]);
  const tasks = [
    task({ id: 'a', trade: 'demolition', durationDays: 3, workers: 3, laborCost: 7200, materialCost: 0, roomIds: ['r1', 'r2'] }),
    task({ id: 'b' }),
    task({ id: 'c', trade: 'peinture', status: 'in_progress', durationDays: 5, workers: 2, laborCost: 6000, materialCost: 4200, roomIds: [] }),
  ];
  const s = summarize(tasks, rooms);

  it('additionne coût, jours et jours-ouvrier', () => {
    expect(s.totalCost).toBe(40900);
    expect(s.laborCost).toBe(21200);
    expect(s.days).toBe(12);
    expect(s.personDays).toBe(27);
  });

  it('calcule le coût moyen d’un ouvrier par jour', () => {
    expect(Math.round(s.dailyRate!)).toBe(785);
  });

  it('compte l’avancement', () => {
    expect([s.done, s.inProgress, s.planned]).toEqual([2, 1, 0]);
  });

  it('trie les métiers par coût', () => {
    expect(s.byTrade.map((g) => g.key)).toEqual(['carrelage', 'peinture', 'demolition']);
  });

  it('répartit une tâche multi-pièces sans changer le total', () => {
    const roomTotal = s.byRoom.reduce((sum, g) => sum + g.cost, 0);
    expect(roomTotal).toBeCloseTo(s.totalCost);
    expect(s.byRoom.find((g) => g.key === 'r1')!.cost).toBe(3600);
    expect(s.byRoom.find((g) => g.key === '__none')!.label).toBe('Toute la maison');
  });

  it('ne divise pas par zéro sans main d’œuvre', () => {
    expect(summarize([task({ laborCost: 0 })], rooms).dailyRate).toBeNull();
    expect(summarize([], rooms).totalCost).toBe(0);
  });
});
