// @vitest-environment jsdom
// Rejeu en ligne du 08.11, RJ-9 : en mode « Sucre », « Pilsner Malz 1,8 » + Entrée remplaçait en silence la masse du Pilsner (6,6 → 1,8 kg, OG 1,080 → 1,034).
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
const pils: Fermentable = { name: 'Pilsner Malz', kind: 'grain', use: 'empatage', weightKg: 6.6, potentialPpg: 37, colorEbc: 3.5 };
const flocons: Fermentable = { name: 'Flocons d’Avoine', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 33, colorEbc: 2 };

let courant: Fermentable[] = [];
function Banc({ depart, famille: f0 }: { depart: Fermentable[]; famille: FermentableKind }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [famille, setFamille] = useState<FermentableKind>(f0);
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}
const champ = () => screen.getByRole('combobox');

describe('RJ-9 · un nom de malt tapé dans la famille Sucre', () => {
  it('ne réécrit pas la masse en silence : l’écran dit ce qui va se passer et demande', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pils, flocons]} famille="sucre" />);
    await u.type(champ(), 'Pilsner Malz 1,8{Enter}');
    expect(courant.map((f) => f.weightKg)).toEqual([6.6, 2]);
    const q = document.querySelector('[data-role="remplacer"]')!;
    expect(q).not.toBeNull();
    expect(q.textContent).toContain('« Pilsner Malz » est déjà dans la recette (grain, 6,6 kg)');
    expect(q.textContent).toContain('Remplacer sa masse par 1,8 kg ?');
    expect(courant).toHaveLength(2);
  });

  it('« Remplacer » pose 1,8 kg ; « Garder » laisse 6,6 kg', async () => {
    const u = userEvent.setup();
    const { unmount } = render(<Banc depart={[pils, flocons]} famille="sucre" />);
    await u.type(champ(), 'Pilsner Malz 1,8{Enter}');
    await u.click(screen.getByRole('button', { name: 'Remplacer par 1,8 kg' }));
    expect(courant[0].weightKg).toBe(1.8);
    expect(document.querySelector('[data-role="remplacer"]')).toBeNull();
    unmount();
    render(<Banc depart={[pils, flocons]} famille="sucre" />);
    await u.type(champ(), 'Pilsner Malz 1,8{Enter}');
    await u.click(screen.getByRole('button', { name: 'Garder 6,6 kg' }));
    expect(courant[0].weightKg).toBe(6.6);
    expect(document.querySelector('[data-role="remplacer"]')).toBeNull();
  });

  it('dans sa propre famille (Grain), « nom + masse » reste le geste de mise à jour, sans question', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pils, flocons]} famille="grain" />);
    await u.type(champ(), 'Pilsner Malz 1,8{Enter}');
    expect(courant[0].weightKg).toBe(1.8);
    expect(document.querySelector('[data-role="remplacer"]')).toBeNull();
  });

  it('un grain à 0 kg reçoit sa masse sans question : rien n’est perdu', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[{ ...pils, weightKg: 0 }, flocons]} famille="sucre" />);
    await u.type(champ(), 'Pilsner Malz 1,8{Enter}');
    expect(courant[0].weightKg).toBe(1.8);
    expect(document.querySelector('[data-role="remplacer"]')).toBeNull();
  });
});
