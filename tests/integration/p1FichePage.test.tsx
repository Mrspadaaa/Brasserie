/** @vitest-environment jsdom */
// Voie p1 (12.11) : la fiche d'article est la page entière k2 — retour, lots, besoin, « Ce qui a bougé », « Corriger le stock », jamais type="number".
// Contrôle rouge sur la fiche d'avant (tag 2d9bd3e3 : feuille basse, « Corriger l'inventaire »), vert sur la page.
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StockDetailSheet } from '../../src/ui/StockDetailSheet';
import type { StockItem } from '../../src/types';
import type { MouvementBrut } from '../../src/domain/stock/mouvementsArticle';

const c1: StockItem = { id: 'H1', ref: 'H1', name: 'Centennial', category: 'Houblon', unit: 'g', currentStock: 120, minStock: 100, reorder: false, supplier: 'Hopfen der Welt', alphaPct: 9.5 };
const c2: StockItem = { id: 'H2', ref: 'H2', name: 'Centennial bis', category: 'Houblon', unit: 'g', currentStock: 200, minStock: 0, reorder: false, supplier: 'Hopfen der Welt', alphaPct: 10.2 };
const mouvements: MouvementBrut[] = [
  { id: 'm1', type: 'inventory-adjustment', stockItemRef: 'H1', previousStock: 110, delta: 10, newStock: 120, reasonCode: 'comptage', reason: 'Inventaire physique', date: '2026-08-01', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'm2', type: 'receipt', stockItemRef: 'H2', quantity: 200, transactionId: 'T9', date: '2026-11-06', createdAt: '2026-11-06T09:00:00.000Z' }
];

function monter(extra: Partial<React.ComponentProps<typeof StockDetailSheet>> = {}) {
  const onCorrect = vi.fn();
  render(<StockDetailSheet item={c1} stockItems={[c1, c2]} batches={[]} movements={mouvements} onClose={() => {}} onSave={() => {}} onDelete={() => {}}
    onToggleFavorite={() => {}} onCorrect={onCorrect} onOpenTransaction={() => {}} {...extra}/>);
  return { onCorrect };
}

describe('p1 — la fiche d’article en page entière', () => {
  it('se lit en page : retour à la liste, lots, ce qui a bougé, corriger le stock', () => {
    monter();
    expect(screen.getByRole('button', { name: /Retour au stock/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Centennial' })).toBeInTheDocument();
    expect(screen.getByText(/^Lots/)).toBeInTheDocument();
    expect(screen.getByText('Ce qui a bougé')).toBeInTheDocument();
    expect(screen.getByText(/Corriger le stock · il en reste/)).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument(); // 120 g + 200 g : le stock de la famille
  });
  it('ne contient aucun champ type="number"', () => {
    monter();
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });
  it('un compté enregistré écrit une correction pour le lot choisi', () => {
    const { onCorrect } = monter();
    fireEvent.change(screen.getByRole('textbox', { name: 'Il en reste' }), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onCorrect).toHaveBeenCalledWith(expect.objectContaining({ ref: 'H1' }), 100, 'comptage');
  });
  it('sans correction touchée, Enregistrer n’écrit aucun mouvement', () => {
    const { onCorrect } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
