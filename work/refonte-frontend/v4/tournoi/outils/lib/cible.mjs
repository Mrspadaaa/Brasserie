// Cible d'un contrôle de ses choix (règle n° 1, #161) : un dossier construit (file://, la forme d'avant) ou une adresse
// servie (http://, la maquette servie, plus tard l'app). Un seul résolveur : les contrôles n'écrivent plus
// `pathToFileURL(…)` ni `fs.existsSync(page)` pour une page à ouvrir.
//
// Comment ça passe d'un script à l'autre : en mode adresse, controle-choix.mjs donne à chaque contrôle un
// « dossier virtuel » (un chemin qui n'existe pas sur le disque) et l'adresse dans l'environnement
// (AFFINEE_CIBLE_URL, AFFINEE_CIBLE_RACINE, facultatif AFFINEE_CIBLE_GABARIT). Le contrôle garde ses chemins
// `path.join(dossier, route, 'etat.html')` ; `versUrl`, `existe` et `lire` les traduisent. Sans ces variables, tout se
// comporte comme avant (file://, fs).
//   gabarit : adresse d'une route quand elle n'est pas `<adresse>/<route>/etat.html` (une app à une page :
//   `{adresse}/#/{route}`) ; les marques {adresse} et {route} sont remplacées.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const SONDE = path.join(ici, 'sonde.mjs');
export const ENV = { url: 'AFFINEE_CIBLE_URL', racine: 'AFFINEE_CIBLE_RACINE', gabarit: 'AFFINEE_CIBLE_GABARIT' };

const adresseEnv = () => (process.env[ENV.url] || '').replace(/\/+$/, '');
const racineEnv = () => (process.env[ENV.racine] ? path.resolve(process.env[ENV.racine]) : '');

// La cible demandée sur la ligne de commande : un dossier (positionnel) ou --url=<adresse>.
export function cibleDe({ dossier = null, url = null, gabarit = null, racine }) {
  if (url) {
    const adresse = String(url).replace(/\/+$/, '');
    if (!/^https?:\/\/[^\s/]+/.test(adresse)) throw new Error(`adresse illisible : ${url}`);
    const virtuel = path.join(os.tmpdir(), 'affinee-cible-url', crypto.createHash('sha1').update(adresse).digest('hex').slice(0, 10));
    return { mode: 'url', adresse, gabarit: gabarit || '', dossier: virtuel, libelle: adresse };
  }
  if (!dossier) throw new Error('ni dossier ni --url');
  const d = path.resolve(racine ?? process.cwd(), dossier);
  return { mode: 'fichier', adresse: '', gabarit: '', dossier: d, libelle: d };
}

// L'environnement à donner aux contrôles lancés pour cette cible.
export function environnement(cible, base = process.env) {
  const env = { ...base };
  for (const k of Object.values(ENV)) delete env[k];
  if (cible.mode === 'url') {
    env[ENV.url] = cible.adresse;
    env[ENV.racine] = cible.dossier;
    if (cible.gabarit) env[ENV.gabarit] = cible.gabarit;
  }
  return env;
}

// Le chemin est-il dans le dossier virtuel d'une cible servie ? Si oui, son chemin relatif (barres obliques).
function relatif(p) {
  const r = racineEnv();
  if (!adresseEnv() || !r) return null;
  const rel = path.relative(r, path.resolve(String(p)));
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

const encoder = (rel) => rel.split('/').map(encodeURIComponent).join('/');

// L'adresse d'une page `<route>/<page>` pour la cible (utile à qui n'a pas de chemin sous la main).
export function adresseDePage(cible, route, page = 'etat.html') {
  if (cible.mode === 'fichier') return pathToFileURL(path.join(cible.dossier, route, page)).href;
  if (cible.gabarit && page === 'etat.html') return cible.gabarit.split('{adresse}').join(cible.adresse).split('{route}').join(route);
  return `${cible.adresse}/${route ? route + '/' : ''}${page}`;
}

function adresseDeRelatif(rel) {
  const g = process.env[ENV.gabarit];
  const m = rel.match(/^([^/]+)\/etat\.html$/);
  if (g && m) return g.split('{adresse}').join(adresseEnv()).split('{route}').join(m[1]);
  return `${adresseEnv()}/${encoder(rel)}`;
}

// Remplace `pathToFileURL(chemin)` : un objet URL (`.href`) pour un fichier local ou une page servie.
export function versUrl(chemin) {
  const rel = relatif(chemin);
  return rel === null ? pathToFileURL(String(chemin)) : new URL(adresseDeRelatif(rel));
}

const cache = new Map();
const sonde = (mode, adresse) => spawnSync(process.execPath, [SONDE, mode, adresse], { encoding: 'utf8', timeout: 20000 });

// Remplace `fs.existsSync(chemin)` pour une page : sur le serveur, une requête HEAD (mémorisée).
export function existe(chemin) {
  const rel = relatif(chemin);
  if (rel === null) return fs.existsSync(chemin);
  if (rel === '') return true;
  if (!cache.has(rel)) cache.set(rel, sonde('existe', `${adresseEnv()}/${encoder(rel)}`).stdout === '1');
  return cache.get(rel);
}

// Remplace `fs.readFileSync(chemin, 'utf8')` pour un fichier servi (NOTE.md d'une page, par exemple) ; null s'il manque.
export function lire(chemin) {
  const rel = relatif(chemin);
  if (rel === null) return fs.existsSync(chemin) ? fs.readFileSync(chemin, 'utf8') : null;
  const r = sonde('lire', `${adresseEnv()}/${encoder(rel)}`);
  return r.status === 0 ? r.stdout : null;
}

// Remplace `fs.readdirSync(chemin)` : un serveur ne liste pas ses dossiers, la liste est vide (les contrôles reçoivent
// alors leurs routes en argument).
export function liste(chemin) {
  return relatif(chemin) === null ? fs.readdirSync(chemin) : [];
}
