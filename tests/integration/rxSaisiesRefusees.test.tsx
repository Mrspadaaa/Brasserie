// Voie RX (08.11) : une valeur refusée ne disparaît jamais en silence (TE-21, RX-2) ; une ligne de houblon se voit toujours (RX-4).
// Fixtures simulées, aucune donnée réelle.
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { allerEtape } from '../helpers/wizard';
import { defaultConfig } from '../../src/services/storage';
import type { Recipe } from '../../src/types';

afterEach(cleanup);

const base = {
  id: 'R-rx', name: 'Test', style: 'NEIPA', volumeL: 20, boilMin: 60, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, totalGristKg: 5,
  fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 4, potentialPpg: 37 }],
  hops: [{ name: 'Citra', weightG: 30, alpha: 12, stage: 'boil', timeMin: 10 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet', attenuationPct: 81, lab: 'Fermentis', fermTempMinC: 18, fermTempMaxC: 22 },
  mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }], spargeType: 'batch' },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }],
  steps: [], notes: [],
} as unknown as Recipe;

function wizard(recipe: Recipe = base) {
  return render(
    <BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={['NEIPA']} onSave={vi.fn()} onClose={vi.fn()}
      onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />,
  );
}
const taper = (el: HTMLElement, v: string) => { fireEvent.focus(el); fireEvent.change(el, { target: { value: v } }); };
const sortir = (el: HTMLElement) => fireEvent.blur(el);
const messages = () => screen.queryAllByRole('status').map((n) => n.textContent ?? '').join(' | ');

describe('TE-21 / RX-2 — étape Houblons : une valeur refusée est dite', () => {
  it('α 150 % : le champ dit pourquoi et la recette ne garde pas 150', () => {
    wizard(); allerEtape(/^Houblons$/);
    const alpha = screen.getByLabelText('Alpha de Citra en pourcent');
    taper(alpha, '150'); sortir(alpha);
    expect(messages()).toMatch(/α 150 %/);
    expect(messages()).toMatch(/30 %/);
  });
  it('minutes 777 : dit, avec la borne', () => {
    wizard(); allerEtape(/^Houblons$/);
    const t = screen.getByLabelText('Minutes avant la fin pour Citra');
    taper(t, '777'); sortir(t);
    expect(messages()).toMatch(/777 min/);
    expect(messages()).toMatch(/240 min/);
  });
  it('minutes −5 : dit', () => {
    wizard(); allerEtape(/^Houblons$/);
    const t = screen.getByLabelText('Minutes avant la fin pour Citra');
    taper(t, '-5'); sortir(t);
    expect(messages()).toMatch(/-5 min est hors bornes : de 0 à 240 min/);
  });
  it('dose −1 g : dit', () => {
    wizard(); allerEtape(/^Houblons$/);
    const d = document.getElementById('wz-hop-0') as HTMLInputElement;
    taper(d, '-1'); sortir(d);
    expect(messages()).toMatch(/-1 g est hors bornes/);
  });
  it('une saisie valable ensuite efface le message', () => {
    wizard(); allerEtape(/^Houblons$/);
    const t = screen.getByLabelText('Minutes avant la fin pour Citra');
    taper(t, '777'); sortir(t);
    expect(messages()).toMatch(/777 min/);
    taper(t, '30'); sortir(t);
    expect(messages()).not.toMatch(/777/);
  });
});

describe('RX-4 — les lignes de houblon ne sont pas dans un repli', () => {
  it('chaque ligne de la recette est hors de tout <details> fermé', () => {
    const deux = { ...base, hops: [...base.hops, { name: 'Mosaic', weightG: 20, alpha: 11, stage: 'whirlpool', timeMin: 20, tempC: 80 }] } as unknown as Recipe;
    wizard(deux); allerEtape(/^Houblons$/);
    for (const nom of ['Citra', 'Mosaic']) {
      const ligne = screen.getByLabelText(`Retirer ${nom}`);
      const repli = ligne.closest('details');
      expect(repli, `${nom} est dans un repli`).toBeNull();
    }
  });
});
