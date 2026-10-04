import { describe, it, expect, vi } from 'vitest';
import { runBrewerHarness, validateAdvice } from '../../functions/src/brewerHarness';
import {
  BREWER_HOP_ADVICE_PROFILE_ID,
  brewerHopAdviceHarnessOptions,
  createBrewerHopAdviceProfile,
  splitBrewerHopAdviceChatInput,
  validateBrewerChatInputWithHopAdvice,
  validateBrewerHopAdviceChatInput
} from '../../functions/src/brewerHopAdviceAdapter';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope,
  brewerAdviceFromHopProposal,
  createBrewerHopAdviceProposalEnvelope,
  qualifyBrewerHopAdviceEvidence,
  validateBrewerHopAdviceRequest,
  verifyBrewerHopAdviceEvidence,
  type BrewerHopAdviceEvidenceSource,
  type BrewerHopAdviceProposalEnvelope,
  type BrewerHopAdviceReaderAnnotation,
  type BrewerHopAdviceRequest
} from '../../functions/src/brewerHopAdviceProposal';
import type { BrewerCatalogueAccess } from '../../functions/src/brewerCatalogueTools';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { compareBrewerHopAdviceContextBindings, isBrewerHopAdviceContextLaunchClaim, projectBrewerHopAdviceContext } from '../../functions/src/brewerHopAdviceContextBinding';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';

const span = (question: string, text: string, occurrence = 1) => {
  let start = -1;
  for (let count = 0; count < occurrence; count++) start = question.indexOf(text, start + 1);
  if (start < 0) throw new Error(`Fixture : « ${text} » absent.`);
  return { start, end: start + text.length, text };
};
const reader = (question: string, id: string, text: string, fields: Partial<BrewerHopAdviceReaderAnnotation> = {}): BrewerHopAdviceReaderAnnotation => ({
  id, span: span(question, text), term: text, direction: 'none', requirement: 'optional', origin: 'parser', ...fields
});
const FIXTURE_SCOPE = { kind: 'recipe' as const, id: 'fixture-recipe' };
const fixtureBrewerContext = (): BrewerContext => {
  const fixtureRecipe = { ...recipe({ efficiencyPct: 75 }), id: FIXTURE_SCOPE.id } as ReturnType<typeof recipe> & { id: string };
  return {
    recipe: fixtureRecipe, journal: brewState(fixtureRecipe), now: Date.parse('2026-10-03T12:00:00.000Z'), phase: 'planning',
    provenance: ['Fixture locale.'], inventory: [], material: [], waterSources: [], editableTargets: [],
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment },
  };
};
const projectContext = (context: BrewerContext, scope: { kind: 'recipe'; id: string }) => {
  const prepared = prepareBrewingScenarioContext(context);
  const projected = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projected.status !== 'ready') throw new Error(`Fixture contexte invalide : ${projected.reason}`);
  return projected.projection;
};
const contextProjection = (scope: { kind: 'recipe'; id: string } = FIXTURE_SCOPE) => projectContext(fixtureBrewerContext(), scope);
const contextLaunch = (sourceReadingReference = 'reading:fixture-archive', scope = FIXTURE_SCOPE, expected = contextProjection(scope)) => ({
  format: 'brewer-hop-advice-context-launch-v1' as const,
  ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture', sourceReadingReference,
  source: { kind: 'recipe' as const, id: scope.id }, sourceRuntimeReference: 'source-runtime:fixture', scope: { ...scope }, expected,
});
const request = (question: string, readerAnnotations: BrewerHopAdviceReaderAnnotation[], launch = contextLaunch()): BrewerHopAdviceRequest =>
  validateBrewerHopAdviceRequest({ format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question,
    sourceReadingReference: launch.sourceReadingReference, contextLaunch: launch, readerAnnotations, readerScopes: [] }, question);
const launchForContext = (context: BrewerContext, sourceReadingReference = 'reading:fixture-archive') => {
  const scope = { kind: 'recipe' as const, id: context.recipe?.id ?? FIXTURE_SCOPE.id };
  return contextLaunch(sourceReadingReference, scope, projectContext(context, scope));
};
const requestForContext = (question: string, annotations: BrewerHopAdviceReaderAnnotation[], context: BrewerContext) =>
  request(question, annotations, launchForContext(context));
const envelope = (req: BrewerHopAdviceRequest, raw: unknown, evidence: BrewerHopAdviceEvidenceSource[] = [],
  readScenario?: (value: unknown) => { result: any }, binding = contextProjection()) => createBrewerHopAdviceProposalEnvelope({
  request: req, raw, evidence, readers: readScenario ? { readScenario } : {},
  serverContext: { phase: 'planning', provenance: ['Fixture locale ; aucune donnée de brasseur.'], loadedAt: 1, binding }
});

// R20, exact wording of the mandate.
const R20 = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
const r20Request = () => request(R20, [
  reader(R20, 'r-douce', 'douce', { dimension: 'other' }),
  reader(R20, 'r-compenser', 'compenser', { qualification: 'Demande de compensation.' }),
  reader(R20, 'r-amertume', 'amertume', { qualification: 'Aucune décision d’augmentation.' }),
  reader(R20, 'r-poire', 'poire', { direction: 'keep', requirement: 'required', familyId: 'pomeFruit' }),
  reader(R20, 'r-jardin', 'mon houblon de jardin', { dimension: 'documentation', qualification: 'Caractérisation matière demandée.' })
]);
const r20Answer = () => ({
  summary: 'Le houblon peut atténuer l’impression de douceur, surtout par l’amertume, sans retirer de sucre ; caractérise d’abord ton houblon de jardin et teste sur un verre.',
  readingNote: 'Tu décris une douceur perçue, tu veux savoir si le houblon peut la compenser sans avoir décidé d’augmenter l’amertume, tu gardes la poire et tu veux caractériser ton houblon.',
  options: [
    { id: 'assist-caracteriser', kind: 'characterization', title: 'Caractériser le houblon de jardin',
      rationale: 'Frotter des cônes secs puis goûter une infusion situe ses familles aromatiques avant de l’associer à la poire.',
      conditions: ['Cônes secs et bien conservés'], tradeoffs: ['Une infusion ne reproduit pas le comportement en bière'], related: ['r-jardin'] },
    { id: 'assist-essai-verre', kind: 'investigation', title: 'Essai de compensation sur un verre',
      rationale: 'Une infusion ajoutée à un échantillon montre si la douceur perçue recule et si la poire reste lisible, sans toucher au lot.',
      conditions: ['Bière accessible pour un prélèvement'], tradeoffs: ['L’infusion apporte aussi des notes végétales'], related: ['r-compenser', 'r-douce', 'r-poire'] },
    { id: 'assist-levier-amer', kind: 'intervention', title: 'Si tu choisis l’amertume : prochain brassin',
      rationale: 'L’amertume peut modifier la douceur perçue ; son estimation demande un alpha analysé ou une hypothèse de travail explicite.',
      conditions: ['Décision explicite d’augmenter l’amertume', 'Alpha analysé ou hypothèse de travail explicite'], tradeoffs: ['Ne protège pas la poire'], related: ['r-compenser', 'r-amertume'] }
  ],
  unknowns: [{ id: 'assist-stade', question: 'La bière est-elle déjà conditionnée, ou parles-tu du prochain brassin ?',
    changesChoice: 'Bière finie : essai sur verre ; prochain brassin : levier d’amertume ou d’arôme dans la recette.', related: [] }],
  program: { kind: 'none', note: 'Aucun programme ni dose calculés par les outils.' },
  refusals: [{ text: 'Le maintien de la poire n’est pas garanti : l’essai sur verre le vérifie.', related: ['r-poire'] }]
});
const r20Raw = (patch: Record<string, unknown> = {}, answer: Record<string, unknown> = {}) => ({
  materials: [{ id: 'assist-houblon-jardin', quote: { text: 'mon houblon de jardin' }, identity: 'personalUnidentified',
    note: 'Matière personnelle : identité, analyse et quantité inconnues.' }],
  ...patch, answer: { ...r20Answer(), ...answer }
});

describe('Lecture assistée : frontière de la requête complète', () => {
  const chat = (question: string, scope: BrewerHopAdviceRequest['contextLaunch']['scope'] = FIXTURE_SCOPE) => ({
    scope,
    operationId: 'fixture-assisted-request-01', question, editableTargets: []
  });

  it('conserve les espaces et Unicode exacts de la question assistée', () => {
    const question = '  Une bie\u0300re trop douce : que puis-je examiner ?  ';
    const hopAdvice = request(question, [reader(question, 'r-douce', 'douce')]);
    const validated = validateBrewerChatInputWithHopAdvice({ ...chat(question, hopAdvice.contextLaunch.scope), hopAdvice });
    expect(validated.question).toBe(question);
    expect(validated.hopAdvice?.question).toBe(question);
    expect(validated.hopAdvice?.readerAnnotations[0].span).toEqual(span(question, 'douce'));
  });

  it('refuse une question assistée normalisée différente de la question envoyée', () => {
    const question = 'Une bie\u0300re trop douce : que puis-je examiner ?';
    const hopAdvice = request(question, []);
    expect(() => validateBrewerChatInputWithHopAdvice({ ...chat(question, hopAdvice.contextLaunch.scope),
      hopAdvice: request(question.normalize('NFC'), []) })).toThrow(/texte exact/);
  });

  it('compte aussi le handoff assisté dans la limite de taille du payload', () => {
    expect(() => validateBrewerChatInputWithHopAdvice({ ...chat('Une question de fixture'),
      hopAdvice: { oversized: 'x'.repeat(100000) } })).toThrow('Contexte trop volumineux.');
  });

  it('exige le lancement v2, sa référence de lecture exacte et un binding serveur du même scope', () => {
    const launch = contextLaunch();
    const selfComparison = compareBrewerHopAdviceContextBindings(launch.expected, launch.expected);
    if (selfComparison.status !== 'matched') throw new Error(JSON.stringify(selfComparison));
    expect(isBrewerHopAdviceContextLaunchClaim(launch)).toBe(true);
    const req = r20Request();
    const withoutLaunch = structuredClone(req) as any;
    delete withoutLaunch.contextLaunch;
    expect(() => validateBrewerHopAdviceRequest(withoutLaunch)).toThrow(/Lancement de contexte absent/);
    const launchMismatch = structuredClone(req) as any;
    launchMismatch.contextLaunch.sourceReadingReference = 'reading:other';
    expect(() => validateBrewerHopAdviceRequest(launchMismatch)).toThrow(/diffère de celle scellée/);
    const readingMismatch = { ...req, sourceReadingReference: 'reading:other' };
    expect(() => validateBrewerHopAdviceRequest(readingMismatch)).toThrow(/diffère de celle scellée/);

    const env = envelope(req, r20Raw());
    const missingBinding = structuredClone(env) as any;
    delete missingBinding.serverContext.binding;
    expect(() => assertBrewerHopAdviceProposalEnvelope(missingBinding)).toThrow(/Liaison serveur de contexte absente/);
    const differentScope = structuredClone(env) as any;
    differentScope.serverContext.binding.scope.id = 'recipe:other';
    expect(() => assertBrewerHopAdviceProposalEnvelope(differentScope)).toThrow(/scope du contexte chargé côté serveur/);
  });

  it('conserve une dépendance pour chaque sortie du tour et relit aussi les outils non cités', () => {
    const evidence: BrewerHopAdviceEvidenceSource[] = [
      { id: 'E1', name: 'lookup_yeast_reference', label: 'Levures', data: { query: 'ale', rows: [] } },
      { id: 'E2', name: 'lookup_hop_reference', label: 'Houblons', data: { query: 'cascade', rows: [] } },
      { id: 'E3', name: 'compare_recipe_to_style', label: 'Comparaison', data: { status: 'unavailable', range: null } },
    ];
    const env = envelope(r20Request(), r20Raw(), evidence);
    expect(env.evidence.records).toEqual([]);
    expect(env.evidence.dependencies.map((entry) => [entry.evidenceId, entry.toolName])).toEqual([
      ['E1', 'lookup_yeast_reference'], ['E2', 'lookup_hop_reference'], ['E3', 'compare_recipe_to_style'],
    ]);
    expect(() => verifyBrewerHopAdviceEvidence(env, evidence)).not.toThrow();
    const unreferencedChanged = structuredClone(evidence);
    unreferencedChanged[1].data = { query: 'cascade', rows: [{ id: 'changed' }] };
    expect(() => verifyBrewerHopAdviceEvidence(env, unreferencedChanged)).toThrow(/dépendance d’outil du tour manque ou son contenu a changé/);
    const omitted = structuredClone(env) as any;
    omitted.evidence.dependencies.pop();
    expect(() => assertBrewerHopAdviceProposalEnvelope(omitted)).toThrow(/ne couvre pas chaque sortie d’outil reçue/);
    const badReference = structuredClone(env) as any;
    badReference.evidence.dependencies[0].contentReference = 'tool-content:unverified';
    expect(() => assertBrewerHopAdviceProposalEnvelope(badReference)).toThrow(/référence de contenu inconnue/);
  });

  it('garde la normalisation du compagnon ordinaire', () => {
    expect(validateBrewerChatInputWithHopAdvice(chat('  Une question de fixture  ')).question)
      .toBe('Une question de fixture');
  });
});

describe('Lecture assistée : contrat de proposition', () => {
  it('R20 : constat, compensation, garde et enquête restent distincts dans une proposition exploitable', () => {
    const env = envelope(r20Request(), r20Raw());
    expect(env.status).toBe('proposal');
    expect(env.proposal.answer.program).toEqual({ kind: 'none', note: 'Aucun programme ni dose calculés par les outils.', qualification: 'none', operational: 'notProvided' });
    expect(env.proposal.answer.options.map((option) => [option.kind, option.provenance])).toEqual([
      ['characterization', 'modelExplanation'], ['investigation', 'modelExplanation'], ['intervention', 'modelExplanation']]);
    expect(env.proposal.materials[0]).toMatchObject({ identity: 'personalUnidentified', candidates: [], span: span(R20, 'mon houblon de jardin') });
    expect(() => assertBrewerHopAdviceProposalEnvelope(JSON.parse(JSON.stringify(env)))).not.toThrow();
    expect(() => validateAdvice(brewerAdviceFromHopProposal(env.proposal), [])).not.toThrow();
  });

  it('une garde ne crée pas d’apport et ne devient pas une baisse', () => {
    const answer = r20Answer();
    answer.options[2] = { ...answer.options[2], related: ['r-poire'] };
    expect(() => envelope(r20Request(), r20Raw({}, { options: answer.options }))).toThrow(/garder n’est pas ajouter/);
    const revise = { readerReview: [{ annotationId: 'r-poire', verdict: 'revise', reason: 'Lecture alternative.', revision: {
      property: 'aroma', role: 'target', direction: 'decrease', required: true, basis: 'current', metric: 'sensory', subject: 'beer',
      subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Baisse.' } }] };
    expect(() => envelope(r20Request(), r20Raw(revise))).toThrow(/garde \(keep\)/);
  });

  it('un objectif sous négation est refusé, et une lecture locale qui l’a promu doit être revue', () => {
    const asTarget = { readerReview: [{ annotationId: 'r-amertume', verdict: 'revise', reason: 'Lecture alternative.', revision: {
      property: 'bitterness', role: 'target', direction: 'increase', required: true, basis: 'qualitativeTarget', metric: 'sensory',
      subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Plus amer.' } }] };
    expect(() => envelope(r20Request(), r20Raw(asTarget))).toThrow(/sous une négation/);

    // Integrator counter-example: the local reader promoted a bitter target and lost the investigation.
    const q = 'Je trouve ma bière trop douce. Comment envisager une compensation avec mon houblon de jardin, tout en conservant la poire ? Je ne choisis pas encore de renforcer l’amertume. Il faut d’abord caractériser ce houblon.';
    const faulty = request(q, [reader(q, 'r-douce', 'douce'), reader(q, 'r-poire', 'poire', { direction: 'keep', requirement: 'required' }),
      reader(q, 'r-amer', 'amertume', { direction: 'increase', requirement: 'required' })]);
    const answer = { summary: 'Avant de choisir un levier, caractérise ce houblon puis compare sur un verre ; renforcer l’amertume reste une option ouverte.',
      readingNote: 'Tu perçois une douceur, tu envisages une compensation, tu gardes la poire et tu n’as pas choisi de renforcer l’amertume.',
      options: [{ id: 'assist-caracteriser', kind: 'characterization', title: 'Caractériser ce houblon', rationale: 'Ses familles aromatiques décident de son effet sur la poire.', related: ['assist-caracterisation'] }],
      program: { kind: 'none', note: 'Aucun programme préparé.' } };
    expect(() => envelope(faulty, { answer })).toThrow(/sous une négation ; revise-la ou conteste-la/);
    const fixed = envelope(faulty, {
      readerReview: [{ annotationId: 'r-amer', verdict: 'revise', reason: 'Option ouverte, non décidée.', revision: {
        property: 'bitterness', role: 'investigation', direction: 'investigate', required: false, basis: 'none', metric: 'sensory',
        subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Renforcer l’amertume n’est pas encore choisi.' } }],
      annotations: [
        { id: 'assist-compensation', quotes: [{ text: 'compensation' }], property: 'sweetness', role: 'investigation', direction: 'investigate',
          required: true, basis: 'none', metric: 'sensory', subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer',
          related: ['r-douce'], compensates: ['r-douce'], reason: 'Compensation demandée du constat de douceur, sans levier choisi.' },
        { id: 'assist-caracterisation', quotes: [{ text: 'caractériser ce houblon' }], property: 'materialCharacter', role: 'investigation',
          direction: 'investigate', required: true, basis: 'none', metric: 'unspecified', subject: 'material', subjectLabel: 'ce houblon',
          sensoryContext: 'unspecified', reason: 'Caractérisation demandée avant tout choix.' }
      ], answer });
    expect(fixed.proposal.annotations.map((entry) => entry.id)).toEqual(['assist-compensation', 'assist-caracterisation']);
    expect(fixed.proposal.readerReview[0].revision).toMatchObject({ role: 'investigation', required: false });
  });

  it('négation familière ou détournée : refusée ; incertitude sur la méthode : objectif conservé', () => {
    const targetOn = (id: string, text: string) => ({ id, quotes: [{ text }], property: 'bitterness', role: 'target', direction: 'increase', required: true,
      basis: 'qualitativeTarget', metric: 'sensory', ...{ subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer' }, reason: 'Objectif lu.' });
    const answerFor = (related: string[]) => ({ summary: 'Le houblon peut apporter du nez sans toucher l’amertume, par des ajouts tardifs.',
      readingNote: 'Lecture de la demande.', options: [{ id: 'assist-nez', kind: 'investigation', title: 'Comparer des ajouts tardifs',
        rationale: 'Les ajouts tardifs portent surtout l’arôme.', related }], program: { kind: 'none', note: 'Aucun programme.' } });
    // Counter-example obtained from the Sonnet counter-reading: colloquial negation without « ne ».
    const colloquial = 'Ma saison manque de peps au nez. Je veux pas augmenter l\'amertume, mais je cherche ce que le houblon peut apporter à la place.';
    expect(() => envelope(request(colloquial, []), { annotations: [targetOn('assist-amer', 'amertume')], answer: answerFor(['assist-amer']) }))
      .toThrow(/sous une négation/);
    expect(() => envelope(request(colloquial, [reader(colloquial, 'r-amer', 'amertume', { direction: 'increase', requirement: 'required' })]),
      { answer: answerFor(['r-amer']) })).toThrow(/revise-la ou conteste-la/);
    const insteadOf = 'Plutôt que d’augmenter l’amertume, que peut apporter mon houblon au nez de ma saison ?';
    expect(() => envelope(request(insteadOf, []), { annotations: [targetOn('assist-amer', 'amertume')], answer: answerFor(['assist-amer']) }))
      .toThrow(/sous une négation/);
    const unsure = 'Je ne sais pas comment augmenter l’amertume de ma blonde.';
    expect(envelope(request(unsure, []), { annotations: [targetOn('assist-amer', 'amertume')], answer: answerFor(['assist-amer']) })
      .proposal.annotations[0].reading).toMatchObject({ role: 'target', direction: 'increase' });
    const hypothetical = 'Si j\'ajoute ce houblon en fin d’ébullition, ma saison deviendra trop fruitée.';
    expect(() => envelope(request(hypothetical, []), { annotations: [{ id: 'assist-fruite', quotes: [{ text: 'trop fruitée' }], property: 'aroma',
      role: 'reportedObservation', direction: 'none', required: false, basis: 'current', metric: 'sensory', subject: 'beer', subjectLabel: 'Ma saison',
      sensoryContext: 'beer', reason: 'Excès.' }], answer: answerFor(['assist-fruite']) })).toThrow(/hypothèse ou une question/);
  });

  it('Q02 : un risque hypothétique n’est pas un constat, un nom approximatif reste à confirmer', () => {
    const q = 'Ou dans ma stout si j\'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.';
    const req = request(q, [reader(q, 'r-resine', 'résineux', { direction: 'investigate', requirement: 'required', familyId: 'resin' })]);
    const answer = {
      summary: 'Amérisé en début d’ébullition, ce houblon pèse surtout sur l’amertume ; le côté résineux dépendra surtout des ajouts tardifs.',
      readingNote: 'Tu demandes si amériser ta stout avec ce houblon la rendrait trop ou pas assez résineuse, et quoi ajouter d’autre.',
      options: [{ id: 'assist-moment', kind: 'investigation', title: 'Vérifier le moment des ajouts',
        rationale: 'Le caractère résineux vient surtout des ajouts tardifs ; un ajout seulement amérisant en transmet peu.', related: ['assist-risque'] }],
      program: { kind: 'none', note: 'Aucun programme préparé.' } };
    const observed = { annotations: [{ id: 'assist-trop-resineux', quotes: [{ text: 'trop résineux' }], property: 'aroma', role: 'reportedObservation',
      direction: 'none', required: false, basis: 'current', metric: 'sensory', subject: 'beer', subjectLabel: 'Ma stout', sensoryContext: 'beer',
      reason: 'Excès constaté.' }], answer };
    expect(() => envelope(req, observed)).toThrow(/hypothèse ou une question/);
    const catalogue: BrewerHopAdviceEvidenceSource = { id: 'E1', name: 'lookup_brewing_catalogue', label: 'Catalogue', data: { truncated: false,
      records: [{ kind: 'hopVariety', id: 'hopsteiner-nug', revision: 1, fingerprint: 'f'.repeat(64), origin: 'bundled',
        record: { id: 'hopsteiner-nug', name: 'Nugget', aliases: [], form: 'unknown', descriptions: [], analysis: [] } }] } };
    const env = envelope(req, {
      readerReview: [{ annotationId: 'r-resine', verdict: 'consistent', reason: 'Risque conditionnel conservé.' }],
      openQuestions: [
        { id: 'assist-risque', kind: 'conditionalRisk', quotes: [{ text: 'trop résineux ou au contraire pas assez' }],
          restatement: 'Le houblon amérisant rendra-t-il la stout trop résineuse, ou pas assez ?', whyOpen: 'Moment, forme et quantité de l’ajout inconnus.', related: ['r-resine'] },
        { id: 'assist-autre', kind: 'alternativeAddition', quotes: [{ text: 'ajouter autre chose' }],
          restatement: 'Quel autre ajout pourrait accompagner ce caractère ?', whyOpen: 'La nature de l’ajout et l’effet voulu ne sont pas précisés.' }
      ],
      materials: [{ id: 'assist-nuget', quote: { text: 'nuget' }, identity: 'unconfirmed',
        candidates: [{ materialId: 'variety:hopsteiner-nug', evidenceId: 'E1' }], note: 'Nom approximatif : un candidat du catalogue, à confirmer.' }],
      answer
    }, [catalogue]);
    expect(env.proposal.materials[0].candidates).toEqual([{ materialId: 'variety:hopsteiner-nug', evidenceId: 'E1' }]);
    expect(env.evidence.records).toEqual([expect.objectContaining({ id: 'E1', kind: 'hopIdentity', truncated: false,
      identities: [expect.objectContaining({ materialId: 'variety:hopsteiner-nug', level: 'catalogueRecord', revision: 1 })] })]);
    expect(env.proposal.openQuestions.map((entry) => entry.kind)).toEqual(['conditionalRisk', 'alternativeAddition']);
  });

  it('P01 : une citation d’outil ne qualifie ni un chiffre ni un calcul', () => {
    const yeast: BrewerHopAdviceEvidenceSource = { id: 'E1', name: 'lookup_yeast_reference', label: 'Levures', data: { yeasts: [], totalMatches: 0 } };
    const answer = r20Answer();
    const dose = { ...answer.options[2], rationale: 'Ajouter 500 g en fin d’ébullition compensera la douceur.', evidenceIds: ['E1'] };
    expect(() => envelope(r20Request(), r20Raw({}, { options: [answer.options[0], dose] }), [yeast])).toThrow(/« 500 g » est un chiffre écrit par le modèle/);
    const cited = envelope(r20Request(), r20Raw({}, { options: [{ ...answer.options[0], evidenceIds: ['E1'] }] }), [yeast]);
    expect(cited.proposal.answer.options[0].provenance).toBe('documentaryReference');
    expect(() => envelope(r20Request(), r20Raw({}, { options: [{ ...answer.options[0], computed: { evidenceId: 'E1' } }] }), [yeast]))
      .toThrow(/computed exige une branche de scénario ou un sélecteur de contribution/);
  });

  it('R01 : scelle toute l’évidence froide d’un vrai runBrewerTool, pas seulement son champ data', () => {
    const cold = runBrewerTool('cold_contact_bitterness_reference', { doseGL: 3.86 }, {} as Parameters<typeof runBrewerTool>[2]);
    expect(cold.name).toBe('cold_contact_bitterness_reference');
    expect((cold.data as any).reference).toBe('cold-hop-bu-reference-result-v1:sha256:f567e077158022452997ad263b7f4a2150c6f1972bd0a485abde85e119d5a1a7');
    expect((cold.data as any).valueBU).toBe(21);
    const evidence = { ...cold, id: 'E-cold', model: 'fixture-model-metadata', products: [{ name: 'Produit fixture', supplier: 'Fournisseur fixture',
      url: 'https://example.invalid/item', availability: 'unknown' as const, availabilityText: 'Non vérifiée', checkedAt: 1 }] } as unknown as BrewerHopAdviceEvidenceSource;
    const sealed = envelope(r20Request(), r20Raw(), [evidence]);
    expect(sealed.format).toBe('brewer-hop-advice-proposal-v4');
    expect(sealed.evidence.records).toEqual([]);
    expect(sealed.evidence.dependencies).toHaveLength(1);
    expect(sealed.evidence.dependencies[0]).toMatchObject({ evidenceId: 'E-cold', toolName: cold.name,
      contentReference: expect.stringMatching(/^brewer-hop-advice-tool-evidence-v2:sha256:[0-9a-f]{64}$/) });
    const roundTrip = JSON.parse(JSON.stringify(sealed));
    expect(() => assertBrewerHopAdviceProposalEnvelope(roundTrip)).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(roundTrip, [evidence])).not.toThrow();

    const mutations: Array<{ field: string; mutate: (value: any) => void; synchronizeToolLabel?: boolean }> = [
      { field: 'facts', mutate: (value) => { value.facts[0] = '99 IBU garantis.'; } },
      { field: 'limits', mutate: (value) => { value.limits.splice(0, value.limits.length); } },
      { field: 'source', mutate: (value) => { value.sources[0].url = 'https://example.invalid/source'; } },
      { field: 'label', mutate: (value) => { value.label = 'Autre libellé'; }, synchronizeToolLabel: true },
      { field: 'products', mutate: (value) => { value.products[0].url = 'https://example.invalid/other-product'; } },
      { field: 'model', mutate: (value) => { value.model = 'autre-modele'; } },
      { field: 'data', mutate: (value) => { value.data.valueBU = 99; } },
    ];
    for (const mutation of mutations) {
      const changedEvidence = structuredClone(evidence) as any;
      mutation.mutate(changedEvidence);
      const changedEnvelope = structuredClone(roundTrip) as any;
      if (mutation.synchronizeToolLabel) changedEnvelope.evidence.tools[0].label = changedEvidence.label;
      expect(() => verifyBrewerHopAdviceEvidence(changedEnvelope, [changedEvidence]), mutation.field)
        .toThrow(/dépendance|contenu|tour/i);
    }
  });

  it('P02 : le nom d’outil ne fait pas un programme ; seule la branche exacte est qualifiée, jamais appliquée', () => {
    const prediction: BrewerHopAdviceEvidenceSource = { id: 'E1', name: 'predict_hop_aroma', label: 'Houblon × levure × timing', data: [{
      triplet: { varietyId: 'variety:x', lotId: null, yeastId: 'yeast:x', timing: 'boil', doseGL: 1, temperatureC: null, contactHours: null, matrixId: null },
      profile: { citrus: { range: null, confidence: 'low', sources: [], reasons: ['Inconnue.'] } }, compounds: {},
      score: { range: null, confidence: 'low', sources: [], reasons: ['Inconnue.'] }, risks: [], modelRefs: [], reasons: [],
    }] };
    const prepared: BrewerHopAdviceEvidenceSource = { id: 'E2', name: 'prepare_brewing_scenario', label: 'Scénario prêt à comparer', data: { request: null } };
    const branch = (id: string, applicability: string, proposalBase?: string) => ({ id, label: id, reference: `ref-${id}`, applicability, limitations: ['Plage conditionnelle.'],
      ...(proposalBase ? { programProposal: { baseline: proposalBase, applicability: 'available', changes: [{ kind: 'append' }] } } : {}) });
    const simulation: BrewerHopAdviceEvidenceSource = { id: 'E3', name: 'simulate_brewing_scenarios', label: 'Scénarios calculés', data: { result: {
      scenarioId: 'scenario-1', revision: 1, reference: 'result-1', status: 'quantified',
      requestSnapshot: { baseline: { kind: 'recipe', programReference: 'program-current' } },
      baseline: branch('baseline', 'available'),
      branches: [branch('b-hypo', 'hypotheticalOnly', 'program-current'), branch('b-other', 'available', 'program-other'),
        branch('b-ok', 'conditional', 'program-current'), branch('b-plain', 'available')], limitations: [] } } };
    const evidence = [prediction, prepared, simulation];
    const readScenario = (value: unknown) => value as { result: any };
    const program = (value: Record<string, unknown>) => envelope(r20Request(), r20Raw({}, { program: value }), evidence, readScenario).proposal.answer.program;
    expect(() => program({ kind: 'scenarioBranch', evidenceId: 'E1', branchId: 'x', note: 'Prédiction.' })).toThrow(/ne prépare pas de programme/);
    expect(() => program({ kind: 'preparedRequest', evidenceId: 'E2', note: 'Requête.' })).toThrow(/request non nulle/);
    expect(() => program({ kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-absente', note: 'Absente.' })).toThrow(/absente du résultat/);
    expect(program({ kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-hypo', note: 'Comparaison.' }).qualification).toBe('computedResult');
    expect(program({ kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-other', note: 'Autre base.' }).qualification).toBe('computedResult');
    expect(program({ kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-plain', note: 'Résultat.' }).qualification).toBe('computedResult');
    expect(program({ kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-ok', note: 'Aperçu.' })).toMatchObject({ qualification: 'programPreview', operational: 'notProvided' });
    const env = envelope(r20Request(), r20Raw({}, { options: [{ ...r20Answer().options[0],
      computed: { evidenceId: 'E1', predictionSelection: { kind: 'alternative', index: 0 } } }],
      program: { kind: 'scenarioBranch', evidenceId: 'E3', branchId: 'b-ok', note: 'Aperçu.' } }), evidence, readScenario);
    expect(env.proposal.answer.options[0].provenance).toBe('toolComputed');
    expect(env.evidence.records.find((record) => record.id === 'E1')).toMatchObject({ kind: 'prediction', snapshot: { form: 'independentAlternatives' } });
    expect(env.evidence.records.find((record) => record.id === 'E3')).toMatchObject({ kind: 'scenarioResult', baselineProgramReference: 'program-current' });
    const tampered = structuredClone(env) as any;
    tampered.proposal.answer.program.qualification = 'programPreview';
    tampered.proposal.answer.program.branchId = 'b-hypo';
    expect(() => assertBrewerHopAdviceProposalEnvelope(tampered)).toThrow(/qualification différente/);
    expect(qualifyBrewerHopAdviceEvidence(simulation)).toMatchObject({ kind: 'reference' });
  });

  it('P03 : une identité vient d’un chemin structuré, jamais d’un texte libre ni d’une levure, et se relit exactement', () => {
    const q = 'Le zephyr irait-il avec la poire de ma bière ?';
    const raw = (evidenceId: string, materialId: string) => ({ materials: [{ id: 'assist-matiere', quote: { text: 'zephyr' },
      identity: 'unconfirmed', candidates: [{ materialId, evidenceId }], note: 'Candidat à confirmer.' }],
      answer: { summary: 'La fiche du houblon nommé dira s’il porte des notes compatibles avec la poire.', readingNote: 'Tu demandes si ce houblon irait avec la poire.',
        options: [{ id: 'assist-fiche', kind: 'characterization', title: 'Lire la fiche du candidat', rationale: 'Ses descripteurs documentés situent ses familles aromatiques.',
          related: ['assist-matiere'] }], program: { kind: 'none', note: 'Aucun programme.' } } });
    const freeText: BrewerHopAdviceEvidenceSource = { id: 'E1', name: 'lookup_brewing_catalogue', label: 'Catalogue', data: { records: [], truncated: false, facts: ['zephyr-1'] } };
    const yeast: BrewerHopAdviceEvidenceSource = { id: 'E2', name: 'lookup_yeast_reference', label: 'Levures', data: { yeasts: [{ id: 'zephyr-1', kind: 'yeast' }], totalMatches: 1 } };
    const hops: BrewerHopAdviceEvidenceSource = { id: 'E3', name: 'lookup_hop_reference', label: 'Références', data: { totalMatches: 14, totalLots: 1,
      varieties: [{ id: 'zephyr-1', name: 'Zephyr', aliases: [], form: 'unknown', descriptions: [], analysis: [] }],
      lots: [{ id: 'lot-z', varietyId: 'zephyr-1', name: 'Zephyr 2025', form: 'cone', analysis: [] }] } };
    const build = (evidenceId: string, materialId = 'variety:zephyr-1') => envelope(request(q, []), raw(evidenceId, materialId), [freeText, yeast, hops]);
    expect(() => build('E1')).toThrow(/identité houblon retournée structurellement/);
    expect(() => build('E2')).toThrow(/identité houblon retournée structurellement/);
    // A garden hop never receives a catalogue identity because some lookup returned one.
    expect(() => envelope(r20Request(), r20Raw({ materials: [{ id: 'assist-matiere', quote: { text: 'mon houblon de jardin' }, identity: 'unconfirmed',
      candidates: [{ materialId: 'variety:zephyr-1', evidenceId: 'E3' }], note: 'Candidat.' }] }), [hops])).toThrow(/ne nomme pas Zephyr/);
    const env = build('E3', 'lot:lot-z');
    const record = env.evidence.records[0];
    expect(record).toMatchObject({ kind: 'hopIdentity', truncated: true });
    expect(record.kind === 'hopIdentity' && record.identities.map((identity) => identity.materialId)).toEqual(['variety:zephyr-1', 'lot:lot-z']);
    const ghost = structuredClone(env) as BrewerHopAdviceProposalEnvelope;
    ghost.proposal.materials[0].candidates[0].materialId = 'variety:ghost-9';
    expect(() => assertBrewerHopAdviceProposalEnvelope(ghost)).toThrow(/identité houblon retournée structurellement/);
    const forged = structuredClone(ghost) as any;
    forged.evidence.records[0].identities.push({ materialId: 'variety:ghost-9', name: 'Zephyr bis', level: 'indexRecord' });
    expect(() => assertBrewerHopAdviceProposalEnvelope(forged)).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(forged, [freeText, yeast, hops])).toThrow(/ne correspond plus au résultat d’outil exact/);
    expect(() => verifyBrewerHopAdviceEvidence(env, [freeText, yeast, hops])).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(env, [freeText, yeast])).toThrow(/liste des outils du tour diffère|dépendance d’outil du tour manque/);
  });

  it('refuse fragments inconnus, acteurs inventés, adoption et entrée périmée', () => {
    expect(() => envelope(r20Request(), r20Raw({ annotations: [{ id: 'assist-x', quotes: [{ text: 'trop sucrée' }], property: 'sweetness', role: 'reportedObservation',
      direction: 'none', required: false, basis: 'current', metric: 'sensory', subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Constat.' }] })))
      .toThrow(/absent de la question exacte/);
    const repeated = 'Je veux du houblon frais, du houblon floral.';
    expect(() => envelope(request(repeated, []), { annotations: [{ id: 'assist-h', quotes: [{ text: 'houblon' }], property: 'aroma', role: 'preference',
      direction: 'none', required: false, basis: 'none', metric: 'sensory', subject: 'beer', subjectLabel: 'Bière', sensoryContext: 'beer', reason: 'Souhait.' }],
      answer: { ...r20Answer(), options: [{ ...r20Answer().options[0], related: ['assist-h'] }], unknowns: [], refusals: [] } })).toThrow(/apparaît 2 fois/);
    expect(() => envelope(r20Request(), r20Raw({ readerReview: [{ annotationId: 'r-douce', verdict: 'consistent', reason: 'Ok.', actor: 'user' }] })))
      .toThrow(/champ non pris en charge/);
    expect(() => envelope(r20Request(), r20Raw({ readerReview: [{ annotationId: 'r-inconnue', verdict: 'consistent', reason: 'Ok.' }] })))
      .toThrow(/annotation locale inconnue/);
    const env = envelope(r20Request(), r20Raw());
    expect(() => assertBrewerHopAdviceProposalEnvelope({ ...structuredClone(env), status: 'adopted' })).toThrow(/reste une proposition/);
    const shifted = structuredClone(env) as any;
    shifted.proposal.materials[0].span.start += 1;
    expect(() => assertBrewerHopAdviceProposalEnvelope(shifted)).toThrow(/fragment différent/);
    const base = r20Request();
    expect(() => validateBrewerHopAdviceChatInput(base, { question: `${R20} `, editableTargets: [] })).toThrow(/texte exact/);
    expect(() => validateBrewerHopAdviceChatInput(base, { question: R20, editableTargets: ['recipe'] })).toThrow(/editableTargets/);
    const plain = { scope: { kind: 'recipe', id: 'R' }, operationId: 'operation-123456789', question: 'Q' };
    expect(splitBrewerHopAdviceChatInput(plain).chatInput).toBe(plain);
    expect(splitBrewerHopAdviceChatInput({ ...plain, hopAdvice: base })).toEqual({ chatInput: plain, hopAdvice: base });
  });

  it('un vrai objectif positif reste distinct du maintien', () => {
    const q = 'Ma blonde paraît fade ; je voudrais plus d’agrumes mais garder l’amertume actuelle. Lequel de mes houblons ?';
    const req = request(q, [reader(q, 'r-agrumes', 'agrumes', { direction: 'increase', requirement: 'required', familyId: 'citrus' }),
      reader(q, 'r-amertume', 'amertume', { direction: 'keep', requirement: 'required' })]);
    const option = (related: string[]) => ({ id: 'assist-tardif', kind: 'intervention', title: 'Ajout tardif d’un houblon agrumes',
      rationale: 'Un ajout de fin d’ébullition ou à cru apporte surtout l’arôme et peu d’amertume.', conditions: ['Houblon agrumes disponible'], related });
    const answer = (related: string[]) => ({ summary: 'Des agrumes viendront surtout d’ajouts tardifs, qui touchent peu l’amertume actuelle.',
      readingNote: 'Tu veux plus d’agrumes tout en gardant l’amertume.', options: [option(related)], program: { kind: 'none', note: 'Aucun programme.' } });
    expect(envelope(req, { answer: answer(['r-agrumes', 'r-amertume']) }).proposal.answer.options[0].kind).toBe('intervention');
    expect(() => envelope(req, { answer: answer(['r-amertume']) })).toThrow(/garder n’est pas ajouter/);
  });
});

const harnessContext = (): BrewerContext => fixtureBrewerContext();
const toolCalls = (...calls: Array<[string, unknown]>) => ({ candidates: [{ content: { role: 'model', parts: calls.map(([name, args]) => ({ functionCall: { name, args } })) } }] });
const approved = () => ({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] });
const scripted = (steps: unknown[]) => {
  let index = 0;
  return vi.fn(async (_model: string, body: any) => body.generationConfig?.responseMimeType === 'application/json' ? approved() : steps[index++]);
};
const catalogueRecord = { kind: 'hopVariety', id: 'hopsteiner-nug', revision: 1, fingerprint: 'f'.repeat(64), origin: 'bundled',
  record: { id: 'hopsteiner-nug', name: 'Nugget', aliases: [], form: 'unknown', descriptions: [], analysis: [] } };
const providers = () => {
  const catalogue = { readReceipts: vi.fn().mockResolvedValue([]), lookup: vi.fn().mockResolvedValue({ records: [catalogueRecord], truncated: false }),
    write: vi.fn().mockResolvedValue({ status: 'applied', kind: 'hopVariety', id: 'hop-x', record: { id: 'hop-x', name: 'X' }, revision: 1, fingerprint: 'x',
      receipt: { operationId: 'op', kind: 'hopVariety', targetId: 'hop-x' } }) };
  const scenarios = { read: vi.fn(), write: vi.fn() };
  return { catalogue: catalogue as unknown as BrewerCatalogueAccess & typeof catalogue, scenarios };
};
const Q02 = 'Ou dans ma stout si j\'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.';
const q02Request = () => request(Q02, [reader(Q02, 'r-resine', 'résineux', { direction: 'investigate', requirement: 'required', familyId: 'resin' })]);
const q02RequestForContext = (context: BrewerContext) => requestForContext(Q02,
  [reader(Q02, 'r-resine', 'résineux', { direction: 'investigate', requirement: 'required', familyId: 'resin' })], context);
const q02Final = {
  readerReview: [{ annotationId: 'r-resine', verdict: 'consistent', reason: 'Risque conditionnel conservé.' }],
  openQuestions: [{ id: 'assist-autre', kind: 'alternativeAddition', quotes: [{ text: 'ajouter autre chose' }],
    restatement: 'Quel autre ajout pourrait accompagner ce caractère ?', whyOpen: 'La nature de l’ajout et l’effet voulu ne sont pas précisés.' }],
  materials: [{ id: 'assist-nuget', quote: { text: 'nuget' }, identity: 'unconfirmed', candidates: [{ materialId: 'variety:hopsteiner-nug', evidenceId: 'E1' }],
    note: 'Nom approximatif : un candidat du catalogue, à confirmer.' }],
  answer: { summary: 'Amérisé en début d’ébullition, ce houblon pèse surtout sur l’amertume ; le côté résineux dépendra des ajouts tardifs.',
    readingNote: 'Tu demandes si amériser ta stout avec ce houblon la rendrait trop ou pas assez résineuse, et quoi ajouter.',
    options: [{ id: 'assist-complement', kind: 'alternative', title: 'Choisir un complément par effet', rationale: 'Un complément se choisit selon ce que tu veux soutenir dans le torréfié.',
      conditions: ['Effet voulu précisé'], related: ['assist-autre'] }],
    unknowns: [{ id: 'assist-ajouts', question: 'Ajoutes-tu ce houblon seulement en début d’ébullition ?', changesChoice: 'Un ajout tardif ferait du résineux le vrai sujet.' }],
    program: { kind: 'none', note: 'Aucun programme préparé.' } }
};

describe('Lecture assistée : profil borné du harness existant', () => {
  it('ne déclare ni n’exécute aucun écrivain, même si les providers mutatifs sont injectés', async () => {
    const { catalogue, scenarios } = providers();
    const context = harnessContext();
    const request = q02RequestForContext(context);
    const profile = createBrewerHopAdviceProfile(request, context, request.contextLaunch.scope);
    const generate = scripted([
      toolCalls(['create_brewing_catalogue_entry', { commandJson: '{"operation":"create"}' }], ['save_brewing_scenario', { evidenceId: 'E0', operationId: 'op', expectedRevision: 0 }],
        ['propose_changes', { target: 'recipe', title: 'X', changes: [] }], ['find_brewing_suppliers', { query: 'Nugget Suisse' }], ['finish_advice', {}],
        ['lookup_brewing_catalogue', { kind: 'hopVariety', query: 'nuget' }]),
      toolCalls(['finish_hop_advice_proposal', q02Final])
    ]);
    // Raw providers on purpose: the harness gate alone must stop the dispatch.
    const result = await runBrewerHarness(context, Q02, [], generate, { mode: 'fast', profile, catalogue, scenarios: scenarios as any });
    expect(catalogue.write).not.toHaveBeenCalled();
    expect(scenarios.write).not.toHaveBeenCalled();
    expect(catalogue.lookup).toHaveBeenCalledTimes(1);
    const refused = result.trace.filter((entry) => entry.error).map((entry) => entry.name);
    expect(refused).toEqual(['create_brewing_catalogue_entry', 'save_brewing_scenario', 'propose_changes', 'find_brewing_suppliers', 'finish_advice']);
    expect(result.trace.filter((entry) => entry.error).every((entry) => /indisponible dans ce mode de proposition/.test(entry.error!))).toBe(true);
    const declared = (generate.mock.calls[0][1] as any).tools[0].functionDeclarations.map((tool: any) => tool.name);
    expect(declared).toContain('finish_hop_advice_proposal');
    expect(declared).toContain('lookup_brewing_catalogue');
    for (const name of ['create_brewing_catalogue_entry', 'enrich_brewing_catalogue_entry', 'save_brewing_scenario', 'observe_brewing_scenario',
      'prefer_brewing_scenario_branch', 'propose_changes', 'finish_advice', 'find_brewing_suppliers', 'lookup_brewing_reference']) expect(declared).not.toContain(name);
    expect(result.profileResult?.id).toBe(BREWER_HOP_ADVICE_PROFILE_ID);
    const env = result.profileResult!.payload as BrewerHopAdviceProposalEnvelope;
    expect(() => assertBrewerHopAdviceProposalEnvelope(env)).not.toThrow();
    expect(env.status).toBe('proposal');
    expect(env.serverContext).toMatchObject({ phase: 'planning', provenance: ['Fixture locale.'], loadedAt: Date.parse('2026-10-03T12:00:00.000Z'),
      binding: request.contextLaunch.expected });
    expect(result.advice.summary).toBe(q02Final.answer.summary);
    expect(result.advice.evidenceIds).toEqual(['E1']);
    expect('proposal' in result).toBe(false);
    expect(() => verifyBrewerHopAdviceEvidence(env, result.evidence)).not.toThrow();
  });

  it('le raccord worker donne un catalogue en lecture seule et aucun dépôt de scénario', async () => {
    const { catalogue } = providers();
    const context = harnessContext();
    const request = q02RequestForContext(context);
    const options = brewerHopAdviceHarnessOptions(request, context, { scope: request.contextLaunch.scope, catalogue });
    expect(Object.keys(options).sort()).toEqual(['catalogue', 'profile']);
    await expect(options.catalogue!.write({} as any)).rejects.toThrow(/n’écrit pas/);
    await options.catalogue!.lookup({ kind: 'hopVariety', query: 'nuget' });
    expect(catalogue.lookup).toHaveBeenCalledTimes(1);
    expect(catalogue.write).not.toHaveBeenCalled();
    await expect(runBrewerHarness({ ...harnessContext(), editableTargets: ['recipe'] }, Q02, [], scripted([]), options)).rejects.toThrow(/aucune modification de champs/);
  });

  it('scelle et relit aussi un inspect_brewery reçu mais non cité par le modèle', async () => {
    const context = harnessContext();
    const request = q02RequestForContext(context);
    const profile = createBrewerHopAdviceProfile(request, context, request.contextLaunch.scope);
    const answer = structuredClone(q02Final);
    answer.materials = [];
    const generate = scripted([
      toolCalls(['inspect_brewery', { section: 'recipe' }]),
      toolCalls(['finish_hop_advice_proposal', answer]),
    ]);
    const result = await runBrewerHarness(context, Q02, [], generate, { mode: 'fast', profile });
    const envelope = result.profileResult!.payload as BrewerHopAdviceProposalEnvelope;
    const inspected = result.evidence.find((entry) => entry.name === 'inspect_brewery');
    expect(inspected).toBeDefined();
    expect(envelope.evidence.dependencies.map((entry) => entry.evidenceId)).toContain(inspected!.id);
    expect(envelope.evidence.records.map((entry) => entry.id)).not.toContain(inspected!.id);
    expect(() => verifyBrewerHopAdviceEvidence(envelope, result.evidence)).not.toThrow();

    const mutated = structuredClone(result.evidence);
    const rawInspect = mutated.find((entry) => entry.id === inspected!.id)!;
    (rawInspect.data as any).recipe.name = 'Autre recette';
    expect(() => verifyBrewerHopAdviceEvidence(envelope, mutated)).toThrow(/dépendance d’outil du tour manque ou son contenu a changé/);
    expect(() => verifyBrewerHopAdviceEvidence(envelope, result.evidence.filter((entry) => entry.id !== inspected!.id)))
      .toThrow(/liste des outils du tour diffère|dépendance d’outil du tour manque/);
  });

  it('fige les limites de inspect_brewery avant le chargement lazy d’un index tronqué', async () => {
    const context = harnessContext();
    const request = q02RequestForContext(context);
    const profile = createBrewerHopAdviceProfile(request, context, request.contextLaunch.scope);
    const truncated = 'Index fixture tronqué : connaissances aromatiques.';
    const loadHopIndex = vi.fn(async () => ({ varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [truncated] } as NonNullable<BrewerContext['hopIndex']>));
    const answer = structuredClone(q02Final);
    answer.materials = [];
    const steps = [
      toolCalls(['inspect_brewery', { section: 'recipe' }]),
      toolCalls(['lookup_hop_reference', { query: 'Nugget' }]),
      toolCalls(['finish_hop_advice_proposal', answer]),
    ];
    let step = 0;
    let inspectLimitsAtNextGenerate: string[] | undefined;
    const generate = vi.fn(async (_model: string, body: any) => {
      if (body.generationConfig?.responseMimeType === 'application/json') return approved();
      if (step === 1) {
        const inspect = body.contents.flatMap((message: any) => message.parts ?? [])
          .map((part: any) => part.functionResponse)
          .find((response: any) => response?.name === 'inspect_brewery')?.response;
        expect(inspect).toBeDefined();
        inspectLimitsAtNextGenerate = structuredClone(inspect.limits);
      }
      return steps[step++];
    });

    const result = await runBrewerHarness(context, Q02, [], generate, { mode: 'fast', profile, loadHopIndex });
    const inspected = result.evidence.find((entry) => entry.name === 'inspect_brewery');
    expect(inspected).toBeDefined();
    expect(inspectLimitsAtNextGenerate).toEqual(['Fixture locale.']);
    expect(loadHopIndex).toHaveBeenCalledTimes(1);
    expect(context.provenance).toContain(`Index houblon partiel : ${truncated}.`);
    expect(inspected!.limits).toEqual(inspectLimitsAtNextGenerate);
    expect(inspected!.limits).not.toContain(`Index houblon partiel : ${truncated}.`);
    expect(result.reviewed).toBe(true);
    const envelope = result.profileResult!.payload as BrewerHopAdviceProposalEnvelope;
    expect(() => assertBrewerHopAdviceProposalEnvelope(envelope)).not.toThrow();
    expect(() => verifyBrewerHopAdviceEvidence(envelope, result.evidence)).not.toThrow();
  });

  it('préserve le compagnon ordinaire hors de ce mode', async () => {
    const { catalogue } = providers();
    const generate = scripted([
      toolCalls(['create_brewing_catalogue_entry', { commandJson: JSON.stringify({ operation: 'create', operationId: 'op' }) }]),
      toolCalls(['finish_advice', { level: 'info', summary: 'Entrée créée.', action: 'Relis la fiche.', why: 'Reçu présent.', watch: 'Le reçu.', question: '', evidenceIds: ['E1'] }])
    ]);
    const result = await runBrewerHarness(harnessContext(), 'Crée cette variété au catalogue.', [], generate, { mode: 'fast', catalogue });
    expect(catalogue.write).toHaveBeenCalledTimes(1);
    const declared = (generate.mock.calls[0][1] as any).tools[0].functionDeclarations.map((tool: any) => tool.name);
    expect(declared).toContain('create_brewing_catalogue_entry');
    expect(declared).toContain('finish_advice');
    expect(declared).not.toContain('finish_hop_advice_proposal');
    expect('profileResult' in result).toBe(false);
    expect(result.trace[0]).toMatchObject({ name: 'create_brewing_catalogue_entry', resultId: 'E1' });
  });
});
