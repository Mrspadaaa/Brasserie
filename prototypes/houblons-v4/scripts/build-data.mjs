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
    thiol: thiol ? { class: thiol, reference: v.descriptions[0]?.source?.reference ?? null } : null };
  for (const n of [v.name, ...v.name.split(/\s*[/(]\s*/)]) if (n) hsByName.set(fold(n.replace(/\)$/, '')), rec);
}
const HS_ALIAS = { saazcz: 'saazer', styriangoldings: 'styriangoldingcelea', styriangolding: 'styriangoldingcelea', saaz: 'saazer', hallertau: 'hallertauermittelfruh', hallertaumittelfruh: 'hallertauermittelfruh', hallertautaurus: 'hallertauertaurus', hallertautradition: 'hallertauertradition', magnum: 'hallertauermagnum', eastkentgoldings: 'goldinguk', ctz: 'columbus' };

// Faits cités un à un (data/faits-cites.json, D25) : descriptions sourcées ajoutées à la variété.
const facts = JSON.parse(fs.readFileSync(path.join(here, 'data', 'faits-cites.json'), 'utf8')).facts;
for (const f of facts) if (!bm.some((v) => v.id === f.varietyId)) throw Error(`Fait cité sur une variété absente : ${f.id}`);

// Descriptions conservées pour le moteur : seulement celles qui portent des descripteurs.
const varieties = bm.map((v) => {
  const id = v.id;
  const key = fold(v.name);
  const h = hsByName.get(key) || hsByName.get(HS_ALIAS[key]) || (v.aliases || []).map((a) => hsByName.get(fold(a))).find(Boolean) || null;
  const short = id.replace(/^beermaverick-/, '');
  const tags = tagsOf(v);
  return {
    id, name: v.name, aliases: v.aliases || [], origin: ORIGIN_FIX[short] || origin(v.origin), form: v.form,
    alpha: range(v, 'alpha'), beta: range(v, 'beta'), oil: range(v, 'totalOil'),
    tags, tagsFr: tags.map((t) => FR[t] || t),
    descriptions: [...(v.descriptions || []).filter((d) => /Tags documentaires/.test(d.text)), ...(h ? h.descriptions : []),
      ...facts.filter((f) => f.varietyId === id).map((f) => f.description)],
    citedFacts: facts.filter((f) => f.varietyId === id).map((f) => f.id),
    hopsteinerId: h?.id ?? null, hsLinalool: h?.linalool ?? null, hsThiol: h?.thiol ?? null,
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
  ibu: s.stats?.ibu ? [s.stats.ibu.min, s.stats.ibu.max] : null,
  og: s.stats?.og ? [s.stats.og.min, s.stats.og.max] : null,
  srm: s.stats?.srm ? [s.stats.srm.min, s.stats.srm.max] : null,
  url: s.source?.reference || null,
}));

const out = {
  fixture: FIXTURE, fixtureSource: prod.source,
  sources: {
    varieties: 'Beer Maverick (descripteurs, plages historiques), src/data/hopBeerMaverickBootstrap.json',
    hopsteiner: 'Hopsteiner 2025, familles déclarées et descripteurs, src/data/hopManufacturerBootstrap.json',
    styles: 'BJCP 2021, statistiques, src/data/brewingStylesBootstrap.json',
    stock: `Stock de production, lecture seule, ${FIXTURE}`,
    facts: `Faits cités un à un, data/faits-cites.json (${facts.length})`,
  },
  varieties, stock, unlinked, styles,
};
fs.mkdirSync(path.join(here, 'data'), { recursive: true });
fs.writeFileSync(path.join(here, 'data', 'proto-data.json'), JSON.stringify(out));
const inStock = stock.filter((s) => s.grams > 0);
console.log(`DATA-V4 ${varieties.length} variétés (${varieties.filter((v) => v.tags.length).length} avec descripteurs, ${varieties.filter((v) => v.hopsteinerId).length} reliées à Hopsteiner), ${styles.length} styles, ${inStock.length} houblons en stock (${inStock.reduce((t, s) => t + s.grams, 0)} g), ${stock.length - inStock.length} épuisés` + (unlinked.length ? ` ; non reliés : ${unlinked.join(', ')}` : ''));
