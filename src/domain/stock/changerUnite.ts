import type { StockItem } from '../../types';
import { Units } from '../../services/units';

/**
 * AM n° 8 : l'unité de gestion d'un article est fixe dès qu'il porte un stock, un seuil ou un maximum (ou qu'un brassin le réserve).
 * La changer convertit les trois quantités dans la même famille d'unités (kg → g : 25 kg valent 25 000 g, pas 25 g) ;
 * d'une famille à l'autre (kg → sachet, kg → L), la conversion n'a pas de sens : le changement est refusé et le motif se dit à l'écran.
 * Un article sans stock, sans seuil, sans maximum et sans brassin garde le libre choix de son unité.
 */
export type ChangementUnite =
  | { ok: true; item: StockItem; /** Phrase pour l'écran quand les quantités ont été converties ; vide sinon. */ note: string }
  | { ok: false; refus: string };

/** 6 décimales : 0,4 g en kg reste 0,0004, jamais arrondi à 0. */
const arrondi = (n: number): number => Math.round(n * 1e6) / 1e6;
const nombre = (n: number): string => String(arrondi(n)).replace('.', ',');

export function changerUniteArticle(item: StockItem, nouvelleUnite: string, reserve: boolean): ChangementUnite {
  const cible = nouvelleUnite.trim();
  if (!cible) return { ok: true, item, note: '' };
  const facteur = item.unit.trim() ? Units.convert(1, item.unit, cible) : null;
  // Même unité (casse, alias) : rien à convertir.
  if (facteur === 1) return { ok: true, item: { ...item, unit: cible }, note: '' };
  const vide = !(item.currentStock > 0) && !(item.minStock > 0) && !(item.maxStock && item.maxStock > 0) && !reserve;
  // RF-6 : le prix par unité suit l'unité (1,20 CHF/kg = 0,0012 CHF/g) ; entre familles il n'a plus de sens : il redevient inconnu, jamais 0.
  const prix = (): Partial<StockItem> => {
    const { pricePerUnit: ancien, ...reste } = item;
    return { ...reste, unit: cible, ...(ancien !== undefined && facteur !== null ? { pricePerUnit: Math.round((ancien / facteur) * 1e10) / 1e10 } : {}) } as Partial<StockItem>;
  };
  if (vide) return { ok: true, item: prix() as StockItem, note: '' };
  if (facteur === null) {
    return { ok: false, refus: `Impossible de passer de ${item.unit || 'sans unité'} à ${cible} : ce ne sont pas de la même famille d’unités, le stock (${nombre(item.currentStock)} ${item.unit}), le seuil et le maximum ne peuvent pas être convertis. Corrige le stock par un inventaire, ou crée un autre article.` };
  }
  const convertir = (valeur: number): number => arrondi(valeur * facteur);
  const converti: StockItem = { ...(prix() as StockItem), unit: cible, currentStock: convertir(item.currentStock), minStock: convertir(item.minStock),
    ...(item.maxStock !== undefined ? { maxStock: convertir(item.maxStock) } : {}) };
  return { ok: true, item: converti, note: `Stock converti : ${nombre(item.currentStock)} ${item.unit} = ${nombre(converti.currentStock)} ${cible} (seuil et maximum aussi).` };
}
