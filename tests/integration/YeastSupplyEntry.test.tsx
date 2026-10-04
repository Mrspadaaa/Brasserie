import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { YeastProductEntry } from '../../src/ui/YeastSupplyEntry';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { YeastProduct } from '../../functions/src/yeastSupplySchema';

const api = vi.hoisted(() => ({ product: vi.fn(), offer: vi.fn() }));
vi.mock('../../src/services/yeastDbCorrections', () => ({ YeastDbCorrections: { proposeProductCreation: api.product, proposeOfferCreation: api.offer } }));
vi.mock('../../src/ui/YeastDbCorrectionsPanel', () => ({ YeastDbCorrectionsPanel: (props: any) => props.target
  ? <button onClick={() => props.onUpdated({ status: 'server-confirmed', targetCreated: true, entityCreated: 'product', readback: 'pending' })}>Confirmer la fixture</button> : null }));
afterEach(() => { cleanup(); api.product.mockReset(); api.offer.mockReset(); });

const initial = (): Recipe => ({ ...structuredClone(fullRecipe), yeast: { name: 'Culture sans produit initial', lab: 'Fabricant QA',
  hopIndexId: 'qa-new-reference', form: 'sèche', qty: 17, unit: 'g', pitching: { version: 1, wort: { volumeL: 25, sg: 1.048, basis: 'measured' } } } });
function Host({ changed }: { changed: (recipe: Recipe) => void }) {
  const [recipe, setRecipe] = useState(initial());
  return <YeastProductEntry recipe={recipe} takenIds={new Set()} onClose={vi.fn()} onChange={next => { setRecipe(next as Recipe); changed(next as Recipe); }} />;
}
const fill = (label: string, value: string) => { const field = screen.getByLabelText(label); fireEvent.change(field, { target: { value } }); fireEvent.blur(field); };
function define() {
  fill('Nom ou variante exacte', 'Format documenté QA');
  fill('Format du conditionnement', 'unknown');
  fill('Titre', 'Notice synthétique QA');
  fill('Lien https', 'https://example.invalid/format-qa');
}

describe('Définition générique hors des produits initiaux', () => {
  it('accepte le jour civil de Zurich après minuit sans accepter le lendemain', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-27T22:12:00.000Z'));
    try {
      const changed = vi.fn(); render(<Host changed={changed} />); define();
      fill('Relevé le', '2026-09-28');
      fireEvent.click(screen.getByRole('button', { name: 'Retenir cette définition dans la recette' }));
      expect(changed.mock.lastCall?.[0].yeast.pitching.product.source.checkedAt).toBe('2026-09-28');

      const second = vi.fn(); cleanup(); render(<Host changed={second} />); define();
      fill('Relevé le', '2026-09-29');
      fireEvent.click(screen.getByRole('button', { name: 'Retenir cette définition dans la recette' }));
      expect(second).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('date de relevé dans le futur');
    } finally { vi.useRealTimers(); }
  });

  it('corrige une copie sans supprimer ses données documentées hors du formulaire', () => {
    const source = { title: 'Notice QA', url: 'https://example.invalid/notice', checkedAt: '2026-09-27', origin: 'manual' as const };
    const existing: YeastProduct = { id: 'manual-existing', referenceId: 'qa-new-reference', label: 'Ancien libellé QA', manufacturer: 'Fabricant QA', form: 'sèche', source,
      dose: { range: { min: 50, max: 80 }, qualifier: 'range', unit: 'g/hL', conditions: 'Donnée documentée à conserver', source } };
    const changed = vi.fn();
    render(<YeastProductEntry recipe={initial()} existing={existing} takenIds={new Set()} onClose={vi.fn()} onChange={changed} />);
    fill('Nom ou variante exacte', 'Libellé corrigé QA');
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette correction dans la recette' }));
    expect(changed.mock.lastCall![0].yeast.pitching.product).toMatchObject({ id: existing.id, label: 'Libellé corrigé QA', dose: existing.dose });
  });
  it('retient une copie locale sans API, valeur déduite ou changement de quantité/moût', () => {
    const changed = vi.fn(); render(<Host changed={changed} />); define();
    fireEvent.click(screen.getByRole('button', { name: 'Retenir cette définition dans la recette' }));
    const recipe = changed.mock.lastCall![0] as Recipe;
    expect(recipe.yeast).toMatchObject({ qty: 17, unit: 'g', pitching: { wort: initial().yeast.pitching!.wort,
      product: { referenceId: 'qa-new-reference', source: { origin: 'manual' } } } });
    const product = recipe.yeast.pitching!.product!;
    expect(product.format).toBeUndefined(); expect(product.dose).toBeUndefined(); expect(product.cellsPerPack).toBeUndefined(); expect(product.starter).toBeUndefined();
    expect(api.product).not.toHaveBeenCalled(); expect(api.offer).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Cette action ne publie rien dans la base');
  });

  it('gèle la définition soumise et ne choisit rien sur un reçu, y compris readback pending', async () => {
    let resolve!: (proposal: any) => void;
    api.product.mockImplementation(() => new Promise(done => { resolve = done; }));
    const changed = vi.fn(); render(<Host changed={changed} />); define();
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche dans la base' }));
    expect(screen.getByLabelText('Nom ou variante exacte')).toBeDisabled();
    const document = api.product.mock.calls[0][0];
    await act(async () => resolve({ id: 'proposal-qa', target: { scope: 'product', id: document.id }, changes: [{ id: 'C1', value: document.product }] }));
    expect(screen.getByLabelText('Nom ou variante exacte')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la fixture' }));
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('La copie de cet appareil reste à actualiser');
    fireEvent.click(screen.getByRole('button', { name: 'Choisir ce produit dans la recette' }));
    expect(changed.mock.lastCall![0].yeast.pitching.product).toEqual(document.product);
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 17, unit: 'g' });
  });
});
