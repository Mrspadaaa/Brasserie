import { describe, expect, it } from 'vitest';
import { mesuresAttendues, raisonMesure } from '../../src/domain/brewMeasures';
import { departCurseur, formatCurseur, pasCurseur, poserSurPas } from '../../src/domain/measureSlider';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const MIN = 60000;
const T0 = 1_700_000_000_000;
const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
const state = (readings: BrewDayReading[] = [], step = palier): BrewDayState => ({ steps: [step], currentIndex: 0, readings });
const recette = { ogTarget: 1.062, volumeL: 24 } as unknown as RecipeSnapshot;

describe('mesures attendues par étape (VB-1 : « ça invite pas aux mesures »)', () => {
  it('au palier d’empâtage : la température maintenant, le pH dès 10 min, chacune à vide (« ? », jamais 0)', () => {
    const a = mesuresAttendues(palier, state(), recette, T0 + 2 * MIN);
    expect(a.map((m) => m.kind)).toEqual(['temperature', 'ph']);
    expect(a[0]).toMatchObject({ nom: 'Maische', cible: '67 °C', due: true, quand: 'maintenant' });
    expect(a[0].reading).toBeUndefined();
    expect(a[1]).toMatchObject({ nom: 'pH d’empâtage', cible: '5,2–5,5', due: false });
    expect(a[1].quand).toMatch(/^dès \d{1,2} h \d{2}$/);
  });
  it('le pH devient dû 10 min après le départ du palier', () => {
    const a = mesuresAttendues(palier, state(), recette, T0 + 10 * MIN);
    expect(a[1]).toMatchObject({ kind: 'ph', due: true, quand: 'maintenant' });
  });
  it('un relevé rangé à l’étape remplit sa case (valeur, heure), l’autre reste vide', () => {
    const r: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    const a = mesuresAttendues(palier, state([r]), recette, T0 + 4 * MIN);
    expect(a[0].reading?.value).toBe(66.4);
    expect(a[1].reading).toBeUndefined();
  });
  it('un relevé d’une autre étape ne remplit rien', () => {
    const r: BrewDayReading = { id: 'r1', at: T0, stepId: 'mash-0', kind: 'temperature', value: 52, unit: '°C' };
    expect(mesuresAttendues(palier, state([r]), recette, T0 + MIN)[0].reading).toBeUndefined();
  });
  it('mashout (≥ 75 °C) : la température seule', () => {
    const mashout: BrewDayStep = { id: 'mash-2', label: 'Mashout', durationMin: 10, tempC: 76, startedAt: T0 };
    expect(mesuresAttendues(mashout, state([], mashout), recette, T0).map((m) => m.kind)).toEqual(['temperature']);
  });
  it('ensemencement : densité initiale (cible OG) et volume au fermenteur (cible recette)', () => {
    const e: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    const a = mesuresAttendues(e, state([], e), recette, T0);
    expect(a.map((m) => m.kind)).toEqual(['densite', 'volume']);
    expect(a[0].cible).toBe('1,062');
    expect(a[1].cible).toBe('24 L');
  });
  it('une cible inconnue n’est pas inventée', () => {
    const e: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    const a = mesuresAttendues(e, state([], e), {} as RecipeSnapshot, T0);
    expect(a.every((m) => m.cible === undefined)).toBe(true);
  });
  it('étape terminée ou sans mesure : aucune invitation', () => {
    expect(mesuresAttendues({ ...palier, doneAt: T0 + 5 * MIN }, state(), recette, T0 + 6 * MIN)).toEqual([]);
    const pause: BrewDayStep = { id: 'boil', label: 'Ébullition', durationMin: 60 };
    expect(mesuresAttendues(pause, state([], pause), recette, T0)).toEqual([]);
  });
  it('chaque mesure a sa raison à un toucher', () => {
    expect(raisonMesure('ph', palier)).toMatch(/5,2/);
    expect(raisonMesure('temperature', palier)).toMatch(/cœur/);
    expect(raisonMesure('densite', { id: 'ensemencement', label: '', durationMin: 0 })).toMatch(/alcool/);
    expect(raisonMesure('volume', { id: 'ensemencement', label: '', durationMin: 0 })).toMatch(/rendement/);
  });
});

describe('curseur de mesure : pas fins, départ, format', () => {
  it('les pas du brasseur : pH 0,01 · °C 0,1 · densité 0,001 · L 0,1', () => {
    expect(pasCurseur('ph')).toEqual({ pas: 0.01, decimales: 2 });
    expect(pasCurseur('temperature')).toEqual({ pas: 0.1, decimales: 1 });
    expect(pasCurseur('densite')).toEqual({ pas: 0.001, decimales: 3 });
    expect(pasCurseur('volume')).toEqual({ pas: 0.1, decimales: 1 });
  });
  it('poserSurPas arrondit au pas sans dérive flottante', () => {
    expect(poserSurPas('temperature', 64.30000000000001, 61, 73)).toBe(64.3);
    expect(poserSurPas('densite', 1.0584, 1.05, 1.074)).toBe(1.058);
    expect(poserSurPas('ph', 5.3549, 5, 5.8)).toBe(5.35);
    expect(poserSurPas('temperature', 80, 61, 73)).toBe(73);
    expect(poserSurPas('temperature', 10, 61, 73)).toBe(61);
  });
  it('départ du pouce : le dernier relevé, sinon le milieu de la cible', () => {
    const echelle = { min: 61, max: 73, bandMin: 66, bandMax: 68 };
    expect(departCurseur('temperature', echelle)).toBe(67);
    expect(departCurseur('temperature', echelle, 66.4)).toBe(66.4);
  });
  it('le texte posé a la virgule et les décimales du pas', () => {
    expect(formatCurseur('temperature', 67)).toBe('67,0');
    expect(formatCurseur('ph', 5.35)).toBe('5,35');
    expect(formatCurseur('densite', 1.062)).toBe('1,062');
    expect(formatCurseur('volume', 24)).toBe('24,0');
  });
});
