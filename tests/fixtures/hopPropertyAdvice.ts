import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildHopDecisionCatalogue } from '../../src/domain/hopDecision/catalogue';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { HopAdviceAssertion } from '../../src/domain/hopDecision/adviceSchema';
import {
  HOP_PROPERTY_ADVICE_REQUEST_VERSION,
  assertHopPropertyAdviceRequest,
  type HopPropertyAdviceIntent,
  type HopPropertyAdviceRequest,
} from '../../src/domain/hopDecision/propertyAdviceSchema';
import {
  prepareHopV55DocumentaryRequest,
  type HopV55DocumentaryRequestOverrides,
} from '../../src/services/hopV55/documentaryDecision';
import { makeHopV55FixtureContext, type HopV55FixtureMode } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';

const CANDIDATE_VARIETY_IDS = [
  'hopsteiner-ers', // Erebus: blueberry/citrus/candied fruit/floral rose
  'hopsteiner-cal', // Callista: apricot/passion fruit/red berries
  'hopsteiner-hs09326', // tropical fruit/berry jam/grapefruit/herbal
  'hopsteiner-ana', // Ariana: berries and explicit resinous descriptor
] as const;

type PropertyFixtureId =
  | 'aroma-intense-bitterness-low'
  | 'berries-acidity-bitterness'
  | 'floral-resin-bio-unknown'
  | 'floral-resin-bio-mixed'
  | 'floral-sweet-light-bitterness-bio'
  | 'too-sweet-planning'
  | 'too-sweet-fermenting'
  | 'house-hop-observation'
  | 'aroma-pairing';

interface FixtureSpec {
  id: PropertyFixtureId;
  question: string;
  mode: HopV55FixtureMode;
  style?: string;
  intents: Array<Omit<HopPropertyAdviceIntent, 'sourceSpans'> & { spanTexts: string[] }>;
  candidateIds?: string[];
  candidateBasis: string;
  culture?: BrewingScenarioCultureContext;
}

function uniqueById<T extends { id: string }>(rows: readonly T[]): T[] {
  return [...new Map(rows.map(row => [row.id, structuredClone(row)])).values()];
}

function spanFor(question: string, text: string): HopPropertyAdviceIntent['sourceSpans'][number] {
  const start = question.indexOf(text);
  if (start < 0 || question.indexOf(text, start + text.length) >= 0) {
    throw new Error(`Fragment fixture absent ou ambigu dans la question : « ${text} ».`);
  }
  return { start, end: start + text.length, text };
}

function intent(question: string, spec: FixtureSpec['intents'][number]): HopPropertyAdviceIntent {
  const { spanTexts, ...value } = spec;
  return { ...structuredClone(value), sourceSpans: spanTexts.map(text => spanFor(question, text)) };
}

function fixtureSpecs(mixedCulture: BrewingScenarioCultureContext): FixtureSpec[] {
  const targetBasis = 'Lecture de fixture corrigée à partir du libellé explicite; aucune valeur actuelle ou intensité n’est ajoutée.';
  const policyBasis = 'Périmètre explicite de quatre fiches variétales source-backed pour comparer les termes présents; ni preset de style ni sélection de remplacement.';
  const family = (id: string, label: string) => ({ id, label });

  return [
    {
      id: 'aroma-intense-bitterness-low',
      question: 'Je voudrais une Lager ultra juicy, hyper aromatisée, sans qu’elle soit amère. J’ai quoi comme choix ?',
      mode: 'planning', style: 'Lager claire',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('q05-juicy', 'juicy'), property: 'unresolved', role: 'investigation', direction: 'investigate',
          qualification: 'ultra', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
          metric: 'unspecified', subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['ultra juicy'], interpretationOrigin: 'fixture',
          basis: '« Juicy » reste le terme du brasseur; aucune famille floral/tropical ni propriété source-compatible n’est inventée.', relatedIntentIds: [] },
        { ...family('q05-aroma-intensity', 'hyper aromatisée'), property: 'aroma', role: 'target', direction: 'increase',
          qualification: 'hyper', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
          metric: 'sensory', subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['hyper aromatisée'], interpretationOrigin: 'fixture',
          basis: 'Demande qualitative d’arôme; aucune intensité, famille ou intensité finale n’est déduite.', relatedIntentIds: [] },
        { ...family('q05-bitterness-guard', 'sans qu’elle soit amère'), property: 'bitterness', role: 'constraint', direction: 'exclude',
          qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] },
          metric: 'sensory', subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['sans qu’elle soit amère'], interpretationOrigin: 'fixture',
          basis: 'Garde sensorielle explicite; ne devient ni une mesure IBU ni une préférence pour augmenter une autre propriété.', relatedIntentIds: [] },
      ]
    },
    {
      id: 'berries-acidity-bitterness',
      question: 'Dans une sour aux fruits rouges, chercher les baies et préserver l’acidité sans augmenter l’amertume.',
      mode: 'sour', style: 'Sour aux fruits rouges',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('sour-berries', 'baies'), property: 'aroma', familyId: 'berries', role: 'target', direction: 'increase',
          qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['chercher les baies'], interpretationOrigin: 'fixture', basis: targetBasis, relatedIntentIds: [] },
        { ...family('sour-acidity-guard', 'préserver l’acidité'), property: 'acidity', role: 'preference', direction: 'keep',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['préserver l’acidité'], interpretationOrigin: 'fixture',
          basis: 'Préservation du caractère acidulé demandé; pH et acidité titrable restent non déclarés.', relatedIntentIds: [] },
        { ...family('sour-bitterness-guard', 'sans augmenter l’amertume'), property: 'bitterness', role: 'constraint', direction: 'keep',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['sans augmenter l’amertume'], interpretationOrigin: 'fixture',
          basis: 'Garde de non-augmentation, distincte d’une mesure IBU ou d’une exclusion de toute amertume.', relatedIntentIds: [] },
      ]
    },
    {
      id: 'floral-resin-bio-unknown',
      question: 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.',
      mode: 'unknownCulture', style: 'NEIPA',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('unknown-bio-question', 'biotransformation des thiols'), property: 'bioContribution', role: 'investigation', direction: 'investigate',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: ['context-culture'] }, metric: 'unspecified',
          subject: { kind: 'culture', label: 'culture rapportée', materialId: null, sensoryContext: 'unspecified' },
          spanTexts: ['exploiter la biotransformation des thiols'], interpretationOrigin: 'fixture',
          basis: 'L’assertion liée donne seulement l’état de culture inconnu de la fixture; elle ne prouve activité, précurseur, viabilité ou résultat.', relatedIntentIds: [] },
        { ...family('unknown-floral-guard', 'préserver le floral'), property: 'aroma', familyId: 'floral', role: 'preference', direction: 'keep',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['préserver le floral'], interpretationOrigin: 'fixture', basis: targetBasis, relatedIntentIds: [] },
        { ...family('unknown-resin-exclusion', 'éviter la résine'), property: 'aroma', familyId: 'resin', role: 'constraint', direction: 'exclude',
          qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['éviter la résine'], interpretationOrigin: 'fixture',
          basis: 'Exclusion d’une famille explicitement nommée; les mentions sources restent des tensions documentaires, pas un défaut chimique.', relatedIntentIds: [] },
      ]
    },
    {
      id: 'floral-resin-bio-mixed',
      question: 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.',
      mode: 'unknownCulture', style: 'NEIPA', culture: mixedCulture,
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('mixed-bio-question', 'biotransformation des thiols'), property: 'bioContribution', role: 'investigation', direction: 'investigate',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: ['context-culture'] }, metric: 'unspecified',
          subject: { kind: 'culture', label: 'co-culture transmise dans la fixture', materialId: null, sensoryContext: 'unspecified' },
          spanTexts: ['exploiter la biotransformation des thiols'], interpretationOrigin: 'fixture',
          basis: 'L’assertion de fixture nomme les membres transmis sans proportions; viabilité au contact et résultat restent inconnus.', relatedIntentIds: [] },
        { ...family('mixed-floral-guard', 'préserver le floral'), property: 'aroma', familyId: 'floral', role: 'preference', direction: 'keep',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['préserver le floral'], interpretationOrigin: 'fixture', basis: targetBasis, relatedIntentIds: [] },
        { ...family('mixed-resin-exclusion', 'éviter la résine'), property: 'aroma', familyId: 'resin', role: 'constraint', direction: 'exclude',
          qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['éviter la résine'], interpretationOrigin: 'fixture',
          basis: 'Garde utilisateur distincte du constat inconnu sur l’expression en fermentation.', relatedIntentIds: [] },
      ]
    },
    {
      id: 'floral-sweet-light-bitterness-bio',
      question: 'Je veux une bière de Champagne, sucrée, très florale, avec légère amertume. Est-ce que la biotransformation peut aider ?',
      mode: 'unknownCulture', style: 'Bière de Champagne · fixture',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('champagne-sweet-target', 'sucrée'), property: 'sweetness', role: 'target', direction: 'increase',
          qualification: null, required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['sucrée'], interpretationOrigin: 'fixture',
          basis: 'Le wording « je veux » déclare une cible de perception; aucun sucre résiduel ni effet de houblon n’est inféré.', relatedIntentIds: [] },
        { ...family('champagne-floral-target', 'très florale'), property: 'aroma', familyId: 'floral', role: 'target', direction: 'increase',
          qualification: 'très', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['très florale'], interpretationOrigin: 'fixture', basis: targetBasis, relatedIntentIds: [] },
        { ...family('champagne-bitterness-target', 'légère amertume'), property: 'bitterness', role: 'target', direction: null,
          qualification: 'légère', required: true, comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['légère amertume'], interpretationOrigin: 'fixture',
          basis: 'Cible sensorielle qualitative, sans IBU ni seuil numérique.', relatedIntentIds: [] },
        { ...family('champagne-bio-question', 'biotransformation'), property: 'bioContribution', role: 'investigation', direction: 'investigate',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: ['context-culture'] }, metric: 'unspecified',
          subject: { kind: 'culture', label: 'culture de la recette non identifiée dans la demande', materialId: null, sensoryContext: 'unspecified' },
          spanTexts: ['biotransformation'], interpretationOrigin: 'fixture',
          basis: 'L’assertion liée conserve uniquement la culture inconnue de la fixture; aucune espèce, souche, activité ou gain aromatique n’est affirmé.', relatedIntentIds: [] },
      ]
    },
    {
      id: 'too-sweet-planning',
      question: 'Ma pastry stout est trop sucrée, comment compenser ça avec le houblon ?',
      mode: 'planning', style: 'Pastry stout', candidateIds: [],
      candidateBasis: 'Aucun candidat hop n’est automatiquement affecté à la sucrosité; la plainte reste une perception rapportée, sans mesure ni compensation promise.',
      intents: [
        { ...family('sweetness-complaint', 'trop sucrée'), property: 'sweetness', role: 'reportedObservation', direction: null,
          qualification: 'trop', required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['trop sucrée'], interpretationOrigin: 'fixture',
          basis: 'Plainte sensorielle du libellé; aucune mesure de sucre ni assertion de bière ajoutée au contexte.', relatedIntentIds: ['sweetness-compensation-question', 'sweetness-rebalance-proposal'] },
        { ...family('sweetness-compensation-question', 'compenser ça avec le houblon'), property: 'sweetness', role: 'investigation', direction: 'investigate',
          qualification: null, required: true, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['compenser ça avec le houblon'], interpretationOrigin: 'fixture',
          basis: 'Question distincte de la plainte, reliée à une lecture proposée et corrigible de rééquilibrage perceptif; aucune baisse du sucre n’est présumée.', relatedIntentIds: ['sweetness-complaint', 'sweetness-rebalance-proposal'] },
        { ...family('sweetness-rebalance-proposal', 'rééquilibrer la perception de douceur'), property: 'sweetness', role: 'target', direction: 'decrease',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['compenser ça avec le houblon'], interpretationOrigin: 'proposal',
          basis: 'Lecture proposée et corrigible de « compenser » : rechercher une baisse relative de la perception de douceur dans l’équilibre sensoriel. La base actuelle reste inconnue; aucune réduction du sucre n’est présumée.',
          relatedIntentIds: ['sweetness-complaint', 'sweetness-compensation-question'] },
      ]
    },
    {
      id: 'too-sweet-fermenting',
      question: 'Ma pastry stout est trop sucrée, comment compenser ça avec le houblon ?',
      mode: 'fermenting', style: 'Pastry stout', candidateIds: [],
      candidateBasis: 'Aucun candidat hop n’est automatiquement affecté à la sucrosité; la plainte reste une perception rapportée, sans mesure ni compensation promise.',
      intents: [
        { ...family('sweetness-complaint-fermenting', 'trop sucrée'), property: 'sweetness', role: 'reportedObservation', direction: null,
          qualification: 'trop', required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['trop sucrée'], interpretationOrigin: 'fixture',
          basis: 'Plainte sensorielle du libellé; assertions réelles de conduite uniquement selon la fixture fermenting.', relatedIntentIds: ['sweetness-compensation-question-fermenting', 'sweetness-rebalance-proposal-fermenting'] },
        { ...family('sweetness-compensation-question-fermenting', 'compenser ça avec le houblon'), property: 'sweetness', role: 'investigation', direction: 'investigate',
          qualification: null, required: true, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['compenser ça avec le houblon'], interpretationOrigin: 'fixture',
          basis: 'Question distincte de la plainte, reliée à une lecture proposée et corrigible de rééquilibrage perceptif; aucune baisse du sucre n’est présumée.', relatedIntentIds: ['sweetness-complaint-fermenting', 'sweetness-rebalance-proposal-fermenting'] },
        { ...family('sweetness-rebalance-proposal-fermenting', 'rééquilibrer la perception de douceur'), property: 'sweetness', role: 'target', direction: 'decrease',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière rapportée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['compenser ça avec le houblon'], interpretationOrigin: 'proposal',
          basis: 'Lecture proposée et corrigible de « compenser » : rechercher une baisse relative de la perception de douceur dans l’équilibre sensoriel. La base actuelle reste inconnue; aucune réduction du sucre n’est présumée.',
          relatedIntentIds: ['sweetness-complaint-fermenting', 'sweetness-compensation-question-fermenting'] },
      ]
    },
    {
      id: 'house-hop-observation',
      question: 'Mon houblon maison témoin sans analyse a une odeur résineuse; préserver le floral reste important.',
      mode: 'unknown',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('house-resin-observation', 'résineuse'), property: 'materialCharacter', familyId: 'resin', role: 'reportedObservation', direction: null,
          qualification: 'odeur', required: false, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'material', label: 'houblon maison témoin', materialId: null, sensoryContext: 'unspecified' },
          spanTexts: ['odeur résineuse'], interpretationOrigin: 'fixture',
          basis: 'Le draft conserve cette observation sans lien à un ID matière; le contexte rawHop/infusion/beer n’est pas précisé.', relatedIntentIds: [] },
        { ...family('house-floral-preference', 'préserver le floral'), property: 'aroma', familyId: 'floral', role: 'preference', direction: 'keep',
          qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['préserver le floral'], interpretationOrigin: 'fixture', basis: targetBasis, relatedIntentIds: [] },
      ]
    },
    {
      id: 'aroma-pairing',
      question: 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.',
      mode: 'unknownCulture', style: 'Blanche',
      candidateIds: CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`), candidateBasis: policyBasis,
      intents: [
        { ...family('pairing-tropical-banana', 'ultra tropicale'), property: 'aroma', familyId: 'tropical', role: 'target', direction: 'increase',
          partner: { kind: 'freeContext', text: 'mon goût de banane' }, qualification: 'ultra', required: true,
          comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
          subject: { kind: 'beer', label: 'bière visée', materialId: null, sensoryContext: 'beer' },
          spanTexts: ['ultra tropicale', 'se marie bien avec', 'mon goût de banane'], interpretationOrigin: 'fixture',
          basis: 'L’accord est une préférence de comparaison; le partenaire reste freeContext et aucun candidat n’est sélectionné.', relatedIntentIds: [] },
      ]
    },
  ];
}

function makeRequest(input: {
  id: PropertyFixtureId;
  question: string;
  intents: FixtureSpec['intents'];
  candidateIds: string[];
  candidateBasis: string;
  context: HopPropertyAdviceRequest['context'];
  materials: HopDecisionMaterial[];
}): HopPropertyAdviceRequest {
  return {
    format: HOP_PROPERTY_ADVICE_REQUEST_VERSION,
    id: `fixture-property-advice-${input.id}`,
    originalQuestion: input.question,
    interpretation: {
      id: `interpretation-${input.id}`,
      version: 'property-advice-fixture-1',
      text: `Lecture fixture corrigée par propriétés; le nom de style ne décide pas les propriétés ni les candidats.`,
      origin: 'proposal',
    },
    propertyIntents: input.intents.map(spec => intent(input.question, spec)),
    candidatePolicy: { kind: 'explicit', materialIds: [...input.candidateIds], basis: input.candidateBasis },
    context: structuredClone(input.context),
    exclusions: [],
    materials: structuredClone(input.materials),
  };
}

async function realCandidateMaterials(): Promise<{
  references: Awaited<ReturnType<typeof loadBrewingCatalogueReferences>>;
  materialIds: string[];
  materials: HopDecisionMaterial[];
}> {
  const references = await loadBrewingCatalogueReferences();
  const selected = new Set<string>(CANDIDATE_VARIETY_IDS);
  const varieties = references.varieties.filter(row => selected.has(row.id));
  const missing = CANDIDATE_VARIETY_IDS.filter(id => !varieties.some(row => row.id === id));
  if (missing.length) throw new Error(`Références catalogue de fixture absentes : ${missing.join(', ')}.`);
  const materials = buildHopDecisionCatalogue({ varieties });
  const materialIds = CANDIDATE_VARIETY_IDS.map(id => `variety:${id}`);
  if (materials.length !== materialIds.length || materialIds.some(id => !materials.some(row => row.id === id))) {
    throw new Error('La portée explicite des matériaux ne correspond pas aux références chargées.');
  }
  return { references, materialIds, materials };
}

async function preparedContext(input: {
  question: string;
  fixtureId: string;
  mode: HopV55FixtureMode;
  style?: string;
  culture?: BrewingScenarioCultureContext;
  assertions?: HopAdviceAssertion[];
  access?: HopV55DocumentaryRequestOverrides['access'];
}): Promise<HopPropertyAdviceRequest['context']> {
  const references = await loadBrewingCatalogueReferences();
  const missingCultureIds = input.culture?.members.flatMap(member => member.yeastId
    && !references.knowledge.some(row => row.kind === 'yeast' && row.id === member.yeastId) ? [member.yeastId] : []) ?? [];
  if (missingCultureIds.length) throw new Error(`Culture de fixture absente du catalogue de référence : ${missingCultureIds.join(', ')}.`);
  const context: BrewerContext = makeHopV55FixtureContext(input.mode);
  if (input.style && context.recipe) context.recipe.style = input.style;
  const varietyRows = [...(context.hopIndex?.varieties ?? []), ...references.varieties];
  const knowledgeRows = [...(context.hopIndex?.knowledge ?? []), ...references.knowledge];
  context.hopIndex = {
    ...context.hopIndex,
    varieties: uniqueById(varietyRows),
    lots: structuredClone(context.hopIndex?.lots ?? []),
    knowledge: uniqueById(knowledgeRows),
    predictions: structuredClone(context.hopIndex?.predictions ?? []),
    tastings: structuredClone(context.hopIndex?.tastings ?? []),
    truncated: structuredClone(context.hopIndex?.truncated ?? []),
  };
  const prepared = prepareBrewingScenarioContext(context, input.culture ? { culture: input.culture } : undefined);
  const reading = readHopV55Question(input.question, prepared);
  const overrides: HopV55DocumentaryRequestOverrides | undefined = input.assertions?.length || input.access
    ? { ...(input.assertions?.length ? { assertions: structuredClone(input.assertions) } : {}),
      ...(input.access ? { access: structuredClone(input.access) } : {}) }
    : undefined;
  const draft = prepareHopV55DocumentaryRequest({ reading, prepared,
    requestId: `context-${input.fixtureId}`, ownerKey: 'owner:property-advice-fixture',
    workspaceId: 'workspace:property-advice-fixture', sourceReadingReference: `reading:fixture:${input.fixtureId}`,
    ...(overrides ? { overrides } : {}) });
  // This is the existing fixture adapter's exact stage/access/source assertion projection.
  return structuredClone(draft.request.context);
}

/** Exact requests used as fixtures; they are corrected interpretations, not predictions of the future UI route. */
export async function makeHopPropertyAdviceFixtures(): Promise<Record<string, HopPropertyAdviceRequest>> {
  const { materials: allCandidateMaterials, materialIds: allCandidateIds } = await realCandidateMaterials();
  const requests: Record<string, HopPropertyAdviceRequest> = {};
  const specs = fixtureSpecs(createMixedCulture());

  for (const spec of specs) {
    const context = await preparedContext({ question: spec.question, fixtureId: spec.id, mode: spec.mode,
      style: spec.style, ...(spec.culture ? { culture: spec.culture } : {}) });
    const candidateIds = spec.candidateIds ?? [...allCandidateIds];
    const selectedMaterials = allCandidateMaterials.filter(material => candidateIds.includes(material.id));
    requests[spec.id] = makeRequest({ id: spec.id, question: spec.question, intents: spec.intents,
      candidateIds, candidateBasis: spec.candidateBasis, context, materials: selectedMaterials });
  }

  for (const [key, request] of Object.entries(requests)) {
    try { assertHopPropertyAdviceRequest(request); }
    catch (error) {
      throw new Error(`Fixture ${key} non conforme au contrat HopPropertyAdviceRequest : ${(error as Error).message}`);
    }
  }
  return requests;
}

function createMixedCulture(): BrewingScenarioCultureContext {
  return { state: 'mixed', members: [
    { yeastId: 'fermentis-us05' }, { yeastId: 'lalbrew-verdant-ipa' },
  ], explanation: 'Contexte mixte de fixture; proportions, viabilité et résultat restent inconnus.' };
}

/** Rebuilds source stage/assertions after changing a style/name token; properties and candidate scope stay exact. */
export async function makeHopPropertyAdviceNameVariant(
  request: HopPropertyAdviceRequest,
  fromName: string,
  toName: string,
  fixtureContext: {
    mode: HopV55FixtureMode;
    style?: string;
    culture?: BrewingScenarioCultureContext;
    access?: HopV55DocumentaryRequestOverrides['access'];
    assertions?: HopAdviceAssertion[];
  },
): Promise<HopPropertyAdviceRequest> {
  if (!fromName || !toName || fromName === toName) throw new Error('La variante de nom exige deux libellés distincts.');
  const start = request.originalQuestion.indexOf(fromName);
  if (start < 0 || request.originalQuestion.indexOf(fromName, start + fromName.length) >= 0) {
    throw new Error(`Nom fixture absent ou ambigu : « ${fromName} ».`);
  }
  const end = start + fromName.length;
  const nextQuestion = `${request.originalQuestion.slice(0, start)}${toName}${request.originalQuestion.slice(end)}`;
  const delta = toName.length - fromName.length;
  const propertyIntents = request.propertyIntents.map(row => ({ ...structuredClone(row), sourceSpans: row.sourceSpans.map(sourceSpan => {
    if (sourceSpan.start < end && sourceSpan.end > start) throw new Error('Le nom remplacé chevauche un fragment de propriété.');
    return sourceSpan.start >= end
      ? { ...sourceSpan, start: sourceSpan.start + delta, end: sourceSpan.end + delta }
      : { ...sourceSpan };
  }) }));
  const withName = { ...structuredClone(request), id: `${request.id}-name-variant`, originalQuestion: nextQuestion,
    interpretation: { ...structuredClone(request.interpretation), id: `${request.interpretation.id}-name-variant` }, propertyIntents };
  return makeHopPropertyAdviceStageAccessVariant(withName, { ...fixtureContext, style: fixtureContext.style ?? toName });
}

/** Rebuilds stage/assertions from a real local fixture; access stays unknown unless explicitly declared. */
export async function makeHopPropertyAdviceStageAccessVariant(
  request: HopPropertyAdviceRequest,
  input: {
    mode: HopV55FixtureMode;
    style?: string;
    culture?: BrewingScenarioCultureContext;
    access?: HopV55DocumentaryRequestOverrides['access'];
    assertions?: HopAdviceAssertion[];
  },
): Promise<HopPropertyAdviceRequest> {
  if (input.access && !input.assertions?.length) {
    const asserted = [input.access.bulkBeer, input.access.sampling, input.access.separatePortion]
      .some(access => access !== undefined && access.state !== 'unknown');
    if (asserted) throw new Error('Un accès yes/no de fixture exige son assertion source explicite.');
  }
  const context = await preparedContext({ question: request.originalQuestion, fixtureId: `${request.id}-${input.mode}`,
    mode: input.mode, style: input.style, ...(input.culture ? { culture: input.culture } : {}),
    ...(input.access ? { access: input.access } : {}), ...(input.assertions ? { assertions: input.assertions } : {}) });
  const variant = { ...structuredClone(request), id: `${request.id}-stage-${input.mode}`,
    interpretation: { ...structuredClone(request.interpretation), id: `${request.interpretation.id}-stage-${input.mode}` },
    context };
  assertHopPropertyAdviceRequest(variant);
  return variant;
}

/** Drops one source-backed description source while keeping the candidate identity loaded. */
export function makeHopPropertyAdviceSourceLossVariant(
  request: HopPropertyAdviceRequest,
  materialId: string,
  sourceReference: string,
): HopPropertyAdviceRequest {
  const material = request.materials.find(row => row.id === materialId);
  if (!request.candidatePolicy.materialIds.includes(materialId) || !material?.variety) {
    throw new Error(`Le candidat source à perdre n’est pas une variété explicitement chargée : ${materialId}.`);
  }
  const lostCount = material.variety.descriptions.filter(row => row.source.reference === sourceReference).length;
  if (!lostCount) throw new Error(`La source à perdre n’est pas présente sur le candidat ${materialId}.`);
  const materials = request.materials.map(row => row.id !== materialId ? structuredClone(row) : {
    ...structuredClone(row), variety: { ...structuredClone(row.variety!),
      descriptions: row.variety!.descriptions.filter(description => description.source.reference !== sourceReference) }
  });
  const variant = { ...structuredClone(request), id: `${request.id}-source-loss`,
    interpretation: { ...structuredClone(request.interpretation), id: `${request.interpretation.id}-source-loss` }, materials };
  assertHopPropertyAdviceRequest(variant);
  return variant;
}

/** Keeps the requested ID visible while modeling a locally absent candidate source. */
export function makeHopPropertyAdviceMissingCandidateVariant(
  request: HopPropertyAdviceRequest,
  materialId: string,
): HopPropertyAdviceRequest {
  if (!request.candidatePolicy.materialIds.includes(materialId)) {
    throw new Error(`Le candidat absent n’est pas dans la portée demandée : ${materialId}.`);
  }
  const variant = { ...structuredClone(request), id: `${request.id}-candidate-missing`,
    interpretation: { ...structuredClone(request.interpretation), id: `${request.interpretation.id}-candidate-missing` },
    materials: request.materials.filter(row => row.id !== materialId).map(row => structuredClone(row)) };
  assertHopPropertyAdviceRequest(variant);
  return variant;
}

/** Removes only the explicitly proposed target so the source observation/question cannot imply it by itself. */
export function makeHopPropertyAdviceWithoutProposedObjectiveVariant(
  request: HopPropertyAdviceRequest,
  targetIntentId: string,
): HopPropertyAdviceRequest {
  const target = request.propertyIntents.find(row => row.id === targetIntentId);
  if (!target || target.role !== 'target' || target.interpretationOrigin !== 'proposal') {
    throw new Error(`L’objectif à retirer doit exister et être une cible proposée : ${targetIntentId}.`);
  }
  const propertyIntents = request.propertyIntents.filter(row => row.id !== targetIntentId).map(row => ({
    ...structuredClone(row),
    relatedIntentIds: row.relatedIntentIds.filter(id => id !== targetIntentId),
    ...(row.role === 'investigation' && row.relatedIntentIds.includes(targetIntentId)
      ? { basis: 'La question reste une investigation distincte; sans objectif perceptif explicite, elle ne crée pas de correction automatique.' }
      : {}),
  }));
  const variant = {
    ...structuredClone(request), id: `${request.id}-without-${targetIntentId}`,
    interpretation: { ...structuredClone(request.interpretation), id: `${request.interpretation.id}-without-${targetIntentId}` },
    propertyIntents,
  };
  assertHopPropertyAdviceRequest(variant);
  return variant;
}
