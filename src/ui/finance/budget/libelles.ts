/**
 * u2, constat 24 (jeu en ligne du 16.11) : « Prix de4 ingrédients » (l'espace manquait après « de ») ; le nombre reste un nombre, le mot suit l'accord (« 1 ingrédient », « 4 ingrédients »).
 * Les deux premiers noms sont dits, « … » annonce le reste.
 */
export const titrePrixManquant = (n: number, noms: string[]): string =>
  `Prix de ${n} ingrédient${n > 1 ? 's' : ''}${noms.length ? ` : ${noms.slice(0, 2).join(', ')}${noms.length > 2 ? '…' : ''}` : ''}`;
