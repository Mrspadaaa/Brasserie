import { describe, expect, it } from 'vitest';
import {
  actualAmount,
  brewIngredients,
  brewAlarms,
  brewBitterness,
  changeBoilMinutes,
  effectiveFermentables,
  maltAlternatives,
  measuredEfficiency,
  mineralFeedback,
  isUsefulTimer
} from '../../src/domain/brewCompanion';
import { startBrewStep, restoreBrewDay } from '../../src/domain/brewDay';
import { recipe, brewState, malt } from '../fixtures/brewCompanion';

describe('Compagnon de cuve : tâches et horloges', () => {
  it('aucun minuteur de concassage, eau, rinçage ou refroidissement', () => {
    const s = brewState();
    for (const id of ['eau', 'concassage', 'sparge', 'refroidissement']) {
      const step = s.steps.find((x) => x.id === id)!;
      expect(step.durationMin).toBe(0);
      expect(isUsefulTimer(step)).toBe(false);
    }
  });
  it('les alarmes suivent les paliers actifs même si l’écran est ailleurs', () => {
    const r = recipe();
    let s = brewState(r);
    s.currentIndex = s.steps.findIndex((x) => x.id === 'mash-0');
    s = startBrewStep(s, 1000);
    s.currentIndex = 0;
    const a = brewAlarms(s, r)[0];
    expect(a.at).toBe(3601000);
    expect(a.body).toContain('76 °C');
    expect(brewAlarms(restoreBrewDay(JSON.parse(JSON.stringify(s))), r)).toEqual([a]);
  });
  it('une pause retire le rappel, reprendre conserve la durée restant à faire', () => {
    const r = recipe();
    let s = brewState(r);
    s.currentIndex = s.steps.findIndex((x) => x.id === 'mash-0');
    s = startBrewStep(s, 1000);
    s.steps[s.currentIndex].pausedAt = 601000;
    expect(brewAlarms(s, r)).toEqual([]);
    s = startBrewStep(s, 1801000);
    expect(brewAlarms(s, r)[0].at).toBe(4801000);
  });
  it('allonger l’ébullition déplace les ajouts restants sans recréer ceux déjà versés', () => {
    const r = recipe();
    const s = brewState(r, {
      boilStartedAt: 1000,
      additions: { 'hop-0': { amount: 20, doneAt: 1000 } }
    });
    const n = changeBoilMinutes(s, r, 15);
    expect(brewAlarms(n, r).map((a) => a.at)).toEqual([3901000, 4501000]);
    expect(brewAlarms(n, r).some((a) => a.id.includes('hop-0'))).toBe(false);
    expect(n.additions!['hop-0'].doneAt).toBe(1000);
    expect(r.boilMin).toBe(60);
    expect(brewAlarms({ ...n, finishedAt: 2000 }, r)).toEqual([]);
    expect(brewAlarms({ ...n, boilFinishedAt: 2000 }, r)).toEqual([]);
  });
  it('regroupe les ajouts simultanés ; ignore les ajouts de poids nul et le dry hop', () => {
    const r = recipe();
    r.hops.push({ ...r.hops[1], name: 'Amarillo' });
    const s = brewState(r, { boilStartedAt: 1000, additions: { 'hop-0': { amount: 0 } } });
    const a = brewAlarms(s, r);
    expect(a).toHaveLength(2);
    expect(a[0].body).toContain('Citra');
    expect(a[0].body).toContain('Amarillo');
    expect(a[0].body).not.toContain('Mosaic');
    expect(new Set(brewIngredients(r).map((i) => i.id)).size).toBe(brewIngredients(r).length);
  });
  it('balayage des durées : échéances bornées, stables au rechargement, doses intactes', () => {
    const r = recipe();
    for (let duration = 1; duration <= 480; duration += 7) {
      const s = changeBoilMinutes(brewState(r, { boilStartedAt: 100000 }), r, duration - 60);
      const a = brewAlarms(s, r);
      expect(
        a.every((x) => Number.isFinite(x.at) && x.at >= 100000 && x.at <= 100000 + duration * 60000)
      ).toBe(true);
      expect(brewAlarms(restoreBrewDay(JSON.parse(JSON.stringify(s))), r)).toEqual(a);
      expect(actualAmount(brewIngredients(r).find((i) => i.id === 'hop-0')!, s)).toBe(20);
    }
  });
});
describe('Écarts minéraux, sans nouveau solveur', () => {
  it('une ancienne recette sans analyse fournit des apports minimaux, jamais une eau connue inventée', () => {
    const r = recipe();
    delete r.waterPlan!.startIons;
    const result = mineralFeedback(
      r,
      brewState(r, { additions: { 'salt-mash-epsom': { amount: 15 } } })
    )!;
    expect(result.knownBase).toBe(false);
    expect(result.ions.mg).toBeCloseTo((15 * 98.6) / 30, 0);
  });
  it('compte le supplément réel de magnésium et fournit une dilution, sans dose acide inventée', () => {
    const r = recipe();
    const before = mineralFeedback(r, brewState(r))!;
    const s = brewState(r, { additions: { 'salt-mash-epsom': { amount: 15, doneAt: 100 } } });
    const result = mineralFeedback(r, s)!;
    expect(result.ions.mg - before.ions.mg).toBeCloseTo((14 * 98.6) / 30, 0);
    expect(result.warnings.some((w) => w.includes('Magnésium'))).toBe(true);
    expect(result.extraRO).toBeGreaterThan(0);
    expect(result.added).toBe(true);
    expect(r.waterPlan!.mash.epsom).toBe(1);
  });
  it('une correction acide abaisse HCO3 sans faire disparaître Mg', () => {
    const r = recipe();
    const s = brewState(r);
    const a = mineralFeedback(r, s)!;
    const b = mineralFeedback(r, { ...s, additions: { 'acid-mash': { amount: 5 } } })!;
    expect(b.ions.hco3).toBeLessThan(a.ions.hco3);
    expect(b.ions.mg).toBe(a.ions.mg);
  });
  it('neutralise chaque eau séparément avant de pondérer les HCO3 du journal', () => {
    const r = recipe();
    r.waterPlan!.acid = { id: 'lactique', mash: 1, sparge: 3 };
    const s = brewState(r);
    // Empâtage : 120 − 1 × 600 / 20 = 90 ; rinçage : max(0, 120 − 180) = 0.
    expect(mineralFeedback(r, s)!.ions.hco3).toBe(60);
    const moreSparge = { ...s, additions: { 'acid-sparge': { amount: 4 } } };
    expect(mineralFeedback(r, moreSparge)!.ions.hco3).toBe(60);
    expect(mineralFeedback(r, { ...moreSparge, additions: {
      ...moreSparge.additions, 'acid-mash': { amount: 0 }
    } })!.ions.hco3).toBe(80);
    const corrected = { ...s, acidCorrections: [{
      id: 'acid-correction', stepId: 'sparge', at: 100, readingAt: 50,
      acid: 'phosphorique' as const, amount: 2
    }] };
    expect(mineralFeedback(r, corrected)!.ions.hco3).toBe(60);
    corrected.acidCorrections[0].stepId = 'mash-0';
    expect(mineralFeedback(r, corrected)!.ions.hco3).toBe(10);
  });
  it('retrouve la bonne source depuis un snapshot v2 pondéré entre deux coupes', () => {
    const r = recipe();
    Object.assign(r.waterPlan!, {
      treatmentVersion: 2, diRatioPct: 50, spargeDiRatioPct: 0,
      mash: {}, sparge: {}, acid: { id: 'lactique', mash: 0, sparge: 1 },
      startIons: { ca: 60, mg: 6, na: 12, so4: 30, cl: 24, hco3: 120 }
    });
    // Source : 180 ppm ; empâtage : 90 ; rinçage après 1 mL : 120.
    expect(mineralFeedback(r, brewState(r))!.ions.hco3).toBe(100);
  });
  it('empâtage et rinçage à des coupes différentes sont pondérés correctement', () => {
    const r = recipe();
    r.waterPlan!.mash = {};
    r.waterPlan!.acid = undefined;
    r.waterPlan!.diRatioPct = 50;
    r.waterPlan!.spargeDiRatioPct = 100;
    r.waterPlan!.startIons = { ca: 50, mg: 5, na: 10, so4: 20, cl: 30, hco3: 100 };
    const result = mineralFeedback(r, brewState(r))!;
    expect(result.ions.ca).toBeCloseTo((100 * 0.5 * 20) / 30, 0);
    r.waterPlan!.diRatioPct = 100;
    r.waterPlan!.spargeDiRatioPct = 0;
    r.waterPlan!.startIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };
    r.waterPlan!.wortIons = {
      ca: 100 / 3,
      mg: 10 / 3,
      na: 20 / 3,
      so4: 40 / 3,
      cl: 20,
      hco3: 200 / 3
    };
    expect(mineralFeedback(r, brewState(r))!.ions.ca).toBeCloseTo(100 / 3, 0);
  });
  it('garde une cible personnalisée et ne confond pas dépassement de style et repère sensoriel', () => {
    const r = recipe();
    r.waterPlan!.targetIons = { ca: 30, mg: 0, na: 5, so4: 0, cl: 40, hco3: 30 };
    r.waterPlan!.targetName = 'Ma ronde';
    const result = mineralFeedback(
      r,
      brewState(r, { additions: { 'salt-mash-epsom': { amount: 4 } } })
    )!;
    expect(result.style!.name).toBe('Ma ronde');
    expect(result.outside).toContain('mg');
    expect(result.warnings).toEqual([]);
  });
});
describe('Substitution et rendement', () => {
  it('repousser la fin augmente le contact des houblons déjà versés et l’IBU projeté', () => {
    const r = recipe();
    const s = brewState(r, {
      boilStartedAt: 1000,
      additions: { 'hop-0': { amount: 20, doneAt: 1000 }, 'hop-1': { amount: 30, doneAt: 3001000 } }
    });
    const b = brewBitterness(r, s)!;
    expect(b.projected).toBe(b.planned);
    expect(brewBitterness(r, changeBoilMinutes(s, r, 15))!.projected).toBeGreaterThan(b.projected);
    const n = changeBoilMinutes(s, r, 15);
    n.boilFinishedAt = 3601000;
    expect(brewBitterness(r, n)!.projected).toBe(b.projected);
  });
  it('équivalents disponibles, bonne matière première, masse corrigée du potentiel', () => {
    const f = recipe().fermentables[0];
    const choices = maltAlternatives(f, 5, [
      malt('Pils', 10, 4, 38),
      malt('Wheat', 10, 4, 38),
      malt('Carapils', 10, 4, 38),
      malt('Acidulé', 10, 4, 38),
      malt('Flaked barley', 10, 4, 38),
      malt('Munich', 10, 15, 38),
      malt('Pale bis', 1, 5, 38)
    ]);
    expect(choices.map((x) => x.item.name)).toEqual(['Pils']);
    expect(choices[0].kg).toBe(4.74);
  });
  it('un potentiel inconnu du remplaçant ne reprend pas celui du malt initial', () => {
    const r = recipe();
    const s = brewState(r, {
      additions: { 'grain-0': { amount: 5, replacement: { name: 'Pale sans fiche', colorEbc: 5 } } }
    });
    expect(effectiveFermentables(r, s)[0].potentialPpg).toBeUndefined();
    s.readings = [
      { at: 1, stepId: 'preboil', kind: 'densite', value: 1.04, unit: 'SG' },
      { at: 1, stepId: 'preboil', kind: 'volume', value: 25, unit: 'L' }
    ];
    expect(measuredEfficiency(r, s, 'preboil').known).toBe(false);
  });
  it('25 L à 1.040 avec 5 kg à 36 PPG donnent environ 66,6 %', () => {
    const r = recipe();
    const s = brewState(r, {
      readings: [
        { at: 1, stepId: 'preboil', kind: 'densite', value: 1.04, unit: 'SG', roomTemp: true },
        { at: 1, stepId: 'preboil', kind: 'volume', value: 25, unit: 'L', roomTemp: true }
      ]
    });
    expect(measuredEfficiency(r, s, 'preboil')).toMatchObject({
      known: true,
      pct: 66.6,
      approximate: false
    });
    s.readings![1].roomTemp = false;
    expect(measuredEfficiency(r, s, 'preboil')).toMatchObject({ approximate: true });
  });
  it('les sucres directs ne gonflent pas l’extraction du grain ; les ajouts ébullition attendent', () => {
    const r = recipe();
    const base = 5 * 2.2046226 * 36 * 0.75;
    const sugar = 0.5 * 2.2046226 * 46;
    r.fermentables.push({
      name: 'Sucre',
      kind: 'sucre',
      use: 'empatage',
      weightKg: 0.5,
      potentialPpg: 46
    });
    const s = brewState(r, {
      readings: [
        {
          at: 1,
          stepId: 'preboil',
          kind: 'densite',
          value: 1 + (base + sugar) / (25 * 0.26417205 * 1000),
          unit: 'SG'
        },
        { at: 1, stepId: 'preboil', kind: 'volume', value: 25, unit: 'L' }
      ]
    });
    expect(measuredEfficiency(r, s, 'preboil')).toMatchObject({ pct: 75, direct: true });
    r.fermentables.push({
      name: 'Lactose',
      kind: 'lactose',
      use: 'ebullition',
      weightKg: 1,
      potentialPpg: 35
    });
    expect(measuredEfficiency(r, s, 'preboil')).toMatchObject({ pct: 75 });
    s.readings![0].value = 1.12;
    expect(measuredEfficiency(r, s, 'preboil')).toMatchObject({ questionable: true });
  });
});
