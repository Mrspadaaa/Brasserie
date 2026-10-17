// Construit le jeu de données compact du prototype houblons (mission #119, phase 8).
// Sources : src/data/hopBeerMaverickBootstrap.json (318 variétés, plages et tags),
// src/data/hopStyleUsageBootstrap.json (usages par style, IPA seulement),
// tests/fixtures/production/houblons-2026-10-17.json (stock réel, lecture seule),
// directions de style BJCP 2021 (relevées le 18.10.2026), règles produits de
// src/domain/hopDecision/products.ts. Sortie : prototypes/houblons/data.json.
// Usage (racine du dépôt) : node prototypes/houblons/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const bm = read('src/data/hopBeerMaverickBootstrap.json').hopVarieties;
const usage = read('src/data/hopStyleUsageBootstrap.json').varieties;
const prod = read('tests/fixtures/production/houblons-2026-10-17.json');

// Familles d'arômes : chaque tag Beer Maverick (anglais) va dans une famille au plus.
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
  alliace: ['onion', 'garlic', 'gazpacho', 'savory'],
  vin: ['white wine', 'wine', 'cognac', 'whiskey', 'sauvignon blanc', 'sauvignon'],
  torrefie: ['chocolate', 'coffee', 'roasted'],
};
const LABEL = { agrumes: 'agrumes', tropical: 'tropical', noyau: 'fruits à noyau', baies: 'baies', fruite: 'fruité', floral: 'floral', herbace: 'herbacé', vegetal: 'végétal', epice: 'épicé', terreux: 'terreux', boise: 'boisé', resine: 'résine', noble: 'noble', doux: 'doux', alliace: 'alliacé', vin: 'vin blanc', torrefie: 'torréfié' };
const tagFamily = new Map(Object.entries(FAMILY).flatMap(([f, tags]) => tags.map((t) => [t, f])));

// Mots affichés : traduction des tags les plus fréquents ; les autres restent tels quels.
const FR = { pepper: 'poivre', 'tropical fruit': 'fruits tropicaux', 'sauvignon blanc': 'sauvignon blanc', 'blood orange': 'orange sanguine', 'black pepper': 'poivre noir', citrus: 'agrumes', floral: 'floral', spicy: 'épicé', herbal: 'herbacé', pine: 'pin', fruity: 'fruité', tropical: 'tropical', lemon: 'citron', grapefruit: 'pamplemousse', earthy: 'terreux', orange: 'orange', 'black pepper': 'poivre noir', pineapple: 'ananas', 'passion fruit': 'fruit de la passion', lime: 'citron vert', peach: 'pêche', noble: 'noble', melon: 'melon', grassy: 'herbe coupée', 'stone fruit': 'fruits à noyau', resin: 'résine', tangerine: 'mandarine', woody: 'boisé', berry: 'baies', mint: 'menthe', dank: 'dank', pear: 'poire', green: 'vert', sweet: 'doux', apricot: 'abricot', mango: 'mangue', lemongrass: 'citronnelle', gooseberry: 'groseille', tobacco: 'tabac', cedar: 'cèdre', lavender: 'lavande', honey: 'miel', papaya: 'papaye', strawberry: 'fraise', mandarin: 'mandarine', 'white wine': 'vin blanc', hay: 'foin', licorice: 'réglisse', coconut: 'coco', rose: 'rose', cherry: 'cerise', caramel: 'caramel', guava: 'goyave', tea: 'thé', 'black tea': 'thé noir', clove: 'clou de girofle', banana: 'banane', plum: 'prune', 'black currant': 'cassis', cassis: 'cassis', vanilla: 'vanille', lychee: 'litchi', anise: 'anis', blackberry: 'mûre', raspberry: 'framboise', sage: 'sauge', thyme: 'thym', chocolate: 'chocolat', leather: 'cuir', oak: 'chêne', ginger: 'gingembre', elderflower: 'sureau', marmalade: 'marmelade', onion: 'oignon', garlic: 'ail', blueberry: 'myrtille', apple: 'pomme', grapes: 'raisin', 'white grape': 'raisin blanc', watermelon: 'pastèque', cinnamon: 'cannelle', eucalyptus: 'eucalyptus', jasmine: 'jasmin', geranium: 'géranium', redcurrant: 'groseille', juniper: 'genièvre', cannabis: 'cannabis', curry: 'curry', zest: 'zeste' };

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
const short = (o) => ({ 'United States of America (USA)': 'États-Unis', 'United Kingdom (UK)': 'Royaume-Uni', Germany: 'Allemagne', 'New Zealand': 'Nouvelle-Zélande', Australia: 'Australie', 'Czech Republic': 'Tchéquie', Slovenia: 'Slovénie', France: 'France', Poland: 'Pologne', Japan: 'Japon', Belgium: 'Belgique', 'South Africa': 'Afrique du Sud', Canada: 'Canada' }[o] || o || null);

// Usages par style documentés (IPA seulement dans le dépôt).
const usageByName = new Map();
for (const u of usage) {
  const fams = new Set(u.uses.flatMap((x) => x.families));
  const src = u.uses[0]?.source;
  for (const n of [u.name, ...(u.aliases || [])]) usageByName.set(n.toLowerCase().replace(/[®™]/g, '').trim(), { families: [...fams], source: src ? `${src.author} — ${src.title}` : null });
}

const varieties = bm.map((v) => {
  const tags = tagsOf(v);
  // famTags : nombre de descripteurs du houblon dans chaque famille (base de l'adéquation au style).
  const fams = {};
  for (const t of tags) { const f = tagFamily.get(t); if (f) fams[f] = (fams[f] || 0) + 1; }
  const u = usageByName.get(v.name.toLowerCase()) || (v.aliases || []).map((a) => usageByName.get(a.toLowerCase().replace(/[®™]/g, '').trim())).find(Boolean);
  return {
    id: v.id.replace(/^beermaverick-/, ''), name: v.name, origin: short(v.origin),
    alpha: range(v, 'alpha'), beta: range(v, 'beta'), oil: range(v, 'totalOil'),
    myrcene: range(v, 'myrcene'), humulene: range(v, 'humulene'), caryophyllene: range(v, 'caryophyllene'), farnesene: range(v, 'farnesene'),
    tags: tags.map((t) => FR[t] || t).slice(0, 8), fam: Object.keys(fams), famTags: fams, nTags: tags.length,
    usage: u ? u.families : [], usageSource: u?.source || null,
    url: (v.descriptions?.[0]?.source?.reference) || null,
  };
});

// Directions de style : BJCP 2021, descripteurs houblon cités par le guide (relevé du 18.10.2026).
const bjcp = (code, slug) => `https://www.bjcp.org/style/2021/${code.replace(/[A-Z]$/, '')}/${code}/${slug}/`;
const styles = [
  { id: 'stout-export', label: 'Stout export', group: 'stout', wanted: ['terreux', 'herbace', 'floral'], unwanted: [], ibu: [50, 70], note: 'Foreign Extra Stout, houblons anglais typiques', source: 'BJCP 2021, 16D', url: bjcp('16D', 'foreign-extra-stout') },
  { id: 'stout-irlandaise', label: 'Stout sèche (irlandaise)', group: 'stout', wanted: ['terreux', 'floral'], unwanted: [], ibu: [25, 45], note: 'arôme houblon faible, facultatif', source: 'BJCP 2021, 15B', url: bjcp('15B', 'irish-stout') },
  { id: 'stout-douce', label: 'Stout douce, milk, pastry', group: 'stout', wanted: ['floral', 'terreux'], unwanted: [], ibu: [20, 40], note: 'arôme houblon faible, facultatif', source: 'BJCP 2021, 16A', url: bjcp('16A', 'sweet-stout') },
  { id: 'stout-americaine', label: 'Stout américaine', group: 'stout', wanted: ['agrumes', 'resine'], unwanted: [], ibu: [35, 75], note: 'houblons américains', source: 'BJCP 2021, 20B', url: bjcp('20B', 'american-stout') },
  { id: 'stout-imperiale', label: 'Stout impériale', group: 'stout', wanted: ['terreux', 'floral', 'agrumes', 'resine'], unwanted: [], ibu: [50, 90], note: 'caractère anglais ou américain', source: 'BJCP 2021, 20C', url: bjcp('20C', 'imperial-stout') },
  { id: 'ipa-americaine', label: 'IPA américaine', group: 'ipa', usage: ['ipa', 'american-ipa'], wanted: ['agrumes', 'floral', 'resine', 'epice', 'tropical', 'noyau', 'baies', 'fruite'], unwanted: [], ibu: [40, 70], note: 'houblons américains ou du Nouveau Monde', source: 'BJCP 2021, 21A', url: bjcp('21A', 'american-ipa') },
  { id: 'neipa', label: 'IPA trouble (NEIPA)', group: 'ipa', usage: ['hazy-ipa'], wanted: ['noyau', 'tropical', 'agrumes', 'fruite'], unwanted: ['vegetal', 'herbace'], ibu: [25, 60], note: 'caractère herbacé ou végétal exclu', source: 'BJCP 2021, 21C', url: bjcp('21C', 'hazy-ipa') },
  { id: 'lager-tcheque', label: 'Lager blonde tchèque', group: 'lager', wanted: ['epice', 'floral', 'herbace', 'noble'], unwanted: [], ibu: [30, 45], note: 'bouquet épicé, floral ou herbacé', source: 'BJCP 2021, 3B', url: bjcp('3B', 'czech-premium-pale-lager') },
  { id: 'pils', label: 'Pils allemande', group: 'lager', wanted: ['floral', 'epice', 'herbace', 'noble'], unwanted: [], ibu: [22, 40], note: 'houblons floraux, épicés ou herbacés', source: 'BJCP 2021, 5D', url: bjcp('5D', 'german-pils') },
  { id: 'blanche', label: 'Blanche (witbier)', group: 'ble', wanted: ['epice', 'herbace', 'terreux'], unwanted: [], ibu: [8, 20], note: 'houblon discret, jamais au-dessus des épices', source: 'BJCP 2021, 24A', url: bjcp('24A', 'witbier') },
  { id: 'saison', label: 'Saison', group: 'belge', wanted: ['epice', 'floral', 'terreux', 'fruite'], unwanted: [], ibu: [20, 35], note: 'caractère continental', source: 'BJCP 2021, 25B', url: bjcp('25B', 'saison') },
];

// Stock de production : lien article → variété par le nom (aucun lien n'existe en base, #120).
const findVariety = (name) => {
  const n = name.toLowerCase().replace(/^houblon\s+/, '').replace(/cryo hops\s+/, '').replace(/\s+\d+([.,]\d+)?%.*$/, '').replace(/hallertauer/, 'hallertau').replace(/goldings east kent/, 'east kent golding').replace(/^nuget$/, 'nugget').trim();
  return varieties.find((v) => v.name.toLowerCase() === n) || varieties.find((v) => v.name.toLowerCase().startsWith(n)) || null;
};
const stock = prod.stockItems.map((s) => {
  const v = findVariety(s.name);
  const alphaInName = s.name.match(/(\d+(?:[.,]\d+)?)%/);
  return { item: s.name, variety: v?.id || null, grams: s.currentStock, form: /cryo/i.test(s.name) ? 'cryo' : 'pellet',
    alphaLot: s.alphaPct ?? (alphaInName ? Number(alphaInName[1].replace(',', '.')) : null), alphaFrom: s.alphaPct != null ? 'fiche' : alphaInName ? 'nom de l’article' : null };
}).filter((s) => s.variety);

const products = [
  { id: 'cryo', name: 'Cryo Hops®', maker: 'Yakima Chief Hops', ratio: [0.4, 0.5], uses: ['boil', 'whirlpool', 'dryhop'], source: 'Yakima Chief Hops, page Cryo Hops (products.ts)', note: 'Départ à 40–50 % du poids en pellets T-90 ; ni alpha, ni IBU, ni goût garantis.' },
  { id: 'hyperboost', name: 'HyperBoost®', maker: 'Yakima Chief Hops', ratio: [0.008, 0.01], uses: ['dryhop'], source: 'Yakima Chief Hops, HyperBoost (products.ts)', note: 'Dry hop en fermentation active : 25–50 % de la charge, T-90 ou Cryo pour le reste.' },
];

const out = { builtAt: new Date().toISOString().slice(0, 10), families: LABEL, varieties, styles, stock, products,
  sources: { varieties: 'Beer Maverick (agrégat de plages de fournisseurs), src/data/hopBeerMaverickBootstrap.json', usage: 'src/data/hopStyleUsageBootstrap.json (IPA seulement)', stock: 'production, lecture seule, 17.10.2026', styles: 'BJCP 2021 Style Guidelines' } };
fs.writeFileSync(path.join(root, 'prototypes/houblons/data.json'), JSON.stringify(out));
// Page autonome : app.html + données intégrées (« </ » échappé pour la balise script).
const app = fs.readFileSync(path.join(root, 'prototypes/houblons/app.html'), 'utf8');
if (!app.includes('/*DATA*/')) throw new Error('app.html sans emplacement /*DATA*/');
fs.writeFileSync(path.join(root, 'prototypes/houblons/index.html'), app.replace('/*DATA*/', JSON.stringify(out).replace(/<\//g, '<\\/')));
const missing = prod.stockItems.filter((s) => !findVariety(s.name)).map((s) => s.name);
console.log(`DATA OK ${varieties.length} variétés, ${varieties.filter((v) => v.fam.length).length} avec familles, ${stock.length} articles de stock reliés, ${styles.length} styles ; ${fs.statSync(path.join(root, 'prototypes/houblons/data.json')).size} octets` + (missing.length ? ` ; non reliés : ${missing.join(', ')}` : ''));
