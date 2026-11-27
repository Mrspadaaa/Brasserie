/**
 * NUIT-8 / NUIT-F1 (26–27.11, bancs des gestes) : Échap dans un champ en cours d'édition quittait toute la page ou la feuille, et la saisie se
 * perdait (fiche client). Méthode standard : Échap quitte d'abord le champ (perte du focus) ; un second Échap, hors champ, ferme.
 * Renvoie vrai quand l'Échap a été consommé par le champ.
 */
export function echapQuitteLeChamp(cible: EventTarget | null): boolean {
  const el = cible instanceof HTMLElement ? cible : null;
  if (!el || !el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, select, [contenteditable]:not([contenteditable="false"])')) return false;
  el.blur();
  return true;
}
