import type { PaymentMethod } from './cost';

/**
 * A sleeping place, derived from the plan: one per single bed, two per bunk.
 * Ids are stable as long as the placement exists, so occupancy history survives
 * moving a bed around the room.
 */
export interface BedSlot {
  id: string;
  placementId: string;
  /** 0 for a single bed, 0/1 for the two levels of a bunk. */
  level: number;
  label: string;
  roomId: string;
  roomName: string;
  isBunk: boolean;
}

export type BedState = 'free' | 'occupied' | 'reserved' | 'maintenance';

export interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  school?: string;
  emergencyContact?: string;
  notes?: string;
  /** IndexedDB media id for an ID photo. */
  idFileId?: string;
}

export type TenancyStatus = 'reserved' | 'active' | 'ended';

export interface Tenancy {
  id: string;
  tenantId: string;
  bedSlotId: string;
  startDate: string;
  /** Planned or actual move-out. Empty means open-ended. */
  endDate?: string;
  monthlyRent: number;
  /** Held, not earned: it is a debt towards the tenant until they leave. */
  depositAmount: number;
  advanceAmount: number;
  status: TenancyStatus;
  /** Day of the month rent falls due. */
  dueDay: number;
  notes?: string;
}

export interface RentPayment {
  id: string;
  tenancyId: string;
  /** Month the payment covers, as YYYY-MM. */
  period: string;
  dueDate: string;
  amount: number;
  paidDate?: string;
  method?: PaymentMethod;
  note?: string;
}

/** A bed under maintenance is unavailable but not rented. */
export interface MaintenanceBlock {
  id: string;
  bedSlotId: string;
  startDate: string;
  endDate?: string;
  reason: string;
}
