import { fireEvent, screen } from '@testing-library/react';

/**
 * Aller à une étape de l'assistant de recette.
 *
 * Un seul clic : le fil d'étapes est fait de boutons directs, chacun portant le
 * nom de son étape comme nom accessible. C'est une contrainte explicite du
 * produit — on change d'étape en un geste, pas deux (voir `WizardStepBar`).
 *
 * Le détour reste centralisé ici : ce composant a déjà changé de forme deux
 * fois, et huit fichiers de test s'y appuient.
 */
export function allerEtape(nom: string | RegExp): void {
  const cible = screen.getAllByRole('button', { name: nom })[0];
  if (!cible) throw new Error(`Étape « ${String(nom)} » introuvable dans le fil de l'assistant.`);
  fireEvent.click(cible);
  ouvrirAtelierLevure();
}

/**
 * L'étape Levure (mission levure-port) : l'ancienne étape (YeastRecipeChoice) vit dans le repli « Atelier complet » de Ma levure. Les tests
 * qui jouent ses gestes l'ouvrent comme le brasseur le toucherait. Une reprise de brouillon ne l'ouvre pas seule : le test le fait ici.
 */
export function ouvrirAtelierLevure(strict = false): void {
  const atelier = document.querySelector<HTMLDetailsElement>('[data-repli="atelier"]');
  if (!atelier) { if (strict) throw new Error("Repli « Atelier complet » introuvable : l'étape Levure n'est pas affichée."); return; }
  if (!atelier.open) { atelier.open = true; fireEvent(atelier, new Event('toggle')); }
}
