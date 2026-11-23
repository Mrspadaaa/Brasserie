import { describe, expect, it } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { buildHopV55PropertyAdviceRequestContext } from '../../src/services/hopV55/propertyAdvicePreparation';
import {
  createHopV55DecisionReadingArchiveV2,
  readHopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55Question, readHopV55QuestionActDiagnosticV1 } from '../../src/services/hopV55/decision';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';

const ownerKey = 'owner:r21-modality-fixture';
const workspaceId = 'workspace:r21-modality-fixture';
const candidatePolicy = {
  kind: 'explicit' as const,
  materialIds: [],
  basis: 'Aucune matière candidate n’est choisie dans cette fixture de lecture.',
};

const R21_VARIATION = 'Je trouve ma bière trop douce. Comment envisager une compensation avec mon houblon de jardin, tout en conservant la poire ? Je ne choisis pas encore de renforcer l’amertume. Il faut d’abord caractériser ce houblon.';

interface PreparedPath {
  question: string;
  id: string;
  prepared: ReturnType<typeof prepareBrewingScenarioContext>;
  reading: ReturnType<typeof readHopV55Question>;
  readingReference: string;
  draft: ReturnType<typeof prepareHopV55PropertyAdviceRequestDraftV3>;
  answer: ReturnType<typeof buildHopPropertyAdviceV3>;
}

/** The same local, isolated fixture path used by Source25: current reader → sealed reading → V3 preparation → real domain builder. */
function preparePath(question: string, id: string): PreparedPath {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const preparedBefore = structuredClone(prepared);
  const reading = readHopV55Question(question, prepared);
  const archive = createHopV55DecisionReadingArchiveV2({
    id: `reading:${id}`,
    ownerKey,
    workspaceId,
    recordedAt: '2026-10-03T20:00:00.000Z',
    reading,
    source: { kind: 'exploration' },
    runtimeReference: `runtime:${id}`,
  });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available') throw new Error(`La lecture scellée n’a pas été relue : ${reread.status}.`);
  // The historical mapper only accepts the strict V2 archive it was written for; no other format is cast into it.
  if (reread.archive.format !== 'hop-v55-decision-reading-v2') throw new Error(`Format relu inattendu : ${reread.archive.format}.`);
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({
    reading: reread.archive.reading,
    prepared,
    requestId: `request:${id}`,
    ownerKey,
    workspaceId,
    sourceReadingReference: archive.contentReference,
    candidatePolicy,
  });
  const answer = buildHopPropertyAdviceV3(draft.requestSnapshot);

  expect(prepared).toEqual(preparedBefore);
  expect(reread.archive.reading).toEqual(reading);
  expect(draft.sourceReadingReference).toBe(archive.contentReference);
  expect(draft.requestSnapshot.originalQuestion).toBe(question);
  expect(draft.requestSnapshot.context).toEqual(buildHopV55PropertyAdviceRequestContext(prepared));
  expect(answer.requestSnapshot).toEqual(draft.requestSnapshot);
  for (const intent of draft.requestSnapshot.propertyIntents) {
    for (const span of intent.sourceSpans) {
      expect(question.slice(span.start, span.end)).toBe(span.text);
    }
  }
  return { question, id, prepared, reading, readingReference: archive.contentReference, draft, answer };
}

function sweetnessObservation(path: PreparedPath) {
  return path.draft.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness'
    && intent.role === 'reportedObservation');
}

describe('R21-1 — lecture des actes et de la modalité avant conseil V3', () => {
  it('reproduit la variation Source25 sans transformer la non-décision en cible d’amertume', () => {
    const path = preparePath(R21_VARIATION, 'r21-source25-variation');
    const bitternessIncrease = path.draft.requestSnapshot.propertyIntents.filter(intent =>
      intent.property === 'bitterness' && intent.role === 'target' && intent.direction === 'increase');

    expect(bitternessIncrease).toEqual([]);
  });

  it('conserve la compensation nominale comme question reliée au constat de douceur', () => {
    const path = preparePath(R21_VARIATION, 'r21-source25-compensation');
    const observation = sweetnessObservation(path);
    const inquiry = path.draft.requestSnapshot.propertyIntents.find(intent =>
      intent.sourceSpans.some(span => /compensation/i.test(span.text)));

    expect(observation).toMatchObject({ role: 'reportedObservation', direction: null, metric: 'sensory',
      sourceSpans: expect.arrayContaining([expect.objectContaining({ text: 'douce' })]) });
    expect(inquiry).toMatchObject({ role: 'investigation', property: 'sweetness', direction: 'investigate',
      relatedIntentIds: [observation?.id],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation?.id] } });
    expect(path.answer.coverage.points.some(point => point.intentId === inquiry?.id)).toBe(true);
  });

  it('garde la poire et la caractérisation du houblon comme actes distincts, sans identité ni analyse inventées', () => {
    const path = preparePath(R21_VARIATION, 'r21-source25-guard-and-characterization');
    const pear = path.draft.requestSnapshot.propertyIntents.find(intent =>
      intent.sourceSpans.some(span => span.text === 'poire'));
    const characterization = path.draft.requestSnapshot.propertyIntents.find(intent =>
      intent.sourceSpans.some(span => span.text === 'mon houblon de jardin'));

    expect(pear).toMatchObject({ direction: 'keep', property: 'aroma' });
    expect(characterization).toMatchObject({ role: 'investigation', direction: 'investigate',
      property: 'materialCharacter', subject: { kind: 'material', materialId: null } });
    expect(path.draft.requestSnapshot.materials).toEqual([]);
  });

  it('reconnaît le choix positif explicite de renforcer, comme contraste à la non-décision', () => {
    const affirmative = preparePath(
      'Je trouve ma bière trop douce. Je choisis de renforcer l’amertume tout en conservant la poire.',
      'r21-affirmative-increase',
    );
    expect(affirmative.draft.requestSnapshot.propertyIntents).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'bitterness', role: 'target', direction: 'increase', required: true }),
      expect.objectContaining({ property: 'aroma', direction: 'keep' }),
    ]));
  });

  it.each([
    {
      id: 'compensation-verbale-non-engagement',
      question: 'Ma bière me semble trop douce. Je cherche une compensation avec le houblon du jardin en gardant la poire. Je n’ai pas encore choisi de renforcer l’amertume.',
      inquirySpan: 'compensation',
    },
    {
      id: 'equilibrage-nominal-non-engagement',
      question: 'Ma bière me paraît trop douce. Comment rechercher un équilibrage avec le houblon du jardin tout en conservant la poire ? L’augmentation de l’amertume n’est pas décidée.',
      inquirySpan: 'équilibrage',
    },
  ])('conserve la question de compensation/équilibrage dans la proposition $id', ({ id, question, inquirySpan }) => {
    const path = preparePath(question, id);
    const observation = sweetnessObservation(path);
    const inquiry = path.draft.requestSnapshot.propertyIntents.find(intent =>
      intent.sourceSpans.some(span => span.text.toLocaleLowerCase('fr').includes(inquirySpan)));

    expect(observation).toMatchObject({ role: 'reportedObservation', property: 'sweetness', direction: null });
    expect(inquiry).toMatchObject({ role: 'investigation', direction: 'investigate', relatedIntentIds: [observation?.id],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation?.id] } });
  });

  it.each([
    {
      id: 'compensation-verbale-non-engagement',
      question: 'Ma bière me semble trop douce. Je cherche une compensation avec le houblon du jardin en gardant la poire. Je ne décide pas d’augmenter l’amertume.',
    },
    {
      id: 'equilibrage-nominal-non-engagement',
      question: 'Ma bière me paraît trop douce. Comment rechercher un équilibrage avec le houblon du jardin tout en conservant la poire ? L’augmentation de l’amertume n’est pas décidée.',
    },
  ])('ne transforme pas le non-engagement en cible d’augmentation dans $id', ({ id, question }) => {
    const path = preparePath(question, `${id}-direction`);
    const bitternessIncrease = path.draft.requestSnapshot.propertyIntents.filter(intent =>
      intent.property === 'bitterness' && intent.role === 'target' && intent.direction === 'increase');

    expect(bitternessIncrease).toEqual([]);
  });
});

const SOURCE23 = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';

function readOnly(question: string) {
  return readHopV55Question(question, prepareBrewingScenarioContext(makeHopV55FixtureContext('planning')));
}

function draftFor(reading: ReturnType<typeof readHopV55Question>, pattern: RegExp) {
  return reading.criterionDrafts.find(row => pattern.test(row.term));
}

function expectExactSpans(question: string, spans: ReadonlyArray<{ start: number; end: number; text: string } | undefined>) {
  for (const span of spans) if (span) expect(question.slice(span.start, span.end)).toBe(span.text);
}

describe('R21-2 — représentation des actes : portée, objet et modalité', () => {
  it('expose un diagnostic versionné fidèle pour la variation R21, avec anaphore et spans UTF-16 exacts', () => {
    const diagnostic = readHopV55QuestionActDiagnosticV1(R21_VARIATION);
    // Acts v2 added the declarative evaluation (« ma bière est trop douce »); the diagnostic shape stays V1.
    expect(diagnostic.version).toBe('hop-v55-question-acts-v2');
    expect(diagnostic.issues).toEqual([]);
    const perception = diagnostic.acts.find(act => act.kind === 'reportedPerception');
    const compensation = diagnostic.acts.find(act => act.kind === 'compensationInquiry');
    const nonCommitment = diagnostic.acts.find(act => act.kind === 'nonCommitment');
    const characterization = diagnostic.acts.find(act => act.kind === 'materialCharacterization');
    expect(perception).toMatchObject({ cue: { text: 'Je trouve' } });
    expect(compensation).toMatchObject({ cue: { text: 'compensation' }, modality: 'asked',
      instrument: { text: 'mon houblon de jardin' }, relatedActIds: [perception?.id] });
    expect(nonCommitment).toMatchObject({ cue: { text: 'ne choisis pas' }, action: { text: 'renforcer' }, flavor: 'increase' });
    expect(characterization).toMatchObject({ cue: { text: 'caractériser' }, object: { text: 'mon houblon de jardin' },
      objectVia: 'anaphora', anaphor: { text: 'ce houblon' } });
    for (const act of diagnostic.acts) {
      expectExactSpans(R21_VARIATION, [act.cue, act.scope, act.action, act.object, act.anaphor, act.instrument]);
    }
    expect(readHopV55QuestionActDiagnosticV1(R21_VARIATION)).toEqual(diagnostic);
  });

  it('préserve la lecture Source23 sans geste de dose déduit de « décider d’augmenter »', () => {
    const reading = readOnly(SOURCE23);
    expect(draftFor(reading, /^douce$/u)).toMatchObject({ direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/perception rapportée/u) });
    expect(draftFor(reading, /^compenser$/u)).toMatchObject({ direction: null, qualification: expect.stringMatching(/Demande de compensation/u) });
    expect(draftFor(reading, /^amertume$/u)).toMatchObject({ direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/Aucune décision d’augmentation/u) });
    expect(draftFor(reading, /^mon houblon de jardin$/u)).toMatchObject({ dimension: 'documentation', direction: null });
    expect(draftFor(reading, /^poire$/u)).toMatchObject({ direction: 'keep', requirement: 'required' });
    expect(reading.interpretation).not.toMatch(/geste demandé|régler une dose/u);
    expect(reading.branches).toEqual([]);
  });

  it.each([
    { id: 'parfait-negatif', question: 'Je n’ai pas encore décidé d’augmenter l’amertume, je garde la poire.', term: /^amertume$/u },
    { id: 'incertitude', question: 'Je ne sais pas encore si je dois renforcer l’amertume.', term: /^amertume$/u },
    { id: 'hesitation', question: 'J’hésite à renforcer l’amertume.', term: /^amertume$/u },
    { id: 'passif-nominal', question: 'Le renforcement de l’amertume n’est pas encore décidé.', term: /^amertume$/u },
    { id: 'anglais', question: 'I have not decided to increase the bitterness yet.', term: /^bitterness$/u },
  ])('ne change aucune direction quand le choix lui-même est nié ($id)', ({ id, question, term }) => {
    const reading = readOnly(question);
    expect(draftFor(reading, term)).toMatchObject({ direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/^Aucune décision d’augmentation/u) });
    expect(reading.intent.criteria.some(row => row.direction === 'increase' || row.direction === 'decrease')).toBe(false);
    expect(reading.interpretation).not.toMatch(/geste demandé/u);
    const path = preparePath(question, `r21-non-commitment-${id}`);
    expect(path.draft.requestSnapshot.propertyIntents.filter(intent => intent.property === 'bitterness'
      && intent.role === 'target' && (intent.direction === 'increase' || intent.direction === 'decrease'))).toEqual([]);
  });

  it('garde la poire hors de la portée de l’absence de choix et ne transforme pas une réduction non décidée', () => {
    const coordinated = readOnly('Je n’ai pas encore décidé d’augmenter l’amertume, je garde la poire.');
    expect(draftFor(coordinated, /^poire$/u)).toMatchObject({ direction: 'keep', requirement: 'required' });
    const reduction = readOnly('Je n’ai pas encore choisi de réduire l’amertume.');
    expect(draftFor(reduction, /^amertume$/u)).toMatchObject({ direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/^Aucune décision de diminution/u) });
  });

  it.each([
    { question: 'Je choisis de renforcer l’amertume.', direction: 'increase' },
    { question: 'J’ai décidé d’augmenter l’amertume.', direction: 'increase' },
    { question: 'Comment augmenter l’amertume ?', direction: 'increase' },
    { question: 'Je ne veux pas augmenter l’amertume.', direction: 'keep' },
  ])('accepte les décisions et gardes effectivement formulées : $question', ({ question, direction }) => {
    expect(draftFor(readOnly(question), /^amertume$/u)).toMatchObject({ direction, requirement: 'required' });
  });

  it.each([
    { question: 'Faut-il renforcer l’amertume ?', qualification: /^Question posée sur un changement/u },
    { question: 'Si j’augmente l’amertume, est-ce que la poire disparaît ?', qualification: /^Hypothèse conditionnelle/u },
  ])('lit une question ou une hypothèse de changement comme examen, sans cible ni geste : $question', ({ question, qualification }) => {
    const reading = readOnly(question);
    expect(draftFor(reading, /^amertume$/u)).toMatchObject({ direction: 'investigate', requirement: 'required',
      qualification: expect.stringMatching(qualification) });
    expect(reading.intent.criteria.some(row => row.direction === 'increase')).toBe(false);
    expect(reading.interpretation).not.toMatch(/geste demandé/u);
    expect(reading.branches).toEqual([]);
  });

  it('garde une commande physique formulée après une absence de choix, mais pas l’ajout non choisi', () => {
    const command = readOnly('Je n’ai pas encore choisi de renforcer l’amertume. Ajoute 20 g de houblon au whirlpool.');
    expect(command.operationDrafts?.find(row => row.kind === 'add')).toMatchObject({ kind: 'add', grams: 20, use: 'whirlpool' });
    expect(command.interpretation).toMatch(/geste demandé/u);
    const undecided = readOnly('Je n’ai pas encore choisi d’ajouter 20 g de houblon au whirlpool.');
    expect(undecided.interpretation).not.toMatch(/geste demandé/u);
    expect(undecided.branches).toEqual([]);
  });

  it.each([
    { question: 'Mon houblon de jardin est inconnu. Comment le caractériser ?', object: 'Mon houblon de jardin', via: 'pronoun' },
    { question: 'Je veux caractériser le houblon du jardin avant de choisir.', object: 'le houblon du jardin', via: 'direct' },
  ])('rattache la caractérisation à la matière désignée ($via), sans identité ni analyse', ({ question, object, via }) => {
    const reading = readOnly(question);
    const draft = reading.criterionDrafts.find(row => row.term === object);
    expect(draft).toMatchObject({ dimension: 'documentation', direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/Caractérisation matière/u) });
    expect(draft?.familyId).toBeUndefined();
    expect(question.slice(draft!.source.start, draft!.source.end)).toBe(object);
    expect(readHopV55QuestionActDiagnosticV1(question).acts.find(act => act.kind === 'materialCharacterization'))
      .toMatchObject({ objectVia: via, object: { text: object } });
  });

  it('rend visibles les parties structurantes non représentables au lieu d’une lecture complète en apparence', () => {
    const withoutMaterial = readOnly('Comment caractériser avant de choisir ?');
    expect(withoutMaterial.unresolved.some(row => /caractérisation « caractériser » ne désigne aucune matière/u.test(row))).toBe(true);
    const withoutFrame = readOnly('Ma bière est trop douce, je compense avec du houblon.');
    expect(withoutFrame.criterionDrafts.some(row => /compense/u.test(row.term))).toBe(false);
    expect(withoutFrame.unresolved.some(row => /compensation « compense » est citée sans question/u.test(row))).toBe(true);
    const refused = readOnly('Ma bière me paraît trop douce, mais je ne veux pas la compenser.');
    expect(refused.criterionDrafts.some(row => /compenser/u.test(row.term))).toBe(false);
    expect(refused.unresolved.some(row => /compensation « compenser » est écartée/u.test(row))).toBe(true);
    const unknownProperty = readOnly('Je trouve ma bière trop ronde.');
    expect(unknownProperty.unresolved.some(row => /Le constat « .*ronde » est conservé tel quel/u.test(row))).toBe(true);
  });

  it('relie une compensation verbale interrogative au constat rapporté', () => {
    const question = 'Ma bière me paraît trop douce. Quelles pistes pour la compenser avec le houblon ?';
    const diagnostic = readHopV55QuestionActDiagnosticV1(question);
    const perception = diagnostic.acts.find(act => act.kind === 'reportedPerception');
    expect(diagnostic.acts.find(act => act.kind === 'compensationInquiry')).toMatchObject({
      cue: { text: 'compenser' }, modality: 'asked', relatedActIds: [perception?.id] });
    expect(draftFor(readOnly(question), /^compenser$/u)).toMatchObject({ qualification: expect.stringMatching(/Demande de compensation/u) });
  });
});
