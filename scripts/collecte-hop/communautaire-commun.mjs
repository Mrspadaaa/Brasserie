// Outils communs de la voie c3d (collecte des bases ouvertes et communautaires, #180).
// Tout ce qui est téléchargé passe par readHopSource (cache + reçu sha256). Collecte polie :
// robots.txt lu avant toute page, 1 requête par seconde et par hôte (le Crawl-delay du robots.txt l'emporte s'il est plus long),
// arrêt de l'hôte sur 401/403/429 ou page de défi anti-robot, sans contournement.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readHopSource, offlineMode, digest } from '../hop-source-cache.mjs';

export const CACHE_PAR_DEFAUT = 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources';
/** Dossier du cache : HOP_SOURCE_CACHE, sinon le cache de l'atelier s'il existe, sinon celui du dépôt courant. */
export const cacheDossier = () => process.env.HOP_SOURCE_CACHE || (existsSync(CACHE_PAR_DEFAUT) ? CACHE_PAR_DEFAUT : undefined);
export const lire = (url, options = {}) => readHopSource(url, { cache: cacheDossier(), ...options });

export const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
export const pliage = v => String(v ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const AGENT = 'LAffinee-Hop-Reference-Audit/1.0';

// ---------- robots.txt ----------
/** Analyse un robots.txt pour l'agent donné : { regles: [{ permis, motif }], delai (secondes) }. Le groupe de l'agent, sinon `*`. */
export function analyserRobots(texte, agent = AGENT) {
  const groupes = [];
  let courant = null, dernierEtaitAgent = false;
  let source = String(texte ?? '').replace(/\r/g, '\n');
  // Un fichier servi sur une seule ligne (NPGS) : ses directives sont relevées dans le texte, ses commentaires ne comptent pas.
  if (source.trim().split('\n').length <= 2 && /user-agent\s*:/i.test(source)) source = [...source.matchAll(/(user-agent|disallow|allow|crawl-delay)\s*:\s*(\S+)/gi)].map(m => `${m[1]}: ${m[2]}`).join('\n');
  const lignes = source.split('\n').flatMap(l => {
    const sansCommentaire = l.replace(/#.*$/, '').trim();
    return sansCommentaire ? [sansCommentaire] : [];
  });
  for (const ligne of lignes) {
    const m = ligne.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const cle = m[1].toLowerCase(), valeur = m[2].trim();
    if (cle === 'user-agent') {
      if (!dernierEtaitAgent) { courant = { agents: [], regles: [], delai: null }; groupes.push(courant); }
      courant.agents.push(valeur.toLowerCase()); dernierEtaitAgent = true; continue;
    }
    dernierEtaitAgent = false;
    if (!courant) continue;
    if (cle === 'disallow') { if (valeur) courant.regles.push({ permis: false, motif: valeur }); else courant.regles.push({ permis: true, motif: '/' }); }
    else if (cle === 'allow') courant.regles.push({ permis: true, motif: valeur });
    else if (cle === 'crawl-delay') { const n = Number(valeur); if (Number.isFinite(n) && n >= 0) courant.delai = n; }
  }
  const nom = agent.toLowerCase().split('/')[0];
  const propre = groupes.filter(g => g.agents.some(a => a !== '*' && nom.includes(a)));
  const choisis = propre.length ? propre : groupes.filter(g => g.agents.includes('*'));
  return { regles: choisis.flatMap(g => g.regles), delai: choisis.reduce((d, g) => g.delai ?? d, null) };
}
const motifVersRegex = motif => new RegExp('^' + motif.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
/** Le chemin (avec requête) est-il permis ? La règle la plus longue l'emporte ; à égalité, Allow. */
export function permis(robots, cheminEtRequete) {
  let meilleure = null;
  for (const r of robots.regles) {
    if (!r.motif) continue;
    if (!motifVersRegex(r.motif).test(cheminEtRequete)) continue;
    if (!meilleure || r.motif.length > meilleure.motif.length || (r.motif.length === meilleure.motif.length && r.permis)) meilleure = r;
  }
  return meilleure ? meilleure.permis : true;
}

const MARQUES_DEFI = /(just a moment|attention required|cf-browser-verification|captcha|are you a robot|access denied|verify you are human)/i;
const attendre = ms => new Promise(r => setTimeout(r, ms));

/** Un lecteur poli : un par hôte. `lecteur.page(url)` rend { content, retrievedAt, sha256, url } ou { absent: true, statut } (404). */
export function lecteurPoli(hote, { delaiMin = 1000, journal = [] } = {}) {
  const etat = { hote, arrete: null, robots: null, dernierAppel: 0, requetes: 0, depuisCache: 0, refuses: [] };
  const noter = (url, statut, note) => journal.push({ hote, url, statut, note });
  async function pause() {
    const delai = Math.max(delaiMin, (etat.robots?.delai ?? 0) * 1000);
    const reste = etat.dernierAppel + delai - Date.now();
    if (reste > 0) await attendre(reste);
    etat.dernierAppel = Date.now();
  }
  async function brut(url) {
    try { return await lire(url); }
    catch (e) {
      const m = String(e.message).match(/\((\d{3})\)/);
      if (m) return { erreurStatut: Number(m[1]) };
      if (e?.name === 'TimeoutError') return { erreurStatut: 'delai' };
      throw e;
    }
  }
  async function appel(url) {
    // Le cache d'abord : jamais de retéléchargement, ni d'attente pour une page déjà lue.
    try { const r = await lire(url, { offline: true }); etat.depuisCache++; return r; } catch { /* absente du cache */ }
    // Une page répondue 404/410 laisse un marqueur voisin du cache (ajout seulement) : hors ligne, on sait qu'elle n'existe pas.
    const marqueur = resolve(cacheDossier() ?? resolve('.codex-remote-attachments/hop-index/public-sources'), `${digest(url)}.absent.json`);
    try { const m = JSON.parse(await readFile(marqueur, 'utf8')); etat.depuisCache++; return { absent: true, statut: m.statut }; } catch { /* pas de marqueur */ }
    if (offlineMode()) throw Error(`Hors ligne : source absente du cache : ${url}`);
    if (etat.arrete) return { arrete: etat.arrete };
    await pause();
    etat.requetes++;
    const r = await brut(url);
    if (r.erreurStatut) {
      noter(url, r.erreurStatut, '');
      if ([404, 410].includes(r.erreurStatut)) await writeFile(marqueur, JSON.stringify({ url, statut: r.erreurStatut, retrievedAt: new Date().toISOString() }, null, 2));
      if ([401, 403, 429].includes(r.erreurStatut)) { etat.arrete = `${r.erreurStatut} sur ${url}`; return { arrete: etat.arrete }; }
      return { absent: true, statut: r.erreurStatut };
    }
    noter(url, 200, '');
    return r;
  }
  return {
    etat,
    /** Lit le robots.txt (cache compris). Un robots.txt absent (404) permet tout ; un 401/403/429 arrête l'hôte. */
    async robotsTxt() {
      const r = await appel(`https://${hote}/robots.txt`);
      if (r.arrete) return etat.robots = { regles: [], delai: null, arrete: true };
      etat.robots = r.absent ? { regles: [], delai: null } : analyserRobots(r.content);
      return etat.robots;
    },
    async page(url) {
      if (!etat.robots) await this.robotsTxt();
      const u = new URL(url);
      if (!permis(etat.robots, u.pathname + u.search)) { etat.refuses.push(url); noter(url, 'robots', 'Interdit par robots.txt'); return { absent: true, statut: 'robots' }; }
      const r = await appel(url);
      if (r.arrete || r.absent) return r;
      if (MARQUES_DEFI.test(r.content.slice(0, 4000)) && r.content.length < 20000) {
        etat.arrete = `page de défi anti-robot sur ${url}`; noter(url, 'defi', etat.arrete);
        return { arrete: etat.arrete };
      }
      return r;
    },
  };
}

// ---------- Valeurs ----------
const NUM = String.raw`(\d+(?:[.,]\d+)?|[.,]\d+)`;
const RE_PLAGE = new RegExp(String.raw`^${NUM}\s*(%|mls?|ml|mg|µg|ug)?\s*(?:[-–—]|to)\s*${NUM}\s*(%|mls?|ml|mg|µg|ug)?(?:\s*(?:/|per)?\s*(.*))?$`, 'i');
const RE_POINT = new RegExp(String.raw`^${NUM}\s*(%|mls?|ml|mg|µg|ug)?(?:\s*(?:/|per)?\s*(.*))?$`, 'i');
const nombre = s => Number(String(s).replace(',', '.'));
/**
 * Une valeur publiée → { brut, valeur, min, max, unite, base }. « Unknown », « - », « 0-0 », « N/A » ou vide : valeur null.
 * `unite` et `base` viennent de l'étiquette ou du texte quand ils y sont écrits ; sinon null (rien n'est déduit).
 */
export function lireValeur(brutEntree, { unite = null, base = null } = {}) {
  const brut = norm(brutEntree);
  const vide = { brut: brut || null, valeur: null, min: null, max: null, unite, base };
  if (!brut || /^(unknown|n\/a|na|-+|–|—|\?)$/i.test(brut)) return vide;
  // Qualitatif : « Trace(s) », « None » ne sont pas des nombres (jamais 0) ; « < 1% » est une borne haute, sans minimum.
  if (/^trace/i.test(brut)) return { ...vide, qualitatif: 'traces' };
  if (/^(none|nil|absent)$/i.test(brut)) return { ...vide, qualitatif: 'aucun' };
  const inf = brut.match(new RegExp(String.raw`^<\s*${NUM}\s*(%|mls?|ml|mg|µg|ug)?\s*(.*)$`, 'i'));
  if (inf) return { brut, valeur: null, min: null, max: nombre(inf[1]), unite: inf[2] ? uniteNormalisee(inf[2].toLowerCase(), inf[3]) : unite, base, borne: '<' };
  const p = brut.match(RE_PLAGE);
  if (p) {
    const min = nombre(p[1]), max = nombre(p[3]);
    if (min === 0 && max === 0) return vide;
    const u = (p[2] || p[4] || '').toLowerCase();
    return { brut, valeur: null, min: Math.min(min, max), max: Math.max(min, max), unite: u ? uniteNormalisee(u, p[5]) : unite, base };
  }
  const q = brut.match(RE_POINT);
  if (q) {
    const v = nombre(q[1]);
    const u = (q[2] || '').toLowerCase();
    return { brut, valeur: v, min: v, max: v, unite: u ? uniteNormalisee(u, q[3]) : unite, base };
  }
  return vide;
}
function uniteNormalisee(u, reste) {
  if (u === '%') return '%';
  if (/^mls?$/.test(u)) return /100\s*g/i.test(reste ?? '') ? 'mL/100 g' : 'mL';
  return u;
}
export const champVide = (brut = null) => ({ brut, valeur: null, min: null, max: null, unite: null, base: null });
export const liste = texte => [...new Set(norm(texte).split(/\s*(?:,|;|\/|\s+and\s+|\s+&\s+)\s*/i).map(norm).filter(Boolean))];
/** Tri stable et sérialisation déterministe. */
export const json = o => JSON.stringify(o, null, 1) + '\n';

// ---------- Rattachement au catalogue (lecture seule, rien n'y est écrit) ----------
import { readFileSync } from 'node:fs';
let _index = null;
/** Index { pliage(nom ou alias) → [ids] } du catalogue src/data/hopV4/proto-data.json. */
export function indexCatalogue(varietes) {
  const index = new Map();
  for (const v of varietes) for (const n of [v.name, ...(v.aliases ?? [])]) {
    const k = pliage(n); if (!k) continue;
    if (!(index.get(k) ?? []).includes(v.id)) index.set(k, [...(index.get(k) ?? []), v.id]);
  }
  return index;
}
export function catalogue() {
  if (!_index) {
    const d = JSON.parse(readFileSync(new URL('../../src/data/hopV4/proto-data.json', import.meta.url), 'utf8'));
    _index = { index: indexCatalogue(d.varieties), noms: new Map(d.varieties.map(v => [v.id, v.name])) };
  }
  return _index;
}
const SUFFIXE_PAYS = /\s*\(([A-Za-z]{2,3})\)\s*$/;
const PAYS_CATALOGUE = { DE: 'GR', GER: 'GR' };
const _sansPays = new WeakMap();
/** { pliage(nom sans son pays) → [ids] } pour les noms du catalogue qui portent un pays. */
function nomsSansPays(noms) {
  if (!_sansPays.has(noms)) {
    const m = new Map();
    for (const [id, nom] of noms) if (SUFFIXE_PAYS.test(nom)) { const k = pliage(nom.replace(SUFFIXE_PAYS, '')); m.set(k, [...(m.get(k) ?? []), id]); }
    _sansPays.set(noms, m);
  }
  return _sansPays.get(noms);
}
/**
 * Relie une fiche au catalogue sans forcer : le nom d'abord, puis chaque alias. Une résolution unique donne l'id ;
 * deux ids différents (ou un nom qui en désigne plusieurs) : null, `ambigu`. Rend { varietyId, rattachement, ambigu }.
 */
export function rattacher(nom, alias = [], index = catalogue().index, noms = catalogue().noms) {
  // Un nom avec pays (« Magnum (US) ») se lit tel quel ; faute de mieux, il se rabat sur le seul houblon du catalogue écrit sans pays.
  // Un nom sans pays qui désigne plusieurs variantes par pays (« Magnum ») reste ambigu. Le catalogue écrit GR pour l'Allemagne.
  const essai = n => {
    const texte = String(n).replace(/\s+hops?$/i, '').trim(), m = texte.match(SUFFIXE_PAYS);
    if (!pliage(texte)) return [];
    if (m) {
      const nu = texte.replace(SUFFIXE_PAYS, ''), code = (PAYS_CATALOGUE[m[1].toUpperCase()] ?? m[1].toUpperCase());
      const exact = index.get(pliage(`${nu} (${code})`)) ?? [];
      return exact.length ? exact : (index.get(pliage(nu)) ?? []).filter(id => !SUFFIXE_PAYS.test(noms.get(id) ?? ''));
    }
    return index.get(pliage(texte)) ?? (nomsSansPays(noms).get(pliage(texte)) ?? []);
  };
  const parNom = essai(nom);
  if (parNom.length === 1) return { varietyId: parNom[0], rattachement: 'nom', ambigu: null };
  if (parNom.length > 1) return { varietyId: null, rattachement: null, ambigu: parNom };
  const ids = [...new Set(alias.flatMap(a => { const r = essai(a); return r.length === 1 ? r : []; }))];
  if (ids.length === 1) {
    // Un alias seul peut tromper (le code d'un autre houblon) : si le nom n'a rien de commun avec celui du catalogue, le lien est douteux, non posé.
    const cat = noms.get(ids[0]) ?? '';
    if (pliage(nom).slice(0, 4) !== pliage(cat).slice(0, 4)) return { varietyId: null, rattachement: null, ambigu: null, douteux: ids[0] };
    return { varietyId: ids[0], rattachement: 'alias', ambigu: null };
  }
  if (ids.length > 1) return { varietyId: null, rattachement: null, ambigu: ids };
  return { varietyId: null, rattachement: null, ambigu: null };
}
