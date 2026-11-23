import { describe, expect, it } from 'vitest';
import type { Batch, BrewDayReading, BrewDayState, BrewhouseProfile, RecipeSnapshot } from '../../src/types';
import { applySystemCalibration, brewSystemInsights, calibrationEventStatus, measuredWortYield, pairedWortMeasurements, systemCalibrationProposals } from '../../src/domain/brewSystemInsights';
import { recipe as makeRecipe } from '../fixtures/brewCompanion';

const MIN = 60_000;
function profile(): BrewhouseProfile {
  return { id: 'rig', name: 'Ma cuve', volumeL: 20, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2,
    equipmentRefs: { kettle: 'E-01', fermenter: 'E-02' },
    equipment: { kettleCapacityL: 45, kettleWorkingL: 35, spargeCapacityL: 18, fermenterCapacityL: 30,
      fermenterHeadspacePct: 20, roPackL: 5, boilOffLPerHour: 3, grainAbsorptionLPerKg: 0.96,
      grainDisplacementLPerKg: 0.67, coolingShrinkagePct: 4, heatingRateCPerMin: 13 / 30 } };
}
function recipe(): RecipeSnapshot { return makeRecipe({ brewhouse: profile(), efficiencyPct: 75 }); }
function pair(stage = 'ensemencement', volume = 20, gravity = 1.05, at = 100 * MIN, id = 'pair'): BrewDayReading[] {
  return [{ id: `${id}-v`, pairId: id, stepId: stage, kind: 'volume', unit: 'L', value: volume, at, volumeBasis: 'cold' },
    { id: `${id}-g`, pairId: id, stepId: stage, kind: 'densite', unit: 'SG', value: gravity, at, roomTemp: true }];
}
function state(readings: BrewDayReading[] = pair()): BrewDayState {
  return { steps: [{ id: 'mash-0', label: 'Palier', tempC: 67, durationMin: 60 }], currentIndex: 0, readings,
    additions: { 'grain-0': { amount: 5, doneAt: 0 } } };
}
function batch(id: string, pct = 70, date = 100 * MIN): Batch {
  // Independent density from 5 kg × 36 PPG, converted from lb/US gallon.
  const sg = 1 + (5 * 2.2046226 * 36 / 0.26417205) * pct / 100 / 20 / 1000;
  return { id, name: `Brassin ${id}`, style: 'Pale Ale', volumeL: 20, brewDate: '2026-09-20', status: 'fermentation',
    recipeSnapshot: recipe(), brewDay: state(pair('ensemencement', 20, sg, date, id)) };
}

describe('mesures admissibles et rendement réel', () => {
  it('utilise le volume réellement récolté avec la densité, sans rapport OG seule', () => {
    const twenty = measuredWortYield(recipe(), state(), 'ensemencement');
    const fifteen = measuredWortYield(recipe(), state(pair('ensemencement', 15)), 'ensemencement');
    expect(twenty.value).toBeCloseTo(1000 / (5 * 2.2046226 * 36 / 0.26417205) * 100, 8);
    expect(fifteen.value! / twenty.value!).toBeCloseTo(0.75);
    expect(twenty.calibrationEligible).toBe(true);
  });
  it('utilise les substitutions et quantités confirmées, sans garder le potentiel du malt remplacé', () => {
    const s = state();
    s.additions!['grain-0'] = { amount: 6, doneAt: 0, replacement: { name: 'Pils', potentialPpg: 38 } };
    const result = measuredWortYield(recipe(), s, 'ensemencement');
    expect(result.value).toBeCloseTo(1000 / (6 * 2.2046226 * 38 / 0.26417205) * 100, 8);
    delete s.additions!['grain-0'].replacement!.potentialPpg;
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
  });
  it('ne transforme pas une quantité prévue en grain réellement ajouté', () => {
    const s = state(); s.additions = {};
    expect(measuredWortYield(recipe(), s, 'ensemencement')).toMatchObject({ value: null, calibrationEligible: false });
    expect(measuredWortYield(recipe(), s, 'ensemencement').reason).toContain('Confirme');
  });
  it('ne calcule pas sur les seuls grains saisis à temps quand un malt d’empâtage a été consigné après le couple', () => {
    const r = recipe();
    r.fermentables.push({ name: 'Munich', kind: 'grain', use: 'empatage', weightKg: 1, potentialPpg: 37 });
    const s = state();
    s.additions!['grain-1'] = { amount: 1, doneAt: 120 * MIN };
    const result = measuredWortYield(r, s, 'ensemencement');
    expect(result).toMatchObject({ value: null, missingIngredients: true, calibrationEligible: false });
    expect(result.sourceIds).toContain('addition:grain-1');
    expect(result.reason).toContain('Corrige leur heure réelle');
    s.additions!['grain-1'].doneAt = 10 * MIN;
    expect(measuredWortYield(r, s, 'ensemencement').value).toBeCloseTo(1000 / ((5 * 36 + 37) * 2.2046226 / 0.26417205) * 100);
  });
  it('rejette les mesures hors du même moût, même avec un identifiant de couple', () => {
    const s = state(); s.readings![1].at += 2 * MIN;
    s.additions!['water-extra'] = { amount: 2, doneAt: 101 * MIN };
    expect(pairedWortMeasurements(recipe(), s, 'ensemencement').pair).toBeNull();
    delete s.additions!['water-extra']; s.readings![1].at += 30 * MIN;
    expect(pairedWortMeasurements(recipe(), s, 'ensemencement').pair).toBeNull();
  });
  it('préfère le dernier couple explicite et ne masque pas un relevé récent incomplet', () => {
    const s = state([...pair(), ...pair('ensemencement', 19, 1.051, 200 * MIN, 'new')]);
    expect(measuredWortYield(recipe(), s, 'ensemencement').pair?.volumeColdL).toBe(19);
    s.readings!.pop();
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
  });
  it('accepte les anciens couples sûrs et exige la référence de température', () => {
    const s = state(pair().map(({ pairId: _pairId, ...r }) => ({ ...r, roomTemp: true })));
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).not.toBeNull();
    delete s.readings![0].volumeBasis; delete s.readings![0].roomTemp;
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
    s.readings![0].volumeBasis = 'cold'; s.readings![1].roomTemp = false;
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
  });
  it('signale une conversion à froid et refuse un volume seulement tiède', () => {
    const s = state(); s.readings![0].volumeBasis = 'hot'; s.readings![0].value = 20 / 0.96;
    const result = measuredWortYield(recipe(), s, 'ensemencement');
    expect(result.pair?.volumeColdL).toBeCloseTo(20);
    expect(result.approximate).toBe(true);
    s.readings![0].temperatureC = 75;
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
  });
  it('montre un extrait global avec sucre sans calibrer le rendement des grains', () => {
    const r = recipe(); r.fermentables.push({ name: 'Candi', kind: 'sucre', use: 'ebullition', weightKg: 1, potentialPpg: 46 });
    const s = state(); s.additions!['grain-1'] = { amount: 1, doneAt: 60 * MIN };
    const result = measuredWortYield(r, s, 'ensemencement');
    expect(result).toMatchObject({ scope: 'global', calibrationEligible: false });
    expect(result.value).toBeCloseTo(1000 / ((5 * 36 + 46) * 2.2046226 / 0.26417205) * 100);
    expect(result.reason).toContain('aucune calibration');
  });
  it('ne mélange pas un sucre futur avec le rendement pré-ébullition', () => {
    const r = recipe(); r.fermentables.push({ name: 'Candi', kind: 'sucre', use: 'ebullition', weightKg: 1, potentialPpg: 46 });
    const s = state(pair('preboil'));
    const beforeSugar = measuredWortYield(r, s, 'preboil');
    expect(beforeSugar).toMatchObject({ scope: 'grain', calibrationEligible: false });
    s.additions!['grain-1'] = { amount: 1, doneAt: 120 * MIN };
    expect(measuredWortYield(r, s, 'preboil').value).toBe(beforeSugar.value);
    expect(measuredWortYield(r, s, 'preboil').missingIngredients).toBeUndefined();
  });
  it('laisse un rendement suspect visible mais impropre à la calibration', () => {
    expect(measuredWortYield(recipe(), state(pair('ensemencement', 40, 1.1)), 'ensemencement')).toMatchObject({ questionable: true, calibrationEligible: false });
  });
  it('ne prend pas une densité postérieure à l’ensemencement pour l’extrait initial', () => {
    const s = state(); s.pitchedAt = 90 * MIN;
    expect(measuredWortYield(recipe(), s, 'ensemencement').value).toBeNull();
    expect(measuredWortYield(recipe(), s, 'ensemencement').reason).toContain('avant l’ensemencement');
  });
});

describe('coefficients identifiables de l’installation', () => {
  const find = (r: RecipeSnapshot, s: BrewDayState, id: string) => brewSystemInsights(r, s).metrics.find(m => m.id === id)!;
  it('calcule l’évaporation à chaud avec la durée réellement enregistrée', () => {
    const s = state([{ ...pair('preboil', 30, 1.04, 10 * MIN)[0], volumeBasis: 'hot' },
      { ...pair('postboil', 26, 1.046, 90 * MIN, 'post')[0], volumeBasis: 'hot' }]);
    s.boilStartedAt = 10 * MIN; s.boilFinishedAt = 90 * MIN;
    expect(find(recipe(), s, 'evaporation')).toMatchObject({ value: 3, calibrationEligible: true, approximate: false });
    s.additions!['water-extra'] = { amount: 2, doneAt: 20 * MIN };
    expect(find(recipe(), s, 'evaporation').value).toBeNull();
  });
  it('ne calibre pas une chauffe préalable cachée dans le relevé pré-ébullition', () => {
    const s = state([pair('preboil', 30, 1.04, 10 * MIN)[0], pair('postboil', 26, 1.046, 90 * MIN, 'post')[0]]);
    s.boilStartedAt = 40 * MIN; s.boilFinishedAt = 90 * MIN;
    expect(find(recipe(), s, 'evaporation').value).toBeNull();
  });
  it('l’eau prévue ne suffit pas à calculer une absorption', () => {
    const s = state(pair('preboil', 25));
    expect(find(recipe(), s, 'absorption').value).toBeNull();
    s.additions!['water-mash'] = { amount: 20, doneAt: 0, volumeBasis: 'cold' };
    s.additions!['water-sparge'] = { amount: 10, doneAt: 1, volumeBasis: 'cold' };
    expect(find(recipe(), s, 'absorption')).toMatchObject({ value: 1, calibrationEligible: false });
    s.lauterRetainedL = 1;
    expect(find(recipe(), s, 'absorption')).toMatchObject({ value: 0.8, calibrationEligible: true });
    s.lauterRetainedL = 0;
    expect(find(recipe(), s, 'absorption')).toMatchObject({ value: 1, calibrationEligible: true });
  });
  it('exige la base des quantités d’eau et refuse un reste libre incohérent', () => {
    const s = state(pair('preboil', 25));
    s.additions!['water-mash'] = { amount: 20, doneAt: 0 };
    s.additions!['water-sparge'] = { amount: 10, doneAt: 1, volumeBasis: 'cold' };
    expect(find(recipe(), s, 'absorption').value).toBeNull();
    s.additions!['water-mash'].volumeBasis = 'cold'; s.lauterRetainedL = 6;
    expect(find(recipe(), s, 'absorption').calibrationEligible).toBe(false);
  });
  it('montre la perte totale au transfert sans la proposer comme fond de cuve', () => {
    const s = state([pair('refroidissement', 22, 1.05, 90 * MIN, 'kettle')[0], ...pair()]);
    expect(find(recipe(), s, 'transferLoss')).toMatchObject({ value: 2, calibrationEligible: false });
    expect(find(recipe(), s, 'transferLoss').parameter).toBeUndefined();
    expect(find(recipe(), s, 'transferLoss').reason).toContain('houblons');
  });
  it('observe 0,2 °C/min sur 40 minutes sans inventer une courbe entre les points', () => {
    const s = state([{ id: 't1', stepId: 'mash-1', kind: 'temperature', unit: '°C', value: 67, at: 0, thermalSegmentId: 'heat' },
      { id: 't2', stepId: 'mash-1', kind: 'temperature', unit: '°C', value: 75, at: 40 * MIN, thermalSegmentId: 'heat' }]);
    s.thermalSegments = [{ id: 'heat', stepId: 'mash-1', method: 'heating', startedAt: 0, endedAt: 40 * MIN, targetC: 75, volumeL: 25 }];
    expect(find(recipe(), s, 'heating')).toMatchObject({ value: 0.2, calibrationEligible: true, sourceIds: ['t1', 't2'] });
    s.readings![1].thermalSegmentId = 'other';
    expect(find(recipe(), s, 'heating').value).toBeNull();
  });
  it('donne une vitesse mesurée sans calibrer un volume de chauffe inconnu', () => {
    const s = state([{ id: 't1', kind: 'temperature', unit: '°C', value: 67, at: 0, thermalSegmentId: 'heat' },
      { id: 't2', kind: 'temperature', unit: '°C', value: 75, at: 40 * MIN, thermalSegmentId: 'heat' }]);
    s.thermalSegments = [{ id: 'heat', stepId: 'mash-1', method: 'heating', startedAt: 0, targetC: 75 }];
    expect(find(recipe(), s, 'heating')).toMatchObject({ value: 0.2, calibrationEligible: false });
  });
  it('ne calibre pas l’absorption si un autre extrait a changé le volume collecté', () => {
    const r = recipe(); r.fermentables.push({ name: 'Extrait', weightKg: 1, kind: 'extrait', use: 'empatage', potentialPpg: 44 });
    const s = state(pair('preboil', 25));
    s.additions!['water-mash'] = { amount: 20, doneAt: 0, volumeBasis: 'cold' };
    s.additions!['water-sparge'] = { amount: 10, doneAt: 1, volumeBasis: 'cold' };
    s.additions!['grain-1'] = { amount: 1, doneAt: 1 }; s.lauterRetainedL = 0;
    expect(find(r, s, 'absorption').calibrationEligible).toBe(false);
  });
});

describe('propositions et historique de calibration', () => {
  it('attend trois brassins distincts et ne compte pas un doublon', () => {
    expect(systemCalibrationProposals(profile(), [batch('1'), batch('2')])[0]).toMatchObject({ count: 2, eligible: false });
    expect(systemCalibrationProposals(profile(), [batch('1'), batch('1'), batch('2')])[0].count).toBe(2);
    expect(systemCalibrationProposals(profile(), [batch('1'), batch('2'), batch('3')])[0]).toMatchObject({ count: 3, value: 70, eligible: true });
  });
  it('utilise la médiane des cinq derniers brassins comparables au maximum', () => {
    const batches = [20, 64, 72, 68, 80, 70].map((pct, i) => batch(String(i), pct, (i + 100) * MIN));
    const proposal = systemCalibrationProposals(profile(), batches)[0];
    expect(proposal).toMatchObject({ count: 5, value: 70 });
    expect(proposal.observations.map(o => o.batchId)).not.toContain('0');
  });
  it('sépare volumes, procédés et équipements mais ignore le coefficient déjà calibré', () => {
    const a = batch('1'), b = batch('2'), c = batch('3');
    b.recipeSnapshot!.brewhouse!.efficiencyPct = 68;
    expect(systemCalibrationProposals(profile(), [a, b, c])[0].count).toBe(3);
    c.recipeSnapshot!.volumeL = 24;
    expect(systemCalibrationProposals(profile(), [a, b, c]).map(p => p.count).sort()).toEqual([1, 2]);
    c.recipeSnapshot!.brewhouse!.equipmentRefs!.kettle = 'other';
    expect(systemCalibrationProposals(profile(), [a, b, c])).toHaveLength(1);
    b.recipeSnapshot!.nolo = { enabled: true, process: 'coldMash' } as RecipeSnapshot['nolo'];
    expect(systemCalibrationProposals(profile(), [a, b]).map(p => p.count)).toEqual([1]);
    expect(measuredWortYield(b.recipeSnapshot!, b.brewDay!, 'ensemencement').reason).toContain('NOLO');
  });
  it('applique explicitement, conserve l’ancienne valeur et les sources, sans muter les recettes', () => {
    const rig = profile(), batches = [batch('1'), batch('2'), batch('3')];
    const proposal = systemCalibrationProposals(rig, batches)[0];
    expect(rig.efficiencyPct).toBe(75);
    const result = applySystemCalibration(rig, proposal, batches, 123);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.profile.efficiencyPct).toBe(70);
    expect(result.event).toMatchObject({ previousValue: 75, value: 70, appliedAt: 123, batchIds: ['1', '2', '3'] });
    expect(result.event.readingIds).toContain('1-v');
    expect(rig.calibrationHistory).toBeUndefined();
    expect(batches[0].recipeSnapshot!.brewhouse!.efficiencyPct).toBe(75);
    expect(calibrationEventStatus(result.event, batches)).toBe('current');
  });
  it('une correction invalide une proposition ouverte et signale l’historique existant', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    const proposal = systemCalibrationProposals(profile(), batches)[0];
    const result = applySystemCalibration(profile(), proposal, batches, 123);
    if (!result.ok) throw new Error(result.reason);
    batches[0].brewDay!.readings![0].value = 19;
    expect(applySystemCalibration(profile(), proposal, batches).ok).toBe(false);
    expect(calibrationEventStatus(result.event, batches)).toBe('changed');
    expect(calibrationEventStatus(result.event, batches.slice(1))).toBe('unavailable');
  });
  it('corriger l’heure d’un ajout invalide aussi l’accord précédent même si le rendement reste identique', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    const proposal = systemCalibrationProposals(profile(), batches)[0];
    const result = applySystemCalibration(profile(), proposal, batches, 123);
    if (result.ok === false) throw new Error(result.reason);
    batches[0].brewDay!.additions!['grain-0'].doneAt = 10 * MIN;
    expect(systemCalibrationProposals(profile(), batches)[0].value).toBe(proposal.value);
    expect(applySystemCalibration(profile(), proposal, batches).ok).toBe(false);
    expect(calibrationEventStatus(result.event, batches)).toBe('changed');
    batches[0].brewDay!.additions!['grain-0'].doneAt = 120 * MIN;
    expect(systemCalibrationProposals(profile(), batches)[0]).toMatchObject({ count: 2, eligible: false });
  });
  it('un nouveau brassin ne rend pas fausse une ancienne calibration non corrigée', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    const result = applySystemCalibration(profile(), systemCalibrationProposals(profile(), batches)[0], batches);
    if (!result.ok) throw new Error(result.reason);
    expect(calibrationEventStatus(result.event, [...batches, batch('4', 74, 200 * MIN)])).toBe('current');
  });
  it('un simple réordonnancement de synchronisation ne modifie pas la preuve', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    const result = applySystemCalibration(profile(), systemCalibrationProposals(profile(), batches)[0], batches);
    if (!result.ok) throw new Error(result.reason);
    batches.forEach(b => b.brewDay!.readings!.reverse());
    expect(calibrationEventStatus(result.event, batches)).toBe('current');
  });
  it('un changement des quantités d’eau sépare les contextes de brassage', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    batches[2].brewDay!.additions!['water-mash'] = { amount: 25, doneAt: 0, volumeBasis: 'cold' };
    expect(systemCalibrationProposals(profile(), batches).map(p => p.count).sort()).toEqual([1, 2]);
  });
  it('retire un résultat de calibration si sa densité ou son grain n’est plus documenté', () => {
    const batches = [batch('1'), batch('2'), batch('3')];
    batches[2].brewDay!.readings![1].roomTemp = false;
    expect(systemCalibrationProposals(profile(), batches)[0].count).toBe(2);
    delete batches[1].brewDay!.additions!['grain-0'].doneAt;
    expect(systemCalibrationProposals(profile(), batches)[0].count).toBe(1);
  });
});
