/**
 * t3 (problème 7) : la croix × d'une feuille reçoit le focus à l'ouverture (Vaul). Son anneau de focus ne se montre qu'à la main au clavier :
 * `data-clavier` est posé à la première touche pressée et retiré au premier toucher ou clic. Sans lui, la feuille s'ouvre avec une croix simple (maquettes).
 */
let installe = false;
export function installerModeClavier(): void {
  if (installe || typeof document === 'undefined') return;
  installe = true;
  const racine = document.documentElement;
  racine.dataset.clavierSuivi = '1';
  document.addEventListener('keydown', () => { racine.dataset.clavier = '1'; }, true);
  document.addEventListener('pointerdown', () => { delete racine.dataset.clavier; }, true);
}
