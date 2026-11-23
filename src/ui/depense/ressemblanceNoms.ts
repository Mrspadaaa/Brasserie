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

const motsDe = (v: unknown): string => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/**
 * LR1-5 (en-tête) et v3-3 (vision v3) : le fournisseur que la 3.8 lit autrement n'est pas une correction quand c'est le même nom : à la casse ou à quelques lettres près (ressemblance ≥ 0,9,
 * « Brau- und Rauchshop » / « BRAU- UND RAUCHSHOP »), ou le nom court contenu, en mots entiers, dans le nom long (« … Sàrl » / « … Sàrl - Médecins vétérinaires »). La valeur de la 3.8 est reprise sans barré ni compte.
 */
export function varianteDeFournisseur(avant: unknown, apres: unknown): boolean {
  const a = motsDe(avant), b = motsDe(apres);
  if (!a || !b) return false;
  if (ressemblanceNoms(a, b) >= SEUIL_VARIANTE_NOM) return true;
  const [court, long] = a.length <= b.length ? [a, b] : [b, a];
  return court.length >= 4 && ` ${long} `.includes(` ${court} `);
}
/**
 * doc2 (critique v5b, problème 2) : un désaccord de lecture sur le fournisseur dont toutes les valeurs sont le même nom (« Drs H. et I. Gauderon-Comment Sàrl »,
 * « Cabinet Vétérinaire Drs H. et I. … Sàrl », « Drs H. et I. … Sàrl - Médecins vétérinaires ») n'en est pas un : le nom le plus court est une variante de chacun des autres.
 */
export function variantesDUnMemeFournisseur(valeurs: readonly unknown[]): boolean {
  const noms = valeurs.map(v => String(v ?? '').trim()).filter(Boolean);
  if (noms.length < 2 || noms.length !== valeurs.length) return false;
  const court = [...noms].sort((a, b) => motsDe(a).length - motsDe(b).length)[0];
  return noms.every(n => n === court || varianteDeFournisseur(court, n));
}
