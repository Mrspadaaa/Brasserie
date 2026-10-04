import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { adoptHopV55ReferenceHypothesis, getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { prepareHopV55AdoptedContext } from '../../src/services/hopV55/adoptedContextPreparation';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55Workspace } from '../fixtures/hopV55';

const timestamp = '2026-10-03T09:10:00.000Z';

async function fixture(): Promise<{ context: BrewerContext; workspace: HopV55Workspace }> {
  const context = makeHopV55FixtureContext('planning');
  const catalogue = await loadBrewingCatalogueReferences();
  context.hopIndex = {
    varieties: [...(context.hopIndex?.varieties ?? []), ...catalogue.varieties],
    lots: context.hopIndex?.lots ?? [], knowledge: catalogue.knowledge,
    predictions: context.hopIndex?.predictions ?? [], tastings: context.hopIndex?.tastings ?? [],
    truncated: context.hopIndex?.truncated ?? [],
  };
  const workspace = hopV55Workspace('owner-culture-preparation', 'workspace-culture-preparation');
  workspace.referenceHypotheses = [];
  return { context, workspace };
}

function hypothesis(id: string, version: number, culture?: BrewingScenarioCultureContext): HopV55Workspace['referenceHypotheses'][number] {
  const baseline: Extract<HopV55Workspace['referenceHypotheses'][number]['baseline'], { kind: 'hypothetical' }> = {
    kind: 'hypothetical', label: `Baseline comparative ${version}`,
    input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
  };
  if (culture !== undefined) baseline.culture = structuredClone(culture);
  return { id, version, label: `NR ${version}`, recordedAt: timestamp, baseline };
}

function identity(workspace: HopV55Workspace, index = 0) {
  const row = getHopV55ReferenceProjection(workspace)?.references[index];
  if (!row) throw new Error('La version adoptée est absente de la fixture.');
  return { id: row.id, version: row.version, contentReference: row.contentReference };
}

describe('préparation commune d’un contexte NR adopté', () => {
  it('sépare la base physique préparée du baseline comparatif et conserve identité, membres et proportions exacts', async () => {
    const { context, workspace: empty } = await fixture();
    const mixed: BrewingScenarioCultureContext = { state: 'mixed', members: [
      { yeastId: 'comparison-strain-no-ratio', name: 'Membre sans proportion' },
      { yeastId: 'comparison-strain-range', name: 'Membre avec plage', proportion: { min: 0.25, max: 0.55 } },
    ], explanation: 'Composition hypothétique NR; aucune moyenne.' };
    const adopted = adoptHopV55ReferenceHypothesis(empty, hypothesis('nr-comparison-A', 1, mixed), context,
      prepareBrewingScenarioContext(context), { referenceVersion: 'NR/release α' });
    const expected = identity(adopted);
    const prepared = prepareHopV55AdoptedContext({ context, workspace: adopted, expected });
    const physical = prepareBrewingScenarioContext(context);

    expect(prepared.resolution.status).toBe('resolved');
    if (prepared.resolution.status !== 'resolved') throw new Error('La résolution NR attendue doit être disponible.');
    expect(prepared.sourcePrepared).toEqual(physical);
    expect(prepared.sourcePrepared.runtime.current?.culture).toEqual(physical.runtime.current?.culture);
    expect(prepared.sourcePrepared.runtime.current?.culture).not.toEqual(mixed);
    expect(prepared.cultureBinding).toBe(prepared.resolution.binding);
    expect(prepared.cultureBinding.reference).toEqual(expected);
    expect(prepared.cultureBinding.reference.version).toBe('NR/release α');
    expect(prepared.comparisonBaseline).toEqual(prepared.cultureBinding.baseline);
    expect(prepared.comparisonBaseline).toMatchObject({ culture: { state: 'mixed', members: [
      { yeastId: 'comparison-strain-no-ratio' },
      { yeastId: 'comparison-strain-range', proportion: { min: 0.25, max: 0.55 } },
    ] } });
  });

  it('ne fabrique pas de comparaison en absence, mais préserve un unknown explicitement adopté sans modifier la base physique', async () => {
    const { context, workspace: empty } = await fixture();
    const absent = prepareHopV55AdoptedContext({ context, workspace: empty, expected: null });
    expect(absent.resolution).toEqual({ status: 'absent' });
    expect(absent.sourcePrepared).toEqual(prepareBrewingScenarioContext(context));
    expect(absent).not.toHaveProperty('comparisonBaseline');
    expect(absent).not.toHaveProperty('cultureBinding');

    const declaredUnknown: BrewingScenarioCultureContext = { state: 'unknown', members: [],
      explanation: 'Inconnue explicitement adoptée comme hypothèse.' };
    const adopted = adoptHopV55ReferenceHypothesis(empty, hypothesis('nr-comparison-unknown', 1, declaredUnknown), context,
      prepareBrewingScenarioContext(context), { referenceVersion: 'unknown/explicit' });
    const prepared = prepareHopV55AdoptedContext({ context, workspace: adopted, expected: identity(adopted) });
    expect(prepared.resolution.status).toBe('resolved');
    if (prepared.resolution.status !== 'resolved') throw new Error('Le unknown explicitement adopté doit être résolu.');
    expect(prepared.cultureBinding.culture).toEqual({ status: 'declared', value: declaredUnknown });
    expect(prepared.comparisonBaseline).toMatchObject({ culture: declaredUnknown });
    expect(prepared.sourcePrepared).toEqual(prepareBrewingScenarioContext(context));
  });

  it('retourne le binding périmé A→B sans publier son ancien baseline comparatif', async () => {
    const { context, workspace: empty } = await fixture();
    const preparedSource = prepareBrewingScenarioContext(context);
    const r1 = adoptHopV55ReferenceHypothesis(empty, hypothesis('nr-comparison-lineage', 1,
      { state: 'single', members: [{ yeastId: 'strain-A' }] }), context, preparedSource, { referenceVersion: 'A/α' });
    const expectedA = identity(r1);
    const r2 = adoptHopV55ReferenceHypothesis(r1, hypothesis('nr-comparison-lineage', 2,
      { state: 'single', members: [{ yeastId: 'strain-B' }] }), context, preparedSource, { referenceVersion: 'B/β' });
    const result = prepareHopV55AdoptedContext({ context, workspace: r2, expected: expectedA });

    expect(result.resolution).toMatchObject({ status: 'stale', code: 'expectedReferenceChanged', expected: expectedA });
    expect(result.sourcePrepared).toEqual(preparedSource);
    expect(result).not.toHaveProperty('comparisonBaseline');
    expect(result).not.toHaveProperty('cultureBinding');
  });
});
