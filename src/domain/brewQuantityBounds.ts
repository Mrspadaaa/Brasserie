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

/**
 * RL-10 : une quantité réelle tapée s'arrondit à la précision de son unité (« 1,23456 g » n'existe pas sur une balance de brasserie) :
 * 0,01 pour g, mL et L ; 0,001 pour kg. Une valeur négative ou illisible passe telle quelle (elle est refusée plus loin, avec son message).
 */
export function actualQuantityRounded(value: number, unit: string): number {
  if (!Number.isFinite(value) || value < 0) return value;
  const facteur = unit === 'kg' ? 1000 : 100;
  return Math.round(value * facteur) / facteur;
}

/**
 * `null` quand la quantité est plausible, sinon la phrase qui dit pourquoi elle ne s'enregistre pas.
 * `kept` : la valeur que l'écran garde vraiment (VI-9). La phrase la nomme (« La valeur précédente (2 g) est conservée ») ;
 * l'appelant qui l'annonce doit la rétablir, sinon le message contredit la ligne.
 */
export function actualQuantityProblem(value: number, planned: number, unit: string, kept?: number): string | null {
  const shown = String(Math.round(value * 1000) / 1000).replace('.', ',');
  if (!Number.isFinite(value)) return 'Quantité illisible : tape un nombre.';
  const conservee = kept !== undefined && Number.isFinite(kept)
    ? `La valeur précédente (${String(Math.round(kept * 1000) / 1000).replace('.', ',')} ${unit}) est conservée.`
    : 'La valeur précédente est conservée.';
  if (value < 0) return `${shown} ${unit} : une quantité ne peut pas être négative. ${conservee}`;
  const max = actualQuantityMax(planned, unit);
  if (value > max)
    return `${shown} ${unit} : au-delà de ${String(Math.round(max * 10) / 10).replace('.', ',')} ${unit}, c’est une erreur de saisie probable (unité confondue ?). ${conservee}`;
  return null;
}
