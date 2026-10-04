import { resolveBrewingObservedState, type BrewingObservedStateInputV1 } from '../../src/domain/brewingObservedState';
import { buildBrewingObservedHopInput, type BrewingObservedHopInputRequest } from '../../src/domain/brewingObservationInputs';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';

export const observedScenarioSource = { title: 'Fixture d’état réalisé', author: 'Test automatisé', year: null,
  kind: 'judgment' as const, reference: 'fixture://observed-scenario' };
export const observedScenarioAt = (hours: number) => new Date(Date.parse('2026-10-02T00:00:00.000Z') + hours * 3600000).toISOString();
export function observedScenarioFixture(options: { asOfHours?: number; grams?: number; endedHours?: number; empty?: boolean; complete?: boolean } = {}) {
  const hours = options.asOfHours ?? 6;
  const subject = { id: 'fixture-beer', version: '1', contentReference: 'fixture:beer' };
  const provenance = { kind: 'fixture', reference: 'fixture://facts', description: 'Faits entièrement synthétiques de test.' };
  const material: HopDecisionMaterial = { id: 'variety:fixture-hop', name: 'Matière de fixture', form: 'pelletT90',
    variety: { id: 'fixture-hop', name: 'Variété sans règle dédiée', aliases: [], form: 'pelletT90', analysis: [], descriptions: [] } };
  const materialRef = { status: 'identified' as const, reference: { id: material.id, version: '1', contentReference: 'fixture:material' } };
  const lot = { status: 'unresolved' as const, label: 'Lot non donné', reason: 'Le modèle de cette fixture utilise une référence de variété, pas une analyse de lot.' };
  const time = (h: number) => ({ effectiveAt: observedScenarioAt(h), recordedAt: observedScenarioAt(h), provenance });
  const stateInput: BrewingObservedStateInputV1 = { format: 'brewing-observed-state-input-v1', subject: { kind: 'beer', identity: subject },
    asOf: observedScenarioAt(hours), knowledgeAsOf: observedScenarioAt(Math.max(hours, options.endedHours ?? hours)),
    knowledgeReference: { id: 'fixture-journal', version: '1', contentReference: 'fixture:journal' },
    facts: options.empty ? [] : [{ id: 'addition-a', version: 1, supersedesVersion: null, kind: 'materialAdded', subjectReference: subject,
      dependencyId: 'hops', effectiveAt: observedScenarioAt(0), recordedAt: observedScenarioAt(0), epistemicStatus: 'observed', provenance,
      material: materialRef, lot, quantity: { status: 'known', value: options.grams ?? 20, unit: 'g' } }],
    contacts: options.empty ? [] : [{ id: 'contact-a', version: 1, supersedesVersion: null, subjectReference: subject, dependencyId: 'hops',
      material: materialRef, lot, started: time(0), ...(options.endedHours === undefined ? { activeThrough: time(hours) } : { ended: time(options.endedHours) }),
      epistemicStatus: 'observed' }],
    coverage: options.complete === false ? [] : [{ id: 'known-hop-past', version: 1, supersedesVersion: null, subjectReference: subject, dependencyId: 'hops',
      fromAt: observedScenarioAt(0), throughAt: observedScenarioAt(hours), status: 'complete', recordedAt: observedScenarioAt(hours), provenance }],
    sampleContinuity: [] };
  const state = resolveBrewingObservedState(stateInput);
  const request: BrewingObservedHopInputRequest = { state, scope: { id: 'hop-program', dependencyIds: ['hops'], fromAt: observedScenarioAt(0),
    explanation: 'La portée temporelle déclarée couvre le programme de houblon de cette fixture.' },
    context: { input: { volumeL: 20, yeastId: null, fermentation: [] }, origin: 'declaredHypothesis', source: observedScenarioSource,
      explanation: 'Contexte de modèle synthétique explicitement fourni, sans donnée réelle.' }, materials: [material],
    bindings: options.empty ? [] : [{ additionId: 'realized-a', factReference: state.factDispositions.find(row => row.id === 'addition-a')!.reference,
      contactReference: state.contactStates.find(row => row.id === 'contact-a')!.reference, materialId: material.id,
      timing: 'postFermentation', temperatureC: 15, matrixId: null, explanation: 'Lien explicite du fait à son contact ; température de travail déclarée.' }] };
  return { stateInput, state, request, material, prepared: buildBrewingObservedHopInput(request) };
}
