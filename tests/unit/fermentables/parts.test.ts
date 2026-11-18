import { describe, expect, it } from 'vitest';
import { partsEntieres, uniteAccordee } from '../../../src/domain/fermentables/parts';

describe('partsEntieres (TL-17 : « 63 + 19 + 19 = 101 % »)', () => {
  it('trois grains 63 / 19 / 19 : 100 %, pas 101', () => {
    // 62,5 / 18,75 / 18,75 : arrondis seuls 63 + 19 + 19 = 101.
    const masses = [5, 1.5, 1.5];
    const arrondis = masses.map((m) => Math.round((m / 8) * 100));
    expect(arrondis.reduce((s, x) => s + x, 0)).toBe(101);
    const parts = partsEntieres(masses);
    expect(parts.reduce((s, x) => s + x, 0)).toBe(100);
    expect(parts[0]).toBe(62);
  });
  it('toujours 100, quelles que soient les masses', () => {
    for (const m of [[1, 1, 1], [3, 3, 3, 1], [0.1, 0.1, 9.8], [2, 7], [1]]) {
      expect(partsEntieres(m).reduce((s, x) => s + x, 0)).toBe(100);
    }
  });
  it('sans masse : 0 partout (jamais une part inventée) ; une ligne à 0 kg reste à 0', () => {
    expect(partsEntieres([0, 0])).toEqual([0, 0]);
    expect(partsEntieres([Number.NaN, 2])).toEqual([0, 100]);
    expect(partsEntieres([0, 1, 1])).toEqual([0, 50, 50]);
  });
});

describe('uniteAccordee (TL-24 : « 2 sachet »)', () => {
  it('pluriel des unités de comptage seulement', () => {
    expect(uniteAccordee('sachet', 2)).toBe('sachets');
    expect(uniteAccordee('sachet', 1)).toBe('sachet');
    expect(uniteAccordee('sachets', 2)).toBe('sachets');
    expect(uniteAccordee('g', 11.5)).toBe('g');
    expect(uniteAccordee('mL', 5)).toBe('mL');
    expect(uniteAccordee(undefined, 3)).toBe('');
  });
});

import { resumeAjouts } from '../../../src/domain/fermentables/parts';

// TL-25 : le sous-titre de « Sucres et ajouts » est un résumé, pas une phrase de pédagogie.
describe('resumeAjouts', () => {
  it('« 2 ajouts · 1,3 kg », au singulier pour un seul', () => {
    expect(resumeAjouts([{ weightKg: 0.8 }, { weightKg: 0.5 }])).toBe('2 ajouts · 1,3 kg');
    expect(resumeAjouts([{ weightKg: 0.25 }])).toBe('1 ajout · 0,25 kg');
  });
  it('sans masse connue : le nombre seulement (l’inconnu n’est jamais 0 kg)', () => {
    expect(resumeAjouts([{ weightKg: 0 }, { weightKg: Number.NaN }])).toBe('2 ajouts');
  });
  it('rien : chaîne vide', () => {
    expect(resumeAjouts([])).toBe('');
  });
});
