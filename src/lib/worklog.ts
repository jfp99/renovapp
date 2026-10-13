import type { CostEntry } from '@/types/cost';
import type { WorkStatus, WorkTask, WorkTrade } from '@/types/worklog';

export const TRADES: WorkTrade[] = [
  'demolition',
  'maconnerie',
  'plomberie',
  'electricite',
  'menuiserie',
  'carrelage',
  'peinture',
  'toiture',
  'soudure',
  'nettoyage',
  'autre',
];

export const TRADE_LABELS: Record<WorkTrade, string> = {
  demolition: 'Démolition',
  maconnerie: 'Maçonnerie',
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  menuiserie: 'Menuiserie',
  carrelage: 'Carrelage',
  peinture: 'Peinture',
  toiture: 'Toiture',
  soudure: 'Soudure / métal',
  nettoyage: 'Nettoyage',
  autre: 'Autre',
};

export const TRADE_COLORS: Record<WorkTrade, string> = {
  demolition: '#6B5E49',
  maconnerie: '#A89A82',
  plomberie: '#3E7C6B',
  electricite: '#DCA24B',
  menuiserie: '#8A5A3B',
  carrelage: '#5B7FA3',
  peinture: '#B4552F',
  toiture: '#2E5A4E',
  soudure: '#4A4A4A',
  nettoyage: '#7FA37F',
  autre: '#C98A2E',
};

export const STATUS_LABELS: Record<WorkStatus, string> = {
  planned: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

export const LABOR_CATEGORY_ID = 'cat-main-doeuvre';
export const MATERIAL_CATEGORY_ID = 'cat-materiaux';

/** Calendar days from start to end, both included. 0 when either is missing or reversed. */
export function daysInclusive(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

export const taskCost = (t: WorkTask) => (t.laborCost || 0) + (t.materialCost || 0);

/** Person-days: what the labour bill is actually paying for. */
export const personDays = (t: WorkTask) => (t.durationDays || 0) * Math.max(1, t.workers || 0);

/**
 * The Coûts & ROI entries a task should own, without ids. Pure, so the store
 * can diff it against what exists and the tests can check it directly.
 */
export function costDraftsFor(task: WorkTask): Array<Omit<CostEntry, 'id'>> {
  if (!task.linkCosts) return [];
  const base = {
    currency: 'PHP' as const,
    exchangeRate: 1,
    date: task.endDate || task.startDate,
    vendor: task.workerNames || undefined,
    linkedRoomIds: task.roomIds,
    status: task.costPaid ? ('paid' as const) : ('planned' as const),
    nature: 'capex' as const,
    workTaskId: task.id,
  };
  const drafts: Array<Omit<CostEntry, 'id'>> = [];
  if (task.laborCost > 0) {
    drafts.push({
      ...base,
      categoryId: LABOR_CATEGORY_ID,
      description: `Chantier · ${task.title} (main d'œuvre)`,
      amount: task.laborCost,
      workCostKind: 'labor',
    });
  }
  if (task.materialCost > 0) {
    drafts.push({
      ...base,
      categoryId: MATERIAL_CATEGORY_ID,
      description: `Chantier · ${task.title} (matériaux)`,
      amount: task.materialCost,
      workCostKind: 'material',
    });
  }
  return drafts;
}

/**
 * Replace the entries owned by `task` with fresh ones, keeping the ids of the
 * kinds that still exist so a row in the cost table doesn't jump around.
 * Pass `task = null` to drop every entry owned by `taskId`.
 */
export function syncTaskEntries(
  entries: CostEntry[],
  taskId: string,
  task: WorkTask | null,
  newId: () => string
): CostEntry[] {
  const owned = entries.filter((e) => e.workTaskId === taskId);
  const others = entries.filter((e) => e.workTaskId !== taskId);
  if (!task) return others;
  const fresh = costDraftsFor(task).map((draft) => {
    const previous = owned.find((e) => e.workCostKind === draft.workCostKind);
    return {
      ...draft,
      id: previous?.id ?? newId(),
      // Keep anything attached on the cost side (a receipt photo).
      receiptFileId: previous?.receiptFileId,
    } as CostEntry;
  });
  return [...others, ...fresh];
}

export interface GroupTotal {
  key: string;
  label: string;
  color?: string;
  cost: number;
  days: number;
  count: number;
}

export interface WorkSummary {
  totalCost: number;
  laborCost: number;
  materialCost: number;
  /** Working days, summed over tasks (jobs that overlap are counted once each). */
  days: number;
  personDays: number;
  /** Average paid per worker per day, over tasks that have both a labour cost and a duration. */
  dailyRate: number | null;
  done: number;
  inProgress: number;
  planned: number;
  firstDate?: string;
  lastDate?: string;
  byTrade: GroupTotal[];
  byRoom: GroupTotal[];
}

/** Cancelled-free by construction: a task that didn't happen is deleted, not kept. */
export function summarize(tasks: WorkTask[], roomNames: Map<string, string>): WorkSummary {
  const laborCost = tasks.reduce((s, t) => s + (t.laborCost || 0), 0);
  const materialCost = tasks.reduce((s, t) => s + (t.materialCost || 0), 0);

  const rated = tasks.filter((t) => t.laborCost > 0 && t.durationDays > 0);
  const ratedPersonDays = rated.reduce((s, t) => s + personDays(t), 0);
  const dailyRate =
    ratedPersonDays > 0 ? rated.reduce((s, t) => s + t.laborCost, 0) / ratedPersonDays : null;

  const dates = tasks
    .flatMap((t) => [t.startDate, t.endDate])
    .filter((d): d is string => Boolean(d))
    .sort();

  const trade = new Map<string, GroupTotal>();
  const room = new Map<string, GroupTotal>();
  for (const t of tasks) {
    const g = trade.get(t.trade) ?? {
      key: t.trade,
      label: TRADE_LABELS[t.trade] ?? t.trade,
      color: TRADE_COLORS[t.trade],
      cost: 0,
      days: 0,
      count: 0,
    };
    g.cost += taskCost(t);
    g.days += t.durationDays || 0;
    g.count += 1;
    trade.set(t.trade, g);

    // A job spanning several rooms is split evenly between them: a rough
    // share, but it keeps the room totals adding up to the real total.
    const ids = t.roomIds.length > 0 ? t.roomIds : ['__none'];
    for (const id of ids) {
      const r = room.get(id) ?? {
        key: id,
        label: id === '__none' ? 'Toute la maison' : roomNames.get(id) ?? 'Pièce supprimée',
        cost: 0,
        days: 0,
        count: 0,
      };
      r.cost += taskCost(t) / ids.length;
      r.days += (t.durationDays || 0) / ids.length;
      r.count += 1;
      room.set(id, r);
    }
  }

  const byCost = (a: GroupTotal, b: GroupTotal) => b.cost - a.cost || b.days - a.days;

  return {
    totalCost: laborCost + materialCost,
    laborCost,
    materialCost,
    days: tasks.reduce((s, t) => s + (t.durationDays || 0), 0),
    personDays: tasks.reduce((s, t) => s + personDays(t), 0),
    dailyRate,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    planned: tasks.filter((t) => t.status === 'planned').length,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    byTrade: Array.from(trade.values()).sort(byCost),
    byRoom: Array.from(room.values()).sort(byCost),
  };
}
