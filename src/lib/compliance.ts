import type {
  ComplianceCheck,
  ComplianceSettings,
  PermitDefinition,
  PermitItem,
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
    name: "Building Permit & Certificate of Occupancy",
    authority: 'Office of the Building Official',
    renewal: 'once',
    order: 3,
    why: "Un changement d'usage vers l'hébergement collectif exige souvent une mise à jour du certificat.",
    blocking: true,
  },
  {
    key: 'fsic',
    name: 'Fire Safety Inspection Certificate (FSIC)',
    authority: 'Bureau of Fire Protection',
    renewal: 'annual',
    order: 4,
    costLow: 1000,
    why: 'Exigé par le Fire Code (RA 9514). Son absence peut fermer l’exploitation.',
    blocking: true,
  },
  {
    key: 'sanitary',
    name: 'Sanitary Permit',
    authority: 'City Health Office',
    renewal: 'annual',
    order: 5,
    costLow: 500,
    costHigh: 2000,
    why: 'Code sanitaire (PD 856) : sanitaires, eau, évacuation.',
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

  // ── Floor area per occupant (National Building Code, PD 1096) ──
  const area = usableArea(rooms, settings.areaBasis);
  if (rooms.length === 0 || occupants === 0) {
    checks.push({
      key: 'area',
      label: 'Surface par occupant',
      severity: 'unknown',
      value: '—',
      requirement: '6 à 8 m² par occupant',
      detail: "Dessinez les pièces et indiquez le nombre d'occupants pour obtenir le calcul.",
    });
  } else {
    const perOccupant = area / occupants;
    const severity = perOccupant >= 8 ? 'ok' : perOccupant >= 6 ? 'warning' : 'blocking';
    const maxOccupants = Math.floor(area / 6);
    const maxComfortable = Math.floor(area / 8);
    checks.push({
      key: 'area',
      label: 'Surface par occupant',
      severity,
      value: `${perOccupant.toFixed(1)} m²`,
      requirement: '6 à 8 m² par occupant',
      detail:
        `${area.toFixed(1)} m² pour ${occupants} occupants. ` +
        `Au seuil bas de 6 m² : ${maxOccupants} occupant${maxOccupants > 1 ? 's' : ''} maximum. ` +
        `Au seuil haut de 8 m² : ${maxComfortable}. ` +
        (severity === 'ok'
          ? 'Vous êtes dans la fourchette confortable.'
          : severity === 'warning'
            ? "Vous tenez au seuil bas seulement : la décision dépendra de l'interprétation locale, notamment de la prise en compte des communs. À confirmer auprès de l'Office of the Building Official avant d'acheter le mobilier."
            : "En dessous du seuil bas. Réduisez la capacité ou augmentez la surface louée avant d'engager quoi que ce soit."),
    });
  }

  // ── Sanitary facilities ──
  const toilets = countRooms(rooms, 'bathroom');
  if (toilets === 0 || occupants === 0) {
    checks.push({
      key: 'sanitary',
      label: 'Sanitaires',
      severity: 'unknown',
      value: '—',
      requirement: 'Installations suffisantes (PD 856)',
      detail: 'Ajoutez les salles de bain au plan pour obtenir le ratio.',
    });
  } else {
    const perToilet = occupants / toilets;
    checks.push({
      key: 'sanitary',
      label: 'Sanitaires',
      severity: perToilet <= 8 ? 'ok' : perToilet <= 10 ? 'warning' : 'blocking',
      value: `1 pour ${perToilet.toFixed(1)}`,
      requirement: 'Ordre de grandeur : 1 pour 8 occupants',
      detail: `${toilets} sanitaire${toilets > 1 ? 's' : ''} pour ${occupants} occupants. Le Code sanitaire impose des installations « adéquates » sans chiffre unique ; le ratio local fait foi.`,
    });
  }

  // ── Rent Control Act (RA 9653) ──
  const rent = settings.monthlyRentPerBed;
  if (rent <= 0) {
    checks.push({
      key: 'rentControl',
      label: 'Contrôle des loyers',
      severity: 'unknown',
      value: '—',
      requirement: 'Seuil hors Metro Manila : 5 000 ₱',
      detail: 'Indiquez le loyer par lit.',
    });
  } else {
    const covered = rent <= 5000;
    checks.push({
      key: 'rentControl',
      label: 'Contrôle des loyers',
      severity: covered ? 'warning' : 'ok',
      value: `${rent.toLocaleString('fr-FR')} ₱`,
      requirement: 'Seuil hors Metro Manila : 5 000 ₱',
      detail: covered
        ? "À 5 000 ₱ ou moins, la location est couverte par le Rent Control Act (RA 9653) : hausse annuelle plafonnée et motifs d'expulsion encadrés. Au-dessus du seuil, ces limites ne s'appliquent plus. Plafond et prorogation à confirmer auprès du DHSUD."
        : "Au-dessus du seuil : le plafond d'augmentation du RA 9653 ne s'applique pas. Vérifiez tout de même la prorogation en cours auprès du DHSUD.",
    });
  }

  // ── Citizenship of the operator ──
  if (settings.citizenshipStatus === 'foreign') {
    checks.push({
      key: 'citizenship',
      label: 'Statut de l’exploitant',
      severity: 'blocking',
      value: 'Étranger',
      requirement: 'Terrain interdit aux étrangers · capital minimum pour une société à capitaux étrangers',
      detail:
        "Tant que la citoyenneté n'est pas reconnue, n'ouvrez ni le business permit ni l'enregistrement BIR à votre nom : faites-les porter par un résident philippin. Les montages de prête-nom sont expressément interdits.",
    });
  } else if (settings.citizenshipStatus === 'recognition_pending') {
    checks.push({
      key: 'citizenship',
      label: 'Statut de l’exploitant',
      severity: 'warning',
      value: 'Reconnaissance en cours',
      requirement: 'Attendre le document officiel avant d’enregistrer à votre nom',
      detail:
        "Un enfant né d'une mère philippine est philippin par filiation, mais le droit ne s'exerce qu'une fois la reconnaissance obtenue (Bureau of Immigration ou consulat). D'ici là, faites porter les démarches par un tiers philippin — et non par vous.",
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
        : `Vous vous apprêtez à investir${amount > 0 ? ` ${Math.round(amount).toLocaleString('fr-FR')} ₱` : ''} dans un bien qui ne vous appartient pas${familyTitle ? ', même s\'il est familial' : ''}. Sans écrit, une vente, une succession ou un simple désaccord vous fait tout perdre. C'est le même risque qu'un bail non sécurisé : le mobilier reste, vous non. À régler avant le premier peso engagé.`,
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
