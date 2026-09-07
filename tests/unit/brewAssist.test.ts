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
import { brewAlarms, brewBitterness, changeBoilMinutes } from '../../src/domain/brewCompanion';
import { startBrewStep } from '../../src/domain/brewDay';
import { mergeBrewTimestamps } from '../../src/domain/brewSessionMerge';
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
  it('signale une coupe devenue impossible après une correction du volume total', () => {
    const r = recipe(),
      s = brewState(r, {
        waterMix: { mash: { roL: 15 } },
        additions: { 'water-mash': { amount: 10 } }
      });
    expect(actualWater(r, s, 'mash').invalidMix).toBe(true);
    expect(waterScenario(r, s, 'mash', 15)).toBeNull();
    expect(waterScenario(r, s, 'mash', 5)?.actualPct).toBe(50);
  });
  it('attend cinq minutes après une correction acide, puis redemande un pH refroidi', () => {
    const r = recipe(),
      s = brewState(r),
      step = s.steps[2];
    step.startedAt = now - 30 * 60000;
    s.readings = [
      {
        id: 'p',
        kind: 'ph',
        at: now - 10 * 60000,
        stepId: step.id,
        value: 5.7,
        unit: 'pH',
        roomTemp: true
      }
    ];
    s.acidCorrections = [
      {
        id: 'a',
        at: now,
        readingAt: s.readings[0].at,
        stepId: step.id,
        amount: 1,
        acid: 'lactique'
      }
    ];
    expect(readingPrompt(step, s, now + 4 * 60000)).toBeNull();
    expect(readingPrompt(step, s, now + 5 * 60000)?.kind).toBe('ph');
    s.readings.push({ ...s.readings[0], id: 'p2', at: now + 6 * 60000, value: 5.4 });
    expect(readingPrompt(step, s, now + 7 * 60000)).toBeNull();
  });
  const wort = () =>
    brewState(recipe(), {
      readings: [
        { kind: 'volume', value: 25, at: now, stepId: 'preboil', unit: 'L', roomTemp: true },
        { kind: 'densite', value: 1.04, at: now, stepId: 'preboil', unit: 'SG', roomTemp: true }
      ]
    });
  it('ajoute le sucre dissous après le prélèvement, même non fermentescible, sans le compter deux fois', () => {
    const r = recipe();
    r.fermentables!.push({
      name: 'Lactose',
      kind: 'lactose',
      use: 'ebullition',
      weightKg: 0.5,
      potentialPpg: 43
    });
    const s = wort();
    const p = boilScenario(r, s, 60, undefined, undefined, 5)!;
    const expected = 1 + (1000 + (43 * 0.5 * 2.2046226) / 0.26417205) / 20 / 1000;
    expect(p.finalOg).toBeCloseTo(expected, 5);
    s.additions = { 'grain-1': { amount: 0.5, doneAt: now - 1000 } };
    expect(boilScenario(r, s, 60, undefined, undefined, 5)!.finalOg).toBeCloseTo(1.05);
    delete s.additions;
    r.fermentables![1].potentialPpg = undefined;
    expect(boilScenario(r, s, 60, undefined, undefined, 5)!.finalOg).toBeNull();
  });
  it('un appoint avant ébullition inclut l’évaporation prévue, contrairement à un appoint final', () => {
    const r = recipe(),
      s = wort();
    s.readings![1].value = 1.06;
    expect(wortRescue(s, 'preboil', 1.05, r)!.actionDeltaL).toBeNull();
    s.boilOffLPerHour = 4;
    const rescue = wortRescue(s, 'preboil', 1.05, r)!;
    expect(rescue.targetL).toBeCloseTo(30);
    expect(rescue.actionDeltaL).toBeCloseTo(9);
    expect((25 + rescue.actionDeltaL! - 4) * 50).toBeCloseTo(25 * 60);
  });
  it('une nouvelle mesure à chaud ou un ajout entre deux mesures invalide le bilan précédent', () => {
    const s = wort();
    s.readings!.push({ ...s.readings![0], at: now + 1000, roomTemp: false });
    expect(wortRescue(s, 'preboil', 1.05)).toBeNull();
    s.readings!.pop();
    s.readings![1].at = now + 10000;
    s.additions = { 'grain-1': { amount: 0.5, doneAt: now + 5000 } };
    expect(wortRescue(s, 'preboil', 1.05)).toBeNull();
  });
  it('signale une surchauffe au lieu d’annoncer une estimation négative', () => {
    const step = { id: 'mash-0', label: 'Empâtage', durationMin: 60, tempC: 67 };
    expect(
      thermalEstimate(brewState(recipe(), { readings: [temp(70, 0, step.id)] }), step, 67, now)
        .status
    ).toBe('overshoot');
  });
  it('le bilan de coupe reste juste sur 101 mélanges et les remplacements restent dans le volume', () => {
    for (let i = 0; i <= 100; i++) {
      const r = recipe();
      r.waterPlan!.diRatioPct = 37;
      const w = waterScenario(r, brewState(r), 'mash', (20 * i) / 100)!;
      const after = w.roL - (w.replaceL * i) / 100 + (w.replacement === 'osmosée' ? w.replaceL : 0);
      expect(after / 20).toBeCloseTo(0.37, 9);
      expect(w.replaceL).toBeGreaterThanOrEqual(0);
      expect(w.replaceL).toBeLessThanOrEqual(20);
    }
  });
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
    ).toBe('below');
  });
  it('une fin de refroidissement trop froide et un plateau récent restent visibles malgré une bonne tendance antérieure', () => {
    const s = brewState(recipe(), {
      readings: [temp(100, 0), temp(85, 5), temp(73, 10), temp(62, 15), temp(62, 20)]
    });
    const step = { id: 'refroidissement', label: 'Refroidir', durationMin: 0 };
    expect(thermalEstimate(s, step, 20, now + 20 * 60000, 15).status).toBe('stalled');
    const whirlpool = { id: 'whirlpool', label: 'Whirlpool', durationMin: 15 };
    const below = thermalEstimate(
      brewState(recipe(), { readings: [temp(60, 0, 'whirlpool')] }),
      whirlpool,
      80,
      now,
      15
    );
    expect(below.status).toBe('below');
    expect(below.message).toContain('température réelle de contact');
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
    r.yeast.fermTempMinC = 12;
    expect(pitchFeedback(r, 16)).not.toMatch(/n’est pas renseignée/);
  });
});
describe('Journal et alarmes : source serveur canonique', () => {
  it('réaligne les relevés sans identifiant et les corrections qui les référencent', () => {
    const sent = brewState(recipe(), {
      readings: [{ kind: 'ph', at: now, stepId: 'mash-0', value: 5.7, unit: 'pH' }]
    });
    const queued = structuredClone(sent);
    queued.acidCorrections = [
      { id: 'a', at: now + 3000, stepId: 'mash-0', readingAt: now, acid: 'lactique', amount: 1 }
    ];
    const saved = stampSession(sent, undefined, now, now + 1500);
    const merged = mergeBrewTimestamps(queued, sent, saved);
    expect(merged.readings![0].at).toBe(now + 1500);
    expect(merged.acidCorrections![0].readingAt).toBe(now + 1500);
    expect(merged.acidCorrections![0].at).toBe(now + 3000);
    const canonical = stampSession(queued, undefined, now + 3000, now + 4500);
    expect(canonical.acidCorrections![0].readingAt).toBe(canonical.readings![0].at);
  });
  it('une durée raccourcie ne laisse pas une alarme houblon après la coupure du feu', () => {
    const r = recipe(),
      s = brewState(r, { boilStartedAt: now, hopElapsedMin: { 'hop-0': 55 } });
    const changed = changeBoilMinutes(s, r, -30);
    expect(changed.hopElapsedMin!['hop-0']).toBe(30);
    for (const e of sessionEvents(changed, r)) expect(e.at).toBeLessThanOrEqual(now + 30 * 60000);
    expect(sessionEvents({ ...s, boilDurationMin: 30 }, r).map((e) => e.at)).toEqual(
      brewAlarms({ ...s, boilDurationMin: 30 }, r).map((e) => e.at)
    );
  });
  it('une pause décale le minuteur mais jamais le début physique du maintien', () => {
    const r = recipe(),
      s = brewState(r, { currentIndex: 2 });
    s.steps[2].rampStartedAt = now - 10 * 60000;
    const started = startBrewStep(s, now);
    started.steps[2].pausedAt = now + 60000;
    const resumed = startBrewStep(started, now + 16 * 60000);
    expect(resumed.steps[2].holdStartedAt).toBe(now);
    expect(resumed.steps[2].startedAt).toBe(now + 15 * 60000);
    resumed.readings = [temp(67, -10, 'mash-0'), temp(67, 0, 'mash-0'), temp(67, 15, 'mash-0')];
    expect(rampExposure(resumed, resumed.steps[2])).toBe(10);
  });
  it('les snapshots en attente conservent les heures confirmées sans effacer un nouveau geste', () => {
    const sent = brewState(recipe(), {
      notes: [{ id: 'n', at: now, stepId: 'mash-0', text: 'départ' }]
    });
    sent.steps[2].startedAt = now;
    const saved = structuredClone(sent);
    saved.steps[2].startedAt = now + 2000;
    saved.notes![0].at = now + 2000;
    const queued = structuredClone(sent);
    queued.steps[2].pausedAt = now + 5000;
    queued.notes!.push({ id: 'new', at: now + 6000, stepId: 'mash-0', text: 'nouvelle note' });
    const merged = mergeBrewTimestamps(queued, sent, saved);
    expect(merged.steps[2].startedAt).toBe(now + 2000);
    expect(merged.steps[2].pausedAt).toBe(now + 5000);
    expect(merged.notes!.map((n) => n.at)).toEqual([now + 2000, now + 6000]);
    expect(queued.steps[2].startedAt).toBe(now);
    queued.steps[2].startedAt = now + 10000;
    expect(mergeBrewTimestamps(queued, sent, saved).steps[2].startedAt).toBe(now + 10000);
  });
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
