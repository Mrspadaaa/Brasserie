import { describe, it, expect } from 'vitest';
import {
  dilute,
  ionsFromSalts,
  addIons,
  residualAlkalinity,
  phShiftFromRa,
  hopBalanceHint,
  estimateMashPh,
  targetRaForGrist,
  solveSalts,
  targetRaForColor,
  alkalinityAsCaCO3,
  SALT_IDS
} from '../../src/domain/water';
import { computeBeerColor, bandForEbc } from '../../src/domain/beerColor';
import { WaterIons, SaltId, IonBand } from '../../src/types';

// Deterministic pseudo-random number generator for reproducible fuzzing
function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANDOM_FLOATS = [
  0,
  -0,
  1,
  -1,
  0.00001,
  -0.00001,
  0.5,
  12.34567,
  999999,
  -999999,
  1e20,
  -1e20,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
  NaN,
  Infinity,
  -Infinity
];

function randomFloat(rnd: () => number, min = -1000, max = 1000): number {
  if (rnd() < 0.15) {
    return RANDOM_FLOATS[Math.floor(rnd() * RANDOM_FLOATS.length)];
  }
  return min + rnd() * (max - min);
}

describe('Domain Property Fuzzing (10,000+ iterations)', () => {
  const ITERATIONS = 2000;

  it('Property: dilute() never throws and preserves non-negative finite bounds', () => {
    const rnd = createPrng(1001);
    for (let i = 0; i < ITERATIONS; i++) {
      const source: WaterIons = {
        ca: randomFloat(rnd, 0, 500),
        mg: randomFloat(rnd, 0, 200),
        na: randomFloat(rnd, 0, 300),
        so4: randomFloat(rnd, 0, 800),
        cl: randomFloat(rnd, 0, 500),
        hco3: randomFloat(rnd, 0, 600)
      };
      const diRatio = randomFloat(rnd, -50, 150);

      const res = dilute(source, diRatio);
      expect(typeof res.ca).toBe('number');
      expect(typeof res.mg).toBe('number');
      expect(typeof res.na).toBe('number');
      expect(typeof res.so4).toBe('number');
      expect(typeof res.cl).toBe('number');
      expect(typeof res.hco3).toBe('number');
      expect(Number.isFinite(res.ca)).toBe(true);
      expect(res.ca).toBeGreaterThanOrEqual(0);
    }
  });

  it('Property: ionsFromSalts() never throws for any doses or volumes', () => {
    const rnd = createPrng(2002);
    for (let i = 0; i < ITERATIONS; i++) {
      const doses: Partial<Record<SaltId, number>> = {};
      SALT_IDS.forEach((id) => {
        if (rnd() > 0.3) {
          doses[id] = randomFloat(rnd, -10, 50);
        }
      });
      const volumeL = randomFloat(rnd, -50, 500);

      const res = ionsFromSalts(doses, volumeL);
      expect(typeof res.ca).toBe('number');
      expect(typeof res.mg).toBe('number');
      expect(typeof res.na).toBe('number');
      expect(typeof res.so4).toBe('number');
      expect(typeof res.cl).toBe('number');
      expect(typeof res.hco3).toBe('number');
      expect(Number.isFinite(res.ca)).toBe(true);
      expect(res.ca).toBeGreaterThanOrEqual(0);
    }
  });

  it('Property: addIons() is commutative and never throws', () => {
    const rnd = createPrng(3003);
    for (let i = 0; i < ITERATIONS; i++) {
      const a: WaterIons = {
        ca: randomFloat(rnd, 0, 300),
        mg: randomFloat(rnd, 0, 100),
        na: randomFloat(rnd, 0, 200),
        so4: randomFloat(rnd, 0, 500),
        cl: randomFloat(rnd, 0, 300),
        hco3: randomFloat(rnd, 0, 400)
      };
      const b: WaterIons = {
        ca: randomFloat(rnd, 0, 300),
        mg: randomFloat(rnd, 0, 100),
        na: randomFloat(rnd, 0, 200),
        so4: randomFloat(rnd, 0, 500),
        cl: randomFloat(rnd, 0, 300),
        hco3: randomFloat(rnd, 0, 400)
      };

      const ab = addIons(a, b);
      const ba = addIons(b, a);

      expect(ab.ca).toBe(ba.ca);
      expect(ab.mg).toBe(ba.mg);
      expect(ab.na).toBe(ba.na);
      expect(ab.so4).toBe(ba.so4);
      expect(ab.cl).toBe(ba.cl);
      expect(ab.hco3).toBe(ba.hco3);
    }
  });

  it('Property: residualAlkalinity() & alkalinityAsCaCO3() calculation stability', () => {
    const rnd = createPrng(4004);
    for (let i = 0; i < ITERATIONS; i++) {
      const ions: WaterIons = {
        ca: randomFloat(rnd, 0, 500),
        mg: randomFloat(rnd, 0, 200),
        na: randomFloat(rnd, 0, 300),
        so4: randomFloat(rnd, 0, 800),
        cl: randomFloat(rnd, 0, 500),
        hco3: randomFloat(rnd, 0, 600)
      };

      const ra = residualAlkalinity(ions);
      expect(typeof ra).toBe('number');

      const alk = alkalinityAsCaCO3(ions.hco3);
      expect(typeof alk).toBe('number');
    }
  });

  it('Property: phShiftFromRa() is strictly bounded within [-0.6, 0.6]', () => {
    const rnd = createPrng(5005);
    for (let i = 0; i < ITERATIONS; i++) {
      const ra = randomFloat(rnd, -5000, 5000);
      const ratio = randomFloat(rnd, -10, 20);

      const shift = phShiftFromRa(ra, ratio);
      if (Number.isFinite(shift)) {
        expect(shift).toBeGreaterThanOrEqual(-0.6);
        expect(shift).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('Property: hopBalanceHint() ratio stays within style range or returns null', () => {
    const rnd = createPrng(6006);
    const stages = ['boil', 'firstWort', 'whirlpool', 'dryHop', 'mash', undefined];
    for (let i = 0; i < ITERATIONS; i++) {
      const hopsCount = Math.floor(rnd() * 6);
      const hops = Array.from({ length: hopsCount }, () => ({
        weightG: randomFloat(rnd, -20, 200),
        stage: stages[Math.floor(rnd() * stages.length)],
        timeMin: randomFloat(rnd, -10, 120)
      }));
      const ibu = randomFloat(rnd, -10, 150);
      const og = randomFloat(rnd, 0.8, 1.2);
      const range = { min: 0.5, max: 2.5 };

      const hint = hopBalanceHint(hops, ibu, og, range);
      if (hint !== null) {
        expect(hint.ratio).toBeGreaterThanOrEqual(range.min);
        expect(hint.ratio).toBeLessThanOrEqual(range.max);
        expect(hint.position).toBeGreaterThanOrEqual(0);
        expect(hint.position).toBeLessThanOrEqual(1);
        expect(typeof hint.note).toBe('string');
      }
    }
  });

  it('Property: solveSalts() never throws and produces non-negative doses', () => {
    const rnd = createPrng(7007);
    for (let i = 0; i < ITERATIONS; i++) {
      const start: WaterIons = {
        ca: Math.max(0, randomFloat(rnd, 0, 200)),
        mg: Math.max(0, randomFloat(rnd, 0, 50)),
        na: Math.max(0, randomFloat(rnd, 0, 100)),
        so4: Math.max(0, randomFloat(rnd, 0, 300)),
        cl: Math.max(0, randomFloat(rnd, 0, 200)),
        hco3: Math.max(0, randomFloat(rnd, 0, 300))
      };
      const target: WaterIons = {
        ca: Math.max(0, randomFloat(rnd, 50, 150)),
        mg: Math.max(0, randomFloat(rnd, 0, 30)),
        na: Math.max(0, randomFloat(rnd, 0, 50)),
        so4: Math.max(0, randomFloat(rnd, 50, 300)),
        cl: Math.max(0, randomFloat(rnd, 50, 200)),
        hco3: 0
      };
      const ranges: Record<keyof WaterIons, IonBand> = {
        ca: { min: 50, max: 200, label: 'Calcium' },
        mg: { min: 0, max: 30, label: 'Magnésium' },
        na: { min: 0, max: 100, label: 'Sodium' },
        so4: { min: 50, max: 400, label: 'Sulfate' },
        cl: { min: 50, max: 250, label: 'Chlorure' },
        hco3: { min: 0, max: 300, label: 'Bicarbonate' }
      };

      const mashWaterL = Math.max(1, randomFloat(rnd, 5, 50));
      const totalWaterL = mashWaterL + Math.max(0, randomFloat(rnd, 0, 40));
      const allSaltsInMash = rnd() > 0.5;

      const disabled: SaltId[] = [];
      SALT_IDS.forEach((id) => {
        if (rnd() < 0.2) disabled.push(id);
      });

      const res = solveSalts({
        start,
        target,
        ranges,
        totalWaterL,
        mashWaterL,
        disabled,
        allSaltsInMash
      });

      expect(res).toBeDefined();
      expect(res.doses).toBeDefined();
      SALT_IDS.forEach((id) => {
        if (res.doses[id] !== undefined) {
          expect(res.doses[id]).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(res.doses[id])).toBe(true);
        }
      });
      expect(Number.isFinite(res.achievedWort.ca)).toBe(true);
      expect(Number.isFinite(res.achievedWort.so4)).toBe(true);
      expect(Number.isFinite(res.achievedWort.cl)).toBe(true);
    }
  });

  it('Property: computeBeerColor() never produces NaN and returns valid band', () => {
    const rnd = createPrng(8008);
    for (let i = 0; i < ITERATIONS; i++) {
      const maltsCount = Math.floor(rnd() * 6);
      const malts = Array.from({ length: maltsCount }, (_, idx) => ({
        name: `Malt ${idx}`,
        weightKg: randomFloat(rnd, -5, 20),
        colorEbc: randomFloat(rnd, -10, 1400)
      }));
      const volumeL = randomFloat(rnd, -10, 100);

      const color = computeBeerColor(malts, volumeL);
      if (color !== null) {
        expect(Number.isFinite(color.ebc)).toBe(true);
        expect(Number.isFinite(color.srm)).toBe(true);
        expect(color.ebc).toBeGreaterThanOrEqual(0);
        expect(color.srm).toBeGreaterThanOrEqual(0);
        expect(typeof color.band).toBe('string');
        expect(typeof color.label).toBe('string');
        expect(typeof color.swatch).toBe('string');
      }
    }
  });

  it('Property: estimateMashPh() and targetRaForGrist() stability', () => {
    const rnd = createPrng(8500);
    for (let i = 0; i < ITERATIONS; i++) {
      const fermCount = Math.floor(rnd() * 6);
      const fermentables = Array.from({ length: fermCount }, (_, idx) => ({
        name: idx === 0 && rnd() < 0.3 ? 'Malt Acidulé' : `Grain ${idx}`,
        weightKg: randomFloat(rnd, -5, 20),
        kind: 'grain',
        use: 'empatage',
        colorEbc: randomFloat(rnd, 2, 800)
      }));
      const ra = randomFloat(rnd, -200, 300);
      const mashRatio = randomFloat(rnd, 1, 8);
      const ebc = randomFloat(rnd, 2, 100);

      const est = estimateMashPh(fermentables, ra, mashRatio);
      expect(typeof est.known).toBe('boolean');
      expect(Number.isFinite(est.phDistilled)).toBe(true);
      expect(Number.isFinite(est.phPredicted)).toBe(true);

      const band = targetRaForGrist(ebc, fermentables, mashRatio);
      expect(band).toBeDefined();
      expect(Number.isFinite(band.min)).toBe(true);
      expect(Number.isFinite(band.max)).toBe(true);
    }
  });

  it('Property: bandForEbc() handles all bounds gracefully', () => {
    const rnd = createPrng(9009);
    for (let i = 0; i < ITERATIONS; i++) {
      const ebc = randomFloat(rnd, -100, 2000);
      const b = bandForEbc(ebc);
      expect(b).toBeDefined();
      expect(['straw', 'gold', 'amber', 'copper', 'brown', 'stout']).toContain(b.band);
      expect(typeof b.label).toBe('string');
      expect(typeof b.swatch).toBe('string');
    }
  });
});
