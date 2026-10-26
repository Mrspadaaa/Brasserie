// Construit les données du prototype houblons v4 (#119) depuis le dépôt et le fixture de
// production (lecture seule). Repris de prototypes/houblons-v3/build-data.mjs : variétés
// Beer Maverick (318), descripteurs Hopsteiner reliés par le nom, stock relié par le nom
// de l'article (#120), statistiques des styles BJCP 2021.
// Différence avec la v3 : les descriptions gardent leur forme HopVariety (texte + source)
// pour être lues par le moteur V5.5 (hopDescriptorEvidence), sans axe recalculé ici.
// Usage (depuis prototypes/houblons-v4) : node scripts/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repo = path.resolve(here, '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const FIXTURE = 'tests/fixtures/production/houblons-2026-10-17.json';
const bm = read('src/data/hopBeerMaverickBootstrap.json').hopVarieties;
// Dossier étendu de chaque page Beer Maverick (cohumulone, farnésène, autres huiles, usage, styles, substituts, accords, profil d'arôme),
// extrait du cache par scripts/scrape-hop-community.mjs --offline. Une valeur absente de la page y est null, jamais 0.
// (fichier à part : le pack Beer Maverick est installé par l'app et ne porte que ses collections.)
const bmFiches = new Map(read('src/data/hopBeerMaverickFiches.json').map((f) => [f.id, f]));
const plage = (x) => (x ? [x.min, x.max] : null);
const hs = read('src/data/hopManufacturerBootstrap.json').hopVarieties;
const bjcp = read('src/data/brewingStylesBootstrap.json').find((g) => g.id === 'styles-bjcp-2021');
const prod = read(FIXTURE);

// Traductions des tags Beer Maverick (reprises de la v3, sous-ensemble utile).
const FR = { pepper: 'poivre', 'tropical fruit': 'fruits tropicaux', 'sauvignon blanc': 'sauvignon blanc', 'blood orange': 'orange sanguine', 'black pepper': 'poivre noir', citrus: 'agrumes', floral: 'floral', spicy: 'épicé', herbal: 'herbacé', pine: 'pin', fruity: 'fruité', tropical: 'tropical', lemon: 'citron', grapefruit: 'pamplemousse', earthy: 'terreux', orange: 'orange', pineapple: 'ananas', 'passion fruit': 'fruit de la passion', lime: 'citron vert', peach: 'pêche', noble: 'noble', melon: 'melon', grassy: 'herbe coupée', 'stone fruit': 'fruits à noyau', resin: 'résine', tangerine: 'mandarine', woody: 'boisé', berry: 'baies', mint: 'menthe', dank: 'dank', pear: 'poire', green: 'vert', sweet: 'doux', apricot: 'abricot', mango: 'mangue', lemongrass: 'citronnelle', gooseberry: 'groseille à maquereau', tobacco: 'tabac', cedar: 'cèdre', lavender: 'lavande', honey: 'miel', papaya: 'papaye', strawberry: 'fraise', mandarin: 'mandarine', 'white wine': 'vin blanc', hay: 'foin', licorice: 'réglisse', coconut: 'noix de coco', rose: 'rose', cherry: 'cerise', caramel: 'caramel', guava: 'goyave', tea: 'thé', 'black tea': 'thé noir', clove: 'clou de girofle', banana: 'banane', plum: 'prune', 'black currant': 'cassis', cassis: 'cassis', vanilla: 'vanille', lychee: 'litchi', anise: 'anis', blackberry: 'mûre', raspberry: 'framboise', sage: 'sauge', thyme: 'thym', chocolate: 'chocolat', leather: 'cuir', oak: 'chêne', ginger: 'gingembre', elderflower: 'fleur de sureau', marmalade: 'marmelade', onion: 'oignon', garlic: 'ail', blueberry: 'myrtille', apple: 'pomme', grapes: 'raisin', 'white grape': 'raisin blanc', watermelon: 'pastèque', cinnamon: 'cannelle', eucalyptus: 'eucalyptus', jasmine: 'jasmin', geranium: 'géranium', redcurrant: 'groseille', juniper: 'genièvre', cannabis: 'cannabis', curry: 'curry', zest: 'zeste', kiwi: 'kiwi', nectarine: 'nectarine', 'dried fruit': 'fruits secs', fig: 'figue', spice: 'épices', musty: 'renfermé', straw: 'paille', grass: 'herbe', cucumber: 'concombre', rosemary: 'romarin', fennel: 'fenouil', dill: 'aneth', nutmeg: 'muscade', candy: 'bonbon', bubblegum: 'chewing-gum', wine: 'vin', 'orange peel': 'zeste d’orange', pungent: 'piquant', resinous: 'résineux', wood: 'bois', sandalwood: 'santal', blossom: 'fleurs', flowers: 'fleurs', chamomile: 'camomille', honeydew: 'melon miel', quince: 'coing', spearmint: 'menthe verte', menthol: 'menthol', elderberry: 'sureau', 'red berry': 'fruits rouges', berries: 'baies', stonefruit: 'fruits à noyau', passionfruit: 'fruit de la passion', fruit: 'fruit', grape: 'raisin', violet: 'violette', vegetal: 'végétal', cream: 'crème', mild: 'doux', clean: 'net', mojito: 'mojito', coffee: 'café', bohemian: 'bohème' };

const fold = (s) => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[®™]/g, '').replace(/[^a-z0-9]/g, '');
const range = (v, a) => { const x = (v.analysis || []).find((r) => r.analyte === a); return x?.range ? [x.range.min, x.range.max] : x?.value != null ? [x.value, x.value] : null; };
const tagsOf = (v) => {
  const out = [];
  for (const d of v.descriptions || []) {
    const m = d.text.match(/Tags documentaires\s*:\s*(.+)$/);
    if (!m) continue;
    for (const raw of m[1].split(',')) { const t = raw.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ').toLowerCase(); if (t) out.push(t); }
  }
  return [...new Set(out)];
};
const ORIGIN = [[/USA|United States/, 'États-Unis'], [/UK|United Kingdom/, 'Royaume-Uni'], [/GER|Germany/, 'Allemagne'], [/NZ|New Zealand/, 'Nouvelle-Zélande'], [/AUS|Australia/, 'Australie'], [/CZH|Czech/, 'Tchéquie'], [/SLO|Slovenia/, 'Slovénie'], [/FR|France/, 'France'], [/POL|Poland/, 'Pologne'], [/JP|Japan/, 'Japon'], [/SA|South Africa/, 'Afrique du Sud'], [/CAN|Canada/, 'Canada'], [/CN|China/, 'Chine'], [/UA|Ukraine/, 'Ukraine']];
const origin = (o) => ORIGIN.find(([re]) => re.test(o || ''))?.[1] || o || null;
// Origines corrigées par la v3 (revue Fable 18.10.2026) : la fiche Hopsteiner prime.
const ORIGIN_FIX = { 'hallertau-taurus': 'Allemagne', northdown: 'Royaume-Uni' };

// Hopsteiner : descriptions sur houblon brut (familles déclarées, descripteurs), reliées par le nom.
const hsByName = new Map();
for (const v of hs) {
  // Linalol (% de l'huile) et classe « Thiol impact » : signaux de biotransformation, jamais une intensité.
  const lin = v.analysis.find((a) => a.analyte === 'linalool');
  const thiol = v.descriptions.map((d) => d.text.match(/Thiol impact » : (\w+)/)?.[1]).find(Boolean) ?? null;
  const rec = { id: v.id, descriptions: v.descriptions.filter((d) => /^(Familles déclarées|Descripteurs de la fiche)/.test(d.text)),
    linalool: lin ? { range: lin.range ? [lin.range.min, lin.range.max] : [lin.value, lin.value], unit: lin.unit, reference: lin.source.reference, year: lin.source.year } : null,
    thiol: thiol ? { class: thiol, reference: v.descriptions[0]?.source?.reference ?? null } : null,
    // Fiche houblon : alpha, bêta, huile totale de la fiche Hopsteiner (pour comparer aux plages Beer Maverick).
    name: v.name, analysis: { alpha: range(v, 'alpha'), beta: range(v, 'beta'), totalOil: range(v, 'totalOil') },
    reference: v.descriptions[0]?.source?.reference ?? null, year: v.descriptions[0]?.source?.year ?? null };
  for (const n of [v.name, ...v.name.split(/\s*[/(]\s*/)]) if (n) hsByName.set(fold(n.replace(/\)$/, '')), rec);
}
const HS_ALIAS = { saazcz: 'saazer', styriangoldings: 'styriangoldingcelea', styriangolding: 'styriangoldingcelea', saaz: 'saazer', hallertau: 'hallertauermittelfruh', hallertaumittelfruh: 'hallertauermittelfruh', hallertautaurus: 'hallertauertaurus', hallertautradition: 'hallertauertradition', magnum: 'hallertauermagnum', eastkentgoldings: 'goldinguk', ctz: 'columbus' };

// Usages attestés par style (fournisseurs, IPA seulement dans le dépôt), reliés par le nom ou un alias (repris de la v3).
const usagePack = read('src/data/hopStyleUsageBootstrap.json').varieties;
const usageByName = new Map();
for (const u of usagePack) for (const n of [u.name, ...(u.aliases || [])]) usageByName.set(fold(n), u);
const usageOf = (v) => {
  const u = usageByName.get(fold(v.name)) || (v.aliases || []).map((a) => usageByName.get(fold(a))).find(Boolean);
  return u ? u.uses.map((x) => ({ styles: x.styles, roles: x.roles ?? [], source: x.source ? `${x.source.author}, ${x.source.title}` : null, url: x.source?.reference ?? null })) : null;
};

// Faits cités un à un (data/faits-cites.json, D25) : descriptions sourcées ajoutées à la variété.
const facts = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'src', 'data', 'hopV4', 'faits-cites.json'), 'utf8')).facts;
for (const f of facts) if (!bm.some((v) => v.id === f.varietyId)) throw Error(`Fait cité sur une variété absente : ${f.id}`);

// ---- Descripteurs d'arôme des sources de src/data/hopSources (d4-descripteurs, #180, D157) ----
// Chaque source qui publie des mots d'arôme pour une variété devient UNE description du catalogue (une fiche pour le moteur : la fiche se
// reconnaît à auteur + référence). Les mots restent en anglais d'origine (le lexique du moteur les lit tels quels) ; la traduction suit le
// chemin de l'app (tagsFr, versFr), jamais ici. Compact : mots seuls, une ligne par source (budget B5 : le catalogue est dans le chunk des outils).
// Règles (voie d4, VOIE.md) :
// - une source = une fiche, même si elle publie plusieurs listes ou plusieurs pages : les mots sont réunis, la référence est la première page qui en porte ;
// - le contexte vient de la source : Charles Faram « frotté » = houblon brut (rawHop), « bière » = beer (le moteur l'ignore : non reprise, D83) ;
//   les autres sources ne le disent pas : unspecified ;
// - les rattachements écartés à la fusion (complements-non-rattachees.json, raison « écarté à la fusion ») restent écartés ici ;
// - les catégories (familles de la source : bsg, johnihaas, usahops), les intensités (Charles Faram, BHA, Hopsteiner arome_*, BarthHaas rose) et la
//   prose (profilCourt de Crosby, NZ Hops, Hops Direct) ne deviennent pas des descripteurs : décisions à prendre, voir RESULTAT.md de la voie ;
// - HopDatabase et hops-json recopient d'autres sources : au plus UNE fiche « communautaire » par houblon, écartée quand au moins la moitié de ses
//   mots se retrouvent chez les sources primaires de la même variété (mesure : RESULTAT.md), gardée sinon ou quand aucune source primaire n'existe.
const DESC_DIR = path.join(repo, 'src/data/hopSources');
// Charles Faram écrit chaque descripteur par son texte alternatif d'icône (« Citrus », « black pepper »). Pour une icône sans texte lisible, le texte
// alternatif est un nom de fichier (« CharlesFaram-icon-citrus-04-lemon ») ou la légende d'une publicité (« floral / herbal for Epic Hops, Fox hops ») :
// on prend alors l'identifiant de la même place dans l'autre liste (« lemon ») s'il est lisible, sinon on omet (« floralherbal » est une catégorie).
const BRUIT_CF = /icon|\bfor\b|\//i;
const motsCharlesFaram = (alt = [], id = []) => alt.map((a, i) => (!BRUIT_CF.test(a) ? a : id[i] && !BRUIT_CF.test(id[i]) && id[i] !== 'floralherbal' ? id[i] : null)).filter(Boolean);
const SOURCES_MOTS = [
  { id: 'barthhaas', author: 'BarthHaas', kind: 'manufacturer', mots: (l) => l.descripteurs },
  { id: 'charlesfaram', author: 'Charles Faram', kind: 'manufacturer', mots: (l) => motsCharlesFaram(l.altRub, l.descripteursRub), ctx: 'rawHop', bière: (l) => motsCharlesFaram(l.altBiere, l.descripteursBiere) },
  { id: 'crosbyhops', author: 'Crosby Hops', kind: 'manufacturer', mots: (l) => l.aromes },
  { id: 'hpa', author: 'Hop Products Australia', kind: 'manufacturer', mots: (l) => l.descripteurs },
  { id: 'johnihaas', author: 'John I. Haas', kind: 'manufacturer', mots: (l) => l.descripteurs },
  { id: 'nzhops', author: 'NZ Hops', kind: 'manufacturer', mots: (l) => l.descripteursCouverture },
  { id: 'freestylehops', author: 'Freestyle Hops', kind: 'manufacturer', mots: (l) => l.descripteurs },
  { id: 'britishhops', author: 'British Hop Association', kind: 'manufacturer', mots: (l) => l.descripteurs },
  { id: 'bsg', author: 'BSG', kind: 'review', mots: (l) => l.aromes },
  { id: 'yakimavalleyhops', author: 'Yakima Valley Hops', kind: 'review', mots: (l) => l.aromes },
  { id: 'usahops', author: 'USA Hops', kind: 'manufacturer', mots: (l) => l.aromes },
];
const SOURCES_COMMUNAUTAIRES = [{ id: 'hopdatabase', nom: 'HopDatabase (kasperg3)' }, { id: 'hopsjson', nom: 'hops-json (stuartraetaylor)' }];
const ECARTEES = new Set(read('src/data/hopV4/complements-non-rattachees.json').fiches.filter((x) => /^écarté à la fusion/.test(x.raison)).map((x) => `${x.source}|${x.nom}`));
const motNet = (s) => String(s).replace(/,/g, ' ').replace(/^[\s#]+|[\s.]+$/g, '').replace(/\s+/g, ' ');
const lireSource = (id) => JSON.parse(fs.readFileSync(path.join(DESC_DIR, `${id}.json`), 'utf8'));
const anneeDe = (f) => { const p = f.publie; const s = typeof p === 'string' ? p : p && typeof p === 'object' ? p.date ?? null : null; const m = typeof s === 'string' ? s.match(/^(\d{4})/) : null; return m ? Number(m[1]) : null; };
// varietyId → [{ id, mots, bière, url, annee }] dans l'ordre des fiches de la source
const lues = new Map();
for (const s of [...SOURCES_MOTS, ...SOURCES_COMMUNAUTAIRES]) {
  const j = lireSource(s.id);
  for (const f of j.fiches) {
    if (!f.varietyId || ECARTEES.has(`${s.id}|${f.nom}`)) continue;
    const l = f.listes ?? {};
    const mots = (s.mots ? s.mots(l) : l.descripteurs) ?? [];
    const biere = s.bière ? s.bière(l) ?? [] : [];
    if (!mots.length && !biere.length) continue;
    const par = lues.get(f.varietyId) ?? new Map();
    lues.set(f.varietyId, par);
    const cur = par.get(s.id) ?? { mots: [], biere: [], url: null, annee: null, nom: f.nom };
    par.set(s.id, cur);
    for (const [liste, vers] of [[mots, cur.mots], [biere, cur.biere]]) for (const v of liste) { const t = motNet(v); if (t && !vers.some((x) => x.toLowerCase() === t.toLowerCase())) vers.push(t); }
    if (mots.length && !cur.url) { cur.url = f.url ?? null; cur.annee = anneeDe(f); }
    if (!mots.length && !cur.url && cur.biere.length) { cur.urlBiere ??= f.url ?? null; cur.anneeBiere ??= anneeDe(f); }
  }
}
const jetons = (s) => String(s).toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').split(/[^a-z]+/).filter(Boolean).map((t) => t.replace(/s$/, ''));
/** Vrai quand un mot de l'agrégat dit la même chose qu'un mot d'une source primaire (mêmes jetons, ou l'un contenu dans l'autre). */
const recopie = (mot, primaires) => { const a = jetons(mot); return a.length > 0 && primaires.some((p) => { const b = jetons(p); return a.every((t) => b.includes(t)) || b.every((t) => a.includes(t)); }); };
// Forme compacte (D83, 26.10 ; budget B5, le catalogue est dans le chunk des outils) : une table de sources `descSources`, un dictionnaire de mots
// `descMots`, et par variété `fiches` = [[index de source, année (0 : non publiée), index de mot…]…]. Le chargeur de data.ts (descriptionsDe) rend aux
// lecteurs les mêmes objets { text, context, source } qu'une description complète : `reference` = le site de la source (l'adresse de chaque fiche est
// dans complements.json, chargé à la demande), `title` = « <auteur> · fiche variété ». Le contexte « bière » de Charles Faram n'est pas repris (le moteur l'ignore).
const hotes = new Map(), tableSources = [], dicoMots = [], indexMot = new Map();
for (const s of [...SOURCES_MOTS, ...SOURCES_COMMUNAUTAIRES]) hotes.set(s.id, lireSource(s.id).source.hote);
const sourceIdx = (cle, author, kind, ctx, reference) => {
  let i = tableSources.findIndex((t) => t[4] === cle);
  if (i < 0) { i = tableSources.length; tableSources.push([author, kind, ctx, reference, cle]); }
  return i;
};
const motIdx = (m) => { let i = indexMot.get(m); if (i === undefined) { i = dicoMots.length; dicoMots.push(m); indexMot.set(m, i); } return i; };
const stats = { varietesAvecFiche: 0, fiches: 0, communautairesGardees: 0, communautairesEcartees: 0, parSource: {} };
/** Les descriptions de sources d'une variété ; `hopsteiner` : ses descriptions déjà lues (primaires aussi). */
function descriptionsSources(varietyId, hopsteiner) {
  const par = lues.get(varietyId);
  if (!par) return [];
  const out = [];
  const primaires = [...hopsteiner.flatMap((d) => (d.text.split(':').slice(1).join(':') || d.text).split(/,|;/).map(motNet))];
  for (const s of SOURCES_MOTS) {
    const x = par.get(s.id);
    if (!x) continue;
    if (x.mots.length) {
      out.push([sourceIdx(s.id, s.author, s.kind, s.ctx ?? 'unspecified', `https://${hotes.get(s.id)}`), x.annee ?? 0, ...x.mots.map(motIdx)]);
      primaires.push(...x.mots);
    }
    stats.parSource[s.id] = (stats.parSource[s.id] ?? 0) + (x.mots.length ? 1 : 0);
  }
  // Agrégats : une seule fiche communautaire (HopDatabase puis hops-json, mots réunis), si elle n'est pas une recopie.
  const com = SOURCES_COMMUNAUTAIRES.map((s) => ({ s, x: par.get(s.id) })).filter((c) => c.x?.mots.length);
  if (com.length) {
    const mots = [];
    // Mots seuls : une entrée de plus de quatre mots est une phrase du texte libre de hops-json (« Very mild with pleasant hoppy notes »), pas un descripteur.
    for (const { x } of com) for (const m of x.mots) if (m.split(' ').length <= 4 && !mots.some((y) => y.toLowerCase() === m.toLowerCase())) mots.push(m);
    const part = primaires.length ? mots.filter((m) => recopie(m, primaires)).length / mots.length : 0;
    if (!mots.length || part >= 0.5) stats.communautairesEcartees++;
    else {
      stats.communautairesGardees++;
      out.push([sourceIdx('communaute', 'HopDatabase / hops-json', 'community', 'unspecified', `https://${hotes.get('hopdatabase')}`), 0, ...mots.map(motIdx)]);
    }
  }
  if (out.length) { stats.varietesAvecFiche++; stats.fiches += out.length; }
  return out;
}
/** Le champ `fiches` d'une variété (absent quand aucune source ne publie de mots). */
const fichesDe = (varietyId, hopsteiner) => { const f = descriptionsSources(varietyId, hopsteiner); return f.length ? { fiches: f } : {}; };

// Le bloc `bm` d'une variété : ce que sa page Beer Maverick publie en plus, avec ses dates (l'adresse est le champ `url` ; le reçu sha256 reste dans le fichier d'amorçage).
// Forme compacte (budget B5 : le catalogue est dans le chunk des outils) : dates sans l'heure, houblons cités par leur identifiant sans
// « beermaverick- » (ou { name } quand le nom ne se résout pas), accords en paires [houblon, nombre de bières], radar en 9 nombres dans
// l'ordre BM_AXES (src/domain/hopIndex/v4/data.ts), indice de stockage en [pct, rang de la classe, indice min, indice max].
const AXES_BM = ['citrus', 'tropicalFruit', 'stoneFruit', 'berry', 'floral', 'grassy', 'herbal', 'spice', 'resinPine'];
const CLASSES_HSI = ['Great', 'Good', 'Fair', 'Poor']; // = BM_CLASSES_HSI de data.ts
const classeHsi = (c) => { const i = CLASSES_HSI.indexOf(c); if (i < 0) throw Error(`Classe HSI inconnue : ${c}`); return i; };
const jour = (iso) => (iso ? iso.slice(0, 10) : null);
const lien = (x) => (x.id ? x.id.replace(/^beermaverick-/, '') : { name: x.name });
const bmDe = (f) => ({
  modifiee: jour(f.modifiedAt), releve: jour(f.retrievedAt),
  proprietaire: f.ownership, rapportAB: f.alphaBetaRatio,
  hsi: f.hsi ? [f.hsi.pct, classeHsi(f.hsi.classe), f.hsi.indice[0], f.hsi.indice[1]] : null,
  styles: f.styles, substituts: f.substituts ? f.substituts.map(lien) : null,
  accords: f.accords ? f.accords.map((a) => [lien(a), a.count]) : null,
  arome: f.aroma ? AXES_BM.map((k) => f.aroma[k]) : null,
});

// Descriptions conservées pour le moteur : seulement celles qui portent des descripteurs.
const varieties = bm.map((v) => {
  const id = v.id;
  const key = fold(v.name);
  const h = hsByName.get(key) || hsByName.get(HS_ALIAS[key]) || (v.aliases || []).map((a) => hsByName.get(fold(a))).find(Boolean) || null;
  const short = id.replace(/^beermaverick-/, '');
  const tags = tagsOf(v);
  const f = bmFiches.get(id);
  return {
    id, name: v.name, aliases: v.aliases || [], origin: ORIGIN_FIX[short] || origin(v.origin), form: v.form,
    alpha: range(v, 'alpha'), beta: range(v, 'beta'), oil: range(v, 'totalOil'),
    tags, tagsFr: tags.map((t) => FR[t] || t),
    descriptions: [...(v.descriptions || []).filter((d) => /Tags documentaires/.test(d.text)), ...(h ? h.descriptions : []),
      ...facts.filter((f) => f.varietyId === id).map((f) => f.description)],
    ...fichesDe(id, h ? h.descriptions : []),
    citedFacts: facts.filter((f) => f.varietyId === id).map((f) => f.id),
    hopsteinerId: h?.id ?? null, hsLinalool: h?.linalool ?? null, hsThiol: h?.thiol ?? null,
    hs: h ? { name: h.name, alpha: h.analysis.alpha, beta: h.analysis.beta, totalOil: h.analysis.totalOil, reference: h.reference, year: h.year } : null,
    // Composants de l'huile (% de l'huile, Beer Maverick) : farnésène et « All Others » (β-pinène, linalol, géraniol, sélinène non séparés).
    oils: { myrcene: range(v, 'myrcene'), humulene: range(v, 'humulene'), caryophyllene: range(v, 'caryophyllene'), farnesene: plage(f?.farnesene), others: plage(f?.others) },
    // Cohumulone, en % des acides α (pas en % de l'huile). Usage : Aroma, Bittering ou Dual.
    cohumulone: plage(f?.cohumulone), purpose: f?.purpose ?? null,
    bm: f ? bmDe(f) : null,
    bmYear: v.descriptions?.[0]?.source?.year ?? null,
    usage: usageOf(v),
    url: v.descriptions?.[0]?.source?.reference || null,
  };
});

// Stock de production : articles reliés à une variété par leur nom (aucun lien en base, #120).
const findVariety = (name) => {
  const n = name.toLowerCase().replace(/^houblon\s+/, '').replace(/cryo hops\s+/, '').replace(/\s+\d+([.,]\d+)?%.*$/, '').replace(/hallertauer/, 'hallertau').replace(/goldings east kent/, 'east kent golding').replace(/^nuget$/, 'nugget').trim();
  return varieties.find((v) => v.name.toLowerCase() === n) || varieties.find((v) => v.name.toLowerCase().startsWith(n)) || null;
};
const byKey = new Map();
const unlinked = [];
for (const s of prod.stockItems) {
  const v = findVariety(s.name);
  if (!v) { unlinked.push(s.name); continue; }
  const cryo = /cryo/i.test(s.name);
  const key = v.id + (cryo ? ':cryo' : '');
  const inName = s.name.match(/(\d+(?:[.,]\d+)?)%/);
  const alpha = s.alphaPct ?? (inName ? Number(inName[1].replace(',', '.')) : null);
  const cur = byKey.get(key) || { key, varietyId: v.id, form: cryo ? 'cryo' : 'unknown', grams: 0, alpha: null, alphaFrom: null, items: [] };
  cur.grams += s.currentStock || 0;
  cur.items.push(s.name);
  const from = s.alphaPct != null ? 'fiche de stock' : 'lu sur l’article';
  if (alpha != null && ((s.currentStock || 0) > 0 || cur.alpha == null)) { cur.alpha = alpha; cur.alphaFrom = from; }
  byKey.set(key, cur);
}
const stock = [...byKey.values()];

const styles = bjcp.styles.map((s) => ({
  id: s.id, code: s.code, name: s.name,
  // Préréglage houblon du style (correspondance de formulation L'Affinée) : clé des presets du solveur V5.5.
  hopPreset: s.suggestions?.hop ?? null,
  ibu: s.stats?.ibu ? [s.stats.ibu.min, s.stats.ibu.max] : null,
  og: s.stats?.og ? [s.stats.og.min, s.stats.og.max] : null,
  srm: s.stats?.srm ? [s.stats.srm.min, s.stats.srm.max] : null,
  url: s.source?.reference || null,
}));

const out = {
  fixture: FIXTURE, fixtureSource: prod.source,
  sources: {
    varieties: 'Beer Maverick (descripteurs, plages historiques, cohumulone, farnésène, usage, styles, substituts, accords), src/data/hopBeerMaverickBootstrap.json',
    hopsteiner: 'Hopsteiner 2025, familles déclarées et descripteurs, src/data/hopManufacturerBootstrap.json',
    styles: 'BJCP 2021, statistiques, src/data/brewingStylesBootstrap.json',
    stock: `Stock de production, lecture seule, ${FIXTURE}`,
    facts: `Faits cités un à un, data/faits-cites.json (${facts.length})`,
    descripteurs: `Descripteurs d'arôme des sources, src/data/hopSources (${stats.fiches} fiches sur ${stats.varietesAvecFiche} variétés), forme compacte : descSources, descMots, fiches`,
  },
  // [auteur, nature, contexte, site de la source] ; mots de toutes les fiches (voir descriptionsDe, data.ts).
  descSources: tableSources.map((t) => t.slice(0, 4)), descMots: dicoMots,
  varieties, stock, unlinked, styles,
};
fs.mkdirSync(path.join(here, '..', '..', 'src', 'data', 'hopV4'), { recursive: true });
fs.writeFileSync(path.join(here, '..', '..', 'src', 'data', 'hopV4', 'proto-data.json'), JSON.stringify(out));
const inStock = stock.filter((s) => s.grams > 0);
console.log(`DATA-V4 ${varieties.length} variétés (${varieties.filter((v) => v.tags.length).length} avec descripteurs, ${varieties.filter((v) => v.hopsteinerId).length} reliées à Hopsteiner), ${styles.length} styles, ${inStock.length} houblons en stock (${inStock.reduce((t, s) => t + s.grams, 0)} g), ${stock.length - inStock.length} épuisés` + (unlinked.length ? ` ; non reliés : ${unlinked.join(', ')}` : ''));
