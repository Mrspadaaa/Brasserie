import { describe, expect, it } from 'vitest';
import { coldDecimal, coldDecimalToNumber, coldDecimalSnapshot, sumColdDecimalNumbers,
  compareColdDecimals, divideColdDecimals, multiplyColdDecimals, subtractColdDecimals } from '../../src/domain/hopDecision/coldIbuDecimal';

describe('arithmétique décimale des contacts froids', () => {
  it('conserve une partition exacte sans marge ajoutée à la borne', () => {
    const sum = sumColdDecimalNumbers([5.49,281.72,32.79]);
    expect(coldDecimalSnapshot(sum)).toEqual({numerator:'320',denominator:'1'});
    const dose = multiplyColdDecimals(divideColdDecimals(sum,coldDecimal(20)),coldDecimal(100));
    expect(compareColdDecimals(dose,coldDecimal(1600))).toBe(0);
    expect(coldDecimalToNumber(dose)).toBe(1600);
    const excess = sumColdDecimalNumbers([320,1e-20]);
    expect(compareColdDecimals(excess,coldDecimal(320))).toBe(1);
    // A number cannot display this difference; the exact comparison still does.
    expect(coldDecimalToNumber(excess)).toBe(320);
  });

  it('arrondit la conversion finale sans déformer les nombres fournis, même extrêmes', () => {
    for (const value of [0,0.1,Number.MIN_VALUE,2.2250738585072014e-308,1e-250,1e-20,3.86,1600,1e100,Number.MAX_VALUE,-0.1,-Number.MIN_VALUE]) {
      expect(coldDecimalToNumber(coldDecimal(value))).toBe(value);
    }
    // Decimal 5e-324 / 2 is slightly above half the actual smallest binary number.
    expect(coldDecimalToNumber(divideColdDecimals(coldDecimal(Number.MIN_VALUE),coldDecimal(2)))).toBe(Number('2.5e-324'));
    expect(coldDecimalToNumber({numerator:1n,denominator:1n<<1075n})).toBe(0);
    expect(coldDecimalToNumber(subtractColdDecimals(coldDecimal(17),coldDecimal(20.2)))).toBe(-3.2);
    expect(()=>coldDecimal(Infinity)).toThrow();
    expect(coldDecimalToNumber({numerator:(1n<<53n)+1n,denominator:1n<<53n})).toBe(1);
    expect(coldDecimalToNumber({numerator:(1n<<53n)+3n,denominator:1n<<53n})).toBe(1+2*Number.EPSILON);
    let seed=1790847166;
    for(let i=0;i<512;i++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const value=Number(`${seed}.123e${seed%617-308}`);
      if(Number.isFinite(value)) expect(coldDecimalToNumber(coldDecimal(value))).toBe(value);
    }
  });
});
