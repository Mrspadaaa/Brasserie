import { isReadableUnit } from '../../services/ingredientIdentity';
import { donneesDeLigne, linkUnit } from '../../services/stockLineMatching';
import { Units } from '../../services/units';
import { ligneDeBrouillon } from '../../domain/stock/articleNeuf';
import { prixCalcule } from './calculPlateau';

/**
 * DP-4 (10.11) : un houblon ou un malt se compte au poids (g, Kg). Une ligne « 1 pièce » ne dit pas combien pèse la pièce : sans ce poids, elle n'entre pas au stock
 * (« 0 → 1 pièce » pour un houblon compté en g faussait le stock et le calcul de la recette). Le poids se LIT sur le nom (« pellets 100 g ») ; jamais inventé, jamais 0.
 */
type LigneDePoids = { description: string; unit: string; quantity?: number; kind?: string; stockAction?: string; id?: string; amount?: number; unitPrice?: number; nameFr?: string; nomLu?: string };

export const estUnitePiece = (unit: string): boolean => isReadableUnit(unit) && Units.familyOf(linkUnit(unit)) === 'piece';

/* `readProductLabel` ne lit un poids de pièce que pour une levure : pour un houblon ou un malt, la seule mesure du libellé en g ou Kg (jamais deux, jamais « 10 x 100 g » : dans le doute, rien, comme `stockQuantityFor`). */
const MESURE_MASSE = /(\d+(?:[.,]\d+)?)\s*(mg|g|kg)(?![a-zà-ÿ])/giu;
const MULTIPLICATEUR = /\d\s*[x×]\s*\d|[x×]\s*\d+\s*$/iu;
const FACTEUR_G: Record<string, number> = { mg: 0.001, g: 1, kg: 1000 };

/** Le poids d'une pièce lu sur le libellé, en grammes (« Idaho 7 pellets 100 g » → 100), ou rien. */
export function poidsDePiece(ligne: LigneDePoids): { grammes: number; texte: string } | undefined {
  if (!estUnitePiece(ligne.unit)) return undefined;
  const label = ligne.description.normalize('NFC');
  const mesures = [...label.matchAll(MESURE_MASSE)];
  if (mesures.length !== 1 || MULTIPLICATEUR.test(label)) return undefined;
  const valeur = Number(mesures[0][1].replace(',', '.')), unite = mesures[0][2].toLowerCase();
  const grammes = valeur * FACTEUR_G[unite];
  return Number.isFinite(grammes) && grammes > 0 ? { grammes, texte: `${mesures[0][1]} ${unite === 'kg' ? 'Kg' : unite}` } : undefined;
}

/** Une ligne de houblon ou de malt, en pièce (ou sachet, Stk) et sans poids lu : l'unité du stock (g, Kg) est la seule qui compte. */
export function pieceSansPoids(ligne: LigneDePoids): boolean {
  if (!estUnitePiece(ligne.unit)) return false;
  const contexte = donneesDeLigne(ligneDeBrouillon({ description: ligne.description, unit: ligne.unit, quantity: ligne.quantity, kind: ligne.kind, nameFr: ligne.nameFr, nomLu: ligne.nomLu })).contexte;
  return (contexte === 'Houblon' || contexte === 'Malt') && poidsDePiece(ligne) === undefined;
}

/** « Confirmer » refuse un nouvel article de houblon ou de malt compté en pièce sans poids (un lien à un article existant est déjà jugé par `validatePurchase`). */
export function erreursPoidsManquant(lignes: readonly LigneDePoids[]): string[] {
  return lignes.filter(l => l.stockAction === 'new' && l.kind === 'ingredient' && l.description.trim() && pieceSansPoids(l))
    .map(l => `${l.description.trim()} : 1 pièce = ? g. Indique le poids de la pièce ou compte l’article en g ; rien n’entre en stock en pièce sans poids.`);
}

/** « Compter en g » : la quantité devient quantité × poids de la pièce, le montant imprimé reste, le prix unitaire se recalcule. */
export function compterEnGrammes(ligne: { quantity?: number; amount?: number; unitPrice?: number }, grammes: number): { unit: 'g'; quantity: number; unitPrice?: number } {
  const quantity = Math.round((ligne.quantity ?? 1) * grammes * 1e6) / 1e6;
  const unitPrice = ligne.amount !== undefined ? prixCalcule(ligne.amount, quantity) : ligne.unitPrice !== undefined && ligne.quantity ? ligne.unitPrice / grammes : undefined;
  return { unit: 'g', quantity, ...(unitPrice !== undefined ? { unitPrice } : {}) };
}
