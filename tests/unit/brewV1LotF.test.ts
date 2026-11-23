import { describe, expect, it } from 'vitest';
import { cibleMesure, phraseQuantiteLevure, volumeTarget } from '../../src/domain/brewDay';
import { bornesPlausibles } from '../../src/domain/measureSlider';
import { measureScale } from '../../src/ui/BrewDayMeasurements';
import type { BrewDayStep, RecipeSnapshot } from '../../src/types';

const etape = (id: string): BrewDayStep => ({ id, label: id, durationMin: 0 }) as BrewDayStep;
// NEIPA du banc : 19 L au fermenteur, 18,5 L d'eau d'empâtage, 11,5 L de rinçage, 5 kg de grain (absorption 0,96 L/kg).
const neipa = {
  name: 'NEIPA',
  volumeL: 19,
  ogTarget: 1.061,
  totalGristKg: 5,
  waterPlan: { mashWaterL: 18.5, spargeWaterL: 11.5 }
} as unknown as RecipeSnapshot;
const avantEbullition = 18.5 + 11.5 - 5 * 0.96; // 25,2

describe('lot F (13) : le volume de Mesurer a la cible de l’étape', () => {
  it('eau d’empâtage à Eau et sels et à Concassage, jamais le fermenteur', () => {
    expect(volumeTarget(etape('eau'), neipa)).toBe(18.5);
    expect(volumeTarget(etape('concassage'), neipa)).toBe(18.5);
  });
  it('volume avant ébullition au Premier moût, au contrôle et à l’ébullition', () => {
    for (const id of ['fwh', 'preboil', 'boil-0', 'hop-1']) expect(volumeTarget(etape(id), neipa)).toBeCloseTo(avantEbullition, 5);
  });
  it('fermenteur seulement au refroidissement et à l’ensemencement', () => {
    expect(volumeTarget(etape('refroidissement'), neipa)).toBe(19);
    expect(volumeTarget(etape('ensemencement'), neipa)).toBe(19);
  });
  it('la piste ne tombe plus sur 19 partout : bande à 18,5 à Eau et sels, 25,2 à l’ébullition, 19 au fermenteur', () => {
    const eau = measureScale('volume', etape('eau'), neipa);
    expect(eau.cible).toBe(true);
    expect((eau.bandMin + eau.bandMax) / 2).toBeCloseTo(18.5, 5);
    const boil = measureScale('volume', etape('boil-0'), neipa);
    expect((boil.bandMin + boil.bandMax) / 2).toBeCloseTo(avantEbullition, 5);
    const ferm = measureScale('volume', etape('ensemencement'), neipa);
    expect((ferm.bandMin + ferm.bandMax) / 2).toBe(19);
  });
  it('sans cible d’étape : pas de bande ni de repère (le fermenteur n’est pas un repli)', () => {
    expect(cibleMesure('volume', etape('mashout'), neipa)).toBeNull();
    const p = bornesPlausibles('volume', etape('whirlpool'), neipa);
    expect(p.repere).toBe(false);
    expect(p.milieu).not.toBe(19);
    const s = measureScale('volume', etape('whirlpool'), neipa);
    expect(s.cible).toBe(false);
    expect(s.ticks).toEqual([s.min, s.max]);
  });
  it('sans plan d’eau : l’inconnu n’est pas un volume', () => {
    expect(volumeTarget(etape('eau'), { volumeL: 19 } as RecipeSnapshot)).toBeUndefined();
    expect(volumeTarget(etape('fwh'), { volumeL: 19 } as RecipeSnapshot)).toBeUndefined();
  });
});

describe('lot F (14) : la clôture ne dit « mesurée » que pour une quantité pesée', () => {
  it('« 1 sachet » choisi d’un toucher : « choisi, non pesé »', () => {
    const t = phraseQuantiteLevure('1 sachet', 1, 'sachet', 'sans dose prévue');
    expect(t).toBe('1 sachet choisi, non pesé · sans dose prévue.');
    expect(t).not.toMatch(/mesurée/i);
  });
  it('2 sachets : accordé', () => {
    expect(phraseQuantiteLevure('2 sachets', 2, 'sachets', 'sans dose prévue')).toBe('2 sachets choisis, non pesés · sans dose prévue.');
  });
  it('une masse pesée : « Quantité mesurée »', () => {
    expect(phraseQuantiteLevure('11,5 g', 11.5, 'g', 'Dose prévue : 11 g')).toBe('Quantité mesurée : 11,5 g · Dose prévue : 11 g.');
  });
});
