/** Trade of the crew doing the job — what the money and the days are grouped by. */
export type WorkTrade =
  | 'demolition'
  | 'maconnerie'
  | 'plomberie'
  | 'electricite'
  | 'menuiserie'
  | 'carrelage'
  | 'peinture'
  | 'toiture'
  | 'soudure'
  | 'nettoyage'
  | 'autre';

export type WorkStatus = 'planned' | 'in_progress' | 'done';

/**
 * One job done on the house by the workers.
 *
 * Built for the investor's question — "what was done, what did it cost, how
 * long did it take?" — so cost and time are first-class and approximate by
 * design: a day count, not a timesheet.
 *
 * Amounts are in PHP. When `linkCosts` is on, the store mirrors them into
 * Coûts & ROI as "Main d'œuvre" / "Matériaux" entries, so nothing is entered
 * twice and the budget and ROI stay complete.
 */
export interface WorkTask {
  id: string;
  title: string;
  trade: WorkTrade;
  status: WorkStatus;
  startDate: string;
  endDate?: string;
  /** Approximate working days the job took (or is expected to take). */
  durationDays: number;
  /** Headcount on the job. */
  workers: number;
  /** Who did it — free text ("Tonio + 2 aides"). */
  workerNames?: string;
  roomIds: string[];
  laborCost: number;
  materialCost: number;
  /** Mirror the amounts into Coûts & ROI. */
  linkCosts: boolean;
  /** Mirrored entries are recorded as paid (true) or planned (false). */
  costPaid: boolean;
  notes?: string;
}
