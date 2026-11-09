// La TVA que la lecture donne à l'écran Dépense.
//
// Une facture à plusieurs taux (doc2, vétérinaire : 0,50 à 2,6 % + 56,11 à 8,1 %) n'imprime souvent aucun total de TVA en toutes lettres : la lecture rend `tvaAmount: null`
// et le bloc `vat`, un montant par taux. Le serveur recoupe ce total depuis LP-2 pour le final à plusieurs lectures ; l'écran reste le dernier garde-fou pour une lecture seule, le
// provisoire, un résultat en cache ou d'un serveur d'avant LP-2. Rien n'est inventé : la somme ne porte que sur des montants imprimés, tous lus ; sinon la TVA reste inconnue (jamais 0).
import type { ScannedInvoiceResult } from '../../services/geminiScanner';

export interface TvaParTaux { rate: number | null; amount: number }
export interface TvaImprimee {
  /** Le montant de TVA, en francs. */
  montant: number;
  /** `total` : le total de TVA lu tel quel ; `bloc` : la somme des montants du bloc imprimé par taux. */
  source: 'total' | 'bloc';
  /** Le bloc lu, un montant par taux, du plus bas taux au plus haut ; vide quand la lecture n'en donne pas. */
  taux: TvaParTaux[];
}

const centimes = (valeur: unknown): number | null => (typeof valeur === 'number' && Number.isFinite(valeur) ? Math.round(valeur * 100) : null);

type RangeeVat = NonNullable<ScannedInvoiceResult['vat']>[number];
/**
 * RF-14 : le modèle range parfois dans le bloc une ligne « Total TVA » (taux inconnu) en plus des rangées par taux. Une rangée sans taux dont le montant égale, au centime, la somme
 * des AUTRES rangées (au moins deux, toutes lues) est ce total : elle n'est ni additionnée une seconde fois ni montrée comme un taux.
 */
export function sansTotalDuBloc(rangees: readonly RangeeVat[]): RangeeVat[] {
  if (rangees.length < 3 || rangees.some(r => centimes(r.amount) === null)) return [...rangees];
  const somme = rangees.reduce((s, r) => s + centimes(r.amount)!, 0);
  const total = rangees.findIndex(r => !(typeof r.rate === 'number' && Number.isFinite(r.rate)) && centimes(r.amount)! * 2 === somme);
  return total < 0 ? [...rangees] : rangees.filter((_, i) => i !== total);
}

/** Les rangées du bloc de TVA dont le montant est lu, du plus bas taux au plus haut (taux inconnu en dernier). */
export function tauxLus(result: Pick<ScannedInvoiceResult, 'vat'> | undefined): TvaParTaux[] {
  return sansTotalDuBloc(result?.vat ?? []).filter(row => centimes(row.amount) !== null).map(row => ({ rate: typeof row.rate === 'number' && Number.isFinite(row.rate) ? row.rate : null, amount: row.amount as number }))
    .sort((a, b) => (a.rate ?? Infinity) - (b.rate ?? Infinity));
}

/**
 * Le montant de TVA que la lecture permet de poser, ou `undefined` (la tuile garde « — »).
 * 1. Un total de TVA lu est posé tel quel.
 * 2. Sinon, la somme du bloc imprimé par taux, seulement si CHAQUE rangée a son montant lu, si le contrôle serveur n'y voit pas d'écart avec le document
 *    et si la somme ne dépasse pas le total TTC lu.
 */
export function tvaImprimee(result: Pick<ScannedInvoiceResult, 'tvaAmount' | 'vat' | 'amountTTC' | 'controls'> | undefined): TvaImprimee | undefined {
  if (!result) return undefined;
  const taux = tauxLus(result);
  if (typeof result.tvaAmount === 'number' && Number.isFinite(result.tvaAmount)) return { montant: result.tvaAmount, source: 'total', taux };
  const rangees = sansTotalDuBloc(result.vat ?? []);
  if (!rangees.length || rangees.some(row => centimes(row.amount) === null)) return undefined;
  if (result.controls?.vat?.statut === 'ecart') return undefined;
  const somme = rangees.reduce((s, row) => s + centimes(row.amount)!, 0), ttc = centimes(result.amountTTC);
  if (ttc !== null && somme > ttc) return undefined;
  return { montant: somme / 100, source: 'bloc', taux };
}
