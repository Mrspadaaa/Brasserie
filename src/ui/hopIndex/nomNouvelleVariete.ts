/**
 * TE-51 : « Nouvelle variété » préremplit le nom de la fiche avec le texte cherché, sauf quand ce texte désigne déjà une variété du catalogue :
 * le même nom, un alias, ou le début d'un nom (« Nelson » pour « Nelson Sauvin »). Dans ces cas la fiche naîtrait avec un nom qui existe, ou presque :
 * le champ reste vide et la variété existante, déjà listée par la recherche, se voit d'abord.
 */
const nu = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[\s'’-]+/g, ' ').trim();

export function nomPourNouvelleVariete(recherche: string, varietes: ReadonlyArray<{ name: string; aliases?: readonly string[] }>): string {
  const demande = nu(recherche);
  if (!demande) return '';
  const proche = varietes.some((v) => [v.name, ...(v.aliases ?? [])].some((n) => {
    const nom = nu(n);
    // Le même nom, le début du nom, ou le début d'un de ses mots (au moins trois lettres : « sa » ne désigne personne).
    return nom === demande || (demande.length >= 3 && (nom.startsWith(demande) || nom.split(' ').some((m) => m.startsWith(demande))));
  }));
  return proche ? '' : recherche.trim();
}
