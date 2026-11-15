import { fireEvent, screen } from '@testing-library/react';

/**
 * p2c E4 : « Confirmer la levure ajoutée » ne ferme plus la page, elle reste sur la clôture et le bilan.
 * « Terminer » (pied, nom accessible « Synchroniser et clôturer ») ouvre la confirmation finale, qui ferme la page comme avant.
 */
export async function terminerLaJournee() {
  fireEvent.click(await screen.findByRole('button', { name: 'Synchroniser et clôturer' }));
  const boutons = await screen.findAllByRole('button', { name: 'Synchroniser et clôturer' });
  fireEvent.click(boutons[boutons.length - 1]);
}
