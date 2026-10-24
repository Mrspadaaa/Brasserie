// Série a (lot D125, la liste de la fiche) : les mots des fiches, un par idée, traduits (D97), avec leur famille
// quand le dépôt en a une. Tout vient de prototypes/houblons-v4/data/pack-fiches.json : verifier() s'assure que
// chaque mot d'origine figure dans la fiche de son houblon, et que chaque famille vient de ses « aromes ».
// Champs d'un mot : m (le mot en français), f (famille ou null = hors des 12 familles), src (fiches qui le disent :
// [source, mot d'origine, 'mot' | 'classe']), premier (nombre de fiches qui le nomment en premier), gen (mot
// général : fruité). « classe » = la ligne « Familles déclarées » de Hopsteiner : un classement, pas un mot senti.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
export const RACINE = path.resolve(ici, '../../../../../../..');
const PACK = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
export const PICTOS = fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/pictos-familles.svg'), 'utf8');
export const JETONS = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/jetons-familles.json'), 'utf8'));

// Ordre du radar et des barres de la base v4.10 (fiche g1, étape Houblons).
export const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
// Stout 16D (BJCP 2021, style-bands.json) : familles attendues au nez et en bouche.
export const ATTENDUES_16D = ['earthy', 'herbal', 'floral'];

const BM = 'Beer Maverick', HS = 'Hopsteiner', HSB = 'Hopsteiner (boutique US)', YCH = 'Yakima Chief Hops';

export const HOUBLONS = [
  {
    key: 'nugget', pack: 'Nugget', nom: 'Nugget', origine: 'États-Unis', fiches: [[BM, 2023], [HS, 2025], [HSB, null], [YCH, null]],
    alpha: { min: 11, max: 14, src: 'Hopsteiner 2025' }, lot: 13, usage: 'double usage', stock: 0, dansRecette: '46 g · 60′',
    mots: [
      { m: 'herbacé', f: 'herbal', src: [[BM, 'herbacé', 'mot'], [HS, 'Herbacé', 'classe']], premier: 1 },
      { m: 'ananas', f: 'tropical', src: [[BM, 'ananas', 'mot'], [HS, 'Pineapple', 'mot']], premier: 1 },
      { m: 'boisé', f: 'resin', src: [[HSB, 'woody', 'mot'], [YCH, 'woody', 'mot']], premier: 2 },
      { m: 'floral', f: 'floral', src: [[HS, 'floral', 'mot']] },
      { m: 'géranium', f: 'floral', src: [[BM, 'géranium', 'mot']] },
      { m: 'résineux', f: 'resin', src: [[HSB, 'Resinous', 'mot']] },
      { m: 'litchi', f: 'tropical', src: [[BM, 'litchi', 'mot']] },
      { m: 'noix de coco', f: 'tropical', src: [[BM, 'noix de coco', 'mot']] },
      { m: 'agrumes', f: 'citrus', src: [[BM, 'agrumes', 'mot']] },
      { m: 'terreux', f: 'earthy', src: [[BM, 'terreux', 'mot']] },
      { m: 'gingembre', f: null, src: [[BM, 'gingembre', 'mot']] },
      { m: 'épicé', f: 'spice', src: [[HS, 'Épicé', 'classe']] },
    ],
  },
  {
    key: 'nelson-sauvin', pack: 'Nelson Sauvin', nom: 'Nelson Sauvin', origine: 'Nouvelle-Zélande', fiches: [[BM, 2023], [HS, 2025]],
    alpha: { min: 12, max: 14, src: 'Hopsteiner 2025' }, lot: 9.6, usage: 'double usage', stock: 100,
    mots: [
      { m: 'vin blanc', f: null, src: [[BM, 'vin blanc', 'mot'], [HS, 'White wine', 'mot']], premier: 2 },
      { m: 'groseille à maquereau', f: null, src: [[BM, 'groseille à maquereau', 'mot'], [HS, 'gooseberry', 'mot']] },
      { m: 'raisin', f: null, src: [[BM, 'raisin', 'mot'], [HS, 'grape', 'mot']] },
      { m: 'sauvignon blanc', f: null, src: [[BM, 'sauvignon blanc', 'mot']] },
      { m: 'fruité', f: null, gen: true, src: [[BM, 'fruité', 'mot'], [HS, 'fruity', 'mot']] },
      { m: 'agrumes', f: 'citrus', src: [[HS, 'Agrumes', 'classe']] },
      { m: 'épicé', f: 'spice', src: [[HS, 'Épicé', 'classe']] },
    ],
  },
  {
    key: 'citra-cryo', pack: 'Citra cryo', nom: 'Citra cryo', origine: 'États-Unis', fiches: [[BM, 2023]],
    alpha: { min: 10, max: 15, src: 'Citra, Beer Maverick 2023', variete: 'Citra' }, lot: 24.8, usage: 'aromatique', stock: 65,
    mots: [
      { m: 'agrumes', f: 'citrus', src: [[BM, 'agrumes', 'mot']], premier: 1 },
      { m: 'pamplemousse', f: 'citrus', src: [[BM, 'pamplemousse', 'mot']] },
      { m: 'citron vert', f: 'citrus', src: [[BM, 'citron vert', 'mot']] },
      { m: 'fruit de la passion', f: 'tropical', src: [[BM, 'fruit de la passion', 'mot']] },
      { m: 'litchi', f: 'tropical', src: [[BM, 'litchi', 'mot']] },
      { m: 'pêche', f: 'stoneFruit', src: [[BM, 'pêche', 'mot']] },
      { m: 'melon', f: 'melon', src: [[BM, 'melon', 'mot']] },
      { m: 'floral', f: 'floral', src: [[BM, 'floral', 'mot']] },
      { m: 'groseille à maquereau', f: null, src: [[BM, 'groseille à maquereau', 'mot']] },
    ],
  },
  {
    key: 'motueka', pack: 'Motueka', nom: 'Motueka', origine: 'Nouvelle-Zélande', fiches: [[BM, 2023], [HS, 2025]],
    alpha: { min: 6.5, max: 8.5, src: 'Hopsteiner 2025' }, lot: 8.1, usage: 'double usage', stock: 20,
    mots: [
      { m: 'citron vert', f: 'citrus', src: [[BM, 'citron vert', 'mot'], [HS, 'Fresh lime', 'mot']], premier: 1 },
      { m: 'agrumes', f: 'citrus', src: [[BM, 'agrumes', 'mot'], [HS, 'citrus', 'mot']], premier: 1 },
      { m: 'mojito', f: null, src: [[BM, 'mojito', 'mot'], [HS, 'mojito', 'mot']] },
      { m: 'citron', f: 'citrus', src: [[BM, 'citron', 'mot']] },
      { m: 'zeste de citron', f: 'citrus', src: [[HS, 'lemon zest', 'mot']] },
      { m: 'fruits tropicaux', f: 'tropical', src: [[BM, 'fruits tropicaux', 'mot']] },
      { m: 'floral', f: 'floral', src: [[BM, 'floral', 'mot']] },
      { m: 'fruité', f: null, gen: true, src: [[HS, 'Fruité', 'classe']] },
    ],
  },
  {
    key: 'cascade', pack: 'Cascade', nom: 'Cascade', origine: 'États-Unis', fiches: [[BM, 2023], [HS, 2025]],
    alpha: { min: 4.5, max: 7, src: 'Hopsteiner 2025' }, lot: 6.5, usage: 'aromatique', stock: 60,
    mots: [
      { m: 'pamplemousse', f: 'citrus', src: [[BM, 'pamplemousse', 'mot']], premier: 1 },
      { m: 'citron vert', f: 'citrus', src: [[HS, 'Lime', 'mot']], premier: 1 },
      { m: 'agrumes', f: 'citrus', src: [[BM, 'agrumes', 'mot'], [HS, 'Agrumes', 'classe']] },
      { m: 'cassis', f: 'berries', src: [[HS, 'black currant', 'mot']] },
      { m: 'pin', f: 'resin', src: [[BM, 'pin', 'mot']] },
      { m: 'floral', f: 'floral', src: [[BM, 'floral', 'mot']] },
      { m: 'épicé', f: 'spice', src: [[BM, 'épicé', 'mot']] },
      { m: 'herbacé', f: 'herbal', src: [[HS, 'Herbacé', 'classe']] },
      { m: 'fruité', f: null, gen: true, src: [[HS, 'Fruité', 'classe']] },
    ],
  },
];

// Compléments calculés : N fiches, n par mot, classement seul, niveaux du radar (repris tels quels du pack).
for (const h of HOUBLONS) {
  const p = PACK.find((x) => x.name === h.pack);
  h.N = h.fiches.length;
  h.radar = Object.fromEntries(ORDRE.map((f) => { const a = p.aromes.find((x) => x.family === f); return [f, { level: a.level, n: a.sources, of: a.of }]; }));
  for (const w of h.mots) { w.n = new Set(w.src.map((s) => s[0])).size; w.classeSeul = w.src.every((s) => s[2] === 'classe'); w.premier = w.premier || 0; }
  h.mots.sort((a, b) => b.n - a.n || (a.classeSeul - b.classeSeul) || (b.premier - a.premier));
  h.horsPart = h.mots.filter((w) => !w.f).length / h.mots.length;
}

export function verifier() {
  const fautes = [];
  for (const h of HOUBLONS) {
    const p = PACK.find((x) => x.name === h.pack);
    if (!p) { fautes.push(h.nom + ' absent du pack'); continue; }
    const texte = JSON.stringify(p);
    const a = p.alpha.sources.find((s) => h.alpha.src.includes(s.source) && h.alpha.src.includes(String(s.annee)));
    if (!a || a.min !== h.alpha.min || a.max !== h.alpha.max) fautes.push(h.nom + ' : α ' + h.alpha.min + '–' + h.alpha.max + ' introuvable');
    if (p.alpha.retenu.value !== h.lot) fautes.push(h.nom + ' : lot ' + h.lot + ' ≠ ' + p.alpha.retenu.value);
    if ((p.stock?.grams ?? 0) !== h.stock) fautes.push(h.nom + ' : stock ' + h.stock + ' ≠ ' + p.stock?.grams);
    for (const w of h.mots) {
      for (const [src, mot] of w.src) if (!texte.includes(mot)) fautes.push(h.nom + ' : « ' + mot + ' » (' + src + ') absent de la fiche');
      if (w.f) {
        const fam = p.aromes.find((x) => x.family === w.f);
        const mots = (fam?.mots || []).flatMap((x) => x.mots.map((m) => m.toLowerCase()));
        if (!w.src.some(([, mot]) => mots.includes(mot.toLowerCase()))) fautes.push(h.nom + ' : « ' + w.m + ' » rangé en ' + w.f + ' sans appui dans aromes');
      } else if (!w.src.some(([, mot]) => p.motsSansFamille.some((x) => x.mot.toLowerCase() === mot.toLowerCase()))) fautes.push(h.nom + ' : « ' + w.m + ' » dit hors famille, absent de motsSansFamille');
    }
  }
  return fautes;
}

export const fmt = (x) => String(x).replace('.', ',');
export const hop = (key) => HOUBLONS.find((h) => h.key === key);
