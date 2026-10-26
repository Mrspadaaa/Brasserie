// Outils communs aux collectes européennes (c3b) : lecture polie, cache partagé, robots.txt, reçus d'erreur.
// Tout téléchargement de page passe par readHopSource (scripts/hop-source-cache.mjs) ; les PDF (octets) ont leur propre
// entrée dans le même dossier : <sha256(url)>.pdf + <sha256(url)>.pdf.json.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readHopSource, offlineMode } from '../hop-source-cache.mjs';

export const CACHE = resolve(process.env.HOP_SOURCE_CACHE || 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources');
export const UA = 'LAffinee-Hop-Reference-Audit/1.0';
const sha = v => createHash('sha256').update(v).digest('hex');
const dormir = ms => new Promise(r => setTimeout(r, ms));

/** Hôtes arrêtés (401/403/429 ou défi) : plus aucune requête, jamais de contournement. */
export const bloques = new Map();
const derniere = new Map(); // hôte -> instant de la dernière requête
const delais = new Map(); // hôte -> délai minimal (ms)
const regles = new Map(); // hôte -> [{ allow, motif }]

/** Attend 1 s (ou le Crawl-delay du robots.txt) entre deux requêtes sur le même hôte. */
async function patienter(hote) {
  const delai = Math.max(1100, delais.get(hote) || 0);
  const attente = (derniere.get(hote) || 0) + delai - Date.now();
  if (attente > 0) await dormir(attente);
  derniere.set(hote, Date.now());
}

function motifVersRegex(motif) {
  const fin = motif.endsWith('$');
  const corps = (fin ? motif.slice(0, -1) : motif).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + corps + (fin ? '$' : ''));
}

/** Analyse la section `User-agent: *` d'un robots.txt (Allow, Disallow, Crawl-delay). */
export function analyserRobots(texte) {
  const sortie = { regles: [], delai: 0 };
  let actif = false, dansGroupe = false;
  for (const brute of texte.split(/\r?\n/)) {
    const ligne = brute.replace(/#.*/, '').trim();
    if (!ligne) continue;
    const m = ligne.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const cle = m[1].toLowerCase(), val = m[2].trim();
    if (cle === 'user-agent') {
      if (!dansGroupe) actif = false;
      dansGroupe = true;
      if (val === '*') actif = true;
    } else {
      dansGroupe = false;
      if (!actif) continue;
      if (cle === 'disallow' && val) sortie.regles.push({ allow: false, motif: val, re: motifVersRegex(val) });
      else if (cle === 'allow' && val) sortie.regles.push({ allow: true, motif: val, re: motifVersRegex(val) });
      else if (cle === 'crawl-delay') sortie.delai = Number(val) * 1000 || 0;
    }
  }
  return sortie;
}

/** Règle la plus longue qui correspond (comme Google) ; sans règle, autorisé. */
export function autorise(analyse, chemin) {
  let meilleure = null;
  for (const r of analyse.regles) if (r.re.test(chemin) && (!meilleure || r.motif.length > meilleure.motif.length)) meilleure = r;
  return !meilleure || meilleure.allow;
}

async function chargerRobots(hote) {
  if (regles.has(hote)) return regles.get(hote);
  const url = `https://${hote}/robots.txt`;
  let analyse = { regles: [], delai: 0 };
  try {
    const page = await tenter(url, { robots: true });
    if (page) analyse = analyserRobots(page.content);
  } catch (e) { /* robots.txt illisible : on reste poli (1 s) et on note l'erreur dans le rapport */ analyse.erreur = e.message; }
  regles.set(hote, analyse);
  if (analyse.delai) delais.set(hote, analyse.delai);
  return analyse;
}

const cheminErreur = url => resolve(CACHE, sha(url) + '.erreur.json');

/** Lit un reçu d'erreur (404 etc.) laissé par une collecte précédente. */
async function recuErreur(url) {
  try { return JSON.parse(await readFile(cheminErreur(url), 'utf8')); } catch { return null; }
}

async function enCache(url) {
  try { return await readHopSource(url, { offline: true, cache: CACHE }); } catch { return null; }
}

async function tenter(url, { robots = false } = {}) {
  const deja = await enCache(url);
  if (deja) return deja;
  if (offlineMode()) return null;
  const { hostname, pathname, search } = new URL(url);
  if (bloques.has(hostname)) throw Error(`Hôte arrêté (${bloques.get(hostname)}) : ${hostname}`);
  if (!robots) {
    const r = await chargerRobots(hostname);
    if (!autorise(r, pathname + search)) { const e = Error(`robots.txt interdit : ${url}`); e.code = 'ROBOTS'; throw e; }
  }
  await patienter(hostname);
  try {
    return await readHopSource(url, { offline: false, cache: CACHE });
  } catch (e) {
    const m = String(e.message).match(/\((\d{3})\)/);
    const code = m ? Number(m[1]) : null;
    if ([401, 403, 429].includes(code)) { bloques.set(hostname, code); console.error(`ARRÊT ${hostname} : ${code}`); }
    if (code) {
      await mkdir(CACHE, { recursive: true });
      await writeFile(cheminErreur(url), JSON.stringify({ url, statut: code, releve: new Date().toISOString() }, null, 2));
    }
    throw e;
  }
}

/**
 * Lit une page : cache d'abord, sinon requête polie. Rend { content, url, retrievedAt, sha256 } ou null (404, hors ligne absent,
 * interdit par robots.txt, hôte arrêté). `etat` reçoit la raison.
 */
export async function lire(url, etat = {}) {
  const err = await recuErreur(url);
  if (err && !(await enCache(url))) { etat.raison = `HTTP ${err.statut}`; return null; }
  try {
    const page = await tenter(url);
    if (!page) { etat.raison = 'absent du cache (hors ligne)'; return null; }
    return page;
  } catch (e) { etat.raison = e.message; return null; }
}

/** PDF : octets gardés tels quels dans le cache (<sha>.pdf), texte extrait par pdftotext (outil système, aucun paquet). */
export async function lirePdf(url, etat = {}) {
  const chemin = resolve(CACHE, sha(url) + '.pdf');
  try {
    const octets = await readFile(chemin);
    const recu = JSON.parse(await readFile(chemin + '.json', 'utf8'));
    if (recu.sha256 === createHash('sha256').update(octets).digest('hex')) return { octets, chemin, ...recu };
  } catch { /* pas encore en cache */ }
  const err = await recuErreur(url);
  if (err) { etat.raison = `HTTP ${err.statut}`; return null; }
  if (offlineMode()) { etat.raison = 'absent du cache (hors ligne)'; return null; }
  const { hostname, pathname, search } = new URL(url);
  if (bloques.has(hostname)) { etat.raison = `hôte arrêté (${bloques.get(hostname)})`; return null; }
  const r = await chargerRobots(hostname);
  if (!autorise(r, pathname + search)) { etat.raison = 'robots.txt'; return null; }
  await patienter(hostname);
  const rep = await fetch(url, { signal: AbortSignal.timeout(40000), headers: { 'User-Agent': UA } });
  if (!rep.ok) {
    if ([401, 403, 429].includes(rep.status)) { bloques.set(hostname, rep.status); console.error(`ARRÊT ${hostname} : ${rep.status}`); }
    await mkdir(CACHE, { recursive: true });
    await writeFile(cheminErreur(url), JSON.stringify({ url, statut: rep.status, releve: new Date().toISOString() }, null, 2));
    etat.raison = `HTTP ${rep.status}`;
    return null;
  }
  const octets = Buffer.from(await rep.arrayBuffer());
  const recu = { url, retrievedAt: new Date().toISOString(), sha256: createHash('sha256').update(octets).digest('hex') };
  await mkdir(CACHE, { recursive: true });
  await writeFile(chemin, octets);
  await writeFile(chemin + '.json', JSON.stringify(recu, null, 2));
  return { octets, chemin, ...recu };
}

/** Texte d'un PDF dans l'ordre du flux (pdftotext -raw) : garde les libellés et leurs valeurs côte à côte. Outil système, aucun paquet. */
export function texteDuPdfBrut(chemin) {
  return execFileSync('pdftotext', ['-raw', '-enc', 'UTF-8', chemin, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

export { sha };
