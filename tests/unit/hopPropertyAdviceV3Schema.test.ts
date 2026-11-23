import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertHopPropertyAdviceAnswerV3,
  assertHopPropertyAdviceDossierV3,
  assertHopPropertyAdviceRequest,
  assertHopPropertyAdviceRequestV3,
  createHopPropertyAdviceDossier,
  createHopPropertyAdviceDossierV3,
  hopPropertyAdviceAnswerReferenceV3,
  hopPropertyAdviceDossierReferenceV3,
  hopPropertyAdviceInputReferenceV3,
  hopPropertyAdviceInterpretationReferenceV3,
  hopPropertyAdviceStrategyReferenceV3,
  readHopPropertyAdviceAnswer,
  readHopPropertyAdviceAnswerV3,
  readHopPropertyAdviceDossier,
  readHopPropertyAdviceDossierV3,
  type HopPropertyAdviceAnswer,
  type HopPropertyAdviceAnswerV3,
  type HopPropertyAdviceDossier,
  type HopPropertyAdviceIntentV3,
  type HopPropertyAdviceRequest,
  type HopPropertyAdviceRequestV3,
} from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopPropertyAdviceViewModelV3 } from '../../src/domain/hopDecision/propertyAdviceViewModel';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { makeHopPropertyCompensationRequestV3, hopPropertyCompensationSource } from '../fixtures/hopPropertyCompensation';
import {
  createHopDocumentaryCorpus,
  createHopDocumentaryDossier,
  hopDocumentaryAnswerReference,
  hopDocumentaryInputReference,
  hopDocumentaryInterpretationReference,
  hopDocumentaryRouteReference,
  readHopDocumentaryAnswer,
  type HopDocumentaryAnswer,
  type HopDocumentaryCorpus,
  type HopDocumentaryDossier,
  type HopDocumentaryRequest,
  type HopDocumentaryRoute,
} from '../../src/domain/hopDecision/documentaryAnswerSchema';

const capturedMetricHistory = JSON.parse(readFileSync(new URL(
  '../fixtures/public-history/historique-metric-v3-06.json',
  import.meta.url,
), 'utf8')) as {
  rows: Array<{ metric: 'pH' | 'analyticalBU'; answer: HopPropertyAdviceAnswerV3; dossier: unknown }>;
};

function v3Request(): HopPropertyAdviceRequestV3 {
  return makeHopPropertyCompensationRequestV3();
}

function questionOf(request: HopPropertyAdviceRequestV3): HopPropertyAdviceIntentV3 {
  return request.propertyIntents.find(intent => intent.investigation !== undefined)!;
}

function observationOf(request: HopPropertyAdviceRequestV3): HopPropertyAdviceIntentV3 {
  return request.propertyIntents.find(intent => intent.id === questionOf(request).investigation!.observationIntentIds[0])!;
}

function v2SweetnessArchive(): { answer: HopPropertyAdviceAnswer; dossier: HopPropertyAdviceDossier } {
  const request: HopPropertyAdviceRequest = {
    format: 'hop-documentary-request-v2', id: 'schema-v2-sweetness',
    originalQuestion: 'Fixture V2 : comparer une compensation de douceur explicitement demandée.',
    interpretation: { id: 'schema-v2-reading', version: 'fixture-v2', text: 'Demande V2 à relire exactement.', origin: 'user' },
    propertyIntents: [{ id: 'schema-v2-sweetness-decrease', property: 'sweetness', label: 'sucrée', role: 'target',
      direction: 'decrease', qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] },
      metric: 'sensory', subject: { kind: 'beer', label: 'Bière fixture', materialId: null, sensoryContext: 'beer' },
      sourceSpans: [], interpretationOrigin: 'user', basis: 'Contrôle de relecture V2.', relatedIntentIds: [] }],
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucun candidat demandé.' },
    context: { stage: 'planning', stageBasis: 'Planning déclaré.', assertions: [], access: {
      bulkBeer: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      sampling: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      separatePortion: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
    } }, exclusions: [], materials: [],
  };
  const answer = buildHopPropertyAdvice(request);
  expect(answer.strategies.length).toBeGreaterThan(0);
  const strategy = answer.strategies[0];
  const dossier = createHopPropertyAdviceDossier({ id: 'schema-v2-dossier', answer,
    expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
    strategyId: strategy.id, expectedStrategyReference: strategy.reference,
    motive: 'Fixture de lecture historique V2.', createdAt: '2026-10-03T13:00:00.000Z',
    createdBy: { origin: 'fixture', label: 'Test V2' } });
  return { answer, dossier };
}

function v1Archive(): { answer: HopDocumentaryAnswer; dossier: HopDocumentaryDossier } {
  const corpus: HopDocumentaryCorpus = createHopDocumentaryCorpus({ version: 'schema-v1-fixture', sources: [], claims: [] });
  const request: HopDocumentaryRequest = {
    format: 'hop-documentary-request-v1', id: 'schema-v1-request', originalQuestion: 'Archive documentaire V1.',
    interpretation: { id: 'schema-v1-reading', version: '1', text: 'Lecture historique.', origin: 'user' },
    criteria: [{ id: 'schema-v1-criterion', description: 'Constat historique.', role: 'observation', origin: 'user' }],
    needs: [{ id: 'schema-v1-need', kind: 'unresolved', criterionIds: ['schema-v1-criterion'], explanation: 'Aucune réponse de fixture.' }],
    context: { stage: 'unknown', stageBasis: 'Stade inconnu.', assertions: [], access: {
      bulkBeer: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      sampling: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      separatePortion: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
    } }, exclusions: [], materials: [],
  };
  const argument = { id: 'schema-v1-argument', kind: 'userFact' as const, text: 'Constat historique exact.',
    criterionIds: ['schema-v1-criterion'], assertionIds: [], claimIds: [], materialEvidence: [] };
  const routeBody: Omit<HopDocumentaryRoute, 'reference'> = {
    id: 'schema-v1-route', needIds: ['schema-v1-need'], criterionIds: ['schema-v1-criterion'],
    title: 'Voie V1', purpose: 'Archive en lecture seule.', scope: 'documentation', intervention: 'none',
    argumentIds: ['schema-v1-argument'], materialIds: [], documentaryProductRefs: [],
    applicability: { status: 'notEvaluated', conditions: [] },
    preparation: { documentaryDossier: { status: 'available', kind: 'choice', label: 'Dossier V1' },
      operational: { status: 'notProvided', adapterId: null, reason: 'Aucune opération.' }, missingRequirements: [], refusalReasons: [] },
  };
  const route = { ...routeBody, reference: hopDocumentaryRouteReference(routeBody) };
  const answerBody = {
    format: 'hop-documentary-answer-v1' as const, requestSnapshot: request, corpusSnapshot: corpus,
    inputReference: hopDocumentaryInputReference(request, corpus),
    interpretationReference: hopDocumentaryInterpretationReference(request),
    coverage: { status: 'outOfScope' as const, domain: 'Fixture historique.',
      points: [{ needId: 'schema-v1-need', status: 'unresolved' as const, reason: 'Aucune source.',
        argumentIds: ['schema-v1-argument'], routeIds: ['schema-v1-route'] }],
      unresolvedCriteria: [{ criterionId: 'schema-v1-criterion', reason: 'Non traité.' }] },
    body: [{ id: 'schema-v1-body', text: 'Réponse V1 conservée.', argumentIds: ['schema-v1-argument'] }],
    arguments: [argument], routes: [route], limits: ['Fixture V1.'],
  };
  const answer = { ...answerBody, reference: hopDocumentaryAnswerReference(answerBody) };
  const dossier = createHopDocumentaryDossier({ id: 'schema-v1-dossier', answer,
    expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
    routeId: route.id, expectedRouteReference: route.reference, motive: 'Garder la lecture V1 intacte.',
    createdAt: '2026-10-03T12:00:00.000Z', createdBy: { origin: 'fixture', label: 'Test V1' } });
  return { answer, dossier };
}

describe('schéma documentaire V3 de compensation perceptive', () => {
  it('valide le discriminant exact et conserve question, fragments, origines et liens du fixture Q10', () => {
    const request = v3Request();
    const original = structuredClone(request);
    const question = questionOf(request), observation = observationOf(request);
    expect(() => assertHopPropertyAdviceRequestV3(request)).not.toThrow();
    expect(request).toEqual(original);
    expect(question).toMatchObject({ role: 'investigation', direction: 'investigate', property: 'sweetness',
      interpretationOrigin: 'proposal', relatedIntentIds: [observation.id],
      sourceSpans: [{ start: 41, end: 50, text: 'compenser' }],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] } });
    expect(observation).toMatchObject({ role: 'reportedObservation', direction: null, metric: 'sensory',
      subject: { kind: 'beer', materialId: null }, interpretationOrigin: 'proposal',
      sourceSpans: [{ start: 25, end: 31, text: 'sucrée' }] });
    expect(request.propertyIntents.some(intent => intent.role === 'target' || intent.direction === 'decrease' || intent.property === 'bitterness')).toBe(false);

    const unknownSubject = structuredClone(request);
    const unknownObservation = observationOf(unknownSubject);
    unknownObservation.subject = { kind: 'unspecified', label: 'Sujet non résolu', materialId: null, sensoryContext: 'unspecified' };
    expect(() => assertHopPropertyAdviceRequestV3(unknownSubject)).not.toThrow();
  });

  it('refuse une investigation mal typée, des liens absents/duplicats et un constat incompatible', () => {
    const rejected = (change: (request: HopPropertyAdviceRequestV3) => void) => {
      const request = v3Request(); change(request);
      expect(() => assertHopPropertyAdviceRequestV3(request)).toThrow();
    };
    rejected(request => { questionOf(request).role = 'target'; });
    rejected(request => { questionOf(request).direction = 'decrease'; });
    rejected(request => { (questionOf(request).investigation as any).kind = 'findCause'; });
    rejected(request => {
      const question = questionOf(request); question.investigation!.observationIntentIds = ['missing-observation'];
      question.relatedIntentIds.push('missing-observation');
    });
    rejected(request => {
      const observationId = observationOf(request).id;
      questionOf(request).investigation!.observationIntentIds.push(observationId);
    });
    rejected(request => { questionOf(request).relatedIntentIds = []; });
    rejected(request => { observationOf(request).role = 'target'; });
    rejected(request => { observationOf(request).metric = 'unspecified'; });
    rejected(request => {
      const observation = observationOf(request);
      observation.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] };
    });
  });

  it('limite comparePerceptualCompensation aux métriques sensorielles ou non précisées', () => {
    for (const metric of ['pH', 'analyticalBU', 'titratableAcidity'] as const) {
      const request = v3Request();
      questionOf(request).metric = metric;
      expect(() => assertHopPropertyAdviceRequestV3(request), `${metric} doit être refusée`).toThrow(/perceptive/);
    }
    for (const metric of ['sensory', 'unspecified'] as const) {
      const request = v3Request();
      questionOf(request).metric = metric;
      expect(() => assertHopPropertyAdviceRequestV3(request), `${metric} doit rester accepté`).not.toThrow();
    }
  });

  it('relit les vraies réponses V3 historiques métriques en lecture seule après validation complète', () => {
    expect(capturedMetricHistory.rows.map(row => row.metric)).toEqual(['pH', 'analyticalBU']);
    for (const row of capturedMetricHistory.rows) {
      expect(() => assertHopPropertyAdviceAnswerV3(row.answer)).toThrow(/perceptive/);
      expect(() => assertHopPropertyAdviceDossierV3(row.dossier)).toThrow(/perceptive/);
      expect(readHopPropertyAdviceAnswerV3(row.answer)).toMatchObject({
        status: 'unsupportedReadOnly', snapshot: row.answer,
      });
      expect(readHopPropertyAdviceDossierV3(row.dossier)).toMatchObject({
        status: 'unsupportedReadOnly', snapshot: row.dossier,
      });

      const alteredBody = structuredClone(row.answer);
      alteredBody.body[0].text += ' altéré';
      expect(() => readHopPropertyAdviceAnswerV3(alteredBody)).toThrow();
      const alteredInput = structuredClone(row.answer);
      alteredInput.inputReference += '-altéré';
      expect(() => readHopPropertyAdviceAnswerV3(alteredInput)).toThrow();
      const alteredEffect = structuredClone(row.answer);
      alteredEffect.strategies[0].effects[0].text += ' altéré';
      expect(() => readHopPropertyAdviceAnswerV3(alteredEffect)).toThrow();
      const alteredBinding = structuredClone(row.dossier) as any;
      alteredBinding.answerReference += '-altéré';
      expect(() => readHopPropertyAdviceDossierV3(alteredBinding)).toThrow();
      const alteredStrategy = structuredClone(row.dossier) as any;
      alteredStrategy.strategySnapshot.title += ' altéré';
      expect(() => readHopPropertyAdviceDossierV3(alteredStrategy)).toThrow();
    }
  });

  it('garde le writer V2 fermé et ne transforme pas une investigation générique en compensation', () => {
    const v2 = structuredClone(hopPropertyCompensationSource.requestSnapshot) as HopPropertyAdviceRequest;
    expect(() => assertHopPropertyAdviceRequest(v2)).not.toThrow();
    const mixedV2 = structuredClone(v2) as unknown as Omit<HopPropertyAdviceRequest, 'propertyIntents'> & {
      propertyIntents: HopPropertyAdviceIntentV3[];
    };
    const v2Question = mixedV2.propertyIntents.find(intent => intent.role === 'investigation')!;
    const v2Observation = mixedV2.propertyIntents.find(intent => intent.role === 'reportedObservation')!;
    v2Question.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: [v2Observation.id] };
    expect(() => assertHopPropertyAdviceRequest(mixedV2)).toThrow(/champ non pris en charge/);

    const generic = v3Request();
    delete questionOf(generic).investigation;
    expect(() => assertHopPropertyAdviceRequestV3(generic)).not.toThrow();
    expect(() => buildHopPropertyAdviceV3(generic).strategies).not.toThrow();
  });

  it('valide/référence le cycle V3, fige le dossier et projette un view model sans permission', () => {
    const request = v3Request(), answer = buildHopPropertyAdviceV3(request);
    expect(() => assertHopPropertyAdviceAnswerV3(answer)).not.toThrow();
    expect(answer.inputReference).toMatch(/^hop-property-advice-input-v3:sha256:/);
    expect(answer.interpretationReference).toMatch(/^hop-property-advice-interpretation-v3:sha256:/);
    expect(answer.reference).toMatch(/^hop-property-advice-answer-v3:sha256:/);
    expect(hopPropertyAdviceInputReferenceV3(request, answer.corpusSnapshot)).toBe(answer.inputReference);
    expect(hopPropertyAdviceInterpretationReferenceV3(request)).toBe(answer.interpretationReference);
    expect(hopPropertyAdviceAnswerReferenceV3(answer)).toBe(answer.reference);
    expect(answer.strategies.every(strategy => hopPropertyAdviceStrategyReferenceV3(answer.inputReference, strategy) === strategy.reference)).toBe(true);

    const strategy = answer.strategies[0];
    const dossier = createHopPropertyAdviceDossierV3({ id: 'q10-schema-v3-dossier', answer,
      expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference,
      motive: 'Conserver une comparaison documentaire, sans l’appliquer.', createdAt: '2026-10-03T12:30:00.000Z',
      createdBy: { origin: 'fixture', label: 'Schéma V3' } });
    expect(() => assertHopPropertyAdviceDossierV3(dossier)).not.toThrow();
    expect(hopPropertyAdviceDossierReferenceV3(dossier)).toBe(dossier.reference);
    expect(dossier.answerSnapshot).toEqual(answer);
    expect(dossier.strategySnapshot).toEqual(strategy);
    expect(dossier.preparation.operational.status).toBe('notProvided');
    expect(readHopPropertyAdviceAnswerV3(JSON.parse(JSON.stringify(answer)))).toEqual({ status: 'readOnly', answer });
    expect(readHopPropertyAdviceDossierV3(JSON.parse(JSON.stringify(dossier)))).toEqual({ status: 'readOnly', dossier });
    const view = hopPropertyAdviceViewModelV3(answer);
    expect(view.format).toBe('hop-documentary-answer-view-v3');
    expect(view.answerReference).toBe(answer.reference);
    expect(view).not.toHaveProperty('reference');
    expect(view.strategies).toEqual(answer.strategies);
    expect(view.strategies.every(row => row.preparation.operational.status === 'notProvided')).toBe(true);
  });

  it('lit les V1/V2 en legacyReadOnly et conserve les futurs inconnus bruts', () => {
    const v1 = v1Archive();
    expect(readHopPropertyAdviceAnswerV3(v1.answer)).toEqual({ status: 'legacyReadOnly', version: 'v1', answer: v1.answer });
    expect(readHopPropertyAdviceDossierV3(v1.dossier)).toEqual({ status: 'legacyReadOnly', version: 'v1', dossier: v1.dossier });

    const v2 = v2SweetnessArchive();
    expect(readHopPropertyAdviceAnswerV3(v2.answer)).toEqual({ status: 'legacyReadOnly', version: 'v2', answer: v2.answer });
    expect(readHopPropertyAdviceDossierV3(v2.dossier)).toEqual({ status: 'legacyReadOnly', version: 'v2', dossier: v2.dossier });

    const v3 = buildHopPropertyAdviceV3(v3Request());
    expect(readHopPropertyAdviceAnswer(v3)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: v3 });
    expect(readHopDocumentaryAnswer(v3)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: v3 });
    expect(readHopPropertyAdviceDossier(v3AnswerDossier(v3))).toMatchObject({ status: 'unsupportedReadOnly' });

    const futureAnswer = { ...v3, format: 'hop-documentary-answer-v9' };
    expect(readHopPropertyAdviceAnswerV3(futureAnswer)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureAnswer });
    const futureNestedRequest = { ...v3, requestSnapshot: { ...v3.requestSnapshot, format: 'hop-documentary-request-v9' } };
    expect(readHopPropertyAdviceAnswerV3(futureNestedRequest)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureNestedRequest });
  });

  it('refuse un V2 connu imbriqué dans une enveloppe V3 au lieu de le traiter comme futur', () => {
    const answer = buildHopPropertyAdviceV3(v3Request());
    const answerWithV2Request = structuredClone(answer);
    (answerWithV2Request.requestSnapshot as any).format = 'hop-documentary-request-v2';
    expect(() => readHopPropertyAdviceAnswerV3(answerWithV2Request)).toThrow(/requête V3/);

    const futureNestedRequest = structuredClone(answer);
    (futureNestedRequest.requestSnapshot as any).format = 'hop-documentary-request-v9';
    expect(readHopPropertyAdviceAnswerV3(futureNestedRequest)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureNestedRequest,
    });

    const dossier = v3AnswerDossier(answer);
    const dossierWithV2Answer = structuredClone(dossier);
    (dossierWithV2Answer.answerSnapshot as any).format = 'hop-documentary-answer-v2';
    expect(() => readHopPropertyAdviceDossierV3(dossierWithV2Answer)).toThrow(/réponse V3/);

    const futureNestedAnswer = structuredClone(dossier);
    (futureNestedAnswer.answerSnapshot as any).format = 'hop-documentary-answer-v9';
    expect(readHopPropertyAdviceDossierV3(futureNestedAnswer)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureNestedAnswer,
    });
  });
});

function v3AnswerDossier(answer: ReturnType<typeof buildHopPropertyAdviceV3>) {
  const strategy = answer.strategies[0];
  return createHopPropertyAdviceDossierV3({ id: 'q10-schema-reader-dossier', answer,
    expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
    strategyId: strategy.id, expectedStrategyReference: strategy.reference,
    motive: 'Conserver le choix de lecture.', createdAt: '2026-10-03T12:45:00.000Z',
    createdBy: { origin: 'fixture', label: 'Lecteur V3' } });
}
