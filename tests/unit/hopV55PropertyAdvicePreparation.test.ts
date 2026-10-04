import { describe, expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceRequest, assertHopPropertyAdviceRequestV3, type HopPropertyAdviceIntent,
  type HopPropertyAdviceRequest } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import * as decisionModule from '../../src/services/hopV55/decision';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { applyHopV55DecisionCriteriaCorrection } from '../../src/services/hopV55/decisionCorrection';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV4,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1 } from '../../src/services/hopV55/propertyAdviceSemanticPreparationV3';
import {
  HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT,
  assertHopV55PropertyAdviceRequestDraftV2,
  buildHopV55PropertyAdviceInterpretation,
  hopV55PropertyAdvicePreparedReference,
  prepareHopV55PropertyAdviceRequestDraft,
  reexamineHopV55PropertyAdviceRequestDraft,
  resumeHopV55PropertyAdviceRequestDraft,
  reviseHopV55PropertyAdviceRequestDraft,
  reconcileHopV55PropertyAdviceRequestDraft,
  type HopV55PropertyAdviceRequestDraftV2,
} from '../../src/services/hopV55/propertyAdvicePreparation';

type FixtureMode = 'planning' | 'fermenting' | 'unknown' | 'unknownCulture' | 'nolo';
const explicitNone = { kind: 'explicit' as const, materialIds: [], basis: 'Aucun candidat n’a été choisi pour cette demande.' };

function prepared(mode: FixtureMode = 'planning', includeHouse = false) {
  const context = makeHopV55FixtureContext(mode);
  if (includeHouse && context.hopIndex) {
    const house: HopVariety = { id: 'property-advice-house-hop', name: 'Houblon maison témoin', aliases: [],
      form: 'unknown', analysis: [], descriptions: [] };
    context.hopIndex = { ...context.hopIndex, varieties: [...context.hopIndex.varieties, house] };
  }
  return prepareBrewingScenarioContext(context);
}

function makeDraft(question: string, context = prepared(), candidatePolicy: HopPropertyAdviceRequest['candidatePolicy'] = explicitNone) {
  const reading = readHopV55Question(question, context);
  const draft = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context, requestId: 'request-property-v2',
    ownerKey: 'owner-property-v2-fixture', workspaceId: 'workspace-property-v2-fixture',
    sourceReadingReference: 'reading-v2-source-fixture', candidatePolicy });
  return { reading, context, draft };
}

let semanticDraftSequence = 0;

/** Positive qualitative path: typed reader → V4 seal/reload → semantic PropertyV3 adapter. */
function semanticDraft(question: string, context: ReturnType<typeof prepared>) {
  const sequence = ++semanticDraftSequence;
  const parsed = readHopV55QuestionSemanticV1(question, context);
  const archive = createHopV55DecisionReadingArchiveV4({ id: `reading-property-v4-fixture-${sequence}`,
    ownerKey: 'owner-property-v2-fixture', workspaceId: 'workspace-property-v2-fixture',
    recordedAt: `2026-10-03T00:00:${String(sequence).padStart(2, '0')}.000Z`, reading: parsed,
    source: { kind: 'exploration' }, runtimeReference: `runtime-property-v4-fixture-${sequence}` });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('La cible qualitative exige une archive sémantique V4 relue sans réduction V2.');
  }
  const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: reread.archive.reading, prepared: context,
    requestId: `request-property-v4-fixture-${sequence}`, ownerKey: 'owner-property-v2-fixture',
    workspaceId: 'workspace-property-v2-fixture', sourceReadingReference: archive.contentReference,
    candidatePolicy: explicitNone });
  return { archive, reading: reread.archive.reading, draft, requestSnapshot: draft.requestSnapshot };
}

function revision(at: string, reason = 'Correction explicite de la lecture propriété.') {
  return { reason, recordedAt: at, recordedBy: { origin: 'user' as const, label: 'Brasseur fixture' } };
}

function assertValidRequest(draft: HopV55PropertyAdviceRequestDraftV2) {
  expect(() => assertHopPropertyAdviceRequest(draft.requestSnapshot)).not.toThrow();
}

describe('préparation V2 du conseil par propriété', () => {
  it('garde tous les termes Q05 sans convertir juicy en tropical ou une exclusion en baseline', () => {
    const question = 'Je voudrais une Lager ultra juicy, hyper aromatisée, sans qu’elle soit amère. J’ai quoi comme choix ?';
    const { reading, draft } = makeDraft(question);
    const intents = draft.requestSnapshot.propertyIntents;
    expect(intents).toHaveLength(reading.criterionDrafts.length);
    expect(intents.find(intent => intent.label === 'juicy')).toMatchObject({ property: 'unresolved', role: 'target', direction: 'increase',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, subject: { kind: 'beer', materialId: null } });
    expect(intents.find(intent => intent.label === 'aromatisée')).toMatchObject({ property: 'aroma', role: 'target', direction: 'increase',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(intents.find(intent => intent.label === 'aromatisée')?.familyId).toBeUndefined();
    expect(intents.find(intent => intent.label === 'amère')).toMatchObject({ property: 'bitterness', role: 'constraint', direction: 'exclude',
      comparisonBasis: { kind: 'none', assertionIds: [] } });
    expect(intents.some(intent => intent.familyId === 'tropical' || intent.label === 'tropical')).toBe(false);
    expect(draft.requestSnapshot.candidatePolicy).toEqual(explicitNone);
    expect(draft.requestSnapshot.materials).toEqual([]);
    expect(draft.requestSnapshot.context.access.bulkBeer.state).toBe('unknown');
    expect(draft.requestSnapshot.context.stage).toBe('planning');
    assertValidRequest(draft);

    const discoverPolicy = { kind: 'discover' as const,
      materialIds: ['variety:hop-v55-fixture-identity-a', 'variety:not-loaded'],
      basis: 'Découvrir uniquement les deux identités demandées, y compris celle qui manque au chargement.' };
    const discovered = makeDraft(question, prepared(), discoverPolicy).draft;
    expect(discovered.requestSnapshot.candidatePolicy).toEqual(discoverPolicy);
    expect(discovered.requestSnapshot.materials.map(material => material.id)).toEqual(['variety:hop-v55-fixture-identity-a']);
    expect(discovered.requestSnapshot.candidatePolicy.materialIds).toContain('variety:not-loaded');
    assertValidRequest(discovered);

    const guarded = makeDraft('Plus de poire, ne pas augmenter l’amertume.', prepared()).draft;
    const bitternessGuard = guarded.requestSnapshot.propertyIntents.find(intent => intent.property === 'bitterness')!;
    expect(bitternessGuard).toMatchObject({ role: 'constraint', direction: 'keep',
      comparisonBasis: { kind: 'current', assertionIds: [] } });
    assertValidRequest(guarded);
  });

  it('limite une observation de bière à son fragment et respecte une correction active du brasseur', () => {
    for (const question of [
      'ma bière est trop sucrée et je veux plus de floral.',
      'Ma bière est trop sucrée et je veux plus de floral.',
    ]) {
      const context = prepared();
      const source = readHopV55Question(question, context);
      const criterionDrafts = structuredClone(source.criterionDrafts);
      for (const criterion of criterionDrafts) {
        delete criterion.reportedProblem;
        delete criterion.qualification;
      }
      const draft = prepareHopV55PropertyAdviceRequestDraft({ reading: { ...source, criterionDrafts }, prepared: context,
        requestId: 'request-local-observation', ownerKey: 'owner-property-v2-fixture',
        workspaceId: 'workspace-property-v2-fixture', sourceReadingReference: 'reading-local-observation',
        candidatePolicy: explicitNone });
      expect(draft.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness')).toMatchObject({
        role: 'reportedObservation', direction: null, required: false,
      });
      expect(draft.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'floral')).toMatchObject({
        role: 'target', direction: 'increase', required: true,
      });
      assertValidRequest(draft);
    }

    const standaloneContext = prepared();
    const standaloneSource = readHopV55Question('Ma bière est trop sucrée.', standaloneContext);
    const standaloneCriteria = structuredClone(standaloneSource.criterionDrafts);
    for (const criterion of standaloneCriteria) {
      delete criterion.reportedProblem;
      delete criterion.qualification;
    }
    const standalone = prepareHopV55PropertyAdviceRequestDraft({ reading: { ...standaloneSource, criterionDrafts: standaloneCriteria },
      prepared: standaloneContext, requestId: 'request-local-standalone', ownerKey: 'owner-property-v2-fixture',
      workspaceId: 'workspace-property-v2-fixture', sourceReadingReference: 'reading-local-standalone',
      candidatePolicy: explicitNone });
    expect(standalone.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness')).toMatchObject({
      role: 'reportedObservation', direction: null, required: false,
    });

    const context = prepared();
    const source = readHopV55Question('Ma bière est trop sucrée et je veux plus de floral.', context);
    const correctedCriteria = structuredClone(source.criterionDrafts);
    const correctedFloral = correctedCriteria.find(row => row.familyId === 'floral')!;
    correctedFloral.qualification = 'Cible florale confirmée par le brasseur.';
    const correctedReading = applyHopV55DecisionCriteriaCorrection({ reading: source, criterionDrafts: correctedCriteria,
      prepared: context, sourceReadingReference: 'reading-local-floral-source', recordedAt: '2026-10-03T10:00:00.000Z' });
    const corrected = prepareHopV55PropertyAdviceRequestDraft({ reading: correctedReading, prepared: context,
      requestId: 'request-local-floral-corrected', ownerKey: 'owner-property-v2-fixture',
      workspaceId: 'workspace-property-v2-fixture', sourceReadingReference: 'reading-local-floral-corrected',
      candidatePolicy: explicitNone });
    expect(corrected.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'floral')).toMatchObject({
      role: 'target', direction: 'increase', required: true, interpretationOrigin: 'user',
    });
    expect(corrected.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness')).toMatchObject({
      role: 'reportedObservation', direction: null, required: false,
    });
    assertValidRequest(corrected);
  });

  it('distingue douceur cible, amertume légère qualitative et question biologique investiguée en Q11', () => {
    const question = 'Je veux une bière de Champagne, sucrée, très florale, avec légère amertume. Est-ce que la biotransformation peut aider ?';
    const context = prepared();
    // Negative V2 witness: the historical mapper refuses the engaged target instead of turning it into an investigation.
    expect(() => makeDraft(question, context)).toThrow(/Cible qualitative engagée sans direction \(« amertume »\).*lecture sémantique V4/u);
    // Positive path: the typed V4 reading goes through the semantic PropertyV3 adapter.
    const semantic = semanticDraft(question, context);
    const reading = semantic.reading;
    const draft = semantic.draft;
    const intents = draft.requestSnapshot.propertyIntents;
    expect(intents).toHaveLength(reading.annotations.length);
    expect(intents.find(intent => intent.label === 'sucrée')).toMatchObject({ property: 'sweetness', role: 'target', direction: null,
      qualification: null, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory' });
    // A high level stays a qualitative target in PropertyV3; only the historical projection keeps « À rechercher ».
    expect(intents.find(intent => intent.label === 'florale')).toMatchObject({ property: 'aroma', role: 'target', direction: null,
      qualification: 'très', familyId: 'floral', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(reading.intent.criteria.find(criterion => criterion.familyId === 'floral')).toMatchObject({ direction: 'increase' });
    expect(intents.find(intent => intent.label === 'amertume')).toMatchObject({ property: 'bitterness', role: 'target', direction: null,
      qualification: 'légère', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(intents.find(intent => intent.label === 'biotransformation')).toMatchObject({ property: 'bioContribution', role: 'investigation', direction: 'investigate',
      comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified', subject: { kind: 'culture', materialId: null } });
    expect(intents.find(intent => intent.label === 'amertume')).not.toHaveProperty('value');
    expect(draft.requestSnapshot.interpretation.text).toContain('Cible qualitative : florale (très)');
    expect(draft.requestSnapshot.interpretation.text).not.toMatch(/plus de florale|moins de amertume/u);
    expect(() => assertHopPropertyAdviceRequestV3(draft.requestSnapshot)).not.toThrow();
  });

  it('garde un risque conditionnel comme investigation et une plainte comme observation distincte', () => {
    const conditional = makeDraft('Si j’amérise avec Nugget, est-ce que je ne serai pas trop résineux ou au contraire pas assez ?').draft;
    const risk = conditional.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'resin');
    expect(risk).toMatchObject({ property: 'aroma', role: 'investigation', direction: 'investigate', required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] } });
    expect(risk?.sourceSpans).toEqual([expect.objectContaining({ text: 'résineux' })]);
    assertValidRequest(conditional);

    const reported = makeDraft('Ma bière présente une note résineuse.').draft;
    expect(reported.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'resin')).toMatchObject({
      role: 'reportedObservation', direction: null, required: false,
    });
    assertValidRequest(reported);
  });

  it('relie la demande de compensation au constat sans imposer un levier d’amertume', () => {
    const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
    const { reading, draft } = makeDraft(question);
    const intents = draft.requestSnapshot.propertyIntents;
    const observation = intents.find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
    const compensation = intents.find(intent => intent.label === 'compenser');

    expect(observation).toMatchObject({ role: 'reportedObservation', direction: null, required: false,
      sourceSpans: [expect.objectContaining({ text: 'sucrée' })] });
    expect(compensation).toMatchObject({ property: 'sweetness', role: 'investigation', direction: 'investigate', required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] }, relatedIntentIds: [observation?.id] });
    expect(compensation?.sourceSpans).toEqual([expect.objectContaining({ text: 'compenser' })]);
    expect(intents.some(intent => intent.property === 'bitterness')).toBe(false);
    expect(reading.intent.question).toBe(question);
    assertValidRequest(draft);

    const evidenceDirectory = resolve(process.cwd(), 'work/houblons-v55-integration-app-2026-10-02/luna-application');
    mkdirSync(evidenceDirectory, { recursive: true });
    writeFileSync(resolve(evidenceDirectory, 'q10-compensation-request-02.json'), `${JSON.stringify({
      format: 'hop-v55-q10-compensation-request-candidate-v2',
      provenance: 'Fixture synthétique; réponse de domaine non construite dans ce test.',
      sourceReadingReference: draft.sourceReadingReference,
      requestDraftReference: draft.reference,
      preparedReference: draft.preparedReference,
      interpretation: draft.requestSnapshot.interpretation,
      expectedMeaning: {
        observation: 'La sucrosité rapportée reste une observation du brasseur, sans valeur mesurée ni demande de baisse chiffrée.',
        investigation: 'Le fragment exact de compensation est une investigation reliée à cette observation; aucune voie ni amertume n’est présélectionnée.',
        contractLimit: 'Le schéma reçu ne porte pas de discriminant compensation-versus-recherche-de-cause. Ne pas faire relire le label ou la question par le builder; arbitrage pilote requis.',
      },
      requestSnapshot: draft.requestSnapshot,
    }, null, 2)}\n`, 'utf8');

    const standalone = makeDraft('Ma bière est trop sucrée.').draft;
    expect(standalone.requestSnapshot.propertyIntents.some(intent => intent.role === 'investigation')).toBe(false);
  });

  it('résume la préparation initiale depuis les rôles, pas depuis le label directionnel de la lecture V1', () => {
    const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
    const { reading, draft } = makeDraft(question);
    const text = draft.requestSnapshot.interpretation.text;

    // The historical summary no longer announces a reduction for a declarative complaint.
    expect(reading.interpretation).not.toMatch(/À réduire\s*:?\s*sucrée/iu);
    expect(reading.intent.criteria.some(row => /sucrée/iu.test(row.label))).toBe(false);
    expect(text).toContain('Constat rapporté : sucrée');
    expect(text).toContain('Question à examiner : compenser');
    expect(text).toMatch(/reliée au constat.*sucrée/iu);
    expect(text).not.toMatch(/À réduire\s*:?\s*sucrée/u);
    expect(draft.requestSnapshot.interpretation.origin).toBe('proposal');
    assertValidRequest(draft);
  });

  it('formule le résumé proposé à partir de chaque rôle sans convertir les constats en cibles', () => {
    const intent = (patch: Pick<HopPropertyAdviceIntent, 'id' | 'label' | 'role'>
      & Partial<HopPropertyAdviceIntent>): HopPropertyAdviceIntent => ({
      id: patch.id, property: 'aroma', label: patch.label, role: patch.role, direction: null, qualification: null,
      required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
      subject: { kind: 'beer', label: 'Bière synthétique', materialId: null, sensoryContext: 'beer' },
      sourceSpans: [{ start: 0, end: patch.label.length, text: patch.label }], interpretationOrigin: 'proposal',
      basis: 'Fixture synthétique.', relatedIntentIds: [], ...patch,
    });
    const intents: HopPropertyAdviceIntent[] = [
      intent({ id: 'reported', property: 'sweetness', label: 'sucrée', role: 'reportedObservation', direction: null, required: false,
        comparisonBasis: { kind: 'current', assertionIds: [] } }),
      intent({ id: 'measurement', property: 'bitterness', label: 'amertume', role: 'measurement', direction: null, required: true,
        metric: 'sensory', comparisonBasis: { kind: 'current', assertionIds: [] } }),
      intent({ id: 'target', label: 'floral', role: 'target', direction: 'increase', required: true,
        comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } }),
      intent({ id: 'compensation', property: 'sweetness', label: 'compenser', role: 'investigation', direction: 'investigate', required: true,
        comparisonBasis: { kind: 'none', assertionIds: [] }, relatedIntentIds: ['reported'] }),
      intent({ id: 'preference', label: 'tropical', role: 'preference', direction: null, required: false }),
      intent({ id: 'constraint', label: 'résine', role: 'constraint', direction: 'exclude', required: true,
        comparisonBasis: { kind: 'none', assertionIds: [] } }),
    ];
    const text = buildHopV55PropertyAdviceInterpretation(intents);
    expect(text).toContain('Constat rapporté : sucrée');
    expect(text).toContain('Mesure déclarée : amertume');
    expect(text).toContain('Cible : plus de floral');
    expect(text).toContain('Question à examiner : compenser, reliée au constat rapporté « sucrée »');
    expect(text).toContain('Préférence facultative : tropical');
    expect(text).toContain('Garde : éviter résine');
    expect(text).not.toContain('À réduire : sucrée');
    expect(text).not.toMatch(/\d+(?:[.,]\d+)?\s*(?:g|ibu|bu|%)/iu);
  });

  it('préserve une interprétation utilisateur déjà sauvegardée sur resume, revise et reexamine', () => {
    const question = 'Je veux plus de floral.';
    const { context, draft } = makeDraft(question);
    const userInterpretation = { id: 'interpretation-user-saved', version: 'user-v1',
      text: 'Texte explicite conservé par le brasseur.', origin: 'user' as const };
    const saved = reviseHopV55PropertyAdviceRequestDraft({ draft, prepared: context, interpretation: userInterpretation,
      revisionContext: revision('2026-10-03T10:20:00.000Z', 'Le brasseur sauvegarde son interprétation.') });
    const readSource = { ownerKey: saved.ownerKey, workspaceId: saved.workspaceId,
      sourceReadingReference: saved.sourceReadingReference, preparedReference: saved.preparedReference,
      requestDraftReference: saved.reference, requestSnapshot: saved.requestSnapshot };
    const reading = readHopV55Question(question, context);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const resumed = resumeHopV55PropertyAdviceRequestDraft({ source: readSource, prepared: context });
      expect(resumed.requestSnapshot.interpretation).toEqual(userInterpretation);
      const revised = reviseHopV55PropertyAdviceRequestDraft({ draft: resumed, prepared: context,
        revisionContext: revision('2026-10-03T10:21:00.000Z', 'Révision des annotations sans toucher au texte sauvegardé.') });
      expect(revised.requestSnapshot.interpretation).toEqual(userInterpretation);
      const reexamined = reexamineHopV55PropertyAdviceRequestDraft({ draft: revised, reading, prepared: context,
        requestId: 'request-user-interpretation-reexamined', sourceReadingReference: 'reading-user-interpretation-reexamined',
        reexaminationContext: revision('2026-10-03T10:22:00.000Z', 'Réexamen dans une nouvelle lignée.') });
      expect(reexamined.requestSnapshot.interpretation).toEqual(userInterpretation);
      expect(parser).not.toHaveBeenCalled();
    } finally {
      parser.mockRestore();
    }
  });

  it('conserve une relation d’accord explicite et une amertume faible comme cible qualitative', () => {
    const question = 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.';
    const { draft } = makeDraft(question);
    const target = draft.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'tropical')!;
    const banana = draft.requestSnapshot.propertyIntents.find(intent => intent.label === 'banane')!;
    expect(target.partner).toMatchObject({ kind: 'freeContext', text: 'mon goût de banane' });
    expect(target.relatedIntentIds).toContain(banana.id);
    expect(banana).toMatchObject({ role: 'preference', direction: null, required: false });
    expect(target.sourceSpans).toEqual([expect.objectContaining({ text: 'tropicale' })]);
    expect(banana.sourceSpans).toEqual([expect.objectContaining({ text: 'banane' })]);
    assertValidRequest(draft);

    const transcribedQuestion = 'Je veux une blanche ultra tropicale qui de Marie bien avec mon goût de banane.';
    const transcribed = makeDraft(transcribedQuestion).draft;
    const transcribedTarget = transcribed.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'tropical')!;
    expect(transcribedTarget.partner).toMatchObject({ kind: 'freeContext', text: 'mon goût de banane' });
    expect(transcribedTarget.interpretationOrigin).toBe('proposal');
    expect(transcribed.requestSnapshot.originalQuestion).toBe(transcribedQuestion);
    assertValidRequest(transcribed);

    const unrelated = makeDraft('Je veux une bière tropicale; la levure utilisée laisse aussi une note de banane.').draft;
    expect(unrelated.requestSnapshot.propertyIntents.find(intent => intent.familyId === 'tropical')?.partner).toBeUndefined();

    // NOLO and spelling variants carry an engaged « faible / légère amertume »: V2 refuses, V4 keeps it typed.
    const noloQuestion = 'Pour ma bière NOLO, je cherche une expression aromatique et une faible amertume; la biotransformation peut-elle aider ?';
    const noloContext = prepared('nolo');
    expect(() => makeDraft(noloQuestion, noloContext)).toThrow(/lecture sémantique V4/u);
    const nolo = semanticDraft(noloQuestion, noloContext);
    const aromaExpression = nolo.requestSnapshot.propertyIntents.find(intent => intent.label === 'expression aromatique')!;
    expect(aromaExpression).toMatchObject({
      property: 'aroma', role: 'target', direction: null, required: true,
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
    });
    expect(aromaExpression.familyId).toBeUndefined();
    expect(nolo.requestSnapshot.propertyIntents.find(intent => intent.label === 'amertume')).toMatchObject({
      property: 'bitterness', role: 'target', direction: null, qualification: 'faible',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
    });
    expect(nolo.requestSnapshot.propertyIntents.some(intent => intent.property === 'bitterness' && intent.direction === 'decrease')).toBe(false);
    expect(() => assertHopPropertyAdviceRequestV3(nolo.requestSnapshot)).not.toThrow();

    const spellingQuestion = 'Je veux une bière de Champagne très fleural et légère amertume; la bio transformation peut-elle aider ?';
    expect(() => makeDraft(spellingQuestion, noloContext)).toThrow(/lecture sémantique V4/u);
    const spelling = semanticDraft(spellingQuestion, noloContext);
    const fleural = spelling.requestSnapshot.propertyIntents.find(intent => intent.label === 'fleural');
    expect(fleural?.sourceSpans).toEqual([expect.objectContaining({ text: 'fleural' })]);
    // The alias stays a proposal; its reader note is visible on the annotation, never copied as a domain qualifier.
    expect(fleural).toMatchObject({ property: 'aroma', familyId: 'floral', role: 'target', direction: 'increase',
      interpretationOrigin: 'proposal', qualification: 'très' });
    const fleuralAnnotation = spelling.reading.annotations.find(row => row.term === 'fleural')!;
    expect(fleuralAnnotation.lexicon).toEqual({ status: 'proposedAlias', canonicalTerm: expect.stringMatching(/floral/iu) });
    expect(fleuralAnnotation.note).toMatch(/proche de « floral ».*proposé.*confirmer/iu);
    expect(spelling.requestSnapshot.propertyIntents.find(intent => intent.label === 'bio transformation')).toMatchObject({
      property: 'bioContribution', role: 'investigation', direction: 'investigate',
      sourceSpans: [expect.objectContaining({ text: 'bio transformation' })],
    });
    expect(() => assertHopPropertyAdviceRequestV3(spelling.requestSnapshot)).not.toThrow();
  });

  it('garde une odeur résineuse comme observation de matière, et laisse son ID nul quand la matière n’est pas liée', () => {
    const question = 'Mon houblon maison témoin sans analyse a une odeur résineuse; préserver le floral reste important.';
    const loaded = makeDraft(question, prepared('unknown', true)).draft;
    const resin = loaded.requestSnapshot.propertyIntents.find(intent => intent.label === 'résineuse')!;
    expect(resin).toMatchObject({ property: 'materialCharacter', role: 'reportedObservation', direction: null, required: false,
      subject: { kind: 'material', label: 'Houblon maison témoin', materialId: 'variety:property-advice-house-hop', sensoryContext: 'rawHop' },
      comparisonBasis: { kind: 'current', assertionIds: [] } });
    expect(loaded.requestSnapshot.candidatePolicy).toEqual(explicitNone);
    expect(loaded.requestSnapshot.materials.map(material => material.id)).toEqual(['variety:property-advice-house-hop']);
    expect(loaded.requestSnapshot.propertyIntents.find(intent => intent.label === 'floral')).toMatchObject({
      property: 'aroma', role: 'target', direction: 'keep', comparisonBasis: { kind: 'current', assertionIds: [] },
    });
    assertValidRequest(loaded);

    const unlinked = makeDraft(question, prepared('unknown')).draft;
    const unlinkedResin = unlinked.requestSnapshot.propertyIntents.find(intent => intent.label === 'résineuse')!;
    expect(unlinkedResin.subject).toMatchObject({ kind: 'material', materialId: null, sensoryContext: 'rawHop' });
    expect(unlinked.requestSnapshot.candidatePolicy.materialIds).toEqual([]);
    expect(unlinked.requestSnapshot.materials).toEqual([]);
    assertValidRequest(unlinked);
  });

  it('révise une interprétation structurée sans toucher à la question, aux références ou aux intentions non corrigées', () => {
    const { context, draft } = makeDraft('Je veux plus de floral et préserver le thé.');
    const before = structuredClone(draft.requestSnapshot);
    const interpretation = { id: 'interpretation-brasseur', version: 'property-reading-v2-user',
      text: 'Le floral est ciblé; le thé reste une préférence de conservation.', origin: 'user' as const };
    const revised = reviseHopV55PropertyAdviceRequestDraft({ draft, prepared: context,
      interpretation, revisionContext: revision('2026-10-03T09:20:00.000Z', 'Correction de l’interprétation structurée.') });
    expect(revised.requestSnapshot.interpretation).toEqual(interpretation);
    expect(revised.requestSnapshot.id).toBe(before.id);
    expect(revised.requestSnapshot.originalQuestion).toBe(before.originalQuestion);
    expect(revised.sourceReadingReference).toBe(draft.sourceReadingReference);
    expect(revised.preparedReference).toBe(draft.preparedReference);
    expect(revised.requestSnapshot.propertyIntents).toEqual(before.propertyIntents);
    expect(revised.requestSnapshot.propertyIntents.filter(intent => intent.interpretationOrigin === 'proposal')).toHaveLength(
      before.propertyIntents.filter(intent => intent.interpretationOrigin === 'proposal').length,
    );
    assertValidRequest(revised);
  });

  it('conserve l’enquête biologique comme telle dans culture inconnue et distingue les annotations optionnelles', () => {
    const bioQuestion = 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.';
    const context = prepared('unknownCulture');
    const { reading, draft } = makeDraft(bioQuestion, context);
    const bio = draft.requestSnapshot.propertyIntents.find(intent => intent.property === 'bioContribution')!;
    expect(bio).toMatchObject({ role: 'investigation', direction: 'investigate', required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] }, subject: { kind: 'culture', materialId: null } });
    expect(draft.requestSnapshot.context.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'context-culture', state: 'unknown', dimension: 'bioInteraction' }),
    ]));
    expect(reading.criterionDrafts).toHaveLength(draft.requestSnapshot.propertyIntents.length);
    assertValidRequest(draft);

    const optionalQuestion = 'Quelle forte amertume sans sapin/résine, sans rechercher forcément le tropical ?';
    const optional = makeDraft(optionalQuestion).draft.requestSnapshot.propertyIntents.find(intent => intent.label === 'tropical')!;
    expect(optional).toMatchObject({ role: 'preference', direction: null, required: false, property: 'aroma' });
    expect(optional.sourceSpans).toEqual(expect.arrayContaining([expect.objectContaining({ text: 'tropical' })]));
  });

  it('reprend une lecture V2 corrigée sans parser, garde requestSnapshot et gère accès append-only', () => {
    const question = 'Je voudrais une Lager ultra juicy, hyper aromatisée, sans qu’elle soit amère. J’ai quoi comme choix ?';
    const context = prepared();
    const reading = readHopV55Question(question, context);
    const originalDraft = structuredClone(reading.criterionDrafts);
    originalDraft.find(row => row.term === 'juicy')!.qualification = 'Préférence qualitative juicy explicitement corrigée.';
    const correctedReading = applyHopV55DecisionCriteriaCorrection({ reading, criterionDrafts: originalDraft, prepared: context,
      sourceReadingReference: 'reading-v1-source', recordedAt: '2026-10-03T09:00:00.000Z' });
    const sourceArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-property-corrected', ownerKey: 'owner-property-v2-fixture',
      workspaceId: 'workspace-property-v2-fixture', recordedAt: '2026-10-03T09:00:00.000Z', reading: correctedReading,
      source: { kind: 'exploration' }, runtimeReference: 'runtime-property-corrected' });
    const sourceArchiveBefore = structuredClone(sourceArchive);
    const archiveRead = readHopV55DecisionReadingArchive(sourceArchive);
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error('La lecture V2 source doit être relue avant la préparation de propriété.');
    }
    const draft = prepareHopV55PropertyAdviceRequestDraft({ reading: archiveRead.archive.reading, prepared: context,
      requestId: 'request-corrected-property', ownerKey: 'owner-property-v2-fixture', workspaceId: 'workspace-property-v2-fixture',
      sourceReadingReference: sourceArchive.contentReference, candidatePolicy: explicitNone });
    const juicy = draft.requestSnapshot.propertyIntents.find(intent => intent.label === 'juicy')!;
    expect(juicy.interpretationOrigin).toBe('user');
    expect(juicy.qualification).toBe('Préférence qualitative juicy explicitement corrigée.');
    expect(sourceArchive).toEqual(sourceArchiveBefore);

    const correctedIntents = structuredClone(draft.requestSnapshot.propertyIntents);
    const changedJuicy = correctedIntents.find(intent => intent.id === juicy.id)!;
    changedJuicy.property = 'aroma';
    changedJuicy.role = 'target';
    changedJuicy.direction = 'increase';
    changedJuicy.interpretationOrigin = 'user';
    changedJuicy.basis = 'Le brasseur choisit le domaine arôme pour cette annotation; le terme juicy reste sans famille tropicale.';
    const correctedInterpretation = { id: 'interpretation-property-corrected', version: 'brasseur-v2',
      text: 'Lecture corrigée : juicy est une cible d’arôme, sans famille implicite.', origin: 'user' as const };
    const revised = reviseHopV55PropertyAdviceRequestDraft({ draft, prepared: context, propertyIntents: correctedIntents,
      candidatePolicy: explicitNone, interpretation: correctedInterpretation,
      revisionContext: revision('2026-10-03T09:01:00.000Z') });
    expect(revised.requestSnapshot.propertyIntents.find(intent => intent.id === juicy.id)).toMatchObject({
      property: 'aroma', role: 'target', direction: 'increase', interpretationOrigin: 'user',
    });
    expect(revised.requestSnapshot.originalQuestion).toBe(question);
    expect(revised.requestSnapshot.id).toBe(draft.requestSnapshot.id);
    expect(revised.sourceReadingReference).toBe(draft.sourceReadingReference);
    expect(revised.preparedReference).toBe(draft.preparedReference);
    expect(revised.requestSnapshot.interpretation).toEqual(correctedInterpretation);
    expect(revised.requestSnapshot.propertyIntents.find(intent => intent.label === 'aromatisée')?.interpretationOrigin).toBe('proposal');
    expect(revised.requestSnapshot.candidatePolicy).toEqual(explicitNone);
    assertValidRequest(revised);

    const beforeAssertions = structuredClone(revised.requestSnapshot.context.assertions);
    const accessAssertion = { id: 'user-separate-portion-01', subject: 'separatePortion',
      statement: 'Le brasseur déclare qu’une portion séparée est disponible pour cette étude.',
      state: 'reported' as const, value: true, dimension: 'process' as const,
      source: { title: 'Déclaration utilisateur', author: 'Brasseur fixture', year: 2026, kind: 'observation' as const,
        reference: 'fixture:property-advice:access' } };
    const withAccess = reviseHopV55PropertyAdviceRequestDraft({ draft: revised, prepared: context,
      propertyIntents: revised.requestSnapshot.propertyIntents, candidatePolicy: explicitNone,
      revisionContext: revision('2026-10-03T09:02:00.000Z', 'Ajout append-only d’une déclaration d’accès.'),
      accessUpdates: [{ scope: 'separatePortion', access: { state: 'yes', basis: 'Déclaration explicite du brasseur.',
        assertionIds: [accessAssertion.id] }, assertions: [accessAssertion] }] });
    expect(withAccess.requestSnapshot.context.assertions.slice(0, beforeAssertions.length)).toEqual(beforeAssertions);
    expect(withAccess.requestSnapshot.context.assertions).toHaveLength(beforeAssertions.length + 1);
    expect(withAccess.requestSnapshot.context.access.separatePortion).toMatchObject({ state: 'yes', assertionIds: [accessAssertion.id] });
    expect(withAccess.requestSnapshot.context.access.bulkBeer).toEqual(revised.requestSnapshot.context.access.bulkBeer);
    assertValidRequest(withAccess);

    const savedSource = { ownerKey: withAccess.ownerKey, workspaceId: withAccess.workspaceId,
      sourceReadingReference: withAccess.sourceReadingReference, preparedReference: withAccess.preparedReference,
      requestDraftReference: withAccess.reference, requestSnapshot: withAccess.requestSnapshot };
    const readQuestion = vi.spyOn(decisionModule, 'readHopV55Question');
    const resumed = resumeHopV55PropertyAdviceRequestDraft({ source: savedSource, prepared: context });
    expect(resumed.reference).toBe(withAccess.reference);
    expect(resumed.requestSnapshot).toEqual(withAccess.requestSnapshot);
    expect(readQuestion).not.toHaveBeenCalled();
    readQuestion.mockRestore();

    const changedContext = structuredClone(context);
    if (changedContext.runtime.current?.program) changedContext.runtime.current.program.revision += 1;
    expect(() => resumeHopV55PropertyAdviceRequestDraft({ source: savedSource, prepared: changedContext }))
      .toThrow(/contexte ou le périmètre préparé a changé/u);
    expect(() => reviseHopV55PropertyAdviceRequestDraft({ draft: withAccess, prepared: context,
      propertyIntents: withAccess.requestSnapshot.propertyIntents, candidatePolicy: explicitNone,
      revisionContext: revision('2026-10-03T09:03:00.000Z'), accessUpdates: [{ scope: 'separatePortion',
        access: { state: 'yes', basis: 'Réutilisation interdite de l’ancienne assertion.', assertionIds: [accessAssertion.id] },
        assertions: [accessAssertion] }] })).toThrow(/ID nouveau/u);
  });

  it('ne lance jamais le builder du domaine pendant la préparation ou la relecture du draft', () => {
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdvice');
    try {
      const { context, draft } = makeDraft('Je veux plus de floral.', prepared());
      const resumed = resumeHopV55PropertyAdviceRequestDraft({ source: {
        ownerKey: draft.ownerKey, workspaceId: draft.workspaceId, sourceReadingReference: draft.sourceReadingReference,
        preparedReference: draft.preparedReference, requestDraftReference: draft.reference, requestSnapshot: draft.requestSnapshot,
      }, prepared: context });
      expect(resumed.requestSnapshot).toEqual(draft.requestSnapshot);
      expect(builder).not.toHaveBeenCalled();
    } finally {
      builder.mockRestore();
    }
  });

  it('réexamine un snapshot V2 vers une nouvelle source sans parser ni réutiliser l’accès physique', () => {
    const question = 'Je veux plus de floral.';
    const firstPrepared = prepared();
    const firstReading = readHopV55Question(question, firstPrepared);
    const firstDraft = prepareHopV55PropertyAdviceRequestDraft({ reading: firstReading, prepared: firstPrepared,
      requestId: 'request-reexamination-source-a', ownerKey: 'owner-property-v2-fixture',
      workspaceId: 'workspace-property-v2-fixture', sourceReadingReference: 'reading:reexam-source-a', candidatePolicy: explicitNone });
    const sameContextReading = readHopV55Question(question, firstPrepared);
    const sameContextReexam = reexamineHopV55PropertyAdviceRequestDraft({ draft: firstDraft, reading: sameContextReading,
      prepared: firstPrepared, requestId: 'request-reexamination-same-context',
      sourceReadingReference: 'reading:reexam-same-context',
      reexaminationContext: revision('2026-10-03T09:09:00.000Z', 'Réexamen explicite sans changement de contexte.') });
    expect(sameContextReexam.requestSnapshot.propertyIntents).toEqual(firstDraft.requestSnapshot.propertyIntents);
    expect(sameContextReexam.requestSnapshot.candidatePolicy).toEqual(firstDraft.requestSnapshot.candidatePolicy);
    expect(sameContextReexam.requestSnapshot.interpretation).toEqual(firstDraft.requestSnapshot.interpretation);
    expect(sameContextReexam.requestSnapshot.context.access).toEqual(firstDraft.requestSnapshot.context.access);

    const accessAssertion = { id: 'user-access-sampling-reexam-a', subject: 'sampling',
      statement: 'Le brasseur déclare qu’un prélèvement est accessible pour le premier lot.',
      state: 'reported' as const, value: true, dimension: 'process' as const,
      source: { title: 'Déclaration du brasseur', author: 'Brasseur fixture', year: 2026, kind: 'observation' as const,
        reference: 'fixture:reexam:access-a' } };
    const accessDraft = reviseHopV55PropertyAdviceRequestDraft({ draft: firstDraft, prepared: firstPrepared,
      revisionContext: revision('2026-10-03T09:10:00.000Z', 'Déclaration d’accès au prélèvement du premier lot.'),
      accessUpdates: [{ scope: 'sampling', access: { state: 'yes', basis: 'Déclaration du brasseur pour ce lot.',
        assertionIds: [accessAssertion.id] }, assertions: [accessAssertion] }] });

    const nextPrepared = prepared('fermenting');
    const nextReading = readHopV55Question(question, nextPrepared);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    try {
      const next = reexamineHopV55PropertyAdviceRequestDraft({ draft: accessDraft, reading: nextReading, prepared: nextPrepared,
        requestId: 'request-reexamination-source-b', sourceReadingReference: 'reading:reexam-source-b',
        reexaminationContext: revision('2026-10-03T09:11:00.000Z', 'Nouveau lot et nouveau contexte de brassin.') });
      expect(next.id).toBe('request-reexamination-source-b');
      expect(next.sourceReadingReference).toBe('reading:reexam-source-b');
      expect(next.preparedReference).not.toBe(accessDraft.preparedReference);
      expect(next.requestSnapshot.originalQuestion).toBe(question);
      expect(next.requestSnapshot.propertyIntents).toEqual(accessDraft.requestSnapshot.propertyIntents);
      expect(next.requestSnapshot.candidatePolicy).toEqual(accessDraft.requestSnapshot.candidatePolicy);
      expect(next.requestSnapshot.interpretation).toEqual(accessDraft.requestSnapshot.interpretation);
      expect(next.requestSnapshot.context.stage).toBe('fermenting');
      expect(next.requestSnapshot.context.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
      expect(next.requestSnapshot.context.assertions.some(assertion => assertion.id === accessAssertion.id)).toBe(false);
      expect(next.reexaminationSource).toMatchObject({ sourceRequestDraftReference: accessDraft.reference,
        sourceReadingReference: accessDraft.sourceReadingReference, preparedReference: accessDraft.preparedReference,
        reason: 'Nouveau lot et nouveau contexte de brassin.' });
      expect(next.revisionContext).toBeUndefined();
      expect(parser).not.toHaveBeenCalled();
      assertValidRequest(next);

      const persistedReexamination = { sourceAnswerRecordReference: 'answer-record-source-a',
        sourceAnswerReference: 'answer-source-a', sourceReadingReference: 'reading:reexam-source-a',
        reason: 'Réexamen du résultat antérieur sur le nouveau lot.', recordedAt: '2026-10-03T09:12:00.000Z',
        recordedBy: { origin: 'user' as const, label: 'Brasseur fixture' } };
      const recordSource = { ownerKey: next.ownerKey, workspaceId: next.workspaceId,
        sourceReadingReference: next.sourceReadingReference, preparedReference: next.preparedReference,
        requestDraftReference: next.reference, requestSnapshot: next.requestSnapshot, reexaminationContext: persistedReexamination };
      const resumedRecord = resumeHopV55PropertyAdviceRequestDraft({ source: recordSource, prepared: nextPrepared });
      expect(resumedRecord.requestSnapshot).toEqual(next.requestSnapshot);
      expect(resumedRecord.reexaminationSource).toBeUndefined();
      expect(resumedRecord.revisionContext).toBeUndefined();
      expect(recordSource.reexaminationContext).toEqual(persistedReexamination);
    } finally {
      parser.mockRestore();
    }
  });

  it('refuse un réexamen qui ne retrouve plus la même assertion current liée à une garde relative', () => {
    const question = 'Ne pas augmenter l’amertume.';
    const oldPrepared = prepared();
    oldPrepared.runtime.current!.beerContext!.facts.push({ id: 'observed-bitterness-baseline', field: 'beer.bitterness',
      status: 'reported', origin: 'userHypothesis', value: 'Amertume rapportée dans la fixture.', basis: 'Source synthétique de test.' });
    const oldReading = readHopV55Question(question, oldPrepared);
    const oldDraft = prepareHopV55PropertyAdviceRequestDraft({ reading: oldReading, prepared: oldPrepared,
      requestId: 'request-relative-baseline', ownerKey: 'owner-property-v2-fixture', workspaceId: 'workspace-property-v2-fixture',
      sourceReadingReference: 'reading:relative-baseline-old', candidatePolicy: explicitNone });
    const guard = oldDraft.requestSnapshot.propertyIntents.find(intent => intent.property === 'bitterness')!;
    expect(guard).toMatchObject({ role: 'constraint', direction: 'keep',
      comparisonBasis: { kind: 'current', assertionIds: ['context-observed-bitterness-baseline'] } });

    const nextPrepared = structuredClone(oldPrepared);
    const baseline = nextPrepared.runtime.current!.beerContext!.facts.find(fact => fact.id === 'observed-bitterness-baseline')!;
    baseline.value = 'Autre état rapporté dans la nouvelle fixture.';
    const nextReading = readHopV55Question(question, nextPrepared);
    expect(() => reexamineHopV55PropertyAdviceRequestDraft({ draft: oldDraft, reading: nextReading, prepared: nextPrepared,
      requestId: 'request-relative-baseline-new', sourceReadingReference: 'reading:relative-baseline-new',
      reexaminationContext: revision('2026-10-03T09:15:00.000Z', 'Le nouvel état ne reprend pas la baseline précédente.') }))
      .toThrow(/lien de baseline context-observed-bitterness-baseline .* périmé/u);
    expect(() => reviseHopV55PropertyAdviceRequestDraft({ draft: oldDraft, prepared: nextPrepared,
      revisionContext: revision('2026-10-03T09:16:00.000Z', 'La correction ordinaire garde son refus de contexte périmé.') }))
      .toThrow(/contexte préparé a changé/u);

    const reconciledIntents = structuredClone(oldDraft.requestSnapshot.propertyIntents);
    const reconciledGuard = reconciledIntents.find(intent => intent.id === guard.id)!;
    reconciledGuard.comparisonBasis = { kind: 'current', assertionIds: [] };
    reconciledGuard.interpretationOrigin = 'user';
    reconciledGuard.basis = 'Le brasseur détache explicitement cette garde de l’ancienne valeur; la base actuelle reste inconnue.';
    const interpretation = { id: 'interpretation-relative-baseline-reconciled', version: 'brasseur-v2',
      text: 'Réexamen sans réutiliser l’ancienne observation d’amertume.', origin: 'user' as const };
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const reconciled = (() => {
      try {
        return reconcileHopV55PropertyAdviceRequestDraft({ draft: oldDraft, reading: nextReading, prepared: nextPrepared,
          requestId: 'request-relative-baseline-reconciled', sourceReadingReference: 'reading:relative-baseline-reconciled',
          propertyIntents: reconciledIntents, candidatePolicy: oldDraft.requestSnapshot.candidatePolicy, interpretation,
          reexaminationContext: revision('2026-10-03T09:17:00.000Z', 'Le brasseur détache explicitement le lien de baseline périmé.') });
      } finally {
        parser.mockRestore();
      }
    })();
    expect(parser).not.toHaveBeenCalled();
    expect(reconciled.requestSnapshot.propertyIntents.find(intent => intent.id === guard.id)).toMatchObject({
      role: 'constraint', direction: 'keep', interpretationOrigin: 'user',
      comparisonBasis: { kind: 'current', assertionIds: [] },
    });
    expect(reconciled.requestSnapshot.context.assertions.find(assertion => assertion.id === 'context-observed-bitterness-baseline')?.value)
      .toBe('Autre état rapporté dans la nouvelle fixture.');
    expect(reconciled.requestSnapshot.interpretation).toEqual(interpretation);
    expect(reconciled.requestSnapshot.candidatePolicy).toEqual(oldDraft.requestSnapshot.candidatePolicy);
    expect(reconciled.sourceReadingReference).toBe('reading:relative-baseline-reconciled');
    expect(reconciled.reexaminationSource?.sourceRequestDraftReference).toBe(oldDraft.reference);
    assertValidRequest(reconciled);
    expect(oldPrepared.runtime.current!.beerContext!.facts.find(fact => fact.id === 'observed-bitterness-baseline')?.value)
      .toBe('Amertume rapportée dans la fixture.');
  });
});
