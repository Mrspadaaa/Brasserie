import { describe, expect, it } from 'vitest';
import { assertHopKnowledge, type HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastCatalogueLibrary } from '../../src/domain/yeastCatalogueLibrary';
import { yeastRecipeCandidates, createYeastRecipeDraft, evaluateYeastRecipeDesign, applyYeastRecipeDesign, inferYeastRecipeStyle } from '../../src/domain/yeastRecipeDesign';
import { buildYeastCompanion } from '../../src/domain/yeastCompanion';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { recipeYeastReferencesToSave } from '../../src/domain/recipeYeastReferences';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import { buildYeastBrewDay } from '../../src/domain/yeastBrewDay';
import { fullRecipe } from '../fixtures/fullRecipe';

const refs = yeastReferences();
const dieter = 'yeast-imperial-947efa83-687a-4ee2-96ec-b66ffbd54339';
const hydra = 'yeast-escarpment-6608204923046';
const recipe = () => ({ ...structuredClone(fullRecipe), style: 'Kölsch', styleRef: undefined, yeastDesign: undefined, nolo: undefined,
  volumeL: 20, ogTarget: 1.05, yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche' as const, qty: 12, unit: 'g' },
  fermentation: [{ name: 'Primaire', kind: 'primaire' as const, tempC: 18, days: 10 }],
});

describe('Catalogue entier, sélection sourcée et outils partagés', () => {
  it('exposes every bundled identity without requiring a personal import, while prediction bootstraps stay bounded', () => {
    const ids = new Set(refs.map(r => r.id));
    for (const r of yeastCatalogueLibrary()) expect(ids.has(r.id), r.id).toBe(true);
    expect(new Set(refs.map(r => r.catalogue?.manufacturer)).size).toBeGreaterThan(20);
    const defaults = yeastReferences([], { includeCatalogue: false });
    expect(defaults.length).toBeLessThan(100);
    expect(defaults.some(r => r.id === dieter)).toBe(false);
    expect(refs.some(r => r.id === dieter)).toBe(true);
    expect(yeastReferences([])).toBe(refs);
    expect(yeastReferences([], { includeCatalogue: false })).toBe(defaults);
    expect(refs.find(r => r.id === 'lalbrew-pomona')?.form).toBe('sèche');
    expect(refs.find(r => r.id === 'yeast-omega-9188919542014')?.form).toBe('liquide');
  });
  it.each([
    ['Kölsch', 'kolsch-alt', dieter], ['Irish Stout', 'stout-porter', 'yeast-escarpment-4559494643844'],
    ['Hazy IPA', 'hazy-ipa', hydra], ['Hefeweizen', 'weissbier', 'yeast-omega-9188921344254'],
    ['Witbier', 'witbier', 'yeast-escarpment-4559496740996'], ['Gose', 'sour', dieter],
  ] as const)('finds documentary uses for %s beyond the curated profiles', (style, family, id) => {
    expect(inferYeastRecipeStyle({ ...recipe(), style })).toBe(family);
    const candidate = yeastRecipeCandidates(family, 'balanced', refs, 20).find(c => c.yeastId === id)!;
    expect(candidate?.styleMatch).toBe('documented');
    expect(candidate.evidence.styleMatches.some(m => m.origin !== 'curated-profile' && m.source.kind === 'manufacturer')).toBe(true);
  });
  it('keeps unclassified products discoverable without making them style recommendations', () => {
    const all = yeastRecipeCandidates('kolsch-alt', 'clean', refs, 20, { includeOtherStyles: true });
    expect(all.length).toBe(refs.length);
    expect(all.find(c => c.yeastId === 'lalbrew-voss')?.styleMatch).not.toBe('documented');
    expect(yeastRecipeCandidates('kolsch-alt', 'clean', refs).some(c => c.yeastId === 'lalbrew-voss')).toBe(false);
  });
  it('lets a brewer confirm an undocumented package form without manufacturing a dose or inheriting the previous form', () => {
    const r = recipe(), d = createYeastRecipeDraft(r, refs, 'kolsch-alt', dieter);
    expect(d.form).toBeUndefined(); expect(d.quantityG).toBeUndefined();
    expect(evaluateYeastRecipeDesign(r, d, refs).errors).toContain('Confirme la forme du produit avant de l’appliquer.');
    d.form = 'liquide';
    const result = evaluateYeastRecipeDesign(r, d, refs);
    expect(result.errors).toEqual([]); expect(result.doseG).toBeUndefined();
    expect(result.candidate?.descriptor).toContain('Bright, Crisp, Kölsch');
    expect(result.fg.range?.min).toBeCloseTo(1.0115); expect(result.fg.range?.max).toBeCloseTo(1.0135);
    const applied = applyYeastRecipeDesign(r, d, refs);
    expect(applied.yeast).toMatchObject({ hopIndexId: dieter, form: 'liquide', qty: 0, unit: 'mL' });
    expect(applied.yeast.stockItemRef).toBeUndefined(); expect(refs.find(r => r.id === dieter)?.form).toBeUndefined();
    // A programmatic ID change must not carry the last product's form.
    const switched = evaluateYeastRecipeDesign(r, { ...d, yeastId: 'fermentis-us05' }, refs);
    expect(switched.candidate?.form).toBe('sèche');
  });
  it('carries the new family and strain through transfer, AI and the frozen brew-day recipe', () => {
    const r = recipe(), d = { ...createYeastRecipeDraft(r, refs, 'kolsch-alt', dieter), form: 'liquide' as const };
    const applied = applyYeastRecipeDesign(r, d, refs);
    applied.yeast.qty = 100;
    const restored = readRecipeText(writeRecipeText(applied))!;
    expect(restored.yeast.hopIndexId).toBe(dieter); expect(restored.yeastDesign?.styleId).toBe('kolsch-alt');
    const ai = buildYeastCompanion(restored);
    expect(ai.current?.yeast).toMatchObject({ resolvedId: dieter, form: 'liquide' });
    expect(ai.analysis?.candidate?.styleMatch).toBe('documented');
    const frozen = structuredClone(restored);
    restored.yeast = { ...recipe().yeast };
    const day = buildYeastBrewDay(frozen, { currentIndex: 0, steps: [], readings: [] }, 'preparation', refs)!;
    expect(day.strainInformation?.yeastId).toBe(dieter);
    expect(day.strainInformation?.documentary.some(f => f.key === 'styles' && f.reported.includes('Kölsch'))).toBe(true);
  });
  it('does not interpret a sour culture as a calibrated alcohol fermentation', () => {
    const r = { ...recipe(), style: 'Gose' }, d = { ...createYeastRecipeDraft(r, refs, 'sour', dieter), form: 'liquide' as const };
    const result = evaluateYeastRecipeDesign(r, d, refs);
    expect(result.candidate?.temperature).toBeDefined();
    expect(result.fg.range).toBeNull(); expect(result.abv.range).toBeNull();
    expect(result.fg.reasons[0]).toMatch(/projection/);
  });
  it('makes a catalogue-only product available to AI lookup even without a loaded hop index', () => {
    const c = { recipe: recipe(), now: 1789214400000, phase: 'Planification', provenance: [], inventory: [], material: [], waterSources: [], editableTargets: ['recipe'] } as BrewerContext;
    const result = runBrewerTool('lookup_yeast_reference', { query: dieter }, c).data as { yeasts: HopKnowledge[]; totalMatches: number };
    expect(result.totalMatches).toBe(1); expect(result.yeasts[0].id).toBe(dieter);
    expect(JSON.stringify(result.yeasts[0])).toContain('Altbier, Gose, Kölsch');
    expect(c.hopIndex).toBeUndefined();
  });
  it('persists only the chosen reference at recipe save, never the whole library or a replacement for personal data', () => {
    const r = { ...recipe(), yeast: { ...recipe().yeast, hopIndexId: dieter } };
    const toSave = recipeYeastReferencesToSave([r, r], []);
    expect(toSave.map(r => r.id)).toEqual([dieter]); expect(() => assertHopKnowledge(toSave[0])).not.toThrow();
    expect(toSave[0]).not.toHaveProperty('aliases');
    const invalid = { ...toSave[0], form: 'invalid' } as unknown as HopKnowledge;
    expect(recipeYeastReferencesToSave([r], [invalid])).toEqual([]);
    expect(yeastReferences([invalid]).some(r => r.id === dieter)).toBe(false);
    expect(recipeYeastReferencesToSave([{ ...r, yeast: { ...r.yeast, hopIndexId: 'absent' } }], [])).toEqual([]);
  });
  it('does not restore catalogue claims when a brewer replaces saved observations with unknown data', () => {
    const original = refs.find(r => r.id === hydra)!;
    const { aliases: _, ...personal } = structuredClone(original);
    personal.catalogue!.facts = []; personal.name = 'Mon essai Hydra';
    const custom = yeastReferences([personal]).find(r => r.id === hydra)!;
    expect(custom.name).toBe('Mon essai Hydra'); expect(custom.catalogue!.facts).toEqual([]);
    expect(yeastRecipeCandidates('hazy-ipa', 'fruit', [custom]).length).toBe(0);
  });
});
