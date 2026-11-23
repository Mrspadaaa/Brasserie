import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopAlphaModelParameter, HopDecisionMaterial, HopDecisionProgram, HopIbuModelContext } from '../../src/domain/hopDecision/types';
import { hopAlphaObservationReference, readHopAlphaForModel } from '../../src/domain/hopDecision/modelInputs';
import { introducedHopAmounts, estimateBoilIbu } from '../../src/domain/hopDecision/calculations';
import { analyzeHopProgram } from '../../src/domain/hopDecision/programAnalysis';
import { bindHopRecipe } from '../../src/domain/hopDecision/recipeAdapter';
import { previewHopProgramChanges, applyHopProgramProposal } from '../../src/domain/hopDecision/programs';

const source: HopSource = { title: 'Observation fictive de qualification', author: 'Test', year: 2026, kind: 'coa', reference: 'fixture:model-alpha' };
const alpha = (value: number, basis: HopMeasurement['basis'] = 'unknown'): HopMeasurement => ({ analyte: 'alpha', unit: 'percentMass', kind: 'point', value, basis, source, confidence: 'low' });
const material = (measurement: HopMeasurement): HopDecisionMaterial => ({ id: 'A', name: 'A', form: 'pelletT90', availableGrams: 100,
  lot: { id: 'lot-A', name: 'lot-A', varietyId: 'var-A', form: 'pelletT90', analysis: [measurement] } });
const program = (): HopDecisionProgram => ({ id: 'P', revision: 0, stage: 'planning', volumeL: 20, wortGravity: 1.05,
  additions: [{ id: 'h', materialId: 'A', grams: 20, use: 'boil', boilMinutes: 60, status: 'planned' }] });
const recipe = (value = 10) => ({ id: 'R', volumeL: 20, hops: [{ name: 'A', alpha: value, weightG: 20, stage: 'boil' as const, timeMin: 60 }] });
const context: HopIbuModelContext = { variant: 'tinseth-original', volumeL: 20, volumeReference: 'finishedBeer', gravity: 1.05, gravityReference: 'averageBoil', explanation: 'Convention d’essai explicitement renseignée.' };
const parameter = (value: number): HopAlphaModelParameter => ({ analyte: 'alpha', unit: 'percentAlpha', kind: 'point', value, analyticalBasis: 'unknown', origin: 'workingHypothesis', source,
  selectionReason: 'Pourcentage de travail choisi pour cette simulation, pas une mesure nouvelle.' });

describe('alpha de modèle distinct de la charge physique', () => {
  it('un alpha de recette permet un calcul conventionnel sans créer une analyse asIs', () => {
    const binding = bindHopRecipe(recipe(), { materials: [], stage: 'planning', revision: 0, wortGravity: 1.05 });
    const m = binding.materials[0];
    expect(m.declaredAnalysis).toBeUndefined();
    expect(m.alphaForModel).toMatchObject({ value: 10, analyticalBasis: 'unknown', origin: 'recipe' });
    expect(introducedHopAmounts(m, 20).alphaGrams.status).toBe('unknown');
    const report = analyzeHopProgram(binding.program, binding.materials);
    expect(report.alphaGrams.status).toBe('unknown');
    expect(report.hotIbu.value).toBeCloseTo(23.0664077, 6);
    expect(report.additions[0].boilIbu.model).toMatchObject({ convention: 'inputRolesUnspecified', volumeReference: 'unspecified', gravityReference: 'unspecified' });
  });

  it('la valeur de travail ne remplace pas le COA et deux bases différentes ne deviennent pas un faux conflit', () => {
    const m = material(alpha(5, 'asIs'));
    const r = recipe(); r.hops[0] = { ...r.hops[0], hopLotId: 'lot-A' } as typeof r.hops[0];
    const binding = bindHopRecipe(r, { materials: [m], stage: 'planning', revision: 0, wortGravity: 1.05 });
    const bound = binding.materials.find(item => item.id === binding.program.additions[0].materialId)!;
    expect(introducedHopAmounts(bound, 20).alphaGrams.value).toBe(1);
    const reading = readHopAlphaForModel(bound);
    expect(reading.value).toBe(10);
    expect(reading.relationToAnalysis).toBe('notComparable');
    expect(reading.observations).toEqual([alpha(5, 'asIs')]);
  });

  it('qualifie une teneur rapportée sans unité/base inventée et refuse les substituts de grandeur', () => {
    const m = material(alpha(10));
    expect(readHopAlphaForModel(m).value).toBe(10);
    expect(introducedHopAmounts(m, 20).alphaGrams.status).toBe('unknown');
    expect(readHopAlphaForModel(material({ ...alpha(10), unit: 'unknown' })).status).toBe('unknown');
    expect(readHopAlphaForModel(material({ ...alpha(10), analyte: 'beta' })).status).toBe('unknown');
    expect(readHopAlphaForModel(material({ ...alpha(10), unit: 'percentOil', basis: 'oil' })).status).toBe('unknown');
    expect(readHopAlphaForModel(material({ ...alpha(Number.NaN) })).status).toBe('unknown');
    expect(readHopAlphaForModel({ ...m, alphaForModel: { ...parameter(30), analyte: 'cohumulone' } as unknown as HopAlphaModelParameter }).status).toBe('unknown');
  });

  it('distingue le zéro sentinelle, le zéro rapporté et la non-détection sans limite', () => {
    const binding = bindHopRecipe(recipe(0), { materials: [], stage: 'planning', revision: 0, wortGravity: 1.05 });
    expect(readHopAlphaForModel(binding.materials[0]).status).toBe('unknown');
    expect(readHopAlphaForModel(material(alpha(0))).value).toBe(0);
    expect(readHopAlphaForModel(material({ ...alpha(0), kind: 'below', value: undefined })).status).toBe('unknown');
    expect(readHopAlphaForModel(material({ ...alpha(0), kind: 'below', value: undefined, limit: 0.1, limitKind: 'lod' })).range).toEqual({ min: 0, max: 0.1 });
    const censored: HopMeasurement = { ...alpha(0), kind: 'below', value: undefined, limit: 0.1, limitKind: 'lod' };
    const selected = material(censored);
    selected.alphaForModel = { ...parameter(0), value: undefined, kind: 'range', range: { min: 0, max: 0.1 },
      origin: 'selectedObservation', observationRef: hopAlphaObservationReference(censored) };
    expect(readHopAlphaForModel(selected).range).toEqual({ min: 0, max: 0.1 });
    expect(readHopAlphaForModel(selected).observations[0].kind).toBe('below');
  });

  it('ne moyenne pas plusieurs références et vérifie l’identité d’une observation choisie', () => {
    const first = alpha(10), second = alpha(12, 'dryMatter');
    const m = material(first); m.lot!.analysis.push(second);
    expect(readHopAlphaForModel(m).status).toBe('unknown');
    m.alphaForModel = { ...parameter(12), origin: 'selectedObservation', analyticalBasis: 'dryMatter', observationRef: hopAlphaObservationReference(second) };
    expect(readHopAlphaForModel(m).value).toBe(12);
    m.alphaForModel.observationRef = 'unrelated';
    expect(readHopAlphaForModel(m).status).toBe('unknown');
  });

  it('refuse l’aperçu si l’un des deux canaux ou la convention de modèle change', () => {
    const m = { ...material(alpha(5, 'asIs')), alphaForModel: parameter(10) };
    const p = { ...program(), ibuModelContext: context };
    const proposal = previewHopProgramChanges(p, [{ kind: 'replace', additionId: 'h', additions: [{ ...p.additions[0], grams: 25 }] }], [m]);
    expect(() => applyHopProgramProposal(p, proposal, [{ ...m, alphaForModel: parameter(12) }])).toThrow();
    expect(() => applyHopProgramProposal(p, proposal, [{ ...m, lot: { ...m.lot!, analysis: [alpha(6, 'asIs')] } }])).toThrow();
    expect(() => applyHopProgramProposal({ ...p, ibuModelContext: { ...context, gravity: 1.06 } }, proposal, [m])).toThrow();
    expect(JSON.parse(JSON.stringify(proposal)).materialReferences).toEqual(proposal.materialReferences);
  });

  it('une sélection explicite ne transfère pas une observation de cône à un extrait', () => {
    const observation = alpha(10, 'asIs');
    const m: HopDecisionMaterial = { id: 'X', name: 'X', form: 'extract',
      variety: { id: 'V', name: 'V', aliases: [], form: 'cone', descriptions: [], analysis: [observation] },
      alphaForModel: { ...parameter(10), origin: 'selectedObservation', analyticalBasis: 'asIs', observationRef: hopAlphaObservationReference(observation) } };
    expect(readHopAlphaForModel(m).status).toBe('unknown');
    expect(readHopAlphaForModel(m).observations).toEqual([observation]);
    m.form = 'cone';
    expect(readHopAlphaForModel(m).value).toBe(10);
  });

  it('sépare le volume de contact et les entrées du modèle et nomme les variantes', () => {
    const m = material(alpha(10));
    const p = { ...program(), ibuModelContext: { ...context, volumeL: 10 } };
    const report = analyzeHopProgram(p, [m]);
    expect(report.additions[0].doseGL.value).toBe(1);
    expect(report.hotIbu.value).toBeCloseTo(46.13281545, 7);
    const args = { grams: 20, alpha: readHopAlphaForModel(m), volumeL: 20, wortGravity: 1.05, minutes: 60, use: 'boil' as const };
    expect(estimateBoilIbu({ ...args, modelContext: { ...context, gravityReference: 'originalGravity' } }).status).toBe('unknown');
    const variant = estimateBoilIbu({ ...args, modelContext: { ...context, variant: 'tinseth-declared-variant', gravityReference: 'originalGravity', explanation: 'OG employée comme approximation, non comme densité moyenne mesurée.' } });
    expect(variant.value).toBeCloseTo(23.0664077, 6);
    expect(variant.model).toMatchObject({ convention: 'declaredVariant', gravityReference: 'originalGravity' });
    expect(estimateBoilIbu({ ...args, modelContext: { ...context, volumeL: null } as unknown as HopIbuModelContext }).status).toBe('unknown');
  });
});
