/**
 * Zero-dependency static server for the exported app.
 *
 * `next start` refuses to run against `output: 'export'`, and opening the
 * export over file:// breaks the absolute /_next/ asset paths — so the desktop
 * launcher serves out/ over localhost instead, which also makes the origin
 * secure enough for the service worker and PWA install.
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../out', import.meta.url)));
const DATA_DIR = resolve(fileURLToPath(new URL('../data', import.meta.url)));
const DATA_FILE = join(DATA_DIR, 'projet.json');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const MAX_BODY = 80 * 1024 * 1024; // generous: media is inlined as base64
const KEEP_BACKUPS = 20;
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

/** Read the project file, or null when nothing has been saved yet. */
function readProject() {
  if (!existsSync(DATA_FILE)) return null;
  try {
    return readFileSync(DATA_FILE, 'utf8');
  } catch (error) {
    console.error('  Lecture de la sauvegarde impossible :', error.message);
    return null;
  }
}

/**
 * Write atomically, keeping a rolling history.
 *
 * Browser storage turned out to be too fragile to hold the only copy of the
 * project — clearing site data, a quota hiccup or a privacy setting is enough
 * to wipe it. The file on disk is now the durable copy; the browser is just a
 * working cache in front of it.
 */
function writeProject(body) {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });

  if (existsSync(DATA_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    try {
      writeFileSync(join(BACKUP_DIR, `projet-${stamp}.json`), readFileSync(DATA_FILE));
    } catch {
      // A failed backup must never block the actual save.
    }
    try {
      const old = readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).sort();
      old.slice(0, Math.max(0, old.length - KEEP_BACKUPS)).forEach((f) =>
        unlinkSync(join(BACKUP_DIR, f))
      );
    } catch {
      // Pruning is housekeeping, not critical.
    }
  }

  // Write to a temp file first: a crash mid-write must not truncate the project.
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, body, 'utf8');
  renameSync(tmp, DATA_FILE);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('Sauvegarde trop volumineuse'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = req.url || '/';

  // ---- Project persistence API ----
  if (url.startsWith('/__data')) {
    if (req.method === 'GET') {
      const saved = readProject();
      if (!saved) {
        json(res, 404, { error: 'Aucune sauvegarde sur le disque' });
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(saved);
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      readBody(req)
        .then((body) => {
          JSON.parse(body); // reject anything that isn't valid JSON
          writeProject(body);
          json(res, 200, { ok: true, savedAt: new Date().toISOString() });
        })
        .catch((error) => json(res, 400, { error: error.message }));
      return;
    }

    json(res, 405, { error: 'Methode non supportee' });
    return;
  }

  const match = resolveFile(url);
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
  console.log(`  Sauvegarde automatique : ${DATA_FILE}`);
  console.log('  Laissez cette fenêtre ouverte pendant que vous travaillez.');
  console.log('  Ctrl+C pour arrêter.\n');
});
