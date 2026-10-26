#!/usr/bin/env node
// Serveur statique de test (Node http, sans dépendance) : `node servir.mjs <dossier> [--port=0] [--hote=127.0.0.1]`.
// Imprime son adresse (« http://127.0.0.1:<port>/ ») sur la première ligne et reste en écoute (kill pour l'arrêter).
// Sert GET et HEAD ; un dossier rend son index.html ; rien hors du dossier (pas de « .. »).
// Superposition : si <dossier>/superposition.json existe, { "sur": "<dossier de base, depuis la racine du dépôt>" },
// un fichier absent de <dossier> est cherché dans la base. Un témoin n'a ainsi besoin que de ce qu'il change.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const dossier = args.find((a) => !a.startsWith('--'));
if (!dossier || !fs.existsSync(dossier) || !fs.statSync(dossier).isDirectory()) { console.error('Usage : node servir.mjs <dossier> [--port=0] [--hote=127.0.0.1]'); process.exit(2); }
const racines = [path.resolve(dossier)];
const sup = path.join(racines[0], 'superposition.json');
if (fs.existsSync(sup)) racines.push(path.resolve(RACINE, JSON.parse(fs.readFileSync(sup, 'utf8')).sur));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const trouver = (rel) => {
  for (const r of racines) {
    let f = path.resolve(r, '.' + path.sep + rel);
    if (f !== r && !f.startsWith(r + path.sep)) continue;
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
};
const serveur = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch { res.writeHead(400).end(); return; }
  const f = trouver(rel);
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('introuvable'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(f).pipe(res);
});
serveur.listen(Number(opt('port', '0')), opt('hote', '127.0.0.1'), () => {
  console.log(`http://${opt('hote', '127.0.0.1')}:${serveur.address().port}/`);
});
