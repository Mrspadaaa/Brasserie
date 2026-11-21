import { configure, fireEvent, screen } from '@testing-library/react';

/* Atelier ouvert, la conduite de base de Ma levure se masque sans se démonter (etapeRetours.test.tsx) : son double caché n'est pas ce que le
   brasseur voit, les requêtes par texte l'ignorent. */
configure({ defaultIgnore: 'script, style, [data-lv="conduite-base"][hidden], [data-lv="conduite-base"][hidden] *' });

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

/** Aller à une étape sans ouvrir l'atelier de Ma levure : l'état tel que le brasseur le trouve en touchant l'étape. */
export function allerEtapeSeule(nom: string | RegExp): void {
  const cible = screen.getAllByRole('button', { name: nom })[0];
  if (!cible) throw new Error(`Étape « ${String(nom)} » introuvable dans le fil de l'assistant.`);
  fireEvent.click(cible);
}

/**
 * L'étape Levure (mission levure-port) : l'ancienne étape (YeastRecipeChoice) vit dans le repli « Atelier complet » de Ma levure. Les tests
 * qui jouent ses gestes l'ouvrent comme le brasseur le toucherait. Une reprise de brouillon ne l'ouvre pas seule : le test le fait ici.
 */
export function ouvrirAtelierLevure(strict = false): void {
  // 20.11 (r4 v02, ae4008926) : fermé, un volet n'est plus rendu sous la carte ; le bouton « Atelier » de la rangée d'actions l'ouvre.
  if (!document.querySelector('[data-repli="atelier"]')) {
    const bouton = document.querySelector<HTMLButtonElement>('[data-lv="act-atelier"]');
    if (bouton) fireEvent.click(bouton);
  }
  const atelier = document.querySelector<HTMLDetailsElement>('[data-repli="atelier"]');
  if (!atelier) { if (strict) throw new Error("Repli « Atelier complet » introuvable : l'étape Levure n'est pas affichée."); return; }
  if (!atelier.open) { atelier.open = true; fireEvent(atelier, new Event('toggle')); }
}

/** getByLabelText sans le double caché de la conduite de base (atelier ouvert) : un seul champ attendu, comme le brasseur le voit. */
export function libelle(texte: string | RegExp): HTMLElement {
  const vus = screen.getAllByLabelText(texte).filter(el => !el.closest('[data-lv="conduite-base"][hidden]'));
  if (vus.length !== 1) throw new Error(`« ${String(texte)} » : ${vus.length} champs hors de la conduite de base masquée (1 attendu).`);
  return vus[0];
}
