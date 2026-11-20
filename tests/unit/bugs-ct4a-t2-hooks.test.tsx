// @vitest-environment jsdom
// ct4a tour 2 : la feuille d'un brassin se ferme (batch → null) sans « Rendered fewer hooks » : le calcul de la plage de FG de la levure (CT4-B-11) ne
// s'appuie sur aucun hook posé après le retour anticipé de la feuille. Rouge avant le correctif (rendu avec un hook de moins quand `batch` disparaît).
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));

import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';

afterEach(() => cleanup());

const lot = {
  id: 'ZZ-HOOKS', name: 'ZZ Stout', style: 'Stout', status: 'fermentation', volumeL: 20, volumeBrewedL: 29, brewDate: '10.11.2026', og: '1,064',
  gravityLog: [{ date: '11.11.2026', sg: 1.05, tempC: 19 }], stockAccountingVersion: 1,
  stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] },
  brewDay: { pitchedAt: Date.UTC(2026, 10, 10, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { name: 'ZZ Stout', volumeL: 20, ogTarget: 1.064, steps: [], notes: [], fermentables: [], hops: [], yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 3, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', days: 6, tempC: 19 }] }
} as unknown as Batch;

describe('BatchDetailSheet : même nombre de hooks ouverte ou fermée', () => {
  it('une feuille de mesures ouverte puis fermée (batch → null) ne lève pas d’erreur de hooks', () => {
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = render(<BatchDetailSheet batch={lot} initialSection="measurements" onClose={() => undefined} />);
    expect(() => rerender(<BatchDetailSheet batch={null} initialSection="measurements" onClose={() => undefined} />)).not.toThrow();
    erreur.mockRestore();
  });
});
