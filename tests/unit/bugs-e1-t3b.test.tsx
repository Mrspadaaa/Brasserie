// @vitest-environment jsdom
// Voie e1 (test en ligne passe 4, 20.11) : T3B-7 (NOLO, 7 dépliants au premier plan), T3B-8 (coriandre « grain : à l'empâtage »),
// T3B-9 (famille : 5 points sans nom). Recette d'un brasseur (fullRecipe : Milk Stout au lactose), pas une fixture qui évite le cas.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../src/types';
import { NoloPanel } from '../../src/ui/NoloPanel';
import { newNoloConfig } from '../../src/domain/nolo';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../src/ui/fermentescibles/Ajout';
import { stockApercu } from '../../src/ui/fermentescibles/apercuDev';
import { fullRecipe } from '../fixtures/fullRecipe';

afterEach(cleanup);

describe('T3B-7 — NOLO allumé : un seul dépliant au premier plan', () => {
  const recette = () => ({ ...structuredClone(fullRecipe), nolo: { ...newNoloConfig(), enabled: true, process: 'restricted' } }) as never;
  it('les trois champs, la plage et « Appliquer » à découvert ; tout le technique derrière un seul dépliant', () => {
    render(<NoloPanel recipe={recette()} onChange={() => undefined} />);
    const premierPlan = [...document.querySelectorAll('details')].filter((d) => !d.parentElement?.closest('details'));
    expect(premierPlan.map((d) => d.querySelector('summary')?.textContent)).toHaveLength(1);
    const appliquer = document.querySelector('.nolo-solver-apply')!;
    expect(appliquer.closest('details')).toBeNull();
    expect(screen.getByLabelText('Procédé à simuler').closest('details')).toBeNull();
    expect(screen.getByLabelText('Levure de la simulation').closest('details')).toBeNull();
    // tout ce qui était un dépliant frère est dans le seul dépliant
    const plus = premierPlan[0];
    for (const mot of [/Programme prérempli/, /Champs de la recette/, /Hypothèses, limites et sources/, /Outils complémentaires/, /Bilan détaillé/]) {
      expect([...plus.querySelectorAll('summary')].some((s) => mot.test(s.textContent ?? ''))).toBe(true);
    }
  });
});

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Sucre de lait', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
const FAMILLES5: FermentableKind[] = ['grain', 'sucre', 'lactose', 'fruit', 'extrait'];
const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
function Banc() {
  const [l, setL] = useState<Fermentable[]>([pale]);
  const [stock] = useState<StockItem[]>(() => stockApercu());
  const [famille, setFamille] = useState<FermentableKind>('grain');
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={stock} famille={famille} onFamille={setFamille} defs={DEFS} familles={FAMILLES5}
      onCreateStockItem={(n, c, u) => ({ id: 'neuf', ref: 'NEUF-1', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false }) as StockItem}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}
const champ = () => screen.getByRole('combobox', { name: /Ajouter un fermentescible/ }) as HTMLInputElement;

describe('T3B-8 — « coriandre » ne se crée pas « grain : à l’empâtage »', () => {
  it('la ligne « Créer » dit que c’est une épice, jamais un grain à l’empâtage', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'coriandre');
    const creer = document.querySelector<HTMLElement>('[data-role="creer"]')!;
    expect(creer).toBeTruthy();
    expect(creer.textContent).not.toMatch(/grain\s*:\s*à l’empâtage/i);
    expect(creer.textContent).toMatch(/épice/i);
  });
  it('un nom ordinaire garde sa famille et son moment (le miel : sucre, à l’ébullition)', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'xyzmalt');
    expect(document.querySelector('[data-role="creer"]')!.textContent).toMatch(/grain : à l’empâtage/i);
  });
});

describe('T3B-9 — la famille de l’ajout nomme les cinq valeurs avant tout toucher', () => {
  it('les cinq noms sont lisibles au repos, la famille courante est marquée, un nom choisit sa famille', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    const noms = document.querySelector('[data-role="fam-noms"]')!;
    expect(noms).toBeTruthy();
    expect([...noms.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Grain', 'Sucre', 'Sucre de lait', 'Fruit', 'Extrait']);
    expect(noms.querySelector('[aria-current="true"]')!.textContent).toBe('Grain');
    await u.click([...noms.querySelectorAll('button')].find((b) => b.textContent === 'Fruit')!);
    expect(document.querySelector('[data-role="fam-noms"] [aria-current="true"]')!.textContent).toBe('Fruit');
    expect(document.querySelector('[data-role="fam"]')!.textContent).toMatch(/Fruit/);
  });
});
