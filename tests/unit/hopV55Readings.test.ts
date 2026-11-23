import { describe, expect, it } from 'vitest';
import { hopV55DoseReading, hopV55DoseText, hopV55ExactReading } from '../../src/ui/hopV55/readings';

describe('lecture de dose V5.5', () => {
  it('rend le quotient fractionnaire lisible en gardant sa valeur complète accessible', () => {
    const mass = 17.625, volume = 21, dose = mass / volume;
    expect(hopV55DoseReading(dose)).toBe('0,839');
    // Decision 34c (#75): the complete value reads as its exact fraction, then the same 3-decimal rounding as everywhere.
    expect(hopV55ExactReading(dose)).toBe('47/56 ≈ 0,839');
    expect(hopV55ExactReading(mass)).toBe('17,625');
    expect(mass).toBe(17.625);
    expect(volume).toBe(21);
  });

  it('décision 34c : fraction exacte et valeur arrondie lisible, sans fraction inventée', () => {
    expect(hopV55ExactReading(40 / 30)).toBe('4/3 ≈ 1,333');
    expect(hopV55ExactReading(1 / 3)).toBe('1/3 ≈ 0,333');
    // A float with no small exact fraction keeps all its digits; short decimals and integers are unchanged.
    expect(hopV55ExactReading(0.1 + 0.2)).toBe('0,30000000000000004');
    expect(hopV55ExactReading(1.25)).toBe('1,25');
    expect(hopV55ExactReading(40)).toBe('40');
  });

  it('distingue zéro, absence et une petite valeur non nulle', () => {
    expect(hopV55DoseReading(0)).toBe('0');
    expect(hopV55DoseReading(null)).toBe('?');
    expect(hopV55DoseReading(undefined)).toBe('?');
    expect(hopV55DoseReading(Number.NaN)).toBe('?');
    expect(hopV55DoseReading(0.0000004)).toBe('4E-7');
    expect(hopV55ExactReading(0.0000004)).toBe('4e-7');
  });

  it('#75 règle unique : au plus 3 décimales, puis la valeur complète quand l’arrondi cache des chiffres', () => {
    // Number and unit are joined by a no-break space (U+00A0) so « 1,333 g/L » never splits at 390 px.
    expect(hopV55DoseText(40 / 30)).toBe('1,333 g/L (4/3 g/L exacts)');
    expect(hopV55DoseText(2 / 3)).toBe('0,667 g/L (2/3 g/L exacts)');
    expect(hopV55DoseText(25 / 30)).toBe('0,833 g/L (5/6 g/L exacts)');
    // A short decimal stays a decimal: no fraction imposed where the number is already complete.
    expect(hopV55DoseText(0.6125)).toBe('0,613 g/L (0,6125 g/L exacts)');
    // Nothing hidden by the rounding: the reading is complete by itself.
    expect(hopV55DoseText(0.8)).toBe('0,8 g/L');
    expect(hopV55DoseText(1.25)).toBe('1,25 g/L');
    expect(hopV55DoseText(2)).toBe('2 g/L');
    expect(hopV55DoseText(0)).toBe('0 g/L');
    // No small exact fraction: every digit of the JS value stays readable.
    expect(hopV55DoseText(0.1 + 0.2)).toBe('0,3 g/L (0,30000000000000004 g/L exacts)');
    expect(hopV55DoseText(400 / 3, 'g/hL')).toBe('133,333 g/hL (400/3 g/hL exacts)');
  });

  it('#75 : une dose absente reste inconnue, jamais zéro', () => {
    expect(hopV55DoseText(null)).toBe('dose inconnue');
    expect(hopV55DoseText(undefined)).toBe('dose inconnue');
    expect(hopV55DoseText(Number.NaN)).toBe('dose inconnue');
  });
});
