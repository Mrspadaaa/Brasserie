import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV3, type HopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionWithScopesV1, createHopV55QuestionScopeLedgerV1,
  reviseHopV55QuestionScopeLedgerV1, type HopV55QuestionScopeCoverageV1,
  type HopV55QuestionScopeDispositionActionV1, type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import { HopV55QuestionScopePanel, type HopV55QuestionScopeConfirmInputV1 } from '../../src/ui/hopV55/QuestionScopePanel';

afterEach(() => cleanup());

const ownerKey = 'question-scope-panel-owner';
const workspaceId = 'question-scope-panel-workspace';
const recordedAt = '2026-10-03T20:00:00.000Z';
const question = 'Quand avec ma levure, utiliser au mieux mon houblons et lesquels ?';

function fixtureArchive() {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const { reading, scopeDrafts } = readHopV55QuestionWithScopesV1(question, prepared);
  const transition: HopV55QuestionScopeTransitionV1 = { actId: 'scope:create:question-panel', kind: 'create',
    reason: 'Conserver les portées proposées.', recordedAt, actor: { origin: 'proposal', label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading, scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:question-panel:1', ownerKey, workspaceId,
    recordedAt, reading, source: { kind: 'exploration' }, runtimeReference: 'runtime:question-panel', scopeLedger, transition });
  const scopeCoverage: HopV55QuestionScopeCoverageV1[] = scopeDrafts.map((scope, index) => ({
    scopeId: scope.id, kind: scope.kind, disposition: 'open', sourceSpan: structuredClone(scope.sourceSpan),
    ...(scope.focusSpan ? { focusSpan: structuredClone(scope.focusSpan) } : {}),
    relatedScopeIds: [...scope.relatedScopeIds], relatedCriterionIds: [...scope.relatedCriterionIds],
    relatedOperationIds: [...scope.relatedOperationIds], origin: scope.origin,
    coverage: index === 0 ? 'bounded' : 'unresolved',
    optionIds: index === 0 ? ['option:fixture:timing'] : [],
    materialIds: scope.kind === 'materialSelection' ? ['material:fixture:hop'] : [],
    uses: scope.kind === 'employmentTiming' ? ['whirlpool'] : [],
    reason: index === 0 ? 'Une option candidate porte un emploi sans fixer de calendrier.' : 'Aucune matière n’a été explicitement sélectionnée.',
  }));
  return { archive, scopeDrafts, scopeCoverage };
}

function harness(initial: HopV55DecisionReadingArchiveV3) {
  let current = structuredClone(initial);
  const onConfirm = vi.fn(async (request: HopV55QuestionScopeConfirmInputV1) => {
    if (request.sourceReadingReference !== current.contentReference
      || request.expectedScopeLedgerReference !== current.scopeLedger.reference) throw Error('Révision source périmée.');
    const transition: HopV55QuestionScopeTransitionV1 = {
      actId: request.commandId, kind: 'reviseScopes', parentReadingReference: current.contentReference,
      reason: request.reason, recordedAt: '2026-10-03T20:01:00.000Z',
      actor: { origin: 'user', label: 'Brasseur fixture' },
    };
    const scopeLedger = reviseHopV55QuestionScopeLedgerV1({
      ledger: current.scopeLedger, question: current.reading.intent.question, reading: current.reading,
      transition, expectedParentReadingReference: current.contentReference, actions: request.actions,
    });
    current = createHopV55DecisionReadingArchiveV3({
      id: `${current.id}:next:${request.commandId}`, ownerKey: current.ownerKey, workspaceId: current.workspaceId,
      recordedAt: transition.recordedAt, reading: current.reading, source: current.source,
      runtimeReference: current.runtimeReference, scopeLedger, transition,
    });
    return structuredClone(current);
  });
  return { onConfirm, current: () => structuredClone(current) };
}

function component(archiveV3: HopV55DecisionReadingArchiveV3, onConfirm: ReturnType<typeof harness>['onConfirm'], options: {
  scopeCoverage?: readonly HopV55QuestionScopeCoverageV1[]; readOnly?: boolean;
} = {}) {
  return <HopV55QuestionScopePanel archiveV3={archiveV3} onConfirm={onConfirm} {...options} />;
}

describe('disposition des portées d’une lecture V3', () => {
  it('montre le fragment exact et distingue couverture de disposition; confirme une révision append-only puis la relit', async () => {
    const { archive, scopeDrafts, scopeCoverage } = fixtureArchive();
    const h = harness(archive);
    const view = render(component(archive, h.onConfirm, { scopeCoverage }));

    expect(screen.getByRole('heading', { name: 'Quand l’employer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quelles matières examiner' })).toBeInTheDocument();
    expect(screen.getByText(scopeDrafts[0].sourceSpan.text, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(scopeDrafts[0].contextSpans[0].text, { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Couverture bornée')).toBeInTheDocument();
    expect(screen.getByText('Non résolue')).toBeInTheDocument();
    expect(screen.getAllByText('Disposition actuelle :', { exact: false })).toHaveLength(2);
    expect(screen.getByText(/ne créent ni critère sensoriel, ni calendrier, ni choix de matière/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer les dispositions' })).toBeDisabled();
    expect(h.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quand l’employer»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Conserver la question de moment telle qu’elle a été formulée.' } });
    expect(screen.getByRole('button', { name: 'Enregistrer les dispositions' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));

    await waitFor(() => expect(h.onConfirm).toHaveBeenCalledTimes(1));
    const request = h.onConfirm.mock.calls[0][0];
    expect(request).toMatchObject({
      sourceReadingReference: archive.contentReference,
      expectedScopeLedgerReference: archive.scopeLedger.reference,
      reason: 'Conserver la question de moment telle qu’elle a été formulée.',
      actions: [{ scopeId: scopeDrafts[0].id, status: 'retained', reason: 'Conserver la question de moment telle qu’elle a été formulée.' }],
    });
    expect(request.commandId).toMatch(/^scope-disposition:/u);
    expect(h.current().scopeLedger.entries.slice(0, archive.scopeLedger.entries.length)).toEqual(archive.scopeLedger.entries);
    expect(h.current().scopeLedger.entries.at(-1)).toMatchObject({ scopeId: scopeDrafts[0].id, status: 'retained' });
    expect(archive.scopeLedger.entries).toEqual(fixtureArchive().archive.scopeLedger.entries);
    expect(screen.getByRole('status')).toHaveTextContent('Les dispositions sont enregistrées dans la lecture suivante.');

    view.rerender(component(h.current(), h.onConfirm, { scopeCoverage }));
    await waitFor(() => expect(screen.getByText('Retenue', { exact: true })).toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Les dispositions sont enregistrées dans la lecture suivante.');
    expect(h.current().transition.parentReadingReference).toBe(archive.contentReference);
    expect(h.current().transition.actId).toBe(request.commandId);
  });

  it('n’écarte pas une portée tant qu’une portée conservée y reste liée, puis retire la liaison avant append', async () => {
    const { archive, scopeDrafts } = fixtureArchive();
    const timing = scopeDrafts.find(scope => scope.kind === 'employmentTiming')!;
    const materials = scopeDrafts.find(scope => scope.kind === 'materialSelection')!;
    expect(materials.relatedScopeIds).toContain(timing.id);

    const invalidAction: HopV55QuestionScopeDispositionActionV1 = { scopeId: timing.id, status: 'excluded', reason: 'Écarter cette portée.' };
    const invalidTransition: HopV55QuestionScopeTransitionV1 = { actId: 'scope:invalid-link', kind: 'reviseScopes',
      parentReadingReference: archive.contentReference, reason: 'Test de liaison', recordedAt: '2026-10-03T20:02:00.000Z',
      actor: { origin: 'user', label: 'Brasseur fixture' } };
    expect(() => reviseHopV55QuestionScopeLedgerV1({ ledger: archive.scopeLedger, question, reading: archive.reading,
      transition: invalidTransition, expectedParentReadingReference: archive.contentReference, actions: [invalidAction] }))
      .toThrow(/Portée active .* pointe vers une portée exclue\/absente/u);

    const h = harness(archive);
    const view = render(component(archive, h.onConfirm));
    fireEvent.click(screen.getByRole('button', { name: 'Écarter la portée «Quand l’employer»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Retirer cette question de la comparaison.' } });
    expect(screen.getByText(/liaison active pointe vers une portée écartée/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer les dispositions' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Associer «Quelles matières examiner» à «Quand l’employer»' }));
    expect(screen.queryByText(/liaison active pointe vers une portée écartée/u)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer les dispositions' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(() => expect(h.onConfirm).toHaveBeenCalledTimes(1));
    const actions = h.onConfirm.mock.calls[0][0].actions;
    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ scopeId: timing.id, status: 'excluded' }),
      expect.objectContaining({ scopeId: materials.id, status: 'retained', activeScope: expect.objectContaining({ relatedScopeIds: [] }) }),
    ]));
    expect(h.current().scopeLedger.entries.at(-2)?.status).toBe('excluded');
    expect(h.current().scopeLedger.entries.at(-1)?.activeScope?.relatedScopeIds).toEqual([]);

    const nextArchive = h.current();
    view.rerender(component(nextArchive, h.onConfirm));
    fireEvent.click(screen.getByRole('button', { name: 'Réouvrir la portée «Quand l’employer»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Réouvrir cette question pour une comparaison ultérieure.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Les dispositions sont enregistrées dans la lecture suivante.'));
    expect(h.current().scopeLedger.entries.at(-1)).toMatchObject({ scopeId: timing.id, status: 'retained',
      decision: { kind: 'reopen', predecessorEntryReference: nextArchive.scopeLedger.entries.at(-2)?.reference } });
  });

  it('garde les archives aux formats futurs en lecture seule et bloque les gestes selon readOnly', () => {
    const { archive } = fixtureArchive();
    const h = harness(archive);
    const view = render(component(archive, h.onConfirm, { readOnly: true }));
    expect(screen.getByRole('button', { name: 'Garder la portée «Quand l’employer»' })).toBeDisabled();

    const future = structuredClone(archive) as unknown as Record<string, any>;
    future.scopeLedger.format = 'hop-v55-question-scope-ledger-v2';
    const { contentReference: _previousReference, ...body } = future;
    const futureArchive = { ...body, contentReference: hopAdviceContentReference('hop-v55-decision-reading-v3', body) };
    view.rerender(component(futureArchive as HopV55DecisionReadingArchiveV3, h.onConfirm));
    expect(screen.getByText('Cette lecture contient un format de portée futur. Elle reste en lecture seule.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Garder la portée/u })).not.toBeInTheDocument();
    expect(h.onConfirm).not.toHaveBeenCalled();
  });

  it('réutilise le même commandId quand la confirmation échoue et que le brasseur réessaie sans modifier son geste', async () => {
    const { archive, scopeDrafts } = fixtureArchive();
    const h = harness(archive);
    const attempts: string[] = [];
    const onConfirm = vi.fn(async (request: HopV55QuestionScopeConfirmInputV1) => {
      attempts.push(request.commandId);
      if (attempts.length === 1) throw new Error('Transport fixture indisponible.');
      return h.onConfirm(request);
    });
    render(component(archive, onConfirm, {}));
    fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quand l’employer»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Garder la question pour une étude distincte.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Transport fixture indisponible.'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Les dispositions sont enregistrées dans la lecture suivante.'));

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatch(/^scope-disposition:/u);
    expect(attempts[1]).toBe(attempts[0]);
    expect(h.current().scopeLedger.entries.at(-1)).toMatchObject({ scopeId: scopeDrafts[0].id, status: 'retained' });
  });
});
