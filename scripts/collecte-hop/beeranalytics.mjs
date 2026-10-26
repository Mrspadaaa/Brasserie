// Voie c3h (#180) : Beer Analytics (beer-analytics.com), l'usage des houblons dans les recettes.
// Ce site publie des statistiques de recettes (pas de chimie) : nombre de recettes, part par style, dosage par style et par
// moment d'ajout, répartition par moment, houblons associés, levures, popularité mensuelle. Les chiffres des graphiques sont
// dans des fichiers JSON (Plotly) publics, cités par chaque page (`data-chart`), permis par le robots.txt (seul /wa/ est interdit).
//
//   node scripts/collecte-hop/beeranalytics.mjs --offline        relit tout depuis le cache, écrit src/data/hopSources/beeranalytics*.json
//   node scripts/collecte-hop/beeranalytics.mjs --telecharger     complète le cache (1 requête / 2 s, une à la fois, arrêt sur 401/403/429/défi)
//
// Tout téléchargement passe par readHopSource (scripts/hop-source-cache.mjs) : cache brut + reçu sha256. Aucun code de l'app
// n'importe ce fichier. Les paragraphes de la page (« Profile ») restent dans le cache : seuls des valeurs, noms et listes sortent.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readHopSource, digest } from '../hop-source-cache.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
export const racine = resolve(ici, '..', '..');
export const CACHE = resolve(process.env.HOP_SOURCE_CACHE || 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources');
export const SORTIE = resolve(racine, 'src/data/hopSources');
export const VOIE = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/c3h-beer-analytics');
export const ORIGINE = 'https://www.beer-analytics.com';
export const SOURCE = {
  id: 'beeranalytics', nom: 'Beer Analytics', hote: 'www.beer-analytics.com', type: 'statistiques de recettes (communauté, sans chimie)',
  conditions: 'robots.txt : tout permis sauf /wa/ (GPTBot exclu, non concerné) ; contenu sous licence CC BY-SA 4.0 (pied de page : « Except where otherwise noted… ») ; pages et JSON de graphiques publics',
  licence: 'CC BY-SA 4.0',
};
const ESPACE_MS = 2100;   // au plus 1 requête toutes les 2 s, une seule à la fois

/* ---------- Texte ---------- */
const NOMMEES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', eacute: 'é', egrave: 'è', uuml: 'ü', ouml: 'ö', auml: 'ä' };
export const decoder = s => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&([a-z]+);/gi, (m, n) => NOMMEES[n.toLowerCase()] ?? m);
const texte = html => decoder(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
export const sansAccent = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const cle = s => sansAccent(String(s)).toLowerCase().replace(/[®™©]/g, '').replace(/[^a-z0-9]+/g, '');
const nombre = s => { const n = Number(String(s).replace(/,/g, '')); return Number.isFinite(n) ? n : null; };
const mois = s => String(s).slice(0, 7);   // « 2012-01-01T00:00:00 » → « 2012-01 » (tous les points sont le 1er du mois)

/* ---------- Page d'un houblon ---------- */
const BADGE = /<a href="([^"]*)" class="badge ([^"]*)">([^<]*)<\/a>/g;

/** Page d'un houblon → { nom, categorie, details, listes, cartes, graphiques } (null si ce n'est pas une page de houblon). */
export function lirePage(html) {
  const h1 = /<h1>([^<]*)<\/h1>/.exec(html);
  if (!h1) return null;
  const nom = decoder(h1[1]).replace(/\s+Hops?\s*$/i, '').trim();
  // Fiche d'en-tête : paires <dt>/<dd> (Recipes, Purpose, Alpha, Origin…).
  const details = {};
  const entete = /<dl class="detail-info">([\s\S]*?)<\/dl>/.exec(html)?.[1] ?? '';
  for (const m of entete.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) details[texte(m[1]).replace(/:$/, '')] = texte(m[2]);
  // Listes de badges (Substitutes, Pairings, Flavor) : ordre de la page conservé.
  const listes = {};
  for (const m of html.matchAll(/<figure class="badge-list">\s*<figcaption>([^<]*)<\/figcaption>([\s\S]*?)<\/figure>/g)) {
    const titre = decoder(m[1]).replace(/:$/, '').trim();
    const items = [...m[2].matchAll(BADGE)].map(b => ({ nom: decoder(b[3]).trim(), lien: b[1], ...(/bg-(?!primary|secondary)([a-z-]+)/.exec(b[2]) ? { groupe: /bg-(?!primary|secondary)([a-z-]+)/.exec(b[2])[1] } : {}) }));
    if (items.length) listes[titre] = items;
  }
  // Cartes « Characteristics » : plage min < milieu < max, ou « Purpose: X ».
  const cartes = {};
  for (const m of html.matchAll(/<h3 class="h5 mb-0">([^<]*)<\/h3>\s*<\/div>\s*<div class="card-body">([\s\S]*?)<\/div>/g)) {
    const titre = decoder(m[1]).trim(), corps = texte(m[2]);
    const p = /^(-?[\d.,]+)\s*<\s*(-?[\d.,]+)\s*<\s*(-?[\d.,]+)\s*(%|[^\d\s<]*)?$/.exec(corps);
    if (p) cartes[titre] = { brut: corps, min: nombre(p[1]), milieu: nombre(p[2]), max: nombre(p[3]), unite: p[4] || null };
    else cartes[titre] = { brut: corps };
  }
  const graphiques = [...new Set([...html.matchAll(/data-chart="([^"]+\.json)"/g)].map(m => m[1]))];
  return { nom, details, listes, cartes, graphiques };
}

/* ---------- Graphiques (JSON Plotly) ---------- */
const boite = t => {
  const un = k => Array.isArray(t[k]) ? (t[k][0] ?? null) : (t[k] ?? null);
  return { nom: t.name ?? null, borneBasse: un('lowerfence'), q1: un('q1'), mediane: un('median'), moyenne: un('mean'), q3: un('q3'), borneHaute: un('upperfence') };
};
const classes = x => { const m = /^\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]$/.exec(String(x)); return m ? { de: Number(m[1]), a: Number(m[2]) } : { libelle: String(x) }; };

/**
 * Un fichier de graphique → valeurs seules, avec leur unité publiée (titre d'axe). Rend null pour « no_data ».
 * `serie` = série mensuelle (déplacée dans le fichier des séries pour garder les fiches légères).
 */
export function lireGraphique(nom, json) {
  if (!json || json.no_data) return null;
  const data = json.data || [], axeY = json.layout?.yaxis?.title?.text ?? null;
  const t0 = data[0];
  switch (nom) {
    case 'alpha-histogram': case 'beta-histogram':
      return { type: 'histogramme', unite: '%', base: 'comptes par classe de valeur déclarée (« count » du site ; peut dépasser le nombre de recettes)', classes: (t0?.x || []).map((x, i) => ({ ...classes(x), compte: t0.y[i] })) };
    case 'amount-percent-range':
      return { type: 'valeurs', unite: 'fraction du poids de houblon de la recette', note: 'x du graphique en boîte, tel quel (le milieu de la carte vient de la page)', valeurs: t0?.x ?? [] };
    case 'usage-types':
      return { type: 'barres', unite: 'recettes', parMoment: (t0?.x || []).map((x, i) => ({ moment: x, recettes: t0.y[i] })) };
    case 'typical-styles-relative':
      return { type: 'barres', unite: "fraction des recettes du style (« Used in % of the Style's Recipes »)", parStyle: (t0?.x || []).map((x, i) => ({ style: x, part: t0.y[i] })) };
    case 'typical-styles-absolute':
      return { type: 'barres', unite: 'recettes', parStyle: (t0?.x || []).map((x, i) => ({ style: x, recettes: t0.y[i] })) };
    case 'amount-used-per-style':
      return { type: 'boites', unite: axeY ?? '% of Weight in Recipe', base: 'fraction du poids total de houblon de la recette', parStyle: data.map(boite).map(({ nom: style, ...b }) => ({ style, ...b })) };
    case 'amount-used-per-use':
      return { type: 'boites', unite: axeY ?? '% of Weight in Recipe', base: 'fraction du poids total de houblon de la recette', parMoment: data.map(boite).map(({ nom: moment, ...b }) => ({ moment, ...b })) };
    case 'hop-pairings': {
      // Chaque sous-graphique (xaxis, xaxis2…) oppose le houblon associé et le houblon de la page, dans les recettes qui contiennent les deux.
      const groupes = new Map();
      for (const t of data) { const k = t.xaxis || 'x'; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(boite(t)); }
      return { type: 'boites', unite: axeY ?? '% of Weight in Recipe', base: 'fraction du poids de houblon, dans les recettes qui contiennent les deux houblons', rang: 'ordre de la page (le plus fréquent d\'abord)', associes: [...groupes.values()].map(g => ({ houblons: g })) };
    }
    case 'popularity':
      return { serie: true, type: 'serie', unite: '% of All Recipes (fraction)', mensuelle: { mois: (t0?.x || []).map(mois), valeur: t0?.y ?? [] } };
    case 'popular-yeasts': case 'trending-yeasts':
      return { serie: true, type: 'series', unite: axeY ?? '% of Recipes (fraction)', levures: data.map(t => ({ levure: t.name, mois: (t.x || []).map(mois), valeur: t.y ?? [] })) };
    default:
      return { type: 'inconnu', traces: data.map(t => ({ type: t.type ?? null, nom: t.name ?? null, x: t.x ?? null, y: t.y ?? null })) };
  }
}

/* ---------- Catalogue (lecture seule : rattacher sans forcer) ---------- */
let indexCatalogue = null;
export function rattacher(...noms) {
  if (!indexCatalogue) {
    indexCatalogue = new Map();
    const cat = JSON.parse(readFileSync(resolve(racine, 'src/data/hopV4/proto-data.json'), 'utf8')).varieties;
    const ajoute = (n, id) => { const k = cle(n); if (!k) return; if (!indexCatalogue.has(k)) indexCatalogue.set(k, new Set()); indexCatalogue.get(k).add(id); };
    for (const v of cat) {
      ajoute(v.name, v.id); for (const a of v.aliases || []) ajoute(a, v.id);
      ajoute(v.name.replace(/\s*\([^)]*\)\s*$/, ''), v.id);   // « Saaz (CZ) » → « Saaz » ; si deux variétés, le rattachement devient ambigu
    }
  }
  const trouves = new Set();
  for (const n of noms.filter(Boolean)) for (const id of indexCatalogue.get(cle(n)) ?? []) trouves.add(id);
  return { varietyId: trouves.size === 1 ? [...trouves][0] : null, ambigu: trouves.size > 1, candidats: [...trouves] };
}

/* ---------- Sitemap ---------- */
export function lireSitemap(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const houblons = [], styles = new Map();
  for (const u of urls) {
    const h = /^https:\/\/www\.beer-analytics\.com\/hops\/([a-z-]+)\/([^/]+)\/$/.exec(u);
    if (h && h[1] !== 'flavors') houblons.push({ url: u, categorie: h[1], slug: h[2] });
    const s = /^https:\/\/www\.beer-analytics\.com\/styles\/([^/]+)\/([^/]+)\/$/.exec(u);
    if (s) { const k = cle(s[2]); if (!styles.has(k)) styles.set(k, []); styles.get(k).push(`${s[1]}/${s[2]}`); }
  }
  houblons.sort((a, b) => a.url.localeCompare(b.url));
  return { houblons, styles };
}

/* ---------- robots.txt ---------- */
export function lireRobots(txt) {
  const regles = []; let actif = false, dans = false;
  for (const brut of txt.split(/\r?\n/)) {
    const l = brut.replace(/#.*/, '').trim(); if (!l) continue;
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(l); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (dans) { actif = false; dans = false; } if (v === '*') actif = true; }
    else if (k === 'disallow' || k === 'allow') { dans = true; if (actif && v) regles.push({ permis: k === 'allow', motif: v }); }
  }
  const re = m => new RegExp('^' + m.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const c = regles.map(r => ({ ...r, re: re(r.motif) }));
  return chemin => { let best = null; for (const r of c) if (r.re.test(chemin) && (!best || r.motif.length > best.motif.length)) best = r; return !best || best.permis; };
}

/* ---------- Lecture du cache (hors ligne) ---------- */
const enCache = url => {
  const p = resolve(CACHE, digest(url));
  try { return existsSync(p) && existsSync(p + '.json') && JSON.parse(readFileSync(p + '.json', 'utf8')).sha256 === digest(readFileSync(p, 'utf8')); } catch { return false; }
};
const DEFI = /Security Checkpoint|Just a moment|cf-challenge|Attention Required|captcha-delivery|Access denied/i;
const lireCache = url => {
  if (!enCache(url)) return null;
  const p = resolve(CACHE, digest(url));
  const content = readFileSync(p, 'utf8'), meta = JSON.parse(readFileSync(p + '.json', 'utf8'));
  if (content.length < 20000 && DEFI.test(content)) return null;   // page de défi : jamais lue comme donnée
  return { content, releve: (meta.retrievedAt || '').slice(0, 10) };
};

/* ---------- Construction des fiches ---------- */
const CHAMPS_ENTETE = { Recipes: 'recettes', Purpose: 'usage', Alpha: 'alphaClasse', Origin: 'origine' };

export function construireFiche(entree, page, lireGr, styles = new Map()) {
  const { url, slug, categorie } = entree;
  const r = rattacher(page.nom, slug);
  const champs = {}, stats = {}, series = {}, vides = [], nonLus = [];
  const d = page.details;
  if (d.Recipes != null) champs.recettes = { champ: 'Recipes', brut: d.Recipes, valeur: nombre(d.Recipes), unite: 'recettes', base: 'recettes du site contenant ce houblon' };
  if (d.Purpose != null) champs.usage = { champ: 'Purpose', brut: d.Purpose, valeur: null };
  if (d.Alpha != null) champs.alphaClasse = { champ: 'Alpha', brut: d.Alpha, valeur: null, note: 'classe (Low/Medium/High…), pas un chiffre' };
  if (d.Origin != null) champs.origine = { champ: 'Origin', brut: d.Origin, valeur: null };
  for (const [k, v] of Object.entries(d)) if (!(k in CHAMPS_ENTETE)) champs[k.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'champ'] = { champ: k, brut: v, valeur: null };
  const carte = (titre, cleSortie, base) => {
    const c = page.cartes[titre]; if (!c) return;
    champs[cleSortie] = { champ: titre, ...c, base, valeur: c.milieu ?? null, note: 'min < milieu < max, tels que la page les écrit (le milieu est en gras ; médiane ou moyenne non précisée)' };
  };
  carte('Alpha Acid', 'alphaDesRecettes', 'valeur déclarée par les recettes du site, % des α');
  carte('Beta Acid', 'betaDesRecettes', 'valeur déclarée par les recettes du site, % des β');
  carte('Amount', 'partDuPoids', 'part du poids de houblon de la recette (%)');
  if (page.cartes.Usage) champs.usageCarte = { champ: 'Usage', brut: page.cartes.Usage.brut, valeur: null };
  for (const g of page.graphiques) {
    const nomG = g.replace(/^.*\/charts\//, '').replace(/\.json$/, '');
    const urlG = new URL(g, ORIGINE).href;
    const lu = lireGr(urlG);
    if (lu === undefined) { nonLus.push(nomG); continue; }   // pas (encore) dans le cache : à compléter par --telecharger
    if (lu === null) { vides.push(nomG); continue; }         // le site publie « no_data », ou la page est absente (404)
    const { serie, ...contenu } = lu;
    const cible = serie ? series : stats;
    cible[nomG] = { url: urlG, ...contenu };
  }
  for (const k of ['parStyle']) for (const g of Object.values(stats)) for (const s of g[k] ?? []) {
    const m = styles.get(cle(s.style)); s.styleSlug = m && m.length === 1 ? m[0] : null;
  }
  const listes = {};
  for (const [titre, items] of Object.entries(page.listes)) listes[{ Substitutes: 'substituts', Pairings: 'accords', Flavor: 'aromes' }[titre] ?? titre] = items.map(i => i.nom);
  const groupesAromes = {};
  for (const i of page.listes.Flavor ?? []) if (i.groupe) groupesAromes[i.nom] = i.groupe;
  return {
    nom: page.nom, alias: [], varietyId: r.varietyId, ...(r.ambigu ? { rattachementAmbigu: r.candidats } : {}), url, releve: entree.releve, publie: null,
    categorie, champs, listes, ...(Object.keys(groupesAromes).length ? { groupesAromes } : {}),
    stats, ...(vides.length ? { graphiquesVides: vides } : {}), ...(nonLus.length ? { graphiquesNonLus: nonLus } : {}), _series: series,
  };
}

/** { source, fiches } avec une fiche par ligne : pas d'indentation (fichiers plus légers, diffs lisibles). */
const ecrireLignes = (source, fiches) => `{"source":${JSON.stringify(source)},\n"fiches":[\n${fiches.map(f => JSON.stringify(f)).join(',\n')}\n]}\n`;
const lettre = nom => { const c = sansAccent(nom).trim()[0]?.toUpperCase() ?? '_'; return /[A-Z]/.test(c) ? c : '_'; };
const sha = s => createHash('sha256').update(s).digest('hex');

/** Relit tout depuis le cache et écrit les fichiers. Rend { fichiers, sha, stats }. */
export function construireTout({ ecrire = true } = {}) {
  const sm = lireCache(`${ORIGINE}/sitemap.xml`);
  if (!sm) throw Error('Hors ligne : sitemap.xml absent du cache.');
  const { houblons, styles } = lireSitemap(sm.content);
  const journal = lireJournal();
  const absents = new Set(journal.absents);
  const lireGr = url => {
    const nomG = url.replace(/^.*\/charts\//, '').replace(/\.json$/, '');
    const c = lireCache(url);
    if (!c) return absents.has(url) ? null : undefined;
    try { return lireGraphique(nomG, JSON.parse(c.content)); } catch { return undefined; }
  };
  const fiches = [], manquantes = [], sansPage = [];
  for (const h of houblons) {
    const c = lireCache(h.url);
    if (!c) { (absents.has(h.url) ? sansPage : manquantes).push(h.url); continue; }
    const page = lirePage(c.content);
    if (!page) { sansPage.push(h.url); continue; }
    fiches.push(construireFiche({ ...h, releve: c.releve }, page, lireGr, styles));
  }
  fiches.sort((a, b) => (a.nom + a.url).localeCompare(b.nom + b.url));
  const releves = fiches.map(f => f.releve).filter(Boolean).sort();
  const source = { ...SOURCE, releve: releves.at(-1) ?? null };

  // Fiches par lettre (≤ 2 Mo chacune) ; séries mensuelles dans des fichiers à part ; un index à la place du fichier unique.
  const parLettre = new Map();
  for (const f of fiches) { const l = lettre(f.nom); if (!parLettre.has(l)) parLettre.set(l, []); parLettre.get(l).push(f); }
  const sorties = new Map();
  const index = [];
  for (const [l, liste] of [...parLettre].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sansSerie = liste.map(({ _series, ...f }) => f);
    const serie = liste.filter(f => Object.keys(f._series).length).map(f => ({ nom: f.nom, url: f.url, varietyId: f.varietyId, releve: f.releve, series: f._series }));
    sorties.set(`beeranalytics-${l}.json`, ecrireLignes(source, sansSerie));
    if (serie.length) sorties.set(`beeranalytics-series-${l}.json`, ecrireLignes(source, serie));
    index.push({ lettre: l, fichier: `beeranalytics-${l}.json`, fichierSeries: serie.length ? `beeranalytics-series-${l}.json` : null, fiches: liste.length });
  }
  const resume = fiches.map(f => ({ nom: f.nom, varietyId: f.varietyId, url: f.url, categorie: f.categorie, recettes: f.champs.recettes?.valeur ?? null }));
  const note = 'Index : les fiches sont dans les fichiers par lettre (2 Mo au plus chacun) ; les séries mensuelles (popularité, levures) dans les fichiers « series ».';
  const indexTexte = `{"source":${JSON.stringify(source)},\n"note":${JSON.stringify(note)},\n"fichiers":${JSON.stringify(index)},\n"fiches":[\n${resume.map(f => JSON.stringify(f)).join(',\n')}\n]}\n`;
  sorties.set('beeranalytics.json', indexTexte);
  const empreintes = [...sorties].map(([n, t]) => `${n} ${sha(t)} ${t.length}`);
  const global = sha(empreintes.join('\n'));
  if (ecrire) { mkdirSync(SORTIE, { recursive: true }); for (const [n, t] of sorties) writeFileSync(resolve(SORTIE, n), t); }
  const plusGros = Math.max(...[...sorties.values()].map(t => t.length));
  return { fichiers: [...sorties.keys()], sha: global, empreintes, plusGros, fiches, manquantes, sansPage, houblonsSitemap: houblons.length };
}

/* ---------- Rapport de couverture ---------- */
const pct = (n, d) => d ? `${n} (${Math.round(100 * n / d)} %)` : `${n}`;
const phares = ['Galaxy', 'Citra', 'Nelson Sauvin', 'Motueka'];

/** Texte de voies/c3h-beer-analytics/couverture.md, tiré du cache et du journal (même cache, même texte). */
export function rapport(r) {
  const j = lireJournal(), f = r.fiches, n = f.length;
  const rattachees = f.filter(x => x.varietyId), ambigues = f.filter(x => x.rattachementAmbigu), nouvelles = f.filter(x => !x.varietyId && !x.rattachementAmbigu);
  const cat = JSON.parse(readFileSync(resolve(racine, 'src/data/hopV4/proto-data.json'), 'utf8')).varieties;
  const ids = new Set(rattachees.map(x => x.varietyId));
  const complets = f.filter(x => !x.graphiquesNonLus).length;
  const L = [];
  L.push('# Couverture — Beer Analytics (voie c3h, #180)', '');
  L.push('Fichier produit par `node scripts/collecte-hop/beeranalytics.mjs --offline --rapport` à partir du cache et du journal.', '');
  L.push('## Hôtes tentés', '');
  L.push('- `www.beer-analytics.com` : robots.txt lu (200) ; pour `*` seul `Disallow: /wa/` ; `GPTBot` est exclu (non concerné). Aucune page de défi, aucun 401/403/429.');
  L.push(`- Requêtes réseau faites par le script : ${j.requetes}, une à la fois, 2,1 s d'écart au moins. Statuts : ${JSON.stringify(j.statuts)}. Absents (404) : ${j.absents.length}. Arrêts : ${j.arrets.length ? JSON.stringify(j.arrets) : 'aucun'}. Erreurs réseau : ${j.erreurs.length}.`);
  L.push('- Licence lue au pied de page : CC BY-SA 4.0 (« Except where otherwise noted, content on this site is licensed under… »). À citer si ces données sortent un jour de l\'outil.', '');
  L.push('## Pages lues', '');
  L.push(`- Pages de houblons du sitemap : ${r.houblonsSitemap}. Lues depuis le cache : ${n} ; absentes du cache : ${r.manquantes.length} ; 404 ou sans titre : ${r.sansPage.length}.`);
  L.push(`- Fiches dont les graphiques ont tous été lus : ${pct(complets, n)}.`);
  L.push('- Autres pages du cache : robots.txt, sitemap.xml, et les fichiers `charts/*.json` de chaque houblon. Non lues : `/hops/flavors/*` (liste de houblons par arôme : redite des badges d\'arôme de chaque page), `/styles/*` (statistiques par style, hors voie), `recipes/random.inc` (échantillon aléatoire de recettes), les pages de tendances.', '');
  L.push('## Variétés', '');
  L.push(`- Trouvées : ${n}. Rattachées au catalogue : ${rattachees.length} (${ids.size} variétés distinctes sur ${cat.length}). Nouvelles (absentes du catalogue, gardées) : ${nouvelles.length}. Rattachement ambigu (varietyId null) : ${ambigues.length}.`);
  if (ambigues.length) L.push(`- Ambiguës : ${ambigues.map(x => `${x.nom} → ${x.rattachementAmbigu.join(' / ')}`).join(' ; ')}`);
  L.push(`- Nouvelles : ${nouvelles.map(x => x.nom).join(', ') || 'aucune'}.`, '');
  L.push('## Champs lus (nombre de fiches)', '');
  const champs = new Map(), graphs = new Map(), vides = new Map(), nonLus = new Map();
  for (const x of f) {
    for (const k of Object.keys(x.champs)) champs.set(k, (champs.get(k) || 0) + 1);
    for (const k of Object.keys(x.stats)) graphs.set(k, (graphs.get(k) || 0) + 1);
    for (const k of Object.keys(x._series)) graphs.set(k, (graphs.get(k) || 0) + 1);
    for (const k of x.graphiquesVides ?? []) vides.set(k, (vides.get(k) || 0) + 1);
    for (const k of x.graphiquesNonLus ?? []) nonLus.set(k, (nonLus.get(k) || 0) + 1);
  }
  L.push('| Champ de la page | Fiches |', '|---|---|');
  for (const [k, v] of [...champs].sort()) L.push(`| ${k} | ${pct(v, n)} |`);
  L.push('', 'Listes : substituts, accords (ordre de la page), arômes avec leur famille de couleur du site.', '');
  L.push('| Graphique (JSON) | Fiches avec données | « no_data » ou 404 | Non lus |', '|---|---|---|---|');
  for (const k of [...new Set([...graphs.keys(), ...vides.keys(), ...nonLus.keys()])].sort()) L.push(`| ${k} | ${pct(graphs.get(k) || 0, n)} | ${vides.get(k) || 0} | ${nonLus.get(k) || 0} |`);
  L.push('', '### Les cinq composés demandés', '');
  L.push('| Composé | Fiches |', '|---|---|');
  for (const c of ['linalol', 'géraniol', 'farnésène', 'β-pinène', 'sélinène']) L.push(`| ${c} | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |`);
  L.push('', '## Les quatre houblons demandés', '');
  for (const nom of phares) {
    const x = f.find(y => cle(y.nom) === cle(nom));
    if (!x) { L.push(`### ${nom}`, '', '- absent des fiches lues (pas encore dans le cache, ou absent du site).', ''); continue; }
    const s = x.stats, top = (a, k, m) => (a ?? []).slice(0, m).map(e => `${e.style ?? e.moment} ${k(e)}`).join(', ');
    L.push(`### ${x.nom} — ${x.varietyId ?? 'hors catalogue'}`, '');
    L.push(`- Recettes : ${x.champs.recettes?.brut ?? '?'} ; usage ${x.champs.usage?.brut ?? '?'} ; α « ${x.champs.alphaClasse?.brut ?? '?'} » ; origine ${x.champs.origine?.brut ?? '?'}.`);
    L.push(`- Accords (ordre de la page) : ${(x.listes.accords ?? []).join(', ') || 'aucun'}. Substituts : ${(x.listes.substituts ?? []).join(', ') || 'aucun'}. Arômes : ${(x.listes.aromes ?? []).join(', ') || 'aucun'}.`);
    L.push(`- Moments d'ajout (recettes) : ${(s['usage-types']?.parMoment ?? []).map(e => `${e.moment} ${e.recettes}`).join(', ') || 'non lu'}.`);
    L.push(`- Dosage par moment (médiane, fraction du poids de houblon) : ${(s['amount-used-per-use']?.parMoment ?? []).map(e => `${e.moment} ${e.mediane == null ? '?' : e.mediane.toFixed(2)}`).join(', ') || 'non lu'}.`);
    L.push(`- Styles en tête, part des recettes du style : ${top(s['typical-styles-relative']?.parStyle, e => (100 * e.part).toFixed(1) + ' %', 4) || 'non lu'}.`);
    L.push(`- Houblons associés lus : ${s['hop-pairings']?.associes?.length ?? 0} ; levures : ${x._series['popular-yeasts']?.levures?.length ?? 0} ; popularité mensuelle : ${x._series.popularity?.mensuelle?.mois?.length ?? 0} mois (dernier ${x._series.popularity?.mensuelle?.mois?.at(-1) ?? '?'}).`, '');
  }
  L.push('## Doutes', '');
  L.push('- « Amount » (carte) et le graphique « amount-percent-range » : la page écrit « min < milieu < max » sans dire si le milieu est une médiane ou une moyenne ; les six valeurs du graphique ne retrouvent pas le milieu de la carte. Les deux sont gardés tels quels, rien n\'est recalculé.');
  L.push('- « Dosage par style / par moment » est une part du poids total de houblon de la recette (0 à 1), pas des grammes ni des g/L. Ce n\'est donc pas une dose en g/10 L : à ne pas utiliser comme telle.');
  L.push('- Les histogrammes α et β comptent des valeurs déclarées par les recettes (pas la chimie du houblon) ; leurs comptes peuvent dépasser le nombre de recettes.');
  L.push('- Les moments d\'ajout du site (Mash, First Wort, Boil, Aroma, Dry Hop) ne donnent ni minutes ni température de whirlpool : « Aroma » mêle flame-out et whirlpool.');
  L.push('- Le code de style BJCP n\'est pas publié dans les graphiques : seul le nom du style, avec son adresse `categorie/style` quand elle se retrouve sans ambiguïté dans le sitemap (`styleSlug`, null sinon).');
  L.push('- Statistiques de communauté (Brewer\'s Friend, BeerSmith, Brewfather…) : biais de popularité ; un houblon rare a peu de recettes (champ `recettes`), ses parts sont fragiles.');
  L.push('- Le rattachement au catalogue se fait sur le nom (sans casse, accents ni ponctuation) et sur l\'adresse ; un nom qui désigne deux variétés reste non rattaché.', '');
  return L.join('\n') + '\n';
}

/* ---------- Journal des réponses (écrit seulement en ligne) ---------- */
const CHEMIN_JOURNAL = join(VOIE, 'journal-collecte.json');
function lireJournal() {
  try { return JSON.parse(readFileSync(CHEMIN_JOURNAL, 'utf8')); } catch { return { requetes: 0, statuts: {}, absents: [], arrets: [], erreurs: [], interdits: [] }; }
}

/* ---------- Téléchargement poli ---------- */
const attendre = ms => new Promise(r => setTimeout(r, ms));

async function telecharger() {
  mkdirSync(VOIE, { recursive: true });
  const journal = lireJournal();
  const absents = new Set(journal.absents);
  let dernier = 0, consecutives = 0, arret = null;
  const sauve = () => { journal.absents = [...absents].sort(); writeFileSync(CHEMIN_JOURNAL, JSON.stringify(journal, null, 1) + '\n'); };
  const compte = code => { journal.statuts[code] = (journal.statuts[code] || 0) + 1; };

  /** Une page ou un JSON : du cache s'il y est, sinon une requête (2 s d'écart). null si absent (404/410) ou interdit. */
  async function obtenir(url, permis) {
    if (arret) throw Error(`Arrêt : ${arret}`);
    if (enCache(url)) return lireCache(url);
    if (absents.has(url)) return null;
    if (permis && !permis(new URL(url).pathname)) { if (!journal.interdits.includes(url)) journal.interdits.push(url); return null; }
    const delta = Date.now() - dernier;
    if (delta < ESPACE_MS) await attendre(ESPACE_MS - delta);
    dernier = Date.now(); journal.requetes++;
    try {
      const r = await readHopSource(url, { cache: CACHE, offline: false, refresh: false });
      compte(200); consecutives = 0;
      if (r.content.length < 20000 && DEFI.test(r.content)) { arret = 'défi anti-robot'; journal.arrets.push({ url, raison: arret }); sauve(); throw Error(`Défi anti-robot : ${url}`); }
      return { content: r.content, releve: (r.retrievedAt || '').slice(0, 10) };
    } catch (e) {
      const m = /\((\d{3})\)/.exec(e.message);
      if (m) {
        const code = Number(m[1]); compte(code);
        if ([401, 403, 429].includes(code)) { arret = String(code); journal.arrets.push({ url, raison: code }); sauve(); throw Error(`Hôte arrêté (${code}) : ${url}`); }
        if (code === 404 || code === 410) { absents.add(url); consecutives = 0; return null; }
      }
      if (/Défi anti-robot|Hôte arrêté/.test(e.message)) throw e;
      journal.erreurs.push({ url, message: String(e.message).slice(0, 120) }); compte('erreur');
      if (++consecutives >= 5) { arret = '5 erreurs de suite'; journal.arrets.push({ url, raison: arret }); sauve(); throw Error(arret); }
      return null;
    }
  }

  const robots = await obtenir(`${ORIGINE}/robots.txt`);
  if (!robots) throw Error('robots.txt illisible : arrêt.');
  const permis = lireRobots(robots.content);
  const sm = await obtenir(`${ORIGINE}/sitemap.xml`, permis);
  const { houblons } = lireSitemap(sm.content);
  await obtenir(`${ORIGINE}/hops/`, permis);
  await obtenir(`${ORIGINE}/trends/popular-hops/`, permis);

  // Catalogue d'abord, puis les autres (par ordre alphabétique de l'URL).
  const dansCatalogue = h => rattacher(h.slug.replace(/-/g, ' '), h.slug).varietyId != null;
  const premier = h => phares.some(p => cle(p) === cle(h.slug));   // les quatre houblons du rapport d'abord
  const ordre = [...houblons.filter(premier), ...houblons.filter(h => !premier(h) && dansCatalogue(h)), ...houblons.filter(h => !premier(h) && !dansCatalogue(h))];
  console.log(`houblons du site : ${houblons.length}, dont ${ordre.filter(dansCatalogue).length} rattachés d'après l'adresse (catalogue d'abord)`);
  let n = 0;
  try {
    for (const h of ordre) {
      const p = await obtenir(h.url, permis);
      if (p) {
        const page = lirePage(p.content);
        for (const g of page?.graphiques ?? []) await obtenir(new URL(g, ORIGINE).href, permis);
      }
      if (++n % 10 === 0) { sauve(); console.log(`${n}/${ordre.length} houblons, ${journal.requetes} requêtes au total`); }
    }
  } finally { sauve(); }
  console.log(`terminé : ${journal.requetes} requêtes, statuts ${JSON.stringify(journal.statuts)}`);
}

/* ---------- Programme ---------- */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--telecharger')) {
    await telecharger();
  } else {
    if (!process.argv.includes('--offline')) { console.error('Usage : --offline (relit le cache) ou --telecharger (complète le cache, poliment).'); process.exit(2); }
    const r = construireTout();
    console.log(`beeranalytics : ${r.fiches.length} fiches sur ${r.houblonsSitemap} houblons du sitemap (${r.manquantes.length} pages absentes du cache, ${r.sansPage.length} sans page), ${r.fichiers.length} fichiers, le plus gros ${r.plusGros} octets`);
    console.log(`sha256 ${r.sha}`);
    if (process.argv.includes('--detail')) console.log(r.empreintes.join('\n'));
    if (process.argv.includes('--rapport')) writeFileSync(join(VOIE, 'couverture.md'), rapport(r));
  }
}
