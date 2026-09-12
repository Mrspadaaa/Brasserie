import { describe, expect, it } from 'vitest';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { yeastReferences, type YeastReference } from '../../src/domain/yeastReferences';
import references from '../../src/data/yeastRecipeReferences.json';
import { YEAST_RECIPE_PROFILES } from '../../src/data/yeastRecipeProfiles';
import {
  applyYeastRecipeDesign, calculateYeastCellRequirement, completeYeastRecipeDesignApplication, createYeastRecipeDraft, evaluateYeastRecipeDesign,
  inferYeastRecipeStyle, proposeYeastGoalSettings, readYeastRecipeDesign, yeastRecipeCandidates, yeastRecipeDesignChanged, yeastRecipeHopSummary,
  type YeastRecipeDraft, type YeastStyleId
} from '../../src/domain/yeastRecipeDesign';
import { fullRecipe } from '../fixtures/fullRecipe';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import type { Recipe } from '../../src/types';

const refs = references.map(y => ({ ...y, aliases: y.catalogue.aliases })) as YeastReference[];
const ref = (id: string) => refs.find(y => y.id === id)!;
const recipe = (id = 'wyeast-3068') => ({ ...structuredClone(fullRecipe), name: 'Essai blé', style: 'Hefeweizen', volumeL: 20, ogTarget: 1.05,
  yeast: { name: ref(id).name, hopIndexId: id, form: ref(id).form!, qty: 0, unit: ref(id).form === 'sèche' ? 'g' : 'mL', pitchTempC: 20 },
  fermentation: [
    { name: 'Principale', kind: 'primaire' as const, tempC: 20, days: 7, note: 'Suivre la densité.' },
    { name: 'Deuxième rampe', kind: 'primaire' as const, tempC: 21, days: 2 },
    { name: 'Fruits', kind: 'ajout' as const, tempC: 21, days: 0, note: 'Ajout réel dans ingrédients.' },
    { name: 'Repos', kind: 'reposDiacetyle' as const, tempC: 21, days: 2 },
    { name: 'Garde', kind: 'garde' as const, tempC: 2, days: 7 }
  ], hops: [], fermentables: [{ name: 'Blé', kind: 'grain' as const, use: 'empatage' as const, weightKg: 5 }],
  mash: { ratioLPerKg: 3, spargeTempC: 76, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }, { name: 'Mash-out', tempC: 76, durationMin: 10 }] }
});
const draft = (r = recipe(), patch: Partial<YeastRecipeDraft> = {}) => ({ ...createYeastRecipeDraft(r, refs), ...patch });

describe('Choisir une levure par le style, puis par une raison documentée', () => {
  it('livre des références traçables, uniques et validées sans fusion entre laboratoires', () => {
    expect(refs.length).toBeGreaterThan(18);
    expect(new Set(refs.map(y => y.id)).size).toBe(refs.length);
    for (const y of references) expect(() => assertHopKnowledge(y)).not.toThrow();
    // Profiles may reference the core and enrichment catalogues, as the actual UI does.
    const catalogue = yeastReferences([]);
    for (const p of YEAST_RECIPE_PROFILES) {
      const reference = catalogue.find(y => y.id === p.yeastId);
      expect(reference, `Référence absente du catalogue : ${p.label}`).toBeDefined();
      const { aliases: _aliases, ...document } = reference!;
      expect(() => assertHopKnowledge(document)).not.toThrow();
    }
    expect(ref('white-labs-wlp066').form).toBe('liquide');
    expect(ref('white-labs-wlp066').catalogue?.gaps.join(' ')).toContain('aussi proposée sèche');
  });
  it.each([
    ['weissbier', 'weissbier'], ['dunkles-weissbier', 'weissbier'], ['weizenbock', 'weissbier'],
    ['witbier', 'witbier'], ['american-wheat-beer', 'american-wheat'], ['hazy-ipa', 'hazy-ipa'],
    ['german-pils', 'lager'], ['saison', 'saison'], ['belgian-tripel', 'belgian-ale'], ['strong-bitter', 'english-ale']
  ] as [string, YeastStyleId][])('interprète le style explicite %s avant le nom commercial', (styleId, expected) => {
    const r = { ...recipe(), style: 'American Wheat', name: 'Hefe commerciale', styleRef: { styleId, guideId: 'bjcp-2021', version: '2021' } };
    expect(inferYeastRecipeStyle(r)).toBe(expected);
  });
  it('laisse les noms ambigus inconnus sans défaut ale neutre', () => {
    expect(inferYeastRecipeStyle({ ...recipe(), style: 'Bière de blé maison' })).toBe('unknown');
    expect(inferYeastRecipeStyle({ ...recipe(), style: '', name: 'Ma Hefeweisse' })).toBe('weissbier');
    expect(inferYeastRecipeStyle({ ...recipe(), style: 'American Hefeweizen' })).toBe('american-wheat');
    expect(inferYeastRecipeStyle({ ...recipe(), styleRef: { guideId: 'personnel', version: '1', styleId: 'custom-42' } })).toBe('unknown');
  });
  it('sépare les trois familles de blé, avec WB-06 comme alternative sèche explicite', () => {
    const hefe = yeastRecipeCandidates('weissbier', 'balanced', refs, 20), wit = yeastRecipeCandidates('witbier', 'balanced', refs, 20), american = yeastRecipeCandidates('american-wheat', 'clean', refs, 20);
    expect(hefe.length).toBeLessThan(10);
    expect(hefe.map(y => y.yeastId)).toContain('wyeast-3068');
    expect(hefe.map(y => y.yeastId)).not.toContain('wyeast-3944');
    expect(hefe.map(y => y.yeastId)).not.toContain('wyeast-1010');
    expect(wit.map(y => y.yeastId)).toContain('wyeast-3944');
    expect(wit.map(y => y.yeastId)).not.toContain('wyeast-3068');
    expect(american.map(y => y.yeastId)).toContain('wyeast-1010');
    expect(american.map(y => y.yeastId)).not.toContain('white-labs-wlp300');
    expect(hefe.find(y => y.yeastId === 'yeast-fermentis-safale-wb-06')?.descriptor).toContain('diastatique');
  });
  it('explique WLP380 pour le girofle et 3638 pour la diversité fruitée sans identité supposée', () => {
    const clove = yeastRecipeCandidates('weissbier', 'clove', refs), fruity = yeastRecipeCandidates('weissbier', 'fruit', refs);
    expect(clove.find(y => y.yeastId === 'white-labs-wlp380')).toMatchObject({ preferred: true, temperature: { range: { min: 19, max: 21 } } });
    expect(clove.find(y => y.yeastId === 'white-labs-wlp380')?.sources.some(s => s.reference.includes('whitelabs.com'))).toBe(true);
    const bavarian = fruity.find(y => y.yeastId === 'wyeast-3638')!;
    expect(bavarian.preferred).toBe(true);
    expect(bavarian.reason).toMatch(/fruit|ester|banan/i);
    expect(bavarian.evidence.goalMatches.some(m => m.goal === 'fruit')).toBe(true);
  });
});

describe('Simulations bornées par les données réelles', () => {
  it('préserve les inconnues et une référence explicite absente', () => {
    const r = { ...recipe(), yeast: { ...recipe().yeast, hopIndexId: 'missing' }, fermentation: [], ogTarget: null };
    const d = createYeastRecipeDraft(r, refs), result = evaluateYeastRecipeDesign(r, d, refs);
    expect(d.yeastId).toBe(''); expect(d.temperatureC).toBeUndefined(); expect(d.days).toBeUndefined();
    expect(result.candidate).toBeUndefined(); expect(result.fg.range).toBeNull(); expect(result.abv.range).toBeNull();
    expect(result.errors.join(' ')).toContain('référence');
    expect(() => applyYeastRecipeDesign(r, d, refs)).toThrow();
  });
  it('ne copie pas quantité et température d’ensemencement à une autre souche', () => {
    const r = { ...recipe('fermentis-us05'), yeast: { ...recipe('fermentis-us05').yeast, qty: 15 } };
    const d = createYeastRecipeDraft(r, refs, 'weissbier', 'lallemand-munich-classic');
    expect(d.quantityG).toBeUndefined(); expect(d.pitchTempC).toBeUndefined();
    expect(d.temperatureC).toBe(20); expect(d.days).toBe(7);
    expect(evaluateYeastRecipeDesign(r, d, refs).warnings.join(' ')).toContain('Quantité de levure sèche à renseigner');
  });
  it('convertit 20 L en doses fabricant différentes sans supposer les sachets', () => {
    const candidates = yeastRecipeCandidates('weissbier', 'balanced', refs, 20);
    expect(candidates.find(c => c.yeastId === 'lallemand-munich-classic')?.doseG?.range).toEqual({ min: 10, max: 20 });
    expect(candidates.find(c => c.yeastId === 'fermentis-w68')?.doseG?.range).toEqual({ min: 10, max: 16 });
    expect(candidates.find(c => c.yeastId === 'wyeast-3068')?.doseG).toBeUndefined();
    expect(yeastRecipeCandidates('weissbier', 'balanced', refs, 0).every(c => c.doseG === undefined)).toBe(true);
  });
  it('calcule la DF avec les bornes inversées, et l’alcool de la même enveloppe', () => {
    const r = { ...recipe('lalbrew-verdant-ipa'), style: 'Hazy IPA', ogTarget: 1.06 }, d = draft(r);
    const result = evaluateYeastRecipeDesign(r, d, refs);
    expect(result.fg.range?.min).toBeCloseTo(1.0108, 10); expect(result.fg.range?.max).toBeCloseTo(1.015, 10);
    expect(result.abv.range?.min).toBeCloseTo(5.90625, 8); expect(result.abv.range?.max).toBeCloseTo(6.4575, 8);
    const other = evaluateYeastRecipeDesign(r, { ...d, yeastId: 'wyeast-1318', quantityG: undefined }, refs);
    expect(other.fg.range?.min).toBeCloseTo(1.015, 10); expect(other.fg.range?.max).toBeCloseTo(1.0174, 10);
    expect(result.fg.reasons.join(' ')).toContain('ni DF garantie ni intervalle statistique');
    expect(r.fgTarget).toBe(fullRecipe.fgTarget);
  });
  it('n’applique pas une plage différente aux sources en conflit, même si un ancien guide existe', () => {
    const r = recipe(), conflicting = structuredClone(ref('wyeast-3068'));
    conflicting.catalogue!.facts.push({ ...conflicting.catalogue!.facts.find(f => f.key === 'attenuation')!, range: { min: 65, max: 70 } });
    conflicting.catalogue!.facts.push({ ...conflicting.catalogue!.facts.find(f => f.key === 'temperature')!, range: { min: 19, max: 22 } });
    const result = evaluateYeastRecipeDesign(r, draft(r), [conflicting]);
    expect(result.candidate?.temperature).toBeUndefined(); expect(result.fg.range).toBeNull();
    expect(proposeYeastGoalSettings(r, { ...draft(r), goal: 'banana' }, [conflicting])).toBeUndefined();
    expect(result.warnings.join(' ')).toContain('sources non concordantes');
  });
  it('ne masque pas un conflit POF derrière le profil éditorial et n’assimile pas inconnu à négatif', () => {
    const r = recipe(), y = structuredClone(ref('wyeast-3068'));
    const observation = { key: 'pof' as const, label: 'POF', reported: 'positive', source: y.source };
    y.catalogue!.facts.push(observation, { ...observation, reported: 'negative' });
    const d = draft(r, { goal: 'clove', ferulicRest: true }), result = evaluateYeastRecipeDesign(r, d, [y]);
    expect(result.effects.find(e => e.id === 'ferulic')?.state).toBe('unknown');
    expect(result.warnings.join(' ')).toContain('Capacité phénolique non concordante');
    expect(proposeYeastGoalSettings(r, d, [y])).toBeUndefined();
    expect(() => applyYeastRecipeDesign(r, d, [y])).toThrow('capacité phénolique');
  });
  it('conserve le conflit Farmhouse et compare les deux atténuations de saison', () => {
    const r = { ...recipe('lalbrew-belle-saison'), style: 'Saison' }, d = draft(r);
    const belle = evaluateYeastRecipeDesign(r, d, refs), farmhouse = evaluateYeastRecipeDesign(r, { ...d, yeastId: 'lalbrew-farmhouse' }, refs);
    expect(belle.fg.range?.min).toBeCloseTo(1.003, 10); expect(belle.fg.range?.max).toBeCloseTo(1.007, 10);
    expect(farmhouse.fg.range?.min).toBeCloseTo(1.008, 10); expect(farmhouse.fg.range?.max).toBeCloseTo(1.011, 10);
    expect(farmhouse.candidate?.temperature).toBeUndefined();
    expect(belle.effects.find(e => e.id === 'diastatic')?.state).toBe('warning');
    expect(farmhouse.effects.find(e => e.id === 'diastatic')?.impact).toContain('non diastatique');
  });
  it('supprime les projections NOLO et refuse les unités SG invraisemblables', () => {
    const r = recipe();
    for (const ogTarget of [null, 0, 1, 12, NaN, Infinity]) expect(evaluateYeastRecipeDesign({ ...r, ogTarget }, draft(r), refs).fg.range).toBeNull();
    const nolo = evaluateYeastRecipeDesign({ ...r, nolo: { enabled: true } as any }, draft(r), refs);
    expect(nolo.fg.range).toBeNull(); expect(nolo.abv.range).toBeNull(); expect(nolo.fg.reasons.join(' ')).toContain('NOLO');
  });
  it('applique la tendance esters des Wyeast à ces seules souches', () => {
    const r = recipe(), high = evaluateYeastRecipeDesign(r, draft(r, { temperatureC: 23, goal: 'banana' }), refs), low = evaluateYeastRecipeDesign(r, draft(r, { temperatureC: 18, goal: 'clove' }), refs);
    expect(high.effects.find(e => e.id === 'temperature')?.impact).toBe('Esters potentiellement favorisés');
    expect(low.effects.find(e => e.id === 'temperature')?.detail).toContain('ne prédit pas davantage de 4-VG');
    const dry = recipe('lallemand-munich-classic'), noTransfer = evaluateYeastRecipeDesign(dry, draft(dry, { temperatureC: 25, goal: 'banana' }), refs);
    expect(noTransfer.effects.find(e => e.id === 'temperature')?.state).toBe('unknown');
    expect(noTransfer.effects.find(e => e.id === 'temperature')?.detail).toContain('ne sont pas transférées');
    expect(noTransfer.effects.find(e => e.id === 'pitch-esters')?.source?.author).toBe('Lallemand Brewing');
  });
  it('présente pression, dose et repos comme leviers conditionnels, sans score sensoriel', () => {
    const r = recipe(), result = evaluateYeastRecipeDesign(r, draft(r, { pressureBar: 0.8, ferulicRest: true, goal: 'banana' }), refs);
    expect(result.effects.find(e => e.id === 'pressure')?.state).toBe('warning');
    expect(result.effects.find(e => e.id === 'pressure')?.detail).toContain('Pas de seuil ni de perte par bar');
    expect(result.effects.find(e => e.id === 'ferulic')?.detail).toContain('durée est éditoriale');
    expect(result.effects.some(e => 'score' in e || 'value' in e || 'percent' in e)).toBe(false);
  });
  it('propose un point de départ explicitement éditorial sans sous-ensemencement automatique', () => {
    const r = recipe(), d = draft(r, { goal: 'banana', quantityG: undefined }), before = structuredClone(d);
    const proposal = proposeYeastGoalSettings(r, d, refs)!;
    expect(proposal.patch.temperatureC).toBe(22); expect(proposal.patch.quantityG).toBeUndefined();
    expect(proposal.patch.pressureBar).toBeUndefined(); expect(proposal.source.kind).toBe('judgment');
    expect(proposal.rationale).toContain('durée saisie est conservée'); expect(d).toEqual(before);
    const clove = proposeYeastGoalSettings(r, { ...d, goal: 'clove' }, refs)!;
    expect(clove.patch).toEqual({ temperatureC: 18, ferulicRest: true });
    expect(clove.rationale).toContain('Ni durée de repos optimale ni hausse de 4-VG démontrée');
    expect(proposeYeastGoalSettings(recipe('fermentis-us05'), draft(recipe('fermentis-us05'), { goal: 'banana' }), refs)).toBeUndefined();
  });
  it('bloque les valeurs invalides et hors fenêtre lors de l’application des réglages', () => {
    const r = recipe();
    for (const patch of [{ temperatureC: 25 }, { pitchTempC: 5 }, { days: 0 }, { days: -2 }, { pressureBar: -1 }, { quantityG: 15 }, { temperatureC: NaN }]) {
      const d = draft(r, patch); expect(evaluateYeastRecipeDesign(r, d, refs).errors.length).toBeGreaterThan(0);
      expect(() => applyYeastRecipeDesign(r, d, refs)).toThrow();
    }
    expect(() => applyYeastRecipeDesign(r, draft(r, { temperatureC: 40 }), refs, 'strain')).not.toThrow();
    const clean = recipe('fermentis-us05');
    for (const temperatureC of [18, 20, 26]) {
      expect(evaluateYeastRecipeDesign(clean, draft(clean, { temperatureC }), refs).effects.find(e => e.id === 'temperature')?.impact).toContain('dans la fenêtre');
    }
    for (const temperatureC of [17, 27]) {
      expect(evaluateYeastRecipeDesign(clean, draft(clean, { temperatureC }), refs).effects.find(e => e.id === 'temperature')?.impact).toContain('hors fenêtre');
    }
  });
});

describe('Houblons : les vrais ajouts et leur contexte biologique', () => {
  const h = (weightG: number, timing?: 'fermentation' | 'postFermentation') => ({ name: 'Citra', alpha: 12, weightG, stage: 'dryHop' as const, dayOffset: 3, aromaTiming: timing });
  it('totalise les doses, en laissant le contexte de J+3 indéterminé', () => {
    const r = { ...recipe(), hops: [h(50, 'fermentation'), h(75, 'postFermentation'), h(25)] };
    expect(yeastRecipeHopSummary(r)).toMatchObject({ totalG: 150, doseGL: 7.5, activeG: 50, postG: 75, unknownG: 25, unknownCount: 1 });
    const result = evaluateYeastRecipeDesign(r, draft(r), refs);
    expect(result.effects.map(e => e.id)).toEqual(expect.arrayContaining(['hop-creep', 'hop-active', 'hop-post']));
    expect(result.warnings.join(' ')).toContain('Un numéro de jour ne permet pas');
    expect(result.fg.reasons.join(' ')).toContain('hop creep');
  });
  it('ne déduit ni jour ni contact depuis un ancien libellé, et propage les masses inconnues', () => {
    const r = { ...recipe(), hops: [{ ...h(10), stage: undefined, step: 'Dry hop #2', dayOffset: undefined } as any, h(NaN, 'fermentation')] };
    const summary = yeastRecipeHopSummary(r);
    expect(summary.additions[0].dayOffset).toBeUndefined(); expect(summary.additions[0].contactHours).toBeUndefined();
    expect(summary.totalG).toBeUndefined(); expect(summary.activeG).toBeUndefined(); expect(summary.doseGL).toBeUndefined();
    expect(summary.unknownG).toBe(10);
  });
  it('garde l’alerte hop creep avec Farmhouse sans STA1 et ne crée pas un ingrédient depuis le calendrier', () => {
    const r = { ...recipe('lalbrew-farmhouse'), style: 'Saison', hops: [h(50, 'postFermentation')] }, result = evaluateYeastRecipeDesign(r, draft(r), refs);
    expect(result.effects.find(e => e.id === 'hop-creep')?.detail).toContain('densité et diacétyle');
    const noHops = { ...recipe(), fermentation: [...recipe().fermentation, { name: 'Houblonnage à cru', kind: 'ajout' as const, tempC: 20, days: 0 }] };
    const noResult = evaluateYeastRecipeDesign(noHops, draft(noHops), refs);
    expect(noResult.hops.totalG).toBe(0); expect(noResult.effects.some(e => e.id === 'hop-creep')).toBe(false);
    expect(noResult.warnings.join(' ')).toContain('aucun ajout à cru');
  });
  it('n’applique pas les 8–15 IBU d’une Weissbier claire à une Weizenbock', () => {
    const r = { ...recipe(), ibuTarget: 25 };
    expect(evaluateYeastRecipeDesign(r, draft(r), refs).effects.some(e => e.id === 'style-hops')).toBe(true);
    const bock = { ...r, styleRef: { styleId: 'weizenbock', guideId: 'bjcp', version: '2021' } };
    expect(evaluateYeastRecipeDesign(bock, draft(bock), refs).effects.some(e => e.id === 'style-hops')).toBe(false);
    const dryBock = { ...bock, hops: [h(50)] }, effects = evaluateYeastRecipeDesign(dryBock, draft(dryBock), refs).effects;
    expect(effects.find(e => e.id === 'style-hops')?.detail).not.toContain('8–15');
  });
});

describe('Application explicite et traçabilité de l’intention', () => {
  it('change la souche sans transporter les faits de stock et garde intact le reste de la recette', () => {
    const r = { ...recipe('fermentis-us05'), yeast: { ...recipe('fermentis-us05').yeast, stockItemRef: 'stock', qty: 20, attenuationPct: 80, notes: 'Mon lot US-05', fermentDays: 14 },
      hopPredictionIds: ['old'], hopMatrixId: 'old', hopTrialId: 'old' };
    const before = structuredClone(r), d = draft(r, { yeastId: 'white-labs-wlp380', temperatureC: 20, pitchTempC: undefined, quantityG: undefined, goal: 'clove' });
    const next = applyYeastRecipeDesign(r, d, refs);
    expect(next.yeast).toMatchObject({ hopIndexId: 'white-labs-wlp380', qty: 0, form: 'liquide' });
    for (const key of ['stockItemRef', 'attenuationPct', 'notes', 'fermentDays', 'pitchTempC']) expect(next.yeast).not.toHaveProperty(key);
    expect(next.hopPredictionIds).toBeUndefined(); expect(next.hopMatrixId).toBeUndefined(); expect(next.hopTrialId).toBeUndefined();
    expect(next.fermentation).toEqual(r.fermentation); expect(next.mash).toEqual(r.mash); expect(next.hops).toEqual(r.hops);
    expect(next.waterPlan).toEqual(r.waterPlan); expect(next.fermentables).toEqual(r.fermentables); expect(next.steps).toEqual(r.steps);
    expect(next.fgTarget).toBe(r.fgTarget); expect(next.abvTarget).toBe(r.abvTarget); expect(r).toEqual(before);
  });
  it('modifie la première phase sans détruire rampes, ajouts, repos ou garde', () => {
    const r = recipe(), next = applyYeastRecipeDesign(r, draft(r, { temperatureC: 22, days: 9 }), refs);
    expect(next.fermentation?.[0]).toEqual({ ...r.fermentation[0], tempC: 22, days: 9 });
    expect(next.fermentation?.slice(1)).toEqual(r.fermentation.slice(1));
    expect(r.fermentation[0].tempC).toBe(20);
  });
  it('ajoute une phase seulement avec des valeurs explicites et garde les durées inconnues inconnues', () => {
    const r = { ...recipe(), fermentation: [] }, d = draft(r);
    expect(d.days).toBeUndefined(); expect(d.temperatureC).toBeUndefined();
    expect(applyYeastRecipeDesign(r, d, refs).fermentation).toEqual([]);
    expect(() => applyYeastRecipeDesign(r, { ...d, temperatureC: 20 }, refs)).toThrow('température et sa durée');
    expect(applyYeastRecipeDesign(r, { ...d, temperatureC: 20, days: 5 }, refs).fermentation?.[0]).toMatchObject({ kind: 'primaire', tempC: 20, days: 5 });
  });
  it('insère une seule proposition de repos avant l’empâtage et préserve le traitement d’eau', () => {
    const r = recipe(), d = draft(r, { ferulicRest: true, goal: 'clove' });
    const once = applyYeastRecipeDesign(r, d, refs), twice = applyYeastRecipeDesign(once, d, refs);
    expect(once.mash?.steps[0]).toMatchObject({ tempC: 44, durationMin: 15 });
    expect(once.mash?.steps.slice(1)).toEqual(r.mash.steps); expect(twice.mash).toEqual(once.mash);
    expect(once.waterPlan).toEqual(r.waterPlan); expect(once.mash?.ratioLPerKg).toBe(3);
    expect(readYeastRecipeDesign(once)?.ferulicRest).toBe(true);
  });
  it('ne confond pas un repos après saccharification et un repos utile au début', () => {
    const r = recipe(), absentMash = { ...r, mash: undefined };
    expect(() => applyYeastRecipeDesign(absentMash, draft(absentMash, { ferulicRest: true }), refs)).toThrow('saccharification');
    const misplaced = { ...r, mash: { ...r.mash, steps: [...r.mash.steps, { name: 'Repos déplacé', tempC: 44, durationMin: 15 }] } };
    expect(createYeastRecipeDraft(misplaced, refs).ferulicRest).toBe(false);
    expect(() => applyYeastRecipeDesign(misplaced, draft(misplaced, { ferulicRest: true }), refs)).toThrow('après la chauffe');
    const neutral = recipe('fermentis-us05');
    expect(() => applyYeastRecipeDesign(neutral, draft(neutral, { ferulicRest: true }), refs)).toThrow('capacité phénolique');
  });
  it('respecte le mode souche seule malgré des réglages de scénario différents', () => {
    const r = recipe(), next = applyYeastRecipeDesign(r, draft(r, { yeastId: 'lallemand-munich-classic', temperatureC: 24, days: 15, quantityG: 18, ferulicRest: true }), refs, 'strain');
    expect(next.yeast.hopIndexId).toBe('lallemand-munich-classic'); expect(next.yeast.qty).toBe(0);
    expect(next.fermentation).toEqual(r.fermentation); expect(next.mash).toEqual(r.mash);
  });
  it('rend effectif l’effacement des champs optionnels et l’annonce dans les changements', () => {
    const r = { ...recipe('lallemand-munich-classic'), yeast: { ...recipe('lallemand-munich-classic').yeast, qty: 15 } }, d = draft(r, { pitchTempC: undefined, quantityG: undefined });
    const changes = evaluateYeastRecipeDesign(r, d, refs).changes;
    expect(changes.find(c => c.id === 'quantity')).toMatchObject({ before: '15 g', after: 'À renseigner' });
    expect(changes.find(c => c.id === 'pitch')?.after).toBe('À renseigner');
    const next = applyYeastRecipeDesign(r, d, refs); expect(next.yeast.qty).toBe(0); expect(next.yeast.pitchTempC).toBeUndefined();
    const strainOnly = applyYeastRecipeDesign(r, d, refs, 'strain'); expect(strainOnly.yeast.qty).toBe(15); expect(strainOnly.yeast.pitchTempC).toBe(20);
  });
  it('enregistre l’intention, la retrouve et détecte une conduite devenue différente', () => {
    const r = recipe(), next = applyYeastRecipeDesign(r, draft(r, { goal: 'clove', pressureBar: 0.3, temperatureC: 19 }), refs);
    const saved = readYeastRecipeDesign(next)!; expect(saved.goal).toBe('clove'); expect(saved.pressureBar).toBe(0.3);
    expect(createYeastRecipeDraft(next, refs)).toMatchObject({ goal: 'clove', pressureBar: 0.3, temperatureC: 19 });
    expect(yeastRecipeDesignChanged(next, saved)).toBe(false);
    expect(yeastRecipeDesignChanged({ ...next, volumeL: 30 }, saved)).toBe(true);
    expect(yeastRecipeDesignChanged({ ...next, fermentation: [{ ...next.fermentation![0], tempC: 22 }] }, saved)).toBe(true);
    expect(readYeastRecipeDesign({ ...next, yeastDesign: { ...saved, pressureBar: -1 } })).toBeUndefined();
    expect(readYeastRecipeDesign({ ...next, yeastDesign: { ...saved, modelVersion: 'future' } as any })).toBeUndefined();
    expect(readYeastRecipeDesign({ ...next, yeastDesign: { ...saved, yeastId: 'another-strain' } })).toBeUndefined();
    expect(readYeastRecipeDesign({ ...next, yeastDesign: { ...saved, applied: { ...saved.applied, mashSteps: [null] } } as any })).toBeUndefined();
  });
  it.each(['strain', 'settings'] as const)('fige les faits locaux dès la première application en mode %s', mode => {
    const original = recipe(), before = structuredClone(original);
    const proposal = applyYeastRecipeDesign(original, draft(original, { yeastId: 'fermentis-us05', temperatureC: 19, pitchTempC: 19, quantityG: 20 }), refs, mode);
    const enriched = completeFromLocalReferences(proposal.fermentables, proposal.hops, proposal.yeast, [], []).yeast;
    expect(proposal.yeast.fermentationFacts).toBeUndefined();
    expect(enriched.fermentationFacts?.pitchGL).toEqual({ min: 0.5, max: 0.8 });
    // Negative control: the old post-render completion produced the false warning.
    expect(yeastRecipeDesignChanged({ ...proposal, yeast: enriched }, readYeastRecipeDesign(proposal)!)).toBe(true);
    const accepted = completeYeastRecipeDesignApplication(proposal, enriched);
    expect(accepted.yeastDesign!.applied.yeast).toEqual(accepted.yeast);
    expect(accepted.yeast.qty).toBe(mode === 'settings' ? 20 : 0);
    expect(yeastRecipeDesignChanged(accepted, readYeastRecipeDesign(accepted)!)).toBe(false);
    const restored = JSON.parse(JSON.stringify(accepted));
    expect(yeastRecipeDesignChanged(restored, readYeastRecipeDesign(restored)!)).toBe(false);
    const completedAgain = completeFromLocalReferences(accepted.fermentables, accepted.hops, accepted.yeast, [], []).yeast;
    expect(completeYeastRecipeDesignApplication(accepted, completedAgain)).toEqual(accepted);
    expect(original).toEqual(before);
    accepted.yeast.qty = 25;
    expect(accepted.yeastDesign!.applied.yeast.qty).toBe(mode === 'settings' ? 20 : 0);
    expect(yeastRecipeDesignChanged(accepted, readYeastRecipeDesign(accepted)!)).toBe(true);
  });
  it.each<[string, (r: Recipe) => void]>([
    ['dose', r => { r.yeast.qty = 25; }],
    ['ensemencement', r => { r.yeast.pitchTempC = 21; }],
    ['plage de fermentation', r => { r.yeast.fermTempMaxC = 24; }],
    ['volume', r => { r.volumeL = 25; }],
    ['palier de fermentation', r => { r.fermentation[0].tempC = 22; }],
    ['durée', r => { r.fermentation[0].days = 12; }],
    ['empâtage', r => { r.mash.steps[0].tempC = 68; }],
    ['style', r => { r.style = 'NEIPA'; }],
  ])('ne remet pas à zéro la comparaison après une vraie modification : %s', (_label, modify) => {
    const original = recipe('fermentis-us05');
    const applied = applyYeastRecipeDesign(original, draft(original, { temperatureC: 19, pitchTempC: 19, quantityG: 20 }), refs);
    const changed = structuredClone(applied) as Recipe;
    modify(changed);
    const enriched = completeFromLocalReferences(changed.fermentables!, changed.hops, changed.yeast, [], []).yeast;
    const completed = completeYeastRecipeDesignApplication(changed, enriched);
    expect(completed.yeastDesign).toEqual(applied.yeastDesign);
    expect(yeastRecipeDesignChanged(completed, readYeastRecipeDesign(completed)!)).toBe(true);
  });
  it('ne fabrique aucune intention lorsque la recette n’en a pas', () => {
    const original = recipe('fermentis-us05');
    const enriched = completeFromLocalReferences(original.fermentables, original.hops, original.yeast, [], []).yeast;
    expect(completeYeastRecipeDesignApplication(original, enriched).yeastDesign).toBeUndefined();
  });
  it('invalide aussi les anciennes prédictions lorsqu’une pression précoce est adoptée ou effacée', () => {
    const r = recipe(), adopted = applyYeastRecipeDesign(r, draft(r), refs);
    const withPrediction = { ...adopted, hopPredictionIds: ['old'] };
    const pressurized = applyYeastRecipeDesign(withPrediction, draft(withPrediction, { pressureBar: 0.5 }), refs);
    expect(pressurized.hopPredictionIds).toBeUndefined(); expect(readYeastRecipeDesign(pressurized)?.pressureBar).toBe(0.5);
    const cleared = applyYeastRecipeDesign({ ...pressurized, hopPredictionIds: ['pressure-old'] }, draft(pressurized, { pressureBar: undefined }), refs);
    expect(cleared.hopPredictionIds).toBeUndefined(); expect(readYeastRecipeDesign(cleared)?.pressureBar).toBeUndefined();
  });
  it('retrouve après sérialisation le filtre Weissbier et le girofle appliqués à un style personnel inconnu', () => {
    const r = { ...recipe(), style: 'Style perso' }, proposal = { ...createYeastRecipeDraft(r, refs, 'weissbier'), goal: 'clove' as const, pressureBar: 0.4 };
    const next = applyYeastRecipeDesign(r, proposal, refs), reloaded = JSON.parse(JSON.stringify(next));
    expect(reloaded.style).toBe('Style perso');
    expect(readYeastRecipeDesign(reloaded)?.applied.style).toBe('Style perso');
    expect(createYeastRecipeDraft(reloaded, refs)).toMatchObject({ styleId: 'weissbier', goal: 'clove', pressureBar: 0.4 });
    expect(createYeastRecipeDraft({ ...reloaded, style: '  STYLE PERSO  ' }, refs)).toMatchObject({ styleId: 'weissbier', goal: 'clove', pressureBar: 0.4 });
    expect(yeastRecipeDesignChanged(reloaded, readYeastRecipeDesign(reloaded)!)).toBe(false);
  });
  it('conserve une famille de comparaison explicitement différente du style réel, sans figer les autres filtres', () => {
    const r = { ...recipe(), style: 'Hazy IPA' }, next = applyYeastRecipeDesign(r, { ...createYeastRecipeDraft(r, refs, 'weissbier'), goal: 'clove', pressureBar: 0.6 }, refs);
    expect(createYeastRecipeDraft(next, refs)).toMatchObject({ styleId: 'weissbier', goal: 'clove', pressureBar: 0.6 });
    expect(createYeastRecipeDraft(next, refs, 'hazy-ipa')).toMatchObject({ styleId: 'hazy-ipa', goal: 'hops', pressureBar: 0.6 });
    expect(createYeastRecipeDraft(next, refs, 'unknown')).toMatchObject({ styleId: 'unknown', goal: 'balanced', pressureBar: 0.6 });
    expect(createYeastRecipeDraft(next, refs, 'weissbier')).toMatchObject({ goal: 'clove', pressureBar: 0.6 });
  });
  it('reprend la nouvelle famille lorsque le style réel de la recette change', () => {
    const r = recipe(), next = applyYeastRecipeDesign(r, draft(r, { goal: 'clove', pressureBar: 0.4 }), refs), changed = { ...next, style: 'NEIPA' };
    expect(createYeastRecipeDraft(changed, refs)).toMatchObject({ styleId: 'hazy-ipa', goal: 'hops', pressureBar: 0.4 });
    expect(yeastRecipeDesignChanged(changed, readYeastRecipeDesign(changed)!)).toBe(true);
    const withRef = { ...r, styleRef: { guideId: 'bjcp', version: '2021', styleId: 'weissbier' } };
    const savedRef = applyYeastRecipeDesign(withRef, draft(withRef, { goal: 'clove' }), refs);
    const changedRef = { ...savedRef, styleRef: { ...savedRef.styleRef!, styleId: 'hazy-ipa' } };
    expect(createYeastRecipeDraft(changedRef, refs)).toMatchObject({ styleId: 'hazy-ipa', goal: 'hops' });
    expect(yeastRecipeDesignChanged(changedRef, readYeastRecipeDesign(changedRef)!)).toBe(true);
  });
  it('lit les anciens snapshots sans contexte de style et laisse une nouvelle famille connue prendre la priorité', () => {
    const r = { ...recipe(), style: 'Style perso' }, next = applyYeastRecipeDesign(r, { ...createYeastRecipeDraft(r, refs, 'weissbier'), goal: 'clove', pressureBar: 0.2 }, refs);
    const legacy = structuredClone(next);
    delete legacy.yeastDesign!.applied.style; delete legacy.yeastDesign!.applied.styleRef;
    expect(readYeastRecipeDesign(legacy)).toBeDefined();
    expect(createYeastRecipeDraft(legacy, refs)).toMatchObject({ styleId: 'weissbier', goal: 'clove', pressureBar: 0.2 });
    expect(createYeastRecipeDraft({ ...legacy, style: 'NEIPA' }, refs)).toMatchObject({ styleId: 'hazy-ipa', goal: 'hops', pressureBar: 0.2 });
  });
});

describe('Calcul de cellules : absence d’hypothèse cachée', () => {
  it('demande taux et viabilité puis mesure le solde, sans flacons inventés', () => {
    const missing = calculateYeastCellRequirement({ volumeL: 20, og: 1.06 });
    expect(missing.plato).toBe(14.7); expect(missing.requiredBillion).toBeUndefined(); expect(missing.balanceBillion).toBeUndefined();
    const known = calculateYeastCellRequirement({ volumeL: 20, og: 1.06, pitchRateMillionPerMlPlato: 0.75, viableCellsBillion: 150 });
    expect(known.requiredBillion).toBeCloseTo(220.5, 10); expect(known.balanceBillion).toBeCloseTo(-70.5, 10);
    const measuredZero = calculateYeastCellRequirement({ volumeL: 20, og: 1.06, pitchRateMillionPerMlPlato: 0.75, viableCellsBillion: 0 });
    expect(measuredZero.balanceBillion).toBeCloseTo(-220.5, 10);
  });
  it('refuse les faux zéros, la DI en Plato saisie comme SG et les cellules négatives', () => {
    for (const input of [
      { volumeL: 0, og: 1.06 }, { volumeL: 20, og: null }, { volumeL: 20, og: 12 }, { volumeL: 20, og: 1.000001 },
      { volumeL: 20, og: 1.06, pitchRateMillionPerMlPlato: 0 }, { volumeL: 20, og: 1.06, viableCellsBillion: -1 }
    ]) { const result = calculateYeastCellRequirement(input); expect(result.errors.length).toBeGreaterThan(0); expect(result.requiredBillion).toBeUndefined(); }
  });
});
