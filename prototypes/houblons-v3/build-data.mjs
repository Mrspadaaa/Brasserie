// Construit les données du prototype houblons v3 (mission #119), puis la page autonome.
// Reprend la lecture des descripteurs de prototypes/houblons/build-data.mjs (familles
// d'arômes, traductions) et y ajoute : 8 axes d'arôme, familles et linalol Hopsteiner,
// classe thiol, 123 styles BJCP 2021 avec une direction houblon par catégorie, levures,
// scénarios d'amertume à cru (Maye 2016) et stock de production relié par variété.
// Usage (racine du dépôt) : node prototypes/houblons-v3/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const here = 'prototypes/houblons-v3';
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const bm = read('src/data/hopBeerMaverickBootstrap.json').hopVarieties;
const usage = read('src/data/hopStyleUsageBootstrap.json').varieties;
const hs = read('src/data/hopManufacturerBootstrap.json').hopVarieties;
const bjcp = read('src/data/brewingStylesBootstrap.json').find((g) => g.id === 'styles-bjcp-2021');
const dry = read('src/data/hopBitternessBootstrap.json')[0];
const yeasts = read('src/data/hopYeastBootstrap.json');
const prod = read('tests/fixtures/production/houblons-2026-10-17.json');

// Familles de descripteurs (tags Beer Maverick, anglais) — reprises de la v2.
const FAMILY = {
  agrumes: ['citrus', 'lemon', 'grapefruit', 'orange', 'lime', 'tangerine', 'mandarin', 'zest', 'kumquat', 'marmalade', 'citus', 'lemongrass', 'blood orange', 'orange peel', 'lemon zest', 'lime zest'],
  tropical: ['tropical', 'tropical fruit', 'pineapple', 'passion fruit', 'passionfruit', 'mango', 'papaya', 'guava', 'lychee', 'coconut', 'banana', 'troical', 'kiwi'],
  noyau: ['stone fruit', 'stonefruit', 'peach', 'apricot', 'nectarine', 'plum', 'cherry'],
  baies: ['berry', 'berries', 'strawberry', 'raspberry', 'blackberry', 'blueberry', 'gooseberry', 'redcurrant', 'red currant', 'black currant', 'blackcurrant', 'cassis', 'loganberry', 'elderberry', 'red berry', 'redberry'],
  fruite: ['fruity', 'fruit', 'melon', 'pear', 'apple', 'grapes', 'grape', 'white grape', 'watermelon', 'honeydew', 'quince', 'fig', 'cataloupe', 'cantaloupe', 'dried fruit'],
  floral: ['floral', 'rose', 'lavender', 'geranium', 'jasmine', 'elderflower', 'blossom', 'magnolia', 'lilac', 'hibiscus', 'violet', 'honeysuckle', 'chamomile', 'potpourri', 'flowers'],
  herbace: ['herbal', 'mint', 'tea', 'sage', 'thyme', 'oregano', 'marjoram', 'dill', 'fennel', 'rosemary', 'eucalyptus', 'spearmint', 'menthol', 'anise', 'licorice', 'black tea'],
  vegetal: ['grassy', 'green', 'hay', 'grass', 'alfalfa', 'straw', 'cucumber', 'vegetal'],
  epice: ['spicy', 'black pepper', 'pepper', 'clove', 'cinnamon', 'nutmeg', 'ginger', 'allspice', 'curry', 'spice', 'spices', 'chilies'],
  terreux: ['earthy', 'tobacco', 'leather', 'musty'],
  boise: ['woody', 'cedar', 'oak', 'sandalwood', 'wood'],
  resine: ['pine', 'resin', 'resinous', 'dank', 'cannabis', 'juniper', 'pungent'],
  noble: ['noble', 'bohemian'],
  doux: ['sweet', 'candy', 'honey', 'caramel', 'vanilla', 'toffee', 'bubblegum', 'bubble gum', 'butterscotch', 'sugar', 'molasses', 'cream', 'candied'],
};
const tagFamily = new Map(Object.entries(FAMILY).flatMap(([f, tags]) => tags.map((t) => [t, f])));
const FR = { pepper: 'poivre', 'tropical fruit': 'fruits tropicaux', 'sauvignon blanc': 'sauvignon blanc', 'blood orange': 'orange sanguine', 'black pepper': 'poivre noir', citrus: 'agrumes', floral: 'floral', spicy: 'épicé', herbal: 'herbacé', pine: 'pin', fruity: 'fruité', tropical: 'tropical', lemon: 'citron', grapefruit: 'pamplemousse', earthy: 'terreux', orange: 'orange', pineapple: 'ananas', 'passion fruit': 'fruit de la passion', lime: 'citron vert', peach: 'pêche', noble: 'noble', melon: 'melon', grassy: 'herbe coupée', 'stone fruit': 'fruits à noyau', resin: 'résine', tangerine: 'mandarine', woody: 'boisé', berry: 'baies', mint: 'menthe', dank: 'dank', pear: 'poire', green: 'vert', sweet: 'doux', apricot: 'abricot', mango: 'mangue', lemongrass: 'citronnelle', gooseberry: 'groseille à maquereau', tobacco: 'tabac', cedar: 'cèdre', lavender: 'lavande', honey: 'miel', papaya: 'papaye', strawberry: 'fraise', mandarin: 'mandarine', 'white wine': 'vin blanc', hay: 'foin', licorice: 'réglisse', coconut: 'noix de coco', rose: 'rose', cherry: 'cerise', caramel: 'caramel', guava: 'goyave', tea: 'thé', 'black tea': 'thé noir', clove: 'clou de girofle', banana: 'banane', plum: 'prune', 'black currant': 'cassis', cassis: 'cassis', vanilla: 'vanille', lychee: 'litchi', anise: 'anis', blackberry: 'mûre', raspberry: 'framboise', sage: 'sauge', thyme: 'thym', chocolate: 'chocolat', leather: 'cuir', oak: 'chêne', ginger: 'gingembre', elderflower: 'fleur de sureau', marmalade: 'marmelade', onion: 'oignon', garlic: 'ail', blueberry: 'myrtille', apple: 'pomme', grapes: 'raisin', 'white grape': 'raisin blanc', watermelon: 'pastèque', cinnamon: 'cannelle', eucalyptus: 'eucalyptus', jasmine: 'jasmin', geranium: 'géranium', redcurrant: 'groseille', juniper: 'genièvre', cannabis: 'cannabis', curry: 'curry', zest: 'zeste', kiwi: 'kiwi', nectarine: 'nectarine', 'dried fruit': 'fruits secs', fig: 'figue', spice: 'épices', woody: 'boisé', musty: 'renfermé', straw: 'paille', grass: 'herbe', cucumber: 'concombre', rosemary: 'romarin', fennel: 'fenouil', dill: 'aneth', oregano: 'origan', marjoram: 'marjolaine', nutmeg: 'muscade', allspice: 'piment de la Jamaïque', candy: 'bonbon', toffee: 'caramel au beurre', bubblegum: 'chewing-gum', 'bubble gum': 'chewing-gum', butterscotch: 'caramel au beurre', wine: 'vin', cognac: 'cognac', whiskey: 'whisky', 'orange peel': 'zeste d’orange', 'lemon zest': 'zeste de citron', 'lime zest': 'zeste de citron vert', pungent: 'piquant', resinous: 'résineux', wood: 'bois', sandalwood: 'santal', blossom: 'fleurs', flowers: 'fleurs', chamomile: 'camomille', honeydew: 'melon miel', quince: 'coing', apple: 'pomme', kumquat: 'kumquat', spearmint: 'menthe verte', menthol: 'menthol', elderberry: 'sureau', loganberry: 'mûre de Logan', 'red berry': 'fruits rouges', redberry: 'fruits rouges', 'red currant': 'groseille', blackcurrant: 'cassis', berries: 'baies', stonefruit: 'fruits à noyau', passionfruit: 'fruit de la passion', fruit: 'fruit', grape: 'raisin', violet: 'violette', lilac: 'lilas', hibiscus: 'hibiscus', honeysuckle: 'chèvrefeuille', magnolia: 'magnolia', potpourri: 'pot-pourri', vegetal: 'végétal', alfalfa: 'luzerne', sugar: 'sucre', molasses: 'mélasse', cream: 'crème', candied: 'confit', savory: 'salé', gazpacho: 'gaspacho', chilies: 'piment', cantaloupe: 'cantaloup', cataloupe: 'cantaloup', bohemian: 'bohème', coffee: 'café', roasted: 'torréfié' };

// Huit axes du radar, en mots du brasseur. Chaque axe regroupe des familles de descripteurs.
const AXES = [
  { id: 'agr', label: 'Agrumes', fams: ['agrumes'] },
  { id: 'tro', label: 'Tropical', fams: ['tropical'] },
  { id: 'fru', label: 'Fruits', fams: ['noyau', 'baies', 'fruite'] },
  { id: 'flo', label: 'Floral', fams: ['floral'] },
  { id: 'her', label: 'Herbacé', fams: ['herbace', 'vegetal'] },
  { id: 'epi', label: 'Épicé', fams: ['epice'] },
  { id: 'ter', label: 'Terreux', fams: ['terreux', 'boise'] },
  { id: 'res', label: 'Résine', fams: ['resine'] },
];
const famAxis = new Map(AXES.flatMap((a, i) => a.fams.map((f) => [f, i])));

const fold = (s) => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[®™]/g, '').replace(/[^a-z0-9]/g, '');
const range = (v, a) => { const x = v.analysis.find((r) => r.analyte === a); return x?.range ? [x.range.min, x.range.max] : x?.value != null ? [x.value, x.value] : null; };
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

// Hopsteiner : familles déclarées, linalol (% de l'huile), classe thiol. Relié par le nom.
const HS_AXIS = { Agrumes: 'agr', Fruité: 'fru', Floral: 'flo', Herbacé: 'her', Épicé: 'epi', Résineux: 'res' };
const hsByName = new Map();
for (const v of hs) {
  const fams = v.descriptions.map((d) => d.text.match(/Familles déclarées sur houblon brut : (.+)\.$/)?.[1]).find(Boolean)?.split(/,\s*/) || [];
  const thiol = v.descriptions.map((d) => d.text.match(/Thiol impact » : (\w+)/)?.[1]).find(Boolean) || null;
  const rec = { fams, thiol, lin: range(v, 'linalool'), url: v.descriptions[0]?.source?.reference || null };
  for (const n of [v.name, ...v.name.split(/\s*[/(]\s*/)]) if (n) hsByName.set(fold(n.replace(/\)$/, '')), rec);
}
const HS_ALIAS = { saazcz: 'saazer', styriangoldings: 'styriangoldingcelea', saaz: 'saazer', saazczech: 'saazer', hallertau: 'hallertauermittelfruh', hallertaumittelfruh: 'hallertauermittelfruh', magnum: 'hallertauermagnum', eastkentgoldings: 'goldinguk', columbus: 'columbus', ctz: 'columbus' };

// Usages par style attestés (IPA seulement dans le dépôt).
const usageByName = new Map();
for (const u of usage) {
  const fams = [...new Set(u.uses.flatMap((x) => x.families))];
  const src = u.uses[0]?.source;
  for (const n of [u.name, ...(u.aliases || [])]) usageByName.set(fold(n), { fams, src: src ? `${src.author}, ${src.title}` : null, url: src?.reference || null });
}

const varieties = bm.map((v) => {
  const tags = tagsOf(v);
  const ax = AXES.map(() => 0);
  for (const t of tags) { const f = tagFamily.get(t); const i = famAxis.get(f); if (i != null) ax[i]++; }
  const hasTags = tags.some((t) => tagFamily.has(t));
  const key = fold(v.name);
  const h = hsByName.get(key) || hsByName.get(HS_ALIAS[key]) || (v.aliases || []).map((a) => hsByName.get(fold(a))).find(Boolean) || null;
  const u = usageByName.get(key) || (v.aliases || []).map((a) => usageByName.get(fold(a))).find(Boolean) || null;
  return {
    id: v.id.replace(/^beermaverick-/, ''), n: v.name, o: origin(v.origin),
    a: range(v, 'alpha'), b: range(v, 'beta'), oil: range(v, 'totalOil'),
    my: range(v, 'myrcene'), hu: range(v, 'humulene'), ca: range(v, 'caryophyllene'),
    // Intensité par axe : 0 absent, 1 présent, 2 marqué, 3 dominant (nombre de descripteurs, plafonné). null : aucun descripteur.
    ax: hasTags ? ax.map((c) => Math.min(3, c)) : null,
    tags: tags.map((t) => FR[t] || t).slice(0, 10),
    hs: h ? { f: h.fams.filter((f) => f !== 'Autres'), th: h.thiol, lin: h.lin, url: h.url } : null,
    use: u ? u.fams : [], useSrc: u?.src || null, useUrl: u?.url || null,
    url: v.descriptions?.[0]?.source?.reference || null,
  };
});

// Direction houblon par style : résumé du guide BJCP 2021, par catégorie (puis exceptions par code).
// want : axes voulus ; orig : origines typiques ; int : intensité d'arôme houblon attendue (0 aucune, 1 faible, 2 moyenne, 3 marquée).
const CONT = ['Allemagne', 'Tchéquie', 'Slovénie', 'France', 'Pologne'];
const NEW = ['États-Unis', 'Nouvelle-Zélande', 'Australie'];
const D = (want, orig, int, note, extra = {}) => ({ want, orig, int, note, ...extra });
const CAT = {
  1: D(['flo', 'epi', 'her'], [], 1, 'houblon discret, floral, épicé ou herbacé'),
  2: D(['flo', 'epi', 'her'], CONT, 1, 'houblon discret, floral, épicé ou herbacé'),
  3: D(['epi', 'flo', 'her'], ['Tchéquie'], 2, 'houblons tchèques : épicé, floral, herbacé'),
  4: D(['flo', 'epi', 'her'], ['Allemagne'], 1, 'houblons allemands nobles, discrets'),
  5: D(['flo', 'epi', 'her'], ['Allemagne'], 2, 'houblons allemands : floral, épicé, herbacé'),
  6: D(['flo', 'epi', 'her'], ['Allemagne'], 1, 'houblon discret, malt d’abord'),
  7: D(['flo', 'epi', 'her'], CONT, 1, 'houblons continentaux, discrets'),
  8: D(['flo', 'epi', 'her'], ['Allemagne'], 1, 'houblon discret'),
  9: D(['flo', 'epi', 'her'], ['Allemagne'], 0, 'arôme houblon nul ou presque'),
  10: D(['flo', 'epi', 'her'], ['Allemagne'], 1, 'houblon en soutien ; banane et girofle viennent de la levure'),
  11: D(['flo', 'ter', 'res', 'fru'], ['Royaume-Uni'], 2, 'houblons anglais : floral, terreux, résineux, fruité'),
  12: D(['agr', 'flo', 'fru'], ['Royaume-Uni', 'États-Unis'], 2, 'houblons anglais ou américains'),
  13: D(['ter', 'flo', 'her'], ['Royaume-Uni'], 1, 'houblons anglais, discrets'),
  14: D(['ter'], ['Royaume-Uni'], 0, 'arôme houblon nul ou presque'),
  15: D(['ter', 'flo'], ['Royaume-Uni'], 1, 'arôme houblon faible, terreux ou floral'),
  16: D(['ter', 'flo'], ['Royaume-Uni'], 1, 'arôme houblon faible, terreux ou floral'),
  17: D(['ter', 'flo', 'her', 'fru'], ['Royaume-Uni'], 1, 'houblons anglais'),
  18: D(['agr', 'flo', 'res', 'tro', 'fru', 'epi'], NEW, 2, 'houblons américains ou du Nouveau Monde'),
  19: D(['agr', 'flo', 'res', 'epi', 'fru'], ['États-Unis'], 2, 'houblons américains'),
  20: D(['agr', 'res', 'ter', 'flo'], ['États-Unis'], 2, 'houblons américains : agrumes, résine'),
  21: D(['agr', 'flo', 'res', 'epi', 'tro', 'fru'], NEW, 3, 'houblons américains ou du Nouveau Monde', { use: ['ipa', 'american-ipa'] }),
  22: D(['agr', 'res', 'flo', 'tro', 'fru'], NEW, 3, 'houblons américains, arôme marqué', { use: ['ipa', 'american-ipa'] }),
  23: D([], [], 0, 'aucun arôme houblon attendu ; houblons vieillis en lambic'),
  24: D(['epi', 'her', 'ter'], CONT, 1, 'houblon discret, épicé ou herbacé'),
  25: D(['epi', 'flo', 'ter', 'her'], CONT, 1, 'houblons continentaux : épicé, floral'),
  26: D(['epi', 'flo', 'her'], CONT, 1, 'houblons continentaux, discrets'),
  27: D(['flo', 'epi', 'her'], CONT, 1, 'selon la bière historique'),
};
const CODE = {
  '1D': D(['agr', 'flo', 'epi', 'fru'], ['États-Unis'], 2, 'houblons américains possibles'),
  '3B': D(['epi', 'flo', 'her'], ['Tchéquie'], 3, 'Saaz : épicé, floral, herbacé, marqué'),
  '3D': D(['epi', 'flo', 'her'], ['Tchéquie'], 1, 'houblons tchèques, discrets'),
  '5D': D(['flo', 'epi', 'her'], ['Allemagne'], 3, 'houblons allemands : floral, épicé, herbacé, marqué'),
  '6C': D(['flo', 'epi', 'her'], ['Allemagne'], 0, 'arôme houblon nul ou presque'),
  '7B': D(['epi', 'her', 'flo'], ['Allemagne'], 1, 'houblons allemands, amertume ferme'),
  '11B': D(['flo', 'ter', 'res', 'fru'], ['Royaume-Uni'], 2, 'houblons anglais'),
  '12B': D(['ter', 'her', 'res', 'epi'], ['Australie'], 2, 'Pride of Ringwood : terreux, herbacé, résineux'),
  '12C': D(['flo', 'epi', 'agr'], ['Royaume-Uni'], 3, 'houblons anglais : floral, poivré, orange'),
  '16C': D(['ter', 'flo'], [], 0, 'arôme houblon nul ou presque'),
  '16D': D(['ter', 'her', 'flo'], ['Royaume-Uni'], 2, 'houblons anglais typiques : terreux, herbacé, floral'),
  '17C': D(['ter'], ['Royaume-Uni'], 0, 'arôme houblon nul ou presque'),
  '17D': D(['ter', 'flo', 'her', 'fru'], ['Royaume-Uni'], 2, 'houblons anglais'),
  '18A': D(['agr', 'flo', 'fru', 'epi'], NEW, 1, 'houblon discret, souvent américain'),
  '18B': D(['agr', 'flo', 'res', 'tro', 'fru', 'epi'], NEW, 3, 'houblons américains ou du Nouveau Monde'),
  '19B': D(['ter', 'her', 'res'], ['États-Unis'], 2, 'Northern Brewer : boisé, rustique, mentholé'),
  '20A': D(['res', 'ter', 'flo', 'agr'], ['États-Unis'], 2, 'houblons américains : résineux, terreux, floral'),
  '20B': D(['agr', 'res'], ['États-Unis'], 2, 'houblons américains : agrumes, résine'),
  '20C': D(['ter', 'flo', 'her', 'agr', 'res'], ['Royaume-Uni', 'États-Unis'], 2, 'caractère anglais ou américain'),
  '21C': D(['fru', 'tro', 'agr'], NEW, 3, 'fruits mûrs et tropicaux ; herbacé et végétal exclus', { not: ['her'], use: ['hazy-ipa'] }),
  '22D': D(['agr', 'flo', 'fru'], [], 1, 'tout houblon, discret'),
  '25B': D(['epi', 'flo', 'ter', 'fru'], CONT, 2, 'caractère continental : épicé, floral, terreux'),
  '12A': D(['agr', 'flo', 'fru'], ['Royaume-Uni', 'États-Unis'], 2, 'houblons anglais ou américains, souvent agrumes'),
};
const FR_NAME = { '16D': 'Stout export', '15B': 'Stout irlandaise', '15C': 'Stout irlandaise forte', '16A': 'Stout douce (milk, pastry)', '16B': 'Stout à l’avoine', '16C': 'Stout tropicale', '20A': 'Porter américain', '20B': 'Stout américaine', '20C': 'Stout impériale', '13C': 'Porter anglais', '9C': 'Porter baltique', '1A': 'Lager légère américaine', '3B': 'Lager blonde tchèque', '5D': 'Pils allemande', '4A': 'Helles de Munich', '5B': 'Kölsch', '7B': 'Altbier', '10A': 'Weissbier', '24A': 'Blanche (witbier)', '25B': 'Saison', '21A': 'IPA américaine', '21C': 'IPA trouble (NEIPA)', '22A': 'Double IPA', '12C': 'IPA anglaise', '18B': 'Pale ale américaine', '11B': 'Bitter', '23A': 'Berliner Weisse', '23G': 'Gose', '26C': 'Triple belge', '25A': 'Blonde belge' };
const styles = bjcp.styles.map((s) => {
  const cat = Number(s.code.match(/^\d+/)[0]);
  const dir = CODE[s.code] || CAT[cat] || null;
  const mid = (r) => r ? (r.min + r.max) / 2 : null;
  return {
    id: s.id, code: s.code, n: FR_NAME[s.code] || s.name, en: s.name, cat,
    ibu: s.stats?.ibu ? [s.stats.ibu.min, s.stats.ibu.max] : null,
    og: s.stats?.og ? [s.stats.og.min, s.stats.og.max] : null, ogMid: s.stats?.og ? Math.round(mid(s.stats.og) * 1000) / 1000 : null,
    dir: dir ? { want: dir.want, not: dir.not || [], orig: dir.orig, int: dir.int, note: dir.note, use: dir.use || [] } : null,
    url: s.source?.reference || null,
  };
});

// Stock de production : articles reliés à une variété par leur nom (aucun lien en base, #120), regroupés par variété.
const findVariety = (name) => {
  const n = name.toLowerCase().replace(/^houblon\s+/, '').replace(/cryo hops\s+/, '').replace(/\s+\d+([.,]\d+)?%.*$/, '').replace(/hallertauer/, 'hallertau').replace(/goldings east kent/, 'east kent golding').replace(/^nuget$/, 'nugget').trim();
  return varieties.find((v) => v.n.toLowerCase() === n) || varieties.find((v) => v.n.toLowerCase().startsWith(n)) || null;
};
const byVar = new Map();
const unlinked = [];
for (const s of prod.stockItems) {
  const v = findVariety(s.name);
  if (!v) { unlinked.push(s.name); continue; }
  const cryo = /cryo/i.test(s.name);
  const key = v.id + (cryo ? ':cryo' : '');
  const alphaInName = s.name.match(/(\d+(?:[.,]\d+)?)%/);
  const alpha = s.alphaPct ?? (alphaInName ? Number(alphaInName[1].replace(',', '.')) : null);
  const cur = byVar.get(key) || { v: v.id, form: cryo ? 'cryo' : 'pellet', g: 0, alpha: null, alphaFrom: null, items: [] };
  cur.g += s.currentStock || 0;
  cur.items.push(s.name);
  if ((s.currentStock || 0) > 0 && alpha != null) { cur.alpha = alpha; cur.alphaFrom = s.alphaPct != null ? 'fiche de stock' : 'lu sur l’article'; }
  else if (cur.alpha == null && alpha != null) { cur.alpha = alpha; cur.alphaFrom = s.alphaPct != null ? 'fiche de stock' : 'lu sur l’article'; }
  byVar.set(key, cur);
}
const stock = [...byVar.values()].map(({ items, ...s }) => ({ ...s, item: items.join(' + ') }));

const products = {
  cryo: { n: 'Cryo Hops®', maker: 'Yakima Chief Hops', ratio: [0.4, 0.5], note: 'Départ à 40–50 % du poids en pellets T-90, en arôme (whirlpool, dry hop). Ni alpha, ni IBU, ni goût garantis par ce ratio.', src: 'Yakima Chief Hops, page Cryo Hops, FAQ (consultée le 30.09.2026)' },
  hyperboost: { n: 'HyperBoost®', maker: 'Yakima Chief Hops', perKg: [8, 10], share: [0.25, 0.5], note: 'En dry hop : 8–10 g d’HyperBoost à la place de 1 kg de T-90, pour 25–50 % de la charge ; le reste en T-90 ou Cryo. Aucun ratio publié pour le whirlpool.', src: 'Yakima Chief Hops, HyperBoost Technical One Sheet 2025' },
  co2: { n: 'Extrait CO₂', maker: 'Hopsteiner', note: 'Amertume sans matière végétale ; dose par calculateur fabricant (IBU visé, efficacité), sans ratio fixe au T-90.', src: 'Hopsteiner, Extract Product Dosing Rate Calculator' },
};

const out = {
  builtAt: new Date().toISOString().slice(0, 10),
  axes: AXES.map(({ id, label }) => ({ id, label })),
  varieties, styles, stock, products,
  dry: { version: dry.version, hum: [dry.humulinonesPct.range.min, dry.humulinonesPct.range.max], rel: dry.relativeBitterness.value, src: `${dry.source.author} (${dry.source.year}), ${dry.source.locator}`, exp: dry.experiments.map((e) => ({ id: e.id, pts: e.points.map((p) => [p.doseLbBbl, p.isoAfterMgL / p.isoBeforeMgL, p.recovery]) })) },
  yeasts: yeasts.map((y) => ({ n: y.name, bl: y.betaLyase })),
  sources: {
    bm: 'Beer Maverick (plages historiques de fournisseurs, descripteurs), src/data/hopBeerMaverickBootstrap.json',
    hs: 'Hopsteiner, fiches variétales 2025 (familles, linalol, classe thiol), src/data/hopManufacturerBootstrap.json',
    use: 'Usages attestés par des fournisseurs, IPA seulement, src/data/hopStyleUsageBootstrap.json',
    bjcp: 'BJCP 2021 Style Guidelines (statistiques ; direction houblon résumée par catégorie)',
    stock: 'Stock de production, lecture seule, 17.10.2026 (tests/fixtures/production)',
    ibu: 'Tinseth, comme BrewingMath.hopIbu (src/services/brewingMath.ts)',
  },
};
fs.writeFileSync(path.join(root, here, 'data.json'), JSON.stringify(out));
const app = fs.readFileSync(path.join(root, here, 'app.html'), 'utf8');
if (!app.includes('/*DATA*/')) throw new Error('app.html sans emplacement /*DATA*/');
fs.writeFileSync(path.join(root, here, 'index.html'), app.replace('/*DATA*/', JSON.stringify(out).replace(/<\//g, '<\\/')));
const withAx = varieties.filter((v) => v.ax).length, withHs = varieties.filter((v) => v.hs).length;
const inStock = stock.filter((s) => s.g > 0);
console.log(`DATA-V3 OK ${varieties.length} variétés (${withAx} avec profil, ${withHs} reliées à Hopsteiner), ${styles.length} styles (${styles.filter((s) => s.dir).length} avec direction), ${inStock.length} houblons en stock (${inStock.reduce((t, s) => t + s.g, 0)} g), ${stock.length - inStock.length} épuisés` + (unlinked.length ? ` ; non reliés : ${unlinked.join(', ')}` : ''));
