import { describe, expect, it } from 'vitest';
import { makeHopPropertyCompensationRequestV3, hopPropertyCompensationSource } from '../fixtures/hopPropertyCompensation';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { getHopPropertyAdviceCorpus } from '../../src/domain/hopDecision/propertyAdviceEvidence';
import { HOP_DOCUMENTARY_CLAIM_IDS as CLAIM } from '../../src/domain/hopDecision/documentaryEvidence';
import { createHopDocumentaryCorpus, readHopDocumentaryAnswer } from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { createHopPropertyAdviceDossierV3, readHopPropertyAdviceAnswerV3, readHopPropertyAdviceDossierV3,
  readHopPropertyAdviceAnswer, readHopPropertyAdviceDossier,
  type HopPropertyAdviceRequest, type HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopPropertyAdviceViewModelV3 } from '../../src/domain/hopDecision/propertyAdviceViewModel';

const questionOf = (input: HopPropertyAdviceRequestV3) => input.propertyIntents.find(row => row.role === 'investigation')!;
const observedOf = (input: HopPropertyAdviceRequestV3) => input.propertyIntents.find(row => row.role === 'reportedObservation')!;
const withoutIso = () => {
  const corpus = getHopPropertyAdviceCorpus();
  return createHopDocumentaryCorpus({ version: 'fixture-compensation-without-iso', sources: corpus.sources,
    claims: corpus.claims.filter(row => row.id !== CLAIM.ISO_HOPSTEINER) });
};

describe('conseil V3 — investigation de compensation sans cible ni levier imposés', () => {
  it('répond à la question typée en gardant le constat, les fragments et les origines sans ajouter de cible', () => {
    const input = makeHopPropertyCompensationRequestV3(), before = structuredClone(input);
    const answer = buildHopPropertyAdviceV3(input), question = questionOf(input), observation = observedOf(input);
    expect(input).toEqual(before); expect(answer.requestSnapshot).toEqual(input);
    expect(answer.requestSnapshot.originalQuestion).toBe(hopPropertyCompensationSource.requestSnapshot.originalQuestion);
    for (const prior of hopPropertyCompensationSource.requestSnapshot.propertyIntents) {
      const current = answer.requestSnapshot.propertyIntents.find(row => row.id === prior.id)!;
      const { investigation: _annotation, ...unchanged } = current;
      expect(unchanged).toEqual(prior);
    }
    expect(answer.coverage.points.find(row => row.intentId === observation.id)?.status).toBe('contextOnly');
    expect(answer.coverage.points.find(row => row.intentId === question.id)?.status).toBe('answered');
    expect(answer.requestSnapshot.propertyIntents.some(row => row.role === 'target' || row.direction === 'decrease' || row.property === 'bitterness')).toBe(false);
    expect(answer.strategies.some(row => row.kind === 'sweetness-balance')).toBe(true);
    expect(answer.strategies.every(row => row.preparation.operational.status === 'notProvided')).toBe(true);
    expect(answer.strategies.find(row => row.kind === 'sweetness-balance')?.purpose).toContain('sans la considérer choisie');
    expect(answer.arguments.some(row => row.kind === 'userTarget' || row.kind === 'userMeasurement')).toBe(false);
    expect(answer.arguments.some(row => row.kind === 'proposedReading' && row.intentIds.includes(question.id))).toBe(true);
  });

  it('ne déduit aucune compensation du constat seul ou du texte d’une investigation non typée', () => {
    const only = makeHopPropertyCompensationRequestV3();
    only.propertyIntents = [observedOf(only)];
    expect(buildHopPropertyAdviceV3(only).coverage.status).toBe('outOfScope');
    const generic = makeHopPropertyCompensationRequestV3();
    delete questionOf(generic).investigation;
    expect(buildHopPropertyAdviceV3(generic).strategies).toEqual([]);
    generic.originalQuestion = 'Pourquoi cette impression sucrée ?';
    generic.propertyIntents.forEach(row => { row.sourceSpans = []; });
    questionOf(generic).label = 'Pourquoi cette impression';
    expect(buildHopPropertyAdviceV3(generic).coverage.status).toBe('outOfScope');
  });

  it('ne requalifie pas un profil doux souhaité comme un excès à compenser', () => {
    const input = makeHopPropertyCompensationRequestV3(), observed = observedOf(input);
    input.propertyIntents = [{ ...observed, role: 'target', direction: null, required: true,
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, basis: 'Variante de fixture : profil doux souhaité.' }];
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.some(row => row.kind.includes('sweetness-balance'))).toBe(false);
    expect(answer.coverage.points[0].status).toBe('unresolved');
  });

  it('préserve le conseil indépendant quand la fiche ISO manque, sans produit ni opération sur le brassin', () => {
    const input = makeHopPropertyCompensationRequestV3(); input.context.stage = 'fermenting';
    const answer = buildHopPropertyAdviceV3(input, withoutIso());
    expect(answer.coverage.status).toBe('partial');
    expect(answer.strategies.map(row => row.kind)).toEqual(['future-sweetness-balance']);
    expect(answer.strategies[0]).toMatchObject({ scope: 'futureBrew', candidateIds: [], documentaryProductRefs: [] });
    expect(answer.strategies[0].preparation.operational.status).toBe('notProvided');
    expect(answer.requestSnapshot).toEqual(input);
  });

  it('garde les limites de stade, accès et exclusion séparées de l’explication documentaire', () => {
    const input = makeHopPropertyCompensationRequestV3(); input.context.stage = 'unknown';
    input.context.stageBasis = 'Stade inconnu pour cette variante.';
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies[0].applicability.status).toBe('missingConditions');
    expect(answer.strategies[0].preparation.operational.status).toBe('notProvided');
    input.exclusions = [{ id: 'exclude-bitter-intervention', intervention: 'changeBitterness', certainty: 'certain',
      intentIds: [questionOf(input).id], reason: 'Le brasseur exclut ce levier dans cette variante.' }];
    const excluded = buildHopPropertyAdviceV3(input);
    expect(excluded.strategies.every(row => row.applicability.status === 'incompatible')).toBe(true);
    expect(excluded.body[0].text).toContain('écartent');
    expect(excluded.requestSnapshot.propertyIntents).toEqual(input.propertyIntents);
  });

  it('ne transforme pas la douceur observée sur une matière brute en constat de bière', () => {
    const input = makeHopPropertyCompensationRequestV3();
    observedOf(input).subject = { kind: 'material', label: 'Échantillon de matière', materialId: null, sensoryContext: 'rawHop' };
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.some(row => row.kind.includes('sweetness-balance'))).toBe(false);
    expect(answer.coverage.points.find(row => row.intentId === questionOf(input).id)?.status).toBe('unresolved');
    expect(answer.requestSnapshot).toEqual(input);
  });

  it('laisse une question composée partielle si un autre constat lié manque d’appui', () => {
    const input = makeHopPropertyCompensationRequestV3(), observation = observedOf(input), question = questionOf(input);
    const additional = { ...structuredClone(observation), id: observation.id + '-acidity', property: 'acidity' as const,
      label: 'acidulé', sourceSpans: [], basis: 'Autre constat perceptif déclaré par la fixture.' };
    input.propertyIntents.push(additional);
    question.relatedIntentIds.push(additional.id); question.investigation!.observationIntentIds.push(additional.id);
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.coverage.points.find(row => row.intentId === question.id)?.status).toBe('partial');
    expect(answer.coverage.status).toBe('partial');
    expect(answer.strategies.some(row => row.kind === 'sweetness-balance')).toBe(true);
    expect(answer.requestSnapshot).toEqual(input);
  });

  it('conserve des stratégies identiques sous des noms neutres avec les mêmes propriétés typées', () => {
    const input = makeHopPropertyCompensationRequestV3(), original = buildHopPropertyAdviceV3(input);
    input.id = 'neutral-request'; input.originalQuestion = 'Question neutre de fixture.';
    input.propertyIntents.forEach(row => { row.label = 'Élément ' + row.id; row.sourceSpans = []; });
    const renamed = buildHopPropertyAdviceV3(input);
    expect(renamed.strategies.map(row => row.kind)).toEqual(original.strategies.map(row => row.kind));
    expect(renamed.coverage.points.map(row => row.status)).toEqual(original.coverage.points.map(row => row.status));
  });

  it('reconnaît le type d’enquête même si sa propriété reste non résolue, sans y inventer un levier', () => {
    const input = makeHopPropertyCompensationRequestV3();
    questionOf(input).property = 'unresolved';
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.coverage.points.find(row => row.intentId === questionOf(input).id)?.status).toBe('answered');
    expect(answer.strategies.map(row => row.kind)).toEqual(['sweetness-balance']);
    expect(answer.requestSnapshot.propertyIntents).toEqual(input.propertyIntents);
  });

  it('relit le cycle V3 et garde les anciens formats exacts, sans faire passer V3 par un writer V2', () => {
    const input = makeHopPropertyCompensationRequestV3(), answer = buildHopPropertyAdviceV3(input), strategy = answer.strategies[0];
    const dossier = createHopPropertyAdviceDossierV3({ id: 'fixture-compensation-dossier', answer,
      expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference, motive: 'Comparer cette voie documentaire, sans l’appliquer.',
      createdAt: '2026-10-03T10:00:00+02:00', createdBy: { origin: 'fixture', label: 'Contrôle V3' } });
    expect(readHopPropertyAdviceAnswerV3(JSON.parse(JSON.stringify(answer)))).toEqual({ status: 'readOnly', answer });
    expect(readHopPropertyAdviceDossierV3(JSON.parse(JSON.stringify(dossier)))).toEqual({ status: 'readOnly', dossier });
    expect(hopPropertyAdviceViewModelV3(answer).format).toBe('hop-documentary-answer-view-v3');
    expect(readHopPropertyAdviceAnswer(answer)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: answer });
    expect(readHopPropertyAdviceDossier(dossier)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: dossier });
    expect(readHopDocumentaryAnswer(answer)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: answer });
    expect(() => buildHopPropertyAdvice(input as unknown as HopPropertyAdviceRequest)).toThrow();
    const old = buildHopPropertyAdvice(structuredClone(hopPropertyCompensationSource.requestSnapshot) as HopPropertyAdviceRequest);
    expect(readHopPropertyAdviceAnswerV3(old)).toEqual({ status: 'legacyReadOnly', version: 'v2', answer: old });
    expect(() => buildHopPropertyAdviceV3(old.requestSnapshot as unknown as HopPropertyAdviceRequestV3)).toThrow();
    const tampered = structuredClone(answer); questionOf(tampered.requestSnapshot).investigation!.observationIntentIds = [];
    expect(() => readHopPropertyAdviceAnswerV3(tampered)).toThrow();
  });
});
