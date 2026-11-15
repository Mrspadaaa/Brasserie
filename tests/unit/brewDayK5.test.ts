import { describe, expect, it } from 'vitest';
import { brewState, recipe } from '../fixtures/brewCompanion';
import { boilPausedAt, etatEbullitionFigee, pauseBoil, resumeBoil } from '../../src/domain/brewDayCalculs';
import { brewAlarms } from '../../src/domain/brewCompanion';

// Voie port-K, lot K5, n° 15 : la pause de l'ébullition (p2c) décale boilStartedAt de la durée de pause.
const MIN = 60000;
const enMarche = () => {
  const r = recipe();
  return { r, s: { ...brewState(r), boilStartedAt: 1_000_000 } };
};

describe('pause de l’ébullition (n° 15)', () => {
  it('pauseBoil pose l’instant sur l’étape d’ébullition, sans toucher boilStartedAt', () => {
    const { s } = enMarche();
    const p = pauseBoil(s, 1_000_000 + 20 * MIN);
    expect(boilPausedAt(p)).toBe(1_000_000 + 20 * MIN);
    expect(p.boilStartedAt).toBe(1_000_000);
  });

  it('resumeBoil avance boilStartedAt de la durée de pause et recale les alarmes d’ajout et la fin', () => {
    const { r, s } = enMarche();
    const avant = brewAlarms(s, r);
    const p = pauseBoil(s, 1_000_000 + 20 * MIN);
    const reprise = resumeBoil(p, 1_000_000 + 27 * MIN);
    expect(reprise.boilStartedAt).toBe(1_000_000 + 7 * MIN);
    expect(boilPausedAt(reprise)).toBeNull();
    const apres = brewAlarms(reprise, r);
    expect(apres.length).toBe(avant.length);
    for (const a of avant) expect(apres.find((x) => x.id === a.id)!.at).toBe(a.at + 7 * MIN);
  });

  it('pendant la pause l’horloge ne court pas : etatEbullitionFigee suit now', () => {
    const { s } = enMarche();
    const p = pauseBoil(s, 1_000_000 + 20 * MIN);
    const t1 = etatEbullitionFigee(p, 1_000_000 + 21 * MIN);
    const t2 = etatEbullitionFigee(p, 1_000_000 + 25 * MIN);
    expect(1_000_000 + 21 * MIN - t1.boilStartedAt!).toBe(20 * MIN);
    expect(1_000_000 + 25 * MIN - t2.boilStartedAt!).toBe(20 * MIN);
  });

  it('sans ébullition en cours : rien ne change', () => {
    const r = recipe();
    const s = brewState(r);
    expect(pauseBoil(s, 5)).toBe(s);
    expect(resumeBoil(s, 5)).toBe(s);
    const fini = { ...s, boilStartedAt: 1, boilFinishedAt: 2 };
    expect(pauseBoil(fini, 5)).toBe(fini);
  });

  it('une seconde pause ne repousse pas la première', () => {
    const { s } = enMarche();
    const p = pauseBoil(s, 1_000_000 + 5 * MIN);
    expect(pauseBoil(p, 1_000_000 + 9 * MIN)).toBe(p);
  });
});
