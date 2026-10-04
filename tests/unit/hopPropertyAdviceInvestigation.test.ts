import { describe, expect, it } from 'vitest';
import source from '../fixtures/hopPropertyInvestigationSource21.json';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceRequest, HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';

const native = (partner = true) => structuredClone(partner ? source.withPartner : source.initial) as HopPropertyAdviceRequestV3;
const pairing = () => structuredClone(source.acquiredPairing.request) as HopPropertyAdviceRequest;

describe('investigation aromatique — un partenaire ne résout pas une question de risque', () => {
  it('conserve le risque natif sans cible ni accord déduits, avant et après ajout du partenaire', () => {
    for (const hasPartner of [false, true]) {
      const request = native(hasPartner), before = structuredClone(request);
      const answer = buildHopPropertyAdviceV3(request);
      expect(answer.requestSnapshot).toEqual(before);
      expect(request).toEqual(before);
      expect(answer.coverage.status).toBe('outOfScope');
      expect(answer.coverage.points[0].status).toBe('unresolved');
      expect(answer.strategies.some(strategy => strategy.kind === 'pairing-comparison')).toBe(false);
      expect(answer.requestSnapshot.candidatePolicy.materialIds).toEqual([]);
      expect(answer.requestSnapshot.propertyIntents.every(intent => intent.role === 'investigation')).toBe(true);
    }
  });

  it('applique la même frontière V2 sans nouvelle annotation imposée', () => {
    const request: HopPropertyAdviceRequest = { ...native(), format: 'hop-documentary-request-v2' };
    const answer = buildHopPropertyAdvice(request);
    expect(answer.coverage.status).toBe('outOfScope');
    expect(answer.coverage.points[0].status).toBe('unresolved');
    expect(answer.strategies.some(strategy => strategy.kind === 'pairing-comparison')).toBe(false);
  });

  it('ne dépend ni du nom du houblon, ni des identifiants, ni des mots de la question', () => {
    const request = native(), risk = request.propertyIntents[0];
    request.id = 'renamed-request'; request.originalQuestion = 'Une autre question non analysée par le moteur.';
    risk.id = 'renamed-risk'; risk.label = 'Caractère déclaré'; risk.qualification = null; risk.sourceSpans = [];
    const material = request.materials[0]; material.id = 'fixture-material-opaque'; material.name = 'Partenaire renommé';
    risk.partner = { kind: 'material', id: material.id };
    const answer = buildHopPropertyAdviceV3(request);
    expect(answer.coverage.status).toBe('outOfScope');
    expect(answer.coverage.points[0].status).toBe('unresolved');
    expect(answer.strategies.some(strategy => strategy.kind === 'pairing-comparison')).toBe(false);
  });

  it('localise le manque du risque quand une vraie cible avec partenaire justifie une comparaison', () => {
    const request = native(), positive = pairing(), target = positive.propertyIntents[0];
    const riskId = request.propertyIntents[0].id, offset = request.originalQuestion.length + 1;
    request.originalQuestion += '\n' + positive.originalQuestion;
    target.id = 'separate-qualified-target';
    target.sourceSpans = target.sourceSpans.map(span => ({ ...span, start: span.start + offset, end: span.end + offset }));
    request.propertyIntents.push(target);
    const answer = buildHopPropertyAdviceV3(request);
    const strategy = answer.strategies.find(row => row.kind === 'pairing-comparison');
    expect(strategy).toBeDefined();
    expect(strategy!.effects.find(effect => effect.intentId === target.id)?.status).toBe('hypothesis');
    expect(answer.strategies.every(row => row.effects.find(effect => effect.intentId === riskId)?.status === 'unresolved')).toBe(true);
    expect(answer.coverage.points.find(point => point.intentId === target.id)?.status).toBe('answered');
    expect(answer.coverage.points.find(point => point.intentId === riskId)?.status).toBe('unresolved');
    expect(answer.coverage.status).toBe('partial');
  });

  it('ne transforme pas les descriptions d’un candidat en réponse à la question de risque en bière', () => {
    const request = native(); request.candidatePolicy.materialIds = [request.materials[0].id];
    const answer = buildHopPropertyAdviceV3(request);
    expect(answer.candidateAssessments).toHaveLength(1);
    expect(answer.requestSnapshot.materials).toEqual(request.materials);
    expect(answer.requestSnapshot.candidatePolicy).toEqual(request.candidatePolicy);
    expect(answer.strategies.some(strategy => strategy.kind === 'pairing-comparison')).toBe(false);
    expect(answer.coverage.points[0].status).toBe('unresolved');
  });

  it.each([
    ['target', 'increase'], ['preference', null], ['preference', 'keep'],
  ] as const)('préserve la comparaison positive %s / %s déjà qualifiée', (role, direction) => {
    const request = pairing(); request.propertyIntents[0].role = role; request.propertyIntents[0].direction = direction;
    if (direction === 'keep') request.propertyIntents[0].comparisonBasis = { kind: 'current', assertionIds: [] };
    const answer = buildHopPropertyAdvice(request), targetId = request.propertyIntents[0].id;
    expect(answer.strategies.find(row => row.kind === 'pairing-comparison')?.effects.find(effect => effect.intentId === targetId)?.status).toBe('hypothesis');
    expect(answer.coverage.points[0].status).not.toBe('unresolved');
    expect(answer.requestSnapshot.propertyIntents[0].partner).toEqual(request.propertyIntents[0].partner);
  });
});
