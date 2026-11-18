import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewhouseSettings } from '../../src/ui/BrewhouseSettings';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { defaultConfig } from '../../src/services/storage';

afterEach(cleanup);

// Contre-calcul du 08.11, CF-5 : le calcul de l'OG divise l'extrait par le volume EN FERMENTEUR (yeastProjection.ts, brewingMath.ts).
// Les Réglages appelaient ce rendement « extraction des grains » : un brasseur qui y saisit l'extraction mesurée en cuve
// obtient une OG trop haute de 5 à 10 points. Le libellé et l'aide disent maintenant « en fermenteur », comme la calibration.
const profil = { ...defaultConfig.brewhouses[0], volumeL: 24, equipment: { ...practicalEquipment } };

describe('CF-5 — le rendement des Réglages est nommé « en fermenteur »', () => {
  it('le champ s’appelle « Rendement en fermenteur (%) » et garde sa valeur', () => {
    render(<BrewhouseSettings profile={profil} onChange={vi.fn()} />);
    const champ = screen.getByLabelText('Rendement en fermenteur (%)') as HTMLInputElement;
    expect(Number(champ.value)).toBe(profil.efficiencyPct);
  });

  it('l’aide dit que ce n’est pas l’extraction mesurée en cuve', () => {
    render(<BrewhouseSettings profile={profil} onChange={vi.fn()} />);
    expect(screen.getByText(/mesuré dans le fermenteur/i).textContent).toMatch(/pas l’extraction mesurée en cuve/);
  });

  it('plus aucun libellé « extraction des grains » dans les réglages', () => {
    const { container } = render(<BrewhouseSettings profile={profil} onChange={vi.fn()} />);
    expect(container.textContent).not.toMatch(/extraction des grains/i);
  });
});
