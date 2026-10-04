import { describe, expect, it } from 'vitest';
import { assertHopPropertyAdviceRequestV3, type HopPropertyAdviceIntentV3, type HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';
import { admissibleCompensationObservations, applyCompensationFix, compensationIssues, startCompensation } from '../../src/ui/hopV55/propertyAdviceCompensationV3';

const request = (): HopPropertyAdviceRequestV3 => makeHopPropertyCompensationRequestV3();
const questionOf = (value: HopPropertyAdviceRequestV3) => value.propertyIntents.find((intent) => intent.investigation)!;
const observationOf = (value: HopPropertyAdviceRequestV3) => value.propertyIntents.find((intent) => intent.id === questionOf(value).investigation!.observationIntentIds[0])!;

function corrected(value: HopPropertyAdviceRequestV3, ownerId: string, fix: Parameters<typeof applyCompensationFix>[2]) {
  const replacements = applyCompensationFix(value.propertyIntents, ownerId, fix);
  const byId = new Map(replacements.map((row) => [row.id, row]));
  return { ...value, propertyIntents: value.propertyIntents.map((row) => byId.get(row.id) ?? row) };
}

describe('garde UI des compensations V3 contre le contrat du vrai schéma', () => {
  it('bloque une question dont rôle/direction ont divergé et répare les deux seulement sur un geste explicite', () => {
    const value = request();
    const question = questionOf(value);
    question.role = 'target';
    question.direction = 'decrease';
    question.comparisonBasis = { kind: 'current', assertionIds: [] };

    const issue = compensationIssues(value.propertyIntents).find((row) => row.intentId === question.id && row.code === 'questionRole');
    expect(issue?.blocking).toBe(true);
    const repair = issue!.fixes.find((row) => row.fix.kind === 'setQuestionRole')!;
    const next = corrected(value, question.id, repair.fix);
    expect(next).not.toEqual(value);
    expect(questionOf(next)).toMatchObject({ role: 'investigation', direction: 'investigate', metric: 'sensory' });
    expect(() => assertHopPropertyAdviceRequestV3(next)).not.toThrow();
    expect(questionOf(value)).toMatchObject({ role: 'target', direction: 'decrease' });
  });

  it('bloque une direction absente sur une investigation et propose sa correction sans normaliser la métrique', () => {
    const value = request();
    const question = questionOf(value);
    question.direction = null;
    question.metric = 'pH';
    const issue = compensationIssues(value.propertyIntents).find((row) => row.intentId === question.id && row.code === 'questionDirection');
    expect(issue?.blocking).toBe(true);
    const repair = issue!.fixes.find((row) => row.fix.kind === 'setQuestionDirection')!;
    const next = corrected(value, question.id, repair.fix);
    expect(questionOf(next)).toMatchObject({ role: 'investigation', direction: 'investigate', metric: 'pH' });
    expect(() => assertHopPropertyAdviceRequestV3(next)).toThrow(/perceptive/u);
    expect(() => assertHopPropertyAdviceRequestV3(value)).toThrow(/direction investigate/u);
  });

  it('n’offre pas comme constat une observation à direction d’objectif et restaure explicitement la direction nulle', () => {
    const value = request();
    const question = questionOf(value);
    const observation = observationOf(value);
    observation.direction = 'increase';
    expect(admissibleCompensationObservations(value.propertyIntents, question.id)).toEqual([]);
    const issue = compensationIssues(value.propertyIntents).find((row) => row.intentId === question.id && row.code === 'observationDirection');
    expect(issue?.blocking).toBe(true);
    const repair = issue!.fixes.find((row) => row.fix.kind === 'restoreObservation')!;
    const next = corrected(value, question.id, repair.fix);
    expect(observationOf(next)).toMatchObject({ role: 'reportedObservation', metric: 'sensory', direction: null });
    expect(() => assertHopPropertyAdviceRequestV3(next)).not.toThrow();
    expect(observationOf(value).direction).toBe('increase');
  });

  it('démarre une comparaison uniquement par geste explicite, sans remplacer une métrique refusée', () => {
    const value = request();
    const prior = structuredClone(questionOf(value)) as HopPropertyAdviceIntentV3;
    delete prior.investigation;
    prior.direction = null;
    prior.metric = 'analyticalBU';
    const opened = startCompensation(prior);
    expect(opened).toMatchObject({ role: 'investigation', direction: 'investigate', metric: 'analyticalBU',
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [] } });
  });
});
