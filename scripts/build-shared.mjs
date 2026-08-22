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
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

// vercel.json doit se trouver DANS le dossier déployé, sinon les en-têtes
// (noindex) et cleanUrls ne s'appliquent pas.
copyFileSync(join(ROOT, 'vercel.json'), join(OUT, 'vercel.json'));

console.log(`\n  Copie de consultation prête dans out/ — graine injectée dans ${injected} pages.`);
console.log('  Déploiement :  npx vercel deploy out --prod');
console.log('  Rappel : cette copie contient vos chiffres. Protégez l’URL.\n');
