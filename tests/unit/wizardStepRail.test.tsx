// @vitest-environment jsdom
/* VI-1 (rejeu b47cd90b n° 1) : à 390, le rail d'étapes de la recette (Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap.) débordait de ~8 px
   (7 × 8 px de marge de bouton + 6 × 4 px d'écart, pour 298 px de libellés dans 370 px) ; le défilement jusqu'à l'étape courante rognait la première lettre :
   « dentité ». Les marges du rail compact sont réduites (écart 2 px, marge 2 px de chaque côté) : 338 px de contenu pour 370, le rail ne défile plus à 390 et les
   boutons se partagent le reste (`grow`). Le test garde ces choix, car jsdom ne mesure pas la mise en page. */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardStepRail } from '../../src/ui/WizardStepBar';

const ETAPES = [
  { id: 'identite', label: 'Identité' }, { id: 'fermentescibles', label: 'Fermentescibles', shortLabel: 'Malts/sucres' },
  { id: 'houblons', label: 'Houblons' }, { id: 'levure', label: 'Levure' }, { id: 'paliers', label: 'Paliers' },
  { id: 'eau', label: 'Eau et sels', shortLabel: 'Eau' }, { id: 'recap', label: 'Récapitulatif', shortLabel: 'Récap.' },
];

describe('rail d’étapes compact', () => {
  it('les sept libellés courts sont là, sans marge qui fasse déborder le rail à 390', () => {
    render(<WizardStepRail steps={ETAPES} currentIndex={1} onSelect={() => {}} showLabels compactLabels />);
    const rail = screen.getByRole('navigation', { name: 'Étapes' });
    expect(rail.className).toContain('gap-0.5');
    expect(rail.className).not.toMatch(/(^|\s)gap-1(\s|$)/);
    const boutons = rail.querySelectorAll('button');
    expect(boutons).toHaveLength(7);
    for (const b of boutons) {
      expect(b.className).toContain('px-0.5');
      expect(b.className).not.toMatch(/(^|\s)px-1(\s|$)/);
      expect(b.className).toContain('grow');
    }
    // Largeur minimale du contenu à 390 : libellés (≈ 298 px mesurés sur la capture) + marges, sous les 370 px du rail.
    const marges = boutons.length * 2 * 2 + (boutons.length - 1) * 2;
    expect(298 + marges).toBeLessThanOrEqual(370);
  });
  it('le rail non compact garde ses écarts', () => {
    render(<WizardStepRail steps={ETAPES} currentIndex={0} onSelect={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Étapes' }).className).toContain('gap-1');
  });
});
