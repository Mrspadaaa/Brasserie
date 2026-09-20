import { describe, expect, it } from 'vitest';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { predictHopRecipe, assertHopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { guideFermentations, guidePredictionKnowledge, guideSolverPolicy, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { evaluateFermentationScenario } from '../../src/domain/fermentationScenario';
import { prepareHopRecipeInput } from '../../src/domain/hopIndex/recipePrediction';
import { checkHopFermentation, createHopSolverSearch, initialHopSolverIntent } from '../../src/domain/hopIndex/solver';
import { applyFermentationGuide, createFermentationDraft } from '../../src/domain/fermentationGuide';
import { pitchFeedback } from '../../src/domain/brewAssist';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { fullRecipe } from '../fixtures/fullRecipe';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import trials from '../../src/data/hopTrialBootstrap.json';

const recipe = () => ({ ...structuredClone(fullRecipe), hops: [], yeast: { name: 'LalBrew Diamond', hopIndexId: 'lalbrew-diamond', form: 'sèche' as const, qty: 0, unit: 'g' }, fermentation: [{ name: 'Primaire', kind: 'primaire' as const, tempC: 19, days: 7 }] });
const diamond = () => structuredClone(catalogue.find(y => y.id === 'lalbrew-diamond')) as HopYeast;
function compare(r: typeof fullRecipe, saved: HopKnowledge[]) {
  const knowledge = guidePredictionKnowledge(saved), yeasts = guideYeasts(saved), guides = guideFermentations(saved);
  const scenario = evaluateFermentationScenario(r, yeasts, guides);
  const input = prepareHopRecipeInput(r, [], yeasts).input;
  const aggregate = predictHopRecipe(input, {}, { varieties: [], lots: [], knowledge });
  const checks = checkHopFermentation(r, scenario.yeast?.id, guideSolverPolicy(saved)!);
  const c: BrewerContext = { recipe: r, now: 1788955200000, phase: 'Planification', provenance: [], inventory: [], material: [], waterSources: [], editableTargets: ['recipe'], hopIndex: { varieties: [], lots: [], knowledge, predictions: [], tastings: [], truncated: [] } };
  const companion = runBrewerTool('fermentation_advice', { goal: 'clean' }, c).data as { programWarnings: string[] };
  // Hop tools only receive the process: grist/OG-dependent warnings belong to
  // the recipe projection and companion, not to the aroma transport.
  expect(aggregate.warnings).toEqual(scenario.issues.map(i => i.message));
  expect(checks.map(c => c.message)).toEqual(scenario.issues.map(i => i.message));
  expect(companion.programWarnings).toEqual(scenario.warnings);
  return scenario;
}
describe('Même contexte de levure dans les quatre parcours', () => {
  it('laisse un ancien brassin sans fiche levure chargeable et sans température inventée', () => {
    const r = { ...fullRecipe, yeast: undefined } as any;
    expect(() => prepareHopRecipeInput(r, [], [])).not.toThrow();
    expect(prepareHopRecipeInput(r, [], []).input).not.toHaveProperty('pitchTempC');
  });
  it('partage température, repos, garde, refermentation et ensemencement sans faux diagnostic de froid', () => {
    const r = { ...recipe(), yeast: { ...recipe().yeast, pitchTempC: 20 }, fermentation: [
      { name: 'Primaire', kind: 'primaire' as const, tempC: 12, days: 7 },
      { name: 'Repos', kind: 'reposDiacetyle' as const, tempC: 19, days: 2 },
      { name: 'Froid', kind: 'garde' as const, tempC: 4, days: 2 },
      { name: 'Bouteille', kind: 'refermentation' as const, tempC: 20, days: 14 }
    ] };
    const p = compare(r, [diamond()]);
    expect(p.issues.map(i => i.code)).toEqual(['outside', 'pitch']);
  });
  it('un guide actif édité remplace les anciens repères du solveur dans tous les parcours', () => {
    const guide = structuredClone(guideFermentations([]).find(g => g.yeastId === 'wyeast-3068')!);
    guide.version = 'test-revision'; guide.temperatureC.range = { min: 17, max: 25 };
    const r = recipe(); r.yeast.hopIndexId = guide.yeastId; r.yeast.name = 'Wyeast 3068'; r.fermentation[0].tempC = 17.5;
    expect(compare(r, [guide]).issues).toEqual([]);
  });
  it('un guide désactivé laisse les faits fabricant indépendants cohérents dans les quatre parcours', () => {
    const guide = { ...guideFermentations([]).find(g => g.yeastId === 'wyeast-3068')!, enabled: false };
    const r = recipe(); r.yeast.hopIndexId = guide.yeastId; r.yeast.name = 'Wyeast 3068'; r.fermentation[0].tempC = 30;
    const p = compare(r, [guide]);
    expect(p.guide).toBeUndefined();
    expect(p.temperature?.range).toEqual({ min: 18, max: 24 });
    expect(p.issues.map(i => i.code)).toEqual(['outside']);
  });
  it('un guide désactivé et un catalogue personnel sans température ne ressuscitent aucun ancien repère', () => {
    const guide = { ...guideFermentations([]).find(g => g.yeastId === 'wyeast-3068')!, enabled: false };
    const yeast = structuredClone(guideYeasts([]).find(y => y.id === guide.yeastId)!);
    yeast.catalogue!.facts = yeast.catalogue!.facts.filter(f => f.key !== 'temperature');
    const r = recipe(); r.yeast.hopIndexId = guide.yeastId; r.yeast.name = 'Wyeast 3068'; r.fermentation[0].tempC = 30;
    const p = compare(r, [guide, yeast]);
    expect(p.guide).toBeUndefined();
    expect(p.temperature).toBeUndefined();
    expect(p.issues.map(i => i.code)).toEqual(['window']);
  });
  it.each(['Cider', 'Wine'])('la fenêtre d’une autre application (%s) reste documentaire', context => {
    const y = diamond(); y.catalogue!.facts.filter(f => f.key === 'temperature').forEach(f => { f.context = context; });
    expect(compare(recipe(), [y]).temperature).toBeUndefined();
  });
  it('une source contradictoire ne déclenche ni moyenne ni retour à un ancien défaut', () => {
    const y = diamond(); y.catalogue!.facts.push({ ...y.catalogue!.facts.find(f => f.key === 'temperature')!, range: { min: 18, max: 22 } });
    expect(compare(recipe(), [y]).temperature).toBeUndefined();
  });
  it('transporte la plage personnelle sans la remplacer par le guide ou le catalogue', () => {
    const r = recipe();
    r.yeast = { ...r.yeast, technicalFacts: [{ key: 'temperature', reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range', origin: 'personal', source: 'Carnet du lot 42', context: 'Bière' }] } as typeof r.yeast;
    r.fermentation[0].tempC = 28;
    const before = structuredClone(r), p = compare(r, [diamond()]);
    expect(p.temperature?.range).toEqual({ min: 18, max: 30 }); expect(p.issues).toEqual([]);
    const input = prepareHopRecipeInput(r, [], guideYeasts([diamond()])).input;
    expect(input.yeastTemperature?.source?.reference).toBe('Carnet du lot 42');
    expect(() => assertHopRecipeInput(JSON.parse(JSON.stringify(input)))).not.toThrow();
    r.fermentation[0].tempC = 31;
    expect(compare(r, [diamond()]).issues.map(i => i.code)).toEqual(['outside']);
    expect(compare(r, [diamond()]).warnings.join(' ')).toContain('plage de conduite retenue (18–30 °C)');
    r.fermentation[0].tempC = 28; expect(r).toEqual(before);
    expect(checkHopFermentation(r, 'wyeast-3068', guideSolverPolicy([diamond()])!).some(c => c.message.includes('18–30'))).toBe(false);
  });
  it('un conflit personnel reste inconnu dans les quatre parcours, sans retour au catalogue', () => {
    const r = recipe(), fact = { key: 'temperature' as const, reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range' as const, origin: 'personal' as const };
    r.yeast = { ...r.yeast, technicalFacts: [fact, { ...fact, reported: '19–22 °C', range: { min: 19, max: 22 } }] } as typeof r.yeast;
    const p = compare(r, [diamond()]);
    expect(p.temperature).toBeUndefined(); expect(p.issues.map(i => i.code)).toEqual(['window']);
    const input = prepareHopRecipeInput(r, [], guideYeasts([diamond()])).input;
    expect(input.yeastTemperature).toBeNull();
    expect(() => assertHopRecipeInput({ ...input, yeastTemperature: { range: { min: 30, max: 18 } } })).toThrow('plage de conduite');
    expect(() => assertHopRecipeInput({ ...input, yeastTemperature: { range: { min: 18, max: 30 }, source: { title: 'Sans référence' } } })).toThrow('source de conduite');
  });
  it('une entrée figée sans dossier garde ses diagnostics et nombres d’origine', () => {
    const r = recipe(), knowledge = guidePredictionKnowledge([diamond()]), input = prepareHopRecipeInput(r, [], guideYeasts([diamond()])).input;
    expect(input).not.toHaveProperty('yeastTemperature');
    const frozen = JSON.parse(JSON.stringify(input)), data = { varieties: [], lots: [], knowledge };
    const old = predictHopRecipe(frozen, {}, data, 'hop-recipe-experimental-v3');
    expect(old.warnings).toEqual(['Primaire : 19 °C, hors de la fenêtre fabricant (10–15 °C).']);
    const modern = predictHopRecipe({ ...input, yeastTemperature: { range: { min: 18, max: 30 } } }, {}, data);
    expect(modern.warnings).toEqual([]); expect(modern.overall).toEqual(old.overall); expect(modern.chemistry).toEqual(old.chemistry);
    expect(predictHopRecipe(frozen, {}, data, 'hop-recipe-experimental-v3')).toEqual(old);
    expect(frozen).toEqual(input);
  });
  it('distingue fruits/sucre et houblon annoncé dans une note, et ne compte pas une ligne à zéro', () => {
    const r = { ...recipe(), fermentation: [...recipe().fermentation, { kind: 'ajout' as const, name: 'Fruits et sucre', note: '', tempC: 19, days: 0 }] };
    expect(compare(r, [diamond()]).issues.some(i => i.code === 'dry-hop')).toBe(false);
    r.fermentation[1].note = 'Houblonnage à cru';
    const dry = { ...r, hops: [{ name: 'Cascade', stage: 'dryHop' as const, aromaTiming: 'postFermentation' as const, weightG: 0 }] };
    expect(compare(dry, [diamond()]).issues.some(i => i.code === 'dry-hop')).toBe(true);
    dry.hops[0].weightG = 20;
    expect(compare(dry, [diamond()]).issues.some(i => i.code === 'dry-hop')).toBe(false);
  });
  it('conserve les preuves POF opposées au lieu de valider silencieusement la dernière', () => {
    const guide = structuredClone(guideFermentations([]).find(g => g.yeastId === 'wyeast-3068')!); guide.aroma.pof = 'negative';
    const saved = [guide], knowledge = guidePredictionKnowledge(saved), policy = guideSolverPolicy(saved)!;
    const r = recipe(); r.yeast.hopIndexId = guide.yeastId; r.yeast.name = 'Wyeast 3068';
    const intent = { ...initialHopSolverIntent(r, policy), chemistry: { phenols: 'seek' as const }, keepYeast: true, timings: ['postFermentation' as const] };
    const search = createHopSolverSearch({ recipe: r, intent, policy, target: {}, data: { varieties: trials.hopVarieties.slice(0, 1) as HopVariety[], lots: [], knowledge } });
    const rows = search.evaluateBatch(0, search.total); expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.checks.find(c => c.message.includes('caractère POF'))).toMatchObject({ status: 'unknown' });
  });
  it('les anciens diagnostics restent rejouables, les nombres v2/v3 sont identiques', () => {
    const r = { ...recipe(), fermentation: [...recipe().fermentation, { kind: 'ajout' as const, name: 'Sucre', tempC: 19, days: 0 }] };
    const knowledge = guidePredictionKnowledge([diamond()]), input = prepareHopRecipeInput(r, [], guideYeasts([diamond()])).input, data = { varieties: [], lots: [], knowledge };
    const old = predictHopRecipe(input, {}, data, 'hop-recipe-experimental-v2'), next = predictHopRecipe(input, {}, data);
    expect(old.warnings.join(' ')).toContain('aucun houblon à cru'); expect(next.warnings.join(' ')).not.toContain('aucun ajout à cru');
    expect(next.overall).toEqual(old.overall); expect(next.chemistry).toEqual(old.chemistry);
  });
  it('sépare la fenêtre fabricant des consignes et relit correctement les anciens guides figés', () => {
    const guide = guideFermentations([]).find(g => g.yeastId === 'lallemand-munich-classic')!, yeast = guideYeasts([]).find(y => y.id === guide.yeastId)!;
    const r = applyFermentationGuide(recipe(), guide, (({aliases,...reference}) => reference)(yeast), createFermentationDraft(guide, 'banana')!);
    expect(r.yeast.fermTempMinC).toBe(17); expect(r.yeast.fermTempMaxC).toBe(25); expect(r.yeast.fermentDays).toBeUndefined();
    r.yeast.fermTempMinC = 20; r.yeast.fermTempMaxC = 21;
    r.yeastGuide!.applied.yeast = { ...r.yeast };
    expect(pitchFeedback(r, 19)).not.toContain('En dessous');
    r.yeast.fermTempMinC = 19.5; expect(pitchFeedback(r, 19)).toContain('En dessous');
  });
});
