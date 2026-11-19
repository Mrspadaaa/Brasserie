/**
 * La ressemblance de deux noms lus : 1 − (distance de Levenshtein / longueur du plus long), sur le texte sans accents ni ponctuation ; 0 si l'un est vide.
 * Problème d'école : distance d'édition normalisée. C'est la MÊME mesure que le serveur (`ressemblance`, functions/src/invoiceScanVote.ts), qui rapproche les lignes
 * du provisoire et de la 3.8 ; le module serveur tire node:crypto et node:fs, donc l'app ne peut pas l'importer. Copie gardée égale par
 * tests/unit/depense/f1-tour3-b.test.ts (les deux fonctions comparées sur les mêmes paires).
 */
const texteDeNom = (v: unknown): string => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function ressemblanceNoms(a: unknown, b: unknown): number {
  const x = texteDeNom(a), y = texteDeNom(b);
  if (!x || !y) return 0;
  let precedente = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const courante = [i];
    for (let j = 1; j <= y.length; j++) courante[j] = Math.min(precedente[j] + 1, courante[j - 1] + 1, precedente[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    precedente = courante;
  }
  return 1 - precedente[y.length] / Math.max(x.length, y.length);
}

/**
 * LR1-5, LR3-3 (voie r, DÉCISION 1) : au-dessus de ce seuil, deux noms sont la même désignation lue autrement (O / Q / 0, un point pour une virgule) :
 * la 3.8 ne « corrige » rien. Le rejeu des 12 tirages du doc25 (voie r, 19.11) montre ces variantes à 94-95 % ; un vrai changement de nom est bien plus bas.
 */
export const SEUIL_VARIANTE_NOM = 0.9;
