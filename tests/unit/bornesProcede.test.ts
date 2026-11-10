import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { monSuperStout } from '../fixtures/monSuperStout';
import type { Recipe } from '../../src/types';
import {
  additifsIssues, empatageIssues, eauIssues, fermentationIssues, levureIssues, momentAdditif, normaliserAdditif, procedeManques,
  recipeAdvice, rendementIssue, uniteAdditif,
} from '../../src/domain/bornesProcede';
import { recipeReadiness, recipeSaveIssues } from '../../src/domain/recipeValidation';

const stout = () => structuredClone(monSuperStout);
const full = () => structuredClone(fullRecipe);
const champs = (issues: Array<{ field: string }>) => issues.map(i => i.field);

describe('Procédé : la recette de départ est saine', () => {
  it('ne produit aucune erreur de procédé sur la recette de référence', () => {
    const r = stout();
    expect(recipeSaveIssues(r).filter(i => i.live)).toEqual([]);
  });
});

describe('AM-25, MV-23, MV-24, MV-27 : paliers d’empâtage', () => {
  it('refuse 0 °C, 100 °C et 999 °C, accepte 35 à 80 °C', () => {
    for (const t of [0, 20, 34, 81, 100, 999]) expect(champs(empatageIssues([{ name: 'Sacch.', tempC: t, durationMin: 60 }]))).toEqual(['wz-mash-temp-0']);
    for (const t of [35, 45, 52, 63, 67, 72, 76, 78, 80]) expect(empatageIssues([{ name: 'x', tempC: t, durationMin: 60 }])).toEqual([]);
  });
  it('refuse 99 999 min de maintien, garde 0 min (mash-out atteint sans maintien) et 240 min', () => {
    expect(champs(empatageIssues([{ name: 'Sacch.', tempC: 67, durationMin: 99999 }]))).toEqual(['wz-mash-duration-0']);
    expect(empatageIssues([{ name: 'Mash-out', tempC: 76, durationMin: 0 }])).toEqual([]);
    expect(empatageIssues([{ name: 'Long', tempC: 67, durationMin: 240 }])).toEqual([]);
  });
  it('arrive à l’enregistrement : un palier à 100 °C est une valeur à corriger, dite dès la frappe', () => {
    const r = stout(); r.mash!.steps[0].tempC = 100;
    const issue = recipeSaveIssues(r).find(i => i.field === 'wz-mash-temp-0');
    expect(issue?.live).toBe(true);
    expect(issue?.message).toContain('100');
    expect(recipeReadiness(r).status).toBe('invalid');
  });
});

describe('AM-25 : conseils d’ordre et de mash-out', () => {
  it('signale 72 °C puis 63 °C, sans bloquer', () => {
    const r = stout(); r.mash!.steps = [{ name: 'α', tempC: 72, durationMin: 20 }, { name: 'β', tempC: 63, durationMin: 40 }];
    expect(champs(recipeAdvice(r))).toEqual(['wz-mash-temp-1']);
    expect(recipeSaveIssues(r).filter(i => i.field.startsWith('wz-mash'))).toEqual([]);
  });
  it('signale un « mash-out » à 50 °C, pas à 76 °C', () => {
    const r = stout(); r.mash!.steps = [{ name: 'Mash-out', tempC: 50, durationMin: 10 }];
    expect(recipeAdvice(r)).toHaveLength(1);
    r.mash!.steps = [{ name: 'Mashout', tempC: 76, durationMin: 10 }];
    expect(recipeAdvice(r)).toEqual([]);
  });
  it('un programme du catalogue (protéique, β, α, mashout) est dans l’ordre', () => {
    const r = stout(); r.mash!.steps = [{ name: 'Repos protéique', tempC: 52, durationMin: 20 }, { name: 'β-amylase', tempC: 63, durationMin: 40 }, { name: 'α-amylase', tempC: 72, durationMin: 20 }, { name: 'Mashout', tempC: 76, durationMin: 10 }];
    expect(recipeAdvice(r)).toEqual([]);
  });
});

describe('AM-27, AM-28, BR-32, BR-33, MV-28, MV-29 : fermentation', () => {
  it('refuse −1 000, 99 °C et 9 999 j ; accepte la garde à −1 °C et le kveik à 38 °C', () => {
    expect(champs(fermentationIssues([{ name: 'P', tempC: 99, days: 10 }]))).toEqual(['wz-ferment-temp-0']);
    expect(champs(fermentationIssues([{ name: 'P', tempC: -50, days: 10 }]))).toEqual(['wz-ferment-temp-0']);
    expect(champs(fermentationIssues([{ name: 'P', tempC: 19, days: 9999 }]))).toEqual(['wz-ferment-days-0']);
    expect(fermentationIssues([{ name: 'Garde', tempC: -1, days: 35 }, { name: 'Kveik', tempC: 38, days: 4 }, { name: 'Lambic', tempC: 15, days: 365 }])).toEqual([]);
  });
  it('signale un repos diacétyle ou une primaire après la garde', () => {
    const r = stout();
    r.fermentation = [
      { kind: 'primaire', name: 'Primaire', tempC: 11, days: 14 },
      { kind: 'garde', name: 'Garde', tempC: 1, days: 35 },
      { kind: 'reposDiacetyle', name: 'Repos diacétyle', tempC: 18, days: 2 },
    ];
    expect(champs(recipeAdvice(r))).toEqual(['wz-ferment-temp-2']);
    r.fermentation = [r.fermentation[0], r.fermentation[2], r.fermentation[1]];
    expect(recipeAdvice(r)).toEqual([]);
  });
});

describe('AM-21, AM-22, AM-23, BR-26, MV-34 : levure', () => {
  const y = (patch: Partial<Recipe['yeast']>): Recipe['yeast'] => ({ name: 'US-05', form: 'sèche', ...patch });
  it('refuse −50 °C et 400 °C d’ensemencement', () => {
    for (const t of [-50, 400, -1, 41]) expect(champs(levureIssues(y({ pitchTempC: t }), 20))).toEqual(['wz-yeast-pitch']);
    for (const t of [0, 1, 2, 10, 18, 26.5, 40]) expect(levureIssues(y({ pitchTempC: t }), 20)).toEqual([]);
  });
  it('refuse une atténuation de 0 % ou 100 %', () => {
    for (const a of [0, 100, 150, 0.4]) expect(champs(levureIssues(y({ attenuationPct: a }), 20))).toEqual(['wz-yeast-range']);
    for (const a of [5, 65, 81, 95, 99]) expect(levureIssues(y({ attenuationPct: a }), 20)).toEqual([]);
  });
  it('rapporte la dose au volume : 99 999 g, 99 999 kg, 50 sachets pour 20 L, 99 999 L de levain', () => {
    expect(champs(levureIssues(y({ qty: 99999, unit: 'g' }), 20))).toEqual(['wz-yeast-qty']);
    expect(champs(levureIssues(y({ qty: 99999, unit: 'kg' }), 20))).toEqual(['wz-yeast-qty']);
    expect(champs(levureIssues(y({ qty: 50, unit: 'sachet' }), 20))).toEqual(['wz-yeast-qty']);
    expect(champs(levureIssues(y({ qty: 99999, unit: 'L' }), 20))).toEqual(['wz-yeast-qty']);
    expect(champs(levureIssues(y({ qty: 5000, unit: 'mL' }), 20))).toEqual(['wz-yeast-qty']);
  });
  it('accepte les doses de la pratique', () => {
    expect(levureIssues(y({ qty: 11.5, unit: 'g' }), 20)).toEqual([]);   // un sachet
    expect(levureIssues(y({ qty: 2, unit: 'sachet' }), 20)).toEqual([]);
    expect(levureIssues(y({ qty: 1, unit: 'sachet' }), 5)).toEqual([]);   // 1 sachet pour 5 L : le plus petit brassin
    expect(levureIssues(y({ qty: 2, unit: 'L' }), 100)).toEqual([]);     // levain pour 1 hL
    expect(levureIssues(y({ qty: 1, unit: 'kg' }), 200)).toEqual([]);    // crème à l'échelle de la brasserie
    expect(levureIssues(y({ qty: 5, unit: 'sachet' }), 30)).toEqual([]); // fixture stout
  });
  it('un volume inconnu ne déclenche rien (inconnu ≠ 0)', () => {
    expect(levureIssues(y({ qty: 99999, unit: 'g' }), Number.NaN)).toEqual([]);
    expect(levureIssues(y({ qty: 3 }), 20)).toEqual([]);   // sans unité : à préciser, pas une borne
  });
});

describe('AM-24 : rendement', () => {
  it('refuse 96 % et 100 %, garde 30 à 95 %', () => {
    for (const p of [96, 100, 150, 5]) expect(rendementIssue(p)?.field).toBe('wz-efficiency');
    for (const p of [30, 65, 75, 82, 95]) expect(rendementIssue(p)).toBeNull();
    expect(rendementIssue(undefined)).toBeNull();
  });
  it('arrive à l’enregistrement', () => {
    const r = stout(); r.efficiencyPct = 100;
    expect(recipeSaveIssues(r).some(i => i.field === 'wz-efficiency' && i.live)).toBe(true);
  });
});

describe('AM-29, AM-30, AM-31, BR-23, BR-83, MV-30, MV-32, MV-33 : eau', () => {
  const base = () => ({ ...stout() });
  it('eau d’empâtage 0 L pour 9,1 kg de grain : refusée (MV-30)', () => {
    const r = base(); r.waterPlan!.mashWaterL = 0;
    expect(champs(eauIssues(r))).toEqual(['wz-mash-water']);
  });
  it('0 L d’empâtage et 0 L de rinçage : un plan d’eau non posé, un manque et non une erreur', () => {
    const r = base(); r.waterPlan!.mashWaterL = 0; r.waterPlan!.spargeWaterL = 0; r.waterPlan!.mash = {}; r.waterPlan!.acid = { id: 'lactique', mash: 0, sparge: 0 };
    expect(eauIssues(r)).toEqual([]);
    expect(procedeManques(r).map(m => m.field)).toContain('wz-mash-water');
  });
  it('eau d’empâtage −1 L (BR-23) : refusée par la règle d’enregistrement existante, et par la mienne si elle passe', () => {
    const r = base(); r.waterPlan!.mashWaterL = -1;
    expect(recipeSaveIssues(r).some(i => i.field === 'wz-mash-water')).toBe(true);
  });
  it('0,63 L/kg (MV-32) refusé, 1,5 L/kg accepté, 13 L/kg refusé', () => {
    const r = base(); r.totalGristKg = 8;
    r.waterPlan!.mashWaterL = 5; expect(champs(eauIssues(r))).toEqual(['wz-mash-water']);
    r.waterPlan!.mashWaterL = 12; expect(eauIssues(r)).toEqual([]);
    r.waterPlan!.mashWaterL = 8 * 13; r.waterPlan!.spargeWaterL = 0;
    expect(champs(eauIssues(r))).toEqual(expect.arrayContaining(['wz-mash-water']));
  });
  it('rinçage de 99 999 L pour 30 L de bière (BR-83) : refusé', () => {
    const r = base(); r.waterPlan!.spargeWaterL = 99999;
    expect(champs(eauIssues(r))).toEqual(['wz-sparge-water']);
  });
  it('rinçage 0 L et empâtage seul : une eau sans rinçage est une pratique (BIAB)', () => {
    const r = base(); r.waterPlan!.mashWaterL = 40; r.waterPlan!.spargeWaterL = 0;
    expect(eauIssues(r)).toEqual([]);
  });
  it('500 g de gypse dans 45 L (MV-33, AM-30) : refusé ; 5 g : accepté', () => {
    const r = base(); r.waterPlan!.mash = { gypse: 500 };
    expect(champs(eauIssues(r))).toEqual(['wz-salts']);
    r.waterPlan!.mash = { gypse: 5.3, mgcl2: 2.2, kcl: 4.3 };
    expect(eauIssues(r)).toEqual([]);
  });
  it('un profil Burton (gypse ~1,4 g/L) reste permis, jamais l’eau de mer', () => {
    const r = base(); r.waterPlan!.mashWaterL = 20; r.totalGristKg = 5; r.waterPlan!.spargeWaterL = 10;
    r.waterPlan!.mash = { gypse: 28, cacl2: 5 };
    expect(eauIssues(r)).toEqual([]);
    r.waterPlan!.mash = { nacl: 200 };
    expect(champs(eauIssues(r))).toEqual(['wz-salts']);
  });
  it('500 mL d’acide lactique pour 45 L : refusé ; 7,5 mL : accepté', () => {
    const r = base(); r.waterPlan!.acid = { id: 'lactique', mash: 500, sparge: 0 };
    expect(champs(eauIssues(r))).toEqual(['wz-acid']);
    r.waterPlan!.acid = { id: 'lactique', mash: 7.5, sparge: 0 };
    expect(eauIssues(r)).toEqual([]);
  });
  it('pH visé 9 ou 2 : refusé (AM-31)', () => {
    const r = base();
    for (const ph of [2, 9]) { r.waterPlan!.targetPh = ph; expect(champs(eauIssues(r))).toEqual(['wz-target-ph']); }
    r.waterPlan!.targetPh = 5.4; expect(eauIssues(r)).toEqual([]);
  });
  it('NOLO « seconds moûts » : aucun rapport eau/grain exigé', () => {
    const r = base(); r.nolo = { enabled: true, process: 'secondRunnings' } as Recipe['nolo']; r.waterPlan!.mashWaterL = 2; r.waterPlan!.mash = {}; r.waterPlan!.acid = { id: 'lactique', mash: 0, sparge: 0 };
    expect(eauIssues(r)).toEqual([]);
  });
});

describe('AM-32 : additifs', () => {
  it('refuse une quantité négative ou NaN', () => {
    expect(champs(additifsIssues([{ name: 'Coriandre', amount: -5, unit: 'g', step: 'Ébullition' }]))).toEqual(['wz-adjunct-0']);
    expect(champs(additifsIssues([{ name: 'Coriandre', amount: Number.NaN, unit: 'g', step: 'Ébullition' }]))).toEqual(['wz-adjunct-0']);
    expect(additifsIssues([{ name: 'Coriandre', amount: 0, unit: 'g', step: 'Ébullition' }])).toEqual([]);
  });
  it('ramène unité et moment du texte libre aux valeurs connues, laisse le reste tel quel', () => {
    expect(uniteAdditif('ML')).toBe('mL');
    expect(uniteAdditif('Grammes')).toBe('g');
    expect(uniteAdditif('cuillère')).toBeNull();
    expect(momentAdditif('Empattage')).toBe('Empâtage');
    expect(momentAdditif('fin d’ébullition (5 min)')).toBe('Ébullition');
    expect(momentAdditif('Flame out')).toBe('Whirlpool');
    expect(momentAdditif('en fermentation')).toBe('Fermenteur');
    expect(momentAdditif('à la mise en bouteille')).toBe('Embouteillage');
    expect(momentAdditif('quand ça me chante')).toBeNull();
    expect(normaliserAdditif({ name: 'x', amount: 1, unit: 'gr', step: 'fermentation' })).toMatchObject({ unit: 'g', step: 'Fermenteur' });
    expect(normaliserAdditif({ name: 'x', amount: 1, unit: 'cuillère', step: 'dès que' })).toMatchObject({ unit: 'cuillère', step: 'dès que' });
  });
});

describe('AM-26 : une recette prête a un empâtage, une fermentation et un plan d’eau', () => {
  it('manques : sans palier, sans phase, sans plan d’eau', () => {
    const r = stout(); r.mash = { steps: [] }; r.fermentation = []; delete r.waterPlan;
    expect(procedeManques(r).map(m => m.field)).toEqual(['wz-mash-list', 'wz-ferment-list', 'wz-mash-water']);
    expect(recipeReadiness(r).missing.map(m => m.field)).toEqual(expect.arrayContaining(['wz-mash-list', 'wz-ferment-list', 'wz-mash-water']));
    expect(recipeReadiness(r).status).not.toBe('ready');
  });
  it('la recette de référence complète est prête', () => {
    const r = full();
    expect(procedeManques(r)).toEqual([]);
  });
});
