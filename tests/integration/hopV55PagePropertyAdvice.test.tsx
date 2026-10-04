import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as propertyAdviceRecords from '../../src/services/hopV55/propertyAdviceRecords';
import * as propertyAdviceRecordsV3 from '../../src/services/hopV55/propertyAdviceRecordsV3';
import * as decisionService from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';

// Keep the real Page, reading flow, repository callbacks and archive reader.
// Panels unrelated to this property-advice gate stay isolated.
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

const ownerKey = 'fixture:property-advice-page-owner';
const question = 'Je veux plus de poire, préserver le floral et ne pas augmenter l’amertume.';

function pageHarness() {
  const context = makeHopV55FixtureContext('planning');
  let stored: HopV55Workspace | undefined;
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    if ((stored?.revision ?? null) !== expectedRevision) throw Object.assign(new Error('staleRevision'), { code: 'staleRevision' });
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
  return { context, services, save, read, get stored() { return stored; } };
}

async function seedLegacyV2AndV3(h: ReturnType<typeof pageHarness>) {
  const prepared = prepareBrewingScenarioContext(h.context);
  if (!h.context.recipe?.id) throw new Error('Recette synthétique exacte attendue pour la lecture legacy.');
  const reading = decisionService.readHopV55Question(question, prepared);
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:property-advice-q10-v2', ownerKey,
    workspaceId: 'workspace:property-advice-page-owner', recordedAt: '2026-10-03T10:00:00.000Z', reading,
    source: { kind: 'recipe', id: h.context.recipe.id }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'request:property-advice-q10-v3',
    ownerKey, workspaceId: 'workspace:property-advice-page-owner', sourceReadingReference: archive.contentReference,
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Archive Q10 legacy; aucune matière n’est préchoisie.' } });
  const answerSnapshot = propertyAdviceDomain.buildHopPropertyAdviceV3(draft.requestSnapshot);
  const answer = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot,
    answerRecordId: 'answer:property-advice-q10-v3' });
  const workspace = ensureHopV55ReferenceJournal({ format: 'hop-v55-workspace-v1', id: archive.workspaceId, ownerKey,
    revision: 0, title: 'Q10 · lecture historique de fixture', intent: reading.intent, sourceRecipeId: h.context.recipe.id,
    decisionReadings: [archive], documentaryAnswers: [answer], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-03T10:00:00.000Z' }, h.context, prepared);
  await h.save(workspace, null);
  return { archive, answer };
}

describe('Page V5.5 — réponse V3 par propriétés après réception', () => {
  it('archive Q10 avec ses fragments exacts, prépare une réponse V3 explicit[] et relit l’historique sans recalcul', async () => {
    const h = pageHarness();
    const legacy = await seedLegacyV2AndV3(h);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builderV2 = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdvice');
    const builderV3 = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const createAnswerV2 = vi.spyOn(propertyAdviceRecords, 'createHopV55PropertyAdviceAnswerRecord');
    const createDossier = vi.spyOn(propertyAdviceRecords, 'createHopV55PropertyAdviceDossierRecord');
    const createAnswerV3 = vi.spyOn(propertyAdviceRecordsV3, 'createHopV55PropertyAdviceAnswerRecordV3');

    render(<HopV55Page services={h.services} />);
    await screen.findByRole('textbox', { name: 'Question au brasseur' });
    fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByText(/Réponses et dossiers documentaires · 1/u));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette réponse documentaire', exact: true }));
    await screen.findByText('Conseil documentaire · V3');
    const stored = h.stored!;
    const archiveRead = readHopV55DecisionReadingArchive(stored.decisionReadings![0]);
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error('Une archive de lecture V2 est attendue.');
    }
    expect(stored.decisionReadings![0]).toEqual(legacy.archive);
    expect(stored.documentaryAnswers![0]).toEqual(legacy.answer);
    expect(archiveRead.archive.reading.intent.question).toBe(question);
    const exactCriteria = archiveRead.archive.reading.criterionDrafts.filter(row => ['poire', 'floral', 'amertume'].includes(row.source.text.toLocaleLowerCase('fr')));
    expect(exactCriteria.map(row => row.source.text.toLocaleLowerCase('fr'))).toEqual(expect.arrayContaining(['poire', 'floral', 'amertume']));
    for (const criterion of exactCriteria) {
      expect(question.slice(criterion.source.start, criterion.source.end)).toBe(criterion.source.text);
    }
    expect(archiveRead.archive.reading.branches).toEqual([]);
    expect(stored.documentaryAnswers).toHaveLength(1);
    expect(stored.documentaryAnswers!.some(row => row.format === 'hop-v55-documentary-answer-record-v1'
      || row.format === 'hop-v55-documentary-answer-record-v2')).toBe(false);
    expect(builderV2).not.toHaveBeenCalled();
    expect(createAnswerV2).not.toHaveBeenCalled();
    expect(createDossier).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(builderV3).not.toHaveBeenCalled();
    expect(createAnswerV3).not.toHaveBeenCalled();

    const answerRead = readHopV55DocumentaryAnswerRecord(stored.documentaryAnswers![0]);
    expect(answerRead.status).toBe('readOnly');
    if (answerRead.status !== 'readOnly' || answerRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Une réponse V3 doit être créée dès la première lecture après réception.');
    }
    const answer = answerRead.record.answerSnapshot;
    expect(answer.requestSnapshot.originalQuestion).toBe(question);
    expect(answer.requestSnapshot.candidatePolicy).toMatchObject({ kind: 'explicit', materialIds: [] });
    const mappedSourceSpans = answer.requestSnapshot.propertyIntents.flatMap(row => row.sourceSpans);
    for (const criterion of exactCriteria) expect(mappedSourceSpans).toContainEqual(criterion.source);

    expect(screen.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue(question);
    const writesBeforeRead = h.save.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Décider', exact: true }));
    await screen.findByRole('heading', { name: 'Répondre, puis arbitrer' });
    expect(parser).not.toHaveBeenCalled();
    expect(builderV2).not.toHaveBeenCalled();
    expect(builderV3).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(writesBeforeRead);
  });
});
