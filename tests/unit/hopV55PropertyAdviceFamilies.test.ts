import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildHopPropertyAdvice } from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceAnswer, assertHopPropertyAdviceRequest, type HopPropertyAdviceIntent } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { prepareHopV55PropertyAdviceRequestDraft } from '../../src/services/hopV55/propertyAdvicePreparation';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';

const explicitNone = { kind: 'explicit' as const, materialIds: [], basis: 'Aucun candidat n’a été explicitement choisi pour cette épreuve.' };
const missingScope = { kind: 'discover' as const, materialIds: ['variety:not-loaded-in-fixture'], basis: 'Périmètre explicitement demandé; ID absent conservé.' };

const originalQuestions = [
  { id: 'q01-saaz-styrian', text: "Qu'est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian gold https://beermaverick.com/hop/styrian-golding/" },
  { id: 'q02-nugget-resin', text: "Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose." },
  { id: 'q03-hyperboost-cryo', text: 'Hyperboost, cryo hops...' },
  { id: 'q04-white-dry-hop', text: "Est-ce que dans ma blanche je peux faire du dryhopping ai j'ajoute 20g de moins dans le moût ?" },
  { id: 'q05-juicy-lager', text: "Je voudrais une Lager ultra juicy, hyper aromatisé, sans Quelle soit amère. J'ai quoi comme choix." },
  { id: 'q06-unavailable-hop', text: "J'ai ce houblons conseillé dans ma recette mais je l'ai actuellement pas disponible, avec quoi le mettre. Quesque je gagne perds." },
  { id: 'q07-high-bitterness-no-resin', text: "Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d'amertum sans forcément le côté tropicale." },
  { id: 'q08-tropical-banana', text: "Je veux une blanche ultra tropicale qui de Marie bien avec mon goût de banane." },
  { id: 'q09-neipa-yeast', text: 'Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa.' },
  { id: 'q10-pastry-stout', text: 'Ma patry stout est trop sucré comment compensé ça avec mon houblons.' },
  { id: 'q11-champagne', text: "J'ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucré, très fleural, légère amertume. Est-ce que la bio transformation peut m'aider là dedans." },
];

const familyQuestions = [
  { id: 'family-nolo', text: 'Pour ma bière NOLO, je cherche une expression aromatique, une faible amertume et un équilibre pertinent; est-ce que la biotransformation pourrait aider ?', mode: 'nolo' as const },
  { id: 'family-sour-unknown', text: 'Pour ma sour, je veux garder le goût acidulé et une faible amertume; ma culture est inconnue. La biotransformation peut-elle aider ?', mode: 'unknownCulture' as const },
  { id: 'family-house-hop', text: 'Mon houblon maison témoin a une odeur résineuse sur le houblon brut; je veux préserver le floral sans inventer son identité ni son analyse.', mode: 'planning' as const },
  { id: 'family-sour-mixed', text: 'Pour cette bière sour, je veux garder le goût acidulé et le floral. Est-ce que la biotransformation peut aider avec ma culture mixte ?', mode: 'sour' as const, culture: { state: 'mixed', members: [{ name: 'Culture A non résolue' }, { name: 'Culture B non résolue' }], explanation: 'Culture mixte synthétique; aucune proportion, identité ou viabilité renseignée.' } satisfies BrewingScenarioCultureContext },
];

const propertyControls = [
  { id: 'control-q07-amertume-typo-corrigee', text: originalQuestions[6].text.replace('amertum', 'amertume').replace('sapins', 'sapin') },
  { id: 'control-q08-accord-orthographe', text: originalQuestions[7].text.replace('qui de Marie bien', 'qui se marie bien') },
  { id: 'control-q11-orthographe', text: originalQuestions[10].text.replace('très fleural', 'très floral').replace('bio transformation', 'biotransformation') },
  { id: 'family-profile-composed', text: 'Je vise un caractère floral intense, je veux exclure la résine et garder une amertume légère sans demander une hausse tropicale.', mode: 'planning' as const },
  { id: 'family-rattrapage-fermentation', text: 'La bière en fermentation est trop amère et végétale. Que puis-je encore corriger sur ce lot, puis que changer au prochain brassin ?', mode: 'fermenting' as const },
  { id: 'family-blend-floral-citrus', text: 'Je veux associer le floral au caractère citronné, tout en gardant l’amertume; quels compromis comparer ?', mode: 'planning' as const },
  { id: 'family-chemistry-sensory', text: 'Je veux garder le goût acidulé et comprendre si une mesure de pH suffit à décrire l’acidité ressentie.', mode: 'sour' as const },
];

function exactSpan(question: string, text: string) {
  const start = question.indexOf(text);
  if (start < 0 || question.indexOf(text, start + text.length) >= 0) throw new Error(`Fragment absent ou ambigu dans la fixture : ${text}`);
  return { start, end: start + text.length, text };
}

function linkedBananaCorrection(intents: readonly HopPropertyAdviceIntent[]): readonly HopPropertyAdviceIntent[] {
  const banana = intents.find(intent => intent.label.toLocaleLowerCase('fr').includes('banane'));
  const aromaticTarget = intents.find(intent => intent.property === 'aroma' && intent.role === 'target');
  if (!banana || !aromaticTarget) throw new Error('Le témoin d’accord exige une cible et un partenaire réellement lus.');
  return intents.map(intent => intent.id !== aromaticTarget.id ? intent : ({ ...structuredClone(intent),
    interpretationOrigin: 'user', basis: 'Relation d’accord confirmée entre cette cible et l’intention partenaire choisie.',
    relatedIntentIds: [...new Set([...intent.relatedIntentIds, banana.id])],
  }));
}

function confirmQ11BiologyQuestion(intents: readonly HopPropertyAdviceIntent[], reading: ReturnType<typeof readHopV55Question>): readonly HopPropertyAdviceIntent[] {
  const span = exactSpan(reading.intent.question, 'biotransformation');
  const bio = intents.find(intent => intent.property === 'bioContribution' || intent.label.includes('biotransformation'));
  if (!bio || !bio.sourceSpans.some(source => source.start === span.start && source.end === span.end && source.text === span.text)) {
    throw new Error('Le témoin orthographique doit conserver le fragment bio exact comme intention corrigible.');
  }
  return intents.map(intent => intent.id === bio.id ? { ...structuredClone(intent), role: 'investigation', direction: 'investigate',
    interpretationOrigin: 'user', basis: 'Question biologique confirmée comme investigation; aucun fait d’effet n’est ajouté.' } : structuredClone(intent));
}

function evaluateQ11SpellingControl() {
  return evaluateCase({ ...propertyControls[2], correction: confirmQ11BiologyQuestion });
}

function evaluateQ07PropertyControl() {
  return evaluateCase(propertyControls[0]);
}

function evaluateQ10CompensationControl() {
  return evaluateCase({ id: 'control-q10-compensation-annotation', text: originalQuestions[9].text,
    correction: intents => compensationQuestionCorrection(originalQuestions[9].text, intents) });
}

function compensationQuestionCorrection(question: string, intents: readonly HopPropertyAdviceIntent[]): readonly HopPropertyAdviceIntent[] {
  const observation = intents.find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
  if (!observation) throw new Error('La correction exige de conserver le constat sucré existant.');
  const fragment = exactSpan(question, 'compensé ça');
  const investigation: HopPropertyAdviceIntent = {
    id: 'manual-q10-compensation-investigation', property: 'unresolved', label: fragment.text,
    role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
    subject: { kind: 'unspecified', label: 'Levier à examiner', materialId: null, sensoryContext: 'unspecified' },
    sourceSpans: [fragment], interpretationOrigin: 'user',
    basis: 'La compensation est une question distincte du constat; le levier reste à comparer, sans choisir l’amertume à l’avance.',
    relatedIntentIds: [observation.id],
  };
  return [...intents.map(intent => structuredClone(intent)), investigation];
}

function evaluateCase(input: { id: string; text: string; mode?: 'planning'|'fermenting'|'unknown'|'unknownCulture'|'nolo'|'sour';
  culture?: BrewingScenarioCultureContext; candidatePolicy?: typeof explicitNone | typeof missingScope;
  correction?: (intents: readonly HopPropertyAdviceIntent[], reading: ReturnType<typeof readHopV55Question>) => readonly HopPropertyAdviceIntent[] }) {
  const context = prepareBrewingScenarioContext(makeHopV55FixtureContext(input.mode ?? 'planning'), input.culture ? { culture: input.culture } : undefined);
  const reading = readHopV55Question(input.text, context);
  try {
    const base = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context,
      requestId: `families:${input.id}`, ownerKey: 'owner:property-families-fixture', workspaceId: 'workspace:property-families-fixture',
      sourceReadingReference: `reading:${input.id}`, candidatePolicy: input.candidatePolicy ?? explicitNone });
    const draft = input.correction ? prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context,
      requestId: `families:${input.id}`, ownerKey: 'owner:property-families-fixture', workspaceId: 'workspace:property-families-fixture',
      sourceReadingReference: `reading:${input.id}`, candidatePolicy: input.candidatePolicy ?? explicitNone,
      propertyIntents: input.correction(base.requestSnapshot.propertyIntents, reading) }) : base;
    assertHopPropertyAdviceRequest(draft.requestSnapshot);
    const answer = buildHopPropertyAdvice(draft.requestSnapshot);
    assertHopPropertyAdviceAnswer(answer);
    return { id: input.id, question: input.text, stage: draft.requestSnapshot.context.stage,
      reading, requestDraft: draft, answer, annotationCorrection: input.correction ? 'explicit typed correction via prepare API' : null,
      routeEvidence: { propertyAdviceEnabled: false, hasCriteria: reading.criterionDrafts.length > 0,
        operationDraftCount: reading.operationDrafts?.length ?? 0, actionKind: reading.response?.actionKind ?? null,
        automaticV2EligibleIfActivated: reading.criterionDrafts.length > 0
          && !reading.operationDrafts?.length && reading.response?.actionKind !== 'understandProducts' } };
  } catch (error) {
    return { id: input.id, question: input.text, stage: context.runtime.current?.program.stage ?? 'unknown',
      reading, preparationError: error instanceof Error ? error.message : String(error),
      routeEvidence: { propertyAdviceEnabled: false, hasCriteria: reading.criterionDrafts.length > 0,
        operationDraftCount: reading.operationDrafts?.length ?? 0, actionKind: reading.response?.actionKind ?? null,
        automaticV2EligibleIfActivated: reading.criterionDrafts.length > 0
          && !reading.operationDrafts?.length && reading.response?.actionKind !== 'understandProducts' } };
  }
}

function measurementCase(input: { id: string; question: string; field: string; value: number; unit: string;
  metric: HopPropertyAdviceIntent['metric']; property: HopPropertyAdviceIntent['property']; dimension?: 'acidity' | 'other' }) {
  const context = prepareBrewingScenarioContext(makeHopV55FixtureContext('sour'));
  const reading = readHopV55Question(input.question, context);
  const source = reading.criterionDrafts[0]?.source;
  if (!source) throw new Error(`La lecture fixture ${input.id} n’a pas de fragment source à corriger.`);
  const fixtureFactId = `fixture-${input.id}`;
  context.runtime.current!.beerContext!.facts.push({ id: fixtureFactId, field: input.field, status: 'observed',
    origin: 'observation', value: input.value, unit: input.unit });
  const base = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context, requestId: `families:${input.id}`,
    ownerKey: 'owner:property-families-fixture', workspaceId: 'workspace:property-families-fixture',
    sourceReadingReference: `reading:${input.id}`, candidatePolicy: explicitNone });
  const targetIntent = base.requestSnapshot.propertyIntents.find(row => row.id === reading.criterionDrafts[0].id)!;
  const intent: HopPropertyAdviceIntent = {
    ...structuredClone(targetIntent), property: input.property, label: source.text,
    role: 'measurement', direction: null, qualification: null, required: true,
    comparisonBasis: { kind: 'current', assertionIds: [`context-${fixtureFactId}`] }, metric: input.metric,
    subject: { kind: 'beer', label: 'Bière synthétique de mesure', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [structuredClone(source)], interpretationOrigin: 'user',
    basis: 'Correction utilisateur d’une fixture de mesure explicitement synthétique.', relatedIntentIds: [],
  };
  const draft = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: context, requestId: `families:${input.id}`,
    ownerKey: 'owner:property-families-fixture', workspaceId: 'workspace:property-families-fixture',
    sourceReadingReference: `reading:${input.id}`, candidatePolicy: explicitNone,
    propertyIntents: base.requestSnapshot.propertyIntents.map(row => row.id === intent.id ? intent : row) });
  let answer: unknown;
  let builderError: string | undefined;
  try { answer = buildHopPropertyAdvice(draft.requestSnapshot); }
  catch (error) { builderError = error instanceof Error ? error.message : String(error); }
  return { id: input.id, purpose: 'Mesure synthétique de fixture; valeurs créées uniquement pour exercer les gardes de qualification.',
    question: input.question, reading, requestDraft: draft, ...(answer ? { answer } : {}), ...(builderError ? { builderError } : {}) };
}

const measurements = [
  { id: 'measure-ph', question: 'Je garde l’acidité de la bière; le pH mesuré est 4,1.', field: 'beer.pH', value: 4.1, unit: 'pH', metric: 'pH' as const, property: 'acidity' as const, dimension: 'acidity' as const },
  { id: 'measure-bu', question: 'Je garde l’amertume de la bière; la mesure analytique est 18 BU.', field: 'beer.amertume', value: 18, unit: 'BU', metric: 'analyticalBU' as const, property: 'bitterness' as const, dimension: 'other' as const },
  { id: 'measure-ta', question: 'Je garde l’acidité de la bière; une valeur brute est 4 g/L.', field: 'beer.acidity', value: 4, unit: 'g/L', metric: 'titratableAcidity' as const, property: 'acidity' as const, dimension: 'acidity' as const },
  { id: 'measure-sensory', question: 'Je garde le caractère floral de la bière; une note fixture est 3 sur 5.', field: 'beer.floral', value: 3, unit: 'points', metric: 'sensory' as const, property: 'aroma' as const },
  { id: 'measure-unspecified', question: 'Je garde l’amertume de la bière; une valeur fixture est 18 unités.', field: 'beer.amertume', value: 18, unit: 'unités', metric: 'unspecified' as const, property: 'bitterness' as const, dimension: 'other' as const },
];

describe('familles de demandes originales traversées par le conseil V2', () => {
  it('archive par empreinte SHA puis produit les questions originales, familles et témoins contrôlés', () => {
    const cases = [...originalQuestions.map(q => evaluateCase({ ...q, mode: q.id === 'q09-neipa-yeast' ? 'unknownCulture' : 'planning' as const })),
      ...familyQuestions.map(q => evaluateCase({ ...q, candidatePolicy: q.id === 'family-house-hop' ? missingScope : explicitNone }))];
    const controls = [
      evaluateCase(propertyControls[0]),
      evaluateCase({ ...propertyControls[1], correction: linkedBananaCorrection }),
      evaluateQ11SpellingControl(),
      evaluateQ10CompensationControl(),
      ...propertyControls.slice(3).map(row => evaluateCase(row)),
    ];
    const measurementResults = measurements.map(measurementCase);
    const artifact = {
      format: 'hop-v55-property-advice-family-evidence-v1',
      createdFor: 'CONSEIL01 fixture audit; no page activation and no production writes',
      provenance: { originalQuestions: 'Verbatim source text excerpts from work/houblons-v5-cadrage-2026-09-29/demandes-utilisateur.md; question inventory cross-checked against docs/prompts/refonte-houblons-v5-recap.md',
        parser: 'src/services/hopV55/decision.ts::readHopV55Question', preparation: 'src/services/hopV55/propertyAdvicePreparation.ts::prepareHopV55PropertyAdviceRequestDraft',
        builder: 'src/domain/hopDecision/propertyAdvice.ts::buildHopPropertyAdvice', fixture: 'makeHopV55FixtureContext; in-memory prepared contexts only',
        nativeRoute: 'src/ui/hopV55/Page.tsx: propertyAdviceEnabled=false; if activated, route requires criterionDrafts and excludes operationDrafts and understandProducts.' },
      cases, propertyControls: controls, measurements: measurementResults,
    };
    const outDir = resolve(process.cwd(), 'work/houblons-v55-integration-app-2026-10-02/luna-catalogue-usage/property-families');
    mkdirSync(outDir, { recursive: true });
    const currentPath = resolve(outDir, 'family-evidence.json');
    const archiveByDigest = (content: Buffer) => {
      const digest = createHash('sha256').update(content).digest('hex');
      const archivePath = resolve(outDir, `family-evidence-${digest}.json`);
      if (existsSync(archivePath)) {
        if (!readFileSync(archivePath).equals(content)) throw new Error(`Collision d’archive SHA inattendue : ${digest}`);
      } else writeFileSync(archivePath, content);
      return digest;
    };
    if (existsSync(currentPath)) archiveByDigest(readFileSync(currentPath));
    const nextContent = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
    const nextDigest = archiveByDigest(nextContent);
    writeFileSync(currentPath, nextContent);
    writeFileSync(resolve(outDir, 'family-evidence.current.sha256'), `${nextDigest}  family-evidence.json\n`, 'utf8');
    expect(cases).toHaveLength(15);
    expect(controls).toHaveLength(8);
    expect(cases.every(row => row.reading.criterionDrafts.length > 0 || 'preparationError' in row)).toBe(true);
    expect(measurementResults).toHaveLength(5);
  });

  it('distingue une cible de douceur d’un excès rapporté et conserve la cible qualitative d’amertume légère', () => {
    const q10 = evaluateCase(originalQuestions[9]);
    const q11 = evaluateCase(originalQuestions[10]);
    const q05 = evaluateCase(originalQuestions[4]);
    const pastry = 'requestDraft' in q10 ? q10.requestDraft.requestSnapshot.propertyIntents.find(row => row.property === 'sweetness') : undefined;
    const champagne = 'requestDraft' in q11 ? q11.requestDraft.requestSnapshot.propertyIntents.find(row => row.property === 'sweetness') : undefined;
    const lightBitterness = 'requestDraft' in q11 ? q11.requestDraft.requestSnapshot.propertyIntents.find(row => row.property === 'bitterness') : undefined;
    expect(pastry).toMatchObject({ role: 'reportedObservation', direction: null, comparisonBasis: { kind: 'current', assertionIds: [] } });
    expect(champagne).toMatchObject({ role: 'target', direction: null, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(lightBitterness).toMatchObject({ role: 'target', direction: null, qualification: 'légère', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect('requestDraft' in q05 && q05.requestDraft.requestSnapshot.candidatePolicy).toEqual(explicitNone);
    expect('requestDraft' in q05 && q05.requestDraft.requestSnapshot.materials).toEqual([]);
    // A reported excess alone does not turn into a requested bitterness intervention.
    expect('requestDraft' in q10 && q10.requestDraft.requestSnapshot.propertyIntents.some(row => row.property === 'bitterness')).toBe(false);
  });

  it('refuse de présenter les preuves générées comme couverture des objectifs et relations qui manquent', () => {
    const q03 = evaluateCase(originalQuestions[2]);
    const q08 = evaluateCase(originalQuestions[7]);
    const q08Control = evaluateCase({ ...propertyControls[1], correction: linkedBananaCorrection });
    const q09 = evaluateCase({ ...originalQuestions[8], mode: 'unknownCulture' });
    const q10 = evaluateCase(originalQuestions[9]);
    const q11 = evaluateCase(originalQuestions[10]);
    const q11Control = evaluateQ11SpellingControl();
    const q10Control = evaluateQ10CompensationControl();
    const qNolo = evaluateCase(familyQuestions[0]);
    const q07Control = evaluateQ07PropertyControl();
    const qHouse = evaluateCase({ ...familyQuestions[2], candidatePolicy: missingScope });
    expect.soft('requestDraft' in q03).toBe(false); // Fragment « HyperBoost, Cryo Hops… » sans objectif ni geste formulé.
    const linked = 'requestDraft' in q08Control ? q08Control.requestDraft.requestSnapshot.propertyIntents : [];
    const banana = linked.find(row => row.label.toLocaleLowerCase('fr').includes('banane'));
    const floralTarget = linked.find(row => row.property === 'aroma' && row.role === 'target');
    expect(banana).toBeDefined();
    expect(floralTarget?.relatedIntentIds).toContain(banana?.id);
    expect('requestDraft' in q08).toBe(true);
    const q08Snapshot = 'requestDraft' in q08 ? q08.requestDraft.requestSnapshot : undefined;
    const q08Banana = q08Snapshot?.propertyIntents.find(row => row.label.toLocaleLowerCase('fr').includes('banane'));
    expect(q08Banana).toBeDefined();
    expect(floralTarget?.partner).toMatchObject({ kind: 'freeContext', text: 'mon goût de banane' });
    expect(floralTarget?.relatedIntentIds).toContain(q08Banana?.id);
    const neipa = 'requestDraft' in q09 ? q09.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(neipa.some(row => row.label.toLocaleLowerCase('fr') === 'neipa' && row.role === 'target')).toBe(false);
    const pastry = 'requestDraft' in q10 ? q10.requestDraft.requestSnapshot.propertyIntents : [];
    const sweetnessObservation = pastry.find(row => row.property === 'sweetness' && row.role === 'reportedObservation');
    expect.soft(pastry.some(row => row.role === 'investigation' && sweetnessObservation
      && row.relatedIntentIds.includes(sweetnessObservation.id))).toBe(true);
    const correctedCompensation = 'requestDraft' in q10Control ? q10Control.requestDraft.requestSnapshot.propertyIntents : [];
    const correctedObservation = correctedCompensation.find(row => row.property === 'sweetness' && row.role === 'reportedObservation');
    const compensationQuestion = correctedCompensation.find(row => row.id === 'manual-q10-compensation-investigation');
    expect(correctedCompensation.some(row => row.property === 'bitterness')).toBe(false);
    expect(correctedObservation).toBeDefined();
    expect(compensationQuestion).toMatchObject({ property: 'unresolved', direction: 'investigate', interpretationOrigin: 'user' });
    expect(compensationQuestion?.relatedIntentIds).toEqual([correctedObservation!.id]);
    expect(compensationQuestion).not.toHaveProperty('investigation'); // V2 keeps its own DTO; typed comparePerceptualCompensation is V3-only.
    const nugget = evaluateCase(originalQuestions[1]);
    const resinConcern = 'requestDraft' in nugget ? nugget.requestDraft.requestSnapshot.propertyIntents.find(row => row.label === 'résineux') : undefined;
    expect.soft(resinConcern?.role).not.toBe('reportedObservation');
    const champagne = 'requestDraft' in q11 ? q11.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(champagne.some(row => row.label === 'particulier')).toBe(false);
    const correctedChampagne = 'requestDraft' in q11Control ? q11Control.requestDraft.requestSnapshot.propertyIntents : [];
    const sugarId = correctedChampagne.find(intent => intent.property === 'sweetness')?.id;
    const sugarCoverage = 'answer' in q11Control
      ? q11Control.answer.coverage.points.find(row => row.intentId === sugarId)
      : undefined;
    expect.soft(sugarCoverage?.status).not.toBe('answered');
    const q11SweetEffects = 'answer' in q11Control ? q11Control.answer.strategies.flatMap(row => row.effects)
      .filter(effect => effect.intentId === sugarId) : [];
    expect.soft(q11SweetEffects.every(effect => effect.status !== 'boundedSupport')).toBe(true);
    const nolo = 'requestDraft' in qNolo ? qNolo.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(nolo.some(row => row.property === 'aroma' && row.role === 'target')).toBe(true);
    expect.soft(nolo.find(row => row.property === 'bitterness')).toMatchObject({
      role: 'target', direction: null, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
    });
    const resinExclusion = 'requestDraft' in q07Control ? q07Control.requestDraft.requestSnapshot.propertyIntents.find(row => row.label === 'résine') : undefined;
    const resinEffects = 'answer' in q07Control && resinExclusion ? q07Control.answer.strategies.flatMap(row => row.effects)
      .filter(effect => effect.intentId === resinExclusion.id) : [];
    expect.soft(resinExclusion).toMatchObject({ property: 'aroma', role: 'constraint', direction: 'exclude' });
    expect.soft(resinEffects.every(effect => effect.status !== 'hypothesis' && !/apport à examiner/u.test(effect.text))).toBe(true);
    const sourUnknown = evaluateCase(familyQuestions[1]);
    const sourUnknownTexts = 'answer' in sourUnknown ? sourUnknown.answer.strategies.flatMap(row => row.effects.map(effect => effect.text)) : [];
    expect.soft(sourUnknownTexts.some(text => text.includes('conduite d’acidification déclarée'))).toBe(false);
    const house = 'requestDraft' in qHouse ? qHouse.requestDraft.requestSnapshot : undefined;
    expect.soft(house?.propertyIntents.find(row => row.property === 'materialCharacter')).toMatchObject({
      role: 'reportedObservation', direction: null, subject: { kind: 'material', materialId: null, sensoryContext: 'rawHop' },
    });
    expect.soft(house?.candidatePolicy).toEqual(missingScope);
    expect.soft('answer' in qHouse && qHouse.answer.candidateAssessments).toMatchObject([
      { materialId: 'variety:not-loaded-in-fixture', status: 'notLoaded' },
    ]);
  });

  it('préserve culture unknown/mixed et n’assimile pas acidulé à un pH', () => {
    const unknown = evaluateCase(familyQuestions[1]);
    const mixed = evaluateCase(familyQuestions[3]);
    const unknownRequest = 'requestDraft' in unknown ? unknown.requestDraft.requestSnapshot : undefined;
    const mixedRequest = 'requestDraft' in mixed ? mixed.requestDraft.requestSnapshot : undefined;
    expect(unknownRequest?.context.assertions.find(row => row.id === 'context-culture')).toMatchObject({ state: 'unknown', value: null });
    expect(mixedRequest?.context.assertions.find(row => row.id === 'context-culture')).toMatchObject({
      state: 'reported', value: expect.stringContaining('Culture A non résolue'),
    });
    expect(mixedRequest?.context.assertions.find(row => row.id === 'context-culture')?.value).toContain('Culture B non résolue');
    const acid = unknownRequest?.propertyIntents.find(row => row.property === 'acidity');
    expect(acid).toMatchObject({ metric: 'sensory', subject: { kind: 'beer' }, comparisonBasis: { kind: 'current', assertionIds: [] } });
    expect(acid?.metric).not.toBe('pH');
    expect(mixedRequest?.propertyIntents.some(row => row.property === 'bioContribution' && row.role === 'investigation')).toBe(true);
  });

  it('qualifie seulement un fait unique compatible pour pH/BU et refuse les métriques incomplètes', () => {
    const results = measurements.map(measurementCase);
    const pH = results[0]; const bu = results[1]; const unsupported = results.slice(2);
    expect(() => assertHopPropertyAdviceRequest(pH.requestDraft.requestSnapshot)).not.toThrow();
    expect(() => assertHopPropertyAdviceRequest(bu.requestDraft.requestSnapshot)).not.toThrow();
    expect(pH.requestDraft.requestSnapshot.context.assertions.find(row => row.id === 'context-fixture-measure-ph'))
      .toMatchObject({ state: 'measured', value: 4.1, unit: 'pH', dimension: 'acidity' });
    expect(bu.requestDraft.requestSnapshot.context.assertions.find(row => row.id === 'context-fixture-measure-bu'))
      .toMatchObject({ state: 'measured', value: 18, unit: 'BU', dimension: 'other' });
    expect(unsupported.every(row => typeof row.builderError === 'string')).toBe(true);
    expect(unsupported.map(row => row.requestDraft.requestSnapshot.propertyIntents[0].metric))
      .toEqual(['titratableAcidity', 'sensory', 'unspecified']);
    const rawFixtures: Record<string, { value: number; unit: string }> = {
      'measure-ta': { value: 4, unit: 'g/L' },
      'measure-sensory': { value: 3, unit: 'points' },
      'measure-unspecified': { value: 18, unit: 'unités' },
    };
    for (const row of unsupported) {
      const fact = row.requestDraft.requestSnapshot.context.assertions.find(assertion => assertion.id === `context-fixture-${row.id}`);
      expect(fact).toMatchObject({ state: 'measured', ...rawFixtures[row.id] });
    }
  });

  it('relie les effets et compromis à toutes les intentions actives sans créer de résultat quantifié', () => {
    const q11 = evaluateQ11SpellingControl();
    if (!('answer' in q11) || !('requestDraft' in q11)) throw new Error('La fixture Q11 n’a pas atteint le builder canonique.');
    const activeIds = q11.requestDraft.requestSnapshot.propertyIntents.filter(row => row.role !== 'reportedObservation' && row.role !== 'measurement')
      .map(row => row.id);
    for (const strategy of q11.answer.strategies) {
      expect(strategy.effects.map(row => row.intentId)).toEqual(activeIds);
      expect(strategy.tradeoffs.every(row => row.intentIds.every(id => activeIds.includes(id)))).toBe(true);
      expect(strategy.preparation.operational.status).toBe('notProvided');
    }
    expect(q11.answer.strategies.flatMap(row => row.effects).some(row => /\b\d+(?:[.,]\d+)?\s*(?:g|g\/l|ibu|bu|%|°c|jours?)\b/iu.test(row.text))).toBe(false);
    expect(q11.answer.requestSnapshot.propertyIntents.find(row => row.property === 'sweetness'))
      .not.toHaveProperty('value');
  });
});
