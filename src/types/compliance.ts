export type PermitStatus = 'not_started' | 'in_progress' | 'obtained' | 'expired';

export type PermitRenewal = 'once' | 'annual' | 'ongoing';

/** A permit or clearance the operation needs, as tracked by the user. */
export interface PermitItem {
  id: string;
  /** Links back to the reference catalogue entry. */
  key: string;
  status: PermitStatus;
  obtainedDate?: string;
  expiryDate?: string;
  cost?: number;
  reference?: string;
  notes?: string;
  /** IndexedDB media id for a scan of the document. */
  fileId?: string;
}

/** Reference data: what the permit is, who issues it, why it matters. */
export interface PermitDefinition {
  key: string;
  name: string;
  authority: string;
  renewal: PermitRenewal;
  /** Order in which they are normally obtained. */
  order: number;
  /** Indicative cost range in PHP, for budgeting only. */
  costLow?: number;
  costHigh?: number;
  why: string;
  blocking?: boolean;
}

export type CheckSeverity = 'ok' | 'warning' | 'blocking' | 'unknown';

/** A rule checked against the project's own data, not a to-do item. */
export interface ComplianceCheck {
  key: string;
  label: string;
  severity: CheckSeverity;
  value: string;
  requirement: string;
  detail: string;
}

/** Where the operator stands on Philippine citizenship. */
export type CitizenshipStatus = 'foreign' | 'recognition_pending' | 'citizen';

/** On what basis the building is occupied. */
export type PropertyTitle = 'own' | 'family' | 'lease';

export interface ComplianceSettings {
  /** Occupants planned, used by the area-per-occupant check. */
  plannedOccupants: number;
  /** Count common areas in the area check, or bedrooms only. */
  areaBasis: 'bedrooms' | 'all';
  /** Rent charged per bed, for the rent-control check. */
  monthlyRentPerBed: number;
  citizenshipStatus: CitizenshipStatus;
  propertyTitle: PropertyTitle;
  /** Is the right to occupy and to invest written down? */
  writtenAgreement: boolean;
  /** Amount invested in a building the operator does not own. */
  investedAmount: number;
  /** Women-only reduces gender-mix constraints. */
  womenOnly: boolean;
}
