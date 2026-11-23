import { describe, expect, it } from 'vitest';
import { PH_APRES_MIN, aEcrire, appelPalier, ecartTexte, ecrireReleves, formatPh, horsCible } from '../../src/domain/appelMesure';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const MIN = 60000;
const T0 = 1_700_000_000_000;
const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
const etat = (readings: BrewDayReading[] = [], steps: BrewDayStep[] = [palier]): BrewDayState => ({ steps, currentIndex: 0, readings });
const recette = (targetPh?: number) => ({ waterPlan: targetPh == null ? undefined : { targetPh } }) as unknown as RecipeSnapshot;

describe('l’appel du palier : ce que la carte propose (pm1)', () => {
  it('palier lancé : la température du palier posée sur la cible, « proposée », à relever', () => {
    const a = appelPalier(palier, etat(), recette(5.3), T0 + 5 * MIN)!;
    expect(a.temperature).toMatchObject({ kind: 'temperature', propose: 67, due: true });
    expect(a.temperature.cible).toEqual({ min: 66, max: 68 });
    expect(a.temperature.releve).toBeUndefined();
  });

  it('le pH est à 15′ : pas dû à 14 min 59, dû à 15 min, compté depuis le premier palier lancé (l’empâtage)', () => {
    const suite: BrewDayStep = { id: 'mash-2', label: 'Mashout', durationMin: 10, tempC: 70, startedAt: T0 + 40 * MIN };
    const avant = appelPalier(palier, etat([], [palier]), recette(5.3), T0 + PH_APRES_MIN * MIN - 1000)!;
    expect(PH_APRES_MIN).toBe(15);
    expect(avant.ph).toMatchObject({ kind: 'ph', due: false });
    expect(appelPalier(palier, etat([], [palier]), recette(5.3), T0 + PH_APRES_MIN * MIN)!.ph?.due).toBe(true);
    // 2e palier à 70 °C lancé à T0+40 : le pH se compte depuis l'empâtage, pas depuis ce palier
    expect(appelPalier(suite, etat([], [palier, suite]), recette(5.3), T0 + 41 * MIN)!.ph?.due).toBe(true);
  });

  it('le pH proposé est le pH visé de la recette ; sans lui, le milieu de la bande du code ; jamais 0', () => {
    const a = appelPalier(palier, etat(), recette(5.3), T0)!;
    expect(a.ph).toMatchObject({ propose: 5.3, cible: { min: 5.2, max: 5.5 } });
    const sans = appelPalier(palier, etat(), recette(), T0)!;
    expect(sans.ph?.propose).toBeCloseTo(5.35, 5);
    const absurde = appelPalier(palier, etat(), recette(0), T0)!;
    expect(absurde.ph?.propose).toBeCloseTo(5.35, 5);
  });

  it('cible inconnue : aucune valeur proposée, aucune bande (« — », jamais inventée ni 0)', () => {
    const sansCible: BrewDayStep = { ...palier, tempC: undefined };
    const a = appelPalier(sansCible, etat([], [sansCible]), recette(), T0)!;
    expect(a.temperature.propose).toBeNull();
    expect(a.temperature.cible).toBeNull();
    expect(a.temperature.echelle.max).toBeGreaterThan(a.temperature.echelle.min);
  });

  it('mashout (≥ 75 °C) : la température seule', () => {
    const mashout: BrewDayStep = { id: 'mash-3', label: 'Mashout', durationMin: 10, tempC: 76, startedAt: T0 };
    expect(appelPalier(mashout, etat([], [mashout]), recette(5.3), T0)!.ph).toBeNull();
  });

  it('pas d’appel avant le lancement, ni hors empâtage, ni étape faite, ni brassin fini', () => {
    expect(appelPalier({ ...palier, startedAt: undefined }, etat(), recette(), T0)).toBeNull();
    expect(appelPalier({ id: 'sparge', label: 'Rinçage', durationMin: 20, tempC: 76, startedAt: T0 }, etat(), recette(), T0)).toBeNull();
    expect(appelPalier({ ...palier, doneAt: T0 + MIN }, etat(), recette(), T0)).toBeNull();
    expect(appelPalier(palier, { ...etat(), finishedAt: T0 + 2 * MIN }, recette(), T0)).toBeNull();
  });

  it('un relevé déjà au journal est repris (température de l’étape, pH de tout l’empâtage), rien n’est rempli à la place du brasseur', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    const p: BrewDayReading = { id: 'r2', at: T0 + 16 * MIN, stepId: 'mash-0', kind: 'ph', value: 5.31, unit: '' };
    const avant: BrewDayStep = { id: 'mash-0', label: 'Empâtage', durationMin: 15, tempC: 55, startedAt: T0 - 30 * MIN, doneAt: T0 };
    const a = appelPalier(palier, etat([t, p], [avant, palier]), recette(5.3), T0 + 20 * MIN)!;
    expect(a.temperature.releve?.value).toBe(66.4);
    expect(a.ph?.releve?.value).toBe(5.31);
    const ailleurs: BrewDayReading = { id: 'r3', at: T0, stepId: 'sparge', kind: 'temperature', value: 76, unit: '°C' };
    expect(appelPalier(palier, etat([ailleurs]), recette(), T0)!.temperature.releve).toBeUndefined();
  });
});

describe('rien n’est noté sans son toucher', () => {
  const a = () => appelPalier(palier, etat(), recette(5.3), T0 + 5 * MIN)!;

  it('« Relever » confirme la température proposée ; le pH pas encore dû et pas touché n’est pas écrit', () => {
    expect(aEcrire(a(), {})).toEqual([{ kind: 'temperature', value: 67 }]);
  });

  it('un pH touché s’écrit même avant ses 15′ ; la température touchée remplace la proposée', () => {
    expect(aEcrire(a(), { temperature: 66.4, ph: 5.28 })).toEqual([{ kind: 'temperature', value: 66.4 }, { kind: 'ph', value: 5.28 }]);
  });

  it('pH dû mais pas touché : « Relever » ne l’écrit pas (un pH se lit au pH-mètre, il ne se confirme pas)', () => {
    const due = appelPalier(palier, etat(), recette(5.3), T0 + 16 * MIN)!;
    expect(due.ph?.due).toBe(true);
    expect(aEcrire(due, {})).toEqual([{ kind: 'temperature', value: 67 }]);
    expect(aEcrire(due, { ph: 5.33 })).toEqual([{ kind: 'temperature', value: 67 }, { kind: 'ph', value: 5.33 }]);
  });

  it('cible inconnue et curseur intact : rien à écrire (jamais une valeur inventée)', () => {
    const sansCible: BrewDayStep = { ...palier, tempC: undefined };
    const x = appelPalier(sansCible, etat([], [sansCible]), recette(), T0)!;
    expect(aEcrire(x, {})).toEqual([]);
    expect(aEcrire(x, { temperature: 64.2 })).toEqual([{ kind: 'temperature', value: 64.2 }]);
  });

  it('une carte déjà relevée n’est pas réécrite', () => {
    const t: BrewDayReading = { id: 'r1', at: T0 + 3 * MIN, stepId: 'mash-1', kind: 'temperature', value: 66.4, unit: '°C' };
    const x = appelPalier(palier, etat([t]), recette(5.3), T0 + 16 * MIN)!;
    expect(aEcrire(x, {})).toEqual([]);
    expect(aEcrire(x, { ph: 5.3 })).toEqual([{ kind: 'ph', value: 5.3 }]);
  });

  it('« Plus tard » n’appelle rien : l’état est identique tant qu’on n’écrit pas', () => {
    const e = etat();
    expect(e.readings).toEqual([]);
    expect(appelPalier(palier, e, recette(5.3), T0 + 5 * MIN)!.temperature.releve).toBeUndefined();
  });
});

describe('l’écriture passe par la forme des relevés existants', () => {
  it('température : milieu « wort », rattachée à la série de chauffe ouverte ; pH : échantillon non refroidi par défaut (comme la carte Maintenant)', () => {
    const ouvert = { ...etat(), thermalSegments: [{ id: 'seg-1', stepId: 'mash-1', method: 'heating', startedAt: T0, targetC: 67 }] } as unknown as BrewDayState;
    let n = 0;
    const apres = ecrireReleves(ouvert, palier, [{ kind: 'temperature', value: 67 }, { kind: 'ph', value: 5.3 }], T0 + 20 * MIN, () => `id-${++n}`);
    expect(apres.readings).toHaveLength(2);
    expect(apres.readings![0]).toMatchObject({ id: 'id-1', at: T0 + 20 * MIN, stepId: 'mash-1', kind: 'temperature', value: 67, unit: '°C', medium: 'wort', thermalSegmentId: 'seg-1' });
    expect(apres.readings![1]).toMatchObject({ id: 'id-2', kind: 'ph', value: 5.3, unit: '', roomTemp: false });
    expect(apres.readings![1]).not.toHaveProperty('medium');
  });

  it('n’écrit rien sans valeur et ne touche pas l’état d’origine', () => {
    const e = etat();
    expect(ecrireReleves(e, palier, [], T0, () => 'x')).toBe(e);
    ecrireReleves(e, palier, [{ kind: 'ph', value: 5.3 }], T0, () => 'x');
    expect(e.readings).toEqual([]);
  });
});

describe('le pH s’écrit à la virgule, sans zéro de trop', () => {
  it('5,3 · 5,35 · 5,4', () => {
    expect(formatPh(5.3)).toBe('5,3');
    expect(formatPh(5.35)).toBe('5,35');
    expect(formatPh(5.4)).toBe('5,4');
    expect(formatPh(5)).toBe('5,0');
  });
});

describe('10 · l’écart s’écrit à la cible affichée, la tolérance est écrite (critique pm1)', () => {
  const carteT = () => appelPalier(palier, etat(), recette(5.3), T0 + 5 * MIN)!.temperature;
  const carteP = () => appelPalier(palier, etat(), recette(5.3), T0 + 5 * MIN)!.ph!;

  it('68,5 contre 67 : « +1,5 au-dessus », avec la bande « cible 66 à 68 » écrite', () => {
    expect(ecartTexte(carteT(), 68.5)).toBe('+1,5 au-dessus · cible 66 à 68');
  });
  it('65,2 : « −1,8 sous · cible 66 à 68 » (l’écart à 67, pas au bord)', () => {
    expect(ecartTexte(carteT(), 65.2)).toBe('−1,8 sous · cible 66 à 68');
  });
  it('dans la bande : « dans la cible 66 à 68 », jamais un écart au bord', () => {
    expect(ecartTexte(carteT(), 67.5)).toBe('dans la cible 66 à 68');
    expect(ecartTexte(carteT(), 67)).toBe('dans la cible 66 à 68');
  });
  it('le pH : l’écart au bord de la bande qui est écrite', () => {
    expect(ecartTexte(carteP(), 5.6)).toBe('+0,1 au-dessus · cible 5,2 à 5,5');
    expect(ecartTexte(carteP(), 5.34)).toBe('dans la cible 5,2 à 5,5');
  });
  it('la cible inconnue ne donne aucun écart', () => {
    const sans: BrewDayStep = { ...palier, tempC: undefined };
    const a = appelPalier(sans, etat([], [sans]), recette(), T0)!;
    expect(ecartTexte(a.temperature, 60)).toBe('');
  });
  it('« hors cible » se lit sur la bande, pas sur le texte', () => {
    expect(horsCible(carteT(), 68.5)).toBe(true);
    expect(horsCible(carteT(), 67.9)).toBe(false);
    expect(horsCible(carteP(), 5.1)).toBe(true);
  });
});
