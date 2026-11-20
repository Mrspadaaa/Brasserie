/**
 * Tour 3, f13 tour 2 (critique n° 4, g5:v04-4 « Embouteillage ») : le titre d'un carnet s'affiche avec sa majuscule initiale. Affichage
 * seulement : le titre stocké reste tel qu'il a été écrit (la phrase citée « « embouteillage » · votre phrase en titre » aussi).
 */
export function titreAffiche(titre: string): string {
  const premier = titre.charAt(0);
  const haut = premier.toLocaleUpperCase('fr-CH');
  return haut === premier ? titre : `${haut}${titre.slice(1)}`;
}
