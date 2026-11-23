// Lecture des valeurs, vocabulaire commun des champs, rattachement au catalogue et écriture de la sortie (voie c3b).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from './europe-commun.mjs';

export const nettoyer = s => String(s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
export const sansAccents = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Clé de comparaison d'un nom de variété : sans accent, sans marque (®, ™), sans « hops », lettres et chiffres seuls. */
export function cleNom(s) {
  return sansAccents(String(s).toLowerCase()).replace(/[®™]/g, '').replace(/\bhops?\b/g, '').replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, '');
}

const VIDE = /^(?:|-+|–|—|n\/?a|unknown|inconnu|not\s*(?:available|specified)|tbd|0(?:\.0+)?\s*-\s*0(?:\.0+)?\s*%?)$/i;

/**
 * Lit une valeur publiée : « 8 - 14.5% », « up to 47% », « 1,1 - 2,1 ml/100 g », « 5 ».
 * Rend { brut, valeur, min, max, unite, base, qualif } ; une case vide, « Unknown », « - » ou « 0-0 » → tout à null (jamais 0).
 */
export function lireValeur(brut, { unite = null, base = null, baseLue = false } = {}) {
  const b = nettoyer(brut);
  const sortie = { brut: b, valeur: null, min: null, max: null, unite, base };
  if (base) sortie.baseLue = baseLue;
  if (VIDE.test(b) || /^(?:[a-z]+\s+)?(?:no data|n\/a)$/i.test(b)) return sortie;
  // « Trace », « Trace% », « Farnesene Trace% » : présence sans mesure — jamais 0.
  if (/^(?:[a-z]+\s+)?trace\s*%?$/i.test(b)) { sortie.qualif = 'trace'; return sortie; }
  // Libellé répété devant le nombre (« Myrcene 35-50% ») : ignoré pour la lecture, le brut le garde.
  const t = b.replace(/^(?!up to|max|min|from|approx|ca\b|jusqu)[a-zéèêà][a-zéèêà' -]*?\s+(?=[<>≤≥~]?\s*\d)/i, '').replace(/[–—]/g, '-').replace(/(\d),(\d)/g, '$1.$2');
  const num = '(\\d+(?:\\.\\d+)?)';
  let m;
  if ((m = t.match(new RegExp(`^(?:up to|max\\.?|maximum|jusqu['’]?à|<=?|≤)\\s*${num}`, 'i')))) { sortie.max = Number(m[1]); sortie.qualif = 'jusqu’à'; }
  else if ((m = t.match(new RegExp(`^(?:min\\.?|minimum|from|>=?|≥)\\s*${num}`, 'i')))) { sortie.min = Number(m[1]); sortie.qualif = 'à partir de'; }
  else if ((m = t.match(new RegExp(`^${num}\\s*(?:%|[a-zµ/ 0-9]*)?\\s*-\\s*${num}`, 'i')))) { sortie.min = Number(m[1]); sortie.max = Number(m[2]); }
  else if ((m = t.match(new RegExp(`^(?:~|≈|approx\\.?|ca\\.?)?\\s*${num}`, 'i')))) { sortie.valeur = Number(m[1]); }
  const reste = t.replace(new RegExp(`^.*?${num}(?:\\s*(?:%|[a-zµ/ 0-9]*)?\\s*-\\s*${num})?`), '').trim();
  const u = reste.match(/^\s*(%|ml\/100\s?g|µg\/kg|ug\/kg|mg\/kg|mg\/100\s?g|g\/100\s?g|ppm|µg\/L)/i);
  if (u) sortie.unite = u[1].replace(/\s+/g, ' ').replace(/^ml\//i, 'mL/').replace(/^ug\//i, 'µg/');
  if (sortie.min === 0 && sortie.max === 0) { sortie.min = null; sortie.max = null; }
  return sortie;
}

/** Vocabulaire commun des champs : nom écrit → clé stable, unité et base d'après le libellé (lue) ou l'usage (déduite). */
const CANON = [
  [/^alpha[- ]?acids?|^alpha(?: range)?\s*(?:\(|\*|$)|^α/i, 'alpha', '%', '% m/m'],
  [/^beta[- ]?acids?|^beta(?: range)?\s*(?:\(|\*|$)|^β[- ]?acid/i, 'beta', '%', '% m/m'],
  [/^humul[eè]ne ?\/ ?caryophyll/i, 'rapport_humulene_caryophyllene', null, null],
  [/^co-?hum/i, 'cohumulone', '%', '% des α'],
  [/^colupulone/i, 'colupulone', '%', '% des β'],
  [/^total polyphenols?|^polyphenols?/i, 'polyphenols', '%', '% m/m'],
  [/^xanthohumol/i, 'xanthohumol', '%', '% m/m'],
  [/^total oil|^oil content|^essential oil/i, 'huile_totale', 'mL/100 g', 'mL/100 g'],
  [/^myrcene/i, 'myrcene', '%', '% de l’huile'],
  [/^humulene/i, 'humulene', '%', '% de l’huile'],
  [/^caryophyllene/i, 'caryophyllene', '%', '% de l’huile'],
  [/^farnesene?|^farnesen|^β-?farnesene/i, 'farnesene', '%', '% de l’huile'],
  [/^linalo+l/i, 'linalol', '%', '% de l’huile'],
  [/^geraniol/i, 'geraniol', '%', '% de l’huile'],
  [/^(?:β|beta)-?pinene/i, 'beta_pinene', '%', '% de l’huile'],
  [/^selinene|^β-?selinene/i, 'selinene', '%', '% de l’huile'],
  [/^citronell/i, 'citronellol', '%', '% de l’huile'],
  [/^nerol/i, 'nerol', '%', '% de l’huile'],
  [/^terpene esters/i, 'esters_alcools_terpeniques', '%', '% de l’huile'],
  [/^ketone/i, 'cetones', '%', '% de l’huile'],
  [/^isobutyrate/i, 'isobutyrates', '%', '% de l’huile'],
  [/^thiols?/i, 'thiols', null, null],
  [/^(?:4mmp|4-mmp)/i, 'thiol_4mmp', null, null],
  [/^(?:3mh|3-mh)(?!a)/i, 'thiol_3mh', null, null],
  [/^3sh/i, 'thiol_3sh', null, null],
  [/^(?:flavou?r|aroma) intensity/i, 'intensite_arome', null, null],
  [/^hsi|^storage|^hop storage/i, 'hsi', null, null],
];

/** @returns {{cle:string, unite:string|null, base:string|null, baseLue:boolean}} */
export function canoniser(nomChamp) {
  const n = sansAccents(nettoyer(nomChamp)).replace(/\*/g, '').trim();
  const dansLibelle = n.match(/\(([^)]*)\)/)?.[1] || '';
  for (const [re, cle, unite, base] of CANON) {
    if (!re.test(n)) continue;
    let u = unite, b = base, lue = false;
    if (/% of total oil/i.test(dansLibelle)) { b = '% de l’huile'; u = '%'; lue = true; }
    else if (/µ?u?g\/kg/i.test(dansLibelle)) { u = 'µg/kg'; b = 'µg/kg'; lue = true; }
    else if (/mg\/kg/i.test(dansLibelle)) { u = 'mg/kg'; b = 'mg/kg'; lue = true; }
    else if (/ml\/100/i.test(dansLibelle)) { u = 'mL/100 g'; b = 'mL/100 g'; lue = true; }
    // Voie c3g : unité nue après le libellé, sans parenthèses (fiches HopFrance : « TOTAL OILS ml/100g », « FARNESENE mg/100g »).
    else if (/\bmg\/100\s?g\b/i.test(n)) { u = 'mg/100 g'; b = 'mg/100 g'; lue = true; }
    else if (/\bml\/100\s?g\b/i.test(n)) { u = 'mL/100 g'; b = 'mL/100 g'; lue = true; }
    return { cle, unite: u, base: b, baseLue: lue };
  }
  const libre = n.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return { cle: libre || 'champ', unite: null, base: null, baseLue: false };
}

/** Champ complet : nom écrit + valeur lue + base. Si la clé existe déjà, un suffixe numérique évite l'écrasement. */
export function poserChamp(champs, nomChamp, brut, plus = {}) {
  const c = canoniser(nomChamp);
  let cle = c.cle, i = 2;
  while (champs[cle]) cle = `${c.cle}_${i++}`;
  champs[cle] = { nom: nettoyer(nomChamp), ...lireValeur(brut, c), ...plus };
  return cle;
}

// ───────────────────────── Rattachement au catalogue ─────────────────────────

let catalogue = null;
export async function chargerCatalogue() {
  if (catalogue) return catalogue;
  const d = JSON.parse(await readFile(resolve(import.meta.dirname, '../../src/data/hopV4/proto-data.json'), 'utf8'));
  const parNom = new Map(), parAlias = new Map();
  const ajouter = (m, k, id) => { if (!k) return; if (!m.has(k)) m.set(k, new Set()); m.get(k).add(id); };
  for (const v of d.varieties) {
    ajouter(parNom, cleNom(v.name), v.id);
    for (const a of v.aliases || []) ajouter(parAlias, cleNom(a), v.id);
  }
  catalogue = { parNom, parAlias, n: d.varieties.length, noms: new Map(d.varieties.map(v => [v.id, v.name])) };
  return catalogue;
}

/**
 * Résout une fiche sans forcer : nom exact d'abord, puis alias (nom ou code) ; deux candidats ou aucun → varietyId null.
 * Rend { varietyId, via, candidats }.
 */
export async function rattacher(nom, codes = []) {
  const c = await chargerCatalogue();
  const essais = [[cleNom(nom), c.parNom, 'nom'], [cleNom(nom), c.parAlias, 'alias']];
  for (const code of codes) essais.push([cleNom(code), c.parNom, 'code=nom'], [cleNom(code), c.parAlias, 'code=alias']);
  for (const [k, m, via] of essais) {
    const ids = k && m.get(k);
    if (!ids) continue;
    if (ids.size === 1) return { varietyId: [...ids][0], via, candidats: [] };
    return { varietyId: null, via: `ambigu(${via})`, candidats: [...ids].sort() };
  }
  return { varietyId: null, via: 'absent', candidats: [] };
}

// ───────────────────────── Sortie ─────────────────────────

/** Écrit src/data/hopSources/<source>.json (découpé par lettre au-delà de 2 Mo). Rend le sha256 du contenu écrit. */
export async function ecrireSortie(source, entete, fiches, { dossier = resolve(import.meta.dirname, '../../src/data/hopSources') } = {}) {
  fiches.sort((a, b) => a.nom.localeCompare(b.nom, 'en') || a.url.localeCompare(b.url));
  const releve = fiches.map(f => f.releve).filter(Boolean).sort().at(-1) || null;
  const texte = JSON.stringify({ source: { ...entete, releve }, fiches }, null, 1) + '\n';
  await mkdir(dossier, { recursive: true });
  const fichiers = [];
  if (Buffer.byteLength(texte) <= 2 * 1024 * 1024) {
    await writeFile(resolve(dossier, `${source}.json`), texte);
    fichiers.push([`${source}.json`, texte]);
  } else {
    const lettres = new Map();
    for (const f of fiches) { const l = (sansAccents(f.nom)[0] || '_').toUpperCase().replace(/[^A-Z0-9]/, '_'); (lettres.get(l) || lettres.set(l, []).get(l)).push(f); }
    for (const [l, fs] of [...lettres].sort()) {
      const t = JSON.stringify({ source: { ...entete, releve, partie: l }, fiches: fs }, null, 1) + '\n';
      await writeFile(resolve(dossier, `${source}-${l}.json`), t);
      fichiers.push([`${source}-${l}.json`, t]);
    }
  }
  const sha256 = fichiers.length === 1 ? sha(fichiers[0][1]) : sha(fichiers.map(([n, t]) => n + '\n' + t).join('\n'));
  return { sha256, fichiers: fichiers.map(([n, t]) => [n, Buffer.byteLength(t)]), nbFiches: fiches.length };
}
