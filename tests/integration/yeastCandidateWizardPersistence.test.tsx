import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { adoptYeastDocumentary, readRecipeDraft, serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import { captureSnapshot, normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { recipeSaveIssues } from '../../src/domain/recipeValidation';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipeImport } from '../../src/domain/recipeImport';
import type { Recipe, StockItem } from '../../src/types';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...args: unknown[]) => run(...args) } }));
const key = 'fixture-wizard-candidate-book';
const m20Id = 'yeast-mangrove-jacks-132040951';
const m20Label = 'M20 · Bavarian Wheat';
const draft = (): RecipeWizardDraft => ({ recipe: yeastFlowRecipe(), details: {}, step: 'levure',
  water: { diRatioPct: 0, styleCode: 'NEIPA', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 15, spargeWaterL: 10, allSaltsInMash: true },
  volumesEdited: false, waterProfileAuto: false, targetBasis: 'recipe', mashRatioOverride: null,
  candidateSheets: {
    [m20Id]: { hopIndexId: m20Id, revision: 2, technicalFacts: [], documentary: { form: 'sèche' },
      documentaryNotes: [{ text: 'Note documentaire du candidat A.', origin: 'ai', source: 'Fiche de test A', sourceUrl: 'https://example.test/a' }] },
    'wyeast-3638': { hopIndexId: 'wyeast-3638', revision: 4, technicalFacts: [],
      documentaryNotes: [{ text: 'Note séparée du candidat B.', origin: 'manufacturer', source: 'Fiche de test B' }] },
  } });
const wizard = (onSave = vi.fn(), seed?: Recipe, stockItems: StockItem[] = []) => render(<BrewWizard draftKey={key} seed={seed ? { recipe: seed } : undefined}
  config={defaultConfig} stockItems={stockItems} knownStyles={[]} onClose={vi.fn()} onSave={onSave} onCreateStockItem={vi.fn()} onSaveWaterSource={vi.fn()} />);
const openM20 = async () => {
  fireEvent.change(await screen.findByRole('searchbox', { name: 'Chercher une autre levure' }), { target: { value: 'M20' } });
  const compare = await screen.findByRole('checkbox', { name: `Comparer ${m20Label}` });
  if (!(compare as HTMLInputElement).checked) fireEvent.click(compare);
  const sideBySide = screen.getByRole('button', { name: /^(Comparer côte à côte|Masquer le côte à côte)/ });
  if (sideBySide.getAttribute('aria-expanded') !== 'true') fireEvent.click(sideBySide);
  fireEvent.click(screen.getByRole('button', { name: `Essayer la conduite avec ${m20Label}, sans changer le brouillon` }));
  const fold = screen.getByRole('group', { name: `Fiche de ${m20Label}` });
  if (!fold.hasAttribute('open')) fireEvent.click(within(fold).getByText(`Compléter ou corriger la fiche de ${m20Label}`));
  return fold;
};
const chooseDirect = async (query: string, label: string) => {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Chercher une autre levure' }), { target: { value: query } });
  fireEvent.click(await screen.findByRole('button', { name: `Choisir ${label} pour le brouillon` }));
};
const chooseFreeName = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Saisir une levure hors catalogue' }));
  fireEvent.change(screen.getByLabelText('Nom de la levure personnelle'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette levure' }));
};
const openRecipeSheet = (name: string) => {
  const fold = screen.getByRole('group', { name: `Fiche de ${name}` }) as HTMLDetailsElement;
  if (!fold.open) fireEvent.click(fold.querySelector('summary')!);
  return fold;
};
afterEach(() => { cleanup(); localStorage.removeItem(`laffinee_recipe_draft_v1:${key}`); run.mockReset(); });

describe('Fiches candidates — traversée du véritable Wizard', () => {
  it('transporte les absences, inconnues et listes vides de la fiche adoptée', () => {
    const recipe = yeastFlowRecipe();
    const source = 'https://example.test/m20-reference';
    const adoptedDocumentary = { version: 1 as const, hopIndexId: m20Id,
      documentary: { declaredAttenuationPct: 78, fermTempMaxC: null, technicalSource: source },
      technicalFacts: [], technicalSelections: { temperature: null }, documentaryNotes: null };
    recipe.yeast = { ...recipe.yeast, name: m20Label, hopIndexId: m20Id, attenuationPct: 73, attenuationBasis: 'recipe',
      qty: 11, unit: 'g', pitchTempC: 18, stockItemRef: 'lot-m20', notes: 'Note opérationnelle du lot M20.', adoptedDocumentary };

    const reopened = normalizeRecipe(JSON.parse(JSON.stringify(recipe)) as Recipe).yeast.adoptedDocumentary!;
    expect(reopened).toEqual(adoptedDocumentary);
    expect(Object.prototype.hasOwnProperty.call(reopened, 'fermentationFacts')).toBe(false);
    expect(reopened.technicalFacts).toEqual([]);
    expect(reopened.documentaryNotes).toBeNull();
    expect(reopened.documentary?.fermTempMaxC).toBeNull();

    const snapshot = captureSnapshot(recipe);
    expect(snapshot.yeast.adoptedDocumentary).toEqual(adoptedDocumentary);
    expect(snapshot.yeast).toMatchObject({ qty: 11, unit: 'g', pitchTempC: 18, stockItemRef: 'lot-m20', notes: 'Note opérationnelle du lot M20.' });
    const textCopy = readRecipeText(writeRecipeText(recipe));
    expect(normalizeRecipeImport(textCopy, 'local', true).yeast?.adoptedDocumentary).toEqual(adoptedDocumentary);
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes']) expect(reopened).not.toHaveProperty(field);

    const localRecipe = { ...recipe, yeast: { ...recipe.yeast, hopIndexId: undefined, stockItemRef: 'stock-m20',
      adoptedDocumentary: undefined, localDocumentary: { version: 1 as const,
        documentary: { declaredAttenuationPct: 78, fermTempMaxC: null, technicalSource: source },
        technicalFacts: [], technicalSelections: { temperature: null }, documentaryNotes: null } } };
    expect(normalizeRecipe(JSON.parse(JSON.stringify(localRecipe)) as Recipe).yeast.localDocumentary).toEqual(localRecipe.yeast.localDocumentary);
    expect(captureSnapshot(localRecipe).yeast.localDocumentary).toEqual(localRecipe.yeast.localDocumentary);
    const localTextCopy = readRecipeText(writeRecipeText(localRecipe));
    expect(localTextCopy?.yeast?.localDocumentary).toEqual(localRecipe.yeast.localDocumentary);
    expect(localTextCopy?.yeast?.stockItemRef).toBeUndefined();
    expect(normalizeRecipeImport(localTextCopy, 'local', true).yeast?.localDocumentary).toEqual(localRecipe.yeast.localDocumentary);

    const modelInput = normalizeRecipeImport({ ...recipe, yeast: { ...recipe.yeast, adoptedDocumentary } }, 'ia');
    expect(modelInput.yeast?.adoptedDocumentary).toBeUndefined();
    expect(modelInput.warnings).toContain('Une fiche documentaire adoptée doit venir d’une action explicite dans l’application.');
    const localModelInput = normalizeRecipeImport({ ...recipe, yeast: { ...recipe.yeast, localDocumentary: localRecipe.yeast.localDocumentary } }, 'ia');
    expect(localModelInput.yeast?.localDocumentary).toBeUndefined();
    expect(localModelInput.warnings).toContain('Une fiche documentaire adoptée doit venir d’une action explicite dans l’application.');

    const badIdentity: Recipe = { ...recipe, yeast: { ...recipe.yeast,
      adoptedDocumentary: { ...adoptedDocumentary, hopIndexId: 'other-strain' } } };
    expect(recipeSaveIssues(badIdentity).some(issue => issue.field === 'wz-yeast-documentary')).toBe(true);
    expect(() => writeRecipeText(badIdentity)).toThrow(/fiche documentaire adoptée/i);
  });

  it('sauvegarde une fiche libre sans ID puis distingue renommage, nouveau homonyme et Undo exact', async () => {
    const source = 'SOURCE_HISTORIQUE_LIBRE_QA';
    const sourceUrl = 'https://example.test/culture-libre-qa';
    const temperature: YeastTechnicalFact = { key: 'temperature', reported: '18–22 °C', range: { min: 18, max: 22 }, unit: '°C',
      qualifier: 'range', origin: 'personal', source, sourceUrl };
    const seed = yeastFlowRecipe();
    seed.yeast = { name: 'Culture libre QA', qty: 11, unit: 'g', pitchTempC: 18, notes: 'Note opérationnelle du lot QA.',
      attenuationPct: 78, attenuationBasis: 'declared', technicalSource: source,
      technicalFacts: [temperature], technicalSelections: { temperature },
      documentaryNotes: [{ text: 'Note documentaire QA.', origin: 'personal', source, sourceUrl }] };
    seed.yeastDesign = undefined; seed.yeastGuide = undefined;
    const save = vi.fn();
    const first = wizard(save, seed);
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets).toEqual({}));
    expect(readRecipeDraft(key)?.recipe.yeast.localDocumentary).toBeUndefined();
    expect(readRecipeDraft(key)?.recipe.yeast).toMatchObject({ attenuationPct: 78, attenuationBasis: 'declared' });
    allerEtape('Levure');
    const sheet = openRecipeSheet('Culture libre QA');
    const hypothesis = within(sheet).getByLabelText('Atténuation retenue pour cette recette, en pourcent');
    fireEvent.change(hypothesis, { target: { value: '73' } }); fireEvent.blur(hypothesis);

    await waitFor(() => expect(readRecipeDraft(key)?.recipe.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe',
      localDocumentary: { version: 1, documentary: { declaredAttenuationPct: 78, technicalSource: source },
        technicalFacts: [temperature], technicalSelections: { temperature }, documentaryNotes: [{ text: 'Note documentaire QA.', sourceUrl }] } }));
    const adoptedFree = readRecipeDraft(key)!.recipe.yeast;
    expect(adoptedFree.hopIndexId).toBeUndefined();
    expect(adoptedFree.adoptedDocumentary).toBeUndefined();
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes']) expect(adoptedFree.localDocumentary).not.toHaveProperty(field);

    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast.attenuationPct).toBe(73);
    expect(saved.yeast.localDocumentary).toEqual(adoptedFree.localDocumentary);
    expect(saved.yeast.hopIndexId).toBeUndefined();
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    first.unmount();

    const reopened = wizard(save, saved);
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    allerEtape('Levure');
    const reopenedSheet = openRecipeSheet('Culture libre QA');
    const renameSummary = within(reopenedSheet).getByText('Corriger le nom dans cette recette', { selector: 'summary' });
    fireEvent.click(renameSummary);
    fireEvent.change(within(reopenedSheet).getByLabelText('Nom de la levure dans cette recette'),
      { target: { value: 'Culture libre QA renommée' } });
    fireEvent.click(within(reopenedSheet).getByRole('button', { name: 'Renommer' }));
    await waitFor(() => expect(readRecipeDraft(key)?.recipe.yeast.name).toBe('Culture libre QA renommée'));
    const renamed = structuredClone(readRecipeDraft(key)!.recipe.yeast);
    expect(renamed.localDocumentary).toEqual(saved.yeast.localDocumentary);
    expect(renamed.attenuationPct).toBe(73);

    let resolveLate!: (value: unknown) => void;
    run.mockReturnValueOnce(new Promise(resolve => { resolveLate = resolve; }));
    fireEvent.click(within(reopenedSheet).getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    chooseFreeName('Culture libre QA renommée');
    await waitFor(() => expect(readRecipeDraft(key)?.recipe.yeast.localDocumentary).toBeUndefined());
    await act(async () => resolveLate({ ok: true, data: { found: true, name: 'Culture libre QA renommée', source: 'Source tardive QA',
      form: 'liquide', attenuationPct: 99, note: 'Note tardive à rejeter.' } }));
    const homonym = readRecipeDraft(key)!.recipe.yeast;
    expect(homonym.name).toBe(renamed.name);
    expect(homonym.hopIndexId).toBeUndefined();
    expect(homonym.technicalSource).toBeUndefined();
    expect(homonym.qty).toBeUndefined();
    expect(homonym.form).toBeUndefined();
    expect(homonym.documentaryNotes).toBeUndefined();
    expect(screen.queryByText('Note tardive à rejeter.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler le changement' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler le changement' }));
    await waitFor(() => expect(readRecipeDraft(key)?.recipe.yeast).toEqual(renamed));
    expect(readRecipeDraft(key)?.candidateSheets).toEqual({});
    expect(screen.queryByRole('region', { name: /^Proposition IA pour/ })).not.toBeInTheDocument();
    expect(run).toHaveBeenCalledTimes(1);
    reopened.unmount();
  });

  it('retrouve la correction documentaire de A après les choix directs A → B → A', async () => {
    const before = draft();
    const sourceUrl = 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g';
    before.candidateSheets = { ...before.candidateSheets, [m20Id]: { ...before.candidateSheets![m20Id], documentaryNotes: [
      { text: 'Note documentaire du candidat A.', origin: 'ai', source: 'Fiche M20', sourceUrl }
    ] } };
    before.recipe.yeast = { ...before.recipe.yeast, qty: 125, unit: 'mL', pitchTempC: 18,
      stockItemRef: 'lot-3068', notes: 'Note opérationnelle du lot 3068.' };
    writeRecipeDraft(key, serializeRecipeDraft(before));
    const save = vi.fn();
    const view = wizard(save);

    await chooseDirect('M20', m20Label);
    const sheetA = openRecipeSheet(m20Label);
    const notes = within(sheetA).getByRole('group', { name: 'Notes documentaires de la souche' });
    fireEvent.click(within(notes).getByRole('button', { name: 'Modifier' }));
    fireEvent.change(within(notes).getByLabelText('Texte de la note documentaire'), { target: { value: 'Correction documentaire de A.' } });
    fireEvent.click(within(notes).getByRole('button', { name: 'Enregistrer la note' }));
    const temperature = within(sheetA).getByRole('group', { name: 'Température de fermentation' });
    fireEvent.click(within(temperature).getByRole('button', { name: 'Corriger Température de fermentation' }));
    const maximum = within(temperature).getByLabelText('Température de fermentation · maximum');
    fireEvent.change(maximum, { target: { value: '29' } }); fireEvent.blur(maximum);
    fireEvent.change(within(temperature).getByLabelText('Source · Température de fermentation'), {
      target: { value: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g' }
    });
    fireEvent.click(within(temperature).getByRole('button', { name: 'Retenir' }));
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets?.[m20Id].revision).toBe(4));
    const bookA = readRecipeDraft(key)!.candidateSheets![m20Id];
    expect(bookA.documentaryNotes?.[0]).toMatchObject({ text: 'Correction documentaire de A.', origin: 'personal',
      source: 'Fiche M20', sourceUrl: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g' });
    expect(bookA.technicalSelections?.temperature).toMatchObject({ key: 'temperature', reported: '18–29 °C',
      range: { min: 18, max: 29 }, qualifier: 'range', origin: 'personal',
      source: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g',
      sourceUrl: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g' });
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes']) expect(bookA).not.toHaveProperty(field);
    expect(readRecipeDraft(key)?.candidateSheets?.['wyeast-3638']).toEqual(before.candidateSheets!['wyeast-3638']);
    const yeastA = readRecipeDraft(key)!.recipe.yeast;
    expect(yeastA.hopIndexId).toBe(m20Id);
    expect(yeastA.qty).toBeUndefined(); expect(yeastA.unit).toBeUndefined();
    expect(yeastA.pitchTempC).toBeUndefined(); expect(yeastA.stockItemRef).toBeUndefined(); expect(yeastA.notes).toBeUndefined();

    await chooseDirect('3638', '3638 · Bavarian Wheat');
    expect(readRecipeDraft(key)?.recipe.yeast.hopIndexId).toBe('wyeast-3638');
    expect(readRecipeDraft(key)?.candidateSheets?.[m20Id]).toEqual(bookA);
    await chooseDirect('M20', m20Label);
    let returnedA = openRecipeSheet(m20Label);
    expect(within(returnedA).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Correction documentaire de A.');
    expect(within(returnedA).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');
    expect(readRecipeDraft(key)?.candidateSheets?.['wyeast-3638']).toEqual(before.candidateSheets!['wyeast-3638']);

    allerEtape('Houblons');
    allerEtape('Levure');
    const afterStep = openRecipeSheet(m20Label);
    expect(within(afterStep).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Correction documentaire de A.');
    expect(readRecipeDraft(key)?.candidateSheets?.[m20Id].revision).toBe(4);
    view.unmount();

    const reopened = wizard(save);
    await chooseDirect('3638', '3638 · Bavarian Wheat');
    await chooseDirect('M20', m20Label);
    returnedA = openRecipeSheet(m20Label);
    expect(within(returnedA).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Correction documentaire de A.');
    const restoredTemperature = within(returnedA).getByRole('group', { name: 'Température de fermentation' });
    expect(restoredTemperature.querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');
    expect(readRecipeDraft(key)?.recipe.yeast.qty).toBeUndefined();
    expect(readRecipeDraft(key)?.candidateSheets?.[m20Id]).not.toHaveProperty('notes');

    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast.documentaryNotes?.[0]).toMatchObject({ text: 'Correction documentaire de A.', origin: 'personal',
      sourceUrl: 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g' });
    expect(saved.yeast.technicalSelections?.temperature).toMatchObject({ range: { min: 18, max: 29 }, qualifier: 'range', origin: 'personal' });
    expect(saved.yeast.qty).toBeUndefined(); expect(saved.yeast.unit).toBeUndefined();
    expect(saved.yeast.pitchTempC).toBeUndefined(); expect(saved.yeast.stockItemRef).toBeUndefined(); expect(saved.yeast.notes).toBeUndefined();
    const transported = normalizeRecipe(JSON.parse(JSON.stringify(saved)) as Recipe).yeast;
    expect(transported.documentaryNotes).toEqual(saved.yeast.documentaryNotes);
    expect(transported.technicalSelections?.temperature).toEqual(saved.yeast.technicalSelections?.temperature);
    expect(transported.qty).toBeUndefined(); expect(transported.notes).toBeUndefined();
    reopened.unmount();
  });

  it('réhydrate dans le livre au choix explicite les documents du seed sans importer ses opérations', async () => {
    const sourceUrl = 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g';
    const temperature: YeastTechnicalFact = { key: 'temperature', reported: '18–29 °C', range: { min: 18, max: 29 }, unit: '°C',
      qualifier: 'range', origin: 'personal', source: 'Correction de la fiche M20', sourceUrl, context: 'beer' };
    const savedSeed = yeastFlowRecipe();
    savedSeed.yeast = { ...savedSeed.yeast, name: m20Label, hopIndexId: m20Id, form: 'sèche', qty: 11, unit: 'g', pitchTempC: 18,
      notes: 'Note opérationnelle du lot M20.', lab: 'Mangrove Jack’s', strain: 'M20', fermTempMinC: 18, fermTempMaxC: 29,
      technicalSource: sourceUrl, technicalFacts: [temperature], technicalSelections: { temperature },
      documentaryNotes: [{ text: 'Note documentaire du seed M20.', origin: 'ai', source: 'Fiche M20', sourceUrl }],
      attenuationPct: 73, attenuationBasis: 'recipe' };
    savedSeed.yeastDesign = undefined;
    savedSeed.yeastGuide = undefined;
    const save = vi.fn();
    const view = wizard(save, savedSeed);
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets).toEqual({}));
    allerEtape('Levure');

    await chooseDirect('3638', '3638 · Bavarian Wheat');
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets?.[m20Id]).toBeDefined());
    const seededSheet = readRecipeDraft(key)!.candidateSheets![m20Id];
    expect(seededSheet.technicalSelections?.temperature).toEqual(temperature);
    expect(seededSheet.documentaryNotes).toEqual([{ text: 'Note documentaire du seed M20.', origin: 'ai', source: 'Fiche M20', sourceUrl }]);
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes', 'attenuationPct']) expect(seededSheet).not.toHaveProperty(field);

    await chooseDirect('M20', m20Label);
    const sheet = openRecipeSheet(m20Label);
    expect(within(sheet).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Note documentaire du seed M20.');
    expect(within(sheet).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');
    expect(readRecipeDraft(key)?.recipe.yeast.qty).toBeUndefined();
    expect(readRecipeDraft(key)?.recipe.yeast.notes).toBeUndefined();
    const chosenA = readRecipeDraft(key)!.recipe.yeast;
    expect(chosenA.adoptedDocumentary).toMatchObject({ version: 1, hopIndexId: m20Id,
      documentary: { lab: 'Mangrove Jack’s', strain: 'M20', technicalSource: sourceUrl },
      documentaryNotes: [{ text: 'Note documentaire du seed M20.', origin: 'ai', sourceUrl }],
      technicalSelections: { temperature }, technicalFacts: [temperature] });
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes']) expect(chosenA.adoptedDocumentary).not.toHaveProperty(field);

    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast.adoptedDocumentary).toEqual(chosenA.adoptedDocumentary);
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    view.unmount();

    const reopened = wizard(vi.fn(), saved);
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    allerEtape('Levure');
    await chooseDirect('3638', '3638 · Bavarian Wheat');
    await chooseDirect('M20', m20Label);
    const returned = openRecipeSheet(m20Label);
    expect(within(returned).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Note documentaire du seed M20.');
    expect(within(returned).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');
    const returnedBook = readRecipeDraft(key)!.candidateSheets![m20Id];
    expect(returnedBook.technicalFacts).toEqual([temperature]);
    expect(returnedBook.documentaryNotes).toEqual(saved.yeast.documentaryNotes);
    for (const field of ['qty', 'unit', 'pitchTempC', 'stockItemRef', 'notes']) expect(returnedBook).not.toHaveProperty(field);
    reopened.unmount();
  });

  it('garde le 78 déclaré dans le livre quand la recette adopte une hypothèse 73, puis permet l’inconnu explicite', async () => {
    const source = 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g';
    const candidate = yeastFlowRecipe();
    candidate.yeast = { name: m20Label, hopIndexId: m20Id, form: 'sèche', attenuationPct: 78, attenuationBasis: 'declared', technicalSource: source };
    candidate.yeastDesign = undefined;
    const before = draft(); before.recipe = candidate;
    before.candidateSheets = { ...before.candidateSheets, [m20Id]: { hopIndexId: m20Id, revision: 6, technicalFacts: [],
      documentary: { form: 'sèche', declaredAttenuationPct: 78, technicalSource: source } } };
    writeRecipeDraft(key, serializeRecipeDraft(before));
    const save = vi.fn();
    const first = wizard(save);
    const sheet = openRecipeSheet(m20Label);
    const hypothesis = within(sheet).getByLabelText('Atténuation retenue pour cette recette, en pourcent');
    fireEvent.change(hypothesis, { target: { value: '73' } }); fireEvent.blur(hypothesis);

    await waitFor(() => expect(readRecipeDraft(key)?.recipe.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' }));
    let book = readRecipeDraft(key)!.candidateSheets![m20Id];
    expect(book.documentary).toMatchObject({ declaredAttenuationPct: 78, technicalSource: source });
    expect(book.technicalFacts).toEqual([]);
    expect(readRecipeDraft(key)?.recipe.yeast.adoptedDocumentary).toMatchObject({ version: 1, hopIndexId: m20Id,
      documentary: { declaredAttenuationPct: 78, technicalSource: source } });
    const acceptedHypothesis = readRecipeDraft(key)!.recipe.yeast;
    expect(adoptYeastDocumentary(acceptedHypothesis, acceptedHypothesis)).toEqual(acceptedHypothesis);

    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe',
      adoptedDocumentary: { documentary: { declaredAttenuationPct: 78, technicalSource: source } } });
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    first.unmount();

    const reopened = wizard(vi.fn(), saved);
    await waitFor(() => expect(readRecipeDraft(key)).toBeUndefined());
    expect(saved.yeast.attenuationPct).toBe(73);
    expect(saved.yeast.adoptedDocumentary?.documentary?.declaredAttenuationPct).toBe(78);
    allerEtape('Levure');
    const reopenedSheet = openRecipeSheet(m20Label);

    const attenuation = within(reopenedSheet).getByRole('group', { name: 'Atténuation annoncée' });
    fireEvent.click(within(attenuation).getByRole('button', { name: 'Corriger Atténuation annoncée' }));
    fireEvent.change(within(attenuation).getByLabelText('Type de valeur · Atténuation annoncée'), { target: { value: 'unknown' } });
    fireEvent.click(within(attenuation).getByRole('button', { name: 'Retenir' }));
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets?.[m20Id].technicalSelections?.attenuation).toBeNull());
    book = readRecipeDraft(key)!.candidateSheets![m20Id];
    expect(book.documentary?.declaredAttenuationPct).toBeNull();
    expect(book.technicalFacts).toEqual([]);
    expect(readRecipeDraft(key)?.recipe.yeast).toMatchObject({ attenuationPct: 73, attenuationBasis: 'recipe' });
    reopened.unmount();
  });

  it('compare un brouillon repris à la recette réellement enregistrée, pas à lui-même', async () => {
    const savedSeed = yeastFlowRecipe();
    savedSeed.yeast.notes = 'Note conservée avec la recette enregistrée.';
    const resumed = structuredClone(savedSeed);
    resumed.yeast.qty = 110;
    resumed.yeast.notes = 'Note modifiée dans le brouillon repris.';
    resumed.fermentation = [{ ...resumed.fermentation[0], tempC: 20 }, ...resumed.fermentation.slice(1)];
    const local = draft(); local.recipe = resumed;
    writeRecipeDraft(key, serializeRecipeDraft(local));
    wizard(vi.fn(), savedSeed);

    const state = screen.getByLabelText('État du choix de levure');
    expect(state).toHaveTextContent('Brouillon non enregistré');
    const physical = state.querySelector('[data-difference="quantity"]');
    expect(physical).toHaveTextContent('125 mL → 110 mL');
    expect(state).not.toHaveTextContent('identiques à la recette enregistrée');
    const documentary = within(state).getByText('1 modification de fiche à relire', { selector: 'summary' });
    fireEvent.click(documentary);
    const documentaryRows = within(state).getByRole('list', { name: 'Différences documentaires avec la recette enregistrée' });
    expect(documentaryRows).toHaveTextContent('Note conservée avec la recette enregistrée.');
    expect(documentaryRows).toHaveTextContent('Note modifiée dans le brouillon repris.');
    expect(state).toHaveTextContent('Primaire 18 °C → 20 °C');
  });

  it('restaure, corrige et garde les fiches A/B en changeant d’étape puis en rouvrant le brouillon, sans modifier la recette', async () => {
    const before = draft();
    writeRecipeDraft(key, serializeRecipeDraft(before));
    const view = wizard();
    const sheet = await openM20();
    const notes = within(sheet).getByRole('group', { name: 'Notes documentaires de la souche' });
    expect(notes).toHaveTextContent('Note documentaire du candidat A.');
    expect(notes).not.toHaveTextContent('Note séparée du candidat B.');
    fireEvent.click(within(notes).getByRole('button', { name: 'Modifier' }));
    fireEvent.change(within(notes).getByLabelText('Texte de la note documentaire'), { target: { value: 'Note A corrigée localement.' } });
    fireEvent.click(within(notes).getByRole('button', { name: 'Enregistrer la note' }));
    await waitFor(() => expect(readRecipeDraft(key)?.candidateSheets?.[m20Id].revision).toBe(3));
    expect(readRecipeDraft(key)?.candidateSheets?.['wyeast-3638']).toEqual(before.candidateSheets!['wyeast-3638']);
    expect(readRecipeDraft(key)?.recipe.yeast).toEqual(before.recipe.yeast);
    expect(readRecipeDraft(key)?.candidateSheets?.[m20Id]).not.toHaveProperty('qty');

    allerEtape('Houblons');
    allerEtape('Levure');
    expect(await openM20()).toHaveTextContent('Note A corrigée localement.');
    view.unmount();
    const reopened = wizard();
    expect(await openM20()).toHaveTextContent('Note A corrigée localement.');
    expect(readRecipeDraft(key)?.candidateSheets?.[m20Id].documentaryNotes?.[0]).toMatchObject({
      text: 'Note A corrigée localement.', origin: 'personal', source: 'Fiche de test A', sourceUrl: 'https://example.test/a',
    });
    expect(readRecipeDraft(key)?.recipe.yeast).toEqual(before.recipe.yeast);
    expect(run).not.toHaveBeenCalled();
    reopened.unmount();
  });

  it('signale un book invalide en récupérant les autres données du brouillon', async () => {
    const before = draft();
    const serialized = JSON.parse(serializeRecipeDraft(before));
    serialized.draft.candidateSheets = { wrongIdentity: before.candidateSheets![m20Id] };
    writeRecipeDraft(key, JSON.stringify(serialized));
    wizard();
    await screen.findByText(/Les fiches candidates de ce brouillon sont invalides/);
    expect(screen.getByRole('region', { name: 'Levure de la recette' })).toHaveTextContent(before.recipe.yeast.name);
    expect(run).not.toHaveBeenCalled();
  });
});
