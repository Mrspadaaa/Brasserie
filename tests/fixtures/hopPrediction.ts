import { HopAxis, HopConfidencePolicy, HopKnowledge, HopModel, HopTriplet, HopYeast } from '../../functions/src/hopPredictionSchema';
import { HopEngineData } from '../../functions/src/hopPredictionCore';
import { hopTestLot, hopTestSource, hopTestVariety } from './hopIndex';
/** Deliberately synthetic regression, never bundled in the application. */
export const testHopAxis: HopAxis = { id: 'citrus', kind: 'axis', name: 'Agrumes', version: 'test-1', description: 'Échelle de test',
  scale: { min: 0, max: 10 }, lowMax: 3, mediumMax: 7, weight: { range: { min: 1, max: 1 }, source: hopTestSource }, source: hopTestSource };
export const testHopYeast: HopYeast = { id: 'yeast-test', kind: 'yeast', name: 'Levure témoin', betaLyase: 'unknown', source: hopTestSource };
export const testHopPolicy: HopConfidencePolicy = { id: 'confidence-test', kind: 'confidence', name: 'Fiabilité de test', source: hopTestSource,
  caps: { coa: 'high', manufacturer: 'medium', research: 'high', review: 'medium', observation: 'medium', community: 'low', judgment: 'low' } };
export const testHopTriplet: HopTriplet = { varietyId: 'test-variety', yeastId: 'yeast-test', timing: 'fermentation', doseGL: 4, temperatureC: 20, contactHours: 48, matrixId: 'fixture-beer' };
export const testHopModel = (): HopModel => ({ id: 'fit-test', kind: 'model', name: 'Régression synthétique', version: '1', enabled: true, confidence: 'medium', source: hopTestSource,
  scope: { varietyId: 'test-variety', yeastId: 'yeast-test', timing: 'fermentation', form: 'pelletT90', doseGL: { min: 3, max: 5 }, temperatureC: { min: 18, max: 22 }, contactHours: { min: 24, max: 72 }, matrixId: 'fixture-beer', notes: 'Ce modèle n’a aucune valeur scientifique ; tests exclusivement.' },
  outputs: [{ target: 'axis:citrus', axisVersion: 'test-1', envelope: { range: { min: 2, max: 9 }, source: hopTestSource },
    calibration: { method: 'Fixture : y = alpha avec un résidu ±0,2, sans signification physique.', intercept: { range: { min: 0, max: 0 }, source: hopTestSource }, residual: { range: { min: -0.2, max: 0.2 }, source: hopTestSource },
      terms: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', support: { min: 0, max: 10 }, coefficient: { range: { min: 1, max: 1 }, source: hopTestSource } }] } }] });
export const testHopData = (extra: HopKnowledge[] = []): HopEngineData => ({ varieties: [hopTestVariety()], lots: [hopTestLot()],
  knowledge: structuredClone([testHopAxis, testHopYeast, testHopPolicy, testHopModel(), ...extra]) });
