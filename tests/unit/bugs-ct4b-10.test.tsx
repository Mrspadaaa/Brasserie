// @vitest-environment jsdom
// Tour 2 de ct4b, point 10 (critique k4) : un « 80 g » restait seul à droite de « Détail des ajouts et IBU · Potentiel aromatique » ;
// aucun mot ne disait que c'est le total du dry hop. Le total se lit « total 80 g ».
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TableauHoublons } from '../../src/ui/recette/TableauHoublons';
import type { HopIngredient } from '../../src/types';

afterEach(cleanup);

const hops = [
  { name: 'Citra', stage: 'boil', weightG: 60, alpha: 12, timeMin: 20 },
  { name: 'Citra', stage: 'dryHop', weightG: 80, alpha: 12, dayOffset: 3 }
] as unknown as HopIngredient[];

describe('CT4-B-5 (suite) : le total du dry hop dit ce qu’il est', () => {
  it('le total porte le mot « total » et sa dose', () => {
    const { container } = render(<TableauHoublons hops={hops} actions={<button type="button">Détail des ajouts et IBU</button>} />);
    const total = container.querySelector('[data-element="r1-total-dryhop"]') as HTMLElement;
    expect(total.textContent).toMatch(/total/i);
    expect(total.textContent).toMatch(/80\s*g/);
  });
});
