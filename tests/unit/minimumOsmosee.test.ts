import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AcidId, WaterIons } from '../../src/types';
import { HCO3_ACID_TOLERANCE_PPM, minimalDilution, minimalDilutionExhaustive, type MinimalDilutionInput } from '../../src/domain/water/dilution';
import * as solver from '../../src/domain/water/solve';
import { calculateWaterTreatment } from '../../src/domain/water/treatment';
import { calculateSpargeTreatment, lactateInBeer } from '../../src/domain/water/acid';
import { ACIDS, LACTATE_TASTE_THRESHOLD } from '../../src/domain/water/substances';
import { dilute } from '../../src/domain/water/ions';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';
import { raForGrist, raSaltCeilingForGrist, targetRaForGrist } from '../../src/domain/water/mashPh';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { STYLE_WATERS } from '../../src/domain/waterStyles';

// « Minimum trouvé d'osmosée » (15.11) : le balayage 0 → 100 % résolvait les sels à chaque pas, jusqu'au pas gagnant (10 résolutions, 52 ms
// sur la démo). Le raccourci saute les pas que le réseau rejette déjà (ion, bicarbonate : concentrations qui ne font que baisser quand
// l'osmosée monte). Ces tests tiennent le temps ET l'identité du résultat avec le balayage d'origine.

/** Entrée réelle de la recette de démonstration (21A, 28,7 + 13,8 L, 30 L de bière, 8 kg, réseau de Villars-sur-Glâne), capturée dans l'app le 15.11. */
const DEMO: MinimalDilutionInput = JSON.parse(`{"target":{"ca":106.66666666666666,"mg":0,"na":0,"so4":221,"cl":49,"hco3":0},"ranges":{"ca":{"min":80,"max":160},"mg":{"min":0,"max":20},"na":{"min":0,"max":50},"so4":{"min":175,"max":300},"cl":{"min":40,"max":80},"hco3":{"min":0,"max":60}},"mineralTargetMode":"balanced","fitBicarbonate":true,"profilePriority":true,"source":{"id":"reseau","name":"Réseau — Villars-sur-Glâne","ca":85,"mg":14,"na":8,"so4":28,"cl":22,"hco3":250,"ph":7.4},"totalWaterL":42.5,"mashWaterL":28.7,"spargeWaterL":13.8,"targetRa":{"label":"bière pâle","min":-49,"max":10,"hint":"Pils, Helles, Blonde."},"raCeiling":-157,"raPreference":-220,"ratio":4.5,"disabled":[],"allSaltsInMash":true,"acid":"lactique","hco3Range":{"min":0,"max":60},"matchMashAlkalinity":true,"mashRaCeiling":-157,"mashRaTarget":-220,"beerVolumeL":30,"sourcePh":7.4}`);

afterEach(() => vi.restoreAllMocks());

/** Générateur à graine fixe (mulberry32) : mêmes cas à chaque exécution. */
function aleatoire(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une recette tirée au hasard : réseau, style, grain, volumes, acide, doses retenues, sels coupés. */
function recetteAleatoire(rnd: () => number): MinimalDilutionInput {
  const entre = (a: number, b: number) => a + (b - a) * rnd();
  const choix = <T,>(liste: readonly T[]) => liste[Math.floor(rnd() * liste.length)];
  const style = choix(STYLE_WATERS);
  const source: WaterIons & { id: string; name: string; ph: number } = {
    id: 'alea', name: 'Réseau tiré', ph: Math.round(entre(6.8, 8.1) * 10) / 10,
    ca: Math.round(entre(5, 160)), mg: Math.round(entre(0, 40)), na: Math.round(entre(0, 90)),
    so4: Math.round(entre(0, 200)), cl: Math.round(entre(0, 120)), hco3: Math.round(entre(15, 420)),
  };
  const kg = Math.round(entre(2, 10) * 10) / 10;
  const ratio = Math.round(entre(2.5, 4.2) * 100) / 100;
  const grist = [{ kind: 'grain', use: 'empatage', weightKg: kg, colorEbc: Math.round(entre(3, 120)) }];
  const mashL = Math.round(kg * ratio * 10) / 10;
  const spargeL = rnd() < 0.2 ? 0 : Math.round(entre(5, 30) * 10) / 10;
  const mash = { ceiling: raSaltCeilingForGrist(grist, ratio), target: raForGrist(grist, ratio) };
  const acid: AcidId = choix(['lactique', 'lactique', 'phosphorique', 'maltAcidule'] as const);
  const rapport = rnd() < 0.5 ? 0.5 + rnd() * 0.5 : 0.7;
  const input: MinimalDilutionInput = {
    ...waterProfileTarget(style, source, undefined, rapport),
    ...waterTreatmentTarget(style, undefined, mash),
    source, totalWaterL: Math.round((mashL + spargeL) * 10) / 10, mashWaterL: mashL, spargeWaterL: spargeL,
    targetRa: targetRaForGrist(Math.round(entre(3, 120)), grist, ratio), raCeiling: mash.ceiling, raPreference: mash.target,
    ratio: rapport, acid, beerVolumeL: Math.round(entre(15, 60)), sourcePh: source.ph,
    allSaltsInMash: rnd() < 0.5,
  };
  if (rnd() < 0.25) input.acidOverride = { mash: Math.round(entre(0, 8) * 10) / 10, sparge: Math.round(entre(0, 10) * 10) / 10 };
  if (rnd() < 0.2) input.disabled = [choix(['gypse', 'cacl2', 'epsom', 'nacl'] as const)];
  if (rnd() < 0.15) input.profilePriority = false;
  return input;
}

/** Référence indépendante du code de recherche : la faisabilité aux 21 pas, chacun résolu en entier. */
function grilleFaisabilite(input: MinimalDilutionInput): boolean[] {
  const grille: boolean[] = [];
  for (let pct = 0; pct <= 100; pct += 5) {
    const start = dilute(input.source, pct);
    const result = solver.solveSalts({
      mineralTargetMode: input.mineralTargetMode, fitBicarbonate: input.fitBicarbonate,
      profilePriority: input.profilePriority, targetedIons: input.targetedIons,
      start, startSparge: start, target: input.target, ranges: input.ranges,
      totalWaterL: input.totalWaterL, mashWaterL: input.mashWaterL, disabled: input.disabled,
      targetRa: input.targetRa, raCeiling: input.raCeiling, raPreference: input.raPreference,
      ratio: input.ratio, allSaltsInMash: input.allSaltsInMash,
      mashAcidHco3Mg: (input.acidOverride?.mash ?? 0) * ACIDS[input.acid].hco3NeutralizedPerUnit,
      spargeHco3AfterAcid: (input.fitBicarbonate ?? input.mineralTargetMode === 'target')
        ? calculateSpargeTreatment(start, input.spargeWaterL, input.acid, { sourcePh: input.sourcePh, override: input.acidOverride?.sparge }).ions.hco3 : undefined,
    });
    const water = calculateWaterTreatment(
      { ...input.source, id: 'dilution', name: 'Eau de départ', ph: input.sourcePh },
      { diRatioPct: pct, doses: result.doses, mashWaterL: input.mashWaterL, spargeWaterL: input.spargeWaterL,
        allSaltsInMash: input.allSaltsInMash, acidId: input.acid, acidOverride: input.acidOverride,
        hco3Target: input.hco3Target, hco3Range: input.hco3Range, matchMashAlkalinity: input.matchMashAlkalinity,
        mashRaCeiling: input.raCeiling, mashRaTarget: input.raPreference }, input.targetRa,
    );
    let ok = true;
    if (input.profilePriority && assessWaterProfile(water.treatedTotal, input.ranges, input.targetedIons).deviations.length) ok = false;
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>) {
      const max = input.ranges?.[ion]?.max;
      if (max != null && Number.isFinite(max) && start[ion] > max + 2) ok = false;
    }
    const hco3Max = input.ranges?.hco3?.max;
    if (hco3Max != null && Number.isFinite(hco3Max) && start.hco3 > hco3Max + HCO3_ACID_TOLERANCE_PPM) ok = false;
    if (input.acid === 'lactique' && input.beerVolumeL > 0
      && lactateInBeer(water.mashAcid.amount + water.spargeAcid.amount, input.beerVolumeL) > LACTATE_TASTE_THRESHOLD) ok = false;
    grille.push(ok);
  }
  return grille;
}

describe('Minimum d’osmosée : le raccourci tient le temps', () => {
  it('démo (45 %) : au plus 4 résolutions de sels sur 21 possibles (10 avant), et moins de 30 ms', () => {
    const solve = vi.spyOn(solver, 'solveSalts');
    const resultat = minimalDilution(structuredClone(DEMO));
    expect(resultat).toMatchObject({ feasible: true, pct: 45 });
    expect(solve.mock.calls.length).toBeLessThanOrEqual(4);
    solve.mockRestore();
    // Meilleur de huit passes à froid (entrée neuve à chaque fois) : un ordinateur occupé ne doit pas faire échouer le test.
    let meilleur = Infinity;
    for (let i = 0; i < 8; i++) {
      const entree = structuredClone(DEMO);
      const t0 = performance.now();
      minimalDilution(entree);
      meilleur = Math.min(meilleur, performance.now() - t0);
    }
    expect(meilleur).toBeLessThan(30);
  });
});

describe('Minimum d’osmosée : résultat identique au balayage d’origine', () => {
  it('démo : même résultat que le balayage complet', () => {
    expect(minimalDilution(structuredClone(DEMO))).toEqual(minimalDilutionExhaustive(structuredClone(DEMO)));
  });

  it('80 recettes tirées au hasard (graine fixe) : mêmes pct, raisons, doses d’acide, proposition ; et même pas que la grille indépendante', () => {
    const rnd = aleatoire(20261115);
    let faisables = 0, non = 0, coupes = 0;
    for (let i = 0; i < 80; i++) {
      const input = recetteAleatoire(rnd);
      const rapide = minimalDilution(structuredClone(input));
      const complet = minimalDilutionExhaustive(structuredClone(input));
      expect(rapide, `cas ${i}`).toEqual(complet);
      if (rapide.feasible) faisables++; else non++;
      if (rapide.pct > 0) coupes++;
      if (!input.disabled) {
        const grille = grilleFaisabilite(input);
        const premier = grille.indexOf(true);
        if (rapide.feasible) expect(rapide.pct, `cas ${i} grille`).toBe(premier * 5);
        else expect(grille[20], `cas ${i} grille`).toBe(false);
      }
    }
    // Le tirage couvre bien les trois situations : réseau suffisant (0 %), coupe nécessaire, impossible.
    expect(faisables).toBeGreaterThan(10);
    expect(non).toBeGreaterThan(3);
    expect(coupes).toBeGreaterThan(10);
  }, 120000);
});
