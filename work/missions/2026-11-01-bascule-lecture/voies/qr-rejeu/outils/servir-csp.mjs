// Épreuve de la CSP (voie qr-rejeu, étape 6). Lit l'en-tête Content-Security-Policy de firebase.json (jamais recopié ici).
// Usage :
//   node servir-csp.mjs --mode=dist --port=3460 [--passe=a|b]   sert dist/ de la copie (build de production) avec la CSP et la réécriture vers index.html
//   node servir-csp.mjs --mode=dev  --port=3461 [--passe=a|b]   Vite de la copie (DEV, banc ?dev-local) avec la même CSP en en-têtes serveur
// passe a : la CSP telle quelle ; passe b : 'wasm-unsafe-eval' ajouté à script-src (et rien d'autre).
// Aucun garde du code n'est contourné : le banc ?dev-local est un outil de développement, gardé par import.meta.env.DEV.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..', '..', '..', '..', '..');
const arg = (nom, defaut) => (process.argv.find(a => a.startsWith(`--${nom}=`)) ?? `--${nom}=${defaut}`).split('=').slice(1).join('=');
const MODE = arg('mode', 'dist');
const PORT = Number(arg('port', '3460'));
const PASSE = arg('passe', 'a');
const COPIE = path.resolve(arg('copie', path.join(os.tmpdir(), 'qr-app-copie')));

function csp() {
  const firebase = JSON.parse(fs.readFileSync(path.join(racine, 'firebase.json'), 'utf8'));
  const bloc = firebase.hosting.headers.find(h => h.source === '**');
  const entete = bloc.headers.find(h => h.key === 'Content-Security-Policy');
  let valeur = entete.value;
  if (PASSE === 'b') {
    const avant = valeur;
    valeur = valeur.replace("script-src ", "script-src 'wasm-unsafe-eval' ");
    if (valeur === avant) throw new Error('script-src introuvable dans la CSP');
  }
  return valeur;
}

const CSP = csp();
console.log(`mode=${MODE} passe=${PASSE} port=${PORT}`);
console.log(`CSP=${CSP}`);

if (MODE === 'dev') {
  const vite = await import(pathToFileURL(path.join(COPIE, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
  const serveur = await vite.createServer({
    root: COPIE,
    configFile: path.join(COPIE, 'vite.config.ts'),
    server: { port: PORT, strictPort: true, host: 'localhost', headers: { 'Content-Security-Policy': CSP } },
  });
  await serveur.listen();
  console.log(`VITE_DEV_PRET http://localhost:${PORT}`);
} else {
  const dist = path.join(COPIE, 'dist');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.png': 'image/png', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
  http.createServer((req, res) => {
    const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let fichier = path.join(dist, chemin);
    if (!fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) fichier = path.join(dist, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] ?? 'application/octet-stream', 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(fichier).pipe(res);
  }).listen(PORT, 'localhost', () => console.log(`STATIQUE_PRET http://localhost:${PORT}`));
}
