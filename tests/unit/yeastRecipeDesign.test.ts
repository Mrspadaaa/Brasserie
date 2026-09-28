import { describe, expect, it } from 'vitest';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { yeastReferences, type YeastReference } from '../../src/domain/yeastReferences';
import references from '../../src/data/yeastRecipeReferences.json';
import { YEAST_RECIPE_PROFILES } from '../../src/data/yeastRecipeProfiles';
import {
  applyYeastRecipeDesign, calculateYeastCellRequirement, completeYeastRecipeDesignApplication, createYeastRecipeDraft, evaluateYeastRecipeDesign,
  classifyYeastRecipeDesignChange, inferYeastRecipeStyle, proposeYeastGoalSettings, readYeastRecipeDesign, yeastRecipeCandidates, yeastRecipeDesignChanged, yeastRecipeHopSummary,
  yeastRecipeProgramme, yeastRecipeProgrammeIssues, type YeastRecipeDraft, type YeastStyleId
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
const draft = (r = recipe(), patch: Partial<YeastRecipeDraft> = {}) => ({ ...createYeastRecipeDraft(r, refs), ...patch,
  ...(patch.goal !== undefined && patch.goalExplicit === undefined ? { goalExplicit: true } : {}) });

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
  it('montre sur la candidate 1056 les mêmes faits Beer que le dossier, sans inventer IPA ni forme', () => {
    const reference = structuredClone(yeastReferences([]).find(y => y.id === 'wyeast-1056')!);
    const beerTemperature = reference.catalogue!.facts.find(f => f.key === 'temperature' && f.context === 'Beer')!;
    const beerAttenuation = reference.catalogue!.facts.find(f => f.key === 'attenuation' && f.context === 'Beer')!;
    const secondTemperatureSource = { ...beerTemperature.source, title: 'Source recoupée', reference: 'https://example.test/wyeast-1056/temperature' };
    reference.catalogue!.facts.push({ ...beerTemperature, source: secondTemperatureSource });
    const candidate = yeastRecipeCandidates('clean-ale', 'balanced', [reference], 20, { includeOtherStyles: true })[0];
    expect(candidate.temperature).toEqual({ range: { min: 16, max: 22 }, qualifier: 'range', sources: [beerTemperature.source, secondTemperatureSource], source: beerTemperature.source });
    expect(candidate.sources.map(source => source.reference)).toContain(secondTemperatureSource.reference);
    expect(candidate.attenuation).toEqual({ range: { min: 73, max: 77 }, qualifier: 'range', sources: [beerAttenuation.source], basis: 'declared', source: beerAttenuation.source });
    expect(candidate.styleMatch).not.toBe('documented');
    expect(candidate.form).toBeUndefined();
    expect(yeastRecipeCandidates('clean-ale', 'balanced', [reference], 20)).toEqual([]);
  });
  it('ne transfère pas Mead et laisse les plages Beer contradictoires inconnues avant le choix', () => {
    const reference = structuredClone(yeastReferences([]).find(y => y.id === 'wyeast-1056')!);
    const temperature = reference.catalogue!.facts.find(f => f.key === 'temperature' && f.context === 'Beer')!;
    const attenuation = reference.catalogue!.facts.find(f => f.key === 'attenuation' && f.context === 'Beer')!;
    const candidate = () => yeastRecipeCandidates('clean-ale', 'balanced', [reference], 20, { includeOtherStyles: true })[0];
    reference.catalogue!.facts.push({ ...temperature, range: { min: 18, max: 24 } });
    reference.catalogue!.facts.push({ ...attenuation, range: { min: 70, max: 75 } });
    expect(candidate().temperature).toBeUndefined();
    expect(candidate().attenuation).toBeUndefined();
    reference.catalogue!.facts = reference.catalogue!.facts.filter(f => f.context === 'Mead');
    expect(candidate().temperature).toBeUndefined();
    expect(candidate().attenuation).toBeUndefined();
  });
  it.each([
    { key: 'temperature' as const, qualifier: 'greaterThan' as const, reported: '> 22 °C' },
    { key: 'temperature' as const, qualifier: 'lessThan' as const, reported: '< 22 °C' },
    { key: 'attenuation' as const, qualifier: 'atLeast' as const, reported: '≥ 80 %' },
    { key: 'attenuation' as const, qualifier: 'upTo' as const, reported: '≤ 80 %' },
  ])('transmet $qualifier sans le réduire à une plage dans la fiche candidate', ({ key, qualifier, reported }) => {
    const reference = structuredClone(yeastReferences([]).find(y => y.id === 'wyeast-1056')!);
    reference.catalogue!.facts = reference.catalogue!.facts.filter(f => f.key !== key || f.context !== 'Beer');
    const fact = structuredClone(yeastReferences([]).find(y => y.id === 'wyeast-1056')!.catalogue!.facts.find(f => f.key === key && f.context === 'Beer')!);
    fact.qualifier = qualifier; fact.reported = reported; fact.range = { min: 80, max: 80 };
    reference.catalogue!.facts.push(fact);
    const candidate = yeastRecipeCandidates('clean-ale', 'balanced', [reference], 20, { includeOtherStyles: true })[0];
    const measurement = key === 'temperature' ? candidate.temperature : candidate.attenuation;
    expect(measurement).toMatchObject({ qualifier, range: { min: 80, max: 80 }, source: fact.source });
    expect(measurement?.sources).toEqual([fact.source]);
  });
  it('ne convertit pas une borne de température en plage de conduite appliquée', () => {
    const reference = structuredClone(yeastReferences([]).find(row => row.id === 'wyeast-1056')!);
    const sourceFact = reference.catalogue!.facts.find(f => f.key === 'temperature' && f.context === 'Beer')!;
    reference.catalogue!.facts = reference.catalogue!.facts.filter(f => f !== sourceFact);
    reference.catalogue!.facts.push({ ...sourceFact, qualifier: 'greaterThan', reported: '> 18 °C', range: { min: 18, max: 18 } });
    const base = recipe('wyeast-3068'), recipeWithBound = { ...base, style: 'American Wheat' };
    const selectedRefs = [...refs.filter(row => row.id !== reference.id), reference];
    const selected = createYeastRecipeDraft(recipeWithBound, selectedRefs, 'clean-ale', reference.id);
    const applied = applyYeastRecipeDesign(recipeWithBound, selected, selectedRefs, 'strain');
    expect(applied.yeast.fermTempMinC).toBeUndefined();
    expect(applied.yeast.fermTempMaxC).toBeUndefined();
    expect(applied.yeast.technicalFacts?.some(f => f.key === 'temperature' && f.qualifier === 'greaterThan')).toBe(true);
  });
});

describe('Simulations bornées par les données réelles', () => {
  it('préserve les inconnues et une référence explicite absente', () => {
    const r = { ...recipe(), yeast: { ...recipe().yeast, hopIndexId: 'missing' }, fermentation: [], ogTarget: null };
    const d = createYeastRecipeDraft(r, refs), result = evaluateYeastRecipeDesign(r, d, refs);
    expect(d.yeastId).toBe('missing'); expect(d.temperatureC).toBeUndefined(); expect(d.days).toBeUndefined();
    expect(result.candidate).toBeUndefined(); expect(result.fg.range).toBeNull(); expect(result.abv.range).toBeNull();
    expect(result.errors).toEqual([]);
    expect(applyYeastRecipeDesign(r, d, refs).yeast.hopIndexId).toBe('missing');
    expect(() => applyYeastRecipeDesign(r, { ...d, yeastId: 'another-missing' }, refs)).toThrow();
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
    expect(result.fg.reasons.join(' ')).toContain('Ni DF garantie ni intervalle statistique');
    expect(r.fgTarget).toBe(fullRecipe.fgTarget);
  });
  it('n’applique pas une plage différente aux sources en conflit, même si un ancien guide existe', () => {
    const r = recipe(), conflicting = structuredClone(ref('wyeast-3068'));
    conflicting.catalogue!.facts.push({ ...conflicting.catalogue!.facts.find(f => f.key === 'attenuation')!, range: { min: 65, max: 70 } });
    conflicting.catalogue!.facts.push({ ...conflicting.catalogue!.facts.find(f => f.key === 'temperature')!, range: { min: 19, max: 22 } });
    const result = evaluateYeastRecipeDesign(r, draft(r), [conflicting]);
    expect(result.candidate?.temperature).toBeUndefined(); expect(result.fg.range).toBeNull();
    expect(proposeYeastGoalSettings(r, { ...draft(r), goal: 'banana' }, [conflicting])?.patch).toEqual({});
    expect(result.warnings.join(' ')).toContain('non concordantes');
  });
  it('ne masque pas un conflit POF derrière le profil éditorial et n’assimile pas inconnu à négatif', () => {
    const r = recipe(), y = structuredClone(ref('wyeast-3068'));
    const observation = { key: 'pof' as const, label: 'POF', reported: 'positive', source: y.source };
    y.catalogue!.facts.push(observation, { ...observation, reported: 'negative' });
    const d = draft(r, { goal: 'clove', ferulicRest: true }), result = evaluateYeastRecipeDesign(r, d, [y]);
    expect(result.effects.find(e => e.id === 'ferulic')?.state).toBe('unknown');
    expect(result.warnings.join(' ')).toContain('Capacité phénolique non concordante');
    expect(proposeYeastGoalSettings(r, d, [y])?.patch).toEqual({});
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
    expect(proposal.patch.pressureBar).toBeUndefined(); expect(proposal.source?.kind).toBe('judgment');
    expect(proposal.rationale).toContain('durée saisie est conservée'); expect(d).toEqual(before);
    const clove = proposeYeastGoalSettings(r, { ...d, goal: 'clove' }, refs)!;
    expect(clove.patch).toEqual({ temperatureC: 18, ferulicRest: true });
    expect(clove.rationale).toContain('Ni durée de repos optimale ni hausse de 4-VG démontrée');
    expect(proposeYeastGoalSettings(recipe('fermentis-us05'), draft(recipe('fermentis-us05'), { goal: 'banana' }), refs)?.patch).toEqual({});
  });
  it('propose le repos férulique par capacité, céréales et empâtage, sans dépendre du style, du nom ni de l’ordre des références', () => {
    const current = recipe('wyeast-3068'), currentDraft = draft(current, { goal: 'clove', styleId: 'weissbier' });
    const first = proposeYeastGoalSettings(current, currentDraft, refs)!;
    const renamedRef = { ...structuredClone(ref('wyeast-3068')), name: 'Culture renommée, même identité documentaire' };
    const reorderedRefs = [...refs.filter(row => row.id !== renamedRef.id), renamedRef].reverse();
    const renamedRecipe = { ...current, name: 'Bière de garde personnelle', style: 'Style maison',
      yeast: { ...current.yeast, name: 'Souche locale renommée', hopIndexId: renamedRef.id },
      fermentables: current.fermentables.map(f => ({ ...f, name: 'Orge maltée' })) };
    const renamedDraft = draft(renamedRecipe, { goal: 'clove', styleId: 'unknown' });
    const renamed = proposeYeastGoalSettings(renamedRecipe, renamedDraft, reorderedRefs)!;
    expect(first.patch).toMatchObject({ ferulicRest: true, temperatureC: 18 });
    expect(first.patch.programme).toBeUndefined();
    expect(renamed.patch).toEqual(first.patch);
    expect(renamed.reasons.join(' ')).toContain('céréale prévue à l’empâtage');
  });
  it('ne prépare pas de repos férulique sans grain au mash ou sans capacité POF documentée', () => {
    const withNoMashGrain = { ...recipe('wyeast-3068'), style: 'Style libre', fermentables: [] };
    const missingWortContext = proposeYeastGoalSettings(withNoMashGrain, draft(withNoMashGrain, { goal: 'clove', styleId: 'unknown' }), refs)!;
    expect(missingWortContext.patch.ferulicRest).toBeUndefined();
    expect(missingWortContext.reasons.join(' ')).toContain('Aucun fermentescible grain');

    const noPof = recipe('fermentis-us05');
    expect(proposeYeastGoalSettings(noPof, draft(noPof, { goal: 'clove', styleId: 'unknown' }), refs)?.patch.ferulicRest).toBeUndefined();
  });
  it('ne propose pas de réglage depuis un objectif par défaut non exprimé', () => {
    const r = recipe(), d = createYeastRecipeDraft(r, refs);
    const proposal = proposeYeastGoalSettings(r, d, refs)!;
    expect(d.goalExplicit).toBe(false);
    expect(proposal).toMatchObject({ patch: {}, outcome: 'insufficient-data' });
    expect(proposal.reasons.join(' ')).toContain('Aucun objectif de conduite n’a été exprimé');
  });
  it('corrige une consigne hors plage par le déplacement minimal quand aucun guide ne donne de réglage', () => {
    const reference = structuredClone(ref('wyeast-3068'));
    reference.id = 'synthetic-z9-no-guide'; reference.name = 'Culture synthétique Z9';
    reference.catalogue!.facts = [structuredClone(reference.catalogue!.facts.find(f => f.key === 'temperature' && f.context === 'Beer')!)];
    reference.catalogue!.facts[0].reported = '18–24 °C'; reference.catalogue!.facts[0].range = { min: 18, max: 24 };
    const r = recipe();
    const proposal = (temperatureC: number) => proposeYeastGoalSettings(r, {
      ...createYeastRecipeDraft(r, [reference], 'unknown', reference.id), goal: 'clean', goalExplicit: true, temperatureC,
    }, [reference])!;
    expect(proposal(17)).toMatchObject({ patch: { temperatureC: 18 }, outcome: 'proposed' });
    expect(proposal(17).reasons.join(' ')).toContain('déplacement minimal');
    expect(proposal(17).rationale).toContain('pas un optimum aromatique');
    expect(proposal(30)).toMatchObject({ patch: { temperatureC: 24 }, outcome: 'proposed' });
  });
  it('bloque les valeurs invalides et signale les choix explicites hors fenêtre', () => {
    const r = recipe();
    for (const patch of [{ temperatureC: 61 }, { pitchTempC: -1 }, { days: -2 }, { pressureBar: -1 }, { quantityG: 15 }, { temperatureC: NaN }]) {
      const d = draft(r, patch); expect(evaluateYeastRecipeDesign(r, d, refs).errors.length).toBeGreaterThan(0);
      expect(() => applyYeastRecipeDesign(r, d, refs)).toThrow();
    }
    expect(() => applyYeastRecipeDesign(r, draft(r, { temperatureC: 40 }), refs, 'strain')).not.toThrow();
    const clean = recipe('fermentis-us05');
    for (const temperatureC of [18, 20, 26]) {
      expect(evaluateYeastRecipeDesign(clean, draft(clean, { temperatureC }), refs).effects.find(e => e.id === 'temperature')?.impact).toContain('dans la fenêtre');
    }
    for (const temperatureC of [17, 27]) {
      const d = draft(clean, { temperatureC }), preview = evaluateYeastRecipeDesign(clean, d, refs);
      expect(preview.effects.find(e => e.id === 'temperature')?.impact).toContain('hors fenêtre');
      expect(preview.effects.find(e => e.id === 'temperature')?.state).toBe('warning');
      expect(preview.errors).toEqual([]);
      expect(preview.warnings.join(' ')).toContain('hors de la plage de conduite retenue (18–26 °C)');
      expect(applyYeastRecipeDesign(clean, d, refs).fermentation![0].tempC).toBe(temperatureC);
    }
  });
  it('relie une culture sans nom à son contrôle et conserve la chaîne errors existante', () => {
    const r = recipe(), message = 'Chaque culture exige un nom et un rôle explicites.';
    const result = evaluateYeastRecipeDesign(r, draft(r, { process: 'mixed-culture', cultureRoles: [{ name: '', role: 'mixed' }] }), refs);
    expect(result.errors).toEqual([message]);
    expect(result.problems).toEqual([{ code: 'cultureRoles.name', message, section: 'preparation', property: 'cultureRoles', index: 0, field: 'name' }]);
  });
  it('cible aussi les contrôles de pression et de viabilité sans parser les messages', () => {
    const r = recipe(), result = evaluateYeastRecipeDesign(r, draft(r, { pressureBar: -0.1, viableCellsBillion: -1 }), refs);
    expect(result.errors).toEqual([
      'La pression en fermentation doit être positive ou nulle, en bar relatif.',
      'Cellules viables : saisis une valeur positive ou nulle.',
    ]);
    expect(result.problems.map(({ section, property }) => [section, property])).toEqual([
      ['preparation', 'pressureBar'], ['pitch', 'viableCellsBillion'],
    ]);
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
  it('distingue objectif facultatif et objectif seul enregistré sans changer les paliers', () => {
    const original = recipe(), initial = createYeastRecipeDraft(original, refs);
    expect(initial.goal).toBe('balanced');
    expect(initial.goalExplicit).toBe(false);
    const withoutGoal = applyYeastRecipeDesign(original, initial, refs);
    expect(readYeastRecipeDesign(withoutGoal)?.goalExplicit).toBe(false);
    expect(createYeastRecipeDraft(withoutGoal, refs).goalExplicit).toBe(false);

    const withGoal = applyYeastRecipeDesign(withoutGoal, { ...createYeastRecipeDraft(withoutGoal, refs), goal: 'banana', goalExplicit: true }, refs);
    expect(withGoal.fermentation).toEqual(original.fermentation);
    expect(readYeastRecipeDesign(withGoal)).toMatchObject({ goal: 'banana', goalExplicit: true });
    expect(createYeastRecipeDraft(withGoal, refs)).toMatchObject({ goal: 'banana', goalExplicit: true });
    const withdrawn = applyYeastRecipeDesign(withGoal, { ...createYeastRecipeDraft(withGoal, refs), goal: 'banana', goalExplicit: false }, refs);
    expect(readYeastRecipeDesign(withdrawn)).toMatchObject({ goal: 'banana', goalExplicit: false });
    expect(createYeastRecipeDraft(withdrawn, refs).goalExplicit).toBe(false);
  });
  it('relit les snapshots qui conservent une sélection documentaire explicitement inconnue', () => {
    const r = recipe(); r.yeast.technicalSelections = { flocculation: null };
    const saved = applyYeastRecipeDesign(r, createYeastRecipeDraft(r, refs), refs);
    expect(readYeastRecipeDesign(saved)?.applied.yeast.technicalSelections?.flocculation).toBeNull();
  });
  it('change la souche sans transporter les faits de stock et garde intact le reste de la recette', () => {
    const r = { ...recipe('fermentis-us05'), yeast: { ...recipe('fermentis-us05').yeast, stockItemRef: 'stock', qty: 20, attenuationPct: 80, notes: 'Mon lot US-05', fermentDays: 14 },
      hopPredictionIds: ['old'], hopMatrixId: 'old', hopTrialId: 'old' };
    const before = structuredClone(r), d = draft(r, { yeastId: 'white-labs-wlp380', temperatureC: 20, pitchTempC: undefined, quantityG: undefined, goal: 'clove' });
    const next = applyYeastRecipeDesign(r, d, refs);
    expect(next.yeast).toMatchObject({ hopIndexId: 'white-labs-wlp380', form: 'liquide' });
    expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    for (const key of ['stockItemRef', 'attenuationPct', 'notes', 'fermentDays', 'pitchTempC']) expect(next.yeast).not.toHaveProperty(key);
    expect(next.hopPredictionIds).toBeUndefined(); expect(next.hopMatrixId).toBeUndefined(); expect(next.hopTrialId).toBeUndefined();
    expect(next.fermentation).toEqual(r.fermentation); expect(next.mash).toEqual(r.mash); expect(next.hops).toEqual(r.hops);
    expect(next.waterPlan).toEqual(r.waterPlan); expect(next.fermentables).toEqual(r.fermentables); expect(next.steps).toEqual(r.steps);
    expect(next.fgTarget).toBe(r.fgTarget); expect(next.abvTarget).toBe(r.abvTarget); expect(r).toEqual(before);
  });
  it('ne reprend pas une masse sèche quand la nouvelle culture R42 a une forme inconnue', () => {
    const old = recipe('fermentis-us05'); old.yeast.qty = 20; old.yeast.unit = 'g';
    const unknown: YeastReference = { ...structuredClone(ref('wyeast-3068')), id: 'qa-culture-r42', name: 'Culture personnelle R42', form: undefined };
    const localRefs = [...refs, unknown];
    const trial = createYeastRecipeDraft(old, localRefs, undefined, unknown.id);
    expect(trial.form).toBeUndefined(); expect(trial.quantityG).toBeUndefined();
    expect(() => applyYeastRecipeDesign(old, { ...trial, quantityG: 10 }, localRefs)).toThrow('forme confirmée');
    const unconfirmed = applyYeastRecipeDesign(old, trial, localRefs);
    expect(unconfirmed.yeast.form).toBeUndefined(); expect(unconfirmed.yeast.qty).toBeUndefined();
    const confirmed = applyYeastRecipeDesign(old, { ...trial, form: 'sèche', formYeastId: unknown.id, quantityG: 10 }, localRefs);
    expect(confirmed.yeast).toMatchObject({ form: 'sèche', qty: 10, unit: 'g' });
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
    expect(() => applyYeastRecipeDesign(r, { ...d, temperatureC: 20, days: 0 }, refs)).toThrow('température et sa durée');
    expect(applyYeastRecipeDesign(r, { ...d, temperatureC: 20, days: 5 }, refs).fermentation?.[0]).toMatchObject({ kind: 'primaire', tempC: 20, days: 5 });
  });
  it('conserve la primaire à 0 j explicitement saisie lors d’une autre correction sans l’assimiler à inconnu', () => {
    const r = recipe(); r.fermentation[0].days = 0;
    const d = createYeastRecipeDraft(r, refs);
    expect(d.days).toBe(0);
    const programme = r.fermentation.map((phase, index) => index === 1 ? { ...phase, tempC: 5 } : { ...phase });
    const applied = applyYeastRecipeDesign(r, { ...d, programme }, refs);
    expect(applied.fermentation?.[0].days).toBe(0);
    expect(applied.fermentation?.[1].tempC).toBe(5);
  });
  it('garde les inconnues locales visibles et bloque un programme incomplet sans réutiliser la recette', () => {
    const r = recipe(), d = createYeastRecipeDraft(r, refs);
    const incomplete: YeastRecipeDraft['programme'] = [
      { ...r.fermentation[0], days: undefined }, ...r.fermentation.slice(1).map(phase => ({ ...phase }))
    ];
    const draftWithUnknown = { ...d, programme: incomplete };
    const preview = evaluateYeastRecipeDesign(r, draftWithUnknown, refs);
    expect(preview.errors.join(' ')).toContain('Programme incomplet');
    expect(preview.errors).toEqual(['Programme incomplet : chaque phase exige un nom, une température et une durée valides, avec une primaire.']);
    expect(preview.problems).toContainEqual(expect.objectContaining({ section: 'programme', property: 'programme', index: 0, field: 'days' }));
    expect(preview.changes.find(change => change.id === 'programme-0')?.after).toContain('Inconnu j');
    expect(preview.changes.find(change => change.id === 'programme-total')?.after).toBe('Durée totale inconnue');
    expect(yeastRecipeProgrammeIssues(incomplete).some(issue => issue.field === 'days' && issue.phaseIndex === 0)).toBe(true);
    expect(() => applyYeastRecipeDesign(r, draftWithUnknown, refs)).toThrow('Programme incomplet');

    const withoutPrimary: YeastRecipeDraft = { ...d, temperatureC: 20, days: 7, programme: [{ ...r.fermentation.at(-1)! }] };
    expect(yeastRecipeProgramme(r, withoutPrimary).map(phase => phase.kind)).toEqual(['garde']);
    const noPrimaryPreview = evaluateYeastRecipeDesign(r, withoutPrimary, refs);
    expect(noPrimaryPreview.changes.find(change => change.id === 'programme-validity')?.after).toContain('primaire absente');
    expect(noPrimaryPreview.changes.some(change => change.id === 'programme-removed-0')).toBe(true);
    expect(() => applyYeastRecipeDesign(r, withoutPrimary, refs)).toThrow('Programme incomplet');
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
    const withoutMashGrain = { ...r, fermentables: [] };
    expect(() => applyYeastRecipeDesign(withoutMashGrain, draft(withoutMashGrain, { ferulicRest: true }), refs)).toThrow('fermentescible grain');
  });
  it('respecte le mode souche seule malgré des réglages de scénario différents', () => {
    const r = recipe(), next = applyYeastRecipeDesign(r, draft(r, { yeastId: 'lallemand-munich-classic', temperatureC: 24, days: 15, quantityG: 18, ferulicRest: true }), refs, 'strain');
    expect(next.yeast.hopIndexId).toBe('lallemand-munich-classic'); expect(next.yeast.qty).toBeUndefined();
    expect(next.fermentation).toEqual(r.fermentation); expect(next.mash).toEqual(r.mash);
  });
  it('rend effectif l’effacement des champs optionnels et l’annonce dans les changements', () => {
    const r = { ...recipe('lallemand-munich-classic'), yeast: { ...recipe('lallemand-munich-classic').yeast, qty: 15 } }, d = draft(r, { pitchTempC: undefined, quantityG: undefined });
    const changes = evaluateYeastRecipeDesign(r, d, refs).changes;
    expect(changes.find(c => c.id === 'quantity')).toMatchObject({ before: '15 g', after: 'À renseigner' });
    expect(changes.find(c => c.id === 'pitch')?.after).toBe('À renseigner');
    const next = applyYeastRecipeDesign(r, d, refs); expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.pitchTempC).toBeUndefined();
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
    // Strict stale remains true; the separate display classifier calls this documentary enrichment.
    const enrichedProposal = { ...proposal, yeast: enriched }, snapshot = readYeastRecipeDesign(proposal)!;
    expect(yeastRecipeDesignChanged(enrichedProposal, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(enrichedProposal, snapshot)).toBe('documentary');
    const accepted = completeYeastRecipeDesignApplication(proposal, enriched);
    expect(accepted.yeastDesign!.applied.yeast).toEqual(accepted.yeast);
    expect(accepted.yeast.qty).toBe(mode === 'settings' ? 20 : undefined);
    expect(yeastRecipeDesignChanged(accepted, readYeastRecipeDesign(accepted)!)).toBe(false);
    const restored = JSON.parse(JSON.stringify(accepted));
    expect(yeastRecipeDesignChanged(restored, readYeastRecipeDesign(restored)!)).toBe(false);
    const completedAgain = completeFromLocalReferences(accepted.fermentables, accepted.hops, accepted.yeast, [], []).yeast;
    expect(completeYeastRecipeDesignApplication(accepted, completedAgain)).toEqual(accepted);
    expect(original).toEqual(before);
    accepted.yeast.qty = 25;
    expect(accepted.yeastDesign!.applied.yeast.qty).toBe(mode === 'settings' ? 20 : undefined);
    expect(yeastRecipeDesignChanged(accepted, readYeastRecipeDesign(accepted)!)).toBe(true);
  });
  it('classe les faits fabricant ajoutés à la Wyeast 3068 comme documentaires et conserve les phases', () => {
    const original = recipe('wyeast-3068');
    const programme = original.fermentation.map((phase, index) => index === 0 ? { ...phase, tempC: 22, days: 10 } : { ...phase });
    const proposal = applyYeastRecipeDesign(original, draft(original, { temperatureC: 22, days: 10, programme }), refs);
    const snapshot = readYeastRecipeDesign(proposal)!;
    const source = 'https://wyeastlab.com/product/weihenstephan-weizen/';
    const enriched = { ...proposal, yeast: { ...proposal.yeast, lab: 'Wyeast', strain: '3068', fermTempMinC: 18, fermTempMaxC: 24,
      flocculation: 'Low', technicalSource: source, technicalFacts: [
        { key: 'temperature' as const, reported: '64–75°F (18–24°C)', range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range' as const,
          origin: 'manufacturer' as const, source, sourceUrl: source, context: 'Beer' },
        { key: 'flocculation' as const, reported: 'Low', origin: 'manufacturer' as const, source, sourceUrl: source, context: 'Beer' }
      ] } };
    expect(enriched.yeast.hopIndexId).toBe(snapshot.yeastId);
    expect(yeastRecipeDesignChanged(enriched, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(enriched, snapshot)).toBe('documentary');
    expect(enriched.fermentation).toEqual(snapshot.applied.fermentation);
    expect(snapshot.programme).toEqual(snapshot.applied.fermentation);
  });
  it('garde la qualification réglages pour dose, phase et hypothèses recipe/measured', () => {
    const original = recipe(), applied = applyYeastRecipeDesign(original, draft(original), refs), snapshot = readYeastRecipeDesign(applied)!;
    const changes: [string, (current: Recipe) => void][] = [
      ['quantité', current => { current.yeast.qty = 125; }],
      ['température de phase', current => { current.fermentation[0].tempC = 22; }],
      ['hypothèse recipe', current => { current.yeast.attenuationPct = 74; current.yeast.attenuationBasis = 'recipe'; }],
      ['mesure', current => { current.yeast.attenuationPct = 74; current.yeast.attenuationBasis = 'measured'; }]
    ];
    for (const [label, modify] of changes) {
      const current = structuredClone(applied) as Recipe;
      modify(current);
      expect(yeastRecipeDesignChanged(current, snapshot), label).toBe(true);
      expect(classifyYeastRecipeDesignChange(current, snapshot), label).toBe('settings');
    }
  });
  it('signale les valeurs personnelles inconnues et les sources contradictoires comme changements documentaires', () => {
    const applied = applyYeastRecipeDesign(recipe(), draft(recipe()), refs), snapshot = readYeastRecipeDesign(applied)!;
    const unknown = { ...applied, yeast: { ...applied.yeast, technicalSelections: { flocculation: null } } };
    expect(yeastRecipeDesignChanged(unknown, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(unknown, snapshot)).toBe('documentary');

    const observations: NonNullable<Recipe['yeast']['technicalFacts']> = [
      { key: 'temperature', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range', origin: 'manufacturer', source: 'Fiche fabricant A' },
      { key: 'temperature', reported: '20–25 °C', range: { min: 20, max: 25 }, unit: '°C', qualifier: 'range', origin: 'personal', source: 'Correction du brasseur' }
    ];
    const conflict = { ...applied, yeast: { ...applied.yeast, technicalFacts: observations } };
    expect(yeastRecipeDesignChanged(conflict, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(conflict, snapshot)).toBe('documentary');
  });
  it.each(['lab', 'strain'] as const)('reste conservateur lorsqu’un %s déjà connu change', field => {
    const original = recipe(), withKnownValue = { ...original, yeast: { ...original.yeast, [field]: field === 'lab' ? 'Wyeast' : '3068' } };
    const applied = applyYeastRecipeDesign(withKnownValue, draft(withKnownValue), refs), snapshot = readYeastRecipeDesign(applied)!;
    const current = structuredClone(applied) as Recipe;
    current.yeast[field] = 'Autre';
    expect(yeastRecipeDesignChanged(current, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(current, snapshot)).toBe('settings');
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
