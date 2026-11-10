import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Piles } from '../../src/ui/finance/operations/Piles';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';

// CP-15 (10.11) : « Pas de graph ? » et « Pourquoi négatif sur un apport ? ».
afterEach(cleanup);
const vide = periodeSynthese({ transactions: [], payments: [], mois: '2026-05', aujourdhui: '2026-11-10' });

describe('CP-15 : apports sur le graphe, bande jamais absente', () => {
  it('mois sans vente ni dépense : la bande le dit au lieu de disparaître', () => {
    render(<Piles periode={vide} nom="le mois" />);
    expect(screen.getByText('Ni vente ni dépense sur le mois.')).toBeTruthy();
  });
  it('un apport de 800,00 : une pile « Apports » signée +, à part', () => {
    const { container } = render(<Piles periode={vide} nom="le mois" apports={80_000} />);
    const pile = container.querySelector('[data-pile="apports"]');
    expect(pile).not.toBeNull();
    expect(pile!.textContent).toMatch(/\+\s?800,00/);
    expect(pile!.textContent).toContain('Apports');
  });
  it('un prélèvement net : signé −', () => {
    const { container } = render(<Piles periode={vide} nom="le mois" apports={-12_000} />);
    expect(container.querySelector('[data-pile="apports"]')!.textContent).toMatch(/−\s?120,00/);
  });
});
