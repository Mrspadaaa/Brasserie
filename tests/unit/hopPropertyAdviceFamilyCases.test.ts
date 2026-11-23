import { describe, expect, it } from 'vitest';
import captured from '../fixtures/hopPropertyAdviceFamilyCases.json';
import { buildHopPropertyAdvice } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceRequest } from '../../src/domain/hopDecision/propertyAdviceSchema';

const request = (id: string) => structuredClone(captured.cases.find(row => row.id === id)!.request) as HopPropertyAdviceRequest;

describe('conseil V2 — propriétés des traversées de familles', () => {
  it('une exclusion de résine en demande composée ne devient pas un apport à rechercher', () => {
    const input = request('q07-high-bitterness-no-resin');
    const excluded = input.propertyIntents.find(row => row.property === 'aroma' && row.direction === 'exclude')!;
    const answer = buildHopPropertyAdvice(input);
    const effects = answer.strategies.flatMap(row => row.effects).filter(row => row.intentId === excluded.id);
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.every(row => row.status !== 'hypothesis' && !/apport à examiner/.test(row.text))).toBe(true);
    expect(answer.coverage.points.find(row => row.intentId === excluded.id)?.status).toBe('unresolved');
    expect(answer.requestSnapshot).toEqual(input);
  });
  it('une cible douce gardée en mémoire ne devient pas une réponse étayée sans levier correspondant', () => {
    const input = request('desired-sweetness-canonical');
    const wanted = input.propertyIntents.find(row => row.property === 'sweetness' && row.role === 'target')!;
    const answer = buildHopPropertyAdvice(input);
    const effects = answer.strategies.flatMap(row => row.effects).filter(row => row.intentId === wanted.id);
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.every(row => row.status !== 'boundedSupport')).toBe(true);
    expect(answer.coverage.points.find(row => row.intentId === wanted.id)?.status).toBe('unresolved');
    expect(answer.coverage.status).toBe('partial');
    expect(answer.strategies.filter(row => row.contribution === 'option').length).toBeGreaterThan(0);
    expect(answer.strategies.some(row => row.kind === 'sweetness-balance')).toBe(false);
  });
  it('une garde acidulée ne crée pas une conduite d’acidification déclarée depuis une culture inconnue', () => {
    const input = request('family-sour-unknown');
    const answer = buildHopPropertyAdvice(input);
    const texts = answer.strategies.flatMap(row => row.effects).map(row => row.text).join(' ');
    expect(texts).not.toContain('conduite d’acidification déclarée');
    expect(answer.requestSnapshot.context).toEqual(input.context);
    const investigation = input.propertyIntents.find(row => row.property === 'bioContribution')!;
    expect(investigation.role).toBe('investigation');
    expect(investigation.interpretationOrigin).toBe('proposal');
    expect(answer.requestSnapshot.propertyIntents.find(row => row.id === investigation.id)).toEqual(investigation);
    expect(answer.arguments.some(row => row.kind === 'proposedReading' && row.intentIds.includes(investigation.id)
      && row.text.includes('Question à examiner'))).toBe(true);
    const acidity = input.propertyIntents.find(row => row.property === 'acidity')!;
    expect(answer.coverage.points.find(row => row.intentId === acidity.id)?.status).toBe('unresolved');
  });
  it.each([
    ['Profil sans résine, floral.', 'boundedSupport'],
    ['Profil résineux, floral.', 'tension'],
    ['Profil floral.', 'unresolved'],
    ['Profil pas seulement résineux, floral.', 'unresolved'],
  ] as const)('une exclusion respecte le signe documentaire de %s', (text, expected) => {
    const input = request('q07-high-bitterness-no-resin');
    const excluded = input.propertyIntents.find(row => row.property === 'aroma' && row.direction === 'exclude')!;
    const material = structuredClone(request('desired-sweetness-canonical').materials.find(row => row.variety)!);
    material.id = 'variety:fixture-exclusion'; material.name = 'Témoin documentaire';
    material.variety!.id = 'fixture-exclusion'; material.variety!.name = material.name;
    material.variety!.descriptions = [{ text, context: 'rawHop', source: { title: 'Assertion synthétique de contre-épreuve',
      author: 'Fixture pilote', year: 2026, kind: 'judgment', reference: 'fixture://exclusion-evidence' } }];
    input.materials = [material];
    input.candidatePolicy = { kind: 'explicit', materialIds: [material.id], basis: 'Un candidat pour distinguer les signes documentaires.' };
    const answer = buildHopPropertyAdvice(input);
    const effect = answer.strategies.find(row => row.kind === 'direct-aroma-program')!.effects.find(row => row.intentId === excluded.id)!;
    expect(effect.status).toBe(expected);
    expect(answer.candidateAssessments[0].evaluations.find(row => row.intentId === excluded.id)?.candidateDescriptions[0].text).toBe(text);
    expect(effect.text).not.toContain('apport à examiner');
  });
});
