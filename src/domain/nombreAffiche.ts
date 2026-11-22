/**
 * Le nombre à afficher, à la virgule suisse (TE-23, BR-71) : « 25,8 L », jamais « 25.8 L ».
 *
 * Module sans dépendance : tout écran, tout message du domaine et tout service peut l'importer sans cycle.
 * `domain/stock/regles.ts` le réexporte sous le même nom (la fiche recette, RL-1, l'utilise déjà ainsi).
 * Contrôle : `scripts/agents/controle-virgule.mjs` refuse un `{valeur} L` qui ne passe par aucun formateur à virgule.
 *
 * Ne change aucune valeur : il arrondit à `decimales` pour l'affichage et supprime les zéros inutiles (« 12,5 », pas « 12,50 »).
 * Une valeur inconnue (null, undefined, NaN) donne '' et jamais « 0 » : l'appelant écrit « — » ou « inconnu » lui-même.
 */
export function nombreFr(valeur: number | null | undefined, decimales = 2): string {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return '';
  const f = 10 ** decimales;
  const arrondi = Math.round(valeur * f) / f;
  // -0 s'écrit « 0 », jamais « -0 ».
  return String(Object.is(arrondi, -0) ? 0 : arrondi).replace('.', ',');
}
