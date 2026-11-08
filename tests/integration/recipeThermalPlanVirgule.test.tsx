import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RecipeThermalPlan } from '../../src/ui/RecipeThermalPlan';
import { monSuperStout } from '../fixtures/monSuperStout';

afterEach(cleanup);

describe('BR-34 : « Temps et conduite » écrit les décimales à la virgule, comme le champ', () => {
  it('68,5 °C et non 68.5 °C', () => {
    const recipe = structuredClone(monSuperStout);
    recipe.mash!.steps = [{ name: 'Saccharification', tempC: 68.5, durationMin: 60 }];
    recipe.mash!.mashoutTempC = 76;
    render(<RecipeThermalPlan recipe={recipe} />);
    const table = screen.getByRole('table', { name: 'Montées et maintiens prévus' });
    expect(table.textContent).toContain('68,5 °C');
    expect(table.textContent).not.toMatch(/\d\.\d °C/);
    expect(table.textContent).toMatch(/68,5 → 76 °C/);
  });
});
