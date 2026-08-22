import { describe, it, expect } from 'vitest';
import { runChecks, occupantsAllowed, PERMIT_CATALOG } from '@/lib/compliance';
import { LEGAL_THRESHOLDS, type ComplianceSettings } from '@/types/compliance';
import type { Room } from '@/types/plan';

/** The real ground floor, recovered from the project's own plan. */
const room = (name: string, w: number, h: number, type: Room['type']): Room => ({
  id: name, floorId: 'f1', name, type, x: 0, y: 0, width: w, height: h,
  color: '#fff', doors: [], windows: [],
});

const PLAN: Room[] = [
  room('CHAMBRE 1', 320, 260, 'bedroom'),
  room('CHAMBRE 2', 330, 310, 'bedroom'),
  room('CUISINE', 450, 100, 'kitchen'),
  room('WC1', 150, 140, 'bathroom'),
  room('WC2', 60, 305, 'bathroom'),
  room('DINING ROOM', 400, 300, 'common'),
];

const base: ComplianceSettings = {
  plannedOccupants: 6,
  rentalModel: 'whole_unit',
  highlyUrbanizedCity: true,
  monthlyRentWholeUnit: 27_000,
  areaBasis: 'bedrooms',
  ceilingHeight: 2.7,
  monthlyRentPerBed: 4_500,
  citizenshipStatus: 'recognition_pending',
  propertyTitle: 'family',
  writtenAgreement: false,
  investedAmount: 260_420,
  womenOnly: true,
};

const find = (s: ComplianceSettings, key: string) =>
  runChecks(PLAN, s).find((c) => c.key === key);

describe('PD 1096 §807 — le volume se calcule par pièce', () => {
  it('additionne la capacité chambre par chambre, pas la surface totale', () => {
    // 8,32 m² × 2,70 = 22,5 m³ → 1 personne. 10,23 × 2,70 = 27,6 → 1 personne.
    expect(occupantsAllowed(8.32, 2.7)).toBe(1);
    expect(occupantsAllowed(10.23, 2.7)).toBe(1);

    const check = find(base, 'area')!;
    expect(check.severity).toBe('blocking');
    expect(check.value).toContain('2 couchages');
  });

  it('sommer le plateau entier donnerait une réponse bien plus permissive', () => {
    // C'est exactement l'erreur que le calcul par pièce évite : 43,8 m² de
    // plateau à 2,70 m autorisent 8 personnes, contre 2 chambre par chambre.
    const wholeFloor = occupantsAllowed(43.79, 2.7);
    expect(wholeFloor).toBeGreaterThanOrEqual(8);
  });

  it('un plafond plus haut change la capacité — d’où la mesure à prendre', () => {
    expect(occupantsAllowed(10.23, 2.7)).toBe(1);
    expect(occupantsAllowed(10.23, 3.0)).toBe(2);
  });
});

describe('PD 1096 §806 — les pièces de service comptent aussi', () => {
  it('signale WC2 (0,60 m de large) et la cuisine (1,00 m)', () => {
    const check = find(base, 'roomSize')!;
    expect(check.value).toContain('2');
    expect(check.detail).toContain('WC2');
    expect(check.detail).toContain('CUISINE');
  });
});

describe('RA 9653 — Bacolod est une ville hautement urbanisée', () => {
  it('applique le seuil de 10 000 ₱, pas celui de 5 000 ₱', () => {
    expect(LEGAL_THRESHOLDS.RENT_CONTROL_HUC_PHP).toBe(10_000);
    // 4 500 ₱ par lit : sous le seuil, donc couvert.
    const perBed = find({ ...base, rentalModel: 'boarding_house' }, 'rentControl')!;
    expect(perBed.severity).toBe('warning');
    // 27 000 ₱ pour le logement entier : au-dessus, donc hors contrôle.
    expect(find(base, 'rentControl')!.severity).toBe('ok');
  });

  it('teste le loyer de l’unité réellement louée, pas toujours le prix par tête', () => {
    expect(find(base, 'rentControl')!.value).toContain('27');
    expect(find({ ...base, rentalModel: 'boarding_house' }, 'rentControl')!.value).toContain('4');
  });
});

describe('Fiscalité — la falaise des 15 000 ₱ par unité', () => {
  it('exonère à 15 000 ₱ et bascule en percentage tax à 16 000 ₱', () => {
    expect(find({ ...base, monthlyRentWholeUnit: 15_000 }, 'tax')!.severity).toBe('ok');
    expect(find({ ...base, monthlyRentWholeUnit: 16_000 }, 'tax')!.severity).toBe('warning');
  });

  it('compte par personne en boarding house, donc reste exonéré', () => {
    const c = find({ ...base, rentalModel: 'boarding_house' }, 'tax')!;
    expect(c.severity).toBe('ok');
  });
});

describe('Nature de l’activité', () => {
  it('rend sans objet les permis propres au boarding house en location classique', () => {
    const onlyBoarding = PERMIT_CATALOG.filter((p) => p.boardingHouseOnly).map((p) => p.key);
    expect(onlyBoarding).toEqual(expect.arrayContaining(['occupancy', 'fsic', 'sanitary']));
  });

  it('signale le boarding house et valide le bail unique', () => {
    expect(find(base, 'rentalModel')!.severity).toBe('ok');
    expect(find({ ...base, rentalModel: 'boarding_house' }, 'rentalModel')!.severity).toBe('warning');
  });

  it('applique le ratio sanitaire féminin (1 pour 3) seulement en boarding house', () => {
    const bh = find({ ...base, rentalModel: 'boarding_house' }, 'sanitary')!;
    expect(bh.requirement).toContain('3 chambres');
    expect(find(base, 'sanitary')!.requirement).toContain('Confort');
  });
});

describe('Statut de l’exploitant', () => {
  it('bloque tant que la reconnaissance n’est pas obtenue', () => {
    expect(find(base, 'citizenship')!.severity).toBe('warning');
    expect(find({ ...base, citizenshipStatus: 'foreign' }, 'citizenship')!.severity).toBe('blocking');
    expect(find({ ...base, citizenshipStatus: 'citizen' }, 'citizenship')!.severity).toBe('ok');
  });

  it('bloque tant que rien n’est écrit avec la propriétaire', () => {
    expect(find(base, 'title')!.severity).toBe('blocking');
    expect(find({ ...base, writtenAgreement: true }, 'title')!.severity).toBe('warning');
  });
});
