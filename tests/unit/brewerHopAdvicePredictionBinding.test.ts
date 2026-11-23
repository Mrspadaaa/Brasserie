import { describe, expect, it } from 'vitest';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope,
  brewerAdviceFromHopProposal,
  createBrewerHopAdviceProposalEnvelope,
  qualifyBrewerHopAdviceEvidence,
  verifyBrewerHopAdviceEvidence,
  type BrewerHopAdviceEvidenceSource,
  type BrewerHopAdviceProposalEnvelope,
} from '../../functions/src/brewerHopAdviceProposal';
import {
  assertBrewerHopAdvicePredictionSnapshot,
  tryCreateBrewerHopAdvicePredictionSnapshot,
  resolveBrewerHopAdvicePredictionContribution,
  type BrewerHopAdvicePredictionSnapshotV1,
} from '../../functions/src/brewerHopAdvicePredictionEvidence';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { projectBrewerHopAdviceContext } from '../../functions/src/brewerHopAdviceContextBinding';
import { compactHopEvidence } from '../../src/domain/hopIndex/companionPrediction';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import type { HopPrediction } from '../../functions/src/hopPredictionSchema';
import type { HopRecipeInput, HopRecipePrediction } from '../../functions/src/hopRecipePrediction';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';

const source = { title: 'Paramètre logiciel', author: 'Fixture locale', year: 2026, kind: 'research' as const,
  reference: 'fixture:prediction-model-v1', locator: 'sortie synthétique' };

const triplet = (varietyId = 'variety:cascade', yeastId = 'yeast:ale') => ({ varietyId, lotId: null, yeastId,
  timing: 'boil' as const, doseGL: 1.5, temperatureC: null, contactHours: null, matrixId: null });

const estimate = (range: { min: number; max: number } | null = { min: 20, max: 30 }) => ({
  range, confidence: range ? 'medium' as const : 'low' as const,
  sources: range ? [structuredClone(source)] : [], reasons: range ? ['repère de fixture'] : ['valeur inconnue'],
});

const prediction = (varietyId = 'variety:cascade', yeastId = 'yeast:ale'): HopPrediction => ({
  triplet: triplet(varietyId, yeastId),
  profile: { citrus: estimate({ min: 10, max: 20 }) },
  compounds: { '4mmpFree': estimate(null) },
  score: estimate({ min: 35, max: 45 }),
  risks: [], modelRefs: [{ id: 'model:fixture', version: '4' }], reasons: ['limite de la fixture'],
});

function recipePrediction(yeastId = 'yeast:ale', rangeMax = 20, unit: 'ug' | 'mg' = 'ug'): HopRecipePrediction {
  const input: HopRecipeInput = {
    volumeL: 20, yeastId,
    additions: [{ id: 'addition:dry-1', name: 'Ajout tardif', triplet: triplet('variety:cascade', yeastId), dayOffset: 0 }],
    fermentation: [],
  };
  const first = prediction('variety:cascade', yeastId);
  const overall: HopRecipePrediction['overall'] = {
    profile: { citrus: estimate({ min: 10, max: rangeMax }) },
    compounds: { '4mmpFree': { ...estimate(null), unit: null } as HopRecipePrediction['chemistry']['final'][string] },
    score: estimate({ min: 35, max: 45 }), risks: [], modelRefs: [{ id: 'model:fixture', version: '4' }],
    reasons: ['enveloppe conditionnelle de fixture'], conditionalEnvelope: true, interactionsNonQuantifiees: true,
  };
  return {
    engineVersion: 'hop-recipe-experimental-v5', input, additions: [first], overall,
    chemistry: {
      introduced: { '4mmpFree': { analyte: '4mmpFree', unit, basis: 'introduced', range: null, confidence: 'low', sources: [],
        reasons: ['dosage non quantifié'], coverage: { knownAdditions: 0, totalAdditions: 1 } } },
      final: { '4mmpFree': { ...estimate(null), unit: null } },
    },
    warnings: ['Les interactions restent non quantifiées.'],
  };
}

type Selection = { kind: 'alternative'; index?: number } | { kind: 'recipeOverall' }
  | { kind: 'recipeAddition'; additionId: string };

const fixtureScope = { kind: 'recipe' as const, id: 'fixture-recipe' };
const fixtureBinding = () => {
  const fixtureRecipe = { ...recipe(), id: fixtureScope.id } as ReturnType<typeof recipe> & { id: string };
  const context: BrewerContext = { recipe: fixtureRecipe, journal: brewState(fixtureRecipe), now: 0, phase: 'planning', provenance: ['Fixture synthétique.'],
    inventory: [], material: [], waterSources: [], editableTargets: [], equipment: { id: 'fixture', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment } };
  const prepared = prepareBrewingScenarioContext(context);
  const result = projectBrewerHopAdviceContext({ scope: fixtureScope, context, runtime: prepared.runtime });
  if (result.status !== 'ready') throw new Error(`Fixture de contexte invalide : ${result.reason}`);
  return result.projection;
};
const fixtureLaunch = () => ({
  format: 'brewer-hop-advice-context-launch-v1' as const,
  ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference: 'reading:fixture',
  source: { kind: 'recipe' as const, id: fixtureScope.id }, sourceRuntimeReference: 'source-runtime:fixture',
  scope: { ...fixtureScope }, expected: fixtureBinding(),
});

function makeEnvelope(data: unknown, selection?: Selection, evidenceIds: string[] = [], sourceOverride?: BrewerHopAdviceEvidenceSource): {
  envelope: BrewerHopAdviceProposalEnvelope;
  source: BrewerHopAdviceEvidenceSource;
} {
  const question = 'Je veux comparer une piste aromatique dans ma bière.';
  const source: BrewerHopAdviceEvidenceSource = sourceOverride ?? { id: 'E1', name: 'predict_hop_aroma', label: 'Prédiction fixture', data };
  const computed = selection ? { evidenceId: source.id, predictionSelection: selection }
    : source.name === 'predict_hop_aroma' && evidenceIds.length === 0 ? { evidenceId: source.id } : undefined;
  const launch = fixtureLaunch();
  const envelope = createBrewerHopAdviceProposalEnvelope({
    request: { format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question, sourceReadingReference: launch.sourceReadingReference,
      contextLaunch: launch, readerAnnotations: [], readerScopes: [] },
    raw: {
      readerReview: [], annotations: [], scopes: [], openQuestions: [], materials: [],
      answer: {
        summary: 'Une comparaison conditionnelle reste utile.', readingNote: 'La piste est une proposition.',
        options: [{ id: 'assist-option', kind: 'characterization', title: 'Comparer les pistes', rationale: 'Le résultat reste lié au modèle et à ses limites.',
          conditions: [], tradeoffs: [], related: [], evidenceIds,
          ...(computed ? { computed } : {}),
        }],
        unknowns: [], program: { kind: 'none', note: 'Aucun programme n’est proposé.' }, refusals: [],
      },
    },
    evidence: [source], readers: {}, serverContext: { phase: 'fixture', provenance: ['données synthétiques'], loadedAt: 0, binding: fixtureBinding() },
  });
  return { envelope, source };
}

function currentRecipeToolPayload(yeastId = 'yeast:ale', rangeMax = 20, unit: 'ug' | 'mg' = 'ug'): unknown {
  return compactHopEvidence(recipePrediction(yeastId, rangeMax, unit));
}

describe('P01 — rattachement d’une contribution de prédiction au payload exact', () => {
  it('lie un index zéro-based à tout le tableau ordonné et restitue l’objet sélectionné', () => {
    const data = [prediction('variety:cascade'), prediction('variety:nelson')];
    const { envelope, source: toolEvidence } = makeEnvelope(data, { kind: 'alternative', index: 1 });
    const record = envelope.evidence.records[0];
    expect(record.kind).toBe('prediction');
    if (record.kind !== 'prediction') throw new Error('snapshot de prédiction attendu');
    const option = envelope.proposal.answer.options[0];
    expect(option.provenance).toBe('toolComputed');
    const computed = option.computed;
    expect(computed && 'predictionSelection' in computed && computed.predictionSelection).toEqual({
      kind: 'alternative', index: 1, reference: record.snapshot.reference,
    });
    if (!computed || !('predictionSelection' in computed)) throw new Error('sélecteur de prédiction attendu');
    const resolved = resolveBrewerHopAdvicePredictionContribution(record.snapshot, computed.predictionSelection);
    expect(resolved.kind).toBe('alternative');
    if (resolved.kind !== 'alternative') throw new Error('alternative attendue');
    expect(resolved.prediction).toEqual(data[1]);
    expect(() => verifyBrewerHopAdviceEvidence(envelope, [toolEvidence])).not.toThrow();
  });

  it('refuse la qualification si la plage, le triplet, l’unité ou une dépendance change sous le même evidenceId', () => {
    const cases: Array<{ label: string; data: () => any }> = [
      { label: 'plage de profil', data: () => {
        const value = [prediction()]; if (value[0].profile.citrus.range) value[0].profile.citrus.range.max += 1; return value;
      } },
      { label: 'triplet', data: () => {
        const value = [prediction()]; if (value[0].triplet.doseGL !== null) value[0].triplet.doseGL += 0.25; return value;
      } },
      { label: 'unité analytique', data: () => currentRecipeToolPayload('yeast:ale', 20, 'mg') },
      { label: 'dépendance d’entrée', data: () => currentRecipeToolPayload('yeast:other', 20, 'ug') },
    ];
    for (const entry of cases) {
      const original = entry.label === 'unité analytique'
        ? currentRecipeToolPayload('yeast:ale', 20, 'ug')
        : entry.label === 'dépendance d’entrée' ? currentRecipeToolPayload('yeast:ale', 20, 'ug') : [prediction()];
      const { envelope } = makeEnvelope(original,
        entry.label === 'unité analytique' || entry.label === 'dépendance d’entrée' ? { kind: 'recipeOverall' } : { kind: 'alternative', index: 0 });
      expect(() => verifyBrewerHopAdviceEvidence(envelope, [{ id: 'E1', name: 'predict_hop_aroma', label: 'Prédiction fixture', data: entry.data() }]), entry.label)
        .toThrow(/dépendance d’outil du tour manque ou son contenu a changé|ne correspond plus au résultat d’outil exact/);
    }
  });

  it('refuse le déplacement d’index après permutation, même si le même evidenceId subsiste', () => {
    const { envelope } = makeEnvelope([prediction('variety:cascade'), prediction('variety:nelson')], { kind: 'alternative', index: 1 });
    const permuted = [prediction('variety:nelson'), prediction('variety:cascade')];
    expect(() => verifyBrewerHopAdviceEvidence(envelope, [{ id: 'E1', name: 'predict_hop_aroma', label: 'Prédiction fixture', data: permuted }]))
      .toThrow(/dépendance d’outil du tour manque ou son contenu a changé|ne correspond plus au résultat d’outil exact/);
  });

  it('résout le résultat global ou un ajout précis et développe les dictionnaires compacts sans perdre les inconnues', () => {
    const { envelope, source: toolEvidence } = makeEnvelope(currentRecipeToolPayload(), { kind: 'recipeAddition', additionId: 'addition:dry-1' });
    const record = envelope.evidence.records[0];
    expect(record.kind).toBe('prediction');
    if (record.kind !== 'prediction') throw new Error('snapshot de prédiction attendu');
    const option = envelope.proposal.answer.options[0];
    const selection = option.computed && 'predictionSelection' in option.computed ? option.computed.predictionSelection : undefined;
    expect(selection?.kind).toBe('recipeAddition');
    if (!selection || selection.kind !== 'recipeAddition') throw new Error('sélecteur d’ajout attendu');
    const resolved = resolveBrewerHopAdvicePredictionContribution(record.snapshot, selection);
    expect(resolved.kind).toBe('recipeAddition');
    if (resolved.kind !== 'recipeAddition') throw new Error('contribution d’ajout attendue');
    expect(resolved.addition.id).toBe('addition:dry-1');
    expect(resolved.prediction.triplet).toEqual(resolved.addition.triplet);
    expect(resolved.prediction.compounds['4mmpFree'].range).toBeNull();
    const overall = resolveBrewerHopAdvicePredictionContribution(record.snapshot, {
      kind: 'recipeOverall', reference: record.snapshot.reference,
    });
    expect(overall.kind).toBe('recipeOverall');
    if (overall.kind !== 'recipeOverall') throw new Error('résultat global attendu');
    expect(overall.prediction.compounds['4mmpFree'].range).toBeNull();
    const snapshot = record.snapshot as BrewerHopAdvicePredictionSnapshotV1;
    if (snapshot.form !== 'currentRecipe') throw new Error('prédiction de recette attendue');
    expect(snapshot.payload.chemistry.introduced['4mmpFree'].unit).toBe('ug');
    expect(snapshot.payload.chemistry.introduced['4mmpFree'].range).toBeNull();
    expect(snapshot.payload.chemistry.final['4mmpFree'].unit).toBeNull();
    expect(() => verifyBrewerHopAdviceEvidence(envelope, [toolEvidence])).not.toThrow();
  });

  it('R04 : garde unit=ngL du vrai résultat de recette v5 après sérialisation et sélection', () => {
    const toolResult = runBrewerTool('predict_hop_aroma', {}, makeHopV55FixtureContext('planning'));
    const evidence = { ...toolResult, id: 'E1', model: 'fixture-model-metadata',
      products: [{ name: 'Produit associé', supplier: 'Fournisseur fixture', url: 'https://example.invalid/item',
        availability: 'unknown' as const, availabilityText: 'Non vérifiée', checkedAt: 1 }] } as unknown as BrewerHopAdviceEvidenceSource;
    const data = evidence.data as any;
    expect(data.engineVersion).toBe('hop-recipe-experimental-v5');
    expect(data.overall.compounds['4mmpFree'].unit).toBe('ngL');
    const originalEvidence = structuredClone(evidence);

    const overallEnvelope = makeEnvelope(data, { kind: 'recipeOverall' }, [], evidence).envelope;
    const overallRecord = overallEnvelope.evidence.records.find((entry) => entry.id === 'E1');
    expect(overallRecord?.kind).toBe('prediction');
    if (overallRecord?.kind !== 'prediction') throw new Error('snapshot v5 attendu');
    const overallLink = overallEnvelope.proposal.answer.options[0].computed;
    if (!overallLink || !('predictionSelection' in overallLink)) throw new Error('sélecteur global attendu');
    const overall = resolveBrewerHopAdvicePredictionContribution(overallRecord.snapshot, overallLink.predictionSelection);
    expect(overall.kind).toBe('recipeOverall');
    if (overall.kind !== 'recipeOverall') throw new Error('contribution globale attendue');
    expect(overall.prediction.compounds['4mmpFree'].unit).toBe('ngL');
    expect(overall.prediction.compounds['4mmpFree'].range).toEqual(data.overall.compounds['4mmpFree'].range);
    const overallRoundTrip = JSON.parse(JSON.stringify(overallEnvelope));
    expect(() => assertBrewerHopAdviceProposalEnvelope(overallRoundTrip)).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(overallRoundTrip, [evidence])).not.toThrow();

    const additionId = data.input.additions[0].id as string;
    const additionEnvelope = makeEnvelope(data, { kind: 'recipeAddition', additionId }, [], evidence).envelope;
    const additionRecord = additionEnvelope.evidence.records.find((entry) => entry.id === 'E1');
    expect(additionRecord?.kind).toBe('prediction');
    if (additionRecord?.kind !== 'prediction') throw new Error('snapshot v5 attendu');
    const additionLink = additionEnvelope.proposal.answer.options[0].computed;
    if (!additionLink || !('predictionSelection' in additionLink)) throw new Error('sélecteur d’ajout attendu');
    const addition = resolveBrewerHopAdvicePredictionContribution(additionRecord.snapshot, additionLink.predictionSelection);
    expect(addition.kind).toBe('recipeAddition');
    if (addition.kind !== 'recipeAddition') throw new Error('contribution d’ajout attendue');
    expect(addition.addition.id).toBe(additionId);
    expect(addition.prediction.triplet).toEqual(addition.addition.triplet);
    const additionRoundTrip = JSON.parse(JSON.stringify(additionEnvelope));
    expect(() => assertBrewerHopAdviceProposalEnvelope(additionRoundTrip)).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(additionRoundTrip, [evidence])).not.toThrow();
    expect(evidence).toEqual(originalEvidence);
  });

  it('R04 : refuse une unité non prévue sans retirer l’unit ngL réellement produit', () => {
    const result = runBrewerTool('predict_hop_aroma', {}, makeHopV55FixtureContext('planning'));
    const evidence = { ...result, id: 'E1' } as unknown as BrewerHopAdviceEvidenceSource;
    const data = structuredClone(evidence.data) as any;
    expect(data.overall.compounds['4mmpFree'].unit).toBe('ngL');
    data.overall.compounds['4mmpFree'].unit = 'BU';
    expect(tryCreateBrewerHopAdvicePredictionSnapshot(data)).toBeUndefined();
    const invalidEvidence = { ...evidence, data };
    const envelope = makeEnvelope(data, { kind: 'recipeOverall' }, [], invalidEvidence).envelope;
    expect(envelope.evidence.records.find((entry) => entry.id === 'E1')?.kind).toBe('reference');
    expect(envelope.proposal.answer.options[0].computed).toBeUndefined();
    expect(envelope.proposal.answer.options[0].provenance).toBe('toolExploration');
    expect((invalidEvidence.data as any).overall.compounds['4mmpFree'].unit).toBe('BU');
  });

  it('R04 : refuse une unité globale qui diverge de chemistry.final, même avec une référence fraîche', () => {
    const referenceSnapshot = (payload: unknown) => {
      const content = { format: 'brewer-hop-advice-prediction-v1' as const, form: 'currentRecipe' as const, payload };
      return { ...content, reference: hopAdviceContentReference('brewer-hop-advice-prediction-v1', content) };
    };
    const coherentNull = currentRecipeToolPayload() as any;
    expect(coherentNull.overall.compounds['4mmpFree'].unit).toBeNull();
    expect(coherentNull.chemistry.final['4mmpFree'].unit).toBeNull();
    const nullSnapshot = tryCreateBrewerHopAdvicePredictionSnapshot(coherentNull);
    expect(nullSnapshot).toBeDefined();
    if (!nullSnapshot) throw new Error('snapshot cohérent attendu');
    const nullResult = resolveBrewerHopAdvicePredictionContribution(nullSnapshot, {
      kind: 'recipeOverall', reference: nullSnapshot.reference,
    });
    expect(nullResult.kind).toBe('recipeOverall');
    if (nullResult.kind !== 'recipeOverall') throw new Error('résultat global attendu');
    expect(nullResult.prediction.compounds['4mmpFree'].unit).toBeNull();

    const coherentNgL = structuredClone(coherentNull);
    coherentNgL.overall.compounds['4mmpFree'].unit = 'ngL';
    coherentNgL.chemistry.final['4mmpFree'].unit = 'ngL';
    expect(() => assertBrewerHopAdvicePredictionSnapshot(referenceSnapshot(coherentNgL))).not.toThrow();
    expect(tryCreateBrewerHopAdvicePredictionSnapshot(coherentNgL)).toBeDefined();

    const mutations: Array<{ label: string; mutate: (payload: any) => void }> = [
      { label: 'unité absente', mutate: (payload) => { delete payload.overall.compounds['4mmpFree'].unit; } },
      { label: 'null discordant', mutate: (payload) => { payload.overall.compounds['4mmpFree'].unit = null; } },
    ];
    for (const mutation of mutations) {
      const payload = structuredClone(coherentNgL);
      mutation.mutate(payload);
      const rehashed = referenceSnapshot(payload);
      expect(() => assertBrewerHopAdvicePredictionSnapshot(rehashed), mutation.label)
        .toThrow(/overall\.compounds\.4mmpFree\.unit ne correspond pas à chemistry\.final\.4mmpFree\.unit/);
      expect(tryCreateBrewerHopAdvicePredictionSnapshot(payload), mutation.label).toBeUndefined();

      const rawEvidence = { id: 'E1', name: 'predict_hop_aroma', label: 'Prédiction fixture', data: payload } as BrewerHopAdviceEvidenceSource;
      const { envelope } = makeEnvelope(payload, { kind: 'recipeOverall' }, [], rawEvidence);
      expect(envelope.evidence.records[0].kind, mutation.label).toBe('reference');
      expect(envelope.proposal.answer.options[0].computed, mutation.label).toBeUndefined();
      expect(envelope.proposal.answer.options[0].provenance, mutation.label).toBe('toolExploration');
      expect(rawEvidence.data, mutation.label).toEqual(payload);
    }
  });

  it('dégrade une sélection absente, hors limites ou un ajout inconnu en exploration explicitement non documentaire', () => {
    const cases: Array<{ data: unknown; selection?: Selection; evidenceIds?: string[] }> = [
      { data: [prediction()], selection: undefined },
      { data: [prediction()], selection: { kind: 'alternative' } },
      { data: [prediction()], selection: { kind: 'alternative', index: 1 } },
      { data: currentRecipeToolPayload(), selection: { kind: 'recipeAddition', additionId: 'addition:absent' } },
      { data: [prediction()], evidenceIds: ['E1'] },
    ];
    for (const item of cases) {
      const { envelope } = makeEnvelope(item.data, item.selection, item.evidenceIds);
      const option = envelope.proposal.answer.options[0];
      expect(option.computed).toBeUndefined();
      expect(option.evidenceIds).toEqual([]);
      expect(option.provenance).toBe('toolExploration');
      expect(option.exploration).toHaveLength(1);
      expect(option.exploration?.[0].evidenceId).toBe('E1');
      expect(option.exploration?.[0].note).toContain('conservé comme exploration');
      const projection = brewerAdviceFromHopProposal(envelope.proposal);
      expect(projection.evidenceIds).toContain('E1');
      expect(projection.why).toContain(option.exploration?.[0].note);
    }
  });

  it('conserve un payload futur ou incomplet en source de tour mais refuse la fausse attribution calculée', () => {
    const missingDictionary = currentRecipeToolPayload() as any;
    delete missingDictionary.sourceDictionary;
    const futurePayload = { engineVersion: 'hop-recipe-experimental-v99', additions: [], overall: {}, arbitrary: 'future' };
    for (const data of [missingDictionary, futurePayload]) {
      const before = structuredClone(data);
      const { envelope, source: toolEvidence } = makeEnvelope(data, { kind: 'recipeOverall' });
      expect(envelope.evidence.records[0].kind).toBe('reference');
      expect(envelope.proposal.answer.options[0].computed).toBeUndefined();
      expect(envelope.proposal.answer.options[0].provenance).toBe('toolExploration');
      expect(envelope.proposal.answer.options[0].exploration?.[0].reason).toBe('payloadUnqualified');
      expect(toolEvidence.data).toEqual(before);
      expect(() => assertBrewerHopAdviceProposalEnvelope(envelope)).not.toThrow();
      expect(() => verifyBrewerHopAdviceEvidence(envelope, [toolEvidence])).not.toThrow();
    }
  });

  it('ne lit pas une référence de sélecteur fournie par le modèle et refuse toute altération du snapshot archivé', () => {
    const { envelope } = makeEnvelope([prediction()], { kind: 'alternative', index: 0 });
    const altered = structuredClone(envelope) as any;
    altered.evidence.records[0].snapshot.payload[0].profile.citrus.range.max += 5;
    expect(() => assertBrewerHopAdviceProposalEnvelope(altered)).toThrow(/référence de contenu différente/);
    const alteredSelection = structuredClone(envelope) as any;
    alteredSelection.proposal.answer.options[0].computed.predictionSelection.reference = 'other-snapshot';
    expect(() => assertBrewerHopAdviceProposalEnvelope(alteredSelection)).toThrow(/rattaché à un autre contenu/);
    const outOfBounds = structuredClone(envelope) as any;
    outOfBounds.proposal.answer.options[0].computed.predictionSelection.index = 9;
    expect(() => assertBrewerHopAdviceProposalEnvelope(outOfBounds)).toThrow(/hors limites/);

    const question = 'Je veux comparer une piste aromatique dans ma bière.';
    expect(() => createBrewerHopAdviceProposalEnvelope({
      request: { format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question, sourceReadingReference: 'reading:fixture',
        contextLaunch: fixtureLaunch(), readerAnnotations: [], readerScopes: [] },
      raw: {
        readerReview: [], annotations: [], scopes: [], openQuestions: [], materials: [],
        answer: { summary: 'Une piste.', readingNote: 'Une proposition.', options: [{ id: 'assist-option', kind: 'characterization',
          title: 'Comparer', rationale: 'Explication qualitative.', conditions: [], tradeoffs: [], related: [], evidenceIds: [],
          computed: { evidenceId: 'E1', predictionSelection: { kind: 'alternative', index: 0, reference: 'invented-reference' } } }],
          unknowns: [], program: { kind: 'none', note: 'Aucune opération.' }, refusals: [] },
      },
      evidence: [{ id: 'E1', name: 'predict_hop_aroma', data: [prediction()] }], readers: {},
      serverContext: { phase: 'fixture', provenance: [], loadedAt: 0, binding: fixtureBinding() },
    })).toThrow();
  });
});

