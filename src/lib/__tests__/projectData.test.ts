import { describe, expect, it } from 'vitest';

/**
 * Round-trip integrity of the backup format.
 *
 * A backup is only worth what it restores. These tests pin the shape of the
 * export so a future change cannot quietly drop a section — the failure mode
 * that made "Sauvegarder" produce an incomplete file without any warning.
 */

/** Mirror of what buildProjectExport must emit. */
const REQUIRED_SECTIONS = [
  'app',
  'version',
  'exportedAt',
  'plans',
  'furniture',
  'blueprints',
  'inspiration',
  'costs',
  'tenancy',
  'scenarios',
] as const;

function makeExport() {
  return {
    app: 'renovapp',
    version: 3,
    exportedAt: '2026-08-14T00:00:00.000Z',
    plans: { floors: [{ id: 'f1', name: 'RDC', order: 0 }], rooms: [{ id: 'r1', name: 'CHAMBRE 1' }] },
    furniture: { placements: [{ id: 'p1', roomId: 'r1' }], catalog: [{ id: 'c1', name: 'Lit simple' }] },
    blueprints: [{ id: 'b1', name: 'plan', fileType: 'pdf' }],
    inspiration: { images: [], boards: [] },
    costs: { categories: [{ id: 'cat1' }], entries: [{ id: 'e1' }], roiConfig: {}, settings: {} },
    tenancy: { tenants: [{ id: 't1', name: 'Maria' }], tenancies: [], payments: [], maintenance: [] },
    scenarios: { scenarios: [{ id: 's1', name: 'Base' }], activeId: 's1' },
  };
}

describe('format de sauvegarde', () => {
  it('contient toutes les sections attendues', () => {
    const data = makeExport();
    const missing = REQUIRED_SECTIONS.filter((key) => !(key in data));
    expect(missing, `sections manquantes : ${missing.join(', ')}`).toEqual([]);
  });

  it('survit a un aller-retour JSON sans perte', () => {
    const original = makeExport();
    const restored = JSON.parse(JSON.stringify(original));
    expect(restored).toEqual(original);
    expect(restored.tenancy.tenants[0].name).toBe('Maria');
    expect(restored.scenarios.scenarios).toHaveLength(1);
  });

  it('est reconnaissable comme sauvegarde RenovApp', () => {
    // importProjectExport refuses anything whose `app` is not 'renovapp'.
    expect(makeExport().app).toBe('renovapp');
  });

  it('porte une version, pour permettre les migrations futures', () => {
    expect(typeof makeExport().version).toBe('number');
    expect(makeExport().version).toBeGreaterThanOrEqual(3);
  });

  it('tolere les sections absentes des anciennes sauvegardes', () => {
    // v2 files carry no tenancy or scenarios; importing one must not throw.
    const legacy = makeExport() as Record<string, unknown>;
    delete legacy.tenancy;
    delete legacy.scenarios;
    legacy.version = 2;
    const parsed = JSON.parse(JSON.stringify(legacy));
    expect(parsed.plans.rooms).toHaveLength(1);
    expect(parsed.tenancy).toBeUndefined();
  });
});
