import { describe, expect, it } from 'vitest';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign, yeastRecipeCandidates, yeastSpecForCandidate } from '../../src/domain/yeastRecipeDesign';
import { applyReviewedYeastFacts, factsForStock, factsFromStock, sanitizeFacts, yeastFactChanges, yeastFactReported, yeastFactScope,
  readYeastDocumentaryView, yeastObservationDisagreements, yeastRangeConflicts, yeastRangeObservations, type IngredientFacts } from '../../src/domain/ingredientFacts';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import { projectYeastRecipe, resolveYeastDossier } from '../../src/domain/yeastProjection';
import { proposeYeastFermentationStrategy } from '../../src/domain/yeastFermentationStrategy';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import type { Recipe } from '../../src/types';

describe('Faits documentaires retenus dans un essai de levure', () => {
  it('garde un moût de bière décrit avec ses conditions et exclut un moût de vin', () => {
    expect(yeastFactScope('Moût de contrôle à 20 °C ; dépend du brassin.', 'attenuation')).toBe('beer');
    expect(yeastFactScope('Moût de vin à 20 °C', 'attenuation')).toBe('other');
    expect(yeastFactScope('Beer bottle conditioning at 20 °C', 'attenuation')).toBe('other');
  });
  it('reconnaît une description de floculation sans sortir les vrais contextes hors bière', () => {
    expect(yeastFactScope('Temps de sédimentation rapide', 'flocculation')).toBe('descriptive');
    expect(yeastFactScope('Floculation faible, levure poudreuse restant longtemps en suspension.', 'flocculation')).toBe('descriptive');
    expect(yeastFactScope('Floculation faible du cidre', 'flocculation')).toBe('other');
    expect(yeastFactScope('Floculation faible au conditionnement en bouteille', 'flocculation')).toBe('other');
  });
  it('garde l’origine et la source IA d’une floculation décrite en prose fabricant', () => {
    const fact: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai',
      source: '3638 for Bavarian Wheat | Yeast & Cultures by Wyeast Labs',
      sourceUrl: 'https://wyeastlab.com/3638-bavarian-wheat/', retrievedAt: '2026-09-27',
      context: 'Floculation faible, levure poudreuse restant longtemps en suspension.' };
    const response: IngredientFacts = { found: true, name: 'Wyeast 3638', source: fact.source!, sourceUrl: fact.sourceUrl,
      lab: 'Wyeast', strain: '3638', flocculation: 'Low', technicalFacts: [fact] };
    const accepted = applyReviewedYeastFacts({ name: 'Wyeast 3638' }, response, [], {});
    expect(accepted.technicalSelections?.flocculation).toMatchObject({ origin: 'ai', source: fact.source, sourceUrl: fact.sourceUrl, reported: 'Low' });
    expect(resolveYeastDossier(accepted).flocculation).toMatchObject({
      value: { kind: 'category', value: 'Low' }, origin: 'ai', source: fact.source, sourceUrl: fact.sourceUrl
    });
  });
  it('ne transforme pas un scalaire ancien gardé en sélection personnelle sourcée par une observation voisine', () => {
    const previous: YeastTechnicalFact = { key: 'form', reported: 'Liquide', origin: 'ai', source: 'NEIGHBOR_SOURCE' };
    const incoming: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'CURRENT_FLOC_SOURCE',
      sourceUrl: 'https://example.org/flocculation', context: 'Floculation faible sur moût de contrôle.' };
    const current = { name: 'Culture libre', flocculation: 'Moyenne', technicalSource: 'NEIGHBOR_SOURCE', technicalFacts: [previous] };
    const response: IngredientFacts = { found: true, name: current.name, source: 'CURRENT_RESPONSE_SOURCE', flocculation: 'Low', technicalFacts: [incoming] };
    const kept = applyReviewedYeastFacts(current, response, [], {});
    expect(kept.flocculation).toBe('Moyenne');
    expect(kept.technicalSelections?.flocculation).toBeUndefined();
    expect(resolveYeastDossier(kept).flocculation).toMatchObject({ value: { kind: 'category', value: 'Moyenne' }, reported: 'Moyenne' });
    expect(resolveYeastDossier(kept).flocculation.origin).toBeUndefined();
    expect(resolveYeastDossier(kept).flocculation.source).toBeUndefined();
    expect(resolveYeastDossier(kept).facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'flocculation', origin: 'ai', source: 'CURRENT_FLOC_SOURCE', sourceUrl: incoming.sourceUrl })
    ]));
  });
  const fixture = () => {
    const recipe = yeastFlowRecipe(), refs = yeastReferences([]);
    const candidate = yeastRecipeCandidates('weissbier', 'balanced', refs, recipe.volumeL, { includeOtherStyles: true })
      .find(value => value.label === 'M20 · Bavarian Wheat')!;
    const yeast = completeFromLocalReferences([], [], yeastSpecForCandidate(candidate), [], []).yeast;
    const facts: IngredientFacts = { found: true, name: candidate.label, source: 'Fiche M20 de contrôle', origin: 'ai',
      tempMinC: 18, tempMaxC: 28 };
    return { recipe, refs, candidate, yeast, facts };
  };

  it('garde l’observation refusée mais calcule avec la plage explicitement gardée ou remplacée, après réouverture', () => {
    const { recipe, candidate, yeast, facts } = fixture();
    expect(yeastRangeConflicts(yeast, facts)).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'temperature' })]));
    const kept = applyReviewedYeastFacts(yeast, facts, [], {});
    const replaced = applyReviewedYeastFacts(yeast, facts, ['fermTempMaxC'], {});
    expect(kept.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ origin: 'ai', source: facts.source })]));
    expect(resolveYeastDossier(kept, candidate.reference).temperature?.range).toEqual({ min: 18, max: 30 });
    expect(resolveYeastDossier(replaced, candidate.reference).temperature?.range).toEqual({ min: 18, max: 28 });
    const reopened = normalizeRecipe(JSON.parse(JSON.stringify({ ...recipe, yeast: replaced })) as Recipe);
    expect(resolveYeastDossier(reopened.yeast, candidate.reference).temperature?.range).toEqual({ min: 18, max: 28 });
    expect(reopened.yeast.technicalSelections?.temperature?.source).toBe(facts.source);
    const portable = readRecipeText(writeRecipeText({ ...recipe, yeast: replaced }))!;
    expect(resolveYeastDossier(portable.yeast, candidate.reference).temperature?.range).toEqual({ min: 18, max: 28 });
  });

  it('propose et projette avec la même borne retenue, jamais 29 °C annoncé dans une fenêtre finissant à 28 °C', () => {
    const { recipe, refs, candidate, yeast, facts } = fixture();
    const selected = applyReviewedYeastFacts(yeast, facts, ['fermTempMaxC'], {});
    const draft = { ...createYeastRecipeDraft(recipe, refs, 'weissbier', candidate.yeastId), goal: 'balanced' as const, goalExplicit: true,
      temperatureC: 29, programme: [{ kind: 'primaire' as const, name: 'Primaire', tempC: 29, days: 10 }] };
    const evaluated = evaluateYeastRecipeDesign(recipe, draft, refs, selected);
    expect(evaluated.projection.dossier.temperature?.range.max).toBe(28);
    expect(evaluated.warnings.join(' ')).toMatch(/29.*hors de la plage|hors de la plage.*29/);
    const strategy = proposeYeastFermentationStrategy(recipe, draft, refs, selected);
    expect(strategy.rationale).not.toMatch(/29.*dans la plage renseignée/);
    expect(strategy.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Profil', expected: 'Conserver la conduite et observer le profil de la souche.' }),
      expect.objectContaining({ label: 'Conduite', expected: 'Choisir une consigne dans la plage renseignée.' })
    ]));
  });

  it('arbitre deux plages documentaires d’atténuation sans réduire une plage à un pourcentage fictif', () => {
    const { candidate, yeast } = fixture();
    const old = resolveYeastDossier(yeast, candidate.reference).documentedAttenuation?.range;
    expect(old).toBeDefined();
    const facts: IngredientFacts = { found: true, name: candidate.label, source: 'Seconde fiche de contrôle', origin: 'ai',
      technicalFacts: [{ key: 'attenuation', reported: '73–78 %', range: { min: 73, max: 78 }, unit: '%',
        qualifier: 'range', origin: 'ai', source: 'Seconde fiche de contrôle' }] };
    expect(yeastRangeConflicts(yeast, facts)).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'attenuation' })]));
    const kept = applyReviewedYeastFacts(yeast, facts, [], { attenuation: 'keep' });
    const replaced = applyReviewedYeastFacts(yeast, facts, [], { attenuation: 'replace' });
    expect(resolveYeastDossier(kept, candidate.reference).documentedAttenuation?.range).toEqual(old);
    expect(resolveYeastDossier(replaced, candidate.reference).documentedAttenuation?.range).toEqual({ min: 73, max: 78 });
    expect(replaced.attenuationPct).toBeUndefined();
    expect(replaced.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ reported: '73–78 %' })]));
  });

  it('compare aussi une ancienne plage seulement saisie en chiffres et conserve la concordance champ/calcul', () => {
    const { candidate } = fixture();
    const yeast = { name: candidate.label, fermTempMinC: 18, fermTempMaxC: 30, technicalSource: 'Fiche personnelle' };
    const facts: IngredientFacts = { found: true, name: candidate.label, source: 'Autre fiche',
      technicalFacts: [{ key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C',
        qualifier: 'range', origin: 'ai', source: 'Autre fiche' }] };
    expect(yeastRangeConflicts(yeast, facts)).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'temperature' })]));
    const kept = applyReviewedYeastFacts(yeast, facts, [], { temperature: 'keep' });
    const replaced = applyReviewedYeastFacts(yeast, facts, [], { temperature: 'replace' });
    expect([kept.fermTempMaxC, resolveYeastDossier(kept).temperature?.range.max]).toEqual([30, 30]);
    expect([replaced.fermTempMaxC, resolveYeastDossier(replaced).temperature?.range.max]).toEqual([28, 28]);
    const portable = readRecipeText(writeRecipeText({ ...yeastFlowRecipe(), yeast: replaced }))!;
    expect([portable.yeast.fermTempMaxC, resolveYeastDossier(portable.yeast).temperature?.range.max]).toEqual([28, 28]);
  });

  it('n’utilise jamais la première de deux observations contradictoires sans choix explicite', () => {
    const { candidate } = fixture();
    const yeast = { name: candidate.label };
    const observations = [
      { key: 'temperature' as const, reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C', qualifier: 'range' as const, origin: 'ai' as const, source: 'Fiche A' },
      { key: 'temperature' as const, reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range' as const, origin: 'ai' as const, source: 'Fiche B' },
    ];
    const facts: IngredientFacts = { found: true, name: candidate.label, source: 'Recherche à revoir', tempMinC: 18, tempMaxC: 28, technicalFacts: observations };
    expect(yeastRangeObservations(facts).temperature).toHaveLength(2);
    expect(resolveYeastDossier(applyReviewedYeastFacts(yeast, facts, [], {})).temperature).toBeUndefined();
    const first = applyReviewedYeastFacts(yeast, facts, [], {}, { temperature: 0 });
    const second = applyReviewedYeastFacts(yeast, facts, [], {}, { temperature: 1 });
    expect([first.fermTempMaxC, resolveYeastDossier(first).temperature?.range.max]).toEqual([28, 28]);
    expect([second.fermTempMaxC, resolveYeastDossier(second).temperature?.range.max]).toEqual([30, 30]);
    const inverted = { ...facts, technicalFacts: [...observations].reverse() };
    expect(resolveYeastDossier(applyReviewedYeastFacts(yeast, inverted, [], {})).temperature).toBeUndefined();
    const old = { ...yeast, fermTempMinC: 18, fermTempMaxC: 32 };
    expect(yeastRangeConflicts(old, facts, { temperature: 1 })).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'temperature' })]));
    const retainedOld = applyReviewedYeastFacts(old, facts, [], { temperature: 'keep' }, { temperature: 1 });
    const retainedNew = applyReviewedYeastFacts(old, facts, [], { temperature: 'replace' }, { temperature: 1 });
    expect([retainedOld.fermTempMaxC, resolveYeastDossier(retainedOld).temperature?.range.max]).toEqual([32, 32]);
    expect([retainedNew.fermTempMaxC, resolveYeastDossier(retainedNew).temperature?.range.max]).toEqual([30, 30]);
    const sameOld = { ...yeast, fermTempMinC: 18, fermTempMaxC: 30 };
    const chosenSame = applyReviewedYeastFacts(sameOld, facts, [], {}, { temperature: 1 });
    expect(chosenSame.technicalSelections?.temperature?.range).toEqual({ min: 18, max: 30 });
    const reopened = readRecipeText(writeRecipeText({ ...yeastFlowRecipe(), yeast: chosenSame }))!;
    expect([reopened.yeast.fermTempMaxC, resolveYeastDossier(reopened.yeast).temperature?.range.max]).toEqual([30, 30]);
  });
});

// Réponses réelles du 25/09/2026 (work/ux-mobile-poc-2026-09-25/review), recopiées
// comme fixtures non fiables : aucun appel, aucune valeur approuvée comme mesure.
const s04Doc = { origin: 'ai' as const, source: 'SafAle™ S-04 - Fermentis', sourceUrl: 'https://fermentis.com/en/product/safale-s-04/', retrievedAt: '2026-09-25' };
const s04: IngredientFacts = { found: true, name: 'SafAle S-04', source: s04Doc.source, sourceUrl: s04Doc.sourceUrl, retrievedAt: s04Doc.retrievedAt,
  lab: 'Fermentis', strain: 'SafAle S-04', form: 'sèche', tempMinC: 18, tempMaxC: 26, technicalFacts: [
    { key: 'temperature', reported: '18–26 °C', qualifier: 'range', range: { min: 18, max: 26 }, unit: '°C', ...s04Doc },
    { key: 'attenuation', reported: '74–82%', qualifier: 'range', range: { min: 74, max: 82 }, unit: '%', ...s04Doc },
    { key: 'alcoholTolerance', reported: '9–11%', qualifier: 'range', range: { min: 9, max: 11 }, unit: '%', ...s04Doc },
    { key: 'pitchRate', reported: '50 to 80 g/hl', qualifier: 'range', range: { min: 50, max: 80 }, unit: 'g/hl', ...s04Doc },
    { key: 'flocculation', reported: 'High / Fast sedimentation', ...s04Doc },
    { key: 'form', reported: 'Sèche active', ...s04Doc },
    { key: 'species', reported: 'Saccharomyces cerevisiae', ...s04Doc }
  ] };
const m54Doc = { origin: 'ai' as const, source: 'Mangrove Jack\'s — Craft Series Yeast Technical Data',
  sourceUrl: 'https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785', retrievedAt: '2026-09-25' };
const m54: IngredientFacts = { found: true, name: 'M54 · Californian Lager', source: m54Doc.source, sourceUrl: m54Doc.sourceUrl, retrievedAt: m54Doc.retrievedAt,
  lab: 'Mangrove Jack’s', strain: 'M54', form: 'sèche', flocculation: 'High', attenuationPct: 79.5, alcoholTolerancePct: 9, tempMinC: 18, tempMaxC: 20, technicalFacts: [
    { key: 'temperature', reported: '18 - 20°C', context: 'Recommandation de température de fermentation', qualifier: 'range', range: { min: 18, max: 20 }, unit: '°C', ...m54Doc },
    { key: 'attenuation', reported: '77 - 82%', context: 'Atténuation apparente', qualifier: 'range', range: { min: 77, max: 82 }, unit: '%', ...m54Doc },
    { key: 'alcoholTolerance', reported: '9 % ABV', context: 'Tolérance maximale à l\'alcool', qualifier: 'upTo', range: { min: 9, max: 9 }, unit: '%', ...m54Doc },
    { key: 'flocculation', reported: 'High', context: 'Niveau de sédimentation / flocculation', ...m54Doc },
    { key: 'form', reported: 'sèche', context: 'Forme commerciale de la levure', ...m54Doc }
  ] };
const reopen = (yeast: Recipe['yeast']) => normalizeRecipe(JSON.parse(JSON.stringify({ ...yeastFlowRecipe(), yeast })) as Recipe).yeast;

describe('Réponses réelles S‑04 et M54 placées dans les champs de la fiche', () => {
  it('S‑04 : la floculation publiée sans scalaire remplit son champ, en conflit explicite avec une saisie différente', () => {
    const fresh = applyReviewedYeastFacts({ name: 'SafAle S-04', qty: 11.5, unit: 'g' }, s04, [], {});
    expect(fresh).toMatchObject({ qty: 11.5, unit: 'g', lab: 'Fermentis', strain: 'SafAle S-04', form: 'sèche',
      fermTempMinC: 18, fermTempMaxC: 26, flocculation: 'High / Fast sedimentation', technicalSource: s04.source });
    // Plages publiées : aucune moyenne ; le taux d’ensemencement reste une observation.
    expect([fresh.attenuationPct, fresh.alcoholTolerancePct, fresh.pitchTempC]).toEqual([undefined, undefined, undefined]);
    expect(fresh.technicalSelections?.attenuation?.range).toEqual({ min: 74, max: 82 });
    expect(fresh.technicalSelections?.alcoholTolerance?.range).toEqual({ min: 9, max: 11 });
    expect(fresh.technicalFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'flocculation', reported: 'High / Fast sedimentation', sourceUrl: s04Doc.sourceUrl }),
      expect.objectContaining({ key: 'pitchRate', unit: 'g/hl', sourceUrl: s04Doc.sourceUrl })]));
    const old = { name: 'SafAle S-04', flocculation: 'Moyenne' };
    expect(yeastFactChanges(old, s04)).toEqual(expect.arrayContaining([
      { field: 'flocculation', label: 'Floculation', current: 'Moyenne', proposed: 'High / Fast sedimentation', conflict: true }]));
    expect(applyReviewedYeastFacts(old, s04, [], {}).flocculation).toBe('Moyenne');
    expect(applyReviewedYeastFacts(old, s04, ['flocculation'], {}).flocculation).toBe('High / Fast sedimentation');
    const reopened = reopen(fresh);
    expect(reopened).toMatchObject({ flocculation: 'High / Fast sedimentation', form: 'sèche', lab: 'Fermentis', strain: 'SafAle S-04', fermTempMinC: 18, fermTempMaxC: 26 });
    expect([reopened.attenuationPct, reopened.alcoholTolerancePct]).toEqual([undefined, undefined]);
    expect(resolveYeastDossier(reopened).temperature?.range).toEqual({ min: 18, max: 26 });
    expect(resolveYeastDossier(reopened).documentedAttenuation?.range).toEqual({ min: 74, max: 82 });
  });

  it('M54 : 9 % reste un plafond et 79,5 % n’est jamais retenu comme valeur publiée, même après réouverture', () => {
    const clean = sanitizeFacts(m54);
    expect([clean.attenuationPct, clean.alcoholTolerancePct, clean.flocculation]).toEqual([undefined, undefined, 'High']);
    const fields = yeastFactChanges({ name: m54.name }, m54).map(change => change.field);
    expect(fields).not.toContain('attenuationPct');
    expect(fields).not.toContain('alcoholTolerancePct');
    const applied = applyReviewedYeastFacts({ name: m54.name, qty: 10, unit: 'g' }, m54, [], {});
    expect(applied).toMatchObject({ qty: 10, unit: 'g', lab: 'Mangrove Jack’s', strain: 'M54', form: 'sèche', flocculation: 'High', fermTempMinC: 18, fermTempMaxC: 20 });
    const reopened = reopen(applied);
    expect([reopened.attenuationPct, reopened.alcoholTolerancePct]).toEqual([undefined, undefined]);
    const alcohol = reopened.technicalFacts?.filter(fact => fact.key === 'alcoholTolerance');
    expect(alcohol).toEqual([expect.objectContaining({ qualifier: 'upTo', range: { min: 9, max: 9 }, sourceUrl: m54Doc.sourceUrl })]);
    expect(yeastFactReported(alcohol![0])).toBe('au plus 9 % ABV');
    expect(reopened.technicalFacts?.filter(fact => fact.key === 'attenuation').map(fact => fact.range)).toEqual([{ min: 77, max: 82 }]);
  });

  it('ne remplit floculation ou forme que depuis une formulation unique et sans autre milieu', () => {
    const doc = { origin: 'ai' as const, source: 'Fiche de contrôle' };
    const read = (technicalFacts: YeastTechnicalFact[], values: Partial<IngredientFacts> = {}) =>
      sanitizeFacts({ found: true, name: 'Levure de contrôle', source: doc.source, technicalFacts, ...values });
    expect(read([{ key: 'flocculation', reported: 'High', ...doc }, { key: 'flocculation', reported: 'high', ...doc, source: 'Fiche B' }]).flocculation).toBe('High');
    expect(read([{ key: 'flocculation', reported: 'High', ...doc }, { key: 'flocculation', reported: 'Medium', ...doc }]).flocculation).toBeUndefined();
    expect(read([{ key: 'flocculation', reported: 'High', context: 'cidre', ...doc }]).flocculation).toBeUndefined();
    expect(read([{ key: 'flocculation', reported: 'High', ...doc }], { flocculation: 'Moyenne' }).flocculation).toBe('Moyenne');
    expect(read([{ key: 'form', reported: 'Sèche active', ...doc }]).form).toBe('sèche');
    expect(read([{ key: 'form', reported: 'Dry', ...doc }, { key: 'form', reported: 'Liquid', ...doc }]).form).toBeUndefined();
    expect(read([{ key: 'form', reported: 'Sachet de 11,5 g', ...doc }]).form).toBeUndefined();
  });
});

describe('Contexte descriptif d’une fiche de bière et champs alimentés par une observation seule', () => {
  const doc = { origin: 'ai' as const, source: 'Fiche de contrôle', sourceUrl: 'https://example.com/fiche-controle', retrievedAt: '2026-09-25' };
  const sheet = (technicalFacts: YeastTechnicalFact[], values: Partial<IngredientFacts> = {}): IngredientFacts =>
    ({ found: true, name: 'Levure de contrôle', source: doc.source, sourceUrl: doc.sourceUrl, technicalFacts, ...values });
  const point = (key: YeastTechnicalFact['key'], value: number, unit: string, extra: Partial<YeastTechnicalFact> = {}): YeastTechnicalFact =>
    ({ key, reported: `${value} ${unit}`, qualifier: 'reportedPoint', range: { min: value, max: value }, unit, ...doc, ...extra });
  const span = (key: YeastTechnicalFact['key'], min: number, max: number, unit: string, extra: Partial<YeastTechnicalFact> = {}): YeastTechnicalFact =>
    ({ key, reported: `${min}–${max} ${unit}`, qualifier: 'range', range: { min, max }, unit, ...doc, ...extra });

  it('accepte le libellé de la propriété, jamais un autre milieu, une condition, un chiffre ou un mot non reconnu', () => {
    expect(m54.technicalFacts!.map(fact => yeastFactScope(fact.context, fact.key))).toEqual(Array(5).fill('descriptive'));
    expect([yeastFactScope(undefined, 'attenuation'), yeastFactScope('Beer', 'attenuation'), yeastFactScope('Atténuation apparente sur moût', 'attenuation'),
      yeastFactScope('Apparent attenuation', 'attenuation'), yeastFactScope('Durée de fermentation', 'fermentationTime')])
      .toEqual(['unspecified', 'beer', 'beer', 'descriptive', 'descriptive']);
    const outside: [YeastTechnicalFact['key'], string][] = [
      ['attenuation', 'vin'], ['attenuation', 'Atténuation apparente en vin blanc'], ['alcoholTolerance', 'Tolérance à l’alcool pour l’hydromel'],
      ['temperature', 'Température de fermentation du cidre'], ['temperature', 'Mead'], ['alcoholTolerance', 'Alcohol tolerance in wine'],
      ['attenuation', 'Atténuation réelle'], ['attenuation', 'Atténuation apparente moyenne'], ['temperature', 'Température selon le style'],
      ['temperature', 'Température de refermentation en bouteille'], ['temperature', 'Température de fermentation à 12 °P'],
      ['temperature', 'Atténuation apparente'], ['fermentationTime', 'Durée de fermentation du kombucha'], ['attenuation', 'Fiche technique'],
      ['attenuation', '葡萄酒']];
    for (const [key, context] of outside) expect([context, yeastFactScope(context, key)]).toEqual([context, 'other']);
  });

  it('M54 : la plage 77–82 % et le plafond 9 % servent la sélection et la projection ; un contexte hydromel reste exclu', () => {
    const applied = applyReviewedYeastFacts({ name: m54.name, qty: 10, unit: 'g' }, m54, [], {});
    expect(applied.technicalSelections).toMatchObject({ temperature: { range: { min: 18, max: 20 } },
      attenuation: { qualifier: 'range', range: { min: 77, max: 82 }, context: 'Atténuation apparente' },
      alcoholTolerance: { qualifier: 'upTo', range: { min: 9, max: 9 } } });
    const reopened = reopen(applied);
    expect(resolveYeastDossier(reopened)).toMatchObject({ temperature: { range: { min: 18, max: 20 } },
      documentedAttenuation: { qualifier: 'range', range: { min: 77, max: 82 }, basis: 'declared' },
      alcoholTolerance: { qualifier: 'upTo', range: { min: 9, max: 9 } } });
    expect([reopened.attenuationPct, reopened.alcoholTolerancePct]).toEqual([undefined, undefined]);
    expect(projectYeastRecipe({ ...yeastFlowRecipe(), yeast: reopened }).attenuation).toMatchObject({ qualifier: 'range', range: { min: 77, max: 82 } });
    // Sans sélection enregistrée, l’observation locale décrit aussi le produit.
    expect(resolveYeastDossier({ name: m54.name, technicalFacts: m54.technicalFacts }).documentedAttenuation?.range).toEqual({ min: 77, max: 82 });
    const mead: IngredientFacts = { ...m54, technicalFacts: m54.technicalFacts!.map(fact =>
      fact.key === 'attenuation' ? { ...fact, context: 'Atténuation apparente en hydromel' } : fact) };
    const meadApplied = applyReviewedYeastFacts({ name: m54.name }, mead, [], {});
    expect(meadApplied.technicalSelections?.attenuation).toBeUndefined();
    expect(resolveYeastDossier(reopen(meadApplied)).documentedAttenuation).toBeUndefined();
    expect(meadApplied.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'attenuation', context: 'Atténuation apparente en hydromel' })]));
  });

  it('remplit les champs vides depuis une observation seule : plage à deux bornes, point exact, durée ponctuelle en jours', () => {
    const facts = sheet([
      span('temperature', 12, 18, '°C', { context: 'Recommandation de température de fermentation' }),
      point('attenuation', 78, '%', { context: 'Atténuation apparente' }), point('alcoholTolerance', 10, '%'),
      point('fermentationTime', 14, 'jours', { context: 'Durée de fermentation' }),
      span('pitchRate', 50, 80, 'g/hl'), { key: 'species', reported: 'Saccharomyces pastorianus', ...doc }]);
    expect(sanitizeFacts(facts)).toMatchObject({ tempMinC: 12, tempMaxC: 18, attenuationPct: 78, alcoholTolerancePct: 10, fermentDays: 14 });
    const applied = applyReviewedYeastFacts({ name: 'Levure de contrôle', qty: 11.5, unit: 'g' }, facts, [], {});
    expect(applied).toMatchObject({ qty: 11.5, unit: 'g', fermTempMinC: 12, fermTempMaxC: 18, attenuationPct: 78, attenuationBasis: 'declared',
      alcoholTolerancePct: 10, fermentDays: 14 });
    expect([applied.pitchTempC, applied.stockItemRef]).toEqual([undefined, undefined]);
    // Sans champ dédié, le taux d’ensemencement et l’espèce restent des observations sourcées.
    expect(applied.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'pitchRate', unit: 'g/hl', sourceUrl: doc.sourceUrl }),
      expect.objectContaining({ key: 'species', sourceUrl: doc.sourceUrl })]));
    const reopened = reopen(applied);
    expect(reopened).toMatchObject({ fermTempMinC: 12, fermTempMaxC: 18, attenuationPct: 78, alcoholTolerancePct: 10, fermentDays: 14 });
    expect(resolveYeastDossier(reopened)).toMatchObject({ temperature: { range: { min: 12, max: 18 } },
      documentedAttenuation: { qualifier: 'reportedPoint', range: { min: 78, max: 78 } }, alcoholTolerance: { range: { min: 10, max: 10 } } });
    // Le stock garde les champs et les observations ; la durée revient depuis l’observation.
    const stored = JSON.parse(JSON.stringify({ id: 'c', ref: 'c', name: 'Levure de contrôle', unit: 'g', currentStock: 3, minStock: 0, reorder: false,
      ...factsForStock('levure', facts) }));
    expect(stored).toMatchObject({ currentStock: 3, yeastTempMinC: 12, yeastTempMaxC: 18, yeastAttenuationPct: 78, yeastAlcoholTolerancePct: 10 });
    expect(factsFromStock(stored).fermentDays).toBe(14);
  });

  it('ne transforme jamais une plage, une borne ou une moyenne en point, ni une durée hors jours ou hors bière', () => {
    const bounded = sheet([point('temperature', 20, '°C'), point('attenuation', 75, '%', { qualifier: 'atLeast', reported: 'au moins 75 %' }),
      point('alcoholTolerance', 9, '%', { qualifier: 'upTo', reported: '9 % ABV' }), span('fermentationTime', 7, 10, 'jours')]);
    const clean = sanitizeFacts(bounded);
    expect([clean.tempMinC, clean.tempMaxC, clean.attenuationPct, clean.alcoholTolerancePct, clean.fermentDays]).toEqual([undefined, undefined, undefined, undefined, undefined]);
    const fresh = applyReviewedYeastFacts({ name: 'Levure de contrôle' }, bounded, [], {});
    expect([fresh.fermTempMinC, fresh.fermTempMaxC, fresh.attenuationPct, fresh.alcoholTolerancePct, fresh.fermentDays]).toEqual([undefined, undefined, undefined, undefined, undefined]);
    // Une température ponctuelle reste un repère sourcé, pas deux bornes.
    expect(fresh.technicalSelections?.temperature).toMatchObject({ qualifier: 'reportedPoint', range: { min: 20, max: 20 } });
    expect(sanitizeFacts(sheet([span('attenuation', 77, 82, '%')], { attenuationPct: 79.5 })).attenuationPct).toBeUndefined();
    expect(sanitizeFacts(sheet([point('fermentationTime', 48, 'h')])).fermentDays).toBeUndefined();
    expect(sanitizeFacts(sheet([point('fermentationTime', 14, 'jours', { context: 'Durée de fermentation de l’hydromel' })])).fermentDays).toBeUndefined();
    expect(sanitizeFacts(sheet([point('attenuation', 90, '%', { context: 'Atténuation en vin' })])).attenuationPct).toBeUndefined();
    // L’observation publiée prime sur un chiffre isolé du modèle ; sans observation, aucune durée.
    expect(sanitizeFacts(sheet([point('attenuation', 78, '%')], { attenuationPct: 75 })).attenuationPct).toBe(78);
    expect(sanitizeFacts(sheet([], { fermentDays: 21 })).fermentDays).toBeUndefined();
  });

  it('laisse inconnue une valeur contredite, la signale, et demande un choix face à une saisie différente', () => {
    const contradictory = sheet([point('fermentationTime', 7, 'jours'), point('fermentationTime', 14, 'jours', { source: 'Fiche B' }),
      point('attenuation', 75, '%'), point('attenuation', 78, '%', { source: 'Fiche B' }),
      span('temperature', 18, 22, '°C'), span('temperature', 18, 24, '°C', { source: 'Fiche B' })]);
    const clean = sanitizeFacts(contradictory);
    expect([clean.fermentDays, clean.attenuationPct, clean.tempMinC, clean.tempMaxC]).toEqual([undefined, undefined, undefined, undefined]);
    expect(yeastObservationDisagreements(contradictory).map(({ key, observations }) => [key, observations.map(fact => fact.source)]))
      .toEqual([['temperature', [doc.source, 'Fiche B']], ['attenuation', [doc.source, 'Fiche B']], ['fermentationTime', [doc.source, 'Fiche B']]]);
    const fresh = applyReviewedYeastFacts({ name: 'Levure de contrôle' }, contradictory, [], {});
    expect([fresh.fermentDays, fresh.attenuationPct, fresh.fermTempMinC, fresh.fermTempMaxC]).toEqual([undefined, undefined, undefined, undefined]);
    expect(fresh.technicalSelections).toMatchObject({ temperature: null, attenuation: null });

    const single = sheet([point('fermentationTime', 14, 'jours')]);
    const current = { name: 'Levure de contrôle', fermentDays: 10 };
    expect(yeastFactChanges(current, single)).toEqual([{ field: 'fermentDays', label: 'Durée indicative de la fiche (j)', current: 10, proposed: 14, conflict: true }]);
    expect(applyReviewedYeastFacts(current, single, [], {}).fermentDays).toBe(10);
    const replaced = reopen(applyReviewedYeastFacts(current, single, ['fermentDays'], {}));
    expect(replaced.fermentDays).toBe(14);
    expect(replaced.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'fermentationTime', range: { min: 14, max: 14 }, sourceUrl: doc.sourceUrl })]));
  });

  it('une note acceptée ne réactive pas une température ni une atténuation explicitement inconnues', () => {
    const yeast = { name: 'Culture A', hopIndexId: 'identity-a', attenuationPct: 78, attenuationBasis: 'declared' as const,
      fermTempMaxC: 30, technicalSource: 'OLD_COMPAT_SOURCE',
      technicalFacts: [{ key: 'temperature' as const, reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range' as const,
        origin: 'personal' as const, source: 'OLD_TEMP_SOURCE', context: 'beer' }],
      adoptedDocumentary: { version: 1 as const, hopIndexId: 'identity-a',
        documentary: { declaredAttenuationPct: null, fermTempMaxC: null, technicalSource: null },
        technicalFacts: [], technicalSelections: { attenuation: null, temperature: null } } };
    const before = structuredClone(yeast);
    const note: IngredientFacts = { found: true, name: 'Culture A', source: 'LOOKUP_SOURCE', origin: 'ai', documentaryNotes: [
      { text: 'Vérifier la température avant le prochain essai.', origin: 'ai', source: 'Réponse de recherche' }
    ] };
    const accepted = applyReviewedYeastFacts(yeast, note, [], {});
    const view = readYeastDocumentaryView(accepted);
    expect(accepted.documentaryNotes).toEqual(note.documentaryNotes);
    expect(view.status).toBe('adopted');
    expect(view.documentary).toMatchObject({ declaredAttenuationPct: null, fermTempMaxC: null, technicalSource: null });
    expect(view.technicalFacts).toEqual([]);
    expect(view.technicalSelections).toMatchObject({ attenuation: null, temperature: null });
    expect(view.effectiveYeast).toMatchObject({ attenuationPct: undefined, fermTempMaxC: undefined, technicalSource: undefined });
    expect(view.historicalScalarReading).toBeUndefined();
    expect(accepted.adoptedDocumentary).toEqual(yeast.adoptedDocumentary);
    expect(yeast).toEqual(before);

    const localYeast = { ...yeast, adoptedDocumentary: undefined, localDocumentary: {
      version: 1 as const, documentary: { declaredAttenuationPct: null, fermTempMaxC: null, technicalSource: null },
      technicalFacts: [], technicalSelections: { attenuation: null, temperature: null }
    } };
    const localBefore = structuredClone(localYeast);
    const localAccepted = applyReviewedYeastFacts(localYeast, note, [], {});
    const localView = readYeastDocumentaryView(localAccepted);
    expect(localView.status).toBe('local');
    expect(localView.historicalScalarReading).toBeUndefined();
    expect(localView.effectiveYeast).toMatchObject({ attenuationPct: undefined, fermTempMaxC: undefined, technicalSource: undefined });
    expect(localAccepted.localDocumentary).toEqual(localYeast.localDocumentary);
    expect(localYeast).toEqual(localBefore);
  });

  it('retrouve la portée libre 78/source après transport sans ID catalogue ni origine inventée', () => {
    const localDocumentary = { version: 1 as const, documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_LIBRE_HISTORIQUE' }, technicalFacts: [] };
    const yeast = { name: 'Culture libre QA', attenuationPct: 73, attenuationBasis: 'recipe' as const, localDocumentary };
    const recipe = { ...yeastFlowRecipe(), yeast };
    const reopened = readRecipeText(writeRecipeText(recipe))!;
    expect(reopened.yeast.localDocumentary).toEqual(localDocumentary);
    expect(reopened.yeast.hopIndexId).toBeUndefined();
    expect([reopened.yeast.attenuationPct, reopened.yeast.attenuationBasis]).toEqual([73, 'recipe']);
    expect(readYeastDocumentaryView(reopened.yeast)).toMatchObject({ status: 'local', scope: 'local',
      historicalScalarReading: { kind: 'historical-untyped', value: 78, source: 'SOURCE_LIBRE_HISTORIQUE' } });
    const dossier = resolveYeastDossier(reopened.yeast);
    expect(dossier.documentedAttenuation).toBeUndefined();
    expect(dossier.attenuation).toMatchObject({ basis: 'recipe', range: { min: 73, max: 73 }, sources: [] });
  });
});
