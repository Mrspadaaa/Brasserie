// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), TE-24 et BR-2 : outils Houblons v4, « Retirer Lotus de la recette » ne proposait aucun « Annuler » (même mécanisme que BR-30).
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
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';

// Valeurs de test, simulées.
const RECETTE = {
  id: 'REC-T24', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

afterEach(cleanup);

describe('TE-24 / BR-2 — retirer un houblon se défait d’un toucher', () => {
  it('« Retirer » annonce le retrait avec un bouton « Annuler » qui rend la ligne et sa dose', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T24" onChange={(c) => changements.push(c)} />);
    await waitFor(() => expect(container.querySelector('[data-role="retirer"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="retirer"]')!);
    expect(changements.at(-1)!.patch.hops).toHaveLength(0);
    expect(container.querySelector('[data-role="ligne-houblon"]')).toBeNull();
    const annuler = screen.getByRole('button', { name: /Annuler le retrait de Nugget/ });
    fireEvent.click(annuler);
    const dernier = changements.at(-1)!.patch.hops;
    expect(dernier).toHaveLength(1);
    expect(dernier[0].name).toBe('Nugget');
    expect(dernier[0].weightG).toBe(46);
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toContain('Nugget');
    expect(screen.queryByRole('button', { name: /Annuler le retrait/ })).toBeNull();
  });
});
