// @vitest-environment jsdom
// Voie b-assistant, 4e passe (09.11) : les 7 derniers bugs + le pluriel de YeastRecipeHeading. Chaque test est écrit AVANT le correctif, rouge sur le code d'alors (L13).
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { YeastRecipeHeading } from '../../src/ui/YeastRecipeHeading';

afterEach(cleanup);

describe('TL-24 (suite) · l’en-tête de la section Levure accorde l’unité', () => {
  const recette = (qty: number, unit: string) => ({ yeast: { name: 'SafAle US-05', qty, unit }, fermentation: [] }) as never;
  it('« 2 sachets », « 1 sachet », g invariable', () => {
    const { container, rerender } = render(<YeastRecipeHeading recipe={recette(2, 'sachet')} />);
    expect(container.textContent).toContain('2 sachets');
    expect(container.textContent).not.toContain('2 sachet ');
    rerender(<YeastRecipeHeading recipe={recette(1, 'sachet')} />);
    expect(container.textContent).toContain('1 sachet');
    expect(container.textContent).not.toContain('1 sachets');
    rerender(<YeastRecipeHeading recipe={recette(11.5, 'g')} />);
    expect(container.textContent).toContain('11,5 g');
  });
});

import { recetteApercuEtapeLevure } from '../../src/ui/etapeLevure/apercuDev';
import { BrewSheet, type BrewSheetProps } from '../../src/ui/BrewSheet';
import { vi } from 'vitest';

// Verdict final A-b : la plage de dose (« 2–3 sachets », #132) se montre quand la dose prévue est une plage ; l'unité s'accorde partout.
describe('A-b · l’en-tête de la section Levure montre la plage de dose', () => {
  it('sans dose saisie, US-05 à 30 L : « 2–3 sachets » (plage du produit et du volume, jamais son milieu)', () => {
    const { container } = render(<YeastRecipeHeading recipe={recetteApercuEtapeLevure() as never} />);
    expect(container.textContent).toContain('2–3 sachets');
    expect(container.textContent).not.toContain('quantité à préciser');
  });
  it('une dose saisie reste la dose saisie (« 2 sachets »), jamais la plage', () => {
    const r = recetteApercuEtapeLevure() as unknown as { yeast: Record<string, unknown> };
    r.yeast = { ...r.yeast, qty: 2, unit: 'sachet' };
    const { container } = render(<YeastRecipeHeading recipe={r as never} />);
    expect(container.textContent).toContain('2 sachets');
    expect(container.textContent).not.toContain('2–3');
  });
  it('sans produit connu ni dose : « quantité à préciser » (l’inconnu n’est jamais 0 ni une plage inventée)', () => {
    const { container } = render(<YeastRecipeHeading recipe={{ yeast: { name: 'Souche inconnue' }, fermentation: [] } as never} />);
    expect(container.textContent).toContain('quantité à préciser');
  });
});

describe('A-b · la fiche du récap accorde l’unité de la levure', () => {
  it('« SafAle US-05 · 2 sachets » dans l’en-tête du bloc Levure', () => {
    const base = {
      name: 'Essai', onName: vi.fn(), style: 'NEIPA', onStyle: vi.fn(), volumeL: 20, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
      carboTarget: '', onCarboTarget: vi.fn(), fermentables: [], onFermentables: vi.fn(), totalGristKg: 0, hops: [], onHops: vi.fn(), hopIbu: () => null,
      yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet' }, onYeast: vi.fn(),
      mashSteps: [], onMashSteps: vi.fn(), fermentation: [], onFermentation: vi.fn(),
      mashWaterL: 0, onMashWaterL: vi.fn(), spargeWaterL: 0, onSpargeWaterL: vi.fn(), notes: '', onNotes: vi.fn(), shortages: [],
    } as unknown as BrewSheetProps;
    const { container } = render(<BrewSheet {...base} />);
    expect(container.textContent).toContain('SafAle US-05 · 2 sachets');
  });
});
