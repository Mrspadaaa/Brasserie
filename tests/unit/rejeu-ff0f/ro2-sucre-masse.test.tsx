// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), RO-2 : famille Sucre, « sirop candi 1 » + Entrée créait la ligne à 0 kg, alors que « Mangue 20 » (Fruit) donnait 20 kg.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';
import { lireAjout } from '../../../src/ui/fermentescibles/modele';

afterEach(cleanup);

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
// Valeurs de test, simulées : un article de stock dont le nom commence comme la saisie.
const candi: StockItem = { id: 'c', ref: 'MP-9', name: 'Sirop candi 150', category: 'Sucre', unit: 'kg', currentStock: 5, minStock: 0, reorder: false } as StockItem;

let courant: Fermentable[] = [];
function Banc({ famille: f0 }: { famille: FermentableKind }) {
  const [l, setL] = useState<Fermentable[]>([]);
  const [famille, setFamille] = useState<FermentableKind>(f0);
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[candi]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}

describe('RO-2 — la même règle pour toutes les familles hors grain', () => {
  it('lireAjout : un petit entier derrière un début de nom connu est une masse hors du grain, un nom exact reste un nom', () => {
    const debut = (n: string) => n.toLowerCase().startsWith('sirop candi');
    const exact = (n: string) => n.toLowerCase() === 'sirop candi 150';
    expect(lireAjout('sirop candi 1', debut, true, exact)).toEqual({ nom: 'sirop candi', kg: 1 });
    expect(lireAjout('Mangue 20', () => false, true, () => false)).toEqual({ nom: 'Mangue', kg: 20 });
    expect(lireAjout('sirop candi 150', debut, true, exact)).toEqual({ nom: 'sirop candi 150', kg: null });
  });

  it('famille Sucre : « sirop candi 1 » + Entrée donne une ligne à 1 kg', async () => {
    const u = userEvent.setup();
    render(<Banc famille="sucre" />);
    await u.type(screen.getByRole('combobox'), 'sirop candi 1{Enter}');
    expect(courant).toHaveLength(1);
    expect(courant[0].weightKg).toBe(1);
  });

  it('famille Fruit : « Mangue 20 » donne 20 kg', async () => {
    const u = userEvent.setup();
    render(<Banc famille="fruit" />);
    await u.type(screen.getByRole('combobox'), 'Mangue 20{Enter}');
    expect(courant.map((f) => f.weightKg)).toEqual([20]);
  });
});
