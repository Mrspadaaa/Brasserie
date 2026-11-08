/**
 * Bornes d'une quantité réelle d'ingrédient au jour de brassage (BR-50, BE-31, BR-53, BE-34, 08.11 : « 99999 g de chlorure de potassium »,
 * « 99 999 L d'eau de rinçage pour 30 L », −1 refusé sans un mot).
 *
 * Estimée, faute de source : le réel s'écarte du prévu de quelques pour cent ; au-delà de cinq fois le prévu (et d'un plancher par unité, pour qu'une
 * recette à 3 g de sel n'interdise pas 20 g), c'est une faute de frappe ou une unité confondue, pas un écart de brassage.
 * Le plancher est le plus grand volume ou poids plausible pour une micro-brasserie d'un hectolitre au plus.
 */

const PLANCHER: Record<string, number> = { kg: 50, g: 500, mL: 500, L: 200 };
const PLANCHER_AUTRE = 50;
export const FACTEUR_MAX_SUR_PREVU = 5;

export function actualQuantityMax(planned: number, unit: string): number {
  const floor = PLANCHER[unit] ?? PLANCHER_AUTRE;
  const p = Number.isFinite(planned) && planned > 0 ? planned : 0;
  return Math.max(floor, p * FACTEUR_MAX_SUR_PREVU);
}

/** `null` quand la quantité est plausible, sinon la phrase qui dit pourquoi elle ne s'enregistre pas. */
export function actualQuantityProblem(value: number, planned: number, unit: string): string | null {
  const shown = String(Math.round(value * 1000) / 1000).replace('.', ',');
  if (!Number.isFinite(value)) return 'Quantité illisible : tape un nombre.';
  if (value < 0) return `${shown} ${unit} : une quantité ne peut pas être négative. La valeur précédente est conservée.`;
  const max = actualQuantityMax(planned, unit);
  if (value > max)
    return `${shown} ${unit} : au-delà de ${String(Math.round(max * 10) / 10).replace('.', ',')} ${unit}, c’est une erreur de saisie probable (unité confondue ?). La valeur précédente est conservée.`;
  return null;
}
