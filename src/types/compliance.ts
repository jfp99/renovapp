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
  /** Only required when the space is let as a boarding house, not as a dwelling. */
  boardingHouseOnly?: boolean;
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

/**
 * How the space is actually let. This is the single most consequential choice
 * in the whole project, and it is a legal classification, not a marketing one:
 *
 *  · 'boarding_house' — separate sleeping rooms or bedspaces let individually.
 *    Matches the Fire Code definition of a Lodging or Rooming House and PD 1096
 *    Group B, which triggers a change of occupancy, an annual FSIC and a
 *    sanitary permit under PD 856 ch. XIV — and puts the Building Official in a
 *    position to apply the §807 air-space rule room by room.
 *  · 'whole_unit'     — the dwelling let as one unit to one set of tenants.
 *    Stays in Group A. The lessor still needs a barangay clearance, a mayor's
 *    permit and BIR registration; the boarding-house layer does not apply.
 *
 * The paperwork does not decide this. The activity does.
 */
export type RentalModel = 'boarding_house' | 'whole_unit';

export interface ComplianceSettings {
  /** Occupants planned, used by the area-per-occupant check. */
  plannedOccupants: number;
  /** Bedspaces vs the whole dwelling — drives most of the other rules. */
  rentalModel: RentalModel;
  /**
   * Highly Urbanized City. Bacolod has been one since 1984, which puts it in
   * the 10 000 ₱ rent-control bracket, not the 5 000 ₱ one that applies to
   * "all other areas". Getting this wrong understates the ceiling by half.
   */
  highlyUrbanizedCity: boolean;
  /** Total monthly rent when the whole unit is let under one contract. */
  monthlyRentWholeUnit: number;
  /** Count common areas in the area check, or bedrooms only. */
  areaBasis: 'bedrooms' | 'all';
  /** Clear ceiling height in metres — drives the air-space rule. */
  ceilingHeight: number;
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

/** Statutory thresholds, kept in one place so no check invents its own. */
export const LEGAL_THRESHOLDS = {
  /** RA 9653 §5 — NCR and highly urbanized cities. */
  RENT_CONTROL_HUC_PHP: 10_000,
  /** RA 9653 §5 — all other areas. */
  RENT_CONTROL_OTHER_PHP: 5_000,
  /** NIRC §109(Q) as amended by TRAIN — per residential unit, per month. */
  VAT_EXEMPT_RENT_PHP: 15_000,
  /** VAT registration threshold on annual gross. */
  VAT_REGISTRATION_PHP: 3_000_000,
  /** NIRC §116 percentage tax, back to 3 % since 1 July 2023. */
  PERCENTAGE_TAX_RATE: 0.03,
  /** Fire Code RIRR — above this a lodging house becomes a dormitory. */
  LODGING_HOUSE_MAX_PERSONS: 15,
} as const;
