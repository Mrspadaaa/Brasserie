import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { YeastStarterEntry } from '../../src/ui/YeastStarterEntry';
import { YeastPitchingPanel } from '../../src/ui/YeastPitchingPanel';
import { createYeastPreparation, yeastPreparationState } from '../../src/domain/yeastPitching';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';
import type { YeastProduct, YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';

const api = vi.hoisted(() => ({ propose: vi.fn() }));
vi.mock('../../src/services/yeastDbCorrections', () => ({ YeastDbCorrections: { proposeStarterProtocol: api.propose } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => undefined }));
vi.mock('../../src/ui/YeastDbCorrectionsPanel', () => ({ YeastDbCorrectionsPanel: (props: any) => props.target ? <>
  <button onClick={() => props.onUpdated({ status: 'server-confirmed', target: props.target, targetCreated: false, readback: 'pending' })}>Confirmer notice QA</button>
  <button onClick={props.onClose}>Fermer revue QA</button>
</> : null }));
afterEach(() => { cleanup(); api.propose.mockReset(); });

const source = { title: 'Notice QA', url: 'https://example.invalid/notice-qa', checkedAt: '2026-09-27', origin: 'manufacturer' as const };
const product: YeastProduct = { id: 'qa-notice-product', referenceId: 'qa-liquid-reference', label: 'Culture liquide QA', manufacturer: 'Fabricant QA', form: 'liquide', source,
  format: { amount: 125, unit: 'mL', label: 'Flacon 125 mL documenté QA', source } };
const protocol: YeastStarterProtocol = { id: 'qa-existing-notice', label: 'Méthode QA', method: 'Agiter selon la notice QA', medium: 'malt-extract', targetSg: 1.04,
  conditions: 'Respecter les conditions QA', leadHours: { min: 24, max: 36 }, leadHoursMeaning: 'culture', steps: ['Préparer le milieu', 'Agiter puis contrôler'], source };
const initial = (): Recipe => ({ ...structuredClone(fullRecipe), yeast: { name: product.label, hopIndexId: product.referenceId, form: product.form, qty: 2, unit: 'flacon', stockItemRef: 'LOT-QA',
  pitching: { version: 1, product: structuredClone(product), wort: { volumeL: 25, sg: 1.048, basis: 'measured' }, lot: { productId: product.id, lotNumber: 'LOT-01' },
    rate: { value: .75, unit: 'M/mL/°P', conditions: 'Hypothèse QA', source },
    offer: { id: 'qa-retained-offer', productId: product.id, seller: 'Vendeur QA', url: 'https://example.invalid/offer',
      stock: { status: 'unknown', text: 'Non relevé', source: { ...source, origin: 'manual' } } } } } });
const fill = (label: string, value: string) => { const input = screen.getByLabelText(label); fireEvent.change(input, { target: { value } }); fireEvent.blur(input); };
function define() {
  fill('Nom de la méthode', protocol.label); fill('Milieu de la notice', 'malt-extract'); fill('Description de la méthode', protocol.method);
  fill('Densité cible publiée du starter', '1.040'); fill('Durée publiée, valeur ou minimum en heures', '24'); fill('Durée publiée, maximum en heures, vide pour une valeur unique', '36');
  fill('Cette durée couvre', 'culture'); fill('Conditions de la notice', protocol.conditions); fill('Étape 1', protocol.steps[0]);
  fill('Titre', source.title); fill('Lien https précis', source.url); fill('Date indiquée', source.checkedAt);
}
function entry(retain = vi.fn(), canPropose = true) {
  render(<YeastStarterEntry recipe={initial()} product={product} canPropose={canPropose} takenIds={new Set()} onRetain={retain} onClose={vi.fn()} />);
  return retain;
}
function Host({ recipe, changed }: { recipe: Recipe; changed: ReturnType<typeof vi.fn> }) {
  const [value, setValue] = useState(recipe);
  return <YeastPitchingPanel part="pitching" recipe={value} onChange={next => { changed(next); setValue(next as Recipe); }} />;
}

describe('Notice de préparation du produit exact', () => {
  it('ne transporte pas le brouillon de notice vers un autre produit exact', () => {
    function SwitchProduct() {
      const [recipe, setRecipe] = useState(initial());
      return <><button onClick={() => setRecipe(current => ({ ...current, yeast: { ...current.yeast, pitching: { ...current.yeast.pitching!,
        product: { ...product, id: 'other-product-QA', label: 'Autre produit exact QA' } } } }))}>Changer de produit QA</button>
        <YeastPitchingPanel part="pitching" recipe={recipe} onChange={next => setRecipe(next as Recipe)} /></>;
    }
    render(<SwitchProduct />);
    fireEvent.click(screen.getByRole('button', { name: 'Compléter la notice' }));
    fill('Nom de la méthode', 'Brouillon pour le premier produit');
    fireEvent.click(screen.getByRole('button', { name: 'Changer de produit QA' }));
    expect(screen.getByLabelText('Nom de la méthode')).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Notice de préparation de Autre produit exact QA' })).toBeVisible();
  });

  it('refuse une notice incomplète avec focus et sans appel ni adoption', () => {
    const retained = entry();
    fireEvent.click(screen.getByRole('button', { name: 'Retenir cette notice pour la recette' }));
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Milieu de la notice à préciser');
    expect(retained).not.toHaveBeenCalled(); expect(api.propose).not.toHaveBeenCalled();
  });

  it('garde une notice typée locale quand le produit ne peut pas encore être proposé dans la base', () => {
    const retained = entry(vi.fn(), false); define();
    expect(screen.getByRole('button', { name: 'Proposer l’enregistrement dans la base' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retenir cette notice pour la recette' }));
    expect(retained.mock.lastCall![0]).toMatchObject({ medium: 'malt-extract', targetSg: 1.04, leadHours: { min: 24, max: 36 }, leadHoursMeaning: 'culture', source: { origin: 'manual' } });
    expect(api.propose).not.toHaveBeenCalled();
  });

  it('gèle la notice soumise et attend une adoption volontaire après le reçu pending', async () => {
    let resolve!: (proposal: any) => void;
    api.propose.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const retained = entry(); define();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer l’enregistrement dans la base' }));
    expect(screen.getByLabelText('Description de la méthode')).toBeDisabled();
    const submitted = api.propose.mock.calls[0][1];
    await act(async () => resolve({ id: 'proposal-qa', target: { scope: 'product', id: product.id }, model: 'Saisie manuelle', changes: [{ field: 'product.starter' }] }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer notice QA' }));
    expect(retained).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('La copie de cet appareil reste à actualiser');
    fireEvent.click(screen.getByRole('button', { name: 'Retenir cette notice pour la recette' }));
    expect(retained).toHaveBeenCalledWith(submitted);
  });

  it('garde la saisie modifiable après refus CAS, sans annoncer une confirmation', async () => {
    api.propose.mockRejectedValueOnce(new Error('Révision concurrente QA'));
    const retained = entry(); define();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer l’enregistrement dans la base' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Révision concurrente QA');
    expect(screen.getByLabelText('Nom de la méthode')).toBeEnabled();
    expect(screen.getByLabelText('Description de la méthode')).toHaveValue(protocol.method);
    expect(retained).not.toHaveBeenCalled();
  });

  it('corrige la notice recette, garde les autres décisions et le plan figé, puis retrouve la notice après transport', () => {
    const recipe = initial(); recipe.yeast.pitching!.product!.starter = structuredClone(protocol);
    recipe.yeast.pitching!.preparation = createYeastPreparation(recipe.yeast, { targetPitchAt: new Date(Date.now() + 7 * 86400000).toISOString(), volumeL: 1, equipment: 'Fiole QA', inoculum: 'Inoculum QA' });
    const before = structuredClone(recipe), changed = vi.fn(); render(<Host recipe={recipe} changed={changed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corriger la notice' }));
    fill('Description de la méthode', 'Nouvelle méthode documentée QA');
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette correction pour la recette' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast).toMatchObject({ qty: 2, unit: 'flacon', stockItemRef: 'LOT-QA' });
    expect(next.yeast.pitching!.wort).toEqual(before.yeast.pitching!.wort);
    expect(next.yeast.pitching!.lot).toEqual(before.yeast.pitching!.lot);
    expect(next.yeast.pitching!.rate).toEqual(before.yeast.pitching!.rate);
    expect(next.yeast.pitching!.offer).toEqual(before.yeast.pitching!.offer);
    expect(next.yeast.pitching!.preparation).toEqual(before.yeast.pitching!.preparation);
    expect(yeastPreparationState(next.yeast)).toBe('stale');
    const reopened = readRecipeText(writeRecipeText(next));
    expect(reopened?.yeast?.pitching?.product?.starter?.method).toBe('Nouvelle méthode documentée QA');
    expect(before.yeast.pitching!.product!.starter!.method).toBe(protocol.method);
  });
});
