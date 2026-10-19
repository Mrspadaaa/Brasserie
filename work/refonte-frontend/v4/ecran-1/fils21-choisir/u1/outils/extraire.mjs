// Extracteur des variantes u1–u6 (fils21-choisir, 19.10.2026, nuit).
// Lit les vraies données du dépôt en lecture seule et écrit, dans chaque dossier u*, un donnees.js
// (window.DATA) et une copie de commun.js / commun.css. Aucune valeur inventée : chaque nombre garde
// sa source ; une valeur absente reste null avec sa raison, jamais 0.
// Usage : node u1/outils/extraire.mjs   (depuis fils21-choisir)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const FILS = path.resolve(ICI, '../..');
const DEPOT = path.resolve(FILS, '../../../../..');
const lire = (p) => JSON.parse(fs.readFileSync(path.join(DEPOT, p), 'utf8'));

const COMPOSES = lire('prototypes/houblons-v4/data/composes-houblon.json');
const PACK = lire('prototypes/houblons-v4/data/pack-fiches.json');
const COMPARATIFS = lire('work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json');
const DOSSIER_CAS = 'work/refonte-frontend/v4/ecran-1/fils19-choix/donnees/';
const VERIFS = lire(DOSSIER_CAS + 'verifications.json');
const PROFILS_SIMULES = path.join(FILS, 'donnees/profils-simules.json');

// ---------- Enveloppe d'une liste de plages publiées (convention de composes-houblon.json) ----------
function enveloppe(valeurs) {
  const vs = (valeurs || []).filter((v) => v && v.plage && (v.portee || 'variété') !== 'lot');
  if (!vs.length) return null;
  const bas = vs.map((v) => v.plage[0]).filter((x) => x != null);
  const hauts = vs.map((v) => v.plage[1]).filter((x) => x != null);
  let lo = bas.length ? Math.min(...bas) : null;
  let hi = hauts.length ? Math.max(...hauts) : null;
  // Une source qui ne publie qu'une borne haute sous la plus petite borne basse rend la borne basse inconnue.
  for (const v of vs) {
    if (v.plage[0] == null && v.plage[1] != null && (lo == null || v.plage[1] < lo)) lo = null;
    if (v.plage[1] == null && v.plage[0] != null && (hi == null || v.plage[0] > hi)) hi = null;
  }
  return {
    lo, hi,
    src: [...new Set(vs.flatMap((v) => v.sources || []))],
    liste: vs.map((v) => ({ p: v.plage, src: v.sources || [], t: v.texte || null })),
  };
}

// ---------- Sources ----------
const SOURCES = {};
for (const [k, v] of Object.entries(COMPOSES.sources)) SOURCES[k] = { t: v.titre, url: v.url, n: v.niveau, a: v.annee ?? null };
SOURCES['ych-profil'] = { t: 'Yakima Chief Hops, profils sensoriels sur houblon broyé (ASBC Hop Grind), relevés dans H §1.1 et §7.1', url: 'work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md', n: 'F', a: null };
SOURCES['pack'] = { t: 'Pack des fiches houblons v4 (prototypes/houblons-v4/data/pack-fiches.json, 18.10.2026)', url: 'prototypes/houblons-v4/data/pack-fiches.json', n: 'H', a: 2026 };
SOURCES['outil-substitution'] = { t: 'Notre outil : « substitution calculée v1 » du pack (score arôme, huiles, amertume)', url: 'prototypes/houblons-v4/data/pack-fiches.json', n: 'H', a: 2026 };
SOURCES['moteur-pouvoir'] = { t: 'Moteur « pouvoir aromatique » du pilote, cas du brasseur (fils19-choix/donnees)', url: DOSSIER_CAS + 'index.json', n: 'H', a: 2026 };
SOURCES['profil-simule'] = { t: 'Profil aromatique simulé du pilote : fils21-choisir/donnees/profils-simules.json et PROFIL-SIMULE.md (19.10.2026), simulé', url: 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md', n: 'H', a: 2026 };
SOURCES['ibu-pack'] = { t: 'IBU par gramme du pack (BrewingMath.hopIbu, 20 L, DI 1,066, 60 min)', url: 'prototypes/houblons-v4/data/pack-fiches.json', n: 'H', a: 2026 };
SOURCES['J'] = { t: 'J — Comparatifs de variétés en dry hop (pilote, 19.10.2026)', url: 'work/refonte-frontend/v4/recherche/J-comparatifs-dryhop-varietes.md', n: 'H', a: 2026 };
for (const e of COMPARATIFS.etudes) SOURCES[e.id] = { t: e.ref, url: e.url, n: e.niveau, a: null };

// ---------- Houblons ----------
const NOMS = { 'beermaverick-citra': 'citra', 'beermaverick-cascade': 'cascade', 'beermaverick-galaxy': 'galaxy', 'beermaverick-idaho-7': 'idaho7', 'beermaverick-motueka': 'motueka', 'beermaverick-nelson-sauvin': 'nelson', 'beermaverick-nugget': 'nugget', 'beermaverick-citra:cryo': 'citraCryo' };
const PACK_PAR_CLE = Object.fromEntries(PACK.fichesHoublons.map((f) => [f.key, f]));
const CLE_PACK = { citra: 'beermaverick-citra:cryo', citraCryo: 'beermaverick-citra:cryo' };
const COMP = ['myrcene', 'linalol', 'geraniol', 'humulene', 'caryophyllene', 'farnesene'];
const THIOLS = ['4MMP', '3MH', '3M4MP'];

function packSource(fiche, nomSource) {
  const id = (nomSource === 'Beer Maverick' ? 'bm-' : nomSource === 'Hopsteiner' ? 'hs-' : 'src-') + fiche.key.replace('beermaverick-', '').replace(':', '-');
  if (!SOURCES[id]) {
    const s = [...(fiche.huiles?.totale?.sources || []), ...(fiche.alpha?.sources || [])].find((x) => x.source === nomSource);
    SOURCES[id] = { t: nomSource + ', ' + fiche.name + ' (fiche du pack)', url: s?.url || null, n: nomSource === 'Hopsteiner' ? 'F' : 'S', a: s?.annee ?? null };
  }
  return id;
}

function familles(fiche) {
  return Object.fromEntries(fiche.aromes.map((a) => [a.family, { n: a.level, mots: a.mots.flatMap((m) => m.mots), sources: a.sources, of: a.of }]));
}

const HOUBLONS = {};
for (const [cle, v] of Object.entries(COMPOSES.varietes)) {
  const id = NOMS[cle];
  const fiche = PACK_PAR_CLE[CLE_PACK[id] || cle];
  const h = {
    id, cle, nom: v.nom, forme: v.forme, origine: v.origine,
    huile: enveloppe(v.huile?.valeurs),
    f: {}, thiols: {},
    classeThiol: (v.classeHopsteiner || []).map((c) => ({ classe: c.classe, t: c.texte, src: c.sources })),
    sommes: v.sommes || null,
    precurseurs: v.precurseurs || null,
    autres: v.autres || null, lots: v.lots || null, hsi: v.hsi || null, panel: v.panel || null,
    mesuresEnBiere: v.mesuresEnBiere || null,
  };
  for (const c of [...COMP, ...THIOLS]) {
    const o = v.composes?.[c];
    const e = o?.valeurs ? enveloppe(o.valeurs) : null;
    const val = e || { lo: null, hi: null, src: [], liste: [], raison: o?.raison || 'non relevé' };
    const bc = (o?.valeurs || []).filter((x) => x.base === 'hopsteiner-2024');
    if (bc.length) val.baseCommune = enveloppe(bc);
    if (o?.nonDetecte) val.nonDetecte = o.nonDetecte.map((x) => ({ t: x.texte, src: x.sources }));
    if (o?.indices) val.indices = o.indices.map((x) => ({ t: x.texte, src: x.sources }));
    (THIOLS.includes(c) ? h.thiols : h.f)[c] = val;
  }
  if (fiche) {
    h.alpha = { v: fiche.alpha.retenu?.value ?? null, de: fiche.alpha.retenu?.from || null, plages: fiche.alpha.sources.map((s) => ({ src: packSource(fiche, s.source), lo: s.min, hi: s.max })) };
    h.role = fiche.role?.value || null;
    h.stock = fiche.stock ? { g: fiche.stock.grams, etat: fiche.stock.etat, article: fiche.name } : null;
    h.familles = familles(fiche);
    h.motsSource = fiche.key === 'beermaverick-citra:cryo' && id === 'citra' ? 'mots de la fiche Citra cryo du pack (mêmes mots Beer Maverick que la variété)' : 'mots des fiches du pack';
    const ibu = fiche.ibuParGramme?.moments || [];
    h.ibuParGramme = Object.fromEntries(ibu.filter((m) => m.ibuPerGram).map((m) => [m.code, m.ibuPerGram.value]));
    const sc = fiche.substitutsCalcules;
    h.outil = sc ? { contexte: sc.contexte, poids: sc.poids, enStock: (sc.enStock || []).map((r) => ({ nom: r.name, score: r.score, c: r.composantes })), top: (sc.remplacants || []).map((r) => ({ nom: r.name, score: r.score, c: r.composantes })) } : null;
  }
  HOUBLONS[id] = h;
}
// La variété Citra (T-90) : α de la variété, stock = l'article Citra cryo.
HOUBLONS.citra.alpha = { v: 12.5, de: 'milieu de la plage 10–15 % (Beer Maverick), comme le moteur', plages: [{ src: 'bm-citra', lo: 10, hi: 15 }] };
HOUBLONS.citra.role = 'aromatique';
HOUBLONS.citra.ibuParGramme = null;

// Houblons du style 16D (terreux, herbacé, floral) : seulement les fiches du pack, sans thiols.
for (const [id, nom] of [['ekg', 'East Kent Goldings'], ['fuggle', 'Fuggle']]) {
  const fiche = PACK.fichesHoublons.find((x) => x.name === nom);
  const hs = fiche.huiles.totale.sources.map((s) => ({ plage: [s.min, s.max], sources: [packSource(fiche, s.source)] }));
  const h = { id, cle: fiche.key, nom, forme: 'inconnue', origine: fiche.origin, huile: enveloppe(hs), f: {}, thiols: {} };
  const map = { myrcene: 'myrcene', linalol: 'linalool', geraniol: null, humulene: 'humulene', caryophyllene: 'caryophyllene', farnesene: 'farnesene' };
  for (const c of COMP) {
    const k = map[c];
    const o = k ? fiche.huiles.composants[k] : null;
    h.f[c] = o ? enveloppe([{ plage: [o.min, o.max], sources: [packSource(fiche, o.source)] }]) : { lo: null, hi: null, src: [], liste: [], raison: c === 'farnesene' ? 'publié par Beer Maverick, non importé dans le dépôt' : 'non relevé dans le pack' };
  }
  for (const c of THIOLS) h.thiols[c] = { lo: null, hi: null, src: [], liste: [], raison: 'aucune valeur dans H ni le dépôt' };
  h.alpha = { v: fiche.alpha.retenu?.value ?? null, de: fiche.alpha.retenu?.from || null, plages: fiche.alpha.sources.map((s) => ({ src: packSource(fiche, s.source), lo: s.min, hi: s.max })) };
  h.role = fiche.role?.value || null;
  h.stock = { g: fiche.stock.grams, etat: fiche.stock.etat, article: fiche.name };
  h.familles = familles(fiche);
  h.ibuParGramme = Object.fromEntries((fiche.ibuParGramme?.moments || []).filter((m) => m.ibuPerGram).map((m) => [m.code, m.ibuPerGram.value]));
  HOUBLONS[id] = h;
}

// Profils Yakima Chief sur houblon broyé (H §1.1 et §7.1), 0–100, sens exact de l'échelle non précisé.
const YCH = {
  citra: { citrus: 92, tropical: 78, berries: 70, floral: 54, stoneFruit: 53, melon: 52, herbal: 46, resin: 33, sucre: 21, pomeFruit: 18, green: 17, spice: 9, earthy: 8, src: 'H1' },
  cascade: { citrus: 85, tropical: 73, berries: 67, floral: 54, stoneFruit: 50, melon: 49, herbal: 50, resin: 33, sucre: 20, pomeFruit: 17, green: 27, spice: 11, earthy: 12, src: 'H2' },
  idaho7: { citrus: 97, tropical: 93, berries: 90, melon: 68, stoneFruit: 65, floral: 54, sucre: 39, herbal: 26, resin: 22, pomeFruit: null, green: null, spice: null, earthy: null, src: 'H3', manque: 'pomme, herbe, épicé, terreux : non relevés dans H §7.1' },
  galaxy: null,
};
for (const [id, p] of Object.entries(YCH)) if (HOUBLONS[id]) HOUBLONS[id].ych = p ? { ...p } : { absent: 'aucun profil YCH : Galaxy n’est pas distribué par YCH (H §7.1)' };

// ---------- Seuils, transferts, familles ----------
const SEUILS = {};
for (const [c, v] of Object.entries(COMPOSES.seuils)) {
  if (!v || !v.valeurs) continue;
  const vals = v.valeurs.filter((x) => x.plage && x.plage[0] != null);
  SEUILS[c] = { unite: v.unite, lo: vals.length ? Math.min(...vals.map((x) => x.plage[0])) : null, hi: vals.length ? Math.max(...vals.map((x) => x.plage[1] ?? x.plage[0])) : null, liste: vals.map((x) => ({ p: x.plage, type: x.type, matrice: x.matrice, abv: x.abv ?? null, src: x.sources })), note: v.nonCalcule || null };
}

const LIENS = COMPOSES.familles.liens.map((l) => ({ c: l.compose, fam: l.familles, sens: l.sens, via: l.via || null, src: l.sources }));

const FAMILLES = [
  ['citrus', 'Agrumes', 'agrumes', '#dcb52a'], ['tropical', 'Fruits tropicaux', 'tropical', '#ee9b2f'], ['stoneFruit', 'Fruits à noyau', 'noyau', '#e88d68'],
  ['pomeFruit', 'Pomme et poire', 'pomme', '#a3bd38'], ['berries', 'Petits fruits', 'baies', '#c0569a'], ['melon', 'Melon', 'melon', '#6fc09b'],
  ['floral', 'Floral', 'floral', '#c48ddb'], ['herbal', 'Herbacé aromatique', 'herbacé', '#4f9e70'], ['resin', 'Boisé et résineux', 'résineux', '#3f8f7f'],
  ['spice', 'Épicé', 'épicé', '#a8694d'], ['green', 'Végétal vert', 'vert', '#6aa33a'], ['earthy', 'Terreux', 'terreux', '#a8986f'],
].map(([id, nom, court, c]) => ({ id, nom, court, c }));

// ---------- Sorties du moteur « pouvoir aromatique » (fils19) ----------
const CAS = {};
for (const id of ['cas-citra', 'cas-cascade', 'cas-galaxy', 'cas-idaho7', 'cas-citra3-galaxy7', 'cas-citra3-idaho7-5', 'cas-citra3-idaho7-5-pomona-actif', 'cas-citra-cryo-stock']) {
  const c = lire(DOSSIER_CAS + id + '.json');
  const p = c.pouvoir;
  CAS[id] = {
    titre: c.titre, recette: c.recette, dose: p.doseACruGL, contact: p.contact?.texte || null,
    faceAuStyle: p.faceAuStyle || null,
    familles: Object.fromEntries(Object.entries(p.familles).map(([k, f]) => [k, { classe: f.lecture?.classe || 'inconnu', lo: f.signal?.min ?? null, hi: f.signal?.max ?? null, ctr: f.signal?.central ?? null, auMoins: !!f.signal?.minAuMoins, dominant: f.dominant || null, inconnu: f.inconnu ? (c.textes[f.inconnu] || f.inconnu) : null }])),
    drapeaux: p.drapeaux.map((d) => ({ id: d.id, titre: d.titre, statut: d.statut, pourquoi: d.pourquoi, src: d.sources })),
  };
}

// ---------- Comparatifs publiés (J) : chaque mesure garde sa lecture ; « à vérifier » et « figure » visibles ----------
const ETUDES = COMPARATIFS.etudes.map((e) => ({
  id: e.id, ref: e.ref, url: e.url, n: e.niveau, base: e.base, varietes: e.varietes, cond: e.conditions, note: e.note || null,
  mesures: e.mesures.map((m) => {
    const t = (m.lecture || '') + ' ' + (m.note || '');
    const av = /v[ée]rifier/i.test(t);
    return { ...m, aVerifier: av, aVerifierEtude: !av && e.id === 'E03' && /aplati/i.test(m.lecture || ''), figure: /figure/i.test(t) };
  }),
}));

const profilsSimules = fs.existsSync(PROFILS_SIMULES) ? JSON.parse(fs.readFileSync(PROFILS_SIMULES, 'utf8')) : null;

const DATA = {
  meta: {
    genere: '2026-10-19',
    lecture: 'Données réelles du dépôt, en lecture seule. Une borne inconnue vaut null, jamais 0. Les calculs et simulations sont faits dans la page, marqués.',
    fichiers: ['prototypes/houblons-v4/data/composes-houblon.json', 'prototypes/houblons-v4/data/pack-fiches.json', DOSSIER_CAS + '*.json', 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json'],
    profilsSimules: profilsSimules ? 'présent' : 'absent au moment de l’extraction : la simulation est celle de la page (commun.js), pas profils-simules.json',
  },
  sources: SOURCES, familles: FAMILLES, liens: LIENS, houblons: HOUBLONS, seuils: SEUILS,
  transferts: COMPOSES.transferts, alcool: COMPOSES.alcool, densites: COMPOSES.densites, duree: COMPOSES.duree,
  saturation: COMPOSES.saturation, ajoutsSuccessifs: COMPOSES.ajoutsSuccessifs, hopCreep: COMPOSES.hopCreep,
  biotransformation: COMPOSES.biotransformation, levures: COMPOSES.levures, vieillissement: COMPOSES.vieillissement,
  hsi: COMPOSES.hsi, style: COMPOSES.styles['16D'], biereNoire: COMPOSES.biereNoire,
  cas: CAS, verifs: VERIFS.verifications.map((v) => ({ id: v.id, houblon: v.houblon, compose: v.compose, texte: v.texte, mesure: v.mesure, calcul: v.calcul, unite: v.unite, verdict: v.verdict, src: v.sources })),
  etudes: ETUDES,
  recette: lire(DOSSIER_CAS + 'cas-citra.json').recette,
};

// ---------- Profil simulé du pilote (profils-simules.json), extrait compact : window.PROFILS ----------
let profilsJs = '// profils-simules.json absent au moment de l’extraction\nwindow.PROFILS = null;\n';
if (profilsSimules) {
  const P = profilsSimules;
  const garder = (c) => ({ id: c.id, titre: c.titre, ajouts: c.ajouts, levure: c.levure, apres: c.apres, delta: c.delta, parJour: c.parJour, apportsParHoublon: c.apportsParHoublon, saturation: c.saturation, biotransformation: c.biotransformation, drapeaux: c.drapeaux, confiance: c.confiance, mesures: (c.mesures || []).filter((m) => ['publiee', 'mesureEnBiere'].includes(m.type)) });
  const PROFILS = {
    version: P.version, mention: P.mention, mentionRapport: P.mentionRapport, regle: P.regle, lecture: P.lecture, echelle: P.echelle,
    style: P.style, ancre: P.ancre, biere: P.biere, formatGrille: P.formatGrille,
    grille: P.grille.map((g) => ({ h: g.houblon, nom: g.nom, m: g.moment, d: g.dose_gL, j: g.jours, l: g.levure, a: g.apres, dl: g.delta, conf: g.confiance, dr: g.drapeaux })),
    paires: P.grillePaires.map((g) => ({ h: g.houblons, noms: g.noms, m: g.moment, d: g.doses_gL, j: g.jours, l: g.levure, a: g.apres, dl: g.delta, seuls: g.seuls, sat: g.facteurSaturation, conf: g.confiance, dr: g.drapeaux })),
    cas: P.cas.filter((c) => /^K[1-5]/.test(c.id)).map(garder),
    textes: P.textes, sources: P.sources,
  };
  profilsJs = '// Extrait de fils21-choisir/donnees/profils-simules.json (' + P.version + ', ' + P.date + ') par u1/outils/extraire.mjs. Simulé, toujours marqué.\nwindow.PROFILS = ' + JSON.stringify(PROFILS) + ';\n';
}

const js = '// Généré par u1/outils/extraire.mjs le ' + DATA.meta.genere + ' depuis les fichiers du dépôt (lecture seule). Ne pas éditer à la main.\nwindow.DATA = ' + JSON.stringify(DATA) + ';\n';
for (const d of ['u1', 'u2', 'u3', 'u4', 'u5', 'u6']) {
  const dir = path.join(FILS, d);
  if (!fs.existsSync(dir)) continue;
  fs.writeFileSync(path.join(dir, 'donnees.js'), js);
  fs.writeFileSync(path.join(dir, 'profils.js'), profilsJs);
  for (const f of ['commun.js', 'commun.css']) if (fs.existsSync(path.join(ICI, f))) fs.copyFileSync(path.join(ICI, f), path.join(dir, f));
}
console.log('donnees.js', (js.length / 1024).toFixed(0) + ' ko ; houblons', Object.keys(HOUBLONS).join(', '), '; études', ETUDES.length, '; à vérifier', ETUDES.flatMap((e) => e.mesures).filter((m) => m.aVerifier).length, '; figure', ETUDES.flatMap((e) => e.mesures).filter((m) => m.figure).length);
