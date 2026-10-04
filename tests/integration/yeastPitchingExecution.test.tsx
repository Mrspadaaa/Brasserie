import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { YeastBrewDayGuide } from '../../src/ui/YeastBrewDayGuide';
import { brewerJobs } from '../../src/services/brewerJobs';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { pitchingContext } from '../../src/domain/yeastPitching';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, BrewDayState, RecipeSnapshot, YeastSpec } from '../../src/types';
import type { YeastPreparationPlan, YeastProduct, YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const source = { url: 'https://yeast.example/starter', title: 'Notice produit', checkedAt: '2026-09-01' };
const protocol: YeastStarterProtocol = {
  id: 'PROTOCOL-A', label: 'Starter documenté', source, method: 'Agiter selon la notice', medium: 'malt-extract',
  targetSg: 1.035, conditions: 'Respecter la température de la notice.', leadHours: { min: 24, max: 36 },
  steps: ['Préparer et refroidir le milieu selon la notice', 'Activer l’inoculum avant l’ajout au milieu', 'Agiter le starter selon la notice', 'Vérifier les conditions avant le transfert']
};
const product: YeastProduct = {
  id: 'PRODUCT-A', referenceId: 'culture-liquide-a', label: 'Culture liquide A', manufacturer: 'Laboratoire A', form: 'liquide', source, starter: protocol
};
function yeastWithPreparation(): YeastSpec {
  const yeast: YeastSpec = { name: 'Culture liquide A', hopIndexId: product.referenceId, form: 'liquide', qty: 1, unit: 'flacon', stockItemRef: 'YEAST-A',
    pitching: { version: 1, product: structuredClone(product) } };
  const plan: YeastPreparationPlan = {
    id: 'PREP-A', revision: 3, productId: product.id, stockItemRef: 'YEAST-A', context: pitchingContext(yeast), protocol,
    volumeL: 1.5, inoculum: 'Inoculum à vérifier selon le lot', targetPitchAt: '2026-09-28T12:00:00.000Z', startAt: '2026-09-27T00:00:00.000Z',
    equipment: 'Flacon agité', steps: [
      { id: 'step-0', label: protocol.steps[0], dueAt: '2026-09-27T00:00:00.000Z' },
      { id: 'step-1', label: protocol.steps[1], dueAt: '2026-09-27T00:00:00.000Z' },
      { id: 'step-2', label: protocol.steps[2], dueAt: '2026-09-28T12:00:00.000Z' },
      { id: 'step-3', label: protocol.steps[3] },
    ], status: 'planned', note: 'Repères indicatifs, pas une chronologie garantie. Prévois une marge pour l’activation de l’inoculum et le refroidissement; leur durée reste à vérifier.'
  };
  yeast.pitching!.preparation = plan;
  return yeast;
}
function batchWithPreparation(): Batch {
  const recipe = yeastFlowRecipe() as RecipeSnapshot;
  recipe.yeast = yeastWithPreparation();
  return { id: 'B-STARTER', name: 'Brassin prévu', style: recipe.style, volumeL: recipe.volumeL, status: 'planifie', brewDate: '', plannedBrewDate: '28.09.2026', recipeSnapshot: recipe } as Batch;
}
function brewDayBatch(yeast: YeastSpec, state?: Partial<BrewDayState>): Batch {
  const recipe = yeastFlowRecipe() as RecipeSnapshot;
  recipe.yeast = yeast;
  const brewDay: BrewDayState = { currentIndex: 0, startedAt: 10, steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [], ...state };
  return { id: 'B-PITCH', name: 'Brassin au jour J', style: recipe.style, volumeL: recipe.volumeL, status: 'planifie', brewDate: '27.09.2026', plannedBrewDate: '27.09.2026', recipeSnapshot: recipe, brewDay } as Batch;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'));
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [{ id: 'YEAST-A', ref: 'YEAST-A', name: 'Culture liquide A', category: 'Levure', unit: 'flacon', currentStock: 4, minStock: 0, reorder: false }], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'adjustInventory').mockReturnValue({ delta: -1 });
});
afterEach(() => {
  cleanup();
  brewerJobs.stop();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Préparation de starter dans un brassin planifié', () => {
  it('démarre et reprend la copie figée, régularise par comptage explicite et la rouvre après un changement de date', async () => {
    let saved = batchWithPreparation();
    vi.mocked(StorageService.updateBatch).mockImplementation(batch => { saved = structuredClone(batch); });
    const view = render(<BatchDetailSheet batch={saved} initialSection="overview" onClose={vi.fn()} />);
    const panel = screen.getByRole('region', { name: 'Préparation de levure' });
    expect(panel).toHaveTextContent('Cellules obtenues : inconnues');
    expect(panel).toHaveTextContent('Starter · Culture liquide A');
    expect(panel).toHaveTextContent('Produit · Culture liquide A · PRODUCT-A');
    expect(within(panel).getByRole('button', { name: 'Commencer la préparation du starter' })).toBeVisible();
    const notice = within(panel).getByText('Notice et étapes complètes · Notice produit').closest('details')!;
    expect(notice.open).toBe(false);
    fireEvent.click(within(notice).getByText('Notice et étapes complètes · Notice produit'));
    expect(within(notice).getByText('Starter documenté')).toBeVisible();
    expect(within(notice).getByRole('link', { name: /Source · Notice produit/ })).toHaveTextContent('source relevée le 2026-09-01');
    expect(within(notice).getByText('Agiter selon la notice')).toBeVisible();
    fireEvent.click(within(notice).getByText('Notice et étapes complètes · Notice produit'));
    expect(notice.open).toBe(false);
    expect(panel).toHaveTextContent('Repères indicatifs, pas une chronologie garantie');
    expect(panel).toHaveTextContent('activation de l’inoculum et le refroidissement');
    expect(within(panel).getAllByText(/Repère commun de départ ·/)).toHaveLength(2);
    expect(within(panel).getByText('Vérifier les conditions avant le transfert').closest('li')).not.toHaveTextContent('Repère');
    expect(panel).not.toHaveTextContent('Échéance ·');
    fireEvent.click(within(panel).getByRole('button', { name: 'Commencer la préparation du starter' }));
    expect(saved.yeastPreparation).toMatchObject({ plan: { id: 'PREP-A', revision: 3 }, status: 'started', steps: [] });
    expect(saved.brewDay).toBeUndefined();
    fireEvent.change(within(panel).getByLabelText('Quantité d’inoculum réellement prélevée'), { target: { value: '1' } });
    fireEvent.change(within(panel).getByLabelText('Unité'), { target: { value: 'flacon' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Enregistrer l’inoculum prélevé' }));
    expect(panel).toHaveTextContent('Inoculum consigné · 1 flacon · YEAST-A');
    expect(notice.open).toBe(false);
    for (const label of protocol.steps) fireEvent.click(within(panel).getByRole('checkbox', { name: `Étape du starter : ${label}` }));
    expect(saved.yeastPreparation).toMatchObject({ status: 'ready', plan: { revision: 3 }, steps: [
      { id: 'step-0', at: Date.now() }, { id: 'step-1', at: Date.now() }, { id: 'step-2', at: Date.now() }, { id: 'step-3', at: Date.now() }
    ] });

    fireEvent.change(within(panel).getByLabelText('Composant du starter à régulariser'), { target: { value: 'inoculum' } });
    fireEvent.change(within(panel).getByLabelText('Stock à régulariser'), { target: { value: 'YEAST-A' } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Corriger l’inventaire' }));
    fireEvent.change(screen.getByLabelText('Stock réellement compté (flacon)'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’écart' }));
    expect(StorageService.adjustInventory).toHaveBeenCalledWith('rawMaterials', 'YEAST-A', 3, 'comptage', undefined);
    expect(saved.yeastPreparation?.stockRegularization).toEqual([{ kind: 'inoculum', stockItemRef: 'YEAST-A', at: Date.now() }]);

    fireEvent.click(screen.getByRole('button', { name: 'Changer la date' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Autre date' }));
    fireEvent.change(screen.getByLabelText('Jour prévu'), { target: { value: '2026-09-29' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la date' }));
    await waitFor(() => expect(saved.plannedBrewDate).toBe('29.09.2026'));
    expect(saved.yeastPreparation).toMatchObject({ status: 'ready', plan: { id: 'PREP-A', revision: 3 }, steps: [{ id: 'step-0' }, { id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }] });
    expect(screen.getByRole('alert')).toHaveTextContent('L’exécution conserve le plan PREP-A · révision 3');
    view.unmount();
    render(<BatchDetailSheet batch={saved} initialSection="overview" onClose={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Préparation de levure' })).toHaveTextContent('Préparation prête');
    expect(screen.getByRole('alert')).toHaveTextContent('date ou le plan courant a changé');
  });

  it('affiche l’identifiant seul si le produit figé du snapshot ne correspond plus au plan', () => {
    const batch = batchWithPreparation();
    batch.recipeSnapshot!.yeast.pitching!.product!.id = 'ANOTHER-PRODUCT';
    render(<BatchDetailSheet batch={batch} initialSection="overview" onClose={vi.fn()} />);
    const panel = screen.getByRole('region', { name: 'Préparation de levure' });
    expect(panel).toHaveTextContent('Starter · PRODUCT-A');
    expect(panel).not.toHaveTextContent('Starter · Culture liquide A');
    expect(panel).not.toHaveTextContent('Starter · Starter documenté');
  });

  it('refuse un plan enregistré sous le minimum, mais garde une exécution commencée poursuivable', () => {
    const tooLate = batchWithPreparation();
    tooLate.recipeSnapshot!.yeast.pitching!.preparation!.targetPitchAt = '2026-09-28T11:00:00.000Z';
    const lateView = render(<BatchDetailSheet batch={tooLate} initialSection="overview" onClose={vi.fn()} />);
    const latePanel = screen.getByRole('region', { name: 'Préparation de levure' });
    expect(latePanel).toHaveTextContent('Trop tard pour démarrer · replanifier');
    expect(latePanel).toHaveTextContent('Il reste 23 h avant l’ensemencement cible, sous le minimum publié de 24 h');
    expect(within(latePanel).queryByRole('button', { name: 'Commencer la préparation du starter' })).not.toBeInTheDocument();
    expect(StorageService.adjustInventory).not.toHaveBeenCalled();
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(4);
    lateView.unmount();

    const startedView = render(<BatchDetailSheet batch={batchWithPreparation()} initialSection="overview" onClose={vi.fn()} />);
    const startedPanel = screen.getByRole('region', { name: 'Préparation de levure' });
    fireEvent.click(within(startedPanel).getByRole('button', { name: 'Commencer la préparation du starter' }));
    vi.setSystemTime(new Date('2026-09-27T13:00:00.000Z'));
    fireEvent.click(within(startedPanel).getByRole('checkbox', { name: `Étape du starter : ${protocol.steps[0]}` }));
    expect(startedPanel).toHaveTextContent('Préparation commencée');
    expect(startedPanel).toHaveTextContent('1/4 étapes consignées · à poursuivre');
    expect(within(startedPanel).getByRole('checkbox', { name: `Étape du starter : ${protocol.steps[1]}` })).toBeEnabled();
    expect(within(startedPanel).queryByRole('alert')).not.toBeInTheDocument();
    expect(StorageService.adjustInventory).not.toHaveBeenCalled();
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(4);
    startedView.unmount();
  });

  it('signale la marge manquante sous la borne haute sans transformer la fenêtre en garantie', () => {
    const batch = batchWithPreparation();
    batch.recipeSnapshot!.yeast.pitching!.preparation!.targetPitchAt = '2026-09-28T18:00:00.000Z';
    render(<BatchDetailSheet batch={batch} initialSection="overview" onClose={vi.fn()} />);
    const panel = screen.getByRole('region', { name: 'Préparation de levure' });
    expect(within(panel).getByRole('button', { name: 'Commencer la préparation du starter' })).toBeVisible();
    expect(panel).toHaveTextContent('Il reste 30 h, soit 6 h de moins que la borne haute publiée (36 h)');
    expect(panel).toHaveTextContent('Le minimum publié (24 h) est atteint, mais cette fenêtre ne garantit pas l’achèvement ni la viabilité');
    expect(panel).toHaveTextContent('La notice ne date pas séparément toutes les opérations annexes, notamment l’activation et le refroidissement.');
  });

  it('place le transfert réellement consigné et sa régularisation avant les détails de notice', () => {
    const batch = batchWithPreparation();
    const plan = batch.recipeSnapshot!.yeast.pitching!.preparation!;
    const execution = { plan: structuredClone(plan), status: 'transferred' as const, startedAt: 1,
      steps: plan.steps.map((step, index) => ({ id: step.id, at: index + 2 })),
      inoculumUsed: { amount: 1, unit: 'flacon', stockItemRef: 'YEAST-A' }, cultureVolumeL: 1.25 };
    render(<BatchDetailSheet batch={{ ...batch, yeastPreparation: execution }} initialSection="overview" onClose={vi.fn()} />);
    const panel = screen.getByRole('region', { name: 'Préparation de levure' });
    expect(panel).toHaveTextContent('Culture transférée au brassin');
    expect(panel).toHaveTextContent('Volume réellement transféré : 1,25 L');
    expect(within(panel).getByRole('region', { name: 'Régularisation du stock du starter' })).toBeVisible();
    expect(within(panel).getByRole('button', { name: 'Corriger l’inventaire' })).toBeVisible();
    expect(within(panel).queryByLabelText('Quantité d’inoculum réellement prélevée')).not.toBeInTheDocument();
    expect(within(panel).getByText('Notice et étapes complètes · Notice produit').closest('details')!.open).toBe(false);
  });
});

describe('Quantité de levure réellement ajoutée au jour J', () => {
  it('ne confirme pas la dose prévue quand le plan est nul et consigne la mesure choisie', async () => {
    const yeast = { name: 'Culture sans dose prévue', form: 'sèche' as const, qty: 0 };
    const save = vi.fn(), finish = vi.fn();
    const batch = brewDayBatch(yeast);
    const view = render(<BrewDayPage batch={batch} config={defaultConfig} onSave={save} onFinish={finish} onClose={vi.fn()} />);
    await screen.findAllByText('À vérifier');
    const guide = screen.getByText(/^Levure ·/).closest('details')!;
    if (!guide.open) fireEvent.click(guide.querySelector('summary')!);
    expect(within(guide).getByText(/Dose prévue du brassin : Quantité à préciser/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.queryByRole('button', { name: 'Confirmer la levure ajoutée' })).not.toBeInTheDocument();
    fireEvent.click(within(guide).getByRole('radio', { name: 'Quantité mesurée' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    const actualInput = within(guide).getByLabelText('Quantité de levure réellement ajoutée');
    fireEvent.change(actualInput, { target: { value: '0' } });
    expect(within(guide).getByText('Zéro signifie qu’aucune levure n’a été ajoutée. Corrige la quantité ou choisis une autre confirmation.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.queryByRole('button', { name: 'Confirmer la levure ajoutée' })).not.toBeInTheDocument();
    fireEvent.change(actualInput, { target: { value: '5,5' } });
    fireEvent.change(within(guide).getByLabelText('Unité de la quantité réelle de levure'), { target: { value: 'g' } });
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.getByText(/Quantité mesurée : 5,5 g · Aucune quantité prévue valide/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await waitFor(() => expect(finish).toHaveBeenCalledOnce());
    const saved = finish.mock.calls[0][0] as Batch;
    expect(saved.brewDay).toMatchObject({ pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 5.5, unit: 'g' } } });
    view.unmount();
    render(<BrewDayPage batch={saved} config={defaultConfig} onSave={vi.fn()} onFinish={vi.fn()} onClose={vi.fn()} />);
    const reopenedGuide = screen.getByText(/^Levure ·/).closest('details')!;
    if (!reopenedGuide.open) fireEvent.click(reopenedGuide.querySelector('summary')!);
    expect(within(reopenedGuide).getByText(/Ensemencement consigné · Réel mesuré : 5,5 g · prévu/)).toBeInTheDocument();
  });

  it('consigne sans mesure et ne reporte ni zéro ni dose prévue dans le brassin', async () => {
    const yeast = { name: 'Culture quantité inconnue', form: 'sèche' as const, qty: 12, unit: 'g' };
    const finish = vi.fn();
    const view = render(<BrewDayPage batch={brewDayBatch(yeast)} config={defaultConfig} onSave={vi.fn()} onFinish={finish} onClose={vi.fn()} />);
    const guide = screen.getByText(/^Levure ·/).closest('details')!;
    if (!guide.open) fireEvent.click(guide.querySelector('summary')!);
    fireEvent.click(within(guide).getByRole('radio', { name: 'Ajout confirmé, quantité non mesurée' }));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.getByText(/1\/\d+ ajouts cochés/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await waitFor(() => expect(finish).toHaveBeenCalledOnce());
    const saved = finish.mock.calls[0][0].brewDay as BrewDayState;
    expect(saved.pitchQuantityConfirmation).toBe('unmeasured');
    expect(saved.additions?.yeast).toBeUndefined();
    expect(saved.pitchedAt).toBe(Date.now());
    view.unmount();
    render(<BrewDayPage batch={finish.mock.calls[0][0]} config={defaultConfig} onSave={vi.fn()} onFinish={vi.fn()} onClose={vi.fn()} />);
    const yeastRow = within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));
    expect(yeastRow.getByText('Réel non mesuré · prévu 12 g')).toBeInTheDocument();
    expect(yeastRow.getByText('Non renseignée')).toBeInTheDocument();
    expect(yeastRow.getByRole('checkbox', { name: 'Ajouté : Culture quantité inconnue' })).toBeChecked();
  });

  it('laisse un historique sans quantité inchangé au montage puis trace une déclaration explicite', async () => {
    const yeast = { name: 'Culture historique', form: 'liquide' as const, qty: 12, unit: 'mL' };
    const saved = vi.fn();
    const state: BrewDayState = { currentIndex: 0, startedAt: 1, pitchedAt: 2, finishedAt: 2,
      steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0, doneAt: 2 }], readings: [] };
    const view = render(<BrewDayPage batch={brewDayBatch(yeast, state)} config={defaultConfig} onSave={saved} onFinish={vi.fn()} onClose={vi.fn()} />);
    await screen.findAllByText('À vérifier');
    expect(saved).not.toHaveBeenCalled();
    const guide = screen.getByText(/^Levure ·/).closest('details')!;
    if (!guide.open) fireEvent.click(guide.querySelector('summary')!);
    expect(within(guide).getAllByText(/Quantité réelle non renseignée · prévu 12 mL/).length).toBeGreaterThan(0);
    fireEvent.click(within(guide).getByRole('radio', { name: 'Ajout confirmé, quantité non mesurée' }));
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ brewDay: expect.objectContaining({ pitchQuantityConfirmation: 'unmeasured', additions: expect.not.objectContaining({ yeast: expect.anything() }) }) }));
    view.unmount();
  });

  it('marque séparément la culture transférée et son volume, sans le confondre avec un flacon prélevé', async () => {
    const yeast = yeastWithPreparation();
    const execution = { plan: yeast.pitching!.preparation!, status: 'ready' as const, startedAt: Date.now() - 86400000, steps: [{ id: 'step-0', at: Date.now() - 86400000 }], inoculumUsed: { amount: 1, unit: 'flacon', stockItemRef: 'YEAST-A' } };
    const finish = vi.fn();
    render(<BrewDayPage batch={{ ...brewDayBatch(yeast), yeastPreparation: execution }} config={defaultConfig} onSave={vi.fn()} onFinish={finish} onClose={vi.fn()} />);
    const guide = screen.getByText(/^Levure ·/).closest('details')!;
    if (!guide.open) fireEvent.click(guide.querySelector('summary')!);
    expect(within(guide).getByText(/Cellules obtenues : inconnues/)).toBeInTheDocument();
    fireEvent.click(within(guide).getByRole('radio', { name: 'Culture du starter effectivement transférée' }));
    fireEvent.change(within(guide).getByLabelText('Volume de starter réellement transféré'), { target: { value: '1,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await waitFor(() => expect(finish).toHaveBeenCalledOnce());
    const saved = finish.mock.calls[0][0] as Batch;
    expect(saved.yeastPreparation).toMatchObject({ status: 'transferred', inoculumUsed: { amount: 1, unit: 'flacon', stockItemRef: 'YEAST-A' }, cultureVolumeL: 1.5 });
    expect(saved.brewDay).toMatchObject({ pitchQuantityConfirmation: 'starter-transferred', additions: { yeast: { amount: 1.5, unit: 'L' } } });
  });
});

describe('Lecture du starter au jour J', () => {
  it('signale une préparation non commencée sous le minimum documenté sans déclarer de culture réalisée', () => {
    const yeast = yeastWithPreparation();
    yeast.pitching!.preparation!.targetPitchAt = '2026-09-28T11:00:00.000Z';
    const state: BrewDayState = { currentIndex: 0, steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [] };
    render(<YeastBrewDayGuide recipe={{ ...yeastFlowRecipe(), yeast }} state={state} phase="finish" plannedBrewDate="2026-09-28" />);
    const guide = screen.getByRole('complementary', { name: 'Conduite de levure du brassin' });
    expect(guide).toHaveTextContent('Il reste 23 h avant l’ensemencement cible, sous le minimum publié de 24 h');
    expect(guide).toHaveTextContent('Trop tard pour démarrer avec le minimum publié');
    expect(guide).not.toHaveTextContent('Culture transférée');
  });

  it('affiche la source et distingue un transfert non mesuré des cellules inconnues', () => {
    const yeast = yeastWithPreparation();
    const execution = { plan: yeast.pitching!.preparation!, status: 'transferred' as const, startedAt: 1, steps: [{ id: 'step-0', at: 2 }] };
    const state: BrewDayState = { currentIndex: 0, pitchedAt: 3, pitchQuantityConfirmation: 'starter-transferred', steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }] };
    render(<YeastBrewDayGuide recipe={{ ...yeastFlowRecipe(), yeast }} state={state} phase="finish" preparationExecution={execution} plannedBrewDate="2026-09-28" />);
    const guide = screen.getByRole('complementary', { name: 'Conduite de levure du brassin' });
    expect(guide).toHaveTextContent('Culture transférée');
    expect(guide).toHaveTextContent('Cellules obtenues : inconnues');
    expect(guide).toHaveTextContent('Notice produit');
    expect(guide).toHaveTextContent('volume non relevé');
  });
});
