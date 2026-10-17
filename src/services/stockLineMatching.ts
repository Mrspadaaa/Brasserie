import { normalize } from './search';
import { Units } from './units';
import type { StockItem } from '../types';

/**
 * Lignes lues sur un justificatif → articles du stock.
 *
 * Remplace, pour la feuille d'achat, l'appariement de l'ancien scan (`QuickActionModal`, plus atteignable). Une
 * correspondance n'est qu'une proposition : la feuille la montre, le brasseur la garde ou la change, et rien n'entre
 * en stock avant « Confirmer et enregistrer ».
 */

/** Décision 117 (PR MVP) : la feuille ne propose plus d'article, B-V3-4 et B-V3-5 restant ouverts ; `true` les rétablit. */
export const STOCK_LINE_PROPOSALS_ENABLED = false;

/** Catégories de Stocks, dans l'ordre d'affichage : l'app les compare à l'identique (fiche, levure, brassage). */
export const STOCK_CATEGORIES = ['Malt', 'Houblon', 'Levure', 'Sucre', 'Additif', 'Emballage', 'CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent', 'Sols', 'EPI', 'Consommable'];
/** La lecture écrit souvent au pluriel, en minuscules ou en allemand (catalogues des malteries). */
const SYNONYMS = new Map(Object.entries({
  malts: 'Malt', malz: 'Malt', cereale: 'Malt', cereales: 'Malt',
  houblons: 'Houblon', hopfen: 'Houblon',
  levures: 'Levure', hefe: 'Levure',
  sucres: 'Sucre', additifs: 'Additif', emballages: 'Emballage', consommables: 'Consommable'
}));

/**
 * Catégorie de stock telle que l'app la compare : « malt » ➔ « Malt », « Hopfen » ➔ « Houblon ». Une catégorie
 * inconnue garde son texte, initiale en capitale. Sert à l'écriture et à la lecture des articles déjà écrits en
 * minuscules, sans les réécrire.
 */
export function canonicalStockCategory(value: string | undefined): string {
  const text = (value ?? '').trim();
  const key = normalize(text).replace(/\s+/g, ' ');
  if (!key) return text;
  return STOCK_CATEGORIES.find(category => normalize(category) === key) ?? SYNONYMS.get(key) ?? text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Mots retirés avant comparaison (liste fermée, ARB-M4) : catégorie, forme standard, unité seule, liaison, forme
 * juridique. Ils ne portent pas l'identité d'un article ; « Cascade » en feuilles et en pellets se confondent (assumé).
 */
const GENERIC = new Set([
  'malt', 'malts', 'malz', 'houblon', 'houblons', 'hopfen', 'hop', 'hops', 'levure', 'levures', 'hefe', 'yeast', 'sucre', 'sucres',
  'pellet', 'pellets', 't90', 'sachet', 'sachets', 'type',
  'kg', 'g', 'gr', 'mg', 'l', 'lt', 'ml', 'cl', 'dl', 'pce', 'pces', 'pcs', 'piece', 'pieces', 'stk', 'stuck', 'unite', 'unites',
  'de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'et', 'en', 'a', 'au', 'aux', 'von', 'aus', 'of', 'and',
  'sa', 'ag', 'gmbh', 'sarl', 'ltd', 'co'
]);
/** Unités de mesure reconnues après un nombre (« 25 kg ») ; les unités « à la pièce » n'en font pas partie. */
const MEASURE = new Set(['kg', 'g', 'mg', 'l', 'ml', 'cl', 'dl']);

/**
 * Jetons d'identité d'un libellé : minuscules sans accent, codes recollés (« S-04 » ➔ « s04 »), nombres gardés
 * (« 1056 », « 60 », « iii » distinguent deux produits), mots génériques retirés, suffixe -malz/-malt détaché
 * (« roggenmalz » ➔ « roggen »). Une quantité « nombre + unité » de la même famille (masse ou volume) que `unit` est
 * un conditionnement (« 25 kg » d'un article en kg) et s'efface ; sur une ligne à la pièce, rien ne s'efface, pas même
 * une unité seule (« Bouteilles 33 cl » ≠ « Bouteilles 50 cl », « Bouteilles 50 cl » ≠ « Bouteilles 50 l »). Sans
 * `unit` (nom de fournisseur), un « l' » reste une liaison.
 */
function tokens(text: string, unit?: string): string[] {
  const t = normalize(text).replace(/ß/g, 'ss').replace(/\b([a-z]{1,3})-(\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  const raw = t.match(/[a-z]+\d*|\d+(?:\.\d+)?/g) ?? [];
  const family = unit ? Units.familyOf(unit) : 'piece', keepUnits = !!unit && family === 'piece';
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const word = raw[i], next = raw[i + 1];
    if (/^\d/.test(word) && next && MEASURE.has(next) && family !== 'piece' && Units.familyOf(next) === family) { i++; continue; }
    if (GENERIC.has(word) && !(keepUnits && MEASURE.has(word))) continue;
    out.push(word.replace(/^(.{4,}?)(malz|malt)$/, '$1'));
  }
  return out;
}
const sameSet = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b); return A.size === B.size && [...A].every(w => B.has(w)); };

/** `vendor` : fournisseur du justificatif ; ses mots dans un nom d'article ne le rendent pas plus précis que la ligne. */
export interface StockLineInput { description: string; unit: string; quantity?: number; vendor?: string }

/**
 * Article du stock proposé pour une ligne lue, ou rien : seulement sur une correspondance sûre (ARB-M4).
 *
 * - mêmes jetons d'identité (ordre libre), ou même nom collé : « Cara Munich » = « Caramunich » ; une précision de la
 *   ligne absente de l'article, ou l'inverse, empêche la proposition (« Cascade Cryo » ≠ « Houblon Cascade ») ;
 * - les mots du fournisseur du justificatif ne comptent pas, ni dans la ligne ni dans le nom de l'article : « Houblon
 *   Cascade du Banc » chez la Malterie du Banc = « Cascade » ; ceux du fournisseur de l'article ne s'effacent que de son
 *   nom (décision 114) : « Cara Munich » ≠ « Malt Munich » d'un fournisseur « Cara … » ;
 * - unité de la ligne convertible dans celle de l'article : sinon la réception serait refusée ;
 * - un seul article doit correspondre ; sinon rien, et le brasseur choisit ou crée l'article.
 */
export function proposeStockItem(line: StockLineInput, items: StockItem[]): StockItem | undefined {
  if (!line.unit.trim() || !(Number(line.quantity) > 0)) return undefined;
  const vendorWords = new Set(tokens(line.vendor ?? ''));
  const L = tokens(line.description, line.unit).filter(w => !vendorWords.has(w));
  if (!L.length) return undefined;
  const matches = items.filter(item => {
    if (!Units.areCompatible(line.unit, item.unit)) return false;
    const supplierWords = new Set(tokens(item.supplier ?? ''));
    const I = tokens(item.name, item.unit).filter(w => !vendorWords.has(w) && !supplierWords.has(w));
    return sameSet(L, I) || L.join('') === I.join('');
  });
  return matches.length === 1 ? matches[0] : undefined;
}
