import { describe, expect, it, vi } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { BrewingScenarioRuntimeCurrent } from '../../src/domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import * as decisionModule from '../../src/services/hopV55/decision';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { applyHopV55DecisionCriteriaCorrection, reevaluateHopV55DecisionReading } from '../../src/services/hopV55/decisionCorrection';

const source = { kind: 'observation' as const, title: 'Fixture locale', author: 'Suite locale', year: 2026, reference: 'fixture:q07' };

function materials(): HopDecisionMaterial[] {
  return [
    { id: 'fixture:resin', name: 'Échantillon résineux', form: 'pelletT90', availableGrams: 100,
      variety: { id: 'variety:resin', name: 'Échantillon résineux', aliases: [], form: 'pelletT90', analysis: [], descriptions: [{ text: 'pine resin', context: 'rawHop', source }] } },
    { id: 'fixture:tropical', name: 'Lot tropical maison', form: 'pelletT90', availableGrams: 100,
      variety: { id: 'variety:tropical', name: 'Lot tropical maison', aliases: [], form: 'pelletT90', analysis: [], descriptions: [{ text: 'tropical mango', context: 'rawHop', source }] } },
  ];
}

function prepared(materialRows: HopDecisionMaterial[] = materials(), programOverride?: HopDecisionProgram | null): PreparedBrewingScenarioContext {
  const program: HopDecisionProgram | null = programOverride === undefined
    ? { id: 'fixture-q07-program', revision: 1, stage: 'planning', volumeL: 20, wortGravity: 1.048, additions: [] }
    : programOverride;
  const current: BrewingScenarioRuntimeCurrent = {
    recipeReference: 'fixture:q07-recipe', inputReference: 'fixture:q07-input',
    input: { volumeL: 20, additions: [], yeastId: null } as unknown as BrewingScenarioRuntimeCurrent['input'],
    program, performedAdditionIds: [], culture: { state: 'unknown', members: [], explanation: 'Fixture sans culture résolue.' },
  };
  return { version: 'brewing-scenario-context-v1', runtime: { engineData: { varieties: [], lots: [], knowledge: [] },
    materials: materialRows, current }, limitations: [], provenance: ['Fixture synthétique locale.'] };
}

describe('correction explicite de lecture de décision', () => {
  it('recalcule depuis les choix corrigés sans reparcourir ni muter la question ou les propositions archivées', () => {
    const question = 'Je veux éviter pin et résine et garder une amertume élevée; le tropical est non requis et non exclu.';
    const context = prepared();
    const reading = readHopV55Question(question, context);
    const beforeReading = structuredClone(reading);
    const originalArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-q07-original', ownerKey: 'fixture-owner',
      workspaceId: 'workspace-q07', recordedAt: '2026-10-02T17:59:00.000Z', reading,
      source: { kind: 'exploration' }, runtimeReference: 'fixture-runtime-q07-v1' });
    const beforeArchive = structuredClone(originalArchive);
    const oldArchiveShape = structuredClone({
      intent: reading.intent, interpretation: reading.interpretation, response: reading.response,
      branches: reading.branches, unresolved: reading.unresolved,
    });
    const drafts = structuredClone(reading.criterionDrafts);
    const bitterness = drafts.find(row => row.term.toLowerCase().includes('amertume'))!;
    bitterness.direction = 'increase';
    bitterness.qualification = 'forte';
    const optionalTropical = drafts.find(row => row.term.toLowerCase().includes('tropical'))!;

    const corrected = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: drafts, prepared: context,
      sourceReadingReference: originalArchive.contentReference, recordedAt: '2026-10-02T18:00:00.000Z' });

    expect(reading).toEqual(beforeReading);
    expect({ intent: reading.intent, interpretation: reading.interpretation, response: reading.response,
      branches: reading.branches, unresolved: reading.unresolved }).toEqual(oldArchiveShape);
    expect(corrected.intent.question).toBe(question);
    expect(corrected.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ direction: 'exclude', familyId: 'resin' }),
      expect.objectContaining({ direction: 'increase', label: expect.stringMatching(/amertume.*forte/i) }),
    ]));
    expect(corrected.intent.criteria.some(row => row.familyId === 'tropical')).toBe(false);
    expect(corrected.criterionDrafts.find(row => row.id === bitterness.id)).toMatchObject({
      source: bitterness.source, term: 'amertume', direction: 'increase', qualification: 'forte', requirement: 'required', origin: 'brasseur',
    });
    expect(corrected.criterionDrafts.find(row => row.id === optionalTropical.id)).toMatchObject({
      direction: null, requirement: 'optional', origin: 'parser',
    });
    expect(corrected.correction).toEqual({ sourceReadingReference: originalArchive.contentReference,
      recordedAt: '2026-10-02T18:00:00.000Z', actor: { label: 'Brasseur' }, changedCriterionIds: [bitterness.id] });
    expect(corrected.response?.intent.originalQuestion).toBe(question);
    expect(corrected.response?.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: expect.stringMatching(/amertume.*forte/i), role: 'seek', origin: 'user' }),
    ]));
    const correctedArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-q07-corrected', ownerKey: 'fixture-owner',
      workspaceId: 'workspace-q07', recordedAt: '2026-10-02T18:00:00.000Z', reading: corrected,
      source: { kind: 'exploration' }, runtimeReference: 'fixture-runtime-q07-v1' });
    expect(readHopV55DecisionReadingArchive(originalArchive)).toMatchObject({
      status: 'available', archive: { contentReference: beforeArchive.contentReference, reading: beforeArchive.reading },
    });
    expect(readHopV55DecisionReadingArchive(correctedArchive)).toMatchObject({ status: 'available', archive: {
      format: 'hop-v55-decision-reading-v2',
      reading: { correction: { sourceReadingReference: originalArchive.contentReference, changedCriterionIds: [bitterness.id] } },
    } });
    expect(originalArchive).toEqual(beforeArchive);
  });

  it('efface la famille périmée quand le brasseur corrige le terme et refuse un fragment source altéré', () => {
    const context = prepared();
    const reading = readHopV55Question('Éviter la résine.', context);
    const sourceRow = reading.criterionDrafts.find(row => row.familyId === 'resin')!;
    const renamed = structuredClone(reading.criterionDrafts);
    renamed[0].term = 'pin frais';
    expect(() => applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: renamed, prepared: context,
      sourceReadingReference: 'reading:q07-source', recordedAt: '2026-10-02T18:01:00.000Z' })).not.toThrow();
    const corrected = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: renamed, prepared: context,
      sourceReadingReference: 'reading:q07-source', recordedAt: '2026-10-02T18:01:00.000Z' });
    expect(corrected.criterionDrafts.find(row => row.id === sourceRow.id)).toMatchObject({
      term: 'pin frais', source: sourceRow.source, origin: 'brasseur',
    });
    expect(corrected.criterionDrafts.find(row => row.id === sourceRow.id)?.familyId).toBeUndefined();

    const altered = structuredClone(renamed);
    altered[0].source.text = 'fragment inventé';
    expect(() => applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: altered, prepared: context,
      sourceReadingReference: 'reading:q07-source', recordedAt: '2026-10-02T18:02:00.000Z' }))
      .toThrow(/fragment source exact/i);
    expect(reading.criterionDrafts.find(row => row.id === sourceRow.id)).toEqual(sourceRow);
  });

  it('préserve les drafts typed Q04 tels quels pendant une correction de critères', () => {
    const question = 'Garder une amertume élevée et faire du dryhopping; retirer 20 g de moins dans le moût.';
    const context = prepared();
    const reading = readHopV55Question(question, context);
    const operationDrafts = structuredClone(reading.operationDrafts ?? []);
    expect(operationDrafts.map(row => row.kind)).toEqual(['add', 'remove']);
    const criteria = structuredClone(reading.criterionDrafts);
    const bitterness = criteria.find(row => row.term === 'amertume')!;
    bitterness.direction = 'increase';

    const corrected = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: criteria, prepared: context,
      sourceReadingReference: 'archive:q04-before-correction', recordedAt: '2026-10-02T18:03:00.000Z' });
    expect(corrected.operationDrafts).toEqual(operationDrafts);
    expect(corrected.operationDrafts?.[0].sourceSpan?.text).toBe('faire du dryhopping');
    expect(corrected.operationDrafts?.[1]).toMatchObject({ kind: 'remove', quantity: { kind: 'partial', grams: 20 }, sourceScope: 'hotSide' });
  });

  it('réévalue une lecture V2 corrigée avec le programme actif sans reparsing ni fait physique ajouté', () => {
    const question = 'Plus de poire, garder le floral, sans forcément tropical; éviter Échantillon résineux; ajouter du houblon à froid.';
    const citrus: HopDecisionMaterial = { id: 'fixture:citrus', name: 'Référence agrumes', form: 'pelletT90', availableGrams: 100,
      variety: { id: 'variety:citrus', name: 'Référence agrumes', aliases: [], form: 'pelletT90', analysis: [],
        descriptions: [{ text: 'citrus grapefruit', context: 'rawHop', source }] } };
    const contextMaterials = [...materials(), citrus];
    const sourceContext = prepared(contextMaterials, null);
    const reading = readHopV55Question(question, sourceContext);
    expect(reading.response?.actionKind).toBe('exploreStrategies');
    expect(reading.branches).toEqual([]);
    expect(reading.operationDrafts?.length).toBeGreaterThan(0);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'floral', direction: 'keep', requirement: 'required' }),
      expect.objectContaining({ term: 'tropical', direction: null, requirement: 'optional' }),
    ]));

    const criteria = structuredClone(reading.criterionDrafts);
    const floral = criteria.find(row => row.term === 'floral')!;
    floral.direction = 'increase';
    floral.qualification = 'choix explicite de la brasseuse';
    const corrected = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: criteria, prepared: sourceContext,
      sourceReadingReference: 'archive:corrected-v2-source', recordedAt: '2026-10-02T20:00:00.000Z' });
    const beforeReevaluation = structuredClone(corrected);
    const operationDrafts = structuredClone(corrected.operationDrafts);
    const correction = structuredClone(corrected.correction);

    const currentContext = structuredClone(prepared(contextMaterials, null));
    delete currentContext.runtime.current;
    const activeProgram: HopDecisionProgram = { id: 'fixture-active-copy-program', revision: 3, stage: 'fermenting', volumeL: 20,
      wortGravity: 1.048, additions: [{ id: 'copy-source-addition', materialId: 'fixture:citrus', grams: 23, use: 'boil', status: 'planned' }] };
    const parseSpy = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const fresh = reevaluateHopV55DecisionReading({ reading: corrected, prepared: currentContext,
        archiveFormat: 'hop-v55-decision-reading-v2', program: activeProgram });

      expect(parseSpy).not.toHaveBeenCalled();
      expect(corrected).toEqual(beforeReevaluation);
      expect(fresh.intent.question).toBe(question);
      expect(fresh.intent.criteria).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: expect.stringMatching(/rechercher.*floral.*choix explicite/i), direction: 'increase' }),
      ]));
      expect(fresh.criterionDrafts.find(row => row.id === floral.id)).toMatchObject({
        id: floral.id, source: floral.source, term: 'floral', direction: 'increase',
        qualification: 'choix explicite de la brasseuse', origin: 'brasseur',
      });
      expect(fresh.criterionDrafts.find(row => row.term === 'tropical')).toMatchObject({ direction: null, requirement: 'optional' });
      expect(fresh.operationDrafts).toEqual(operationDrafts);
      expect(fresh.correction).toEqual(correction);
      expect(fresh.branches).toEqual([]);
      expect(fresh.response?.actionKind).toBe('exploreStrategies');
      if (fresh.response?.actionKind !== 'exploreStrategies') throw new Error('La lecture conseil doit conserver son action.');
      expect(fresh.response.result.stage).toBe('fermenting');
      expect(fresh.response.result.options.some(option => option.programScope.kind === 'removePlanned'
        && option.programScope.additionIds.includes('copy-source-addition'))).toBe(true);
      expect(fresh.response.result.options.every(option => option.exclusions.some(exclusion =>
        exclusion.materialId === 'fixture:resin' && exclusion.status === 'excluded'))).toBe(true);
      expect(currentContext.runtime.current).toBeUndefined();
      expect(fresh.unresolved.some(message => message.includes('programme vaut null'))).toBe(false);
      const reevaluatedArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:reevaluated-v2', ownerKey: 'fixture-owner',
        workspaceId: 'workspace:reevaluation', recordedAt: '2026-10-02T20:05:00.000Z', reading: fresh,
        source: { kind: 'exploration' }, runtimeReference: 'fixture-runtime-active-copy' });
      expect(readHopV55DecisionReadingArchive(reevaluatedArchive)).toMatchObject({ status: 'available', archive: {
        reading: { correction, operationDrafts },
      } });
    } finally {
      parseSpy.mockRestore();
    }
  });

  it('réévalue les fiches produits depuis les IDs archivés et refuse les formats/actions incompatibles', () => {
    const question = 'Comparer Cryo Hops et HyperBoost pour un dry-hop.';
    const context = prepared();
    const reading = readHopV55Question(question, context);
    expect(reading.response?.actionKind).toBe('understandProducts');

    const fresh = reevaluateHopV55DecisionReading({ reading, prepared: context, archiveFormat: 'hop-v55-decision-reading-v2' });
    expect(fresh.response?.actionKind).toBe('understandProducts');
    if (fresh.response?.actionKind !== 'understandProducts') throw new Error('L’action catalogue doit rester typée.');
    expect(fresh.response.result.products.map(row => row.id)).toEqual(['ych-cryo-hops', 'ych-hyperboost']);
    const sourceV3 = structuredClone(reading);
    const noParse = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const refreshedV3 = reevaluateHopV55DecisionReading({ reading: sourceV3, prepared: context,
        archiveFormat: 'hop-v55-decision-reading-v3' });
      expect(noParse).not.toHaveBeenCalled();
      expect(sourceV3).toEqual(reading);
      expect(refreshedV3.intent).toEqual(fresh.intent);
      expect(refreshedV3.response).toEqual(fresh.response);
    } finally { noParse.mockRestore(); }

    expect(() => reevaluateHopV55DecisionReading({ reading, prepared: context,
      archiveFormat: 'hop-v55-decision-reading-v1' })).toThrow(/texte.*archive V1/i);
    const operation = readHopV55Question('Ajoute 10 g de Échantillon résineux à l’ébullition.', context);
    expect(() => reevaluateHopV55DecisionReading({ reading: operation, prepared: context,
      archiveFormat: 'hop-v55-decision-reading-v2' })).toThrow(/action archivée|branche concrète/i);
  });
});
