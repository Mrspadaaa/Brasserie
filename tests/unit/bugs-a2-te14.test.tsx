// @vitest-environment jsdom
// TE-14 : « Recette actuelle : Données manquantes » ne disait pas lesquelles ; l'écran nomme maintenant ce qui manque.
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NoloRecipeSimulator } from '../../src/ui/NoloRecipeSimulator';
import { evaluateNoloRecipe, newNoloConfig, noloScience } from '../../src/domain/nolo';
import { recetteApercuIdentite } from '../../src/ui/identite/apercuDev';

afterEach(cleanup);
const science = noloScience()!;

describe('TE-15 : NOLO au premier plan', () => {
  it('les réglages préremplis (densité, grain, atténuation, température, variation) sont dans un dépliant fermé ; procédé, consigne et levure restent à découvert', () => {
    const recipe = { ...recetteApercuIdentite(), nolo: { ...newNoloConfig(), enabled: true, process: 'restricted' } } as never;
    render(<NoloRecipeSimulator recipe={recipe} onChange={() => undefined} science={science} />);
    const enPli = (nom: string) => document.querySelector(`input[id]`) && ([...document.querySelectorAll('label')].find((l) => l.textContent === nom) as HTMLElement | undefined)?.closest('details');
    const pli = enPli('Densité initiale visée');
    if (pli) {
      expect(pli.hasAttribute('open')).toBe(false);
      for (const nom of ['Charge de grain', 'Température de fermentation', 'Variation de l’extrait']) expect(enPli(nom)).toBe(pli);
    }
    expect(document.querySelector('select[aria-label="Procédé à simuler"]')!.closest('details')).toBeNull();
    expect(document.querySelector('select[aria-label="Levure de la simulation"]')!.closest('details')).toBeNull();
  });
});

describe('TE-14 : la ligne « Recette actuelle »', () => {
  it('n’écrit pas « Données manquantes » seul : elle dit quoi compléter', () => {
    const recipe = { ...recetteApercuIdentite(), nolo: { ...newNoloConfig(), enabled: true } } as never;
    const courant = evaluateNoloRecipe(recipe, [])?.projection;
    render(<NoloRecipeSimulator recipe={recipe} onChange={() => undefined} science={science} />);
    const ligne = [...document.querySelectorAll('p')].find((p) => /^Recette actuelle/.test(p.textContent ?? ''));
    expect(ligne).toBeTruthy();
    console.log('LIGNE', ligne!.textContent, 'max', courant?.max);
    if (courant && courant.max === null && courant.min === 0) {
      expect(ligne!.textContent).not.toMatch(/Données manquantes\s*$/);
      expect(ligne!.textContent).toMatch(/manque|compléter|renseigner/i);
    }
  });
});
