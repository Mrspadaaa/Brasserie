// @vitest-environment jsdom
// TL-10 (07.11), branchement 2 : « Pilsner Malz » sans EBC saisi montre l'EBC de la fiche du malteur (Weyermann) sur sa tuile d'Ajout, et la ligne
// ajoutée à la recette le reprend (plus de « EBC — »). Un malt hors table reste sans couleur : jamais 0.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../src/types';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../src/ui/fermentescibles/Ajout';

afterEach(cleanup);

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, ppg: 36, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
// Articles de test, simulés : aucun EBC saisi.
const art = (name: string): StockItem => ({ id: name, ref: name, name, category: 'Malt', unit: 'kg', currentStock: 25, minStock: 0, reorder: false });

let courant: Fermentable[] = [];
function Banc({ stock }: { stock: StockItem[] }) {
  const [l, setL] = useState<Fermentable[]>([]);
  const [famille, setFamille] = useState<FermentableKind>('grain');
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={stock} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}

describe('TL-10 : Pilsner Malz sans EBC saisi', () => {
  it('la tuile d\'Ajout montre l\'EBC de la fiche du malteur (3,5), et le choix pose couleur et potentiel sur la ligne', async () => {
    const u = userEvent.setup();
    render(<Banc stock={[art('Pilsner Malz')]} />);
    await u.type(screen.getByRole('combobox'), 'pilsner');
    const tuile = document.querySelector('[data-role="resultat"][data-nom="Pilsner Malz"]')!;
    expect(tuile).not.toBeNull();
    expect(tuile.querySelector('.fer-ebcp')?.textContent).toBe('3,5');
    await u.click(tuile);
    expect(courant).toHaveLength(1);
    expect(courant[0].colorEbc).toBe(3.5);
    expect(courant[0].potentialPpg).toBe(35.2);
  });
  it('un malt hors table (Castle Chateau Pilsen) : ni pastille, ni EBC inventé, couleur inconnue', async () => {
    const u = userEvent.setup();
    render(<Banc stock={[art('Castle Chateau Pilsen')]} />);
    await u.type(screen.getByRole('combobox'), 'castle');
    const tuile = document.querySelector('[data-role="resultat"][data-nom="Castle Chateau Pilsen"]')!;
    expect(tuile).not.toBeNull();
    expect(tuile.querySelector('.fer-ebcp')).toBeNull();
    await u.click(tuile);
    expect(courant[0].colorEbc).toBeUndefined();
  });
  it('un EBC saisi sur l\'article prime sur la fiche du malteur', async () => {
    const u = userEvent.setup();
    render(<Banc stock={[{ ...art('Pilsner Malz'), colorEbc: 4.2 }]} />);
    await u.type(screen.getByRole('combobox'), 'pilsner');
    const tuile = document.querySelector('[data-role="resultat"][data-nom="Pilsner Malz"]')!;
    expect(tuile.querySelector('.fer-ebcp')?.textContent).toBe('4,2');
    await u.click(tuile);
    expect(courant[0].colorEbc).toBe(4.2);
  });
});
