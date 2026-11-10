import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NewStockItemSheet, ordonnerCategories } from '../../src/components/tabs/StocksTab';

afterEach(cleanup);

// PC-2 (a), cause trouvée au banc Chrome tactile 390 : la liste Catégorie ne montre que 2 lignes (≈ 94 px sous l'en-tête de la feuille) ;
// triée par ordre alphabétique, « Malt » était la 10e, « Houblon » la 8e, « Levure » la 9e : hors de vue, il fallait balayer.
describe('PC-2 (a) : les catégories du brassage passent en premier', () => {
  it('Malt, Houblon, Levure ouvrent la liste, avant les catégories déjà en stock', () => {
    const connues = ['Adjuvant', 'CIP', 'Capsules', 'Divers', 'Eau', 'Emballage', 'Fruits', 'Houblon', 'Levure', 'Malt', 'Sels', 'Sucre', 'Épices'];
    const ordre = ordonnerCategories(connues);
    expect(ordre.slice(0, 3)).toEqual(['Malt', 'Houblon', 'Levure']);
    // Aucune catégorie perdue ni doublée : les connues hors déroulé suivent, triées.
    expect(new Set(ordre).size).toBe(ordre.length);
    for (const c of connues) expect(ordre).toContain(c);
    expect(ordre.indexOf('Adjuvant')).toBeGreaterThan(ordre.indexOf('Consommable'));
  });

  it('dans la feuille, les trois premières options de la liste sont Malt, Houblon, Levure', () => {
    render(<NewStockItemSheet open onClose={() => {}} onCreate={vi.fn()} />);
    const champ = screen.getByLabelText('Catégorie');
    fireEvent.focus(champ); fireEvent.click(champ);
    const options = screen.getAllByRole('option').map((o) => (o.textContent ?? '').trim());
    expect(options.slice(0, 3)).toEqual(['Malt', 'Houblon', 'Levure']);
  });
});
