import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as brewingScenarioDomain from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { HopV55Page } from '../../src/ui/hopV55/Page';
import { readHopV55DecisionReadingArchive, createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import * as decisionService from '../../src/services/hopV55/decision';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceAnswerRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { prepareCorrectionV4, upgradeV3ToV4 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { lookupStoredHopV55PropertyAdviceReexaminationCommand,
  readHopV55PropertyAdviceReexaminationCommandStaging } from '../../src/services/hopV55/propertyAdviceReexaminationCommand';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { pageHarness, pagePropertyAdviceV4OwnerA as ownerA,
  pagePropertyAdviceV4WorkspaceA as workspaceA } from '../fixtures/hopV55PropertyAdvicePageHarness';

vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/Explorer', () => ({ HopV55Explorer: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const question = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
const ownerKey = ownerA;
const parentValue = 2.5;
const freshValue = 3.25;
const unit = 'point-fixture';
const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture.' };
const recordedAt = '2026-10-03T18:00:00.000Z';

function v4Records(workspace: HopV55Workspace) {
  return (workspace.documentaryAnswers ?? []).flatMap(raw => {
    const read = readHopV55DocumentaryAnswerRecord(raw);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4' ? [read.record] : [];
  });
}

async function seedReconciliationPage(harness: ReturnType<typeof pageHarness>, targetWorkspaceId: string, freshUnit = unit) {
  await harness.initialize();
  const sourceContext = structuredClone(harness.context);
  sourceContext.journal = { ...(sourceContext.journal ?? {}), revision: 1,
    readings: [{ kind: 'sweetness', value: parentValue, unit }] };
  const sourcePrepared = prepareBrewingScenarioContext(sourceContext);
  const reading = decisionService.readHopV55Question(question, sourcePrepared);
  const recipeId = sourceContext.recipe?.id;
  if (!recipeId) throw new Error('Cette fixture exige une recette source stable.');
  const source = { kind: 'recipe' as const, id: recipeId };
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:requalification-parent', ownerKey,
    workspaceId: targetWorkspaceId, recordedAt, reading, source, runtimeReference: hopV55ScenarioRuntimeReference(sourcePrepared.runtime) });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: sourcePrepared,
    requestId: 'request:requalification-parent-v3', ownerKey, workspaceId: targetWorkspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy: policy });
  const intents = structuredClone(draft.requestSnapshot.propertyIntents);
  const observation = intents.find(row => row.property === 'sweetness' && row.role === 'reportedObservation');
  if (!observation) throw new Error('Le parseur de fixture doit produire un constat rapporté de douceur.');
  observation.comparisonBasis = { kind: 'current', assertionIds: ['context-reading-0'] };
  const linkedDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: sourcePrepared,
    requestId: 'request:requalification-parent-v3-linked', ownerKey, workspaceId: targetWorkspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy: policy, propertyIntents: intents });
  const sourceAnswer = propertyAdviceDomain.buildHopPropertyAdviceV3(linkedDraft.requestSnapshot);
  const sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft: linkedDraft, prepared: sourcePrepared,
    answerSnapshot: sourceAnswer, answerRecordId: 'answer:requalification-parent-v3' });
  const upgraded = upgradeV3ToV4({ sourceRecord, sourceReadingArchive: archive, prepared: sourcePrepared,
    recordId: 'answer:requalification-parent-v4', requestId: 'request:requalification-parent-v4',
    cultureBinding: null, transition: { kind: 'upgradeV3', actId: 'act:requalification-parent-upgrade',
      parentRecordReference: sourceRecord.reference, parentReadingReference: archive.contentReference,
      reason: 'Version V4 fixture conservée pour la réconciliation.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt } });
  if (upgraded.status !== 'ready') throw new Error(`La version parent doit pouvoir être préparée : ${upgraded.reason}`);
  const upgradedAnswer = propertyAdviceDomain.buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
  const parent = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: upgraded.requestDraftV3.reference,
    answerSnapshot: upgradedAnswer, answerReference: upgradedAnswer.reference,
  } });
  const parentRaw = structuredClone(parent);
  const intent = parent.outcome.kind === 'domainAnswer'
    ? parent.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.id === observation.id)
    : undefined;
  if (!intent) throw new Error('Le constat de douceur doit rester actif dans la réponse V4 parent.');
  expect(intent.comparisonBasis).toEqual({ kind: 'current', assertionIds: ['context-reading-0'] });

  const currentContext = structuredClone(sourceContext);
  currentContext.journal = { ...(currentContext.journal ?? {}), revision: 2,
    readings: [{ kind: 'sweetness', value: freshValue, unit: freshUnit }] };
  harness.context.journal = currentContext.journal;
  const currentPrepared = prepareBrewingScenarioContext(currentContext);
  const stored = await harness.stored();
  if (!stored) throw new Error('Workspace fixture initial absent.');
  const currentJournal = ensureHopV55ReferenceJournal(stored, currentContext, currentPrepared);
  const withArchive = await harness.repository.save({ ...currentJournal,
    intent: { question, criteria: [] }, decisionReadings: [archive],
  }, stored.revision);
  const withV3 = await harness.repository.save({ ...withArchive, documentaryAnswers: [sourceRecord] }, withArchive.revision);
  await harness.repository.save({ ...withV3, documentaryAnswers: [sourceRecord, parent] }, withV3.revision);
  return { parent, parentRaw, archive, intent, sourcePrepared, currentContext: structuredClone(currentContext) };
}

async function openExactV4History(reference: string, answerCount = 2) {
  fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
  fireEvent.click(await screen.findByText(`Réponses et dossiers documentaires · ${answerCount}`));
  const open = screen.getAllByRole('button', { name: 'Relire cette correction documentaire' })
    .find(button => button.closest('article')?.textContent?.includes(reference));
  if (!open) throw new Error(`La version parent exacte ${reference} n’est pas dans l’historique Page.`);
  fireEvent.click(open);
  await screen.findByRole('heading', { name: 'Repartir de cette version dans le contexte actuel' });
}

type ReconciliationPageFixture = Awaited<ReturnType<typeof seedReconciliationPage>>;

function reviseFixtureVersion(parent: ReconciliationPageFixture['parent'], sourceArchive: ReconciliationPageFixture['archive'],
  sourcePrepared: ReconciliationPageFixture['sourcePrepared']) {
  const sourceIntent = parent.outcome.kind === 'domainAnswer'
    ? parent.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness')
    : undefined;
  if (!sourceIntent) throw new Error('Le témoin de versions exige un constat de douceur actif.');
  const activeIntent = { ...structuredClone(sourceIntent), basis: 'Précision de la version antérieure avant réexamen.',
    interpretationOrigin: 'user' as const };
  const result = prepareCorrectionV4({ sourceRecord: parent, sourceReadingArchive: sourceArchive, prepared: sourcePrepared,
    recordId: 'answer:requalification-parent-v4-current', requestId: 'request:requalification-parent-v4-current',
    transition: { kind: 'revise', actId: 'act:requalification-parent-v4-current', parentRecordReference: parent.reference,
      parentReadingReference: parent.sourceReadingReference, reason: 'Geste distinct pour créer une seconde version historique.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-03T18:10:00.000Z' },
    actions: [{ kind: 'revise', annotationId: sourceIntent.id, activeIntent,
      reason: 'Préciser la lecture précédente avant la nouvelle mesure.' }] });
  if (result.status !== 'ready') throw new Error(`La seconde version fixture doit être préparée : ${result.status === 'blocked' ? result.reason : 'aucune réponse active'}`);
  const answer = propertyAdviceDomain.buildHopPropertyAdviceV3(result.requestDraftV3.requestSnapshot);
  return createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: result.requestDraftV3.reference,
    answerSnapshot: answer, answerReference: answer.reference,
  } });
}

async function appendEarlierV4Version(harness: ReturnType<typeof pageHarness>, fixture: ReconciliationPageFixture) {
  const current = reviseFixtureVersion(fixture.parent, fixture.archive, fixture.sourcePrepared);
  const before = await harness.stored();
  if (!before) throw new Error('Workspace de versions fixture absent.');
  const saved = await harness.repository.save({ ...before,
    documentaryAnswers: [...(before.documentaryAnswers ?? []), current], updatedAt: current.transition.recordedAt,
  }, before.revision);
  return { older: fixture.parent, olderRaw: fixture.parentRaw, current, currentRaw: structuredClone(current), saved };
}

describe('Page V5.5 — réconciliation V4 du contexte frais', () => {
  it('prévisualise sans écrire, annule, puis reprend après CAS1 sans rebâtir ni altérer la version parent', async () => {
    const harness = pageHarness({ ownerKey, workspaceId: workspaceA, mode: 'planning' });
    const fixture = await seedReconciliationPage(harness, workspaceA);
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    const view = render(<HopV55Page services={harness.services} />);
    await openExactV4History(fixture.parent.reference);

    const beforePreview = await harness.stored();
    const savesBeforePreview = harness.save.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByText('Même identifiant, contenu frais différent');
    const changedLink = screen.getByText('Même identifiant, contenu frais différent').closest('article');
    expect(changedLink).toHaveTextContent('2,5 point-fixture');
    expect(changedLink).toHaveTextContent('3,25 point-fixture');
    expect(builder).not.toHaveBeenCalled();
    expect(harness.save).toHaveBeenCalledTimes(savesBeforePreview);
    expect(await harness.stored()).toEqual(beforePreview);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler ce brouillon' }));
    await screen.findByRole('button', { name: 'Préparer un aperçu du contexte frais' });
    expect(harness.save).toHaveBeenCalledTimes(savesBeforePreview);
    expect(await harness.stored()).toEqual(beforePreview);
    expect(builder).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByText('Même identifiant, contenu frais différent');
    const linkChoice = screen.getByRole('combobox', { name: /^Choix du fait frais pour /u });
    expect(within(linkChoice).getByRole('option', { name: /même identifiant, nouveau contenu/u })).toBeInTheDocument();
    fireEvent.change(linkChoice, { target: { value: 'bind:context-reading-0' } });
    fireEvent.change(screen.getByRole('textbox', { name: `Motif pour ${fixture.intent.label}` }), {
      target: { value: 'Je rattache ce constat au fait frais de même unité et même identifiant.' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du réexamen réconcilié' }), {
      target: { value: 'Nouvelle lecture après mesure de douceur actualisée.' },
    });
    expect(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' })).toBeEnabled();

    const oldReadingRaw = structuredClone(fixture.archive);
    const recipeBefore = structuredClone(harness.context.recipe);
    const parentWorkspaceBeforeCommit = await harness.stored();
    const saveStart = harness.saveInputs.length;
    harness.failNextReexaminationReceiptSave();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await screen.findByText('Échec transitoire du reçu de réexamen fixture V4 après le staging.');
    expect(builder).toHaveBeenCalledTimes(1);
    const afterCas1 = await harness.stored();
    expect(afterCas1).toBeDefined();
    if (!afterCas1) throw new Error('Workspace de staging absent après le premier CAS.');
    expect(afterCas1.propertyAdviceReexaminationCommandStaging).toHaveLength(1);
    expect(afterCas1.propertyAdviceReexaminationCommandReceipts).toBeUndefined();
    expect(afterCas1.documentaryAnswers).toEqual(parentWorkspaceBeforeCommit?.documentaryAnswers);
    expect(afterCas1.decisionReadings).toHaveLength(2);
    expect(afterCas1.documentaryAnswers?.find(row => row.reference === fixture.parent.reference)).toEqual(fixture.parentRaw);
    expect(afterCas1.decisionReadings?.find(row => row.contentReference === fixture.archive.contentReference)).toEqual(oldReadingRaw);
    const stagedRead = readHopV55PropertyAdviceReexaminationCommandStaging(afterCas1.propertyAdviceReexaminationCommandStaging[0]);
    expect(stagedRead.status).toBe('available');
    if (stagedRead.status !== 'available') throw new Error('Staging exact attendu après CAS1.');
    const staging = stagedRead.staging;
    expect(staging).toMatchObject({ parentRecordReference: fixture.parent.reference,
      parentLedgerReference: fixture.parent.ledger.reference, parentReadingReference: fixture.parent.sourceReadingReference,
      preparedRecord: { transition: { kind: 'reexamine', parentRecordReference: fixture.parent.reference } } });
    expect(staging.preview.sourceReadingArchive.reading.intent.question).toBe(question);
    expect(staging.preview.readingContext.context.assertions).toContainEqual(expect.objectContaining({
      id: 'context-reading-0', subject: 'journal.sweetness', value: freshValue,
    }));
    const receiptAttempt = harness.saveInputs.slice(saveStart).find(row => (row.propertyAdviceReexaminationCommandReceipts?.length ?? 0) > 0);
    expect(receiptAttempt?.documentaryAnswers?.at(-1)).toEqual(staging.preparedRecord);
    expect(harness.context.recipe).toEqual(recipeBefore);
    expect(afterCas1.sourceRecipeId).toBe(parentWorkspaceBeforeCommit?.sourceRecipeId);
    expect(afterCas1.copies).toEqual(parentWorkspaceBeforeCommit?.copies);
    expect(afterCas1.scenarioIds).toEqual(parentWorkspaceBeforeCommit?.scenarioIds);
    expect(simulate).not.toHaveBeenCalled();

    const pending = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: afterCas1, confirmation: staging.confirmation });
    expect(pending.status).toBe('pending');
    view.unmount();
    const recovered = render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByText('Confirmations de nouvelle lecture conservées'));
    await screen.findByText(/Rattachement à terminer/u);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer cette confirmation sans reconstruire le conseil' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    const committed = (await harness.stored())!;
    const child = v4Records(committed).find(record => record.transition.kind === 'reexamine');
    if (!child) throw new Error('Réponse V4 réexaminée attendue après reprise du reçu.');
    expect(committed.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    expect(committed.documentaryAnswers?.at(-1)).toEqual(staging.preparedRecord);
    expect(child).toMatchObject({ sourceReadingReference: staging.sourceReadingReference,
      transition: { kind: 'reexamine', parentRecordReference: fixture.parent.reference,
        parentReadingReference: fixture.parent.sourceReadingReference,
        reason: 'Nouvelle lecture après mesure de douceur actualisée.' },
      ledger: { sourceAnnotations: fixture.parent.ledger.sourceAnnotations } });
    expect(child.readingContext.interpretation).toEqual(fixture.parent.readingContext.interpretation);
    expect(child.readingContext.candidatePolicy).toEqual(fixture.parent.readingContext.candidatePolicy);
    expect(child.readingContext.exclusions).toEqual(fixture.parent.readingContext.exclusions);
    const childObservation = child.outcome.kind === 'domainAnswer'
      ? child.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.id === fixture.intent.id)
      : undefined;
    expect(childObservation?.comparisonBasis).toEqual({ kind: 'current', assertionIds: ['context-reading-0'] });
    expect(childObservation?.basis).toBe('Je rattache ce constat au fait frais de même unité et même identifiant.');
    const archiveRead = readHopV55DecisionReadingArchive(committed.decisionReadings?.find(row => row.contentReference === child.sourceReadingReference));
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available') throw new Error('Archive fraîche exacte attendue au reload.');
    expect(archiveRead.archive.reading.intent.question).toBe(question);
    expect(committed.decisionReadings?.find(row => row.contentReference === fixture.archive.contentReference)).toEqual(oldReadingRaw);
    expect(committed.documentaryAnswers?.find(row => row.reference === fixture.parent.reference)).toEqual(fixture.parentRaw);
    expect(committed.propertyAdviceReexaminationCommandStaging?.[0]).toEqual(afterCas1.propertyAdviceReexaminationCommandStaging?.[0]);
    const lookup = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: committed, confirmation: staging.confirmation });
    expect(lookup).toMatchObject({ status: 'committed', record: { reference: child.reference },
      receipt: { answerRecordReference: child.reference, parentRecordReference: fixture.parent.reference } });
    expect(builder).toHaveBeenCalledTimes(1);
    expect(simulate).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(harness.context.recipe).toEqual(recipeBefore);
    recovered.unmount();
  }, 60000);

  it('active la nouvelle lecture réconciliée depuis l’historique et permet une correction sur son contexte frais', async () => {
    const harness = pageHarness({ ownerKey, workspaceId: `${workspaceA}:activate-requalification`, mode: 'planning' });
    const targetWorkspaceId = `${workspaceA}:activate-requalification`;
    const fixture = await seedReconciliationPage(harness, targetWorkspaceId);
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    render(<HopV55Page services={harness.services} />);
    await openExactV4History(fixture.parent.reference);

    fireEvent.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByText('Même identifiant, contenu frais différent');
    fireEvent.change(screen.getByRole('combobox', { name: /^Choix du fait frais pour /u }), {
      target: { value: 'bind:context-reading-0' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: `Motif pour ${fixture.intent.label}` }), {
      target: { value: 'Le constat reste lié au fait frais compatible.' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du réexamen réconcilié' }), {
      target: { value: 'Créer la nouvelle lecture sur l’assertion fraîche.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    let stored = (await harness.stored())!;
    const requalified = v4Records(stored).find(record => record.transition.kind === 'reexamine');
    if (!requalified) throw new Error('La confirmation doit créer une nouvelle réponse V4.');
    expect(requalified.transition.parentRecordReference).toBe(fixture.parent.reference);
    expect(requalified.sourceReadingReference).not.toBe(fixture.parent.sourceReadingReference);
    await waitFor(() => expect(document.querySelector('.hv4-version-list > li.is-open'))
      .toHaveTextContent('Créer la nouvelle lecture sur l’assertion fraîche.'));
    expect(screen.getByRole('button', { name: 'Corriger la lecture' })).toBeEnabled();

    const editToggle = screen.getByRole('button', { name: `Corriger « ${fixture.intent.label} »` });
    await waitFor(() => expect(editToggle).toBeEnabled());
    fireEvent.click(editToggle);
    await waitFor(() => expect(screen.getByRole('button', { name: `Corriger « ${fixture.intent.label} »` }))
      .toHaveAttribute('aria-expanded', 'true'));
    let intentBasis: HTMLElement;
    try { intentBasis = await screen.findByRole('textbox', { name: /^Motif de l’intention \d+$/u }); }
    catch {
      const fields = screen.queryAllByRole('textbox').map(field => ({ label: field.getAttribute('aria-label'), placeholder: field.getAttribute('placeholder') }));
      throw new Error(`Le geste Corriger est visible, mais son champ de correction manque. Textboxes présents : ${JSON.stringify(fields)}`);
    }
    fireEvent.change(intentBasis, { target: { value: 'Lecture précisée après réconciliation du fait courant.' } });
    const correction = screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' });
    expect(correction).toBeEnabled();
    fireEvent.click(correction);
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(4));
    stored = (await harness.stored())!;
    const revised = v4Records(stored).find(record => record.transition.parentRecordReference === requalified.reference);
    if (!revised) throw new Error('La correction postérieure doit prolonger la lecture réconciliée.');
    expect(revised.transition).toMatchObject({ kind: 'revise', parentRecordReference: requalified.reference });
    expect(revised.sourceReadingReference).toBe(requalified.sourceReadingReference);
    expect(revised.readingContext.context.assertions).toContainEqual(expect.objectContaining({
      id: 'context-reading-0', value: freshValue, unit,
    }));
    expect(stored.documentaryAnswers?.find(row => row.reference === fixture.parent.reference)).toEqual(fixture.parentRaw);
    expect(stored.decisionReadings?.find(row => row.contentReference === fixture.archive.contentReference)).toEqual(fixture.archive);
    expect(builder).toHaveBeenCalledTimes(2);
    expect(simulate).not.toHaveBeenCalled();
  }, 60000);

  it('ne publie pas sur B une confirmation A dont la sauvegarde attend pendant le choix d’une autre version', async () => {
    const targetWorkspaceId = `${workspaceA}:late-version-selection`;
    const harness = pageHarness({ ownerKey, workspaceId: targetWorkspaceId, mode: 'planning' });
    const fixture = await seedReconciliationPage(harness, targetWorkspaceId);
    const olderB = fixture.parent;
    const parentA = reviseFixtureVersion(olderB, fixture.archive, fixture.sourcePrepared);
    const beforeA = await harness.stored();
    if (!beforeA) throw new Error('Workspace de course fixture absent.');
    await harness.repository.save({ ...beforeA,
      documentaryAnswers: [...(beforeA.documentaryAnswers ?? []), parentA], updatedAt: parentA.transition.recordedAt,
    }, beforeA.revision);
    const rawA = structuredClone(parentA);
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const view = render(<HopV55Page services={harness.services} />);
    await openExactV4History(parentA.reference, 3);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByText('Même identifiant, contenu frais différent');
    fireEvent.change(screen.getByRole('combobox', { name: /^Choix du fait frais pour /u }), {
      target: { value: 'bind:context-reading-0' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: `Motif pour ${fixture.intent.label}` }), {
      target: { value: 'Lier A au fait frais compatible.' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du réexamen réconcilié' }), {
      target: { value: 'Confirmation de A lancée avant de changer la version affichée.' },
    });
    const gate = harness.holdNextWorkspaceSave();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await gate.entered;
    const bRow = [...document.querySelectorAll('.hv4-version-list > li')]
      .find(row => row.querySelector('details')?.textContent?.includes(`Version · ${olderB.reference}`));
    if (!bRow) throw new Error('La version interne B exacte doit rester sélectionnable pendant la sauvegarde de A.');
    const selectB = within(bRow).getByRole('button', { name: 'Relire cette version' });
    expect(selectB).toBeEnabled();
    fireEvent.click(selectB);
    const banner = () => screen.getByText('Réexaminer cette version dans la source active').closest('.hv-archive-banner');
    await waitFor(() => expect(banner()).toHaveTextContent(olderB.reference));
    expect(banner()).not.toHaveTextContent(parentA.reference);

    gate.release();
    await gate.committed;
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(4));
    const saved = (await harness.stored())!;
    const childA = v4Records(saved).find(record => record.transition.kind === 'reexamine'
      && record.transition.parentRecordReference === parentA.reference);
    if (!childA) throw new Error('Le reçu de confirmation A doit rester archivé sous son parent exact.');
    expect(saved.documentaryAnswers?.find(row => row.reference === parentA.reference)).toEqual(rawA);
    expect(saved.documentaryAnswers?.find(row => row.reference === olderB.reference)).toEqual(fixture.parentRaw);
    await waitFor(() => expect(banner()).toHaveTextContent(olderB.reference));
    expect(banner()).not.toHaveTextContent(parentA.reference);
    expect(banner()).not.toHaveTextContent(childA.reference);
    expect(builder).toHaveBeenCalledTimes(1);
    view.unmount();
  }, 60000);

  it('refuse le lien de même identifiant avec une unité différente et conserve les rejets explicites', async () => {
    const mismatchWorkspaceId = `${workspaceA}:unit-mismatch`;
    const harness = pageHarness({ ownerKey, workspaceId: mismatchWorkspaceId, mode: 'planning' });
    const fixture = await seedReconciliationPage(harness, mismatchWorkspaceId, 'autre-échelle');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const view = render(<HopV55Page services={harness.services} />);
    await openExactV4History(fixture.parent.reference);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByText('Même identifiant, contenu frais différent');
    const linkChoice = screen.getByRole('combobox', { name: /^Choix du fait frais pour /u });
    expect(within(linkChoice).queryByRole('option', { name: /Relier à:/u })).not.toBeInTheDocument();
    const activeIntents = fixture.parent.outcome.kind === 'domainAnswer'
      ? fixture.parent.outcome.answerSnapshot.requestSnapshot.propertyIntents : [];
    expect(activeIntents.length).toBeGreaterThan(0);
    activeIntents.forEach(intent => {
      const reason = `Retrait explicite de « ${intent.label} » : le fait présent utilise une unité différente.`;
      fireEvent.click(screen.getByRole('button', { name: `Écarter « ${intent.label} » dans la nouvelle version` }));
      fireEvent.change(screen.getByRole('textbox', { name: `Motif pour ${intent.label}` }), { target: { value: reason } });
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du réexamen réconcilié' }), {
      target: { value: 'Aucune projection active n’est conservée avec cette base incompatible.' },
    });
    expect(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => {
      const saved = await harness.stored();
      const alerts = screen.queryAllByRole('alert').map(row => row.textContent?.trim()).filter(Boolean);
      if ((saved?.documentaryAnswers?.length ?? 0) !== 3) {
        if (alerts.length) throw new Error(`Confirmation refusée : ${alerts.join(' · ')}`);
        throw new Error('La confirmation n’a pas encore persisté son record V4.');
      }
    });
    const committed = (await harness.stored())!;
    const child = v4Records(committed).find(record => record.transition.kind === 'reexamine');
    if (!child) throw new Error('Réponse V4 réexaminée attendue après confirmation du rejet.');
    expect(child.ledger.entries.filter(entry => entry.annotationId === fixture.intent.id).at(-1)).toMatchObject({
      disposition: 'rejected', decision: { kind: 'reject', reason: `Retrait explicite de « ${fixture.intent.label} » : le fait présent utilise une unité différente.` },
    });
    expect(child.outcome.kind).toBe('allRejected');
    expect(committed.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    expect(builder).not.toHaveBeenCalled();
    expect(harness.context.recipe).toEqual(fixture.currentContext.recipe);
    view.unmount();
  }, 60000);
});
