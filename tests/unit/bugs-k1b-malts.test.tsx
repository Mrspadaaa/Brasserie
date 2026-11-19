// @vitest-environment jsdom
// k1 (critique 19.11), points 11, 12 et 13 : Malts/sucres.
//  11 — « Miel » tapé dans Grain : l'aperçu « + Miel ↵ » et la ligne « Créer « Miel » » disaient deux fois le même geste, sans dire lequel crée quoi.
//  12 — la coriandre (une épice) comptait dans la masse de grain, la part, la couleur à renseigner et la teinte ; l'alerte parlait au conditionnel.
//  13 — la pastille d'un malt très sombre (noir sur fond noir en cave) ne se voyait pas.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../src/types';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../src/ui/fermentescibles/Ajout';
import { stockApercu } from '../../src/ui/fermentescibles/apercuDev';
import { grainEmpate } from '../../src/domain/fermentables/moments';
import { recipeBeerColor } from '../../src/domain/beerColor';

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
const coriandre: Fermentable = { name: 'Coriandre', kind: 'grain', use: 'empatage', weightKg: 0.05, potentialPpg: 37 };
const noir: Fermentable = { name: 'Malt noir', kind: 'grain', use: 'empatage', weightKg: 0.5, potentialPpg: 25, colorEbc: 1400 };

function Banc({ depart = [pale] }: { depart?: Fermentable[] }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [stock] = useState<StockItem[]>(() => stockApercu());
  const [famille, setFamille] = useState<FermentableKind>('grain');
  return (
    <EtapeFermentescibles
      fermentables={l} onFermentables={setL} stockItems={stock} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'neuf', ref: 'NEUF-1', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false } as StockItem)}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined}
    />
  );
}
afterEach(cleanup);
const champ = () => screen.getByRole('combobox', { name: /Ajouter un fermentescible/ }) as HTMLInputElement;
const alertes = () => document.querySelector('[data-role="alertes"]')!.textContent ?? '';

describe('k1 point 11 : un seul geste pour « Miel »', () => {
  it('quand « Créer » est proposé, l’aperçu « + Miel ↵ » ne le répète pas ; la ligne Créer porte la masse et la famille', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Miel 0,5');
    const creer = screen.getByRole('option', { name: /Créer « Miel »/ });
    expect(creer.textContent).toMatch(/sucre/i);
    expect(creer.textContent).toMatch(/0,50?\s*kg/);
    expect(document.querySelector('[data-role="apercu"]')!.textContent).toBe('');
  });
  it('un nom trouvé dans le stock garde son aperçu (un seul geste aussi : pas de ligne Créer)', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Carapils');
    expect(screen.queryByRole('option', { name: /Créer/ })).toBeNull();
    expect(document.querySelector('[data-role="apercu"]')!.textContent).toMatch(/Carapils/);
  });
});

describe('k1 point 12 : la coriandre n’entre pas dans le grain ni dans la teinte', () => {
  it('domaine : une épice n’est pas un grain empâté, et ne bloque pas la couleur de la recette', () => {
    expect(grainEmpate(coriandre)).toBe(false);
    expect(grainEmpate(pale)).toBe(true);
    const avec = recipeBeerColor([pale, coriandre], 20);
    const sans = recipeBeerColor([pale], 20);
    expect(avec).not.toBeNull();
    expect(avec!.ebc).toBeCloseTo(sans!.ebc, 6);
  });
  it('ligne : la part du malt est 100 %, la coriandre est « hors du grain », et aucune couleur à renseigner', () => {
    render(<Banc depart={[pale, coriandre]} />);
    expect(document.querySelector('[data-pc="0"]')!.textContent).toMatch(/^100\s*%/);
    const c = document.querySelector('[data-pc="1"]')!.textContent ?? '';
    expect(c).toMatch(/hors du grain/);
    expect(c).not.toMatch(/% du grain/);
    expect(document.body.textContent).not.toMatch(/couleurs? à renseigner/);
  });
  it('l’alerte parle au présent : ni dans le grain, ni dans la teinte', () => {
    render(<Banc depart={[pale, coriandre]} />);
    expect(alertes()).toMatch(/Coriandre/);
    expect(alertes()).toMatch(/n’est comptée ni dans le grain ni dans la teinte/);
    expect(alertes()).not.toMatch(/serait/);
    expect(alertes()).toMatch(/additif/i);
  });
});

describe('k1 point 13 : la pastille d’un malt très sombre porte un liseré clair', () => {
  it('ligne et fiche : fer-sombre pour 1400 EBC, pas pour 6,5 EBC', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, noir]} />);
    const pastilles = [...document.querySelectorAll<HTMLElement>('[data-role="couleur-ligne"]')];
    expect(pastilles[0].classList.contains('fer-sombre')).toBe(false);
    expect(pastilles[1].classList.contains('fer-sombre')).toBe(true);
    await u.click(document.querySelectorAll<HTMLElement>('[data-sel]')[1]);
    const fiche = document.querySelector<HTMLElement>('[data-role="bteinte"]')!;
    expect(fiche.classList.contains('fer-sombre')).toBe(true);
  });
});
