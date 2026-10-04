import { describe, expect, it } from 'vitest';
import { assertHopDocument, hopMeasurementError } from '../../functions/src/hopIndexSchema';
import { resolveHopFacts } from '../../functions/src/hopIndexFacts';
import { predictHopTriplet } from '../../functions/src/hopPredictionCore';
import { readHopAnalysis } from '../../src/domain/hopDecision/measurements';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import { hopTestLot, hopTestMeasurement, hopTestVariety } from '../fixtures/hopIndex';
import { testHopData, testHopTriplet } from '../fixtures/hopPrediction';

const perLUnits = ['ngL', 'ugL', 'ugLInternalStandardEquivalent'] as const;

describe('Qualification explicite des bases houblon', () => {
  it.each(perLUnits)('garde la matrice beer requise par le libellé ou le contrat %s', unit => {
    const beer = hopTestMeasurement({ analyte: '4mmpFree', unit, basis: 'beer', kind: 'point', value: 12, range: undefined });
    expect(hopMeasurementError(beer)).toBeNull();
    expect(() => assertHopDocument('hopLots', hopTestLot({ analysis: [beer] }))).not.toThrow();
    expect(hopMeasurementError({ ...beer, basis: 'unknown' })).toMatch(/matrice bière/);
    for (const basis of ['asIs', 'dryMatter', 'oil'] as const)
      expect(hopMeasurementError({ ...beer, basis })).toMatch(/matrice bière/);
  });

  it('conserve une mesure à base massique inconnue comme documentaire et la rend non calculable', () => {
    const observation = hopTestMeasurement({ analyte: 'alpha', unit: 'percentMass', basis: 'unknown', kind: 'point', value: 7, range: undefined });
    expect(hopMeasurementError(observation)).toBeNull();
    const lot = hopTestLot({ analysis: [observation] });
    const variety = hopTestVariety();
    expect(() => assertHopDocument('hopLots', lot)).not.toThrow();

    const resolved = resolveHopFacts(lot, variety).find(fact => fact.analyte === 'alpha');
    expect(resolved).toMatchObject({ origin: 'lot', measurement: observation, compatible: false, range: null });

    const material: HopDecisionMaterial = { id: lot.id, name: lot.name, form: lot.form, lot, variety };
    const reading = readHopAnalysis(material, 'alpha', 'charge');
    expect(reading).toMatchObject({ status: 'unknown', value: null, measurements: [observation], sources: [observation.source] });
  });

  it('n’alimente pas un étalonnage tel quel avec une mesure dont la base est inconnue', () => {
    const data = testHopData();
    data.lots[0].analysis = [hopTestMeasurement({ analyte: 'alpha', unit: 'percentMass', basis: 'unknown', kind: 'point', value: 7, range: undefined })];
    const result = predictHopTriplet({ ...testHopTriplet, lotId: data.lots[0].id }, { citrus: { min: 7, max: 8 } }, data);
    expect(result.profile.citrus.range).toBeNull();
    expect(result.profile.citrus.reasons.join(' ')).toMatch(/hors du domaine de l’étalonnage/i);
  });
});
