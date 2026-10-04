import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceAnswerV3, assertHopPropertyAdviceRequestV3,
  type HopPropertyAdviceIntentV3, type HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceControllerV3, type HopV55PropertyAdviceHostV3 } from '../../src/services/hopV55/propertyAdviceControllerV3';

const ownerKey = 'owner:property-families-v3-fixture';
const workspaceId = 'workspace:property-families-v3-fixture';
const explicitNone = { kind: 'explicit' as const, materialIds: [], basis: 'Aucun candidat n’a été explicitement choisi pour cette épreuve.' };
const questionSource = 'work/houblons-v5-cadrage-2026-09-29/demandes-utilisateur.md';
const pageSource = readFileSync(resolve(process.cwd(), 'src/ui/hopV55/Page.tsx'), 'utf8');
const pageGateMatch = /const propertyAdviceV3Enabled = (true|false);/u.exec(pageSource);
if (!pageGateMatch) throw new Error('La déclaration du garde V3 n’est pas lisible dans Page.tsx.');
const pageV3GateEnabled = pageGateMatch[1] === 'true';

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

const familyCases = [
  { id: 'family-nolo', question: 'Pour ma bière NOLO, je cherche une expression aromatique, une faible amertume et un équilibre pertinent; est-ce que la biotransformation pourrait aider ?', mode: 'nolo' as const },
  { id: 'family-sour-unknown', question: 'Pour ma sour, je veux garder le goût acidulé et une faible amertume; ma culture est inconnue. La biotransformation peut-elle aider ?', mode: 'unknownCulture' as const },
  { id: 'family-house-hop', question: 'Mon houblon maison témoin a une odeur résineuse sur le houblon brut; je veux préserver le floral sans inventer son identité ni son analyse.', mode: 'planning' as const },
  { id: 'family-sour-mixed', question: 'Pour cette bière sour, je veux garder le goût acidulé et le floral. Est-ce que la biotransformation peut aider avec ma culture mixte ?', mode: 'sour' as const,
    culture: { state: 'mixed', members: [{ name: 'Culture A non résolue' }, { name: 'Culture B non résolue' }],
      explanation: 'Culture mixte synthétique; aucune proportion, identité ou viabilité renseignée.' } satisfies BrewingScenarioCultureContext },
];

const supplementalCases = [
  { id: 'profile-composed', question: 'Je vise un caractère floral intense, je veux exclure la résine et garder une amertume légère sans demander une hausse tropicale.', mode: 'planning' as const },
  { id: 'rattrapage-fermentation', question: 'La bière en fermentation est trop amère et végétale. Que puis-je encore corriger sur ce lot, puis que changer au prochain brassin ?', mode: 'fermenting' as const },
  { id: 'blend-floral-citrus', question: 'Je veux associer le floral au caractère citronné, tout en gardant l’amertume; quels compromis comparer ?', mode: 'planning' as const },
  { id: 'chemistry-sensory', question: 'Je veux garder le goût acidulé et comprendre si une mesure de pH suffit à décrire l’acidité ressentie.', mode: 'sour' as const },
];

const correctedQuestions = [
  { id: 'control-q07-amertume', question: originalQuestions[6].text.replace('amertum', 'amertume').replace('sapins', 'sapin') },
  { id: 'control-q08-relation', question: originalQuestions[7].text.replace('qui de Marie bien', 'qui se marie bien') },
  { id: 'control-q11-spelling', question: originalQuestions[10].text.replace('très fleural', 'très floral').replace('bio transformation', 'biotransformation') },
];

const q10Compensation = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
const q10CauseOnly = 'Ma bière est trop sucrée; pourquoi ?';
const q10SweetTarget = 'Je veux une bière avec une sensation sucrée.';

function makePrepared(mode: 'planning' | 'fermenting' | 'unknown' | 'unknownCulture' | 'nolo' | 'sour' = 'planning',
  options?: { varieties?: HopVariety[]; culture?: BrewingScenarioCultureContext }): PreparedBrewingScenarioContext {
  const context = makeHopV55FixtureContext(mode);
  if (options?.varieties && context.hopIndex) {
    context.hopIndex.varieties = [...new Map([...context.hopIndex.varieties, ...options.varieties].map(row => [row.id, row])).values()];
  }
  return prepareBrewingScenarioContext(context, options?.culture ? { culture: options.culture } : undefined);
}

function exactSpan(question: string, text: string) {
  const start = question.indexOf(text);
  if (start < 0 || question.indexOf(text, start + text.length) >= 0) throw new Error(`Fragment absent ou ambigu : ${text}`);
  return { start, end: start + text.length, text };
}

function runV3Case(input: { id: string; question: string; prepared: PreparedBrewingScenarioContext;
  candidatePolicy?: HopPropertyAdviceRequestV3['candidatePolicy']; propertyIntents?: readonly HopPropertyAdviceIntentV3[] }) {
  const reading = readHopV55Question(input.question, input.prepared);
  const routeEvidence = { v3GateEnabledAtSource: pageV3GateEnabled, readingFormat: 'hop-v55-decision-reading-v2',
    criterionCount: reading.criterionDrafts.length,
    operationCount: reading.operationDrafts?.length ?? 0, actionKind: reading.response?.actionKind ?? null,
    automaticV3RouteAtCheckout: pageV3GateEnabled && reading.criterionDrafts.length > 0 && !reading.operationDrafts?.length
      && reading.response?.actionKind !== 'understandProducts',
    explicitV3RouteAtCheckout: pageV3GateEnabled && reading.criterionDrafts.length > 0
      && reading.response?.actionKind !== 'understandProducts' };
  try {
    const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: input.prepared,
      requestId: `families-v3:${input.id}`, ownerKey, workspaceId, sourceReadingReference: `reading-v3:${input.id}`,
      candidatePolicy: input.candidatePolicy ?? explicitNone, ...(input.propertyIntents ? { propertyIntents: input.propertyIntents } : {}) });
    const answer = buildHopPropertyAdviceV3(draft.requestSnapshot);
    assertHopPropertyAdviceAnswerV3(answer);
    return { id: input.id, question: input.question, reading, routeEvidence, requestDraft: draft, answer };
  } catch (error) {
    return { id: input.id, question: input.question, reading, routeEvidence,
      preparationOrBuilderError: error instanceof Error ? error.message : String(error) };
  }
}

function q10TypedMeasurementProbe() {
  const question = `${q10Compensation} La mesure pH est 4,15 et la mesure BU est 18.`;
  const context = makePrepared('planning');
  const syntheticFacts = [
    { id: 'v3-measured-ph', field: 'beer.pH', status: 'observed' as const, origin: 'observation' as const, value: 4.15, unit: 'pH' },
    { id: 'v3-measured-bu', field: 'beer.amertume', status: 'observed' as const, origin: 'observation' as const, value: 18, unit: 'BU' },
  ];
  context.runtime.current!.beerContext!.facts.push(...syntheticFacts);
  const reading = readHopV55Question(question, context);
  const base = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context, requestId: 'families-v3:q10-r05-base',
    ownerKey, workspaceId, sourceReadingReference: 'reading-v3:q10-r05-base', candidatePolicy: explicitNone });
  const pHSpan = exactSpan(question, 'pH est 4,15');
  const buSpan = exactSpan(question, 'BU est 18');
  const measurements: HopPropertyAdviceIntentV3[] = [
    { id: 'v3-intent-measured-ph', property: 'acidity', label: pHSpan.text, role: 'measurement', direction: null,
      qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: ['context-v3-measured-ph'] }, metric: 'pH',
      subject: { kind: 'beer', label: 'Bière de fixture', materialId: null, sensoryContext: 'beer' }, sourceSpans: [pHSpan],
      interpretationOrigin: 'user', basis: 'Mesure pH synthétique, distincte du constat de sensation.', relatedIntentIds: [] },
    { id: 'v3-intent-measured-bu', property: 'bitterness', label: buSpan.text, role: 'measurement', direction: null,
      qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: ['context-v3-measured-bu'] }, metric: 'analyticalBU',
      subject: { kind: 'beer', label: 'Bière de fixture', materialId: null, sensoryContext: 'beer' }, sourceSpans: [buSpan],
      interpretationOrigin: 'user', basis: 'Mesure BU synthétique, distincte de l’amertume perçue.', relatedIntentIds: [] },
  ];
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context, requestId: 'families-v3:q10-r05',
    ownerKey, workspaceId, sourceReadingReference: 'reading-v3:q10-r05', candidatePolicy: explicitNone,
    propertyIntents: [...base.requestSnapshot.propertyIntents, ...measurements] });
  const answer = buildHopPropertyAdviceV3(draft.requestSnapshot);
  return { id: 'control-q10-r05-metrics', question, reading, requestDraft: draft, answer, syntheticFacts };
}

function q10ManualCauseOnly() {
  const prepared = makePrepared();
  const reading = readHopV55Question(q10CauseOnly, prepared);
  const base = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'families-v3:q10-cause-base',
    ownerKey, workspaceId, sourceReadingReference: 'reading-v3:q10-cause-base', candidatePolicy: explicitNone });
  const observation = base.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
  if (!observation) throw new Error('Le contrôle cause seule exige le constat sensoriel sucré.');
  const span = exactSpan(q10CauseOnly, 'pourquoi');
  const cause: HopPropertyAdviceIntentV3 = { id: 'manual-q10-cause-not-compensation', property: 'sweetness', label: span.text,
    role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' }, sourceSpans: [span],
    interpretationOrigin: 'user', basis: 'Question sur la cause, distincte d’une demande de compensation.', relatedIntentIds: [observation.id] };
  return runV3Case({ id: 'control-q10-cause-only', question: q10CauseOnly, prepared,
    propertyIntents: [...base.requestSnapshot.propertyIntents, cause] });
}

function q08ManualRelation() {
  const question = correctedQuestions.find(row => row.id === 'control-q08-relation')!.question;
  const prepared = makePrepared();
  const reading = readHopV55Question(question, prepared);
  const base = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'families-v3:q08-relation-base',
    ownerKey, workspaceId, sourceReadingReference: 'reading-v3:q08-relation-base', candidatePolicy: explicitNone });
  const banana = base.requestSnapshot.propertyIntents.find(intent => intent.label.toLocaleLowerCase('fr').includes('banane'));
  const target = base.requestSnapshot.propertyIntents.find(intent => intent.property === 'aroma' && intent.role === 'target');
  if (!banana || !target) throw new Error('Le contrôle relationnel exige une cible et un partenaire réellement relus.');
  const propertyIntents = base.requestSnapshot.propertyIntents.map(intent => intent.id === target.id ? {
    ...structuredClone(intent), interpretationOrigin: 'user' as const,
    basis: 'Relation d’accord confirmée explicitement avec l’intention partenaire sélectionnée.',
    relatedIntentIds: [...new Set([...intent.relatedIntentIds, banana.id])],
  } : structuredClone(intent));
  return runV3Case({ id: 'control-q08-manual-relation', question, prepared, propertyIntents });
}

function isTypedCompensation(intent: HopPropertyAdviceIntentV3 | undefined): boolean {
  return intent?.investigation?.kind === 'comparePerceptualCompensation';
}

async function candidateScopeCases() {
  const references = await loadBrewingCatalogueReferences();
  const sourceVarieties = [...references.varieties].filter(row => row.descriptions.length > 0)
    .sort((left, right) => left.id.localeCompare(right.id)).slice(0, 2);
  if (sourceVarieties.length < 2) throw new Error('Le catalogue local doit exposer deux variétés avec des descriptions sourcées pour ce contrôle.');
  const preparedWithLocalCatalogue = makePrepared('planning', { varieties: references.varieties });
  const question = 'Je veux plus de floral dans ma bière.';
  const explicitEmpty = runV3Case({ id: 'catalogue-real-explicit-empty', question, prepared: preparedWithLocalCatalogue, candidatePolicy: explicitNone });
  const loadedIds = sourceVarieties.map(row => `variety:${row.id}`);
  const absentId = 'variety:v3-family-candidate-not-loaded';
  const candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'] = { kind: 'discover',
    materialIds: [...loadedIds, absentId], basis: 'Recherche limitée aux deux identités locales choisies et à une identité demandée absente.' };
  const discovered = runV3Case({ id: 'catalogue-real-discover-bounded', question, prepared: preparedWithLocalCatalogue, candidatePolicy });
  return { source: 'loadBrewingCatalogueReferences() local bundled data only', sourceVarieties,
    explicitEmpty, discovered, candidatePolicy };
}

function archiveJsonBytes(outDir: string, basename: string, content: Buffer): { json: Buffer; sha256: string; archive: string } {
  const sha256 = createHash('sha256').update(content).digest('hex');
  const archive = resolve(outDir, `${basename}-${sha256}.json`);
  if (existsSync(archive)) {
    if (!readFileSync(archive).equals(content)) throw new Error(`Collision SHA inattendue pour ${basename}:${sha256}`);
  } else writeFileSync(archive, content);
  return { json: content, sha256, archive };
}

function archivedJson(outDir: string, basename: string, value: unknown) {
  return archiveJsonBytes(outDir, basename, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'));
}

describe('familles CONSEIL01 traversées par la chaîne V3', () => {
  it('construit et archive un artefact V3 complet sans écraser les captures V2', async () => {
    const originals = originalQuestions.map(row => runV3Case({ id: row.id, question: row.text,
      prepared: makePrepared(row.id === 'q09-neipa-yeast' ? 'unknownCulture' : 'planning') }));
    const families = familyCases.map(row => runV3Case({ id: row.id, question: row.question,
      prepared: makePrepared(row.mode, 'culture' in row ? { culture: row.culture } : undefined) }));
    const supplemental = supplementalCases.map(row => runV3Case({ id: row.id, question: row.question, prepared: makePrepared(row.mode) }));
    const q10Normalized = runV3Case({ id: 'control-q10-compensation', question: q10Compensation, prepared: makePrepared() });
    const q10Cause = runV3Case({ id: 'control-q10-cause-only', question: q10CauseOnly, prepared: makePrepared() });
    const q10Target = runV3Case({ id: 'control-q10-sweet-target', question: q10SweetTarget, prepared: makePrepared() });
    const q11Orthography = runV3Case({ id: 'control-q11-spelling', question: correctedQuestions.find(row => row.id === 'control-q11-spelling')!.question,
      prepared: makePrepared() });
    const q07Orthography = runV3Case({ id: 'control-q07-amertume', question: correctedQuestions.find(row => row.id === 'control-q07-amertume')!.question,
      prepared: makePrepared() });
    const q08Relation = q08ManualRelation();
    const q10ManualCause = q10ManualCauseOnly();
    const r05 = q10TypedMeasurementProbe();
    const catalogue = await candidateScopeCases();
    const artifact = {
      format: 'hop-v55-property-advice-families-v3-evidence-v1',
      createdFor: 'CONSEIL01 V3 local fixture evidence; no Page activation, production writes or external calls',
      provenance: { originalQuestions: questionSource, parser: 'src/services/hopV55/decision.ts::readHopV55Question',
        preparation: 'src/services/hopV55/propertyAdvicePreparationV3.ts::prepareHopV55PropertyAdviceRequestDraftV3',
        builder: 'src/domain/hopDecision/propertyAdvice.ts::buildHopPropertyAdviceV3',
        fixture: 'makeHopV55FixtureContext plus offline loadBrewingCatalogueReferences for the bounded discovery control',
        nativeRoute: `Page.tsx source literal propertyAdviceV3Enabled=${pageV3GateEnabled}; route fields are static code inspection, not browser evidence. The route requires criteria and excludes understandProducts; automatic routing also skips operation drafts.` },
      originals, families, supplemental,
      controls: { q10Normalized, q10Cause, q10Target, q10ManualCause, q11Orthography, q07Orthography, q08Relation, r05, catalogue },
    };
    const outDir = resolve(process.cwd(), 'work/houblons-v55-integration-app-2026-10-02/luna-catalogue-usage/property-families');
    mkdirSync(outDir, { recursive: true });
    const currentPath = resolve(outDir, 'family-evidence-v3.json');
    if (existsSync(currentPath)) archiveJsonBytes(outDir, 'family-evidence-v3', readFileSync(currentPath));
    const saved = archivedJson(outDir, 'family-evidence-v3', artifact);
    writeFileSync(currentPath, saved.json);
    writeFileSync(resolve(outDir, 'family-evidence-v3.current.sha256'), `${saved.sha256}  family-evidence-v3.json\n`, 'utf8');
    expect(originals).toHaveLength(11);
    expect(families).toHaveLength(4);
    expect(supplemental).toHaveLength(4);
    expect(catalogue.sourceVarieties).toHaveLength(2);
  });

  it('prépare Q10 comme constat + investigation perceptuelle typée, sans choisir un levier ou une cible', () => {
    const preparedContext = makePrepared();
    const reading = readHopV55Question(q10Compensation, preparedContext);
    const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: preparedContext,
      requestId: 'v3-q10-compensation-contract', ownerKey, workspaceId, sourceReadingReference: 'reading:v3-q10-compensation-contract',
      candidatePolicy: explicitNone });
    const request = draft.requestSnapshot;
    const observation = request.propertyIntents.find(intent => intent.role === 'reportedObservation' && intent.property === 'sweetness');
    const investigation = request.propertyIntents.find(isTypedCompensation);
    expect(observation).toMatchObject({ role: 'reportedObservation', property: 'sweetness', metric: 'sensory', direction: null,
      comparisonBasis: { kind: 'current', assertionIds: [] } });
    expect(investigation).toMatchObject({ role: 'investigation', direction: 'investigate', metric: 'sensory',
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation?.id] }, relatedIntentIds: [observation?.id] });
    expect(request.propertyIntents.some(intent => intent.role === 'target' || intent.direction === 'decrease' || intent.property === 'bitterness')).toBe(false);
    expect(request.candidatePolicy).toEqual(explicitNone);
    expect(request.interpretation.text).toContain('Constat rapporté');
    expect(request.interpretation.text).not.toMatch(/À réduire\s*:?\s*sucrée/iu);
    expect(() => assertHopPropertyAdviceRequestV3(request)).not.toThrow();
    const answer = buildHopPropertyAdviceV3(request);
    assertHopPropertyAdviceAnswerV3(answer);
    expect(answer.coverage.points.find(point => point.intentId === observation?.id)?.status).toBe('contextOnly');
    expect(answer.coverage.points.find(point => point.intentId === investigation?.id)?.status).toBe('answered');
    expect(answer.strategies.some(row => row.kind === 'sweetness-balance')).toBe(true);
    expect(answer.strategies.every(row => row.preparation.operational.status === 'notProvided')).toBe(true);

    const cause = runV3Case({ id: 'cause-only', question: q10CauseOnly, prepared: preparedContext });
    const target = runV3Case({ id: 'sweet-target-only', question: q10SweetTarget, prepared: preparedContext });
    for (const variant of [cause, target]) {
      if (!('requestDraft' in variant) || !('answer' in variant)) throw new Error('Le contrôle cause/cible doit atteindre V3.');
      expect(variant.requestDraft.requestSnapshot.propertyIntents.some(isTypedCompensation)).toBe(false);
      expect(variant.answer.strategies.some(row => row.kind.includes('sweetness-balance'))).toBe(false);
    }
  });

  it('R05 refuse les métriques analytiques sur l’investigation sans normaliser les mesures pH et BU distinctes', () => {
    const { requestDraft, answer } = q10TypedMeasurementProbe();
    const request = requestDraft.requestSnapshot;
    assertHopPropertyAdviceRequestV3(request);
    assertHopPropertyAdviceAnswerV3(answer);
    const investigation = request.propertyIntents.find(isTypedCompensation)!;
    expect(investigation.metric).toBe('sensory');
    expect(request.propertyIntents.find(intent => intent.id === 'v3-intent-measured-ph')).toMatchObject({
      role: 'measurement', property: 'acidity', metric: 'pH', comparisonBasis: { kind: 'current', assertionIds: ['context-v3-measured-ph'] },
    });
    expect(request.propertyIntents.find(intent => intent.id === 'v3-intent-measured-bu')).toMatchObject({
      role: 'measurement', property: 'bitterness', metric: 'analyticalBU', comparisonBasis: { kind: 'current', assertionIds: ['context-v3-measured-bu'] },
    });
    expect(request.context.assertions.find(assertion => assertion.id === 'context-v3-measured-ph')).toMatchObject({
      state: 'measured', value: 4.15, unit: 'pH', dimension: 'acidity',
    });
    expect(request.context.assertions.find(assertion => assertion.id === 'context-v3-measured-bu')).toMatchObject({
      state: 'measured', value: 18, unit: 'BU', dimension: 'other',
    });
    const unspecified = structuredClone(request);
    unspecified.propertyIntents.find(isTypedCompensation)!.metric = 'unspecified';
    expect(() => assertHopPropertyAdviceRequestV3(unspecified)).not.toThrow();
    expect(unspecified.propertyIntents.find(intent => intent.id === 'v3-intent-measured-ph')?.metric).toBe('pH');
    expect(unspecified.propertyIntents.find(intent => intent.id === 'v3-intent-measured-bu')?.metric).toBe('analyticalBU');
    for (const rejectedMetric of ['pH', 'analyticalBU', 'titratableAcidity'] as const) {
      const candidate = structuredClone(request);
      const typedQuestion = candidate.propertyIntents.find(isTypedCompensation)!;
      typedQuestion.metric = rejectedMetric;
      const before = structuredClone(candidate);
      expect(() => assertHopPropertyAdviceRequestV3(candidate), rejectedMetric).toThrow(/métrique sensory ou unspecified/u);
      expect(candidate).toEqual(before);
    }
  });

  it('garde le périmètre explicite vide fermé et discover borné à des références catalogue locales exactes', async () => {
    const catalogue = await loadBrewingCatalogueReferences();
    const sources = [...catalogue.varieties].filter(row => row.descriptions.length > 0)
      .sort((left, right) => left.id.localeCompare(right.id)).slice(0, 2);
    expect(sources).toHaveLength(2);
    const context = makePrepared('planning', { varieties: catalogue.varieties });
    const question = 'Je veux comparer les descriptions florales pour une bière.';
    const empty = runV3Case({ id: 'local-catalogue-explicit-empty', question, prepared: context, candidatePolicy: explicitNone });
    if (!('requestDraft' in empty) || !('answer' in empty)) throw new Error('Le cas de catalogue vide doit atteindre V3.');
    expect(empty.requestDraft.requestSnapshot.candidatePolicy).toEqual(explicitNone);
    expect(empty.requestDraft.requestSnapshot.materials).toEqual([]);
    expect(empty.answer.candidateAssessments).toEqual([]);

    const loadedIds = sources.map(row => `variety:${row.id}`);
    const missingId = 'variety:v3-family-candidate-not-loaded';
    const candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'] = { kind: 'discover', materialIds: [...loadedIds, missingId],
      basis: 'Deux identités provenant du catalogue local, plus une identité demandée absente.' };
    const scoped = runV3Case({ id: 'local-catalogue-discover-bounded', question, prepared: context, candidatePolicy });
    if (!('requestDraft' in scoped) || !('answer' in scoped)) throw new Error('La recherche bornée doit atteindre V3.');
    expect(scoped.requestDraft.requestSnapshot.candidatePolicy).toEqual(candidatePolicy);
    expect(scoped.requestDraft.requestSnapshot.materials.map(row => row.id).sort()).toEqual([...loadedIds].sort());
    expect(scoped.requestDraft.requestSnapshot.materials.every(row => row.variety?.descriptions.length)).toBe(true);
    expect(scoped.answer.candidateAssessments.map(row => row.materialId).sort()).toEqual([...candidatePolicy.materialIds].sort());
    expect(scoped.answer.candidateAssessments.find(row => row.materialId === missingId)).toMatchObject({ status: 'notLoaded' });
    expect(scoped.answer.strategies.flatMap(row => row.candidateIds).every(id => candidatePolicy.materialIds.includes(id))).toBe(true);
  });

  it('le controller refuse une invocation avec enabled=false avant toute lecture ou sauvegarde', async () => {
    const workspace = vi.fn(async () => { throw new Error('Le workspace ne doit pas être lu sous le garde fermé.'); });
    const context = vi.fn(async () => { throw new Error('Le contexte ne doit pas être lu sous le garde fermé.'); });
    const host: HopV55PropertyAdviceHostV3 = {
      services: { ownerKey, scope: 'fixture' }, enabled: () => false, historical: () => false, reading: () => undefined,
      context, workspace, save: vi.fn(), source: vi.fn(), runtimeReference: vi.fn(), selected: vi.fn(), activated: vi.fn(),
    };
    const controller = createHopV55PropertyAdviceControllerV3(host);
    await expect(controller.prepare(null as never, null as never)).rejects.toThrow(/attend sa réception/u);
    expect(workspace).not.toHaveBeenCalled();
    expect(context).not.toHaveBeenCalled();
    expect(host.save).not.toHaveBeenCalled();
  });

  it('conserve les non-réponses et les lacunes du parser sous V3 au lieu de les lisser par answered', () => {
    const originals = originalQuestions.map(row => runV3Case({ id: row.id, question: row.text,
      prepared: makePrepared(row.id === 'q09-neipa-yeast' ? 'unknownCulture' : 'planning') }));
    const byId = new Map(originals.map(row => [row.id, row]));
    const q02 = byId.get('q02-nugget-resin')!;
    const q09 = byId.get('q09-neipa-yeast')!;
    const q10 = byId.get('q10-pastry-stout')!;
    const q07 = byId.get('q07-high-bitterness-no-resin')!;
    const q08 = byId.get('q08-tropical-banana')!;
    const q11 = byId.get('q11-champagne')!;
    const nolo = runV3Case({ id: familyCases[0].id, question: familyCases[0].question, prepared: makePrepared('nolo') });
    const q07Normalized = runV3Case({ id: 'control-q07-amertume', question: correctedQuestions[0].question, prepared: makePrepared() });
    const q11Normalized = runV3Case({ id: 'control-q11-spelling', question: correctedQuestions[2].question, prepared: makePrepared() });

    const q02Intents = 'requestDraft' in q02 ? q02.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(q02Intents.find(intent => intent.label === 'résineux')?.role).toBe('investigation');
    const q07Intents = 'requestDraft' in q07 ? q07.requestDraft.requestSnapshot.propertyIntents : [];
    const highAmertume = q07Intents.find(intent => intent.sourceSpans.some(span => span.text === 'amertum'));
    expect.soft(highAmertume).toMatchObject({ property: 'bitterness', role: 'target', direction: 'increase',
      interpretationOrigin: 'proposal', sourceSpans: [expect.objectContaining({ text: 'amertum' })] });
    const q08Intents = 'requestDraft' in q08 ? q08.requestDraft.requestSnapshot.propertyIntents : [];
    const banana = q08Intents.find(intent => intent.sourceSpans.some(span => span.text === 'banane'));
    const tropicalTarget = q08Intents.find(intent => intent.property === 'aroma' && intent.role === 'target');
    expect.soft(tropicalTarget?.relatedIntentIds).toContain(banana?.id);
    expect.soft(tropicalTarget?.partner).toMatchObject({ kind: 'freeContext', text: 'mon goût de banane' });
    const q09Intents = 'requestDraft' in q09 ? q09.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(q09Intents.some(intent => intent.label.toLocaleLowerCase('fr') === 'neipa' && intent.role === 'target')).toBe(false);
    const q10Intents = 'requestDraft' in q10 ? q10.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(q10Intents.some(intent => intent.investigation?.kind === 'comparePerceptualCompensation')).toBe(true);
    const q11Intents = 'requestDraft' in q11 ? q11.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(q11Intents.some(intent => intent.label === 'particulier')).toBe(false);
    expect.soft(q11Intents.find(intent => intent.sourceSpans.some(span => span.text === 'fleural'))).toMatchObject({
      property: 'aroma', role: 'target', direction: 'increase', interpretationOrigin: 'proposal',
      sourceSpans: [expect.objectContaining({ text: 'fleural' })],
    });
    expect.soft(q11Intents.find(intent => intent.sourceSpans.some(span => span.text === 'bio transformation'))).toMatchObject({
      property: 'bioContribution', role: 'investigation', direction: 'investigate', interpretationOrigin: 'proposal',
      sourceSpans: [expect.objectContaining({ text: 'bio transformation' })],
    });
    const noloIntents = 'requestDraft' in nolo ? nolo.requestDraft.requestSnapshot.propertyIntents : [];
    expect.soft(noloIntents.some(intent => intent.property === 'aroma' && intent.role === 'target')).toBe(true);
    expect.soft(noloIntents.find(intent => intent.property === 'bitterness')).toMatchObject({
      role: 'target', direction: null, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
    });

    if (!('answer' in q07Normalized) || !('requestDraft' in q07Normalized)) throw new Error('Le témoin Q07 corrigé doit atteindre le builder V3.');
    const excludedResin = q07Normalized.requestDraft.requestSnapshot.propertyIntents.find(intent => intent.property === 'aroma' && intent.direction === 'exclude')!;
    const resinEffects = q07Normalized.answer.strategies.flatMap(row => row.effects).filter(effect => effect.intentId === excludedResin.id);
    expect(resinEffects.every(effect => effect.status !== 'hypothesis' && !/apport à examiner/u.test(effect.text))).toBe(true);

    if (!('answer' in q11Normalized) || !('requestDraft' in q11Normalized)) throw new Error('Le témoin Q11 corrigé doit atteindre le builder V3.');
    const sweet = q11Normalized.requestDraft.requestSnapshot.propertyIntents.find(intent => intent.property === 'sweetness')!;
    expect(q11Normalized.answer.coverage.points.find(point => point.intentId === sweet.id)?.status).not.toBe('answered');
    expect(q11Normalized.answer.strategies.flatMap(row => row.effects).filter(effect => effect.intentId === sweet.id)
      .every(effect => effect.status !== 'boundedSupport')).toBe(true);
  });
});
