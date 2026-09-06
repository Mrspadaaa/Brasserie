import { describe, expect, it } from 'vitest';
import {
  completeBrewStep,
  finalBrewReadings,
  parseReading,
  readingFeedback,
  restoreBrewDay,
  startBrewStep
} from '../../src/domain/brewDay';
import { buildTimeline, remainingMs } from '../../src/services/brewTimer';
import { BrewDayState, Recipe } from '../../src/types';

const recipe = (boilMin = 60): Recipe =>
  ({
    name: 'Test',
    boilMin,
    hops: [
      { name: 'Amer', stage: 'boil', timeMin: 60, weightG: 20 },
      { name: 'Arôme', stage: 'boil', timeMin: 10, weightG: 25 },
      { name: 'FWH', stage: 'firstWort', weightG: 10 }
    ],
    fermentables: [
      { kind: 'grain', use: 'empatage', name: 'Pils', weightKg: 5 },
      { kind: 'sugar', use: 'ebullition', name: 'Sucre', weightKg: 0.5 }
    ],
    mash: {
      steps: [{ name: 'Mash', tempC: 67, durationMin: 60 }],
      spargeType: 'batch'
    }
  }) as Recipe;

describe('Déroulé réel de la cuve', () => {
  it('place le premier moût avant le rinçage et les sucres dix minutes avant la fin', () => {
    const steps = buildTimeline(recipe());
    expect(steps.findIndex((s) => s.id === 'fwh')).toBeLessThan(
      steps.findIndex((s) => s.id === 'sparge')
    );
    expect(steps.find((s) => s.id === 'sucres')?.boilElapsedMin).toBe(50);
    expect(steps.at(-3)?.id).toBe('boil-fin');
  });
  it('balaye 180 durées : segments positifs, ajouts bornés, ébullition exacte', () => {
    for (let min = 0; min <= 180; min++) {
      const r = recipe(min);
      r.hops.push({
        name: 'Erreur saisie',
        stage: 'boil',
        timeMin: -5,
        weightG: 10
      });
      const steps = buildTimeline(r);
      expect(
        steps.filter((s) => s.id.startsWith('boil-')).reduce((sum, s) => sum + s.durationMin, 0)
      ).toBe(min);
      for (const s of steps) {
        expect(s.durationMin).toBeGreaterThanOrEqual(0);
        if (s.boilElapsedMin != null) expect(s.boilElapsedMin).toBeLessThanOrEqual(min);
      }
    }
  });
  it('confirmer un ajout avec douze minutes de retard ne prolonge pas l’ébullition', () => {
    let s: BrewDayState = {
      steps: buildTimeline(recipe()).filter((x) => x.boilElapsedMin != null),
      currentIndex: 0
    };
    s = completeBrewStep(s, 1000); // houblon de départ, horloge ancrée
    s = completeBrewStep(s, 62 * 60000 + 1000); // segment 50 min terminé 12 min trop tard
    s = completeBrewStep(s, 63 * 60000 + 1000); // houblon
    s = completeBrewStep(s, 64 * 60000 + 1000); // sucre
    expect(remainingMs(s.steps[s.currentIndex], 64 * 60000 + 1000)).toBe(-4 * 60000);
  });
  it('un palier attend sa température, pause et reprise survivent au rechargement', () => {
    let s: BrewDayState = {
      currentIndex: 0,
      steps: [
        { id: 'mash-0', label: 'Mash', durationMin: 60 },
        { id: 'mashout', label: 'Mashout', durationMin: 10 }
      ]
    };
    s = startBrewStep(s, 0);
    s.steps[0].pausedAt = 10 * 60000;
    s = restoreBrewDay(JSON.parse(JSON.stringify(s)));
    expect(remainingMs(s.steps[0], 30 * 60000)).toBe(50 * 60000);
    s = startBrewStep(s, 30 * 60000);
    expect(remainingMs(s.steps[0], 40 * 60000)).toBe(40 * 60000);
    s = completeBrewStep(s, 80 * 60000);
    expect(s.steps[1].startedAt).toBeUndefined();
  });
  it('préserve un ancien déroulé et restaure son horloge sans effacer les mesures', () => {
    const s: BrewDayState = {
      currentIndex: 1,
      steps: [
        {
          id: 'boil-0',
          label: 'Boil',
          durationMin: 45,
          startedAt: 1000,
          doneAt: 2701000
        },
        { id: 'hop-45', label: 'Hop', durationMin: 0 }
      ],
      readings: [{ at: 1, kind: 'ph', value: 5.4, unit: '' }]
    };
    const restored = restoreBrewDay(s);
    expect(restored.boilStartedAt).toBe(1000);
    expect(restored.steps.map((x) => x.id)).toEqual(s.steps.map((x) => x.id));
    expect(restored.readings).toEqual(s.readings);
  });
});

describe('Saisie et contexte des mesures', () => {
  it('accepte la virgule et les points de densité', () => {
    expect(parseReading('5,7', 'ph')).toBe(5.7);
    expect(parseReading('1056', 'densite')).toBe(1.056);
    expect(parseReading('1.056', 'densite')).toBe(1.056);
  });
  it('rejette les collages hostiles sans valeur partielle', () => {
    for (const kind of ['ph', 'temperature', 'volume', 'densite'] as const)
      for (const raw of [
        '',
        ' ',
        'NaN',
        'Infinity',
        '5.7abc',
        '<script>',
        '1e100',
        '1,2.3',
        '--5',
        '100000000000',
        '0x10',
        '-9999'
      ])
        expect(parseReading(raw, kind), `${kind}:${raw}`).toBeNull();
    expect(parseReading('0', 'ph')).toBeNull();
    expect(parseReading('-5', 'temperature')).toBe(-5);
    expect(parseReading('-5', 'volume')).toBeNull();
  });
  it('ne confond jamais collecte, volume en cuve, et volume final en fermenteur', () => {
    const s: BrewDayState = {
      steps: [],
      currentIndex: 0,
      readings: [
        { at: 1, kind: 'densite', value: 1.044, unit: 'SG', stepId: 'preboil' },
        {
          at: 2,
          kind: 'volume',
          value: 32,
          unit: 'L',
          stepId: 'refroidissement'
        },
        { at: 3, kind: 'ph', value: 5.7, unit: '' }
      ]
    };
    expect(finalBrewReadings(s)).toEqual({
      gravity: undefined,
      volume: undefined
    });
    s.readings!.push(
      {
        at: 4,
        kind: 'densite',
        value: 1.056,
        unit: 'SG',
        stepId: 'refroidissement'
      },
      { at: 5, kind: 'volume', value: 25, unit: 'L', stepId: 'ensemencement' }
    );
    expect(finalBrewReadings(s).gravity?.value).toBe(1.056);
    expect(finalBrewReadings(s).volume?.value).toBe(25);
  });
  it('pas de comparaison OG avant ébullition ni d’acide proposé au rinçage', () => {
    expect(
      readingFeedback('densite', 1.04, { id: 'preboil', label: 'x', durationMin: 0 }, {
        ogTarget: 1.06
      } as never).tone
    ).toBe('neutral');
    expect(readingFeedback('ph', 6, { id: 'sparge', label: 'x', durationMin: 0 }).detail).toMatch(
      /aucune dose/
    );
  });
});
