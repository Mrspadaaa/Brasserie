import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as brewingScenarioDomain from '../../src/domain/brewingScenario';
import * as decisionService from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import { readHopV55PropertyAdviceDossierRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import * as propertyAdviceV4ControllerModule from '../../src/services/hopV55/propertyAdviceControllerV4';
import { HopV55Page } from '../../src/ui/hopV55/Page';
import { pageHarness, pagePropertyAdviceV4OwnerA as ownerA, pagePropertyAdviceV4OwnerB as ownerB,
  pagePropertyAdviceV4R20 as r20, pagePropertyAdviceV4WorkspaceA as workspaceA,
  pagePropertyAdviceV4WorkspaceB as workspaceB } from '../fixtures/hopV55PropertyAdvicePageHarness';

// Exercise the real Page, parser, V3/V4 controllers, V4 editor, archive readers,
// V3 advice builder and the append-only workspace repository. Other panels are
// unrelated to this path and stay out of the integration surface.
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

async function seedLegacyR20(harness: Awaited<ReturnType<typeof pageHarness>>) {
  const base = await harness.stored();
  if (!base || !harness.context.recipe) throw new Error('Workspace et recette de fixture attendus pour l’archive legacy.');
  const reading = decisionService.readHopV55Question(r20, harness.prepared);
  const archive = createHopV55DecisionReadingArchiveV2({ id: `legacy-v2:${base.id}`, ownerKey: base.ownerKey,
    workspaceId: base.id, recordedAt: '2026-10-03T12:00:00.000Z', reading,
    source: { kind: 'recipe', id: harness.context.recipe.id },
    runtimeReference: hopV55ScenarioRuntimeReference(harness.prepared.runtime) });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: harness.prepared,
    requestId: `legacy-v3-request:${base.id}`, ownerKey: base.ownerKey, workspaceId: base.id,
    sourceReadingReference: archive.contentReference,
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Lecture legacy conservée; aucun candidat n’est préchoisi.' } });
  const answerSnapshot = propertyAdviceDomain.buildHopPropertyAdviceV3(draft.requestSnapshot);
  const answer = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared: harness.prepared, answerSnapshot,
    answerRecordId: `legacy-v3-answer:${base.id}` });
  const validatedAnswer = readHopV55DocumentaryAnswerRecord(answer);
  if (validatedAnswer.status !== 'readOnly' || validatedAnswer.record.format !== 'hop-v55-documentary-answer-record-v3') {
    throw new Error(`Legacy V3 answer seed must pass the public reader: ${validatedAnswer.status}`);
  }
  const archived = await harness.repository.save({ ...base, intent: { question: r20, criteria: reading.intent.criteria },
    decisionReadings: [archive] }, base.revision);
  await harness.repository.save({ ...archived, documentaryAnswers: [answer] }, archived.revision);
  return { archive, answer };
}

async function readR20(harness: Awaited<ReturnType<typeof pageHarness>>) {
  await screen.findByRole('textbox', { name: 'Question au brasseur' });
  const seeded = await harness.stored();
  const seededArchive = seeded?.decisionReadings?.[0] && readHopV55DecisionReadingArchive(seeded.decisionReadings[0]);
  const seededRecord = seeded?.documentaryAnswers?.[0] && readHopV55DocumentaryAnswerRecord(seeded.documentaryAnswers[0]);
  if (!seededArchive || seededArchive.status !== 'available' || seededArchive.archive.format !== 'hop-v55-decision-reading-v2'
    || !seededRecord || seededRecord.status !== 'readOnly' || seededRecord.record.format !== 'hop-v55-documentary-answer-record-v3'
    || seededRecord.record.sourceReadingReference !== seededArchive.archive.contentReference) {
    throw new Error(`Archive seed V2 / réponse V3 incohérents : ${seededArchive?.status ?? 'archive absente'} / ${seededRecord?.status ?? 'record absent'}`);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
  fireEvent.click(await screen.findByText('Réponses et dossiers documentaires · 1'));
  fireEvent.click(await screen.findByRole('button', { name: 'Relire cette réponse documentaire', exact: true }));
  await waitFor(() => expect(document.querySelector('.hv-property-eyebrow')).toHaveTextContent('Conseil documentaire · V3'));
  // Re-read the selected legacy archive in the active source. Do not submit
  // the same text as a brand-new V4 question or replace its source identity.
  fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
  await waitFor(async () => {
    const current = await harness.stored();
    expect(current?.decisionReadings).toHaveLength(2);
    expect(current?.documentaryAnswers).toHaveLength(2);
  });
  const current = await harness.stored();
  const currentArchive = current?.decisionReadings?.[1] && readHopV55DecisionReadingArchive(current.decisionReadings[1]);
  if (!currentArchive || currentArchive.status !== 'available'
    || currentArchive.archive.format !== 'hop-v55-decision-reading-v2' && currentArchive.archive.format !== 'hop-v55-decision-reading-v3') {
    throw new Error('Le réexamen legacy doit conserver un archive V2/V3 distinct; il ne doit pas réinterpréter l’archive en V4.');
  }
  if (!(document.body.textContent ?? '').includes('Conseil documentaire · V3')) {
    const stored = await harness.stored();
    const heads = [...document.querySelectorAll('h1,h2,h3,h4')].map(element => element.textContent?.trim()).filter(Boolean);
    const records = (stored?.documentaryAnswers ?? []).map(row => {
      const read = readHopV55DocumentaryAnswerRecord(row);
      return read.status === 'readOnly' ? `${read.record.format}:${read.record.sourceReadingReference}` : read.status;
    });
    throw new Error(`Page archive V4 sans son conseil V3 lisible. heads=${heads.join('|')} records=${records.join('|')} body=${(document.body.textContent ?? '').slice(-900)}`);
  }
  return currentArchive.archive;
}

function v3Record(workspace: HopV55Workspace, sourceReadingReference?: string) {
  const read = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers?.find(row => row.format === 'hop-v55-documentary-answer-record-v3'
    && (!sourceReadingReference || row.sourceReadingReference === sourceReadingReference)));
  if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3') throw new Error('Réponse V3 R20 exacte attendue.');
  return read.record;
}

function v4Records(workspace: HopV55Workspace) {
  return (workspace.documentaryAnswers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryAnswerRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4' ? [read.record] : [];
  });
}

function v4Record(workspace: HopV55Workspace, reference?: string) {
  const row = v4Records(workspace).find(value => reference ? value.reference === reference : true);
  if (!row) throw new Error('Record V4 exact attendu.');
  return row;
}

function latestV4Record(workspace: HopV55Workspace) {
  const row = v4Records(workspace).at(-1);
  if (!row) throw new Error('Tête V4 exacte attendue.');
  return row;
}

async function assertV4Published(record: ReturnType<typeof latestV4Record>, input: {
  selectedReadingReference: string; legacyReadingReference: string; parentV3RecordReference: string;
}) {
  try {
    await waitFor(() => expect(document.querySelector('.hv-property-advice.hv4')).toBeTruthy(), { timeout: 15000 });
    return;
  } catch { /* report the committed receipt and visible Page state below */ }
  const notices = [...document.querySelectorAll('[role="status"],[role="alert"]')]
    .map(element => element.textContent?.trim()).filter(Boolean);
  const visibleActions = [...document.querySelectorAll('button')]
    .map(button => button.textContent?.trim()).filter(text => /Écarter|Restaurer|Réexaminer|lecture seule|Relire/iu.test(text ?? ''));
  const question = (document.querySelector('textarea[aria-label="Question au brasseur"]') as HTMLTextAreaElement | null)?.value ?? '';
  throw new Error(`Le commit V4 exact n’est pas affiché par la Page après reprise legacy : ${JSON.stringify({
    selectedReadingReference: input.selectedReadingReference,
    legacyReadingReference: input.legacyReadingReference,
    parentV3RecordReference: input.parentV3RecordReference,
    committed: { id: record.id, reference: record.reference, sourceReadingReference: record.sourceReadingReference,
      transition: record.transition, ledgerReference: record.ledger.reference },
    currentQuestion: question, v3PanelStillVisible: !!document.querySelector('.hv-property-advice:not(.hv4)'),
    v4PanelVisible: false, notices, visibleActions,
  })}`);
}

function sourceAnnotation(record: ReturnType<typeof v4Record>, spanText: string) {
  return record.ledger.sourceAnnotations.find(row => row.sourceSpans.some(span => span.text === spanText));
}

function noExclusionLink(record: ReturnType<typeof v4Record>, annotationId: string) {
  return !record.readingContext.exclusions.some(row => row.intentIds.includes(annotationId));
}

function rejectableSource(record: ReturnType<typeof v4Record>) {
  const exact = sourceAnnotation(record, 'amertume');
  const materialQuestion = sourceAnnotation(record, 'mon houblon de jardin');
  const selected = [exact, materialQuestion, sourceAnnotation(record, 'poire')]
    .find((row): row is NonNullable<typeof row> => !!row && noExclusionLink(record, row.id));
  if (!selected) throw new Error('La fixture R20 doit offrir une annotation source non liée par une exclusion pour éprouver rejet puis restauration.');
  return selected;
}

describe('Page V5.5 — reprise V4 de la lecture R20', () => {
  it('upgrade V3 explicite, garde les exclusions et le résumé proposé, trace rejet/restauration, choix, reload et réexamen historique avec retry exact', async () => {
    const harness = pageHarness({ ownerKey: ownerA, workspaceId: workspaceA, mode: 'planning' });
    await harness.initialize();
    const legacySeed = await seedLegacyR20(harness);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    render(<HopV55Page services={harness.services} />);
    const activeArchive = await readR20(harness);
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(2));

    const initial = (await harness.stored())!;
    const originalRaw = structuredClone(initial.documentaryAnswers!.find(row => row.sourceReadingReference === activeArchive.contentReference)!);
    const v3 = v3Record(initial, activeArchive.contentReference);
    const originalArchiveRead = readHopV55DecisionReadingArchive(initial.decisionReadings![0]);
    expect(originalArchiveRead.status).toBe('available');
    if (originalArchiveRead.status !== 'available') throw new Error('Archive V2 source R20 attendue.');
    const originalArchive = originalArchiveRead.archive;
    expect(originalArchive.reading.intent.question).toBe(r20);
    expect(originalArchive.source).toEqual({ kind: 'recipe', id: harness.context.recipe!.id });
    expect(v3.sourceReadingReference).toBe(activeArchive.contentReference);
    expect(v3.answerSnapshot.requestSnapshot.originalQuestion).toBe(r20);
    expect(v3.answerSnapshot.requestSnapshot.propertyIntents.some(intent => intent.role === 'reportedObservation'
      && intent.property === 'sweetness')).toBe(true);
    expect(v3.answerSnapshot.requestSnapshot.propertyIntents.some(intent => intent.investigation?.kind === 'comparePerceptualCompensation')).toBe(true);
    expect(v3.answerSnapshot.requestSnapshot.propertyIntents.some(intent => intent.direction === 'increase'
      && intent.property === 'bitterness')).toBe(false);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(1);
    expect(initial.decisionReadings![0]).toEqual(legacySeed.archive);
    expect(simulate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les termes proposés et leurs décisions' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    let stored = (await harness.stored())!;
    const upgradedRaw = structuredClone(stored.documentaryAnswers![2]);
    const upgraded = latestV4Record(stored);
    const expectedExclusions = v3.answerSnapshot.requestSnapshot.exclusions;
    expect(upgraded).toMatchObject({ sourceReadingReference: activeArchive.contentReference,
      transition: { kind: 'upgradeV3', parentRecordReference: v3.reference, parentReadingReference: activeArchive.contentReference } });
    await assertV4Published(upgraded, { selectedReadingReference: activeArchive.contentReference,
      legacyReadingReference: originalArchive.contentReference, parentV3RecordReference: v3.reference });
    expect(upgraded.readingContext.exclusions).toEqual(expectedExclusions);
    expect(upgraded.readingContext.interpretation).toEqual(v3.answerSnapshot.requestSnapshot.interpretation);
    expect(upgraded.readingContext.interpretation.origin).toBe('proposal');
    expect(upgraded.ledger.sourceAnnotations.map(row => row.id)).toEqual(v3.answerSnapshot.requestSnapshot.propertyIntents.map(row => row.id));
    for (const annotation of upgraded.ledger.sourceAnnotations) for (const span of annotation.sourceSpans) {
      expect(r20.slice(span.start, span.end)).toBe(span.text);
    }
    expect(builder).toHaveBeenCalledTimes(2);
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();

    const term = rejectableSource(upgraded);
    const reason = 'Hors sujet pour cette question';
    fireEvent.click(screen.getByRole('button', { name: `Écarter « ${term.label} »` }));
    const rejectGroup = screen.getByRole('group', { name: `Écarter « ${term.label} »` });
    fireEvent.click(within(rejectGroup).getByLabelText(reason));
    fireEvent.click(within(rejectGroup).getByRole('button', { name: 'Écarter ce terme' }));
    expect(screen.getByRole('radio', { name: 'Actualiser le résumé proposé après confirmation' })).toBeChecked();
    harness.failNextWorkspaceSave();
    const savesBeforeFailedCorrection = harness.saveInputs.length;
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await screen.findAllByText('Échec transitoire du workspace fixture V4.');
    expect(harness.saveInputs).toHaveLength(savesBeforeFailedCorrection + 1);
    const failedCorrectionRaw = harness.saveInputs.at(-1)!.documentaryAnswers!.at(-1)!;
    expect((await harness.stored())?.documentaryAnswers).toHaveLength(3);
    const builderCallsBeforeRetry = builder.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la même correction' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(4));
    await screen.findByText('Nouvelle lecture conservée. La version précédente reste consultable dans les versions.');
    stored = (await harness.stored())!;
    const correctedRaw = stored.documentaryAnswers![3];
    const corrected = latestV4Record(stored);
    expect(failedCorrectionRaw).toEqual(correctedRaw);
    expect(corrected.transition).toMatchObject({ kind: 'revise', parentRecordReference: upgraded.reference,
      parentReadingReference: activeArchive.contentReference });
    expect(corrected.readingContext.exclusions).toEqual(expectedExclusions);
    expect(corrected.readingContext.interpretation).toMatchObject({ origin: 'proposal', version: 'hop-v55-property-advice-reading-v4' });
    expect(corrected.readingContext.interpretation.text).toContain('Constat rapporté : douce');
    expect(corrected.readingContext.interpretation.text).not.toContain('Question à examiner : amertume');
    const rejectedEntries = corrected.ledger.entries.filter(entry => entry.annotationId === term.id);
    expect(rejectedEntries.map(entry => entry.decision.kind)).toEqual(['initialize', 'reject']);
    expect(rejectedEntries[0].sourceAnnotation).toEqual(rejectedEntries[1].sourceAnnotation);
    expect(rejectedEntries[1].decision.reason).toBe(reason);
    expect(stored.documentaryAnswers![0]).toEqual(legacySeed.answer);
    expect(stored.documentaryAnswers![1]).toEqual(originalRaw);
    expect(stored.documentaryAnswers![2]).toEqual(upgradedRaw);
    expect(builder).toHaveBeenCalledTimes(builderCallsBeforeRetry);
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: `Restaurer « ${term.label} »` }));
    const restoreGroup = screen.getByRole('group', { name: `Restaurer « ${term.label} »` });
    fireEvent.click(within(restoreGroup).getByLabelText('Écarté par erreur'));
    fireEvent.click(within(restoreGroup).getByRole('button', { name: 'Restaurer ce terme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(5));
    stored = (await harness.stored())!;
    const restored = latestV4Record(stored);
    const termHistory = restored.ledger.entries.filter(entry => entry.annotationId === term.id);
    expect(termHistory.map(entry => entry.decision.kind)).toEqual(['initialize', 'reject', 'restore']);
    expect(termHistory[2].decision.predecessorEntryReference).toBe(termHistory[1].reference);
    expect(termHistory.every(entry => entry.sourceAnnotation)).toBe(true);
    expect(termHistory[0].sourceAnnotation).toEqual(termHistory[1].sourceAnnotation);
    expect(termHistory[1].sourceAnnotation).toEqual(termHistory[2].sourceAnnotation);
    expect(restored.readingContext.interpretation).toMatchObject({ origin: 'proposal', version: 'hop-v55-property-advice-reading-v4' });
    expect(restored.readingContext.interpretation.text).toContain('Question à examiner : amertume');
    expect(restored.readingContext.exclusions).toEqual(expectedExclusions);
    expect(stored.documentaryAnswers![0]).toEqual(legacySeed.answer);
    expect(stored.documentaryAnswers![1]).toEqual(originalRaw);
    expect(stored.documentaryAnswers![2]).toEqual(upgradedRaw);
    expect(builder).toHaveBeenCalledTimes(builderCallsBeforeRetry + 1);

    if (restored.outcome.kind !== 'domainAnswer') throw new Error('La restauration explicite doit rétablir la réponse documentaire.');
    const strategyIndex = restored.outcome.answerSnapshot.strategies.findIndex(strategy => strategy.preparation.documentaryDossier.status === 'available');
    if (strategyIndex < 0) throw new Error('La lecture R20 doit offrir une voie documentaire conservable.');
    const strategy = restored.outcome.answerSnapshot.strategies[strategyIndex];
    const way = [...document.querySelectorAll<HTMLDetailsElement>('details.hv4-way')]
      .find(element => element.textContent?.includes(strategy.title));
    if (!way) throw new Error(`Voie V4 visible absente : ${strategy.title}`);
    if (!way.open) fireEvent.click(way.querySelector('summary')!);
    expect(way.open).toBe(true);
    const dossierMotive = within(way).getByRole('textbox');
    fireEvent.change(dossierMotive, {
      target: { value: 'Comparer cette voie documentaire sans application au programme.' },
    });
    fireEvent.click(within(way).getByRole('button', { name: `Conserver la voie ${strategyIndex + 1} · ${strategy.title}` }));
    await waitFor(async () => expect((await harness.stored())?.documentaryDossiers).toHaveLength(1));
    stored = (await harness.stored())!;
    const dossierRead = readHopV55PropertyAdviceDossierRecordV4(stored.documentaryDossiers![0]);
    expect(dossierRead.status).toBe('readOnly');
    if (dossierRead.status !== 'readOnly') throw new Error('Dossier V4 de la voie conservée attendu.');
    expect(dossierRead.record).toMatchObject({ answerRecordReference: restored.reference,
      ledgerReference: restored.ledger.reference, strategyId: strategy.id, strategyReference: strategy.reference,
      dossierSnapshot: { motive: 'Comparer cette voie documentaire sans application au programme.' } });
    expect(builder).toHaveBeenCalledTimes(builderCallsBeforeRetry + 1);
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();

    const savesBeforeReload = harness.save.mock.calls.length;
    const parserBeforeReload = parser.mock.calls.length;
    const builderBeforeReload = builder.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Décider', exact: true }));
    await screen.findByLabelText('Motif du réexamen de cette version');
    expect(screen.getByText('Cette lecture est affichée en lecture seule.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmer la nouvelle lecture' })).not.toBeInTheDocument();
    expect(await harness.stored()).toEqual(stored);
    expect(harness.save).toHaveBeenCalledTimes(savesBeforeReload);
    expect(parser).toHaveBeenCalledTimes(parserBeforeReload);
    expect(builder).toHaveBeenCalledTimes(builderBeforeReload);
    expect(simulate).not.toHaveBeenCalled();

    // The first post-reload action is an explicit historical re-examination.
    // The original archive is read only; the real V4 controller then appends a
    // new archive before its V4 answer record, with a stable retry command.
    const reexamReason = 'Relire cette interprétation dans le contexte actif, sans relancer la question.';
    fireEvent.change(screen.getByLabelText('Motif du réexamen de cette version'), { target: { value: reexamReason } });
    harness.failNextWorkspaceSave();
    const saveStart = harness.saveInputs.length;
    const builderBeforeReexam = builder.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le réexamen de cette version' }));
    await screen.findByText('Échec transitoire du workspace fixture V4.');
    const failedReexamWorkspace = harness.saveInputs[saveStart];
    const failedReexamArchive = failedReexamWorkspace.decisionReadings?.find(row => !stored!.decisionReadings?.some(prior => prior.contentReference === row.contentReference));
    expect(failedReexamArchive).toBeDefined();
    expect((await harness.stored())?.decisionReadings).toEqual(stored.decisionReadings);
    expect(builder).toHaveBeenCalledTimes(builderBeforeReexam + 1);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le réexamen de cette version' }));
    await waitFor(async () => expect((await harness.stored())?.decisionReadings).toHaveLength(3));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(6));
    const reexaminedWorkspace = (await harness.stored())!;
    const savedReexamArchive = reexaminedWorkspace.decisionReadings!.find(row => row.contentReference !== originalArchive.contentReference
      && row.contentReference !== activeArchive.contentReference)!;
    expect(savedReexamArchive).toEqual(failedReexamArchive);
    const reexamArchiveRead = readHopV55DecisionReadingArchive(savedReexamArchive);
    expect(reexamArchiveRead.status).toBe('available');
    if (reexamArchiveRead.status !== 'available' || reexamArchiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error(`Un réexamen d’un record V4 issu de ${activeArchive.format} doit garder le format d’archive source; reçu ${reexamArchiveRead.status === 'available'
        ? reexamArchiveRead.archive.format : reexamArchiveRead.status}.`);
    }
    expect(reexamArchiveRead.archive.reading.intent.question).toBe(r20);
    expect(reexamArchiveRead.archive.source).toEqual(activeArchive.source);
    const reexamRecord = latestV4Record(reexaminedWorkspace);
    expect(reexamRecord).toMatchObject({ sourceReadingReference: reexamArchiveRead.archive.contentReference,
      transition: { kind: 'reexamine', parentRecordReference: restored.reference, parentReadingReference: activeArchive.contentReference,
        reason: reexamReason } });
    expect(reexamRecord.ledger).toEqual(restored.ledger);
    expect(reexamRecord.readingContext.interpretation).toEqual(restored.readingContext.interpretation);
    expect(reexamRecord.readingContext.exclusions).toEqual(restored.readingContext.exclusions);
    expect(reexaminedWorkspace.documentaryAnswers![0]).toEqual(legacySeed.answer);
    expect(reexaminedWorkspace.documentaryAnswers![1]).toEqual(originalRaw);
    expect(reexaminedWorkspace.documentaryAnswers![2]).toEqual(upgradedRaw);
    expect(reexaminedWorkspace.documentaryAnswers![4]).toEqual(stored.documentaryAnswers![4]);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(builderBeforeReexam + 1);
    expect(simulate).not.toHaveBeenCalled();
  }, 60000);

  it('ne présente pas un retour V4 incohérent comme un succès après le vrai commit, puis reprend le reçu même sans rebâtir', async () => {
    const harness = pageHarness({ ownerKey: ownerA, workspaceId: workspaceA, mode: 'planning' });
    await harness.initialize();
    const legacySeed = await seedLegacyR20(harness);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    const view = render(<HopV55Page services={harness.services} />);
    const activeArchive = await readR20(harness);
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les termes proposés et leurs décisions' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    const workspaceAfterUpgrade = (await harness.stored())!;
    const priorV3Record = v3Record(workspaceAfterUpgrade, activeArchive.contentReference);
    const upgraded = v4Record(workspaceAfterUpgrade);
    await assertV4Published(upgraded, { selectedReadingReference: activeArchive.contentReference,
      legacyReadingReference: legacySeed.archive.contentReference, parentV3RecordReference: priorV3Record.reference });
    const term = rejectableSource(upgraded);
    fireEvent.click(screen.getByRole('button', { name: `Écarter « ${term.label} »` }));
    const group = screen.getByRole('group', { name: `Écarter « ${term.label} »` });
    fireEvent.click(within(group).getByLabelText('Hors sujet pour cette question'));
    fireEvent.click(within(group).getByRole('button', { name: 'Écarter ce terme' }));

    const createRealController = propertyAdviceV4ControllerModule.createHopV55PropertyAdviceControllerV4;
    let corruptReturnOnce = true;
    let selectedCalls = 0;
    const wrappedFactory = vi.spyOn(propertyAdviceV4ControllerModule, 'createHopV55PropertyAdviceControllerV4')
      .mockImplementation(host => {
        const real = createRealController({ ...host, selected: (record, saved, historical) => {
          selectedCalls++;
          host.selected(record, saved, historical);
        } });
        return { ...real, correct: async request => {
          const committed = await real.correct(request);
          if (!corruptReturnOnce) return committed;
          corruptReturnOnce = false;
          // The real controller and workspace repository have already committed the exact record.
          // This wrapper corrupts only its returned value to exercise Page's receiving guard.
          return { ...committed, transition: { ...committed.transition, reason: `${committed.transition.reason} · altération de transport` } };
        } };
      });
    const writesBefore = harness.save.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));

    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(4));
    const committedWorkspace = (await harness.stored())!;
    const durable = latestV4Record(committedWorkspace);
    const durableRaw = structuredClone(committedWorkspace.documentaryAnswers!.at(-1));
    const durableRead = readHopV55DocumentaryAnswerRecord(durableRaw);
    expect(durableRead.status).toBe('readOnly');
    if (durableRead.status !== 'readOnly' || durableRead.record.format !== 'hop-v55-documentary-answer-record-v4') {
      throw new Error('Le record réellement commis par le contrôleur V4 doit rester lisible.');
    }
    expect(durable.transition).toMatchObject({ kind: 'revise', parentRecordReference: upgraded.reference,
      reason: expect.stringContaining('Hors sujet pour cette question') });
    expect(durable.reference).toBe(durableRead.record.reference);
    expect(harness.save.mock.calls.length).toBeGreaterThan(writesBefore);
    expect(screen.getAllByRole('alert').some(alert => /Le reçu reste conservé, mais cette lecture ne peut pas être affichée comme confirmée.*motif de la nouvelle version diffère/iu.test(alert.textContent ?? ''))).toBe(true);
    expect(screen.getAllByRole('alert').some(alert => alert.textContent?.includes('Le motif de la nouvelle version diffère de celui confirmé.'))).toBe(true);
    expect(screen.queryByText('Nouvelle lecture conservée. La version précédente reste consultable dans les versions.')).not.toBeInTheDocument();
    expect(selectedCalls).toBe(1);
    expect(screen.getByText('Une lecture conservée attend sa reprise')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer la même correction' })).toBeInTheDocument();

    const savesAfterCommit = harness.save.mock.calls.length;
    const builderCallsAfterCommit = builder.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la même correction' }));
    await screen.findByText('Nouvelle lecture et décisions conservées.');

    const recoveredWorkspace = (await harness.stored())!;
    expect(recoveredWorkspace.documentaryAnswers).toHaveLength(4);
    expect(recoveredWorkspace.documentaryAnswers!.at(-1)).toEqual(durableRaw);
    expect(latestV4Record(recoveredWorkspace).reference).toBe(durable.reference);
    expect(harness.save).toHaveBeenCalledTimes(savesAfterCommit);
    expect(builder).toHaveBeenCalledTimes(builderCallsAfterCommit);
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
    expect(wrappedFactory).toHaveBeenCalled();
    view.unmount();
  }, 45000);

  it('ne présente pas comme un succès dans B le reçu tardif d’une correction lancée dans A', async () => {
    const a = pageHarness({ ownerKey: ownerA, workspaceId: workspaceA, mode: 'planning' });
    const b = pageHarness({ ownerKey: ownerB, workspaceId: workspaceB, mode: 'unknown' });
    await Promise.all([a.initialize(), b.initialize()]);
    const legacySeedA = await seedLegacyR20(a);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    const view = render(<HopV55Page services={a.services} />);
    const activeArchive = await readR20(a);
    await waitFor(async () => expect((await a.stored())?.documentaryAnswers).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les termes proposés et leurs décisions' }));
    await waitFor(async () => expect((await a.stored())?.documentaryAnswers).toHaveLength(3));
    const upgraded = v4Record((await a.stored())!);
    const seedWorkspace = (await a.stored())!;
    const oldArchive = readHopV55DecisionReadingArchive(seedWorkspace.decisionReadings![0]);
    const priorV3 = v3Record(seedWorkspace, activeArchive.contentReference);
    if (oldArchive.status !== 'available') throw new Error('Archive V2 source legacy attendue.');
    await assertV4Published(upgraded, { selectedReadingReference: activeArchive.contentReference,
      legacyReadingReference: legacySeedA.archive.contentReference, parentV3RecordReference: priorV3.reference });
    const term = rejectableSource(upgraded);
    fireEvent.click(screen.getByRole('button', { name: `Écarter « ${term.label} »` }));
    const group = screen.getByRole('group', { name: `Écarter « ${term.label} »` });
    fireEvent.click(within(group).getByLabelText('Hors sujet pour cette question'));
    fireEvent.click(within(group).getByRole('button', { name: 'Écarter ce terme' }));
    const delayed = a.holdNextWorkspaceSave();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await delayed.entered;

    view.rerender(<HopV55Page services={b.services} />);
    await waitFor(() => expect(screen.getByTestId('hop-v55')).toHaveAttribute('data-owner-key', ownerB));
    await screen.findByText('Explorer sans recette');
    delayed.release();
    await delayed.committed;

    const storedB = await b.stored();
    expect(storedB?.documentaryAnswers).toBeUndefined();
    expect(storedB?.decisionReadings).toBeUndefined();
    expect(screen.queryByText('Nouvelle lecture conservée. La version précédente reste consultable dans les versions.')).not.toBeInTheDocument();
    const storedA = await a.stored();
    expect(storedA?.documentaryAnswers).toHaveLength(4);
    expect(latestV4Record(storedA!).transition).toMatchObject({ kind: 'revise', parentRecordReference: upgraded.reference });
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(3);
    expect(simulate).not.toHaveBeenCalled();
  }, 45000);
});

