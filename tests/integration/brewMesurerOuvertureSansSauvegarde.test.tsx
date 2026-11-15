import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import type { Batch } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => cleanup());

// VB-2 : hors ligne (sans compte), toute écriture de la session passe par onSave. Ouvrir Mesurer, toucher la piste, fermer : zéro onSave.
function monter(etape: RegExp, enCours: boolean) {
  const r = recipe();
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => etape.test(s.id)));
  const state = {
    ...base,
    currentIndex: index,
    startedAt: Date.now() - 600_000,
    steps: base.steps.map((s, i) => (i === index && enCours ? { ...s, startedAt: Date.now() - 300_000 } : s))
  };
  const batch = { id: 'LOT-VB2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  const onSave = vi.fn();
  render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={onSave} onFinish={vi.fn()} />);
  return onSave;
}

describe('VB-2 : ouvrir Mesurer n’enregistre rien', () => {
  for (const etape of [/^mash/, /^sparge/, /^preboil/, /^boil|^houblon/, /^whirlpool/, /^refroidissement/, /^ensemencement/, /^kettle-cold/, /^eau/]) {
    for (const enCours of [true, false]) {
      it(`${etape} (${enCours ? 'en cours' : 'pas démarrée'}) : chaque case « Relever » ouvre sans onSave`, () => {
        const onSave = monter(etape, enCours);
        const cases = screen.queryAllByRole('button', { name: /^Relever /, hidden: false });
        for (const bouton of cases) {
          onSave.mockClear();
          fireEvent.click(bouton);
          expect(onSave, `« ${bouton.getAttribute('aria-label')} » a enregistré à l’ouverture`).not.toHaveBeenCalled();
          const fermer = screen.queryAllByRole('button', { name: /Fermer la saisie/ })[0];
          if (fermer) fireEvent.click(fermer);
          expect(onSave).not.toHaveBeenCalled();
        }
      });
    }
  }
});
