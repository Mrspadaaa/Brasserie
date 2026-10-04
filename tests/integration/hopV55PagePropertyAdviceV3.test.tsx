import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as decisionService from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive, type HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryDossierRecord } from '../../src/services/hopV55/documentaryRecords';
import { readHopV55PropertyAdviceDossierRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceControllerV3 } from '../../src/services/hopV55/propertyAdviceControllerV3';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';

// Keep the real Page, parser, V3 controller callbacks, archive readers and property-advice panel.
// Unrelated panels are isolated so this test exercises the decision path only.
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

import { HopV55Page } from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'fixture:property-advice-page-v3-owner';
const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';

function pageHarness(seedQuestion = '') {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const workspaceId = 'workspace:property-advice-page-v3-legacy';
  const legacyReading = seedQuestion ? decisionService.readHopV55Question(seedQuestion, prepared) : undefined;
  const legacyArchive = legacyReading && context.recipe ? createHopV55DecisionReadingArchiveV2({
    id: 'legacy-v2:property-advice-page-v3', ownerKey, workspaceId, recordedAt: '2026-10-03T10:00:00.000Z',
    reading: legacyReading, source: { kind: 'recipe', id: context.recipe.id },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  }) : undefined;
  let stored: HopV55Workspace | undefined = legacyReading && legacyArchive ? {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0, title: 'Conseil legacy V2 · fixture',
    intent: { question: seedQuestion, criteria: legacyReading.intent.criteria }, sourceRecipeId: context.recipe?.id,
    decisionReadings: [legacyArchive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T10:00:00.000Z',
  } : undefined;
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    if ((stored?.revision ?? null) !== expectedRevision) {
      throw Object.assign(new Error('staleRevision'), { code: 'staleRevision' });
    }
    stored = { ...structuredClone(next), revision: (stored?.revision ?? 0) + 1 };
    return structuredClone(stored);
  });
  const read = vi.fn(async (_owner: string, id: string) => stored?.id === id ? structuredClone(stored) : null);
  const services = {
    scope: 'fixture' as const, ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    workspaces: { list: vi.fn(async () => stored ? [structuredClone(stored)] : []), read, save },
    scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;
  return { context, prepared, legacyArchive, services, save, read, get stored() { return stored; } };
}

async function rereadLegacyQuestion(harness: ReturnType<typeof pageHarness>) {
  if (!harness.legacyArchive) throw new Error('Archive V2 legacy attendue.');
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue(question));
  fireEvent.click(screen.getByRole('button', { name: 'Décider', exact: true }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' })).toBeInTheDocument());
  fireEvent.click(await screen.findByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
  await waitFor(() => expect(harness.stored?.decisionReadings).toHaveLength(2));
  await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(1));
  await screen.findByText('Conseil documentaire · V3');
  const answer = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![0]);
  if (answer.status !== 'readOnly' || answer.record.format !== 'hop-v55-documentary-answer-record-v3') throw new Error('Réponse V3 de relecture legacy attendue.');
  const archive = activeReading(harness, answer.record.sourceReadingReference);
  return { archive, answer: answer.record };
}

function activeReading(h: ReturnType<typeof pageHarness>, contentReference: string) {
  const raw = h.stored?.decisionReadings?.find(row => row.contentReference === contentReference);
  const read = raw && readHopV55DecisionReadingArchive(raw);
  if (!read || read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v2') {
    throw new Error('Lecture V2 exacte attendue dans le dossier fixture.');
  }
  return read.archive;
}

/** Second local actor uses the same V3 service and DAO callbacks to create a real concurrent head. */
function concurrentController(h: ReturnType<typeof pageHarness>, sourceReadingReference: string) {
  const prepared = prepareBrewingScenarioContext(h.context);
  return createHopV55PropertyAdviceControllerV3({
    services: { ownerKey, scope: 'fixture' }, enabled: () => true, historical: () => false,
    reading: () => activeReading(h, sourceReadingReference), context: async () => structuredClone(h.context),
    workspace: async () => {
      const workspace = h.stored;
      if (!workspace) throw new Error('Le dossier fixture a disparu.');
      return structuredClone(workspace);
    },
    save: next => h.services.workspaces.save(next, next.revision),
    source: (workspace): HopV55DecisionReadingSource => workspace.sourceBatchId
      ? { kind: 'batch', id: workspace.sourceBatchId }
      : workspace.sourceRecipeId ? { kind: 'recipe', id: workspace.sourceRecipeId } : { kind: 'exploration' },
    runtimeReference: value => hopV55ScenarioRuntimeReference(value.runtime),
    selected: () => undefined, activated: () => undefined,
  });
}

describe('Page V5.5 — parcours V3 du conseil par propriétés', () => {
  it('conserve Q10, corrige une annotation, archive un dossier, relit sans recalcul puis réexamine en nouvelle lignée', async () => {
    const harness = pageHarness(question);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');

    render(<HopV55Page services={harness.services} />);
    const { archive: initialArchive } = await rereadLegacyQuestion(harness);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(1);

    const initialWorkspace = harness.stored!;
    const initialRead = readHopV55DocumentaryAnswerRecord(initialWorkspace.documentaryAnswers![0]);
    expect(initialRead.status).toBe('readOnly');
    if (initialRead.status !== 'readOnly' || initialRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 initiale attendue.');
    }
    const initial = initialRead.record;
    expect(initialArchive.reading.intent.question).toBe(question);
    expect(initialArchive.reading.branches).toEqual([]);
    expect(initial.answerSnapshot.requestSnapshot.candidatePolicy).toMatchObject({ kind: 'explicit', materialIds: [] });
    const observation = initial.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness');
    const compensation = initial.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.label === 'compenser');
    expect(observation).toBeDefined();
    expect(compensation).toMatchObject({ role: 'investigation', property: 'sweetness', direction: 'investigate',
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation!.id] } });
    expect(screen.queryByRole('button', { name: 'Chercher des options dans le catalogue chargé' })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    fireEvent.click(screen.getByText(/Accès aux portions/));
    fireEvent.click(screen.getAllByText('Corriger cet accès par une nouvelle déclaration')[1]);
    fireEvent.change(screen.getByLabelText('État d’accès Échantillon'), { target: { value: 'unknown' } });
    fireEvent.change(screen.getByLabelText('Motif d’accès Échantillon'), { target: { value: 'Une annotation conserve explicitement l’accès inconnu; elle ne crée pas une permission.' } });
    const preserveUnknownButton = screen.getAllByRole('button', { name: 'Conserver l’accès inconnu dans la correction' })
      .find(button => !(button as HTMLButtonElement).disabled);
    expect(preserveUnknownButton).toBeDefined();
    fireEvent.click(preserveUnknownButton!);
    fireEvent.change(screen.getByLabelText('Lecture corrigée'), { target: { value: 'La compensation reste une question à examiner; accès au prélèvement déclaré.' } });
    fireEvent.change(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), { target: { value: 'Ajouter une annotation locale sur l’accès au prélèvement.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));

    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(2));
    const afterCorrection = harness.stored!;
    const correctedRead = readHopV55DocumentaryAnswerRecord(afterCorrection.documentaryAnswers![1]);
    expect(correctedRead.status).toBe('readOnly');
    if (correctedRead.status !== 'readOnly' || correctedRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 corrigée attendue.');
    }
    const corrected = correctedRead.record;
    expect(afterCorrection.documentaryAnswers![0]).toEqual(initialWorkspace.documentaryAnswers![0]);
    expect(corrected.revisionContext).toMatchObject({ sourceAnswerRecordReference: initial.reference,
      sourceAnswerReference: initial.answerReference, reason: 'Ajouter une annotation locale sur l’accès au prélèvement.' });
    expect(corrected.answerSnapshot.requestSnapshot.context.access.sampling).toMatchObject({ state: 'unknown',
      basis: 'Une annotation conserve explicitement l’accès inconnu; elle ne crée pas une permission.', assertionIds: [] });
    expect(corrected.answerSnapshot.requestSnapshot.context.assertions)
      .toEqual(initial.answerSnapshot.requestSnapshot.context.assertions);
    expect(corrected.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.label === 'compenser')?.investigation)
      .toEqual(compensation!.investigation);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(2);

    const correctedRaw = structuredClone(afterCorrection.documentaryAnswers![1]);
    const dossierReason = await screen.findAllByRole('textbox', { name: 'Pourquoi conserver ce dossier documentaire ?' });
    fireEvent.change(dossierReason[0], { target: { value: 'Comparer cette réponse sans la traiter comme une intervention.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Conserver ce dossier documentaire' })[0]);
    await waitFor(() => expect(harness.stored?.documentaryDossiers).toHaveLength(1));
    const dossierRead = readHopV55DocumentaryDossierRecord(harness.stored!.documentaryDossiers![0]);
    expect(dossierRead.status).toBe('readOnly');
    if (dossierRead.status !== 'readOnly' || dossierRead.record.format !== 'hop-v55-documentary-dossier-record-v3') {
      throw new Error('Dossier V3 archivé attendu.');
    }
    const dossierV3 = readHopV55PropertyAdviceDossierRecordV3(harness.stored!.documentaryDossiers![0]);
    expect(dossierV3.status).toBe('readOnly');
    if (dossierV3.status !== 'readOnly') throw new Error('Lecteur de dossier V3 attendu.');
    expect(dossierV3.record.answerRecordReference).toBe(corrected.reference);
    expect(dossierV3.record.answerReference).toBe(corrected.answerReference);

    const savesBeforeReload = harness.save.mock.calls.length;
    const readsBeforeReload = parser.mock.calls.length;
    const buildsBeforeReload = builder.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(screen.getByText(/Réponses et dossiers documentaires · 2/));
    const rereadButtons = await screen.findAllByRole('button', { name: 'Relire cette réponse documentaire', exact: true });
    fireEvent.click(rereadButtons[rereadButtons.length - 1]);
    await screen.findByText('Conseil documentaire · V3');
    expect(screen.getByRole('heading', { name: 'Réponse documentaire' })).toBeInTheDocument();
    expect(builder).toHaveBeenCalledTimes(buildsBeforeReload);
    expect(parser).toHaveBeenCalledTimes(readsBeforeReload);
    expect(harness.save).toHaveBeenCalledTimes(savesBeforeReload);
    expect(harness.stored!.documentaryAnswers![0]).toEqual(initialWorkspace.documentaryAnswers![0]);
    expect(harness.stored!.documentaryAnswers![1]).toEqual(correctedRaw);
    expect(readHopV55DocumentaryDossierRecord(harness.stored!.documentaryDossiers![0])).toEqual(dossierRead);

    fireEvent.click(screen.getByRole('button', { name: 'Réexaminer ces annotations dans le contexte actif' }));
    await waitFor(() => expect(harness.stored?.decisionReadings).toHaveLength(3));
    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(3));
    const reexaminedReading = activeReading(harness, harness.stored!.decisionReadings!.at(-1)!.contentReference);
    expect(reexaminedReading.contentReference).not.toBe(initialArchive.contentReference);
    expect(reexaminedReading.reading.intent.question).toBe(question);
    expect(reexaminedReading.reading.response).toBeUndefined();
    expect(reexaminedReading.reading.branches).toEqual([]);
    const reexaminedRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![2]);
    expect(reexaminedRead.status).toBe('readOnly');
    if (reexaminedRead.status !== 'readOnly' || reexaminedRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 issue du réexamen attendue.');
    }
    expect(reexaminedRead.record.reexaminationContext).toMatchObject({ sourceAnswerRecordReference: corrected.reference,
      sourceAnswerReference: corrected.answerReference, sourceReadingReference: initialArchive.contentReference });
    expect(harness.stored!.decisionReadings![0]).toEqual(initialWorkspace.decisionReadings![0]);
    expect(harness.stored!.documentaryAnswers![0]).toEqual(initialWorkspace.documentaryAnswers![0]);
    expect(harness.stored!.documentaryAnswers![1]).toEqual(correctedRaw);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(buildsBeforeReload + 1);
  });

  it('passe de explicit[] à discover uniquement après le clic de recherche et garde les IDs exacts', async () => {
    const harness = pageHarness(question);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    render(<HopV55Page services={harness.services} />);
    const { archive: activeArchive } = await rereadLegacyQuestion(harness);
    const initialRaw = structuredClone(harness.stored!.documentaryAnswers![0]);
    const initialRead = readHopV55DocumentaryAnswerRecord(initialRaw);
    expect(initialRead.status).toBe('readOnly');
    if (initialRead.status !== 'readOnly' || initialRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 initiale attendue.');
    }
    expect(initialRead.record.answerSnapshot.requestSnapshot.candidatePolicy).toMatchObject({ kind: 'explicit', materialIds: [] });
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Chercher des options dans le catalogue chargé' }));
    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(2));
    const discoveredRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![1]);
    expect(discoveredRead.status).toBe('readOnly');
    if (discoveredRead.status !== 'readOnly' || discoveredRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 de découverte attendue.');
    }
    expect(discoveredRead.record.answerSnapshot.requestSnapshot.candidatePolicy.kind).toBe('discover');
    expect(discoveredRead.record.answerSnapshot.requestSnapshot.candidatePolicy.materialIds)
      .toEqual(prepareBrewingScenarioContext(harness.context).runtime.materials.map(row => row.id));
    expect(harness.stored!.documentaryAnswers![0]).toEqual(initialRaw);
    // Discovery changes the candidate policy of the archived request; it does
    // not parse the retained question again.
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(2);
  });

  it('archive une attestation positive d’accès seulement après une déclaration personnelle explicite', async () => {
    const harness = pageHarness(question);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    render(<HopV55Page services={harness.services} />);
    await rereadLegacyQuestion(harness);
    const before = structuredClone(harness.stored!.documentaryAnswers![0]);
    fireEvent.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    fireEvent.click(screen.getByText(/Accès aux portions/));
    fireEvent.click(screen.getAllByText('Corriger cet accès par une nouvelle déclaration')[1]);
    fireEvent.change(screen.getByLabelText('État d’accès Échantillon'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText('Motif d’accès Échantillon'), { target: { value: 'Le brasseur déclare un prélèvement distinct.' } });
    fireEvent.change(screen.getByLabelText('Déclaration d’accès Échantillon'), { target: { value: 'Le brasseur confirme disposer d’un prélèvement pour cette lecture.' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Mode de source'), { target: { value: 'personal' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Titre de la déclaration'), { target: { value: 'Déclaration d’accès fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Acteur de la déclaration'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Motif de la déclaration'), { target: { value: 'Annotation locale de test; aucune donnée externe.' } });
    const addAssertionButton = screen.getAllByRole('button', { name: 'Ajouter cette attestation à la lecture' })
      .find(button => !(button as HTMLButtonElement).disabled);
    expect(addAssertionButton).toBeDefined();
    fireEvent.click(addAssertionButton!);
    expect(await screen.findByText(/Nouvelle attestation ajoutée à la lecture à valider/u)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lecture corrigée'), { target: { value: 'Le prélèvement est déclaré accessible dans cette lecture.' } });
    fireEvent.change(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), { target: { value: 'Ajouter une attestation locale explicite pour l’accès au prélèvement.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));

    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(2));
    expect(harness.stored!.documentaryAnswers![0]).toEqual(before);
    const correctedRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![1]);
    expect(correctedRead.status).toBe('readOnly');
    if (correctedRead.status !== 'readOnly' || correctedRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 corrigée attendue.');
    }
    const request = correctedRead.record.answerSnapshot.requestSnapshot;
    const access = request.context.access.sampling;
    expect(access.state).toBe('yes');
    expect(access.assertionIds).toHaveLength(1);
    const assertion = request.context.assertions.find(row => row.id === access.assertionIds[0]);
    expect(assertion).toMatchObject({ subject: 'sampling', state: 'reported', value: true, dimension: 'process' });
    expect(assertion?.source?.reference).toMatch(/^local-declaration:/u);
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(2);

    // A is a source-backed personal declaration. Re-examination must not carry it into the new context.
    const answerA = correctedRead.record;
    fireEvent.click(screen.getByRole('button', { name: 'Réexaminer ces annotations dans le contexte actif' }));
    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(3));
    const answerBRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![2]);
    expect(answerBRead.status).toBe('readOnly');
    if (answerBRead.status !== 'readOnly' || answerBRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse B réexaminée attendue.');
    }
    const answerB = answerBRead.record;
    expect(answerB.reexaminationContext).toMatchObject({ sourceAnswerRecordReference: answerA.reference,
      sourceAnswerReference: answerA.answerReference, sourceReadingReference: answerA.sourceReadingReference });
    expect(answerB.answerSnapshot.requestSnapshot.interpretation.text).toBe('Le prélèvement est déclaré accessible dans cette lecture.');
    expect(answerB.answerSnapshot.requestSnapshot.context.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(harness.stored!.documentaryAnswers![1]).not.toEqual(harness.stored!.documentaryAnswers![0]);
    const noticeB = await screen.findByLabelText('Contexte de cette lecture');
    expect(noticeB).toHaveTextContent('Contexte relu pour ce réexamen');
    expect(noticeB).toHaveTextContent('Accès à préciser pour cette question : lot de bière, prélèvement, portion séparée.');
    expect(screen.getByRole('button', { name: 'Préciser les accès de cette lecture' })).toBeInTheDocument();
    // Re-examination keeps the exact archived interpretation and scopes.
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(3);

    // C revises only the free-text interpretation. The provenance badge must follow B through the revision link.
    fireEvent.click(screen.getByRole('button', { name: 'Préciser les accès de cette lecture' }));
    fireEvent.change(screen.getByLabelText('Lecture corrigée'), { target: { value: 'La compensation reste à examiner; l’accès au prélèvement reste inconnu.' } });
    fireEvent.change(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), { target: { value: 'Corriger le texte sans déclarer l’accès.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(4));
    const answerCRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![3]);
    expect(answerCRead.status).toBe('readOnly');
    if (answerCRead.status !== 'readOnly' || answerCRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse C révisée attendue.');
    }
    const answerC = answerCRead.record;
    expect(answerC.revisionContext).toMatchObject({ sourceAnswerRecordReference: answerB.reference,
      sourceAnswerReference: answerB.answerReference, reason: 'Corriger le texte sans déclarer l’accès.' });
    expect(answerC.answerSnapshot.requestSnapshot.interpretation.text)
      .toBe('La compensation reste à examiner; l’accès au prélèvement reste inconnu.');
    expect(answerC.answerSnapshot.requestSnapshot.context.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
    const noticeC = await screen.findByLabelText('Contexte de cette lecture');
    expect(noticeC).toHaveTextContent('Contexte relu pour ce réexamen');
    expect(noticeC).toHaveTextContent('Accès à préciser pour cette question : lot de bière, prélèvement, portion séparée.');
    expect(screen.getByRole('button', { name: 'Préciser les accès de cette lecture' })).toBeInTheDocument();
    // Revising this answer preserves B's exact source archive instead of parsing.
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(4);

    // A fresh attestation resolves the unknown; provenance remains neutral and stops asking for this access.
    fireEvent.click(screen.getByRole('button', { name: 'Préciser les accès de cette lecture' }));
    fireEvent.click(screen.getByText(/Accès aux portions/));
    fireEvent.click(screen.getAllByText('Corriger cet accès par une nouvelle déclaration')[1]);
    fireEvent.change(screen.getByLabelText('État d’accès Échantillon'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText('Motif d’accès Échantillon'), { target: { value: 'Le brasseur redéclare un prélèvement distinct.' } });
    fireEvent.change(screen.getByLabelText('Déclaration d’accès Échantillon'), { target: { value: 'Le brasseur confirme à nouveau ce prélèvement pour la lecture C.' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Mode de source'), { target: { value: 'personal' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Titre de la déclaration'), { target: { value: 'Nouvelle déclaration fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Acteur de la déclaration'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Motif de la déclaration'), { target: { value: 'Nouvelle annotation locale; aucune donnée externe.' } });
    const reattestButton = screen.getAllByRole('button', { name: 'Ajouter cette attestation à la lecture' })
      .find(button => !(button as HTMLButtonElement).disabled);
    expect(reattestButton).toBeDefined();
    fireEvent.click(reattestButton!);
    await screen.findByText(/Nouvelle attestation ajoutée à la lecture à valider/u);
    fireEvent.change(screen.getByLabelText('Lecture corrigée'), { target: { value: 'Lecture corrigée avec prélèvement déclaré à nouveau.' } });
    fireEvent.change(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), { target: { value: 'Déclarer maintenant l’accès au prélèvement.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(5));
    const answerDRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![4]);
    expect(answerDRead.status).toBe('readOnly');
    if (answerDRead.status !== 'readOnly' || answerDRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse D avec attestation renouvelée attendue.');
    }
    const answerD = answerDRead.record;
    expect(answerD.revisionContext?.sourceAnswerRecordReference).toBe(answerC.reference);
    expect(answerD.answerSnapshot.requestSnapshot.context.access.sampling.state).toBe('yes');
    expect(answerD.answerSnapshot.requestSnapshot.context.access.sampling.assertionIds).toHaveLength(1);
    expect(answerD.answerSnapshot.requestSnapshot.context.access.bulkBeer.state).toBe('unknown');
    expect(answerD.answerSnapshot.requestSnapshot.context.access.separatePortion.state).toBe('unknown');
    const assertionD = answerD.answerSnapshot.requestSnapshot.context.assertions.find(row =>
      row.id === answerD.answerSnapshot.requestSnapshot.context.access.sampling.assertionIds[0]);
    expect(assertionD?.source?.reference).toMatch(/^local-declaration:/u);
    const noticeD = await screen.findByLabelText('Contexte de cette lecture');
    expect(noticeD).toHaveTextContent('Contexte relu pour ce réexamen');
    expect(noticeD).toHaveTextContent('Accès à préciser pour cette question : lot de bière, portion séparée.');
    expect(noticeD).not.toHaveTextContent('prélèvement');
    expect(screen.getByRole('button', { name: 'Préciser les accès de cette lecture' })).toBeInTheDocument();

    // Reload and reopen B then A from the actual Page history. No parser, builder, or write is permitted.
    const archiveBeforeReload = structuredClone(harness.stored!.documentaryAnswers);
    const savesBeforeReload = harness.save.mock.calls.length;
    const buildsBeforeReload = builder.mock.calls.length;
    const readsBeforeReload = parser.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(screen.getByText(/Réponses et dossiers documentaires · 5/));
    const archivedButtons = await screen.findAllByRole('button', { name: 'Relire cette réponse documentaire', exact: true });
    expect(archivedButtons).toHaveLength(5);
    fireEvent.click(archivedButtons[2]); // B: re-examined snapshot, sampling unknown.
    await screen.findByText('Conseil documentaire · V3');
    await waitFor(() => expect(screen.getByLabelText('Contexte de cette lecture'))
      .toHaveTextContent('Accès à préciser pour cette question : lot de bière, prélèvement, portion séparée.'));
    expect(screen.getAllByText('Inconnu / non déclaré')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Préciser les accès de cette lecture' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(screen.getByText(/Réponses et dossiers documentaires · 5/));
    const archivedButtonsAgain = await screen.findAllByRole('button', { name: 'Relire cette réponse documentaire', exact: true });
    fireEvent.click(archivedButtonsAgain[1]); // A: previous yes declaration, not re-examined.
    await screen.findByText('Conseil documentaire · V3');
    await waitFor(() => expect(screen.getByText('Oui, accès déclaré')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByLabelText('Contexte de cette lecture')).toBeNull());
    expect(harness.stored!.documentaryAnswers).toEqual(archiveBeforeReload);
    expect(parser).toHaveBeenCalledTimes(readsBeforeReload);
    expect(builder).toHaveBeenCalledTimes(buildsBeforeReload);
    expect(harness.save).toHaveBeenCalledTimes(savesBeforeReload);
  });

  it('valide aussi une attestation négative, sourcée et typée process, sans réécrire le snapshot précédent', async () => {
    const harness = pageHarness(question);
    render(<HopV55Page services={harness.services} />);
    await rereadLegacyQuestion(harness);
    const before = structuredClone(harness.stored!.documentaryAnswers![0]);

    fireEvent.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    fireEvent.click(screen.getByText(/Accès aux portions/));
    fireEvent.click(screen.getAllByText('Corriger cet accès par une nouvelle déclaration')[1]);
    fireEvent.change(screen.getByLabelText('État d’accès Échantillon'), { target: { value: 'no' } });
    fireEvent.change(screen.getByLabelText('Motif d’accès Échantillon'), { target: { value: 'Le brasseur déclare ce prélèvement inaccessible.' } });
    fireEvent.change(screen.getByLabelText('Déclaration d’accès Échantillon'), { target: { value: 'Le brasseur ne dispose pas de ce prélèvement pour cette lecture.' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Mode de source'), { target: { value: 'personal' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Titre de la déclaration'), { target: { value: 'Déclaration négative fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Acteur de la déclaration'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('Accès Échantillon · Motif de la déclaration'), { target: { value: 'Annotation locale; aucune donnée externe.' } });
    const addAssertionButton = screen.getAllByRole('button', { name: 'Ajouter cette attestation à la lecture' })
      .find(button => !(button as HTMLButtonElement).disabled);
    expect(addAssertionButton).toBeDefined();
    fireEvent.click(addAssertionButton!);
    expect(await screen.findByText(/Nouvelle attestation ajoutée à la lecture à valider/u)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lecture corrigée'), { target: { value: 'L’accès au prélèvement est déclaré non disponible.' } });
    fireEvent.change(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), { target: { value: 'Conserver une déclaration explicite d’absence d’accès.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));

    await waitFor(() => expect(harness.stored?.documentaryAnswers).toHaveLength(2));
    expect(harness.stored!.documentaryAnswers![0]).toEqual(before);
    const correctedRead = readHopV55DocumentaryAnswerRecord(harness.stored!.documentaryAnswers![1]);
    expect(correctedRead.status).toBe('readOnly');
    if (correctedRead.status !== 'readOnly' || correctedRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 corrigée attendue.');
    }
    const request = correctedRead.record.answerSnapshot.requestSnapshot;
    const access = request.context.access.sampling;
    expect(access.state).toBe('no');
    expect(access.assertionIds).toHaveLength(1);
    const assertion = request.context.assertions.find(row => row.id === access.assertionIds[0]);
    expect(assertion).toMatchObject({ subject: 'sampling', state: 'reported', value: false, dimension: 'process' });
    expect(assertion?.source?.reference).toMatch(/^local-declaration:/u);
  });

  it('refuse un clic de découverte si un autre acteur a déjà avancé la tête de la lecture', async () => {
    const harness = pageHarness(question);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    render(<HopV55Page services={harness.services} />);
    await rereadLegacyQuestion(harness);
    const raw = harness.stored!.documentaryAnswers![0];
    const read = readHopV55DocumentaryAnswerRecord(raw);
    expect(read.status).toBe('readOnly');
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Réponse V3 initiale attendue.');
    }
    const initial = structuredClone(read.record);
    const concurrent = concurrentController(harness, initial.sourceReadingReference);
    const beforeBuilder = builder.mock.calls.length;
    const externalRequest = structuredClone(initial.answerSnapshot.requestSnapshot);
    externalRequest.interpretation = { ...externalRequest.interpretation, id: 'fixture:concurrent-interpretation',
      text: `${externalRequest.interpretation.text} Annotation concurrente de fixture.`, origin: 'user' };
    await concurrent.reinterpret({ request: externalRequest, reason: 'Avancement concurrent de la tête dans le dossier fixture.',
      expectedAnswerRecordReference: initial.reference, expectedAnswerReference: initial.answerReference,
      expectedInterpretationReference: initial.answerSnapshot.interpretationReference });
    expect(builder).toHaveBeenCalledTimes(beforeBuilder + 1);
    const afterConcurrent = harness.stored!;
    expect(afterConcurrent.documentaryAnswers).toHaveLength(2);
    expect(afterConcurrent.documentaryAnswers![0]).toEqual(raw);
    const savesAfterConcurrent = harness.save.mock.calls.length;
    const buildsAfterConcurrent = builder.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Chercher des options dans le catalogue chargé' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(/tête exacte de la lecture/u);
    expect(harness.save).toHaveBeenCalledTimes(savesAfterConcurrent);
    expect(builder).toHaveBeenCalledTimes(buildsAfterConcurrent);
    expect(parser).not.toHaveBeenCalled();
    expect(harness.stored!.documentaryAnswers).toHaveLength(2);
    expect(harness.stored!.documentaryAnswers![0]).toEqual(raw);
    expect(harness.stored!.documentaryAnswers![1]).toEqual(afterConcurrent.documentaryAnswers![1]);
  });
});
