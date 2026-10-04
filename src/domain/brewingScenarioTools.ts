import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import { assertBrewingScenarioRequest, assertBrewingScenarioResult, buildBrewingScenarioRequest, simulateBrewingScenario,
  brewingScenarioCurrentReference, type BrewingScenarioResult } from './brewingScenario';
import { prepareBrewingScenarioContext } from './brewingScenarioContext';
import { usableHopKnowledge } from '../../functions/src/hopPredictionCore';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

const names = ['describe_brewing_scenario', 'prepare_brewing_scenario', 'simulate_brewing_scenarios'] as const;
const declaration = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  name, description, parameters: { type: 'OBJECT', properties, required }
});
export const brewingScenarioToolDeclarations = [
  declaration('describe_brewing_scenario', 'Lire le contrat du simulateur partagé : scénarios complets, hypothèses sélectionnées/proposées, analogies et facettes biologiques distinctes. Aucun calcul ni enregistrement.'),
  declaration('prepare_brewing_scenario', 'Préparer une requête depuis la recette ET le journal réels, leurs références courantes et les modèles disponibles. Les hypothèses des modèles sont consultables et modifiables. Sans recette, fournir explicitement un inputJson hypothétique; cela ne crée pas de recette.', {
    scenarioId: { type: 'STRING', description: 'Identifiant stable de cette lignée de scénarios, choisi pour le travail.' },
    revision: { type: 'INTEGER', description: 'Version du résultat souhaitée, 1 pour commencer.' },
    inputJson: { type: 'STRING', description: 'Facultatif : HopRecipeInput JSON explicitement hypothétique (volumeL, yeastId, additions, fermentation); aucun fait de la recette n’est réécrit.' }
  }, ['scenarioId', 'revision']),
  declaration('simulate_brewing_scenarios', 'Calculer et comparer un programme entier et ses branches, y compris combinaisons inédites sous hypothèses explicites. Utiliser le request de prepare_brewing_scenario puis ajouter branches/assumptions; les données de catalogue et modèles viennent du runtime, pas du JSON. Plages conditionnelles et sensibilités, pas mesures ni intervalles statistiques. Retour complet identique à l’entrée métier UI, sans application de recette.', {
    requestJson: { type: 'STRING', description: 'Requête JSON brewing-scenario-v1. Chaque entrée modifiée est liée à une hypothèse selected; consulter describe_brewing_scenario. Conserver les références fournies par prepare pour une recette réelle.' }
  }, ['requestJson'])
];
export const isBrewingScenarioTool = (name: string) => (names as readonly string[]).includes(name);

export function describeBrewingScenario() {
  return {
    version: 'brewing-scenario-v1',
    requestFields: ['version', 'scenarioId', 'revision', 'baseline', 'target?', 'assumptions', 'branches'],
    branchFields: ['id', 'label', 'inputOverrides?', 'programOverrides?', 'programChanges?', 'materials?', 'assumptions', 'analogies?', 'modelOverrides?', 'biologicalInputs?', 'culture?'],
    assumption: { id: 'stable-assumption-id', path: 'additions.<additionId>.doseGL', label: 'Dose explorée',
      origin: 'assistantHypothesis', status: 'selected', value: 4, unit: 'g/L', explanation: 'Exemple fictif de paramètre proposé, à adapter à la demande.' },
    assumptionOrigins: ['userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'analogy', 'sourceRange', 'catalogue', 'observation', 'calculation'],
    inputOverrides: { additions: [{ additionId: '<id fourni dans currentInput>', triplet: { doseGL: 4 } }] },
    modelOverrides: [{ modelId: '<id chargé>', parameter: { kind: 'matrix' }, assumptionId: '<hypothèse sélectionnée avec path model.matrix et plage/central>' }],
    analogies: [
      { kind: 'hopDescriptions', targetVarietyId: '<variété exacte>', referenceVarietyId: '<analogue exact>', assumptionId: '<motif sélectionné>', explanation: '<propriétés transférées, ressemblances, différences et limites>' },
      { kind: 'yeastProfile', targetYeastId: '<souche exacte>', referenceYeastId: '<analogue exact>', assumptionId: '<motif sélectionné>', explanation: '<propriétés transférées, ressemblances, différences et limites>' }
    ],
    biologicalFacets: ['yeastOwnProducts', 'hopPrecursorTransformation', 'compoundTransferLoss'],
    culture: { state: 'single | mixed | unknown', members: [{ yeastId: '<id si connu>', name: '<nom si fourni>', proportion: '<plage explicite facultative>' }] },
    rules: [
      'Les exemples numériques de ce contrat sont fictifs et ne sont jamais ajoutés automatiquement à une requête.',
      'Un paramètre proposé peut venir du moteur ou de l’assistant; ne pas l’attribuer au brasseur. Seul selected est utilisé.',
      'Chaque champ modifié porte un path d’hypothèse exact. Une branche de programme utilise programChanges et une hypothèse sélectionnée program.changes.',
      'Les paramètres réels d’un modèle sont renvoyés par prepare; leur sens reste celui de son indice expert, pas un rendement chimique.',
      'Un analogue conserve son ID, la propriété transférée et le motif/les différences. Une source déclarée n’est pas automatiquement vérifiée.',
      'Les ajouts effectués restent protégés. Un autre passé peut être exploré dans une base hypothetical distincte.',
      'Une culture mixte n’est pas une moyenne de souches. Les facettes calculables restent disponibles.',
      'Sauvegarder un résultat nécessite le reçu du dépôt de scénarios; simuler ne signifie pas appliquer une recette.'
    ]
  };
}

/** Both chart modes project these exact intervals/centrals, without making a
 * midpoint, filling an unknown, or calculating a different sensory profile. */
export function brewingScenarioViewModel(result: BrewingScenarioResult) {
  assertBrewingScenarioResult(result);
  const branches = [result.baseline, ...result.branches];
  const axes = new Map<string, HopAxis>();
  for (const axis of branches.flatMap(branch => branch.dependencySnapshot.engineData.knowledge)
    .filter((row): row is HopAxis => row.kind === 'axis')) {
    const prior = axes.get(axis.id);
    if (prior && hopAdviceContentReference('brewing-scenario-axis-definition-v1', prior)
      !== hopAdviceContentReference('brewing-scenario-axis-definition-v1', axis)) {
      throw Error(`Définitions, versions ou échelles incompatibles pour l’axe ${axis.id}; une correspondance explicite est requise.`);
    }
    axes.set(axis.id, axis);
  }
  return { version: 'brewing-scenario-view-v1', resultReference: result.reference,
    axes: [...axes.values()].map(axis => ({ id: axis.id, version: axis.version, name: axis.name,
      definitionReference: hopAdviceContentReference('brewing-scenario-axis-definition-v1', axis),
      definition: structuredClone(axis), scale: structuredClone(axis.scale), quantity: 'modelAxisScale',
      rangeMeaning: 'conditionalModelEnvelope', statisticalCoverage: null,
      values: branches.map(branch => ({ branchId: branch.id, branchReference: branch.reference,
        estimate: structuredClone(branch.hopPrediction.overall.profile[axis.id] ?? null) })) })),
    biological: branches.map(branch => ({ branchId: branch.id, branchReference: branch.reference, contributions: structuredClone(branch.biologicalContributions) })),
    comparisons: structuredClone(result.comparisons), limitations: [...result.limitations] };
}

function parseJson(value: unknown, label: string): unknown {
  if (typeof value !== 'string' || !value.trim() || value.length > 200_000) throw Error(`${label} JSON requis (200 Ko maximum).`);
  try { return JSON.parse(value); } catch { throw Error(`${label} JSON illisible.`); }
}

export function runBrewingScenarioTool(name: string, args: Record<string, unknown>, context: BrewerContext): Omit<BrewerEvidence, 'id'> {
  if (!isBrewingScenarioTool(name)) throw Error('Outil de scénario inconnu.');
  const result = (label: string, data: unknown, limits: string[] = []) => ({ name, label, data, facts: [], limits });
  if (name === 'describe_brewing_scenario') return result('Contrat des scénarios', describeBrewingScenario());
  const prepared = prepareBrewingScenarioContext(context);
  if (name === 'prepare_brewing_scenario') {
    if (typeof args.scenarioId !== 'string' || !args.scenarioId.trim() || !Number.isSafeInteger(args.revision) || Number(args.revision) < 1) throw Error('Identifiant de scénario et révision positive requis.');
    const input = args.inputJson === undefined ? prepared.runtime.current?.input : parseJson(args.inputJson, 'Entrée hypothétique') as HopRecipeInput;
    if (!input) return result('Données de scénario à préciser', { contract: describeBrewingScenario(), request: null }, ['Aucune recette courante. Fournir une entrée hypothétique explicite; aucun ingrédient ni volume inventé automatiquement.']);
    const request = buildBrewingScenarioRequest({ scenarioId: args.scenarioId, revision: Number(args.revision),
      baseline: args.inputJson === undefined && prepared.runtime.current
        ? { kind: 'recipe', recipeReference: prepared.runtime.current.recipeReference, input, program: prepared.runtime.current.program,
          contextReference: brewingScenarioCurrentReference(prepared.runtime.current) }
        : { kind: 'hypothetical', label: 'Scénario explicitement hypothétique', input } });
    const models = usableHopKnowledge(prepared.runtime.engineData.knowledge).valid.filter((row): row is HopExtrapolation => row.kind === 'extrapolation' && row.enabled);
    const relevant = new Set(prepared.runtime.current?.program?.additions.map(addition => addition.materialId) ?? []);
    const materials = prepared.runtime.materials.filter(material => relevant.has(material.id)).map(material => ({ id: material.id, name: material.name, varietyId: material.variety?.id, lotId: material.lot?.id, form: material.form }));
    return result('Scénario prêt à comparer', { request, currentInput: input, program: prepared.runtime.current?.program ?? null, materials,
      modelHypotheses: models.map(model => ({ id: model.id, version: model.version, source: model.source, limitations: model.limitations,
        matrix: model.matrix, gain: model.gain, defaultYeast: model.defaultYeast, timings: model.timings,
        axes: model.axes.map(axis => ({ id: axis.id, version: axis.version, doseScale: axis.doseScale })),
        yeastProfiles: model.yeasts.map(yeast => ({ yeastId: yeast.yeastId, source: yeast.source, notes: yeast.notes })),
        currentYeastProfile: model.yeasts.find(yeast => yeast.yeastId === input.yeastId) ?? null })),
      provenance: prepared.provenance, ...(prepared.stockAvailability ? { stockAvailability: prepared.stockAvailability } : {}) }, [...prepared.limitations, 'Les paramètres proposés sont ceux de modèles experts déclarés; aucune validation sensorielle de cette combinaison n’est affirmée.']);
  }
  const request = parseJson(args.requestJson, 'Requête de scénario');
  assertBrewingScenarioRequest(request);
  const simulation = simulateBrewingScenario(request, prepared.runtime);
  return result('Scénarios calculés · hypothèses conservées', { result: simulation, view: brewingScenarioViewModel(simulation) },
    [...prepared.limitations, ...simulation.limitations, 'Les mêmes sorties figées alimentent barres, radar et aide; aucune recette, mesure ou stock n’est enregistré par ce calcul.']);
}
