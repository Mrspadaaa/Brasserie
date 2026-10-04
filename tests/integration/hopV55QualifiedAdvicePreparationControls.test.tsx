import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HopAdviceAssertion, HopAdviceSituation } from '../../src/domain/hopDecision/adviceSchema';
import type { HopDecisionContext } from '../../src/domain/hopDecision/dossier';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { buildHopV55DecisionSituation } from '../../src/services/hopV55/decision';
import { hopV55DecisionReadingMaterialExclusions } from '../../src/services/hopV55/decisionCorrection';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { answerHopDecision, type HopDecisionIntent } from '../../src/domain/hopDecision/service';
import type { HopDecisionMaterial, HopDecisionProgram, HopProcessStage } from '../../src/domain/hopDecision/types';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { archiveHopV55SemanticReadingV1 } from '../../src/services/hopV55/decisionReadingAccessors';
import { projectHopV55SemanticDecisionV1 } from '../../src/services/hopV55/decisionSemanticProjection';
import { createHopV55DecisionReadingArchiveV2, type HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55QuestionReading } from '../../src/services/hopV55/decision';
import type { HopV55QualifiedAdvicePrepareRequest } from '../../src/services/hopV55/qualifiedAdviceController';
import { HopV55QualifiedAdvicePreparationControls } from '../../src/ui/hopV55/QualifiedAdvicePreparationControls';

afterEach(() => cleanup());

const ownerKey = 'fixture-owner-q09-controls';
const workspaceId = 'fixture-workspace-q09-controls';
const question = 'Quelles matières examiner sans changer le procédé ?';
const source = { kind: 'observation' as const, title: 'Observation de cave', author: 'Brasseur', year: 2026,
  reference: 'local:observation:aroma', locator: 'Dégustation de la cuve témoin.' };

function program(stage: HopProcessStage = 'planning'): HopDecisionProgram {
  return { id: `program:${stage}`, revision: 4, stage, volumeL: 20, wortGravity: null,
    additions: [{ id: 'addition:house-hop', materialId: 'variety:house-hop', grams: 12, use: 'boil', status: 'planned', boilMinutes: 45 }] };
}

const exactAssertion: HopAdviceAssertion = { id: 'assertion:fruit', subject: 'perception-fruit', statement: 'Une note fruitée a été déclarée.',
  state: 'reported', value: 'pomme', dimension: 'aroma', source };

function situation(stage: HopProcessStage = 'planning', suppliedProgram: HopDecisionProgram | null = null): HopAdviceSituation {
  return { stage, program: suppliedProgram, materialIds: ['legacy:must-not-copy'], assertions: [structuredClone(exactAssertion)],
    criterionDimensions: [{ criterionId: 'criterion:aroma', dimension: 'aroma', familyId: 'fruit' }],
    constraintChecks: [{ criterionId: 'criterion:aroma', kind: 'excludeMaterials', materialIds: ['variety:excluded'] }],
    exclusions: [{ materialId: 'variety:excluded', reason: 'Matière écartée dans la lecture source.', certainty: 'possible' }] };
}

function readingArchive(sourceKind: HopV55DecisionReadingSource, id = 'reading:q09-a') {
  const intent: HopDecisionIntent = { originalQuestion: question, interpretation: 'Étude de fixture.', criteria: [
    { id: 'criterion:aroma', description: 'Préserver la note aromatique déclarée.', role: 'constraint', origin: 'user' },
  ] };
  const response = answerHopDecision({ intent, action: { kind: 'exploreStrategies', situation: { ...situation(), materialIds: [] } }, materials: [] });
  const reading: HopV55QuestionReading = { intent: { question, criteria: [] }, criterionDrafts: [], interpretation: 'Lecture structurée de fixture.',
    response, branches: [], unresolved: [] };
  return createHopV55DecisionReadingArchiveV2({ id, ownerKey, workspaceId, recordedAt: '2026-10-03T09:00:00.000Z', reading,
    source: sourceKind, runtimeReference: `runtime:${id}` });
}

function prepared(currentProgram: HopDecisionProgram | null, withCurrent = true): PreparedBrewingScenarioContext {
  const runtime = { engineData: { varieties: [], lots: [], knowledge: [] }, materials: [],
    ...(withCurrent ? { current: { recipeReference: 'recipe-ref:fixture', inputReference: 'runtime-input:fixture',
      program: currentProgram } } : {}) };
  return { version: 'brewing-scenario-context-v1', runtime, limitations: [], provenance: [] } as unknown as PreparedBrewingScenarioContext;
}

function material(id: string, name: string): HopDecisionMaterial {
  return { id, name, form: 'pelletT90' } as HopDecisionMaterial;
}

interface FixtureProps {
  archive?: ReturnType<typeof readingArchive>;
  currentProgram?: HopDecisionProgram | null;
  baseSituation?: HopAdviceSituation;
  sourceContext?: HopDecisionContext | null | undefined;
  materials?: readonly HopDecisionMaterial[];
  prepared?: PreparedBrewingScenarioContext;
  readOnly?: boolean;
  onPrepare?: (request: HopV55QualifiedAdvicePrepareRequest) => Promise<void>;
}

function props(overrides: FixtureProps = {}) {
  const currentProgram = overrides.currentProgram === undefined ? program() : overrides.currentProgram;
  const archive = overrides.archive ?? readingArchive({ kind: 'recipe', id: 'recipe:fixture' });
  return {
    archive,
    prepared: overrides.prepared ?? prepared(currentProgram ?? null),
    baseSituation: overrides.baseSituation ?? situation(currentProgram?.stage ?? 'planning', currentProgram ?? null),
    materials: overrides.materials ?? [material('variety:house-hop', 'Houblon du programme'), material('variety:citra', 'Citra')],
    sourceContext: overrides.sourceContext === undefined
      ? { kind: 'recipe' as const, recipeId: 'recipe:fixture', recipeReference: 'recipe-ref:fixture' }
      : overrides.sourceContext,
    currentProgram,
    readOnly: overrides.readOnly ?? false,
    onPrepare: overrides.onPrepare ?? vi.fn(async () => {}),
  };
}

describe('HopV55QualifiedAdvicePreparationControls', () => {
  it('garde les faits exacts, permet de chercher sans sélectionner et envoie uniquement les identités cochées', async () => {
    const p = props();
    const onPrepare = vi.fn(async (_request: HopV55QualifiedAdvicePrepareRequest) => {});
    const view = render(<HopV55QualifiedAdvicePreparationControls {...p} onPrepare={onPrepare} />);
    expect(screen.getByLabelText('Question originale de la lecture')).toHaveTextContent(question);
    expect(screen.getByText('Aucune matière n’est incluse par défaut.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorer les fiches chargées (2)' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans les fiches chargées' }), { target: { value: 'Citra' } });
    const citra = screen.getByRole('checkbox', { name: /Citra/ });
    expect(citra).not.toBeChecked();
    fireEvent.click(citra);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));

    const request = onPrepare.mock.calls[0][0];
    expect(request.action.kind).toBe('exploreStrategies');
    expect(request.action.situation.materialIds).toEqual(['variety:citra']);
    expect(request.action.situation.program).toEqual(p.currentProgram);
    expect(request.action.situation.assertions).toEqual(p.baseSituation.assertions);
    expect(request.action.situation.criterionDimensions).toEqual(p.baseSituation.criterionDimensions);
    expect(request.action.situation.constraintChecks).toEqual(p.baseSituation.constraintChecks);
    expect(request.action.situation.exclusions).toEqual(p.baseSituation.exclusions);
    expect(request.action.situation.materialIds).not.toContain('variety:house-hop');
    expect(request.explicitFutureStage).toBeUndefined();
    expect(view.container).toHaveTextContent('La demande a été transmise à l’application.');
  });

  it('envoie un périmètre explicitement vide lorsque les fiches sont seulement consultées', async () => {
    const onPrepare = vi.fn(async (_request: HopV55QualifiedAdvicePrepareRequest) => {});
    render(<HopV55QualifiedAdvicePreparationControls {...props()} onPrepare={onPrepare} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explorer les fiches chargées (2)' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans les fiches chargées' }), { target: { value: 'Citra' } });
    expect(screen.getByRole('checkbox', { name: /Citra/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));
    expect(onPrepare.mock.calls[0][0].action.situation.materialIds).toEqual([]);
  });

  it('exige un stade et un motif avant de préparer une exploration sans programme exact', async () => {
    const exploration = readingArchive({ kind: 'exploration' }, 'reading:exploration');
    const onPrepare = vi.fn(async (_request: HopV55QualifiedAdvicePrepareRequest) => {});
    render(<HopV55QualifiedAdvicePreparationControls {...props({ archive: exploration, currentProgram: null, sourceContext: null,
      prepared: prepared(null, false), baseSituation: situation('planning', null) })} onPrepare={onPrepare} />);
    const submit = screen.getByRole('button', { name: 'Préparer l’étude qualifiée' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Stade envisagé pour cette étude' }), { target: { value: 'conditioning' } });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du stade futur' }), { target: { value: 'Comparer les effets pendant la garde.' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));
    expect(onPrepare.mock.calls[0][0]).toEqual({ action: { kind: 'exploreStrategies', situation: {
      ...situation('planning', null), stage: 'conditioning', program: null, materialIds: [],
    } }, explicitFutureStage: { kind: 'futureExploration', stage: 'conditioning', basis: 'Comparer les effets pendant la garde.' } });
  });

  it('refuse un batch sans stade exact et ne propose pas de le renommer en exploration future', () => {
    const exactProgram = program('conditioning');
    const batchArchive = readingArchive({ kind: 'batch', id: 'batch:fixture' }, 'reading:batch');
    render(<HopV55QualifiedAdvicePreparationControls {...props({ archive: batchArchive, currentProgram: exactProgram,
      sourceContext: { kind: 'batch', batchId: 'batch:fixture', recipeId: 'recipe:fixture', recipeSnapshotReference: 'recipe-snapshot:1',
        brewDayRevision: 4, programFingerprint: programFingerprint(exactProgram), stage: 'unknown' },
      baseSituation: situation('conditioning', exactProgram), prepared: prepared(exactProgram) })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le stade du brassin est absent ou inconnu');
    expect(screen.queryByRole('combobox', { name: 'Stade envisagé pour cette étude' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Préparer l’étude qualifiée' })).not.toBeInTheDocument();
  });

  it('garde le stade réel d’un batch quand aucun programme exact n’est transmis, sans proposer un stade futur', async () => {
    const batchArchive = readingArchive({ kind: 'batch', id: 'batch:fixture' }, 'reading:batch-no-program');
    const onPrepare = vi.fn(async (_request: HopV55QualifiedAdvicePrepareRequest) => {});
    render(<HopV55QualifiedAdvicePreparationControls {...props({ archive: batchArchive, currentProgram: null,
      sourceContext: { kind: 'batch', batchId: 'batch:fixture', recipeId: 'recipe:fixture', recipeSnapshotReference: 'recipe-snapshot:1',
        brewDayRevision: 4, programFingerprint: 'fingerprint:unverifiable', stage: 'conditioning' },
      baseSituation: situation('conditioning', null), prepared: prepared(null) })} onPrepare={onPrepare} />);
    expect(screen.getByText('Stade réel du brassin')).toBeInTheDocument();
    expect(screen.getByText(/aucun programme exact n’est fourni/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Stade envisagé pour cette étude' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));
    expect(onPrepare.mock.calls[0][0].action.situation).toMatchObject({ stage: 'conditioning', program: null, materialIds: [] });
    expect(onPrepare.mock.calls[0][0].explicitFutureStage).toBeUndefined();
  });

  it('refuse un programme qui ne correspond pas à l’empreinte du journal du batch', () => {
    const exactProgram = program('conditioning');
    const batchArchive = readingArchive({ kind: 'batch', id: 'batch:fixture' }, 'reading:batch-wrong-program');
    render(<HopV55QualifiedAdvicePreparationControls {...props({ archive: batchArchive, currentProgram: exactProgram,
      sourceContext: { kind: 'batch', batchId: 'batch:fixture', recipeId: 'recipe:fixture', recipeSnapshotReference: 'recipe-snapshot:1',
        brewDayRevision: 4, programFingerprint: 'fingerprint:wrong', stage: 'conditioning' },
      baseSituation: situation('conditioning', exactProgram), prepared: prepared(exactProgram) })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le programme transmis ne correspond pas à l’empreinte');
    expect(screen.queryByRole('button', { name: 'Préparer l’étude qualifiée' })).not.toBeInTheDocument();
  });

  it('ne remplace pas un programme non fourni par celui qui se trouve dans Prepared', () => {
    const p = props();
    render(<HopV55QualifiedAdvicePreparationControls {...p} currentProgram={undefined} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le contexte source ou le programme exact n’a pas été fourni');
    expect(screen.queryByRole('button', { name: 'Préparer l’étude qualifiée' })).not.toBeInTheDocument();
  });

  it('ne reprend pas une recette hôte pour une lecture d’exploration sans source physique', () => {
    const exploration = readingArchive({ kind: 'exploration' }, 'reading:exploration-with-host-recipe');
    render(<HopV55QualifiedAdvicePreparationControls {...props({ archive: exploration, sourceContext: null, currentProgram: null,
      prepared: prepared(program(), true), baseSituation: situation('planning', null) })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Une exploration sans source physique ne peut reprendre le programme d’une autre recette');
    expect(screen.queryByRole('combobox', { name: 'Stade envisagé pour cette étude' })).not.toBeInTheDocument();
  });

  it('ne présente pas comme réussite de A une demande tardive après le passage à une autre lecture', async () => {
    let resolveA!: () => void;
    const pending = new Promise<void>(resolve => { resolveA = resolve; });
    const onPrepareA = vi.fn(() => pending);
    const a = props({ onPrepare: onPrepareA });
    const view = render(<HopV55QualifiedAdvicePreparationControls {...a} />);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    expect(onPrepareA).toHaveBeenCalledTimes(1);

    const b = props({ archive: readingArchive({ kind: 'recipe', id: 'recipe:fixture' }, 'reading:q09-b'),
      onPrepare: vi.fn(async () => {}) });
    view.rerender(<HopV55QualifiedAdvicePreparationControls {...b} />);
    await act(async () => { resolveA(); await pending; });
    expect(screen.getByLabelText('Question originale de la lecture')).toHaveTextContent(question);
    expect(screen.queryByText('La demande a été transmise à l’application.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeInTheDocument();
  });

  it('réessaie strictement la même demande après un échec', async () => {
    const onPrepare = vi.fn()
      .mockRejectedValueOnce(new Error('Réseau indisponible'))
      .mockResolvedValueOnce(undefined);
    render(<HopV55QualifiedAdvicePreparationControls {...props({ onPrepare })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Réseau indisponible');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la même demande' }));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(2));
    expect(onPrepare.mock.calls[1][0]).toBe(onPrepare.mock.calls[0][0]);
    expect(await screen.findByRole('status')).toHaveTextContent('La demande a été transmise à l’application.');
  });

  it('garde les commandes absentes en lecture seule', () => {
    const onPrepare = vi.fn(async () => {});
    render(<HopV55QualifiedAdvicePreparationControls {...props({ readOnly: true, onPrepare })} />);
    expect(screen.getByText('Cette lecture est en consultation seule; aucun nouveau conseil ne peut être demandé ici.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeDisabled();
    expect(onPrepare).not.toHaveBeenCalled();
  });

  it('garde la lecture V4, ses annotations et ses portées exactes pendant le choix du contexte qualifié', async () => {
    const context = makeHopV55FixtureContext('planning');
    const preparedV4 = prepareBrewingScenarioContext(context);
    const q09 = 'Quand avec ma levure, utiliser au mieux mes houblons et lesquels ?';
    const { reading, scopeDrafts } = readHopV55QuestionSemanticWithScopesV1(q09, preparedV4);
    const recipe = context.recipe!;
    const archive = archiveHopV55SemanticReadingV1({ reading, scopeDrafts, id: 'reading:q09-semantic', ownerKey, workspaceId,
      recordedAt: '2026-10-04T08:00:00.000Z', source: { kind: 'recipe', id: recipe.id }, runtimeReference: 'runtime:q09-semantic' });
    const projected = projectHopV55SemanticDecisionV1(reading.annotations);
    const baseSituation = buildHopV55DecisionSituation(preparedV4.runtime.current, projected.drafts,
      hopV55DecisionReadingMaterialExclusions({ response: reading.response }));
    const sourceContext: HopDecisionContext = { kind: 'recipe', recipeId: recipe.id, recipeReference: hopDecisionReference(recipe) };
    const onPrepare = vi.fn(async (_request: HopV55QualifiedAdvicePrepareRequest) => {});
    render(<HopV55QualifiedAdvicePreparationControls archive={archive} prepared={preparedV4} baseSituation={baseSituation}
      materials={preparedV4.runtime.materials} sourceContext={sourceContext} currentProgram={preparedV4.runtime.current?.program ?? null}
      onPrepare={onPrepare} />);

    expect(screen.getByText(q09)).toBeVisible();
    expect(screen.getByText('Aucune matière n’est incluse par défaut.')).toBeVisible();
    fireEvent.click(screen.getByText(/Critères, faits et exclusions repris/u));
    const semanticEvidence = screen.getByRole('region', { name: 'Annotations sémantiques V4 de la lecture' });
    for (const annotation of reading.annotations) {
      expect(semanticEvidence).toHaveTextContent(annotation.term);
      expect(semanticEvidence).toHaveTextContent(annotation.source.text);
    }
    expect(semanticEvidence).toHaveTextContent('Projection et couverture scellées');
    const scopeEvidence = screen.getByRole('region', { name: 'Portées V4 de la lecture' });
    expect(scopeEvidence).toHaveTextContent(archive.scopeLedger!.reference);
    expect(scopeEvidence).toHaveTextContent(scopeDrafts[0].sourceSpan.text);
    expect(scopeEvidence).toHaveTextContent(scopeDrafts[1].sourceSpan.text);
    expect(archive.format).toBe('hop-v55-decision-reading-v4');
    expect(archive.reading.annotations).toEqual(reading.annotations);
    expect(archive.scopeLedger?.sourceScopes).toEqual(scopeDrafts);

    const selectedMaterial = preparedV4.runtime.materials.find(row => row.id !== 'variety:house-hop') ?? preparedV4.runtime.materials[0];
    fireEvent.click(screen.getByRole('button', { name: /Explorer les fiches chargées/u }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans les fiches chargées' }), {
      target: { value: selectedMaterial.name },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: `Inclure ${selectedMaterial.name} · ID exact ${selectedMaterial.id}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(onPrepare).toHaveBeenCalledTimes(1));
    const request = onPrepare.mock.calls[0][0];
    expect(request.action.kind).toBe('exploreStrategies');
    expect(request.action.situation.materialIds).toEqual([selectedMaterial.id]);
    expect(request.action.situation.program).toEqual(preparedV4.runtime.current?.program);
    expect(request.action.situation.criterionDimensions).toEqual(baseSituation.criterionDimensions);
    expect(request.action.situation.assertions).toEqual(baseSituation.assertions);
    expect(request.action.situation.exclusions).toEqual(baseSituation.exclusions);
  });
});
