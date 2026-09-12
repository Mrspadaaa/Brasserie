import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Batch, CreativeItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../src/ui/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('../../src/components/SettingsModal', () => ({ SettingsModal: () => null }));
vi.mock('../../src/components/AuditLogModal', () => ({ AuditLogModal: () => null }));
vi.mock('../../src/components/CloudConfigModal', () => ({ CloudConfigModal: () => null }));
vi.mock('../../src/pages/BrewWizard', () => ({ BrewWizard: () => null }));
vi.mock('../../src/pages/BrewDayPage', () => ({ BrewDayPage: () => null }));
vi.mock('../../src/pages/RecipePage', () => ({ RecipePage: () => null }));
vi.mock('../../src/components/tabs/FinancesTab', () => ({ FinancesTab: () => null }));
vi.mock('../../src/components/tabs/StocksTab', () => ({ StocksTab: () => null }));
vi.mock('../../src/components/tabs/ClientsTab', () => ({ ClientsTab: () => null }));
vi.mock('../../src/components/QuickActionModal', () => ({
  QuickActionModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => isOpen
    ? <div role="dialog" aria-label="Saisie rapide"><button type="button" onClick={onClose}>Fermer la saisie rapide</button></div>
    : null
}));

const oldBatch: Batch = {
  id: 'DASHBOARD-OLD', name: 'Garde du mois précédent', style: 'Saison',
  volumeL: 30, status: 'garde', brewDate: '15.08.2026', og: '1.050'
};
const currentBatch: Batch = {
  id: 'CURRENT', name: 'Brassin de septembre', style: 'IPA',
  volumeL: 24, status: 'planifie', brewDate: '10.09.2026'
};
const creativeItems: CreativeItem[] = [
  { id: 'AGENDA-TODO', type: 'event', title: 'Préparer le marché', date: '15.09.2026', status: 'todo' },
  { id: 'AGENDA-DONE', type: 'event', title: 'Rincer les fûts', status: 'done' },
  { id: 'IDEA', type: 'recipe-idea', title: 'Essai de saison', status: 'idea' }
];

function productionProps(): React.ComponentProps<typeof ProductionTab> {
  return {
    batches: [oldBatch, currentBatch], recipes: [],
    brewhouses: defaultConfig.brewhouses, activeBrewhouseId: defaultConfig.activeBrewhouseId,
    globalTimeFilter: 'this-month', targetSubTab: 'batches',
    onOpenCreateBatch: vi.fn(), onOpenQuickAction: vi.fn(),
    onOpenRecipe: vi.fn(), onOpenBrewDay: vi.fn(), onDraftRecipe: vi.fn()
  };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 12, 12));
});

afterEach(() => {
  cleanup();
  StorageService.clearMemoryCache();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Dashboard agenda navigation', () => {
  it('consumes an agenda section request once and lets a new request reopen it after a manual section change', () => {
    vi.spyOn(StorageService, 'getCreativeItems').mockReturnValue(creativeItems);
    const create = vi.spyOn(StorageService, 'addCreativeItem');
    const handled = vi.fn();
    const request = { section: 'event' as const, at: 1 };
    const view = render(<React.StrictMode><CreativeLabTab openSectionRequest={request} onOpenSectionRequestHandled={handled} /></React.StrictMode>);

    expect(screen.getByRole('button', { name: 'À faire', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Préparer le marché' })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Bières', exact: true }));
    view.rerender(<React.StrictMode><CreativeLabTab openSectionRequest={{ ...request }} onOpenSectionRequestHandled={handled} /></React.StrictMode>);
    expect(screen.getByRole('button', { name: 'Bières', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Essai de saison' })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);

    view.rerender(<React.StrictMode><CreativeLabTab openSectionRequest={{ section: 'event', at: 2 }} onOpenSectionRequestHandled={handled} /></React.StrictMode>);
    expect(screen.getByRole('button', { name: 'À faire', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Préparer le marché' })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(2);
    expect(create).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens existing agenda tasks from Gérer, reopens after another section and keeps the Header workshop entry generic', async () => {
    vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
    vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
    vi.spyOn(StorageService, 'getCreativeItems').mockReturnValue(creativeItems);
    const create = vi.spyOn(StorageService, 'addCreativeItem');
    const update = vi.spyOn(StorageService, 'updateCreativeItem');
    const { App } = await import('../../src/App');
    render(<App />);

    const agenda = await screen.findByRole('region', { name: 'Agenda', exact: true });
    fireEvent.click(within(agenda).getByRole('button', { name: 'Gérer', exact: true }));
    expect(screen.getByRole('button', { name: 'À faire', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Préparer le marché' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rincer les fûts' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bières', exact: true }));
    expect(screen.getByRole('heading', { name: 'Essai de saison' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));
    fireEvent.click(within(screen.getByRole('region', { name: 'Agenda', exact: true })).getByRole('button', { name: 'Gérer', exact: true }));
    expect(screen.getByRole('button', { name: 'À faire', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Préparer le marché' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));
    fireEvent.click(screen.getByRole('button', { name: 'Menu', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /^Atelier R&D/ }));
    expect(screen.getByRole('button', { name: 'Matériel', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'À faire', exact: true })).toHaveAttribute('aria-pressed', 'false');
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('Direct batch navigation from the dashboard', () => {
  it('opens a batch outside this month without widening the catalog, closes and reopens it only for a new request', () => {
    const handled = vi.fn();
    const props = { ...productionProps(), onOpenBatchRequestHandled: handled };
    const request = { id: oldBatch.id, at: 1 };
    const view = render(<ProductionTab {...props} />);
    const catalog = screen.getByLabelText('Liste des brassins');
    expect(within(catalog).getByRole('button', { name: 'Ouvrir le brassin CURRENT' })).toBeInTheDocument();
    expect(within(catalog).queryByRole('button', { name: `Ouvrir le brassin ${oldBatch.id}` })).not.toBeInTheDocument();

    view.rerender(<ProductionTab {...props} openBatchRequest={request} />);
    let dialog = screen.getByRole('dialog', { name: oldBatch.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.050');
    expect(handled).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Carnet', exact: true }));
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Fermer', exact: true })[0]);

    const updated = { ...oldBatch, name: 'Garde actualisée', og: '1.052' };
    view.rerender(<ProductionTab {...props} batches={[updated, currentBatch]} openBatchRequest={{ ...request }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Liste des brassins')).toHaveTextContent(currentBatch.name);
    expect(screen.getByLabelText('Liste des brassins')).not.toHaveTextContent(updated.name);

    view.rerender(<ProductionTab {...props} batches={[updated, currentBatch]} openBatchRequest={{ id: oldBatch.id, at: 2 }} />);
    dialog = screen.getByRole('dialog', { name: updated.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.052');
    expect(within(dialog).getByRole('button', { name: 'Mesures', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(handled).toHaveBeenCalledTimes(2);
    expect(props.onOpenBrewDay).not.toHaveBeenCalled();
  });

  it('waits for the requested live record, selects Brassins and consumes its request once under StrictMode', () => {
    const handled = vi.fn();
    const props = {
      ...productionProps(), targetSubTab: 'recipes' as const,
      openBatchRequest: { id: oldBatch.id, at: 3 }, onOpenBatchRequestHandled: handled
    };
    const view = render(<React.StrictMode><ProductionTab {...props} batches={[]} /></React.StrictMode>);
    expect(handled).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.rerender(<React.StrictMode><ProductionTab {...props} batches={[currentBatch]} /></React.StrictMode>);
    expect(handled).not.toHaveBeenCalled();

    view.rerender(<React.StrictMode><ProductionTab {...props} /></React.StrictMode>);
    expect(screen.getByRole('dialog', { name: oldBatch.name })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);
    expect(StorageService.getUiState('production_subtab', '')).toBe('batches');

    const updated = { ...oldBatch, name: 'Nom synchronisé', og: '1.056' };
    view.rerender(<React.StrictMode><ProductionTab {...props} batches={[updated, currentBatch]} /></React.StrictMode>);
    expect(within(screen.getByRole('dialog', { name: updated.name })).getByLabelText('Densité initiale')).toHaveValue('1.056');
    expect(handled).toHaveBeenCalledTimes(1);
  });

  it('does not open a delayed record after the pending request has been cleared', () => {
    const handled = vi.fn();
    const props = { ...productionProps(), onOpenBatchRequestHandled: handled };
    const view = render(<ProductionTab {...props} batches={[]} openBatchRequest={{ id: oldBatch.id, at: 4 }} />);
    view.rerender(<ProductionTab {...props} batches={[]} openBatchRequest={null} />);
    view.rerender(<ProductionTab {...props} openBatchRequest={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handled).not.toHaveBeenCalled();
  });

  it('wires App to the live detail, consumes navigation across tab changes and hides only the dashboard floating action', async () => {
    vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
    vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([oldBatch, currentBatch]);
    const { App } = await import('../../src/App');
    render(<App />);

    const open = await screen.findByRole('button', { name: new RegExp(oldBatch.name) });
    expect(screen.queryByRole('button', { name: 'Saisir un achat, une vente ou un brassin' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Saisie rapide', exact: true }));
    expect(screen.getByRole('dialog', { name: 'Saisie rapide' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la saisie rapide' }));
    fireEvent.click(open);
    let dialog = screen.getByRole('dialog', { name: oldBatch.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.050');
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Fermer', exact: true })[0]);
    expect(screen.getByRole('button', { name: 'Nouveau brassin', exact: true })).toBeVisible();
    expect(screen.getByLabelText('Liste des brassins')).not.toHaveTextContent(oldBatch.name);

    const navigation = screen.getByRole('navigation', { name: 'Navigation principale' });
    fireEvent.click(within(navigation).getByRole('button', { name: 'Bord', exact: true }));
    fireEvent.click(within(navigation).getByRole('button', { name: 'Brassins', exact: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(within(navigation).getByRole('button', { name: 'Bord', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(oldBatch.name) }));
    dialog = screen.getByRole('dialog', { name: oldBatch.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.050');
    expect(StorageService.getUiState('app_global_time_filter', '')).toBe('this-month');
  });
});
