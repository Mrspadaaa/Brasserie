// Voie c3f (#180) : lecture peu intrusive de freestylehops.com (autorisation déclarée par l'utilisateur, 26.10).
// Une requête toutes les 2 s au plus, une seule à la fois, 80 au plus au total (compte tenu du journal de la voie).
// Arrêt immédiat sur 401, 403, 429 ou page de défi : aucun contournement. Hors ligne : aucune requête, lecture du cache seule.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, offlineMode } from '../hop-source-cache.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
export const racine = resolve(ici, '..', '..');
export const CACHE = resolve(process.env.HOP_SOURCE_CACHE || 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources');
export const VOIE = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/c3f-freestyle');
export const JOURNAL = join(VOIE, 'journal-requetes.json');
export const PLAFOND = 80;
export const PAUSE_MS = 2100;
export const AGENT = 'LAffinee-Hop-Reference-Audit/1.0';
const DEFI = /Security Checkpoint|Just a moment|cf-challenge|Attention Required|captcha-delivery|Access denied|Vercel Security/i;

export const hors_ligne = offlineMode;
const attendre = ms => new Promise(r => setTimeout(r, ms));

export function chargerJournal() {
  try { return JSON.parse(readFileSync(JOURNAL, 'utf8')); } catch { return { plafond: PLAFOND, requetes: [], arret: null }; }
}
function ecrireJournal(j) { mkdirSync(VOIE, { recursive: true }); writeFileSync(JOURNAL, JSON.stringify(j, null, 2) + '\n'); }

let derniere = 0;
const enCache = url => {
  const p = resolve(CACHE, digest(url));
  try {
    if (!existsSync(p) || !existsSync(p + '.json')) return false;
    return JSON.parse(readFileSync(p + '.json', 'utf8')).sha256 === digest(readFileSync(p, 'utf8'));
  } catch { return false; }
};

/** Lit une URL du cache ; la télécharge (une requête comptée) seulement si elle manque et si on est en ligne. Rend null si 404/410. */
export async function lire(url, { binaire = false } = {}) {
  const chemin = resolve(CACHE, digest(url));
  if (!enCache(url)) {
    const j = chargerJournal();
    if (j.requetes.some(r => r.url === url && (r.statut === 404 || r.statut === 410))) return null;
    if (hors_ligne()) throw Error(`Hors ligne : source absente du cache (${CACHE}) : ${url}`);
    if (j.arret) throw Error(`Collecte arrêtée (${j.arret.raison}) : ${j.arret.url}`);
    if (j.requetes.length >= PLAFOND) throw Error(`Plafond de ${PLAFOND} requêtes atteint`);
    const delta = Date.now() - derniere;
    if (delta < PAUSE_MS) await attendre(PAUSE_MS - delta);
    derniere = Date.now();
    const entree = { url, quand: new Date().toISOString(), statut: null };
    j.requetes.push(entree);
    let rep;
    try {
      rep = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': AGENT } });
    } catch (e) { entree.statut = `erreur : ${e.message}`; ecrireJournal(j); throw e; }
    entree.statut = rep.status;
    if ([401, 403, 429].includes(rep.status)) {
      j.arret = { raison: rep.status, url, quand: entree.quand };
      ecrireJournal(j);
      throw Error(`Collecte arrêtée (${rep.status}) : ${url}`);
    }
    if (rep.status === 404 || rep.status === 410) { ecrireJournal(j); return null; }
    if (!rep.ok) { ecrireJournal(j); throw Error(`Source non accessible (${rep.status}) : ${url}`); }
    let contenu;
    if (binaire) contenu = Buffer.from(await rep.arrayBuffer()).toString('base64');
    else {
      contenu = await rep.text();
      if (DEFI.test(contenu.slice(0, 4000)) && contenu.length < 20000) {
        j.arret = { raison: 'défi anti-robot', url, quand: entree.quand };
        ecrireJournal(j);
        throw Error(`Défi anti-robot : ${url}`);
      }
    }
    entree.octets = contenu.length;
    ecrireJournal(j);
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(chemin, contenu);
    writeFileSync(chemin + '.json', JSON.stringify({ url, retrievedAt: entree.quand, sha256: digest(contenu), ...(binaire ? { encoding: 'base64' } : {}) }, null, 2));
  }
  const contenu = readFileSync(chemin, 'utf8'), meta = JSON.parse(readFileSync(chemin + '.json', 'utf8'));
  if (meta.sha256 !== digest(contenu)) throw Error(`Reçu sha256 différent du contenu en cache : ${url}`);
  return { content: contenu, ...meta, ...(binaire ? { octets: Buffer.from(contenu, 'base64') } : {}) };
}
