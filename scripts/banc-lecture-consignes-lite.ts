/**
 * Consigne propre à Flash-Lite pour le banc de lecture (voie k2-reglages, variante Lp, 01.11).
 *
 * Le banc seulement : ce module ne vit jamais dans `functions/`, la production n'en reçoit rien. Il ajoute aux deux consignes de
 * lecture de production (`INVOICE_SCAN_PROMPTS[0]` et `[1]`, importées, jamais copiées) un bloc de règles GÉNÉRIQUES de facture,
 * valables pour n'importe quel justificatif et non taillées sur les sept documents du banc (L20) : aucune valeur, aucun nom de
 * fournisseur, aucun montant. Le bloc ne dit que « où lire » et « quoi ne pas prendre pour ».
 *
 * Les règles viennent de la nature des défauts relevés par `RESULTAT-BANC.md` (noms de champs seulement : date, devise, prix de
 * ligne, nombre de lignes, nature de ligne, TVA), pas de ce que les documents impriment.
 */
import { INVOICE_SCAN_PROMPTS } from '../functions/src/invoiceScanPrompts';

export const LITE_RULES_TITLE = 'Règles de lecture d’une facture (valables pour tout justificatif) :';

/** Une règle = une phrase. Le test compte, borne la longueur et refuse tout chiffre. */
export const LITE_RULES: readonly string[] = [
  'Le montant d’une ligne est celui de la colonne du montant de la ligne (hors-taxe ou TTC, selon ce que le document imprime), pas le prix unitaire ni un sous-total.',
  'Un prix barré, un ancien prix ou une remise n’est pas le prix : lis le prix réellement facturé, et note une remise comme un montant négatif.',
  'Un prix unitaire non imprimé reste vide (null) : ne le calcule jamais en divisant un montant.',
  'Une période (« du … au … ») n’est pas la date de la facture : la date est celle d’émission du document ; si aucune date d’émission n’est imprimée, laisse-la vide.',
  'La devise est un code ISO à trois lettres en majuscules, jamais un symbole ni une abréviation.',
  'Chaque ligne imprimée donne une ligne lue, dans l’ordre du document : ne fusionne pas deux lignes, n’en saute aucune, n’en invente pas, et ne transforme pas un sous-total en article.',
  'Recopie les désignations, références et numéros tels qu’imprimés ; ne complète jamais une valeur absente.'
];

export const LITE_RULES_BLOCK: string = `${LITE_RULES_TITLE}\n${LITE_RULES.map(rule => `- ${rule}`).join('\n')}`;

/** Consigne de la lecture 1 ou 2 pour Flash-Lite (Lp) : celle de production, puis le bloc de règles. */
export function liteConsigne(lecture: 1 | 2): string {
  return `${INVOICE_SCAN_PROMPTS[lecture - 1]}\n\n${LITE_RULES_BLOCK}`;
}

/** Les deux consignes de Lp, dans l'ordre des lectures 1 et 2. */
export const LITE_CONSIGNES: readonly [string, string] = [liteConsigne(1), liteConsigne(2)];
