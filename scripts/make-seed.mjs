/**
 * Bakes the current project into `public/seed.js` for the hosted read-only build.
 *
 * The hosted copy has no local server behind it, so `/__data` does not exist and
 * the browser it opens in starts completely empty. Without a seed the shared
 * link shows a pristine, empty app — which looks broken rather than read-only.
 *
 * The generated file writes straight to localStorage (not through safeStorage,
 * which is a no-op in read-only builds) and runs `beforeInteractive`, i.e.
 * before zustand rehydrates. Existing keys are left alone so a reader who has
 * been browsing does not get reset mid-visit.
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
};

const project = JSON.parse(readFileSync(source, 'utf-8'));

const payload = {};
for (const [field, [key, version]] of Object.entries(STORES)) {
  const state = project[field];
  if (state === undefined || state === null) continue;
  payload[key] = { state, version };
}

const counts = Object.entries(payload)
  .map(([k, v]) => `${k}=${JSON.stringify(v.state).length}o`)
  .join(' ');

const js = `/* Généré par scripts/make-seed.mjs — ne pas éditer à la main.
   Source : ${source.replace(ROOT, '.')} · ${new Date().toISOString()}
   ${counts} */
(function () {
  var seed = ${JSON.stringify(payload)};
  try {
    for (var key in seed) {
      // Ne jamais écraser ce que le lecteur a déjà : on ne fait qu'amorcer.
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(seed[key]));
      }
    }
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
