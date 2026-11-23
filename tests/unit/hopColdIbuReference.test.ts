import { describe, expect, it } from 'vitest';
import {
  coldHopBuCalibrationReference,
  coldHopBuReferenceResultReference,
  getColdHopBuCalibration,
  interpolateColdHopBuReference,
  interpolateColdHopBuFromMass,
} from '../../src/domain/hopDecision/coldIbuReference';

describe('référence BU d’un contact froid', () => {
  it('expose une copie versionnée des observations Lafontaine Table 5 et distingue les deux bases', () => {
    const calibration = getColdHopBuCalibration();
    expect(calibration).toMatchObject({
      format: 'cold-hop-bu-calibration-v1',
      calibrationId: 'static-dry-hop-bu-reference-lafontaine-2018',
      version: 'lafontaine-2018-table5-v1',
      output: { analyte: 'spectrophotometricBU', unit: 'BU', method: 'ASBC Beer 23A' },
      sourceReadingLevel: 'primaryFullText',
      control: { doseGPerHL: 0, valueBU: 17 },
      conditions: {
        beer: { abvPct: 4.75, yeastStatus: 'removedBeforeContact', preparedBaseBU: 19.8, treatmentVolumeL: 80, vesselCount: 2, vesselVolumeL: 40 },
        contact: { mode: 'static', durationHours: 24, meanObservedTemperatureC: { min: 13.3, max: 15 }, temperatureSummaryOnly: true },
      },
      uncertainty: 'notReported',
    });
    expect(calibration.source.author).toContain('S. R. Lafontaine');
    expect(calibration.source.locator).toMatch(/Table 5/i);
    expect(calibration.points).toEqual([
      { doseGPerHL: 0, valueBU: 17 }, { doseGPerHL: 200, valueBU: 19.4 }, { doseGPerHL: 386, valueBU: 21 },
      { doseGPerHL: 800, valueBU: 25 }, { doseGPerHL: 1600, valueBU: 26 },
    ]);
    const originalReference = coldHopBuCalibrationReference(calibration);
    calibration.points[1].valueBU = 99;
    expect(getColdHopBuCalibration().points[1].valueBU).toBe(19.4);
    expect(coldHopBuCalibrationReference(getColdHopBuCalibration())).toBe(originalReference);
  });

  it.each([
    [0, 17, 0],
    [200, 19.4, 2.4],
    [386, 21, 4],
    [800, 25, 8],
    [1600, 26, 9],
  ])('restitue le nœud publié %s g/hL, sans confondre BU et la base préparée', (doseGPerHL, valueBU, contrastBU) => {
    const result = interpolateColdHopBuReference({ dose: { value: doseGPerHL, unit: 'g/hL' } });
    expect(result.status).toBe('publishedObservation');
    expect(result.doseEffectiveGPerHL).toBe(doseGPerHL);
    expect(result.valueBU).toBe(valueBU);
    expect(result.contrastToControlBU).toBeCloseTo(contrastBU, 12);
    expect(result.controlBU).toBe(17);
    expect(result.calibrationSnapshot.conditions.beer.preparedBaseBU).toBe(19.8);
    expect(result.nodesUsed).toEqual([{ doseGPerHL, valueBU }]);
    expect(result.method).toBe('ASBC Beer 23A');
    expect(result.uncertainty).toBe('notReported');
  });

  it.each([
    [293, 20.2, 3.2],
    [593, 23, 6],
    [1200, 25.5, 8.5],
  ])('interpole par segments à %s g/hL', (doseGPerHL, expectedBU, contrastBU) => {
    const result = interpolateColdHopBuReference({ dose: { value: doseGPerHL, unit: 'g/hL' } });
    expect(result.status).toBe('interpolation');
    expect(result.valueBU).toBeCloseTo(expectedBU, 12);
    expect(result.contrastToControlBU).toBeCloseTo(contrastBU, 12);
    expect(result.nodesUsed).toHaveLength(2);
    expect(result.nodesUsed[0].doseGPerHL).toBeLessThan(doseGPerHL);
    expect(result.nodesUsed[1].doseGPerHL).toBeGreaterThan(doseGPerHL);
    expect(result.algorithm).toBe('piecewiseLinearInterpolation');
  });

  it('convertit exactement g/L vers g/hL avant interpolation', () => {
    const result = interpolateColdHopBuReference({ dose: { value: 2.93, unit: 'g/L' } });
    expect(result.doseInput).toEqual({ value: 2.93, unit: 'g/L' });
    expect(result.doseEffectiveGPerHL).toBe(293);
    expect(result.valueBU).toBeCloseTo(20.2, 12);
  });

  it('garde la courbe consultable quand la dose est inconnue et refuse toute extrapolation', () => {
    const unknown = interpolateColdHopBuReference({ dose: { value: null, unit: 'g/L' } });
    expect(unknown).toMatchObject({ status: 'doseUnknown', doseEffectiveGPerHL: null, valueBU: null, contrastToControlBU: null,
      domainGPerHL: { min: 0, max: 1600 }, nodesUsed: [], controlBU: 17 });
    expect(unknown.calibrationSnapshot.points).toHaveLength(5);

    const high = interpolateColdHopBuReference({ dose: { value: 1600.01, unit: 'g/hL' } });
    expect(high).toMatchObject({ status: 'outOfDomain', doseEffectiveGPerHL: 1600.01, valueBU: null, contrastToControlBU: null, nodesUsed: [] });
    expect(high.limitations.join(' ')).toMatch(/aucune extrapolation/i);
    const low = interpolateColdHopBuReference({ dose: { value: 0, unit: 'g/L' } });
    expect(low).toMatchObject({ status: 'publishedObservation', doseEffectiveGPerHL: 0, valueBU: 17, contrastToControlBU: 0 });
  });

  it('fingerprint une calibration personnalisée versionnée et n’utilise pas la référence par défaut après erreur', () => {
    const custom = getColdHopBuCalibration();
    custom.calibrationId = 'fixture-calibration';
    custom.version = 'fixture-v2';
    custom.points[1].valueBU = 20;
    const customReference = coldHopBuCalibrationReference(custom);
    expect(customReference).not.toBe(coldHopBuCalibrationReference(getColdHopBuCalibration()));
    const result = interpolateColdHopBuReference({ calibration: custom, dose: { value: 100, unit: 'g/hL' } });
    expect(result.calibrationSnapshot).toEqual(custom);
    expect(result.calibrationReference).toBe(customReference);
    expect(result.valueBU).toBe(18.5);

    const invalid = getColdHopBuCalibration();
    invalid.version = '';
    expect(() => interpolateColdHopBuReference({ calibration: invalid, dose: { value: 100, unit: 'g/hL' } })).toThrow(/calibration BU froide mal formée/i);
    const unordered = getColdHopBuCalibration();
    unordered.points[2].doseGPerHL = 200;
    expect(() => interpolateColdHopBuReference({ calibration: unordered, dose: { value: 100, unit: 'g/hL' } })).toThrow(/points BU/i);
  });

  it.each([
    { value: -1, unit: 'g/hL' },
    { value: Number.NaN, unit: 'g/L' },
    { value: Number.POSITIVE_INFINITY, unit: 'g/L' },
    { value: 1, unit: 'mg/L' },
  ])('refuse une dose invalide sans conversion implicite: %j', dose => {
    expect(() => interpolateColdHopBuReference({ dose } as any)).toThrow(/dose doit être null ou un nombre fini non négatif/i);
  });

  it('référence le résultat complet sans prétendre prouver son authenticité', () => {
    const result = interpolateColdHopBuReference({ dose: { value: 593, unit: 'g/hL' } });
    expect(coldHopBuReferenceResultReference(result)).toBe(result.reference);
    const changed = { ...result, method: 'méthode modifiée' };
    expect(coldHopBuReferenceResultReference(changed)).not.toBe(result.reference);
  });

  it('calcule une masse/volume exactement et garde les données invalides ou réellement hors domaine refusées', () => {
    expect(interpolateColdHopBuFromMass({massesGrams:[5.49,281.72,32.79],volumeL:20})).toMatchObject({status:'publishedObservation',valueBU:26,
      doseExactGPerHL:{numerator:'1600',denominator:'1'},arithmetic:'exactDecimal-v1'});
    expect(interpolateColdHopBuFromMass({massesGrams:[320,1e-20],volumeL:20})).toMatchObject({status:'outOfDomain',valueBU:null});
    for(const massesGrams of [[-1],[Infinity],[NaN]]) expect(()=>interpolateColdHopBuFromMass({massesGrams,volumeL:20})).toThrow();
    expect(()=>interpolateColdHopBuFromMass({massesGrams:[1],volumeL:0})).toThrow();
    expect(()=>interpolateColdHopBuFromMass({massesGrams:[1],volumeL:20,calibration:null as never})).toThrow();
  });
});
