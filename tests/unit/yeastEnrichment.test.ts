import { describe, expect, it } from 'vitest';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastFactValue, yeastStrainInformation } from '../../src/domain/yeastStrainInformation';
import { YEAST_PRACTICAL_GUIDES } from '../../src/data/yeastPracticalGuides';
import { catalogueSolverFacts } from '../../src/domain/yeastCatalogue';
import { buildYeastCompanion, yeastCompanionSummary } from '../../src/domain/yeastCompanion';
import { buildYeastBrewDay } from '../../src/domain/yeastBrewDay';
import { applyYeastRecipeDesign, createYeastRecipeDraft, evaluateYeastRecipeDesign, yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import { YEAST_RECIPE_PROFILES } from '../../src/data/yeastRecipeProfiles';
import belgian from '../../src/data/yeastEnrichmentBelgian.json';
import lager from '../../src/data/yeastEnrichmentLager.json';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import core from '../../src/data/yeastCoreReferences.json';
import recipeReferences from '../../src/data/yeastRecipeReferences.json';

const refs = yeastReferences([]);
const reference = (id = 'fermentis-us05') => structuredClone(refs.find(y => y.id === id)!);
const recipe = () => ({ ...yeastFlowRecipe(), style: 'American IPA', yeastDesign: undefined,
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche' as const, qty: 12, unit: 'g', pitchTempC: 20 } });
describe('Useful strain information', () => {
  it('integrates fourteen distinct products in their styles without widening the wheat shortlist', () => {
    const additions = [...belgian.profiles, ...lager.profiles];
    expect(YEAST_RECIPE_PROFILES).toHaveLength(38);
    expect(new Set(YEAST_RECIPE_PROFILES.map(p => p.yeastId)).size).toBe(38);
    for (const p of additions) {
      const candidate = yeastRecipeCandidates(p.styles[0] as 'lager', 'balanced', refs, 20).find(c => c.yeastId === p.yeastId)!;
      expect(candidate, p.yeastId).toBeDefined();
      expect(candidate.temperature, p.yeastId).toBeDefined();
    }
    expect(yeastRecipeCandidates('weissbier', 'balanced', refs, 20)).toHaveLength(8);
    expect(yeastRecipeCandidates('lager', 'clean', refs, 20)).toHaveLength(7);
    expect(yeastRecipeCandidates('belgian-ale', 'balanced', refs, 20)).toHaveLength(8);
  });
  it('retains an added strain through application, text export/import and AI analysis', () => {
    const r = { ...recipe(), style: 'Belgian Tripel' }, id = 'wyeast-3787';
    const selected = applyYeastRecipeDesign(r, createYeastRecipeDraft(r, refs, 'belgian-ale', id), refs);
    const restored = readRecipeText(writeRecipeText(selected));
    expect(restored.yeast!.hopIndexId).toBe(id); expect(restored.yeast!.form).toBe('liquide');
    expect(restored.yeastDesign!.yeastId).toBe(id);
    const companion = buildYeastCompanion({ ...selected, ...restored } as typeof selected);
    expect(companion.analysis!.candidate!.yeastId).toBe(id);
    expect(companion.analysis!.candidate!.observations.some(f => f.key === 'foam')).toBe(true);
  });
  it('uses added dry-product protocols without copying them to a starter culture', () => {
    const id = 'yeast-fermentis-saflager-s-189', y = reference(id);
    expect(yeastStrainInformation(y, 'sèche')!.facts.find(f => f.key === 'flocculation')!.label).toBe('Sédimentation');
    expect(yeastStrainInformation(y, 'sèche')!.practical.find(n => n.title === 'Réhydratation facultative')!.detail).toContain('15–25 °C');
    const unknown = yeastStrainInformation(y, 'levain')!;
    expect(unknown.practical).toEqual([]); expect(unknown.behaviour).toEqual([]); expect(unknown.preparationWithheld).toBe(true);
  });
  it('transmits the documented WLP830 hop interaction even when a personal capability remains unknown', () => {
    const { aliases: _aliases, ...row } = reference('white-labs-wlp830'); row.betaLyase = 'unknown';
    const r = { ...recipe(), style: 'German Pilsner', yeast: { name: row.name, hopIndexId: row.id, form: 'liquide' as const, qty: 100, unit: 'mL', pitchTempC: 12 } };
    const data = buildYeastCompanion(r, [row]);
    expect(row.betaLyase).toBe('unknown');
    expect(data.analysis!.candidate!.observations.find(f => f.key === 'betaLyase')!.context).toContain('ni rendement');
    expect(data.analysis!.candidate!.practicalNotes.find(n => n.title === 'Activité β-lyase')!.detail).toContain('ni intensité sensorielle');
  });
  it('preserves product-specific rehydration units and temperatures with valid primary sources', () => {
    const us = yeastStrainInformation(reference(), 'sèche')!, wheat = yeastStrainInformation(reference('fermentis-w68'), 'sèche')!;
    expect(us.practical.find(n => n.id === 'rehydrate')!.detail).toContain('poids');
    expect(us.practical.find(n => n.id === 'rehydrate')!.detail).toContain('25–29 °C');
    expect(wheat.practical.find(n => n.id === 'rehydrate')!.detail).toContain('volume');
    expect(wheat.practical.find(n => n.id === 'rehydrate')!.detail).toContain('20–28 °C');
    for (const guide of Object.values(YEAST_PRACTICAL_GUIDES)) for (const note of guide.notes) {
      expect(hopSourceError(note.source)).toBeNull(); expect(note.source.kind).toBe('manufacturer');
    }
  });
  it.each(['levain', 'liquide', undefined] as const)('withholds dry-product protocols for a %s culture in UI, AI and frozen brew day', form => {
    const r = { ...recipe(), yeast: { ...recipe().yeast, form } };
    expect(yeastStrainInformation(reference(), form)!.practical).toHaveLength(0);
    const companion = buildYeastCompanion(r).analysis!.candidate!;
    expect(companion.preparationStatus).toBe('confirm-form');
    expect(companion.practicalNotes.some(n => n.id === 'rehydrate')).toBe(false);
    const guide = buildYeastBrewDay(r, { currentIndex: 0, steps: [], readings: [] }, 'preparation', refs)!;
    expect(guide.strainInformation!.preparationWithheld).toBe(true);
    expect(guide.strainInformation!.practical).toHaveLength(0);
  });
  it('shares source-backed behaviour with AI and the frozen recipe without modifying the plan', () => {
    const r = recipe(), before = JSON.stringify(r);
    expect(buildYeastCompanion(r).analysis!.candidate!.practicalNotes.find(n => n.id === 'rehydrate')!.source.reference).toMatch(/safale-us-05/);
    expect(yeastCompanionSummary(r).join('\n')).toContain('25–29 °C');
    const guide = buildYeastBrewDay(r, { currentIndex: 0, steps: [], readings: [] }, 'preparation', refs)!;
    expect(guide.strainInformation!.preparationDocumented).toBe(true); expect(guide.quantity).toBe('12 g');
    expect(JSON.stringify(r)).toBe(before);
  });
  it('distinguishes the W-68 direct-pitch window from its fermentation window', () => {
    const r = { ...recipe(), style: 'Hefeweizen', yeast: { ...recipe().yeast, name: 'SafAle W-68', hopIndexId: 'fermentis-w68', pitchTempC: 30 } };
    const draft = { ...createYeastRecipeDraft(r, refs), temperatureC: 22, pitchTempC: 30 };
    expect(evaluateYeastRecipeDesign(r, draft, refs).errors).toEqual([]);
    expect(evaluateYeastRecipeDesign(r, draft, refs).warnings.join(' ')).toContain('Vérifier la méthode prévue');
    expect(evaluateYeastRecipeDesign(r, { ...draft, pitchTempC: 18 }, refs).errors).toEqual([]);
    expect(evaluateYeastRecipeDesign(r, { ...draft, temperatureC: 30 }, refs).errors.join(' ')).toContain('hors de la fenêtre');
    expect(evaluateYeastRecipeDesign(r, { ...draft, pitchTempC: 33 }, refs).errors.join(' ')).toContain('plage d’ensemencement direct');
  });
  it('keeps conflicting, missing and qualified documentary values visible', () => {
    const row = reference(), s = row.source;
    row.catalogue!.facts = [
      { key: 'alcoholTolerance', label: 'Alcohol', reported: 'At least 10%', range: { min: 10, max: 10 }, qualifier: 'atLeast', unit: '%', source: s },
      { key: 'flocculation', label: 'Flocculation', reported: 'Medium', source: s, context: 'Texte' },
      { key: 'flocculation', label: 'Flocculation', reported: 'High', source: s, context: 'Tableau' },
    ];
    expect(yeastFactValue(row.catalogue!.facts[0])).toBe('≥ 10 %');
    const info = yeastStrainInformation(row, 'sèche')!;
    expect(info.facts.find(f => f.key === 'flocculation')).toMatchObject({ multiple: true, values: [{ value: 'Moyenne', condition: 'Texte' }, { value: 'Forte', condition: 'Tableau' }] });
    expect(info.facts.find(f => f.key === 'sta1')!.values).toHaveLength(0);
  });
  it('enriches exact older core references only when catalogue and form permit it', () => {
    const saved = structuredClone(core.find(y => !recipeReferences.some(r => r.id === y.id))!) as HopKnowledge;
    if (saved.kind !== 'yeast') throw Error('Expected yeast');
    const expected = saved.catalogue; delete saved.catalogue;
    expect(yeastReferences([saved]).find(y => y.id === saved.id)!.catalogue).toEqual(expected);
    saved.form = 'levain';
    expect(yeastReferences([saved]).find(y => y.id === saved.id)!.catalogue).toBeUndefined();
  });
  it.each([['+', 'positive'], [' - ', 'negative'], ['−', 'negative']] as const)('recognizes the explicit POF sign %s, with no inferred unknowns', (reported, status) => {
    const { aliases: _aliases, ...row } = reference(); row.catalogue!.facts = [{ key: 'pof', label: 'POF', reported, source: row.source }];
    expect(catalogueSolverFacts([row]).yeastPhenols).toMatchObject([{ status }]);
    row.catalogue!.facts[0].reported = '?';
    expect(catalogueSolverFacts([row]).yeastPhenols).toEqual([]);
  });
  it('uses the same explicit POF signs when evaluating a ferulic rest, without overriding unknowns', () => {
    const r = yeastFlowRecipe(), row = reference('wyeast-3068');
    row.catalogue!.facts = [{ key: 'pof', label: 'POF', reported: '+', source: row.source }];
    const draft = { ...createYeastRecipeDraft(r, [row]), ferulicRest: true };
    expect(evaluateYeastRecipeDesign(r, draft, [row]).warnings.join(' ')).not.toContain('Capacité phénolique non concordante');
    row.catalogue!.facts[0].reported = '?';
    expect(evaluateYeastRecipeDesign(r, draft, [row]).warnings.join(' ')).toContain('Capacité phénolique non concordante');
  });
});
