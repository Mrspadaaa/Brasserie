import { describe, expect, it } from 'vitest';
import prior from '../fixtures/hopAdviceV3Prior.json';
import priorExclusion from '../fixtures/hopAdviceV3PriorExclusion.json';
import { readHopDecisionDossier, readHopDecisionEvent } from '../../src/domain/hopDecision/dossier';

describe('archives V3 réellement produites avant correction du conseil', () => {
  it('conserve même la contradiction historique R02 sans la corriger à la relecture', () => {
    const original = structuredClone(priorExclusion);
    expect(original.dossier.study.responseSnapshot.result.coverage.excludedMaterialIds).toContain('fixture-comparator-citrus');
    expect(original.dossier.study.requestSnapshot.action.situation.exclusions[0].certainty).toBe('possible');
    const dossier = readHopDecisionDossier(priorExclusion.dossier), event = readHopDecisionEvent(priorExclusion.event);
    expect('status' in dossier ? dossier.raw : dossier).toEqual(original.dossier);
    expect('status' in event ? event.raw : event).toEqual(original.event);
    expect(priorExclusion).toEqual(original);
  });
  it.each(prior)('relit $stage sans réévaluer ou enrichir sa réponse historique', fixture => {
    const original = structuredClone(fixture);
    const dossier = readHopDecisionDossier(fixture.dossier);
    const events = fixture.events.map(readHopDecisionEvent);
    expect('status' in dossier ? dossier.raw : dossier).toEqual(original.dossier);
    expect(events.map(row => 'status' in row ? row.raw : row)).toEqual(original.events);
    expect(fixture).toEqual(original);
    expect(original.dossier.study.responseSnapshot.result.version).toBe('hop-strategy-advice-v1');
  });
});
