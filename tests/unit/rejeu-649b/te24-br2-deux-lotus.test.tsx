// @vitest-environment jsdom
// Rejeu en ligne 649bcc54 (08.11), TE-24 et BR-2 rouverts : outils Houblons v4, recette avec DEUX cartes Lotus (ébullition et à froid) :
// retirer l'une affichait « retiré. Annuler », mais Annuler ne la rendait pas. Les ids d'ajout sont la position dans recipe.hops (a1, a2…) :
// après le retrait, l'autre Lotus prend l'id du retiré ; l'annulation filtrait cet id et perdait la mauvaise carte.
// Ici le brouillon est tenu par un parent qui reprend les patchs, comme dans l'assistant.
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';

// Valeurs de test, simulées.
const RECETTE = {
  id: 'REC-649B', name: 'NEIPA essai', style: '21C', volumeL: 20, boilMin: 60, ogTarget: 1.060, colorEbc: 6,
  fermentables: [],
  hops: [
    { name: 'Lotus', alpha: 15, weightG: 20, stage: 'boil', timeMin: 10, stockItemRef: 'STK-LOTUS-1' },
    { name: 'Lotus', alpha: 15, weightG: 35, stage: 'dryHop', aromaTiming: 'fermentation', dayOffset: 3 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

let dernierBrouillon: Recipe = RECETTE;
function Parent() {
  const [recipe, setRecipe] = useState<Recipe>(RECETTE);
  dernierBrouillon = recipe;
  return <EtapeHoublons recipe={recipe} boilOg={1.06} draftId="REC-649B" onChange={(c) => setRecipe((r) => ({ ...r, ...c.patch }) as Recipe)} />;
}

afterEach(cleanup);

const lignes = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-role="ligne-houblon"]'));

describe('TE-24 / BR-2 — deux Lotus : Annuler rend la carte retirée, avec son rang et sa dose', () => {
  for (const [rang, nom, dose] of [[1, 'à froid', 35], [0, 'd’ébullition', 20]] as const) {
    it(`retirer la carte ${nom}, puis Annuler : les deux cartes sont là, dans l’ordre, aux bonnes doses`, async () => {
      const { container } = render(<Parent />);
      await waitFor(() => expect(lignes(container)).toHaveLength(2));
      fireEvent.click(container.querySelectorAll('[data-role="retirer"]')[rang]);
      await waitFor(() => expect(lignes(container)).toHaveLength(1));
      expect(dernierBrouillon.hops).toHaveLength(1);
      fireEvent.click(screen.getByRole('button', { name: /Annuler le retrait de Lotus/ }));
      await waitFor(() => expect(lignes(container)).toHaveLength(2));
      expect(dernierBrouillon.hops.map((h) => [h.stage, h.weightG])).toEqual([['boil', 20], ['dryHop', 35]]);
      expect(dernierBrouillon.hops[rang].weightG).toBe(dose);
      // Le lien au stock de la ligne d'ébullition n'est pas perdu.
      expect(dernierBrouillon.hops[0].stockItemRef).toBe('STK-LOTUS-1');
    });
  }
});
