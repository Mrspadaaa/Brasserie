// @vitest-environment jsdom
// Voie b-assistant (09.11) : PD-4 (la question de RJ-9 sous le champ d'ajout), PI-2 (la barre ne compte pas un grain hors de l'empâtage), AM-11 (EBC hors échelle dit).
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
const malMis: Fermentable = { name: 'Munich', kind: 'grain', use: 'ebullition', weightKg: 3, potentialPpg: 36, colorEbc: 20 };

function Banc({ depart, famille: f0, teinte = null, ebcPlage }: { depart: Fermentable[]; famille: FermentableKind; teinte?: { ebc: number; label: string } | null; ebcPlage?: { min: number; max: number } }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [famille, setFamille] = useState<FermentableKind>(f0);
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={teinte} ebcPlage={ebcPlage} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}

describe('PD-4 : la question « Remplacer sa masse ? » se pose sous le champ où l’on a tapé', () => {
  it('elle suit le champ d’ajout dans le DOM, avant les repères', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pils, flocons]} famille="sucre" />);
    await u.type(screen.getByRole('combobox'), 'Pilsner Malz 1,8{Enter}');
    const q = document.querySelector('[data-role="remplacer"]')!;
    const ajout = document.querySelector('[data-role="ajout"]')!;
    const reperes = document.querySelector('[data-role="reps"]')!;
    expect(q).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING (4) : la question vient après le champ, et avant les repères.
    expect(ajout.compareDocumentPosition(q) & 4).toBe(4);
    expect(q.compareDocumentPosition(reperes) & 4).toBe(4);
  });
});

describe('PI-2 : la barre de composition ne compte pas un grain hors de l’empâtage', () => {
  it('le grain mal placé (ébullition) a une part nulle', () => {
    render(<Banc depart={[pils, malMis]} famille="grain" />);
    const parts = [...document.querySelectorAll<HTMLElement>('[data-role="comp"] i')].map((i) => i.style.flexGrow);
    expect(parts).toEqual(['6.6', '0']);
  });
});

describe('AM-11 : une teinte hors de l’échelle 0–40 EBC le dit', () => {
  it('« 63,3 EBC › » au bord, au lieu d’un repère collé sans un mot', () => {
    render(<Banc depart={[pils]} famille="grain" teinte={{ ebc: 63.3, label: 'Noire' }} />);
    const hors = document.querySelector('[data-hors="ebc"]');
    expect(hors?.textContent).toBe('63,3 EBC ›');
  });
  it('le repère « hors » ne recouvre pas l’étiquette « style 59–79 » (Chrome 1280 cave : les deux se chevauchaient) et celle-ci reste dans l’échelle', () => {
    render(<Banc depart={[pils]} famille="grain" teinte={{ ebc: 63.3, label: 'Noire' }} ebcPlage={{ min: 59, max: 79 }} />);
    const hors = document.querySelector<HTMLElement>('[data-hors="ebc"]')!;
    const style = [...document.querySelectorAll<HTMLElement>('.fer-zl')].find((e) => e.textContent?.startsWith('style 59'))!;
    // Verdict final A-a : recalée vers l'intérieur (8 px du bord), jamais collée au bord ni coupée ; le repère « hors » suit le même retrait.
    expect(style.style.right).toBe('8px');
    expect(hors.style.right).toBe('8px');
    expect(style.style.left).toBe('auto');
    expect(parseInt(hors.style.top, 10)).toBeLessThan(33 - 12);
  });
  it('dans l’échelle : aucun repère « hors »', () => {
    render(<Banc depart={[pils]} famille="grain" teinte={{ ebc: 12, label: 'Ambrée' }} />);
    expect(document.querySelector('[data-hors="ebc"]')).toBeNull();
  });
});
