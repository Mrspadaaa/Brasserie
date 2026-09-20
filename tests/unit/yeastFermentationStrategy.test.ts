import { describe, expect, it } from 'vitest';
import { proposeYeastFermentationStrategy } from '../../src/domain/yeastFermentationStrategy';
import { applyYeastRecipeDesign, createYeastRecipeDraft, evaluateYeastRecipeDesign, readYeastRecipeDesign, yeastRecipeDesignChanged, yeastRecipeProgramme, type YeastRecipeDraft } from '../../src/domain/yeastRecipeDesign';
import { YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES } from '../../src/data/yeastRecipeProfiles';
import { yeastReferences } from '../../src/domain/yeastReferences';
import type { FermentationStep, Recipe } from '../../src/types';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { fullRecipe } from '../fixtures/fullRecipe';

const refs = yeastReferences([]);
const temperature = (min: number, max: number): YeastTechnicalFact => ({ key: 'temperature', reported: `${min}–${max} °C`, range: { min, max }, qualifier: 'range', unit: '°C', origin: 'personal', source: 'Fiche du labo L-42' });
const recipe = (patch: Partial<Recipe> = {}): Recipe => ({ ...structuredClone(fullRecipe), style: 'Lager', volumeL: 20, efficiencyPct: 75,
  fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37 }], adjuncts: [], hops: [], ogTarget: 1.05, fgTarget: null, abvTarget: null,
  yeast: { name: 'Laboratoire confidentiel L-42', form: 'liquide', attenuationPct: 78, attenuationBasis: 'recipe', technicalFacts: [temperature(10, 15)] },
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: 14 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 5 }], ...patch });
const draft = (r: Recipe, patch: Partial<YeastRecipeDraft> = {}): YeastRecipeDraft => ({ ...createYeastRecipeDraft(r, refs), ...patch });

describe('Stratégies de fermentation reliées aux données et au programme', () => {
  it('propose Soufre en retrait comme objectif Lager avec quatre étapes et un total honnête', () => {
    expect(YEAST_RECIPE_GOAL_LABELS['low-sulfur']).toBe('Soufre en retrait');
    expect(YEAST_STYLE_FAMILIES.find(s => s.id === 'lager')?.goals).toContain('low-sulfur');
    const r = recipe(), before = structuredClone(r), d = draft(r, { goal: 'low-sulfur' }), s = proposeYeastFermentationStrategy(r, d, refs);
    expect(s.title).toBe('Lager · Soufre en retrait');
    expect(s.patch).toMatchObject({ temperatureC: 12, days: 14 });
    expect(s.phases.map(p => [p.kind, p.tempC, p.days])).toEqual([['primaire', 12, 14], ['reposDiacetyle', 14, 5], ['garde', 2, 2], ['garde', 2, 21]]);
    expect(s.totalDays).toBe(42);
    expect(s.effects).toHaveLength(3);
    expect(s.phases[0].condition).toContain('65–75 %');
    expect(s.phases[1].condition).toContain('test forcé du diacétyle négatif');
    expect(s.phases.every(p => p.condition.length < 130)).toBe(true);
    expect(s.patch.programme![1].note).toContain('sans oxygénation tardive');
    expect(s.rationale).toContain('choix éditorial');
    expect(s.rationale).toContain('sans date de fin garantie');
    expect(s.sources.map(x => x.reference)).toEqual(expect.arrayContaining(['https://connect.lallemandbrewing.com/wp-content/uploads/2023/08/Lallemand-Brewing_TechPaper-Lagering-Made-Easy-8-23.pdf', 'https://wyeastlab.com/resource/home-enthusiast-lager-brewing/']));
    expect(r).toEqual(before); expect(d.programme).toBeUndefined();
  });

  it('conserve les durées utiles, les ajouts, les rampes supplémentaires et la refermentation sans les réordonner', () => {
    const fruit: FermentationStep = { name: 'Griottes', kind: 'ajout', tempC: 13, days: 0, note: '0,8 kg prévus dans les ingrédients.' };
    const ramp: FermentationStep = { name: 'Deuxième primaire', kind: 'primaire', tempC: 13, days: 2, note: 'Rampe saisie.' };
    const bottle: FermentationStep = { name: 'Bouteilles', kind: 'refermentation', tempC: 20, days: 14, note: 'Vérifier la stabilité avant conditionnement.' };
    const r = recipe({ fermentation: [recipe().fermentation![0], ramp, fruit, { name: 'Repos prévu', kind: 'reposDiacetyle', tempC: 14, days: 8 }, { name: 'Garde longue', kind: 'garde', tempC: 1, days: 28, note: 'Échéance de cuverie.' }, bottle] });
    const s = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur' }), refs), programme = s.patch.programme!;
    expect(programme.slice(1, 3)).toEqual([ramp, fruit]);
    expect(programme.at(-1)).toEqual(bottle);
    expect(programme.find(p => p.kind === 'reposDiacetyle')?.days).toBe(8);
    expect(programme.find(p => p.name === 'Garde longue')).toMatchObject({ tempC: 1, days: 28 });
    expect(programme.find(p => p.name === 'Garde longue')?.note).toContain('Échéance de cuverie.');
    expect(s.phases.filter(p => p.preserved).map(p => p.name)).toEqual(['Deuxième primaire', 'Griottes', 'Bouteilles']);
    expect(s.totalDays).toBe(programme.reduce((sum, p) => sum + p.days, 0));
  });

  it('ne hausse jamais la primaire hors fenêtre et ne transforme pas une hausse de 1 °C en repos documenté', () => {
    const r = recipe(), outside = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur', temperatureC: 30 }), refs);
    expect(outside.patch.temperatureC).toBe(12.5);
    expect(outside.phases[1].tempC).toBe(14.5);
    const ceiling = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur', temperatureC: 14 }), refs);
    expect(ceiling.phases[1].tempC).toBe(14);
    expect(ceiling.rationale).toContain('ne permet pas la hausse documentée');
    expect(ceiling.effects[1].expected).not.toContain('15 °C');
    expect(ceiling.patch.programme![1].note).toContain('si la fenêtre de la souche le permet');
  });

  it('sépare point publié, borne et plage de conduite avant de fabriquer un programme chaud/froid', () => {
    for (const qualifier of ['reportedPoint', 'atLeast', 'upTo'] as const) {
      const fact = { ...temperature(12, 12), qualifier, reported: '12 °C' };
      const r = recipe({ yeast: { name: 'L-42', attenuationPct: 78, technicalFacts: [fact] } });
      const s = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur' }), refs);
      expect(s.patch.programme).toBeUndefined();
      expect(s.patch.temperatureC).toBeUndefined();
      expect(s.phases.every(p => p.preserved)).toBe(true);
      expect(s.rationale).toContain('aucun programme chaud/froid n’est inventé');
    }
  });

  it('une levure liquide ou de forme inconnue sans dossier garde sa projection, sans optimum ni effet aromatique inventé', () => {
    for (const form of ['liquide', undefined] as const) {
      const r = recipe({ yeast: { name: 'Levure rare sans fiche', form, attenuationPct: 78 } });
      for (const goal of ['low-sulfur', 'fruit', 'clean', 'dry', 'hops'] as const) {
        const d = draft(r, { goal }), s = proposeYeastFermentationStrategy(r, d, refs), p = evaluateYeastRecipeDesign(r, { ...d, ...s.patch }, refs);
        expect(s.patch.programme).toBeUndefined(); expect(s.patch.temperatureC).toBeUndefined();
        expect(s.effects.length).toBeLessThanOrEqual(3);
        expect(p.fg.range!.min).toBeCloseTo(1.011, 12); expect(p.abv.range!.min).toBeCloseTo(5.11875, 12);
        expect(s.effects.map(e => e.expected).join(' ')).not.toContain('Caractère fruité documenté');
      }
    }
  });

  it('une culture acidifiante documentée ne reçoit pas un plan lager alcoolique ordinaire', () => {
    const r = recipe({ yeast: { ...recipe().yeast, technicalFacts: [temperature(10, 15), { key: 'species', reported: 'Lachancea thermotolerans', origin: 'manufacturer' }] } });
    const s = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur', process: 'preacidified' }), refs);
    expect(s.phases.some(p => p.kind === 'reposDiacetyle')).toBe(false);
    expect(s.rationale).toContain('cultures doivent être précisés');
    expect(evaluateYeastRecipeDesign(r, { ...draft(r), ...s.patch, process: 'preacidified' }, refs).abv.range).toBeNull();
  });

  it('applique le programme explicitement, persiste ses conditions et le rouvre sans modifier les houblons', () => {
    const r = recipe({ hops: [{ name: 'Saaz', stage: 'dryHop', alpha: 3.5, weightG: 40, aromaTiming: 'fermentation', aromaTemperatureC: 12, dayOffset: 4 }] }), before = structuredClone(r);
    const d = draft(r, { goal: 'low-sulfur' }), s = proposeYeastFermentationStrategy(r, d, refs), prepared = { ...d, ...s.patch };
    const preview = evaluateYeastRecipeDesign(r, prepared, refs);
    expect(preview.errors).toEqual([]); expect(preview.changes.filter(c => c.id.startsWith('programme-')).length).toBeGreaterThan(2);
    expect(r).toEqual(before);
    const saved = JSON.parse(JSON.stringify(applyYeastRecipeDesign(r, prepared, refs))) as Recipe, snapshot = readYeastRecipeDesign(saved)!;
    expect(saved.fermentation).toEqual(s.patch.programme); expect(saved.hops).toEqual(r.hops); expect(saved.fermentables).toEqual(r.fermentables);
    expect(snapshot.programme).toEqual(saved.fermentation); expect(snapshot.goal).toBe('low-sulfur');
    expect(snapshot.applied.fermentation).toEqual(saved.fermentation);
    expect(createYeastRecipeDraft(saved, refs).programme).toEqual(saved.fermentation);
    expect(yeastRecipeDesignChanged(saved, snapshot)).toBe(false);
    const altered = { ...saved, fermentation: saved.fermentation!.map((p, i) => i ? p : { ...p, days: 20 }) };
    expect(yeastRecipeDesignChanged(altered, snapshot)).toBe(true);
    expect(createYeastRecipeDraft(altered, refs).programme).toBeUndefined();
    expect(createYeastRecipeDraft(altered, refs).days).toBe(20);
  });

  it('les éditions de primaire restent cohérentes avec le programme complet et son snapshot', () => {
    const r = recipe(), d = draft(r, { goal: 'clean' }), s = proposeYeastFermentationStrategy(r, d, refs);
    const edited = { ...d, ...s.patch, temperatureC: 11, days: 16 };
    expect(yeastRecipeProgramme(r, edited)[0]).toMatchObject({ tempC: 11, days: 16 });
    const saved = applyYeastRecipeDesign(r, edited, refs);
    expect(saved.fermentation![0]).toMatchObject({ tempC: 11, days: 16 });
    expect(readYeastRecipeDesign(saved)!.programme).toEqual(saved.fermentation);
    expect(evaluateYeastRecipeDesign(r, edited, refs).changes[0].after).toContain('11 °C');
    expect(s.patch.programme![0].tempC).toBe(12);
    const programmeOnly = { ...d, programme: s.patch.programme, temperatureC: undefined, days: undefined };
    expect(evaluateYeastRecipeDesign(r, programmeOnly, refs).effects.find(e => e.id === 'temperature')?.impact).toContain('12 °C');
    expect(applyYeastRecipeDesign(r, programmeOnly, refs).fermentation![0]).toMatchObject({ tempC: 12, days: 14 });
    const changedCleanup = { ...edited, programme: edited.programme!.map(p => p.kind === 'reposDiacetyle' ? { ...p, tempC: 8 } : p) };
    expect(evaluateYeastRecipeDesign(r, changedCleanup, refs).warnings.join(' ')).toContain('hors du repère documentaire +2–4 °C');
    expect(saved.fermentation!.map(p => p.note).join(' ')).not.toMatch(/vers 14 °C|21 j réservés/);
  });

  it('rejette atomiquement un programme malformé et conserve la lecture des snapshots v2 sans programme', () => {
    const r = recipe(), before = structuredClone(r), d = draft(r);
    for (const programme of [[], { wrong: true }, [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: -1 }]]) {
      const invalid = { ...d, programme } as YeastRecipeDraft;
      expect(evaluateYeastRecipeDesign(r, invalid, refs).errors.join(' ')).toContain('Programme incomplet');
      expect(() => applyYeastRecipeDesign(r, invalid, refs)).toThrow('Programme incomplet');
      expect(r).toEqual(before);
    }
    const legacy = applyYeastRecipeDesign(r, d, refs), old = readYeastRecipeDesign(legacy)!;
    expect(old.programme).toBeUndefined(); expect(createYeastRecipeDraft(legacy, refs).programme).toBeUndefined();
    const proposal = proposeYeastFermentationStrategy(r, d, refs), saved = applyYeastRecipeDesign(r, { ...d, ...proposal.patch }, refs);
    const snapshot = readYeastRecipeDesign(saved)!;
    expect(readYeastRecipeDesign({ ...saved, yeastDesign: { ...snapshot, programme: [] } })).toBeUndefined();
  });

  it('les objectifs changent la conduite proposée mais jamais la DF ou l’alcool à eux seuls', () => {
    const r = recipe(), reference = evaluateYeastRecipeDesign(r, draft(r), refs);
    for (const goal of ['clean', 'low-sulfur', 'dry', 'hops', 'fruit'] as const) {
      const d = draft(r, { goal }), strategy = proposeYeastFermentationStrategy(r, d, refs), result = evaluateYeastRecipeDesign(r, { ...d, ...strategy.patch }, refs);
      expect(strategy.patch.attenuationPct).toBeUndefined();
      expect(result.fg.range).toEqual(reference.fg.range); expect(result.abv.range).toEqual(reference.abv.range);
      expect(strategy.patch.alignActiveHopTemperature).toBeUndefined();
    }
  });

  it('le profil houblon conserve le contact actif, ses consignes et les limites de biotransformation', () => {
    const r = recipe({ style: 'NEIPA', yeast: { name: 'Culture NEIPA privée', attenuationPct: 80, technicalFacts: [temperature(18, 24)] },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }],
      hops: [{ name: 'Citra', stage: 'dryHop', alpha: 12, weightG: 100, aromaTiming: 'fermentation', aromaTemperatureC: 22, dayOffset: 3 }] });
    const d = draft(r, { goal: 'hops' }), s = proposeYeastFermentationStrategy(r, d, refs), next = applyYeastRecipeDesign(r, { ...d, ...s.patch }, refs);
    expect(next.hops).toEqual(r.hops);
    expect(s.effects.some(e => e.limit?.includes('hop creep'))).toBe(true);
    expect(s.sources.some(x => x.reference.includes('329/235/585'))).toBe(true);
    expect(next.fermentation![0].note).toContain('dernier houblonnage');
    expect(evaluateYeastRecipeDesign(r, { ...d, ...s.patch }, refs).activeHopTemperatureConflicts).toHaveLength(1);
  });

  it('une souche connue utilise ses propres sources, sans partager la fenêtre du produit précédent', () => {
    const reference = refs.find(y => y.id === 'lalbrew-diamond')!;
    expect(reference).toBeDefined();
    const r = recipe({ yeast: { name: 'Ale précédente', attenuationPct: 78, technicalFacts: [temperature(18, 30)] } });
    const d = createYeastRecipeDraft(r, refs, 'lager', reference.id), s = proposeYeastFermentationStrategy(r, { ...d, goal: 'low-sulfur' }, refs);
    expect(s.patch.temperatureC).toBeLessThan(18);
    expect(s.sources.some(x => x.reference === 'Fiche du labo L-42')).toBe(false);
    expect(s.sources.some(x => x.reference.includes('lallemand') || x.reference.includes('scottlab'))).toBe(true);
  });

  it('compare les vraies valeurs appliquées, sans faux changement de nom ni notes entières dans le diff', () => {
    const reference = refs.find(y => y.id === 'lalbrew-diamond')!;
    const r = recipe({ yeast: { name: 'LalBrew Diamond Lager', hopIndexId: reference.id, attenuationPct: 78, form: 'sèche' } });
    const d = draft(r, { goal: 'low-sulfur' }), s = proposeYeastFermentationStrategy(r, d, refs), preview = evaluateYeastRecipeDesign(r, { ...d, ...s.patch }, refs);
    expect(preview.changes.some(c => c.id === 'yeast')).toBe(false);
    expect(applyYeastRecipeDesign(r, { ...d, ...s.patch }, refs).yeast.name).toBe(r.yeast.name);
    const guard = preview.changes.find(c => c.label === 'Garde')!;
    expect(guard.before).toBe('Garde · 4 °C · 5 j');
    expect(guard.after).toBe('Garde · 2 °C · 21 j · consignes modifiées');
    expect(preview.changes.filter(c => c.id.startsWith('programme-')).every(c => c.before.length < 100 && c.after.length < 120)).toBe(true);
  });

  it('ne remplace jamais le programme NOLO par une stratégie de bière alcoolisée', () => {
    const r = recipe({ nolo: { enabled: true } as Recipe['nolo'] }), original = structuredClone(r);
    const s = proposeYeastFermentationStrategy(r, draft(r, { goal: 'low-sulfur' }), refs);
    expect(s.patch).toEqual({}); expect(s.effects[0].label).toBe('NOLO');
    expect(s.phases.every(p => p.preserved)).toBe(true); expect(r).toEqual(original);
  });

  it('réserve l’alerte POF au choix girofle ou au repos férulique réellement concernés', () => {
    const facts: YeastTechnicalFact[] = [temperature(10, 15), { key: 'pof', reported: 'positive', origin: 'manufacturer', source: 'Fiche A' }, { key: 'pof', reported: 'negative', origin: 'manufacturer', source: 'Fiche B' }];
    const r = recipe({ yeast: { name: 'Culture contradictoire', attenuationPct: 78, technicalFacts: facts }, mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] } });
    const d = draft(r, { goal: 'low-sulfur' });
    const lager = evaluateYeastRecipeDesign(r, d, refs);
    expect(lager.warnings.join(' ')).not.toContain('Capacité phénolique');
    expect(lager.projection.dossier.facts.filter(f => f.key === 'pof')).toEqual(facts.filter(f => f.key === 'pof'));
    for (const relevant of [{ ...d, goal: 'clove' as const }, { ...d, ferulicRest: true }]) {
      expect(evaluateYeastRecipeDesign(r, relevant, refs).warnings.join(' ')).toContain('Capacité phénolique non concordante');
    }
    const withRest = { ...r, mash: { steps: [{ name: 'Repos férulique', tempC: 44, durationMin: 15 }, ...r.mash!.steps] } };
    expect(evaluateYeastRecipeDesign(withRest, d, refs).warnings.join(' ')).toContain('Capacité phénolique non concordante');
  });

  it('les effets restent des objectifs après édition des paliers, sans anciennes consignes chiffrées', () => {
    const r = recipe(), d = draft(r, { goal: 'low-sulfur' }), strategy = proposeYeastFermentationStrategy(r, d, refs);
    const edited: YeastRecipeDraft = { ...d, ...strategy.patch, programme: strategy.patch.programme!.map(p => p.kind === 'reposDiacetyle'
      ? { ...p, tempC: 15, days: 1 } : p.name === 'Garde' ? { ...p, days: 28 } : p) };
    const saved = applyYeastRecipeDesign(r, edited, refs);
    expect(saved.fermentation!.find(p => p.kind === 'reposDiacetyle')).toMatchObject({ tempC: 15, days: 1 });
    expect(saved.fermentation!.find(p => p.name === 'Garde')?.days).toBe(28);
    expect(strategy.effects.map(e => `${e.expected} ${e.limit}`).join(' ')).not.toMatch(/\d+(?:[,.]\d+)?\s*(?:°C|j\b)|plus de contact/);
    expect(strategy.effects.find(e => e.label === 'Soufre')?.expected).toBe('Favoriser la réduction du H₂S avant le froid.');
    const ale = recipe({ style: 'Weissbier', yeast: { name: 'Wyeast 3068', hopIndexId: 'wyeast-3068', attenuationPct: 78 }, fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 7 }] });
    for (const goal of ['banana', 'fruit', 'clean'] as const) {
      const proposal = proposeYeastFermentationStrategy(ale, draft(ale, { goal }), refs);
      expect(proposal.effects.map(e => `${e.expected} ${e.limit}`).join(' ')).not.toMatch(/\d+(?:[,.]\d+)?\s*(?:°C|j\b)/);
    }
  });
});
