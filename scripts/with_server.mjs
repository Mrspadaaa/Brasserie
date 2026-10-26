#!/usr/bin/env node
// Démarre un ou plusieurs serveurs, attend leur port, lance une commande, puis arrête tout, même en cas d'échec.
// Adaptation Node de `scripts/with_server.py` du skill webapp-testing d'Anthropic (Apache 2.0, voir
// .claude/skills/webapp-testing/SOURCE.md). Même rôle, mêmes options, trois ajouts pour ce poste Windows :
//   - arrêt de TOUT l'arbre de processus (`npm run dev` lance node, qui lance esbuild) : taskkill /T sous Windows ;
//   - refus d'un port déjà occupé (sinon le test passerait sur le serveur d'un autre), sauf --reuse ;
//   - journal de chaque serveur dans un fichier (os.tmpdir()), jamais un tuyau non lu qui finit par bloquer le serveur.
//
// Usage :
//   node scripts/with_server.mjs --server "npm run dev" --port 3000 -- node mon-test.mjs
//   node scripts/with_server.mjs --server "npm run dev" --port 3000 --env VITE_HOP_V4=on -- node mon-test.mjs
//   node scripts/with_server.mjs \
//     --server "cd backend && node serveur.js" --port 3001 \
//     --server "npm run dev" --port 3000 -- node mon-test.mjs
//
// La commande reçoit WITH_SERVER_PORTS (« 3000,3001 ») et WITH_SERVER_LOGS (dossier des journaux) dans son environnement.
// Code de sortie : celui de la commande ; 3 si un serveur n'a pas démarré ; 2 pour un mauvais usage.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const AIDE = `Usage : node scripts/with_server.mjs --server "<commande>" --port <n> [--server … --port …] [options] -- <commande de test…>
  --server <cmd>    commande d'un serveur (répétable ; shell : « cd x && npm run dev » permis)
  --port <n>        port de ce serveur (autant de --port que de --server, dans le même ordre)
  --env K=V         variable d'environnement pour les serveurs ET la commande (répétable)
  --timeout <s>     attente maximale par serveur (défaut 60)
  --reuse           accepter un port déjà ouvert (défaut : refuser, pour ne pas tester le serveur de quelqu'un d'autre)
  --no-http         se contenter du port ouvert (défaut : attendre aussi une réponse HTTP sur /)
  --help            cette aide`;

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const opts = sep === -1 ? argv : argv.slice(0, sep);
const commande = sep === -1 ? [] : argv.slice(sep + 1);

const serveurs = [];
const ports = [];
const env = {};
let delai = 60;
let reuse = false;
let http200 = true;
for (let i = 0; i < opts.length; i++) {
  const a = opts[i];
  if (a === '--help' || a === '-h') { console.log(AIDE); process.exit(0); }
  else if (a === '--server') serveurs.push(opts[++i]);
  else if (a === '--port') ports.push(Number(opts[++i]));
  else if (a === '--env') { const kv = opts[++i] ?? ''; const eq = kv.indexOf('='); if (eq < 1) usage(`--env attend K=V, reçu « ${kv} »`); env[kv.slice(0, eq)] = kv.slice(eq + 1); }
  else if (a === '--timeout') delai = Number(opts[++i]);
  else if (a === '--reuse') reuse = true;
  else if (a === '--no-http') http200 = false;
  else usage(`option inconnue : ${a}`);
}
function usage(msg) { console.error(`Erreur : ${msg}\n\n${AIDE}`); process.exit(2); }
if (serveurs.length === 0) usage('au moins un --server');
if (serveurs.length !== ports.length) usage('autant de --server que de --port');
if (ports.some((p) => !Number.isInteger(p) || p < 1 || p > 65535)) usage('port invalide');
if (commande.length === 0) usage('aucune commande à lancer après « -- »');

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Un port est ouvert si localhost répond en IPv4 ou en IPv6 (Vite avec host:true écoute souvent sur « :: »).
function portOuvert(port) {
  const essai = (hote) => new Promise((ok) => {
    const s = net.connect({ port, host: hote });
    s.setTimeout(1000);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
  return Promise.all([essai('127.0.0.1'), essai('::1')]).then(([a, b]) => a || b);
}

function repondEnHttp(port) {
  return new Promise((ok) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 3000 }, (res) => { res.resume(); ok(res.statusCode < 500); });
    req.once('timeout', () => { req.destroy(); ok(false); });
    req.once('error', () => ok(false));
  });
}

async function attendre(port, enfant) {
  const fin = Date.now() + delai * 1000;
  while (Date.now() < fin) {
    if (enfant.exitCode !== null) return 'sorti';
    if (await portOuvert(port) && (!http200 || await repondEnHttp(port))) return 'pret';
    await dormir(500);
  }
  return 'delai';
}

// Arrête l'arbre entier : npm → node → esbuild ne meurent pas tous avec un simple kill.
function arreter(enfant) {
  if (!enfant.pid || enfant.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(enfant.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-enfant.pid, 'SIGTERM'); } catch { /* déjà sorti */ } }
}

const dossierJournaux = fs.mkdtempSync(path.join(os.tmpdir(), 'with-server-'));
const enfants = [];
let arrete = false;
function toutArreter() {
  if (arrete) return;
  arrete = true;
  console.log(`\nArrêt de ${enfants.length} serveur(s)…`);
  for (const e of enfants.reverse()) arreter(e.proc);
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { toutArreter(); process.exit(130); });

function finir(code) { toutArreter(); process.exit(code); }

try {
  for (let i = 0; i < serveurs.length; i++) {
    if (!reuse && await portOuvert(ports[i])) {
      console.error(`Le port ${ports[i]} est déjà occupé : un autre serveur y répond. Libérer le port, en choisir un autre (PORT=… pour Vite), ou --reuse.`);
      finir(3);
    }
    const journal = path.join(dossierJournaux, `serveur-${i + 1}-${ports[i]}.log`);
    const fd = fs.openSync(journal, 'w');
    console.log(`Serveur ${i + 1}/${serveurs.length} : ${serveurs[i]}  (journal : ${journal})`);
    const proc = spawn(serveurs[i], { shell: true, detached: process.platform !== 'win32', stdio: ['ignore', fd, fd], env: { ...process.env, ...env, PORT: String(ports[i]) }, windowsHide: true });
    enfants.push({ proc, journal });
    console.log(`Attente du port ${ports[i]}…`);
    const etat = await attendre(ports[i], proc);
    if (etat !== 'pret') {
      const queue = fs.readFileSync(journal, 'utf8').split('\n').slice(-15).join('\n');
      console.error(`Le serveur ${i + 1} n'est pas prêt (${etat === 'sorti' ? "il s'est arrêté" : `délai de ${delai} s`}). Fin de son journal :\n${queue}`);
      finir(3);
    }
    console.log(`Serveur prêt sur le port ${ports[i]}`);
  }
  console.log(`\nTous les serveurs sont prêts. Lancement : ${commande.join(' ')}\n`);
  const enTest = { ...process.env, ...env, WITH_SERVER_PORTS: ports.join(','), WITH_SERVER_LOGS: dossierJournaux };
  const needsShell = process.platform === 'win32' && /^(npm|npx|pnpm|yarn)(\.cmd)?$/i.test(commande[0]);
  const test = needsShell
    ? spawn(commande.join(' '), { shell: true, stdio: 'inherit', env: enTest })
    : spawn(commande[0], commande.slice(1), { stdio: 'inherit', env: enTest });
  const code = await new Promise((ok) => { test.once('exit', (c, s) => ok(c ?? (s ? 1 : 0))); test.once('error', (e) => { console.error(`Commande impossible : ${e.message}`); ok(127); }); });
  console.log(`\nCommande terminée, code ${code}.`);
  finir(code);
} catch (e) {
  console.error(`with_server : ${e instanceof Error ? e.stack : e}`);
  finir(1);
}
