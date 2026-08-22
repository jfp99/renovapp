import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { safeStorage } from '@/lib/safeStorage';
import { deleteMedia } from '@/lib/mediaDb';
import { PERMIT_CATALOG } from '@/lib/compliance';
import type { ComplianceSettings, PermitItem, PermitStatus } from '@/types/compliance';

interface ComplianceState {
  permits: PermitItem[];
  settings: ComplianceSettings;
  setStatus: (key: string, status: PermitStatus) => void;
  updatePermit: (key: string, updates: Partial<PermitItem>) => void;
  updateSettings: (updates: Partial<ComplianceSettings>) => void;
  reset: () => void;
}

const defaultSettings: ComplianceSettings = {
  plannedOccupants: 0,
  // Bail unique par défaut : c'est le modèle qui évite la couche boarding house.
  rentalModel: 'whole_unit',
  // Bacolod est ville hautement urbanisée depuis 1984 → tranche 10 000 ₱.
  highlyUrbanizedCity: true,
  monthlyRentWholeUnit: 0,
  areaBasis: 'bedrooms',
  ceilingHeight: 2.7,
  monthlyRentPerBed: 0,
  citizenshipStatus: 'foreign',
  propertyTitle: 'own',
  writtenAgreement: false,
  investedAmount: 0,
  womenOnly: false,
};

/** One tracked item per catalogue entry, created up front so nothing is missed. */
function seedPermits(): PermitItem[] {
  return PERMIT_CATALOG.map((def) => ({
    id: uuidv4(),
    key: def.key,
    status: 'not_started' as PermitStatus,
  }));
}

export const useComplianceStore = create<ComplianceState>()(
  persist(
    (set, get) => ({
      permits: seedPermits(),
      settings: defaultSettings,

      setStatus: (key, status) =>
        set((state) => ({
          permits: state.permits.map((p) => (p.key === key ? { ...p, status } : p)),
        })),

      updatePermit: (key, updates) =>
        set((state) => ({
          permits: state.permits.map((p) => (p.key === key ? { ...p, ...updates } : p)),
        })),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      reset: () => {
        get().permits.forEach((p) => {
          if (p.fileId) void deleteMedia(p.fileId);
        });
        set({ permits: seedPermits(), settings: defaultSettings });
      },
    }),
    {
      name: 'renovapp-compliance',
      storage: createJSONStorage(() => safeStorage),
      // A permit added to the catalogue later must appear for existing users.
      merge: (persisted, current) => {
        const saved = persisted as Partial<ComplianceState> | undefined;
        const permits = saved?.permits ?? [];
        const missing = PERMIT_CATALOG.filter((def) => !permits.some((p) => p.key === def.key)).map(
          (def) => ({ id: uuidv4(), key: def.key, status: 'not_started' as PermitStatus })
        );
        return {
          ...current,
          ...saved,
          permits: [...permits, ...missing],
          settings: { ...defaultSettings, ...(saved?.settings ?? {}) },
        } as ComplianceState;
      },
    }
  )
);
