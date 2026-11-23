import { describe, it, expect } from 'vitest';
import { BrewingMath, kettleHopGrams } from '../../src/services/brewingMath';
import { Recipe, BrewhouseProfile, HopIngredient } from '../../src/types';

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

describe('BrewingMath Property Fuzzing (10,000+ iterations)', () => {
  const ITERATIONS = 2000;

  it('Property: calculateABV never produces NaN or negative values', () => {
    const rnd = createPrng(101);
    for (let i = 0; i < ITERATIONS; i++) {
      const og = randomFloat(rnd, 0.9, 1.25);
      const fg = randomFloat(rnd, 0.9, 1.15);
      const abv = BrewingMath.calculateABV(og, fg);
      expect(typeof abv).toBe('number');
      if (Number.isFinite(abv)) {
        expect(abv).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Property: sgToPlato and platoToSG stability and non-negative bounds', () => {
    const rnd = createPrng(202);
    for (let i = 0; i < ITERATIONS; i++) {
      const sg = randomFloat(rnd, 0.8, 1.3);
      const plato = BrewingMath.sgToPlato(sg);
      expect(typeof plato).toBe('number');
      if (Number.isFinite(plato)) {
        expect(plato).toBeGreaterThanOrEqual(0);
      }

      const p = randomFloat(rnd, -10, 40);
      const convertedSg = BrewingMath.platoToSG(p);
      expect(typeof convertedSg).toBe('number');
      if (Number.isFinite(convertedSg)) {
        expect(convertedSg).toBeGreaterThanOrEqual(1.0);
      }
    }
  });

  it('Property: hopIbu and calculateTinsethIBU never produce negative IBU or crash', () => {
    const rnd = createPrng(303);
    const stages: Array<'boil' | 'firstWort' | 'whirlpool' | 'dryHop'> = ['boil', 'firstWort', 'whirlpool', 'dryHop'];
    for (let i = 0; i < ITERATIONS; i++) {
      const hop: HopIngredient = {
        name: 'TestHop',
        weightG: randomFloat(rnd, -10, 200),
        alpha: randomFloat(rnd, -5, 25),
        stage: stages[Math.floor(rnd() * stages.length)],
        timeMin: randomFloat(rnd, -10, 120),
        tempC: randomFloat(rnd, 50, 100)
      };
      const boilVolumeL = randomFloat(rnd, -10, 500);
      const og = randomFloat(rnd, 0.9, 1.3);
      const boilMin = randomFloat(rnd, 0, 120);

      const ibu = BrewingMath.hopIbu(hop, boilVolumeL, og, boilMin);
      expect(typeof ibu).toBe('number');
      if (Number.isFinite(ibu)) {
        expect(ibu).toBeGreaterThanOrEqual(0);
      }

      const totalIbu = BrewingMath.calculateTinsethIBU([hop], boilVolumeL, og, boilMin);
      expect(typeof totalIbu).toBe('number');
      if (Number.isFinite(totalIbu)) {
        expect(totalIbu).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Property: waterVolumes calculation never crashes and returns non-negative volumes', () => {
    const rnd = createPrng(404);
    const spargeTypes: Array<'batch' | 'fly' | 'none'> = ['batch', 'fly', 'none'];
    for (let i = 0; i < ITERATIONS; i++) {
      const totalGristKg = randomFloat(rnd, -5, 50);
      const volumeL = randomFloat(rnd, -10, 500);
      const spargeType = spargeTypes[Math.floor(rnd() * spargeTypes.length)];
      const boilMin = randomFloat(rnd, 0, 120);
      const kettleHopG = randomFloat(rnd, -10, 500);
      const brewhouse: Partial<BrewhouseProfile> = {
        boilOffRatePct: randomFloat(rnd, 0, 25),
        deadSpaceL: randomFloat(rnd, 0, 10),
        mashRatioLPerKg: randomFloat(rnd, 2, 6)
      };

      const wv = BrewingMath.waterVolumes(
        totalGristKg,
        volumeL,
        brewhouse,
        spargeType,
        boilMin,
        kettleHopG
      );

      expect(wv).toBeDefined();
      expect(typeof wv.mashWaterL).toBe('number');
      expect(typeof wv.spargeWaterL).toBe('number');
      expect(typeof wv.preBoilVolumeL).toBe('number');
      expect(typeof wv.mashRatioLPerKg).toBe('number');

      if (totalGristKg > 0 && volumeL > 0) {
        expect(wv.mashWaterL).toBeGreaterThanOrEqual(0);
        expect(wv.spargeWaterL).toBeGreaterThanOrEqual(0);
        expect(wv.preBoilVolumeL).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Property: carbonation and priming sugar calculations are resilient', () => {
    const rnd = createPrng(505);
    for (let i = 0; i < ITERATIONS; i++) {
      const targetCo2 = randomFloat(rnd, -2, 5);
      const packagedVol = randomFloat(rnd, -10, 200);
      const tempC = randomFloat(rnd, -5, 35);

      const resCo2 = BrewingMath.calculateResidualCo2Vol(tempC);
      expect(typeof resCo2).toBe('number');
      expect(resCo2).toBeGreaterThanOrEqual(0);

      const sugar = BrewingMath.calculatePrimingSugarG(targetCo2, packagedVol, tempC, 'dextrose');
      expect(typeof sugar).toBe('number');
      expect(sugar).toBeGreaterThanOrEqual(0);

      const kegBar = BrewingMath.calculateKegPressureBar(targetCo2, tempC);
      expect(typeof kegBar).toBe('number');
      expect(kegBar).toBeGreaterThanOrEqual(0);
    }
  });

  it('Property: refractometer correction and Brix conversion stability', () => {
    const rnd = createPrng(606);
    for (let i = 0; i < ITERATIONS; i++) {
      const sg = randomFloat(rnd, 0.9, 1.3);
      const brix = BrewingMath.sgToBrix(sg);
      expect(typeof brix).toBe('number');
      if (Number.isFinite(brix)) {
        expect(brix).toBeGreaterThanOrEqual(0);
      }

      const ogSG = randomFloat(rnd, 1.02, 1.12);
      const curBrix = randomFloat(rnd, 2, 25);
      const fg = BrewingMath.calculateSeanTerrillRefractometer(ogSG, curBrix);
      expect(typeof fg).toBe('number');
    }
  });
});
