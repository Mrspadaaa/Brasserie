/**
 * C46-3 : l'avis d'un geste fait au Carnet (« achat prévu posé · −500 CHF · Annuler ») se dit une seule fois, à l'arrivée sur le Calendrier.
 * Le saut (`viser`) reste gardé par l'App : le Calendrier remonté au retour du Carnet le relisait et redisait l'avis avec le montant d'avant
 * (un choix à 79,95 CHF entre-temps), et son Annuler défaisait un état dépassé. Un geste = l'instant `at` de son saut.
 */
const dits = new Set<number>();

/** `true` la première fois qu'on la pose pour ce geste, `false` ensuite (l'avis est déjà passé). */
export function avisADire(at: number): boolean {
  if (dits.has(at)) return false;
  dits.add(at);
  return true;
}
