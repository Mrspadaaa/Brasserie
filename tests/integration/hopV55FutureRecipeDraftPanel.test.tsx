import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeHopV55FutureRecipeDraftFixture } from '../fixtures/hopV55FutureRecipeDraft';
import { HopV55FutureRecipeDraftPanel } from '../../src/ui/hopV55/FutureRecipeDraftPanel';
import { createBrewingScenarioDossier } from '../../src/domain/brewingScenarioDossier';
import { simulateBrewingScenario } from '../../src/domain/brewingScenario';
import type { Recipe } from '../../src/types';
import { reviseHopV55FutureRecipeDraft, type HopV55FutureRecipeMaterializationReceiptV1, type HopV55FutureRecipeDraftV1,
  type HopV55FutureRecipeMassRecomputeProposalV1 } from '../../src/services/hopV55/futureRecipeDraft';

describe('atelier de brouillon futur V5.5', () => {
  it('conserve d’abord le scénario incomplet, restaure les champs puis ajoute une révision sans perdre la lignée', async () => {
    const user = userEvent.setup();
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const onSaveDraft = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const onMaterialize = vi.fn(async (_recipe: Recipe, _receipt: HopV55FutureRecipeMaterializationReceiptV1) => undefined);
    const onExplore = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const getCurrentReferences = vi.fn(async () => structuredClone(fixture.currentRefs));
    const loadDraftRevision = vi.fn(async (_identity: { draftId: string; revision: number; contentReference: string }): Promise<HopV55FutureRecipeDraftV1> => {
      throw Error('Le lecteur d’historique ne devrait pas être appelé avant la correction.');
    });
    function Panel({ initialDraft }: { initialDraft?: HopV55FutureRecipeDraftV1 }) {
      return <HopV55FutureRecipeDraftPanel result={fixture.result} snapshot={fixture.snapshot} branchId="future-mix"
        adoptedReference={fixture.adoptedReference} intent={fixture.intent} initialDraft={initialDraft}
        loadDraftRevision={loadDraftRevision} getCurrentReferences={getCurrentReferences}
        onSaveDraft={onSaveDraft} onMaterialize={onMaterialize} onExplore={onExplore} />;
    }

    const view = render(<Panel />);
    expect(screen.getByText('10,25 g')).toBeInTheDocument();
    expect(screen.getByText('5,75 g')).toBeInTheDocument();
    expect(screen.getAllByText(/36 h.*14 °C/)).toHaveLength(2);
    expect(screen.getByText('Volume de la prévision choisie')).toBeInTheDocument();
    expect(getCurrentReferences).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Conserver le brouillon local' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(1));
    const first = onSaveDraft.mock.calls[0][0];
    expect(first.hypotheticalBaseline.kind).toBe('hypothetical');
    expect(first.origin.snapshotReference).toBe(fixture.result.reference);
    expect(first.declaredFields).toEqual({});
    expect(getCurrentReferences).not.toHaveBeenCalled();

    view.unmount();
    render(<Panel initialDraft={first} />);
    expect(screen.getAllByText(/révision 1/)).toHaveLength(2);
    expect(screen.getByText('5,75 g')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nom de la future recette'), 'Bière composée');
    await user.type(screen.getByLabelText('Style de la future recette'), 'Pale ale déclarée');
    await user.type(screen.getByLabelText('Durée d’ébullition choisie'), '60');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 2' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(2));
    const second = onSaveDraft.mock.calls[1][0];
    expect(second.revision).toBe(2);
    expect(second.draftId).toBe(first.draftId);
    expect(second.predecessor).toEqual({ draftId: first.draftId, revision: 1, contentReference: first.contentReference });
    expect(second.declaredFields).toMatchObject({ name: 'Bière composée', style: 'Pale ale déclarée', boilMin: 60 });
    expect(fixture.result.reference).toBe(first.origin.resultReference);

    loadDraftRevision.mockImplementation(async identity => {
      expect(identity).toEqual(second.predecessor);
      return first;
    });
    await user.click(screen.getByRole('button', { name: 'Ouvrir la révision précédente' }));
    await waitFor(() => expect(screen.getByLabelText('Nom de la future recette')).toHaveValue(''));
    expect(screen.getByRole('button', { name: /lecture seule/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Explorer depuis ce brouillon' }));
    await waitFor(() => expect(onExplore).toHaveBeenCalledTimes(1));
    expect(onExplore.mock.calls[0][0].contentReference).toBe(first.contentReference);
    await user.click(screen.getByRole('button', { name: 'Retour à la dernière révision' }));
    expect(screen.getByLabelText('Nom de la future recette')).toHaveValue('Bière composée');
    expect(onSaveDraft).toHaveBeenCalledTimes(2);
  });

  it('ouvre une nouvelle exploration sur le baseline du brouillon et matérialise seulement après revalidation', async () => {
    const user = userEvent.setup();
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const saved = fixture.draft;
    const onSaveDraft = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const onMaterialize = vi.fn(async (_recipe: Recipe, _receipt: HopV55FutureRecipeMaterializationReceiptV1) => undefined);
    const onExplore = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const getCurrentReferences = vi.fn(async () => structuredClone(fixture.currentRefs));
    render(<HopV55FutureRecipeDraftPanel result={fixture.result} snapshot={fixture.snapshot} branchId="future-mix"
      adoptedReference={fixture.adoptedReference} intent={fixture.intent} initialDraft={saved}
      getCurrentReferences={getCurrentReferences} onSaveDraft={onSaveDraft} onMaterialize={onMaterialize} onExplore={onExplore} />);

    await user.click(screen.getByRole('button', { name: 'Explorer depuis ce brouillon' }));
    await waitFor(() => expect(onExplore).toHaveBeenCalledTimes(1));
    expect(onExplore.mock.calls[0][0].hypotheticalBaseline).toMatchObject({ kind: 'hypothetical', input: { volumeL: 8 } });
    expect(onExplore.mock.calls[0][0]).not.toHaveProperty('sourceRecipeId');
    expect(getCurrentReferences).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Nom de la future recette'), 'Essai du brasseur');
    await user.type(screen.getByLabelText('Style de la future recette'), 'Style choisi');
    await user.type(screen.getByLabelText('Durée d’ébullition choisie'), '60');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 2' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Créer la recette déclarée' })).toBeInTheDocument();
    expect(getCurrentReferences).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Créer la recette déclarée' }));
    expect(onMaterialize).not.toHaveBeenCalled();
    expect(await screen.findAllByText(/Déclare un alpha de travail/)).toHaveLength(2);
    await user.type(screen.getByLabelText('Alpha de travail · Identité fictive A'), '4.8');
    await user.type(screen.getByLabelText('Motif alpha · Identité fictive A'), 'Nominal de travail choisi; pas une analyse.');
    await user.type(screen.getByLabelText('Alpha de travail · Identité fictive B'), '5.2');
    await user.type(screen.getByLabelText('Motif alpha · Identité fictive B'), 'Nominal de travail choisi; pas une analyse.');
    await user.click(screen.getByRole('button', { name: 'Déclarer explicitement une formulation vide' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 3' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(2));
    expect(getCurrentReferences).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Créer la recette déclarée' }));
    await waitFor(() => expect(onMaterialize).toHaveBeenCalledTimes(1));
    expect(getCurrentReferences).toHaveBeenCalledTimes(2);
    const recipe = onMaterialize.mock.calls[0][0];
    expect(recipe).toMatchObject({ name: 'Essai du brasseur', style: 'Style choisi', volumeL: 8, boilMin: 60 });
    expect(recipe.hops.map(row => row.weightG)).toEqual([10.25, 5.75]);
    expect(recipe.hops.map(row => row.alpha)).toEqual([4.8, 5.2]);
    expect(onMaterialize.mock.calls[0][1].adoptedReference).toEqual(fixture.adoptedReference);
  });

  it('prépare la nouvelle origine J5 comme révision explicite, sans transférer les alpha d’une autre opération', async () => {
    const user = userEvent.setup();
    const previousFixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: 17, firstAdditionId: 'old-hop-17g',
      secondAdditionGrams: null, secondAdditionId: 'old-unknown-mass' });
    const previousPreparation = reviseHopV55FutureRecipeDraft(previousFixture.draft, { revision: 2, declaredFields: {
      name: 'Mélange déclaré',
      fermentation: [{ kind: 'primaire', name: 'Palier choisi auparavant', tempC: 14, days: 3 }],
      alphaChoices: { 'old-hop-17g': { value: 4.8, reason: 'Valeur de travail explicitement choisie.' } },
      hopMassChoices: { 'old-unknown-mass': 3.5 },
    } });
    expect(previousPreparation.status).toBe('ready');
    if (previousPreparation.status !== 'ready') throw Error(previousPreparation.reason);
    const previous = previousPreparation.draft;
    expect(previous.declaredFields.fermentation?.[0].name).toBe('Palier choisi auparavant');
    const nextFixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: 19, firstAdditionId: 'new-hop-19g',
      scenarioId: 'future-draft-recomputed-scenario' });
    const onSaveDraft = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const onMaterialize = vi.fn(async (_recipe: Recipe, _receipt: HopV55FutureRecipeMaterializationReceiptV1) => undefined);
    const onExplore = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const getCurrentReferences = vi.fn(async () => structuredClone(nextFixture.currentRefs));
    const loadDraftRevision = vi.fn(async (_identity: { draftId: string; revision: number; contentReference: string }) => previous);
    render(<HopV55FutureRecipeDraftPanel result={nextFixture.result} snapshot={nextFixture.snapshot} branchId="future-mix"
      adoptedReference={nextFixture.adoptedReference} intent={nextFixture.intent} initialDraft={previous}
      loadDraftRevision={loadDraftRevision} getCurrentReferences={getCurrentReferences}
      onSaveDraft={onSaveDraft} onMaterialize={onMaterialize} onExplore={onExplore} />);

    expect(screen.getByText('19 g')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle prévision à conserver')).toBeInTheDocument();
    expect(screen.getByText(/anciens ajouts ne sont pas reportés/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nom de la future recette')).toHaveValue('Mélange déclaré');
    expect(screen.getByText(/Palier choisi auparavant/)).toBeInTheDocument();
    expect(onSaveDraft).not.toHaveBeenCalled();
    expect(onMaterialize).not.toHaveBeenCalled();
    expect(getCurrentReferences).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 3' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(1));
    const nextRevision = onSaveDraft.mock.calls[0][0];
    expect(nextRevision).toMatchObject({ draftId: previous.draftId, revision: 3,
      predecessor: { draftId: previous.draftId, revision: 2, contentReference: previous.contentReference },
      origin: { snapshotReference: nextFixture.snapshot.reference, resultReference: nextFixture.result.reference },
      declaredFields: { name: 'Mélange déclaré', fermentation: [{ kind: 'primaire', name: 'Palier choisi auparavant', tempC: 14, days: 3 }],
        alphaChoices: {}, hopMassChoices: {} },
    });
    expect(nextRevision.additions.map(row => row.addition.grams)).toEqual([19, 5.75]);
    expect(nextRevision.origin.snapshotReference).not.toBe(previous.origin.snapshotReference);
    expect(onMaterialize).not.toHaveBeenCalled();
    expect(getCurrentReferences).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Ouvrir la révision précédente' }));
    await waitFor(() => expect(screen.getByText('17 g')).toBeInTheDocument());
    expect(screen.queryByText('19 g')).not.toBeInTheDocument();
    expect(loadDraftRevision).toHaveBeenCalledWith({ draftId: previous.draftId, revision: 2, contentReference: previous.contentReference });
    await user.click(screen.getByRole('button', { name: 'Retour à la dernière révision' }));
    expect(await screen.findByText('19 g')).toBeInTheDocument();
  });

  it('fait confirmer le nouveau volume avant la révision et conserve les masses J5 sans scaler', async () => {
    const user = userEvent.setup();
    const previousFixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: 17, scenarioId: 'future-draft-volume-8' });
    const previousPreparation = reviseHopV55FutureRecipeDraft(previousFixture.draft, { revision: 2,
      declaredFields: { name: 'Mélange déclaré', volumeL: 8 } });
    expect(previousPreparation.status).toBe('ready');
    if (previousPreparation.status !== 'ready') throw Error(previousPreparation.reason);
    const previous = previousPreparation.draft;
    const nextFixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: 17, volumeL: 9,
      scenarioId: 'future-draft-volume-9' });
    const onSaveDraft = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const onMaterialize = vi.fn(async (_recipe: Recipe, _receipt: HopV55FutureRecipeMaterializationReceiptV1) => undefined);
    const onExplore = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    render(<HopV55FutureRecipeDraftPanel result={nextFixture.result} snapshot={nextFixture.snapshot} branchId="future-mix"
      adoptedReference={nextFixture.adoptedReference} intent={nextFixture.intent} initialDraft={previous}
      getCurrentReferences={async () => structuredClone(nextFixture.currentRefs)} onSaveDraft={onSaveDraft}
      onMaterialize={onMaterialize} onExplore={onExplore} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/volume déclaré diverge/);
    expect(screen.getByRole('button', { name: 'Adopter explicitement les 9 L de la nouvelle prévision' })).toBeInTheDocument();
    expect(onSaveDraft).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Adopter explicitement les 9 L de la nouvelle prévision' }));
    expect(screen.getByText('17 g')).toBeInTheDocument();
    expect(screen.getByText('5,75 g')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 3' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(1));
    const revised = onSaveDraft.mock.calls[0][0];
    expect(revised.hypotheticalBaseline.program.volumeL).toBe(9);
    expect(revised.additions.map(row => row.addition.grams)).toEqual([17, 5.75]);
    expect(revised.declaredFields.volumeL).toBe(9);
    expect(onMaterialize).not.toHaveBeenCalled();
  });

  it('traite une masse J5 inconnue comme un choix de programme et exige un nouveau J5 avant l’export', async () => {
    const user = userEvent.setup();
    const fixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: null, firstAdditionId: 'unknown-mass-hop',
      secondAdditionGrams: 5.125 });
    const onSaveDraft = vi.fn(async (_draft: HopV55FutureRecipeDraftV1) => undefined);
    const onMaterialize = vi.fn(async (_recipe: Recipe, _receipt: HopV55FutureRecipeMaterializationReceiptV1) => undefined);
    const onExplore = vi.fn(async (_draft: HopV55FutureRecipeDraftV1, _proposal?: HopV55FutureRecipeMassRecomputeProposalV1) => undefined);
    let currentRefs = structuredClone(fixture.currentRefs);
    const getCurrentReferences = vi.fn(async () => structuredClone(currentRefs));
    const view = render(<HopV55FutureRecipeDraftPanel result={fixture.result} snapshot={fixture.snapshot} branchId="future-mix"
      adoptedReference={fixture.adoptedReference} intent={fixture.intent} getCurrentReferences={getCurrentReferences}
      onSaveDraft={onSaveDraft} onMaterialize={onMaterialize} onExplore={onExplore} />);

    expect(screen.getByText('Masse inconnue dans la prévision')).toBeInTheDocument();
    expect(screen.getByLabelText('Masse proposée · Identité fictive A')).toBeInTheDocument();
    const userMessage = screen.getByText(/La prévision affichée ne précise pas la masse pour Identité fictive A/);
    expect(userMessage).toBeInTheDocument();
    expect(userMessage.textContent).not.toContain('hops.unknown-mass-hop.grams');
    await user.click(screen.getByText('Détails techniques des champs à compléter'));
    expect(screen.getByText('hops.unknown-mass-hop.grams')).toBeInTheDocument();
    expect(getCurrentReferences).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Nom de la future recette'), 'Bière déclarée');
    await user.type(screen.getByLabelText('Style de la future recette'), 'Blonde choisie');
    await user.type(screen.getByLabelText('Durée d’ébullition choisie'), '60');
    await user.type(screen.getByLabelText('Masse proposée · Identité fictive A'), '11.625');
    await user.type(screen.getByLabelText('Alpha de travail · Identité fictive A'), '4.8');
    await user.type(screen.getByLabelText('Motif alpha · Identité fictive A'), 'Nominal choisi pour la recette.');
    await user.type(screen.getByLabelText('Alpha de travail · Identité fictive B'), '5.2');
    await user.type(screen.getByLabelText('Motif alpha · Identité fictive B'), 'Nominal choisi pour la recette.');
    await user.click(screen.getByRole('button', { name: 'Déclarer explicitement une formulation vide' }));
    await user.click(screen.getByRole('button', { name: 'Conserver le brouillon local' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(1));
    expect(onSaveDraft.mock.calls[0][0].additions[0].addition.grams).toBeNull();
    expect(onSaveDraft.mock.calls[0][0].declaredFields.hopMassChoices).toEqual({ 'unknown-mass-hop': 11.625 });
    expect(getCurrentReferences).not.toHaveBeenCalled();

    expect(screen.getByRole('button', { name: 'Nouvelle prévision requise' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Prévoir à nouveau avec les masses déclarées' }));
    await waitFor(() => expect(onExplore).toHaveBeenCalledTimes(1));
    const exploredDraft = onExplore.mock.calls[0][0];
    const proposal = onExplore.mock.calls[0][1];
    expect(exploredDraft.additions[0].addition.grams).toBeNull();
    expect(proposal.proposedBaseline.program.additions.map(row => row.grams)).toEqual([11.625, 5.125]);
    expect(proposal.proposedBaseline.program.additions.map(row => row.id)).toEqual(exploredDraft.additions.map(row => row.additionId));
    expect(proposal.proposedBaseline.input.additions.map(row => row.triplet.doseGL)).toEqual([11.625 / 8, 5.125 / 8]);
    expect(onMaterialize).not.toHaveBeenCalled();
    expect(getCurrentReferences).not.toHaveBeenCalled();

    const scenarioId = 'future-draft-ui-recomputed-zero';
    const nextRequest = { ...fixture.request, scenarioId, revision: 2, baseline: proposal.proposedBaseline };
    const nextResult = simulateBrewingScenario(nextRequest, fixture.runtime);
    const nextSnapshot = createBrewingScenarioDossier({ ownerKey: 'owner-future-draft-panel-fixture', scenarioId,
      eventId: 'result-saved-ui-recomputed-zero', recordedAt: '2026-10-02T13:00:00.000Z', result: nextResult }).event.payload.snapshot;
    const nextBranch = nextResult.branches.find(row => row.id === 'future-mix')!;
    expect(nextBranch.program?.additions.map(row => row.grams)).toEqual([11.625, 5.125]);
    currentRefs = { snapshot: nextSnapshot, adoptedReference: fixture.adoptedReference,
      materials: structuredClone(nextBranch.dependencySnapshot.decisionMaterials) };
    const selectedDraft = onSaveDraft.mock.calls[0][0];
    view.rerender(<HopV55FutureRecipeDraftPanel result={nextResult} snapshot={nextSnapshot} branchId="future-mix"
      adoptedReference={fixture.adoptedReference} intent={fixture.intent} initialDraft={selectedDraft}
      getCurrentReferences={getCurrentReferences} onSaveDraft={onSaveDraft} onMaterialize={onMaterialize} onExplore={onExplore} />);
    expect(screen.getByText('Nouvelle prévision à conserver')).toBeInTheDocument();
    expect(screen.getByText('11,625 g')).toBeInTheDocument();
    expect(screen.getByText('5,125 g')).toBeInTheDocument();
    expect(screen.queryByLabelText('Masse proposée · Identité fictive A')).not.toBeInTheDocument();
    expect(screen.queryByText(/choix liés aux anciens ajouts ne sont pas reportés/)).not.toBeInTheDocument();
    expect(getCurrentReferences).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Enregistrer la révision 2' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledTimes(2));
    const confirmedJ5Draft = onSaveDraft.mock.calls[1][0];
    expect(confirmedJ5Draft.origin.snapshotReference).toBe(nextSnapshot.reference);
    expect(confirmedJ5Draft.predecessor).toEqual({ draftId: selectedDraft.draftId, revision: selectedDraft.revision,
      contentReference: selectedDraft.contentReference });
    expect(confirmedJ5Draft.additions.map(row => row.addition.grams)).toEqual([11.625, 5.125]);
    expect(confirmedJ5Draft.declaredFields.hopMassChoices).toEqual({});
    await user.click(screen.getByRole('button', { name: 'Créer la recette déclarée' }));
    await waitFor(() => expect(onMaterialize).toHaveBeenCalledTimes(1));
    expect(onMaterialize.mock.calls[0][0].hops.map(row => row.weightG)).toEqual([11.625, 5.125]);
    expect(onMaterialize.mock.calls[0][1].sourceSnapshotReference).toBe(nextSnapshot.reference);
    expect(onMaterialize.mock.calls[0][1].hopMappings.map(row => row.addition.grams)).toEqual([11.625, 5.125]);
    expect(onMaterialize.mock.calls[0][1].hopMappings[0]).not.toHaveProperty('massChoice');
    expect(onMaterialize.mock.calls[0][1].readiness.brew).toBe('incomplete');
    expect(getCurrentReferences).toHaveBeenCalledTimes(1);
  });
});
