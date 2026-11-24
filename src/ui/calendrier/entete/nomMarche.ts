/**
 * R20 (C54-1, 24.11) : UNE fonction nomme une marche de courbe. Deux paiements du même jour sont une marche : « <nom> + 1 autre », le nom de
 * l'écriture la plus lourde, jamais « 2 mouvements » ni « 2 sorties » sans nom (le brasseur lit quoi, pas combien). L'en-tête du Calendrier
 * (`placerNoms`), Finances › Prévisions (`texteLot`, `texteLotCourt`) et Analyse › Caisse (`lotsDuJour`) la partagent : le même nom aux trois endroits.
 * Pure : aucune dépendance à React ni au navigateur.
 */

/** « + 1 autre », « + 2 autres » : la suite du nom d'une marche de plusieurs écritures. */
export const suiteDeMarche = (autres: number): string => `+ ${autres} autre${autres > 1 ? 's' : ''}`;

/** Le nom entier d'une marche : « ZZ TEST — achat rond + 1 autre ». `autres` : le nombre d'autres écritures de la marche (au moins 1). */
export const nomDeMarche = (tete: string, autres: number): string => (autres > 0 ? `${tete} ${suiteDeMarche(autres)}` : tete);

/** Le nom de l'écriture sans son préfixe de saisie (« ZZ TEST — achat rond » → « achat rond ») ni sa part (« Brouwland · malt » → « Brouwland »). */
export function coeurDuNom(nom: string): string {
  const tiret = nom.split(/\s[—–]\s/);
  const apres = tiret.length > 1 && tiret[tiret.length - 1].trim() ? tiret[tiret.length - 1] : nom;
  const k = apres.indexOf(' · ');
  return (k > 3 ? apres.slice(0, k) : apres).trim();
}

/** Le premier mot qui dit quelque chose (au moins 3 lettres), au plus 13 signes : « Pompe de transfert » → « Pompe ». */
export function premierMot(nom: string): string {
  const mots = coeurDuNom(nom).split(/[\s'’]+/).filter(Boolean);
  const mot = mots.find(m => m.length > 2) ?? mots[0] ?? nom;
  return [...mot].length > 13 ? `${[...mot].slice(0, 12).join('')}…` : mot;
}

/**
 * Les formes d'un nom de marche, de la plus complète à la plus courte ; TOUTES nomment l'écriture la plus lourde (jamais le seul nombre) :
 * le nom entier + « + N autre(s) », son cœur sans préfixe, le cœur avec « +N », le premier mot avec « +N ». L'appelant prend la première qui tient.
 */
export function formesDeMarche(tete: string, autres: number): string[] {
  if (autres <= 0) return [tete];
  const coeur = coeurDuNom(tete), mot = premierMot(tete);
  const formes = [nomDeMarche(tete, autres), nomDeMarche(coeur, autres), `${coeur} +${autres}`, `${mot} +${autres}`];
  return formes.filter((f, i) => f && formes.indexOf(f) === i);
}

/** La forme courte, pour une bulle qui n'a pas de place : le cœur du nom si court (18 signes au plus), sinon son premier mot, avec « +N ». */
export function formeCourteDeMarche(tete: string, autres: number): string {
  if (autres <= 0) return tete;
  const coeur = coeurDuNom(tete);
  return `${[...coeur].length <= 18 ? coeur : premierMot(tete)} +${autres}`;
}
