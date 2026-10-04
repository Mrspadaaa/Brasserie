import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as brewingScenarioDomain from '../../src/domain/brewingScenario';
import * as decisionService from '../../src/services/hopV55/decision';
import { readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import { readHopV55PropertyAdviceDossierRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { HopV55Page } from '../../src/ui/hopV55/Page';
import {
  pageHarness,
  pagePropertyAdviceV4OwnerA as ownerA,
  pagePropertyAdviceV4R20 as r20,
  pagePropertyAdviceV4WorkspaceA as workspaceA,
} from '../fixtures/hopV55PropertyAdvicePageHarness';

// Keep the real Page, parser, V3/V4 controllers, V4 UI and repositories in play.
// Only unrelated panels stay out of this integration path.
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

function readQuestion() {
  return screen.findByRole('textbox', { name: 'Question au brasseur' }).then(async field => {
    fireEvent.change(field, { target: { value: r20 } });
    fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
    await screen.findByText('Conseil documentaire · V3');
  });
}

function answerV4Records(workspace: HopV55Workspace) {
  return (workspace.documentaryAnswers ?? []).flatMap(raw => {
    const read = readHopV55DocumentaryAnswerRecord(raw);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4' ? [read.record] : [];
  });
}

function answerV4(workspace: HopV55Workspace, reference?: string) {
  const record = answerV4Records(workspace).find(row => reference ? row.reference === reference : true);
  if (!record) throw new Error('Version V4 exacte attendue dans le workspace mémoire.');
  return record;
}

function latestAnswerV4(workspace: HopV55Workspace) {
  const record = answerV4Records(workspace).at(-1);
  if (!record) throw new Error('Tête V4 exacte attendue dans le workspace mémoire.');
  return record;
}

function dispositionCounts(record: ReturnType<typeof latestAnswerV4>) {
  const latest = new Map<string, typeof record.ledger.entries[number]>();
  for (const entry of record.ledger.entries) latest.set(entry.annotationId, entry);
  return {
    active: [...latest.values()].filter(row => row.disposition === 'active').length,
    rejected: [...latest.values()].filter(row => row.disposition === 'rejected').length,
  };
}

function rejectableAnnotation(record: ReturnType<typeof latestAnswerV4>) {
  const hasNoExclusionLink = (annotationId: string) => !record.readingContext.exclusions.some(row => row.intentIds.includes(annotationId));
  const intent = [
    record.ledger.sourceAnnotations.find(row => row.sourceSpans.some(span => span.text === 'amertume')),
    record.ledger.sourceAnnotations.find(row => row.sourceSpans.some(span => span.text === 'mon houblon de jardin')),
    record.ledger.sourceAnnotations.find(row => row.sourceSpans.some(span => span.text === 'poire')),
  ].find((row): row is NonNullable<typeof row> => !!row && hasNoExclusionLink(row.id));
  if (!intent) throw new Error('Annotation source exacte de la fixture R20 absente.');
  const latest = [...record.ledger.entries].reverse().find(row => row.annotationId === intent.id);
  if (!latest || latest.disposition !== 'active') throw new Error('Le terme source retenu doit pouvoir être écarté une fois.');
  return intent;
}

function localDateTime(value: string): string {
  return new Date(value).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' });
}

function globalHistoryArticle(reference: string) {
  const button = screen.getAllByRole('button', { name: 'Relire cette correction documentaire' })
    .find(row => row.closest('article')?.textContent?.includes(reference));
  if (!button) throw new Error(`Réponse V4 ${reference} absente de l’historique global.`);
  return button;
}

function exactV4VersionRow(reference: string) {
  const row = [...document.querySelectorAll('.hv4-version-list > li')].find(item =>
    [...item.querySelectorAll('code')].some(code => code.textContent === `Version · ${reference}`));
  if (!row) throw new Error(`Version interne exacte ${reference} absente de la liste V4.`);
  return row;
}

describe('Page V5.5 — identité de version affichée dans le réexamen V4 externe', () => {
  it('réexamine B affichée depuis A dans l’historique, conserve parent/registre/texte/dossiers et relit cette lignée sans recalcul', async () => {
    const harness = pageHarness({ ownerKey: ownerA, workspaceId: workspaceA, mode: 'planning' });
    await harness.initialize();
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    const view = render(<HopV55Page services={harness.services} />);

    await readQuestion();
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(1));
    const sourceWorkspace = (await harness.stored())!;
    const sourceArchiveRead = readHopV55DecisionReadingArchive(sourceWorkspace.decisionReadings?.[0]);
    expect(sourceArchiveRead.status).toBe('available');
    if (sourceArchiveRead.status !== 'available') throw new Error('Archive source R20 exacte attendue.');
    const sourceArchive = sourceArchiveRead.archive;
    const sourceArchiveRaw = structuredClone(sourceWorkspace.decisionReadings?.[0]);
    if (!sourceArchiveRaw) throw new Error('Archive source R20 brute attendue.');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les termes proposés et leurs décisions' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(2));
    await screen.findByText('Reprise d’une réponse antérieure');

    const upgraded = latestAnswerV4((await harness.stored())!);
    expect(dispositionCounts(upgraded)).toEqual({ active: 5, rejected: 0 });
    const term = rejectableAnnotation(upgraded);
    fireEvent.click(screen.getByRole('button', { name: `Écarter « ${term.label} »` }));
    const rejectGroup = screen.getByRole('group', { name: `Écarter « ${term.label} »` });
    fireEvent.click(within(rejectGroup).getByLabelText('Hors sujet pour cette question'));
    fireEvent.click(within(rejectGroup).getByRole('button', { name: 'Écarter ce terme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    const workspaceAfterA = (await harness.stored())!;
    const A = latestAnswerV4(workspaceAfterA);
    expect(dispositionCounts(A)).toEqual({ active: 4, rejected: 1 });
    const rawA = structuredClone(workspaceAfterA.documentaryAnswers!.find(row => row.reference === A.reference));
    if (!rawA) throw new Error('Archive A manquante après confirmation.');

    if (A.outcome.kind !== 'domainAnswer') throw new Error('La correction A doit garder au moins une réponse.');
    const strategyIndex = A.outcome.answerSnapshot.strategies.findIndex(strategy => strategy.preparation.documentaryDossier.status === 'available');
    if (strategyIndex < 0) throw new Error('La version A doit offrir une voie documentaire conservable comme dans le témoin R21.');
    const strategyA = A.outcome.answerSnapshot.strategies[strategyIndex];
    const wayA = [...document.querySelectorAll<HTMLDetailsElement>('details.hv4-way')]
      .find(element => element.textContent?.includes(strategyA.title));
    if (!wayA) throw new Error(`Voie de la version A absente de l’écran : ${strategyA.title}`);
    if (!wayA.open) fireEvent.click(wayA.querySelector('summary')!);
    fireEvent.change(within(wayA).getByRole('textbox'), { target: { value: 'Dossier de la version A, conservé sans application.' } });
    fireEvent.click(within(wayA).getByRole('button', { name: `Conserver la voie ${strategyIndex + 1} · ${strategyA.title}` }));
    await waitFor(async () => expect((await harness.stored())?.documentaryDossiers).toHaveLength(1));
    const storedWithDossierA = (await harness.stored())!;
    const dossierRawA = structuredClone(storedWithDossierA.documentaryDossiers![0]);
    const dossierReadA = readHopV55PropertyAdviceDossierRecordV4(dossierRawA);
    expect(dossierReadA.status).toBe('readOnly');
    if (dossierReadA.status !== 'readOnly') throw new Error('Dossier V4 de A exact attendu.');
    expect(dossierReadA.record.answerRecordReference).toBe(A.reference);

    fireEvent.click(screen.getByRole('button', { name: `Restaurer « ${term.label} »` }));
    const restoreGroup = screen.getByRole('group', { name: `Restaurer « ${term.label} »` });
    fireEvent.click(within(restoreGroup).getByLabelText('Écarté par erreur'));
    fireEvent.click(within(restoreGroup).getByRole('button', { name: 'Restaurer ce terme' }));
    const personalSummary = 'Résumé personnel de B : garder la poire et examiner la compensation sans présumer son efficacité.';
    fireEvent.click(screen.getByRole('radio', { name: 'Le formuler moi-même' }));
    fireEvent.change(screen.getByLabelText('Résumé de lecture formulé par toi'), { target: { value: personalSummary } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(4));
    const workspaceAfterB = (await harness.stored())!;
    const B = latestAnswerV4(workspaceAfterB);
    expect(dispositionCounts(B)).toEqual({ active: 5, rejected: 0 });
    expect(B.readingContext.interpretation).toMatchObject({ origin: 'user', text: personalSummary });
    const rawB = structuredClone(workspaceAfterB.documentaryAnswers!.find(row => row.reference === B.reference));
    if (!rawB) throw new Error('Archive B manquante après restauration.');
    const rawDossiersBeforeReexam = structuredClone(workspaceAfterB.documentaryDossiers);
    expect(workspaceAfterB.documentaryAnswers!.find(row => row.reference === A.reference)).toEqual(rawA);
    expect(workspaceAfterB.documentaryDossiers).toEqual([dossierRawA]);
    expect(parser).toHaveBeenCalledTimes(1);
    expect(simulate).not.toHaveBeenCalled();

    // Reload first, then navigate globally to A as in the R21 reproduction.
    const parserBeforeReload = parser.mock.calls.length;
    const builderBeforeReload = builder.mock.calls.length;
    const savesBeforeReload = harness.save.mock.calls.length;
    view.unmount();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    const historySummary = await screen.findByText(/Réponses et dossiers documentaires/);
    if (!historySummary.closest('details')?.open) fireEvent.click(historySummary);
    fireEvent.click(globalHistoryArticle(A.reference));
    await screen.findByText('Correction exacte rouverte en lecture figée. Aucun conseil reconstruit.');
    expect(screen.getByLabelText('Question au brasseur')).toHaveValue(r20);
    expect(parser).toHaveBeenCalledTimes(parserBeforeReload);
    expect(builder).toHaveBeenCalledTimes(builderBeforeReload);
    expect(harness.save).toHaveBeenCalledTimes(savesBeforeReload);

    const versionList = document.querySelector('.hv4-version-list');
    if (!versionList) throw new Error('Le panneau V4 doit montrer ses versions internes après l’ouverture globale de A.');
    const bRow = exactV4VersionRow(B.reference);
    const aRow = exactV4VersionRow(A.reference);
    expect(aRow).toHaveTextContent('Affichée');
    fireEvent.click(within(bRow).getByRole('button', { name: 'Relire cette version' }));

    await waitFor(() => {
      const title = screen.getByText('Réexaminer cette version dans la source active');
      const pageForm = title.closest('.hv-archive-banner');
      expect(pageForm).not.toBeNull();
      expect(pageForm).toHaveTextContent(localDateTime(B.transition.recordedAt));
      expect(pageForm).toHaveTextContent('résumé déclaré');
      expect(pageForm).toHaveTextContent(personalSummary);
    });
    const pageForm = screen.getByText('Réexaminer cette version dans la source active').closest('.hv-archive-banner')!;
    fireEvent.click(within(pageForm).getByText('Identité de la version visée'));
    expect(pageForm).toHaveTextContent(B.reference);
    expect(pageForm).toHaveTextContent(B.ledger.reference);
    const reexamReason = 'Relire B, garder ses cinq termes et son résumé personnel.';
    fireEvent.change(screen.getByLabelText('Motif du réexamen de cette version'), { target: { value: reexamReason } });
    expect(screen.getByLabelText('Motif du réexamen de cette version')).toHaveValue(reexamReason);
    const buildersBeforeReexam = builder.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le réexamen de cette version' }));

    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(5));
    const afterReexam = (await harness.stored())!;
    const reexamined = latestAnswerV4(afterReexam);
    expect(reexamined.transition).toMatchObject({ kind: 'reexamine', parentRecordReference: B.reference,
      parentReadingReference: B.sourceReadingReference, reason: reexamReason });
    expect(reexamined.sourceReadingReference).not.toBe(B.sourceReadingReference);
    expect(reexamined.originalQuestion).toBe(r20);
    expect(reexamined.ledger).toEqual(B.ledger);
    expect(reexamined.readingContext.interpretation).toEqual(B.readingContext.interpretation);
    expect(reexamined.readingContext.exclusions).toEqual(B.readingContext.exclusions);
    expect(reexamined.readingContext.candidatePolicy).toEqual(B.readingContext.candidatePolicy);
    expect(afterReexam.documentaryAnswers!.find(row => row.reference === A.reference)).toEqual(rawA);
    expect(afterReexam.documentaryAnswers!.find(row => row.reference === B.reference)).toEqual(rawB);
    expect(afterReexam.documentaryDossiers).toEqual(rawDossiersBeforeReexam);
    expect(afterReexam.decisionReadings!.find(row => row.contentReference === sourceArchive.contentReference)).toEqual(sourceArchiveRaw);
    expect(builder).toHaveBeenCalledTimes(buildersBeforeReexam + 1);
    expect(parser).toHaveBeenCalledTimes(parserBeforeReload);
    expect(simulate).not.toHaveBeenCalled();

    const reexamArchiveRaw = afterReexam.decisionReadings?.find(row => row.contentReference === reexamined.sourceReadingReference);
    if (!reexamArchiveRaw) throw new Error('Archive de lecture V2 du réexamen B attendue.');
    const reexamArchive = readHopV55DecisionReadingArchive(reexamArchiveRaw);
    expect(reexamArchive.status).toBe('available');
    if (reexamArchive.status !== 'available') throw new Error('Archive exacte du réexamen illisible.');
    expect(reexamArchive.archive.reading.intent.question).toBe(r20);
    expect(reexamArchive.archive.reading.response).toBeUndefined();
    expect(reexamArchive.archive.reading.branches).toEqual([]);
    expect(reexamArchive.archive.source).toEqual(sourceArchive.source);

    // A reload shows the persisted new lineage and does not parse or rebuild it.
    const parserCallsAfterCommit = parser.mock.calls.length;
    const builderCallsAfterCommit = builder.mock.calls.length;
    const savesAfterCommit = harness.save.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    const reexamHistorySummary = await screen.findByText(/Réponses et dossiers documentaires/);
    if (!reexamHistorySummary.closest('details')?.open) fireEvent.click(reexamHistorySummary);
    fireEvent.click(globalHistoryArticle(reexamined.reference));
    await screen.findByText(/Contexte relu pour cette version/);
    expect(screen.getByText(reexamReason)).toBeInTheDocument();
    expect(screen.getAllByText(personalSummary).length).toBeGreaterThan(0);
    expect((await harness.stored())!.decisionReadings!.find(row => row.contentReference === sourceArchive.contentReference)).toEqual(sourceArchiveRaw);
    expect(harness.save).toHaveBeenCalledTimes(savesAfterCommit);
    expect(parser).toHaveBeenCalledTimes(parserCallsAfterCommit);
    expect(builder).toHaveBeenCalledTimes(builderCallsAfterCommit);
    expect(simulate).not.toHaveBeenCalled();
  }, 90000);
});
