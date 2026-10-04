import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { readHopV55QuestionScopeDraftsV1 } from '../../src/services/hopV55/questionScopeReading';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { prepareHopV55AssistedAdviceContextLaunch } from '../../src/services/hopV55/assistedAdviceContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { assertHopV55PropertyAdviceRequestDraftV3, prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  buildHopV55AssistedAdviceRequest,
  hopV55V4ActionFromAssistedSuggestion,
  prepareHopV55AssistedAdviceFromProposal
} from '../../src/services/hopV55/assistedAdviceProposal';
import {
  brewerHopAdviceReaderCues,
  createBrewerHopAdviceProposalEnvelope,
  type BrewerHopAdviceEvidenceSource,
  type BrewerHopAdviceRequest
} from '../../functions/src/brewerHopAdviceProposal';

const ownerKey = 'owner:assisted-advice-fixture';
const workspaceId = 'workspace:assisted-advice-fixture';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a encore été choisie.' };
type Span = { start: number; end: number; text: string };

function setup(question: string, mutate?: (reading: HopV55QuestionReading) => void) {
  const sourceContext = makeHopV55FixtureContext('planning');
  const context = prepareBrewingScenarioContext(sourceContext);
  const reading = readHopV55Question(question, context);
  mutate?.(reading);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question, reading });
  const recordedAt = '2026-10-04T00:00:00.000Z';
  const scope = { kind: 'recipe' as const, id: sourceContext.recipe!.id! };
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:assisted-advice-fixture', ownerKey, workspaceId,
    recordedAt, reading, source: scope, runtimeReference: hopV55ScenarioRuntimeReference(context.runtime) });
  const sourceReadingReference = archive.contentReference;
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Fixture conseil assisté', intent: { question, criteria: [] }, sourceRecipeId: scope.id,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt };
  const current = { archive, workspace, ownerKey, workspaceId, scopeAtPageLaunch: scope, context: sourceContext };
  const launched = prepareHopV55AssistedAdviceContextLaunch(current);
  if (launched.status !== 'ready') throw new Error(`Fixture de lancement : ${JSON.stringify(launched)}`);
  const contextCheck = { launch: launched.launch, current };
  const request = buildHopV55AssistedAdviceRequest({ reading, sourceReadingReference, scopeDrafts, contextLaunch: launched.launch });
  const baseline = reading.criterionDrafts.length ? prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context, requestId: 'baseline',
    ownerKey, workspaceId, sourceReadingReference, candidatePolicy }).requestSnapshot.propertyIntents : [];
  return { question, context, contextCheck, reading, scopeDrafts, request, sourceReadingReference, baseline };
}
type Setup = ReturnType<typeof setup>;
const server = (request: BrewerHopAdviceRequest, raw: unknown, evidence: BrewerHopAdviceEvidenceSource[] = []) => createBrewerHopAdviceProposalEnvelope({
  request, raw, evidence, readers: {}, serverContext: { phase: 'planning', provenance: ['Fixture locale.'], loadedAt: 1,
    binding: structuredClone(request.contextLaunch.expected) }
});
const local = (s: Setup, envelope: unknown, turnEvidence: BrewerHopAdviceEvidenceSource[] = [], patch: Record<string, unknown> = {}) =>
  prepareHopV55AssistedAdviceFromProposal({ envelope, turnEvidence, reading: s.reading, sourceReadingReference: s.sourceReadingReference,
    context: s.contextCheck, scopeDrafts: s.scopeDrafts, prepared: s.context, requestId: 'request-assisted', ownerKey, workspaceId, candidatePolicy, ...patch });
const at = (question: string, text: string): Span => {
  const start = question.indexOf(text);
  if (start < 0) throw new Error(`Fixture : « ${text} » absent.`);
  return { start, end: start + text.length, text };
};
const overlaps = (left: Span, right: Span) => left.start < right.end && right.start < left.end;
const covering = (intents: readonly HopPropertyAdviceIntentV3[], span: Span) => intents.filter((intent) => intent.sourceSpans.some((entry) => overlaps(entry, span)));

interface Desired { key: string; quote: string; reading: Record<string, unknown>; related?: string[]; compensates?: string[] }
/**
 * Builds what a faithful assistant would send, whatever the local reader got right: confirm a matching
 * reader line, revise a wrong one, add a missed fragment, and address every objective read under a negation.
 */
function faithful(s: Setup, desired: Desired[]) {
  const ids = new Map<string, string>();
  const used = new Set<string>();
  const plan = desired.map((entry) => {
    const draft = s.reading.criterionDrafts.find((row) => !used.has(row.id) && overlaps(row.source, at(s.question, entry.quote)));
    if (draft) used.add(draft.id);
    ids.set(entry.key, draft?.id ?? `assist-${entry.key}`);
    return { entry, draft };
  });
  const readerReview: unknown[] = [];
  const annotations: unknown[] = [];
  for (const { entry, draft } of plan) {
    const reading = { ...entry.reading, related: (entry.related ?? []).map((key) => ids.get(key)!), compensates: (entry.compensates ?? []).map((key) => ids.get(key)!) };
    if (!draft) {
      annotations.push({ id: ids.get(entry.key), quotes: [{ text: entry.quote }], ...reading });
      continue;
    }
    const current = s.baseline.find((intent) => intent.id === draft.id);
    const matches = !!current && current.property === entry.reading.property && current.role === entry.reading.role
      && (current.direction ?? 'none') === entry.reading.direction && !(entry.compensates?.length);
    const guard = current?.direction === 'keep' || current?.direction === 'exclude';
    readerReview.push(matches || (guard && current?.direction === entry.reading.direction)
      ? { annotationId: draft.id, verdict: 'consistent', reason: 'Lecture locale fidèle.' }
      : { annotationId: draft.id, verdict: 'revise', reason: 'Lecture locale corrigée sur le même fragment.', revision: reading });
  }
  for (const cue of brewerHopAdviceReaderCues(s.request)) {
    if (cue.negatedObjective && !used.has(cue.id)) readerReview.push({ annotationId: cue.id, verdict: 'dispute', reason: 'Objectif lu sous une négation.' });
  }
  return { readerReview, annotations, ids };
}
const beer = { subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer' };
const answer = (related: string[], extra: Record<string, unknown> = {}) => ({
  summary: 'Caractérise d’abord, compare ensuite sur un échantillon ; aucun levier n’est choisi à ta place.',
  readingNote: 'Lecture fidèle de la demande, avec ses gardes et ses questions ouvertes.',
  options: [{ id: 'assist-option', kind: 'investigation', title: 'Comparer sur un échantillon', rationale: 'Un essai séparé montre l’effet sans toucher au lot.', related }],
  program: { kind: 'none', note: 'Aucun programme préparé par un outil.' }, ...extra
});

const R20 = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';

describe('Adaptateur local de la lecture assistée', () => {
  it('R20 : une proposition fidèle donne un brouillon V3 exploitable et une réponse documentaire locale', () => {
    const s = setup(R20);
    const jardin = s.reading.criterionDrafts.find((draft) => draft.source.text === 'mon houblon de jardin')!;
    const envelope = server(s.request, { materials: [{ id: 'assist-jardin', quote: { text: 'mon houblon de jardin' }, identity: 'personalUnidentified',
      note: 'Identité, analyse et quantité inconnues.' }], answer: answer([jardin.id]) });
    const result = local(s, JSON.parse(JSON.stringify(envelope)));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.assistedDraft).not.toBeNull();
    expect(() => assertHopV55PropertyAdviceRequestDraftV3(result.assistedDraft)).not.toThrow();
    expect(result.changedFromReader).toBe(false);
    expect(result.annotations.every((row) => row.disposition === 'unchanged')).toBe(true);
    const intents = result.assistedDraft!.requestSnapshot.propertyIntents;
    expect(covering(intents, at(R20, 'douce'))[0]).toMatchObject({ role: 'reportedObservation', direction: null });
    expect(intents.some((intent) => intent.property === 'bitterness' && intent.role === 'target')).toBe(false);
    expect(covering(intents, at(R20, 'poire'))[0]).toMatchObject({ direction: 'keep' });
    expect(result.assistedDraft!.requestSnapshot.interpretation.origin).toBe('proposal');
    expect(result.materials[0]).toMatchObject({ identity: 'personalUnidentified', candidates: [] });
    const documentary = buildHopPropertyAdviceV3(result.assistedDraft!.requestSnapshot);
    expect(documentary.strategies.every((strategy) => strategy.preparation.operational.status === 'notProvided')).toBe(true);
    expect(documentary.coverage.points.every((point) => intents.some((intent) => intent.id === point.intentId))).toBe(true);
  });

  it('contre-exemple de l’intégrateur : la lecture assistée corrige une cible promue et restaure enquête et caractérisation', () => {
    const q = 'Je trouve ma bière trop douce. Comment envisager une compensation avec mon houblon de jardin, tout en conservant la poire ? Je ne choisis pas encore de renforcer l’amertume. Il faut d’abord caractériser ce houblon.';
    const s = setup(q);
    const plan = faithful(s, [
      { key: 'douce', quote: 'douce', reading: { property: 'sweetness', role: 'reportedObservation', direction: 'none', required: false, basis: 'current',
        metric: 'sensory', ...beer, reason: 'Douceur perçue rapportée ; pas une demande de baisse.' } },
      { key: 'compensation', quote: 'compensation', related: ['douce'], compensates: ['douce'], reading: { property: 'sweetness', role: 'investigation',
        direction: 'investigate', required: true, basis: 'none', metric: 'sensory', ...beer, reason: 'Compensation envisagée, sans levier choisi.' } },
      { key: 'poire', quote: 'poire', reading: { property: 'aroma', role: 'constraint', direction: 'keep', required: true, basis: 'current', metric: 'sensory',
        ...beer, reason: 'Garde de la poire.' } },
      { key: 'amertume', quote: 'renforcer l’amertume', reading: { property: 'bitterness', role: 'investigation', direction: 'investigate', required: false,
        basis: 'none', metric: 'sensory', ...beer, reason: 'Renforcer l’amertume n’est pas encore choisi.' } },
      { key: 'caracteriser', quote: 'caractériser ce houblon', reading: { property: 'materialCharacter', role: 'investigation', direction: 'investigate',
        required: true, basis: 'none', metric: 'unspecified', subject: 'material', subjectLabel: 'ce houblon', sensoryContext: 'unspecified',
        familyId: 'famille-inventee', reason: 'Caractérisation demandée avant tout choix.' } }
    ]);
    const envelope = server(s.request, { readerReview: plan.readerReview, annotations: plan.annotations, answer: answer([plan.ids.get('caracteriser')!]) });
    const result = local(s, envelope);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.annotations.filter((row) => row.disposition === 'refused')).toEqual([]);
    const intents = result.assistedDraft!.requestSnapshot.propertyIntents;
    expect(intents.some((intent) => intent.property === 'bitterness' && intent.role === 'target' && intent.required
      && (intent.direction === 'increase' || intent.direction === 'decrease'))).toBe(false);
    const compensation = intents.find((intent) => intent.investigation?.kind === 'comparePerceptualCompensation')!;
    expect(compensation).toBeDefined();
    const observation = intents.find((intent) => intent.id === compensation.investigation!.observationIntentIds[0])!;
    expect(observation).toMatchObject({ role: 'reportedObservation', property: 'sweetness', direction: null, metric: 'sensory' });
    expect(intents.some((intent) => intent.property === 'materialCharacter' && intent.role === 'investigation')).toBe(true);
    // A family hint unknown locally never reaches V3.
    expect(intents.every((intent) => intent.familyId !== 'famille-inventee')).toBe(true);
    expect(covering(intents, at(q, 'poire')).every((intent) => intent.direction === 'keep')).toBe(true);
    expect(result.conflicts.every((conflict) => conflict.resolved)).toBe(true);
    for (const suggestion of result.v4Suggestions) {
      if (suggestion.kind === 'add') expect(suggestion.sourceAnnotation.interpretationOrigin).toBe('proposal');
      if (suggestion.kind === 'revise') expect(suggestion.proposedIntent.interpretationOrigin).toBe('proposal');
    }
  });

  it('Q02 : risque conditionnel et autre ajout conservés, identité candidate relue depuis la preuve du tour', () => {
    const q = 'Ou dans ma stout si j\'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.';
    const s = setup(q);
    const plan = faithful(s, [{ key: 'resine', quote: 'résineux', reading: { property: 'aroma', role: 'investigation', direction: 'investigate', required: true,
      basis: 'none', metric: 'sensory', subject: 'beer', subjectLabel: 'Ma stout', sensoryContext: 'beer', reason: 'Risque conditionnel, ni excès ni manque constaté.' } }]);
    const catalogue: BrewerHopAdviceEvidenceSource = { id: 'E1', name: 'lookup_brewing_catalogue', label: 'Catalogue', data: { truncated: false,
      records: [{ kind: 'hopVariety', id: 'hopsteiner-nug', revision: 1, fingerprint: 'f'.repeat(64), origin: 'bundled',
        record: { id: 'hopsteiner-nug', name: 'Nugget', aliases: [], form: 'unknown', descriptions: [], analysis: [] } }] } };
    const envelope = server(s.request, { readerReview: plan.readerReview, annotations: plan.annotations,
      openQuestions: [{ id: 'assist-autre', kind: 'alternativeAddition', quotes: [{ text: 'ajouter autre chose' }],
        restatement: 'Quel autre ajout pourrait accompagner ce caractère ?', whyOpen: 'La nature de l’ajout et l’effet voulu ne sont pas précisés.' }],
      materials: [{ id: 'assist-nuget', quote: { text: 'nuget' }, identity: 'unconfirmed', candidates: [{ materialId: 'variety:hopsteiner-nug', evidenceId: 'E1' }],
        note: 'Nom approximatif : candidat à confirmer.' }],
      answer: answer(['assist-autre']) }, [catalogue]);
    const result = local(s, envelope, [catalogue]);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const intents = result.assistedDraft?.requestSnapshot.propertyIntents ?? [];
    expect(covering(intents, at(q, 'trop résineux')).some((intent) => intent.role === 'reportedObservation')).toBe(false);
    const readerPartners = s.baseline.filter((intent) => intent.partner?.kind === 'material').map((intent) => intent.id);
    expect(intents.filter((intent) => intent.partner?.kind === 'material').map((intent) => intent.id)).toEqual(readerPartners);
    expect(result.materials[0].candidates).toEqual([{ materialId: 'variety:hopsteiner-nug', evidenceId: 'E1' }]);
    expect(result.evidenceRecords[0]).toMatchObject({ kind: 'hopIdentity', truncated: false });
    expect(result.openQuestions.map((entry) => entry.kind)).toEqual(['alternativeAddition']);
    const altered = structuredClone(catalogue) as any;
    altered.data.records[0].id = altered.data.records[0].record.id = 'hopsteiner-ghost';
    expect(local(s, envelope, [altered])).toMatchObject({ status: 'invalid' });
    expect(local(s, envelope, [])).toMatchObject({ status: 'invalid' });
  });

  it('Q09 et variante : portées quand/lesquels distinctes, contribution de levure séparée, aucun arôme inventé', () => {
    const original = setup('Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa.');
    const kinds = original.scopeDrafts.map((scope) => scope.kind);
    expect(kinds).toEqual(expect.arrayContaining(['employmentTiming', 'materialSelection']));
    const duplicate = server(original.request, { scopes: [{ id: 'assist-lesquels', kind: 'materialSelection', quote: { text: 'lesquels' }, reason: 'Choix des matières.' }],
      answer: answer(['assist-lesquels']) });
    const kept = local(original, duplicate);
    expect(kept.status === 'ready' && kept.scopeDrafts.filter((scope) => scope.kind === 'materialSelection').length).toBe(1);

    // Variant without the example's wording: the local reader needs a use verb, so this timing scope is missed.
    const q = 'Avec ma levure, à quel moment ajouter mes houblons, et lesquels choisir ?';
    const s = setup(q);
    const plan = faithful(s, [{ key: 'levure', quote: 'Avec ma levure', reading: { property: 'bioContribution', role: 'investigation', direction: 'investigate',
      required: true, basis: 'none', metric: 'unspecified', subject: 'culture', subjectLabel: 'ma levure', sensoryContext: 'unspecified',
      reason: 'Interaction possible de la souche, distincte de l’arôme et non garantie.' } }]);
    const envelope = server(s.request, { readerReview: plan.readerReview, annotations: plan.annotations,
      scopes: [{ id: 'assist-moment', kind: 'employmentTiming', quote: { text: 'à quel moment ajouter mes houblons' }, focus: { text: 'mes houblons' },
        context: [{ text: 'Avec ma levure' }], reason: 'Question de moment d’emploi.' },
        { id: 'assist-choix', kind: 'materialSelection', quote: { text: 'lesquels' }, reason: 'Choix des matières.' }],
      openQuestions: [{ id: 'assist-interaction', kind: 'fermentationInteraction', quotes: [{ text: 'Avec ma levure' }],
        restatement: 'La souche transforme-t-elle certains composés du houblon selon le moment de l’ajout ?', whyOpen: 'Souche, phase et houblons non précisés.' }],
      answer: answer(['assist-moment', 'assist-choix', 'assist-interaction']) });
    const result = local(s, envelope);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.scopeDrafts.map((scope) => scope.kind)).toEqual(expect.arrayContaining(['employmentTiming', 'materialSelection']));
    expect(result.scopeDrafts.find((scope) => scope.kind === 'employmentTiming')).toMatchObject({ sourceSpan: at(q, 'à quel moment ajouter mes houblons') });
    const intents = result.assistedDraft?.requestSnapshot.propertyIntents ?? [];
    expect(intents.some((intent) => intent.property === 'aroma' && intent.role === 'target')).toBe(false);
    expect(intents.some((intent) => intent.property === 'bioContribution')).toBe(true);
    expect(result.openQuestions.map((entry) => entry.kind)).toEqual(['fermentationInteraction']);
  });

  it('un vrai objectif positif reste distinct de la garde, hors des formulations d’exemple', () => {
    const q = 'Ma blonde paraît fade ; je voudrais plus d’agrumes mais garder l’amertume actuelle. Lequel de mes houblons ?';
    const s = setup(q);
    const plan = faithful(s, [
      { key: 'agrumes', quote: 'agrumes', reading: { property: 'aroma', role: 'target', direction: 'increase', required: true, basis: 'qualitativeTarget',
        metric: 'sensory', ...beer, familyId: 'citrus', reason: 'Objectif aromatique positif.' } },
      { key: 'amertume', quote: 'amertume', reading: { property: 'bitterness', role: 'constraint', direction: 'keep', required: true, basis: 'current',
        metric: 'sensory', ...beer, reason: 'Amertume actuelle à garder.' } }
    ]);
    const envelope = server(s.request, { readerReview: plan.readerReview, annotations: plan.annotations, answer: answer([plan.ids.get('agrumes')!]) });
    const result = local(s, envelope);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const intents = result.assistedDraft!.requestSnapshot.propertyIntents;
    expect(covering(intents, at(q, 'agrumes'))).toEqual(expect.arrayContaining([expect.objectContaining({ role: 'target', direction: 'increase' })]));
    expect(covering(intents, at(q, 'amertume')).every((intent) => intent.direction === 'keep')).toBe(true);
  });

  it('refuse une proposition périmée, altérée ou portant sur une autre lecture', () => {
    const s = setup(R20);
    const jardin = s.reading.criterionDrafts.find((draft) => draft.source.text === 'mon houblon de jardin')!;
    const envelope = server(s.request, { answer: answer([jardin.id]) });
    expect(local(s, envelope, [], { sourceReadingReference: 'reading:autre-archive' })).toMatchObject({ status: 'stale' });
    const other = setup('Ma bière me paraît trop douce. Comment caractériser mon houblon de jardin ?');
    expect(local(other, envelope)).toMatchObject({ status: 'stale' });
    const corrected = setup(R20, (reading) => { reading.criterionDrafts[0] = { ...reading.criterionDrafts[0], origin: 'brasseur' }; });
    expect(local({ ...corrected, request: s.request }, envelope)).toMatchObject({ status: 'stale' });
    const shifted = structuredClone(envelope) as any;
    shifted.request.readerAnnotations[0].span.start += 1;
    expect(local(s, shifted)).toMatchObject({ status: 'invalid' });
  });

  it('rend le calcul froid exact hors de la prose du modèle et refuse un autre payload sous la même preuve', async () => {
    const s = setup('Je veux comprendre le contact à froid sans augmenter l’amertume.');
    const tool = await runBrewerTool('cold_contact_bitterness_reference', { doseGL: 2 }, s.contextCheck.current.context);
    expect(tool.facts.join(' ')).toMatch(/19,4 BU spectrophotométriques/);
    expect(tool.sources?.[0]?.url).toMatch(/^https?:\/\//);
    const evidence = [{ id: 'E-cold', name: 'cold_contact_bitterness_reference', label: tool.label, data: tool.data }];
    const envelope = server(s.request, { answer: answer([]) }, evidence);
    const result = local(s, JSON.parse(JSON.stringify(envelope)), JSON.parse(JSON.stringify(evidence)));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.coldContactEvidence).toHaveLength(1);
    expect(result.coldContactEvidence[0]).toMatchObject({ status: 'ready', evidenceId: 'E-cold',
      snapshot: { valueBU: 19.4, calibrationSnapshot: { output: { unit: 'BU' } } } });
    const changed = structuredClone(evidence);
    (changed[0].data as { valueBU: number }).valueBU = 99;
    expect(local(s, envelope, changed)).toMatchObject({ status: 'invalid' });
  });

  it('protège gardes et choix confirmés : la proposition reste une suggestion V4, adoptable seulement par geste du brasseur', () => {
    const s = setup(R20, (reading) => {
      const index = reading.criterionDrafts.findIndex((draft) => draft.source.text === 'mon houblon de jardin');
      reading.criterionDrafts[index] = { ...reading.criterionDrafts[index], origin: 'brasseur' };
    });
    const poire = s.reading.criterionDrafts.find((draft) => draft.source.text === 'poire')!;
    const jardin = s.reading.criterionDrafts.find((draft) => draft.source.text === 'mon houblon de jardin')!;
    const envelope = server(s.request, {
      readerReview: [{ annotationId: poire.id, verdict: 'dispute', reason: 'Garde contestée.' },
        { annotationId: jardin.id, verdict: 'revise', reason: 'Autre lecture.', revision: { property: 'materialCharacter', role: 'investigation',
          direction: 'investigate', required: true, basis: 'none', metric: 'unspecified', subject: 'material', subjectLabel: 'mon houblon de jardin',
          sensoryContext: 'unspecified', reason: 'Caractérisation.' } }],
      answer: answer([jardin.id]) });
    const result = local(s, envelope);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const before = new Map(s.baseline.map((intent) => [intent.id, intent]));
    for (const id of [poire.id, jardin.id]) {
      const row = result.annotations.find((entry) => entry.id === id)!;
      expect(row.disposition).toBe('protected');
      expect(row.intent).toEqual(before.get(id));
    }
    const suggestion = result.v4Suggestions.find((entry) => entry.kind === 'revise')!;
    expect(suggestion).toBeDefined();
    const confirmationContext = { ...s.contextCheck, envelope };
    expect(() => hopV55V4ActionFromAssistedSuggestion(suggestion, { kind: 'brewerConfirmation', reason: '' }, confirmationContext)).toThrow(/confirmation explicite/);
    if (suggestion.kind !== 'revise') return;
    const shifted = { ...suggestion.proposedIntent, sourceSpans: [{ ...suggestion.proposedIntent.sourceSpans[0], start: suggestion.proposedIntent.sourceSpans[0].start + 1 }] };
    expect(() => hopV55V4ActionFromAssistedSuggestion(suggestion, { kind: 'brewerConfirmation', reason: 'Je retiens.', editedIntent: shifted }, confirmationContext)).toThrow(/fragments source exacts/);
    const action = hopV55V4ActionFromAssistedSuggestion(suggestion, { kind: 'brewerConfirmation', reason: 'Je retiens cette lecture.' }, confirmationContext);
    expect(action).toMatchObject({ kind: 'revise', annotationId: jardin.id, activeIntent: { interpretationOrigin: 'user' } });
    const add = hopV55V4ActionFromAssistedSuggestion({ kind: 'add', annotationId: 'assist-x', sourceAnnotation: { ...suggestion.proposedIntent, id: 'assist-x' }, reason: 'Ajout.' },
      { kind: 'brewerConfirmation', reason: 'Je l’ajoute.' }, confirmationContext);
    expect(add).toMatchObject({ kind: 'add', sourceAnnotation: { interpretationOrigin: 'proposal' }, activeIntent: { id: 'assist-x', interpretationOrigin: 'user' } });
    const moved = structuredClone(confirmationContext);
    moved.current.context.recipe!.volumeL = 99;
    expect(() => hopV55V4ActionFromAssistedSuggestion(suggestion, { kind: 'brewerConfirmation', reason: 'Je retiens après changement.' }, moved)).toThrow(/runtime|contexte|référence/i);
  });
});
