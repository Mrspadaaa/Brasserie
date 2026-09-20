import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecipeTextExport } from '../../src/ui/RecipeTextExport';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('copie complète de recette', () => {
  it('télécharge un fichier UTF-8 réimportable qui conserve la levure et la conduite', async () => {
    const source = yeastFlowRecipe(); source.yeast = { ...source.yeast, form: 'liquide', qty: .125, unit: 'L' };
    const text = writeRecipeText(source), create = vi.fn((_blob: Blob) => 'blob:recipe-test');
    vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = vi.fn(); });
    let filename = '', href = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { filename = this.download; href = this.href; });
    render(<RecipeTextExport buildText={() => text}/>);
    fireEvent.click(screen.getByText('Texte complet et fichier .txt'));
    fireEvent.click(await screen.findByRole('button', { name: 'Télécharger .txt' }));
    expect(filename).toBe('recette-laffinee.txt'); expect(href).toBe('blob:recipe-test');
    const blob = create.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/plain;charset=utf-8');
    const downloaded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
    });
    expect(downloaded).toBe(text);
    const restored = readRecipeText(downloaded)!;
    expect(restored.yeast).toEqual(source.yeast); expect(restored.fermentation).toEqual(source.fermentation);
    expect(restored.yeastDesign).toEqual(source.yeastDesign); expect(restored.hops).toEqual(source.hops);
  });
  it('attend la résolution du presse-papier avant d’annoncer une copie', async () => {
    let complete!: () => void;
    const write = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: write } });
    render(<RecipeTextExport buildText={() => 'Recette NOLO complète · 0,5 %'}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect(screen.getByRole('button', { name: 'Copie en cours…' })).toBeDisabled();
    expect(screen.queryByText(/Recette copiée/)).not.toBeInTheDocument();
    await act(async () => complete());
    expect(write).toHaveBeenCalledWith('Recette NOLO complète · 0,5 %');
    expect(screen.getByText(/Recette copiée/)).toBeVisible();
  });
  it('rend le texte et le fichier accessibles quand le presse-papier refuse', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new DOMException('Refus', 'NotAllowedError')) } });
    render(<RecipeTextExport buildText={() => 'Analyses\nSucres : 100 g'}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Copie refusée');
    expect(screen.getByLabelText('Texte complet de la recette')).toHaveValue('Analyses\nSucres : 100 g');
    expect(screen.getByRole('button', { name: 'Télécharger .txt' })).toBeVisible();
    expect(screen.queryByText(/Recette copiée/)).not.toBeInTheDocument();
  });
  it('signale une configuration invalide sans copier une recette incomplète', async () => {
    const write = vi.fn(); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: write } });
    render(<RecipeTextExport buildText={() => { throw Error('Configuration NOLO invalide'); }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Configuration NOLO invalide');
    expect(write).not.toHaveBeenCalled();
  });
});
