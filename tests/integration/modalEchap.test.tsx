import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalShell } from '../../src/ui/ModalShell';

// NUIT-F1 (27.11, banc des fiches) : Échap dans un champ d'une feuille (fiche client) fermait sans demander et perdait la saisie.
describe('ModalShell, Échap', () => {
  it('dans un champ : la feuille reste ouverte', () => {
    const onClose = vi.fn();
    render(<ModalShell open onClose={onClose} labelledBy="t"><h2 id="t">Modifier le client</h2><input aria-label="Nom" defaultValue="ZZ TEST" /></ModalShell>);
    const champ = screen.getByLabelText('Nom');
    champ.focus();
    fireEvent.keyDown(champ, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
  it('hors champ : la feuille se ferme', () => {
    const onClose = vi.fn();
    render(<ModalShell open onClose={onClose} labelledBy="t"><h2 id="t">Modifier le client</h2><button type="button">Annuler</button></ModalShell>);
    const b = screen.getByRole('button', { name: 'Annuler' });
    b.focus();
    fireEvent.keyDown(b, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
