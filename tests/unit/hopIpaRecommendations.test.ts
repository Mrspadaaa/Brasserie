import { beforeAll, describe, expect, it } from 'vitest';
import { guidePredictionKnowledge, guideSolverPolicy, loadGuideVarieties } from '../../src/ui/hopIndex/guideData';
import { applyHopSolverCandidate, compareHopSolverCandidates, createHopSolverSearch, initialHopSolverIntent, type HopSolverSearchOptions } from '../../src/domain/hopIndex/solver';
import { runHopSolverSearch, type HopSearchUpdate } from '../../src/domain/hopIndex/solverSearch';
import { hopStyleGuidance, isModernIpaStyle, suggestedHopVarieties } from '../../src/domain/hopIndex/styleSelection';
import { HOP_QUICK_LIMITS } from '../../src/domain/hopIndex/solverSelection';
import { hopFitsStyle } from '../../src/domain/hopRecipeDesign';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopTrial } from '../../functions/src/hopTrialSchema';
import type { HopSolverPolicy } from '../../functions/src/hopSolverSchema';
import solverPack from '../../src/data/hopSolverBootstrap.json';
import { fullRecipe } from '../fixtures/fullRecipe';

let options: HopSolverSearchOptions;
let varieties: HopVariety[];
const names = ['Citra', 'Idaho 7', 'Galaxy'];
const chosenIds = () => names.map(name => varieties.find(v => v.name === name)!.id);

beforeAll(async () => {
  varieties = await loadGuideVarieties();
  const knowledge = guidePredictionKnowledge([]), policy = guideSolverPolicy([])!;
  const style = policy.styles.find(s => s.name === 'Double IPA · BJCP 2021')!;
  const lotus = varieties.find(v => v.name === 'Lotus')!;
  const recipe = { ...structuredClone(fullRecipe), style: 'Double IPA', styleRef: undefined, nolo: undefined, volumeL: 24,
    yeast: { name: 'SafAle US-05', form: 'sèche' as const, qty: 12, unit: 'g' as const, hopIndexId: 'fermentis-us05' },
    hops: [252.78, 144].map(weightG => ({ name: 'Lotus', hopVarietyId: lotus.id, weightG, stage: 'dryHop' as const, aromaTiming: 'postFermentation' as const, aromaTemperatureC: 16, aromaContactHours: 48 })),
  };
  const intent = { ...initialHopSolverIntent(recipe, policy), styleId: style.id, avoid: style.avoid, chemistry: style.chemistry, timings: style.timings };
  options = { data: { varieties, lots: [], knowledge }, policy, intent, recipe,
    target: Object.fromEntries(['tropical', 'berries', 'melon', 'floral'].map(id => [id, { min: 66, max: 100 }])) };
});

describe('Repères IPA avec le catalogue réel', () => {
  it('inclut Galaxy avec sa source fabricant sans fabriquer une analyse de lot', () => {
    const galaxy = varieties.find(v => v.name === 'Galaxy')!;
    expect(galaxy.form).toBe('unknown');
    expect(galaxy.analysis).toEqual([]);
    expect(galaxy.descriptions[0].text).toMatch(/passion.*pêche.*agrumes/);
    expect(galaxy.descriptions[0].source).toMatchObject({ kind: 'manufacturer', author: 'Hop Products Australia',
      reference: 'https://www.hops.com.au/media-kit/data-sheets/HPA-Galaxy-Data-Sheet.pdf' });
  });

  it('propose tous les usages attestés par ordre alphabétique sans confondre les IPA anglaises', () => {
    const suggested = suggestedHopVarieties(varieties, 'Double IPA · BJCP 2021');
    expect(suggested.map(v => v.name)).toEqual(expect.arrayContaining(['Lotus', 'Azacca', 'Strata', 'Cashmere', 'Ariana', 'Sultana', 'Erebus', 'Styrian Wolf', ...names]));
    const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
    expect(suggested.map(v => v.name)).toEqual(suggested.map(v => v.name).sort(collator.compare));
    expect(suggestedHopVarieties([...varieties].reverse(), 'Double IPA · BJCP 2021')).toEqual(suggested);
    for (const style of ['Double IPA', 'Hazy IPA', 'NEIPA', 'American India Pale Ale', 'DIPA']) expect(isModernIpaStyle(style)).toBe(true);
    for (const style of ['English IPA', 'British India Pale Ale', 'IPA anglaise']) {
      expect(isModernIpaStyle(style)).toBe(false);
      expect(suggestedHopVarieties(varieties, style).map(v => v.name)).toEqual(expect.arrayContaining(['Fuggle', 'Golding (UK)', 'Challenger', 'Target', 'Admiral']));
      expect(suggestedHopVarieties(varieties, style).map(v => v.name)).not.toContain('Citra');
    }
    expect(suggestedHopVarieties(varieties, 'Pilsner')).toEqual([]);
    const citra = varieties.find(v => v.name === 'Citra')!;
    expect(suggestedHopVarieties([{ ...citra, name: 'Référence personnelle', aliases: ['Citra'] }], 'IPA')).toHaveLength(1);
    expect(suggestedHopVarieties([{ ...citra, archived: true }], 'IPA')).toEqual([]);
    for (const name of names) {
      expect(hopFitsStyle(name, 'hazy-ipa')).toBe(true);
      expect(hopFitsStyle(name, 'clean-ale')).toBe(true);
    }
  });

  it('utilise le style exact dans les filtres simples et garde les IPA non couvertes à explorer', () => {
    expect(hopFitsStyle('Jester', 'english-ale', [], 'English IPA')).toBe(true);
    expect(hopFitsStyle('Admiral', 'english-ale', [], 'English IPA')).toBe(true);
    expect(hopFitsStyle('Citra', 'english-ale', [], 'English IPA')).toBe(false);
    expect(hopFitsStyle('Citra', 'clean-ale', [], 'Black IPA')).toBe(false);
    expect(hopFitsStyle('Citra', 'clean-ale', [], 'Belgian IPA')).toBe(false);
    expect(hopFitsStyle('Saazer', 'lager', [], 'German Pils')).toBe(true);
    expect(hopFitsStyle('HBC 394', 'hazy-ipa', [], 'NE DIPA')).toBe(true);
  });

  it('donne un point de départ à Double IPA sans exclusion Hazy ni écrasement des réglages personnels', () => {
    const style = options.policy.styles.find(s => s.id === options.intent.styleId)!;
    expect(style.targets).toEqual({ citrus: 'high', tropical: 'medium' });
    expect(style.avoid).toEqual([]);
    expect(style.chemistry).toEqual({});
    const custom = structuredClone(solverPack.find(row => row.kind === 'solver')!) as HopSolverPolicy;
    custom.styles[0].targets = { floral: 'high' };
    custom.styles[0].avoid = ['resin'];
    const savedStyle = guideSolverPolicy([custom])!.styles.find(s => s.id === style.id)!;
    expect(savedStyle.targets).toEqual({ floral: 'high' });
    expect(savedStyle.avoid).toEqual(['resin']);
  });

  it('affiche six variétés distinctes pour les quatre cibles de la capture et conserve les scores du modèle', async () => {
    let result: HopSearchUpdate | undefined;
    await runHopSolverSearch(options, update => { result = update; }, () => false);
    const top = result!.results.filter(c => !c.trial).slice(0, 6);
    const topNames = top.map(c => varieties.find(v => v.id === c.triplets[0].varietyId)!.name);
    expect(top).toHaveLength(6);
    expect(new Set(topNames).size).toBe(6);
    expect(top.every(c => c.styleSuggested)).toBe(true);
    expect(top.every(c => c.triplets.every(t => hopStyleGuidance(varieties.find(v => v.id === t.varietyId)!, 'Double IPA').status === 'documented'))).toBe(true);
    const free = createHopSolverSearch({ ...options, intent: { ...options.intent, styleId: 'free' } });
    for (const candidate of top) {
      const unranked = free.evaluateProgram(candidate);
      expect(unranked.styleSuggested).toBeUndefined();
      expect(unranked.score).toEqual(candidate.score);
      expect(unranked.predictions).toEqual(candidate.predictions);
    }
    // The displayed programme is the best condition actually evaluated for its pairing.
    const engine = createHopSolverSearch(options);
    const all = engine.evaluateBatch(0, engine.total);
    for (const candidate of top) {
      const alternatives = all.filter(c => !c.trial && c.triplets[0].varietyId === candidate.triplets[0].varietyId
        && c.triplets[0].yeastId === candidate.triplets[0].yeastId).sort(compareHopSolverCandidates);
      expect(candidate.id).toBe(alternatives[0].id);
    }
  });

  it('retient les repères IPA dans le budget rapide quand les levures alternatives multiplient les possibilités', () => {
    const expanded = { ...options, intent: { ...options.intent, keepYeast: false } };
    const quick = createHopSolverSearch(expanded), full = createHopSolverSearch({ ...expanded, mode: 'exhaustive' });
    expect(quick.coverage.limited).toBe(true);
    expect(quick.coverage.fullTotal).toBe(full.total);
    expect(quick.total).toBeLessThanOrEqual(HOP_QUICK_LIMITS.variants + 20);
    const ids = new Set(quick.evaluateBatch(0, quick.total).filter(c => !c.trial).flatMap(c => c.triplets.map(t => t.varietyId)));
    expect(ids.size).toBeGreaterThan(6);
    expect([...ids].every(id => hopStyleGuidance(varieties.find(v => v.id === id)!, 'Double IPA').status === 'documented')).toBe(true);
  });
});

describe.each(['quick', 'exhaustive'] as const)('Choix explicite des houblons : %s', mode => {
  it('ne compare que les variétés choisies, sans modifier la levure ou les ajouts déjà présents', () => {
    const before = structuredClone(options.recipe!);
    const ids = chosenIds();
    const search = createHopSolverSearch({ ...options, mode, varietyIds: ids });
    const rows = search.evaluateBatch(0, search.total);
    expect(new Set(rows.flatMap(c => c.triplets.map(t => t.varietyId)))).toEqual(new Set(ids));
    expect(rows.every(c => c.triplets.every(t => t.yeastId === 'fermentis-us05'))).toBe(true);
    const candidate = rows.find(c => c.triplets[0].varietyId === ids[2] && !c.checks.some(check => check.status === 'conflict'))!;
    const after = applyHopSolverCandidate(options.recipe!, candidate, options.data, options.intent);
    expect(after.hops.slice(0, before.hops.length)).toEqual(before.hops);
    expect(after.hops.at(-1)?.name).toBe('Galaxy');
    expect(after.yeast).toEqual(before.yeast);
    expect(after.fermentation).toEqual(before.fermentation);
    expect(options.recipe).toEqual(before);
    expect(candidate.totalDryHopGL).toBeGreaterThanOrEqual((252.78 + 144) / 24);
  });

  it('garde tous les houblons d’un essai ensemble et ne réintroduit aucune variété hors sélection', () => {
    const trials = options.data.knowledge.filter((row): row is HopTrial => row.kind === 'trial');
    const trial = trials.find(row => new Set(row.hops.map(h => h.varietyId)).size > 1)!;
    const ids = [...new Set(trial.hops.map(h => h.varietyId))];
    const base = { ...options, mode, recipe: undefined, intent: { ...options.intent, keepYeast: false, timings: [...new Set(trial.hops.map(h => h.timing))] } };
    const complete = createHopSolverSearch({ ...base, varietyIds: ids });
    expect(complete.evaluateBatch(0, trials.length).some(c => c.trial?.id === trial.id)).toBe(true);
    const partial = createHopSolverSearch({ ...base, varietyIds: ids.slice(0, 1) });
    expect(partial.total).toBeGreaterThan(0);
    const rows = partial.evaluateBatch(0, Math.min(partial.total, HOP_QUICK_LIMITS.variants));
    expect(rows.some(c => c.trial?.id === trial.id)).toBe(false);
    expect(rows.every(c => c.triplets.every(t => t.varietyId === ids[0]))).toBe(true);
  });

  it('signale une sélection inconnue ou archivée au lieu de revenir au catalogue automatique', () => {
    const id = chosenIds()[0];
    const archivedData = { ...options.data, varieties: varieties.map(v => v.id === id ? { ...v, archived: true } : v) };
    for (const patch of [{ varietyIds: ['introuvable'] }, { varietyIds: [id, 'introuvable'] }, { data: archivedData, varietyIds: [id] }]) {
      const search = createHopSolverSearch({ ...options, mode, ...patch });
      expect(search.total).toBe(0);
      expect(search.emptyReason).toMatch(/indisponible ou archivée/);
      expect(search.evaluateBatch(0, 10)).toEqual([]);
    }
    expect(createHopSolverSearch({ ...options, mode, varietyIds: [] }).total).toBe(createHopSolverSearch({ ...options, mode }).total);
  });

  it('conserve les exclusions prioritaires et refuse un programme modifié hors sélection', () => {
    const id = chosenIds()[0];
    const selected = createHopSolverSearch({ ...options, mode, varietyIds: [id] });
    const candidate = selected.evaluateBatch(0, 1)[0];
    const outside = selected.evaluateProgram({ ...candidate, triplets: candidate.triplets.map(t => ({ ...t, varietyId: chosenIds()[2] })) });
    expect(outside.checks.some(check => check.status === 'conflict' && check.message.includes('hors de ta sélection'))).toBe(true);
    const avoid = createHopSolverSearch({ ...options, mode, varietyIds: [id], intent: { ...options.intent, avoid: ['citrus'] }, target: { citrus: { min: 66, max: 100 } } });
    const conflict = avoid.evaluateBatch(0, 1)[0];
    expect(conflict.styleSuggested).toBe(true);
    expect(conflict.checks.some(check => check.status === 'conflict')).toBe(true);
    expect(compareHopSolverCandidates(conflict, { ...candidate, styleSuggested: false })).toBeGreaterThan(0);
    expect(() => applyHopSolverCandidate(options.recipe!, conflict, options.data, options.intent)).toThrow(/conflit/);
  });
});
