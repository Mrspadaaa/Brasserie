// Série rcb (recherche avancée, 24.10) : les données des quatre concepts, lues dans le dépôt, rien d'inventé.
// - proto-data.json : 318 variétés (nom, origine, α, huile totale, tagsFr, descriptions) et le stock (16 articles) ;
// - hopExtrapolationV4Bootstrap.json : les termes des 12 familles du modèle V5.5, appliqués comme
//   hopDescriptorEvidence (fiches hors « beer », mot entier, négation exclue) ;
// - pack-fiches.json : les remplaçants calculés (substitution v1) des 32 houblons à fiche ;
// - jetons-familles.json : couleurs des familles (texte, base, fond) ; pictos : la planche v3 (p-<famille>).
// Rôle par l'α (roles.ts) : α ≥ 10 → double si une famille est marquée, sinon amérisant ; α ≤ 6 → aromatique ; sinon double.
// L'inconnu reste « ? », jamais 0.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
export const RACINE = path.resolve(ici, '../../../../../..');
const lire = (p) => JSON.parse(fs.readFileSync(path.join(RACINE, p), 'utf8'));
const PROTO = lire('prototypes/houblons-v4/data/proto-data.json');
const PACK = lire('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const AXES = lire('src/data/hopExtrapolationV4Bootstrap.json')[0].axes;
export const JETONS = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json');
const PLANCHE = fs.readFileSync(path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html'), 'utf8');
export const PICTOS = PLANCHE.split('\n').filter((l) => /<symbol id="p-/.test(l)).join('\n');
export const ICONES_PLANCHE = PLANCHE.split('\n').filter((l) => /<symbol id="(i|j)-/.test(l)).join('\n');

export const FAMILLES = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'floral', 'herbal', 'resin', 'spice', 'green', 'earthy'];
export const NOM = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const T = (f) => JETONS[f].texte;
export const B = (f) => JETONS[f].base;
export const F = (f) => JETONS[f].fond;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const virg = (n) => String(n).replace('.', ',');
export const plage = (p, u = '') => (p && p.length === 2 && p[0] != null ? (p[0] === p[1] ? virg(p[0]) : virg(p[0]) + '–' + virg(p[1])) + u : '?');

const norm = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const TERMES = new Map(AXES.map((a) => [a.id, a.terms.map(norm).filter(Boolean)]));
const NEG = ['no', 'not', 'non', 'sans', 'pas de'];
const cite = (texte, f) => TERMES.get(f).some((t) => texte.includes(' ' + t + ' ') && !NEG.some((n) => texte.includes(' ' + n + ' ' + t + ' ')));
const items = (text) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /).map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ')).filter(Boolean);

// Traduction des mots anglais (D97) pour les mots hors des 12 familles venus des fiches Hopsteiner.
const FR = { 'white wine': 'vin blanc', fruity: 'fruité', gooseberry: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin', mojito: 'mojito', 'lemon zest': 'zeste de citron', dank: 'dank', cannabis: 'cannabis', 'sauvignon blanc': 'sauvignon blanc', mild: 'doux', noble: 'noble', 'tropical fruits': 'fruits tropicaux', sweet: 'sucré', candy: 'bonbon', 'bubble gum': 'chewing-gum', bubblegum: 'chewing-gum', honey: 'miel', toffee: 'caramel', caramel: 'caramel', 'red wine': 'vin rouge', wine: 'vin', vanilla: 'vanille', chocolate: 'chocolat', coffee: 'café', tobacco: 'tabac', leather: 'cuir', nutty: 'noisette', cream: 'crème', creamy: 'crémeux', butter: 'beurre', juicy: 'juteux', tart: 'acidulé', sour: 'acide', bitter: 'amer', harsh: 'rude', clean: 'net', smooth: 'rond', delicate: 'délicat', pungent: 'piquant', onion: 'oignon', garlic: 'ail', cat: 'chat', catty: 'chat', sulfur: 'soufre', rhubarb: 'rhubarbe', kiwi: 'kiwi', fig: 'figue', dates: 'dattes', quince: 'coing', banana: 'banane', plum: 'prune', apricot: 'abricot', marmalade: 'marmelade', cucumber: 'concombre', ginger: 'gingembre', nutmeg: 'muscade', 'herbal tea': 'tisane', 'black tea': 'thé noir', 'green tea': 'thé vert', chamomile: 'camomille', gin: 'gin', juniper: 'genièvre', blossom: 'fleur', 'orange blossom': 'fleur d’oranger', hoppy: 'houblonné', aromatic: 'aromatique', pleasant: 'plaisant', intense: 'intense', strong: 'fort', neutral: 'neutre', fine: 'fin', classic: 'classique', traditional: 'traditionnel', fresh: 'frais', dried: 'séché', cola: 'cola', liquor: 'liqueur', rum: 'rhum', whisky: 'whisky', bourbon: 'bourbon', oak: 'chêne', smoke: 'fumé', smoky: 'fumé', malty: 'malté', bready: 'pain', fruit: 'fruit', fruits: 'fruits', exotic: 'exotique', 'exotic fruit': 'fruit exotique', jam: 'confiture', marshmallow: 'guimauve', yoghurt: 'yaourt', milk: 'lait', musky: 'musqué', balsamic: 'balsamique', peppermint: 'menthe poivrée', fennel: 'fenouil', dill: 'aneth', curry: 'curry', tarragon: 'estragon', thyme: 'thym', oregano: 'origan', grass: 'herbe', sugar: 'sucre', mellow: 'doux', sugary: 'sucré', passionfruit: 'fruit de la passion', 'passion fruit': 'fruit de la passion', lemon: 'citron', molasses: 'mélasse', aniseed: 'anis', 'dark fruit': 'fruits noirs', wild: 'sauvage', whiskey: 'whisky', cedarwood: 'cèdre', resiny: 'résineux', 'white grape': 'raisin blanc', savory: 'salé', zest: 'zeste', lemongrass: 'citronnelle', yogurt: 'yaourt', 'stone fruit': 'fruits à noyau', musty: 'renfermé', hoppy: 'houblonné', floral: 'floral', herbal: 'herbacé', earthy: 'terreux', spicy: 'épicé', citrus: 'agrumes', woody: 'boisé', piney: 'pin', 'tropical fruit': 'fruits tropicaux' };
const NOM_FAMILLE = /^(agrumes|floral|épicé|herbacé|terreux|résineux|fruits tropicaux|tropical|boisé|végétal|melon|baies|fruits à noyau)$/i;
const fr = (w) => FR[w.toLowerCase()] || w;
const GENERIQUE = /^(fruité|fruity|doux|noble|classique|traditionnel|net|fin|plaisant|intense|fort|neutre|aromatique|houblonné|frais|fruit|fruits|mild|sweet|sucré)$/i;

export const STOCK = new Map(PROTO.stock.map((s) => [s.varietyId, s]));

function profil(v) {
  const fiches = (v.descriptions || []).filter((d) => d.context !== 'beer');
  const fam = Object.fromEntries(FAMILLES.map((f) => [f, { n: 0, premier: false, mots: [] }]));
  const sans = [];
  for (const d of fiches) {
    const vus = new Set();
    const declaree = /^Familles déclarées/.test(d.text);
    items(d.text).forEach((it, n) => {
      const t = ' ' + norm(it) + ' ';
      const fs_ = FAMILLES.filter((f) => cite(t, f));
      const i = (v.tags || []).findIndex((x) => x.toLowerCase().replace(/[_-]+/g, ' ') === it.toLowerCase());
      const mot = fr(((i >= 0 && v.tagsFr[i]) ? v.tagsFr[i] : it).replace(/^étiquette\s+/i, ''));
      if (!fs_.length) { if (!declaree && !sans.some((x) => x.toLowerCase() === mot.toLowerCase())) sans.push(mot); return; }
      for (const f of fs_) {
        if (!vus.has(f)) { fam[f].n++; vus.add(f); }
        if (n === 0) fam[f].premier = true;
        if (!declaree && !fam[f].mots.some((m) => m.toLowerCase() === mot.toLowerCase())) fam[f].mots.push(mot);
      }
    });
  }
  const niveau = (f) => (fam[f].n === 0 ? 0 : fam[f].n >= 2 || fam[f].premier ? 2 : 1);
  const familles = FAMILLES.filter((f) => niveau(f) > 0).sort((a, b) => niveau(b) - niveau(a) || fam[b].mots.length - fam[a].mots.length);
  const marquees = FAMILLES.filter((f) => niveau(f) === 2);
  const st = STOCK.get(v.id);
  const aMid = v.alpha && v.alpha[0] != null ? (v.alpha[0] + v.alpha[1]) / 2 : null;
  const aRet = st ? st.alpha : aMid;
  // Rôle du fournisseur d'abord (usage[].roles, roles.ts : BITTER / AROMA), sinon la règle de l'α.
  const roles = (v.usage || []).flatMap((u) => u.roles || []);
  const amer = roles.some((r) => ['Amertume', 'Début d’ébullition', 'Milieu d’ébullition'].includes(r)), arome = roles.some((r) => ['Ajouts tardifs', 'Houblonnage à cru', 'Arôme', 'Whirlpool', 'Extinction de la chauffe'].includes(r));
  const role = amer || arome ? (amer && arome ? 'double' : amer ? 'amérisant' : 'aromatique') : aRet == null ? '?' : aRet >= 10 ? (marquees.length ? 'double' : 'amérisant') : aRet <= 6 ? 'aromatique' : 'double';
  return {
    id: v.id, nom: v.name, origine: v.origin || '?', alpha: v.alpha, huile: v.oil, tagsFr: v.tagsFr || [],
    familles, marquees, niveau: Object.fromEntries(FAMILLES.map((f) => [f, niveau(f)])), compte: Object.fromEntries(FAMILLES.map((f) => [f, fam[f].n])), mots: Object.fromEntries(FAMILLES.map((f) => [f, fam[f].mots])),
    sans: sans.filter((m) => !GENERIQUE.test(m) && !NOM_FAMILLE.test(m)),
    stock: st ? { g: st.grams, alpha: st.alpha, article: st.items[0] } : null, role, roleSource: amer || arome ? 'fournisseur' : 'α', aRet, fiches: fiches.length,
    thiol: v.hsThiol ? v.hsThiol.class : null, linalol: v.hsLinalool ? v.hsLinalool.range : null,
  };
}

export const HOUBLONS = PROTO.varieties.map(profil);
export const PAR_NOM = new Map(HOUBLONS.map((h) => [h.nom, h]));
export const PAR_ID = new Map(HOUBLONS.map((h) => [h.id, h]));
export const CATALOGUE = HOUBLONS.length;
const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
export const dit = (h, mot) => h.tagsFr.some((t) => eq(t, mot)) || FAMILLES.some((f) => h.mots[f].some((m) => eq(m, mot))) || h.sans.some((m) => eq(m, mot));
export const chez = (mot) => HOUBLONS.filter((h) => dit(h, mot));

// Remplaçants calculés (substitution v1 du dépôt) d'un houblon à fiche ; null si la fiche manque.
export const remplacants = (nom) => { const f = PACK.find((x) => x.name === nom); return (f && f.substitutsCalcules) || null; };
export const FICHE = (nom) => PACK.find((x) => x.name === nom);

// Picto d'une famille, au trait de la planche v3 (D88), sans halo.
export const pi = (f, s = 16, cls = 'rcb-pi') => '<svg class="' + cls + '" width="' + s + '" height="' + s + '" data-famille="' + f + '" role="img" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>';
export const SYMBOLES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + PICTOS + '\n' + ICONES_PLANCHE + '</defs></svg>';
export function ecrire(dossier, html) { fs.writeFileSync(path.join(dossier, 'etat.html'), html); }
