// Les règles pures du plateau pu4d (D361) : le choix d'unité en un toucher (D350, D353 : la pièce toujours offerte) et le stock avant → après réception.
// Aucune écriture, aucun service : ce que le plateau montre est calculé ici sur le brouillon et le stock courants.
import { isPieceUnit, isSachetUnit } from '../../services/ingredientIdentity';
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
