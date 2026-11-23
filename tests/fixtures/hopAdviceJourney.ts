import planning from './public-history/hop-strategy-plan.synthetic.json';
import conditioning from './public-history/hop-strategy-conditioning.synthetic.json';
import type { HopAdviceSituation } from '../../src/domain/hopDecision/adviceSchema';
import type { HopDecisionIntent } from '../../src/domain/hopDecision/service';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import type { HopQualifiedAssemblyInput } from '../../src/domain/hopDecision/qualifiedDecision';

export const adviceFixtureIdentity = { ownerKey: 'fixture-advice-owner', dossierId: 'fixture-advice-dossier', recordedAt: '2026-10-01T07:00:00Z' };
export const adviceAssignment = (material: HopDecisionMaterial, variantId = `fixture:${material.id}`): HopCatalogueVariant => ({
  variantId, scope: 'assignment', recordId: material.id, origin: { kind: 'assignment' }, material: structuredClone(material),
});

/** Only original X01 inputs are consumed. None of the fixture's proposed answers enter the service. */
export function makeHopAdviceJourneyFixture(stage: 'planning' | 'conditioning' = 'conditioning') {
  const source = stage === 'planning' ? planning : conditioning;
  const house: HopDecisionMaterial = { id: source.scenarioStatements.houseHop.materialId,
    name: source.scenarioStatements.houseHop.identity, form: 'unknown', availableGrams: null, declaredAnalysis: [] };
  const intent: HopDecisionIntent = { originalQuestion: source.request.originalQuestion,
    interpretation: 'Lecture proposée : faible alcool, acidulé à préserver, fruité/citronné recherché; aucune valeur ou souche ajoutée.',
    criteria: source.request.proposedInterpretation.criteria.map(row => ({ id: row.id, description: row.text,
      role: row.role as 'constraint' | 'preserve' | 'seek', origin: 'user' as const })) };
  const raw = conditioning.scenarioStatements.programSnapshot;
  const program: HopDecisionProgram | null = stage === 'planning' ? null : {
    id: 'fixture-x01-conditioning', revision: raw.revision, stage: 'conditioning', volumeL: raw.volumeL, wortGravity: raw.wortGravity,
    additions: raw.additions.map(row => ({ ...row, status: row.status as 'planned' | 'performed', use: 'postFermentation' as const })),
  };
  const ids = intent.criteria!.map(row => row.id);
  const situation: HopAdviceSituation = { stage, program, materialIds: [house.id], exclusions: [],
    criterionDimensions: [{ criterionId: ids[0], dimension: 'alcohol' }, { criterionId: ids[1], dimension: 'acidity' },
      { criterionId: ids[2], dimension: 'aroma', familyId: 'citrus' }],
    assertions: [
      { id: 'reported-alcohol', subject: 'alcohol', statement: source.scenarioStatements.matrix.alcohol.description, state: 'reported', value: 'low', dimension: 'alcohol' },
      { id: 'missing-abv', subject: 'ABV', statement: 'Aucune mesure d’alcool fournie.', state: 'unknown', value: null, dimension: 'alcohol' },
      { id: 'missing-ph', subject: 'pH', statement: 'Aucun pH fourni.', state: 'unknown', value: null, dimension: 'acidity' },
      { id: 'missing-ta', subject: 'titratable-acidity', statement: 'Aucune acidité titrable fournie.', state: 'unknown', value: null, dimension: 'acidity' },
      { id: 'culture', subject: 'culture', statement: stage === 'planning' ? planning.scenarioStatements.culture.source : 'Culture non caractérisée.',
        state: stage === 'planning' ? 'reported' : 'unknown', value: stage === 'planning' ? planning.scenarioStatements.culture.reportedSpecies.join(' + ') : null, dimension: 'bioInteraction' },
      { id: 'viability', subject: 'viability', statement: 'Viabilité au contact non établie.', state: 'unknown', value: null, dimension: 'bioInteraction' },
      ...(stage === 'conditioning' ? [{ id: 'finished', subject: 'fermentation', statement: 'Fermentation terminée rapportée; aucune déduction de viabilité.',
        state: 'reported' as const, value: 'finished', dimension: 'process' as const }] : []),
    ] };
  const qualificationInput: HopQualifiedAssemblyInput = { variants: [adviceAssignment(house)] };
  return { intent, action: { kind: 'exploreStrategies' as const, situation }, qualificationInput, house, program };
}

/** Additional, explicitly supplied synthetic material. It is not a fact from the original X01. */
export function addDocumentedAdviceCandidate(fixture: ReturnType<typeof makeHopAdviceJourneyFixture>) {
  const source = { kind: 'observation' as const, title: 'Description synthétique du comparateur', author: 'Fixture pilote', year: 2026,
    reference: 'fixture:advice:comparator', locator: 'Observation rawHop synthétique; aucun rendement en bière.' };
  const candidate: HopDecisionMaterial = { id: 'fixture-comparator-citrus', name: 'Comparateur explicitement fourni', form: 'pelletT90', availableGrams: null,
    variety: { id: 'fixture-comparator-variety', name: 'Comparateur de test', aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [{ text: 'citrus citronné', context: 'rawHop', source }] },
    product: { id: 'fixture-comparator-product', name: 'Produit de test', manufacturer: 'Fixture', form: 'pelletT90',
      supportedUses: ['whirlpool', 'postFermentation'], source, reviewedOn: '2026-10-01', cautions: ['Données synthétiques uniquement.'] } };
  fixture.qualificationInput.variants.push(adviceAssignment(candidate));
  fixture.action.situation.materialIds!.push(candidate.id);
  return candidate;
}
