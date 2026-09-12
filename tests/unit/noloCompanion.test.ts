import { describe, expect, it, vi } from 'vitest';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { refreshCompanionRecipe } from '../../src/domain/brewerRecipeRefresh';
import { evaluateNoloRecipe, newNoloConfig, noloRecipeForBatch, noloScience, noloScenarioInput } from '../../src/domain/nolo';
import { noloInputBasis } from '../../functions/src/noloCore';
import { noloInput } from '../../src/domain/nolo';
import { BATCH_FIELDS, RECIPE_FIELDS, cleanContext, pick, validateChatInput } from '../../functions/src/brewerContext';
import { brewerContextForPrompt, brewerContextForStorage } from '../../functions/src/hopCompanionContext';
import { applyProposal, prepareProposal } from '../../functions/src/brewerProposals';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { fullRecipe } from '../fixtures/fullRecipe';
import { testHopData, testHopTriplet } from '../fixtures/hopPrediction';
import noloPack from '../../src/data/noloBootstrap.json';
import stylePack from '../../src/data/brewingStylesBootstrap.json';
import { noloToolContext } from '../../src/domain/noloToolContext';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { runBrewerHarness } from '../../functions/src/brewerHarness';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { additionImpact, analyzeGravityTrial, aromaOperation, dilutionTool, fruitSugarOperation, primingSugarOperation, scaleBenchTrial, wortTool } from '../../src/domain/noloBrewTools';

const context = (): BrewerContext => {
  const recipe = { ...structuredClone(fullRecipe), hops: [], fermentables: [], waterPlan: undefined, nolo: newNoloConfig() };
  recipe.yeast = { name: 'LA-01', form: 'sèche', qty: 0, unit: 'g', hopIndexId: 'yeast-fermentis-safbrew-la-01' };
  recipe.nolo.scienceSnapshot = noloScience()!;
  recipe.nolo.wort = { ogPlato: null, sugarsGL: { glucose: { min: 2, max: 2 } }, sugarsComplete: true };
  return { recipe, now: Date.UTC(2026, 8, 9), phase: 'Empâtage', provenance: [], inventory: [], material: [],
    waterSources: [], editableTargets: ['recipe'], hopIndex: { ...testHopData(),
      knowledge: [...testHopData().knowledge, ...noloPack, ...stylePack] as HopKnowledge[],
      predictions: [], tastings: [], truncated: [] } };
};

const range = (min: number, max = min) => ({ min, max });
function toolContext(): BrewerContext {
  const c = context();
  c.recipe.volumeL = 30;
  c.recipe.fermentables = [{ name: 'Pils', weightKg: 1.5, kind: 'grain', use: 'empatage', potentialPpg: 37, pct: 100 }];
  c.recipe.totalGristKg = 1.5;
  c.recipe.nolo.brewTools = { version: 1, attenuationPct: range(20, 30), reserveAbvPct: .1,
    simulationSg: 1.008, baseMode: 'hypothesis', baseAbvPct: range(.3, .4), initialIbu: 14,
    additionKind: 'fruit', additionName: 'Purée', fruitKg: 1.25, fruitSugarGPer100G: 12, fruitVolumeL: 1.1,
    primingGL: 2, primingSugar: 'glucose', aromaML: 30, carrierAbvPct: 40, aromaSugarG: 0,
    blendVolumeL: 1, blendAbvPct: range(4, 5), blendSugarGL: 2,
    waterL: 3, capacityL: 40, benchSampleML: 100, benchDoseML: .1,
    trialOgSg: 1.01, trialFgSg: 1.007, readingToleranceSg: .0002 };
  c.recipe.nolo.trials = [{ id: 'glass', name: 'Essai avec témoin', volumeL: .1, product: 'Extrait',
    composition: 'Alcool et sucre connus', dosageML: .1, carrierAbvPct: range(40),
    moment: 'Avant conditionnement', tasting: 'À comparer', comparator: 'Sans ajout' }];
  c.recipe.nolo.measurements = [{ id: 'lab', stage: 'primary', date: '2026-09-12', method: 'Laboratoire',
    abvPct: range(.2, .25), volumeL: 29, sugarsGL: {}, sugarsComplete: true,
    basis: noloScenarioBasis(noloInput(c.recipe)) }];
  c.recipe.nolo.brewTools.baseBasis = noloToolContext(c.recipe);
  c.recipe.nolo.brewTools.ibuBasis = noloToolContext(c.recipe);
  return c;
}

describe('Compagnon NOLO, outils locaux sans Gemini', () => {
  it('conserve le mode, les coefficients figés et la référence de style dans le brouillon', () => {
    const c = context();
    c.recipe.styleRef = { guideId: 'styles-bjcp-2021', version: '2026-09-09.1', styleId: '10a-weissbier' };
    const clean = validateChatInput({ scope: { kind: 'draft', id: 'nolo-draft' }, operationId: 'nolo-operation-123456',
      question: 'Comment reste-t-on sous la cible ?', draft: c.recipe });
    expect(clean.draft?.nolo).toEqual(c.recipe.nolo);
    expect(clean.draft?.styleRef).toEqual(c.recipe.styleRef);
  });
  it('partage le bilan de l’écran et exclut alcool OG/FG, DF et repos lager génériques', () => {
    const c = context(), before = JSON.stringify(c), raw = evaluateNoloRecipe(c.recipe, c.hopIndex!.knowledge);
    const calc = runBrewerTool('calculate_recipe', {}, c).data as any;
    expect(calc.nolo).toEqual(raw); expect(calc.fg).toBeNull(); expect(calc.abv).toBeNull();
    const check = runBrewerTool('fermentation_check', { og: 1.046, sg: 1.005 }, c).data as any;
    expect(check.abv).toBeNull(); expect(check.nolo).toEqual(raw);
    const advice = runBrewerTool('fermentation_advice', { goal: 'banana' }, c).data as any;
    expect(advice.nolo).toEqual(raw); expect(advice.finalGravity).toBeNull(); expect(advice.lagerRest).toBeNull();
    expect(JSON.stringify(c)).toBe(before);
  });
  it('scope aussi les alternatives de triplets explicites au domaine NOLO', () => {
    const data = runBrewerTool('predict_hop_aroma', { triplets: [testHopTriplet] }, context()).data as any[];
    expect(data[0].score.range).toBeNull();
    expect(Object.values(data[0].profile).every((p: any) => p.range === null)).toBe(true);
    expect(data[0].modelRefs).toEqual([]);
  });
  it('ne recalcule ni absorption ni correction acide de malt neuf sur les drêches', () => {
    const c = context();
    c.recipe = { ...structuredClone(fullRecipe), nolo: c.recipe.nolo };
    c.recipe.nolo.process = 'secondRunnings';
    c.recipe.nolo.secondRunnings = { sourceBatchId: 'source', previousExtraction: '', waterAddedL: 20,
      alkalinityPpm: null, temperatureC: 70, minutes: 20, recoveredL: 17, sg: 1.004, ph: 5.4 };
    const refreshed = refreshCompanionRecipe(c.recipe);
    expect(refreshed.preBoilL).toBeUndefined(); expect(refreshed.preBoilHotL).toBeUndefined();
    expect(refreshed.waterPlan).toEqual(c.recipe.waterPlan);
    const calc = runBrewerTool('calculate_recipe', {}, c).data as any;
    expect(calc.og).toBe(1.004); expect(calc.recommendedWater).toBeNull(); expect(calc.waterSummary).toBeNull();
    const ph = runBrewerTool('check_ph', { ph: 5.9, reliable: true, roomTemp: true, acid: 'lactique', concentrationPct: 80 }, c).data as any;
    expect(ph.correction).toBeNull();
  });
  it('reprend les mesures et le resucrage propres au brassin une seule fois', () => {
    const c = context();
    c.batch = { id: 'batch', volumeL: c.recipe.volumeL, nolo: structuredClone(c.recipe.nolo),
      carbonation: { method: 'priming', sugarG: 150 } };
    const expected = evaluateNoloRecipe(noloRecipeForBatch({ ...c.batch, recipeSnapshot: c.recipe })!, c.hopIndex!.knowledge);
    expect((runBrewerTool('calculate_recipe', {}, c).data as any).nolo).toEqual(expected);
    expect(expected!.packagedAbv.max).toBeGreaterThan(.5);
  });
  it('ne réutilise pas une analyse de recette pour un volume hypothétique', () => {
    const c = context();
    c.recipe.nolo.measurements.push({ id: 'lab', stage: 'packaged', date: '2026-09-09', method: 'Laboratoire',
      abvPct: { min: .38, max: .42 }, basis: noloInputBasis(noloInput(c.recipe)) });
    const current = (runBrewerTool('calculate_recipe', {}, c).data as any).nolo;
    const changed = (runBrewerTool('calculate_recipe', { volumeL: 10 }, c).data as any).nolo;
    expect(current.measuredPackaged).toBe(true); expect(changed.measuredPackaged).toBe(false);
    expect(changed.alerts.some((a: any) => a.code === 'stale-measurement')).toBe(true);
  });
  it('résume les 293 fiches dans le contexte et garde le NOLO lors d’une proposition', () => {
    const c = context(), prompt = brewerContextForPrompt(c);
    const guide = prompt.hopIndex!.knowledge.find(k => k.kind === 'styleGuide')!;
    expect(guide).not.toHaveProperty('styles');
    expect(Buffer.byteLength(JSON.stringify(prompt))).toBeLessThan(100_000);
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Nom du pilote',
      changes: [{ path: 'name', valueJson: JSON.stringify('Pilote NOLO'), reason: 'Nom choisi' }] });
    const stored = brewerContextForStorage(c, proposal);
    expect(stored.hopIndex!.knowledge.some(k => k.kind === 'styleGuide')).toBe(false);
    expect(applyProposal(stored, proposal, proposal.changes.map(ch => ch.id)).nolo).toEqual(c.recipe.nolo);
  });
  it('empêche une cible scalaire contradictoire et détache un style changé explicitement', () => {
    const c = context();
    c.recipe.styleRef = { guideId: 'styles-bjcp-2021', version: '2026-09-09.1', styleId: 'weissbier' };
    expect(() => prepareProposal(c, { target: 'recipe', title: 'Alcool',
      changes: [{ path: 'abvTarget', valueJson: '5', reason: 'Ancien calcul' }] })).toThrow();
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Style personnel',
      changes: [{ path: 'style', valueJson: '"Ma bière fumée"', reason: 'Choix explicite' }] });
    const changed = applyProposal(c, proposal, proposal.changes.map(ch => ch.id));
    expect(changed.styleRef).toBeUndefined(); expect(changed.nolo).toEqual(c.recipe.nolo);
  });

  it('transmet le vrai corps du harness et ses retours de calcul sans aucun appel réseau', async () => {
    const c = toolContext();
    c.recipe.yeastDesign = { modelVersion: 'yeast-recipe-1', yeastId: c.recipe.yeast.hopIndexId,
      styleId: 'unknown', goal: 'fruit', ferulicRest: false,
      applied: { yeast: structuredClone(c.recipe.yeast), volumeL: c.recipe.volumeL,
        fermentation: structuredClone(c.recipe.fermentation ?? []), mashSteps: structuredClone(c.recipe.mash.steps) } };
    c.recipe.fermentables.push({ kind: 'fruit', use: 'fermentation', name: 'Mangue déjà prévue', weightKg: 1 });
    c.recipe.nolo.operations = [{ id: 'fruit-recorded', kind: 'sugar', name: 'Mangue déjà prévue', sugarsG: {}, complete: true,
      volumeL: 1, unclassifiedSugarG: range(120), recipeAddition: { index: 1, basis: JSON.stringify(c.recipe.fermentables[1]) } }];
    c.recipe.nolo.measurements[0].afterOperationId = 'fruit-recorded';
    c.recipe.nolo.measurements[0].basis = noloScenarioBasis(noloInput(c.recipe), 'fruit-recorded');
    c.recipe.nolo.brewTools.baseBasis = noloToolContext(c.recipe);
    c.recipe.nolo.brewTools.ibuBasis = noloToolContext(c.recipe);
    const input = validateChatInput({ scope: { kind: 'draft', id: 'nolo-draft' }, operationId: 'nolo-operation-123456',
      question: 'Relis les outils de mon pilote NOLO.', draft: c.recipe, editableTargets: ['recipe'] });
    c.recipe = normalizeRecipe(pick(input.draft, RECIPE_FIELDS));
    const { hopIndex, ...loaded } = c;
    const server = { ...cleanContext(loaded), hopIndex } as BrewerContext;
    const before = JSON.stringify(server);
    const requests: any[] = [];
    const response = (parts: any[]) => ({ candidates: [{ content: { role: 'model', parts } }] });
    let analysis = 0;
    const generate = vi.fn(async (_model: string, body: any) => {
      requests.push(structuredClone(body));
      if (body.generationConfig?.responseMimeType === 'application/json')
        return response([{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }]);
      if (!analysis++) return response([{ functionCall: { name: 'calculate_nolo_tools', args: {} } }]);
      return response([{ functionCall: { name: 'finish_advice', args: { level: 'info',
        summary: 'Les hypothèses du pilote sont calculées.', action: 'Comparer les verres au témoin.',
        why: 'Une dose par verre reste un scénario de préparation.', watch: 'Contrôler l’alcool après conditionnement.',
        question: '', evidenceIds: ['E1'] } } }]);
    });
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Aucun réseau autorisé dans ce test'));
    try {
      const out = await runBrewerHarness(server, input.question, [], generate, { mode: 'fast' });
      const payload = JSON.parse(requests[0].contents[0].parts[0].text);
      expect(payload.context.recipe.nolo).toEqual(server.recipe.nolo);
      expect(Buffer.byteLength(JSON.stringify(input))).toBeLessThan(100000);
      expect(payload.context.recipe.yeastDesign).toEqual(c.recipe.yeastDesign);
      expect(payload.editableFields.recipe).not.toHaveProperty('nolo.measurements');
      expect(payload.editableFields.recipe).not.toHaveProperty('nolo.brewTools');
      expect(requests[0].tools[0].functionDeclarations.some((tool: any) => tool.name === 'calculate_nolo_tools')).toBe(true);
      const calculation = requests[1].contents.flatMap((entry: any) => entry.parts)
        .find((part: any) => part.functionResponse?.name === 'calculate_nolo_tools');
      expect(calculation.functionResponse.response.data.status).toBe('planning_only');
      expect(calculation.functionResponse.response.data.gravityTrial.value.abvPct).toBeDefined();
      expect(out.evidence[0].name).toBe('calculate_nolo_tools');
      expect(cleanContext(out.evidence)).toEqual(out.evidence);
      expect(out.trace.filter(entry => entry.error)).toEqual([]);
      expect(network).not.toHaveBeenCalled();
      expect(JSON.stringify(server)).toBe(before);
    } finally { network.mockRestore(); }
  });

  it('partage tous les calculateurs du panneau, les volumes mesurés et l’édition scientifique figée', () => {
    const c = toolContext(), before = structuredClone(c), s = c.recipe.nolo.brewTools;
    const science = c.recipe.nolo.scienceSnapshot;
    science.planningModels.sgAbvFactor.value = 140;
    const output = runBrewerTool('calculate_nolo_tools', {}, c).data as any;
    expect(output.base).toMatchObject({ volumeL: 29, origin: 'hypothesis', abvPct: range(.3, .4) });
    expect(output.wort).toEqual(wortTool(c.recipe, { targetAbvPct: .5, reserveAbvPct: .1, attenuationPct: range(20, 30), simulationSg: 1.008 }, science));
    expect(output.dilution).toEqual(dilutionTool({ baseVolumeL: 29, baseAbvPct: range(.3, .4), targetAbvPct: .5, waterL: 3, initialIbu: 14, capacityL: 40 }));
    expect(output.bench).toEqual(scaleBenchTrial({ sampleML: 100, doseML: .1, beerVolumeL: 29 }));
    expect(output.gravityTrial).toEqual(analyzeGravityTrial({ ogSg: 1.01, fgSg: 1.007, readingToleranceSg: .0002 }, science));
    const operation = fruitSugarOperation({ id: 'nolo-addition-preview', name: 'Purée', fruitKg: 1.25, sugarsGPer100G: 12, addedVolumeL: 1.1 });
    expect(output.addition).toEqual({ operation, impact: additionImpact({ baseVolumeL: 29, baseAbvPct: range(.3, .4), targetAbvPct: .5, operation: operation.value }, science) });
    expect(output.gravityTrial.value.abvPct.max).toBeCloseTo(.476, 12);
    expect(c.recipe.nolo.measurements).toEqual(before.recipe.nolo.measurements);
    expect(c.recipe.nolo.operations).toEqual(before.recipe.nolo.operations);
    expect(c.recipe.nolo.brewTools).toEqual(s);
  });

  it.each(['priming', 'aroma', 'blend'] as const)('calcule le prochain ajout %s sans l’inscrire ni le mélanger à la dilution', kind => {
    const c = toolContext(); c.recipe.nolo.brewTools.additionKind = kind;
    const before = JSON.stringify(c), science = c.recipe.nolo.scienceSnapshot;
    const output = runBrewerTool('calculate_nolo_tools', { section: 'addition' }, c).data as any;
    const identity = { id: 'nolo-addition-preview', name: 'Purée' };
    const operation = kind === 'priming' ? primingSugarOperation({ ...identity, doseGL: 2, beerVolumeL: 29, sugar: 'glucose' }).value!
      : kind === 'aroma' ? aromaOperation({ ...identity, doseML: 30, carrierAbvPct: range(40), sugarG: 0 }).value!
      : { ...identity, kind: 'blend' as const, volumeL: 1, abvPct: range(4, 5), remainingSugarG: range(2) };
    expect(output.addition.impact).toEqual(additionImpact({ baseVolumeL: 29, baseAbvPct: range(.3, .4), targetAbvPct: .5, operation }, science));
    expect(output).not.toHaveProperty('dilution');
    expect(JSON.stringify(c)).toBe(before);
  });

  it('invalide les anciennes hypothèses, conserve les entrées absentes et ignore les outils sur une bière ordinaire', () => {
    const c = toolContext(); c.recipe.volumeL = 20;
    const output = runBrewerTool('calculate_nolo_tools', {}, c).data as any;
    expect(output.base).toMatchObject({ staleBase: true, staleIbu: true, abvPct: null });
    expect(output.inputs.initialIbu).toBeNull(); expect(output.dilution.value).toBeNull();
    expect(output.addition.impact.value).toBeNull(); expect(output.wort.value).not.toBeNull();
    delete c.recipe.nolo.brewTools;
    const empty = runBrewerTool('calculate_nolo_tools', {}, c).data as any;
    expect(empty.wort.value).toBeNull(); expect(empty.gravityTrial.value).toBeNull(); expect(empty.bench.value).toBeNull();
    expect(() => runBrewerTool('calculate_nolo_tools', { baseAbvPct: range(.3) }, c)).toThrow(/enregistrées/);
    expect(() => runBrewerTool('calculate_nolo_tools', { section: 'bogus' }, c)).toThrow(/Section/);
    c.recipe.nolo.enabled = false;
    expect(() => runBrewerTool('calculate_nolo_tools', {}, c)).toThrow(/NOLO/);
  });

  it('ne propose pas une deuxième fois un fruit lié ni le resucrage du brassin', () => {
    const c = toolContext();
    c.recipe.fermentables.push({ kind: 'fruit', use: 'fermentation', name: 'Purée', weightKg: 1 });
    c.recipe.nolo.operations = [{ id: 'fruit', kind: 'sugar', name: 'Purée', sugarsG: {}, complete: true, volumeL: 1,
      unclassifiedSugarG: range(100), recipeAddition: { index: 1, basis: JSON.stringify(c.recipe.fermentables[1]) } }];
    c.recipe.nolo.brewTools.fruitRecipeIndex = 1;
    expect((runBrewerTool('calculate_nolo_tools', { section: 'addition' }, c).data as any).addition.operation.issue).toContain('déjà lié');
    c.recipe.nolo.brewTools.additionKind = 'priming';
    c.batch = { id: 'batch', volumeL: 30, nolo: structuredClone(c.recipe.nolo), carbonation: { method: 'priming', sugarG: 50 } };
    expect(pick(c.batch, BATCH_FIELDS).nolo).toEqual(c.batch.nolo);
    expect((runBrewerTool('calculate_nolo_tools', { section: 'addition' }, c).data as any).addition.operation.issue).toContain('déjà au bilan');
  });

  it('annonce l’origine de l’OG calculée au lieu de reprendre une ancienne cible', () => {
    const c = toolContext(); c.recipe.ogTarget = 1.07;
    const input = noloScenarioInput(c.recipe), output = runBrewerTool('calculate_recipe', {}, c).data as any;
    expect(output.og).toBe(input.og!.range.min); expect(output.og).not.toBe(1.07);
    expect(output.ogTarget).toBe(1.07); expect(output.ogContext.origin).toBe('calculated');
    c.recipe.nolo.process = 'coldExtraction';
    expect((runBrewerTool('calculate_recipe', {}, c).data as any).og).toBeNull();
  });

  it('nettoie le vrai contexte conservé d’une proposition NOLO riche sans en perdre l’identité', () => {
    const c = toolContext();
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Nom du pilote',
      changes: [{ path: 'name', valueJson: '"Pilote NOLO vérifié"', reason: 'Nom choisi' }] });
    expect(proposal.basis.length).toBeGreaterThan(12000);
    const turn = cleanContext({ proposal });
    const snapshot = cleanContext(brewerContextForStorage(c, proposal));
    expect(turn.proposal).toEqual(proposal);
    expect(applyProposal(snapshot, proposal, proposal.changes.map(change => change.id)).nolo).toEqual(c.recipe.nolo);
  });

  it('rejette les dépassements de profondeur, de texte, de collections et de taille UTF-8', () => {
    const nested = (depth: number) => Array.from({ length: depth }).reduce(value => ({ next: value }), 'leaf' as any);
    expect(cleanContext(nested(18))).toEqual(nested(18));
    expect(() => cleanContext(nested(19))).toThrow(/imbriqué/);
    expect(cleanContext({ note: 'x'.repeat(12000) })).toHaveProperty('note');
    expect(() => cleanContext({ note: 'x'.repeat(12001) })).toThrow(/long/);
    for (const key of ['basis', 'baseBasis', 'ibuBasis']) {
      expect(cleanContext({ [key]: 'x'.repeat(100000) })[key]).toHaveLength(100000);
      expect(() => cleanContext({ [key]: 'x'.repeat(100001) })).toThrow(/long/);
    }
    expect(cleanContext(Array(500).fill(0))).toHaveLength(500);
    expect(() => cleanContext(Array(501).fill(0))).toThrow(/valeurs/);
    expect(() => cleanContext(Object.fromEntries(Array.from({ length: 501 }, (_, index) => [index, 0])))).toThrow(/champs/);
    expect(() => cleanContext({ n: Infinity })).toThrow(/fini/);
    expect(cleanContext(JSON.parse('{"safe":1,"constructor":{},"nested":{"__docId":"db-id","__proto__":{}}}'))).toEqual({ safe: 1, nested: {} });
    const c = toolContext();
    const raw = { scope: { kind: 'draft', id: 'nolo-draft' }, operationId: 'nolo-operation-123456', question: 'Relis le pilote.', draft: c.recipe };
    expect(() => validateChatInput(raw)).not.toThrow();
    expect(() => validateChatInput({ ...raw, extra: 'é'.repeat(50000) })).toThrow(/volumineux/);
    c.recipe.nolo.brewTools.attenuationPct = range(60, 20);
    expect(() => validateChatInput(raw)).toThrow(/NOLO/);
  });
});
