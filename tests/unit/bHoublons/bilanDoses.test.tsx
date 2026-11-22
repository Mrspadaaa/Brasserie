// @vitest-environment jsdom
/* Voie b-houblons (09.11) : le bilan de houblonnage de l'étape Houblons.
   TE-25 : « 4,167 g/L (25/6 g/L exacts) » : une fraction « exacte » n'aide pas le brasseur.
   BR-41 : « 2,5 g · 0,125 g/L » (trois décimales) ; 0,004 g devient « 0 g · 2E-4 g/L (0,0002 g/L exacts) ».
   MV-50 : « 16D » tout seul à droite, avec « Plage du style non identifiée » : un code que l'app ne reconnaît pas.
   RO-4 : aperçu avec 99 999 g, la page ne répond plus : le rendu reste rapide. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HopRecipeSnapshot } from '../../../src/ui/hopIndex/HopRecipeSnapshot';
import { fullRecipe } from '../../fixtures/fullRecipe';
import type { Recipe } from '../../../src/types';

afterEach(cleanup);
const recette = (poidsG: number, patch: Partial<Recipe> = {}): Recipe => ({
  ...structuredClone(fullRecipe), style: 'Hefeweizen', styleRef: undefined, nolo: undefined, volumeL: 30,
  hops: [{ name: 'Cascade', stage: 'boil', weightG: poidsG, alpha: 7, timeMin: 60 }] as Recipe['hops'], ...patch,
});
const phases = () => screen.getByRole('definition').parentElement!.textContent ?? '';

describe('TE-25, BR-41 — les doses du bilan se lisent sans fraction ni notation scientifique', () => {
  it('25 g dans 30 L : « 0,83 g/L », sans « 5/6 » ni « exacts »', () => {
    render(<HopRecipeSnapshot recipe={recette(25)} />);
    expect(phases()).toContain('25 g');
    expect(phases()).toContain('0,83 g/L');
    expect(phases()).not.toMatch(/exact|\d\/\d/);
  });
  it('125 g dans 30 L : 4,17 g/L et non « 4,167 g/L (25/6 g/L exacts) »', () => {
    render(<HopRecipeSnapshot recipe={recette(125)} />);
    expect(phases()).toContain('4,17 g/L');
    expect(phases()).not.toMatch(/exact|\d\/\d|4,167/);
  });
  it('2,5 g dans 20 L : « 0,13 g/L » (deux décimales : 0,125 g/L n’avait pas à être écrit au millième)', () => {
    render(<HopRecipeSnapshot recipe={recette(2.5, { volumeL: 20 })} />);
    expect(phases()).toContain('0,13 g/L');
    expect(phases()).not.toContain('0,125');
  });
  it('0,004 g : jamais « 0 g », « 2E-4 » ni « exacts » : « moins de 0,1 g » et « moins de 0,01 g/L »', () => {
    render(<HopRecipeSnapshot recipe={recette(0.004, { volumeL: 20 })} />);
    expect(phases()).toContain('< 0,1 g');
    expect(phases()).toContain('< 0,01 g/L');
    expect(phases()).not.toMatch(/2E-4|exact|\b0 g\b/i);
  });
  it('une masse nulle reste « 0 g » : elle est saisie, pas minuscule', () => {
    render(<HopRecipeSnapshot recipe={recette(0)} />);
    expect(phases()).not.toContain('<');
  });
});

describe('MV-50 — un style que l’app ne reconnaît pas le dit', () => {
  it('« 16D » (code BJCP tapé à la main, sans référence) : « style non reconnu » à côté du nom, pas le code seul', () => {
    render(<HopRecipeSnapshot recipe={recette(50, { style: '16D' })} />);
    const entete = screen.getByRole('heading', { name: 'Amertume et répartition' }).parentElement!;
    expect(entete).toHaveTextContent('16D');
    expect(entete).toHaveTextContent(/non reconnu/i);
  });
  it('un style reconnu ne porte pas la mention', () => {
    render(<HopRecipeSnapshot recipe={recette(50, { style: 'Hefeweizen' })} />);
    expect(screen.getByRole('heading', { name: 'Amertume et répartition' }).parentElement).not.toHaveTextContent(/non reconnu/i);
  });
  it('aucun style : « Style à préciser », comme avant', () => {
    render(<HopRecipeSnapshot recipe={recette(50, { style: '' })} />);
    expect(screen.getByRole('heading', { name: 'Amertume et répartition' }).parentElement).toHaveTextContent('Style à préciser');
  });
});

describe('RO-4 — 99 999 g de houblon : le bilan se rend vite et dit l’erreur probable', () => {
  it('rendu en moins de 2 s, dose en g/L au-delà de la borne lue à 0,1 g/L près', () => {
    const t0 = performance.now();
    render(<HopRecipeSnapshot recipe={recette(99999)} />);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(2000);
    expect(phases()).toMatch(/3\s?333,3\s?g\/L/);
  });
});
