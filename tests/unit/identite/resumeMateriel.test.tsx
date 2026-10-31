// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { practicalBrewingPreferences, practicalEquipment } from '../../../src/domain/brewEquipment';
import { BrewEquipmentSummary } from '../../../src/ui/BrewEquipmentSummary';
import type { BrewhouseProfile, Recipe } from '../../../src/types';

afterEach(cleanup);

const profil: BrewhouseProfile = {
  id: 'fixture', name: 'Fixture 30 L', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 2, mashRatioLPerKg: 4,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const recette = (volumeL: number) => ({ id: 'R', name: 'x', style: '', volumeL, brewhouse: profil, fermentables: [], hops: [] } as unknown as Recipe);

describe('« Espace libre » du bloc Volumes et matériel', () => {
  it('un volume au-delà du fermenteur se dit « +25 L de trop », jamais « −25 L · 0 % »', () => {
    render(<BrewEquipmentSummary recipe={recette(55)} profile={profil} />);
    const ligne = screen.getByText('Espace libre').closest('div')!;
    expect(ligne.textContent).toContain('+25 L de trop');
    expect(ligne.textContent).not.toContain('−');
    expect(ligne.textContent).not.toContain('-25');
  });
  it('un volume dans le fermenteur garde « N L · P % »', () => {
    render(<BrewEquipmentSummary recipe={recette(24)} profile={profil} />);
    expect(screen.getByText('Espace libre').closest('div')!.textContent).toMatch(/6 L · 20 %/);
  });
});
