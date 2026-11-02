// @vitest-environment jsdom
/** N5 (voie n1-nom-fr) : la fiche de l'article dit, sous « Nom », les noms qu'il porte sur les factures (b-stock.png). Lecture seule. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StockDetailSheet } from '../../../../src/ui/StockDetailSheet';
import { art } from './aide';

afterEach(cleanup);
const ouvrir = (item: any, onSave = vi.fn()) => { render(<StockDetailSheet item={item} batches={[]} onClose={() => {}} onSave={onSave} onDelete={() => {}} onCorrectInventory={() => {}} onToggleFavorite={() => {}}/>); return onSave; };

describe('N5 — « Sur la facture : … » sous « Nom »', () => {
  it('montre les noms gardés, séparés par « · »', () => {
    ouvrir(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['Wiener Malz', 'Vienna Malt'] }));
    expect(screen.getByText('Sur la facture : Wiener Malz · Vienna Malt')).toBeInTheDocument();
  });
  it('un nom égal au nom de l\'article n\'y figure pas', () => {
    ouvrir(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['malt de  vienne', 'Wiener Malz'] }));
    expect(screen.getByText('Sur la facture : Wiener Malz')).toBeInTheDocument();
  });
  it('sans le champ (article d\'avant B) ou liste vide : rien', () => {
    ouvrir(art('A', 'Malt de Vienne'));
    expect(screen.queryByText(/Sur la facture/u)).toBeNull();
    cleanup();
    ouvrir(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: [] }));
    expect(screen.queryByText(/Sur la facture/u)).toBeNull();
  });
  it('« Enregistrer » garde le champ', () => {
    const onSave = ouvrir(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nomsFacture: ['Wiener Malz'] }));
  });
});
