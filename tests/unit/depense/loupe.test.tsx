// @vitest-environment jsdom
/** 10.11 (« On devrait pouvoir zoomer dans l'image de la facture, c'est illisible comme ça on peut pas contrôler ») : la photo et chaque page s'ouvrent dans la loupe, qui se ferme. */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Justificatif } from '../../../src/ui/depense/Entete';
import { PanneauPages } from '../../../src/ui/depense/Pages';

afterEach(cleanup);
describe('loupe du justificatif', () => {
  it('toucher la photo ouvre la loupe (agrandir, réduire, fermer) ; Échap la ferme', () => {
    render(<Justificatif fichier={{ nom: 'ticket.jpg', url: 'blob:ticket', type: 'image/jpeg' }} ouvert changerOff={false} onChanger={() => {}}/>);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir le justificatif' }));
    expect(screen.getByRole('dialog', { name: /Justificatif agrandi/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Agrandir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réduire' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir le justificatif' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la loupe' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('une page touchée s’ouvre dans la loupe, plus dans un autre onglet', () => {
    const { container } = render(<PanneauPages pages={[{ id: 'a', url: 'blob:p1', nom: 'p1.jpg' }, { id: 'b', url: 'blob:p2', nom: 'p2.jpg' }]} changerOff={false} onChanger={() => {}}/>);
    expect(container.querySelector('a[target="_blank"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voir la page 2' }));
    expect(screen.getByRole('dialog', { name: 'Justificatif agrandi : p2.jpg' })).toBeTruthy();
  });
});
