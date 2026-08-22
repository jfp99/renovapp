import {
  LEGAL_THRESHOLDS,
  type ComplianceCheck,
  type ComplianceSettings,
  type PermitDefinition,
  type PermitItem,
} from '@/types/compliance';
import type { Room } from '@/types/plan';

/**
 * Reference list for a boarding house / bed space operation in the Philippines.
 * Costs are indicative ranges for budgeting, not quotes — every LGU differs.
 * Sources are listed in docs/CONFORMITE.md.
 */
export const PERMIT_CATALOG: PermitDefinition[] = [
  {
    key: 'barangay',
    name: 'Barangay Business Clearance',
    authority: 'Barangay Hall',
    renewal: 'annual',
    order: 1,
    costLow: 300,
    costHigh: 1000,
    why: "Première étape : sans elle, le dossier au BPLO n'est pas recevable.",
  },
  {
    key: 'zoning',
    name: 'Locational / Zoning Clearance',
    authority: 'City Planning & Development Office',
    renewal: 'once',
    order: 2,
    costLow: 1500,
    costHigh: 5000,
    why: "Vérifie que l'activité est autorisée à cette adresse. À faire AVANT d'engager les travaux.",
    blocking: true,
  },
  {
    key: 'occupancy',
    name: 'Certificat de changement d’occupancy',
    authority: 'Office of the Building Official',
    renewal: 'once',
    order: 3,
    why:
      "Passer du Groupe A (habitation) au Groupe B (boarding ou lodging house) est un changement vers une catégorie PLUS dangereuse : l'art. 702 impose la mise en conformité complète Groupe B au préalable. C'est à ce moment que l'OBO applique l'art. 807 chambre par chambre.",
    blocking: true,
    boardingHouseOnly: true,
  },
  {
    key: 'fsic',
    name: 'Fire Safety Inspection Certificate (FSIC)',
    authority: 'Bureau of Fire Protection',
    renewal: 'annual',
    order: 4,
    costLow: 1000,
    why:
      "Exigé avant le permis d'occupation ET avant le permis d'exploitation, puis renouvelé chaque année (RA 9514). Son absence ferme l'exploitation.",
    blocking: true,
    boardingHouseOnly: true,
  },
  {
    key: 'sanitary',
    name: 'Sanitary Permit',
    authority: 'City Health Office',
    renewal: 'annual',
    order: 5,
    costLow: 500,
    costHigh: 2000,
    why:
      "PD 856 chapitre XIV (hôtels, pensions, lodging et boarding houses) : « aucun établissement couvert ne peut être exploité sans sanitary permit ». Impose aussi un ratio de sanitaires par chambre louée.",
    boardingHouseOnly: true,
  },
  {
    key: 'mayor',
    name: "Mayor's / Business Permit",
    authority: 'Business Permit & Licensing Office',
    renewal: 'annual',
    order: 6,
    why: 'Le permis d’exploitation lui-même. À renouveler en janvier chaque année.',
    blocking: true,
  },
  {
    key: 'bir',
    name: 'Enregistrement BIR',
    authority: 'Bureau of Internal Revenue',
    renewal: 'ongoing',
    order: 7,
    why: 'Registre, reçus officiels et régime fiscal. Requis pour le Mayor’s Permit.',
    blocking: true,
  },
  {
    key: 'staff',
    name: 'SSS / PhilHealth / Pag-IBIG',
    authority: 'Agences respectives',
    renewal: 'ongoing',
    order: 8,
    why: 'Obligatoire dès le premier employé déclaré (caretaker, ménage).',
  },
];

const M2 = (room: Room) => (room.width / 100) * (room.height / 100);

/**
 * PD 1096 — the National Building Code — sets two distinct rules that are
 * routinely confused:
 *
 *  · Section 806: a room for human habitation must be at least 6.00 m² with a
 *    least dimension of 2.00 m. That is a rule about the ROOM, not the people.
 *  · Section 807: habitations require 14.00 m³ of AIR SPACE PER PERSON.
 *
 * The binding occupancy rule is therefore volumetric, which makes ceiling
 * height decisive: at 2.70 m of clear height, 14 m³ works out to 5.19 m² per
 * person; at 3.50 m, only 4.00 m². Popular articles quoting "6 to 8 m² per
 * occupant" are a rule of thumb, not the text.
 */
export const AIR_SPACE_PER_PERSON_M3 = 14;
export const MIN_HABITABLE_ROOM_M2 = 6;
export const MIN_HABITABLE_LEAST_DIMENSION_M = 2;

/** People allowed in a volume, per Section 807. */
export function occupantsAllowed(areaM2: number, ceilingHeight: number): number {
  if (areaM2 <= 0 || ceilingHeight <= 0) return 0;
  return Math.floor((areaM2 * ceilingHeight) / AIR_SPACE_PER_PERSON_M3);
}

/** Bedrooms only, or every room on the plan. */
export function usableArea(rooms: Room[], basis: 'bedrooms' | 'all'): number {
  const kept = basis === 'bedrooms' ? rooms.filter((r) => r.type === 'bedroom') : rooms;
  return kept.reduce((sum, room) => sum + M2(room), 0);
}

export function countRooms(rooms: Room[], type: Room['type']): number {
  return rooms.filter((r) => r.type === type).length;
}

/**
 * Rules checked against the project's own plan and settings.
 *
 * These are the constraints that decide whether the business is legal at all —
 * far more consequential than any ROI assumption, and invisible until someone
 * measures them.
 */
export function runChecks(
  rooms: Room[],
  settings: ComplianceSettings
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const occupants = Math.max(0, settings.plannedOccupants);

  // ── Air space per person (PD 1096, Section 807) ──
  const area = usableArea(rooms, settings.areaBasis);
  const height = settings.ceilingHeight;
  const bedrooms = rooms.filter((r) => r.type === 'bedroom');

  if (rooms.length === 0 || occupants === 0 || height <= 0) {
    checks.push({
      key: 'area',
      label: 'Volume d’air par occupant',
      severity: 'unknown',
      value: '—',
      requirement: '14 m³ par personne (PD 1096, art. 807)',
      detail:
        "Dessinez les pièces, indiquez la hauteur sous plafond et le nombre d'occupants pour obtenir le calcul.",
    });
  } else {
    /**
     * The rule is applied PER HABITABLE ROOM, not to the floor as a whole.
     * Two things settle it: §807 is captioned "in determining the size of
     * ROOMS" and its entry reads "habitable rooms"; and the IRR of PD 856
     * ch. XIV §6.2.2 independently states the same 14 m³ per person for
     * dormitory SLEEPING ROOMS. Summing the whole floor — kitchen, baths and
     * circulation included — is the mistake that makes a plan look compliant
     * right up until the Building Official opens it.
     */
    const perRoom = bedrooms.map((r) => ({
      room: r,
      m2: M2(r),
      allowed: occupantsAllowed(M2(r), height),
    }));
    const roomCapacity = perRoom.reduce((sum, r) => sum + r.allowed, 0);
    const floorCapacity = occupantsAllowed(area, height);

    checks.push({
      key: 'area',
      label: 'Volume d’air par occupant',
      severity:
        roomCapacity >= occupants ? 'ok' : roomCapacity >= occupants * 0.85 ? 'warning' : 'blocking',
      value: `${roomCapacity} couchage${roomCapacity > 1 ? 's' : ''} pour ${occupants} prévu${occupants > 1 ? 's' : ''}`,
      requirement: '14 m³ par personne, chambre par chambre (PD 1096, art. 807)',
      detail:
        (perRoom.length
          ? perRoom
              .map((r) => `${r.room.name} : ${r.m2.toFixed(1)} m² × ${height.toFixed(2)} m = ${r.allowed} pers.`)
              .join(' · ')
          : 'Aucune chambre au plan.') +
        ` — soit ${roomCapacity} au total. ` +
        `À ${height.toFixed(2)} m de plafond il faut ${(AIR_SPACE_PER_PERSON_M3 / height).toFixed(2)} m² par personne. ` +
        (roomCapacity >= occupants
          ? 'Conforme.'
          : "Insuffisant. Le calcul se fait par pièce : agrandir ou fusionner des chambres est le seul levier, pas ajouter des lits."),
    });

    // Section 806 : taille minimale, et elle vaut aussi pour les pièces de service.
    const undersized = rooms
      .filter((r) => ['bedroom', 'bathroom', 'kitchen'].includes(r.type))
      .map((r) => {
        const m2 = M2(r);
        const least = Math.min(r.width, r.height) / 100;
        const min =
          r.type === 'bathroom'
            ? { m2: 1.2, least: 0.9, label: '1,20 m² / 0,90 m' }
            : r.type === 'kitchen'
              ? { m2: 3, least: 1.5, label: '3,00 m² / 1,50 m' }
              : { m2: MIN_HABITABLE_ROOM_M2, least: MIN_HABITABLE_LEAST_DIMENSION_M, label: '6,00 m² / 2,00 m' };
        return { room: r, m2, least, min, fails: m2 < min.m2 || least < min.least };
      })
      .filter((r) => r.fails);

    checks.push({
      key: 'roomSize',
      label: 'Dimensions minimales des pièces',
      severity: undersized.length === 0 ? 'ok' : 'warning',
      value: undersized.length === 0 ? 'Conformes' : `${undersized.length} non conforme${undersized.length > 1 ? 's' : ''}`,
      requirement: 'Art. 806 — chambres 6 m² / 2 m · bains 1,20 m² / 0,90 m · cuisine 3 m² / 1,50 m',
      detail:
        undersized.length === 0
          ? 'Chaque pièce atteint la surface et la plus petite dimension exigées.'
          : undersized
              .map(
                (r) =>
                  `${r.room.name} : ${r.m2.toFixed(2)} m², plus petite dimension ${r.least.toFixed(2)} m (exigé ${r.min.label})`
              )
              .join(' · ') +
            ". Une pièce existante non conforme n'est pas illégale en soi, mais elle ressort dès qu'un permis de travaux ou un changement d'occupancy est déposé.",
    });

    // Les deux lectures diffèrent beaucoup, et le texte ne tranche pas seul.
    if (bedrooms.length > 0 && area > usableArea(rooms, 'bedrooms')) {
      checks.push({
        key: 'areaBasis',
        label: 'Base de calcul retenue',
        severity: 'warning',
        value: settings.areaBasis === 'all' ? 'Toutes les pièces' : 'Chambres seules',
        requirement: 'Lecture par pièce — à faire confirmer par écrit',
        detail:
          `Par chambre : ${roomCapacity} occupants. Sur le plateau entier : ${floorCapacity}. ` +
          "La lecture par pièce est celle que retient l'OBO en pratique et celle que confirme l'IRR du PD 856. Le plateau entier ne se défend que si le logement est loué comme une seule unité d'habitation, auquel cas ce n'est plus vous qui déclarez une capacité.",
      });
    }
  }

  // ── Sanitary facilities (PD 856, ch. XIV) ──
  const toilets = countRooms(rooms, 'bathroom');
  const lettableRooms = countRooms(rooms, 'bedroom');
  if (toilets === 0 || occupants === 0) {
    checks.push({
      key: 'sanitary',
      label: 'Sanitaires',
      severity: 'unknown',
      value: '—',
      requirement: 'PD 856 ch. XIV',
      detail: 'Ajoutez les salles de bain au plan pour obtenir le ratio.',
    });
  } else if (settings.rentalModel === 'boarding_house') {
    /**
     * IRR of PD 856 ch. XIV §5.4.1(g): for common bathrooms, FEMALE occupants
     * require 1 water closet + 1 lavatory + 1 shower per 3 lettable rooms —
     * a stricter ratio than the male one (per 5). Only applies to a covered
     * establishment, i.e. when the space is let as a boarding house.
     */
    const perRooms = settings.womenOnly ? 3 : 5;
    const required = Math.ceil(lettableRooms / perRooms);
    checks.push({
      key: 'sanitary',
      label: 'Sanitaires',
      severity: toilets >= required ? 'ok' : 'blocking',
      value: `${toilets} pour ${lettableRooms} chambre${lettableRooms > 1 ? 's' : ''}`,
      requirement: `1 WC + 1 lavabo + 1 douche pour ${perRooms} chambres louées`,
      detail:
        `${required} ensemble${required > 1 ? 's' : ''} exigé${required > 1 ? 's' : ''}, ${toilets} au plan. ` +
        (settings.womenOnly
          ? 'Le ratio féminin (1 pour 3) est plus strict que le masculin (1 pour 5).'
          : 'Ratio masculin retenu : 1 pour 5 chambres.') +
        ` Attention : une pièce comptée ici doit aussi passer l'art. 806 (1,20 m², 0,90 m de côté) — un WC trop étroit ne compte pas.`,
    });
  } else {
    const perToilet = occupants / toilets;
    checks.push({
      key: 'sanitary',
      label: 'Sanitaires',
      severity: perToilet <= 4 ? 'ok' : perToilet <= 5 ? 'warning' : 'warning',
      value: `1 pour ${perToilet.toFixed(1)}`,
      requirement: 'Confort, pas obligation',
      detail:
        `${toilets} sanitaire${toilets > 1 ? 's' : ''} pour ${occupants} occupants. En location d'un logement entier, le ratio du PD 856 ch. XIV ne s'applique pas — mais au-delà de 4 personnes par salle d'eau, la file du matin devient le premier motif de départ.`,
    });
  }

  // ── Rent Control Act (RA 9653) ──
  const threshold = settings.highlyUrbanizedCity
    ? LEGAL_THRESHOLDS.RENT_CONTROL_HUC_PHP
    : LEGAL_THRESHOLDS.RENT_CONTROL_OTHER_PHP;
  /**
   * §3 defines a "residential unit" to include "dormitories, rooms and
   * bedspaces offered for rent", and §5 tests the total monthly rent OF EACH
   * unit — so the figure compared to the ceiling is the per-bed rent under a
   * boarding-house model, but the whole rent under a single lease.
   */
  const testedRent =
    settings.rentalModel === 'whole_unit'
      ? settings.monthlyRentWholeUnit
      : settings.monthlyRentPerBed;
  const unitLabel = settings.rentalModel === 'whole_unit' ? 'le logement entier' : 'par lit';

  if (testedRent <= 0) {
    checks.push({
      key: 'rentControl',
      label: 'Contrôle des loyers',
      severity: 'unknown',
      value: '—',
      requirement: `Seuil : ${threshold.toLocaleString('fr-FR')} ₱ par unité`,
      detail: `Indiquez le loyer ${unitLabel}.`,
    });
  } else {
    const covered = testedRent <= threshold;
    checks.push({
      key: 'rentControl',
      label: 'Contrôle des loyers',
      severity: covered ? 'warning' : 'ok',
      value: `${testedRent.toLocaleString('fr-FR')} ₱ ${unitLabel}`,
      requirement: `Seuil ${settings.highlyUrbanizedCity ? 'NCR et villes hautement urbanisées' : 'autres zones'} : ${threshold.toLocaleString('fr-FR')} ₱`,
      detail: covered
        ? "Couvert par le RA 9653 : hausse annuelle plafonnée (1 % en 2026, fixé chaque année par le NHSB), une seule hausse par an pour les logements étudiants, maximum 1 mois d'avance et 2 mois de caution — la caution devant être déposée en banque au nom du bailleur. Expulsion judiciaire seulement, sur 5 motifs limitatifs. Amende de 25 000 à 50 000 ₱ ou 1 à 6 mois de prison en cas de violation. Le plafond ne joue que tant que la même locataire occupe : à chaque nouvelle entrante, vous refixez librement."
        : "Au-dessus du seuil : ni plafond de hausse, ni limite d'avance ou de caution imposée par le RA 9653. Le Code civil et le contrat font foi. Prorogation en cours à confirmer auprès du DHSUD — l'autorisation actuelle court jusqu'au 31 décembre 2026.",
    });
  }

  // ── Classification de l'activité ──
  {
    const boarding = settings.rentalModel === 'boarding_house';
    checks.push({
      key: 'rentalModel',
      label: 'Nature de l’activité',
      severity: boarding ? 'warning' : 'ok',
      value: boarding ? 'Boarding house' : 'Location d’un logement',
      requirement: 'La classification suit l’activité réelle, pas le contrat',
      detail: boarding
        ? "Louer des chambres séparément correspond à la définition du Lodging or Rooming House au Fire Code, et au Groupe B du PD 1096. Conséquences : changement d'occupancy (art. 702, catégorie plus dangereuse donc mise en conformité préalable), FSIC annuel, sanitary permit PD 856 ch. XIV — et c'est à ce moment que l'art. 807 est appliqué chambre par chambre."
        : "Un contrat unique sur le logement entier reste en Groupe A : pas de changement d'occupancy, pas de FSIC boarding house, pas de sanitary permit ch. XIV. Restent dus dans tous les cas : barangay clearance, mayor's permit « lessor of real property » et enregistrement BIR. Cela ne tient que si vous vous comportez en bailleur : pas d'attribution de lits, pas de contrat par tête, pas de remplacement d'une partante par vos soins.",
    });

    if (boarding && occupants > 0) {
      const max = LEGAL_THRESHOLDS.LODGING_HOUSE_MAX_PERSONS;
      checks.push({
        key: 'fireClass',
        label: 'Classification incendie',
        severity: occupants <= max ? 'ok' : 'warning',
        value: occupants <= max ? 'Lodging / Rooming House' : 'Dortoir',
        requirement: `Lodging house : ${max} personnes ou moins`,
        detail:
          occupants <= max
            ? `${occupants} occupants : vous restez dans la catégorie basse du Fire Code, nettement moins exigeante qu'un dortoir. Demandez malgré tout la liste de contrôle Division 12 au BFP de Bacolod — issues de secours, éclairage, extincteurs, détecteurs par chambre.`
            : `Au-delà de ${max} personnes vous basculez en dortoir : exigences d'évacuation et de compartimentage nettement plus lourdes.`,
      });
    }
  }

  // ── Fiscalité (NIRC / BIR) ──
  if (testedRent > 0) {
    const vatFree = testedRent <= LEGAL_THRESHOLDS.VAT_EXEMPT_RENT_PHP;
    const annual =
      settings.rentalModel === 'whole_unit'
        ? testedRent * 12
        : testedRent * Math.max(occupants, 1) * 12;
    const pct = Math.round(annual * LEGAL_THRESHOLDS.PERCENTAGE_TAX_RATE);
    checks.push({
      key: 'tax',
      label: 'TVA et percentage tax',
      severity: vatFree ? 'ok' : 'warning',
      value: vatFree ? 'Exonéré' : `${LEGAL_THRESHOLDS.PERCENTAGE_TAX_RATE * 100} % ≈ ${pct.toLocaleString('fr-FR')} ₱/an`,
      requirement: `Exonération jusqu’à ${LEGAL_THRESHOLDS.VAT_EXEMPT_RENT_PHP.toLocaleString('fr-FR')} ₱ par unité et par mois`,
      detail: vatFree
        ? "Sous le seuil de 15 000 ₱ par unité (NIRC art. 109(Q)), la location est exonérée de TVA ET de percentage tax, quel que soit le chiffre d'affaires annuel. Le RR 13-2018 précise que l'unité se compte « par personne » pour les dortoirs, pensions et bedspaces, et « par chambre » pour les chambres louées. L'impôt sur le revenu reste dû."
        : `Au-dessus de 15 000 ₱ par unité : percentage tax de 3 % (art. 116), soit environ ${pct.toLocaleString('fr-FR')} ₱ par an, avec déclaration trimestrielle 2551Q. La TVA à 12 % ne s'applique qu'au-delà de ${LEGAL_THRESHOLDS.VAT_REGISTRATION_PHP.toLocaleString('fr-FR')} ₱ de recettes annuelles.`,
    });
  }

  // ── Citizenship of the operator ──
  if (settings.citizenshipStatus === 'foreign') {
    checks.push({
      key: 'citizenship',
      label: 'Statut de l’exploitant',
      severity: 'blocking',
      value: 'Étranger',
      requirement: 'Capital de 200 000 USD pour une entreprise individuelle étrangère · terrain interdit',
      detail:
        "Un étranger ne peut pas simplement s'enregistrer au DTI : il lui faut un Certificate of Authority, et la Foreign Investments Act impose 200 000 USD de capital libéré pour une entreprise de marché domestique (réduction à 100 000 USD seulement en cas de haute technologie, de statut startup, ou de 15 employés philippins). La voie de l'entreprise individuelle étrangère est donc fermée. Faites porter DTI, BIR, mayor's permit et le bail par la propriétaire philippine, avec une Special Power of Attorney à votre profit. Exercer une activité lucrative en violation des conditions de séjour expose à l'expulsion (CA 613 art. 37(a)(7)).",
    });
  } else if (settings.citizenshipStatus === 'recognition_pending') {
    checks.push({
      key: 'citizenship',
      label: 'Statut de l’exploitant',
      severity: 'warning',
      value: 'Reconnaissance en cours',
      requirement: 'Attendre l’Identification Certificate avant d’enregistrer à votre nom',
      detail:
        "La reconnaissance est déclarative, pas constitutive : une fois obtenue, elle confirme que vous étiez philippin DEPUIS LA NAISSANCE. Mais elle ne produit aucun effet anticipé — tant que l'Identification Certificate n'est pas émis, vous êtes un étranger au regard du BI. Né après le 17 janvier 1973 d'une mère philippine, la procédure est purement probatoire ; né avant, une élection formelle de nationalité à la majorité (CA 625) était requise et la question doit être posée à un avocat philippin. D'ici là : tout au nom de la propriétaire philippine, et ne vous faites pas rémunérer.",
    });
  } else {
    checks.push({
      key: 'citizenship',
      label: 'Statut de l’exploitant',
      severity: 'ok',
      value: 'Citoyen philippin',
      requirement: 'Aucune restriction de propriété ni de capital',
      detail:
        'La reconnaissance lève les restrictions sur la propriété foncière et le capital minimum. Conservez le document : les administrations le redemanderont.',
    });
  }

  // ── Title to occupy, and money sunk into someone else's building ──
  if (settings.propertyTitle !== 'own') {
    const amount = settings.investedAmount;
    const familyTitle = settings.propertyTitle === 'family';
    checks.push({
      key: 'title',
      label: 'Titre d’occupation',
      severity: settings.writtenAgreement ? 'warning' : 'blocking',
      value: settings.writtenAgreement ? 'Accord écrit' : 'Rien d’écrit',
      requirement: 'Un écrit qui couvre la durée et l’investissement',
      detail: settings.writtenAgreement
        ? `Vérifiez que l'écrit couvre trois choses : la durée d'occupation, l'autorisation expresse de sous-louer, et le sort de votre investissement${amount > 0 ? ` de ${Math.round(amount).toLocaleString('fr-FR')} ₱` : ''} en cas de vente, de décès ou de succession.`
        : `Vous vous apprêtez à investir${amount > 0 ? ` ${Math.round(amount).toLocaleString('fr-FR')} ₱` : ''} dans un bien qui ne vous appartient pas${familyTitle ? ', même s\'il est familial' : ''}. Sans écrit, une vente, une succession ou un simple désaccord vous fait tout perdre. La succession philippine s'ouvre au profit de TOUS les héritiers réservataires : votre travail et la plus-value créée se diluent entre eux. Un étranger peut hériter d'un terrain — c'est l'exception constitutionnelle reconnue — mais le partage, lui, ne s'improvise pas. Une page notariée disant qui a mis quoi et qui reçoit quoi suffit. À régler avant le premier peso engagé.`,
    });
  }

  // ── Gender policy ──
  checks.push({
    key: 'gender',
    label: 'Politique d’accueil',
    severity: 'ok',
    value: settings.womenOnly ? 'Étudiantes uniquement' : 'Mixte',
    requirement: 'Cohérence entre chambres et public',
    detail: settings.womenOnly
      ? "Public unique : plus de lit bloqué faute du bon genre, l'occupation effective s'en trouve améliorée. Prévoyez de le mentionner explicitement dans le règlement intérieur."
      : "En mixte, prévoyez des chambres séparées : un lit libre côté filles ne se loue pas à un garçon, ce qui coûte quelques points d'occupation.",
  });

  return checks;
}

/** Permits that are overdue or expiring soon. */
export function expiringPermits(
  items: PermitItem[],
  withinDays = 60,
  today = new Date().toISOString().slice(0, 10)
): PermitItem[] {
  const limit = new Date(`${today}T00:00:00`);
  limit.setDate(limit.getDate() + withinDays);
  const limitIso = limit.toISOString().slice(0, 10);

  return items
    .filter((item) => item.expiryDate && item.expiryDate <= limitIso)
    .sort((a, b) => (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''));
}

export function permitDefinition(key: string): PermitDefinition | undefined {
  return PERMIT_CATALOG.find((p) => p.key === key);
}

/** Estimated budget for the permits still to obtain. */
export function remainingPermitCost(items: PermitItem[]): { low: number; high: number } {
  return PERMIT_CATALOG.reduce(
    (acc, def) => {
      const item = items.find((i) => i.key === def.key);
      if (item && item.status === 'obtained') return acc;
      return { low: acc.low + (def.costLow ?? 0), high: acc.high + (def.costHigh ?? def.costLow ?? 0) };
    },
    { low: 0, high: 0 }
  );
}
