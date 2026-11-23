#!/usr/bin/env node
// Sert une construction de la maquette en HTTP local, pour la jouer dans un navigateur (le panneau de l'app de
// bureau ne charge pas les scripts d'une page file://). Lecture seule, localhost seulement.
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/servir.mjs [--dossier=<dossier>] [--port=5191]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const depot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const opt = (nom, defaut) => (process.argv.find((a) => a.startsWith(`--${nom}=`)) ?? `--${nom}=${defaut}`).split('=').slice(1).join('=');
const racine = path.resolve(depot, opt('dossier', 'prototypes/houblons-v4/maquettes/parcours'));
const port = Number(opt('port', 5191));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

http.createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  let f = path.resolve(racine, '.' + chemin);
  if (!f.startsWith(racine)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404).end('absent'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`SERVI http://localhost:${port}/ (${path.relative(depot, racine)})`));
