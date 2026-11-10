// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), N-1 : double toucher sur « Retirer » d'une ligne : 1 ligne retirée mais 2 annulations empilées ; « Annuler » rendait la ligne en double.
// Un retrait = une annulation (idempotence par ligne).
import React, { useState } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';

afterEach(cleanup);

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
// Valeurs de test, simulées.
const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 4, potentialPpg: 37, colorEbc: 6 };
const cara: Fermentable = { name: 'Caramünch Typ 2', kind: 'grain', use: 'empatage', weightKg: 1, potentialPpg: 34, colorEbc: 120 };

let courant: Fermentable[] = [];
function Banc() {
  const [l, setL] = useState<Fermentable[]>([pale, cara]);
  const [famille, setFamille] = useState<FermentableKind>('grain');
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}

describe('N-1 — un retrait = une annulation', () => {
  it('deux toucher sur la même corbeille avant le rendu : une ligne retirée, « Annuler » la rend une fois', () => {
    render(<Banc />);
    const corbeille = screen.getByLabelText('Retirer Caramünch Typ 2') as HTMLElement;
    act(() => { corbeille.click(); corbeille.click(); });
    expect(courant.map((f) => f.name)).toEqual(['Pale Ale Malz']);
    act(() => { document.querySelector<HTMLElement>('[data-role="annuler"]')!.click(); });
    expect(courant.map((f) => f.name)).toEqual(['Pale Ale Malz', 'Caramünch Typ 2']);
  });
});
