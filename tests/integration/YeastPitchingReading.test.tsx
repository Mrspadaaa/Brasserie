import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { YeastPitchingPanel, YeastProductChoice } from '../../src/ui/YeastPitchingPanel';
import type { Recipe } from '../../src/types';
import type { YeastProduct, YeastSupplySource } from '../../functions/src/yeastSupplySchema';
import { fullRecipe } from '../fixtures/fullRecipe';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => undefined }));
afterEach(cleanup);

const source: YeastSupplySource = { title: 'Notice synthétique QA', url: 'https://example.invalid/notice', checkedAt: '2026-09-27', origin: 'manual' };
const dry: YeastProduct = {
  id: 'qa-dry-product', referenceId: 'qa-dry-reference', label: 'Culture sèche QA', manufacturer: 'Fixture QA', form: 'sèche', source,
  format: { amount: 11.5, unit: 'g', label: 'Sachet QA 11,5 g', source },
  dose: { range: { min: 50, max: 80 }, qualifier: 'range', unit: 'g/hL', conditions: 'Plage de notice synthétique', source },
};
function base(product: YeastProduct): Recipe {
  return { ...structuredClone(fullRecipe), volumeL: 40, fermentables: [], yeast: {
    name: product.label, hopIndexId: product.referenceId, form: product.form, qty: 1, unit: 'sachet',
    pitching: { version: 1, product, wort: { volumeL: 40, sg: 1.05, basis: 'hypothesis', volumeBasis: 'hypothesis', sgBasis: 'hypothesis' } },
  } };
}
function Host({ initial, changed }: { initial: Recipe; changed: (next: Recipe) => void }) {
  const [recipe, setRecipe] = useState(initial);
  return <YeastPitchingPanel part="pitching" recipe={recipe} onChange={next => { setRecipe(next as Recipe); changed(next as Recipe); }} />;
}

describe('Lecture de la quantité prévue par grandeur', () => {
  it.each([['strict-lower-bound', '>', 'low'], ['strict-upper-bound', '<', 'high']] as const)('garde la borne %s et refuse l’égalité dans la quantité prévue', (qualifier, operator, tone) => {
    const product: YeastProduct = { ...dry, dose: { ...dry.dose!, qualifier, range: { min: 50, max: 50 } } };
    const recipe = base(product); recipe.yeast.qty = 20; recipe.yeast.unit = 'g';
    render(<Host initial={recipe} changed={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Conseil' })).toHaveTextContent(`${operator} 20 g`);
    const quantity = screen.getByRole('region', { name: 'Quantité prévue' });
    expect(quantity).toHaveAttribute('data-planned', tone);
    expect(quantity).toHaveTextContent(`borne publiée ${operator} 20 g`);
    expect(screen.queryByRole('group', { name: /Adopter un nombre de sachets/ })).not.toBeInTheDocument();
  });

  it('permet de qualifier au clavier un volume saisi comme mesuré', () => {
    const changed = vi.fn();
    const partial = base(dry);
    delete partial.yeast.pitching!.product;
    delete partial.yeast.pitching!.wort!.sg;
    delete partial.yeast.pitching!.wort!.sgBasis;
    render(<Host initial={partial} changed={changed} />);
    const wort = screen.getByRole('region', { name: 'Moût à ensemencer' });
    fireEvent.click(within(wort).getByRole('button', { name: 'Corriger' }));
    const volumeBasis = within(wort).getByRole('radiogroup', { name: 'Nature du volume' });
    const hypothesis = within(volumeBasis).getByRole('radio', { name: 'Hypothèse' });
    hypothesis.focus();
    fireEvent.keyDown(hypothesis, { key: 'ArrowLeft' });
    expect(within(volumeBasis).getByRole('radio', { name: 'Mesuré' })).toHaveAttribute('aria-checked', 'true');
    expect(changed.mock.lastCall![0].yeast.pitching.wort.volumeBasis).toBe('measured');
  });

  it('garde l’origine manuelle et ne confond pas absence du cache avec absence dans la base', () => {
    render(<YeastProductChoice recipe={base(dry)} onChange={vi.fn()} readOnly />);
    const product = screen.getByRole('group', { name: 'Produit exact et achat' });
    const link = within(product).getByRole('link', { name: /Notice synthétique QA/ });
    expect(link).toHaveTextContent('Saisie manuelle');
    expect(link).toHaveAttribute('href', source.url);
    expect(link).toHaveTextContent('27.09.2026');
    expect(product).toHaveTextContent('absente du catalogue chargé');
    expect(product).not.toHaveTextContent('fiche fabricant');
    expect(product).not.toHaveTextContent('pas encore dans la base');
  });

  it('ne valide pas la dose versée à partir du seul compte de sachets, et rétablit le manuel', () => {
    const changed = vi.fn();
    render(<Host initial={base(dry)} changed={changed} />);
    const adoption = screen.getByRole('group', { name: /Adopter un nombre de sachets/ });
    fireEvent.click(within(adoption).getByRole('button', { name: /3 sachets/ }));
    const quantity = screen.getByRole('region', { name: 'Quantité prévue' });
    expect(quantity).toHaveAttribute('data-planned', 'high');
    expect(quantity).toHaveAttribute('data-packs-check', 'ok');
    expect(within(quantity).getByText('Au-delà du repère si tout est versé')).toBeVisible();
    expect(quantity.querySelector('[data-check="packs"]')).toHaveTextContent('3 sachets · dans la plage conseillée 2–3');
    expect(quantity.querySelector('[data-check="dose"]')).toHaveTextContent('34,5 g · au-delà du repère haut 32 g (+2,5 g)');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 3, unit: 'sachet' });
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir 1 sachet' }));
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 1, unit: 'sachet' });
    fireEvent.click(within(adoption).getByRole('button', { name: /2 sachets/ }));
    expect(quantity).toHaveAttribute('data-planned', 'ok');
    expect(within(quantity).getByText('Dans le conseil')).toBeVisible();
  });

  it('nomme la plage cellulaire déclarée sans la transformer en mesure du lot ni déduire des cellules depuis les mL', () => {
    const product: YeastProduct = { id: 'qa-liquid-product', referenceId: 'qa-liquid-reference', label: 'Culture liquide QA', manufacturer: 'Fixture QA', form: 'liquide', source,
      format: { amount: 100, unit: 'mL', label: 'Flacon QA 100 mL', source },
      cellsPerPack: { range: { min: 100, max: 200 }, kind: 'viable', qualifier: 'range', conditions: 'Déclaration synthétique par flacon', source } };
    const recipe = base(product);
    recipe.yeast.qty = 100; recipe.yeast.unit = 'mL';
    recipe.yeast.pitching!.wort!.volumeL = 20;
    recipe.yeast.pitching!.rate = { value: .75, unit: 'M/mL/°P', conditions: 'Hypothèse QA explicite', source };
    recipe.yeast.pitching!.lot = { productId: product.id, viableCellsBillion: 0, cellsBasis: 'measured',
      cellMeasurement: { at: '2026-09-27T16:00:00Z', method: 'Comptage synthétique QA' } };
    render(<Host initial={recipe} changed={vi.fn()} />);
    const quantity = screen.getByRole('region', { name: 'Quantité prévue' });
    const cells = quantity.querySelector('[data-check="cells"]')!;
    expect(cells).toHaveAttribute('data-tone', 'unknown');
    expect(cells).toHaveTextContent('100–200 Md déclarés');
    expect(cells).toHaveTextContent('couvert ou non selon le lot');
    expect(screen.getByRole('region', { name: 'Conseil' })).toHaveTextContent('0 Md viables');
    const amount = screen.getByRole('textbox', { name: 'Quantité prévue de levure' });
    fireEvent.change(amount, { target: { value: '50' } }); fireEvent.blur(amount);
    expect(quantity.querySelector('[data-check="cells"]')).toBeNull();
    expect(quantity).toHaveTextContent('les cellules ne sont pas déduites des mL ou grammes');
  });
});
