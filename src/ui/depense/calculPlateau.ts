// Les règles pures du plateau pu4d (D361) : le choix d'unité en un toucher (D350, D353 : la pièce toujours offerte) et le stock avant → après réception.
// Aucune écriture, aucun service : ce que le plateau montre est calculé ici sur le brouillon et le stock courants.
import { isPieceUnit, isReadableUnit, isSachetUnit } from '../../services/ingredientIdentity';
import { linkUnit, shortUnit } from '../../services/stockLineMatching';
import { stockQuantityFor, type PurchaseLineDraft } from '../../services/purchaseEntry';
import type { StockItem } from '../../types';

/** Ce que le segment d'unité propose : le mot affiché et la valeur écrite dans la ligne. */
export interface ChoixUnite { label: string; valeur: string; /** « le Kg », « l'un », « l'une » : le prix par unité de la case. */ le: string }
type CleUnite = 'kg' | 'g' | 'sachet' | 'piece' | 'l';
const TOUS: Record<CleUnite, ChoixUnite> = {
  kg: { label: 'Kg', valeur: 'kg', le: 'le Kg' }, g: { label: 'g', valeur: 'g', le: 'le g' }, sachet: { label: 'sachets', valeur: 'sachet', le: 'l’un' },
  piece: { label: 'pièce', valeur: 'pièce', le: 'l’une' }, l: { label: 'L', valeur: 'l', le: 'le L' },
};
/** Les cinq unités de la case « unité à remplir » (D353 : la pièce y est, et le sachet). */
export const CINQ_UNITES: readonly ChoixUnite[] = [TOUS.kg, TOUS.g, { ...TOUS.sachet, label: 'sachet' }, TOUS.piece, TOUS.l];

/** La clé commune d'une unité écrite de n'importe quelle façon (« Kg », « kilo », « Stk », « pièce », « sachets »). */
export const cleUnite = (unite: string): string => (isPieceUnit(unite) ? 'piece' : isSachetUnit(unite) ? 'sachet' : linkUnit(unite));

export type GenreUnite = 'malt' | 'houblon' | 'levure' | 'sucre' | 'materiel';
const PAR_GENRE: Record<GenreUnite, CleUnite[]> = {
  malt: ['kg', 'g', 'piece'], houblon: ['g', 'kg', 'piece'], levure: ['sachet', 'g', 'piece'], sucre: ['kg', 'g', 'piece'], materiel: ['piece', 'l'],
};
/** Le genre de la ligne pour son segment d'unité : la nature d'abord (matériel, nettoyant, emballage : pièce | L), puis ce que dit la lecture ou l'article. */
export function genreDeUnite(kind: PurchaseLineDraft['kind'], contexte: string | undefined, categorie: string | undefined): GenreUnite {
  if (kind !== 'ingredient') return 'materiel';
  const c = `${contexte ?? ''} ${categorie ?? ''}`.toLowerCase();
  return /houblon/.test(c) ? 'houblon' : /levure/.test(c) ? 'levure' : /sucre/.test(c) ? 'sucre' : 'malt';
}

/**
 * D350, D353 : le segment d'unité d'une ligne, deux ou trois unités plausibles, la pièce toujours offerte. Une unité lue hors de la liste (un « L » sur un malt) passe en tête,
 * suivie de la première du genre et de la pièce : jamais un menu, jamais une unité perdue.
 */
export function choixUnite(genre: GenreUnite, courante: string): ChoixUnite[] {
  const base = PAR_GENRE[genre].map(k => TOUS[k]);
  const cle = cleUnite(courante);
  if (!courante.trim() || !/[a-z]/i.test(courante) || base.some(c => cleUnite(c.valeur) === cle)) return base;
  const actuelle = TOUS[cle as CleUnite] ?? { label: shortUnit(courante), valeur: courante.trim(), le: `le ${shortUnit(courante)}` };
  return [actuelle, base[0], TOUS.piece].filter((c, i, tous) => tous.findIndex(x => cleUnite(x.valeur) === cleUnite(c.valeur)) === i);
}
/** Le mot d'une unité d'article au pluriel quand il faut (« sachet » → « sachets »), « Kg » et « L » en capitales comme la maquette. */
export function motUnite(unite: string, quantite?: number): string {
  const cle = cleUnite(unite);
  if (cle === 'kg') return 'Kg';
  if (cle === 'l') return 'L';
  if (cle === 'sachet') return quantite !== undefined && quantite <= 1 ? 'sachet' : 'sachets';
  return shortUnit(unite);
}
/** Le nombre en français, sans bruit flottant : 0,5 ; 1 250. */
export function nombreFr(n: number): string {
  const r = Math.round(n * 1e6) / 1e6;
  const [entier, decimales] = String(r).split('.');
  return entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (decimales ? `,${decimales}` : '');
}

export interface EffetStock { avant: number; apres: number; unite: string; texte: string }
/**
 * Le stock de l'article avant → après la réception : son stock courant, plus tout ce que les lignes du brouillon reliées à CET article y ajoutent (chaque ligne convertie
 * dans l'unité de l'article, comme l'enregistrement : `stockQuantityFor`). Rien si la ligne demandée n'est pas convertible (unité illisible ou incompatible) : l'inconnu n'est jamais 0.
 */
export function apresReception(lignes: readonly PurchaseLineDraft[], idLigne: string, article: StockItem, uniteDe: (l: PurchaseLineDraft) => string): EffetStock | undefined {
  let somme = 0, trouvee = false;
  for (const l of lignes) {
    if (l.stockAction !== 'existing' || l.stockRef !== article.ref || l.quantity === undefined) continue;
    const q = stockQuantityFor({ description: l.description, quantity: l.quantity, unit: uniteDe(l) }, article);
    if (!q.ok) { if (l.id === idLigne) return undefined; continue; }
    somme += q.quantity;
    if (l.id === idLigne) trouvee = true;
  }
  if (!trouvee) return undefined;
  const avant = article.currentStock, apres = Number((avant + somme).toPrecision(12));
  const unite = motUnite(article.unit, apres);
  return { avant, apres, unite, texte: `${nombreFr(avant)} → ${nombreFr(apres)} ${unite}` };
}

/** D369 : les nombres d'un toucher sous la quantité, selon l'unité (« pièces 1, 2, 3, 5, 10 » ; « grammes 1, 5, 10, 100 »). Kg et L : hypothèse du pilote, réversible. */
const NOMBRES: Record<CleUnite, readonly number[]> = { piece: [1, 2, 3, 5, 10], sachet: [1, 2, 3, 5, 10], g: [1, 5, 10, 100, 500], kg: [1, 5, 10, 25], l: [1, 5, 10, 20] };
/** L'unité de la ligne d'abord ; illisible, la première unité de son genre (matériel : pièce). */
export function nombresRapides(unite: string, genre: GenreUnite): readonly number[] {
  return NOMBRES[cleUnite(unite) as CleUnite] ?? NOMBRES[PAR_GENRE[genre][0]];
}

/**
 * B2 n° 6 : le prix qu'on calcule d'un montant et d'une quantité s'écrit à trois décimales au plus (« 3,333 », pas « 3,3333 ») quand q × prix retombe sur le même montant au centime ;
 * sinon (grande quantité, petit prix) il garde quatre décimales : jamais un prix qui ne rend plus le montant lu.
 */
export function prixCalcule(montant: number, quantite: number): number {
  const brut = montant / quantite, p3 = Math.round(brut * 1e3) / 1e3;
  return Math.round(quantite * p3 * 100) === Math.round(montant * 100) ? p3 : Math.round(brut * 1e4) / 1e4;
}

/** B2 n° 3 : le facteur d'une unité de masse à une autre (« Kg » → « g » : 1000), `undefined` hors masse (pièce, sachet, litre) : rien ne se convertit. */
const MASSE: Record<string, number> = { kg: 1000, g: 1 };
export function facteurMasse(de: string, vers: string): number | undefined {
  const a = MASSE[cleUnite(de)], b = MASSE[cleUnite(vers)];
  return a !== undefined && b !== undefined && a !== b ? a / b : undefined;
}
const arrondi6 = (n: number): number => Math.round(n * 1e6) / 1e6;
/** La ligne après un changement d'unité de masse : quantité × facteur, prix ÷ facteur, montant inchangé (2 Kg × 1,55 = 3,10 → 2 000 g × 0,00155 = 3,10). Kg → g → Kg rend les mêmes valeurs. */
export function convertirMasse(ligne: { quantity?: number; unitPrice?: number }, facteur: number): { quantity: number | undefined; unitPrice: number | undefined } {
  return { quantity: ligne.quantity === undefined ? undefined : arrondi6(ligne.quantity * facteur), unitPrice: ligne.unitPrice === undefined ? undefined : arrondi6(ligne.unitPrice / facteur) };
}
/** B2 n° 7 : la mouture rattachée suit son malt : même quantité et même unité (la règle de `millingParentIndex`) ; son prix unitaire reste (changement de quantité : le montant suit, D373) ou suit l'unité (masse : montant inchangé). */
export function moutureSuit(avant: { quantity?: number; unit: string }, apres: { quantity?: number; unit: string }, mouture: { quantity?: number; unitPrice?: number; amount?: number; unit: string }): Partial<{ quantity: number; unit: string; unitPrice: number; amount: number }> | undefined {
  if (apres.quantity === undefined || !(apres.quantity > 0)) return undefined;
  if (avant.quantity === apres.quantity && avant.unit === apres.unit) return undefined;
  const f = cleUnite(avant.unit) !== cleUnite(apres.unit) ? facteurMasse(avant.unit, apres.unit) : undefined;
  if (cleUnite(avant.unit) !== cleUnite(apres.unit) && f === undefined) return undefined;
  const prix = mouture.unitPrice === undefined ? undefined : f === undefined ? mouture.unitPrice : arrondi6(mouture.unitPrice / f);
  const montant = f !== undefined || prix === undefined ? mouture.amount : Math.round(apres.quantity * prix * 100) / 100;
  return { quantity: apres.quantity, unit: apres.unit, ...(prix !== undefined ? { unitPrice: prix } : {}), ...(montant !== undefined ? { amount: montant } : {}) };
}

export type ChampCalcul = 'quantity' | 'unitPrice' | 'amount';
type Calcul = Partial<Record<ChampCalcul, number>>;
/**
 * D369, D373 : `q × prix = montant`, dynamique. Le champ qui manque se calcule des deux autres ; quand les trois sont là (lus ou posés), celui que le brasseur n'a pas
 * touché suit : la quantité ou le prix modifiés recalculent le montant (« le total doit être calculé »), le montant modifié recalcule le prix, ou la quantité si le prix
 * vient d'être posé. `calcule` est le champ que ce calcul a déjà posé (il suit toujours) ; `dernier`, le champ que le brasseur a touché juste avant (il tient).
 * La quantité ne se déduit que si elle tombe juste (un entier, à 0,001 près). Rend le patch et le champ calculé après le geste.
 */
export function recalculer(ligne: Calcul, champ: ChampCalcul, valeur: number | undefined, calcule?: ChampCalcul, dernier?: ChampCalcul): { patch: Calcul & { [k in ChampCalcul]?: number | undefined }; calcule?: ChampCalcul } {
  const v: Calcul = { quantity: ligne.quantity, unitPrice: ligne.unitPrice, amount: ligne.amount, [champ]: valeur };
  const libre = calcule && calcule !== champ ? calcule : undefined;
  if (libre) v[libre] = undefined;
  const manque = (['quantity', 'unitPrice', 'amount'] as const).filter(c => c !== champ && v[c] === undefined);
  const cible: ChampCalcul | undefined = manque.length === 1 ? manque[0] : manque.length === 0 && valeur !== undefined ? suivant(champ, dernier) : undefined;
  const { quantity: q, unitPrice: p, amount: m } = v;
  let plus: Calcul = {};
  if (cible === 'unitPrice' && q !== undefined && q > 0 && m !== undefined) plus = { unitPrice: prixCalcule(m, q) };
  else if (cible === 'amount' && q !== undefined && p !== undefined) plus = { amount: Math.round(q * p * 100) / 100 };
  else if (cible === 'quantity' && m !== undefined && p !== undefined && p > 0) { const r = m / p, e = Math.round(r); if (e > 0 && Math.abs(r - e) < 1e-3) plus = { quantity: e }; }
  const pose = Object.keys(plus)[0] as ChampCalcul | undefined;
  return { patch: { [champ]: valeur, ...(libre ? { [libre]: undefined } : {}), ...plus }, calcule: pose };
}
/** D373 : les trois champs sont là ; celui qui suit le geste. Le montant d'abord, sauf quand c'est lui qu'on touche, ou qu'il vient d'être touché. */
const suivant = (champ: ChampCalcul, dernier?: ChampCalcul): ChampCalcul =>
  champ === 'amount' ? (dernier === 'unitPrice' ? 'quantity' : 'unitPrice') : dernier === 'amount' ? (champ === 'quantity' ? 'unitPrice' : 'quantity') : 'amount';

/** D371 : l'unité lue ou choisie ne s'ajoute pas à l'article relié (« pièce » face à un houblon compté en g) ; « Confirmer » le refuserait. Rien tant qu'une des deux unités est illisible. */
export function uniteHorsArticle(ligne: { description: string; quantity?: number; unit: string }, article: { name: string; unit: string; category?: string }): boolean {
  if (!isReadableUnit(ligne.unit) || !isReadableUnit(article.unit)) return false;
  return !stockQuantityFor({ description: ligne.description, quantity: ligne.quantity !== undefined && ligne.quantity > 0 ? ligne.quantity : 1, unit: ligne.unit }, article).ok;
}
