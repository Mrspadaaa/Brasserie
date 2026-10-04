import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { brewerToolDeclarations, runBrewerTool } from '../../src/domain/brewerTools';
import { buildBrewingScenarioRequest } from '../../src/domain/brewingScenario';
import { readBrewingNuanceEvidence } from '../../src/domain/brewingNuanceTools';
import { scenarioEvidenceForModel } from '../../src/domain/brewingScenarioArchive';
import { runBrewerHarness } from '../../functions/src/brewerHarness';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { hopTestSource } from '../fixtures/hopIndex';
import { testHopYeast } from '../fixtures/hopPrediction';

let context: BrewerContext, requestJson: string, prepareArgs: Record<string, unknown>;
beforeAll(async () => {
  const refs = await loadBrewingCatalogueReferences();
  const variety = refs.varieties.find(row => row.descriptions.some(d => /\bpear\b/i.test(d.text)))!;
  expect(variety).toBeDefined();
  const model = refs.knowledge.find(row => row.kind === 'extrapolation' && row.enabled)!;
  context = { now: Date.parse('2026-10-02T06:00:00.000Z'), phase: 'Fixture hypothétique', inventory: [], material: [], waterSources: [],
    provenance: [], editableTargets: [], hopIndex: { ...refs, lots: [], knowledge: [...refs.knowledge, testHopYeast], predictions: [], tastings: [], truncated: [] } };
  const input: HopRecipeInput = { volumeL: 20, yeastId: testHopYeast.id, additions: [{ id: 'hypothetical-contact', name: 'Contact de travail',
    triplet: { varietyId: variety.id, yeastId: testHopYeast.id, timing: 'postFermentation', doseGL: 3.86, contactHours: 24, temperatureC: 15, matrixId: null } }], fermentation: [] };
  const request = buildBrewingScenarioRequest({ scenarioId: 'fixture-nuance-tools', revision: 1,
    baseline: { kind: 'hypothetical', label: 'Programme de travail déclaré', input } });
  requestJson = JSON.stringify(request);
  prepareArgs = { planId: 'fixture-nuance-plan', proposedAt: '2026-10-02T06:00:00.000Z', modelId: model.id,
    dimensionsJson: JSON.stringify([{ id: 'pear-fixture', version: '1', name: 'Poire', definition: 'Nuance déclarée pour cette comparaison de travail.',
      terms: ['pear', 'poire'], sourceRefs: [hopTestSource] }]) };
});

describe('Vrais outils des nuances et frontières du transport', () => {
  it('exécute les déclarations/dispatcher, conserve l’archive exacte et retire le base64 du modèle', () => {
    expect(brewerToolDeclarations.map(row => row.name)).toEqual(expect.arrayContaining(['prepare_brewing_nuances', 'project_brewing_nuances']));
    const before = structuredClone(context);
    const prepared = runBrewerTool('prepare_brewing_nuances', prepareArgs, context);
    const plans = (prepared.data as any).plans;
    const selected = plans.find((plan: any) => plan.variant === 'declaredCentralSensitivity');
    expect(selected.status).toBe('proposed');
    expect((scenarioEvidenceForModel(prepared).data as any).sourceModelArchive).toBeUndefined();
    const output = runBrewerTool('project_brewing_nuances', { ...prepareArgs, requestJson,
      selectedPlanReference: selected.reference, reason: 'Explorer explicitement ces centrales, sans les présenter comme mesure.' }, context);
    const full = readBrewingNuanceEvidence(output.data);
    expect(full.projection.candidates[0].values[0].estimate?.central).toBeTypeOf('number');
    expect(full.view.dimensions[0].values[0].status).toBe('hypothetical');
    expect((scenarioEvidenceForModel(output).data as any).archive).toBeUndefined();
    expect(context).toEqual(before);
    expect(new TextEncoder().encode(JSON.stringify(output)).length).toBeLessThan(650_000);
  });
  it('passe le vrai harness avec seulement le transport Gemini contrôlé', async () => {
    const call = (name: string, args: unknown) => ({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name, args } }] } }] });
    const responses = (body: any) => body.contents.flatMap((message: any) => message.parts ?? []).filter((part: any) => part.functionResponse).map((part: any) => part.functionResponse.response);
    const approved = { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] };
    let step = 0, projectionId: string | undefined;
    const generate = vi.fn(async (_model: string, body: any) => {
      if (body.generationConfig?.responseMimeType === 'application/json') return approved;
      const seen = responses(body);
      if (step++ === 0) return call('prepare_brewing_nuances', prepareArgs);
      if (step === 2) {
        const prepared = seen.find((entry: any) => entry.name === 'prepare_brewing_nuances');
        expect(prepared.data.sourceModelArchive).toBeUndefined();
        return call('project_brewing_nuances', { ...prepareArgs, requestJson,
          selectedPlanReference: prepared.data.plans.find((plan: any) => plan.variant === 'declaredCentralSensitivity').reference,
          reason: 'Scénario de sensibilité de fixture, sans intensité observée revendiquée.' });
      }
      const projection = seen.find((entry: any) => entry.name === 'project_brewing_nuances');
      expect(projection.data.archive).toBeUndefined(); projectionId = projection.id;
      return call('finish_advice', { level: 'info', summary: 'La projection fine est calculée sous hypothèses déclarées.',
        action: 'Comparer les hypothèses et leurs sources.', why: 'Les données documentaires restent distinctes de la projection.',
        watch: 'Ce résultat n’est pas un étalonnage sensoriel.', question: '', evidenceIds: [projection.id] });
    });
    const response = await runBrewerHarness(context, 'Explorer une nuance sous hypothèse, sans modifier de recette.', [], generate, { mode: 'fast' });
    expect(projectionId).toBeDefined();
    const evidence = response.evidence.find(row => row.id === projectionId)!;
    expect(readBrewingNuanceEvidence(evidence.data).projection.version).toBe('brewing-nuance-projection-v1');
    expect(new TextEncoder().encode(JSON.stringify(response)).length).toBeLessThan(650_000);
  });
  it('conserve entrée demandée et entrée qualifiée avec une vraie référence de levure chargée', () => {
    const model = context.hopIndex!.knowledge.find(row => row.kind === 'extrapolation' && row.id === prepareArgs.modelId) as any;
    const yeastId = model.yeasts.find((row: any) => context.hopIndex!.knowledge.some(k => k.kind === 'yeast' && k.id === row.yeastId))!.yeastId;
    const request = JSON.parse(requestJson);
    request.baseline.input.yeastId = yeastId;
    request.baseline.input.additions.forEach((addition: any) => { addition.triplet.yeastId = yeastId; });
    const prepared = runBrewerTool('prepare_brewing_nuances', prepareArgs, context).data as any;
    const evidence = runBrewerTool('project_brewing_nuances', { ...prepareArgs, requestJson: JSON.stringify(request),
      selectedPlanReference: prepared.plans.find((plan: any) => plan.variant === 'declaredCentralSensitivity').reference,
      reason: 'Utiliser la référence réelle du catalogue, sous modèle fin hypothétique.' }, context);
    const read = readBrewingNuanceEvidence(evidence.data);
    expect(read.projection.candidates[0].requestedInputSnapshot).toEqual(request.baseline.input);
    expect(read.projection.candidates[0].inputSnapshot).toEqual(read.projection.candidates[0].prediction.input);
  });
});
