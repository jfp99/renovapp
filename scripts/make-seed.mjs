/**
 * Bakes the current project into `public/seed.js` for the hosted read-only build.
 *
 * The hosted copy has no local server behind it, so `/__data` does not exist and
 * the browser it opens in starts completely empty. Without a seed the shared
 * link shows a pristine, empty app — which looks broken rather than read-only.
 *
 * The generated file writes straight to localStorage (not through safeStorage,
 * which is a no-op in read-only builds) and runs `beforeInteractive`, i.e.
 * before zustand rehydrates.
 *
 * Each seed carries a stamp. A browser holding an older stamp gets every store
 * overwritten, so a phone that opened the link weeks ago shows the latest
 * deploy instead of its first visit forever. Nothing is lost: the build is
 * read-only, there is no local edit to keep. Within one deploy the stamp is
 * stable, so a reader is never reset mid-visit.
 *
 * Usage: node scripts/make-seed.mjs [path/to/projet.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2] ?? join(ROOT, 'data', 'projet.json');
const target = join(ROOT, 'public', 'seed.js');

/** Persisted key → the version zustand expects. Only costStore declares one. */
const STORES = {
  plans: ['renovapp-plans', 0],
  furniture: ['renovapp-furniture', 0],
  blueprints: ['renovapp-blueprints', 0],
  inspiration: ['renovapp-inspiration', 0],
  costs: ['renovapp-costs', 3],
  tenancy: ['renovapp-tenancy', 0],
  scenarios: ['renovapp-scenarios', 0],
  compliance: ['renovapp-compliance', 0],
  worklog: ['renovapp-worklog', 0],
};

const project = JSON.parse(readFileSync(source, 'utf-8'));

const payload = {};
for (const [field, [key, version]] of Object.entries(STORES)) {
  let state = project[field];
  if (state === undefined || state === null) continue;
  // The export keeps blueprints as a bare array; the store persists
  // { blueprints: [...] }. Seeded as-is, the shared copy showed 0 blueprints.
  if (field === 'blueprints' && Array.isArray(state)) state = { blueprints: state };
  // Receipt photos and permit scans are inlined in the backup file since v5.
  // The phone keeps the seed in localStorage (≈5 Mo max): a few photos would
  // fill it and the whole copy would open empty. They stay on the PC.
  if (field === 'costs' && Array.isArray(state.entries)) {
    state = { ...state, entries: state.entries.map(({ receiptData, ...e }) => e) };
  }
  if (field === 'compliance' && Array.isArray(state.permits)) {
    state = { ...state, permits: state.permits.map(({ fileData, ...p }) => p) };
  }
  payload[key] = { state, version };
}

const counts = Object.entries(payload)
  .map(([k, v]) => `${k}=${JSON.stringify(v.state).length}o`)
  .join(' ');

const stamp = `${project.exportedAt ?? ''}|${new Date().toISOString()}`;

const js = `/* Généré par scripts/make-seed.mjs — ne pas éditer à la main.
   Source : ${source.replace(ROOT, '.')} · ${new Date().toISOString()}
   ${counts} */
(function () {
  var seed = ${JSON.stringify(payload)};
  var stamp = ${JSON.stringify(stamp)};
  var STAMP_KEY = 'renovapp-seed-stamp';
  try {
    // Nouveau déploiement => on remplace tout (copie en lecture seule, rien à perdre).
    // Même déploiement => on ne touche à rien : pas de remise à zéro en pleine visite.
    var fresh = localStorage.getItem(STAMP_KEY) !== stamp;
    for (var key in seed) {
      if (fresh || localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(seed[key]));
      }
    }
    localStorage.setItem(STAMP_KEY, stamp);
  } catch (e) {
    /* Navigation privée ou stockage refusé : l'app s'ouvrira vide, sans planter. */
    console.warn('[RenovApp] Amorçage impossible :', e);
  }
})();
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, js, 'utf-8');
console.log(
  `seed.js écrit (${(js.length / 1024).toFixed(1)} Ko) — ${Object.keys(payload).length} magasins`
);
