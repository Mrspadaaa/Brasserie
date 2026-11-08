import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within, act } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { AppConfig, Batch } from '../../src/types';

/** Voie b du 08.11 : défauts ouverts du jour de brassage (TE-42, TE-43, …). */
afterEach(cleanup);

const CONFIG = { ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig;

function brassin(over: Record<string, unknown> = {}): Batch {
  return {
    id: 'LOT-1',
    name: 'Essai',
    volumeBrewedL: 20,
    recipeSnapshot: {
      id: 'R1',
      name: 'Essai',
      totalGristKg: 5,
      fermentables: [],
      hops: [],
      waterPlan: {
        sourceId: 'reseau',
        diRatioPct: 0,
        mashWaterL: 20,
        spargeWaterL: 10,
        mash: {},
        sparge: {},
        acid: { id: 'lactique', mash: 0, sparge: 0 },
        targetPh: 5.4
      }
    },
    brewDay: {
      steps: [
        { id: 'eau', label: 'Eau et sels', durationMin: 10, doneAt: 1 },
        { id: 'concassage', label: 'Concassage', durationMin: 10, doneAt: 2 },
        { id: 'mash-0', label: 'Saccharification', durationMin: 60, doneAt: 3 },
        { id: 'mash-out', label: 'Filtration', durationMin: 30 }
      ],
      currentIndex: 3,
      ...over
    }
  } as unknown as Batch;
}

const monter = (b: Batch) =>
  render(<BrewDayPage batch={b} config={CONFIG} onClose={() => {}} onSave={() => {}} onFinish={() => {}} />);

describe('TE-42 : un seul avancement', () => {
  it('le total d’étapes n’apparaît qu’une fois : « 3/4 étapes », sans second « sur 4 »', () => {
    const { container } = monter(brassin());
    const texte = container.ownerDocument.body.textContent ?? '';
    expect(texte).toMatch(/3\/4 étapes faites/);
    expect(texte).not.toMatch(/[ÉE]tape \d+ sur \d+/);
  });
});

describe('BR-49 / BE-30 : double toucher sur « Terminer et continuer »', () => {
  it('ne passe qu’une étape : la suivante n’est pas cochée à son tour', () => {
    const saved: Batch[] = [];
    const b = brassin({
      startedAt: Date.now() - 60000,
      currentIndex: 0,
      steps: [
        { id: 'eau', label: 'Eau et sels', durationMin: 10 },
        { id: 'concassage', label: 'Concassage', durationMin: 10 },
        { id: 'mash-0', label: 'Saccharification', durationMin: 60, tempC: 66 },
        { id: 'mash-out', label: 'Filtration', durationMin: 30 }
      ]
    });
    render(<BrewDayPage batch={b} config={CONFIG} onClose={() => {}} onSave={(x: Batch) => saved.push(x)} onFinish={() => {}} />);
    const bouton = screen.getByRole('button', { name: /Terminer et continuer/ });
    act(() => {
      bouton.click();
      bouton.click();
    });
    const dernier = saved[saved.length - 1];
    const etapes = (dernier.brewDay as any).steps as Array<{ id: string; doneAt?: number }>;
    expect(etapes.filter((s) => s.doneAt != null).map((s) => s.id)).toEqual(['eau']);
    expect((dernier.brewDay as any).currentIndex).toBe(1);
  });
});
