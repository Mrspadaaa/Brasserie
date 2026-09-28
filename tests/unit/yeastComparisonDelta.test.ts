// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { compactRangeDelta, rangeDelta } from '../../src/ui/YeastChoiceComparison';
type Measurement = NonNullable<Parameters<typeof rangeDelta>[0]>;
const value = (number: number, qualifier: Measurement['qualifier']): Measurement => ({ range: { min: number, max: number }, qualifier, sources: [] });

describe('Écarts documentaires de comparaison', () => {
  it('compare deux points comme des points, avec signe et unité, y compris zéro', () => {
    expect(rangeDelta(value(7.5, 'reportedPoint'), value(10, 'reportedPoint'), '% vol', 'Identique')).toBe('Écart publié −2,5 % vol');
    expect(rangeDelta(value(10, 'reportedPoint'), value(7.5, 'reportedPoint'), '% vol', 'Identique')).toBe('Écart publié +2,5 % vol');
    expect(rangeDelta(value(0, 'reportedPoint'), value(0, 'reportedPoint'), '% vol', 'Identique')).toBe('Même valeur que la référence');
  });
  it('ne transforme pas deux seuils différents en valeurs ponctuelles', () => {
    expect(rangeDelta(value(12, 'greaterThan'), value(10, 'atLeast'), '% vol', 'Identique')).toBe('Bornes publiées distinctes : aucune valeur ponctuelle comparée');
    expect(rangeDelta(value(12, 'greaterThan'), value(10, 'reportedPoint'), '% vol', 'Identique')).toMatch(/Types différents/);
    expect(rangeDelta(undefined, value(0, 'reportedPoint'), '% vol', 'Identique')).toBe('Écart inconnu');
  });
  it('abrège seulement les écarts visibles sans perdre le type des données', () => {
    const range = (min: number, max: number): Measurement => ({ range: { min, max }, qualifier: 'range', sources: [] });
    expect(compactRangeDelta(range(18, 30), range(18, 24), '°C')).toBe('max +6 °C');
    expect(compactRangeDelta(range(70, 75), range(78, 82), '%')).toBe('sans chevauchement · min −8 · max −7 %');
    expect(compactRangeDelta(value(10, 'reportedPoint'), range(9, 11), '% vol')).toBe('point dans la plage de référence');
    expect(compactRangeDelta(value(12, 'reportedPoint'), range(9, 11), '% vol')).toBe('point hors de la plage de référence');
    expect(compactRangeDelta(value(12, 'greaterThan'), value(10, 'atLeast'), '% vol')).toMatch(/bornes distinctes/);
    expect(compactRangeDelta(value(12, 'greaterThan'), value(10, 'reportedPoint'), '% vol')).toMatch(/types différents/);
    expect(compactRangeDelta(undefined, range(9, 11), '% vol')).toBe('');
  });
});
