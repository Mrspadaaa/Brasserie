import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import {
  answerHopDecision, bindHopRecipe, hopAlphaObservationReference, previewHopPlannedRecipe,
  selectHopReplacementPath, type HopDecisionAction, type HopDecisionMaterial,
} from '../../src/domain/hopDecision';

/** Synthetic values only. No real inventory, recipe or sensory recommendation. */
export function makeHopDossierJourneyFixture() {
  const source: HopSource = { kind: 'observation', title: 'Fixture du dossier local', author: 'Vérification pilote',
    year: 2026, reference: 'fixture:dossier:observations', locator: 'Observations synthétiques, même URL et contenus distincts.' };
  const material = (id: string, availableGrams: number, text: string): HopDecisionMaterial => ({
    id, name: `Fixture ${id}`, form: 'pelletT90', availableGrams, stockItemRef: `fixture-stock:${id}`,
    variety: { id: `fixture-variety:${id}`, name: id, aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [{ text, context: 'rawHop', source }] },
    lot: { id: `fixture-lot:${id}`, varietyId: `fixture-variety:${id}`, name: id, form: 'pelletT90', analysis: [] },
  });
  const absent = material('absent', 0, 'herbal'), candidate = material('petal', 100, 'floral citrus');
  const observation: HopMeasurement = { analyte: 'alpha', unit: 'percentMass', kind: 'range',
    range: { min: 4, max: 10 }, basis: 'unknown', confidence: 'low', source };
  candidate.declaredAnalysis = [observation, { ...structuredClone(observation), basis: 'dryMatter', range: { min: 12, max: 18 } }];
  candidate.alphaForModel = { analyte: 'alpha', unit: 'percentAlpha', kind: 'range', range: { min: 4, max: 10 },
    analyticalBasis: 'unknown', origin: 'selectedObservation', source,
    observationRef: hopAlphaObservationReference(observation), selectionReason: 'Première observation retenue, seconde préservée.' };
  const alternative = material('woody', 100, 'resinous pine');
  const recipe = { id: 'fixture-dossier-recipe', volumeL: 18, hops: [
    { name: absent.name, stage: 'boil' as const, weightG: 24, alpha: 8, timeMin: 45, stockItemRef: absent.stockItemRef },
    { name: absent.name, stage: 'boil' as const, weightG: 12, alpha: 6, timeMin: 10, stockItemRef: absent.stockItemRef },
  ] };
  const binding = bindHopRecipe(recipe, { materials: [absent, candidate, alternative], materialByIndex: { 0: absent.id, 1: absent.id },
    stage: 'planning', revision: 3, wortGravity: 1.048, ibuModelContext: { variant: 'tinseth-original', volumeL: 18,
      volumeReference: 'finishedBeer', gravity: 1.048, gravityReference: 'averageBoil', explanation: 'Convention de fixture, pas mesure de bière.' } });
  const action: Extract<HopDecisionAction, { kind: 'planReplacement' }> = { kind: 'planReplacement', program: binding.program,
    unavailable: { materialId: binding.program.additions[0].materialId, reason: 'Indisponibilité de fixture.', origin: 'user' },
    basisByUse: { boil: 'sameMass' }, candidateMaterialIds: [candidate.id, alternative.id],
    limits: { maxCandidateMaterials: 5, maxAssignments: 20, maxPrograms: 10 } };
  const input = { intent: { originalQuestion: 'Remplacer ce lot manquant, chercher un caractère floral et éviter la résine.',
    interpretation: 'Deux emplois futurs à conserver ; caractères documentaires sans résultat sensoriel acquis.',
    criteria: [
      { id: 'seek-floral', description: 'Chercher le floral', role: 'seek' as const, origin: 'user' as const, familyId: 'floral' },
      { id: 'avoid-resin', description: 'Éviter la résine', role: 'avoid' as const, origin: 'user' as const, familyId: 'resin' },
    ] }, action, materials: binding.materials };
  const response = answerHopDecision(input), { request, plan } = response.result;
  const path = plan.paths.find(p => p.assignments.length === 2 && p.assignments.every(a => a.candidateMaterialId === candidate.id));
  if (!path) throw Error('La fixture doit obtenir sa voie depuis le catalogue.');
  const selection = selectHopReplacementPath({ request, plan, pathId: path.pathId });
  const alphaChoices = Object.fromEntries(binding.program.additions.map((addition, index) => [addition.id,
    { value: index === 0 ? 6 : 9, reason: `Hypothèse distincte pour l’ajout ${index + 1}, informée par l’observation conservée.` }]));
  const preview = previewHopPlannedRecipe({ request, selection, recipe, binding, alphaChoices });
  if (preview.status !== 'ready') throw Error(`La fixture doit préparer un reçu final complet : ${preview.status}.`);
  return { input, response, request, selection, preview, recipe, binding, candidate, observation };
}
