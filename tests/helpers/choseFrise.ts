import { screen } from '@testing-library/react';

/**
 * La chose posée sur la frise du Calendrier, par son nom. Depuis RENOMMER-EVT (21.11), le titre du détail ouvert est aussi un bouton
 * (« Tireuse · renommer le nom ») : il n'est pas la chose de la frise et ne compte pas.
 */
export function choseFrise(nom: RegExp): HTMLElement {
  const l = screen.getAllByRole('button', { name: nom }).filter(b => !/ · renommer /.test(b.getAttribute('aria-label') ?? ''));
  if (l.length !== 1) throw new Error(`${l.length} choses de la frise pour ${nom}`);
  return l[0];
}
