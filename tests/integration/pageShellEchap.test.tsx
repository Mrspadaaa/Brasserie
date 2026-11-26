import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PageShell } from '../../src/pages/PageShell';

// NUIT-8 (26.11) : Échap dans un champ quitte le champ, pas la page ; hors champ, Échap ferme la page.
describe('PageShell, Échap', () => {
  it('dans un champ : le champ perd le focus, la page reste', () => {
    const onClose = vi.fn();
    render(<PageShell title="Ma bière" onClose={onClose}><input aria-label="Dose" defaultValue="12" /></PageShell>);
    const champ = screen.getByLabelText('Dose');
    champ.focus();
    fireEvent.keyDown(champ, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(champ);
  });
  it('hors champ : la page se ferme', () => {
    const onClose = vi.fn();
    render(<PageShell title="Ma bière" onClose={onClose}><button type="button">Suivant</button></PageShell>);
    const b = screen.getByRole('button', { name: 'Suivant' });
    b.focus();
    fireEvent.keyDown(b, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
