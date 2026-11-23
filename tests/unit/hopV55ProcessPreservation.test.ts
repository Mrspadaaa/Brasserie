import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV4, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { buildHopPropertyAdviceV3, isHopProcessContextNoteIntent } from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceAnswerV3, assertHopPropertyAdviceRequestV3, type HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareHopV55DecisionProgram, type HopV55ProgramOperationV1 } from '../../src/services/hopV55/decisionProgramPreparation';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { hopV55PropertyAdviceCurrentAssertionIds } from '../../src/services/hopV55/propertyAdvicePreparation';
import { sealHopV55PropertyAdviceRequestDraftV3FromIntents } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1, hopV55PropertyIntentsFromSemanticReadingV1 } from '../../src/services/hopV55/propertyAdviceSemanticPreparationV3';
import { readHopV55QuestionActDiagnosticV1, readHopV55QuestionCoreV1 } from '../../src/services/hopV55/decision';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition } from '../../src/domain/hopDecision/types';

const ownerKey = 'owner:shadow-conservation';
const workspaceId = 'workspace:shadow-conservation';
const source = { kind: 'exploration' as const };
const explicitNone = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a été explicitement choisie pour ce témoin.' };
const openQuestion = 'QA AFTER06 : faut-il garder 17,625 g de Cascade · cônes en fermentation à 18 °C pendant 72 h ?';
const sourceObject = '17,625 g de Cascade · cônes en fermentation à 18 °C pendant 72 h';

function preparedWithDose(grams?: number) {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  if (grams !== undefined) prepared.runtime.current!.program!.additions[0].grams = grams;
  return prepared;
}

function processAnnotation(question: string, prepared = preparedWithDose()) {
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  const annotation = reading.annotations.find(row => row.dimension === 'process');
  return { prepared, reading, annotation };
}

function makeV3Request(question: string, reading: ReturnType<typeof readHopV55QuestionSemanticV1>, prepared: ReturnType<typeof preparedWithDose>) {
  return prepareHopV55PropertyAdviceFromSemanticReadingV1({
    reading,
    prepared,
    requestId: 'request:shadow-conservation',
    ownerKey,
    workspaceId,
    sourceReadingReference: 'reading:shadow-conservation',
    candidatePolicy: explicitNone,
  });
}

function measureMaterial(id: string): HopDecisionMaterial {
  return {
    id,
    name: 'Matière fixture ' + id,
    form: 'pelletT90',
    availableGrams: 200,
    variety: { id: 'variety-' + id, name: 'Variété fixture ' + id, aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
    lot: { id: 'lot-' + id, varietyId: 'variety-' + id, name: 'Lot fixture ' + id, form: 'pelletT90', analysis: [] },
  };
}

function addition(over: Partial<HopProgramAddition> = {}): HopProgramAddition {
  return { id: 'line-a', materialId: 'source', grams: 30, use: 'postFermentation', status: 'performed', contactHours: 36, temperatureC: 17, ...over };
}

function operation(over: Partial<HopV55ProgramOperationV1> & { kind: HopV55ProgramOperationV1['kind'] }): HopV55ProgramOperationV1 {
  return { id: 'op-' + over.kind, label: 'Geste ' + over.kind, ...over } as HopV55ProgramOperationV1;
}

describe('shadow correction #74 — conservation de procédé', () => {
  it('garde la délibération ouverte, le span complet et une réponse V3 unresolved sans branche', () => {
    const prepared = preparedWithDose(42);
    const diagnostic = readHopV55QuestionActDiagnosticV1(openQuestion);
    const deliberation = diagnostic.acts.find(row => row.kind === 'deliberation');
    expect(deliberation).toMatchObject({ kind: 'deliberation', action: { text: 'garder' } });
    expect(deliberation?.flavor).toBeUndefined();

    const core = readHopV55QuestionCoreV1(openQuestion, prepared);
    const coreObject = core.mentions.find(row => row.draft.source.text === sourceObject);
    expect(coreObject).toBeDefined();
    expect(coreObject?.draft).toMatchObject({ term: sourceObject, source: { text: sourceObject }, direction: 'investigate', requirement: 'required', dimension: 'process' });
    expect(core.reading.intent.question).toBe(openQuestion);
    expect(core.reading.operationDrafts ?? []).toEqual([]);
    expect(core.reading.branches).toEqual([]);

    const { reading, annotation } = processAnnotation(openQuestion, prepared);
    expect(annotation).toMatchObject({ sense: 'investigation', inquiry: 'question', direction: 'investigate', requirement: 'required',
      dimension: 'process', lexicon: { status: 'notAProperty' }, source: { text: sourceObject }, frameSource: { text: 'faut-il garder' } });
    expect(annotation).not.toHaveProperty('familyId');
    expect(openQuestion.slice(annotation!.source.start, annotation!.source.end)).toBe(sourceObject);
    expect(reading.operationDrafts ?? []).toEqual([]);
    expect(reading.branches).toEqual([]);
    expect(reading.intent.question).toBe(openQuestion);

    const request = makeV3Request(openQuestion, reading, prepared);
    assertHopPropertyAdviceRequestV3(request.requestSnapshot);
    const intent = request.requestSnapshot.propertyIntents.find(row => row.id === annotation!.id)!;
    expect(intent).toMatchObject({ property: 'unresolved', role: 'investigation', direction: 'investigate', required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
      subject: { kind: 'process', label: sourceObject, materialId: null, sensoryContext: 'unspecified' },
      sourceSpans: [{ start: annotation!.source.start, end: annotation!.source.end, text: sourceObject }], relatedIntentIds: [] });
    expect(intent).not.toHaveProperty('value');
    expect(intent).not.toHaveProperty('quantity');
    expect(request.requestSnapshot.originalQuestion).toBe(openQuestion);
    expect(request.requestSnapshot.context.assertions.some(row => row.value === 42 && row.unit === 'g' && row.dimension === 'process')).toBe(true);
    expect(intent.comparisonBasis.assertionIds).toEqual([]);

    const answer = buildHopPropertyAdviceV3(request.requestSnapshot);
    assertHopPropertyAdviceAnswerV3(answer);
    const point = answer.coverage.points.find(row => row.intentId === intent.id);
    expect(point).toMatchObject({ status: 'unresolved' });
    expect(answer.coverage.status).not.toBe('answered');

    const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:shadow-v4', ownerKey, workspaceId,
      recordedAt: '2026-10-05T10:00:00.000Z', reading, source, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
    expect(readHopV55DecisionReadingArchive(archive)).toEqual({ status: 'available', archive });
  });

  it('déclare une contrainte non qualifiée sans la confondre avec une garde sensorielle', () => {
    const explicit = 'Je choisis de garder 2.75 kg de Houblon Kappa · cônes en fermentation à 19 °C pendant 48 h.';
    const explicitObject = '2.75 kg de Houblon Kappa · cônes en fermentation à 19 °C pendant 48 h';
    const explicitPrepared = preparedWithDose(42);
    const explicitCore = readHopV55QuestionCoreV1(explicit, explicitPrepared);
    const { prepared, reading, annotation } = processAnnotation(explicit, explicitPrepared);
    expect(annotation).toMatchObject({ sense: 'guard', guard: 'preserve', direction: 'keep', requirement: 'required',
      dimension: 'process', lexicon: { status: 'notAProperty' }, source: { text: explicitObject }, frameSource: { text: 'garder' } });
    expect(explicit.slice(annotation!.source.start, annotation!.source.end)).toBe(explicitObject);
    expect(explicitCore.reading.operationDrafts ?? []).toEqual([]);
    expect(explicitCore.reading.branches).toEqual([]);
    const request = makeV3Request(explicit, reading, prepared);
    assertHopPropertyAdviceRequestV3(request.requestSnapshot);
    const intent = request.requestSnapshot.propertyIntents.find(row => row.id === annotation!.id)!;
    expect(intent).toMatchObject({ property: 'unresolved', role: 'constraint', direction: 'keep', required: true,
      comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'unspecified',
      subject: { kind: 'process', label: explicitObject, materialId: null, sensoryContext: 'unspecified' }, qualification: null,
      sourceSpans: [{ start: annotation!.source.start, end: annotation!.source.end, text: explicitObject }] });
    expect(intent).not.toHaveProperty('value');
    expect(intent).not.toHaveProperty('quantity');
    expect(request.requestSnapshot.context.assertions.some(row => row.value === 42 && row.unit === 'g' && row.dimension === 'process')).toBe(true);

    const openPear = readHopV55QuestionSemanticV1('Faut-il conserver la poire ?', preparedWithDose());
    const openPearAnnotation = openPear.annotations.find(row => row.source.text === 'poire');
    expect(openPearAnnotation).toMatchObject({ sense: 'investigation', inquiry: 'question', direction: 'investigate' });
    expect(openPearAnnotation?.dimension).not.toBe('process');

    const declaredPear = readHopV55QuestionSemanticV1('Je veux conserver la poire.', preparedWithDose());
    const declaredPearAnnotation = declaredPear.annotations.find(row => row.source.text === 'poire');
    expect(declaredPearAnnotation).toMatchObject({ sense: 'guard', guard: 'preserve', direction: 'keep' });
    expect(declaredPearAnnotation?.dimension).not.toBe('process');

    const directedAct = readHopV55QuestionActDiagnosticV1('Faut-il diminuer l’amertume ?').acts.find(row => row.kind === 'deliberation');
    expect(directedAct).toMatchObject({ kind: 'deliberation', action: { text: 'diminuer' }, flavor: 'decrease' });
  });

  it('sépare les clauses et conserve une identité/valeur inédites sans liaison au programme courant', () => {
    const question = 'Faut-il garder 17,625 g de Cascade · cônes en fermentation à 18 °C pendant 72 h ? Je veux conserver le floral.';
    const expectedProcess = '17,625 g de Cascade · cônes en fermentation à 18 °C pendant 72 h';
    const { reading, annotation } = processAnnotation(question, preparedWithDose(42));
    expect(annotation?.source.text).toBe(expectedProcess);
    expect(question.slice(annotation!.source.start, annotation!.source.end)).toBe(expectedProcess);
    expect(annotation!.source.text).not.toContain('Je veux conserver le floral');
    const floral = reading.annotations.find(row => row.source.text === 'floral');
    expect(floral).toMatchObject({ sense: 'guard', guard: 'preserve', direction: 'keep' });
    expect(floral?.dimension).not.toBe('process');

    const newIdentity = 'Est-ce qu’il faut maintenir 2.75 kg de Houblon Kappa · cônes en fermentation à 19 °C pendant 48 h ?';
    const newObject = '2.75 kg de Houblon Kappa · cônes en fermentation à 19 °C pendant 48 h';
    const novelPrepared = preparedWithDose(42);
    expect(novelPrepared.runtime.materials.some(row => row.name === 'Houblon Kappa')).toBe(false);
    const novelReading = readHopV55QuestionSemanticV1(newIdentity, novelPrepared);
    const novel = novelReading.annotations.find(row => row.dimension === 'process');
    expect(novel).toMatchObject({ sense: 'investigation', dimension: 'process', lexicon: { status: 'notAProperty' }, source: { text: newObject } });
    expect(newIdentity.slice(novel!.source.start, novel!.source.end)).toBe(newObject);
    expect(novel).not.toHaveProperty('familyId');
    const novelIntent = hopV55PropertyIntentsFromSemanticReadingV1(novelReading, novelPrepared).find(row => row.id === novel!.id)!;
    expect(novelIntent.subject).toMatchObject({ kind: 'process', label: newObject, materialId: null });
    expect(novelIntent.sourceSpans).toEqual([novel!.source]);

    const malformed = 'Faut-il garder 17, g de Houblon Kappa · cônes en fermentation pendant 30 h ?';
    const malformedObject = '17, g de Houblon Kappa · cônes en fermentation pendant 30 h';
    const malformedReading = readHopV55QuestionSemanticV1(malformed, preparedWithDose(42));
    const malformedAnnotation = malformedReading.annotations.find(row => row.dimension === 'process');
    expect(malformedAnnotation?.source.text).toBe(malformedObject);
    expect(malformed.slice(malformedAnnotation!.source.start, malformedAnnotation!.source.end)).toBe(malformedObject);
    expect(malformedReading.unresolved.join(' ')).toMatch(/malformée|non interprétée/iu);
    expect(malformedReading.annotations.some(row => row.term === '17' && row.dimension !== 'process')).toBe(false);
  });

  it('ne capture pas une mesure sensorielle comme dose et conserve les opérations/données typées', () => {
    const q04 = "Est-ce que dans ma blanche je peux faire du dryhopping ai j'ajoute 20g de moins dans le moût ?";
    const q04Core = readHopV55QuestionCoreV1(q04, preparedWithDose());
    const removal = q04Core.reading.operationDrafts?.find(row => row.kind === 'remove');
    expect(removal).toMatchObject({ kind: 'remove', quantity: { kind: 'partial', grams: 20 }, sourceSpan: { text: '20g de moins dans le moût' } });
    expect(q04Core.mentions.some(row => row.draft.dimension === 'process' && row.draft.source.text.includes('20g'))).toBe(false);

    const measurementPrepared = preparedWithDose();
    measurementPrepared.runtime.current!.beerContext!.facts.push({ id: 'shadow-ph', field: 'beer.pH', status: 'observed', origin: 'observation', value: 4.1, unit: 'pH' });
    const measurementQuestion = 'La bière actuelle a un pH mesuré de 4,1.';
    const measurementText = 'pH mesuré de 4,1';
    const measurementStart = measurementQuestion.indexOf(measurementText);
    const measurementSpan = { start: measurementStart, end: measurementStart + measurementText.length, text: measurementText };
    const measurementId = 'measurement:shadow-ph';
    const measurementIntent: HopPropertyAdviceIntentV3 = {
      id: measurementId, property: 'acidity', label: measurementText, role: 'measurement', direction: null, qualification: null, required: true,
      comparisonBasis: { kind: 'current', assertionIds: hopV55PropertyAdviceCurrentAssertionIds(measurementPrepared, 'acidity') },
      metric: 'pH', subject: { kind: 'beer', label: 'Bière fixture', materialId: null, sensoryContext: 'beer' },
      sourceSpans: [measurementSpan], interpretationOrigin: 'user', basis: 'Mesure pH déclarée, distincte de toute dose de procédé.', relatedIntentIds: [],
    };
    const measurementDraft = sealHopV55PropertyAdviceRequestDraftV3FromIntents({
      question: measurementQuestion,
      sourceAnnotations: [{ id: measurementId, source: measurementSpan }],
      propertyIntents: [measurementIntent], prepared: measurementPrepared, requestId: 'request:shadow-pH', ownerKey, workspaceId,
      sourceReadingReference: 'reading:shadow-pH', candidatePolicy: explicitNone,
    });
    assertHopPropertyAdviceRequestV3(measurementDraft.requestSnapshot);
    expect(measurementDraft.requestSnapshot.propertyIntents[0]).toMatchObject({ property: 'acidity', role: 'measurement', metric: 'pH' });

    const targetPrepared = preparedWithDose();
    const targetRequest = createHopV55ScenarioRequest({ prepared: targetPrepared, scenarioId: 'shadow-axis-target', revision: 1,
      intent: { question: 'Comparer à cette cible typée.', criteria: [] }, branches: [], target: { floral: { min: 18, max: 31 } } });
    expect(targetRequest.target).toEqual({ floral: { min: 18, max: 31 } });

    const setDose = operation({ kind: 'setDose', additionId: 'line-a', quantity: { kind: 'target', grams: 35 } });
    const program: HopDecisionProgram = { id: 'shadow-program', revision: 4, stage: 'planning', volumeL: 20, wortGravity: 1.05,
      additions: [addition({ status: 'performed' })] };
    const typedDose = prepareHopV55DecisionProgram({ branch: { id: 'shadow-branch', label: 'Dose typée' }, program,
      materials: [measureMaterial('source'), measureMaterial('target')], intent: { question: 'Dose explicitement typée.', interpretation: 'Geste de test.', criteria: [] },
      operations: [setDose] });
    expect(typedDose.status).toBe('blocked');
    expect(typedDose.branch).toBeUndefined();

    const unknown = readHopV55QuestionSemanticV1('Je veux une bière ultra juicy.', preparedWithDose());
    const juicy = unknown.annotations.find(row => row.term === 'juicy');
    expect(juicy).toMatchObject({ lexicon: { status: 'outOfLexicon' } });
    expect(juicy).not.toHaveProperty('familyId');
    expect(juicy).not.toHaveProperty('dimension');
  });

  it('relit les témoins V2/V4 préexistants sans reparsing ni migration', () => {
    const archiveV2 = JSON.parse(readFileSync(new URL('../fixtures/hopV55ProcessPreservationBaselineV2.json', import.meta.url), 'utf8')) as unknown;
    const frozenV2 = structuredClone(archiveV2);
    const rereadV2 = readHopV55DecisionReadingArchive(archiveV2);
    expect(rereadV2.status).toBe('available');
    if (rereadV2.status !== 'available' || rereadV2.archive.format !== 'hop-v55-decision-reading-v2') throw new Error('Le témoin V2 doit rester lisible au format exact.');
    expect(rereadV2.archive.reading.intent.question).toBe(openQuestion);
    expect(rereadV2.archive.reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: '17', direction: 'keep', source: { start: 28, end: 30, text: '17' } }),
    ]));
    expect(JSON.stringify(rereadV2.archive)).toBe(JSON.stringify(frozenV2));

    const archiveV4 = JSON.parse(readFileSync(new URL('../fixtures/hopV55ProcessPreservationBaselineV4.json', import.meta.url), 'utf8')) as unknown;
    const frozenV4 = structuredClone(archiveV4);
    const rereadV4 = readHopV55DecisionReadingArchive(archiveV4);
    expect(rereadV4.status).toBe('available');
    if (rereadV4.status !== 'available' || rereadV4.archive.format !== 'hop-v55-decision-reading-v4') throw new Error('Le témoin V4 doit rester lisible au format exact.');
    expect(rereadV4.archive.reading.intent.question).toBe(openQuestion);
    expect(rereadV4.archive.reading.annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: '17', sense: 'guard', direction: 'keep', source: { start: 28, end: 30, text: '17' } }),
    ]));
    expect(JSON.stringify(rereadV4.archive)).toBe(JSON.stringify(frozenV4));
  });

  // Property: a quantity the brasseur cites stays an exact, visible mention when no process reading
  // or explicit operation carries it. It is never a target, never truncated and never bound to the
  // current dose, whatever the number, unit, material or modality.
  const citedQuantityCases: Array<{ question: string; quantity: string; kept: Array<{ term: string; sense: string }> }> = [
    { question: 'Je veux garder le floral de la Cascade à 17,625 g.', quantity: '17,625 g', kept: [{ term: 'floral', sense: 'guard' }] },
    { question: 'Je veux plus d’agrumes à 17,625 g de Cascade.', quantity: '17,625 g de Cascade', kept: [{ term: 'agrumes', sense: 'directedChange' }] },
    { question: 'Avec 2,25 g/L de Mosaic, garder l’amertume basse.', quantity: '2,25 g/L de Mosaic', kept: [] },
    { question: 'Est-ce que 0,5 kg de Citra donne trop d’herbacé ?', quantity: '0,5 kg de Citra', kept: [] },
    { question: 'Mon fournisseur propose 40 g de Simcoe en échantillon.', quantity: '40 g de Simcoe', kept: [] },
  ];

  it.each(citedQuantityCases)('garde « $quantity » comme quantité citée exacte : $question', ({ question, quantity, kept }) => {
    for (const grams of [undefined, 17.625, 40]) {
      const prepared = preparedWithDose(grams);
      const reading = readHopV55QuestionSemanticV1(question, prepared);
      const cited = reading.annotations.filter(row => row.source.text.includes(quantity.split(' ')[0]));
      expect(cited, JSON.stringify(reading.annotations.map(row => [row.sense, row.source.text]))).toEqual([
        expect.objectContaining({ sense: 'mention', mentionKind: 'contextNote', requirement: 'optional', direction: null, dimension: 'process',
          term: quantity, source: expect.objectContaining({ text: quantity, start: question.indexOf(quantity) }) }),
      ]);
      expect(cited[0].subject).toBeUndefined();
      expect(JSON.stringify(cited[0])).not.toMatch(/recipe-hop|program|addition/u);
      // No integer is cut out of the decimal and no number becomes a target.
      expect(reading.annotations.some(row => /^\d+$/u.test(row.source.text))).toBe(false);
      expect(reading.annotations.filter(row => /\d/u.test(row.source.text) && row.sense !== 'mention')).toEqual([]);
      for (const row of kept) expect(reading.annotations).toEqual(expect.arrayContaining([expect.objectContaining(row)]));
      const intents = hopV55PropertyIntentsFromSemanticReadingV1(reading, prepared);
      const quantityIntent = intents.find(intent => intent.label === quantity);
      expect(quantityIntent).toMatchObject({ role: 'reportedObservation', required: false });
    }
  });

  // V3 B1 — a reported observation about a process subject stays a reported observation; only a context note is context.
  it('garde « Constat rapporté » pour un constat de procédé et réserve « Note de contexte » à la note citée', () => {
    const observations: Array<[string, string]> = [
      ['Le contact était trop long, c’est végétal.', 'contact'],
      ['J’ai constaté que la dose était trop forte.', 'dose'],
      ['La température de fermentation était haute et j’ai senti du soufre.', 'température'],
    ];
    for (const [question, term] of observations) {
      const prepared = preparedWithDose();
      const request = makeV3Request(question, readHopV55QuestionSemanticV1(question, prepared), prepared);
      const text = request.requestSnapshot.interpretation.text;
      expect(text, question).toContain(`Constat rapporté : ${term}`);
      expect(text, question).not.toContain('Note de contexte');
      const answer = JSON.stringify(buildHopPropertyAdviceV3(request.requestSnapshot));
      expect(answer, question).toContain('Observation rapportée sur son sujet déclaré');
      expect(answer, question).not.toContain('Note de contexte');
      // An archive stores these intents as they are: its process observation keeps « Constat » when read again.
      const processIntents = request.requestSnapshot.propertyIntents.filter(intent => intent.subject?.kind === 'process');
      expect(processIntents.length, question).toBeGreaterThan(0);
      expect(processIntents.some(intent => isHopProcessContextNoteIntent(intent)), question).toBe(false);
    }
    const cited = 'Je veux garder le floral de la Cascade à 17,625 g.';
    const prepared = preparedWithDose();
    const request = makeV3Request(cited, readHopV55QuestionSemanticV1(cited, prepared), prepared);
    expect(request.requestSnapshot.interpretation.text).toContain('Note de contexte : 17,625 g');
    expect(request.requestSnapshot.propertyIntents.filter(intent => isHopProcessContextNoteIntent(intent)).map(intent => intent.label)).toEqual(['17,625 g']);
    expect(JSON.stringify(buildHopPropertyAdviceV3(request.requestSnapshot))).toContain('Note de contexte citée, sans constat ni opération déduits');
  });

  // V3 B2 — Swiss/French thousands separators keep the whole number; nothing starts inside a group.
  it('garde entiers les milliers groupés (espace, insécable, fine, apostrophes) dans la quantité citée et l’objet de procédé', () => {
    for (const separator of [' ', ' ', ' ', '\'', '’']) {
      const quantity = `1${separator}000 g de Citra`;
      const question = `Je veux plus d’agrumes avec ${quantity}.`;
      const reading = readHopV55QuestionSemanticV1(question, preparedWithDose());
      expect(reading.annotations.filter(row => row.source.text.includes('000')), JSON.stringify(separator)).toEqual([
        expect.objectContaining({ sense: 'mention', mentionKind: 'contextNote', term: quantity,
          source: expect.objectContaining({ text: quantity, start: question.indexOf(quantity) }) }),
      ]);
      const guardQuestion = `Je veux garder 1${separator}000 g de Cascade en fermentation.`;
      const guardReading = readHopV55QuestionSemanticV1(guardQuestion, preparedWithDose());
      const guard = guardReading.annotations.filter(row => row.dimension === 'process');
      expect(guard, JSON.stringify(separator)).toEqual([expect.objectContaining({ sense: 'guard',
        source: expect.objectContaining({ text: `1${separator}000 g de Cascade en fermentation` }) })]);
      expect(guardReading.unresolved.join(' '), JSON.stringify(separator)).not.toMatch(/mal formée|entier tronqué/u);
    }
  });

  // V3 B3 — the quantity of an operation or gesture really read is never described as « no operation ».
  it('ne nie jamais l’opération lue : la quantité d’un geste de dose, d’ajout ou de retrait n’est pas une note de contexte', () => {
    for (const question of ['Augmenter le Cascade à 17 g.', 'Réduire le Citra à 10 g.', 'Ajouter 1.5 g de Cascade et 40 g de Simcoe.',
      'Ajouter 1,5 g de Cascade et 40 g de Simcoe.']) {
      const core = readHopV55QuestionCoreV1(question, preparedWithDose());
      const reading = readHopV55QuestionSemanticV1(question, preparedWithDose());
      expect(core.reading.interpretation, question).toMatch(/un geste demandé/u);
      expect(reading.annotations.filter(row => row.mentionKind === 'contextNote'), question).toEqual([]);
      expect(core.reading.interpretation, question).not.toMatch(/aucune opération n’est déduite/u);
    }
    // m3: whatever the reader makes of the noun « dose », the note never denies a gesture it read.
    for (const question of ['Avec une dose de 40 g de Citra, c’est trop herbacé.', 'La dose de 40 g de Cascade est trop forte.']) {
      const interpretation = readHopV55QuestionCoreV1(question, preparedWithDose()).reading.interpretation;
      expect(/un geste demandé/u.test(interpretation) && /aucune opération n’est déduite/u.test(interpretation), question).toBe(false);
    }
    // Without any gesture or operation read, the cited quantity stays visible as context.
    const offer = 'Mon fournisseur propose 40 g de Simcoe en échantillon.';
    expect(readHopV55QuestionCoreV1(offer, preparedWithDose()).reading.interpretation).not.toMatch(/un geste demandé/u);
    expect(readHopV55QuestionSemanticV1(offer, preparedWithDose()).annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ sense: 'mention', mentionKind: 'contextNote', term: '40 g de Simcoe' })]));
  });

  // V3-2 N1 — a process context note keeps a neutral label, whether or not it cites a quantity: nothing is invented.
  it('nomme « Note de contexte » toute note de contexte de procédé, chiffrée ou non', () => {
    const notes: Array<[string, string]> = [
      ['Je veux accompagner une note de dry hop.', 'dry hop'],
      ['Je veux accompagner une note de houblonnage.', 'houblonnage'],
      ['Je veux accompagner une note de contact.', 'contact'],
      ['Je veux garder le floral de la Cascade à 17,625 g.', '17,625 g'],
    ];
    for (const [question, term] of notes) {
      const prepared = preparedWithDose();
      const request = makeV3Request(question, readHopV55QuestionSemanticV1(question, prepared), prepared);
      const text = request.requestSnapshot.interpretation.text;
      expect(text, question).toContain(`Note de contexte : ${term}`);
      expect(text, question).not.toMatch(/Quantité citée en contexte|Constat rapporté/u);
      const answer = JSON.stringify(buildHopPropertyAdviceV3(request.requestSnapshot));
      expect(answer, question).toContain('Note de contexte citée, sans constat ni opération déduits');
      expect(answer, question).not.toContain('Quantité citée en contexte');
    }
  });

  // V3-2 N2 — a range is cited whole or not at all, never by its upper bound alone; a bare space is no range.
  it('cite une fourchette entière ou pas du tout, dans la note de contexte comme dans la garde de procédé', () => {
    for (const range of ['entre 5 et 10 g de Citra', 'entre 5 g et 10 g de Citra', '5 à 10 g de Citra', '5-10 g de Citra', '5 – 10 g de Citra',
      '5 ou 10 g de Citra']) {
      const question = `Je veux plus d’agrumes avec ${range}.`;
      const notes = readHopV55QuestionSemanticV1(question, preparedWithDose()).annotations.filter(row => row.mentionKind === 'contextNote');
      expect(notes.map(row => row.source.text), question).toEqual([range]);
    }
    const opening = 'Entre 5 et 10 g de Citra, lequel garde le floral ?';
    expect(readHopV55QuestionSemanticV1(opening, preparedWithDose()).annotations
      .filter(row => row.mentionKind === 'contextNote').map(row => row.source.text)).toEqual(['Entre 5 et 10 g de Citra']);
    const guardQuestion = 'Je veux garder entre 5 et 10 g de Cascade en fermentation.';
    const guard = readHopV55QuestionSemanticV1(guardQuestion, preparedWithDose()).annotations.filter(row => row.dimension === 'process');
    expect(guard.map(row => [row.sense, row.source.text])).toEqual([['guard', 'entre 5 et 10 g de Cascade en fermentation']]);
    const year = 'En 2024 40 g de Citra ont suffi.';
    expect(readHopV55QuestionSemanticV1(year, preparedWithDose()).annotations.filter(row => /40 g/u.test(row.source.text))).toEqual([]);
  });

  // V3-2 N3 — only a gesture before the quantity in its clause, or an operation over its words, owns the quantity.
  it('garde la note quand le geste lu suit la quantité et porte sur une autre matière', () => {
    const cases: Array<[string, string]> = [
      ['Je veux garder le floral de la Cascade à 17,625 g et ajouter du Citra.', '17,625 g'],
      ['Avec 40 g de Simcoe, remplacer le Citra par du Mosaic.', '40 g de Simcoe'],
    ];
    for (const [question, quantity] of cases) {
      const notes = readHopV55QuestionSemanticV1(question, preparedWithDose()).annotations.filter(row => row.mentionKind === 'contextNote');
      expect(notes.map(row => row.source.text), question).toEqual([quantity]);
      // The note only speaks for its own words, next to the gesture read on another material.
      expect(readHopV55QuestionCoreV1(question, preparedWithDose()).reading.interpretation, question)
        .toMatch(/aucune opération n’est déduite de cette mention/u);
    }
  });

  it('laisse la quantité aux lectures qui la portent déjà : procédé, question de procédé ou opération explicite', () => {
    const owned: Array<[string, string, string]> = [
      [openQuestion, sourceObject, 'investigation'],
      ['Je veux garder 17,625 g de Cascade en fermentation.', '17,625 g de Cascade en fermentation', 'guard'],
      ['Garde 40 g de Simcoe au whirlpool.', '40 g de Simcoe au whirlpool', 'guard'],
    ];
    for (const [question, text, sense] of owned) {
      const reading = readHopV55QuestionSemanticV1(question, preparedWithDose());
      expect(reading.annotations.filter(row => row.dimension === 'process'), question)
        .toEqual([expect.objectContaining({ sense, source: expect.objectContaining({ text }) })]);
      expect(reading.annotations.some(row => row.mentionKind === 'contextNote'), question).toBe(false);
    }
    const removal = 'Peut-on retirer 12,5 g de Citra sans perdre le floral ?';
    const core = readHopV55QuestionCoreV1(removal, preparedWithDose());
    expect(core.reading.operationDrafts).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'remove', quantity: { kind: 'partial', grams: 12.5 } })]));
    expect(readHopV55QuestionSemanticV1(removal, preparedWithDose()).annotations.some(row => row.source.text.includes('12,5'))).toBe(false);
  });
});


