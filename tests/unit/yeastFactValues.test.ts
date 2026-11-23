import { describe, expect, it } from 'vitest';
import { readYeastDocumentaryNotes, readYeastFactValue, readYeastTechnicalFacts, readYeastTechnicalSelections, type YeastDocumentaryNote, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { assertYeastCatalogue } from '../../functions/src/yeastCatalogueSchema';
import { reportedRange } from '../../scripts/yeast-catalogue/parse.mjs';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';
import { adaptYeastLookupResult, applyReviewedYeastFacts, decideYeastDocumentaryNotes, editYeastDocumentaryNote, factsFromStock, sanitizeFacts, type IngredientFacts } from '../../src/domain/ingredientFacts';
import type { YeastSpec, StockItem } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

const source = { author: 'Brasserie témoin', title: 'Fiche levure', reference: 'https://example.org/yeast', kind: 'manufacturer' as const, year: 2026 };
const fact = (patch: Partial<YeastTechnicalFact> = {}): YeastTechnicalFact => ({
  key: 'attenuation', reported: 'Atténuation >90 %', range: { min: 90, max: 90 }, unit: '%', qualifier: 'atLeast',
  origin: 'manufacturer', source: source.title, sourceUrl: source.reference, context: 'Fermentation bière', ...patch
});

describe('Valeurs documentaires de levure', () => {
  it.each([
    ['>90 %', 'greaterThan'], ['≥90 %', 'atLeast'], ['<90 %', 'lessThan'], ['≤90 %', 'upTo'],
    ['>=90 %', 'atLeast'], ['<=90 %', 'upTo']
  ] as const)('le parseur conserve le sens de %s', (reported, qualifier) => {
    expect(reportedRange(reported, '%')).toMatchObject({ range: { min: 90, max: 90 }, unit: '%', qualifier });
  });

  it('répare en lecture les anciens `>` étiquetés `atLeast`, sans toucher au texte ni aux sources', () => {
    const legacy = fact({ reported: 'Atténuation >90 %', qualifier: 'atLeast' });
    const normalized = readYeastTechnicalFacts([legacy])?.[0];
    expect(normalized).toMatchObject({ qualifier: 'greaterThan', reported: legacy.reported, unit: '%', context: legacy.context,
      source: legacy.source, sourceUrl: legacy.sourceUrl });
    expect(readYeastFactValue(legacy)).toMatchObject({
      value: { kind: 'bound', operator: '>', qualifier: 'greaterThan', value: 90 },
      reported: legacy.reported, unit: '%', context: legacy.context, source: legacy.source, sourceUrl: legacy.sourceUrl
    });
    expect(readYeastFactValue(fact({ reported: 'Atténuation ≥90 %', qualifier: 'greaterThan' })).value)
      .toMatchObject({ kind: 'bound', operator: '≥', qualifier: 'atLeast' });
  });

  it('garde les catégories comme texte et représente une donnée absente explicitement', () => {
    const flocculation: YeastTechnicalFact = { key: 'flocculation', reported: 'High / Fast sedimentation', origin: 'manufacturer',
      source: source.title, sourceUrl: source.reference, context: 'Niveau de sédimentation bière' };
    expect(readYeastFactValue(flocculation)).toMatchObject({ value: { kind: 'category', value: flocculation.reported },
      reported: flocculation.reported, sourceUrl: source.reference });
    expect(readYeastFactValue(undefined)).toEqual({ value: { kind: 'unknown' } });
  });

  it('valide les sélections numériques et catégorielles sans permettre un mauvais rattachement', () => {
    const selectedFlocculation: YeastTechnicalFact = { key: 'flocculation', reported: 'High', origin: 'manufacturer', source: source.title };
    expect(readYeastTechnicalSelections({ attenuation: fact(), flocculation: selectedFlocculation, temperature: null }))
      .toMatchObject({ attenuation: { qualifier: 'greaterThan' }, flocculation: { reported: 'High' }, temperature: null });
    expect(readYeastTechnicalSelections({ temperature: fact() })).toBeUndefined();
    expect(readYeastTechnicalSelections({ temperature: { ...fact({ key: 'temperature', reported: '18–24 %', range: { min: 18, max: 24 }, qualifier: 'range' }), unit: '%' } })).toBeUndefined();
    expect(readYeastTechnicalSelections({ flocculation: fact({ key: 'flocculation' }) })).toBeUndefined();
    expect(readYeastTechnicalFacts([fact({ range: { min: 90, max: 95 } })])).toBeUndefined();
  });

  it('accepte les nouveaux qualificatifs au schéma de catalogue', () => {
    expect(() => assertYeastCatalogue({
      manufacturer: 'Brasserie témoin', productId: 'culture-1', productCode: null, aliases: [], categories: [], status: 'listed',
      facts: [
        { key: 'attenuation', label: 'Atténuation', reported: '>90 %', source, range: { min: 90, max: 90 }, unit: '%', qualifier: 'greaterThan' },
        { key: 'flocculation', label: 'Floculation', reported: 'High', source }
      ], documents: [], retrievals: [{ url: source.reference, retrievedAt: '2026-09-20T00:00:00.000Z', sha256: 'a'.repeat(64), etag: null, lastModified: null }],
      publishedAt: null, pageUpdatedAt: null, parserVersion: 'test', contentSha256: 'b'.repeat(64), gaps: []
    })).not.toThrow();
  });

  it('ne transforme pas `>90 %` en point, moyenne ou score de floculation', () => {
    const attenuation = fact();
    const flocculation: YeastTechnicalFact = { key: 'flocculation', reported: 'High', origin: 'manufacturer', source: source.title, sourceUrl: source.reference };
    const cleaned = sanitizeFacts({ found: true, name: 'Saison témoin', source: source.title, attenuationPct: 90,
      technicalFacts: [attenuation, flocculation] });
    expect(cleaned.attenuationPct).toBeUndefined();
    expect(cleaned.flocculation).toBe('High');
    expect(readYeastFactValue(cleaned.technicalFacts?.find(item => item.key === 'flocculation')).value)
      .toEqual({ kind: 'category', value: 'High' });
  });

  it('applique une borne stricte et une catégorie explicitement retenues, puis rend un conflit catégoriel inconnu', () => {
    const input: IngredientFacts = { found: true, name: 'Saison témoin', source: source.title, technicalFacts: [
      fact({ reported: 'Atténuation >90 %', qualifier: 'greaterThan' }),
      { key: 'flocculation', reported: 'High', origin: 'manufacturer', source: source.title, sourceUrl: source.reference }
    ] };
    const accepted = applyReviewedYeastFacts({ name: 'Saison témoin' }, input, [], {});
    expect(accepted.technicalSelections).toMatchObject({
      attenuation: { qualifier: 'greaterThan', reported: 'Atténuation >90 %' },
      flocculation: { key: 'flocculation', reported: 'High', sourceUrl: source.reference }
    });
    expect(accepted.attenuationPct).toBeUndefined();
    expect(resolveYeastDossier(accepted).documentedAttenuation?.qualifier).toBe('greaterThan');
    expect(resolveYeastDossier(accepted).flocculation.value).toEqual({ kind: 'category', value: 'High' });

    const conflicting: IngredientFacts = { ...input, technicalFacts: [
      input.technicalFacts![1], { key: 'flocculation', reported: 'Low', origin: 'manufacturer', source: 'Autre fiche', sourceUrl: 'https://example.org/other' }
    ] };
    const unresolved = applyReviewedYeastFacts({ name: 'Saison témoin' }, conflicting, [], {});
    expect(unresolved.technicalSelections?.flocculation).toBeNull();
    expect(resolveYeastDossier(unresolved).flocculation.value).toEqual({ kind: 'unknown' });
  });

  it('bloque le repli scalaire documentaire après sélection inconnue mais garde une hypothèse explicite', () => {
    const yeast = { name: 'Culture témoin', attenuationPct: 80, attenuationBasis: 'declared' as const,
      fermTempMinC: 18, fermTempMaxC: 24, flocculation: 'High',
      technicalSelections: { attenuation: null, temperature: null, flocculation: null } };
    const dossier = resolveYeastDossier(yeast);
    expect(dossier.documentedAttenuation).toBeUndefined();
    expect(dossier.attenuation).toBeUndefined();
    expect(dossier.temperature).toBeUndefined();
    expect(dossier.flocculation.value).toEqual({ kind: 'unknown' });
    expect(resolveYeastDossier({ ...yeast, attenuationBasis: 'recipe' }).attenuation)
      .toMatchObject({ qualifier: 'reportedPoint', range: { min: 80, max: 80 }, basis: 'recipe' });
  });

  it('conserve au transfert texte, borne stricte et sélection de floculation', () => {
    const recipe = structuredClone(fullRecipe);
    recipe.yeast = {
      ...recipe.yeast,
      technicalFacts: [fact(), { key: 'flocculation', reported: 'High / Fast sedimentation', origin: 'manufacturer', source: source.title, sourceUrl: source.reference }],
      technicalSelections: { attenuation: fact(), flocculation: { key: 'flocculation', reported: 'High / Fast sedimentation', origin: 'manufacturer', source: source.title, sourceUrl: source.reference } }
    };
    const restored = readRecipeText(writeRecipeText(recipe));
    expect(restored?.yeast).toMatchObject({
      technicalFacts: [
        expect.objectContaining({ qualifier: 'greaterThan', reported: 'Atténuation >90 %', sourceUrl: source.reference }),
        expect.objectContaining({ key: 'flocculation', reported: 'High / Fast sedimentation', sourceUrl: source.reference })
      ],
      technicalSelections: {
        attenuation: expect.objectContaining({ qualifier: 'greaterThan', reported: 'Atténuation >90 %' }),
        flocculation: expect.objectContaining({ reported: 'High / Fast sedimentation', sourceUrl: source.reference })
      }
    });
  });

  it('isole une note issue de cette réponse, conserve sa source et laisse les notes historiques hors book', () => {
    const raw: IngredientFacts = { found: true, name: 'Culture A', source: 'Réponse A', sourceUrl: 'https://example.org/a',
      retrievedAt: '2026-09-26', note: 'Identité à confirmer selon le lot.', technicalFacts: [] };
    const adapted = adaptYeastLookupResult(raw);
    expect(adapted.note).toBeUndefined();
    expect(adapted.documentaryNotes).toEqual([{ text: raw.note, origin: 'ai', source: raw.source, sourceUrl: raw.sourceUrl, retrievedAt: raw.retrievedAt }]);
    expect(adapted.technicalFacts).toEqual([]);

    const oldNote: YeastDocumentaryNote = { text: 'Note A déjà acceptée', origin: 'manufacturer', source: 'Fiche antérieure', sourceUrl: 'https://example.org/old' };
    const lotNotes: YeastSpec = { name: 'Culture A', hopIndexId: 'culture-a', notes: 'Note du brassin', technicalSource: 'Source technique ancienne', documentaryNotes: [oldNote] };
    const added = applyReviewedYeastFacts(lotNotes, adapted, [], {}, {}, 'add');
    expect(added.notes).toBe('Note du brassin');
    expect(added.technicalSource).toBe('Source technique ancienne');
    expect(added.documentaryNotes).toEqual([oldNote, ...adapted.documentaryNotes!]);
    expect(decideYeastDocumentaryNotes(lotNotes.documentaryNotes, adapted.documentaryNotes, 'keep').value).toEqual([oldNote]);
    const replaced = decideYeastDocumentaryNotes([oldNote], adapted.documentaryNotes, { action: 'replace', target: oldNote });
    expect(replaced).toEqual({ value: adapted.documentaryNotes });
    expect(decideYeastDocumentaryNotes([], adapted.documentaryNotes, { action: 'replace', target: oldNote }).error).toContain('a changé');
    expect(editYeastDocumentaryNote(adapted.documentaryNotes![0], 'Note retouchée par le brasseur.'))
      .toEqual({ ...adapted.documentaryNotes![0], text: 'Note retouchée par le brasseur.', origin: 'personal' });
    expect(readYeastDocumentaryNotes(undefined)).toBeUndefined();
    expect(readYeastDocumentaryNotes(null)).toBeNull();
    expect(readYeastDocumentaryNotes([])).toEqual([]);

    const stock = factsFromStock({ id: 's-a', ref: 's-a', name: 'Culture A', category: 'Levure', unit: 'g', currentStock: 0,
      minStock: 0, reorder: false, yeastNotes: raw.note, technicalSource: raw.source } as StockItem);
    expect(stock.note).toBe(raw.note);
    expect(stock.documentaryNotes).toBeUndefined();
  });
});
