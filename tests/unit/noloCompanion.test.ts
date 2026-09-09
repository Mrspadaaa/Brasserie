import { describe, expect, it } from 'vitest';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { refreshCompanionRecipe } from '../../src/domain/brewerRecipeRefresh';
import { evaluateNoloRecipe, newNoloConfig, noloRecipeForBatch, noloScience } from '../../src/domain/nolo';
import { noloInputBasis } from '../../functions/src/noloCore';
import { noloInput } from '../../src/domain/nolo';
import { validateChatInput } from '../../functions/src/brewerContext';
import { brewerContextForPrompt, brewerContextForStorage } from '../../functions/src/hopCompanionContext';
import { applyProposal, prepareProposal } from '../../functions/src/brewerProposals';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { fullRecipe } from '../fixtures/fullRecipe';
import { testHopData, testHopTriplet } from '../fixtures/hopPrediction';
import noloPack from '../../src/data/noloBootstrap.json';
import stylePack from '../../src/data/brewingStylesBootstrap.json';

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
});
