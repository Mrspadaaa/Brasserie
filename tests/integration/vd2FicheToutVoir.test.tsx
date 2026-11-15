// Voie vd2, verdict 5cdcd12e n° 6 : la maquette k2 (B4) pose « Tout voir · N mouvements depuis <mois> » sous les mouvements, même quand ils tiennent tous (N = 4).
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockFicheBouge } from '../../src/ui/StockFicheBouge';
import type { MouvementBrut } from '../../src/domain/stock/mouvementsArticle';

const mv = (n: number): MouvementBrut[] => Array.from({ length: n }, (_, k) => ({
  id: `v${k}`, type: 'receipt', stockItemRef: 'h1', quantity: 100, date: `2026-${String(8 + Math.floor(k / 3)).padStart(2, '0')}-${String(1 + (k % 3) * 8).padStart(2, '0')}`,
}));
const rendre = (n: number) => render(<StockFicheBouge nom="Citra" famille={[{ ref: 'h1', currentStock: 100 * n }]} unite="g" movements={mv(n)} batches={[]} besoin={0} seuil={100} aujourdhui="2026-11-14" />);

describe('« Tout voir · N mouvements depuis <mois> »', () => {
  it('à 4 mouvements (tous à l\'écran) : la ligne est posée, avec le nombre et le mois du plus ancien', () => {
    rendre(4);
    expect(screen.getByText(/Tout voir · 4 mouvements depuis août/)).toBeInTheDocument();
    expect(document.querySelectorAll('[data-mouvements] li')).toHaveLength(4);
  });
  it('à 2 mouvements : elle dit 2 ; à 1 : « 1 mouvement » au singulier', () => {
    rendre(2);
    expect(screen.getByText(/Tout voir · 2 mouvements depuis août/)).toBeInTheDocument();
  });
  it('à 1 mouvement : au singulier', () => {
    rendre(1);
    expect(screen.getByText(/Tout voir · 1 mouvement depuis août/)).toBeInTheDocument();
  });
  it('à 7 mouvements : le bouton déplie, comme avant (4 lignes d\'abord)', () => {
    rendre(7);
    expect(document.querySelectorAll('[data-mouvements] li')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Tout voir · 7 mouvements/ })).toBeInTheDocument();
  });
  it('sans mouvement : aucune ligne « Tout voir » (rien à voir)', () => {
    rendre(0);
    expect(screen.queryByText(/Tout voir/)).toBeNull();
  });
});
