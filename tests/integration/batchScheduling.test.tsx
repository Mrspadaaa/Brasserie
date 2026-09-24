import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { BatchSchedule } from '../../src/ui/production/BatchSchedule';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo, DocumentWriteError } from '../../src/services/firestoreRepo';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { currentInstallation } from '../../src/domain/brewPreferences';
import { companionRecipe } from '../fixtures/companionRecipe';
import type { Batch } from '../../src/types';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/services/brewClock', () => ({ brewNow: () => Date.now(), setBrewClock: vi.fn() }));
let batches: Batch[];
const sourceRecipe = { ...companionRecipe(), brewDate: '15.09.2020' };
const profile = currentInstallation(defaultConfig.brewhouses.find(value => value.id === defaultConfig.activeBrewhouseId)!);
const recipe = adaptRecipeEquipment(sourceRecipe, profile, sourceRecipe.volumeL);
const planned = (): Batch => ({ id: 'LOT-TEST', name: recipe.name, style: recipe.style, volumeL: 20, brewDate: '', plannedBrewDate: '27.09.2026', status: 'planifie', stockAccountingVersion: 1,
  recipeSnapshot: captureSnapshot(recipe), brewDay: { currentIndex: 0, steps: [{ id: 'eau', label: 'Préparer l’eau', durationMin: 0 }, { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [] } });

beforeEach(() => {
  batches = [];
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
  vi.spyOn(StorageService, 'getConfig').mockReturnValue({ ...defaultConfig, brewhouses: [profile], activeBrewhouseId: profile.id });
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'addBatch').mockImplementation(batch => { batches.push(structuredClone(batch)); });
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_key, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation(async (_name, id) => batches.find(batch => batch.id === id));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
const create = () => screen.getByRole('button', { name: 'Créer le brassin à brasser' });
const openCreation = (onBatchCreated = vi.fn(), onClose = vi.fn()) => render(<QuickActionModal isOpen recipes={[recipe]} onClose={onClose} initialScreen="brew-batch" initialRecipeId={recipe.id} onBatchCreated={onBatchCreated} />);

describe('prepare and schedule a reusable recipe', () => {
  it('keeps a scheduled legacy recipe uncreated until its installation is explicitly adopted', () => {
    const onCreated = vi.fn(), close = vi.fn();
    render(<QuickActionModal isOpen recipes={[sourceRecipe]} onClose={close} initialScreen="brew-batch" onBatchCreated={onCreated} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Aujourd’hui' }));
    fireEvent.click(create());
    expect(screen.getByRole('alert')).toHaveTextContent('Adapter à mon matériel actuel');
    expect(StorageService.addBatch).not.toHaveBeenCalled();
    expect(FirestoreRepo.waitForDocument).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(sourceRecipe).not.toHaveProperty('brewhouse');
  });

  it('defaults to no date, confirms one frozen batch, and leaves its recipe unchanged', async () => {
    const created = vi.fn(); openCreation(created);
    expect(screen.getByRole('radio', { name: 'À définir' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(create());
    await waitFor(() => expect(created).toHaveBeenCalledOnce());
    expect(batches[0]).toMatchObject({ brewDate: '', plannedBrewDate: '', recipeRef: recipe.id, status: 'planifie' });
    expect(batches[0].recipeSnapshot?.yeast).toEqual(recipe.yeast);
    expect(batches[0].brewDay).toBeUndefined(); expect(recipe.brewDate).toBe('15.09.2020');
  });
  it('requires an explicit valid day, then stores that plan without an actual date', async () => {
    const created = vi.fn(); openCreation(created);
    fireEvent.click(screen.getByRole('radio', { name: 'Autre date' }));
    expect(create()).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Jour prévu'), { target: { value: '2026-10-24' } });
    fireEvent.click(create());
    await waitFor(() => expect(created).toHaveBeenCalledOnce());
    expect(batches[0]).toMatchObject({ plannedBrewDate: '24.10.2026', brewDate: '' });
  });
  it('today is also an intention until the brewer starts', async () => {
    openCreation(); fireEvent.click(screen.getByRole('radio', { name: 'Aujourd’hui' })); fireEvent.click(create());
    await waitFor(() => expect(batches).toHaveLength(1));
    expect(batches[0]).toMatchObject({ plannedBrewDate: '20.09.2026', brewDate: '' });
  });
  it('keeps a failed acknowledgement reviewable and retries without a duplicate', async () => {
    const created = vi.fn(), close = vi.fn();
    vi.mocked(FirestoreRepo.waitForDocument).mockRejectedValueOnce(new Error('Confirmation en attente'));
    openCreation(created, close); fireEvent.click(create());
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation en attente');
    expect(close).not.toHaveBeenCalled(); expect(created).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Recette à brasser')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer l’enregistrement' }));
    await waitFor(() => expect(created).toHaveBeenCalledOnce()); expect(batches).toHaveLength(1);
  });
  it('allows correction after a confirmed rejected creation', async () => {
    vi.mocked(FirestoreRepo.waitForDocument).mockImplementationOnce(async () => { batches = []; throw new DocumentWriteError('rejected', 'batches/LOT-001', undefined, 'Enregistrement refusé'); });
    openCreation(); fireEvent.click(create());
    expect(await screen.findByRole('alert')).toHaveTextContent('refusé');
    expect(screen.getByLabelText('Recette à brasser')).toBeEnabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Aujourd’hui' })); fireEvent.click(create());
    await waitFor(() => expect(batches).toHaveLength(1)); expect(batches[0].plannedBrewDate).toBe('20.09.2026');
  });
  it('locks double clicks and closing while the exact batch awaits confirmation', async () => {
    let acknowledge!: () => void;
    vi.mocked(FirestoreRepo.waitForDocument).mockImplementation(() => new Promise(resolve => { acknowledge = () => resolve(batches[0]); }));
    const created = vi.fn(); openCreation(created); const button = create();
    fireEvent.click(button); fireEvent.click(button);
    expect(batches).toHaveLength(1); expect(screen.getByRole('button', { name: 'Fermer' })).toBeDisabled();
    await act(async () => acknowledge()); expect(created).toHaveBeenCalledOnce();
  });
});

describe('reschedule, begin and reopen', () => {
  it('cancels edits, then explicitly removes the planning day', async () => {
    const save = vi.fn(); render(<BatchSchedule batch={planned()} onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Changer la date' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Aujourd’hui' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' })); expect(save).not.toHaveBeenCalled();
    expect(screen.getByText('Prévu le 27.09.2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Changer la date' })); fireEvent.click(screen.getByRole('radio', { name: 'À définir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la date' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ plannedBrewDate: '', brewDate: '' })));
  });
  it('keeps a rescheduling error beside the editable day', async () => {
    render(<BatchSchedule batch={planned()} onSave={vi.fn().mockRejectedValue(new Error('Hors ligne'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'Changer la date' })); fireEvent.click(screen.getByRole('radio', { name: 'Aujourd’hui' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la date' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Hors ligne');
    expect(screen.getByRole('radio', { name: 'Aujourd’hui' })).toBeEnabled();
  });
  it('opening the journal does not brew; explicit start records today and reopening retains both dates', async () => {
    let saved = planned();
    function Flow() { const [batch, setBatch] = useState(saved); return <BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={next => { saved = next; setBatch(next); }} onFinish={vi.fn()} />; }
    const view = render(<Flow />);
    expect(saved.brewDate).toBe('');
    expect(screen.getByText('Prévu le 27.09.2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer aujourd’hui' }));
    expect(saved.brewDate).toBe('20.09.2026'); expect(saved.plannedBrewDate).toBe('27.09.2026');
    expect(saved.brewDay?.startedAt).toBe(Date.now());
    view.unmount(); render(<Flow />);
    const planning = within(screen.getByRole('region', { name: 'Planning du brassin' }));
    expect(planning.getByText('Commencé le 20.09.2026')).toBeInTheDocument();
    expect(planning.getByText('Initialement prévu le 27.09.2026.')).toBeInTheDocument();
    expect(planning.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Commencer aujourd’hui' })).not.toBeInTheDocument();
  });
});
