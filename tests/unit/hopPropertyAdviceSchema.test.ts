import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertHopPropertyAdviceAnswer,
  assertHopPropertyAdviceDossier,
  assertHopPropertyAdviceRequest,
  createHopPropertyAdviceDossier,
  hopPropertyAdviceAnswerReference,
  hopPropertyAdviceInputReference,
  hopPropertyAdviceInterpretationReference,
  hopPropertyAdviceStrategyReference,
  readHopPropertyAdviceAnswer,
  readHopPropertyAdviceDossier,
  type HopPropertyAdviceAnswer,
  type HopPropertyAdviceCandidateAssessment,
  type HopPropertyAdviceDossier,
  type HopPropertyAdviceIntent,
  type HopPropertyAdviceRequest,
  type HopPropertyAdviceStrategy,
} from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopPropertyAdviceViewModel } from '../../src/domain/hopDecision/propertyAdviceViewModel';
import type { HopAdviceAssertion } from '../../src/domain/hopDecision/adviceSchema';
import { buildHopPropertyAdvice } from '../../src/domain/hopDecision/propertyAdvice';
import {
  createHopDocumentaryCorpus,
  createHopDocumentaryDossier,
  hopDocumentaryAnswerReference,
  hopDocumentaryDossierReference,
  hopDocumentaryInputReference,
  hopDocumentaryInterpretationReference,
  hopDocumentaryRouteReference,
  readHopDocumentaryAnswer,
  readHopDocumentaryDossier,
  type HopDocumentaryAnswer,
  type HopDocumentaryCorpus,
  type HopDocumentaryDossier,
  type HopDocumentaryRequest,
  type HopDocumentaryRoute,
} from '../../src/domain/hopDecision/documentaryAnswerSchema';

const materialSource = { title: 'Fiche houblon de test', author: 'Producteur', year: 2026, kind: 'manufacturer' as const,
  reference: 'fixture:property-advice:material' };
const floralMappingSource = { title: 'Mapping floral de test', author: 'L’Affinée', year: 2026, kind: 'judgment' as const,
  reference: 'fixture:property-advice:mapping-floral', locator: 'famille florale' };
const resinMappingSource = { title: 'Mapping résine de test', author: 'L’Affinée', year: 2026, kind: 'judgment' as const,
  reference: 'fixture:property-advice:mapping-resin', locator: 'famille résine' };
const hopDescription = { text: 'Résineux, avec des notes florales sur houblon brut.', context: 'rawHop' as const, source: materialSource };

function corpusFixture(): HopDocumentaryCorpus {
  return createHopDocumentaryCorpus({ version: 'property-advice-fixture-v1', sources: [
    { id: 'source-material', nature: 'manufacturerClaim', source: materialSource, locator: 'Description fournisseur',
      readingLevel: 'providedMaterialSource', domain: 'description de variété', limits: ['Ne prédit pas la bière finie.'] },
    { id: 'source-map-floral', nature: 'editorialMapping', source: floralMappingSource, locator: 'Famille florale',
      readingLevel: 'curatedMapping', domain: 'vocabulaire aromatique', limits: ['Ne quantifie aucune intensité.'] },
    { id: 'source-map-resin', nature: 'editorialMapping', source: resinMappingSource, locator: 'Famille résine',
      readingLevel: 'curatedMapping', domain: 'vocabulaire aromatique', limits: ['Ne qualifie pas une bière.'] },
  ], claims: [{ id: 'claim-floral-description', version: '1', statement: 'Une description de houblon brut mentionne le floral.',
    sourceIds: ['source-material', 'source-map-floral'], role: 'support', domain: 'description aromatique',
    transferConditions: ['La description reste liée au houblon brut.'], forbiddenInferences: ['Ne pas en déduire une intensité en bière.'] }] });
}

function sourceSpan(question: string, text: string) {
  const start = question.indexOf(text);
  if (start < 0) throw new Error(`Fixture source span absent: ${text}`);
  return { start, end: start + text.length, text };
}

function requestFixture(): HopPropertyAdviceRequest {
  const originalQuestion = 'Je veux plus de floral avec une amertume légère; ma matière est résineuse. La biotransformation peut-elle aider ?';
  const common = {
    required: true,
    comparisonBasis: { kind: 'qualitativeTarget' as const, assertionIds: [] as string[] },
    metric: 'sensory' as const,
    subject: { kind: 'beer' as const, label: 'Bière visée', materialId: null, sensoryContext: 'beer' as const },
    interpretationOrigin: 'user' as const,
    basis: 'Fragment exact de la question utilisateur; aucune échelle numérique ajoutée.',
    relatedIntentIds: [] as string[],
  };
  const observation: HopPropertyAdviceIntent = {
    id: 'intent-resin-observation', property: 'materialCharacter', label: 'résineuse', familyId: 'resin',
    role: 'reportedObservation', direction: null, qualification: null, required: false,
    comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'material', label: 'Matière maison', materialId: 'hop-house', sensoryContext: 'rawHop' },
    sourceSpans: [sourceSpan(originalQuestion, 'résineuse')], interpretationOrigin: 'user',
    basis: 'Observation verbatim de matière, non directionnelle; aucune analyse associée.', relatedIntentIds: ['intent-floral'],
  };
  const intents: HopPropertyAdviceIntent[] = [
    { ...common, id: 'intent-floral', property: 'aroma', label: 'floral', familyId: 'floral', role: 'target', direction: 'increase',
      qualification: 'plus', subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
      sourceSpans: [sourceSpan(originalQuestion, 'floral'), sourceSpan(originalQuestion, 'plus de')],
      relatedIntentIds: ['intent-bitterness', 'intent-resin-observation'] },
    { ...common, id: 'intent-bitterness', property: 'bitterness', label: 'amertume', role: 'target', direction: null,
      qualification: 'légère', sourceSpans: [sourceSpan(originalQuestion, 'amertume légère'), sourceSpan(originalQuestion, 'légère')],
      relatedIntentIds: ['intent-floral'] },
    observation,
    { ...common, id: 'intent-bio-question', property: 'bioContribution', label: 'biotransformation', role: 'investigation', direction: 'investigate',
      required: true, qualification: null, metric: 'unspecified', sourceSpans: [sourceSpan(originalQuestion, 'La biotransformation peut-elle aider ?')],
      basis: 'Question d’investigation, pas observation d’une fermentation ou d’un effet.' },
  ];
  return {
    format: 'hop-documentary-request-v2', id: 'request-composed-v2', originalQuestion,
    interpretation: { id: 'interpretation-v2', version: 'reading-v2', text: 'Répondre à chaque propriété sans convertir les qualificatifs en mesures.', origin: 'user' },
    propertyIntents: intents,
    candidatePolicy: { kind: 'explicit', materialIds: ['hop-house', 'hop-no-description', 'not-loaded'], basis: 'Périmètre explicitement demandé par la brasseuse.' },
    context: {
      stage: 'unknown', stageBasis: 'Aucun stade connu; ne pas choisir planning par défaut.', assertions: [],
      access: {
        bulkBeer: { state: 'unknown', basis: 'Accès inconnu.', assertionIds: [] },
        sampling: { state: 'unknown', basis: 'Accès inconnu.', assertionIds: [] },
        separatePortion: { state: 'unknown', basis: 'Accès inconnu.', assertionIds: [] },
      },
    },
    exclusions: [],
    materials: [
      { id: 'hop-house', name: 'Houblon maison', form: 'pelletT90', variety: { id: 'var-house', name: 'Houblon maison', aliases: [],
        form: 'pelletT90', descriptions: [hopDescription], analysis: [] } },
      { id: 'hop-no-description', name: 'Matière sans description', form: 'pelletT90', variety: { id: 'var-no-description',
        name: 'Matière sans description', aliases: [], form: 'pelletT90', descriptions: [], analysis: [] } },
    ],
  };
}

function emptyEvaluation(intent: HopPropertyAdviceIntent) {
  return {
    intentId: intent.id, partnerReference: intent.partner ?? null, status: 'unknown' as const,
    candidateDescriptions: [], partnerDescriptions: [], candidateEvidence: [], partnerEvidence: [],
    familyIds: [], sharedFamilyIds: [], missingInformation: ['Aucune description de cette propriété pour cette matière.'],
    consequence: 'Aucune conclusion candidate.', reason: 'Aucune source candidate ne répond à cette intention.',
  };
}

function candidateAssessments(request: HopPropertyAdviceRequest): HopPropertyAdviceCandidateAssessment[] {
  const intents = request.propertyIntents;
  const lexicalIntents = intents.filter(intent => intent.property === 'aroma' && intent.metric === 'sensory'
    && ((['target', 'preference'].includes(intent.role) && intent.direction !== 'investigate')
      || (intent.role === 'constraint' && ['keep', 'exclude', 'decrease'].includes(intent.direction ?? ''))));
  const floral = intents.find(row => row.id === 'intent-floral')!;
  const descriptor = (familyId: string, familyName: string, term: string, source: typeof floralMappingSource) => ({
    side: 'candidate' as const, familyId, familyName, term, quote: hopDescription.text, context: hopDescription.context,
    polarity: 'positiveMention' as const, source: materialSource, mappingSource: source,
  });
  const byHouse = lexicalIntents.map(intent => {
    if (intent.id === floral.id) return {
      intentId: intent.id, partnerReference: null, status: 'documentedSupport' as const,
      candidateDescriptions: [hopDescription], partnerDescriptions: [],
      candidateEvidence: [descriptor('floral', 'Floral', 'floral', floralMappingSource)], partnerEvidence: [],
      familyIds: ['floral'], sharedFamilyIds: [], missingInformation: ['Transfert en bière inconnue.'],
      consequence: 'La description donne une piste florale de matière.', reason: 'Appui descriptif borné au houblon brut.',
    };
    return emptyEvaluation(intent);
  });
  const noDescription = lexicalIntents.map(intent => emptyEvaluation(intent));
  return [
    { materialId: 'hop-house', status: 'documented', recordKeys: ['record-house'], reasons: ['Description fournisseur sourcée; aucune analyse de lot.'], evaluations: byHouse },
    { materialId: 'hop-no-description', status: 'unqualified', recordKeys: ['record-no-description'], reasons: ['Aucune description candidate qualifiée.'], evaluations: noDescription },
    { materialId: 'not-loaded', status: 'notLoaded', recordKeys: [], reasons: ['Identité demandée mais absente du snapshot matière.'], evaluations: [] },
  ];
}

function answerFixture(): { request: HopPropertyAdviceRequest; corpus: HopDocumentaryCorpus; answer: HopPropertyAdviceAnswer } {
  const request = requestFixture();
  const corpus = corpusFixture();
  const assessments = candidateAssessments(request);
  const floralEvidence = assessments[0].evaluations.find(row => row.intentId === 'intent-floral')!;
  const arguments_ = [
    { id: 'arg-floral-target', kind: 'userTarget' as const, text: 'La demande porte explicitement sur plus de floral, sans quantifier le niveau.',
      intentIds: ['intent-floral'], assertionIds: [], claimIds: [], materialEvidence: [] },
    { id: 'arg-bitterness-target', kind: 'userTarget' as const, text: 'Légère est un qualificatif de cible, sans amertume de départ connue.',
      intentIds: ['intent-bitterness'], assertionIds: [], claimIds: [], materialEvidence: [] },
    { id: 'arg-resin-observation', kind: 'userObservation' as const, text: 'La matière est décrite comme résineuse; cela ne caractérise pas la bière.',
      intentIds: ['intent-resin-observation'], assertionIds: [], claimIds: [], materialEvidence: [] },
    { id: 'arg-bio-question', kind: 'userQuestion' as const, text: 'La biotransformation est interrogée; aucun effet n’est déclaré réalisé.',
      intentIds: ['intent-bio-question'], assertionIds: [], claimIds: [], materialEvidence: [] },
    { id: 'arg-floral-documentary', kind: 'documentaryFact' as const, text: 'La description sourcée de la matière mentionne un caractère floral sur houblon brut.',
      intentIds: ['intent-floral'], assertionIds: [], claimIds: ['claim-floral-description'],
      materialEvidence: [{ materialId: 'hop-house', intentId: 'intent-floral', evaluation: floralEvidence }] },
  ];
  const inputReference = hopPropertyAdviceInputReference(request, corpus);
  const strategyBody: Omit<HopPropertyAdviceStrategy, 'reference'> = {
    id: 'strategy-descriptive-comparison', kind: 'candidateDescriptionComparison', contribution: 'option',
    title: 'Comparer la description florale de la matière',
    purpose: 'Examiner la piste florale documentée en gardant ses limites.',
    distinctiveReason: 'Une description sur houblon brut soutient une comparaison documentaire, sans établir le profil en bière.',
    scope: 'documentation', intervention: 'none', argumentIds: arguments_.map(row => row.id), candidateIds: ['hop-house'],
    documentaryProductRefs: [],
    effects: [
      { intentId: 'intent-floral', status: 'boundedSupport', text: 'La description mentionne floral sur houblon brut; le transfert reste inconnu.', argumentIds: ['arg-floral-documentary'] },
      { intentId: 'intent-bitterness', status: 'unresolved', text: 'Aucun effet d’amertume n’est établi par cette description.', argumentIds: ['arg-bitterness-target'] },
      { intentId: 'intent-resin-observation', status: 'structuralGuard', text: 'L’observation concerne la matière, pas la bière achevée.', argumentIds: ['arg-resin-observation'] },
      { intentId: 'intent-bio-question', status: 'unresolved', text: 'Aucune prémisse biologique propre à la culture et au procédé n’est fournie ici.', argumentIds: ['arg-bio-question'] },
    ],
    tradeoffs: [{ text: 'La comparaison gagne une prémisse descriptive, mais pas une intensité mesurée ou un résultat en bière.',
      intentIds: ['intent-floral', 'intent-bitterness'], argumentIds: ['arg-floral-documentary', 'arg-bitterness-target'] }],
    nextSteps: [{ kind: 'compare', text: 'Comparer au témoin si une voie d’essai est ensuite qualifiée.', argumentIds: ['arg-floral-documentary'] }],
    applicability: { status: 'missingConditions', conditions: [{ id: 'unknown-beer-transfer', state: 'unknown',
      description: 'Matrice et transfert de la description à la bière inconnus.', assertionIds: [], intentIds: ['intent-floral'] }] },
    preparation: { documentaryDossier: { status: 'available', kind: 'choice', label: 'Dossier documentaire de comparaison' },
      operational: { status: 'notProvided', adapterId: null, reason: 'Aucun adaptateur opérationnel ne fait partie de ce conseil.' },
      missingRequirements: ['Matrice et emploi à qualifier.'], refusalReasons: [] },
  };
  const strategy: HopPropertyAdviceStrategy = { ...strategyBody,
    reference: hopPropertyAdviceStrategyReference(inputReference, strategyBody) };
  const body = {
    format: 'hop-documentary-answer-v2' as const, requestSnapshot: request, corpusSnapshot: corpus,
    rulesVersion: 'property-advice-rules-fixture-v1', inputReference,
    interpretationReference: hopPropertyAdviceInterpretationReference(request),
    coverage: { status: 'partial' as const, points: [
      { intentId: 'intent-floral', status: 'answered' as const, reason: 'Réponse qualitative bornée par la description.',
        argumentIds: ['arg-floral-target', 'arg-floral-documentary'], strategyIds: [strategy.id] },
      { intentId: 'intent-bitterness', status: 'unresolved' as const, reason: 'Aucune comparaison d’amertume n’est étayée.',
        argumentIds: ['arg-bitterness-target'], strategyIds: [strategy.id] },
      { intentId: 'intent-resin-observation', status: 'contextOnly' as const, reason: 'Observation conservée comme contexte de matière.',
        argumentIds: ['arg-resin-observation'], strategyIds: [strategy.id] },
      { intentId: 'intent-bio-question', status: 'unresolved' as const, reason: 'La question biologique reste sans prémisse suffisante.',
        argumentIds: ['arg-bio-question'], strategyIds: [strategy.id] },
    ] },
    body: [{ id: 'answer-composed', text: 'La description source donne une piste florale sur houblon brut; elle ne mesure pas l’intensité ni l’amertume de la bière, et ne répond pas seule à la question biologique.',
      argumentIds: ['arg-floral-target', 'arg-floral-documentary', 'arg-bitterness-target', 'arg-resin-observation', 'arg-bio-question'] }],
    arguments: arguments_, candidateAssessments: assessments, strategies: [strategy],
    limits: ['Aucune intensité sensorielle ou permission opérationnelle n’est produite.'],
  };
  const answer: HopPropertyAdviceAnswer = { ...body, reference: hopPropertyAdviceAnswerReference(body) };
  return { request, corpus, answer };
}

function contextOnlyAnswerFixture(): HopPropertyAdviceAnswer {
  const { request, corpus } = answerFixture();
  const observation = request.propertyIntents.find(row => row.role === 'reportedObservation')!;
  request.propertyIntents = [{ ...observation, relatedIntentIds: [] }];
  request.candidatePolicy = { kind: 'explicit', materialIds: [], basis: 'Aucune recherche de candidat demandée.' };
  const inputReference = hopPropertyAdviceInputReference(request, corpus);
  const answerBody = {
    format: 'hop-documentary-answer-v2' as const, requestSnapshot: request, corpusSnapshot: corpus,
    rulesVersion: 'property-advice-rules-fixture-v1', inputReference,
    interpretationReference: hopPropertyAdviceInterpretationReference(request),
    coverage: { status: 'outOfScope' as const, points: [{ intentId: observation.id, status: 'contextOnly' as const,
      reason: 'Observation conservée sans question qui lui demande une interprétation.', argumentIds: ['arg-context-only'], strategyIds: [] }] },
    body: [{ id: 'context-only-body', text: 'L’observation de matière est conservée comme contexte; aucune conclusion sur la bière n’est ajoutée.',
      argumentIds: ['arg-context-only'] }],
    arguments: [{ id: 'arg-context-only', kind: 'userObservation' as const, text: 'Observation rapportée sur la matière maison.',
      intentIds: [observation.id], assertionIds: [], claimIds: [], materialEvidence: [] }],
    candidateAssessments: [], strategies: [], limits: ['Un contexte conservé n’est pas une réponse substantielle.'],
  };
  return { ...answerBody, reference: hopPropertyAdviceAnswerReference(answerBody) };
}

function constraintAnswerFixture(): HopPropertyAdviceAnswer {
  const { request, corpus, answer } = answerFixture();
  const phrase = 'Évite la résine';
  request.originalQuestion += ` ${phrase}.`;
  const intent: HopPropertyAdviceIntent = {
    id: 'intent-avoid-resin', property: 'aroma', label: 'résine', familyId: 'resin', role: 'constraint', direction: 'exclude',
    qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [sourceSpan(request.originalQuestion, phrase)], interpretationOrigin: 'user',
    basis: 'Exclusion aromatique explicitement formulée.', relatedIntentIds: ['intent-floral'],
  };
  request.propertyIntents.push(intent);
  const constraintEvaluation = {
    intentId: intent.id, partnerReference: null, status: 'documentedAgainst' as const,
    candidateDescriptions: [hopDescription], partnerDescriptions: [],
    candidateEvidence: [{ side: 'candidate' as const, familyId: 'resin', familyName: 'Résine', term: 'résineux',
      quote: hopDescription.text, context: hopDescription.context, polarity: 'positiveMention' as const,
      source: materialSource, mappingSource: resinMappingSource }],
    partnerEvidence: [], familyIds: ['resin'], sharedFamilyIds: [], missingInformation: [],
    consequence: 'La mention résineuse est une tension documentaire avec l’exclusion demandée.',
    reason: 'La fiche décrit du houblon brut; elle ne certifie pas le caractère de la bière.',
  };
  const unqualifiedEvaluation = emptyEvaluation(intent);
  answer.candidateAssessments.find(row => row.materialId === 'hop-house')!.evaluations.push(constraintEvaluation);
  answer.candidateAssessments.find(row => row.materialId === 'hop-no-description')!.evaluations.push(unqualifiedEvaluation);
  const userArgument = { id: 'arg-resin-constraint', kind: 'userConstraint' as const,
    text: 'La résine est explicitement exclue comme propriété aromatique recherchée.', intentIds: [intent.id], assertionIds: [], claimIds: [], materialEvidence: [] };
  const evidenceArgument = { id: 'arg-resin-evidence', kind: 'documentaryFact' as const,
    text: 'La description source mentionne résineux sur houblon brut.', intentIds: [intent.id], assertionIds: [], claimIds: [],
    materialEvidence: [{ materialId: 'hop-house', intentId: intent.id, evaluation: constraintEvaluation }] };
  answer.arguments.push(userArgument, evidenceArgument);
  const strategy = answer.strategies[0];
  strategy.argumentIds.push(userArgument.id, evidenceArgument.id);
  strategy.effects.push({ intentId: intent.id, status: 'tension',
    text: 'La description de matière contient une mention résineuse face à cette exclusion.',
    argumentIds: [userArgument.id, evidenceArgument.id] });
  answer.coverage.points.push({ intentId: intent.id, status: 'partial', reason: 'Tension documentaire conservée; résultat en bière inconnu.',
    argumentIds: [userArgument.id, evidenceArgument.id], strategyIds: [strategy.id] });
  answer.body.push({ id: 'answer-resin-constraint', text: 'La description source signale une tension documentaire avec la contrainte résine.',
    argumentIds: [userArgument.id, evidenceArgument.id] });
  answer.inputReference = hopPropertyAdviceInputReference(request, corpus);
  answer.interpretationReference = hopPropertyAdviceInterpretationReference(request);
  strategy.reference = hopPropertyAdviceStrategyReference(answer.inputReference, strategy);
  answer.reference = hopPropertyAdviceAnswerReference(answer);
  return answer;
}

function measurementRequest(input: { metric: HopPropertyAdviceIntent['metric']; property: HopPropertyAdviceIntent['property'];
  label: string; assertions: HopAdviceAssertion[] }): HopPropertyAdviceRequest {
  const request = requestFixture();
  request.context.assertions = structuredClone(input.assertions);
  request.propertyIntents = [{
    id: 'intent-measurement', property: input.property, label: input.label, role: 'measurement', direction: null, qualification: null, required: false,
    comparisonBasis: { kind: 'current', assertionIds: input.assertions.map(assertion => assertion.id) }, metric: input.metric,
    subject: { kind: 'beer', label: 'Bière mesurée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [], interpretationOrigin: 'user', basis: 'Mesure fournie dans le contexte, non déduite d’un qualificatif.', relatedIntentIds: [],
  }];
  request.candidatePolicy = { kind: 'explicit', materialIds: [], basis: 'Aucune candidate requise pour qualifier le fait mesuré.' };
  request.materials = [];
  request.exclusions = [];
  return request;
}

function legacyFixture(): { answer: HopDocumentaryAnswer; dossier: HopDocumentaryDossier } {
  const corpus = createHopDocumentaryCorpus({ version: 'legacy-fixture-v1', sources: [], claims: [] });
  const request: HopDocumentaryRequest = {
    format: 'hop-documentary-request-v1', id: 'legacy-request', originalQuestion: 'Question archivée sans réponse dans le corpus.',
    interpretation: { id: 'legacy-reading', version: '1', text: 'Lecture historique conservée.', origin: 'user' },
    criteria: [{ id: 'legacy-criterion', description: 'Intention historique.', role: 'seek', origin: 'user' }],
    needs: [{ id: 'legacy-need', kind: 'unresolved', criterionIds: ['legacy-criterion'], explanation: 'Aucune preuve suffisante.' }],
    context: { stage: 'unknown', stageBasis: 'Stade historique inconnu.', assertions: [], access: {
      bulkBeer: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      sampling: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
      separatePortion: { state: 'unknown', basis: 'Inconnu.', assertionIds: [] },
    } }, exclusions: [], materials: [],
  };
  const argument = { id: 'legacy-argument', kind: 'userGoal' as const, text: 'Intention conservée telle quelle.', criterionIds: ['legacy-criterion'],
    assertionIds: [], claimIds: [], materialEvidence: [] };
  const routeBody: Omit<HopDocumentaryRoute, 'reference'> = {
    id: 'legacy-route', needIds: ['legacy-need'], criterionIds: ['legacy-criterion'], title: 'Dossier de relecture',
    purpose: 'Conserver une voie ancienne sans opération.', scope: 'documentation', intervention: 'none', argumentIds: ['legacy-argument'],
    materialIds: [], documentaryProductRefs: [], applicability: { status: 'notEvaluated', conditions: [] },
    preparation: { documentaryDossier: { status: 'available', kind: 'choice', label: 'Dossier historique' },
      operational: { status: 'notProvided', adapterId: null, reason: 'Aucun adaptateur enregistré.' }, missingRequirements: [], refusalReasons: [] },
  };
  const route: HopDocumentaryRoute = { ...routeBody, reference: hopDocumentaryRouteReference(routeBody) };
  const answerBody = {
    format: 'hop-documentary-answer-v1' as const, requestSnapshot: request, corpusSnapshot: corpus,
    inputReference: hopDocumentaryInputReference(request, corpus), interpretationReference: hopDocumentaryInterpretationReference(request),
    coverage: { status: 'outOfScope' as const, domain: 'Conseil documentaire historique.',
      points: [{ needId: 'legacy-need', status: 'unresolved' as const, reason: 'Aucune réponse enregistrée.', argumentIds: ['legacy-argument'], routeIds: [route.id] }],
      unresolvedCriteria: [{ criterionId: 'legacy-criterion', reason: 'Aucune source correspondante.' }] },
    body: [{ id: 'legacy-body', text: 'La réponse V1 reste conservée sans recalcul.', argumentIds: ['legacy-argument'] }],
    arguments: [argument], routes: [route], limits: ['Snapshot historique immuable.'],
  };
  const answer: HopDocumentaryAnswer = { ...answerBody, reference: hopDocumentaryAnswerReference(answerBody) };
  const dossier = createHopDocumentaryDossier({ id: 'legacy-dossier', answer, expectedAnswerReference: answer.reference,
    expectedInterpretationReference: answer.interpretationReference, routeId: route.id, expectedRouteReference: route.reference,
    motive: 'Conserver exactement la décision archivée.', createdAt: '2026-10-03T10:00:00.000Z',
    createdBy: { origin: 'user', label: 'Brasseuse fixture' } });
  return { answer, dossier };
}

function actualOldV2MeasurementArchive() {
  const path = new URL('../fixtures/public-history/legacy-measurement-01.json', import.meta.url);
  return JSON.parse(readFileSync(path, 'utf8')) as {
    sourceBinarySha256: string;
    request: HopPropertyAdviceRequest;
    answer: HopPropertyAdviceAnswer;
    dossier: import('../../src/domain/hopDecision/propertyAdviceSchema').HopPropertyAdviceDossier;
  };
}

describe('schéma V2 de conseil documentaire par propriété', () => {
  it('préserve directions, qualificatifs, observation et investigation sans inventer une mesure ou une base', () => {
    const request = requestFixture();
    expect(() => assertHopPropertyAdviceRequest(request)).not.toThrow();
    const bitterness = request.propertyIntents.find(row => row.id === 'intent-bitterness')!;
    expect(bitterness).toMatchObject({ role: 'target', direction: null, qualification: 'légère', metric: 'sensory',
      comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(bitterness).not.toHaveProperty('value');
    const bio = request.propertyIntents.find(row => row.id === 'intent-bio-question')!;
    expect(bio).toMatchObject({ role: 'investigation', direction: 'investigate' });
    const observation = request.propertyIntents.find(row => row.id === 'intent-resin-observation')!;
    expect(observation).toMatchObject({ role: 'reportedObservation', direction: null, subject: { kind: 'material', materialId: 'hop-house' } });
    const unsupportedRelative = structuredClone(request);
    const relative = unsupportedRelative.propertyIntents.find(row => row.id === 'intent-bitterness')!;
    relative.direction = 'decrease';
    expect(() => assertHopPropertyAdviceRequest(unsupportedRelative)).toThrow(/exige une base current/);
    relative.comparisonBasis = { kind: 'current', assertionIds: [] };
    expect(() => assertHopPropertyAdviceRequest(unsupportedRelative)).not.toThrow();

    const alteredSpan = structuredClone(request);
    alteredSpan.propertyIntents[0].sourceSpans[0].text = 'juicy';
    expect(() => assertHopPropertyAdviceRequest(alteredSpan)).toThrow(/Fragment source différent/);
    const falseObservation = structuredClone(request);
    falseObservation.propertyIntents.find(row => row.id === 'intent-bio-question')!.role = 'reportedObservation';
    expect(() => assertHopPropertyAdviceRequest(falseObservation)).toThrow(/observation ou mesure rapportée ne porte pas/);
    const explicitEmpty = structuredClone(request);
    explicitEmpty.candidatePolicy.materialIds = [];
    expect(() => assertHopPropertyAdviceRequest(explicitEmpty)).not.toThrow();
    const unboundedDiscovery = structuredClone(request);
    unboundedDiscovery.candidatePolicy.kind = 'discover';
    unboundedDiscovery.candidatePolicy.materialIds = [];
    expect(() => assertHopPropertyAdviceRequest(unboundedDiscovery)).toThrow(/doit nommer son périmètre/);
  });

  it('refuse de composer une mesure pH depuis une température mesurée et une acidité inconnue', () => {
    const request = measurementRequest({ metric: 'pH', property: 'acidity', label: 'pH actuel mesuré', assertions: [
      { id: 'temperature', subject: 'beer.temperature', statement: 'Température mesurée.', state: 'measured', value: 20, unit: 'degC', dimension: 'process' },
      { id: 'acid-unknown', subject: 'beer.acidity', statement: 'Acidité inconnue.', state: 'unknown', value: null, dimension: 'acidity' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(request)).toThrow(/une seule assertion mesurée compatible/);
    expect(() => buildHopPropertyAdvice(request, corpusFixture())).toThrow(/une seule assertion mesurée compatible/);
  });

  it('refuse une acidité titrable en g/L utilisée comme mesure pH', () => {
    const request = measurementRequest({ metric: 'pH', property: 'acidity', label: 'pH actuel mesuré', assertions: [
      { id: 'ta', subject: 'beer.titratableAcidity', statement: 'Acidité titrable mesurée.', state: 'measured', value: 4, unit: 'g/L', dimension: 'acidity' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(request)).toThrow(/même assertion pH mesurée/);
    expect(() => buildHopPropertyAdvice(request, corpusFixture())).toThrow(/même assertion pH mesurée/);
  });

  it('accepte une vraie mesure pH sur la même assertion sans imposer de libellé de sujet libre', () => {
    const request = measurementRequest({ metric: 'pH', property: 'acidity', label: 'pH actuel mesuré', assertions: [
      { id: 'assertion-ph', subject: 'beer.acidity', statement: 'pH mesuré sur bière.', state: 'measured', value: 4.1, unit: 'pH', dimension: 'acidity' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(request)).not.toThrow();
    const probePositive = measurementRequest({ metric: 'pH', property: 'acidity', label: 'pH actuel mesuré', assertions: [
      { id: 'probe-ph', subject: 'beer.pH', statement: 'pH mesuré sur bière.', state: 'measured', value: 4.1, unit: 'pH', dimension: 'acidity' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(probePositive)).not.toThrow();
    const answer = buildHopPropertyAdvice(probePositive, corpusFixture());
    expect(answer.coverage.points[0].status).toBe('contextOnly');
    expect(answer.arguments).toContainEqual(expect.objectContaining({ kind: 'userMeasurement', assertionIds: ['probe-ph'] }));
    const withoutMeasurement = structuredClone(request);
    withoutMeasurement.context.assertions = [];
    withoutMeasurement.propertyIntents.at(-1)!.comparisonBasis.assertionIds = [];
    expect(() => assertHopPropertyAdviceRequest(withoutMeasurement)).toThrow(/mesure doit référencer/);
    const noUnit = structuredClone(request);
    delete noUnit.context.assertions[0].unit;
    expect(() => assertHopPropertyAdviceRequest(noUnit)).toThrow(/même assertion pH mesurée/);
  });

  it('qualifie les autres métriques uniquement quand leur mesure est exprimable sans conversion', () => {
    const titratable = measurementRequest({ metric: 'titratableAcidity', property: 'acidity', label: 'acidité titrable', assertions: [
      { id: 'ta', subject: 'beer.titratableAcidity', statement: 'Acidité titrable mesurée.', state: 'measured', value: 4, unit: 'g/L', dimension: 'acidity' },
    ] });
    const originalTA = structuredClone(titratable.context.assertions);
    expect(() => assertHopPropertyAdviceRequest(titratable)).toThrow(/identité structurée de méthode\/base/);
    expect(titratable.context.assertions).toEqual(originalTA);

    const analyticalBU = measurementRequest({ metric: 'analyticalBU', property: 'bitterness', label: 'BU analytique', assertions: [
      { id: 'bu', subject: 'beer.bitterness', statement: 'BU mesurée.', state: 'measured', value: 32, unit: 'BU' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(analyticalBU)).not.toThrow();
    const ibu = structuredClone(analyticalBU);
    ibu.context.assertions[0].unit = 'IBU';
    expect(() => assertHopPropertyAdviceRequest(ibu)).toThrow(/unité BU exacte/);
    const temperatureAsBU = structuredClone(analyticalBU);
    temperatureAsBU.context.assertions[0].dimension = 'process';
    expect(() => assertHopPropertyAdviceRequest(temperatureAsBU)).toThrow(/dimension contradictoire/);

    const sensory = measurementRequest({ metric: 'sensory', property: 'acidity', label: 'note sensorielle d’acidité', assertions: [
      { id: 'sensory-acid', subject: 'beer.sensory', statement: 'Note sur échelle locale.', state: 'measured', value: 4, unit: 'score/5', dimension: 'acidity' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(sensory)).toThrow(/référence d’échelle\/version/);
    const unspecified = measurementRequest({ metric: 'unspecified', property: 'acidity', label: 'mesure inconnue', assertions: [
      { id: 'untyped', subject: 'beer.unknown', statement: 'Mesure non qualifiée.', state: 'measured', value: 4, unit: 'score' },
    ] });
    expect(() => assertHopPropertyAdviceRequest(unspecified)).toThrow(/Métrique unspecified/);
  });

  it('valide les preuves candidates par contenu source exact et garde les IDs non chargés localement', () => {
    const { answer } = answerFixture();
    expect(() => assertHopPropertyAdviceAnswer(answer)).not.toThrow();
    expect(answer.candidateAssessments.map(row => [row.materialId, row.status])).toEqual([
      ['hop-house', 'documented'], ['hop-no-description', 'unqualified'], ['not-loaded', 'notLoaded'],
    ]);
    expect(answer.requestSnapshot.materials[0].variety?.analysis).toEqual([]);
    const changedQuote = structuredClone(answer);
    changedQuote.candidateAssessments[0].evaluations[0].candidateEvidence[0].quote = 'Autre phrase non fournie.';
    expect(() => assertHopPropertyAdviceAnswer(changedQuote)).toThrow(/Citation de descripteur absente/);
    const changedMapping = structuredClone(answer);
    changedMapping.candidateAssessments[0].evaluations[0].candidateEvidence[0].mappingSource.reference = 'mapping-orphan';
    expect(() => assertHopPropertyAdviceAnswer(changedMapping)).toThrow(/Mapping du descripteur absent/);
    const fabricatedMaterial = structuredClone(answer);
    fabricatedMaterial.candidateAssessments[2].status = 'documented';
    expect(() => assertHopPropertyAdviceAnswer(fabricatedMaterial)).toThrow(/matière non chargée/);
  });

  it('permet une preuve lexicale de contrainte aromatique seulement sur famille et direction explicitement compatibles', () => {
    const answer = constraintAnswerFixture();
    expect(() => assertHopPropertyAdviceAnswer(answer)).not.toThrow();
    const intent = answer.requestSnapshot.propertyIntents.find(row => row.id === 'intent-avoid-resin')!;
    expect(intent).toMatchObject({ property: 'aroma', familyId: 'resin', role: 'constraint', direction: 'exclude' });
    const investigationWithProof = structuredClone(answer);
    const bio = investigationWithProof.requestSnapshot.propertyIntents.find(row => row.id === 'intent-bio-question')!;
    const assessment = investigationWithProof.candidateAssessments.find(row => row.materialId === 'hop-house')!;
    const evaluation = structuredClone(assessment.evaluations[0]);
    evaluation.intentId = bio.id;
    evaluation.partnerReference = null;
    assessment.evaluations.push(evaluation);
    expect(() => assertHopPropertyAdviceAnswer(investigationWithProof)).toThrow(/intention compatible/);
  });

  it('vérifie tous les effets de stratégie, la contribution explicite et la séparation des statuts', () => {
    const { answer } = answerFixture();
    expect(answer.strategies[0].contribution).toBe('option');
    expect(answer.strategies[0].effects.map(row => row.intentId)).toEqual(answer.requestSnapshot.propertyIntents.map(row => row.id));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.strategies[0].applicability.status).toBe('missingConditions');
    expect(answer.strategies[0].preparation.operational).toMatchObject({ status: 'notProvided', adapterId: null });
    const omittedEffect = structuredClone(answer);
    omittedEffect.strategies[0].effects.pop();
    expect(() => assertHopPropertyAdviceAnswer(omittedEffect)).toThrow(/Effets par intention/);
    const promoted = structuredClone(answer);
    (promoted.strategies[0].preparation.operational as any) = { status: 'ready', adapterId: 'adapter', reason: 'Essai.' };
    expect(() => assertHopPropertyAdviceAnswer(promoted)).toThrow(/ne peut promouvoir/);
    const unjustifiedCoverage = structuredClone(answer);
    unjustifiedCoverage.coverage.status = 'answered';
    unjustifiedCoverage.reference = hopPropertyAdviceAnswerReference(unjustifiedCoverage);
    expect(() => assertHopPropertyAdviceAnswer(unjustifiedCoverage)).toThrow(/answered malgré/);
  });

  it('ne compte pas une observation conservée comme couverture substantielle', () => {
    const answer = contextOnlyAnswerFixture();
    expect(() => assertHopPropertyAdviceAnswer(answer)).not.toThrow();
    expect(answer.coverage).toMatchObject({ status: 'outOfScope', points: [{ status: 'contextOnly' }] });
    const incorrectlyPromoted = structuredClone(answer);
    incorrectlyPromoted.coverage.points[0].status = 'answered';
    incorrectlyPromoted.coverage.status = 'answered';
    incorrectlyPromoted.reference = hopPropertyAdviceAnswerReference(incorrectlyPromoted);
    expect(() => assertHopPropertyAdviceAnswer(incorrectlyPromoted)).toThrow(/reste contextOnly/);
  });

  it('fige un dossier contre les références exactes et relit son DTO sans recalcul', () => {
    const { answer } = answerFixture();
    const strategy = answer.strategies[0];
    const dossier = createHopPropertyAdviceDossier({ id: 'property-dossier-1', answer,
      expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference,
      motive: 'Comparer une description florale avant tout protocole.', createdAt: '2026-10-03T10:30:00.000Z',
      createdBy: { origin: 'user', label: 'Brasseuse fixture' } });
    expect(dossier.answerSnapshot).toEqual(answer);
    expect(dossier.strategySnapshot).toEqual(strategy);
    expect(dossier.preparation).toEqual(strategy.preparation);
    expect(dossier.preparation.operational.status).toBe('notProvided');
    expect(readHopDocumentaryDossier(dossier)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: dossier });
    const immutableCopy = structuredClone(dossier);
    const originalAnswer = structuredClone(answer);
    answer.body[0].text = 'Réponse nouvelle; le dossier ne bouge pas.';
    expect(dossier).toEqual(immutableCopy);
    expect(readHopPropertyAdviceAnswer(JSON.parse(JSON.stringify(originalAnswer)))).toMatchObject({ status: 'readOnly', answer: originalAnswer });
    expect(() => createHopPropertyAdviceDossier({ id: 'stale-answer', answer: originalAnswer,
      expectedAnswerReference: 'stale', expectedInterpretationReference: immutableCopy.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference, motive: 'Motif', createdAt: '2026-10-03T10:30:00.000Z',
      createdBy: { origin: 'user', label: 'Brasseuse' } })).toThrow(/réponse a changé/);
    expect(() => createHopPropertyAdviceDossier({ id: 'stale-strategy', answer: originalAnswer,
      expectedAnswerReference: originalAnswer.reference, expectedInterpretationReference: originalAnswer.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: 'stale', motive: 'Motif', createdAt: '2026-10-03T10:30:00.000Z',
      createdBy: { origin: 'user', label: 'Brasseuse' } })).toThrow(/stratégie sélectionnée est absente ou périmée/);

    const read = readHopPropertyAdviceDossier(JSON.parse(JSON.stringify(dossier)));
    expect(read).toMatchObject({ status: 'readOnly' });
    if (read.status !== 'readOnly') return;
    assertHopPropertyAdviceDossier(read.dossier);
    const view = hopPropertyAdviceViewModel(read.dossier.answerSnapshot);
    expect(view.format).toBe('hop-documentary-answer-view-v2');
    expect(view.answerReference).toBe(dossier.answerReference);
    expect(view).not.toHaveProperty('reference');
    expect(view.candidateAssessments).toEqual(dossier.answerSnapshot.candidateAssessments);
    expect(view.strategies[0].contribution).toBe('option');
    expect(view.strategies[0].preparation.operational.status).toBe('notProvided');
    const futureNestedRequest = { ...originalAnswer,
      requestSnapshot: { ...originalAnswer.requestSnapshot, format: 'hop-documentary-request-v9' } };
    expect(readHopPropertyAdviceAnswer(futureNestedRequest)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureNestedRequest });
    const futureNestedCorpus = { ...originalAnswer,
      corpusSnapshot: { ...originalAnswer.corpusSnapshot, format: 'hop-documentary-corpus-v9' } };
    expect(readHopPropertyAdviceAnswer(futureNestedCorpus)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureNestedCorpus });
    const futureNestedAnswerDossier = { ...dossier,
      answerSnapshot: { ...dossier.answerSnapshot, format: 'hop-documentary-answer-v9' } };
    expect(readHopPropertyAdviceDossier(futureNestedAnswerDossier)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureNestedAnswerDossier });
  });

  it('relit les V1 via les lecteurs acquis et conserve les formats futurs bruts', () => {
    const legacy = legacyFixture();
    expect(readHopPropertyAdviceAnswer(JSON.parse(JSON.stringify(legacy.answer)))).toEqual({ status: 'legacyReadOnly', answer: legacy.answer });
    expect(readHopPropertyAdviceDossier(JSON.parse(JSON.stringify(legacy.dossier)))).toEqual({ status: 'legacyReadOnly', dossier: legacy.dossier });
    expect(readHopDocumentaryAnswer(legacy.answer)).toMatchObject({ status: 'readOnly', answer: legacy.answer });

    const futureAnswer = { ...legacy.answer, format: 'hop-documentary-answer-v9' };
    expect(readHopPropertyAdviceAnswer(futureAnswer)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureAnswer });
    const futureDossier = { ...legacy.dossier, format: 'hop-documentary-dossier-v9' };
    expect(readHopPropertyAdviceDossier(futureDossier)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureDossier });
  });

  it('conserve intactes en unsupportedReadOnly les answer/dossier V2 réellement écrites par API01', () => {
    const archive = actualOldV2MeasurementArchive();
    expect(archive.sourceBinarySha256).toMatch(/^[a-f0-9]{64}$/);
    expect(readHopPropertyAdviceAnswer(archive.answer)).toEqual({ status: 'unsupportedReadOnly', snapshot: archive.answer,
      reason: expect.stringMatching(/conservé sans interprétation/) });
    expect(readHopPropertyAdviceDossier(archive.dossier)).toEqual({ status: 'unsupportedReadOnly', snapshot: archive.dossier,
      reason: expect.stringMatching(/conservé sans interprétation/) });
  });

  it('refuse les altérations structurelles d’une ancienne answer même si sa mesure est désormais non qualifiable', () => {
    const archive = actualOldV2MeasurementArchive();
    const variants = [
      ['body', (answer: HopPropertyAdviceAnswer) => { answer.body[0].text += ' altéré'; }],
      ['inputReference', (answer: HopPropertyAdviceAnswer) => { answer.inputReference = 'foreign-reference'; }],
      ['effect', (answer: HopPropertyAdviceAnswer) => { answer.strategies[0].effects.pop(); }],
    ] as const;
    for (const [name, alter] of variants) {
      const altered = structuredClone(archive.answer);
      alter(altered);
      expect(() => readHopPropertyAdviceAnswer(altered), name).toThrow();
    }
  });

  it('refuse les altérations de liaison et d’empreinte d’un dossier V2 avec mesure non qualifiable', () => {
    const archive = actualOldV2MeasurementArchive();
    const variants = [
      ['answerReference', (dossier: HopPropertyAdviceDossier) => { dossier.answerReference = 'foreign-answer'; }],
      ['strategySnapshot', (dossier: HopPropertyAdviceDossier) => { dossier.strategySnapshot.title += ' altéré'; }],
      ['reference', (dossier: HopPropertyAdviceDossier) => { dossier.reference = 'altered-reference'; }],
    ] as const;
    for (const [name, alter] of variants) {
      const altered = structuredClone(archive.dossier);
      alter(altered);
      expect(() => readHopPropertyAdviceDossier(altered), name).toThrow();
    }
  });
});
