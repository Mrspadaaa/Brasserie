import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioBranchResult, BrewingScenarioResult } from '../../src/domain/brewingScenario';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import * as predictor from '../../functions/src/hopRecipePrediction';
import bootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolations from '../../src/data/hopExtrapolationBootstrap.json';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';
import { testHopPolicy, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import { HopV55NuanceExplorer } from '../../src/ui/hopV55/NuanceExplorer';
import { createHopV55ExplorationProfile } from '../../src/services/hopV55/explorationProfiles';

const snapshotReference = 'snapshot:nuance-test:v1';
const source = { ...hopTestSource, title: 'Fiche documentaire source', reference: 'test-source:nuance-fixture' };
const model = structuredClone(extrapolations[0]) as HopExtrapolation;
const axes = structuredClone(bootstrap.filter((row) => row.kind === 'axis')) as HopAxis[];
const familyAxis = axes.find((row) => row.id === 'pomeFruit');
if (!familyAxis) throw new Error('Fixture requise : axe parent pomeFruit absent.');

function variety(id: string, name: string, text: string): HopVariety {
  return { ...hopTestVariety(), id, name, descriptions: [{ text, context: 'rawHop', source }], analysis: [] };
}

const pear = variety('pear-hop', 'Variété test · poire', 'Poire nette');
const apple = variety('apple-hop', 'Variété test · pomme', 'Pomme verte');
const unmentioned = variety('unmentioned-hop', 'Variété test · non documentée', 'Herbe fraîche');
const knowledge = [...axes, testHopYeast, testHopPolicy, model] as HopKnowledge[];

function engineData(row: HopVariety): HopEngineData {
  return { varieties: [row], lots: [], knowledge: structuredClone(knowledge) };
}

function inputFor(row: HopVariety, suffix: string): HopRecipeInput {
  return {
    volumeL: 20,
    yeastId: testHopYeast.id,
    additions: [{ id: `addition-${suffix}`, name: row.name,
      triplet: { ...testHopTriplet, varietyId: row.id, lotId: null, yeastId: testHopYeast.id,
        timing: 'postFermentation', doseGL: 1, temperatureC: 15, contactHours: 24, matrixId: null } }],
    fermentation: [],
  };
}

const pearInput = inputFor(pear, 'pear');
const appleInput = inputFor(apple, 'apple');
const unmentionedInput = inputFor(unmentioned, 'unmentioned');

function branch(id: string, label: string, row: HopVariety, input: HopRecipeInput): BrewingScenarioBranchResult {
  const data = engineData(row);
  return {
    id,
    label,
    reference: `j5-branch-reference:${id}`,
    input,
    applicability: 'available',
    biologicalContributions: [],
    biologicalAssessments: [],
    cultureProjections: [],
    performedAdditionIds: [],
    assumptions: [],
    usedAssumptionIds: [],
    proposedAssumptionIds: [],
    unappliedAssumptionIds: [],
    analogies: [],
    limitations: [],
    dependencySnapshot: {
      version: 'brewing-scenario-dependencies-v1',
      reference: `j5-dependency-reference:${id}`,
      engineData: data,
      decisionMaterials: [],
      program: null,
      scenarioModelBases: [],
      scenarioModelInstances: [],
      knowledgeValidationErrors: [],
    },
  } as unknown as BrewingScenarioBranchResult;
}

const baseline = branch('baseline', 'Référence · branche J5', pear, pearInput);
const alternative = branch('apple', 'Alternative · branche J5', apple, appleInput);
const unmentionedBranch = branch('unmentioned', 'Branche sans occurrence lexicale', unmentioned, unmentionedInput);
const result = {
  version: 'brewing-scenario-v1',
  scenarioId: 'scenario:nuance-test',
  revision: 1,
  requestSnapshot: { baseline: { kind: 'hypothetical', label: 'Référence de test', input: pearInput }, branches: [] },
  inputReference: 'j5-input-reference:nuance-test',
  reference: 'j5-result-reference:nuance-test',
  dataReference: 'j5-data-reference:nuance-test',
  status: 'quantified',
  baseline,
  branches: [alternative, unmentionedBranch],
  comparisons: [],
  limitations: [],
} as unknown as BrewingScenarioResult;

const prepared = {
  version: 'brewing-scenario-context-v1',
  limitations: [],
  provenance: ['Contexte local de test.'],
  runtime: { engineData: engineData(pear), materials: [] },
} as unknown as PreparedBrewingScenarioContext;

function makeWorkspace(): HopV55Workspace {
  const intent = { question: 'Distinguer deux nuances exactes', criteria: [{ id: 'fine-focus', label: 'Nuance précise', direction: 'investigate' as const, axisId: 'pomeFruit' }] };
  return {
    format: 'hop-v55-workspace-v1',
    id: 'workspace:nuance-test',
    ownerKey: 'fixture-owner',
    revision: 0,
    title: 'Étude de nuances test',
    intent,
    scenarioIds: [result.scenarioId],
    activeScenarioId: result.scenarioId,
    referenceHypotheses: [],
    snapshotIntents: [{ scenarioId: result.scenarioId, snapshotReference, intent }],
    nuancePlans: [],
    nuanceStudies: [],
    copies: [],
    updatedAt: '2026-10-02T08:00:00.000Z',
  };
}

const fillDimension = (name: string, definition: string, term: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Nom de la nuance' }), { target: { value: name } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Définition sémantique' }), { target: { value: definition } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Terme ou expression lexicale exacte' }), { target: { value: term } });
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter le terme' }));
  fireEvent.click(screen.getByRole('button', { name: 'Proposer cette définition versionnée' }));
};

afterEach(() => cleanup());

describe('HopV55NuanceExplorer', () => {
  it('affiche le profil exact lié à la branche séparément de la dernière version du profil', () => {
    const first = createHopV55ExplorationProfile({ label: 'Profil branche V1', status: 'hypothesis', description: 'Hypothèse gelée.', criteria: [] },
      { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'profile:nuance-branch', newId: () => 'unused' });
    const second = createHopV55ExplorationProfile({ label: 'Profil courant V2', status: 'hypothesis', description: 'Révision ultérieure.', criteria: [] },
      { recordedAt: '2026-10-04T09:00:00.000Z', profileId: first.profileId, previous: first, newId: () => 'unused' });
    const view = render(<HopV55NuanceExplorer prepared={prepared} result={result} snapshotReference={snapshotReference}
      workspace={makeWorkspace()} getWorkspace={async () => makeWorkspace()} onSave={async (workspace) => workspace}
      explorationProfiles={[first, second]} branchProfile={{ kind: 'persisted', profile: first }} />);
    const linked = view.container.querySelector(`[data-profile-reference="${first.reference}"]`);
    expect(linked?.textContent).toContain('version exacte 1');
    expect(linked?.textContent).toContain('Profil branche V1');
    expect(screen.getByText('Profil courant V2').closest('li')).toHaveTextContent('version 2');
  });

  it('propose, adopte, révise et archive deux projections sans modifier la première ni relancer son moteur à la relecture', async () => {
    let stored = makeWorkspace();
    const getWorkspace = vi.fn(async () => structuredClone(stored));
    const onSave = vi.fn(async (next: HopV55Workspace) => {
      if (next.id !== stored.id || next.revision !== stored.revision) throw new Error('Révision CAS périmée.');
      stored = { ...structuredClone(next), revision: stored.revision + 1, updatedAt: new Date().toISOString() };
      return structuredClone(stored);
    });

    const view = render(<HopV55NuanceExplorer prepared={prepared} result={result} snapshotReference={snapshotReference}
      workspace={stored} getWorkspace={getWorkspace} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Source des termes et des paramètres'), {
      target: { value: `${model.id}@${model.version}` },
    });
    expect(screen.getByLabelText('Famille à explorer · facultatif')).toBeInTheDocument();
    const searchTerms = screen.getByRole('searchbox', { name: 'Rechercher dans tous les termes' });
    fireEvent.change(searchTerms, { target: { value: 'poire' } });
    let pearTerm = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__source-terms > li')]
      .find((item) => item.querySelector('.hv-nuance__term-heading b')?.textContent === '« poire »');
    expect(pearTerm).toBeTruthy();
    fireEvent.click(within(pearTerm!).getByRole('button', { name: 'Ajouter ce repère à l’étude' }));
    expect(stored.nuancePlans).toEqual([]);
    fireEvent.change(searchTerms, { target: { value: 'pomme' } });
    let appleTerm = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__source-terms > li')]
      .find((item) => item.querySelector('.hv-nuance__term-heading b')?.textContent === '« pomme »');
    expect(appleTerm).toBeTruthy();
    fireEvent.click(within(appleTerm!).getByRole('button', { name: 'Ajouter ce repère à l’étude' }));
    expect(screen.getAllByText(/Poire nette/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pomme verte/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Convention documentaire proposée/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Aucune occurrence n’a été relevée/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fiche documentaire source').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Proposer les variantes de calcul' }));
    await waitFor(() => expect(stored.nuancePlans!.length).toBeGreaterThan(1));
    expect(stored.nuancePlans!.every((plan) => plan.status === 'proposed')).toBe(true);
    const sourcedPear = stored.nuancePlans![0].definitions.find((row) => row.dimension.name === 'poire')?.dimension;
    expect(sourcedPear?.terms).toEqual(['poire']);
    expect(sourcedPear?.familyRefs?.[0]?.family).toEqual({ id: familyAxis.id, version: familyAxis.version });
    expect(sourcedPear?.definition).toContain('frontières de mots');
    expect(sourcedPear?.sourceRefs).toContainEqual(source);
    expect(screen.getAllByText(/Hypothèse du modèle/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/modelHypothesis/)).not.toBeInTheDocument();
    const definitionDetails = screen.getAllByText('Définitions, lexiques et citations exactes')[0].closest('details');
    expect(definitionDetails?.open).toBe(false);
    expect(screen.queryByRole('button', { name: /Projeter cette version adoptée/ })).not.toBeInTheDocument();
    expect(screen.getByText(/ne sont ni une dégustation/)).toBeInTheDocument();

    const firstEnvelope = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__plan')]
      .find((card) => card.querySelector('h4')?.textContent === 'Plages complètes de la source');
    expect(firstEnvelope).toBeTruthy();
    fireEvent.change(within(firstEnvelope!).getByRole('textbox', { name: 'Pourquoi retenir cette variante ?' }), {
      target: { value: 'Conserver les plages source complètes pour cette première étude.' },
    });
    fireEvent.click(within(firstEnvelope!).getByRole('button', { name: 'Adopter cette hypothèse' }));
    await waitFor(() => expect(stored.nuancePlans!.some((plan) => plan.status === 'adopted')).toBe(true));

    const firstAdopted = structuredClone(stored.nuancePlans!.find((plan) => plan.status === 'adopted')!);
    const adoptedCard = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__plan')]
      .find((card) => card.querySelector('.hv-nuance__eyebrow')?.textContent?.includes('Adoptée explicitement')
        && card.querySelector('h4')?.textContent === 'Plages complètes de la source');
    expect(adoptedCard).toBeTruthy();
    fireEvent.click(within(adoptedCard!).getByRole('button', { name: 'Projeter cette version sur les variantes' }));
    await waitFor(() => expect(stored.nuanceStudies).toHaveLength(1));

    const firstStudy = structuredClone(stored.nuanceStudies![0]);
    const sourceModelBeforeRevision = structuredClone(result.baseline.dependencySnapshot.engineData.knowledge.find((row) => row.kind === 'extrapolation'));
    const inputBeforeRevision = structuredClone(baseline.input);
    expect(firstStudy.snapshotReference).toBe(snapshotReference);
    expect(firstStudy.projection.planSnapshot.reference).toBe(firstAdopted.reference);
    expect(firstStudy.projection.candidates.find((candidate) => candidate.id === baseline.id)?.inputSnapshot).toEqual(baseline.input);
    expect(firstStudy.projection.candidates.find((candidate) => candidate.id === baseline.id)?.sourceReference).toBe(baseline.reference);
    expect(firstStudy.projection.candidates.find((candidate) => candidate.id === alternative.id)?.inputSnapshot).toEqual(alternative.input);
    expect(firstStudy.projection.candidates.find((candidate) => candidate.id === alternative.id)?.sourceReference).toBe(alternative.reference);
    const unknownProjection = firstStudy.projection.candidates.find((candidate) => candidate.id === unmentionedBranch.id)!;
    expect(unknownProjection.sourceReference).toBe(unmentionedBranch.reference);
    expect(unknownProjection.values[0].estimate?.range?.min).toBe(0);
    expect(unknownProjection.values[0].estimate?.range?.max).toBeGreaterThan(0);
    expect(firstStudy.projection.planSnapshot.definitions.map((row) => row.dimension.name)).toEqual(['poire', 'pomme']);

    fireEvent.click(screen.getByRole('button', { name: 'Retour à l’étude courante' }));
    const firstPlanCard = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__plan')]
      .find((card) => card.querySelector('.hv-nuance__eyebrow')?.textContent?.includes('Adoptée explicitement')
        && card.querySelector('h4')?.textContent === 'Plages complètes de la source');
    fireEvent.click(within(firstPlanCard!).getByRole('button', { name: 'Réviser les paramètres · créer une nouvelle version' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Paramètre à réviser' }), { target: { value: screen.getByRole('option', { name: 'Dose · poire' }).getAttribute('value') } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Borne basse hypothétique' }), { target: { value: '0,2' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Borne haute hypothétique' }), { target: { value: '0,8' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Centrale explicitement choisie' }), { target: { value: '0,5' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Raison et provenance de cette hypothèse' }), { target: { value: 'Tester une convention de dose explicitement choisie.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle révision proposée' }));
    await waitFor(() => expect(stored.nuancePlans!.some((plan) => plan.status === 'proposed' && plan.revision === firstAdopted.revision + 1)).toBe(true));

    expect(stored.nuancePlans!.find((plan) => plan.reference === firstAdopted.reference)).toEqual(firstAdopted);
    const revised = stored.nuancePlans!.find((plan) => plan.status === 'proposed' && plan.revision === firstAdopted.revision + 1)!;
    expect(revised.previousReference).toBe(firstAdopted.reference);
    const revisedCard = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__plan')]
      .find((card) => card.querySelector('.hv-nuance__eyebrow')?.textContent?.includes('Proposée · à examiner · r2')
        && card.querySelector('h4')?.textContent === 'Variante avec réglages explicitement choisis');
    expect(revisedCard).toBeTruthy();
    fireEvent.change(within(revisedCard!).getByRole('textbox', { name: /Pourquoi retenir cette variante/ }), {
      target: { value: 'Adopter cette variante révisée comme hypothèse distincte.' },
    });
    fireEvent.click(within(revisedCard!).getByRole('button', { name: 'Adopter cette hypothèse' }));
    await waitFor(() => expect(stored.nuancePlans!.some((plan) => plan.status === 'adopted' && plan.revision === revised.revision)).toBe(true));

    const revisedAdopted = stored.nuancePlans!.find((plan) => plan.status === 'adopted' && plan.revision === revised.revision)!;
    const revisedAdoptedCard = [...view.container.querySelectorAll<HTMLElement>('.hv-nuance__plan')]
      .find((card) => card.querySelector('.hv-nuance__eyebrow')?.textContent?.includes('Adoptée explicitement · r2')
        && card.querySelector('h4')?.textContent === 'Variante avec réglages explicitement choisis');
    fireEvent.click(within(revisedAdoptedCard!).getByRole('button', { name: 'Projeter cette version sur les variantes' }));
    await waitFor(() => expect(stored.nuanceStudies).toHaveLength(2));
    expect(stored.nuanceStudies![0]).toEqual(firstStudy);
    expect(stored.nuanceStudies![1].projection.planSnapshot.reference).toBe(revisedAdopted.reference);
    expect(stored.nuanceStudies![1].projection.candidates.every((candidate) => candidate.sourceReference)).toBe(true);
    expect(result.baseline.dependencySnapshot.engineData.knowledge.find((row) => row.kind === 'extrapolation')).toEqual(sourceModelBeforeRevision);
    expect(baseline.input).toEqual(inputBeforeRevision);

    const predictSpy = vi.spyOn(predictor, 'predictHopRecipe').mockImplementation(() => { throw new Error('La relecture ne recalcule pas.'); });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Retour à l’étude courante' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir l’étude archivée' })[0]);
      expect(screen.getByText(/Aucun calcul n’a été relancé/)).toBeInTheDocument();
      expect(predictSpy).not.toHaveBeenCalled();
    } finally { predictSpy.mockRestore(); }
  });

  it('garde la création libre accessible dans le volet « Ajouter ou corriger une nuance »', async () => {
    const stored = makeWorkspace();
    const getWorkspace = vi.fn(async () => structuredClone(stored));
    const onSave = vi.fn(async (next: HopV55Workspace) => structuredClone(next));
    render(<HopV55NuanceExplorer prepared={prepared} result={result} snapshotReference={snapshotReference}
      workspace={stored} getWorkspace={getWorkspace} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Source des termes et des paramètres'), {
      target: { value: `${model.id}@${model.version}` },
    });
    fireEvent.click(screen.getByText('Ajouter ou corriger une nuance'));
    fireEvent.change(screen.getByLabelText('Famille parente documentée'), {
      target: { value: `${familyAxis.id}@${familyAxis.version}` },
    });
    fillDimension('Bergamote libre', 'Expression choisie par le brasseur, sans niveau mesuré.', 'bergamote artisanale');
    expect(screen.getByText('Bergamote libre')).toBeInTheDocument();
    expect(screen.getByText(/Cette définition reste une hypothèse lexicale/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer les variantes de calcul' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      nuancePlans: expect.arrayContaining([expect.objectContaining({ status: 'proposed' })]),
    })));
  });
});

