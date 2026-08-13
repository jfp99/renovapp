import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { deleteMedia } from '@/lib/mediaDb';
import { missingRentPayments, today } from '@/lib/tenancy';
import type { MaintenanceBlock, RentPayment, Tenancy, Tenant } from '@/types/tenancy';

interface TenancyState {
  tenants: Tenant[];
  tenancies: Tenancy[];
  payments: RentPayment[];
  maintenance: MaintenanceBlock[];

  addTenant: (tenant: Omit<Tenant, 'id'>) => string;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;

  addTenancy: (tenancy: Omit<Tenancy, 'id'>) => string;
  updateTenancy: (id: string, updates: Partial<Tenancy>) => void;
  endTenancy: (id: string, endDate: string) => void;
  removeTenancy: (id: string) => void;

  markPaid: (paymentId: string, paidDate: string) => void;
  markUnpaid: (paymentId: string) => void;
  updatePayment: (paymentId: string, updates: Partial<RentPayment>) => void;

  addMaintenance: (block: Omit<MaintenanceBlock, 'id'>) => void;
  removeMaintenance: (id: string) => void;

  /** Create rent instalments owed up to `until`. Idempotent; returns how many. */
  materializeRent: (until?: string) => number;
}

export const useTenancyStore = create<TenancyState>()(
  persist(
    (set, get) => ({
      tenants: [],
      tenancies: [],
      payments: [],
      maintenance: [],

      addTenant: (tenant) => {
        const id = uuidv4();
        set((state) => ({ tenants: [...state.tenants, { ...tenant, id }] }));
        return id;
      },

      updateTenant: (id, updates) =>
        set((state) => ({
          tenants: state.tenants.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      removeTenant: (id) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (tenant?.idFileId) void deleteMedia(tenant.idFileId);
        const doomedTenancies = get().tenancies.filter((t) => t.tenantId === id).map((t) => t.id);
        set((state) => ({
          tenants: state.tenants.filter((t) => t.id !== id),
          tenancies: state.tenancies.filter((t) => t.tenantId !== id),
          payments: state.payments.filter((p) => !doomedTenancies.includes(p.tenancyId)),
        }));
      },

      addTenancy: (tenancy) => {
        const id = uuidv4();
        set((state) => ({ tenancies: [...state.tenancies, { ...tenancy, id }] }));
        return id;
      },

      updateTenancy: (id, updates) =>
        set((state) => ({
          tenancies: state.tenancies.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      endTenancy: (id, endDate) =>
        set((state) => ({
          tenancies: state.tenancies.map((t) =>
            t.id === id ? { ...t, endDate, status: 'ended' as const } : t
          ),
        })),

      removeTenancy: (id) =>
        set((state) => ({
          tenancies: state.tenancies.filter((t) => t.id !== id),
          payments: state.payments.filter((p) => p.tenancyId !== id),
        })),

      markPaid: (paymentId, paidDate) =>
        set((state) => ({
          payments: state.payments.map((p) => (p.id === paymentId ? { ...p, paidDate } : p)),
        })),

      markUnpaid: (paymentId) =>
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId ? { ...p, paidDate: undefined } : p
          ),
        })),

      updatePayment: (paymentId, updates) =>
        set((state) => ({
          payments: state.payments.map((p) => (p.id === paymentId ? { ...p, ...updates } : p)),
        })),

      addMaintenance: (block) =>
        set((state) => ({ maintenance: [...state.maintenance, { ...block, id: uuidv4() }] })),

      removeMaintenance: (id) =>
        set((state) => ({ maintenance: state.maintenance.filter((b) => b.id !== id) })),

      materializeRent: (until = today()) => {
        const { tenancies, payments } = get();
        const created = tenancies
          .filter((t) => t.status !== 'reserved')
          .flatMap((tenancy) => missingRentPayments(tenancy, payments, until));

        if (created.length === 0) return 0;
        set((state) => ({
          payments: [...state.payments, ...created.map((p) => ({ ...p, id: uuidv4() }))],
        }));
        return created.length;
      },
    }),
    {
      name: 'renovapp-tenancy',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
