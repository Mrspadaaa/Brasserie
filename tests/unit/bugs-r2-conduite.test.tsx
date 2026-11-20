// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { fullRecipe } from '../fixtures/fullRecipe';
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: () => [], isReady: () => true, subscribe: () => () => {}, put: () => {}, bulkWrite: async () => {},
} }));
import { FermentationWorkshop } from '../../src/ui/FermentationWorkshop';
afterEach(cleanup);

const recipe = () => ({ ...structuredClone(fullRecipe), yeast: { name: 'US-05', form: 'sèche' as const, qty: 1, unit: 'sachet' } });

// BR-100 / BE-53 : « Évaluer ma recette » et « Trouver une conduite » étaient deux boutons gris ; le choisi n'avait qu'un filet presque invisible.
describe('bugs r2 : conduite de levure, bouton choisi', () => {
  it('le bouton choisi porte la teinte de sélection (ébauche paille), l’autre non, et ils changent à chaque geste', () => {
    render(<FermentationWorkshop recipe={recipe()} onChange={vi.fn()} />);
    const evaluer = () => screen.getByRole('button', { name: 'Évaluer ma recette' });
    const trouver = () => screen.getByRole('button', { name: 'Trouver une conduite' });
    expect(evaluer()).toHaveAttribute('aria-pressed', 'true');
    expect(evaluer().className).toMatch(/border-ebc-straw/);
    expect(trouver().className).not.toMatch(/border-ebc-straw/);
    fireEvent.click(trouver());
    expect(trouver()).toHaveAttribute('aria-pressed', 'true');
    expect(trouver().className).toMatch(/border-ebc-straw/);
    expect(evaluer().className).not.toMatch(/border-ebc-straw/);
  });
});
