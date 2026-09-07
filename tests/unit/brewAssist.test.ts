import { describe, expect, it } from 'vitest';
import { recipe, brewState } from '../fixtures/brewCompanion';
import {
  actualWater,
  waterScenario,
  thermalEstimate,
  rampExposure,
  boilScenario,
  wortRescue,
  readingPrompt,
  pitchFeedback
} from '../../src/domain/brewAssist';
import { brewAlarms, brewBitterness } from '../../src/domain/brewCompanion';
import { buildTimeline, formatCountdown } from '../../src/services/brewTimer';
import { sessionEvents, stampSession, validateSession } from '../../functions/src/brewSessionCore';
import { BrewDayReading } from '../../src/types';

const now = Date.UTC(2026, 8, 7, 12);
const temp = (value: number, minutes: number, stepId = 'refroidissement'): BrewDayReading => ({
  kind: 'temperature',
  unit: '°C',
  value,
  at: now + minutes * 60000,
  stepId
});
describe('Aides aux imprévus : bilans physiques et limites', () => {
  it('corrige une coupe par conservation des volumes, sans confondre la source et l’eau diluée', () => {
    const r = recipe();
    r.waterPlan!.diRatioPct = 20;
    const s = brewState(r),
      w = waterScenario(r, s, 'mash', 10)!;
    expect(w.actualPct).toBe(50);
    expect(w.replaceL).toBeCloseTo(12);
    expect((10 - 12 * 0.5) / 20).toBeCloseTo(0.2);
    expect(w.addL).toBe(30);
    expect(w.ions!.na).toBeCloseTo((5 / 0.8) * 0.5, 1);
    s.waterMix = { mash: { roL: 10 } };
    expect(actualWater(r, s, 'mash')).toMatchObject({ roL: 10, tapL: 10 });
    expect(waterScenario(r, s, 'mash', 21)).toBeNull();
  });
  it('gère les coupes pures et empêche un conseil de vidange après versement', () => {
    const r = recipe();
    r.waterPlan!.diRatioPct = 100;
    let w = waterScenario(r, brewState(r), 'mash', 10)!;
    expect(w.replaceL).toBe(20);
    expect(w.addL).toBeNull();
    expect(w.ions).toBeNull();
    r.waterPlan!.diRatioPct = 0;
    w = waterScenario(
      r,
      brewState(r, {
        additions: { 'water-mash': { amount: 20, doneAt: now } }
      }),
      'mash',
      10
    )!;
    expect(w.treated).toBe(true);
    expect(w.replaceL).toBe(20);
    expect(w.addL).toBeNull();
  });
  it('un refroidissement 100 → 60 °C en 10 min avec eau à 15 °C demande encore ≈35 min pour 20 °C', () => {
    const step = {
      id: 'refroidissement',
      label: 'Refroidir',
      durationMin: 0,
      rampStartedAt: now
    };
    const s = brewState(recipe(), { readings: [temp(100, 0), temp(60, 10)] });
    const e = thermalEstimate(s, step, 20, now + 10 * 60000, 15);
    expect(e.status).toBe('estimate');
    if (e.status === 'estimate') expect(e.minutes).toBeCloseTo(34.55, 0);
    expect(thermalEstimate(s, step, 20, now + 10 * 60000, 21).status).toBe('unreachable');
    expect(thermalEstimate(s, step, 20, now + 30 * 60000, 15).status).toBe('stale');
    expect(thermalEstimate(s, step, 20, now + 10 * 60000).status).toBe('measure');
  });
  it('ne mélange ni sondes ni anciennes sessions et détecte le plateau', () => {
    const step = {
      id: 'refroidissement',
      label: 'Refroidir',
      durationMin: 0,
      rampStartedAt: now
    };
    const s = brewState(recipe(), {
      readings: [temp(90, -20), temp(67, 0, 'mash-0'), temp(60, 0), temp(60, 10)]
    });
    const e = thermalEstimate(s, step, 20, now + 10 * 60000, 15);
    expect(e.status).toBe('stalled');
    expect(e.points).toHaveLength(2);
    expect(
      thermalEstimate(brewState(recipe(), { readings: [temp(18, 0)] }), step, 20, now, 15).status
    ).toBe('reached');
  });
  it('sépare la rampe lente du maintien et ne lui attribue pas toute la durée enzymatique', () => {
    const step = {
      id: 'mashout',
      label: 'Mash-out',
      durationMin: 10,
      tempC: 80,
      rampStartedAt: now
    };
    const s = brewState(recipe(), {
      readings: [temp(67, 0, step.id), temp(73.5, 15, step.id)]
    });
    const e = thermalEstimate(s, step, 80, now + 15 * 60000);
    expect(e.status).toBe('estimate');
    if (e.status === 'estimate') expect(e.minutes).toBeCloseTo(15);
    expect(rampExposure(s, step)).toBeCloseTo(11.5);
    const ended = { ...step, startedAt: now + 15 * 60000 };
    s.readings!.push(temp(67, 30, step.id));
    expect(rampExposure(s, ended)).toBeCloseTo(11.5);
    expect(step.durationMin).toBe(10);
  });
  it('compare les IBU d’un ajout à +30/+60 et conserve la trace réelle pendant une simulation', () => {
    const r = recipe(),
      s = brewState(r, {
        boilStartedAt: now,
        additions: { 'hop-0': { amount: 20, doneAt: now } }
      });
    const before = JSON.stringify(s);
    const early = boilScenario(r, s, 70, 'hop-0', 30)!;
    const late = boilScenario(r, s, 70, 'hop-0', 60)!;
    expect(early.bitterness!.projected).toBeGreaterThan(late.bitterness!.projected);
    expect(JSON.stringify(s)).toBe(before);
    expect(boilScenario(r, s, 30, 'hop-0', 60)).toBeNull();
    expect(boilScenario(r, s, 70, undefined, undefined, 4)?.extraEvapL).toBeCloseTo(2 / 3);
  });
  it('conserve les points de densité et refuse de mélanger les relevés chauds / froids', () => {
    const r = recipe(),
      s = brewState(r, {
        readings: [
          {
            kind: 'volume',
            value: 25,
            at: now,
            stepId: 'preboil',
            unit: 'L',
            roomTemp: true
          },
          {
            kind: 'densite',
            value: 1.04,
            at: now,
            stepId: 'preboil',
            unit: 'SG',
            roomTemp: true
          }
        ]
      });
    expect(wortRescue(s, 'preboil', 1.05)?.targetL).toBeCloseTo(20);
    const p = boilScenario(r, s, 75, undefined, undefined, 4)!;
    expect(p.finalL).toBe(20);
    expect(p.finalOg).toBeCloseTo(1.05);
    s.readings![0].roomTemp = false;
    expect(wortRescue(s, 'preboil', 1.05)).toBeNull();
    expect(boilScenario(r, s, 75, undefined, undefined, 4)?.finalL).toBeNull();
  });
  it('demande volume puis densité ; contextualise la température de levure', () => {
    const r = recipe(),
      s = brewState(r),
      step = s.steps.find((s) => s.id === 'preboil')!;
    expect(readingPrompt(step, s, now)?.kind).toBe('volume');
    s.readings = [{ kind: 'volume', value: 25, at: now, stepId: step.id, unit: 'L' }];
    expect(readingPrompt(step, s, now)?.kind).toBe('densite');
    r.yeast = {
      ...r.yeast!,
      pitchTempC: 20,
      fermTempMinC: 18,
      fermTempMaxC: 26
    };
    expect(pitchFeedback(r, 60)).toMatch(/continue le refroidissement/);
    expect(pitchFeedback(r, 16)).toMatch(/ralenti/);
  });
});
describe('Journal et alarmes : source serveur canonique', () => {
  it('le serveur retrouve les mêmes échéances que le client, même après changement de durée', () => {
    const r = recipe(),
      s = brewState(r, {
        boilStartedAt: now,
        boilDurationMin: 70,
        hopElapsedMin: { 'hop-0': 30 }
      });
    expect(sessionEvents(s, r).map((e) => [e.id, e.at])).toEqual(
      brewAlarms(s, r).map((e) => [e.id, e.at])
    );
    s.additions = { 'hop-0': { amount: 20, doneAt: now + 30 * 60000 } };
    expect(sessionEvents(s, r).some((e) => e.id.includes('hop-0'))).toBe(false);
    s.finishedAt = now;
    expect(sessionEvents(s, r)).toEqual([]);
  });
  it('corrige seulement les nouvelles heures proches de l’envoi, jamais l’historique hors ligne', () => {
    const s = brewState();
    s.steps[2].startedAt = now - 3600000;
    s.steps[3].startedAt = now - 500;
    const stamped = stampSession(s, undefined, now, now + 1500);
    expect(stamped.steps[2].startedAt).toBe(now - 3600000);
    expect(stamped.steps[3].startedAt).toBe(now + 1000);
    expect(stamped.revision).toBe(1);
    expect(stampSession(stamped, stamped, now + 1500, now + 2000).steps).toEqual(stamped.steps);
  });
  it('rejette horaires, durées, coupes et mesures invalides avant sauvegarde', () => {
    for (const patch of [
      { currentIndex: 999 },
      { boilDurationMin: NaN },
      { boilFinishedAt: now },
      { waterMix: { mash: { roL: -1 } } },
      { readings: [temp(NaN, 0)] },
      { additions: { x: { amount: 3, doneAt: Infinity } } }
    ])
      expect(() => validateSession({ ...brewState(), ...patch })).toThrow();
  });
  it('la recette garde ses durées, ne duplique pas le mash-out et affiche le dépassement en heures', () => {
    const r = recipe();
    r.mash!.mashoutTempC = 76;
    expect(buildTimeline(r).filter((s) => /mashout/i.test(s.label))).toHaveLength(1);
    expect(buildTimeline(r).find((s) => s.id === 'sparge')!.tempC).toBe(76);
    expect(formatCountdown(-875 * 60000)).toBe('−14 h 35');
    expect(formatCountdown(NaN)).toBe('—');
  });
});
