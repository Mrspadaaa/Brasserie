import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { answerQualifiedHopAdvice } from '../../src/domain/hopDecision/qualifiedAdvice';
import { createHopDecisionDossierV2 } from '../../src/domain/hopDecision/dossier';
import { createHopAdviceDossier, applyHopAdviceEvent } from '../../src/domain/hopDecision/adviceDossier';
import { captureHopAdvicePreference } from '../../src/domain/hopDecision/adviceProgramAdapter';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { createHopV55QualifiedStudyPreparationV1, createHopV55QualifiedStudyLinkV1,
  type PersistHopV55QualifiedStudyResult } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopCommercialProduct, HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { HopDecisionStudySnapshotV2 } from '../../src/domain/hopDecision/dossier';
import type { HopAdviceStudyV3, HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopAdviceJourneyFixture } from '../fixtures/hopAdviceJourney';
import { HopV55QualifiedStudyPanel, type HopV55QualifiedStudyEntry, type HopV55QualifiedAdvicePreferenceUpdate } from '../../src/ui/hopV55/QualifiedStudyPanel';

afterEach(() => cleanup());

const questionProduct = 'Quelles sont les utilisations et les limites de ce produit ?';
const recordedAt = '2026-10-03T08:00:00.000Z';
const ownerKey = 'fixture-owner-qualified-study';
const workspaceId = 'fixture-workspace-qualified-study';
const source: HopSource = { kind: 'manufacturer', title: 'Fiche technique de test', author: 'Brasserie de fixture', year: 2026,
  reference: 'fixture:qualified-product-sheet', locator: 'Tableau usages et limites, ligne de référence.' };

function product(): HopCommercialProduct {
  return { id: 'product:hop-extract-fixture', name: 'Extrait aromatique de fixture', manufacturer: 'Fabricant de test', form: 'extract',
    supportedUses: ['whirlpool', 'postFermentation'], source, reviewedOn: '2026-10-02', cautions: ['Usage documenté selon les conditions indiquées.'],
    replacement: { referenceForm: 'pelletT90', uses: ['whirlpool'], basis: 'manufacturerMassRatio', gramsPerGram: { min: 0.7, max: 0.9 },
      source: { ...source, title: 'Convention de remplacement publiée', reference: 'fixture:ratio', locator: 'Section 4, pour whirlpool uniquement.' },
      limitations: ['Cette convention ne garantit pas une équivalence aromatique.'], maxDoseGL: 0.2 } };
}

function productStudy(): HopDecisionStudySnapshotV2<'understandProducts'> {
  const commercialProduct = product();
  const material: HopDecisionMaterial = { id: 'material:product-fixture', name: commercialProduct.name, form: 'extract', product: commercialProduct,
    availableGrams: null, declaredAnalysis: [] };
  return answerQualifiedHopDecision({
    intent: { originalQuestion: questionProduct, interpretation: 'Lire les emplois et les limites documentés.' },
    action: { kind: 'understandProducts', productIds: [commercialProduct.id] },
    products: [commercialProduct],
    qualificationInput: { variants: [{ variantId: 'fixture-product-variant', scope: 'product', recordId: commercialProduct.id,
      origin: { kind: 'seed' }, material }] },
  });
}

function adviceStudy(stage: 'planning' | 'conditioning' = 'planning', explicitEmptyScope = false): HopAdviceStudyV3 {
  const fixture = makeHopAdviceJourneyFixture(stage);
  if (explicitEmptyScope) fixture.action.situation.materialIds = [];
  return answerQualifiedHopAdvice(fixture);
}

function workspaceBase(overrides: Partial<HopV55Workspace> = {}): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1, title: 'Étude de fixture',
    intent: { question: questionProduct, criteria: [] }, scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt,
    ...overrides };
}

function persistResult(entry: HopV55QualifiedStudyEntry): PersistHopV55QualifiedStudyResult {
  const kind = entry.kind;
  const dossierId = `dossier:${kind}:fixture`;
  const eventId = `event:${kind}:saved`;
  const createCommand = kind === 'products'
    ? { kind: 'products' as const, ownerKey, dossierId, eventId, recordedAt, study: entry.study }
    : { kind: 'advice' as const, ownerKey, dossierId, eventId, recordedAt, study: entry.study };
  const preparation = createHopV55QualifiedStudyPreparationV1({ id: `preparation:${kind}:fixture`, ownerKey, workspaceId,
    sourceReadingReference: entry.sourceReadingReference, preparedReference: `prepared:${kind}:fixture`, createCommand });
  const link = createHopV55QualifiedStudyLinkV1(preparation);
  const created = kind === 'products'
    ? createHopDecisionDossierV2(createCommand as Extract<typeof createCommand, { kind: 'products' }>)
    : createHopAdviceDossier(createCommand as Extract<typeof createCommand, { kind: 'advice' }>);
  const dossier = created.dossier;
  const studySavedEvent = created.event;
  const workspace = workspaceBase({ qualifiedStudyPreparations: [preparation], qualifiedStudyLinks: [link] });
  return { status: 'linked', freshContext: { status: 'current' }, repositoryStatus: 'created', preparation, link,
    dossier, events: [studySavedEvent], studySavedEvent, workspace };
}

function productEntry(study = productStudy(), overrides: Partial<Extract<HopV55QualifiedStudyEntry, { kind: 'products' }>> = {}) {
  return { kind: 'products' as const, sourceReadingReference: 'reading:fixture-product', studyReference: hopDecisionReference(study),
    study, status: 'prepared' as const, readOnly: false, ...overrides };
}

function adviceEntry(study = adviceStudy(), overrides: Partial<Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }>> = {}) {
  return { kind: 'advice' as const, sourceReadingReference: 'reading:fixture-advice', studyReference: study.reference,
    study, status: 'prepared' as const, readOnly: false, ...overrides };
}

function preferredUpdate(entry: Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }>, saved: PersistHopV55QualifiedStudyResult,
  optionId: string, reason: string, eventId = 'event:advice:preferred'): HopV55QualifiedAdvicePreferenceUpdate {
  const study = entry.study;
  const option = study.responseSnapshot.result.options.find(row => row.id === optionId)!;
  const event = captureHopAdvicePreference({ identity: { ownerKey, dossierId: saved.link.dossierId, eventId,
    expectedRevision: 1, recordedAt }, study, currentStudy: study,
    qualificationInput: study.requestSnapshot.qualificationInput, preferenceId: `preference:${eventId}`, optionId: option.id, reason });
  const dossier = saved.dossier as Extract<typeof saved.dossier, { formatVersion: 3 }>;
  const first = saved.events[0] as HopAdviceEventV3;
  return { dossier: applyHopAdviceEvent(dossier, event, [first]), event, events: [first, event], freshContext: { status: 'current' } };
}

describe('études produit et conseil qualifiés · rendu et conservation', () => {
  it('montre la réponse produit, les emplois, le rapport et ses limites avant le geste de conservation', async () => {
    const entry = productEntry();
    const onSaveProductStudy = vi.fn(async () => persistResult(entry));
    const view = render(<HopV55QualifiedStudyPanel entry={entry} onSaveProductStudy={onSaveProductStudy} />);
    expect(screen.getByText(questionProduct)).toBeInTheDocument();
    const result = view.container.querySelector('[aria-label="Résultat de l’étude produit"]')!;
    expect(result.textContent).toContain('Réponse de l’étude');
    expect(result.textContent).toContain('whirlpool');
    expect(result.textContent).toContain('0,7–0,9');
    expect(result.textContent).toContain('ne garantit pas une équivalence aromatique');
    expect(result.textContent).toContain('Section 4, pour whirlpool uniquement.');
    expect(result.querySelector('button')).toBeNull();
    const save = screen.getByRole('button', { name: 'Conserver cette étude produit' });
    expect(save.compareDocumentPosition(result) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    fireEvent.click(save);
    await waitFor(() => expect(onSaveProductStudy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('status')).toHaveTextContent('Étude conservée et rattachée à cette lecture.');
    expect(screen.getByText(/Dossier produit/)).toBeInTheDocument();
  });

  it('refuse une confirmation de sauvegarde rattachée à une autre lecture avant d’annoncer la conservation', async () => {
    const entry = productEntry();
    const result = persistResult(entry);
    const onSaveProductStudy = vi.fn(async () => ({ ...result, link: { ...result.link, sourceReadingReference: 'reading:foreign' } }));
    render(<HopV55QualifiedStudyPanel entry={entry} onSaveProductStudy={onSaveProductStudy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude produit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ne correspond pas à cette lecture');
    expect(screen.queryByText('Étude conservée et rattachée à cette lecture.')).not.toBeInTheDocument();
  });

  it('n’affiche pas le succès d’une sauvegarde A après que le parent a basculé sur l’étude B', async () => {
    const entryA = productEntry();
    const entryB = productEntry(entryA.study, { sourceReadingReference: 'reading:fixture-product-B' });
    let resolveSave!: (result: PersistHopV55QualifiedStudyResult) => void;
    const pendingSave = new Promise<PersistHopV55QualifiedStudyResult>(resolve => { resolveSave = resolve; });
    const onSaveProductStudy = vi.fn(() => pendingSave);
    const view = render(<HopV55QualifiedStudyPanel entry={entryA} onSaveProductStudy={onSaveProductStudy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude produit' }));
    expect(onSaveProductStudy).toHaveBeenCalledTimes(1);
    view.rerender(<HopV55QualifiedStudyPanel entry={entryB} onSaveProductStudy={onSaveProductStudy} />);
    expect(screen.getByText('Quelles sont les utilisations et les limites de ce produit ?')).toBeInTheDocument();
    await act(async () => { resolveSave(persistResult(entryA)); await pendingSave; });
    expect(screen.queryByText('Étude conservée et rattachée à cette lecture.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conserver cette étude produit' })).toBeInTheDocument();
  });

  it('affiche d’abord le conseil Q09, garde les options exactes puis enregistre une préférence motivée', async () => {
    const study = adviceStudy();
    expect(study.responseSnapshot.result.options.length).toBeGreaterThan(0);
    const entry = adviceEntry(study);
    let saved = persistResult(entry);
    let savedEntry = entry;
    const onSaveAdviceStudy = vi.fn(async () => saved);
    const onPreferAdvice = vi.fn(async (request: { expectedDossierId: string; expectedDossierRevision: number; expectedOptionId: string; reason: string }) => {
      const option = study.responseSnapshot.result.options.find(row => row.id === request.expectedOptionId)!;
      const update = preferredUpdate(entry, saved, option.id, request.reason);
      savedEntry = { ...savedEntry, status: 'saved', dossier: update.dossier, events: update.events };
      return update;
    });
    const view = render(<HopV55QualifiedStudyPanel entry={entry} onSaveAdviceStudy={onSaveAdviceStudy} onPreferAdvice={onPreferAdvice} />);
    expect(screen.getByText(study.requestSnapshot.intent.originalQuestion)).toBeInTheDocument();
    const body = view.container.querySelector('[aria-label="Résultat du conseil qualifié"]')!;
    expect(body.textContent).toContain(study.responseSnapshot.answer);
    expect(body.textContent).toContain('aucun programme fourni pour cette étude');
    expect(body.textContent).toContain('houblon maison');
    expect(screen.queryByRole('button', { name: 'Conserver cette préférence' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude de conseil' }));
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Choisir cette voie' }).length).toBeGreaterThan(0));
    const firstOption = study.responseSnapshot.result.options[0];
    const optionCard = view.container.querySelectorAll('.hv-qualified-option')[0];
    expect(within(optionCard).getByText(firstOption.title)).toBeInTheDocument();
    fireEvent.click(within(optionCard).getByRole('button', { name: 'Choisir cette voie' }));
    fireEvent.change(screen.getByLabelText('Pourquoi cette voie vous intéresse-t-elle ?'), { target: { value: 'Je souhaite examiner cette piste.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette préférence' }));
    await waitFor(() => expect(onPreferAdvice).toHaveBeenCalledTimes(1));
    expect(onPreferAdvice).toHaveBeenCalledWith(expect.objectContaining({ expectedStudyReference: study.reference,
      expectedOptionId: firstOption.id, expectedOptionReference: firstOption.reference, reason: 'Je souhaite examiner cette piste.' }));
    expect(await screen.findByText(/Préférence de stratégie conservée/)).toBeInTheDocument();
    expect(savedEntry.dossier?.state).toBe('strategyPreferred');
    expect(savedEntry.dossier?.study).toEqual(study);
    expect(savedEntry.events?.length).toBe(2);
    const preferenceEvent = savedEntry.events!.find(event => event.kind === 'strategyPreferred');
    expect(preferenceEvent?.kind).toBe('strategyPreferred');
    if (preferenceEvent?.kind === 'strategyPreferred') expect(preferenceEvent.payload).not.toHaveProperty('grams');
    expect(screen.queryByRole('button', { name: /appliquer|modifier le programme/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Préférences de stratégie enregistrées/));
    expect(screen.getByText('Je souhaite examiner cette piste.')).toBeInTheDocument();
  });

  it('affiche un périmètre explicitement vide sans le confondre avec l’omission du champ', () => {
    const study = adviceStudy('planning', true);
    const entry = adviceEntry(study);
    const view = render(<HopV55QualifiedStudyPanel entry={entry} />);
    fireEvent.click(screen.getByText('Périmètre exact et contexte'));
    expect(view.container.textContent).toContain('aucune matière sélectionnée (périmètre explicite vide)');
    expect(view.container.textContent).not.toContain('champ absent dans la demande');
  });

  it('rend un programme réellement fourni dans ses détails sans convertir ses inconnues en zéro', () => {
    const study = adviceStudy('conditioning');
    const program = study.requestSnapshot.action.situation.program!;
    const view = render(<HopV55QualifiedStudyPanel entry={adviceEntry(study)} />);
    const body = view.container.querySelector('[aria-label="Résultat du conseil qualifié"]')!;
    expect(body.textContent).toContain(`Programme pris en compte · ${program.additions.length} ajouts`);
    expect(body.textContent).not.toContain('null L');
    fireEvent.click(screen.getByText('Périmètre exact et contexte'));
    expect(view.container.textContent).toContain('Ajouts du programme fourni');
    for (const addition of program.additions) expect(view.container.textContent).toContain(addition.status === 'performed' ? 'effectué' : 'planifié');
  });

  it('ne propose aucun geste d’écriture depuis une étude historique explicitement en lecture seule', () => {
    const entry = productEntry(undefined, { status: 'historical', readOnly: true });
    const onSaveProductStudy = vi.fn(async () => persistResult(entry));
    render(<HopV55QualifiedStudyPanel entry={entry} onSaveProductStudy={onSaveProductStudy} />);
    expect(screen.getByText('Étude archivée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conserver cette étude produit/i })).not.toBeInTheDocument();
    expect(onSaveProductStudy).not.toHaveBeenCalled();
  });

  it('relit un conseil archivé en lecture seule sans action de préférence', () => {
    const study = adviceStudy();
    const prepared = adviceEntry(study);
    const saved = persistResult(prepared);
    const entry = adviceEntry(study, { status: 'historical', readOnly: true, link: saved.link,
      dossier: saved.dossier as Extract<typeof saved.dossier, { formatVersion: 3 }>, events: saved.events as HopAdviceEventV3[] });
    const onPreferAdvice = vi.fn();
    const view = render(<HopV55QualifiedStudyPanel entry={entry} onPreferAdvice={onPreferAdvice} />);
    expect(screen.getByText('Lecture seule')).toBeInTheDocument();
    expect(screen.getByText(study.responseSnapshot.answer)).toBeInTheDocument();
    expect(view.container.querySelectorAll('.hv-qualified-option')).toHaveLength(study.responseSnapshot.result.options.length);
    expect(screen.queryByRole('button', { name: 'Choisir cette voie' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conserver cette préférence' })).not.toBeInTheDocument();
    expect(onPreferAdvice).not.toHaveBeenCalled();
  });

  it('refuse de présenter une préférence si le dossier renvoyé ne suit pas la révision attendue', async () => {
    const study = adviceStudy();
    const entry = adviceEntry(study);
    const saved = persistResult(entry);
    const onSaveAdviceStudy = vi.fn(async () => saved);
    const onPreferAdvice = vi.fn(async () => ({
      dossier: { ...(saved.dossier as Extract<typeof saved.dossier, { formatVersion: 3 }>), revision: 9 },
      event: { ...(saved.events[0] as HopAdviceEventV3) }, events: [saved.events[0] as HopAdviceEventV3], freshContext: { status: 'current' as const },
    }));
    render(<HopV55QualifiedStudyPanel entry={entry} onSaveAdviceStudy={onSaveAdviceStudy} onPreferAdvice={onPreferAdvice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude de conseil' }));
    await screen.findAllByRole('button', { name: 'Choisir cette voie' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Choisir cette voie' })[0]);
    fireEvent.change(screen.getByLabelText('Pourquoi cette voie vous intéresse-t-elle ?'), { target: { value: 'Motif explicite.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette préférence' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('révision attendus');
    expect(screen.queryByText(/Préférence de stratégie conservée/)).not.toBeInTheDocument();
  });

  it('n’applique pas la réponse d’une préférence A après le passage du parent à l’étude B', async () => {
    const studyA = adviceStudy();
    const entryA = adviceEntry(studyA);
    const savedA = persistResult(entryA);
    let resolvePreference!: (value: HopV55QualifiedAdvicePreferenceUpdate) => void;
    const pendingPreference = new Promise<HopV55QualifiedAdvicePreferenceUpdate>(resolve => { resolvePreference = resolve; });
    const onSaveAdviceStudy = vi.fn(async () => savedA);
    const onPreferAdvice = vi.fn(() => pendingPreference);
    const view = render(<HopV55QualifiedStudyPanel entry={entryA} onSaveAdviceStudy={onSaveAdviceStudy} onPreferAdvice={onPreferAdvice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude de conseil' }));
    await screen.findAllByRole('button', { name: 'Choisir cette voie' });
    const option = studyA.responseSnapshot.result.options[0];
    fireEvent.click(within(view.container.querySelectorAll('.hv-qualified-option')[0]).getByRole('button', { name: 'Choisir cette voie' }));
    fireEvent.change(screen.getByLabelText('Pourquoi cette voie vous intéresse-t-elle ?'), { target: { value: 'Motif pour A.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette préférence' }));
    expect(onPreferAdvice).toHaveBeenCalledTimes(1);
    const fixtureB = makeHopAdviceJourneyFixture('planning');
    fixtureB.intent.originalQuestion = 'Question séparée pour l’étude B.';
    const changedStudyB = answerQualifiedHopAdvice(fixtureB);
    const entryB = adviceEntry(changedStudyB, { sourceReadingReference: 'reading:advice-B' });
    view.rerender(<HopV55QualifiedStudyPanel entry={entryB} onSaveAdviceStudy={onSaveAdviceStudy} onPreferAdvice={onPreferAdvice} />);
    await act(async () => {
      resolvePreference(preferredUpdate(entryA, savedA, option.id, 'Motif pour A.'));
      await pendingPreference;
    });
    expect(screen.getByText('Question séparée pour l’étude B.')).toBeInTheDocument();
    expect(screen.queryByText(/Préférence de stratégie conservée/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conserver cette préférence' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conserver cette étude de conseil' })).toBeInTheDocument();
  });
});

