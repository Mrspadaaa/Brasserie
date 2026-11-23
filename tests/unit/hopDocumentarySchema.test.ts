import { describe, expect, it } from 'vitest';
import { buildHopDocumentaryAnswer } from '../../src/domain/hopDecision/documentaryAnswer';
import { hopDocumentaryAnswerViewModel } from '../../src/domain/hopDecision/documentaryAnswerViewModel';
import {
  assertHopDocumentaryAnswer,
  assertHopDocumentaryCorpus,
  assertHopDocumentaryRequest,
  createHopDocumentaryCorpus,
  createHopDocumentaryDossier,
  hopDocumentaryAnswerReference,
  hopDocumentaryInputReference,
  hopDocumentaryInterpretationReference,
  hopDocumentaryRouteReference,
  readHopDocumentaryAnswer,
  readHopDocumentaryDossier,
  type HopDocumentaryAnswer,
  type HopDocumentaryClaim,
  type HopDocumentaryCorpus,
  type HopDocumentaryRequest,
  type HopDocumentaryRoute,
} from '../../src/domain/hopDecision/documentaryAnswerSchema';

const manufacturerSource = { title: 'Fiche ISO de test', author: 'Manufacturer', year: 2026, kind: 'manufacturer' as const,
  reference: 'fixture:manufacturer:iso' };
const mappingSource = { title: 'Lexique aromatique de test', author: 'L’Affinée', year: 2026, kind: 'judgment' as const,
  reference: 'fixture:mapping:fruit', locator: 'famille fruitée' };
const candidateDescription = { text: 'Mangue mûre dans les descriptions brutes.', context: 'rawHop' as const, source: manufacturerSource };

function requestFixture(): HopDocumentaryRequest {
  return {
    format: 'hop-documentary-request-v1', id: 'question-sweetness-1',
    originalQuestion: 'Comment compenser une douceur perçue sans promettre un retrait de sucres ?',
    interpretation: { id: 'reading-1', version: '2', text: 'Compenser une perception, pas mesurer le sucre.', origin: 'proposal' },
    criteria: [
      { id: 'criterion-preserve', description: 'Préserver le caractère fruité recherché.', role: 'preserve', origin: 'user', familyId: 'tropical' },
      { id: 'criterion-access', description: 'Connaître le stade et l’accès au lot.', role: 'constraint', origin: 'user' },
    ],
    needs: [
      { id: 'need-compensation', kind: 'balancePerceivedSweetness', criterionIds: ['criterion-preserve'],
        explanation: 'Répondre à la compensation et aux tensions possibles.', candidateIds: ['candidate-a', 'iso-not-loaded'] },
      { id: 'need-access', kind: 'unresolved', criterionIds: ['criterion-access'],
        explanation: 'Le stade ou l’accès doit rester conditionnel.' },
    ],
    context: {
      stage: 'unknown', stageBasis: 'Le stade physique n’a pas été précisé.',
      assertions: [{ id: 'assert-stage-unknown', subject: 'batch-stage', statement: 'Stade non établi.', state: 'unknown', value: null }],
      access: {
        bulkBeer: { state: 'unknown', basis: 'Accès à la cuve non établi.', assertionIds: [] },
        sampling: { state: 'unknown', basis: 'Accès à un échantillon non établi.', assertionIds: [] },
        separatePortion: { state: 'unknown', basis: 'Portion séparée non déclarée.', assertionIds: [] },
      },
    },
    exclusions: [],
    materials: [{ id: 'candidate-a', name: 'Candidate A', form: 'pelletT90', variety: {
      id: 'variety-a', name: 'Candidate A', aliases: [], form: 'pelletT90', descriptions: [candidateDescription], analysis: [],
    } }],
  };
}

function corpusFixture(): HopDocumentaryCorpus {
  return createHopDocumentaryCorpus({ version: 'synth-fixture-v1', sources: [
    { id: 'source-iso', nature: 'manufacturerClaim', source: manufacturerSource, locator: 'Section 2 — emploi publié',
      readingLevel: 'primaryExcerpt', domain: 'Produit ISO documentaire', limits: ['Ne qualifie pas une matière disponible ni un dosage.'] },
    { id: 'source-family-map', nature: 'editorialMapping', source: mappingSource, locator: 'Famille fruitée',
      readingLevel: 'curatedMapping', domain: 'Vocabulaire de description', limits: ['Ne démontre pas un accord en bière.'] },
  ], claims: [{ id: 'claim-iso-limit', version: 'Q10-ISO-1', statement: 'La fiche décrit un emploi conditionnel du produit ISO.',
    sourceIds: ['source-iso'], role: 'limit', domain: 'product-instruction', transferConditions: ['Produit exact identifié.'],
    forbiddenInferences: ['Ne pas en déduire une dose universelle ni une identité de stock.'] }] });
}

function evaluationFixture(request: HopDocumentaryRequest) {
  const criterion = request.criteria[0];
  return { criterion, candidateId: 'candidate-a', partnerReference: null, status: 'candidateOnly' as const,
    candidateDescriptions: [structuredClone(candidateDescription)], partnerDescriptions: [], candidateEvidence: [{ side: 'candidate' as const,
      familyId: 'tropical', familyName: 'Fruits tropicaux', term: 'mangue', quote: candidateDescription.text, context: candidateDescription.context,
      polarity: 'positiveMention' as const, source: manufacturerSource, mappingSource }], partnerEvidence: [],
    familyIds: ['tropical'], sharedFamilyIds: [], missingInformation: ['Aucune observation en bière fournie.'],
    consequence: 'La description renseigne une piste documentaire, pas un résultat sensoriel.' };
}

function answerFixture(): { request: HopDocumentaryRequest; corpus: HopDocumentaryCorpus; answer: HopDocumentaryAnswer } {
  const request = requestFixture();
  const corpus = corpusFixture();
  const arguments_ = [
    { id: 'arg-goal', kind: 'userGoal' as const, text: 'Préserver le caractère fruité, sans le transformer en cible mesurée.',
      criterionIds: ['criterion-preserve'], assertionIds: [], claimIds: [],
      materialEvidence: [{ materialId: 'candidate-a', criterionId: 'criterion-preserve', evaluation: evaluationFixture(request) }] },
    { id: 'arg-iso-limit', kind: 'documentaryFact' as const, text: 'La piste ISO reste documentaire et demande une qualification séparée.',
      criterionIds: ['criterion-preserve'], assertionIds: [], claimIds: ['claim-iso-limit'], materialEvidence: [] },
  ];
  const routeDraft: Omit<HopDocumentaryRoute, 'reference'> = {
    id: 'route-documentary-iso', needIds: ['need-compensation'], criterionIds: ['criterion-preserve'],
    title: 'Comparer les voies documentées', purpose: 'Garder l’hypothèse séparée de toute opération.', scope: 'documentation',
    intervention: 'none', argumentIds: ['arg-goal', 'arg-iso-limit'], materialIds: ['candidate-a'],
    documentaryProductRefs: [{ id: 'product-iso-reference', name: 'Produit ISO — référence documentaire', claimIds: ['claim-iso-limit'] }],
    applicability: { status: 'notEvaluated', conditions: [] },
    preparation: { documentaryDossier: { status: 'available', kind: 'trialToQualify', label: 'Dossier de choix à qualifier' },
      operational: { status: 'notProvided', adapterId: null, reason: 'Aucun adaptateur opérationnel reçu par cette réponse.' },
      missingRequirements: ['Identité matière exacte', 'Base et dose compatibles'], refusalReasons: [] },
  };
  const route: HopDocumentaryRoute = { ...routeDraft, reference: hopDocumentaryRouteReference(routeDraft) };
  const draft = {
    format: 'hop-documentary-answer-v1' as const,
    requestSnapshot: structuredClone(request), corpusSnapshot: structuredClone(corpus),
    inputReference: hopDocumentaryInputReference(request, corpus),
    interpretationReference: hopDocumentaryInterpretationReference(request),
    coverage: { status: 'partial' as const, domain: 'Conseil documentaire de compensation perçue',
      points: [
        { needId: 'need-compensation', status: 'partial' as const, reason: 'Une piste documentaire est expliquée; son essai et son transfert restent à qualifier.',
          argumentIds: ['arg-goal', 'arg-iso-limit'], routeIds: ['route-documentary-iso'] },
        { needId: 'need-access', status: 'unresolved' as const, reason: 'Le stade et l’accès physique restent inconnus.', argumentIds: [], routeIds: [] },
      ], unresolvedCriteria: [{ criterionId: 'criterion-access', reason: 'Une déclaration de stade ou d’accès changerait la portée d’une voie.' }] },
    body: [{ id: 'body-main', text: 'La compensation de perception reste une hypothèse; aucune extraction de sucres ni opération n’est promise.',
      argumentIds: ['arg-goal', 'arg-iso-limit'] }],
    arguments: arguments_, routes: [route], limits: ['Une réponse documentaire ne constitue pas un reçu d’aperçu opérationnel.'],
  };
  const answer: HopDocumentaryAnswer = { ...draft, reference: hopDocumentaryAnswerReference(draft) };
  return { request, corpus, answer };
}

describe('schéma de réponse documentaire versionnée', () => {
  it('conserve stage unknown et candidat demandé non chargé sans le promouvoir en planning ou matière synthétique', () => {
    const request = requestFixture();
    assertHopDocumentaryRequest(request);
    expect(request.context.stage).toBe('unknown');
    expect(request.needs[0].candidateIds).toContain('iso-not-loaded');
    expect(request.materials.map(material => material.id)).toEqual(['candidate-a']);

    const corpus = corpusFixture();
    assertHopDocumentaryCorpus(corpus);
    expect(corpus.version).toBe('synth-fixture-v1');
    expect(corpus.reference).toMatch(/^hop-documentary-corpus-v1:sha256:/);
  });

  it('valide la sortie du constructeur documentaire sans transformer la préparation ou le stade', () => {
    const request = requestFixture();
    const answer = buildHopDocumentaryAnswer(request);
    assertHopDocumentaryAnswer(answer);
    expect(answer.requestSnapshot.context.stage).toBe('unknown');
    expect(answer.coverage.status).toBe('partial');
    expect(answer.routes.some(route => route.preparation.operational.status === 'notProvided')).toBe(true);
    expect(answer.routes.every(route => route.preparation.documentaryDossier.status === 'available')).toBe(true);
    expect(answer.routes.every(route => ['notProvided', 'requiresReceivedAdapter'].includes(route.preparation.operational.status))).toBe(true);
  });

  it('valide les références puis produit une lecture et un DTO qui conservent qualifications, sources et préparation', () => {
    const { answer, corpus } = answerFixture();
    assertHopDocumentaryAnswer(answer);
    expect(answer.inputReference).toBe(hopDocumentaryInputReference(answer.requestSnapshot, corpus));
    expect(answer.interpretationReference).toBe(hopDocumentaryInterpretationReference(answer.requestSnapshot));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.coverage.points[0].status).toBe('partial');

    const read = readHopDocumentaryAnswer(JSON.parse(JSON.stringify(answer)));
    expect(read.status).toBe('readOnly');
    if (read.status !== 'readOnly') return;
    expect(read.answer).toEqual(answer);

    const view = hopDocumentaryAnswerViewModel(read.answer);
    expect(view.format).toBe('hop-documentary-answer-view-v1');
    expect(view.answerReference).toBe(answer.reference);
    expect(view).not.toHaveProperty('reference');
    expect(view.arguments[0].materialEvidence[0].evaluation).toEqual(answer.arguments[0].materialEvidence[0].evaluation);
    expect(view.routes[0].documentaryProductRefs).toEqual(answer.routes[0].documentaryProductRefs);
    expect(view.routes[0].preparation).toEqual(answer.routes[0].preparation);
    expect(view.routes[0].preparation.operational.status).toBe('notProvided');
    expect(view.requestSnapshot.context.stage).toBe('unknown');

    const future = readHopDocumentaryAnswer({ ...answer, format: 'hop-documentary-answer-v9' });
    expect(future).toMatchObject({ status: 'unsupportedReadOnly', snapshot: { format: 'hop-documentary-answer-v9' } });
    const futureCorpus = readHopDocumentaryAnswer({ ...answer, corpusSnapshot: { ...answer.corpusSnapshot, format: 'hop-documentary-corpus-v9' } });
    expect(futureCorpus).toMatchObject({ status: 'unsupportedReadOnly', reason: expect.stringMatching(/corpus documentaire future/) });
  });

  it('fige la voie exacte dans un dossier sans opération et refuse un choix périmé', () => {
    const { answer } = answerFixture();
    const route = answer.routes[0];
    const dossier = createHopDocumentaryDossier({ id: 'dossier-1', answer,
      expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
      routeId: route.id, expectedRouteReference: route.reference,
      motive: 'Garder une voie documentaire à examiner avant tout protocole.', createdAt: '2026-10-02T10:00:00.000Z',
      createdBy: { origin: 'user', label: 'Brasseuse témoin' } });
    expect(dossier.answerSnapshot).toEqual(answer);
    expect(dossier.preparation).toEqual(route.preparation);
    expect(dossier.preparation.operational.status).toBe('notProvided');
    const frozenAnswerSnapshot = structuredClone(dossier.answerSnapshot);
    const laterAnswer = structuredClone(answer);
    laterAnswer.body[0].text = 'Une réponse ultérieure ne réécrit pas le dossier.';
    expect(dossier.answerSnapshot).toEqual(frozenAnswerSnapshot);

    const read = readHopDocumentaryDossier(JSON.parse(JSON.stringify(dossier)));
    expect(read.status).toBe('readOnly');
    if (read.status !== 'readOnly') return;
    expect(read.dossier).toEqual(dossier);
    expect(() => createHopDocumentaryDossier({ id: 'stale-answer', answer, expectedAnswerReference: 'changed',
      expectedInterpretationReference: answer.interpretationReference, routeId: route.id, expectedRouteReference: route.reference,
      motive: 'Motif', createdAt: '2026-10-02T10:00:00.000Z', createdBy: { origin: 'user', label: 'Brasseuse' } })).toThrow(/périmée/);
    expect(() => createHopDocumentaryDossier({ id: 'stale-route', answer, expectedAnswerReference: answer.reference,
      expectedInterpretationReference: answer.interpretationReference, routeId: route.id, expectedRouteReference: 'changed',
      motive: 'Motif', createdAt: '2026-10-02T10:00:00.000Z', createdBy: { origin: 'user', label: 'Brasseuse' } })).toThrow(/périmé/);
    expect(readHopDocumentaryDossier({ ...dossier, format: 'hop-documentary-dossier-v4' })).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('refuse claims, arguments, sources et propriétés de préparation orphelins ou hors contrat', () => {
    const { request, corpus, answer } = answerFixture();
    expect(() => createHopDocumentaryCorpus({ version: 'bad', sources: corpus.sources, claims: [{ ...corpus.claims[0], sourceIds: ['missing-source'] }] })).toThrow(/référence orpheline/);
    expect(() => createHopDocumentaryCorpus({ version: 'bad', sources: corpus.sources, claims: [corpus.claims[0], corpus.claims[0]] })).toThrow(/identifiant répété/);

    const unknownMaterialRoute = structuredClone(answer);
    unknownMaterialRoute.routes[0].materialIds.push('iso-not-loaded');
    expect(() => assertHopDocumentaryAnswer(unknownMaterialRoute)).toThrow(/référence orpheline/);

    const unknownClaimArgument = structuredClone(answer);
    unknownClaimArgument.arguments[1].claimIds = ['claim-missing'];
    expect(() => assertHopDocumentaryAnswer(unknownClaimArgument)).toThrow(/référence orpheline/);

    const orphanMappingSource = structuredClone(answer);
    orphanMappingSource.arguments[0].materialEvidence[0].evaluation.candidateEvidence[0].mappingSource = { ...mappingSource, reference: 'missing-mapping-source' };
    expect(() => assertHopDocumentaryAnswer(orphanMappingSource)).toThrow(/Source de mapping éditoriale absente/);

    const falseReady = structuredClone(answer);
    (falseReady.routes[0].preparation.operational as any) = { status: 'ready', adapterId: null, reason: 'Should be impossible.' };
    expect(() => assertHopDocumentaryAnswer(falseReady)).toThrow(/Statut opérationnel inconnu/);

    const answeredWithGap = structuredClone(answer);
    (answeredWithGap.coverage as any).status = 'answered';
    expect(() => assertHopDocumentaryAnswer(answeredWithGap)).toThrow(/answered malgré une lacune/);

    const outOfScope = structuredClone(answer);
    (outOfScope.coverage as any).status = 'outOfScope';
    expect(() => assertHopDocumentaryAnswer({ ...outOfScope, reference: hopDocumentaryAnswerReference(outOfScope) }))
      .toThrow(/outOfScope malgré un point substantiellement répondu/);

    const noSubstantiveAnswer = structuredClone(answer);
    noSubstantiveAnswer.coverage.status = 'outOfScope';
    noSubstantiveAnswer.coverage.points = noSubstantiveAnswer.coverage.points.map(point => ({ ...point, status: 'unresolved', argumentIds: [], routeIds: [] }));
    noSubstantiveAnswer.coverage.unresolvedCriteria = noSubstantiveAnswer.requestSnapshot.criteria.map(criterion => ({
      criterionId: criterion.id, reason: 'Aucune voie ne répond à ce critère dans le domaine fourni.',
    }));
    noSubstantiveAnswer.body = [{ id: 'body-out-of-scope', text: 'Aucune réponse substantielle n’est disponible dans ce périmètre.', argumentIds: [] }];
    noSubstantiveAnswer.arguments = [];
    noSubstantiveAnswer.routes = [];
    const { reference: _oldReference, ...outOfScopeBody } = noSubstantiveAnswer;
    const validOutOfScope = { ...outOfScopeBody, reference: hopDocumentaryAnswerReference(outOfScopeBody) };
    expect(readHopDocumentaryAnswer(validOutOfScope)).toMatchObject({ status: 'readOnly', answer: { coverage: { status: 'outOfScope' } } });
    expect(request.context.stage).toBe('unknown');
  });
});
