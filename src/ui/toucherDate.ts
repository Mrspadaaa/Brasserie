/**
 * E35-14 (23.11) : toucher la piste d'une frise au jour pose la date là où l'on touche.
 * La piste d'un `DureeFenetre` jour donne, dans ses attributs, le bord gauche de la case du jour posé (`data-x-debut`) et la largeur d'un jour
 * (`data-px-jour`) ; la case touchée est celle qui contient `x` (px depuis le bord gauche de la piste). Pure : aucun DOM.
 */
const MS_JOUR = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** `debut` + n jours (AAAA-MM-JJ), à midi UTC : jamais décalé par l'heure d'été. */
export const jourPlusN = (iso: string, n: number): string => new Date(Date.parse(`${iso}T12:00:00Z`) + n * MS_JOUR).toISOString().slice(0, 10);

/** Le jour de la case touchée en `x`, ou `null` si la frise n'a pas dit ses mesures (largeur d'un jour nulle ou illisible : aucun jour n'est inventé). */
export function jourTouche(debut: string, x: number, xDebut: number, pxJour: number): string | null {
  if (!ISO.test(debut) || !Number.isFinite(x) || !Number.isFinite(xDebut) || !(pxJour > 0)) return null;
  return jourPlusN(debut, Math.floor((x - xDebut) / pxJour));
}
