import { describe, expect, it } from 'vitest';
import { densiteAvantEbullition, measuredReadingFeedback, refroidiParDefaut } from '../../src/domain/brewDay';
import { mesuresAttendues } from '../../src/domain/brewMeasures';
import { actualBrewDate, brewSessionDatePatch, hasBrewStarted } from '../../src/domain/batchSchedule';
import type { BrewDateSession } from '../../functions/src/batchSchedule';
import { CLOTURE_VIDE, cloturePartirDe } from '../../src/ui/BrewClotureReleves';
import { phraseRetard } from '../../src/services/brewTimer';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

/**
 * Paquet vérité du jour de brassage (mission brassage-zero, voie v1). Règles de calcul seulement ;
 * le reste du paquet se prouve à l'écran.
 */
const etat = (): BrewDayState => ({ currentIndex: 0, steps: [], readings: [] });
const releve = (kind: BrewDayReading['kind'], value: number, stepId: string): BrewDayReading => ({
  at: 1, stepId, kind, value, unit: kind === 'temperature' ? '°C' : kind === 'volume' ? 'L' : kind === 'densite' ? 'SG' : '', roomTemp: true
});
const recette = (extra: Partial<RecipeSnapshot> = {}): RecipeSnapshot => ({ name: 'NEIPA', volumeL: 19, ogTarget: 1.061, ...extra }) as RecipeSnapshot;

describe('1. une seule source de cible et d’écart', () => {
  it('Mashout 77,5 °C pour une consigne de 76 : « +0,5 au-dessus de la cible 75–77 °C », pas « +1,5 · cible 76 »', () => {
    const step: BrewDayStep = { id: 'mashout', label: 'Mashout', durationMin: 10, tempC: 76 };
    const f = measuredReadingFeedback(releve('temperature', 77.5, 'mashout'), etat(), step, recette());
    expect(f.title).toBe('+0,5 au-dessus de la cible 75–77 °C');
    expect(f.tone).toBe('watch');
    expect(f.title).not.toMatch(/1,5|Écart/);
  });
  it('Refroidissement 19,5 °C pour 18 : la même phrase que la feuille (bande 17–19)', () => {
    const step: BrewDayStep = { id: 'refroidissement', label: 'Refroidissement', durationMin: 0, tempC: 18 };
    const f = measuredReadingFeedback(releve('temperature', 19.5, 'refroidissement'), etat(), step, recette());
    expect(f.title).toBe('+0,5 au-dessus de la cible 17–19 °C');
  });
  it('Ensemencement 1,064 pour une OG de 1,061 : un seul écart, « +0,001 au-dessus de la cible 1,059–1,063 SG » (plus « +3 points »)', () => {
    const step: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    const f = measuredReadingFeedback(releve('densite', 1.064, 'ensemencement'), etat(), step, recette());
    expect(f.title).toBe('+0,001 au-dessus de la cible 1,059–1,063 SG');
    expect(f.title).not.toMatch(/points/);
  });
  it('la borne exacte est dans la cible, et le volume au fermenteur a une seule plage, celle de la feuille', () => {
    const step: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    expect(measuredReadingFeedback(releve('densite', 1.063, 'ensemencement'), etat(), step, recette()).tone).toBe('ok');
    const v = measuredReadingFeedback(releve('volume', 17, 'ensemencement'), etat(), step, recette());
    expect(v.title).toBe('−1,1 sous la cible 18,1–20 L');
  });
});

describe('2. rien ne démarre le brassin en silence', () => {
  const t = Date.UTC(2026, 10, 11, 8);
  const lot = (brewDay: BrewDateSession) => ({ status: 'planifie', plannedBrewDate: '15.09.2026', brewDate: '', brewDay });
  it('une mesure à Préparer (eau, concassage) ne dit pas « Commencé le » et ne pose aucune date réelle', () => {
    for (const stepId of ['eau', 'concassage']) {
      const l = lot({ readings: [{ at: t, kind: 'ph', value: 5.5, unit: '', stepId }] });
      expect(hasBrewStarted(l)).toBe(false);
      expect(actualBrewDate(l)).toBeUndefined();
      expect(brewSessionDatePatch(l, l.brewDay)).toEqual({});
    }
  });
  it('une mesure à l’empâtage ou au refroidissement, ou un palier démarré, commence bien le brassin', () => {
    expect(hasBrewStarted(lot({ readings: [{ at: t, kind: 'temperature', value: 66, unit: '°C', stepId: 'mash' }] }))).toBe(true);
    expect(hasBrewStarted(lot({ steps: [{ startedAt: t }] }))).toBe(true);
    expect(hasBrewStarted(lot({ startedAt: t }))).toBe(true);
  });
});

describe('3. la densité à l’ensemencement est refroidie d’office', () => {
  it('cochée sans relevé, décochable, et le choix d’un relevé déjà noté se respecte', () => {
    expect(refroidiParDefaut('densite', 'ensemencement')).toBe(true);
    expect(refroidiParDefaut('densite', 'ensemencement', false)).toBe(false);
    expect(refroidiParDefaut('densite', 'ensemencement', true)).toBe(true);
  });
  it('pas d’office ailleurs : ni l’ébullition, ni le pH, ni le volume', () => {
    expect(refroidiParDefaut('densite', 'preboil')).toBe(false);
    expect(refroidiParDefaut('ph', 'mash')).toBe(false);
    expect(refroidiParDefaut('volume', 'ensemencement')).toBe(false);
  });
  it('la clôture part cochée sans relevé, et garde le refus d’un relevé déjà au journal', () => {
    expect(cloturePartirDe({}).densiteRefroidie).toBe(true);
    expect(CLOTURE_VIDE.densiteRefroidie).toBe(true);
    expect(cloturePartirDe({ densite: { value: 1.06, roomTemp: false } }).densiteRefroidie).toBe(false);
    expect(cloturePartirDe({ densite: { value: 1.06, roomTemp: true } }).densiteRefroidie).toBe(true);
    expect(cloturePartirDe({}).volumeRefroidi).toBe(false);
  });
});

describe('7. un ajout échu dit son retard', () => {
  it('« en retard de 4 min » (plancher), « maintenant » sous la minute, rien avant l’échéance', () => {
    expect(phraseRetard(-4 * 60000 - 30000)).toEqual({ court: 'en retard de 4 min', retard: true });
    expect(phraseRetard(-59000)).toEqual({ court: 'maintenant', retard: false });
    expect(phraseRetard(0)).toEqual({ court: 'maintenant', retard: false });
    expect(phraseRetard(1000)).toBeNull();
    expect(phraseRetard(NaN)).toBeNull();
  });
  it('au-delà d’une heure : « en retard de 1 h 05 »', () => {
    expect(phraseRetard(-65 * 60000)).toEqual({ court: 'en retard de 1 h 05', retard: true });
  });
});

describe('11. cible de densité avant ébullition : conservation des points', () => {
  const avecEquipement = (extra: Record<string, unknown> = {}, eq: Record<string, unknown> = {}) =>
    recette({ boilMin: 60, preBoilHotL: 24, brewhouse: { equipment: { boilOffLPerHour: 4, ...eq } }, ...extra } as Partial<RecipeSnapshot>);
  it('OG 1,061, 24 L avant, 4 L/h pendant 60 min : 1 + 0,061 × 20/24 = 1,051', () => {
    expect(densiteAvantEbullition(avecEquipement())).toBe(1.051);
  });
  it('sans litres après évaporation (preBoilL et rétraction) : même méthode', () => {
    const r = avecEquipement({ preBoilHotL: undefined, preBoilL: 23.04 }, { coolingShrinkagePct: 4 });
    expect(densiteAvantEbullition(r)).toBe(1.051);
  });
  it('une donnée manque (évaporation, durée, volume avant, OG) : pas de cible, jamais 0', () => {
    expect(densiteAvantEbullition(recette())).toBeUndefined();
    expect(densiteAvantEbullition(avecEquipement({}, { boilOffLPerHour: undefined }))).toBeUndefined();
    expect(densiteAvantEbullition(avecEquipement({ boilMin: undefined }))).toBeUndefined();
    expect(densiteAvantEbullition(avecEquipement({ preBoilHotL: undefined }))).toBeUndefined();
    expect(densiteAvantEbullition(avecEquipement({ ogTarget: undefined }))).toBeUndefined();
    expect(densiteAvantEbullition(undefined)).toBeUndefined();
  });
  it('la case « Densité avant ébullition » de la feuille porte la bande 1,049–1,053, ou rien', () => {
    const step: BrewDayStep = { id: 'preboil', label: 'Avant ébullition', durationMin: 0 };
    const densite = (r: RecipeSnapshot) => mesuresAttendues(step, etat(), r, 1).find((m) => m.kind === 'densite');
    expect(densite(avecEquipement())?.cible).toBe('1,049–1,053');
    expect(densite(recette())?.cible).toBeUndefined();
  });
});
