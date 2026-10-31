// Voie a1-proposition (D222) : la typicité d'un fermentescible pour un style, dérivée de Beer Analytics. Même démarche que les houblons
// (scripts/collecte-hop/typicite-styles.mjs, voie f9).
//   node scripts/collecte-malt/typicite-malts.mjs --telecharger   complète le cache (une requête à la fois, 2,1 s entre deux), range les relevés
//                                                                 dans src/data/fermentableSources/ puis écrit la table
//   node scripts/collecte-malt/typicite-malts.mjs                 recalcule la table depuis les relevés (sans réseau)
//   node scripts/collecte-malt/typicite-malts.mjs --verifier      recalcule et compare au fichier écrit (sortie : TYPICITE MALTS OK / TYPICITE MALTS ECART)
// Ce que le site publie (mesuré le 31.10.2026) : le sitemap liste 238 pages /fermentables/<catégorie>/<nom>/ (grain 114, fruit 62, épices 43,
// sucre 17, extrait 1). Chaque page cite, dans `data-chart`, des fichiers JSON publics (Plotly) : color-histogram, amount-percent-range, popularity,
// typical-styles-relative, typical-styles-absolute, amount-used-per-style. On ne lit que `typical-styles-relative` (« Used in % of the Style's Recipes » :
// la part des recettes du style qui contiennent ce fermentescible) et, dans l'en-tête de la page, le nom, le type et le nombre de recettes.
// Le site ne publie que les 16 styles où le fermentescible pèse le plus : un style absent n'est PAS 0, c'est « au plus la plus petite part
// publiée » (`p16`). L'absent reste inconnu, avec sa borne.
// robots.txt : tout permis sauf /wa/. Requêtes polies : une seule à la fois, 2,1 s d'écart, arrêt net sur 401/403/429 ou page de défi.
// Licence des données : CC BY-SA 4.0 (Beer Analytics, www.beer-analytics.com). Le fichier dérivé la porte dans son en-tête ; à partager dans les mêmes conditions.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER_RELEVES = join(RACINE, 'src', 'data', 'fermentableSources');
const RELEVES = join(DOSSIER_RELEVES, 'beeranalytics-fermentables.json');
const SORTIE = join(RACINE, 'src', 'data', 'fermentables', 'typicite-styles.json');
// Les noms, catégories et tailles d'échantillon ne servent qu'au test de cohérence : hors de la table que la page charge (voie a1, relecture).
const SORTIE_NOMS = join(RACINE, 'src', 'data', 'fermentables', 'fermentescibles.json');
const STYLES_BJCP = join(RACINE, 'src', 'data', 'brewingStylesBootstrap.json');
const CACHE = resolve(process.env.MALT_SOURCE_CACHE || join(tmpdir(), 'affinee-malt-sources'));
const ORIGINE = 'https://www.beer-analytics.com';
const ESPACE_MS = 2100;
/** Catégories collectées : le stock de L'Affinée a des malts et céréales (grain), des sucres (sugar, extract), des fruits (fruit). Les épices ne sont pas des fermentescibles du champ. */
const CATEGORIES = ['grain', 'sugar', 'extract', 'fruit'];

// Six décimales : à quatre, la part publiée de l'acerola (0,000025) devenait 0 — une part publiée n'est jamais écrasée en zéro.
const arrondi = (x) => (x > 0 ? Math.max(Math.round(x * 1e6) / 1e6, 1e-6) : x);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const sansAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
const cleStyle = (s) => sansAccent(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Téléchargement (cache temporaire, hors dépôt) ---------- */
const DEFI = /Security Checkpoint|Just a moment|cf-challenge|Attention Required|captcha-delivery|Access denied/i;
async function lire(url, etat) {
  const p = join(CACHE, sha(url));
  if (existsSync(p) && existsSync(`${p}.json`)) {
    const meta = JSON.parse(readFileSync(`${p}.json`, 'utf8')), content = readFileSync(p, 'utf8');
    if (meta.sha256 === sha(content)) return { content, ...meta, depuisCache: true };
  }
  const delai = etat.dernier + ESPACE_MS - Date.now();
  if (delai > 0) await attendre(delai);
  etat.dernier = Date.now();
  // Un délai dépassé se retente deux fois (5 s puis 10 s de pause), toujours une seule requête à la fois ; au troisième échec, arrêt (la reprise relit le cache).
  let rep;
  for (let essai = 1; ; essai++) {
    try { rep = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'LAffinee-Fermentable-Reference/1.0 (usage prive, une requete toutes les 2 s)' } }); break; }
    catch (e) { if (essai >= 3) throw e; await attendre(5000 * essai); etat.dernier = Date.now(); }
  }
  if ([401, 403, 429].includes(rep.status)) throw Object.assign(Error(`Arrêt poli : ${rep.status} sur ${url}`), { arret: true });
  if (!rep.ok) throw Error(`Source non accessible (${rep.status}) : ${url}`);
  const content = await rep.text();
  if (content.length < 20000 && DEFI.test(content)) throw Object.assign(Error(`Arrêt poli : page de défi sur ${url}`), { arret: true });
  const meta = { url, retrievedAt: new Date().toISOString(), sha256: sha(content) };
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(p, content); writeFileSync(`${p}.json`, JSON.stringify(meta));
  etat.requetes++;
  return { content, ...meta, depuisCache: false };
}

/** Pages à collecter, depuis le sitemap. */
export function pagesDuSitemap(xml) {
  const sortie = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = /^https:\/\/www\.beer-analytics\.com\/fermentables\/([a-z_]+)\/([^/]+)\/$/.exec(m[1]);
    if (u && CATEGORIES.includes(u[1])) sortie.push({ url: m[1], categorie: u[1], slug: u[2] });
  }
  return sortie.sort((a, b) => a.url.localeCompare(b.url));
}
const NOMMEES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decoder = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&([a-z]+);/gi, (m, n) => NOMMEES[n.toLowerCase()] ?? m);
/** En-tête d'une page : nom, type, nombre de recettes, adresse du graphique des styles. */
export function lirePage(html) {
  const h1 = /<h1>([^<]*)<\/h1>/.exec(html);
  if (!h1) return null;
  const details = {};
  const entete = /<dl class="detail-info">([\s\S]*?)<\/dl>/.exec(html)?.[1] ?? '';
  for (const m of entete.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) details[decoder(m[1].replace(/<[^>]+>/g, '')).replace(/:\s*$/, '').trim()] = decoder(m[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  const n = Number(String(details.Recipes ?? '').replace(/,/g, ''));
  const graphique = /data-chart="([^"]*typical-styles-relative\.json)"/.exec(html)?.[1] ?? null;
  return { nom: decoder(h1[1]).trim(), type: details.Type ?? null, recettes: Number.isFinite(n) && n > 0 ? n : null, graphique };
}
/** Le graphique `typical-styles-relative` → [{ style, part }] (null : « no_data »). */
export function lireStylesRelatifs(json) {
  if (!json || json.no_data) return null;
  const t = json.data?.[0];
  if (!t || !Array.isArray(t.x) || !Array.isArray(t.y)) return null;
  return t.x.map((x, i) => ({ style: String(x), part: t.y[i] })).filter((s) => Number.isFinite(s.part));
}

async function telecharger() {
  const etat = { dernier: 0, requetes: 0 };
  const sitemap = await lire(`${ORIGINE}/sitemap.xml`, etat);
  const pages = pagesDuSitemap(sitemap.content);
  console.log(`${pages.length} pages de fermentescibles au sitemap (${CATEGORIES.join(', ')}).`);
  const fiches = [];
  let releve = '';
  for (const [i, p] of pages.entries()) {
    const page = await lire(p.url, etat);
    const d = lirePage(page.content);
    if (!d) throw Error(`Page illisible : ${p.url}`);
    let parStyle = null, graphiqueSha = null;
    if (d.graphique) {
      const g = await lire(new URL(d.graphique, ORIGINE).href, etat);
      graphiqueSha = g.sha256;
      parStyle = lireStylesRelatifs(JSON.parse(g.content));
      if (g.retrievedAt > releve) releve = g.retrievedAt;
    }
    if (page.retrievedAt > releve) releve = page.retrievedAt;
    fiches.push({ slug: p.slug, categorie: p.categorie, nom: d.nom, type: d.type, recettes: d.recettes, url: p.url, sha256Graphique: graphiqueSha, parStyle });
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${pages.length} (${etat.requetes} requêtes réelles)`);
  }
  mkdirSync(DOSSIER_RELEVES, { recursive: true });
  const releves = {
    source: { id: 'beeranalytics', nom: 'Beer Analytics', url: ORIGINE, licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', releve: releve.slice(0, 10),
      conditions: 'robots.txt : tout permis sauf /wa/ ; pages et JSON de graphiques publics ; une requête à la fois, 2,1 s d\'écart',
      graphique: 'typical-styles-relative : part des recettes du style qui contiennent ce fermentescible (fraction de 0 à 1), les 16 styles où il pèse le plus',
      collecte: 'scripts/collecte-malt/typicite-malts.mjs --telecharger' },
    fiches,
  };
  writeFileSync(RELEVES, `{"source":${JSON.stringify(releves.source)},"fiches":[\n${fiches.map((f) => JSON.stringify(f)).join(',\n')}\n]}\n`);
  console.log(`Relevés écrits : ${fiches.length} fiches, ${etat.requetes} requêtes réelles.`);
}

/* ---------- Calcul de la table ---------- */
/** Les styles de l'app (BJCP 2021) qui ont un nom unique : code → nom anglais. Les codes à sous-styles (21B, 27A) portent plusieurs lignes : sans correspondance sûre, sans donnée. */
function stylesDeLApp() {
  const bjcp = JSON.parse(readFileSync(STYLES_BJCP, 'utf8')).find((g) => g.id === 'styles-bjcp-2021').styles;
  const parCode = new Map();
  for (const s of bjcp) (parCode.get(s.code) ?? parCode.set(s.code, []).get(s.code)).push(s.name);
  return Object.fromEntries([...parCode].filter(([, n]) => n.length === 1).map(([c, n]) => [c, n[0]]).sort(([a], [b]) => a.localeCompare(b)));
}
/** Noms de Beer Analytics qui s'écrivent autrement que le BJCP 2021 (vérifié sur les relevés). */
export const ALIAS_STYLES = {};
/** Styles voisins : les stouts se lisent entre eux (le malt chocolat et l'orge torréfiée sont typés dans toutes les stouts, que le site cite ou non la 15B parmi leurs 16 premiers styles). Un voisin pèse moitié moins que le style visé. [H] */
const STOUTS = ['15B', '15C', '16A', '16B', '16C', '16D', '20B', '20C'];
export const VOISINS = Object.fromEntries(STOUTS.map((c) => [c, STOUTS.filter((x) => x !== c)]));
export const POIDS_VOISIN = 0.5;

export function calculer() {
  const lu = JSON.parse(readFileSync(RELEVES, 'utf8'));
  const nomsApp = stylesDeLApp();
  const parNomBA = new Map();
  for (const f of lu.fiches) for (const s of f.parStyle ?? []) parNomBA.set(cleStyle(s.style), s.style);
  const styles = {}, codeDe = new Map();
  for (const [code, nom] of Object.entries(nomsApp)) {
    const ba = parNomBA.get(cleStyle(ALIAS_STYLES[code] ?? nom));
    if (ba) { styles[code] = ba; codeDe.set(ba, code); }
  }
  const parts = {}, p16 = {}, recettes = {}, fermentescibles = {};
  let avecGraphique = 0;
  for (const f of lu.fiches) {
    fermentescibles[f.slug] = { nom: f.nom, categorie: f.categorie, type: f.type };
    if (f.recettes) recettes[f.slug] = f.recettes;
    if (!f.parStyle?.length) continue;
    avecGraphique++;
    p16[f.slug] = arrondi(Math.min(...f.parStyle.map((s) => s.part)));
    for (const s of f.parStyle) { const code = codeDe.get(s.style); if (code) (parts[code] ??= {})[f.slug] = arrondi(s.part); }
  }
  const classe = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  const stylesAvecParts = Object.keys(parts).sort();
  const table = {
    source: { ...lu.source, derive: 'Table dérivée, générée par scripts/collecte-malt/typicite-malts.mjs depuis src/data/fermentableSources/beeranalytics-fermentables.json. À citer et à partager dans les mêmes conditions (CC BY-SA 4.0).' },
    lecture: 'parts[code BJCP du style][identifiant du fermentescible] = part des recettes du style qui contiennent ce fermentescible (de 0 à 1). Un style absent de la liste d’un fermentescible est INCONNU, jamais 0 : il vaut au plus `p16[identifiant]`, la plus petite part publiée pour ce fermentescible. Un code BJCP absent de `styles` n’a pas de correspondance sûre chez Beer Analytics (sous-styles) : inconnu.',
    couverture: { fermentescibles: lu.fiches.length, avecGraphique, stylesBjcpRattaches: Object.keys(styles).length, stylesAvecParts: stylesAvecParts.length, stylesBeerAnalyticsVus: parNomBA.size },
    styles: classe(Object.fromEntries(stylesAvecParts.map((c) => [c, styles[c]]))),
    voisins: VOISINS, poidsVoisin: POIDS_VOISIN,
    p16: classe(p16),
    parts: classe(Object.fromEntries(stylesAvecParts.map((c) => [c, classe(parts[c])]))),
  };
  const noms = { source: { nom: 'Beer Analytics', licence: lu.source.licence, releve: lu.source.releve }, lecture: 'fermentescibles[identifiant] = nom, catégorie et type chez Beer Analytics ; recettes[identifiant] = recettes du site qui le contiennent (taille de l’échantillon). Sert au test de cohérence, pas à la page.', fermentescibles: classe(fermentescibles), recettes: classe(recettes) };
  return { table, noms };
}

const texte = (t) => `${JSON.stringify(t)}\n`;
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.includes('--telecharger')) {
    try { await telecharger(); } catch (e) { console.error(e.message); process.exitCode = e.arret ? 3 : 1; }
  }
  if (process.exitCode) { /* le téléchargement a échoué : ne pas écrire une table sur des relevés incomplets */ }
  else if (process.argv.includes('--verifier')) {
    let r = null, ecrit = '', ecritNoms = '';
    try { r = calculer(); ecrit = readFileSync(SORTIE, 'utf8'); ecritNoms = readFileSync(SORTIE_NOMS, 'utf8'); } catch { /* relevés ou table absents */ }
    const ok = r && ecrit === texte(r.table) && ecritNoms === texte(r.noms);
    console.log(ok ? 'TYPICITE MALTS OK' : 'TYPICITE MALTS ECART');
    if (!ok) process.exitCode = 1;
  } else {
    const { table: t, noms } = calculer();
    mkdirSync(dirname(SORTIE), { recursive: true });
    writeFileSync(SORTIE, texte(t));
    writeFileSync(SORTIE_NOMS, texte(noms));
    console.log(`typicite-styles.json écrit : ${t.couverture.avecGraphique} fermentescibles, ${t.couverture.stylesAvecParts} styles, ${texte(t).length} octets (+ fermentescibles.json ${texte(noms).length} octets)`);
  }
}
