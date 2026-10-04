import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrewerContext } from '../functions/src/companionTypes';
import type { HopVariety } from '../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../functions/src/hopPredictionSchema';
import { loadBrewingCatalogueReferences } from '../src/domain/brewingCatalogueReferences';
import { loadHopDecisionReferences } from '../src/domain/hopDecision/catalogue';
import { answerHopDecision } from '../src/domain/hopDecision/service';
import { evaluateHopIntentEvidence, listHopIntentEvidenceFamilies } from '../src/domain/hopDecision/intentEvidence';
import { prepareBrewingScenarioContext } from '../src/domain/brewingScenarioContext';
import { HOP_COMMERCIAL_PRODUCTS } from '../src/domain/hopDecision/products';
import type { HopDecisionMaterial } from '../src/domain/hopDecision/types';
import { makeHopV55FixtureContext, makeHopV55FixtureReferences, type HopV55FixtureMode } from '../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../src/services/hopV55/decision';
import type { BrewingScenarioCultureContext } from '../src/domain/brewingScenario';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, 'work/houblons-v55-integration-app-2026-10-02/luna-explorer/question-family-audit');
const sha256 = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const localSourcePaths = [
  'src/services/hopV55/decision.ts', 'src/domain/hopDecision/service.ts', 'src/domain/hopDecision/advice.ts',
  'src/domain/hopDecision/intentEvidence.ts', 'src/domain/hopDecision/adviceSchema.ts',
  'src/domain/hopDecision/catalogue.ts', 'src/domain/hopDecision/catalogueLoader.ts', 'src/domain/hopDecision/products.ts',
  'src/domain/brewingScenarioContext.ts', 'src/domain/brewingCatalogueReferences.ts',
  'functions/src/hopIndexSchema.ts', 'src/data/hopManufacturerBootstrap.json',
  'src/data/hopGuideVarietyBootstrap.json', 'src/data/hopStyleVarietyBootstrap.json',
  'src/data/hopStudyBootstrap.json', 'src/data/hopTrialBootstrap.json', 'src/data/hopPublicLotBootstrap.json',
  'src/data/hopKnowledgeBootstrap.json', 'src/data/hopDoseStudyBootstrap.json', 'src/data/hopTrialLegacyBootstrap.json',
  'src/data/hopExtrapolationBootstrap.json', 'src/data/hopExtrapolationLegacyBootstrap.json',
  'src/data/hopExtrapolationV4Bootstrap.json', 'src/data/hopSolverBootstrap.json',
  'src/data/fermentationGuideBootstrap.json', 'src/data/fermentationScienceBootstrap.json',
  'src/data/noloBootstrap.json', 'src/data/noloScenarioBootstrap.json', 'src/data/brewingStylesBootstrap.json',
  'src/data/yeastCatalogueBootstrap.json',
];
let catalogueVarieties: HopVariety[] = [];
let catalogueKnowledge: HopKnowledge[] = [];
type AuditedCase = ReturnType<typeof parseCase> & { productRouteContrast?: any; pairComparison?: any };

type HopProgramFixtureLine = { varietyId: string; grams: number; use: 'boil' | 'whirlpool' | 'fermentation' | 'postFermentation' };

function uniqueById<T extends { id: string }>(rows: readonly T[]): T[] {
  return [...new Map(rows.map(row => [row.id, structuredClone(row)])).values()];
}

function varietyById(rows: readonly HopVariety[], id: string): HopVariety {
  const row = rows.find(candidate => candidate.id === id);
  if (!row) throw new Error(`Identité de catalogue locale absente : ${id}`);
  return row;
}

function recipeStage(use: HopProgramFixtureLine['use']): 'boil' | 'dryHop' {
  return use === 'boil' ? 'boil' : 'dryHop';
}

function setFixtureProgram(context: BrewerContext, varieties: readonly HopVariety[], lines: HopProgramFixtureLine[]): void {
  if (!context.recipe) throw new Error('Le scénario de programme exige une recette de fixture locale.');
  const hops = lines.map((line, index) => {
    const variety = varietyById(varieties, line.varietyId);
    const sourceAlpha = variety.analysis.find(row => row.analyte === 'alpha' && row.kind === 'point' && row.unit === 'percentMass')?.value;
    return {
      name: variety.name,
      hopVarietyId: variety.id,
      // Recipe's legacy field is numeric. Zero here is only a fixture schema filler;
      // no Alpha measurement is asserted or passed to the documentary advice input.
      alpha: sourceAlpha ?? 0,
      weightG: line.grams,
      stage: recipeStage(line.use),
      ...(line.use === 'boil' ? { timeMin: 60 } : {
        dayOffset: 3,
        aromaTiming: line.use === 'fermentation' ? 'fermentation' as const : 'postFermentation' as const,
        aromaContactHours: 48,
        aromaTemperatureC: 14,
      }),
    };
  });
  context.recipe.hops = hops;
  context.recipe.notesCreation = `${context.recipe.notesCreation ?? ''} Audit local : lignes de programme synthétiques ${lines.map(line => `${line.grams} g / ${line.use}`).join(', ')}. Les analyses alpha absentes restent inconnues; le champ Recipe.alpha=0 est un remplissage historique.`;
  if (context.batch?.recipeSnapshot) context.batch.recipeSnapshot = structuredClone(context.recipe);
}

function makeAuditContext(input: {
  mode: HopV55FixtureMode;
  style?: string;
  lines?: HopProgramFixtureLine[];
  culture?: BrewingScenarioCultureContext;
  addHouseHop?: boolean;
}) {
  const context = makeHopV55FixtureContext(input.mode);
  const baseFixture = makeHopV55FixtureReferences();
  const varieties = uniqueById([...catalogueVarieties, ...baseFixture.varieties]);
  const knowledge = uniqueById([...catalogueKnowledge, ...baseFixture.knowledge]);
  if (input.addHouseHop) {
    const house: HopVariety = { id: 'audit-house-hop-unknown', name: 'Houblon maison témoin', aliases: ['lot maison témoin'],
      form: 'unknown', analysis: [], descriptions: [] };
    varieties.push(house);
  }
  context.hopIndex = {
    ...context.hopIndex,
    varieties,
    lots: [],
    knowledge,
    predictions: [],
    tastings: [],
    truncated: [],
  };
  if (input.style && context.recipe) context.recipe.style = input.style;
  if (input.lines) setFixtureProgram(context, varieties, input.lines);
  if (context.batch?.recipeSnapshot && context.recipe) context.batch.recipeSnapshot = structuredClone(context.recipe);
  const prepared = prepareBrewingScenarioContext(context, input.culture ? { culture: input.culture } : undefined);
  return { context, prepared };
}

function clipped(value: string, max = 220): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}

function contextSummary(context: BrewerContext, prepared: ReturnType<typeof prepareBrewingScenarioContext>) {
  const current = prepared.runtime.current;
  const materials = new Map(prepared.runtime.materials.map(row => [row.id, row.name]));
  return {
    source: context.batch?.id ? { kind: 'syntheticBatch', id: context.batch.id }
      : context.recipe?.id ? { kind: 'syntheticRecipe', id: context.recipe.id }
        : { kind: 'exploration' },
    styleTarget: context.recipe?.style ?? null,
    programStage: current?.program?.stage ?? null,
    programVolumeL: current?.program?.volumeL ?? null,
    additions: (current?.program?.additions ?? []).map(row => ({
      material: materials.get(row.materialId) ?? row.materialId, grams: row.grams, use: row.use,
      status: row.status, boilMinutes: row.boilMinutes, contactHours: row.contactHours,
    })),
    culture: current?.culture ? structuredClone(current.culture) : null,
    beerFacts: current?.beerContext?.facts.map(row => ({ field: row.field, status: row.status, value: row.value ?? null, unit: row.unit ?? null })) ?? [],
    noloInput: current?.input.aromaDomain === 'nolo' ? current.input.aromaContext ?? null : null,
    materialCount: prepared.runtime.materials.length,
    materialFormCounts: Object.fromEntries([...new Set(prepared.runtime.materials.map(row => row.form))]
      .map(form => [form, prepared.runtime.materials.filter(row => row.form === form).length])),
  };
}

function responseSummary(reading: HopV55QuestionReading, prepared: ReturnType<typeof prepareBrewingScenarioContext>) {
  const response = reading.response;
  const result = response?.result as any;
  const options: any[] = response?.actionKind === 'exploreStrategies' && Array.isArray(result?.options) ? result.options : [];
  const evidence = new Map((result?.evidenceSources ?? []).map((row: any) => [row.id, row]));
  const materialIds = new Set(prepared.runtime.materials.map(row => row.id));
  const additionIds = new Set((prepared.runtime.current?.program?.additions ?? []).map(row => row.id));
  const relevanceCounts = Object.fromEntries(['supportsCriteria', 'mixed', 'notAligned', 'conditional', 'unknown']
    .map(status => [status, options.filter(row => row.relevance === status).length]));
  const scopeCounts = Object.fromEntries(['none', 'removePlanned', 'addOrReplace'].map(kind => [kind,
    options.filter(row => row.programScope?.kind === kind).length]));
  const resolvedScopeOptions = options.filter(option => {
    const scope = option.programScope;
    if (scope?.kind === 'removePlanned') return scope.additionIds.length > 0 && scope.additionIds.every((id: string) => additionIds.has(id));
    if (scope?.kind === 'addOrReplace') return scope.materialIds.length > 0
      && scope.materialIds.every((id: string) => materialIds.has(id)) && scope.additionIds.every((id: string) => additionIds.has(id));
    return false;
  });
  const statuses = ['supportsCriteria', 'mixed', 'notAligned', 'conditional', 'unknown'];
  const representatives = statuses.flatMap(status => {
    const option = options.find(row => row.relevance === status);
    if (!option) return [];
    const criterionLabels = new Map(reading.intent.criteria.map(row => [row.id, row.label]));
    const evidenceIds = [...new Set([...(option.criterionEffects ?? []), ...(option.dimensionEffects ?? [])].flatMap((effect: any) => effect.evidenceIds ?? []))];
    return [{
      relevance: option.relevance,
      title: option.title,
      materialIds: option.materialIds,
      programScope: option.programScope,
      criteria: (option.criterionEffects ?? []).slice(0, 5).map((effect: any) => ({
        criterion: criterionLabels.get(effect.criterionId) ?? effect.criterionId,
        status: effect.status, reason: clipped(effect.reason), sourceCount: effect.evidenceIds?.length ?? 0,
      })),
      dimensionEffects: (option.dimensionEffects ?? []).slice(0, 3).map((effect: any) => ({
        dimension: effect.dimension, status: effect.status, statement: clipped(effect.statement), reason: clipped(effect.reason),
        criterionIds: effect.criterionIds,
      })),
      conditions: (option.conditions ?? []).slice(0, 4).map((value: string) => clipped(value)),
      nonConclusions: (option.nonConclusions ?? []).slice(0, 3).map((value: string) => clipped(value)),
      sources: evidenceIds.map(id => evidence.get(id)).filter(Boolean).slice(0, 4).map((row: any) => ({
        title: row.source.title, author: row.source.author, year: row.source.year,
        locator: row.locator, established: clipped(row.established), readingLevel: row.readingLevel,
      })),
    }];
  });
  const plannerPaths = response?.actionKind === 'planReplacement' ? (result?.plan?.paths ?? []).map((path: any) => ({
    kind: path.kind, status: path.status, applicability: path.applicability, complete: path.complete,
    assignments: path.assignments?.map((row: any) => ({ additionId: row.additionId, materialId: row.candidateMaterialId })),
  })) : [];
  return {
    actionKind: response?.actionKind ?? null,
    status: response?.status ?? null,
    answer: response?.answer ?? null,
    strategyOptionCount: options.length,
    relevanceCounts,
    programScopeCounts: scopeCounts,
    optionScopesWithExactRuntimeIds: resolvedScopeOptions.length,
    representatives,
    plannerPaths,
    branches: reading.branches.map(row => ({ label: row.label,
      changes: row.programChanges?.map(change => change.kind === 'append'
        ? { kind: change.kind, materialId: change.addition.materialId, grams: change.addition.grams, use: change.addition.use }
        : change.kind === 'replace' ? { kind: change.kind, additionId: change.additionId,
          additions: change.additions.map(addition => ({ materialId: addition.materialId, grams: addition.grams, use: addition.use })) }
          : { kind: change.kind, additionId: change.additionId }) ?? [] })),
    unresolved: [...new Set([...reading.unresolved, ...(response?.missingInformation ?? [])])].map(value => clipped(value, 260)).slice(0, 10),
    adviceCoverage: response?.actionKind === 'exploreStrategies' ? result?.coverage ? {
      status: result.coverage.status, considered: result.coverage.consideredMaterialIds.length,
      excluded: result.coverage.excludedMaterialIds.length, conditional: result.coverage.conditionalMaterials.length,
      omitted: result.coverage.omittedMaterials.length, limits: result.coverage.limits.slice(0, 3),
    } : null : null,
  };
}

function signature(reading: HopV55QuestionReading): string {
  const result = reading.response?.actionKind === 'exploreStrategies' ? reading.response.result as any : undefined;
  return JSON.stringify((result?.options ?? []).map((option: any) => ({
    title: option.title, materialIds: option.materialIds, relevance: option.relevance, scope: option.programScope,
    criteria: option.criterionEffects?.map((row: any) => [row.criterionId, row.status, row.reason]),
    dimensions: option.dimensionEffects?.map((row: any) => [row.dimension, row.status, row.criterionIds, row.statement]),
    conditions: option.conditions, nonConclusions: option.nonConclusions,
  })));
}

function parseCase(input: {
  id: string; family: string; question: string; mode: HopV55FixtureMode; style?: string;
  lines?: HopProgramFixtureLine[]; culture?: BrewingScenarioCultureContext; addHouseHop?: boolean;
}) {
  const { context, prepared } = makeAuditContext(input);
  const reading = readHopV55Question(input.question, prepared);
  return { id: input.id, family: input.family, question: input.question,
    context: contextSummary(context, prepared),
    intent: reading.intent.criteria.map(row => ({ label: row.label, direction: row.direction, familyId: row.familyId ?? null })),
    interpretation: reading.interpretation,
    response: responseSummary(reading, prepared),
    _reading: reading,
    _prepared: prepared,
  };
}

function markdownTable(rows: ReturnType<typeof parseCase>[]): string {
  const byId = new Map(rows.map(row => [row.id, row]));
  const groups = [
    { label: 'Remplacement (alias / nom exact)', ids: ['Q01-saaz-styrian', 'Q01-exact-record'], note: 'Les deux demandes restent sans critère et sans branche; les identités source/cible ne sont pas résolues.' },
    { label: 'Nugget · amertume / résine', ids: ['Q02-nugget-resine-stout'], note: 'Seul « résineux » est capté comme critère; l’ajout demande une dose positive et son unité.' },
    { label: 'Forme Cryo / HyperBoost', ids: ['Q03-formes-produits'], note: 'Question ordinaire non routée vers les produits. Le contraste `understandProducts` typé est documenté sous le tableau.' },
    { label: 'Opération composée · 20 g', ids: ['Q04-composed-20g', 'Q04-two-explicit-operations', 'Q04-single-move-counterexample'], note: 'Seul « déplacer 20 g de Saaz de l’ébullition vers le dry hop » produit une branche; elle est proposée, non appliquée.' },
    { label: 'Lager fruitée, amertume basse', ids: ['Q05-juicy-lager'], note: '« juicy / hyper aromatisée » n’est pas capté; « pas amère » est lu comme exclusion de l’amertume.' },
    { label: 'Résine / forte amertume / tropical', ids: ['Q07-guards', 'Q07-tropical-not-required'], note: 'La formulation originale investigue la résine (au lieu de l’exclure) et exclut le tropical. La reformulation non-requis/non-exclu garde encore amertume comme exclusion au lieu de la préserver.' },
    { label: 'Floral + poire · cible de style', ids: ['Q07-style-lager', 'Q07-style-stout'], note: 'Floral, poire et garde d’amertume sont lus; les signatures de sortie sont identiques quand seul le style cible passe de Lager à Stout.' },
    { label: 'Blanche tropicale / banane', ids: ['Q08-banana-tropical-white'], note: '« Tropicale » est l’unique critère; le goût de banane n’est pas distingué ici.' },
    { label: 'Pastry stout trop sucrée', ids: ['Q10-sweet-planning', 'Q10-sweet-fermenting'], note: '« sucrée » est lue comme baisse recherchée; aucun effet de critère n’est lié. Programme préparé différent : 20 g planifié vs 40 g effectué, donc la paire n’isole pas le stade.' },
    { label: 'Sour aux baies', ids: ['F-sour-planning'], note: 'Baies, acidité et amertume sont séparées; l’avis reste conditionnel et ne prédit pas le résultat de bière.' },
    { label: 'NOLO · fruité et amertume basse', ids: ['F-nolo'], note: 'Seule l’amertume est lue. Le contexte transmis porte `aromaDomain=nolo`, stade de référence, sans conseil distinct sur le fruité.' },
    { label: 'Biotransformation · culture inconnue / mixte', ids: ['F-culture-unknown', 'F-culture-mixed'], note: 'Unknown sans membre est comparé à mixed avec deux IDs de levure; la voie biologique reste conditionnelle et sans taux ni conversion prédits. Les signatures diffèrent.' },
    { label: 'Houblon maison sans données', ids: ['F-house-hop-unknown'], note: 'La fixture a forme inconnue, aucune description/analyse et aucun programme; aucune portée de ligne exacte.' },
    { label: 'Matière indisponible · nom / référence indirecte', ids: ['Q06-unavailable-planner', 'Q06-unavailable-exact-identities', 'Q06-unavailable-deictic'], note: 'Aucune des trois formulations ne lie l’indisponibilité à une ligne source unique; aucune branche de remplacement.' },
    { label: 'Bière de Champagne · objectifs composés', ids: ['Q11-champagne-profile'], note: 'Les quatre termes sont investigués; les directions florale, sucrée et amertume légère ne sont pas établies.' },
  ];
  const lines = [
    '| Famille / cas | Intention lue | Options et motif (exemple illustratif) | Portées exactes / branches | Inconnue ou limite observée |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const group of groups) {
    const selected = group.ids.map(id => byId.get(id)).filter((row): row is ReturnType<typeof parseCase> => Boolean(row));
    const intent = [...new Set(selected.flatMap(row => row.intent.map(item => `${item.direction} «${item.label}»${item.familyId ? ` [${item.familyId}]` : ''}`)))].join(', ') || 'aucun critère structuré';
    const responseStats = selected.map(row => {
      const shortId = row.id.replace(/^[^-]+-/, '');
      return `${shortId}: ${row.response.actionKind ?? 'aucune action'}, ${row.response.strategyOptionCount} options, ${row.response.branches.length} branche(s)`;
    }).join('<br>');
    const representative = selected.flatMap(row => row.response.representatives
      .filter(option => option.criteria.some(effect => effect.status === 'documentedSupport' || effect.status === 'documentedTension')))
      [0] ?? selected.flatMap(row => row.response.representatives)[0];
    const effect = representative?.criteria.find(item => item.status !== 'unknown') ?? representative?.criteria[0];
    const sample = representative
      ? `<br>Exemple [${representative.relevance}] «${clipped(representative.title, 48)}»${effect ? ` — ${effect.status}: ${clipped(effect.reason, 66)} (${effect.sourceCount} réf. du critère)` : ''}`
      : '';
    const responses = responseStats + sample;
    const exactScopes = selected.map(row => row.response.optionScopesWithExactRuntimeIds).join('/');
    const branch = selected.flatMap(row => row.response.branches)[0];
    const scopeSummary = `Options à portée runtime exacte : ${exactScopes || '0'} par cas; branches ${selected.map(row => row.response.branches.length).join('/')} (propositions non appliquées)`
      + (branch ? `<br>Branche exemple : ${clipped(branch.label, 58)}` : '');
    lines.push(`| ${group.label} | ${intent} | ${responses} | ${scopeSummary} | ${group.note} |`);
  }
  return lines.join('\n');
}

async function main() {
  const [references, localCatalogue] = await Promise.all([loadBrewingCatalogueReferences(), loadHopDecisionReferences()]);
  catalogueVarieties = references.varieties;
  catalogueKnowledge = references.knowledge;
  const allLocalVarieties = uniqueById(localCatalogue.varieties);
  const allMaterials = buildMaterials(allLocalVarieties, localCatalogue.lots);
  const fixtures = makeHopV55FixtureReferences();
  const fVariety = (id: string) => varietyById(references.varieties, id);
  const saaz = fVariety('hopsteiner-saz');
  const styrian = fVariety('hopsteiner-sgc');
  const nugget = fVariety('hopsteiner-nug');
  const citra = fVariety('ych-citra');
  const lines: HopProgramFixtureLine[] = [
    { varietyId: saaz.id, grams: 20, use: 'boil' },
    { varietyId: citra.id, grams: 30, use: 'postFermentation' },
  ];
  const cultureRows = references.knowledge.filter((row): row is Extract<HopKnowledge, { kind: 'yeast' }> => row.kind === 'yeast');
  const yeastUs05 = cultureRows.find(row => row.id === 'fermentis-us05');
  const yeastVerdant = cultureRows.find(row => row.id === 'lalbrew-verdant-ipa');
  const mixedCulture: BrewingScenarioCultureContext = { state: 'mixed', members: [
    ...(yeastUs05 ? [{ yeastId: yeastUs05.id }] : [{ name: 'Culture locale A' }]),
    ...(yeastVerdant ? [{ yeastId: yeastVerdant.id }] : [{ name: 'Culture locale B' }]),
  ], explanation: 'Contexte mixte de fixture; proportions, viabilité et résultat de bière inconnus.' };

  const cases: AuditedCase[] = [];
  cases.push(parseCase({ id: 'Q01-saaz-styrian', family: 'Remplacement, compromis documentaires',
    question: 'Qu’est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian gold ?', mode: 'planning', style: 'Lager claire',
    lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  cases.push(parseCase({ id: 'Q01-exact-record', family: 'Contre-exemple alias · identité explicitée',
    question: 'Qu’est-ce que je gagne dans ma light lager à remplacer Saazer par Styrian Golding (Celeia) ?', mode: 'planning', style: 'Lager claire',
    lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  cases.push(parseCase({ id: 'Q02-nugget-resine-stout', family: 'Amertume / conifère / garde',
    question: 'Dans ma stout, si j’amérise avec Nugget, est-ce trop résineux ou pas assez, et puis-je ajouter autre chose ?', mode: 'planning', style: 'Stout sèche',
    lines: [{ varietyId: nugget.id, grams: 20, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  const productQuestion = 'Pour mon dry-hop, puis-je remplacer 20 g de T-90 par Cryo Hops ou HyperBoost ?';
  const formCase = parseCase({ id: 'Q03-formes-produits', family: 'Forme / produit commercial', question: productQuestion,
    mode: 'planning', style: 'Blanche', lines });
  const directProductAnswer = answerHopDecision({ intent: { originalQuestion: productQuestion },
    action: { kind: 'understandProducts', productIds: ['ych-cryo-hops', 'ych-hyperboost'] },
    materials: formCase._prepared.runtime.materials, products: HOP_COMMERCIAL_PRODUCTS });
  const runtimeProductMentions = formCase._prepared.runtime.materials.filter(row => row.product).map(row => row.product!.id);
  const productFormResult = directProductAnswer.actionKind === 'understandProducts' ? directProductAnswer.result : null;
  (formCase as any).productRouteContrast = { productMaterialIdsInPreparedRuntime: runtimeProductMentions,
    directTypedService: productFormResult?.products.map(product => ({ id: product.id, name: product.name, form: product.form,
      uses: product.supportedUses, basis: product.replacement?.basis ?? null,
      ratio: product.replacement?.gramsPerGram ?? null, ratioUses: product.replacement?.uses ?? [],
      cautions: product.cautions, source: product.source.title })) ?? [] };
  cases.push(formCase);
  cases.push(parseCase({ id: 'Q04-composed-20g', family: 'Opération composée · 20 g côté moût et à froid',
    question: 'Est-ce que dans ma blanche je peux faire du dryhopping si j’ajoute 20g de moins dans le moût ?', mode: 'planning', style: 'Blanche',
    lines: [{ varietyId: saaz.id, grams: 40, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  cases.push(parseCase({ id: 'Q04-two-explicit-operations', family: 'Contre-exemple · deux gestes opératoires explicites',
    question: 'Dans ma blanche, retirer 20 g de Saaz à l’ébullition et ajouter 20 g de Saaz à froid.', mode: 'planning', style: 'Blanche',
    lines: [{ varietyId: saaz.id, grams: 40, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  cases.push(parseCase({ id: 'Q04-single-move-counterexample', family: 'Contre-exemple wording · geste composé exprimé comme déplacement',
    question: 'Dans ma blanche, déplacer 20 g de Saaz de l’ébullition vers le dry hop.', mode: 'planning', style: 'Blanche',
    lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }, { varietyId: citra.id, grams: 30, use: 'postFermentation' }] }));
  cases.push(parseCase({ id: 'Q05-juicy-lager', family: 'Fruit intense / garde d’amertume',
    question: 'Je voudrais une Lager ultra juicy, hyper aromatisée, sans qu’elle soit amère. J’ai quoi comme choix ?',
    mode: 'planning', style: 'Lager claire', lines }));
  cases.push(parseCase({ id: 'Q07-guards', family: 'Appuis, gardes et exclusions composées · formulation originale',
    question: 'Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d’amertume sans forcément le côté tropicale.',
    mode: 'planning', style: 'Pale ale sèche', lines }));
  cases.push(parseCase({ id: 'Q07-tropical-not-required', family: 'Contre-exemple wording · préférence non impérative',
    question: 'Je veux éviter pin et résine et garder une amertume élevée; le tropical est non requis et non exclu.',
    mode: 'planning', style: 'Pale ale sèche', lines }));
  const styleQuestion = 'Je cherche plus de floral et de poire, sans augmenter l’amertume.';
  const styleLager = parseCase({ id: 'Q07-style-lager', family: 'Contexte · cible de style Lager', question: styleQuestion,
    mode: 'planning', style: 'Lager claire', lines });
  const styleStout = parseCase({ id: 'Q07-style-stout', family: 'Contexte · cible de style Stout', question: styleQuestion,
    mode: 'planning', style: 'Stout sèche', lines });
  (styleLager as any).pairComparison = { optionSignatureEqual: signature(styleLager._reading) === signature(styleStout._reading),
    note: 'Même lecteur, matières et lignes fixture; seul le champ typé style.name change. Le style reste une cible déclarée, pas un multiplicateur.' };
  cases.push(styleLager, styleStout);
  cases.push(parseCase({ id: 'Q08-banana-tropical-white', family: 'Blanche tropicale / banane de levure',
    question: 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.',
    mode: 'unknownCulture', style: 'Blanche', lines }));

  const sweetnessQuestion = 'Ma pastry stout est trop sucrée, comment compenser ça avec le houblon ?';
  const sweetnessPlanning = parseCase({ id: 'Q10-sweet-planning', family: 'Sucrosité · avant brassage', question: sweetnessQuestion,
    mode: 'planning', style: 'Pastry stout', lines });
  const sweetnessFermenting = parseCase({ id: 'Q10-sweet-fermenting', family: 'Sucrosité · fermentation active', question: sweetnessQuestion,
    mode: 'fermenting', style: 'Pastry stout', lines });
  (sweetnessPlanning as any).pairComparison = { optionSignatureEqual: signature(sweetnessPlanning._reading) === signature(sweetnessFermenting._reading),
    note: 'Même question et mêmes lignes demandées à la fixture; le contexte préparé diffère aussi sur le programme : Saazer 20 g planifié vs 40 g effectué, ainsi que le stade. La différence de sortie ne peut donc pas être attribuée au seul stade.' };
  cases.push(sweetnessPlanning, sweetnessFermenting);

  const sourQuestion = 'Dans une sour aux fruits rouges, chercher les baies et préserver l’acidité sans augmenter l’amertume.';
  cases.push(parseCase({ id: 'F-sour-planning', family: 'Bière acide / fruits rouges', question: sourQuestion,
    mode: 'sour', style: 'Sour aux fruits rouges', lines }));
  cases.push(parseCase({ id: 'F-nolo', family: 'NOLO / corps / amertume',
    question: 'Dans une bière NOLO, quels leviers de houblon soutiennent le fruité et gardent l’amertume basse ?',
    mode: 'nolo', style: 'NOLO maltée', lines }));
  const bioQuestion = 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.';
  const unknownCulture = parseCase({ id: 'F-culture-unknown', family: 'Levure / transformation · culture inconnue', question: bioQuestion,
    mode: 'unknownCulture', style: 'NEIPA', lines });
  const mixedCultureCase = parseCase({ id: 'F-culture-mixed', family: 'Levure / transformation · culture mixte transmise', question: bioQuestion,
    mode: 'unknownCulture', style: 'NEIPA', lines, culture: mixedCulture });
  (unknownCulture as any).pairComparison = { optionSignatureEqual: signature(unknownCulture._reading) === signature(mixedCultureCase._reading),
    note: 'Même requête, matières et programme fixture; le contexte de culture passe de unknown sans membres à mixed avec deux identités de levures locales. Proportions, viabilité et résultat restent inconnus.' };
  cases.push(unknownCulture, mixedCultureCase);

  cases.push(parseCase({ id: 'F-house-hop-unknown', family: 'Houblon maison · analyse et source absentes',
    question: 'Mon houblon maison témoin sans analyse a une odeur résineuse; préserver le floral reste important.',
    mode: 'unknown', addHouseHop: true }));
  const unavailableQuestion = 'Saazer indisponible. La disponibilité du dernier lot de la source a été vérifiée et confirmée nulle. Dans le programme du lot de lager, remplacer par Styrian Golding (Celeia) à même masse et garder le floral.';
  cases.push(parseCase({ id: 'Q06-unavailable-planner', family: 'Matière indisponible · exact name and same-mass convention', question: unavailableQuestion,
    mode: 'planning', style: 'Lager claire', lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }] }));
  cases.push(parseCase({ id: 'Q06-unavailable-exact-identities', family: 'Contre-exemple · source et cible exactes, convention explicite',
    question: 'Saazer est indisponible. Ce constat vise seulement la ligne Saazer actuellement prévue. Aucune autre information d’achat n’est déclarée ici. Dans une variation séparée, remplacer cette ligne par Styrian Golding (Celeia) à même masse.',
    mode: 'planning', style: 'Lager claire', lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }] }));
  cases.push(parseCase({ id: 'Q06-unavailable-deictic', family: 'Matière indisponible · référence « ce houblon »',
    question: 'J’ai ce houblon conseillé dans ma recette mais je l’ai actuellement pas disponible, avec quoi le mettre. Qu’est-ce que je gagne ou perds ?',
    mode: 'planning', style: 'Lager claire', lines: [{ varietyId: saaz.id, grams: 20, use: 'boil' }] }));
  cases.push(parseCase({ id: 'Q11-champagne-profile', family: 'Style inédit / objectifs sensoriels composés',
    question: 'Je veux une bière de Champagne, sucrée, très florale, avec légère amertume. Est-ce que la biotransformation peut aider ?',
    mode: 'planning', style: 'Bière de Champagne · fixture', lines }));

  const contradictionCandidates: HopDecisionMaterial[] = localCatalogue.varieties.map(variety => ({
    id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety,
  }));
  const conflicts: Array<Record<string, unknown>> = [];
  const ambiguous: Array<Record<string, unknown>> = [];
  for (const candidate of contradictionCandidates) for (const family of listHopIntentEvidenceFamilies()) {
    const evaluation = evaluateHopIntentEvidence({ candidate, materials: allMaterials,
      criterion: { id: `audit:${family.id}`, description: family.name, role: 'seek', origin: 'user', familyId: family.id } });
    const polarities = new Set(evaluation.candidateEvidence.map(row => row.polarity));
    if (polarities.has('positiveMention') && polarities.has('explicitNegation')) conflicts.push({
      material: candidate.name, materialId: candidate.id, family: family.name, familyId: family.id,
      status: evaluation.status, quotes: evaluation.candidateEvidence.map(row => ({ quote: row.quote, context: row.context,
        polarity: row.polarity, source: row.source.title, reference: row.source.reference })),
    });
    else if (polarities.has('ambiguousMention')) ambiguous.push({ material: candidate.name, materialId: candidate.id,
      family: family.name, familyId: family.id,
      evidence: evaluation.candidateEvidence.filter(row => row.polarity === 'ambiguousMention').map(row => ({ quote: row.quote,
        context: row.context, source: row.source.title, reference: row.source.reference })) });
  }

  const forms = Object.fromEntries([...new Set(allMaterials.map(row => row.form))]
    .map(form => [form, allMaterials.filter(row => row.form === form).length]));
  const perVarietyForm = Object.fromEntries([...new Set(references.varieties.map(row => row.form))]
    .map(form => [form, references.varieties.filter(row => row.form === form).length]));
  const alphaSummary = cases.map(row => ({ ...row, _reading: undefined, _prepared: undefined }));

  const dataFiles = await Promise.all(localSourcePaths.map(async path => {
    const bytes = await readFile(resolve(root, path));
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  }));
  const report = {
    format: 'hop-v55-question-family-local-audit-v1',
    generatedAt: new Date().toISOString(),
    method: 'readHopV55Question calls the current local answerHopDecision with preparedBrewingScenarioContext, local bundled catalogues and local prediction knowledge. Direct understandProducts is contrasted as a separately invoked current service action. No network, Gemini, Firestore, StorageService or user record is used.',
    evidence: { localVarietyCount: references.varieties.length, localKnowledgeCount: references.knowledge.length,
      localPublicLotCount: localCatalogue.lots.length, localCommercialProductCount: HOP_COMMERCIAL_PRODUCTS.length,
      selectedLocalIdentities: [saaz, styrian, nugget, citra].map(row => ({ id: row.id, name: row.name, form: row.form,
        descriptions: row.descriptions.length, analyses: row.analysis.length })),
      curatedFamilyCount: listHopIntentEvidenceFamilies().length, offlineCatalogueMaterialCount: allMaterials.length,
      appPreparedMaterialCountSourceFree: cases.find(row => row.id === 'F-house-hop-unknown')?._prepared.runtime.materials.length ?? null,
      varietyForms: perVarietyForm, allMaterialForms: forms,
      readerRuntimeProductCount: cases.find(row => row.id === 'Q03-formes-produits')?.productRouteContrast?.productMaterialIdsInPreparedRuntime?.length ?? 0,
      sourceConflictScan: { candidateVarieties: contradictionCandidates.length, familiesPerCandidate: listHopIntentEvidenceFamilies().length,
        positiveAndExplicitNegativePairs: conflicts.length, ambiguousMentionRows: ambiguous.length,
        scope: 'Local variety descriptions scanned only against the 12 source-backed curated families; this cannot establish global absence of source conflicts.' },
      files: dataFiles },
    cases: alphaSummary,
    sourceConflicts: conflicts.slice(0, 20),
    ambiguousSourceMentions: ambiguous.slice(0, 20),
    productRouteContrast: cases.find(row => row.id === 'Q03-formes-produits')?.productRouteContrast ?? null,
    comparisons: {
      sugarStagePlanningVsFermenting: (sweetnessPlanning as any).pairComparison,
      styleTargetOnly: (styleLager as any).pairComparison,
      unknownVsMixedCulture: (unknownCulture as any).pairComparison,
    },
  };
  await mkdir(outputDirectory, { recursive: true });
  const json = JSON.stringify(report, null, 2);
  await writeFile(resolve(outputDirectory, 'audit.json'), json, 'utf8');
  const table = markdownTable(cases);
  const md = [
    '# Audit borné des familles de questions V5.5',
    '',
    'Cet essai utilise le lecteur `readHopV55Question`, qui appelle `answerHopDecision` localement, sur un catalogue hors ligne et des contextes explicitement synthétiques. Aucun Firebase, réseau ou modèle facturable n’est appelé. Les cas ne ferment pas la couverture globale; ils montrent les sorties exactes des propriétés éprouvées.',
    '',
    `Corpus : ${references.varieties.length} variétés (${JSON.stringify(perVarietyForm)}), ${references.knowledge.length} entrées de connaissance, ${localCatalogue.lots.length} lots publics hors ligne, ${HOP_COMMERCIAL_PRODUCTS.length} produits commerciaux typés, ${listHopIntentEvidenceFamilies().length} familles de lexique. Runtime préparé observé : ${cases[0]?.context.materialCount ?? 0} matières (${JSON.stringify(cases[0]?.context.materialFormCounts ?? {})}).`,
    '',
    table,
    '',
    '## Constats discriminants',
    '',
    `- **Produits commerciaux :** aucun produit n’est inclus dans les matériaux préparés pour le lecteur. Une invocation distincte et explicite d’` + '`understandProducts`' + ` retourne Cryo Hops® (ratio fabricant 0,4–0,5 selon les emplois énumérés) et HyperBoost® (0,008–0,01 limité à fermentation; whirlpool est listé sans ratio massique correspondant). Ces contrats restent séparés dans audit.json.`,
    `- **Sources contradictoires :** parmi ${contradictionCandidates.length} variétés et ${listHopIntentEvidenceFamilies().length} familles scannées, aucune paire locale n’a à la fois une mention positive et une négation explicite. Deux rapprochements restent ambigus (Citra/boisé-résineux; Mosaic/fruits à noyau). Ce corpus ne donne donc pas de contre-exemple réel pour valider un arbitrage entre sources contradictoires.`,
    `- **Styrian / Saazer :** le catalogue local identifie exactement Saazer (${saaz.id}) et Styrian Golding (Celeia) (${styrian.id}); le lecteur de question n’a toutefois pas produit de branche de remplacement avec ces noms dans ces formulations.`,
    '- **Portée des options :** les volumes affichés sont des nombres de stratégies retournées par le moteur; ce ne sont ni un score ni un classement. Le tableau montre au plus un exemple illustratif; audit.json conserve jusqu’à un représentant par statut de relation pour chaque cas.',
    '',
    '## Lacunes à prioriser',
    '',
    '1. Ajouter un raccord contrôlé question→produits Cryo/HyperBoost, en gardant les ratios limités à leur emploi/document fabricant.',
    '2. Traiter les demandes à plusieurs gestes et la direction « déplacer 20 g » sans perte du matériau, de la masse ou de l’emploi; refuser les formulations ambiguës avant d’offrir des options génériques.',
    '3. Revoir la direction des critères de garde (« sans forcément tropical », « forte amertume sans être amère ») et les termes périphériques captés (« dans », « côté », « qu »); les exemples ont des erreurs de direction ou des critères non reliés.',
    '4. Relier styles/NOLO/sucrosité et informations de culture aux sources/mesures adaptées, ou afficher clairement que ces faits n’apportent pas de preuve propre dans le conseil. La variation de style n’a pas changé les options dans la paire éprouvée.',
    '5. Pour remplacer une matière indisponible, ancrer la source dans une ligne exacte du programme et distinguer identité du lot, disponibilité déclarée, variété cible, forme, emploi et base de masse.',
    '6. La validation d’un vrai conflit entre sources reste ouverte : le scan n’a trouvé aucune paire source positive/négative, seulement deux mentions lexicalement ambiguës.',
    '',
    'Limites : contextes/programmes de test synthétiques et noms fixés pour rendre les cas reproductibles; aucun état de stock réel, lot utilisateur, dosage mesuré ni résultat de dégustation. Les matériaux moteur ne portent pas les formes commerciales. Les options représentatives sont des échantillons stratifiés par statut; le JSON n’énumère pas toutes les options, ne constitue pas un ranking ni un score produit.',
    '',
    'Le JSON contient les intentions, contextes, comptes d’options, portées exactes, branches proposées, inconnues, raisons/sources échantillonnées et empreintes des sources locales : `audit.json`.',
  ].join('\n');
  await writeFile(resolve(outputDirectory, 'report.md'), md, 'utf8');
  console.log(JSON.stringify({ status: 'completed', outputDirectory, cases: cases.length,
    varieties: references.varieties.length, knowledge: references.knowledge.length,
    publicLots: localCatalogue.lots.length, products: HOP_COMMERCIAL_PRODUCTS.length,
    sourceConflicts: conflicts.length, ambiguousSourceMentions: ambiguous.length }, null, 2));
}

function buildMaterials(varieties: HopVariety[], lots: Awaited<ReturnType<typeof loadHopDecisionReferences>>['lots']): HopDecisionMaterial[] {
  const varietyById = new Map(varieties.map(row => [row.id, row]));
  return [
    ...varieties.map(variety => ({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety })),
    ...lots.map(lot => ({ id: `lot:${lot.id}`, name: lot.name, form: lot.form, lot,
      ...(varietyById.has(lot.varietyId) ? { variety: varietyById.get(lot.varietyId)! } : {}) })),
  ];
}

function unique(values: readonly string[]): string[] { return [...new Set(values.filter(Boolean))]; }

main().catch(error => { console.error(error); process.exitCode = 1; });
