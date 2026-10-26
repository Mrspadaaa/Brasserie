// Voie c3c (#180) : outils communs de collecte (fournisseurs américains et océaniens).
// Tout téléchargement passe par readHopSource (scripts/hop-source-cache.mjs) : cache brut + reçu sha256.
// Aucun code de l'app n'importe ce fichier.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readHopSource, digest, offlineMode } from '../hop-source-cache.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
export const racine = resolve(ici, '..', '..');
export const CACHE = resolve(process.env.HOP_SOURCE_CACHE || 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources');
export const SORTIE = resolve(racine, 'src/data/hopSources');
export const VOIE = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/c3c-amerique-oceanie');
export const hors_ligne = offlineMode;

/* ---------- Lecture polie ---------- */
const dernier = new Map();           // hôte → instant de la dernière requête réseau
const arretes = new Map();           // hôte → raison de l'arrêt (401, 403, 429, défi)
export const journal = { reponses: [], absents: [], arretes: [] };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const hote = url => new URL(url).host;
const enCache = url => {
  const p = resolve(CACHE, digest(url));
  try { return existsSync(p) && existsSync(p + '.json') && JSON.parse(readFileSync(p + '.json', 'utf8')).sha256 === digest(readFileSync(p, 'utf8')); } catch { return false; }
};
const DEFI = /Security Checkpoint|Just a moment|cf-challenge|Attention Required|captcha-delivery|Access denied/i;

/** Lit une page publique. Renvoie null si elle est absente (404/410) ; lève si l'hôte est arrêté. */
export async function lire(url, { binaire = false } = {}) {
  const h = hote(url);
  if (arretes.has(h)) throw Error(`Hôte arrêté (${arretes.get(h)}) : ${h}`);
  const hl = hors_ligne();
  if (!hl && !enCache(url)) {
    const delta = Date.now() - (dernier.get(h) || 0);
    if (delta < 1100) await attendre(1100 - delta);   // 1 requête par seconde et par hôte, jamais en parallèle
    dernier.set(h, Date.now());
  }
  try {
    if (binaire) return await lirePdfBinaire(url, hl);
    const r = await readHopSource(url, { cache: CACHE, offline: hl });
    if (!hl && DEFI.test(r.content.slice(0, 4000)) && r.content.length < 20000) {
      arretes.set(h, 'défi anti-robot'); journal.arretes.push({ hote: h, raison: 'défi anti-robot', url });
      throw Error(`Défi anti-robot : ${h}`);
    }
    journal.reponses.push({ url, statut: 200 });
    return r;
  } catch (e) {
    const m = /\((\d{3})\)/.exec(e.message);
    if (m) {
      const code = Number(m[1]);
      journal.reponses.push({ url, statut: code });
      if ([401, 403, 429].includes(code)) { arretes.set(h, code); journal.arretes.push({ hote: h, raison: code, url }); throw Error(`Hôte arrêté (${code}) : ${h}`); }
      if (code === 404 || code === 410) { journal.absents.push(url); return null; }
    }
    if (/Hors ligne : source absente/.test(e.message) && chargerJournalAbsents().has(url)) return null;
    throw e;
  }
}

let absentsConnus = null;
function chargerJournalAbsents() {
  if (absentsConnus) return absentsConnus;
  absentsConnus = new Set();
  try { for (const f of ['journal-collecte.json']) { const j = JSON.parse(readFileSync(join(VOIE, f), 'utf8')); for (const s of Object.values(j.sources || {})) for (const u of s.absents || []) absentsConnus.add(u); } } catch { /* pas encore de journal */ }
  return absentsConnus;
}

/** PDF : octets stockés en base64 dans le cache (même reçu : sha256 du fichier du cache), décodés vers un fichier temporaire. */
async function lirePdfBinaire(url, hl) {
  const chemin = resolve(CACHE, digest(url));
  if (!enCache(url)) {
    if (hl) throw Error(`Hors ligne : source absente du cache (${CACHE}) : ${url}`);
    const rep = await fetch(url, { signal: AbortSignal.timeout(40000), headers: { 'User-Agent': 'LAffinee-Hop-Reference-Audit/1.0' } });
    if (!rep.ok) throw Error(`Source non accessible (${rep.status}) : ${url}`);
    const base64 = Buffer.from(await rep.arrayBuffer()).toString('base64');
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(chemin, base64);
    writeFileSync(chemin + '.json', JSON.stringify({ url, retrievedAt: new Date().toISOString(), sha256: digest(base64), encoding: 'base64' }, null, 2));
  }
  const meta = JSON.parse(readFileSync(chemin + '.json', 'utf8')), contenu = readFileSync(chemin, 'utf8');
  if (meta.sha256 !== digest(contenu)) throw Error(`Reçu sha256 différent du contenu en cache : ${url}`);
  journal.reponses.push({ url, statut: 200 });
  return { content: contenu, ...meta, octets: Buffer.from(contenu, 'base64') };
}

/** Texte d'un PDF (pdftotext du poste, déjà installé ; aucun paquet ajouté). Vide si le PDF est une image. */
export function textePdf(octets, { disposition = true } = {}) {
  const dossier = mkdtempSync(join(tmpdir(), 'c3c-pdf-'));
  try {
    const f = join(dossier, 'x.pdf'); writeFileSync(f, octets);
    return execFileSync('pdftotext', ['-enc', 'UTF-8', ...(disposition ? ['-layout'] : []), f, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch { return ''; } finally { rmSync(dossier, { recursive: true, force: true }); }
}

/* ---------- robots.txt ---------- */
/** Règles `User-agent: *` d'un robots.txt (lu par le cache). Renvoie une fonction permis(chemin). */
export async function robots(origine) {
  const r = await lire(origine + '/robots.txt').catch(() => null);
  const regles = [];
  if (r) {
    let actif = false, derniereRegle = false;
    for (const brut of r.content.split(/\r?\n/)) {
      const l = brut.replace(/#.*/, '').trim(); if (!l) continue;
      const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(l); if (!m) continue;
      const k = m[1].toLowerCase(), v = m[2].trim();
      if (k === 'user-agent') { if (derniereRegle) { actif = false; derniereRegle = false; } if (v === '*') actif = true; }
      else if (k === 'disallow' || k === 'allow') { derniereRegle = true; if (actif && v) regles.push({ permis: k === 'allow', motif: v }); }
    }
  }
  const versRegex = m => new RegExp('^' + m.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const compile = regles.map(r => ({ ...r, re: versRegex(r.motif) }));
  return chemin => { let meilleur = null; for (const r of compile) if (r.re.test(chemin) && (!meilleur || r.motif.length > meilleur.motif.length)) meilleur = r; return !meilleur || meilleur.permis; };
}

/* ---------- Texte et valeurs ---------- */
const NOMMEES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', trade: '™', reg: '®', deg: '°', eacute: 'é', egrave: 'è', oacute: 'ó' };
export const decoder = s => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&([a-z]+);/gi, (m, n) => NOMMEES[n.toLowerCase()] ?? m);

/** Lignes de texte visible d'un HTML (sans script ni style), une par bloc. */
export function lignes(html) {
  return decoder(html.replace(/<(script|style|noscript|svg|template|title)[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d|section|td|th|dt|dd|ul|ol|table|article|header|footer|span|a|label)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export const sansAccent = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const cle = s => sansAccent(String(s)).toLowerCase().replace(/[®™©]/g, '').replace(/\bc\.v\.?/g, ' ').replace(/[^a-z0-9]+/g, '');
const num = s => Number(String(s).replace(',', '.'));

/**
 * Lit un texte de valeur publié : « 15.7 – 19.8 », « 6.5-9.4% », « <1.0 % », « 21% », « 1.5 - 2.3 mL/100g ».
 * Rend { brut, valeur, min, max, unite } ; « Unknown », « - », « 0-0 », vide → valeur, min, max à null (jamais 0).
 */
export function lireValeur(brut, { base = null } = {}) {
  const t = decoder(String(brut ?? '')).replace(/\s+/g, ' ').trim();
  const sortie = { brut: t, valeur: null, min: null, max: null, unite: null, base };
  const sans = t.replace(/[–—−]/g, '-');
  if (/^(unknown|n\/?a|inconnu|-+|)$/i.test(sans) || /^0(\.0+)?\s*-\s*0(\.0+)?\s*(%|m[lL]s?\s*\/\s*100\s*g)?$/.test(sans)) return sortie;
  const unite = /(%|m[lL]s?\s*\/\s*100\s*g|ppm|mg\/kg|µg\/kg|ml)/.exec(sans);
  if (unite) sortie.unite = /^%$/.test(unite[1]) ? '%' : /ppm|mg|µg/.test(unite[1]) ? unite[1] : 'mL/100 g';
  let m;
  if ((m = /^([>≥])\s*(\d+(?:[.,]\d+)?)/.exec(sans))) { sortie.min = num(m[2]); sortie.operateur = '>'; }
  else if ((m = /^([<≤]|&lt;)\s*(\d+(?:[.,]\d+)?)/.exec(sans))) { sortie.max = num(m[2]); sortie.operateur = '<'; }
  else if ((m = /(\d+(?:[.,]\d+)?)\s*(?:-|to|à)\s*(\d+(?:[.,]\d+)?)/i.exec(sans))) { sortie.min = num(m[1]); sortie.max = num(m[2]); }
  else if ((m = /(\d+(?:[.,]\d+)?)/.exec(sans))) sortie.valeur = num(m[1]);
  return sortie;
}

/** Nom de champ publié → clé stable. */
export function cleChamp(libelle) {
  const t = sansAccent(libelle).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-zβ0-9]+/g, ' ').trim();
  if (/^(alpha|aa\b)|alpha acid/.test(t)) return 'alpha';
  if (/pinene/.test(t)) return 'betaPinene';
  if (/^beta|beta acid/.test(t)) return 'beta';
  if (/co ?humulone/.test(t)) return 'cohumulone';
  if (/colupulone/.test(t)) return 'colupulone';
  if (/total oil|^oil|^oils|huile/.test(t)) return 'huileTotale';
  if (/myrcene/.test(t)) return 'myrcene';
  if (/humu?lene|humuluene/.test(t)) return 'humulene';
  if (/caryophyl/.test(t)) return 'caryophyllene';
  if (/farnesene/.test(t)) return 'farnesene';
  if (/linalo/.test(t)) return 'linalol';
  if (/geraniol/.test(t)) return 'geraniol';
  if (/selinene/.test(t)) return 'selinene';
  if (/citronellol/.test(t)) return 'citronellol';
  if (/\bnerol\b/.test(t)) return 'nerol';
  if (/xanthohumol/.test(t)) return 'xanthohumol';
  if (/storage|hsi|conservation/.test(t)) return 'conservation';
  if (/yield/.test(t)) return 'rendement';
  if (/maturity/.test(t)) return 'maturite';
  return t.split(' ').map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join('') || 'champ';
}

/** Base publiée dans le libellé (« % of alpha acids », « % of whole oil »), sinon null. */
export function baseDuLibelle(libelle) {
  const t = libelle.toLowerCase();
  if (/of (the )?alpha|as % of alpha|% of -?acids?|des α/.test(t)) return '% des α';
  if (/of (the |whole |total )+oil|% de l.huile/.test(t)) return "% de l'huile";
  if (/m[lL]\s*\/\s*100/.test(t)) return 'mL/100 g';
  return null;
}
/** Base habituelle quand la source ne la dit pas : marquée « implicite », jamais confondue avec une base publiée. */
export const baseImplicite = k => ({ cohumulone: '% des α', colupulone: '% des β', myrcene: "% de l'huile", humulene: "% de l'huile", caryophyllene: "% de l'huile", farnesene: "% de l'huile", linalol: "% de l'huile", geraniol: "% de l'huile", selinene: "% de l'huile", betaPinene: "% de l'huile", huileTotale: 'mL/100 g', alpha: '% (poids)', beta: '% (poids)' })[k] ?? null;

/** Un champ complet pour champs{} : nom tel qu'écrit + valeur lue. */
export function champ(libelle, brut, { contexte = null } = {}) {
  const k = cleChamp(libelle), v = lireValeur(brut, { base: baseDuLibelle(libelle) });
  if (v.unite == null && v.base && /^%/.test(v.base)) v.unite = '%';
  if (v.unite == null && /\(%\)/.test(libelle)) v.unite = '%';
  if (v.unite == null && /m[lL]\s*\/\s*100/.test(libelle)) v.unite = 'mL/100 g';
  if (v.base == null && !(k === 'huileTotale' && v.unite === '%')) { const b = baseImplicite(k); if (b) v.baseImplicite = b; }
  return { cle: k, valeur: { champ: libelle.trim(), ...v, ...(contexte ? { contexte } : {}) } };
}

const NOMBRE_OU_PLAGE = /^([<>≤≥]\s*)?\d+([.,]\d+)?(\s*[–—-]\s*\d+([.,]\d+)?)?\s*(%|m[lL]s?\s*\/\s*100\s*g|ml)?(\s*\([^)]*\))?(\s*of .*)?$/i;
export const ressembleValeur = s => NOMBRE_OU_PLAGE.test(decoder(s).trim()) || /^(unknown|n\/a|-|—)$/i.test(s.trim());

/** Rassemble libellé/valeur dans une suite de lignes, pour les libellés connus. */
export function champsDepuisLignes(l, { libelles = /^(alpha|beta|co-?humulone|colupulone|total oils?|oil|myrcene|humulene|caryophyl\w*|farnesene|linalool|geraniol|selinene|citronellol|nerol|storage|hsi)\b/i } = {}) {
  const champs = {};
  for (let i = 0; i < l.length - 1; i++) {
    if (!libelles.test(l[i]) || l[i].length > 60) continue;
    const suivant = l[i + 1];
    if (!ressembleValeur(suivant) && !/^[A-Za-z ]+$/.test(suivant)) continue;
    if (/^[A-Za-z ]+$/.test(suivant) && !/^(very good|good|fair|poor|excellent|moderate|low|high|medium|unknown)$/i.test(suivant)) continue;
    const { cle: k, valeur } = champ(l[i], suivant);
    if (!(k in champs)) champs[k] = valeur;
  }
  return champs;
}

/** Liste de mots courts à partir d'une ligne séparée par virgules, « and », points-virgules ou barres. */
export const listeDe = s => decoder(s).split(/\s*(?:,|;|\/|\band\b|\||•)\s*/i).map(x => x.replace(/\.$/, '').trim()).filter(x => x && x.length <= 40);

/* ---------- Catalogue (lecture seule, pour rattacher sans forcer) ---------- */
let index = null;
export function rattacher(...noms) {
  if (!index) {
    index = new Map();
    const cat = JSON.parse(readFileSync(resolve(racine, 'src/data/hopV4/proto-data.json'), 'utf8')).varieties;
    for (const v of cat) for (const n of [v.name, ...(v.aliases || [])]) { const k = cle(n); if (!k) continue; if (!index.has(k)) index.set(k, new Set()); index.get(k).add(v.id); }
  }
  const trouves = new Set(); let ambigu = false;
  for (const n of noms.filter(Boolean)) { const s = index.get(cle(n)); if (!s) continue; if (s.size > 1) ambigu = true; for (const id of s) trouves.add(id); }
  return { varietyId: !ambigu && trouves.size === 1 ? [...trouves][0] : null, ambigu: ambigu || trouves.size > 1, candidats: [...trouves] };
}

/** Variantes d'un nom publié pour le rattachement : sans code d'obtenteur, sans marque, sans préfixe de pays. Seul un rattachement unique est gardé. */
export function variantesDeNom(nom) {
  const sortie = new Set();
  let n = decoder(String(nom)).replace(/[®™]/g, '').trim();
  const pas = [
    x => x.replace(/\s*[-–]\s*(Estate Grown|Organic|Cryo|CGX|T-?90).*$/i, ''),
    x => x.replace(/^(Organic|Hop Revolution|HopRev)\s+/i, ''),
    x => x.replace(/\s*\([^)]*\)\s*$/, ''),
    x => x.replace(/\s+c\.v\.?$/i, ''),
    x => x.replace(/\s+(HBC|YCR|YQH|VGXP|ADHA|USDA)[-\s]?[A-Z0-9-]*$/i, ''),
    x => x.replace(/^(GR|NZ|AU|CZ|SI|FR|UK|US|DE|EU|Czech|German|American)\s+/i, ''),
  ];
  const CODES = { GR: 'GR', DE: 'GR', German: 'GR', US: 'US', American: 'US', CZ: 'CZ', Czech: 'CZ', NZ: 'NZ', AU: 'AU', UK: 'UK', SI: 'SI', FR: 'FR' };
  const prefixe = /^(GR|DE|German|US|American|CZ|Czech|NZ|AU|UK|SI|FR)\s+(.+)$/i.exec(n);
  for (const p of pas) { n = p(n).trim(); if (n) sortie.add(n); }
  // Le catalogue qualifie l'origine entre parenthèses : « GR Perle » → « Perle (GR) » ; « Hallertauer Magnum » → « Magnum (GR) » ; « Mt. » → « Mount ».
  if (prefixe) { const code = CODES[Object.keys(CODES).find(k => k.toLowerCase() === prefixe[1].toLowerCase())]; if (code) sortie.add(`${prefixe[2].replace(/\s+(HBC|YCR|YQH|VGXP|ADHA|USDA)[-\s]?[A-Z0-9-]*$/i, '').trim()} (${code})`); }
  const suffixe = /^(.+?)\s+(GR|DE|US|CZ|NZ|AU|UK|SI|FR)$/i.exec(n);   // « Fuggles Us » → « Fuggles (US) »
  if (suffixe) sortie.add(`${suffixe[1]} (${CODES[suffixe[2].toUpperCase()] ?? suffixe[2].toUpperCase()})`);
  const hall = /^Hallertau(?:er)?\s+(.+)$/i.exec(n); if (hall) sortie.add(`${hall[1]} (GR)`);
  for (const v of [...sortie]) if (/^Mt\.?\s/i.test(v)) sortie.add(v.replace(/^Mt\.?\s/i, 'Mount '));
  return [...sortie];
}

/* ---------- Sortie ---------- */
export function fiche({ nom, alias = [], url, releve, publie = null, champs = {}, listes = {}, extra = {} }) {
  const r = rattacher(nom, ...alias, ...variantesDeNom(nom));
  const vide = {};
  for (const [k, v] of Object.entries(listes)) if (Array.isArray(v) && v.length) vide[k] = v;
  return { nom: nom.replace(/[®™]/g, '').trim(), alias, varietyId: r.varietyId, ...(r.ambigu ? { rattachementAmbigu: r.candidats } : {}), url, releve, publie, ...extra, champs, listes: vide };
}
export const releveDe = r => (r.retrievedAt || '').slice(0, 10);

export function ecrire(source, fiches, { decoupe = false } = {}) {
  mkdirSync(SORTIE, { recursive: true });
  fiches.sort((a, b) => (a.nom + a.url).localeCompare(b.nom + b.url));
  const releves = fiches.map(f => f.releve).filter(Boolean).sort();
  const doc = { source: { ...source, releve: releves.at(-1) ?? null }, fiches };
  const texte = JSON.stringify(doc, null, 2) + '\n';
  const chemin = resolve(SORTIE, `${source.id}.json`);
  if (decoupe) throw Error('Découpage par lettre non implémenté : fichier trop gros ?');
  writeFileSync(chemin, texte);
  if (texte.length > 2_000_000) console.error(`ATTENTION : ${chemin} dépasse 2 Mo (${texte.length}) : à découper.`);
  const sha = createHash('sha256').update(texte).digest('hex');
  console.log(`${source.id} : ${fiches.length} fiches, ${texte.length} octets, sha256 ${sha}`);
  return { chemin, sha, doc };
}

/** Journal des réponses de la source, écrit seulement en ligne (le journal sert à l'hors ligne pour les pages absentes). */
export function ecrireJournal(id, hotes) {
  if (hors_ligne()) return;
  const chemin = join(VOIE, 'journal-collecte.json');
  let j = { sources: {} };
  try { j = JSON.parse(readFileSync(chemin, 'utf8')); } catch { /* neuf */ }
  const parStatut = {};
  for (const r of journal.reponses) parStatut[r.statut] = (parStatut[r.statut] || 0) + 1;
  j.sources[id] = { hotes, statuts: parStatut, absents: [...new Set(journal.absents)].sort(), arretes: journal.arretes };
  writeFileSync(chemin, JSON.stringify(j, null, 2) + '\n');
}
