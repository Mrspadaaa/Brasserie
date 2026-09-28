// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { acceptYeastCandidateSheet, extractYeastCandidateSheet, mergeYeastCandidateSheet, readRecipeDraft, serializeRecipeDraft, tryAcceptYeastCandidateSheet, yeastCandidateSheetRevision, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';
import type { YeastDocumentaryNote, YeastDocumentaryNotes, YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import type { YeastLocalDocumentary } from '../../functions/src/yeastDocumentarySheet';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';

const storageKey = 'unit-yeast-candidate-sheets';
afterEach(() => localStorage.removeItem(`laffinee_recipe_draft_v1:${storageKey}`));

const baseDraft = (): RecipeWizardDraft => ({
  recipe: structuredClone(fullRecipe), details: {}, step: 'levure', water: {} as never,
  volumesEdited: false, waterProfileAuto: false, targetBasis: 'recipe', mashRatioOverride: null
});
const fact = (reported: string, sourceUrl: string): YeastTechnicalFact => ({
  key: 'flocculation', reported, origin: 'manufacturer', source: `Fiche ${sourceUrl}`, sourceUrl, context: 'Beer'
});

describe('Fiches documentaires de candidats dans le brouillon local', () => {
  it('conserve les scalar documentaires IA et faits riches, sans transformer l’essai en fiche', () => {
    const yeast = {
      hopIndexId: 'culture-a', name: 'Nom canonique A', lab: 'Laboratoire A', strain: 'A-1', form: 'sèche' as const,
      attenuationPct: 90, attenuationBasis: 'declared' as const, fermTempMinC: 18, fermTempMaxC: 24,
      flocculation: 'High', alcoholTolerancePct: 11, fermentDays: 7, technicalSource: 'Source originale A', notes: 'Note du brassin',
      qty: 125, unit: 'mL', pitchTempC: 17,
      technicalFacts: [fact('High / Fast sedimentation', 'https://example.org/a')],
      technicalSelections: { flocculation: fact('High / Fast sedimentation', 'https://example.org/a') }
    };
    const sheet = extractYeastCandidateSheet(yeast)!;
    expect(sheet).toMatchObject({
      hopIndexId: 'culture-a', technicalFacts: yeast.technicalFacts, technicalSelections: yeast.technicalSelections,
      documentary: { lab: 'Laboratoire A', strain: 'A-1', form: 'sèche', declaredAttenuationPct: 90,
        fermTempMinC: 18, fermTempMaxC: 24, flocculation: 'High', alcoholTolerancePct: 11, fermentDays: 7, technicalSource: 'Source originale A' }
    });
    expect(JSON.stringify(sheet)).not.toMatch(/125|stock-42|pitchTempC|"unit"|"attenuationBasis"/);
    expect(sheet).not.toHaveProperty('notes');
    expect(extractYeastCandidateSheet({ ...yeast, stockItemRef: 'stock-42' })).toBeUndefined();
    const localDocumentary: YeastLocalDocumentary = { version: 1, documentary: { declaredAttenuationPct: 90, technicalSource: 'Source du lot' } };
    expect(extractYeastCandidateSheet({ ...yeast, localDocumentary })).toBeUndefined();

    let persisted = acceptYeastCandidateSheet(baseDraft(), sheet, 0)!;
    writeRecipeDraft(storageKey, serializeRecipeDraft(persisted));
    persisted = readRecipeDraft(storageKey)!;
    expect(persisted.candidateSheets?.['culture-a'].documentary).toEqual(sheet.documentary);
    expect(persisted.candidateSheets?.['culture-a'].technicalFacts[0].sourceUrl).toBe('https://example.org/a');
    localStorage.removeItem(`laffinee_recipe_draft_v1:${storageKey}`);

    const hypothesis = extractYeastCandidateSheet({ ...yeast, attenuationPct: 73, attenuationBasis: 'recipe' })!;
    expect(hypothesis.documentary?.declaredAttenuationPct).toBeUndefined();

    const oldScalars = extractYeastCandidateSheet({ hopIndexId: 'legacy-a', lab: 'Laboratoire historique', strain: 'L-1',
      form: 'liquide', attenuationPct: 78, attenuationBasis: 'declared', fermTempMinC: 16, fermTempMaxC: 22,
      flocculation: 'Moyenne', alcoholTolerancePct: 10, fermentDays: 5, technicalSource: 'URL ou texte conservé tel quel', technicalFacts: [] })!;
    expect(oldScalars).toMatchObject({ technicalFacts: [], documentary: {
      lab: 'Laboratoire historique', strain: 'L-1', form: 'liquide', declaredAttenuationPct: 78,
      fermTempMinC: 16, fermTempMaxC: 22, flocculation: 'Moyenne', alcoholTolerancePct: 10,
      fermentDays: 5, technicalSource: 'URL ou texte conservé tel quel'
    } });
    const legacyOutOfNewLimit = extractYeastCandidateSheet({ hopIndexId: 'legacy-limit', attenuationBasis: 'declared',
      alcoholTolerancePct: 55, fermentDays: 800, technicalFacts: [] })!;
    expect(legacyOutOfNewLimit.documentary).toMatchObject({ alcoholTolerancePct: 55, fermentDays: 800 });
    const explicitZero = extractYeastCandidateSheet({ hopIndexId: 'explicit-zero', fermentDays: 0, alcoholTolerancePct: 0, technicalFacts: [] })!;
    const absent = extractYeastCandidateSheet({ hopIndexId: 'absent-scalars', technicalFacts: [] })!;
    expect(explicitZero.documentary).toMatchObject({ fermentDays: 0, alcoholTolerancePct: 0 });
    expect(absent.documentary).toBeUndefined();
    const cleared = acceptYeastCandidateSheet(baseDraft(), { hopIndexId: 'explicit-null', technicalFacts: [],
      documentary: { fermentDays: null, alcoholTolerancePct: null } }, 0)!;
    expect(cleared.candidateSheets?.['explicit-null'].documentary).toEqual({ fermentDays: null, alcoholTolerancePct: null });
    const nulled = mergeYeastCandidateSheet({ hopIndexId: 'explicit-null', name: 'Candidat', fermentDays: 8, alcoholTolerancePct: 55 },
      cleared.candidateSheets!['explicit-null'])!;
    expect(nulled.fermentDays).toBeUndefined();
    expect(nulled.alcoholTolerancePct).toBeUndefined();
    const noSource = extractYeastCandidateSheet({ hopIndexId: 'legacy-no-source', flocculation: 'Low', technicalFacts: [] })!;
    expect(noSource.documentary).toEqual({ flocculation: 'Low' });
  });

  it('hydrate une fiche sur le candidat canonique sans écraser l’hypothèse recipe/measured de la recette', () => {
    const sheet = { hopIndexId: 'culture-a', revision: 3, technicalFacts: [fact('High', 'https://example.org/a')],
      technicalSelections: { attenuation: null, flocculation: fact('High', 'https://example.org/a') },
      documentary: { lab: 'Laboratoire A', strain: 'A-1', form: 'sèche' as const, declaredAttenuationPct: 90,
        fermTempMinC: 18, fermTempMaxC: 24, flocculation: 'High', alcoholTolerancePct: 11, fermentDays: 7, technicalSource: 'Source originale A' } };
    const explicitRecipe = { hopIndexId: 'culture-a', name: 'Nom canonique A', attenuationPct: 74, attenuationBasis: 'recipe' as const,
      qty: 125, unit: 'mL', stockItemRef: 'stock-a', pitchTempC: 17, lab: 'Catalogue A', technicalSource: 'source catalogue A' };
    const hydrated = mergeYeastCandidateSheet(explicitRecipe, sheet)!;
    expect(hydrated).toMatchObject({ hopIndexId: 'culture-a', name: 'Nom canonique A', attenuationPct: 74, attenuationBasis: 'recipe',
      technicalSelections: { attenuation: null, flocculation: { reported: 'High' } }, lab: 'Laboratoire A', strain: 'A-1', form: 'sèche',
      fermTempMinC: 18, fermTempMaxC: 24, flocculation: 'High', alcoholTolerancePct: 11, fermentDays: 7,
      technicalSource: 'Source originale A', qty: 125, unit: 'mL', stockItemRef: 'stock-a', pitchTempC: 17 });
    const localDocumentary: YeastLocalDocumentary = { version: 1, documentary: { declaredAttenuationPct: 78, technicalSource: 'Source du lot' } };
    expect(mergeYeastCandidateSheet({ ...explicitRecipe, localDocumentary }, sheet)).toBeUndefined();
    expect(mergeYeastCandidateSheet({ ...explicitRecipe, hopIndexId: 'culture-b' }, sheet)).toBeUndefined();

    const declaredBase = { ...explicitRecipe, attenuationPct: 50, attenuationBasis: 'declared' as const };
    const declared = mergeYeastCandidateSheet(declaredBase, { ...sheet, technicalSelections: { flocculation: fact('High', 'https://example.org/a') } })!;
    expect(declared).toMatchObject({ attenuationPct: 90, attenuationBasis: 'declared' });
  });

  it('garde un inconnu documentaire après effacement, sauvegarde, réouverture et hydration', () => {
    const temperature: YeastTechnicalFact = { key: 'temperature', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C',
      qualifier: 'range', origin: 'manufacturer', source: 'Fiche A', sourceUrl: 'https://example.org/a' };
    const flocculation = fact('High', 'https://example.org/a');
    let draft = acceptYeastCandidateSheet(baseDraft(), {
      hopIndexId: 'culture-a', technicalFacts: [temperature, flocculation],
      technicalSelections: { temperature: null, flocculation: null },
      documentary: { form: null, flocculation: null, fermTempMinC: null, fermTempMaxC: null }
    }, 0)!;
    writeRecipeDraft(storageKey, serializeRecipeDraft(draft));
    draft = readRecipeDraft(storageKey)!;
    const reopenedSheet = draft.candidateSheets?.['culture-a']!;
    const hydrated = mergeYeastCandidateSheet({ hopIndexId: 'culture-a', name: 'Nom canonique A', form: 'sèche', flocculation: 'High',
      fermTempMinC: 18, fermTempMaxC: 24 }, reopenedSheet)!;
    expect(reopenedSheet.documentary).toMatchObject({ form: null, flocculation: null, fermTempMinC: null, fermTempMaxC: null });
    expect(hydrated.form).toBeUndefined();
    expect(hydrated.flocculation).toBeUndefined();
    expect(hydrated.fermTempMinC).toBeUndefined();
    expect(hydrated.fermTempMaxC).toBeUndefined();
    const dossier = resolveYeastDossier(hydrated);
    expect(dossier.temperature).toBeUndefined();
    expect(dossier.flocculation.value).toEqual({ kind: 'unknown' });
  });

  it('préserve absence, inconnu explicite, effacement et note dans le book candidate', () => {
    const note: YeastDocumentaryNote = { text: 'Note candidat', origin: 'ai', source: 'Fiche A', sourceUrl: 'https://example.org/a' };
    const states: Array<YeastDocumentaryNotes | undefined> = [undefined, null, [], [note]];
    states.forEach((documentaryNotes, index) => {
      const hopIndexId = `candidate-note-${index}`;
      const update = { hopIndexId, technicalFacts: [], ...(documentaryNotes === undefined ? {} : { documentaryNotes }) };
      const accepted = acceptYeastCandidateSheet(baseDraft(), update, 0)!;
      writeRecipeDraft(storageKey, serializeRecipeDraft(accepted));
      const reopened = readRecipeDraft(storageKey)!.candidateSheets![hopIndexId];
      if (documentaryNotes === undefined) expect(Object.prototype.hasOwnProperty.call(reopened, 'documentaryNotes')).toBe(false);
      else expect(reopened.documentaryNotes).toEqual(documentaryNotes);
      localStorage.removeItem(`laffinee_recipe_draft_v1:${storageKey}`);
    });
  });

  it('isole A et B par hopIndexId, refuse une réponse obsolète, puis rouvre les deux fiches hors ligne', () => {
    const noteA: YeastDocumentaryNote = { text: 'Identité de lot à confirmer.', origin: 'ai', source: 'Fiche A', sourceUrl: 'https://example.org/a' };
    const noteB: YeastDocumentaryNote = { text: 'Identité de lot à confirmer.', origin: 'ai', source: 'Fiche B', sourceUrl: 'https://example.org/b' };
    const a = extractYeastCandidateSheet({ hopIndexId: 'culture-a', technicalFacts: [fact('High', 'https://example.org/a')],
      documentaryNotes: [noteA], technicalSelections: { flocculation: fact('High', 'https://example.org/a') }, lab: 'Labo A', technicalSource: 'Fiche A' })!;
    const b = extractYeastCandidateSheet({ hopIndexId: 'culture-b', technicalFacts: [fact('Low', 'https://example.org/b')],
      documentaryNotes: [noteB], technicalSelections: { flocculation: fact('Low', 'https://example.org/b') }, lab: 'Labo B', technicalSource: 'Fiche B' })!;
    let draft = baseDraft();
    draft = acceptYeastCandidateSheet(draft, a, 0)!;
    expect(yeastCandidateSheetRevision(draft, 'culture-a')).toBe(1);
    draft = acceptYeastCandidateSheet(draft, b, 0)!;
    expect(draft.candidateSheets?.['culture-a'].technicalFacts[0].reported).toBe('High');
    expect(draft.candidateSheets?.['culture-b'].technicalFacts[0].reported).toBe('Low');
    expect(draft.candidateSheets?.['culture-a'].documentaryNotes).toEqual([noteA]);
    expect(draft.candidateSheets?.['culture-b'].documentaryNotes).toEqual([noteB]);

    const revisedA = { ...a,
      documentaryNotes: [{ ...noteA, text: 'Nouvelle formulation acceptée.', source: 'Réponse récente A', sourceUrl: 'https://example.org/a-v2' }] };
    draft = acceptYeastCandidateSheet(draft, revisedA, 1)!;
    expect(acceptYeastCandidateSheet(draft, a, 1)).toBeUndefined();
    expect(yeastCandidateSheetRevision(draft, 'culture-a')).toBe(2);
    expect(yeastCandidateSheetRevision(draft, 'culture-b')).toBe(1);

    writeRecipeDraft(storageKey, serializeRecipeDraft(draft));
    const reopened = readRecipeDraft(storageKey)!;
    expect(reopened.candidateSheets).toEqual(draft.candidateSheets);
    expect(reopened.candidateSheets?.['culture-a'].technicalFacts[0]).toMatchObject({
      reported: 'High', sourceUrl: 'https://example.org/a'
    });
    expect(reopened.candidateSheets?.['culture-a'].documentaryNotes).toEqual(revisedA.documentaryNotes);
    expect(reopened.candidateSheets?.['culture-b'].technicalFacts[0].reported).toBe('Low');
    expect(reopened.candidateSheets?.['culture-b'].documentaryNotes).toEqual([noteB]);
    expect(mergeYeastCandidateSheet({ hopIndexId: 'culture-a', name: 'Nom canonique A' }, reopened.candidateSheets!['culture-a'])?.documentaryNotes)
      .toEqual(revisedA.documentaryNotes);
  });

  it('rejette les propriétés de recette ou de stock dans une fiche candidate', () => {
    const draft = baseDraft();
    const invalid = tryAcceptYeastCandidateSheet(draft, {
      hopIndexId: 'culture-a', technicalFacts: [], documentary: { declaredAttenuationPct: 80 },
      qty: 125
    } as never, 0);
    expect(invalid).toMatchObject({ accepted: false, reason: 'invalid', message: expect.stringContaining('unités') });
    expect(acceptYeastCandidateSheet(draft, {
      hopIndexId: 'culture-a', technicalFacts: [], documentary: { declaredAttenuationPct: 80 }, qty: 125
    } as never, 0)).toBeUndefined();
    expect(acceptYeastCandidateSheet(draft, {
      hopIndexId: 'culture-a', technicalFacts: [], documentary: { declaredAttenuationPct: 80, qty: 125 } as never
    }, 0)).toBeUndefined();
    expect(tryAcceptYeastCandidateSheet(draft, { hopIndexId: 'culture-a', technicalFacts: [] }, 2))
      .toMatchObject({ accepted: false, reason: 'revision', message: expect.stringContaining('réponse correspondante') });
    expect(tryAcceptYeastCandidateSheet(draft, { hopIndexId: ' ', technicalFacts: [] }, 0))
      .toMatchObject({ accepted: false, reason: 'identity', message: expect.stringContaining('Identité de souche') });
  });

  it('récupère le brouillon recette si seule la map candidate est corrompue, avec un message exploitable non resauvegardé', () => {
    const draft = baseDraft();
    localStorage.setItem(`laffinee_recipe_draft_v1:${storageKey}`, JSON.stringify({ version: 1, draft: {
      ...draft, candidateSheets: { 'culture-a': { hopIndexId: 'culture-b', revision: 1, technicalFacts: [] } }
    } }));
    const restored = readRecipeDraft(storageKey)!;
    expect(restored.recipe).toEqual(draft.recipe);
    expect(restored.step).toBe('levure');
    expect(restored.candidateSheets).toBeUndefined();
    expect(restored.candidateSheetsReadWarning).toContain('La recette et les autres étapes sont conservées');
    expect(JSON.parse(serializeRecipeDraft(restored)).draft.candidateSheetsReadWarning).toBeUndefined();
  });
});
