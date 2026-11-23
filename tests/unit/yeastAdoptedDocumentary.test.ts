import { describe, expect, it } from 'vitest';
import type { YeastDocumentarySheet, YeastLocalDocumentary } from '../../functions/src/yeastDocumentarySheet';
import { readYeastDocumentarySheet, readYeastLocalDocumentary } from '../../functions/src/yeastDocumentarySheet';
import { applyYeastRecipeDesign, classifyYeastRecipeDesignChange, completeYeastRecipeDesignApplication, evaluateYeastRecipeDesign,
  createYeastRecipeDraft, readYeastRecipeDesign, withTrialYeast, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { adoptYeastDocumentary, extractYeastCandidateSheet, readYeastDocumentaryView, tryAdoptYeastDocumentary } from '../../src/services/recipeDraft';
import type { Recipe, YeastSpec } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

const refs = yeastReferences([]);
const reference = (hopIndexId: string) => refs.find(candidate => candidate.id === hopIndexId)!;
const recipe = (hopIndexId = 'fermentis-us05', changes: Partial<Recipe> = {}): Recipe => {
  const candidate = reference(hopIndexId);
  return {
    ...structuredClone(fullRecipe),
    style: 'Recette libre',
    volumeL: 20,
    yeast: { name: candidate.name, hopIndexId, form: candidate.form, qty: 10, unit: 'g' },
    fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 8 }],
    hops: [],
    ...changes,
  };
};

const documentarySheet = (hopIndexId: string): YeastDocumentarySheet => ({
  version: 1,
  hopIndexId,
  documentary: { declaredAttenuationPct: 78, technicalSource: 'DOC78_SOURCE_SENTINEL', fermentDays: 0 },
  technicalFacts: [],
  technicalSelections: { attenuation: null, flocculation: null },
  documentaryNotes: [],
  fermentationFacts: {
    version: 1,
    strainName: reference(hopIndexId).name,
    source: reference(hopIndexId).source,
    retrievedAt: '2026-09-27',
    conditions: 'Valeurs de fiche conservées, sans hypothèse de lot.',
    sugars: {}, pof: 'unknown', hydrolysis: 'unknown', durationDays: { min: 0, max: 0 },
  },
});
const localDocumentary = (): YeastLocalDocumentary => ({
  version: 1,
  documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA', fermentDays: 0 },
  technicalFacts: [],
  technicalSelections: { flocculation: null },
  documentaryNotes: [],
  fermentationFacts: {
    version: 1,
    strainName: 'Culture libre QA',
    source: reference('fermentis-us05').source,
    retrievedAt: '2026-09-27',
    conditions: 'Portée locale à l’ingrédient, sans identité catalogue.',
    sugars: {}, pof: 'unknown', hydrolysis: 'unknown', durationDays: { min: 0, max: 0 },
  },
});
const freeRecipe = (yeastChanges: Partial<YeastSpec> = {}): Recipe => {
  const base = recipe('fermentis-us05');
  return { ...base, style: 'Recette libre', yeast: {
    ...base.yeast, name: 'SafAle US-05', hopIndexId: undefined, stockItemRef: 'stock-local-qa', ...yeastChanges,
  } };
};

describe('fiche documentaire adoptée de la levure', () => {
  it('capture le scalaire déclaré et sa source avant l’action explicite qui remplace l’hypothèse par 73 %', () => {
    const legacy = recipe('fermentis-us05', { yeast: { ...recipe().yeast,
      attenuationPct: 78, attenuationBasis: 'declared', technicalSource: 'DOC78_SOURCE_SENTINEL' } });
    const untouched = structuredClone(legacy);
    expect(createYeastRecipeDraft(legacy, refs)).toMatchObject({ attenuationPct: 78, attenuationBasis: 'declared' });
    expect(legacy).toEqual(untouched);
    expect(legacy.yeast.adoptedDocumentary).toBeUndefined();
    const hypothesis: YeastSpec = { ...legacy.yeast, attenuationPct: 73, attenuationBasis: 'recipe' };
    const adopted = adoptYeastDocumentary(legacy.yeast, hypothesis);
    expect(adopted).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });
    expect(adopted.adoptedDocumentary).toMatchObject({
      version: 1,
      hopIndexId: 'fermentis-us05',
      documentary: { declaredAttenuationPct: 78, technicalSource: 'DOC78_SOURCE_SENTINEL' },
    });
    expect(adopted.adoptedDocumentary?.documentary).not.toHaveProperty('origin');
    expect(adopted.adoptedDocumentary?.documentary).not.toHaveProperty('qualifier');
    expect(adopted.adoptedDocumentary?.documentary).not.toHaveProperty('sourceUrl');

    const explicit = { ...legacy, yeast: adopted };
    const draft = { ...createYeastRecipeDraft(explicit, refs), attenuationPct: 73, attenuationBasis: 'recipe' as const };
    const saved = applyYeastRecipeDesign(explicit, draft, refs);
    const snapshot = readYeastRecipeDesign(saved)!;
    expect(saved.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });
    expect(snapshot.applied.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe',
      adoptedDocumentary: adopted.adoptedDocumentary });
    expect(snapshot.applied.yeast.adoptedDocumentary?.documentary).toMatchObject({
      declaredAttenuationPct: 78, technicalSource: 'DOC78_SOURCE_SENTINEL',
    });
    expect(yeastRecipeDesignChanged(saved, snapshot)).toBe(false);

    const ambiguousLegacy = recipe('fermentis-us05', { yeast: { ...recipe().yeast, attenuationPct: 78,
      technicalSource: 'LEGACY_SOURCE_WITHOUT_BASIS' } });
    const ambiguousAccepted = adoptYeastDocumentary(ambiguousLegacy.yeast,
      { ...ambiguousLegacy.yeast, attenuationPct: 73, attenuationBasis: 'recipe' });
    expect(ambiguousAccepted.adoptedDocumentary?.documentary).not.toHaveProperty('declaredAttenuationPct');
  });

  it('préserve les absences, null, listes vides et durée zéro comme des états distincts', () => {
    const sheet = documentarySheet('fermentis-us05');
    const read = readYeastDocumentarySheet(sheet, 'fermentis-us05');
    expect(read).toEqual(sheet);
    expect(read?.documentary?.declaredAttenuationPct).toBe(78);
    expect(read?.documentary?.technicalSource).toBe('DOC78_SOURCE_SENTINEL');
    expect(read?.documentary?.fermentDays).toBe(0);
    expect(read?.technicalFacts).toEqual([]);
    expect(read?.technicalSelections).toEqual({ attenuation: null, flocculation: null });
    expect(read?.documentaryNotes).toEqual([]);
    expect(read?.fermentationFacts?.durationDays).toEqual({ min: 0, max: 0 });

    const unknownNotes: YeastDocumentarySheet = { version: 1, hopIndexId: 'fermentis-us05',
      documentary: { declaredAttenuationPct: null, technicalSource: null }, documentaryNotes: null };
    expect(readYeastDocumentarySheet(unknownNotes)).toEqual(unknownNotes);
    expect(readYeastDocumentarySheet(unknownNotes)).toHaveProperty('documentaryNotes', null);
    expect(readYeastDocumentarySheet({ version: 1, hopIndexId: 'fermentis-us05' })).toEqual({ version: 1, hopIndexId: 'fermentis-us05' });
    const durationUnknown = { ...sheet, fermentationFacts: { ...sheet.fermentationFacts!, durationDays: undefined } };
    expect(readYeastDocumentarySheet(durationUnknown)).not.toHaveProperty('fermentationFacts.durationDays');
    expect(readYeastDocumentarySheet(sheet, 'wyeast-3068')).toBeUndefined();
    expect(readYeastDocumentarySheet({ ...sheet, version: 2 }, 'fermentis-us05')).toBeUndefined();
  });

  it('conserve l’enveloppe explicite à identité constante dans la recette et son snapshot appliqué', () => {
    const sheet = documentarySheet('fermentis-us05');
    const original = recipe('fermentis-us05', { yeast: { ...recipe().yeast, attenuationPct: 73, attenuationBasis: 'recipe', adoptedDocumentary: sheet } });
    const applied = applyYeastRecipeDesign(original, createYeastRecipeDraft(original, refs), refs);
    const snapshot = readYeastRecipeDesign(applied);

    expect(applied.yeast.adoptedDocumentary).toEqual(sheet);
    expect(applied.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });
    expect(snapshot?.applied.yeast.adoptedDocumentary).toEqual(sheet);
    expect(snapshot?.applied.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });
    expect(yeastRecipeDesignChanged(applied, snapshot!)).toBe(false);

    const completed = completeYeastRecipeDesignApplication(applied, { ...applied.yeast, technicalFacts: [] });
    expect(completed.yeast.adoptedDocumentary).toEqual(sheet);
    expect(readYeastRecipeDesign(completed)?.applied.yeast.adoptedDocumentary).toEqual(sheet);
  });

  it('actualise le snapshot avec une fiche seulement lorsqu’une action explicite fournit la YeastSpec adoptée', () => {
    const original = recipe('fermentis-us05');
    const saved = applyYeastRecipeDesign(original, createYeastRecipeDraft(original, refs), refs);
    const before = readYeastRecipeDesign(saved)!;
    expect(saved.yeast.adoptedDocumentary).toBeUndefined();
    expect(before.applied.yeast.adoptedDocumentary).toBeUndefined();

    const sheet = documentarySheet('fermentis-us05');
    const accepted = completeYeastRecipeDesignApplication(saved, { ...saved.yeast, adoptedDocumentary: sheet });
    expect(accepted.yeast.adoptedDocumentary).toEqual(sheet);
    expect(readYeastRecipeDesign(accepted)?.applied.yeast.adoptedDocumentary).toEqual(sheet);
    expect(yeastRecipeDesignChanged(accepted, readYeastRecipeDesign(accepted)!)).toBe(false);
  });

  it('compare strictement l’enveloppe sans rebaser le snapshot et classe son seul changement comme documentaire', () => {
    const sheet = documentarySheet('fermentis-us05');
    const original = recipe('fermentis-us05', { yeast: { ...recipe().yeast, attenuationPct: 73, attenuationBasis: 'recipe', adoptedDocumentary: sheet } });
    const saved = applyYeastRecipeDesign(original, createYeastRecipeDraft(original, refs), refs);
    const baseline = readYeastRecipeDesign(saved)!;
    const updatedSheet = { ...sheet, documentaryNotes: [{ text: 'Note ajoutée par action explicite.', origin: 'manufacturer' as const }] };
    const documentationChanged = { ...saved, yeast: { ...saved.yeast, adoptedDocumentary: updatedSheet } };

    expect(yeastRecipeDesignChanged(documentationChanged, baseline)).toBe(true);
    expect(classifyYeastRecipeDesignChange(documentationChanged, baseline)).toBe('documentary');
    expect(baseline.applied.yeast.adoptedDocumentary).toEqual(sheet);
    expect(classifyYeastRecipeDesignChange({ ...documentationChanged, yeast: { ...documentationChanged.yeast, attenuationPct: 72 } }, baseline)).toBe('settings');
  });

  it('refuse une enveloppe d’autre identité et ne la transfère pas en changeant de souche', () => {
    const base = recipe('wyeast-3068', { yeast: { ...recipe('wyeast-3068').yeast, adoptedDocumentary: documentarySheet('wyeast-3068'), stockItemRef: 'LOT-3068' } });
    const otherIdentity = { ...base, yeast: { ...base.yeast, adoptedDocumentary: documentarySheet('wyeast-3638') } };
    expect(() => applyYeastRecipeDesign(otherIdentity, createYeastRecipeDraft(otherIdentity, refs), refs)).toThrow(/fiche documentaire ne correspond pas à une portée valide/);
    const replacement = applyYeastRecipeDesign(otherIdentity,
      createYeastRecipeDraft(otherIdentity, refs, undefined, 'fermentis-us05'), refs, 'strain');
    expect(replacement.yeast.hopIndexId).toBe('fermentis-us05');
    expect(replacement.yeast.adoptedDocumentary).toBeUndefined();

    const currentSheet = documentarySheet('wyeast-3068');
    const validBase = { ...base, yeast: { ...base.yeast, adoptedDocumentary: currentSheet } };
    const validSnapshotRecipe = applyYeastRecipeDesign(validBase, createYeastRecipeDraft(validBase, refs), refs);
    const validSnapshot = readYeastRecipeDesign(validSnapshotRecipe)!;
    const invalidCurrent = { ...validSnapshotRecipe, yeast: { ...validSnapshotRecipe.yeast, adoptedDocumentary: documentarySheet('wyeast-3638') } };
    expect(classifyYeastRecipeDesignChange(invalidCurrent, validSnapshot)).toBe('settings');
    const draft = createYeastRecipeDraft(validBase, refs, undefined, 'fermentis-us05');
    const changed = applyYeastRecipeDesign(validBase, draft, refs, 'strain');
    expect(changed.yeast.hopIndexId).toBe('fermentis-us05');
    expect(changed.yeast.adoptedDocumentary).toBeUndefined();
    expect(changed.yeast.qty).toBeUndefined();
    expect(changed.yeast.stockItemRef).toBeUndefined();
  });

  it('ne crée pas de fiche depuis le trial/IA en preview et garde seulement la fiche déjà adoptée sur la recette', () => {
    const candidateSheet = documentarySheet('fermentis-us05');
    const personalSheet = { ...candidateSheet, documentaryNotes: [{ text: 'Déjà adoptée sur la recette.', origin: 'personal' as const }] };
    const current = recipe('fermentis-us05', { yeast: { ...recipe().yeast, adoptedDocumentary: personalSheet } });
    const aiFact = { key: 'attenuation' as const, reported: '73 %', range: { min: 73, max: 73 }, unit: '%', qualifier: 'reportedPoint' as const, origin: 'ai' as const };
    const trial: YeastSpec = { ...current.yeast, adoptedDocumentary: candidateSheet, technicalFacts: [aiFact] };
    const preview = withTrialYeast(current, trial);
    expect(preview.yeast.technicalFacts).toEqual([aiFact]);
    expect(preview.yeast.adoptedDocumentary).toEqual(personalSheet);

    const noAdoption = recipe('fermentis-us05');
    expect(withTrialYeast(noAdoption, trial).yeast.adoptedDocumentary).toBeUndefined();
  });

  it('rejette du snapshot appliqué une enveloppe dont l’identité ne correspond pas', () => {
    const sheet = documentarySheet('fermentis-us05');
    const saved = applyYeastRecipeDesign(recipe('fermentis-us05', { yeast: { ...recipe().yeast, adoptedDocumentary: sheet } }),
      createYeastRecipeDraft(recipe('fermentis-us05', { yeast: { ...recipe().yeast, adoptedDocumentary: sheet } }), refs), refs);
    const baseline = readYeastRecipeDesign(saved)!;
    const mismatched = { ...baseline.applied.yeast, adoptedDocumentary: documentarySheet('wyeast-3638') };
    expect(readYeastRecipeDesign({ ...saved, yeastDesign: { ...baseline, applied: { ...baseline.applied, yeast: mismatched } } })).toBeUndefined();
    expect(readYeastRecipeDesign(saved)).toEqual(baseline);
  });

  it('adopte 78/source comme documentation locale et applique 73 comme hypothèse sans identité catalogue', () => {
    const previous = freeRecipe({ attenuationPct: 78, attenuationBasis: 'declared', technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA' });
    const next: YeastSpec = { ...previous.yeast, attenuationPct: 73, attenuationBasis: 'recipe' };
    const adoption = tryAdoptYeastDocumentary(previous.yeast, next, { intent: 'hypothesis' });
    expect(adoption.accepted).toBe(true);
    if (!adoption.accepted) throw new Error(adoption.message);
    expect(adoption.yeast.hopIndexId).toBeUndefined();
    expect(adoption.yeast.stockItemRef).toBe('stock-local-qa');
    expect(readYeastLocalDocumentary(adoption.yeast.localDocumentary)).toMatchObject({
      documentary: { declaredAttenuationPct: 78, technicalSource: 'SOURCE_HISTORIQUE_LIBRE_QA' },
    });

    const view = readYeastDocumentaryView(adoption.yeast);
    expect(view.status).toBe('valid');
    if (view.status !== 'valid') throw new Error(view.message);
    expect(view.scope).toBe('local');
    expect(view.effectiveYeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });

    const explicit = { ...previous, yeast: adoption.yeast };
    const draft = createYeastRecipeDraft(explicit, refs);
    expect(draft.yeastId).toBe('');
    const saved = applyYeastRecipeDesign(explicit, draft, refs);
    const snapshot = readYeastRecipeDesign(saved)!;
    expect(saved.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe', stockItemRef: 'stock-local-qa' });
    expect(saved.yeast.hopIndexId).toBeUndefined();
    expect(saved.yeast.adoptedDocumentary).toBeUndefined();
    expect(saved.yeast.localDocumentary).toEqual(adoption.yeast.localDocumentary);
    expect(snapshot.applied.yeast.localDocumentary).toEqual(adoption.yeast.localDocumentary);
    expect(yeastRecipeDesignChanged(saved, snapshot)).toBe(false);
    expect(extractYeastCandidateSheet(saved.yeast)).toBeUndefined();
    const localWithCatalogId = { ...saved.yeast, hopIndexId: 'fermentis-us05' };
    expect(extractYeastCandidateSheet(localWithCatalogId)).toBeUndefined();
    const documentaryChanged = { ...saved, yeast: { ...saved.yeast, localDocumentary: {
      ...saved.yeast.localDocumentary!, documentaryNotes: [{ text: 'Ajout local.', origin: 'personal' as const }],
    } } };
    expect(yeastRecipeDesignChanged(documentaryChanged, snapshot)).toBe(true);
    expect(classifyYeastRecipeDesignChange(documentaryChanged, snapshot)).toBe('documentary');
    expect(snapshot.applied.yeast.localDocumentary).toEqual(adoption.yeast.localDocumentary);

    const linked = recipe('fermentis-us05', { yeast: { ...recipe().yeast, stockItemRef: 'stock-local-qa', localDocumentary: localDocumentary() } });
    const changedTrialSheet = { ...localDocumentary(), documentary: { declaredAttenuationPct: 66, technicalSource: 'TRIAL_ONLY' } };
    expect(withTrialYeast(linked, { ...linked.yeast, localDocumentary: changedTrialSheet }).yeast.localDocumentary)
      .toEqual(linked.yeast.localDocumentary);
  });

  it('conserve la feuille au renommage du même owner, mais la remplace sans héritage au changement de stock/choix', () => {
    const capturedLocal = { ...localDocumentary(), documentaryNotes: [{ text: 'Note locale à ne pas transférer.', origin: 'personal' as const }] };
    const original = freeRecipe({ localDocumentary: capturedLocal, attenuationPct: 73, attenuationBasis: 'recipe' });
    const renamed = tryAdoptYeastDocumentary(original.yeast,
      { ...original.yeast, name: 'SafAle US-05 · nom corrigé' }, { intent: 'documentary' });
    expect(renamed.accepted).toBe(true);
    if (!renamed.accepted) throw new Error(renamed.message);
    expect(renamed.yeast.localDocumentary).toEqual(original.yeast.localDocumentary);
    expect(renamed.yeast.stockItemRef).toBe('stock-local-qa');

    const replacement = freeRecipe({ name: 'SafAle US-05', stockItemRef: 'stock-local-other', attenuationPct: 71, attenuationBasis: 'recipe' });
    const selected = tryAdoptYeastDocumentary(renamed.yeast, replacement.yeast, { intent: 'replace-selection' });
    expect(selected.accepted).toBe(true);
    if (!selected.accepted) throw new Error(selected.message);
    const replacementView = readYeastDocumentaryView(selected.yeast);
    expect(selected.yeast.stockItemRef).toBe('stock-local-other');
    expect(replacementView.status).toBe('valid');
    if (replacementView.status !== 'valid') throw new Error(replacementView.message);
    expect(replacementView.scope).toBe('local');
    expect(replacementView.body.documentary?.technicalSource).not.toBe('SOURCE_HISTORIQUE_LIBRE_QA');
    expect(replacementView.body.documentaryNotes ?? []).not.toContainEqual(expect.objectContaining({ text: 'Note locale à ne pas transférer.' }));

    const undo = tryAdoptYeastDocumentary(selected.yeast, renamed.yeast, { intent: 'replace-selection' });
    expect(undo.accepted).toBe(true);
    if (!undo.accepted) throw new Error(undo.message);
    expect(undo.yeast).toEqual(renamed.yeast);
  });

  it('refuse deux portées et garde le preview sans fiche d’un owner libre homonyme', () => {
    const local = freeRecipe({ localDocumentary: localDocumentary() });
    const conflict = { ...local.yeast, adoptedDocumentary: documentarySheet('fermentis-us05') };
    expect(readYeastDocumentaryView(conflict).status).toBe('conflict');
    expect(() => applyYeastRecipeDesign({ ...local, yeast: conflict }, createYeastRecipeDraft({ ...local, yeast: conflict }, refs), refs))
      .toThrow(/fiche documentaire ne correspond pas à une portée valide/);

    const homonymTrial = freeRecipe({ name: 'SafAle US-05', stockItemRef: 'stock-local-other', localDocumentary: localDocumentary() });
    const preview = withTrialYeast(local, homonymTrial.yeast);
    expect(preview).toEqual(local);
    const selected = applyYeastRecipeDesign(local, createYeastRecipeDraft(local, refs, undefined, 'fermentis-us05'), refs, 'strain');
    expect(selected.yeast.hopIndexId).toBe('fermentis-us05');
    expect(selected.yeast.localDocumentary).toBeUndefined();
    expect(selected.yeast.stockItemRef).toBeUndefined();
  });

  it('réapplique le procédé acidifiant depuis le scénario sauvegardé et laisse l’alcool inconnu', () => {
    const personalSour = recipe('fermentis-us05', {
      style: 'Essai libre',
      styleRef: { guideId: 'styles-bjcp-2021', version: '2026-09-09.1', styleId: 'berliner-weisse' },
      yeast: { name: 'Culture alcoolique personnelle', form: 'liquide', attenuationPct: 78, attenuationBasis: 'recipe',
        fermTempMinC: 18, fermTempMaxC: 24 },
      ogTarget: 1.05,
    });
    const initial = createYeastRecipeDraft(personalSour, refs);
    const preacidified = applyYeastRecipeDesign(personalSour, { ...initial, process: 'preacidified' }, refs);
    expect(readYeastRecipeDesign(preacidified)?.process).toBe('preacidified');

    const acidifying = applyYeastRecipeDesign(preacidified,
      { ...createYeastRecipeDraft(preacidified, refs), process: 'acidifying-yeast' }, refs);
    expect(readYeastRecipeDesign(acidifying)?.process).toBe('acidifying-yeast');
    const reopened = createYeastRecipeDraft(acidifying, refs);
    expect(reopened.process).toBe('acidifying-yeast');
    expect(evaluateYeastRecipeDesign(acidifying, reopened, refs).abv.range).toBeNull();
  });
});
