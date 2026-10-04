import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopVariety, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopAxis, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryDimension } from '../../src/domain/brewingSensory';
import { assertBrewingNuancePlan, type BrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import * as predictor from '../../functions/src/hopRecipePrediction';
import * as scenario from '../../src/domain/brewingScenario';
import bootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolations from '../../src/data/hopExtrapolationBootstrap.json';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';
import { testHopPolicy, testHopYeast } from '../fixtures/hopPrediction';
import { HopV55NuancePlanEditor, type NuancePlanDimensionCandidate } from '../../src/ui/hopV55/NuancePlanEditor';
import { targetOptions } from '../../src/ui/hopV55/nuancePlanParameters';

const model = structuredClone(extrapolations[0]) as HopExtrapolation;
const axes = structuredClone(bootstrap.filter((row) => row.kind === 'axis')) as HopAxis[];
const source: HopSource = { ...hopTestSource, title: 'Fiche de dégustation déclarée', reference: 'note:pear-01' };
const pear: HopVariety = { ...hopTestVariety(), id: 'plan-editor-pear', name: 'Variété · poire',
  descriptions: [{ text: 'Poire mûre', context: 'rawHop', source }], analysis: [] };
const knowledge = [...axes, testHopYeast, testHopPolicy, model] as HopKnowledge[];
const data: HopEngineData = { varieties: [pear], lots: [], knowledge };
const prepared = { version: 'brewing-scenario-context-v1', runtime: { engineData: data, materials: [] },
  limitations: [], provenance: [] } as unknown as PreparedBrewingScenarioContext;
const dimension: BrewingSensoryDimension = { id: 'note-dimension-pear', version: '4', name: 'Poire mûre',
  definition: 'Nuance décrite dans la note, sans niveau quantitatif.', terms: ['poire mûre'], sourceRefs: [source] };
const noteDimension: NuancePlanDimensionCandidate = { dimension,
  source: { kind: 'note', reference: 'note:pear-01', label: 'Note de dégustation · service fin de fermentation' } };

function makeWorkspace(nuancePlans: BrewingNuancePlan[] = []): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id: 'workspace-nuance-plan-editor', ownerKey: 'fixture-owner', revision: 0,
    title: 'Plans de nuance', intent: { question: 'Étudier un repère', criteria: [] }, scenarioIds: [], activeScenarioId: undefined,
    referenceHypotheses: [], nuancePlans: structuredClone(nuancePlans), copies: [], updatedAt: '2026-10-02T08:00:00.000Z' };
}

afterEach(() => cleanup());

describe('éditeur de plans de nuance indépendant d’une prévision', () => {
  it('propose, adopte et révise un plan depuis les références communes sans lancer de simulation', async () => {
    let stored = makeWorkspace();
    const getWorkspace = vi.fn(async () => structuredClone(stored));
    const onSave = vi.fn(async (next: HopV55Workspace) => {
      if (next.id !== stored.id || next.revision !== stored.revision) throw Error('Révision CAS périmée.');
      stored = { ...structuredClone(next), revision: stored.revision + 1, updatedAt: new Date().toISOString() };
      return structuredClone(stored);
    });
    const predictionSpy = vi.spyOn(predictor, 'predictHopRecipe');
    const scenarioSpy = vi.spyOn(scenario, 'simulateBrewingScenario');
    try {
      render(<HopV55NuancePlanEditor prepared={prepared} workspace={stored} getWorkspace={getWorkspace} onSave={onSave}
        dimensionCandidates={[noteDimension]} />);
      expect(stored.nuancePlans).toEqual([]);
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Modèle d’extrapolation exact')).toHaveValue('');
      expect(screen.getByLabelText(/Dimension Poire mûre · Note · Note de dégustation · service fin de fermentation/)).not.toBeChecked();

      fireEvent.change(screen.getByLabelText('Modèle d’extrapolation exact'), {
        target: { value: `${model.id}@${model.version}` },
      });
      fireEvent.click(screen.getByLabelText(/Dimension Poire mûre · Note · Note de dégustation · service fin de fermentation/));
      fireEvent.click(screen.getByRole('button', { name: 'Proposer les variantes disponibles' }));
      await waitFor(() => expect(stored.nuancePlans!.length).toBeGreaterThan(0));
      const proposed = structuredClone(stored.nuancePlans![0]);
      expect(stored.nuancePlans!.every((plan) => plan.status === 'proposed')).toBe(true);
      expect(proposed.proposedBy).toEqual({ origin: 'user', name: 'Utilisateur local' });
      expect(proposed.definitions[0].dimension).toEqual(dimension);
      expect(proposed.definitions[0].dimensionReference).toBe(createBrewingSensoryDefinitionReference(dimension, null, null).dimensionReference);
      expect(proposed.sourceModelReference).toBeTruthy();
      expect(proposed.doseAxisReference).toBeTruthy();
      expect(proposed.definitions[0].dimension.sourceRefs).toContainEqual(source);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(predictionSpy).not.toHaveBeenCalled();
      expect(scenarioSpy).not.toHaveBeenCalled();

      const proposedCard = screen.getAllByRole('article').find((card) => card.textContent?.includes(proposed.planId));
      expect(proposedCard).toBeTruthy();
      expect(within(proposedCard!).getByRole('button', { name: 'Adopter cette version' })).toBeDisabled();
      fireEvent.change(within(proposedCard!).getByRole('textbox', { name: 'Pourquoi adopter cette hypothèse ?' }), {
        target: { value: 'Conserver les plages source pour ce protocole de note.' },
      });
      fireEvent.click(within(proposedCard!).getByRole('button', { name: 'Adopter cette version' }));
      await waitFor(() => expect(stored.nuancePlans!.some((plan) => plan.status === 'adopted')).toBe(true));
      const adopted = structuredClone(stored.nuancePlans!.find((plan) => plan.status === 'adopted')!);
      expect(stored.nuancePlans!.find((plan) => plan.reference === proposed.reference)).toEqual(proposed);
      expect(adopted.adoption?.proposalReference).toBe(proposed.reference);
      expect(adopted.adoption?.reason).toBe('Conserver les plages source pour ce protocole de note.');
      assertBrewingNuancePlan(adopted);

      const adoptedCard = screen.getAllByRole('article').find((card) => card.textContent?.includes(adopted.reference));
      expect(adoptedCard).toBeTruthy();
      fireEvent.click(within(adoptedCard!).getByRole('button', { name: 'Créer une nouvelle révision' }));
      const doseOption = targetOptions(adopted).find((option) => option.target.kind === 'dimension' && option.target.parameter === 'doseScale');
      expect(doseOption).toBeTruthy();
      fireEvent.change(within(adoptedCard!).getByRole('combobox', { name: 'Paramètre exact' }), {
        target: { value: doseOption!.key },
      });
      const priorChoice = targetOptions(adopted).find((option) => option.key === doseOption!.key)!;
      const min = priorChoice.range.min > 0 ? priorChoice.range.min : priorChoice.range.max / 4;
      const max = priorChoice.range.max;
      const central = (min + max) / 2;
      fireEvent.change(within(adoptedCard!).getByRole('textbox', { name: 'Borne basse' }), { target: { value: String(min) } });
      fireEvent.change(within(adoptedCard!).getByRole('textbox', { name: 'Borne haute' }), { target: { value: String(max) } });
      fireEvent.change(within(adoptedCard!).getByRole('textbox', { name: 'Centrale déclarée' }), { target: { value: String(central) } });
      fireEvent.change(within(adoptedCard!).getByRole('textbox', { name: 'Raison de la révision' }), {
        target: { value: 'Réviser la plage de dose de cette dimension précise.' },
      });
      fireEvent.click(within(adoptedCard!).getByRole('button', { name: 'Enregistrer la nouvelle proposition' }));
      await waitFor(() => expect(stored.nuancePlans!.some((plan) => plan.status === 'proposed'
        && plan.previousReference === adopted.reference)).toBe(true));
      const revised = stored.nuancePlans!.find((plan) => plan.status === 'proposed' && plan.previousReference === adopted.reference)!;
      expect(revised.parameterChoices).toHaveLength(1);
      expect(revised.parameterChoices[0].target).toEqual(doseOption!.target);
      expect(revised.parameterChoices[0].range).toEqual({ min, max });
      expect(revised.parameterChoices[0].central).toBe(central);
      expect(revised.parameterChoices[0].sourceRefs[0].locator).toBe('Réviser la plage de dose de cette dimension précise.');
      expect(stored.nuancePlans!.find((plan) => plan.reference === adopted.reference)).toEqual(adopted);
      expect(onSave).toHaveBeenCalledTimes(3);
      expect(predictionSpy).not.toHaveBeenCalled();
      expect(scenarioSpy).not.toHaveBeenCalled();
    } finally {
      predictionSpy.mockRestore();
      scenarioSpy.mockRestore();
    }
  });

  it('refuse une proposition tant que le modèle, les dimensions ou la provenance déclarée manquent', async () => {
    const stored = makeWorkspace();
    const getWorkspace = vi.fn(async () => structuredClone(stored));
    const onSave = vi.fn(async (next: HopV55Workspace) => structuredClone({ ...next, revision: next.revision + 1 }));
    render(<HopV55NuancePlanEditor prepared={prepared} workspace={stored} getWorkspace={getWorkspace} onSave={onSave} />);
    const proposeButton = screen.getByRole('button', { name: 'Proposer les variantes disponibles' });
    expect(proposeButton).toBeDisabled();
    fireEvent.click(screen.getByText('Déclarer explicitement une nouvelle dimension'));
    fireEvent.change(screen.getByLabelText('Nom de la dimension'), { target: { value: 'Agrume frais' } });
    fireEvent.change(screen.getByLabelText('Définition sémantique'), { target: { value: 'Repère déclaré sans mesure.' } });
    fireEvent.change(screen.getByLabelText('Termes exacts · un par ligne'), { target: { value: 'citron vert' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au prochain plan' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/provenance/);
    expect(onSave).not.toHaveBeenCalled();
    expect(stored.nuancePlans).toEqual([]);

    fireEvent.change(screen.getByLabelText('Modèle d’extrapolation exact'), { target: { value: `${model.id}@${model.version}` } });
    expect(proposeButton).toBeDisabled();
    expect(screen.getByText('Aucune définition disponible depuis une note, un protocole ou un plan antérieur.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
