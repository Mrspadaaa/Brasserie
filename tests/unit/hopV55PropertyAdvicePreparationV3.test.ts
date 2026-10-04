import { describe, expect, it, vi } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { assertHopPropertyAdviceRequest, assertHopPropertyAdviceRequestV3,
  type HopPropertyAdviceIntent, type HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import * as decisionModule from '../../src/services/hopV55/decision';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { applyHopV55DecisionCriteriaCorrection, applyHopV55SemanticCorrectionV1 } from '../../src/services/hopV55/decisionCorrection';
import { createHopV55DecisionReadingArchiveV4, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1 } from '../../src/services/hopV55/propertyAdviceSemanticPreparationV3';
import { reviseHopV55PropertyAdviceRequestDraft,
  prepareHopV55PropertyAdviceRequestDraft,
  type HopV55PropertyAdviceRequestDraftV2 } from '../../src/services/hopV55/propertyAdvicePreparation';
import {
  HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT,
  assertHopV55PropertyAdviceRequestDraftV3,
  hopV55PropertyAdvicePreparedReferenceV3,
  hopV55PropertyAdviceRequestDraftReferenceV3,
  prepareHopV55PropertyAdviceRequestDraftV3,
  readHopV55PropertyAdviceRequestDraftV3,
  reconcileHopV55PropertyAdviceRequestDraftV3,
  reexamineHopV55PropertyAdviceRequestDraftV3,
  resumeHopV55PropertyAdviceRequestDraftV3,
  reviseHopV55PropertyAdviceRequestDraftV3,
  upgradeHopV55PropertyAdviceRequestDraftV2ToV3,
  type HopV55PropertyAdviceRequestDraftV3,
} from '../../src/services/hopV55/propertyAdvicePreparationV3';

const ownerKey = 'owner:property-advice-v3-fixture';
const workspaceId = 'workspace:property-advice-v3-fixture';
const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a encore été choisie.' };

function rawContext(mode: 'planning' | 'nolo' = 'planning') {
  return makeHopV55FixtureContext(mode);
}

function prepared(mode: 'planning' | 'nolo' = 'planning') {
  return prepareBrewingScenarioContext(rawContext(mode));
}

function makeV2(context = prepared(), text = question) {
  const reading = readHopV55Question(text, context);
  const draft = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context, requestId: 'request-property-v2-source',
    ownerKey, workspaceId, sourceReadingReference: 'reading:property-v2-source', candidatePolicy });
  return { reading, draft, context };
}

function makeV3(context = prepared(), text = question) {
  const reading = readHopV55Question(text, context);
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context, requestId: 'request-property-v3',
    ownerKey, workspaceId, sourceReadingReference: 'reading:property-v3', candidatePolicy });
  return { reading, draft, context };
}

function makeSemanticV4(context: ReturnType<typeof prepared>, text: string, suffix: string) {
  const reading = readHopV55QuestionSemanticV1(text, context);
  const archive = createHopV55DecisionReadingArchiveV4({ id: `reading:semantic-v4:${suffix}`, ownerKey, workspaceId,
    recordedAt: '2026-10-04T04:30:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: `runtime:${suffix}` });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('La lecture qualitative doit être relue depuis son archive V4 exacte.');
  }
  const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: reread.archive.reading, prepared: context,
    requestId: `request:semantic-v4:${suffix}`, ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy });
  return { archive, reading: reread.archive.reading, draft };
}

function revision(at: string, reason = 'Geste synthétique V3 confirmé par le brasseur.') {
  return { reason, recordedAt: at, recordedBy: { origin: 'user' as const, label: 'Brasseur fixture' } };
}

function savedSource(draft: HopV55PropertyAdviceRequestDraftV3) {
  return { ownerKey: draft.ownerKey, workspaceId: draft.workspaceId, sourceReadingReference: draft.sourceReadingReference,
    preparedReference: draft.preparedReference, requestDraftReference: draft.reference, requestSnapshot: draft.requestSnapshot };
}

function undefinedPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child === undefined ? [path] : undefinedPaths(child, path);
  });
}

describe('préparation V3 du conseil par propriété', () => {
  it('conserve les matières discovery chargées en forme JSON sans perdre leurs valeurs', async () => {
    const catalogue = await loadBrewingCatalogueReferences();
    const context = rawContext();
    context.hopIndex = { ...context.hopIndex!, varieties: catalogue.varieties, lots: [], knowledge: catalogue.knowledge,
      predictions: [], tastings: [], truncated: [] };
    const preparedWithCatalogue = prepareBrewingScenarioContext(context);
    const preparedBefore = structuredClone(preparedWithCatalogue);
    const affectedMaterials = preparedWithCatalogue.runtime.materials.filter(material => undefinedPaths(material).includes('stockItemRef'));
    expect(affectedMaterials.length).toBeGreaterThanOrEqual(2);
    const sourceMaterial = affectedMaterials[0];
    expect(sourceMaterial).toBeDefined();
    if (!sourceMaterial) throw new Error('La fixture catalogue doit encore inclure au moins un champ optionnel undefined.');

    const question = 'Je veux plus de floral.';
    const reading = readHopV55Question(question, preparedWithCatalogue);
    const emptyPolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’est encore sélectionnée.' };
    const initial = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: preparedWithCatalogue,
      requestId: 'request-catalogue-discovery-json-v3', ownerKey, workspaceId,
      sourceReadingReference: 'reading:catalogue-discovery-json-v3', candidatePolicy: emptyPolicy });
    const policy = { kind: 'discover' as const, materialIds: affectedMaterials.map(material => material.id),
      basis: 'Recherche explicite des fiches locales chargées.' };
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const draft = reviseHopV55PropertyAdviceRequestDraftV3({ draft: initial, prepared: preparedWithCatalogue,
        candidatePolicy: policy, revisionContext: revision('2026-10-03T14:30:00.000Z', 'Découverte explicite de fiches chargées.') });
      expect(draft.requestSnapshot.candidatePolicy).toEqual(policy);
      expect(draft.requestSnapshot.materials.map(material => material.id)).toEqual(policy.materialIds);
      const savedMaterial = draft.requestSnapshot.materials.find(material => material.id === sourceMaterial.id)!;
      expect(savedMaterial).toEqual(JSON.parse(JSON.stringify(sourceMaterial)));
      expect(undefinedPaths(savedMaterial)).toEqual([]);
      expect(undefinedPaths(sourceMaterial)).toContain('stockItemRef');
      expect(preparedWithCatalogue).toEqual(preparedBefore);
      expect(draft.preparedReference).toBe(hopV55PropertyAdvicePreparedReferenceV3(preparedWithCatalogue, draft.requestSnapshot));
      expect(draft.reference).toBe(hopV55PropertyAdviceRequestDraftReferenceV3(draft));
      const resumed = resumeHopV55PropertyAdviceRequestDraftV3({ source: savedSource(draft), prepared: preparedWithCatalogue });
      expect(resumed.requestSnapshot.materials).toEqual(draft.requestSnapshot.materials);
      expect(resumed.preparedReference).toBe(draft.preparedReference);
      expect(parser).not.toHaveBeenCalled();
    } finally {
      parser.mockRestore();
    }
  });

  it('prépare Q10 avec une investigation typée seulement depuis le geste et l’observation sensorielle liés', () => {
    const { draft } = makeV3();
    const request = draft.requestSnapshot;
    const observation = request.propertyIntents.find(intent => intent.role === 'reportedObservation' && intent.property === 'sweetness')!;
    const compensation = request.propertyIntents.find(intent => intent.label === 'compenser')!;

    expect(draft.format).toBe(HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT);
    expect(observation).toMatchObject({ role: 'reportedObservation', property: 'sweetness', metric: 'sensory', direction: null });
    expect(compensation).toMatchObject({ role: 'investigation', property: 'sweetness', direction: 'investigate',
      relatedIntentIds: [observation.id], investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] } });
    expect(request.propertyIntents.some(intent => intent.property === 'bitterness')).toBe(false);
    expect(request.interpretation.text).toContain('Constat rapporté : sucrée');
    expect(request.interpretation.text).not.toMatch(/À réduire\s*:? ?sucrée/u);
    expect(() => assertHopPropertyAdviceRequestV3(request)).not.toThrow();
    expect(() => assertHopPropertyAdviceRequest(request)).toThrow();
    expect(draft.reference).toBe(hopV55PropertyAdviceRequestDraftReferenceV3(draft));
    expect(() => assertHopV55PropertyAdviceRequestDraftV3(draft)).not.toThrow();
    expect(readHopV55PropertyAdviceRequestDraftV3(draft)).toEqual(draft);
  });

  it('prépare R20 sans inventer de cible, relie la compensation au constat et caractérise la matière séparément', () => {
    const r20 = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
    const { reading, draft } = makeV3(prepared(), r20);
    const intents = draft.requestSnapshot.propertyIntents;
    const sweetness = intents.find(intent => intent.sourceSpans.some(span => span.text === 'douce'));
    const compensation = intents.find(intent => intent.sourceSpans.some(span => span.text === 'compenser'));
    const bitternessIncrease = intents.find(intent => intent.property === 'bitterness'
      && intent.role === 'target' && intent.direction === 'increase');
    const nonCommitment = intents.find(intent => intent.sourceSpans.some(span => span.text === 'amertume'));
    const pear = intents.find(intent => intent.sourceSpans.some(span => span.text === 'poire'));
    const characterization = intents.find(intent => intent.sourceSpans.some(span => span.text === 'mon houblon de jardin'));

    expect(sweetness).toMatchObject({ property: 'sweetness', role: 'reportedObservation', direction: null, metric: 'sensory',
      interpretationOrigin: 'proposal', subject: { kind: 'beer', materialId: null } });
    expect(compensation).toMatchObject({ role: 'investigation', direction: 'investigate', property: 'sweetness',
      interpretationOrigin: 'proposal', relatedIntentIds: [sweetness?.id],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [sweetness?.id] } });
    expect(bitternessIncrease).toBeUndefined();
    expect(nonCommitment).toMatchObject({ property: 'bitterness', role: 'investigation', direction: 'investigate', required: false,
      qualification: expect.stringMatching(/aucune d[ée]cision d[’']augmentation/i) });
    expect(pear).toMatchObject({ direction: 'keep', interpretationOrigin: 'proposal' });
    expect(characterization).toMatchObject({ property: 'materialCharacter', role: 'investigation', direction: 'investigate',
      interpretationOrigin: 'proposal', subject: { kind: 'material', materialId: null } });
    expect(draft.requestSnapshot.originalQuestion).toBe(r20);
    expect(draft.requestSnapshot.interpretation.text).not.toMatch(/Cible\s*:?\s*plus de amertume/u);
    for (const intent of intents) for (const span of intent.sourceSpans) {
      expect(r20.slice(span.start, span.end)).toBe(span.text);
    }
    expect(reading.operationDrafts).toBeUndefined();
  });

  it('ne crée pas comparePerceptualCompensation depuis des relatedIntentIds seuls', () => {
    const causeQuestion = 'Ma bière est trop sucrée; pourquoi ?';
    const { context } = makeV2(prepared(), causeQuestion);
    const reading = readHopV55Question(causeQuestion, context);
    const v2 = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context,
      requestId: 'request-cause-v2', ownerKey, workspaceId, sourceReadingReference: 'reading:cause-v2', candidatePolicy });
    const observation = v2.requestSnapshot.propertyIntents.find(intent => intent.role === 'reportedObservation')!;
    const spanStart = causeQuestion.indexOf('pourquoi');
    const manualCause: HopPropertyAdviceIntent = {
      id: 'manual-cause-question', property: 'sweetness', label: 'pourquoi', role: 'investigation', direction: 'investigate',
      qualification: null, required: true, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
      subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
      sourceSpans: [{ start: spanStart, end: spanStart + 'pourquoi'.length, text: 'pourquoi' }],
      interpretationOrigin: 'user', basis: 'Cause à examiner, explicitement distinguée d’une compensation.', relatedIntentIds: [observation.id],
    };
    const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context, requestId: 'request-cause-v3',
      ownerKey, workspaceId, sourceReadingReference: 'reading:cause-v3', candidatePolicy,
      propertyIntents: [...v2.requestSnapshot.propertyIntents, manualCause] as HopPropertyAdviceIntentV3[] });
    expect(draft.requestSnapshot.propertyIntents.find(intent => intent.id === manualCause.id)?.relatedIntentIds).toEqual([observation.id]);
    expect(draft.requestSnapshot.propertyIntents.find(intent => intent.id === manualCause.id)?.investigation).toBeUndefined();
    expect(draft.requestSnapshot.propertyIntents.every(intent => intent.investigation === undefined)).toBe(true);
    expect(() => assertHopPropertyAdviceRequestV3(draft.requestSnapshot)).not.toThrow();
  });

  it('garde un partenaire automatique en proposition et une correction du brasseur comme choix user', () => {
    const context = prepared();
    const pairingQuestion = 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.';
    const reading = readHopV55Question(pairingQuestion, context);
    const tropical = reading.criterionDrafts.find(draft => draft.familyId === 'tropical')!;
    const sourceCriterion = reading.response!.intent.criteria.find(criterion => criterion.id === tropical.id)!;
    expect(tropical.origin).toBe('parser');
    expect(sourceCriterion).toMatchObject({ role: 'seek', origin: 'user',
      partner: { kind: 'freeContext', text: 'mon goût de banane' } });

    const proposed = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context,
      requestId: 'request-pairing-v3-proposal', ownerKey, workspaceId,
      sourceReadingReference: 'reading:pairing-v3-proposal', candidatePolicy });
    const proposedIntent = proposed.requestSnapshot.propertyIntents.find(intent => intent.id === tropical.id)!;
    expect(proposedIntent).toMatchObject({ interpretationOrigin: 'proposal',
      partner: { kind: 'freeContext', text: 'mon goût de banane' } });

    const editedDrafts = structuredClone(reading.criterionDrafts);
    const editedTropical = editedDrafts.find(draft => draft.id === tropical.id)!;
    editedTropical.direction = 'keep';
    const corrected = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: editedDrafts,
      prepared: context, sourceReadingReference: 'reading:pairing-v3-proposal', recordedAt: '2026-10-03T13:00:00.000Z' });
    const correctedDraft = corrected.criterionDrafts.find(draft => draft.id === tropical.id)!;
    expect(correctedDraft).toMatchObject({ id: tropical.id, direction: 'keep', origin: 'brasseur' });
    const correctedV3 = prepareHopV55PropertyAdviceRequestDraftV3({ reading: corrected, prepared: context,
      requestId: 'request-pairing-v3-corrected', ownerKey, workspaceId,
      sourceReadingReference: 'reading:pairing-v3-corrected', candidatePolicy });
    expect(correctedV3.requestSnapshot.propertyIntents.find(intent => intent.id === tropical.id))
      .toMatchObject({ direction: 'keep', interpretationOrigin: 'user' });
  });

  it('garde le risque conditionnel comme investigation et les graphies Q11 exactes comme propositions corrigibles', () => {
    const context = prepared();
    const conditionalQuestion = "Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.";
    const conditionalReading = readHopV55Question(conditionalQuestion, context);
    const resinDraft = conditionalReading.criterionDrafts.find(row => row.familyId === 'resin')!;
    expect(resinDraft).toMatchObject({ source: { text: 'résineux' }, direction: 'investigate', requirement: 'required' });
    expect(resinDraft).not.toHaveProperty('reportedProblem');
    const conditionalDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: conditionalReading, prepared: context,
      requestId: 'request-conditional-risk-v3', ownerKey, workspaceId,
      sourceReadingReference: 'reading:conditional-risk-v3', candidatePolicy });
    expect(conditionalDraft.requestSnapshot.propertyIntents.find(intent => intent.id === resinDraft.id))
      .toMatchObject({ property: 'aroma', role: 'investigation', direction: 'investigate', interpretationOrigin: 'proposal' });
    expect(conditionalDraft.requestSnapshot.propertyIntents.find(intent => intent.id === resinDraft.id)?.role)
      .not.toBe('reportedObservation');

    const q11 = "J'ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucré, très fleural, légère amertume. Est-ce que la bio transformation peut m'aider là dedans.";
    const q11Reading = readHopV55Question(q11, context);
    expect(q11Reading.criterionDrafts.some(row => row.term === 'particulier')).toBe(false);
    // Historical V3 stays strict: this question contains a required low-level target with no direction.
    expect(() => prepareHopV55PropertyAdviceRequestDraftV3({ reading: q11Reading, prepared: context,
      requestId: 'request-q11-verbatim-v3', ownerKey, workspaceId,
      sourceReadingReference: 'reading:q11-verbatim-v3', candidatePolicy }))
      .toThrow(/Cible qualitative engagée sans direction.*lecture sémantique V4/u);

    // Positive path: semantic annotations are sealed/reloaded as V4 before the PropertyV3 adapter runs.
    const q11V4 = makeSemanticV4(context, q11, 'q11-verbatim');
    const fleuralAnnotation = q11V4.reading.annotations.find(row => row.term === 'fleural')!;
    expect(fleuralAnnotation).toMatchObject({ source: { text: 'fleural' }, origin: 'parser',
      lexicon: { status: 'proposedAlias', canonicalTerm: expect.stringMatching(/floral/iu) },
      note: expect.stringMatching(/proche de « floral ».*proposé.*confirmer/i) });
    const fleural = q11V4.draft.requestSnapshot.propertyIntents.find(intent => intent.id === fleuralAnnotation.id)!;
    expect(fleural).toMatchObject({ property: 'aroma', label: 'fleural', familyId: 'floral', role: 'target', direction: 'increase',
      interpretationOrigin: 'proposal', qualification: 'très', sourceSpans: [{ text: 'fleural' }] });
    const lightBitterness = q11V4.draft.requestSnapshot.propertyIntents.find(intent => intent.label === 'amertume')!;
    expect(lightBitterness).toMatchObject({ property: 'bitterness', role: 'target', direction: null, qualification: 'légère',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });

    const correctedAnnotations = structuredClone(q11V4.reading.annotations);
    const correctedFleural = correctedAnnotations.find(row => row.id === fleuralAnnotation.id)!;
    correctedFleural.sense = 'guard';
    correctedFleural.requirement = 'required';
    correctedFleural.direction = 'keep';
    correctedFleural.guard = 'preserve';
    const correctedReading = applyHopV55SemanticCorrectionV1({ reading: q11V4.reading, annotations: correctedAnnotations,
      prepared: context, sourceReadingReference: q11V4.archive.contentReference, recordedAt: '2026-10-04T04:31:00.000Z',
      reason: 'Le brasseur corrige le souhait floral en garde de préservation.' });
    const correctedArchive = createHopV55DecisionReadingArchiveV4({ id: 'reading:semantic-v4:q11-corrected', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:31:00.000Z', reading: correctedReading, source: { kind: 'exploration' },
      runtimeReference: 'runtime:q11-corrected', lineage: { kind: 'reinterpretation',
        parentReadingReference: q11V4.archive.contentReference, parentReadingFormat: q11V4.archive.format,
        reason: 'Correction brasseur de l’annotation florale.', recordedAt: '2026-10-04T04:31:00.000Z',
        actor: { origin: 'user', label: 'Brasseur' } } });
    const correctedReread = readHopV55DecisionReadingArchive(correctedArchive);
    if (correctedReread.status !== 'available' || correctedReread.archive.format !== 'hop-v55-decision-reading-v4') {
      throw new Error('La correction sémantique V4 doit être archivée et relue sans altérer son parent.');
    }
    const correctedV4 = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: correctedReread.archive.reading,
      prepared: context, requestId: 'request:semantic-v4:q11-corrected', ownerKey, workspaceId,
      sourceReadingReference: correctedArchive.contentReference, candidatePolicy });
    expect(correctedReread.archive.lineage?.parentReadingReference).toBe(q11V4.archive.contentReference);
    expect(readHopV55DecisionReadingArchive(q11V4.archive)).toMatchObject({ status: 'available', archive: q11V4.archive });
    expect(correctedReread.archive.reading.annotations.find(row => row.id === fleuralAnnotation.id))
      .toMatchObject({ sense: 'guard', direction: 'keep', origin: 'brasseur', source: fleuralAnnotation.source,
        qualifierSource: fleuralAnnotation.qualifierSource });
    expect(correctedV4.requestSnapshot.propertyIntents.find(intent => intent.id === fleuralAnnotation.id))
      .toMatchObject({ property: 'aroma', familyId: 'floral', direction: 'keep', interpretationOrigin: 'user' });

    for (const reading of [conditionalReading, q11Reading]) {
      for (const row of reading.criterionDrafts) expect(reading.intent.question.slice(row.source.start, row.source.end)).toBe(row.source.text);
    }

    const misspelledQuestion = "Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d'amertum sans forcément le côté tropicale.";
    const misspelledReading = readHopV55Question(misspelledQuestion, context);
    const amertumDraft = misspelledReading.criterionDrafts.find(row => row.term === 'amertum')!;
    const misspelledV3 = prepareHopV55PropertyAdviceRequestDraftV3({ reading: misspelledReading, prepared: context,
      requestId: 'request-amertum-verbatim-v3', ownerKey, workspaceId,
      sourceReadingReference: 'reading:amertum-verbatim-v3', candidatePolicy });
    const amertum = misspelledV3.requestSnapshot.propertyIntents.find(intent => intent.id === amertumDraft.id)!;
    expect(amertum).toMatchObject({ property: 'bitterness', label: 'amertum', role: 'target', direction: 'increase',
      interpretationOrigin: 'proposal', qualification: expect.stringMatching(/proche de « amertume ».*proposé.*confirmer/i),
      sourceSpans: [{ text: 'amertum' }] });
    expect(amertum.familyId).toBeUndefined();
    expect(misspelledQuestion.slice(amertumDraft.source.start, amertumDraft.source.end)).toBe(amertumDraft.source.text);

    const ambiguousQuestion = 'Je veux une bière ultra juicy.';
    const ambiguousReading = readHopV55Question(ambiguousQuestion, context);
    const ambiguousDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: ambiguousReading, prepared: context,
      requestId: 'request-ambiguous-juicy-v3', ownerKey, workspaceId,
      sourceReadingReference: 'reading:ambiguous-juicy-v3', candidatePolicy });
    const juicy = ambiguousDraft.requestSnapshot.propertyIntents.find(intent => intent.label === 'juicy');
    expect(juicy).toMatchObject({ property: 'unresolved', label: 'juicy', role: 'target', direction: 'increase',
      interpretationOrigin: 'proposal', sourceSpans: [{ text: 'juicy' }] });
    expect(juicy?.familyId).toBeUndefined();
    expect(juicy?.qualification).toBeNull();
  });

  it('refuse un lien d’investigation V3 absent ou pointant vers une cible plutôt qu’un constat', () => {
    const { draft } = makeV3();
    const missing = structuredClone(draft.requestSnapshot);
    const comp = missing.propertyIntents.find(intent => intent.investigation)!;
    comp.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: ['missing-observation'] };
    expect(() => assertHopPropertyAdviceRequestV3(missing)).toThrow(/reportedObservation\/sensory/u);

    const targetRequest = structuredClone(draft.requestSnapshot);
    const investigation = targetRequest.propertyIntents.find(intent => intent.investigation)!;
    const target = targetRequest.propertyIntents.find(intent => intent.role === 'investigation' && intent.id !== investigation.id);
    if (target) throw new Error('La fixture ne doit pas ajouter une seconde investigation.');
    const nonObservation = targetRequest.propertyIntents.find(intent => intent.role === 'reportedObservation')!;
    nonObservation.role = 'target';
    nonObservation.direction = 'decrease';
    investigation.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: [nonObservation.id] };
    expect(() => assertHopPropertyAdviceRequestV3(targetRequest)).toThrow(/reportedObservation\/sensory/u);
  });

  it('upgrade V2→V3 change explicitement d’ID/ref, garde la source V2 et respecte le texte user sauvegardé', () => {
    const { context, reading, draft: base } = makeV2();
    const userInterpretation = { id: 'q10-user-interpretation', version: 'user-v2',
      text: 'Constat de douceur conservé; compensation à examiner sans choisir de levier.', origin: 'user' as const };
    const savedV2 = reviseHopV55PropertyAdviceRequestDraft({ draft: base, prepared: context, interpretation: userInterpretation,
      revisionContext: revision('2026-10-03T12:00:00.000Z', 'Correction utilisateur avant upgrade explicite.') });
    const sourceBefore = structuredClone(savedV2);
    const upgraded = upgradeHopV55PropertyAdviceRequestDraftV2ToV3({ draft: savedV2, reading, prepared: context,
      requestId: 'request-property-v3-upgraded', sourceReadingReference: savedV2.sourceReadingReference,
      revisionContext: revision('2026-10-03T12:01:00.000Z', 'Upgrade explicite vers l’investigation V3.') });
    expect(upgraded.requestSnapshot.id).not.toBe(savedV2.requestSnapshot.id);
    expect(upgraded.sourceReadingReference).toBe(savedV2.sourceReadingReference);
    expect(upgraded.reference).not.toBe(savedV2.reference);
    expect(upgraded.revisionContext?.sourceRequestDraftReference).toBe(savedV2.reference);
    expect(upgraded.requestSnapshot.interpretation).toEqual(userInterpretation);
    expect(upgraded.requestSnapshot.propertyIntents.find(intent => intent.label === 'compenser')?.investigation)
      .toMatchObject({ kind: 'comparePerceptualCompensation' });
    expect(savedV2).toEqual(sourceBefore);
  });

  it('reprend, révise et réexamine V3 sans parser ni rebâtir et refuse un snapshot Prepared périmé', () => {
    const context = prepared();
    const reading = readHopV55Question(question, context);
    const v2 = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context, requestId: 'request-property-v2-for-reload',
      ownerKey, workspaceId, sourceReadingReference: 'reading:property-v3-reload', candidatePolicy });
    const userInterpretation = { id: 'q10-v3-user-text', version: 'user-v3', text: 'Texte utilisateur V3 conservé.', origin: 'user' as const };
    const draft = upgradeHopV55PropertyAdviceRequestDraftV2ToV3({ draft: v2, reading, prepared: context,
      requestId: 'request-property-v3-reload', sourceReadingReference: v2.sourceReadingReference,
      revisionContext: revision('2026-10-03T12:10:00.000Z'), interpretation: userInterpretation });
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const resumed = resumeHopV55PropertyAdviceRequestDraftV3({ source: savedSource(draft), prepared: context });
      expect(resumed.requestSnapshot).toEqual(draft.requestSnapshot);
      const revised = reviseHopV55PropertyAdviceRequestDraftV3({ draft: resumed, prepared: context,
        revisionContext: revision('2026-10-03T12:11:00.000Z', 'Révision V3 sans réécrire le texte user.') });
      expect(revised.requestSnapshot.interpretation).toEqual(userInterpretation);
      const reexamined = reexamineHopV55PropertyAdviceRequestDraftV3({ draft: revised, reading, prepared: context,
        requestId: 'request-property-v3-reexamined', sourceReadingReference: 'reading:property-v3-reexamined',
        reexaminationContext: revision('2026-10-03T12:12:00.000Z') });
      expect(reexamined.requestSnapshot.interpretation).toEqual(userInterpretation);
      expect(reexamined.requestSnapshot.propertyIntents.find(intent => intent.label === 'compenser')?.investigation)
        .toMatchObject({ kind: 'comparePerceptualCompensation' });
      expect(parser).not.toHaveBeenCalled();

      const staleContext = rawContext();
      if (!staleContext.recipe) throw new Error('La fixture planning doit contenir sa recette source.');
      staleContext.recipe.volumeL = (staleContext.recipe.volumeL ?? 0) + 1;
      const stalePrepared = prepareBrewingScenarioContext(staleContext);
      expect(() => resumeHopV55PropertyAdviceRequestDraftV3({ source: savedSource(draft), prepared: stalePrepared }))
        .toThrow(/contexte ou le périmètre préparé V3 a changé/u);
    } finally {
      parser.mockRestore();
    }
  });
});
