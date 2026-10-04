import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as propertyAdvice from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  prepareReexaminationPreviewV1,
  prepareVerifiedReexaminationV4,
  upgradeV3ToV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceReexaminationPreviewV1,
  type HopV55PropertyAdviceV4Transition,
} from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV4, sealHopV55PropertyAdviceAnnotationLedgerV1,
  sealHopV55PropertyAdviceLedgerEntryV1 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { HopV55PropertyAdviceReexaminationPanelV4, verifyReexaminationConfirmationResultV4 }
  from '../../src/ui/hopV55/PropertyAdviceReexaminationPanelV4';
import type {
  HopV55PropertyAdviceReexaminationConfirmV4Request,
  HopV55PropertyAdviceReexaminationPrepareV4Request,
} from '../../src/ui/hopV55/propertyAdviceV4UiContracts';

afterEach(() => cleanup());

const ownerKey = 'owner:reexamination-panel-fixture';
const workspaceId = 'workspace:reexamination-panel-fixture';
const question = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture.' };
const recordedAt = '2026-10-03T20:30:00.000Z';

function preparedFor(sweetness: number) {
  const context = makeHopV55FixtureContext('planning');
  context.journal = { ...(context.journal ?? {}), revision: 1,
    readings: [{ kind: 'sweetness', value: sweetness, unit: 'point-fixture' }] };
  return prepareBrewingScenarioContext(context);
}

function makeParent(id: string): { record: HopV55PropertyAdviceAnswerRecordV4; archive: ReturnType<typeof createHopV55DecisionReadingArchiveV2> } {
  const prepared = preparedFor(2.5);
  const reading = readHopV55Question(question, prepared);
  const archive = createHopV55DecisionReadingArchiveV2({ id: `reading:${id}:parent`, ownerKey, workspaceId,
    recordedAt, reading, source: { kind: 'exploration' }, runtimeReference: `runtime:${id}:parent` });
  const initial = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared,
    requestId: `request:${id}:initial`, ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    candidatePolicy: policy });
  const intents = structuredClone(initial.requestSnapshot.propertyIntents);
  const observation = intents.find(intent => intent.role === 'reportedObservation' && intent.property === 'sweetness');
  if (!observation) throw new Error('La question fixture doit produire un constat de douceur.');
  observation.comparisonBasis = { kind: 'current', assertionIds: ['context-reading-0'] };
  const request = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared,
    requestId: `request:${id}:linked`, ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    candidatePolicy: policy, propertyIntents: intents });
  const answer = propertyAdvice.buildHopPropertyAdviceV3(request.requestSnapshot);
  const v3 = createHopV55PropertyAdviceAnswerRecordV3({ draft: request, prepared,
    answerSnapshot: answer, answerRecordId: `answer:${id}:v3` });
  const transition: HopV55PropertyAdviceV4Transition = { kind: 'upgradeV3', actId: `act:${id}:upgrade`,
    parentRecordReference: v3.reference, parentReadingReference: archive.contentReference,
    reason: 'Migration explicite de la fixture.', actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt };
  const upgraded = upgradeV3ToV4({ sourceRecord: v3, sourceReadingArchive: archive, prepared,
    recordId: `record:${id}:v4`, requestId: `request:${id}:v4`, transition, cultureBinding: null });
  if (upgraded.status !== 'ready') throw new Error('La fixture doit conserver au moins une annotation active.');
  const v4Answer = propertyAdvice.buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: upgraded.requestDraftV3.reference,
    answerSnapshot: v4Answer, answerReference: v4Answer.reference,
  } });
  return { record, archive };
}

function makeFresh(parent: ReturnType<typeof makeParent>, id: string, sweetness = 3.25) {
  const prepared = preparedFor(sweetness);
  const reading = structuredClone(parent.archive.reading) as typeof parent.archive.reading & { response?: unknown; branches: unknown[] };
  delete reading.response;
  reading.branches = [];
  const source = { kind: 'exploration' as const };
  const runtimeReference = `runtime:${id}:current`;
  const archive = createHopV55DecisionReadingArchiveV2({ id: `reading:${id}:current`, ownerKey, workspaceId,
    recordedAt: '2026-10-03T20:40:00.000Z', reading, source, runtimeReference });
  const input = { sourceRecord: parent.record, parentReadingArchive: parent.archive, sourceReadingArchive: archive,
    prepared, cultureBinding: null, currentSource: source, currentRuntimeReference: runtimeReference,
    previewId: `preview:${id}` };
  const result = prepareReexaminationPreviewV1(input);
  if (result.status !== 'ready') throw new Error(`Preview fixture bloqué : ${result.reason}`);
  return { prepared, archive, input, preview: result.preview };
}

function confirmWithRealPreparation(parent: HopV55PropertyAdviceAnswerRecordV4,
  fresh: ReturnType<typeof makeFresh>, request: HopV55PropertyAdviceReexaminationConfirmV4Request) {
  const prepared = prepareVerifiedReexaminationV4({ ...fresh.input, preview: fresh.preview,
    expectedPreviewReference: request.expectedPreviewReference, readingContext: request.readingContext,
    recordId: `record:${request.commandId}`, requestId: `request:${request.commandId}`,
    transition: { kind: 'reexamine', actId: request.commandId, parentRecordReference: parent.reference,
      parentReadingReference: parent.sourceReadingReference, reason: request.reason,
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-03T20:45:00.000Z' },
    actions: request.actions, bindingChoices: request.bindingChoices });
  if (prepared.status === 'blocked') throw new Error(prepared.reason);
  if (prepared.status === 'allRejected') return createHopV55PropertyAdviceAnswerRecordV4({
    draft: prepared.recordDraft, outcome: { kind: 'allRejected' },
  });
  const answer = propertyAdvice.buildHopPropertyAdviceV3(prepared.requestDraftV3.requestSnapshot);
  return createHopV55PropertyAdviceAnswerRecordV4({ draft: prepared.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: prepared.requestDraftV3.reference,
    answerSnapshot: answer, answerReference: answer.reference,
  } });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('réexamen V4 · panel de réconciliation', () => {
  it('garde la version source en lecture seule, montre un preview distinct et confirme le choix exact avec retry stable', async () => {
    const user = userEvent.setup();
    const parent = makeParent('exact');
    const original = structuredClone(parent.record);
    const fresh = makeFresh(parent, 'exact');
    const onPrepare = vi.fn(async (_request: HopV55PropertyAdviceReexaminationPrepareV4Request) => fresh.preview);
    const confirmed: HopV55PropertyAdviceReexaminationConfirmV4Request[] = [];
    let confirmedRecord: HopV55PropertyAdviceAnswerRecordV4 | undefined;
    let failOnce = true;
    const onConfirm = vi.fn(async (request: HopV55PropertyAdviceReexaminationConfirmV4Request) => {
      confirmed.push(structuredClone(request));
      if (failOnce) { failOnce = false; throw new Error('Reprise réseau fixture.'); }
      confirmedRecord = confirmWithRealPreparation(parent.record, fresh, request);
      return confirmedRecord;
    });
    render(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parent.record} readOnly onPrepare={onPrepare} onConfirm={onConfirm} />);

    expect(screen.getByText('La version affichée reste intacte. Prépare un aperçu pour repartir de cette version dans le contexte actuel.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    const freshHeading = await screen.findByRole('heading', { level: 4, name: 'Cadre actuel proposé · lecture seule' });
    const freshFrame = freshHeading.closest('section')!;
    const originalFrame = screen.getByRole('heading', { level: 4, name: 'Cadre conservé dans la version d’origine' }).closest('section')!;
    expect(screen.getByText(/1 lien à revoir/)).toBeInTheDocument();
    expect(screen.queryByText(/1 liens à revoir/)).not.toBeInTheDocument();
    expect(originalFrame).toHaveTextContent('2,5 point-fixture');
    expect(freshFrame).toHaveTextContent('3,25 point-fixture');
    expect(screen.getByLabelText('Question originale, mot pour mot')).toHaveTextContent(question);

    const diagnostic = fresh.preview.diagnostics.find(row => row.previousAssertionId === 'context-reading-0');
    expect(diagnostic).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' })).toBeDisabled();
    const linkChoice = screen.getByLabelText(`Choix du fait frais pour ${diagnostic!.previousAssertion.statement}`);
    await user.selectOptions(linkChoice, 'bind:context-reading-0');
    const activeAnnotation = parent.record.ledger.sourceAnnotations.find(row => row.property === 'sweetness' && row.role === 'reportedObservation');
    expect(activeAnnotation).toBeTruthy();
    await user.type(screen.getByLabelText(`Motif pour ${activeAnnotation!.label}`), 'Le nouveau relevé correspond au même lien, contenu mis à jour.');
    const beforeAfter = screen.getByLabelText('Avant et après');
    expect(beforeAfter).toHaveTextContent('2,5 point-fixture → 3,25 point-fixture');
    const linkIdentities = screen.getByText('Identités des faits liés').closest('details')!;
    expect(linkIdentities.querySelectorAll('code')).toHaveLength(2);
    expect(linkIdentities).toHaveTextContent('context-reading-0');
    await user.type(screen.getByLabelText('Motif du réexamen réconcilié'), 'Nouvelle lecture préparée explicitement.');
    await user.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Reprise réseau fixture.');
    await user.click(screen.getByRole('button', { name: 'Réessayer la même confirmation' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Nouvelle version confirmée.');

    expect(onPrepare).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(confirmed[1]).toEqual(confirmed[0]);
    expect(confirmed[0].bindingChoices).toEqual([{ format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
      kind: 'bind', previewReference: fresh.preview.reference, annotationId: activeAnnotation!.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: 'context-reading-0' }]);
    expect(confirmedRecord).toBeDefined();
    expect(verifyReexaminationConfirmationResultV4({ parentRecord: parent.record, preview: fresh.preview,
      request: confirmed[0], result: confirmedRecord })).toBeNull();
    const changedActorLedger = sealHopV55PropertyAdviceAnnotationLedgerV1({
      sourceAnnotations: confirmedRecord!.ledger.sourceAnnotations,
      entries: confirmedRecord!.ledger.entries.map(entry => {
        if (entry.decision.actId !== confirmed[0].commandId) return entry;
        const { reference: _reference, ...body } = entry;
        return sealHopV55PropertyAdviceLedgerEntryV1({ ...body,
          decision: { ...entry.decision, recordedBy: { origin: 'user', label: 'Autre acteur' } } });
      }),
      originalQuestion: confirmedRecord!.originalQuestion,
    });
    const { outcome, reference: _reference, ...draft } = confirmedRecord!;
    const changedActorRecord = createHopV55PropertyAdviceAnswerRecordV4({ draft: { ...draft, ledger: changedActorLedger }, outcome });
    expect(verifyReexaminationConfirmationResultV4({ parentRecord: parent.record, preview: fresh.preview,
      request: confirmed[0], result: changedActorRecord })).toContain('date ou l’acteur');
    expect(parent.record).toEqual(original);
    expect(originalFrame).toHaveTextContent('2,5 point-fixture');
  });

  it('ignore un preview tardif d’une autre version et annule localement sans confirmation', async () => {
    const user = userEvent.setup();
    const parentA = makeParent('late-a');
    const parentB = makeParent('late-b');
    const previewA = makeFresh(parentA, 'late-a').preview;
    const freshB = makeFresh(parentB, 'late-b');
    const first = deferred<HopV55PropertyAdviceReexaminationPreviewV1>();
    const onPrepare = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(freshB.preview);
    const onConfirm = vi.fn();
    const view = render(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parentA.record}
      onPrepare={onPrepare} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    view.rerender(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parentB.record}
      onPrepare={onPrepare} onConfirm={onConfirm} />);
    first.resolve(previewA);
    await waitFor(() => expect(screen.queryByLabelText('État de l’aperçu')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Question originale, mot pour mot')).toHaveTextContent(question);
    expect(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    expect(await screen.findByLabelText('État de l’aperçu')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Cadre actuel proposé · lecture seule' }).closest('section')).toHaveTextContent('3,25 point-fixture');
    await user.click(screen.getByRole('button', { name: 'Annuler ce brouillon' }));
    expect(screen.queryByLabelText('État de l’aperçu')).not.toBeInTheDocument();
    expect(onPrepare).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('n’annonce pas le résultat tardif d’une confirmation A après affichage de B', async () => {
    const user = userEvent.setup();
    const parentA = makeParent('late-confirm-a');
    const parentB = makeParent('late-confirm-b');
    const freshA = makeFresh(parentA, 'late-confirm-a');
    const pendingResult = deferred<HopV55PropertyAdviceAnswerRecordV4>();
    let requestA: HopV55PropertyAdviceReexaminationConfirmV4Request | undefined;
    const onPrepare = vi.fn(async () => freshA.preview);
    const onConfirm = vi.fn((request: HopV55PropertyAdviceReexaminationConfirmV4Request) => {
      requestA = structuredClone(request);
      return pendingResult.promise;
    });
    const view = render(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parentA.record}
      onPrepare={onPrepare} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByLabelText('État de l’aperçu');
    const diagnostic = freshA.preview.diagnostics.find(row => row.previousAssertionId === 'context-reading-0')!;
    await user.selectOptions(screen.getByLabelText(`Choix du fait frais pour ${diagnostic.previousAssertion.statement}`), 'bind:context-reading-0');
    const annotation = parentA.record.ledger.sourceAnnotations.find(row => row.property === 'sweetness' && row.role === 'reportedObservation')!;
    await user.type(screen.getByLabelText(`Motif pour ${annotation.label}`), 'Le lien est repris explicitement dans la nouvelle lecture.');
    await user.type(screen.getByLabelText('Motif du réexamen réconcilié'), 'Une nouvelle lecture est préparée pour A.');
    await user.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));

    view.rerender(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parentB.record}
      onPrepare={onPrepare} onConfirm={onConfirm} />);
    pendingResult.resolve(confirmWithRealPreparation(parentA.record, freshA, requestA!));
    await waitFor(() => expect(screen.queryByLabelText('État de l’aperçu')).not.toBeInTheDocument());
    expect(screen.queryByText(/Nouvelle version confirmée/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Question originale, mot pour mot')).toHaveTextContent(question);
    expect(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' })).toBeEnabled();
  });

  it('refuse de présenter le parent comme résultat d’une confirmation', async () => {
    const user = userEvent.setup();
    const parent = makeParent('invalid-result');
    const fresh = makeFresh(parent, 'invalid-result');
    render(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parent.record}
      onPrepare={async () => fresh.preview} onConfirm={async () => parent.record} />);
    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByLabelText('État de l’aperçu');
    const diagnostic = fresh.preview.diagnostics.find(row => row.previousAssertionId === 'context-reading-0')!;
    await user.selectOptions(screen.getByLabelText(`Choix du fait frais pour ${diagnostic.previousAssertion.statement}`), 'bind:context-reading-0');
    const annotation = parent.record.ledger.sourceAnnotations.find(row => row.property === 'sweetness' && row.role === 'reportedObservation')!;
    await user.type(screen.getByLabelText(`Motif pour ${annotation.label}`), 'Le lien a été vérifié dans la nouvelle lecture.');
    await user.type(screen.getByLabelText('Motif du réexamen réconcilié'), 'Confirmer uniquement une version distincte.');
    await user.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La nouvelle version ne prolonge pas la source actuelle');
    expect(screen.queryByText(/Nouvelle version confirmée/)).not.toBeInTheDocument();
  });

  it('publie une issue tout-rejeté sans réponse de domaine', async () => {
    const user = userEvent.setup();
    const parent = makeParent('all-rejected');
    const fresh = makeFresh(parent, 'all-rejected');
    const onPrepare = vi.fn(async () => fresh.preview);
    const onConfirm = vi.fn(async (request: HopV55PropertyAdviceReexaminationConfirmV4Request) =>
      confirmWithRealPreparation(parent.record, fresh, request));
    const buildAnswer = vi.spyOn(propertyAdvice, 'buildHopPropertyAdviceV3');
    render(<HopV55PropertyAdviceReexaminationPanelV4 parentRecord={parent.record} onPrepare={onPrepare} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Préparer un aperçu du contexte frais' }));
    await screen.findByLabelText('État de l’aperçu');

    const ledger = parent.record.ledger;
    const latest = new Map(ledger.entries.map(entry => [entry.annotationId, entry]));
    const active = ledger.sourceAnnotations.filter(annotation => latest.get(annotation.id)?.disposition === 'active');
    for (const annotation of active) {
      await user.click(screen.getByRole('button', { name: `Écarter « ${annotation.label} » dans la nouvelle version` }));
      await user.type(screen.getByLabelText(`Motif pour ${annotation.label}`), `Je ne retiens pas « ${annotation.label} » dans cette lecture.`);
    }
    await user.type(screen.getByLabelText('Motif du réexamen réconcilié'), 'La lecture ne conserve aucun terme actif.');
    await user.click(screen.getByRole('button', { name: 'Confirmer la nouvelle lecture' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Tous les termes sont écartés; aucun conseil n’a été créé.');
    expect(buildAnswer).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
