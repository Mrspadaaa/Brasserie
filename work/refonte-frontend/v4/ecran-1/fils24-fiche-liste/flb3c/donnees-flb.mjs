// Série b (lot D125, la liste de la fiche) : les données des cinq houblons, lues dans le dépôt, rien d'inventé.
// - pack-fiches.json : α des fiches, α du lot, rôle, stock, familles citées (n/N) et mots par fiche ;
// - proto-data.json : le catalogue de 318 variétés, pour compter chez combien d'autres un mot revient
//   (la « signature » : ce que ses fiches disent toutes et que peu d'autres houblons disent), la classe
//   de thiols de Hopsteiner et le linalol ;
// - style-bands.json : ce que la stout export (16D) attend.
// Les mots anglais des fiches sont traduits (D97) ; un mot et sa traduction ne font qu'un concept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '../../../../../..');
const lire = (p) => JSON.parse(fs.readFileSync(path.join(RACINE, p), 'utf8'));
const PACK = lire('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const PROTO = lire('prototypes/houblons-v4/data/proto-data.json');
const BANDES = lire('prototypes/houblons-v4/data/style-bands.json');

export const NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
// L'ordre du radar de la base (Agrumes en haut, sens horaire).
export const RADAR = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const BANDE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const JETONS = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json');

// Traduction des mots anglais des fiches (D97) ; les mots français restent tels quels.
const VERS_FR = {
  'white wine': 'vin blanc', fruity: 'fruité', 'fruité': 'fruité', gooseberry: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin',
  pineapple: 'ananas', floral: 'floral', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'fresh lime': 'citron vert', lime: 'citron vert',
  'lemon zest': 'zeste de citron', lemon: 'citron', mojito: 'mojito', citrus: 'agrumes', 'black currant': 'cassis', herbal: 'herbacé', 'herbacé': 'herbacé',
  spicy: 'épicé', 'épicé': 'épicé', pine: 'pin', agrumes: 'agrumes',
};
// Les formes cherchées dans le catalogue pour chaque concept (français et anglais).
const FORMES = {
  'vin blanc': ['vin blanc', 'white wine'], 'groseille à maquereau': ['groseille à maquereau', 'gooseberry', 'gooseberries'], raisin: ['raisin', 'grape', 'grapes'],
  'sauvignon blanc': ['sauvignon blanc'], 'fruité': ['fruité', 'fruity'], ananas: ['ananas', 'pineapple'], litchi: ['litchi', 'lychee'], 'noix de coco': ['noix de coco', 'coconut'],
  'géranium': ['géranium', 'geranium'], 'herbacé': ['herbacé', 'herbal'], agrumes: ['agrumes', 'citrus'], terreux: ['terreux', 'earthy'], gingembre: ['gingembre', 'ginger'],
  floral: ['floral'], 'boisé': ['boisé', 'woody'], 'résineux': ['résineux', 'resinous', 'resiny', 'resin'], 'épicé': ['épicé', 'spicy'], pamplemousse: ['pamplemousse', 'grapefruit'],
  'citron vert': ['citron vert', 'lime'], citron: ['citron', 'lemon'], 'zeste de citron': ['zeste de citron', 'lemon zest'], mojito: ['mojito'], 'fruits tropicaux': ['fruits tropicaux', 'tropical fruit', 'tropical'],
  'pêche': ['pêche', 'peach'], melon: ['melon'], 'fruit de la passion': ['fruit de la passion', 'passion fruit'], cassis: ['cassis', 'black currant', 'blackcurrant'], pin: ['pin', 'pine'],
};
// Mots génériques : ils disent « fruité » de 77 houblons et ne signent personne (cerveau/metier/descripteurs-hors-familles.md).
export const GENERIQUES = new Set(['fruité']);
// Les mots qui ne sont que le nom d'une famille : le radar les dit déjà.
export const NOMS_FAMILLE = new Set(['agrumes', 'floral', 'épicé', 'herbacé', 'terreux', 'résineux', 'fruits tropicaux']);
// « Rare » : 12 houblons sur 318 au plus le disent (la groseille à maquereau de Nelson Sauvin : 12).
export const RARE = 12;

const SOURCE_COURTE = { 'Beer Maverick': 'Beer Maverick', Hopsteiner: 'Hopsteiner', 'Hopsteiner (boutique US)': 'Hopsteiner boutique', 'Yakima Chief Hops': 'Yakima Chief' };

// Le texte d'une variété du catalogue, sans les lignes « Familles déclarées » (des catégories, pas des mots).
const bas = (s) => s.toLowerCase().replace(/[_#]/g, ' ');
const TEXTES = PROTO.varieties.map((v) => ({ nom: v.name, t: ' ' + bas([...(v.tags || []), ...(v.tagsFr || []), ...(v.descriptions || []).filter((d) => !/^Familles déclarées/.test(d.text)).map((d) => d.text)].join(' , ')) + ' ' }));
const motRe = (f) => new RegExp('(^|[^a-zà-ÿ])' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-zà-ÿ]|$)');
export function chez(concept) {
  const fs_ = (FORMES[concept] || [concept]).map(motRe);
  return TEXTES.filter((x) => fs_.some((r) => r.test(x.t))).map((x) => x.nom);
}
export const CATALOGUE = PROTO.varieties.length;

const BANDE_16D = BANDES.styles['16D'] || Object.values(BANDES.styles).find((s) => s.code === '16D');
export const STYLE = { code: '16D', nom: 'stout export', attend: Object.entries(BANDE_16D.families).filter(([, b]) => b.status === 'attendue').map(([f]) => f), bandes: Object.fromEntries(Object.entries(BANDE_16D.families).map(([f, b]) => [f, b.band])) };
// Sa demande (scénario S1 : « Ma stout export est trop résineuse ; je la veux plus florale »).
export const DEMANDE = { plus: 'floral', moins: 'resin' };

// Un seul α par houblon, celui de la fiche g1 : Hopsteiner 2025 s'il existe, sinon la première fiche (conseil, règle commune).
const G1 = (al) => al.find((s) => s.source === 'Hopsteiner') || al[0];
const fr = (m) => { const k = m.trim().toLowerCase(); return VERS_FR[k] || k; };
const virg = (n) => String(n).replace('.', ',');

function houblon(nom) {
  const h = PACK.find((x) => x.name === nom);
  const v = PROTO.varieties.find((x) => x.name === nom.replace(' cryo', ''));
  const N = h.aromes[0].of;
  const fiches = [...new Set(h.aromes.flatMap((a) => a.mots.map((m) => m.source)).concat(h.motsSansFamille.map((m) => m.source)))];
  const categoriesHS = ((h.descripteurs.hopsteiner || []).find((t) => /^Familles déclarées/.test(t)) || '').replace(/^[^:]*:\s*/, '').replace(/\.$/, '').split(/,\s*/).filter(Boolean);
  // L'ordre des mots dans chaque fiche (le premier nommé), tel que la fiche l'écrit.
  const ordre = {};
  ordre['Beer Maverick'] = (h.descripteurs.beerMaverick || []).map(fr);
  const lhs = (h.descripteurs.hopsteiner || []).find((t) => /^Descripteurs/.test(t));
  if (lhs) ordre.Hopsteiner = lhs.replace(/^[^:]*:\s*/, '').replace(/\.$/, '').split(/,\s*/).map(fr);
  for (const c of h.descripteurs.cites || []) ordre[c.author] = c.text.replace(/^[^:]*:\s*/, '').split(/ and |,|;/).map((s) => s.replace(/étiquette/, '').replace(/\.$/, '').trim()).filter(Boolean).map(fr);
  // Les concepts : chaque mot cité, traduit, avec ses fiches et sa famille.
  const C = new Map();
  const ajoute = (mot, source, famille) => {
    const estCategorie = source === 'Hopsteiner' && categoriesHS.includes(mot) && !(ordre.Hopsteiner || []).includes(fr(mot));
    const k = fr(mot);
    const c = C.get(k) || { mot: k, fiches: [], categorie: [], famille: null };
    if (famille && !c.famille) c.famille = famille;
    if (estCategorie) { if (!c.categorie.includes(source)) c.categorie.push(source); }
    else if (!c.fiches.includes(source)) c.fiches.push(source);
    C.set(k, c);
  };
  for (const a of h.aromes) for (const m of a.mots) for (const w of m.mots) ajoute(w, m.source, a.family);
  for (const m of h.motsSansFamille) ajoute(m.mot, m.source, null);
  const concepts = [...C.values()].map((c) => {
    const autres = chez(c.mot).filter((n) => n !== v.name);
    const premier = Object.entries(ordre).filter(([, l]) => l[0] === c.mot).map(([s]) => s);
    const pos = Math.min(...Object.values(ordre).map((l) => (l.indexOf(c.mot) < 0 ? 99 : l.indexOf(c.mot))));
    return { ...c, n: c.fiches.length, N, chez: autres.length + 1, autres, premier, pos, rare: autres.length + 1 <= RARE, generique: GENERIQUES.has(c.mot), nomFamille: NOMS_FAMILLE.has(c.mot), seulCategorie: !c.fiches.length };
  });
  // La signature : ce que plusieurs fiches disent, ce qu'elles nomment tôt, et que peu de houblons disent.
  // Ni un mot générique (fruité), ni le nom d'une famille (« agrumes » redit le radar), ni une catégorie seule.
  const score = (c) => (c.seulCategorie || c.generique || c.nomFamille ? -1000 + c.n : c.n * 100 + (c.premier.length ? 40 : 0) + Math.max(0, 10 - c.pos) * 4 + (c.rare ? 15 : 0) - c.chez * 0.1);
  concepts.sort((a, b) => score(b) - score(a));
  concepts.forEach((c) => { c.signe = score(c) > 0; });
  const familles = h.aromes.filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, N: a.of, premier: a.premier.length > 0, mots: concepts.filter((c) => c.famille === a.family).map((c) => c.mot) }));
  const inconnues = h.aromes.filter((a) => a.sources === 0).map((a) => a.family);
  const al = h.alpha.sources;
  return {
    nom, cle: h.key, origine: h.origin, N,
    fiches: fiches.map((s) => ({ source: s, court: SOURCE_COURTE[s] || s, annee: (al.find((x) => x.source === s) || {}).annee || null })),
    alpha: { min: G1(al).min, max: G1(al).max, source: G1(al).source + ' ' + G1(al).annee, lot: h.alpha.retenu.value, lotDe: h.alpha.retenu.from, texte: virg(G1(al).min) + '–' + virg(G1(al).max) + ' %', lotTexte: virg(h.alpha.retenu.value) + ' %' },
    usage: h.role.value === 'double' ? 'double usage' : h.role.value === 'aromatique' ? 'aromatique' : 'amérisant',
    usageCle: h.role.value,
    stock: { etat: h.stock.etat, g: h.stock.grams },
    categoriesHS, ordre, concepts, familles, inconnues,
    alias: v && v.aliases && v.aliases.length ? v.aliases[0] : null,
    thiol: v && v.hsThiol ? v.hsThiol.class : null,
    linalol: v && v.hsLinalool ? v.hsLinalool.range : null,
    remplacants: (h.substitutsCalcules?.remplacants || []).slice(0, 4).map((r) => ({ nom: r.name, score: r.score })),
  };
}

export const HOUBLONS = ['Nugget', 'Nelson Sauvin', 'Citra cryo', 'Motueka', 'Cascade'].map(houblon);
// Thiols « forte » au catalogue (classe Hopsteiner).
export const THIOLS_FORTE = PROTO.varieties.filter((v) => v.hsThiol && v.hsThiol.class === 'forte').length;

// Les mots d'un remplaçant (pour « lui seul ») : ses mots traduits, depuis le catalogue.
export function motsDe(nom) {
  const v = PROTO.varieties.find((x) => x.name === nom); if (!v) return [];
  const t = ' ' + bas([...(v.tags || []), ...(v.tagsFr || []), ...(v.descriptions || []).filter((d) => !/^Familles déclarées/.test(d.text)).map((d) => d.text)].join(' , ')) + ' ';
  return Object.keys(FORMES).filter((k) => FORMES[k].map(motRe).some((r) => r.test(t)));
}

// Une fiche courte (appui long) pour tout houblon du pack.
export function fichePack(nom) {
  const h = PACK.find((x) => x.name === nom); if (!h) return null;
  const al = h.alpha.sources;
  return { nom, N: h.aromes[0].of, alpha: virg(G1(al).min) + '–' + virg(G1(al).max) + ' %', lot: virg(h.alpha.retenu.value) + ' %',
    usage: h.role.value === 'double' ? 'double usage' : h.role.value === 'aromatique' ? 'aromatique' : 'amérisant', stock: h.stock.etat,
    familles: h.aromes.filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, N: a.of })) };
}

if (process.argv[1] && process.argv[1].endsWith('donnees-flb.mjs')) {
  for (const h of HOUBLONS) {
    console.log('== ' + h.nom, h.alpha.texte, 'lot', h.alpha.lotTexte, h.usage, h.stock.etat, 'thiol', h.thiol, 'N', h.N, 'cat HS', h.categoriesHS.join('/'));
    for (const c of h.concepts) console.log('  ', c.mot.padEnd(24), (c.famille || '—').padEnd(10), c.n + '/' + c.N, 'cat:' + c.categorie.join(','), 'premier:' + c.premier.join(','), 'chez ' + c.chez, c.autres.slice(0, 6).join(', '));
    console.log('  familles', h.familles.map((f) => f.f + ' ' + f.n + '/' + f.N + ' [' + f.mots.join(', ') + ']').join(' ; '));
    console.log('  remplaçants', h.remplacants.map((r) => r.nom + ' ' + r.score + ' : ' + motsDe(r.nom).join(',')).join(' | '));
  }
  console.log('style', JSON.stringify(STYLE.attend), 'thiols fortes', THIOLS_FORTE, 'catalogue', CATALOGUE);
}
