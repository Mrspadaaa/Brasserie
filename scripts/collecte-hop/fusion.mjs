// d3a-fusion (#180, seconde étape de D154) : trie et fusionne les 18 sources de src/data/hopSources/ en un fichier compact par variété.
// Hors ligne et déterministe : rien d'horodaté, tout ordre fixé. Lit src/data/hopSources/*.json et le catalogue (proto-data.json).
// Sorties (écrites seulement quand le contenu change) :
//   src/data/hopV4/complements.json                 le fichier de l'app, chargé à la demande (jamais au démarrage, jamais par le moteur)
//   src/data/hopV4/complements-non-rattachees.json  les fiches sans variété du catalogue, avec leurs candidats (tri à part, non importé)
//   work/missions/2026-10-25-integration-houblons/voies/d3a-fusion/rapport.md
// Conventions (pilote, réversibles) : voir VOIE.md. Décision du 26.10 : toutes les sources entrent dans complements.json, `diffusion` reste dans la table.
// Lancement : node scripts/collecte-hop/fusion.mjs [--sans-ecriture]

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR_SOURCES = resolve(racine, 'src/data/hopSources');
const SORTIE = resolve(racine, 'src/data/hopV4/complements.json');
const SORTIE_NR = resolve(racine, 'src/data/hopV4/complements-non-rattachees.json');
const RAPPORT = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/d3a-fusion/rapport.md');
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const sha = (s) => createHash('sha256').update(s).digest('hex');

const DECISION_26_10 = '« accord écrit pour la reproduction/affichage public — C\'est pas plublic donc pas de problème » (utilisateur, 26.10) : toutes les sources entrent dans complements.json, `diffusion` garde la trace.';

// ───────────────────────── Sources : diffusion et ce qui a été lu de leurs conditions ─────────────────────────
// libre : licence ouverte ou domaine public ; restreinte : des conditions interdisent reproduction/stockage sans accord écrit ; inconnue : rien trouvé ou simple « © ».
const SOURCES = [
  { id: 'barthhaas', diffusion: 'inconnue', lu: '« © BarthHaas » ; aucune page de conditions consultée ; robots.txt sans Disallow sur /hops-and-products/.' },
  { id: 'brewersfriend', diffusion: 'inconnue', lu: '« Contenu © Brewer\'s Friend » ; robots.txt n\'interdit pas /hops/. Index d\'usage seulement : aucune valeur chimique, donc rien à fusionner.' },
  { id: 'britishhops', diffusion: 'inconnue', lu: 'Page https://www.britishhops.org.uk/terms-conditions/ lue (cache) : texte de remplissage « Lorem ipsum », aucune condition ; « © British Hop Association ».' },
  { id: 'bsg', diffusion: 'inconnue', lu: 'robots.txt lu (Disallow /account/, /checkout/… sans rapport) ; aucune licence trouvée.' },
  { id: 'charlesfaram', diffusion: 'inconnue', lu: '« © Charles Faram 2026 » ; « Legal terms » non consultées ; robots.txt limité à /wp-admin/.' },
  { id: 'crosbyhops', diffusion: 'inconnue', lu: 'robots.txt lu (tout permis sauf /email/, /gated-downloads/, /blog/*, /hs/*) ; aucune licence trouvée.' },
  { id: 'hopdatabase', diffusion: 'libre', lu: 'LICENSE du dépôt (cache) : « MIT License Copyright (c) 2024 Kasper Andreas Rømer Grøntved » ; notice à conserver. Agrégat des catalogues Barth Haas, Crosby, Hopsteiner, Yakima Chief, sans unité écrite.' },
  { id: 'hopsdirect', diffusion: 'inconnue', lu: 'robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée.' },
  { id: 'hopsjson', diffusion: 'libre', lu: 'LICENSE du dépôt (cache) : « MIT License Copyright (c) 2019 Stuart Taylor » ; notice à conserver. Export de BrewDB, sans unité écrite.' },
  { id: 'hopslist', diffusion: 'inconnue', lu: '« © Julian Healey, All Rights Reserved » (simple mention, aucune clause de réutilisation) ; robots.txt : Disallow /wp-admin/ seulement.' },
  { id: 'hopsteiner', diffusion: 'restreinte', lu: 'https://www.hopsteiner.de/en/imprint § 3 (cache) : le contenu demande « the prior written consent of the provider » pour « duplication, editing, translation, storage, processing or reproduction of content in databases » ; copies et téléchargements « only permitted for personal, private and non-commercial use ».', decision: DECISION_26_10 },
  { id: 'hpa', diffusion: 'inconnue', lu: 'robots.txt lu (tout permis sauf /wp-admin/) ; aucune licence trouvée. Les fiches PDF d\'import sont des fiches John I. Haas (voir cette source).' },
  { id: 'indiehops', diffusion: 'inconnue', lu: 'robots.txt lu (Disallow /wp-admin/ seulement) ; aucune licence trouvée.' },
  { id: 'johnihaas', diffusion: 'restreinte', lu: 'https://www.johnihaas.com/terms-and-conditions-of-website-usage/ (cache) : « You may not reproduce, modify, distribute, create derivative works of, or publicly display any part of the Site without Haas\'s prior written consent » ; usage personnel ou interne seulement.', decision: DECISION_26_10 },
  { id: 'nzhops', diffusion: 'inconnue', lu: 'robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée. Fiches PDF en image, non lues.' },
  { id: 'usahops', diffusion: 'inconnue', lu: 'robots.txt lu (tout permis) ; aucune licence trouvée.' },
  { id: 'usda', diffusion: 'libre', lu: 'Institut public américain (ARS) : travail d\'un organisme fédéral. Fiche Cascade : « commercial cultivar, no restrictions ». Aucune licence de réutilisation affirmée sur le site.' },
  { id: 'yakimavalleyhops', diffusion: 'inconnue', lu: 'robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée.' },
];

// ───────────────────────── Champs : sens, unité et base de référence ─────────────────────────
// Chaque champ canonique a une règle. Les clés des sources se ramènent à ces champs (SYNONYMES).
const SYNONYMES = {
  alpha: 'alpha', alphaFerme: 'alpha', beta: 'beta', betaFerme: 'beta',
  huile_totale: 'huile', huileTotale: 'huile', huileTotaleFerme: 'huile', huileTotaleHopsteiner: 'huile',
  cohumulone: 'cohumulone', colupulone: 'colupulone',
  myrcene: 'myrcene', humulene: 'humulene', caryophyllene: 'caryophyllene', farnesene: 'farnesene',
  linalol: 'linalol', linalolHuile: 'linalol', linalolAcide: 'linalolAcide', geraniol: 'geraniol', betaPinene: 'betaPinene', selinene: 'selinene',
  polyphenols: 'polyphenols', polyphenols_totaux: 'polyphenols', totalPolyphenols: 'polyphenols', xanthohumol: 'xanthohumol',
  thiols: 'thiols', intensite_arome: 'intensite_arome', conservation: 'conservation', hsi: 'hsi', rendement: 'rendement',
  esters_alcools_terpeniques: 'esters_alcools_terpeniques', cetones: 'cetones', isobutyrates: 'isobutyrates',
  monoterpenes: 'monoterpenes', sesquiterpenes: 'sesquiterpenes', undecanone2: 'undecanone2',
  rapport_humulene_caryophyllene: 'rapportHC', rapportHC: 'rapportHC', resinesDures: 'resinesDures',
  arome_citrusy: 'arome_citrusy', arome_fruity: 'arome_fruity', arome_floral: 'arome_floral', arome_herbal: 'arome_herbal',
  arome_spicy: 'arome_spicy', arome_resinous: 'arome_resinous', arome_sugarlike: 'arome_sugarlike', arome_divers: 'arome_divers',
};
const COMPOSES_HUILE = ['myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalol', 'geraniol', 'betaPinene', 'selinene'];
// type : règle de contrôle ; unite/base : ce que le champ de référence exprime (affiché, lu par l'app).
const CHAMPS = {
  alpha: { libelle: 'α', unite: '%', base: '% de la masse', type: 'masse' },
  beta: { libelle: 'β', unite: '%', base: '% de la masse', type: 'masse' },
  huile: { libelle: 'huile totale', unite: 'mL/100 g', base: 'mL/100 g', type: 'huile' },
  cohumulone: { libelle: 'cohumulone', unite: '%', base: '% des α', type: 'sur-alpha' },
  colupulone: { libelle: 'colupulone', unite: '%', base: '% des β', type: 'sur-beta' },
  myrcene: { libelle: 'myrcène', unite: '%', base: '% de l\'huile', type: 'compose' },
  humulene: { libelle: 'humulène', unite: '%', base: '% de l\'huile', type: 'compose' },
  caryophyllene: { libelle: 'caryophyllène', unite: '%', base: '% de l\'huile', type: 'compose' },
  farnesene: { libelle: 'farnésène', unite: '%', base: '% de l\'huile', type: 'compose' },
  linalol: { libelle: 'linalol', unite: '%', base: '% de l\'huile', type: 'compose' },
  geraniol: { libelle: 'géraniol', unite: '%', base: '% de l\'huile', type: 'compose' },
  betaPinene: { libelle: 'β-pinène', unite: '%', base: '% de l\'huile', type: 'compose' },
  selinene: { libelle: 'sélinène', unite: '%', base: '% de l\'huile', type: 'compose' },
  undecanone2: { libelle: '2-undécanone', unite: '%', base: '% de l\'huile', type: 'compose' },
  esters_alcools_terpeniques: { libelle: 'esters et alcools terpéniques', unite: '%', base: '% de l\'huile', type: 'compose' },
  cetones: { libelle: 'cétones', unite: '%', base: '% de l\'huile', type: 'compose' },
  isobutyrates: { libelle: 'isobutyrates', unite: '%', base: '% de l\'huile', type: 'compose' },
  monoterpenes: { libelle: 'monoterpènes', unite: '%', base: '% de l\'huile', type: 'compose' },
  sesquiterpenes: { libelle: 'sesquiterpènes', unite: '%', base: '% de l\'huile', type: 'compose' },
  polyphenols: { libelle: 'polyphénols', unite: '%', base: '% de la masse', type: 'masse' },
  xanthohumol: { libelle: 'xanthohumol', unite: '%', base: '% de la masse', type: 'masse' },
  thiols: { libelle: 'thiols', unite: 'µg/kg', base: 'µg/kg', type: 'thiols' },
  intensite_arome: { libelle: 'intensité d\'arôme', unite: null, base: 'sur 10', type: 'intensite' },
  conservation: { libelle: 'conservation (α restants après 6 mois à 20 °C)', unite: '% des α restants', base: '% des α restants', type: 'conservation' },
  hsi: { libelle: 'indice de stockage (HSI)', unite: null, base: 'indice sans unité', type: 'ratio' },
  rendement: { libelle: 'rendement', unite: 'kg/ha', base: 'kg/ha', type: 'rendement' },
  rapportHC: { libelle: 'rapport humulène/caryophyllène', unite: null, base: 'rapport sans unité', type: 'ratio' },
  linalolAcide: { libelle: 'linalol « acide » (HopDatabase)', unite: null, base: 'sens non établi', type: 'inconnu' },
  resinesDures: { libelle: 'résines dures (HopDatabase)', unite: null, base: 'sens non établi', type: 'inconnu' },
  arome_citrusy: { libelle: 'arôme noté : agrumes', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_fruity: { libelle: 'arôme noté : fruité', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_floral: { libelle: 'arôme noté : floral', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_herbal: { libelle: 'arôme noté : herbacé', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_spicy: { libelle: 'arôme noté : épicé', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_resinous: { libelle: 'arôme noté : résineux', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_sugarlike: { libelle: 'arôme noté : sucré', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
  arome_divers: { libelle: 'arôme noté : divers', unite: 'note 0-5', base: 'odeur du houblon brut (Hopsteiner)', type: 'note' },
};
const ORDRE_CHAMPS = Object.keys(CHAMPS);
const TETE = ['linalol', 'geraniol', 'farnesene', 'betaPinene', 'selinene', 'cohumulone', 'thiols', 'polyphenols', 'intensite_arome'];

// Raisons : code → [type, texte]. « h » : valeur gardée hors de l'enveloppe ; « s » : valeur suspecte (hors de l'enveloppe aussi).
const RAISONS = {
  'h-unite-absente': ['hors', 'unité non écrite par la source'],
  'h-unite-autre': ['hors', 'unité différente de celle du champ'],
  'h-base-absente': ['hors', 'base non publiée (sur quoi porte le pourcentage ?)'],
  'h-base-autre': ['hors', 'base différente de celle du champ'],
  'h-huile-pct': ['hors', 'huile écrite en %, pas en mL/100 g (base inconnue)'],
  'h-contradiction': ['hors', 'unité et base se contredisent'],
  'h-echelle': ['hors', 'échelle non publiée'],
  'h-sens': ['hors', 'sens du champ non établi'],
  's-sup100': ['suspect', 'pourcentage au-dessus de 100'],
  's-somme': ['suspect', 'les minimums des composés de la fiche somment au-delà de 100'],
  's-huile6': ['suspect', 'huile totale au-delà de 6 mL/100 g'],
  's-alpha25': ['suspect', 'α au-delà de 25 %'],
  's-inversee': ['suspect', 'plage inversée (min > max)'],
  's-negative': ['suspect', 'borne négative'],
  's-fraction': ['suspect', 'composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie)'],
};

// ───────────────────────── Lecture d'une valeur ─────────────────────────
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const arr1 = (x) => Math.round(x * 10) / 10;
function unite(u) {
  if (u == null) return null;
  const s = String(u).trim().toLowerCase().replace(/\s+/g, '');
  if (s === '%') return '%';
  if (s === 'ml/100g') return 'mL/100 g';
  if (s === 'lb/acre' || s === 'lbs/acre') return 'lb/acre';
  return String(u).trim();
}
const baseDe = (v) => v.base ?? v.baseImplicite ?? null;
const surAlpha = (b) => typeof b === 'string' && /α|alpha/i.test(b);
const surBeta = (b) => typeof b === 'string' && /β|beta/i.test(b);
const surHuile = (b) => typeof b === 'string' && /huile|oil/i.test(b);
const surMasse = (b) => b == null || /m\/m|poids|masse/i.test(b);

/** Lit une valeur de source : { lo, hi, hors: code|null } ou null si la source n'a rien (inconnu : jamais 0). */
function lireValeur(canon, v, sid) {
  let lo = num(v.min);
  let hi = num(v.max);
  if (lo == null && hi == null && num(v.valeur) != null) { lo = num(v.valeur); hi = lo; }
  if (lo == null && hi == null) return null;
  const regle = CHAMPS[canon];
  const u = unite(v.unite);
  const b = baseDe(v);
  let hors = null;
  switch (regle.type) {
    case 'masse':
      if (u == null) hors = 'h-unite-absente'; else if (u !== '%') hors = 'h-unite-autre'; else if (!surMasse(b)) hors = 'h-base-autre';
      break;
    case 'huile':
      if (u === '%' && typeof v.base === 'string' && /ml/i.test(v.base)) hors = 'h-contradiction';
      else if (u === '%') hors = 'h-huile-pct'; else if (u == null) hors = 'h-unite-absente'; else if (u !== 'mL/100 g') hors = 'h-unite-autre';
      break;
    case 'sur-alpha':
      if (u == null) hors = 'h-unite-absente'; else if (u !== '%') hors = 'h-unite-autre'; else if (b == null) hors = 'h-base-absente'; else if (!surAlpha(b)) hors = 'h-base-autre';
      break;
    case 'sur-beta':
      if (u == null) hors = 'h-unite-absente'; else if (u !== '%') hors = 'h-unite-autre'; else if (b == null) hors = 'h-base-absente'; else if (!surBeta(b)) hors = 'h-base-autre';
      break;
    case 'compose':
      if (u == null) hors = 'h-unite-absente'; else if (u !== '%') hors = 'h-unite-autre'; else if (b == null) hors = 'h-base-absente'; else if (!surHuile(b)) hors = 'h-base-autre';
      break;
    case 'thiols': if (u !== 'µg/kg') hors = u == null ? 'h-unite-absente' : 'h-unite-autre'; break;
    case 'intensite': if (!(typeof b === 'string' && /\/10/.test(b))) hors = 'h-echelle'; break;
    case 'conservation': if (u !== '% des α restants') hors = u == null ? 'h-unite-absente' : 'h-unite-autre'; break;
    case 'rendement':
      // Erreur de lecture de la collecte BSG : « 2,200 – 2,400 lbs/acre » lu 2.2–2.4 (le séparateur de milliers est perdu). Corrigé ici d'après le texte brut.
      if (typeof v.brut === 'string' && /\d,\d{3}/.test(v.brut) && (hi ?? lo) < 100) { lo = lo == null ? null : lo * 1000; hi = hi == null ? null : hi * 1000; }
      if (u === 'lb/acre') { lo = lo == null ? null : arr1(lo * 1.12085116); hi = hi == null ? null : arr1(hi * 1.12085116); }
      else if (u !== 'kg/ha') hors = u == null ? 'h-unite-absente' : 'h-unite-autre';
      break;
    case 'note': if (u !== 'note 0-5') hors = u == null ? 'h-unite-absente' : 'h-unite-autre'; break;
    case 'ratio': if (u != null) hors = 'h-unite-autre'; break;
    default: hors = 'h-sens';
  }
  // Suspects : posés seulement quand l'unité est sûre ; une raison d'unité passe avant.
  if (!hors) {
    if ((lo != null && lo < 0) || (hi != null && hi < 0)) hors = 's-negative';
    else if (lo != null && hi != null && lo > hi) hors = 's-inversee';
    else if (regle.unite === '%' && ((lo ?? 0) > 100 || (hi ?? 0) > 100)) hors = 's-sup100';
    else if (sid === 'charlesfaram' && regle.type === 'compose' && num(v.min) == null && num(v.max) == null && typeof v.brut === 'string' && /^\s*0?\.\d+\s*$/.test(v.brut)) hors = 's-fraction';
    else if (regle.type === 'huile' && ((lo ?? 0) > 6 || (hi ?? 0) > 6)) hors = 's-huile6';
    else if (canon === 'alpha' && ((lo ?? 0) > 25 || (hi ?? 0) > 25)) hors = 's-alpha25';
  }
  return { lo, hi, hors };
}

// ───────────────────────── Rattachement : vérification ─────────────────────────
const catalogue = lire(resolve(racine, 'src/data/hopV4/proto-data.json')).varieties;
const parId = new Map(catalogue.map((v) => [v.id, v]));
const norm = (s) => String(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ORIGINES = {
  us: 'États-Unis', usa: 'États-Unis', american: 'États-Unis', 'united states': 'États-Unis',
  de: 'Allemagne', gr: 'Allemagne', ger: 'Allemagne', germany: 'Allemagne',
  uk: 'Royaume-Uni', english: 'Royaume-Uni', 'united kingdom': 'Royaume-Uni', england: 'Royaume-Uni', 'great britain': 'Royaume-Uni',
  nz: 'Nouvelle-Zélande', 'new zealand': 'Nouvelle-Zélande',
  au: 'Australie', aus: 'Australie', australia: 'Australie',
  cz: 'Tchéquie', czech: 'Tchéquie', 'czech republic': 'Tchéquie', czechia: 'Tchéquie',
  si: 'Slovénie', slovenia: 'Slovénie', fr: 'France', france: 'France',
  bc: 'Canada', canada: 'Canada', rsa: 'Afrique du Sud', 'south africa': 'Afrique du Sud',
  pl: 'Pologne', poland: 'Pologne', jp: 'Japon', japan: 'Japon',
};
/** Origines que le nom ou la fiche annoncent (suffixe « (UK) », préfixe « NZ »), en français comme le catalogue. */
function originesAnnoncees(fiche) {
  const out = new Set();
  const nom = String(fiche.nom);
  for (const m of nom.matchAll(/\(([^)]+)\)/g)) { const o = ORIGINES[m[1].trim().toLowerCase()]; if (o) out.add(o); }
  const pre = nom.match(/^([A-Za-z]{2,6})\s+\S/);
  if (pre && ORIGINES[pre[1].toLowerCase()]) out.add(ORIGINES[pre[1].toLowerCase()]);
  const lo = fiche.listes?.origine;
  if (fiche.__source === 'hopslist' && Array.isArray(lo)) for (const x of lo) { const o = ORIGINES[String(x).trim().toLowerCase()]; if (o) out.add(o); }
  return out;
}
// Cas relus à la main (26.10) : le nom est ambigu même si l'origine ne l'est pas.
const REJETS_MANUELS = {
  'hopdatabase|Wai': 'abréviation : l\'URL est celle de NZ Wai-iti, pas de Waimea',
};
/** Rend { ok, raison } pour un rattachement proposé par la voie de collecte. */
function verifierRattachement(sid, fiche) {
  const v = parId.get(fiche.varietyId);
  if (!v) return { ok: false, raison: 'identifiant absent du catalogue' };
  const manuel = REJETS_MANUELS[`${sid}|${fiche.nom}`];
  if (manuel) return { ok: false, raison: manuel };
  const annoncees = originesAnnoncees(fiche);
  if (annoncees.size > 0 && v.origin && !annoncees.has(v.origin)) {
    return { ok: false, raison: `origine annoncée (${[...annoncees].join(', ')}) différente de celle du catalogue (${v.origin})` };
  }
  return { ok: true, raison: null };
}

// ───────────────────────── Fusion ─────────────────────────
const anneeDe = (f) => {
  const p = f.publie;
  const s = typeof p === 'string' ? p : p && typeof p === 'object' ? p.date ?? null : null;
  const m = typeof s === 'string' ? s.match(/^(\d{4})/) : null;
  return m ? Number(m[1]) : null;
};

const varietes = new Map(); // id → { fiches: Map(clé → index), liste: [], champs: Map(canon → [valeurs]) }
const stats = { fiches: {}, rattachees: {}, ecartees: {}, valeurs: {}, hors: {}, suspects: {} };
const nonRattachees = [];
const ecartees = [];
const aRelire = [];
const champsNonRepris = {};
const suspectsListe = [];
const illisibles = [];
const listeSources = SOURCES.map((s) => s.id);
const tableSources = [];
const bump = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n; };

for (const s of SOURCES) {
  const j = lire(resolve(DIR_SOURCES, `${s.id}.json`));
  const src = j.source;
  tableSources.push({ id: s.id, nom: src.nom, hote: src.hote, diffusion: s.diffusion, lu: s.lu, ...(s.decision ? { decision: s.decision } : {}), type: src.type ?? null, releve: String(src.releve ?? '').slice(0, 10) || null });
  const sidx = listeSources.indexOf(s.id);
  for (const fiche of j.fiches) {
    fiche.__source = s.id;
    bump(stats.fiches, s.id);
    const champs = fiche.champs ?? {};
    if (!fiche.varietyId) {
      if (s.id !== 'brewersfriend') {
        nonRattachees.push({ source: s.id, nom: fiche.nom, url: fiche.url ?? null, candidats: fiche.rattachement?.candidats ?? [], raison: fiche.rattachement?.via ?? fiche.rattachement ?? 'non résolu par la collecte' });
      }
      continue;
    }
    const ver = verifierRattachement(s.id, fiche);
    if (!ver.ok) {
      bump(stats.ecartees, s.id);
      ecartees.push({ source: s.id, nom: fiche.nom, propose: fiche.varietyId, raison: ver.raison, url: fiche.url ?? null });
      const frere = catalogue.filter((v) => norm(v.name).startsWith(norm(parId.get(fiche.varietyId)?.name ?? '').replace(/ (us|gr|cz)$/, '')) && v.id !== fiche.varietyId).map((v) => v.id);
      nonRattachees.push({ source: s.id, nom: fiche.nom, url: fiche.url ?? null, candidats: [fiche.varietyId, ...frere].slice(0, 4), raison: `écarté à la fusion : ${ver.raison}` });
      continue;
    }
    bump(stats.rattachees, s.id);
    // Rattachements à relire : par alias, code ou nom différent du catalogue.
    const via = typeof fiche.rattachement === 'string' ? fiche.rattachement : fiche.rattachement?.via ?? fiche.rattachement?.methode ?? null;
    const v0 = parId.get(fiche.varietyId);
    if (norm(fiche.nom) !== norm(v0.name)) aRelire.push({ source: s.id, nom: fiche.nom, id: fiche.varietyId, nomCatalogue: v0.name, via: via ?? 'nom différent' });

    // Valeurs de la fiche, puis règle de la somme des minimums des composés de l'huile.
    const lues = [];
    for (const [cle2, v] of Object.entries(champs)) {
      const canon = SYNONYMES[cle2];
      if (!canon) { if (num(v.min) != null || num(v.max) != null || num(v.valeur) != null) bump(champsNonRepris, `${s.id}.${cle2}`); continue; }
      const r = lireValeur(canon, v, s.id);
      if (!r) {
        if (typeof v.brut === 'string' && /^\s*-\s*\d+(\.\d+)?\s*-/.test(v.brut)) illisibles.push({ source: s.id, nom: fiche.nom, champ: canon, brut: v.brut, id: fiche.varietyId });
        continue;
      }
      lues.push({ canon, ...r });
    }
    if (!lues.length) continue; // une fiche sans valeur n'entre pas dans le fichier
    const fv = varietes.get(fiche.varietyId) ?? { fiches: new Map(), liste: [], champs: new Map() };
    varietes.set(fiche.varietyId, fv);
    const cle = `${sidx}|${fiche.url ?? ''}`;
    if (!fv.fiches.has(cle)) { fv.fiches.set(cle, fv.liste.length); fv.liste.push([sidx, fiche.url ?? null, anneeDe(fiche)]); }
    const fi = fv.fiches.get(cle);
    const somme = lues.filter((x) => COMPOSES_HUILE.includes(x.canon) && !x.hors && x.lo != null).reduce((t, x) => t + x.lo, 0);
    for (const x of lues) {
      if (!x.hors && COMPOSES_HUILE.includes(x.canon) && somme > 100) x.hors = 's-somme';
      const liste = fv.champs.get(x.canon) ?? [];
      fv.champs.set(x.canon, liste);
      liste.push({ fi, sid: sidx, lo: x.lo, hi: x.hi, code: x.hors });
      bump(stats.valeurs, s.id);
      if (x.hors) {
        if (RAISONS[x.hors][0] === 'suspect') { bump(stats.suspects, s.id); suspectsListe.push({ source: s.id, nom: fiche.nom, id: fiche.varietyId, champ: x.canon, lo: x.lo, hi: x.hi, code: x.hors, url: fiche.url ?? null }); }
        else bump(stats.hors, `${s.id}|${x.hors}`);
      }
    }
  }
}

// Enveloppe : du plus bas au plus haut des valeurs valides (sans code), jamais de moyenne.
const enveloppe = (liste) => {
  const ok = liste.filter((x) => !x.code);
  if (!ok.length) return null;
  const los = ok.map((x) => x.lo).filter((x) => x != null);
  const his = ok.map((x) => x.hi).filter((x) => x != null);
  return [los.length ? Math.min(...los) : null, his.length ? Math.max(...his) : null];
};

const ids = [...varietes.keys()].sort();
const sortie = {
  version: 1,
  note: 'Fusion des sources de src/data/hopSources (voie d3a-fusion). Valeur = [fiche, min, max, raison?]. e = enveloppe des valeurs valides (même unité et base) : jamais une moyenne. Un inconnu est absent, jamais 0.',
  decisionDiffusion: DECISION_26_10,
  sources: tableSources,
  champs: Object.fromEntries(ORDRE_CHAMPS.map((c) => [c, { libelle: CHAMPS[c].libelle, unite: CHAMPS[c].unite, base: CHAMPS[c].base }])),
  raisons: RAISONS,
  varietes: {},
};
for (const id of ids) {
  const fv = varietes.get(id);
  const c = {};
  for (const canon of ORDRE_CHAMPS) {
    const liste = fv.champs.get(canon);
    if (!liste) continue;
    const l = [...liste].sort((a, b) => a.sid - b.sid || a.fi - b.fi || (a.lo ?? -1) - (b.lo ?? -1) || (a.hi ?? -1) - (b.hi ?? -1));
    const e = enveloppe(l);
    c[canon] = { ...(e ? { e } : {}), v: l.map((x) => (x.code ? [x.fi, x.lo, x.hi, x.code] : [x.fi, x.lo, x.hi])) };
  }
  sortie.varietes[id] = { f: fv.liste, c };
}
const texte = JSON.stringify(sortie) + '\n';
const nrTexte = JSON.stringify({
  version: 1,
  note: 'Fiches des sources sans variété du catalogue (ambiguës, absentes ou écartées à la fusion). Non importé par l\'app : tri à part. Aucune variété n\'est ajoutée au catalogue.',
  fiches: nonRattachees.sort((a, b) => a.source.localeCompare(b.source) || a.nom.localeCompare(b.nom) || String(a.url).localeCompare(String(b.url))),
}) + '\n';

// ───────────────────────── Rapport ─────────────────────────
const N = catalogue.length;
const presente = (r) => Array.isArray(r) && r.some((x) => typeof x === 'number' && Number.isFinite(x));
const AVANT = {
  alpha: (v) => presente(v.alpha), beta: (v) => presente(v.beta), huile: (v) => presente(v.oil), cohumulone: (v) => presente(v.cohumulone),
  myrcene: (v) => presente(v.oils?.myrcene), humulene: (v) => presente(v.oils?.humulene), caryophyllene: (v) => presente(v.oils?.caryophyllene),
  farnesene: (v) => presente(v.oils?.farnesene), linalol: (v) => presente(v.hsLinalool?.range), hsi: (v) => Array.isArray(v.bm?.hsi),
};
const RESTREINTES = new Set(SOURCES.filter((s) => s.diffusion === 'restreinte').map((s) => listeSources.indexOf(s.id)));
const compte = (canon, filtre) => {
  let avant = 0, apres = 0, horsSeul = 0, sansRestreintes = 0;
  for (const v of catalogue) {
    const a = AVANT[canon]?.(v) ?? false;
    const liste = varietes.get(v.id)?.champs.get(canon) ?? [];
    const ok = liste.filter((x) => !x.code);
    const okSans = ok.filter((x) => !RESTREINTES.has(x.sid));
    if (a) avant++;
    if (a || ok.length) apres++;
    if (a || okSans.length) sansRestreintes++;
    if (!a && !ok.length && liste.length) horsSeul++;
  }
  return { avant, apres, horsSeul, sansRestreintes };
};
const pct = (n) => `${((100 * n) / N).toFixed(1).replace('.', ',')} %`;
const fmt = (x) => (x == null ? '·' : String(Math.round(x * 100) / 100).replace('.', ','));
const plage = (lo, hi) => (lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`);

const lignes = [];
const L = (s = '') => lignes.push(s);
const nomSource = (i) => tableSources[i].nom.replace(/ \(.*/, '').replace(/ — .*/, '');
let nbValeurs = 0, nbHors = 0, nbSusp = 0, nbEnv = 0, nbFichesRatt = 0, nbFichesTot = 0;
for (const s of SOURCES) { nbValeurs += stats.valeurs[s.id] ?? 0; nbSusp += stats.suspects[s.id] ?? 0; nbFichesRatt += stats.rattachees[s.id] ?? 0; nbFichesTot += stats.fiches[s.id] ?? 0; }
for (const k of Object.keys(stats.hors)) nbHors += stats.hors[k];
for (const v of varietes.values()) for (const l of v.champs.values()) if (enveloppe(l)) nbEnv++;

L('# Fusion des données houblons collectées (#180, voie d3a-fusion)');
L();
L('Généré par `node scripts/collecte-hop/fusion.mjs` (hors ligne, déterministe). Sources : `src/data/hopSources/*.json` (18). Catalogue : `src/data/hopV4/proto-data.json` (318 variétés).');
L();
L('## Résumé');
L();
L(`- Fiches lues : ${nbFichesTot} (dont Brewer's Friend : ${stats.fiches.brewersfriend ?? 0} lignes d'index sans valeur chimique). Rattachées et fusionnées : ${nbFichesRatt}. Écartées à la fusion : ${ecartees.length}. Non rattachées (liste à part) : ${nonRattachees.length}.`);
L(`- Variétés du catalogue touchées : ${varietes.size} sur ${N}.`);
L(`- Valeurs fusionnées : ${nbValeurs}. Dans une enveloppe : ${nbValeurs - nbHors - nbSusp}. Hors enveloppe (unité ou base inconnue ou différente) : ${nbHors}. Suspectes : ${nbSusp}. Enveloppes calculées : ${nbEnv} (variété × champ).`);
L('- Règles : une liste de valeurs par source et par champ, avec URL et année publiée ; enveloppe = du plus bas au plus haut des valeurs valides, jamais une moyenne ; un inconnu est absent, jamais 0.');
L('- Les composés de l\'huile dont la base « % de l\'huile » a été déduite par la voie de collecte (BarthHaas, Charles Faram, BHA : `baseLue: false`) entrent dans l\'enveloppe : le libellé du composé suffit. Les champs d\'une source sans base (Crosby, Indie, USA Hops : `baseImplicite`) entrent aussi quand la collecte a posé la base ; un pourcentage sans aucune base reste hors enveloppe.');
L('- Rendement : les lb/acre sont converties en kg/ha (× 1,12085), arrondies à 0,1.');
L('- Statu quo : les valeurs Hopsteiner déjà dans le catalogue (α, β, huile, linalol, 79 variétés) restent telles quelles dans `proto-data.json` ; `complements.json` porte en plus la liste de Hopsteiner avec son URL.');
L();
L('## Diffusion de chaque source');
L();
L(`Décision de l'utilisateur (26.10) : ${DECISION_26_10}`);
L();
L('| Source | Diffusion | Ce qui a été lu |');
L('|---|---|---|');
for (const t of tableSources) L(`| ${t.nom} (\`${t.id}\`) | **${t.diffusion}** | ${t.lu.replace(/\|/g, '/')} |`);
L();
L('À vérifier : les conditions de BarthHaas, de Charles Faram et de la BHA n\'ont pas de clause lue (BHA : page de conditions vide). Ces trois sources restent `inconnue`.');
L();
L('## Couverture des 318 variétés, champ par champ');
L();
L('« Avant » : le catalogue seul. « Après » : catalogue + enveloppes de `complements.json` (toutes sources). « Sans Hopsteiner ni Haas » : ce que l\'on aurait sans les deux sources `restreinte`. « Hors enveloppe seul » : variétés où la seule valeur disponible est hors enveloppe (unité ou base inconnue, suspect) : gardée, non comptée.');
L();
L('| Champ | Avant | Après | Gain | Sans Hopsteiner ni Haas | Hors enveloppe seul |');
L('|---|---:|---:|---:|---:|---:|');
const cc = {};
const ordreRapport = [...TETE, ...ORDRE_CHAMPS.filter((c) => !TETE.includes(c))];
for (const c of ordreRapport) {
  const r = compte(c);
  cc[c] = r;
  const gras = TETE.includes(c) ? '**' : '';
  L(`| ${gras}${CHAMPS[c].libelle}${gras} (\`${c}\`, ${CHAMPS[c].base}) | ${r.avant} (${pct(r.avant)}) | ${r.apres} (${pct(r.apres)}) | +${r.apres - r.avant} | ${r.sansRestreintes} (${pct(r.sansRestreintes)}) | ${r.horsSeul} |`);
}
L();
L('Notes : « avant » du linalol = `hsLinalool` (Hopsteiner, 64 variétés dans le catalogue) ; thiols, β-pinène, sélinène, géraniol, polyphénols, xanthohumol, colupulone : absents du catalogue (0). Le catalogue porte la classe « Thiol impact » de Hopsteiner (qualitative, non comptée ici) ; les thiols chiffrés viennent de BarthHaas seule. `hsi` avant = `bm.hsi` de Beer Maverick.');
L();
L('## Désaccords entre sources au-delà d\'un facteur 2 (les 20 plus forts)');
L();
L('Rapport entre le milieu de plage le plus haut et le plus bas, entre deux sources différentes, sur les valeurs valides (dans l\'enveloppe). Milieux ≥ 0,1 seulement (les traces font des rapports sans sens). Aucune réconciliation : l\'enveloppe garde les deux.');
L();
const desaccords = [];
for (const id of ids) {
  const fv = varietes.get(id);
  for (const [canon, liste] of fv.champs) {
    const pts = liste.filter((x) => !x.code && (x.lo != null || x.hi != null)).map((x) => ({ sid: x.sid, lo: x.lo, hi: x.hi, mid: x.lo != null && x.hi != null ? (x.lo + x.hi) / 2 : x.lo ?? x.hi })).filter((x) => x.mid >= 0.1);
    if (new Set(pts.map((p) => p.sid)).size < 2) continue;
    const hi = pts.reduce((a, b) => (b.mid > a.mid ? b : a));
    const lo = pts.reduce((a, b) => (b.mid < a.mid ? b : a));
    if (hi.sid === lo.sid) continue;
    if (hi.mid / lo.mid > 2) desaccords.push({ id, canon, ratio: hi.mid / lo.mid, hi, lo });
  }
}
desaccords.sort((a, b) => b.ratio - a.ratio || a.id.localeCompare(b.id) || a.canon.localeCompare(b.canon));
L(`${desaccords.length} désaccords au total.`);
L();
L('| Variété | Champ | Rapport | Plus haut | Plus bas |');
L('|---|---|---:|---|---|');
for (const d of desaccords.slice(0, 20)) L(`| ${parId.get(d.id).name} | ${CHAMPS[d.canon].libelle} | ×${d.ratio.toFixed(1).replace('.', ',')} | ${nomSource(d.hi.sid)} ${plage(d.hi.lo, d.hi.hi)} | ${nomSource(d.lo.sid)} ${plage(d.lo.lo, d.lo.hi)} |`);
L();
L('## Valeurs suspectes (gardées, hors enveloppe)');
L();
const parCode = {};
for (const s of suspectsListe) bump(parCode, s.code);
L(Object.entries(parCode).sort().map(([k, n]) => `${RAISONS[k][1]} : ${n}`).join(' ; ') || 'aucune');
L();
L('| Source | Variété (fiche) | Champ | Valeur | Raison |');
L('|---|---|---|---|---|');
suspectsListe.sort((a, b) => a.source.localeCompare(b.source) || a.id.localeCompare(b.id) || a.champ.localeCompare(b.champ));
for (const s of suspectsListe.slice(0, 120)) L(`| ${s.source} | ${s.nom} → ${parId.get(s.id).name} | ${s.champ} | ${plage(s.lo, s.hi)} | ${RAISONS[s.code][1]} |`);
if (suspectsListe.length > 120) L(`| … | ${suspectsListe.length - 120} autres suspectes dans \`complements.json\` (raison commençant par « s- »). | | | |`);
L();
L('Charles Faram : sa page porte des artefacts de tableur — huile « 10.3 » ou « 20.4-30.9 » pour 1,3 ou 2,4–3,9 ; β « 45050 » et cohumulone « 41579 » (numéros de date Excel) ; myrcène « 0.42 » pour 42 %. Les valeurs qui dépassent les seuils sont suspectes ; celles qui restent dans les seuils (« 0.7-1.3 » lisible) n\'ont aucun moyen d\'être distinguées : à relire avant d\'afficher une huile de Charles Faram.');
L('BSG : le rendement « 2,200 – 2,400 lbs/acre » avait été lu 2.2–2.4 par la collecte (séparateur de milliers perdu) ; corrigé à la fusion d’après le texte brut (× 1000), puis converti en kg/ha.');
L();
L('Bornes négatives illisibles (valeur nulle côté collecte, brut gardé : non fusionnées, listées ici) :');
L();
L(illisibles.length ? illisibles.map((x) => `- ${x.source} : ${x.nom} (${x.id ? parId.get(x.id).name : 'non rattachée'}), ${x.champ} « ${x.brut} »`).join('\n') : '- aucune sur des fiches rattachées (TerraFlux HBC 682 de BarthHaas n\'est pas rattachée au catalogue).');
L();
L('## Valeurs hors enveloppe (unité ou base inconnue ou différente)');
L();
L('| Source | Raison | Valeurs |');
L('|---|---|---:|');
for (const k of Object.keys(stats.hors).sort()) { const [s, c] = k.split('|'); L(`| ${s} | ${RAISONS[c][1]} | ${stats.hors[k]} |`); }
L();
L('HopDatabase et hops-json n\'écrivent aucune unité : tout est gardé, rien n\'entre dans une enveloppe. Les chiffres de leur README suggèrent α, β, cohumulone en % et huile en mL/100 g ; HopDatabase est un agrégat de catalogues de fournisseurs déjà fusionnés ici (doublon probable). À trancher si l\'on veut les compter : une règle « unité du README » les ferait entrer.');
L('Charles Faram : « Flavour Intensity » sans échelle écrite (hors enveloppe) ; seule la BHA (sur 10) entre dans l\'enveloppe d\'intensité d\'arôme.');
L();
L('## Fiches non rattachées et rattachements vérifiés');
L();
L('Aucune variété n\'est ajoutée au catalogue ici. Les fiches sans variété (ambiguës, absentes, ou écartées par la vérification) sont dans `src/data/hopV4/complements-non-rattachees.json` avec leurs candidats ; leurs valeurs restent dans `src/data/hopSources/`.');
L();
L('| Source | Fiches | Rattachées | Écartées à la fusion | Non rattachées (total) |');
L('|---|---:|---:|---:|---:|');
for (const s of SOURCES) L(`| ${s.id} | ${stats.fiches[s.id] ?? 0} | ${stats.rattachees[s.id] ?? 0} | ${stats.ecartees[s.id] ?? 0} | ${nonRattachees.filter((x) => x.source === s.id).length} |`);
L();
L('Brewer\'s Friend : index sans valeur chimique ; ses lignes non rattachées ne sont pas listées.');
L();
L('### Rattachements écartés à la fusion (dans le doute : non rattaché)');
L();
L('Règle : l\'origine annoncée par le nom (« (UK) », « NZ », « GR »…) ou par la page Hopslist doit être celle de la variété du catalogue ; sinon la fiche est écartée.');
L();
for (const e of ecartees.sort((a, b) => a.source.localeCompare(b.source) || a.nom.localeCompare(b.nom))) L(`- ${e.source} : « ${e.nom} » → ${parId.get(e.propose)?.name ?? e.propose} : ${e.raison}`);
L();
L('### Rattachements à relire (nom différent du catalogue, acceptés)');
L();
const relus = {};
for (const r of aRelire) (relus[r.source] ??= new Map()).set(r.nom, `${r.nom} → ${r.nomCatalogue}`);
for (const s of SOURCES) if (relus[s.id]) L(`- **${s.id}** (${relus[s.id].size}) : ${[...relus[s.id].values()].sort().join(' ; ')}`);
L();
L('Relus à la main (26.10) : `heb` Hersbrucker Spät → Hersbrucker (même variété) ; `ssg` Styrian Savinjski Golding → Styrian Golding (Savinjski Golding est le nom slovène de Styrian Golding) ; `sul` Sultana → Sultana (Denali) (Denali s\'est appelée Sultana chez Hopsteiner) ; East Kent Golding → East Kent Goldings (singulier/pluriel) ; Hallertauer Gold → Hallertau Gold ; Whitbread Golding → WGV. Écartés : Cascade (NZ/UK), Fuggle (US/NZ), Golding (SI/BC/UK), Willamette (AUS), Cluster (AUS), Hallertau de Hopslist (Allemagne, catalogue : version US), Tettnanger (US) de Hopslist (catalogue : version allemande), Wai de HopDatabase (= NZ Wai-iti). Acceptés avec doute : Feux-Coeur → Feux-Coeur Francais (seul de sa famille) ; Extra Styrian Dana → Dana.');
L();
L('### Fiches sans variété du catalogue : par source, avec candidats');
L();
const nrParSource = {};
for (const x of nonRattachees) (nrParSource[x.source] ??= []).push(x);
for (const s of SOURCES) {
  const l = nrParSource[s.id];
  if (!l) continue;
  const avecC = l.filter((x) => x.candidats.length);
  const sansC = l.filter((x) => !x.candidats.length);
  L(`- **${s.id}** : ${l.length} (${avecC.length} avec candidats, ${sansC.length} absentes du catalogue).${avecC.length ? ` Candidats : ${avecC.slice(0, 12).map((x) => `${x.nom} [${x.candidats.map((c) => c.replace('beermaverick-', '')).join(', ')}]`).join(' ; ')}${avecC.length > 12 ? ' ; …' : ''}.` : ''}`);
}
L();
L('## Champs numériques non repris');
L();
L(Object.keys(champsNonRepris).length ? Object.entries(champsNonRepris).sort().map(([k, n]) => `${k} (${n})`).join(', ') + '.' : 'aucun.');
L('Non repris aussi (listes et textes, hors enveloppe) : descripteurs, substituts, styles, accords, roses aromatiques de BarthHaas (12 axes), classe « Thiol impact » de Hopsteiner, maturité, résistances, origine, lignée, formes. Ils restent dans `src/data/hopSources/` pour l\'étape de l\'interface.');
L();

const poids = { brut: Buffer.byteLength(texte), gzip: gzipSync(Buffer.from(texte), { level: 9 }).length, nr: Buffer.byteLength(nrTexte) };
L('## Poids');
L();
L(`- \`complements.json\` : ${poids.brut} octets bruts (${(poids.brut / 1000).toFixed(1)} ko), ${poids.gzip} octets gzip (${(poids.gzip / 1000).toFixed(1)} ko). ${varietes.size} variétés.`);
L(`- \`complements-non-rattachees.json\` : ${poids.nr} octets (jamais importé par l'app).`);
L('- Chargé à la demande par `chargerComplements()` (import dynamique, `src/domain/hopIndex/v4/complements.ts`) : hors du démarrage et des outils. Mesure B5 : voir RESULTAT.md.');
const rapport = lignes.join('\n') + '\n';

// ───────────────────────── Écriture ─────────────────────────
const sorties = [[SORTIE, texte], [SORTIE_NR, nrTexte], [RAPPORT, rapport]];
const sansEcriture = process.argv.includes('--sans-ecriture');
for (const [p, t] of sorties) {
  if (!sansEcriture && (!existsSync(p) || readFileSync(p, 'utf8') !== t)) writeFileSync(p, t);
  console.log(`${p.slice(racine.length + 1).replace(/\\/g, '/')} sha256 ${sha(t)} (${Buffer.byteLength(t)} octets)`);
}
console.log(`variétés ${varietes.size}, valeurs ${nbValeurs}, hors enveloppe ${nbHors}, suspectes ${nbSusp}, écartées ${ecartees.length}, non rattachées ${nonRattachees.length}`);
