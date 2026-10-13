/**
 * Builds the read-only copy meant to be shared with someone else.
 *
 * Two things `next build` alone does not do:
 *
 * 1. `NEXT_PUBLIC_READONLY=1 next build` is not portable — that syntax fails in
 *    Windows cmd.exe, and this project is driven from a .bat launcher. Setting
 *    the variable on the spawned process works everywhere without cross-env.
 *
 * 2. `next/script` with `strategy="beforeInteractive"` emits only a
 *    `<link rel="preload">` under `output: 'export'` — no executable tag. The
 *    seed therefore ran AFTER zustand had already rehydrated from an empty
 *    localStorage, so a first-time visitor saw a completely empty app and only
 *    got the real project after reloading. Measured, not assumed.
 *    The fix is a classic blocking <script> injected into every exported page,
 *    which the parser runs before anything else.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');

if (!existsSync(join(ROOT, 'public', 'seed.js'))) {
  console.error(
    "public/seed.js est absent : lancez `npm run seed` d'abord, sinon la copie partagée s'ouvrira vide."
  );
  process.exit(1);
}

const build = spawnSync('npx', ['next', 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, NEXT_PUBLIC_READONLY: '1' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

// ── Injecter la graine en tête de chaque page ──
const TAG = '<script src="/seed.js"></script>';
const pages = readdirSync(OUT).filter((f) => f.endsWith('.html'));
let injected = 0;

for (const file of pages) {
  const path = join(OUT, file);
  let html = readFileSync(path, 'utf-8');
  if (html.includes(TAG)) continue;
  const at = html.indexOf('<head>');
  if (at < 0) {
    console.warn(`  ! ${file} : pas de <head>, graine non injectée`);
    continue;
  }
  html = html.slice(0, at + 6) + TAG + html.slice(at + 6);
  writeFileSync(path, html, 'utf-8');
  injected += 1;
}

if (injected !== pages.length) {
  console.error(`\n  Graine injectée dans ${injected}/${pages.length} pages seulement — arrêt.`);
  process.exit(1);
}

// ── Estampiller le service worker ──
// CACHE_VERSION est écrit en dur dans public/sw.js. Sans réestampillage, un
// téléphone qui a déjà installé l'app garde l'ancien cache et peut afficher
// des chiffres périmés après une mise à jour. Le tampon est déterministe :
// il vient du contenu déployé, pas de l'horloge, donc un build identique ne
// force pas de purge inutile.
const swPath = join(OUT, 'sw.js');
if (existsSync(swPath)) {
  const stamp = createHash('sha1')
    .update(readFileSync(join(OUT, 'index.html')))
    .digest('hex')
    .slice(0, 8);
  const sw = readFileSync(swPath, 'utf-8').replace(
    /const CACHE_VERSION = '[^']*';/,
    `const CACHE_VERSION = 'renovapp-${stamp}';`
  );
  // Tout précharger : après une mise à jour, le nouveau service worker efface
  // l'ancien cache. Sans liste complète, seul l'accueil restait lisible hors
  // ligne jusqu'à la visite suivante avec réseau. Mesuré, pas supposé.
  const files = [];
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), r);
      else files.push(r);
    }
  };
  walk(OUT, '');
  const urls = files
    .filter((f) => !['sw.js', 'vercel.json', '404.html', '404.txt'].includes(f))
    .map((f) => (f === 'index.html' ? './' : f.endsWith('.html') ? `./${f.slice(0, -5)}` : `./${f}`))
    .sort();
  const withList = sw.replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = ${JSON.stringify(urls, null, 2)};`);
  if (withList === sw) {
    console.error('  Liste de préchargement introuvable dans sw.js — arrêt.');
    process.exit(1);
  }
  writeFileSync(swPath, withList, 'utf-8');
  console.log(`  Préchargement hors ligne : ${urls.length} fichiers`);
  console.log(`  Service worker estampillé : renovapp-${stamp}`);
}

// vercel.json doit se trouver DANS le dossier déployé, sinon les en-têtes
// (noindex) et cleanUrls ne s'appliquent pas.
copyFileSync(join(ROOT, 'vercel.json'), join(OUT, 'vercel.json'));

// ── Sortir la copie de out/ ──
// out/ est aussi ce que sert le raccourci du bureau. Laisser la copie en
// lecture seule dedans faisait rouvrir l'app du PC en lecture seule, sans
// sauvegarde : le lanceur ne reconstruit que si les sources sont plus récentes
// que out/, ce qui n'est justement plus le cas juste après ce build.
// La copie part donc dans out-shared/, et out/ disparaît : le prochain
// lancement reconstruit une app normale.
const SHARED = join(ROOT, 'out-shared');
const LINK = join(SHARED, '.vercel');
const keptLink = join(ROOT, '.vercel-shared-link');
if (existsSync(LINK)) {
  rmSync(keptLink, { recursive: true, force: true });
  renameSync(LINK, keptLink);
}
rmSync(SHARED, { recursive: true, force: true });
renameSync(OUT, SHARED);
// La graine contient les chiffres du projet : elle n'a rien à faire dans les
// builds normaux du PC (next build recopie tout public/ dans out/).
rmSync(join(ROOT, 'public', 'seed.js'), { force: true });
if (existsSync(keptLink)) {
  renameSync(keptLink, LINK);
} else {
  // Relie la copie au projet Vercel « renovapp-lecture » sans question
  // interactive au premier déploiement. Ces identifiants ne sont pas secrets.
  mkdirSync(LINK, { recursive: true });
  writeFileSync(
    join(LINK, 'project.json'),
    JSON.stringify({ projectId: 'prj_R70u6LVToT4OS41GSFP8dCQDTh4Y', orgId: 'team_MqTB1yxJAMYC6zUJ0skOiiQL' }),
    'utf-8'
  );
}

console.log(`\n  Copie de consultation prête dans out-shared/ — graine injectée dans ${injected} pages.`);
console.log('  Déploiement :  npx vercel deploy out-shared --prod');
console.log('  L’app du PC sera reconstruite normalement au prochain lancement.\n');
