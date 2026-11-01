// Trois niveaux pour chaque valeur de la pièce (voie f2-confiance, D277) : `sur` (rien à montrer), `repris` (remplie sans certitude : il contrôle, jaune),
// `inconnu` (rien de lisible, ou une contradiction que nulle règle ne tranche : il remplit ou corrige, rouge). Pur : aucun React, aucun réseau, aucune écriture.
// Le module ne donne que le NIVEAU ; l'écran pose la couleur (jeton `attention` pour `repris`, `alert` pour `inconnu`, DESIGN.md : une seule couleur d'alerte).
//
// Ses mots (01.11) : « Pour les unités, c'est quand même facile à deviner ? Si il y a un doute, ça me flag mais de base ça essaie d'auto remplir. Sûr ou
// quasiment sûr, rien. Pas sûr mais repris, flag jaune, je contrôle. Ne sait pas, aucune idée, flag rouge, je dois remplir ou corriger » ; « pas que pour les
// unités mais globalement pour tout ». Les tables (point → champ → niveau, indice → unité → niveau) sont écrites dans PLAN.md de la voie.
// Les règles ne sont jamais écrites avec des noms d'achat : des termes du métier, des mots de famille, des fourchettes de prix.
import { lineMathCheck, peserPoint, sumCheck, type InvoicePoint } from '../../domain/finance/invoicePoints';
import { ligneDepuisId, toCents, type ScanPointCode } from '../../../functions/src/invoiceControls';
import { SCAN_POINT_CODES } from '../../domain/finance/invoicePoints';
import { Units } from '../../services/units';
import { isReadableUnit } from '../../services/ingredientIdentity';
import { donneesDeLigne, linkUnit, regleProduit, SACHET_MAX_G, shortUnit } from '../../services/stockLineMatching';
import { ligneDeBrouillon } from '../../domain/stock/articleNeuf';
import type { StockItem } from '../../types';
import { familleDe, jetons, type FamilleCle } from './familles';

export type Niveau = 'sur' | 'repris' | 'inconnu';
/** Une valeur et ce qu'on en sait. `valeur` absente + `sur` = « sans objet » (un port n'a pas d'unité) ; absente + `inconnu` = rien de lisible. */
export interface Valeur<T> { niveau: Niveau; valeur?: T; raison: string; /** Absent mais facultatif (numéro de facture, TVA) : l'écran peut adoucir. */ facultatif?: true }
/** L'unité d'une ligne : d'où elle vient (`imprimee` : lue ou tapée, jamais réécrite ; `deduite` : par une règle ; `aucune`) et quelle règle. */
export interface ValeurUnite extends Valeur<string> { source: 'imprimee' | 'deduite' | 'aucune'; regle: string }

const RANG: Record<Niveau, number> = { sur: 0, repris: 1, inconnu: 2 };
/** Le pire niveau d'un ensemble de valeurs (la rangée, la pièce). Vide : `sur`. */
export function pireNiveau(valeurs: ReadonlyArray<Niveau | { niveau: Niveau }>): Niveau {
  let pire: Niveau = 'sur';
  for (const v of valeurs) { const n = typeof v === 'string' ? v : v.niveau; if (RANG[n] > RANG[pire]) pire = n; }
  return pire;
}
const pireDe = (a: Niveau, b: Niveau): Niveau => (RANG[b] > RANG[a] ? b : a);

/** Une ligne du brouillon (ou de la lecture : `kind` « stock » vaut « ingredient »). */
export interface LigneConfiance {
  id: string; description: string; kind?: string; quantity?: number | null; unit?: string; unitPrice?: number | null; amount?: number | null;
  stockCategory?: string; sourceReference?: string; stockAction?: 'none' | 'new' | 'existing'; stockRef?: string;
}
export interface ContexteConfiance {
  /** Toutes les lignes de la pièce (les autres lignes de la même famille éclairent l'unité). */
  lignes: readonly LigneConfiance[];
  /** Le stock (l'article relié par `stockRef`, l'appariement d'une ligne non reliée). */
  articles?: readonly StockItem[];
  fournisseur?: string;
  /** Le total TTC imprimé : il corrobore (ou non) les montants des lignes. */
  total?: number | null;
  /** Les points de la lecture (recalculés au client si possible). */
  points?: readonly InvoicePoint[];
}

// ——— Ce qu'est une ligne ———
const HORS_STOCK: ReadonlySet<string> = new Set(['service', 'shipping', 'discount', 'other', 'maintenance', 'unknown']);
const kindDe = (kind: string | undefined): string => (kind === 'stock' || !kind ? 'ingredient' : kind);
const nombre = (n: unknown): number | undefined => (typeof n === 'number' && Number.isFinite(n) ? n : undefined);
const virgule = (n: number) => String(Math.round(n * 1e6) / 1e6).replace('.', ',');
const francs = (n: number) => n.toFixed(2).replace('.', ',');
const entier = (n: number) => Number.isInteger(n);

/** Le nom sans ce que la feuille d'un fournisseur ajoute en dessous (« Mischung : … », sous-lignes). */
const premierSegment = (nom: string): string => (nom ?? '').split(/\r?\n|Mischung\s*:/i)[0].trim();
/** Une unité écrite seule après une virgule en fin de nom : « Pilsner Malz, Kg », « Spécial, Gramm ». */
const UNITE_NUE = /,\s*(kg|kilo|kilos|gramm|gramme|grammes|gr|g|liter|litre|l)\s*[.:]?$/i;
/** Une mesure en fin de nom : « 250 g », « 460ml », « 0,5 Kg ». Le nombre qui suit « Typ », « Nr » est une identité, pas une taille. */
const MESURE_FIN = /(?:^|[\s,(])(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramm|mg|ml|cl|dl|l|liter|litre)\.?\s*\)?\s*$/i;
/** Un poids de sachet dans le nom : « 11,5g », « 10gr ». */
const POIDS_NOM = /(\d+(?:[.,]\d+)?)\s*(mg|g|gr|gramm)\b/i;
/** Un nombre de pièces dans le nom : « 100 Kapseln », « je 100 St », « 24-fach ». */
const PAQUET = /\b(\d{1,4})\s*(?:kapseln|kapsel|capsules?|st|stk|stück|stuck|pcs|pce|pieces|pièces|tabs|tabletten|beutel|bouchons)\b|\b(\d{1,3})\s*-?\s*fach\b/i;
/** Un tuyau : « Schlauch », « Silikonschlauch » (suffixe allemand), « tuyau », « hose », « tubo ». Un « Schlauchverbinder » n'en est pas un. */
const MOTS_TUYAU: ReadonlySet<string> = new Set(['tuyau', 'tuyaux', 'hose', 'hoses', 'tubo', 'tubi']);
const unTuyau = (jeton: string) => /schlauche?$/.test(jeton) || MOTS_TUYAU.has(jeton);
const nombreDe = (s: string) => Number(s.replace(',', '.'));
const enGrammes = (v: number, unite: string) => { const u = unite.toLowerCase(); return u === 'mg' ? v / 1000 : v; };
function mesureFinale(nom: string): { n: number; unite: string } | undefined {
  const segment = premierSegment(nom), m = MESURE_FIN.exec(segment);
  if (!m) return undefined;
  const avant = segment.slice(0, m.index + (m[0].length - m[0].trimStart().length)).trimEnd().toLowerCase();
  if (/(^|\s)(typ|type|nr|no|n°)\.?$/.test(avant)) return undefined;
  return { n: nombreDe(m[1]), unite: linkUnit(m[2]) };
}
const estTuyau = (nom: string) => jetons(nom).some(unTuyau);

interface Analyse { famille: FamilleCle; kind: string; q?: number; p?: number; a?: number; article?: StockItem; calcul: 'exact' | 'faux' | 'lot' | 'incomplet' }

const MEMO_FAMILLE = new WeakMap<object, { cle: string; famille: FamilleCle }>();
function familleDeLigne(l: LigneConfiance, c: ContexteConfiance): FamilleCle {
  const article = articleDe(l, c);
  const cle = [l.description, l.kind, l.stockCategory, article?.category, c.fournisseur].join('|');
  const memo = MEMO_FAMILLE.get(l);
  if (memo && memo.cle === cle) return memo.famille;
  const contexte = donneesDeLigne(ligneDeBrouillon({ description: l.description, unit: l.unit ?? '', quantity: nombre(l.quantity), kind: l.kind, stockCategory: l.stockCategory, sourceReference: l.sourceReference }, c.fournisseur)).contexte;
  const famille = familleDe({ nom: l.description, kind: l.kind, contexte, stockCategory: l.stockCategory, categorieArticle: article?.category });
  MEMO_FAMILLE.set(l, { cle, famille });
  return famille;
}
const articleDe = (l: LigneConfiance, c: ContexteConfiance): StockItem | undefined =>
  l.stockAction === 'existing' && l.stockRef ? c.articles?.find(a => a.ref === l.stockRef) : undefined;

/** q × p = montant, par la règle du serveur (`lineMathCheck`, sensible à l'unité : un prix par 100 g n'est pas un écart). */
function calculDe(l: LigneConfiance, unite: string): Analyse['calcul'] {
  const q = nombre(l.quantity), p = nombre(l.unitPrice), a = nombre(l.amount);
  if (q === undefined || p === undefined || a === undefined || toCents(a) === null) return 'incomplet';
  const r = lineMathCheck([{ id: l.id, name: l.description, kind: kindDe(l.kind), quantity: q, unit: unite, price: p, amountTTC: a }]);
  if (r.points.some(pt => pt.code === 'ligne-prix-par-lot')) return 'lot';
  if (r.points.length) return 'faux';
  return r.lines.checked ? 'exact' : 'incomplet';
}

function analyser(l: LigneConfiance, c: ContexteConfiance, unite = ''): Analyse {
  return { famille: familleDeLigne(l, c), kind: kindDe(l.kind), q: nombre(l.quantity), p: nombre(l.unitPrice), a: nombre(l.amount), article: articleDe(l, c), calcul: calculDe(l, unite) };
}

// ——— L'unité ———
type Brut = { niveau: Niveau; valeur?: string; raison: string; regle: string };
const brut = (niveau: Niveau, valeur: string | undefined, raison: string, regle: string): Brut => ({ niveau, valeur, raison, regle });
const grandeur = (u: string): string => (u === 'm' ? 'longueur' : Units.familyOf(linkUnit(u)));
const formule = (a: Analyse) => `${virgule(a.q!)} × ${a.p !== undefined ? virgule(a.p) : '?'}${a.a !== undefined ? ` = ${francs(a.a)}` : ''}`;

/** Les règles d'unité, dans l'ordre d'essai (PLAN.md, correspondance 2). Une ligne sans unité lisible, du stock ou du matériel, quantité > 0. */
function regles(l: LigneConfiance, a: Analyse, nom: string): Brut {
  const q = a.q!, p = a.p, exact = a.calcul === 'exact', famille = a.famille;
  const segment = premierSegment(nom);
  // 3. L'unité écrite dans le nom, nue, après une virgule : imprimée, avec le calcul comme seconde source.
  const nue = UNITE_NUE.exec(segment);
  if (nue) {
    const u = linkUnit(nue[1]);
    return exact ? brut('sur', u, `« ${u} » écrit dans le nom, ${formule(a)} tombe juste`, 'unite-dans-le-nom')
      : brut('repris', u, `« ${u} » écrit dans le nom, le calcul ${formule(a)} ne le confirme pas`, 'unite-dans-le-nom');
  }
  const poids = POIDS_NOM.exec(segment);
  const paquet = PAQUET.exec(segment);
  // 4 à 6. La levure se compte au sachet, une brique de plus de 50 g à la pièce.
  if (famille === 'levure') {
    if (poids && enGrammes(nombreDe(poids[1]), poids[2]) > SACHET_MAX_G) return brut('repris', 'Stk', `${poids[0]} : une brique, pas un sachet`, 'levure-brique');
    if (p !== undefined && entier(q) && p >= 2 && p <= 25) {
      return exact ? brut('sur', 'sachet', `levure à ${francs(p)} pièce, ${formule(a)} tombe juste : des sachets`, 'levure-sachet')
        : brut('repris', 'sachet', `levure à ${francs(p)} pièce : des sachets`, 'levure-sachet');
    }
    if (p !== undefined && p > 25) return brut('repris', 'Stk', `levure à ${francs(p)} pièce : une pièce plus grosse qu'un sachet`, 'levure-piece');
    return brut('repris', 'sachet', 'levure : au sachet', 'levure-sachet');
  }
  // 7. Un tuyau se vend au mètre, mais le métrage n'est pas imprimé.
  if (famille === 'materiel' && estTuyau(segment)) return brut('repris', 'm', `${virgule(q)} de tuyau : des mètres ?`, 'tuyau-metre');
  // 9. Un paquet dans le nom (100 capsules, 24-fach) : la ligne en compte 1, jamais son contenu.
  if (paquet && (famille === 'emballage' || famille === 'materiel' || entier(q))) return brut('repris', 'Stk', `« ${paquet[0]} » : un paquet, ${virgule(q)} pièce${q > 1 ? 's' : ''}`, 'paquet');
  // 8 et 10. Du matériel ou un emballage se compte à la pièce : un fermenteur ne se vend pas au kilo.
  if (famille === 'materiel' || famille === 'emballage') {
    if (!entier(q)) return brut('inconnu', undefined, `${virgule(q)} de ${famille === 'materiel' ? 'matériel' : 'emballage'} : quantité non entière, unité à préciser`, 'piece-non-entiere');
    return q === 1 || exact ? brut('sur', 'Stk', q === 1 ? `une ${famille === 'materiel' ? 'pièce de matériel' : 'pièce d\'emballage'} à 1` : `${formule(a)} tombe juste : des pièces`, 'piece-evidente')
      : brut('repris', 'Stk', `${virgule(q)} pièces de ${famille === 'materiel' ? 'matériel' : 'emballage'}`, 'piece-evidente');
  }
  // 11 et 12. Le houblon : au gramme quand le prix est de quelques centimes, sinon un paquet.
  if (famille === 'houblon') {
    if (p !== undefined && p > 0 && p <= 0.5 && entier(q) && q >= 5) return brut('repris', 'g', `${formule(a)} : des grammes`, 'houblon-gramme');
    if ((poids || (p !== undefined && p >= 2 && p <= 40)) && entier(q) && q <= 5) return brut('repris', 'Stk', `${poids ? poids[0] : 'paquet'} à ${p !== undefined ? francs(p) : '?'} : des paquets`, 'houblon-paquet');
    return brut('inconnu', undefined, `houblon ${formule(a)} : g ou paquet, rien ne le dit`, 'houblon-indecis');
  }
  // 13 et 14. Une mesure en fin de nom est une contenance : un pot de 460 ml est une pièce, un paquet de 1 kg vaut 1 kg.
  const mesure = mesureFinale(segment);
  if (mesure && entier(q)) {
    const poidsOuVolume = Units.familyOf(mesure.unite) !== 'piece';
    if (poidsOuVolume && Math.abs(mesure.n - 1) < 1e-9 && (mesure.unite === 'kg' || mesure.unite === 'l')) return brut('repris', mesure.unite, `« 1 ${shortUnit(mesure.unite)} » en fin de nom : le paquet vaut 1 ${shortUnit(mesure.unite)}`, 'mesure-un');
    return brut('repris', 'Stk', `« ${virgule(mesure.n)} ${shortUnit(mesure.unite)} » : la contenance, ${virgule(q)} pièce${q > 1 ? 's' : ''}`, 'mesure-contenance');
  }
  // 15 et 16. Un malt ou une céréale : au kilo (quelques francs), au gramme (quelques millimes).
  if (famille === 'malt' && p !== undefined) {
    if (p >= 0.8 && p <= 6) return brut('repris', 'kg', `malt à ${francs(p)} : au kilo`, 'malt-kilo');
    if (p >= 0.0008 && p <= 0.008 && entier(q) && q >= 50) return brut('repris', 'g', `${formule(a)} : des grammes`, 'malt-gramme');
    return brut('inconnu', undefined, `malt à ${virgule(p)} : kg ou g, rien ne le dit`, 'malt-indecis');
  }
  // 17. Le reste, entier et à plus de 50 centimes : une pièce.
  if (famille !== 'malt' && p !== undefined && p >= 0.5 && entier(q) && q <= 1000) return brut('repris', 'Stk', `${formule(a)} : des pièces`, 'piece-defaut');
  return brut('inconnu', undefined, `${formule(a)} : ni nom, ni prix, ni famille ne disent l'unité`, 'indecis');
}

/** Les unités que les AUTRES lignes de la même famille impriment, à un prix du même ordre. */
function voisines(l: LigneConfiance, famille: FamilleCle, c: ContexteConfiance): string[] {
  // « Autres » n'est pas une famille : ses lignes n'ont rien en commun, elles n'éclairent pas leurs voisines.
  if (famille === 'autres') return [];
  const p = nombre(l.unitPrice);
  const sorte: string[] = [];
  for (const o of c.lignes) {
    if (o === l || o.id === l.id || !isReadableUnit(o.unit)) continue;
    if (familleDeLigne(o, c) !== famille) continue;
    const po = nombre(o.unitPrice);
    if (p !== undefined && po !== undefined && p > 0 && po > 0 && Math.abs(Math.log10(p / po)) > 1) continue;
    sorte.push(linkUnit(o.unit!));
  }
  return sorte;
}

const SANS_ELEVATION = new Set(['paquet', 'mesure-contenance', 'mesure-un', 'tuyau-metre', 'levure-brique']);

/**
 * L'unité d'une ligne. Lisible dans `unit` (imprimée ou tapée) : `sur`, jamais réécrite. Sinon une déduction avec sa règle et son niveau ; sans indice, `inconnu`
 * (jamais une unité inventée). Les ajustements : un calcul q × p qui ne tombe pas juste plafonne à `repris` ; un article relié tenu dans une autre grandeur
 * plafonne à `repris` ; deux autres lignes de la famille qui impriment la même unité la confirment.
 */
export function deduireUnite(l: LigneConfiance, c: ContexteConfiance): ValeurUnite {
  const imprimee = (l.unit ?? '').trim();
  if (isReadableUnit(imprimee)) return { niveau: 'sur', valeur: shortUnit(imprimee), raison: 'unité imprimée', source: 'imprimee', regle: 'imprimee' };
  if (HORS_STOCK.has(kindDe(l.kind))) return { niveau: 'sur', raison: 'sans objet : ne passe pas en stock', source: 'aucune', regle: 'sans-objet' };
  const q = nombre(l.quantity);
  if (q === undefined || !(q > 0)) return { niveau: 'inconnu', raison: 'quantité absente : unité non déductible', source: 'aucune', regle: 'sans-quantite' };
  const a = analyser(l, c);
  let r = regles(l, a, l.description);
  // Un calcul qui ne tombe pas juste : plus rien n'est sûr.
  if (r.niveau === 'sur' && a.calcul !== 'exact' && !(r.regle === 'piece-evidente' && q === 1)) r = { ...r, niveau: 'repris', raison: `${r.raison} (le calcul ne tombe pas juste)` };
  // Sans règle : l'article relié tenu à la pièce, puis les autres lignes de la famille.
  if (r.niveau === 'inconnu') {
    const au = a.article?.unit;
    if (au && isReadableUnit(au) && grandeur(au) === 'piece' && entier(q)) r = brut('repris', shortUnit(au), `l'article relié se tient en ${shortUnit(au)}`, 'unite-de-l-article');
    else {
      const autres = voisines(l, a.famille, c);
      if (autres.length && autres.every(u => u === autres[0])) r = brut('repris', shortUnit(autres[0]), `les autres lignes de la famille sont en ${shortUnit(autres[0])}`, 'unite-des-voisines');
    }
  } else {
    // Un article relié tenu dans une autre grandeur que l'unité déduite : à contrôler (lactose d'1 kg comptée au paquet, tenue au kilo).
    const au = a.article?.unit;
    if (r.valeur && au && isReadableUnit(au) && grandeur(au) !== grandeur(r.valeur) && r.niveau === 'sur') r = { ...r, niveau: 'repris', raison: `${r.raison} ; l'article relié se tient en ${shortUnit(au)}` };
    else if (r.valeur && au && isReadableUnit(au) && grandeur(au) !== grandeur(r.valeur)) r = { ...r, raison: `${r.raison} ; l'article relié se tient en ${shortUnit(au)}` };
    // Deux autres lignes de la famille impriment la même unité que la déduction : seconde source.
    if (r.niveau === 'repris' && r.valeur && !SANS_ELEVATION.has(r.regle) && a.calcul !== 'faux' && a.calcul !== 'lot') {
      const autres = voisines(l, a.famille, c), mienne = linkUnit(r.valeur);
      if (autres.length >= 2 && autres.every(u => u === mienne) && !(a.article?.unit && grandeur(a.article.unit) !== grandeur(r.valeur))) r = { ...r, niveau: 'sur', raison: `${r.raison} ; ${autres.length} lignes de la famille impriment « ${shortUnit(mienne)} »` };
    }
  }
  return { niveau: r.niveau, ...(r.valeur !== undefined ? { valeur: r.valeur } : {}), raison: r.raison, source: r.valeur !== undefined ? 'deduite' : 'aucune', regle: r.regle };
}

// ——— Les points de lecture : le niveau du champ qu'ils visent ———
export type ChampLigne = 'unite' | 'quantite' | 'prix' | 'montant' | 'famille' | 'article';
export type ChampEntete = 'date' | 'fournisseur' | 'total' | 'tva' | 'numero' | 'lignes' | 'document';
export interface Cible { champ: ChampLigne | ChampEntete; niveau: Niveau; raison: string }
const CHAMP_DE_CELLULE: Record<string, ChampLigne> = { quantity: 'quantite', price: 'prix', amountTTC: 'montant', unit: 'unite', kind: 'famille', name: 'article' };
const cellules = (p: InvoicePoint): ChampLigne[] => [...new Set(p.champs.flatMap(c => { const m = /^items\.\d+\.(\w+)$/.exec(c); const champ = m ? CHAMP_DE_CELLULE[m[1]] : undefined; return champ ? [champ] : []; }))];
const CHAMP_ENTETE_DE: Record<string, ChampEntete> = {
  vendor: 'fournisseur', date: 'date', invoiceNumber: 'numero', orderNumber: 'numero', amountTTC: 'total', currency: 'total', amountHT: 'tva', tvaAmount: 'tva', tvaRate: 'tva', vat: 'tva',
  documentType: 'document', paymentEvidence: 'document', proForma: 'document', category: 'document', items: 'lignes',
};
/** Un écart de somme ou de TVA de quelques centimes est un arrondi (Rundung suisse, 5 centimes) : `repris` ; plus, `inconnu`. */
const niveauDEcart = (p: InvoicePoint): Niveau => (p.ecart !== null && Math.abs(p.ecart) <= 5 ? 'repris' : 'inconnu');
const phrase = (p: InvoicePoint) => `point de lecture : ${p.message.replace(/\s+/g, ' ').slice(0, 120)}`;

export interface ReglePoint { (p: InvoicePoint, corrobore: boolean): Cible[] }
const cible = (champ: Cible['champ'], niveau: Niveau, raison: string): Cible => ({ champ, niveau, raison });
/** La table « code de point → champ → niveau » de PLAN.md. Chaque code qui pèse y a une entrée : aucun point ne pèse sans niveau. */
export const TABLE_POINTS: Record<ScanPointCode, ReglePoint> = {
  'ligne-montant': (p, corrobore) => [cible('quantite', 'repris', 'quantité × prix ≠ montant'), cible('prix', 'repris', 'quantité × prix ≠ montant'),
    cible('montant', corrobore ? 'sur' : 'inconnu', corrobore ? 'quantité × prix ≠ montant, mais le total des lignes tombe juste' : 'quantité × prix ≠ montant, rien ne le tranche')],
  'ligne-prix-par-lot': () => [cible('prix', 'repris', 'prix probablement par 100 g ou par kg')],
  'unite-absente': () => [cible('unite', 'sur', 'remplacé par la déduction de l\'unité')],
  'alpha-libelle': () => [cible('article', 'repris', 'α lu ≠ α du libellé')],
  'nature-a-preciser': () => [cible('famille', 'repris', 'nature de la ligne à confirmer')],
  'ambiguite-ligne': () => [cible('article', 'repris', 'ligne signalée ambiguë par la lecture')],
  'forme-rejetee': p => {
    const cs = cellules(p);
    return cs.length ? cs.map(c => cible(c, 'inconnu', 'valeur rejetée à la mise en forme')) : [cible(CHAMP_ENTETE_DE[p.champ] ?? 'lignes', 'inconnu', 'valeur rejetée à la mise en forme')];
  },
  'lectures-divergentes': p => {
    const retenue = (p.valeurs ?? []).some(v => v.retenue && v.valeur !== null && v.valeur !== '');
    const niveau: Niveau = retenue ? 'repris' : 'inconnu';
    const raison = retenue ? 'deux lectures diffèrent' : 'les lectures diffèrent, aucune n\'est retenue';
    if (p.ligne !== null && p.ligne !== undefined) { const cs = cellules(p); if (cs.length) return cs.map(c => cible(c, niveau, raison)); }
    return [cible(CHAMP_ENTETE_DE[p.champ] ?? 'lignes', niveau, raison)];
  },
  'somme-ecart': p => [cible('total', niveauDEcart(p), 'les lignes ne font pas le total imprimé')],
  'somme-incomplete': () => [cible('total', 'repris', 'une ligne sans montant lisible')],
  'total-absent': () => [cible('total', 'inconnu', 'total absent')],
  'tva-incoherente': p => [cible('tva', niveauDEcart(p), 'la TVA imprimée ne se recoupe pas')],
  'ht-tva-ttc': p => [cible('tva', niveauDEcart(p), 'HT + TVA ≠ TTC')],
  'taux-tva-hors-plage': () => [cible('tva', 'inconnu', 'taux de TVA hors plage')],
  'date-absente': () => [cible('date', 'inconnu', 'date absente ou invalide')],
  'devise-non-chf': () => [cible('total', 'repris', 'montant dans une autre devise')],
  'lignes-perdues': () => [cible('lignes', 'inconnu', 'des lignes n\'ont pas été conservées')],
  'lignes-annoncees': () => [cible('lignes', 'repris', 'plus de lignes annoncées que transcrites')],
  'lignes-non-rapprochees': () => [cible('lignes', 'repris', 'des lignes n\'ont pas de vis-à-vis dans l\'autre lecture')],
  'lecture-coupee': () => [cible('lignes', 'repris', 'une lecture a été coupée')],
  'pro-forma-non-payee': () => [cible('document', 'repris', 'pro-forma sans paiement imprimé')],
  devis: () => [cible('document', 'repris', 'un devis')],
  'document-livraison': () => [cible('document', 'repris', 'bon de livraison')],
  avoir: () => [cible('document', 'repris', 'un avoir')],
  'type-deduit': () => [],
};
/** Les cibles d'un point (vide s'il ne pèse pas). `TABLE_POINTS` couvre tous les codes : testé contre `SCAN_POINT_CODES`. */
export function ciblesDuPoint(p: InvoicePoint, corrobore = false): Cible[] {
  if (!peserPoint(p)) return [];
  const regle = TABLE_POINTS[p.code];
  const cibles = regle ? regle(p, corrobore) : [cible('lignes', 'repris', 'code de point inconnu du module')];
  return cibles.map(x => (x.niveau === 'sur' ? x : { ...x, raison: `${x.raison} (${phrase(p)})` }));
}
export const CODES_SANS_NIVEAU = SCAN_POINT_CODES.filter(code => !(code in TABLE_POINTS));

const baisser = <T>(v: Valeur<T>, cibles: ReadonlyArray<Cible>): Valeur<T> => {
  let r = v;
  for (const x of cibles) if (RANG[x.niveau] > RANG[r.niveau]) r = { ...r, niveau: x.niveau, raison: x.raison };
  return r;
};

// ——— La ligne ———
export interface ConfianceLigne {
  unite: ValeurUnite; quantite: Valeur<number>; prix: Valeur<number>; montant: Valeur<number>; famille: Valeur<FamilleCle>; article: Valeur<string>;
  /** Le pire des six : le niveau de la rangée. */
  pire: Niveau;
}
const sansObjet = (): { niveau: Niveau; raison: string } => ({ niveau: 'sur', raison: 'sans objet : ne passe pas en stock' });

/** La somme des montants des lignes tombe sur le total imprimé : le total corrobore chaque montant (règle du serveur, `sumCheck`). */
export function totalCorrobore(c: ContexteConfiance): boolean {
  if (c.total === null || c.total === undefined) return false;
  return sumCheck(c.lignes.map(l => ({ amountTTC: nombre(l.amount) ?? null })), c.total, null, 0).sum.statut === 'ok';
}

export function confianceLigne(l: LigneConfiance, c: ContexteConfiance): ConfianceLigne {
  const kind = kindDe(l.kind), horsStock = HORS_STOCK.has(kind);
  const rang = ligneDepuisId(l.id) ?? (c.lignes.findIndex(x => x.id === l.id) + 1);
  const corrobore = totalCorrobore(c);
  const cibles = (c.points ?? []).filter(p => p.ligne === rang).flatMap(p => ciblesDuPoint(p, corrobore));
  const de = (champ: ChampLigne) => cibles.filter(x => x.champ === champ);

  const unite = ((): ValeurUnite => {
    const u = deduireUnite(l, c);
    // Une valeur imprimée ou tapée n'est pas baissée par un point de la lecture sur l'unité (le brasseur l'a sous les yeux) sauf désaccord des lectures.
    return baisser(u, de('unite').filter(x => !(u.source === 'imprimee' && x.raison.startsWith('remplacé')))) as ValeurUnite;
  })();
  const uniteMath = unite.valeur ?? l.unit ?? '';
  const calcul = calculDe(l, uniteMath);
  const q = nombre(l.quantity), p = nombre(l.unitPrice), a = nombre(l.amount);

  let quantite: Valeur<number> = q === undefined || !(q > 0)
    ? (horsStock ? { ...sansObjet() } : { niveau: 'inconnu', raison: 'quantité absente' })
    : { niveau: 'sur', valeur: q, raison: calcul === 'exact' ? `${formule({ q, p, a } as Analyse)} tombe juste` : 'quantité lue' };
  let prix: Valeur<number> = p === undefined ? (horsStock ? { ...sansObjet() } : { niveau: 'inconnu', raison: 'prix unitaire absent' }) : { niveau: 'sur', valeur: p, raison: 'prix lu' };
  let montant: Valeur<number> = a === undefined ? { niveau: 'inconnu', raison: 'montant absent' } : { niveau: 'sur', valeur: a, raison: calcul === 'exact' ? 'quantité × prix tombe juste' : 'montant lu' };
  if (calcul === 'faux') {
    quantite = baisser(quantite, [cible('quantite', 'repris', 'quantité × prix ≠ montant')]);
    prix = baisser(prix, [cible('prix', 'repris', 'quantité × prix ≠ montant')]);
    montant = baisser(montant, [cible('montant', corrobore ? 'sur' : 'inconnu', 'quantité × prix ≠ montant, rien ne le tranche')]);
    if (corrobore) montant = { ...montant, raison: 'quantité × prix ≠ montant, mais le total des lignes tombe juste' };
  } else if (calcul === 'lot') prix = baisser(prix, [cible('prix', 'repris', 'prix probablement par 100 g ou par kg')]);
  quantite = baisser(quantite, de('quantite')); prix = baisser(prix, de('prix')); montant = baisser(montant, de('montant'));

  const famille = familleDeLigne(l, c);
  let fam: Valeur<FamilleCle> = famille === 'autres' && !HORS_STOCK.has(kind) && kind !== 'discount'
    ? { niveau: 'repris', valeur: famille, raison: 'classée dans « Autres » : rien ne dit mieux' } : { niveau: 'sur', valeur: famille, raison: 'famille lue dans la ligne et ses mots' };
  fam = baisser(fam, de('famille'));

  const article = articleDe(l, c);
  let art: Valeur<string>;
  if (horsStock || (l.stockAction === 'none' && ['equipment', 'maintenance'].includes(kind))) art = { ...sansObjet() };
  else if (l.stockAction === 'existing') art = article ? { niveau: 'sur', valeur: article.name, raison: 'article relié' } : { niveau: 'inconnu', raison: 'article relié introuvable : à choisir' };
  else if (l.stockAction === 'new') art = { niveau: 'sur', raison: 'article neuf' };
  else {
    const regle = c.articles ? regleProduit(ligneDeBrouillon({ description: l.description, unit: l.unit ?? '', quantity: q, kind: l.kind, stockCategory: l.stockCategory, sourceReference: l.sourceReference }, c.fournisseur), c.articles) : undefined;
    art = regle && regle.cas === 'meme' ? { niveau: 'repris', valeur: regle.article.name, raison: `article proposé « ${regle.article.name} », pas encore relié` }
      : { niveau: 'repris', raison: 'aucun article choisi' };
  }
  art = baisser(art, de('article'));
  return { unite, quantite, prix, montant, famille: fam, article: art, pire: pireNiveau([unite, quantite, prix, montant, fam, art]) };
}

// ——— L'en-tête ———
export interface LectureConfiance { points?: readonly InvoicePoint[] }
export interface BrouillonEntete {
  date?: string; vendor?: string; invoiceNumber?: string; amount?: number; sourceVatAmount?: number; sourceNetAmount?: number;
  /** Les champs qu'il a tapés lui-même : jamais baissés par un point. */
  tapes?: ReadonlySet<ChampEntete>;
}
export interface ConfianceEntete {
  date: Valeur<string>; fournisseur: Valeur<string>; total: Valeur<number>; tva: Valeur<number>; numero: Valeur<string>; lignes: Valeur<number>; document: Valeur<string>; pire: Niveau;
}
const plein = (s: string | undefined) => (s ?? '').trim() !== '';

export function confianceEntete(lecture: LectureConfiance, brouillon: BrouillonEntete, lignes: readonly LigneConfiance[] = []): ConfianceEntete {
  const tapes = brouillon.tapes ?? new Set<ChampEntete>();
  const corrobore = brouillon.amount !== undefined && sumCheck(lignes.map(l => ({ amountTTC: nombre(l.amount) ?? null })), brouillon.amount, null, 0).sum.statut === 'ok';
  const cibles = (lecture.points ?? []).filter(p => p.ligne === null || p.ligne === undefined).flatMap(p => ciblesDuPoint(p, corrobore));
  const finir = <T>(champ: ChampEntete, v: Valeur<T>): Valeur<T> => (tapes.has(champ) && v.valeur !== undefined ? { ...v, niveau: 'sur', raison: 'tapé par lui' } : baisser(v, cibles.filter(x => x.champ === champ)));
  const absent = (raison: string, facultatif = false): Valeur<never> => ({ niveau: 'inconnu', raison, ...(facultatif ? { facultatif: true as const } : {}) });

  const date = finir('date', plein(brouillon.date) ? { niveau: 'sur', valeur: brouillon.date, raison: 'date lue' } : absent('date absente'));
  const fournisseur = finir('fournisseur', plein(brouillon.vendor) ? { niveau: 'sur', valeur: brouillon.vendor, raison: 'fournisseur lu' } : absent('fournisseur absent'));
  const total = finir('total', brouillon.amount !== undefined ? { niveau: 'sur', valeur: brouillon.amount, raison: corrobore ? 'somme des lignes = total imprimé' : 'total lu' } : absent('total absent'));
  const tva = finir('tva', brouillon.sourceVatAmount !== undefined ? { niveau: 'sur', valeur: brouillon.sourceVatAmount, raison: 'TVA lue' } : absent('TVA absente', true));
  const numero = finir('numero', plein(brouillon.invoiceNumber) ? { niveau: 'sur', valeur: brouillon.invoiceNumber, raison: 'numéro lu' } : absent('numéro absent', true));
  const lignesV = finir('lignes', { niveau: 'sur', valeur: lignes.length, raison: 'lignes lues' } as Valeur<number>);
  const document = finir('document', { niveau: 'sur', raison: 'nature de la pièce lue' } as Valeur<string>);
  // Une valeur absente et facultative (numéro, TVA) ne rougit pas la pièce : l'écran la dit, sans la compter.
  return { date, fournisseur, total, tva, numero, lignes: lignesV, document, pire: pireNiveau([date, fournisseur, total, tva, numero, lignesV, document].filter(v => !(v.facultatif && v.niveau === 'inconnu'))) };
}
