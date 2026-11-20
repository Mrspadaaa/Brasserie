// @vitest-environment jsdom
// CT4-B-5 (critique du tour 4) : la carte Houblons de la fiche montrait « 60 » sans unité collé à Citra ; on ne lisait pas « 60 g à 20 min ».
// Chaque dose du tableau variété × moment porte son unité (g), sans changer le nombre lu (« 85 » reste « 85 »).
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { TableauHoublons } from '../../src/ui/recette/TableauHoublons';
import type { HopIngredient } from '../../src/types';

afterEach(cleanup);

const hops = [
  { name: 'Nugget', stage: 'boil', weightG: 20, alpha: 13, timeMin: 60 },
  { name: 'Citra', stage: 'boil', weightG: 60, alpha: 12, timeMin: 20 },
  { name: 'Citra', stage: 'dryHop', weightG: 82.5, alpha: 12, dayOffset: 3 }
] as unknown as HopIngredient[];

describe('CT4-B-5 : une dose du tableau Houblons se lit avec son unité', () => {
  it('chaque cellule remplie dit « <nombre> g » ; une cellule vide reste vide (jamais 0 g)', () => {
    const { container } = render(<TableauHoublons hops={hops} />);
    const tableau = container.querySelector('[data-booster="tableau-moments"]') as HTMLElement;
    const cellules = within(tableau).getAllByRole('cell');
    const remplies = cellules.filter((c) => (c.textContent ?? '').trim() !== '');
    expect(remplies.map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())).toEqual(['20 g', '60 g', '82,5 g']);
    expect(cellules.filter((c) => (c.textContent ?? '').trim() === '')).toHaveLength(cellules.length - remplies.length);
    expect(cellules.some((c) => /(^|\s)0\s*g/.test(c.textContent ?? ''))).toBe(false);
  });
  it('le nombre reste trouvable seul (la fiche et ses tests le lisent tel quel)', () => {
    const { getByText } = render(<TableauHoublons hops={hops} />);
    expect(getByText('82,5')).toBeInTheDocument();
  });
});
