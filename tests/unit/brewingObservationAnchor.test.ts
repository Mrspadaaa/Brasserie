import { describe, expect, it, vi } from 'vitest';
import { resolveBrewingObservedState, type BrewingObservedStateInputV1 } from '../../src/domain/brewingObservedState';
import { createBrewingObservationAnchor, readBrewingObservationAnchor } from '../../src/domain/brewingObservationAnchor';
import type { BrewingReferenceObservationV1 } from '../../src/domain/brewingReference';

const at = '2026-10-02T10:00:00.000Z';
const identity = { id: 'beer-a', version: '1', contentReference: 'fixture:beer-a' };
function setup() {
  const input: BrewingObservedStateInputV1 = { format: 'brewing-observed-state-input-v1', subject: { kind: 'beer', identity },
    asOf: at, knowledgeAsOf: at, knowledgeReference: { id: 'journal', version: '1', contentReference: 'fixture:journal' },
    facts: [], contacts: [], coverage: [], sampleContinuity: [] };
  const observation: BrewingReferenceObservationV1 = { id: 'note', version: 1, subject: { kind: 'beer', id: identity.id, label: 'Bière A' },
    observedAt: at, author: { label: 'Brasseur fixture' }, origin: { kind: 'observation', description: 'Note de fixture sans échelle connue' },
    originalText: 'Floral 3, échelle non décrite', dimension: { status: 'unresolved', label: 'Floral' }, scale: { status: 'unknown' },
    sense: { kind: 'sensoryRating', value: 3 }, comparison: { kind: 'absolute' }, context: {} };
  return { input, observedState: resolveBrewingObservedState(input), observation };
}
const make = (fixture: ReturnType<typeof setup>) => createBrewingObservationAnchor({ id: 'anchor-1', observation: fixture.observation,
  observedState: fixture.observedState, subjectRelation: 'sameSubject', explanation: 'Même sujet explicitement identifié.',
  createdAt: at, createdBy: { origin: 'assistant', name: 'Fixture automatisée' } });

describe('ancre immutable et lecteur de snapshot', () => {
  it('conserve une note scaleUnknown3 et un passé inconnu sans fabriquer d’état calculable', () => {
    const fixture = setup(), anchor = make(fixture);
    expect(anchor.observation.sense).toEqual({ kind: 'sensoryRating', value: 3 });
    expect(anchor.observation.scale.status).toBe('unknown');
    expect(anchor.observedState.status).not.toBe('resolved');
    expect(readBrewingObservationAnchor(anchor)).toEqual({ status: 'readOnly', anchor });
  });
  it('clone les entrées et relit la même archive après nouvelle note ou nouveau contexte', () => {
    const fixture = setup(), anchor = make(fixture), saved = JSON.parse(JSON.stringify(anchor));
    fixture.observation.sense = { kind: 'sensoryRating', value: 4 };
    fixture.input.asOf = '2026-10-02T12:00:00.000Z';
    fixture.observedState.dependencies.push({ id: 'later', status: 'unknown', factReferences: [], contactReferences: [], coverageReferences: [], valueReferences: [], reasons: ['Autre état'] });
    expect(anchor).toEqual(saved);
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('Aucune relecture au présent'); });
    try { expect(readBrewingObservationAnchor(saved)).toEqual({ status: 'readOnly', anchor: saved }); } finally { clock.mockRestore(); }
  });
  it('refuse une altération de note ou de référence sans effacer l’ancienne archive', () => {
    const anchor = make(setup());
    const changed = structuredClone(anchor); changed.observation.sense = { kind: 'sensoryRating', value: 9 };
    expect(() => readBrewingObservationAnchor(changed)).toThrow(/note|référence|contenu/i);
    expect(() => readBrewingObservationAnchor({ ...anchor, reference: 'tampered' })).toThrow(/contenu/i);
    expect(readBrewingObservationAnchor(anchor).status).toBe('readOnly');
  });
  it('ne relie pas factuellement deux bières portant le même libellé', () => {
    const fixture = setup(); fixture.observation.subject.id = 'beer-b';
    expect(() => make(fixture)).toThrow(/identité du sujet/i);
    const analogy = createBrewingObservationAnchor({ id: 'analogy', observation: fixture.observation, observedState: fixture.observedState,
      subjectRelation: 'analogy', explanation: 'Analogie déclarée, pas observation de la bière A.', createdAt: at,
      createdBy: { origin: 'assistant', name: 'Fixture' } });
    expect(analogy.subjectRelation).toBe('analogy');
  });
  it('ne remplace pas l’instant dégusté par l’instant de la cible', () => {
    const fixture = setup(); fixture.observation.observedAt = '2026-10-02T11:00:00.000Z';
    expect(() => make(fixture)).toThrow(/instant observé/i);
  });
  it('préserve un format futur en lecture seule, sans migration implicite', () => {
    const future = { format: 'brewing-observation-anchor-v8', payload: { original: [3, null, 'retained'] } };
    expect(readBrewingObservationAnchor(future)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
  });
});
