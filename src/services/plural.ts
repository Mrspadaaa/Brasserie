/**
 * Accord du pluriel en français.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE : `(s)` n'est pas du français.
 *
 * L'application affichait « 8 article(s) sous le seuil », « 1 tâche(s) à
 * faire », « 5 point(s) à suivre », « 1 pièce(s) avec une date à corriger ».
 * Sur un même écran de tableau de bord, quatre fois. C'est la signature d'un
 * texte que personne n'a écrit : la parenthèse repousse la décision d'accord
 * sur le lecteur, et dans la moitié des cas elle est FAUSSE — « 1 tâche(s) »
 * annonce un pluriel là où il n'y en a pas.
 *
 * La règle française tient en une ligne, et elle n'est pas celle de l'anglais :
 * **le singulier vaut jusqu'à 2 exclu.** On écrit « 0 article » et « 1 article »
 * au singulier, « 2 articles » au pluriel. Un nombre décimal suit la même règle :
 * « 1,5 litre » reste au singulier, « 2,5 litres » passe au pluriel.
 *
 * Voir `DESIGN.md`, section « Do's and Don'ts › Écriture ».
 */

/**
 * Le mot seul, accordé.
 *
 * @param n        La quantité qui commande l'accord.
 * @param singulier Le mot au singulier.
 * @param pluriel  Le pluriel, quand l'ajout d'un « s » ne suffit pas
 *                 (« bocal » → « bocaux », « travail » → « travaux »).
 */
export function accord(n: number, singulier: string, pluriel = `${singulier}s`): string {
  return Math.abs(n) >= 2 ? pluriel : singulier;
}

/**
 * Le nombre et son mot accordé : `compte(8, 'article')` → « 8 articles ».
 *
 * Le nombre passe par `toLocaleString('fr-CH')` : un millier s'écrit avec une
 * espace fine, jamais avec la virgule anglaise qui se confondrait avec la
 * virgule décimale du reste de l'application.
 */
export function compte(n: number, singulier: string, pluriel?: string): string {
  return `${n.toLocaleString('fr-CH')} ${accord(n, singulier, pluriel)}`;
}
