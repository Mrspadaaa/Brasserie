import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { YeastRecipeWorkbench, YeastRecipeContext } from '../../src/ui/YeastRecipeWorkbench';
import { fullRecipe } from '../fixtures/fullRecipe';
import { applyYeastRecipeDesign, createYeastRecipeDraft, readYeastRecipeDesign, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import type { Recipe } from '../../src/types';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { allerEtape } from '../helpers/wizard';

const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
afterEach(cleanup);
const wheat = (): Recipe => ({ ...structuredClone(fullRecipe), style: 'Hefeweizen', styleRef: undefined,
  volumeL: 20, ogTarget: 1.05, ibuTarget: 12,
  yeast: { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
  mash: { ...fullRecipe.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
  hops: [{ name: 'Hallertau', weightG: 20, alpha: 4, stage: 'boil', timeMin: 60 }],
});
const change = (label: string, value: string) => {
  const field = screen.getByLabelText(label); fireEvent.change(field, { target: { value } }); fireEvent.blur(field);
};
const open = (text: RegExp) => { const summary = screen.getByText(text); fireEvent.click(summary); summary.closest('details')!.open = true; };
function Host({ initial, changed }: { initial: Recipe; changed: (r: Recipe) => void }) {
  const [recipe, setRecipe] = useState(initial);
  return <YeastRecipeWorkbench recipe={recipe} onChange={next => { changed(next as Recipe); setRecipe(next as Recipe); }} />;
}

describe('Levure : style, comparaison et application', () => {
  it('keeps the first dry-yeast application current through the actual wizard steps', () => {
    const initial: Recipe = { ...wheat(), style: 'American Pale Ale', name: 'Première application',
      yeast: { name: '', form: 'sèche', qty: 1, unit: 'sachet' },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 5 }] };
    const onSave = vi.fn();
    render(<BrewWizard seed={{ recipe: initial }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={vi.fn()} onSave={onSave} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    allerEtape(/^Levure/);
    fireEvent.click(screen.getByRole('button', { name: /Voir les .* souches du style/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Comparer .*US-05/ }));
    open(/Ensemencement et durée à préparer/);
    change('Température d’ensemencement du scénario', '19');
    change('Masse de levure du scénario en grammes', '20');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    expect(screen.getByText(/Scénario repris dans la recette/)).toBeInTheDocument();
    expect(screen.queryByText(/La recette a changé pendant la comparaison/)).not.toBeInTheDocument();
    allerEtape(/^Paliers/);
    expect(screen.queryByText(/Des réglages ont changé/)).not.toBeInTheDocument();
    allerEtape(/^Récapitulatif/);
    expect(screen.queryByText(/réglages modifiés/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = onSave.mock.calls[0][0] as Recipe;
    expect({ yeast: saved.yeast, volumeL: saved.volumeL, fermentation: saved.fermentation, mashSteps: saved.mash.steps,
      style: saved.style, ...(saved.styleRef ? { styleRef: saved.styleRef } : {}) }).toEqual(saved.yeastDesign?.applied);
    expect(yeastRecipeDesignChanged(saved, readYeastRecipeDesign(saved)!)).toBe(false);
    allerEtape(/^Levure/);
    open(/Saisie libre et stock/);
    change('Quantité de levure, en g', '25');
    allerEtape(/^Paliers/);
    expect(screen.getByText(/Des réglages ont changé/)).toBeInTheDocument();
    allerEtape(/^Récapitulatif/);
    expect(screen.getByText(/réglages modifiés/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const changed = onSave.mock.calls[1][0] as Recipe;
    expect(changed.yeast.qty).toBe(25);
    expect(changed.yeastDesign!.applied.yeast.qty).toBe(20);
    expect(yeastRecipeDesignChanged(changed, readYeastRecipeDesign(changed)!)).toBe(true);
  });
  it('starts with the beer style and limits wheat choices before choosing a flavor', () => {
    const onChange = vi.fn(); render(<YeastRecipeWorkbench recipe={wheat()} onChange={onChange} />);
    expect(screen.getByLabelText('Filtrer les levures par style')).toHaveValue('weissbier');
    expect(screen.getByText(/Comparer les souches du style/).closest('details')!.open).toBe(false);
    open(/Comparer les souches du style/);
    const rows = screen.getByRole('table', { name: /Potentiel décrit/ });
    expect(rows).toHaveTextContent('3068'); expect(rows).not.toHaveTextContent('US-05'); expect(rows).not.toHaveTextContent('3944');
    fireEvent.click(screen.getByRole('radio', { name: 'Girofle · épices' }));
    expect(screen.getByRole('radio', { name: 'Comparer WLP380 · Hefeweizen IV' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
  it('offers an explicit free choice when the style is unknown, without guessing clean ale', () => {
    render(<YeastRecipeWorkbench recipe={{ ...wheat(), style: 'Expérimentation', name: 'Lot 1' }} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Filtrer les levures par style')).toHaveValue('unknown');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/Choisis d’abord un style/)).toBeInTheDocument();
  });
  it('explores a cross-laboratory strain without changing the recipe and can reset', () => {
    const original = wheat(), onChange = vi.fn(); render(<YeastRecipeWorkbench recipe={original} onChange={onChange} />);
    open(/Comparer les souches du style/);
    fireEvent.click(screen.getByRole('radio', { name: 'Girofle · épices' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Comparer WLP380 · Hefeweizen IV' }));
    expect(screen.getByRole('region', { name: 'Scénario de levure' })).toHaveTextContent(/girofle|muscade/i);
    expect(onChange).not.toHaveBeenCalled(); expect(original.yeast.hopIndexId).toBe('wyeast-3068');
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByRole('radio', { name: /Comparer 3068/ })).toBeChecked();
  });
  it('shows an out-of-window error and allows correction before applying', () => {
    const onChange = vi.fn(); render(<YeastRecipeWorkbench recipe={wheat()} onChange={onChange} />);
    change('Température principale du scénario', '27');
    expect(screen.getByRole('alert')).toHaveTextContent('hors de la fenêtre');
    expect(screen.getByRole('button', { name: 'Appliquer le scénario' })).toBeDisabled();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    change('Température principale du scénario', '22,5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    expect(onChange.mock.calls[0][0].fermentation[0].tempC).toBe(22.5);
  });
  it('prepares and applies a clove trial while preserving the rest of the recipe', () => {
    const original = wheat(), changed = vi.fn(); render(<Host initial={original} changed={changed} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Girofle · épices' }));
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un essai girofle' }));
    expect(screen.getByLabelText('Température principale du scénario')).toHaveValue('18');
    expect(changed).not.toHaveBeenCalled();
    change('Contre-pression du scénario en bar', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    const next = changed.mock.calls[0][0] as Recipe;
    expect(next.mash.steps).toEqual([{ name: 'Repos férulique · proposition L’Affinée', tempC: 44, durationMin: 15 }, ...original.mash.steps]);
    expect(next.fermentation).toEqual([{ ...original.fermentation[0], tempC: 18 }, original.fermentation[1]]);
    expect(next.hops).toEqual(original.hops); expect(next.waterPlan).toEqual(original.waterPlan); expect(next.instructions).toBe(original.instructions);
    expect(next.yeastDesign).toMatchObject({ goal: 'clove', pressureBar: 0, ferulicRest: true });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const restored = readRecipeText(writeRecipeText(JSON.parse(JSON.stringify(next))))!;
    expect(restored.yeastDesign).toEqual(next.yeastDesign);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    expect(changed.mock.calls[1][0].mash.steps).toHaveLength(2);
  });
  it('retains a selected strain when a form filter hides it', () => {
    render(<YeastRecipeWorkbench recipe={wheat()} onChange={vi.fn()} />);
    open(/Comparer les souches du style/);
    fireEvent.change(screen.getByLabelText('Forme à comparer'), { target: { value: 'sèche' } });
    expect(screen.getByText(/Scénario conservé : 3068/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Scénario de levure' })).toHaveTextContent('3068');
  });
  it('does not apply a stale local comparison over external ingredient changes', () => {
    const original = wheat(), onChange = vi.fn(), view = render(<YeastRecipeWorkbench recipe={original} onChange={onChange} />);
    change('Température principale du scénario', '23');
    view.rerender(<YeastRecipeWorkbench recipe={{ ...original, volumeL: 30 }} onChange={onChange} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette a changé');
    expect(screen.getByRole('button', { name: 'Appliquer le scénario' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.getByLabelText('Température principale du scénario')).toHaveValue('20');
    expect(onChange).not.toHaveBeenCalled();
  });
  it('keeps unknown temperature and gravity unknown and calculates cells only from explicit inputs', () => {
    const original = { ...wheat(), fermentation: [], ogTarget: null };
    render(<YeastRecipeWorkbench recipe={original} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Température principale du scénario')).toHaveValue('');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(within(screen.getByRole('figure', { name: 'Densité finale documentaire' })).getAllByText('À renseigner')).toHaveLength(2);
    open(/Ensemencement et durée à préparer/);
    change('Taux de cellules visé par mL et degré Plato', '0,75');
    expect(screen.getByText(/Renseigne volume, densité et taux/)).toBeInTheDocument();
  });
  it('reads actual dry-hop phase and contact and provides cross-step navigation', () => {
    const recipe = { ...wheat(), hops: [{ name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop' as const, dayOffset: 3 }] };
    const onNavigate = vi.fn(); render(<YeastRecipeWorkbench recipe={recipe} onChange={vi.fn()} onNavigate={onNavigate} />);
    open(/Interactions avec la recette/);
    const contacts = screen.getByRole('table', { name: 'Contacts des houblons avec la fermentation' });
    expect(contacts).toHaveTextContent('J+3'); expect(contacts).toHaveTextContent('À préciser'); expect(contacts).toHaveTextContent('— h');
    expect(screen.getByText(/Recontrôler après le dernier ajout à cru/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier les houblons' })); expect(onNavigate).toHaveBeenCalledWith('houblons');
  });
  it('cross-step context recalculates hops and identifies a changed fermentation after application', () => {
    const original = wheat(), refs = yeastReferences();
    const next = applyYeastRecipeDesign(original, createYeastRecipeDraft(original, refs), refs);
    next.hops.push({ name: 'Mosaic', weightG: 80, alpha: 12, stage: 'dryHop', aromaTiming: 'postFermentation' });
    next.fermentation[0].tempC = 22;
    render(<YeastRecipeContext recipe={next} onChooseYeast={vi.fn()} />);
    expect(screen.getByRole('complementary')).toHaveTextContent('4 g/L à cru');
    expect(screen.getByText(/Des réglages ont changé/)).toBeInTheDocument();
  });
  it('positions the entered dry dose against the manufacturer range and can erase it', () => {
    const original: Recipe = { ...wheat(), style: 'NEIPA', yeast: { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche', qty: 12, unit: 'g' } };
    render(<YeastRecipeWorkbench recipe={original} onChange={vi.fn()} />);
    open(/Ensemencement et durée à préparer/);
    change('Masse de levure du scénario en grammes', '8');
    expect(screen.getByText(/Quantité prévue : 8,0 g/)).toHaveTextContent('sous le repère');
    change('Masse de levure du scénario en grammes', '15');
    expect(screen.getByText(/Quantité prévue : 15,0 g/)).toHaveTextContent('dans le repère');
    change('Masse de levure du scénario en grammes', '');
    expect(screen.queryByText(/Quantité prévue :/)).not.toBeInTheDocument();
  });
  it('restores a deliberate style filter and aroma goal after an unknown-style recipe is saved', () => {
    const original = { ...wheat(), style: 'Projet personnel', name: 'Essai 1' }, changed = vi.fn();
    const view = render(<Host initial={original} changed={changed} />);
    fireEvent.change(screen.getByLabelText('Filtrer les levures par style'), { target: { value: 'weissbier' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Banane' }));
    change('Contre-pression du scénario en bar', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    const saved = changed.mock.calls[0][0]; view.unmount();
    render(<YeastRecipeWorkbench recipe={JSON.parse(JSON.stringify(saved))} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Filtrer les levures par style')).toHaveValue('weissbier');
    expect(screen.getByRole('radio', { name: 'Banane' })).toBeChecked();
    expect(screen.getByLabelText('Contre-pression du scénario en bar')).toHaveValue('0');
    expect(saved.style).toBe('Projet personnel');
  });
});
