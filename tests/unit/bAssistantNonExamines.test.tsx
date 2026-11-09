// @vitest-environment jsdom
// Voie b-assistant, 3e passe (09.11) : les bugs « non examinés ». Chaque test est écrit AVANT le correctif et rouge sur le code d'alors (L13).
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { missingColorData, recipeBeerColor } from '../../src/domain/beerColor';
import { nomPalierAjoute } from '../../src/domain/fermentables/empatage';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';

afterEach(cleanup);

const DEFS = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
} as never;
// Valeurs de test, simulées.
const pale = { name: 'Pale Ale', kind: 'grain', use: 'empatage', weightKg: 4.6, colorEbc: 7, potentialPpg: 37 } as never;
const inconnu = { name: 'Caramünch Typ 2', kind: 'grain', use: 'fermentation', weightKg: 0, potentialPpg: 33 } as never;

describe('RJ-10 · un ingrédient sans masse ne bloque pas la couleur de la recette', () => {
  it('l’EBC se calcule malgré un grain inconnu à 0 kg', () => {
    expect(recipeBeerColor([pale, { ...inconnu, use: 'empatage' } as never], 20)).not.toBeNull();
  });
  it('un grain inconnu AVEC une masse bloque toujours (sans couleur, le chiffre serait faux)', () => {
    expect(recipeBeerColor([pale, { ...inconnu, use: 'empatage', weightKg: 0.5 } as never], 20)).toBeNull();
  });
  it('« 1 couleur à renseigner » ne compte pas une ligne à 0 kg', () => {
    expect(missingColorData([pale, inconnu])).toEqual([]);
    expect(missingColorData([pale, { ...inconnu, weightKg: 0.5 } as never])).toEqual(['Caramünch Typ 2']);
  });
  it('l’étape n’annonce pas de couleur à renseigner pour une ligne à 0 kg', () => {
    render(
      <EtapeFermentescibles fermentables={[pale, { ...inconnu, use: 'empatage' } as never]} onFermentables={() => undefined} stockItems={[]} famille="grain" onFamille={() => undefined}
        defs={DEFS}
        onCreateStockItem={() => ({}) as never} onLearnIngredient={() => undefined} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />,
    );
    expect(document.querySelector('[data-role="arens"]')).toBeNull();
  });
});

describe('TE-29 · le nom d’un palier ajouté', () => {
  it('« Palier 2 » après un palier, « Palier 1 » sur une liste vide', () => {
    expect(nomPalierAjoute([{ name: 'Saccharification' }])).toBe('Palier 2');
    expect(nomPalierAjoute([])).toBe('Palier 1');
  });
  it('ne reprend jamais un nom déjà pris', () => {
    expect(nomPalierAjoute([{ name: 'Palier 2' }, { name: 'Saccharification' }])).toBe('Palier 3');
    expect(nomPalierAjoute([{ name: 'palier 1' }])).toBe('Palier 2');
  });
});
