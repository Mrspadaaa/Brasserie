// NUIT-G2 (27.11, couverture G) : un relevé de densité noté le jour de l'ensemencement, égal à la DO du brassin, dessinait un second point
// et une seconde étiquette « 1,062 » sur « DO 1,062 » (illisible). Le relevé du jour 0 égal à la DO se confond avec elle (son °C est gardé).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { modeleFiche } from '../../src/ui/production/fermentation/modele';
import { geometrie, GrapheTemps } from '../../src/ui/production/fermentation/GrapheTemps';

const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const lot = (gravityLog: unknown[]): Batch => ({
  id: 'ZZ-G2', name: 'ZZ TEST IPA', style: 'IPA', status: 'fermentation', volumeL: 25, brewDate: '10.11.2026', og: '1,062', gravityLog,
  brewDay: { pitchedAt: Date.UTC(2026, 10, 10, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { fgTarget: 1.012, hops: [], fermentation: [{ kind: 'primaire', days: 5, tempC: 19 }] }
} as unknown as Batch);

describe('Fiche de fermentation : DO et relevé du jour 0', () => {
  it('un relevé du jour 0 égal à la DO ne fait ni second point ni seconde étiquette', () => {
    const m = modeleFiche(lot([{ date: '10.11.2026', sg: 1.062, tempC: 19.5 }, { date: '13.11.2026', sg: 1.03 }]), NOW)!;
    expect(m.points.filter((p) => p.jour === 0)).toHaveLength(1);
    expect(m.points[0]).toMatchObject({ og: true, tempC: 19.5 });
    const html = renderToStaticMarkup(<svg><GrapheTemps m={m} g={geometrie(342, m.nbJours, false)} /></svg>);
    expect(html.match(/1,062/g)).toHaveLength(1);
  });

  it('un relevé du jour 0 différent de la DO reste un point à part', () => {
    const m = modeleFiche(lot([{ date: '10.11.2026', sg: 1.058 }]), NOW)!;
    expect(m.points.filter((p) => p.jour === 0)).toHaveLength(2);
  });
});
