import { describe, expect, it } from 'vitest';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { assertHopExtrapolation, type HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';

const model = modelPack[0] as HopExtrapolation;
const selectedScenarioSource: HopSource = {
  title: 'Hypothèse de scénario · facteur de matrice', author: 'Hypothèse proposée par l’assistant et sélectionnée',
  year: null, kind: 'judgment', reference: 'brewing-scenario-hypothesis-v1:scenario-fixture:branch-fixture:matrix-parameter',
  locator: 'Valeur de travail locale; aucune source empirique revendiquée.',
};

describe('Provenance des paramètres extrapolés de scénario', () => {
  it('accepte une hypothèse sélectionnée liée à une référence de scénario et conservée en evidence', () => {
    const instance: HopExtrapolation = {
      ...structuredClone(model),
      matrix: { range: { min: 0.2, max: 0.2 }, central: 0.2, source: selectedScenarioSource },
      evidence: [...structuredClone(model.evidence), selectedScenarioSource],
    };
    expect(() => assertHopExtrapolation(instance)).not.toThrow();
    expect(() => assertHopKnowledge(instance)).not.toThrow();
  });

  it('refuse une source empirique non datée, un jugement orphelin ou une référence mal formée', () => {
    const base = structuredClone(model);
    const empirical = { ...selectedScenarioSource, kind: 'research' as const };
    expect(() => assertHopExtrapolation({ ...base, matrix: { ...base.matrix, source: empirical }, evidence: [...base.evidence, empirical] })).toThrow(/année/);
    expect(() => assertHopExtrapolation({ ...base, matrix: { ...base.matrix, source: selectedScenarioSource } })).toThrow(/année/);
    const malformed = { ...selectedScenarioSource, reference: 'assistant:matrix' };
    expect(() => assertHopExtrapolation({ ...base, matrix: { ...base.matrix, source: malformed }, evidence: [...base.evidence, malformed] })).toThrow(/année/);
  });
});
