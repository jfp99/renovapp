/**
 * Zero-dependency static server for the exported app.
 *
 * `next start` refuses to run against `output: 'export'`, and opening the
 * export over file:// breaks the absolute /_next/ asset paths — so the desktop
 * launcher serves out/ over localhost instead, which also makes the origin
 * secure enough for the service worker and PWA install.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../out', import.meta.url)));
const PORT = Number(process.env.PORT) || 4321;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(ROOT)) {
  console.error(`\n  Le dossier "out" est introuvable.\n  Lancez d'abord :  npm run build\n`);
  process.exit(1);
}

/** Map a URL path to a file on disk, refusing anything outside out/. */
function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const candidate = resolve(join(ROOT, normalize(decoded)));
  if (!candidate.startsWith(ROOT)) return null; // path traversal

  const attempts = [candidate];
  if (!extname(candidate)) {
    attempts.push(`${candidate}.html`, join(candidate, 'index.html'));
  }

  for (const attempt of attempts) {
    if (existsSync(attempt) && statSync(attempt).isFile()) return attempt;
  }
  return null;
}

const server = createServer((req, res) => {
  const match = resolveFile(req.url || '/');
  // Serve the 404 page with a real 404 status: a 200 here would let the service
  // worker cache a missing asset as if it were valid.
  const file = match ?? resolveFile('/404');
  const status = match ? 200 : 404;

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Introuvable');
    return;
  }

  const ext = extname(file).toLowerCase();
  const immutable = status === 200 && file.includes(`${join('_next', 'static')}`);

  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    // The app keeps everything client-side; no reason to be embeddable.
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  createReadStream(file).pipe(res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`\n  RenovApp tourne déjà sur http://${HOST}:${PORT}\n`);
    process.exit(0);
  }
  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`\n  RenovApp est prêt sur  http://${HOST}:${PORT}`);
  console.log('  Laissez cette fenêtre ouverte pendant que vous travaillez.');
  console.log('  Ctrl+C pour arrêter.\n');
});
