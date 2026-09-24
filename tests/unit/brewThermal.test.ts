import { describe, expect, it } from 'vitest';
import type { BrewDayReading, BrewDayState } from '../../src/types';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { activeThermalSegment, effectiveThermalTarget, rampExposureDetail, startThermalSegment, thermalEstimate, thermalSamples } from '../../src/domain/brewThermal';
import { completeBrewStep, markTransferred, recordPitch, restoreBrewDay, startBrewStep } from '../../src/domain/brewDay';
import { remainingMs } from '../../src/services/brewTimer';
import { pitchingPlan, pitchTemperatureFeedback } from '../../src/domain/pitchingPlan';
import { stampSession, validateSession } from '../../functions/src/brewSessionCore';
import { mergeBrewTimestamps } from '../../src/domain/brewSessionMerge';

const now = Date.UTC(2026, 8, 20, 10);
const reading = (state: BrewDayState, value: number, minutes: number, stepId = state.steps[state.currentIndex].id): BrewDayReading => ({
  id: `${stepId}-${minutes}`, at: now + minutes * 60000, value, stepId, unit: '°C', kind: 'temperature', medium: 'wort',
  thermalSegmentId: activeThermalSegment(state, stepId)?.id,
});

describe('Conduite thermique réelle', () => {
  it('40 minutes de rampe puis 10 de maintien font 50 minutes, sans convertir une lacune en zéro', () => {
    let s: BrewDayState = { currentIndex: 0, steps: [{ id: 'mashout', label: 'Mash-out', tempC: 75, durationMin: 10 }] };
    s = startThermalSegment(s, s.steps[0], 'heating', 75, now);
    s.readings = [reading(s, 67, 0), reading(s, 75, 40)];
    expect(s.steps[0].startedAt).toBeUndefined();
    s = startBrewStep(s, now + 40 * 60000);
    expect(remainingMs(s.steps[0], now + 40 * 60000)).toBe(10 * 60000);
    expect(remainingMs(s.steps[0], now + 50 * 60000)).toBe(0);
    expect(rampExposureDetail(s, s.steps[0])).toEqual({ minutes: null, coveredMin: 0, totalMin: 40 });
    s.steps[0].pausedAt = now + 42 * 60000;
    s = startBrewStep(restoreBrewDay(JSON.parse(JSON.stringify(s))), now + 52 * 60000);
    expect(s.steps[0].holdStartedAt).toBe(now + 40 * 60000);
    expect(rampExposureDetail(s, s.steps[0]).totalMin).toBe(40);
    s = completeBrewStep(s, now + 60 * 60000);
    expect(s.thermalSegments![0].endedAt).toBe(now + 40 * 60000);
    s.readings!.push({ ...s.readings![1], id: 'hold', at: now + 50 * 60000 });
    expect(thermalSamples(s, s.steps[0])).toHaveLength(2);
  });

  it('ne réutilise ni le serpentin ni la sonde d’enceinte pour la trajectoire du moût transféré', () => {
    let s = brewState(recipe());
    const cool = s.steps.find(x => x.id === 'refroidissement')!;
    s.currentIndex = s.steps.indexOf(cool);
    s = startThermalSegment(s, cool, 'immersion', 18, now, { coolantC: 15 });
    s.readings = [reading(s, 90, 0), reading(s, 45, 10)];
    expect(thermalEstimate(s, cool, 18, now + 10 * 60000).status).toBe('estimate');
    s = markTransferred(s, now + 11 * 60000);
    const pitch = s.steps[s.currentIndex];
    s = startThermalSegment(s, pitch, 'chamber', 18, now + 11 * 60000);
    s.readings!.push({ ...reading(s, 18, 12), medium: 'chamber' });
    expect(thermalEstimate(s, pitch, 18, now + 12 * 60000).status).toBe('measure');
    s.readings!.push(reading(s, 35, 12));
    expect(thermalSamples(s, pitch)).toHaveLength(1);
    expect(thermalEstimate(s, pitch, 18, now + 12 * 60000).status).toBe('measure');
    s.readings!.push(reading(s, 30, 132));
    const eta = thermalEstimate(s, pitch, 18, now + 132 * 60000);
    expect(eta.status).toBe('estimate');
    if (eta.status === 'estimate') expect(eta.minutes).toBeCloseTo(288);
    expect(thermalEstimate(s, pitch, 18, now + 200 * 60000).status).toBe('estimate');
    expect(thermalEstimate(s, pitch, 18, now + 253 * 60000).status).toBe('stale');
    expect(s.thermalSegments![0].endedAt).toBe(now + 11 * 60000);
  });

  it('sans eau mesurée ne prédit pas le serpentin et ne cache pas une cible inaccessible', () => {
    let s = brewState(recipe()); const step = s.steps.find(x => x.id === 'refroidissement')!;
    s = startThermalSegment(s, step, 'immersion', 18, now);
    s.readings = [reading(s, 50, 0, step.id), reading(s, 30, 10, step.id)];
    expect(thermalEstimate(s, step, 18, now + 10 * 60000).status).toBe('measure');
    expect(thermalEstimate(s, step, 18, now + 10 * 60000, 19).status).toBe('unreachable');
  });
});

describe('Ensemencement documenté et événements persistants', () => {
  it('une plage de fermentation ou une température de réhydratation n’autorise pas un départ chaud', () => {
    const r = recipe(); r.yeast = { ...r.yeast, name: 'US-05', hopIndexId: 'fermentis-us05', form: 'sèche', pitchTempC: 18, fermTempMinC: 18, fermTempMaxC: 26 };
    expect(pitchingPlan(r).warmAvailable).toBe(false);
    expect(pitchingPlan(r).choices[2].reason).toContain('Aucun plafond chiffré');
    r.yeast.hopIndexId = 'fermentis-w68';
    expect(pitchingPlan(r).warmProtocol).toMatchObject({ min: 20, max: 32 });
    let s = brewState(r, { thermalChoices: { pitchTargetC: 28, pitchingMode: 'documented-warm' } });
    expect(pitchingPlan(r, s).warmValid).toBe(true);
    expect(pitchTemperatureFeedback(r, 28, s)).toContain('ajout direct documentée');
    for (const id of ['refroidissement', 'ensemencement']) expect(effectiveThermalTarget(r, s, { id, label: id, durationMin: 0, tempC: 18 })).toBe(28);
    r.yeast.form = 'levain';
    expect(pitchingPlan(r, s).warmValid).toBe(false);
    expect(pitchTemperatureFeedback(r, 28, s)).toContain('plus couvert');
  });

  it('conserve une attente de nuit sans clôture puis consigne une seule fois l’ajout réel', () => {
    const source = brewState(recipe());
    const pending = markTransferred(source, now);
    expect(pending).toMatchObject({ phase: 'awaiting-pitch', transferredAt: now });
    expect(pending.pitchedAt).toBeUndefined(); expect(pending.finishedAt).toBeUndefined();
    expect(markTransferred(pending, now + 1)).toBe(pending);
    const restored = restoreBrewDay(JSON.parse(JSON.stringify(pending)));
    const pitched = recordPitch(restored, now + 16 * 3600000, 19.2);
    expect(pitched).toMatchObject({ phase: 'brewing', transferredAt: now, pitchedAt: now + 16 * 3600000, finishedAt: now + 16 * 3600000, pitchTemperatureC: 19.2 });
    expect(recordPitch(pitched, now + 17 * 3600000, 20)).toBe(pitched);
    expect(source.transferredAt).toBeUndefined();
    expect(validateSession(pitched)).toMatchObject({ pitchTemperatureC: 19.2 });
  });

  it('réaligne les nouveaux événements thermiques sans déplacer le transfert hors ligne', () => {
    let s = markTransferred(brewState(recipe()), now - 12 * 3600000);
    s = startThermalSegment(s, s.steps[s.currentIndex], 'chamber', 18, now);
    s.thermalChoices = { ...s.thermalChoices, changedAt: now, pitchingMode: 'chamber-before-pitch' };
    s.readings = [reading(s, 22, 0)];
    const sent = recordPitch(s, now + 1000, 22);
    const canonical = stampSession(sent, undefined, now + 1000, now + 2500);
    const merged = mergeBrewTimestamps(sent, sent, canonical);
    expect(merged.transferredAt).toBe(now - 12 * 3600000);
    expect(merged.pitchedAt).toBe(now + 2500);
    expect(merged.thermalSegments![0]).toMatchObject({ startedAt: now + 1500, endedAt: now + 2500 });
    expect(merged.thermalChoices!.changedAt).toBe(now + 1500);
    expect(merged.readings![0].at).toBe(now + 1500);
  });

  it('rejette les segments et phases incohérents tout en lisant les anciens journaux', () => {
    expect(() => validateSession({ ...brewState(), finishedAt: now })).not.toThrow();
    for (const patch of [
      { phase: 'awaiting-pitch', transferredAt: now, pitchedAt: now },
      { phase: 'awaiting-pitch' },
      { pitchTemperatureC: 22 },
      { thermalChoices: { pitchTargetC: NaN } },
      { thermalSegments: [{ id: 'x', stepId: 'ensemencement', method: 'chamber', startedAt: now, endedAt: now - 1, targetC: 18 }] },
      { readings: [{ kind: 'temperature', at: now, value: 22, unit: '°C', thermalSegmentId: 'missing' }] },
    ]) expect(() => validateSession({ ...brewState(), ...patch })).toThrow();
  });
});
