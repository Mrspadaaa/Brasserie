import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { HopDecisionProgram } from '../../src/domain/hopDecision/types';
import {
  createHopV55DecisionReadingArchiveV4,
  readHopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import type { HopV55SemanticCorrectionRequestV1 } from '../../src/ui/hopV55/SemanticDecisionReading';
import { SemanticDecisionReading } from '../../src/ui/hopV55/SemanticDecisionReading';
import { HopV55DecisionResponse } from '../../src/ui/hopV55/DecisionResponse';

afterEach(cleanup);

const prepared: PreparedBrewingScenarioContext = {
  version: 'brewing-scenario-context-v1',
  runtime: { engineData: { varieties: [], lots: [], knowledge: [] }, materials: [] },
  limitations: [],
  provenance: [],
};

const lowBitternessQuestion = 'Je veux une bière avec une faible amertume.';
const sourceReadingReference = 'hop-v55-decision-reading-v4:fixture-reference';

function targetReading(question = lowBitternessQuestion) {
  return readHopV55QuestionSemanticV1(question, prepared);
}

function sealedTarget() {
  const reading = targetReading();
  const archive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:semantic-ui-target',
    ownerKey: 'owner:semantic-ui',
    workspaceId: 'workspace:semantic-ui',
    recordedAt: '2026-10-04T08:00:00.000Z',
    reading,
    source: { kind: 'exploration' },
    runtimeReference: 'runtime:semantic-ui',
  });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('La fixture doit traverser le reader strict V4.');
  }
  return { archive, reading: reread.archive.reading };
}

describe('SemanticDecisionReading — restitution et correction de la lecture V4', () => {
  it('montre une cible qualitative engagée sans direction et conserve sa couverture hors projection', () => {
    const { archive, reading } = sealedTarget();
    const target = reading.annotations.find(row => row.term === 'amertume');
    expect(target).toMatchObject({ sense: 'qualitativeTarget', requirement: 'required', direction: null,
      qualification: 'faible', qualifierSource: { text: 'faible' } });
    expect(reading.projectionCoverage.notProjected).toContainEqual({ annotationId: target?.id,
      reason: 'qualitativeTargetWithoutDirection' });

    render(<SemanticDecisionReading question={lowBitternessQuestion} reading={reading}
      sourceReadingReference={archive.contentReference} />);

    const card = screen.getByText('Cette cible reste engagée sans direction, base actuelle ni valeur déduite.').closest('article');
    expect(card).not.toBeNull();
    expect(within(card!).getByText('Engagé')).toBeTruthy();
    expect(within(card!).queryByText('Hausse choisie')).toBeNull();
    expect(screen.getAllByText(/Cible qualitative engagée; aucune direction n’est transmise aux voies/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/annotations conservées hors projection/u)).toBeTruthy();

    fireEvent.click(screen.getByText('Sources et liens exacts'));
    expect(within(card!).getAllByText('« amertume »').length).toBeGreaterThan(0);
    expect(within(card!).getAllByText('« faible »').length).toBeGreaterThan(0);
  });

  it('distingue les constats, enquêtes et gardes formulés, sans convertir leur sens en changement choisi', () => {
    const question = 'Je trouve ma bière trop douce. Comment envisager une compensation avec mon houblon de jardin, tout en conservant la poire ? Je ne choisis pas encore de renforcer l’amertume. Il faut d’abord caractériser ce houblon.';
    const reading = targetReading(question);
    const sweetness = reading.annotations.find(row => row.term === 'douce');
    const compensation = reading.annotations.find(row => row.term === 'compensation');
    const pear = reading.annotations.find(row => row.term === 'poire');
    expect(sweetness).toMatchObject({ sense: 'reportedObservation', direction: null, requirement: 'optional' });
    expect(compensation).toMatchObject({ sense: 'investigation', direction: 'investigate', inquiry: 'compensation' });
    expect(pear).toMatchObject({ sense: 'guard', direction: 'keep' });

    render(<SemanticDecisionReading question={question} reading={reading} />);

    expect(screen.getByText(/Constat rapporté · Lecture initiale/u)).toBeTruthy();
    expect(screen.getAllByText(/Enquête/u).length).toBeGreaterThan(0);
    expect(screen.getByText('Garde · Préserver')).toBeTruthy();
    expect(screen.getAllByText(/Constat rapporté conservé, non transmis comme changement/u).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Enquête liée conservée sans projection primitive/u).length).toBeGreaterThan(0);
    for (const annotation of [sweetness, compensation, pear]) {
      expect(annotation).toBeDefined();
      expect(question.slice(annotation!.source.start, annotation!.source.end)).toBe(annotation!.source.text);
    }
  });

  it('exige motif et confirmation, garde les spans exacts et reprend le même identifiant après refus transitoire', async () => {
    const { archive, reading } = sealedTarget();
    const original = structuredClone(archive);
    const target = reading.annotations.find(row => row.term === 'amertume')!;
    const calls: HopV55SemanticCorrectionRequestV1[] = [];
    const save = vi.fn(async (request: HopV55SemanticCorrectionRequestV1) => {
      calls.push(structuredClone(request));
      if (calls.length === 1) throw new Error('Version à relire avant enregistrement.');
    });
    render(<SemanticDecisionReading question={lowBitternessQuestion} reading={reading}
      sourceReadingReference={archive.contentReference} onSaveCorrection={save} />);

    const button = screen.getByRole('button', { name: 'Enregistrer cette correction' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Sens de l’annotation · amertume'), { target: { value: 'directedChange' } });
    fireEvent.change(screen.getByLabelText('Direction de l’annotation · amertume'), { target: { value: 'increase' } });
    expect(screen.getByText(/annotations modifiées ci-dessus ne changent pas encore les voies ni leur couverture/u)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Motif de la correction sémantique'), { target: { value: 'Je voulais indiquer une hausse choisie.' } });
    expect((screen.getByRole('button', { name: 'Enregistrer cette correction' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Confirmer la correction sémantique'));
    expect((screen.getByRole('button', { name: 'Enregistrer cette correction' }) as HTMLButtonElement).disabled).toBe(false);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette correction' })); });
    expect(await screen.findByRole('alert')).toHaveTextContent('Version à relire avant enregistrement.');
    const retry = screen.getByRole('button', { name: 'Réessayer la même correction' });
    expect(retry).toBeTruthy();
    await act(async () => { fireEvent.click(retry); });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));

    expect(calls[1]).toEqual(calls[0]);
    expect(calls[0]).toMatchObject({ sourceReadingReference: archive.contentReference,
      reason: 'Je voulais indiquer une hausse choisie.', annotations: [expect.objectContaining({
        id: target.id, sense: 'directedChange', direction: 'increase', origin: 'brasseur',
        source: target.source, qualifierSource: target.qualifierSource,
      })] });
    expect(calls[0].commandId).toMatch(/^semantic-correction:/u);
    expect(archive).toEqual(original);
    expect(screen.getByText('Correction transmise pour créer une nouvelle version; cette lecture reste inchangée.')).toBeTruthy();
  });

  it('garde une archive historique ou sans référence exacte consultable mais non modifiable', () => {
    const { reading } = sealedTarget();
    const { rerender } = render(<SemanticDecisionReading question={lowBitternessQuestion} reading={reading}
      sourceReadingReference={sourceReadingReference} historical onSaveCorrection={vi.fn()} />);
    expect(screen.queryByLabelText('Sens de l’annotation · amertume')).toBeNull();
    expect(screen.getByText('Version archivée · lecture seule')).toBeTruthy();

    rerender(<SemanticDecisionReading question={lowBitternessQuestion} reading={reading} sourceReadingReference={sourceReadingReference}
      saving onSaveCorrection={vi.fn()} />);
    expect(screen.queryByLabelText('Sens de l’annotation · amertume')).toBeNull();
    expect((screen.getByRole('button', { name: 'Enregistrement…' }) as HTMLButtonElement).disabled).toBe(true);

    rerender(<SemanticDecisionReading question={lowBitternessQuestion} reading={reading} onSaveCorrection={vi.fn()} />);
    expect(screen.queryByLabelText('Sens de l’annotation · amertume')).toBeNull();
    expect(screen.getByText(/Référence exacte absente/u)).toBeTruthy();
  });

  it('ne reporte pas le succès d’une correction en attente sur une autre lecture affichée', async () => {
    const first = sealedTarget();
    const nextQuestion = 'Je choisis de diminuer l’amertume.';
    const nextReading = targetReading(nextQuestion);
    const nextArchive = createHopV55DecisionReadingArchiveV4({ id: 'reading:semantic-ui-next', ownerKey: 'owner:semantic-ui',
      workspaceId: 'workspace:semantic-ui', recordedAt: '2026-10-04T08:05:00.000Z', reading: nextReading,
      source: { kind: 'exploration' }, runtimeReference: 'runtime:semantic-ui-next' });
    let releaseCorrection!: () => void;
    const pendingCorrection = new Promise<void>(resolve => { releaseCorrection = resolve; });
    const save = vi.fn((_request: HopV55SemanticCorrectionRequestV1) => pendingCorrection);
    const { rerender } = render(<SemanticDecisionReading question={lowBitternessQuestion} reading={first.reading}
      sourceReadingReference={first.archive.contentReference} onSaveCorrection={save} />);

    fireEvent.change(screen.getByLabelText('Sens de l’annotation · amertume'), { target: { value: 'directedChange' } });
    fireEvent.change(screen.getByLabelText('Direction de l’annotation · amertume'), { target: { value: 'increase' } });
    fireEvent.change(screen.getByLabelText('Motif de la correction sémantique'), { target: { value: 'Nouvelle cible choisie.' } });
    fireEvent.click(screen.getByLabelText('Confirmer la correction sémantique'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette correction' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].sourceReadingReference).toBe(first.archive.contentReference);

    rerender(<SemanticDecisionReading question={nextQuestion} reading={nextReading}
      sourceReadingReference={nextArchive.contentReference} onSaveCorrection={save} />);
    await act(async () => { releaseCorrection(); await pendingCorrection; });

    expect(screen.getByText(nextQuestion)).toBeTruthy();
    expect(screen.queryByText(/Correction transmise pour créer une nouvelle version/u)).toBeNull();
  });

  it('accepte la lecture V4 exacte dans la réponse sans la réduire au correcteur V1–V3', () => {
    const { archive, reading } = sealedTarget();
    const program: HopDecisionProgram = { id: 'program:semantic-ui', revision: 3, stage: 'planning',
      volumeL: 20, wortGravity: null, additions: [] };
    render(<HopV55DecisionResponse reading={reading} prepared={prepared} archive={archive} program={program} programMaterials={[]}
      onPrepare={vi.fn()} onExplore={vi.fn()} onPrepareProgram={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Sens conservé de la demande' })).toBeTruthy();
    expect(screen.getAllByText(/Cible qualitative engagée; aucune direction n’est transmise aux voies/u).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Ajouter un critère/u })).toBeNull();
    expect(screen.queryByLabelText('Critères exacts de la demande')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Composer plusieurs opérations de programme' }));
    expect(screen.getByRole('region', { name: 'Préparer plusieurs opérations de programme' })).toBeTruthy();
    expect(screen.getByLabelText('Nom de la proposition de programme')).toBeTruthy();
  });
});
