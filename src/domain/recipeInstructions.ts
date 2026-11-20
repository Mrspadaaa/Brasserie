/**
 * Le Déroulé tel que la fiche l'écrit : le texte enregistré, sans le marqueur « FIN DE RECETTE » que l'export texte pose et que l'import
 * a parfois laissé dans la donnée (test en ligne k2, 20.11), ni les lignes vides de la fin. Rien d'autre n'est touché : le texte du
 * brasseur garde ses sauts de ligne. Une recette qui ne contenait que le marqueur n'a pas de Déroulé (chaîne vide).
 */
export function instructionsAffichees(texte: string | undefined | null): string {
  const lignes = (texte ?? '').split(/\r?\n/);
  const vide = (l: string | undefined) => l !== undefined && l.trim() === '';
  const marqueur = (l: string | undefined) => l !== undefined && /^\s*fin de recette\s*$/i.test(l);
  while (lignes.length && (vide(lignes[lignes.length - 1]) || marqueur(lignes[lignes.length - 1]))) lignes.pop();
  return lignes.join('\n');
}
