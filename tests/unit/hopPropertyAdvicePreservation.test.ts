import { describe, expect, it } from 'vitest';
import source from '../fixtures/hopPropertyPreservationSource21.json';
import earlierSource from '../fixtures/hopPropertyInvestigationSource21.json';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3, HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';

const request = () => structuredClone(source.request) as HopPropertyAdviceRequestV3;
const guardOf = (input: HopPropertyAdviceRequestV3) => input.propertyIntents.find(i => i.role === 'constraint' && i.direction === 'keep')!;
const isAddition = (kind: string) => kind === 'direct-aroma-program' || kind === 'documented-aromatic-form';
const extraIntent = (input: HopPropertyAdviceRequestV3, direction: 'increase' | 'decrease' | null, role: 'target' | 'preference' = 'target'): HopPropertyAdviceIntentV3 => ({
  ...structuredClone(guardOf(input)), id: 'explicit-separate-change', label: 'Autre caractère déclaré', familyId: 'tropical',
  role, direction, sourceSpans: [], interpretationOrigin: 'fixture',
  comparisonBasis: { kind: direction === 'decrease' ? 'current' : 'qualitativeTarget', assertionIds: [] },
  basis: 'Variante de fixture : changement aromatique explicite distinct de la garde, sans valeur ajoutée.',
});

describe('préservation aromatique — la garde ne demande pas un nouvel apport', () => {
  it('répond à la compensation native sans déclencher un apport depuis la garde seule', () => {
    const input = request(), before = structuredClone(input), guard = guardOf(input);
    const answer = buildHopPropertyAdviceV3(input);
    expect(input).toEqual(before); expect(answer.requestSnapshot).toEqual(before);
    expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
    expect(answer.strategies.some(strategy => strategy.kind === 'sweetness-balance')).toBe(true);
    expect(answer.strategies.some(strategy => strategy.kind === 'material-characterization')).toBe(true);
    const question = input.propertyIntents.find(i => i.investigation?.kind === 'comparePerceptualCompensation')!;
    expect(answer.coverage.points.find(point => point.intentId === question.id)?.status).toBe('answered');
    expect(answer.coverage.points.find(point => point.intentId === guard.id)?.status).toBe('unresolved');
    expect(answer.coverage.status).toBe('partial');
    expect(answer.requestSnapshot.materials).toEqual([]);
    expect(answer.requestSnapshot.candidatePolicy.materialIds).toEqual([]);
  });

  it('ne crédite pas la préservation d’arôme depuis un levier de compensation gustative', () => {
    const input = request(), guard = guardOf(input);
    const answer = buildHopPropertyAdviceV3(input);
    const strategy = answer.strategies.find(row => row.kind === 'sweetness-balance')!;
    const effect = strategy.effects.find(row => row.intentId === guard.id)!;
    expect(effect.status).toBe('unresolved');
    expect(effect.text).not.toContain('levier d’apport');
    expect(strategy.preparation.operational.status).toBe('notProvided');
  });

  it('conserve une garde seule sans en inventer le changement à entreprendre', () => {
    const input = request(); input.propertyIntents = [guardOf(input)];
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies).toEqual([]);
    expect(answer.coverage.status).toBe('outOfScope');
    expect(answer.coverage.points[0].status).toBe('unresolved');
    expect(answer.requestSnapshot.propertyIntents).toEqual(input.propertyIntents);
  });

  it.each(['target', 'preference'] as const)('ne transforme pas keep en apport quand la préservation est exprimée comme %s', role => {
    const input = request(), preservation = guardOf(input); preservation.role = role;
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
    expect(answer.coverage.points.find(point => point.intentId === preservation.id)?.status).toBe('unresolved');
    expect(answer.strategies.some(strategy => strategy.kind === 'sweetness-balance')).toBe(true);
  });

  it('conserve l’accord qualifié avec partenaire sans déduire un apport de la direction keep', () => {
    for (const role of ['target', 'preference'] as const) {
      const input = structuredClone(earlierSource.acquiredPairing.request) as unknown as HopPropertyAdviceRequestV3;
      input.format = 'hop-documentary-request-v3';
      const intention = input.propertyIntents[0]; intention.role = role; intention.direction = 'keep';
      intention.comparisonBasis = { kind: 'current', assertionIds: [] };
      const answer = buildHopPropertyAdviceV3(input);
      expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
      expect(answer.strategies.find(strategy => strategy.kind === 'pairing-comparison')?.effects.find(effect => effect.intentId === intention.id)?.status).toBe('hypothesis');
      expect(answer.coverage.points[0].status).toBe('answered');
    }
  });

  it('généralise sans dépendre des mots, IDs ou famille de la garde', () => {
    const input = request(); input.id = 'neutral-preservation-request';
    input.originalQuestion = 'Comparaison déclarée avec une propriété à préserver.';
    const ids = new Map(input.propertyIntents.map((intent, index) => [intent.id, `neutral-${index}`]));
    for (const intent of input.propertyIntents) {
      intent.id = ids.get(intent.id)!; intent.label = 'Terme explicitement qualifié'; intent.sourceSpans = []; intent.qualification = null;
      intent.relatedIntentIds = intent.relatedIntentIds.map(id => ids.get(id)!);
      if (intent.investigation) intent.investigation.observationIntentIds = intent.investigation.observationIntentIds.map(id => ids.get(id)!);
    }
    guardOf(input).familyId = 'citrus';
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
    expect(answer.coverage.points.find(point => point.intentId === guardOf(input).id)?.status).toBe('unresolved');
    expect(answer.strategies.some(strategy => strategy.kind === 'sweetness-balance')).toBe(true);
  });

  it.each([['target', 'increase'], ['preference', null]] as const)('conserve la vraie demande positive %s / %s à côté de la garde', (role, direction) => {
    const input = request(), guard = guardOf(input), positive = extraIntent(input, direction, role);
    input.propertyIntents.push(positive);
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.filter(strategy => isAddition(strategy.kind))).toHaveLength(2);
    expect(answer.strategies.filter(strategy => isAddition(strategy.kind)).every(strategy => strategy.effects.find(effect => effect.intentId === positive.id)?.status === 'hypothesis')).toBe(true);
    expect(answer.coverage.points.find(point => point.intentId === guard.id)?.status).toBe('unresolved');
    expect(answer.requestSnapshot.propertyIntents.find(intent => intent.id === guard.id)).toEqual(guard);
  });

  it('conserve le réexamen d’une réduction sans le convertir en apport à cause de la garde voisine', () => {
    const input = request(); input.propertyIntents.push(extraIntent(input, 'decrease'));
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.strategies.some(strategy => strategy.kind === 'future-character-review')).toBe(true);
    expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
    expect(answer.strategies.some(strategy => strategy.kind === 'sweetness-balance')).toBe(true);
  });

  it('préserve les fiches des candidats sans en faire des apports demandés par la garde', () => {
    const input = request();
    input.materials = structuredClone(earlierSource.acquiredPairing.request.materials) as HopPropertyAdviceRequestV3['materials'];
    input.candidatePolicy = { kind: 'explicit', materialIds: input.materials.map(m => m.id), basis: 'Périmètre documentaire de fixture explicite.' };
    const answer = buildHopPropertyAdviceV3(input);
    expect(answer.candidateAssessments).toHaveLength(input.materials.length);
    expect(answer.requestSnapshot.materials).toEqual(input.materials);
    expect(answer.strategies.some(strategy => isAddition(strategy.kind))).toBe(false);
    expect(answer.coverage.points.find(point => point.intentId === guardOf(input).id)?.status).toBe('unresolved');
  });
});
