import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NewStockItemSheet } from '../../src/components/tabs/StocksTab';

afterEach(cleanup);

// PC-2 (a) : « je choisis Malt, il me met Divers » — la catégorie choisie dans la liste doit arriver à la création.
describe('PC-2 (a) : nouvel article, la catégorie choisie est gardée', () => {
  it.each(['Malt', 'Houblon', 'Levure'])('choisir « %s » puis Créer l’article', (categorie) => {
    const onCreate = vi.fn();
    render(<NewStockItemSheet open onClose={() => {}} onCreate={onCreate} />);
    fireEvent.change(screen.getByPlaceholderText(/Malt Pale Ale/), { target: { value: 'ZZ TEST article' } });
    const champ = screen.getByLabelText('Catégorie');
    fireEvent.focus(champ); fireEvent.click(champ);
    const option = screen.getAllByRole('option').find((o) => (o.textContent ?? '').trim().startsWith(categorie));
    expect(option, 'option ' + categorie).toBeTruthy();
    fireEvent.click(option!);
    fireEvent.click(screen.getByRole('button', { name: /Créer l.article/ }));
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ category: categorie, name: 'ZZ TEST article' }));
  });
});
