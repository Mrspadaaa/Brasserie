/**
 * Le « + » de fin de courbe d'empâtage, joignable hors de la courbe (menu du « + » flottant : « Ajouter un palier », 16.11).
 * La courbe déclare sa fonction d'ajout tant qu'elle est montée ; le menu l'appelle : le même geste que le « + » dessiné,
 * jamais une recherche dans le DOM (le « + » est un élément SVG, pas un bouton : le menu fermait et rien ne se passait).
 */
let ajout: (() => void) | null = null;

/** La courbe montée déclare son ajout ; le retour la retire (seulement si elle est encore la dernière déclarée). */
export function declarerAjoutPalier(fonction: () => void): () => void {
  ajout = fonction;
  return () => { if (ajout === fonction) ajout = null; };
}

/** Ajoute un palier à la fin de la courbe montée. `false` : aucune courbe n'est montée (rien ne s'est passé). */
export function ajouterPalierDeFin(): boolean {
  if (!ajout) return false;
  ajout();
  return true;
}
