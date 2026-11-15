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
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: ({ localOnly }: { localOnly?: boolean }) => localOnly ? <div role="status">Compagnon hors connexion · mode local</div> : null }));
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
// Voie p3 : la période de l'application ne juge que les brassins finis ; un brassin en garde reste visible sous toute période.
const finiBatch: Batch = {
  id: 'DASHBOARD-DONE', name: 'Terminé du mois précédent', style: 'Stout',
  volumeL: 20, status: 'termine', brewDate: '10.08.2026', og: '1.060'
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
    batches: [oldBatch, finiBatch, currentBatch], recipes: [],
    brewhouses: defaultConfig.brewhouses, activeBrewhouseId: defaultConfig.activeBrewhouseId,
    globalTimeFilter: 'this-month', targetSubTab: 'batches',
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

// e9na (15.11) : les rubriques sont des tiroirs du carnet (« À faire 2 », compteur dans le nom) et chaque note est une carte « Ouvrir : <titre> » (plus de titre en en-tête).
describe('Dashboard agenda navigation', () => {
  it('garde l’initialisation dev-local et laisse le compagnon hors connexion', async () => {
    const startSync = vi.spyOn(StorageService, 'startSync');
    vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
    const { App } = await import('../../src/App');
    render(<App />);
    expect(await screen.findByRole('status')).toHaveTextContent('Compagnon hors connexion · mode local');
    expect(startSync).toHaveBeenCalledOnce();
  });
  it('consumes an agenda section request once and lets a new request reopen it after a manual section change', () => {
    vi.spyOn(StorageService, 'getCreativeItems').mockReturnValue(creativeItems);
    const create = vi.spyOn(StorageService, 'addCreativeItem');
    const handled = vi.fn();
    const request = { section: 'event' as const, at: 1 };
    const view = render(<React.StrictMode><CreativeLabTab openSectionRequest={request} onOpenSectionRequestHandled={handled} /></React.StrictMode>);

    expect(screen.getByRole('button', { name: /^À faire/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ouvrir : Préparer le marché' })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /^Bières/ }));
    view.rerender(<React.StrictMode><CreativeLabTab openSectionRequest={{ ...request }} onOpenSectionRequestHandled={handled} /></React.StrictMode>);
    expect(screen.getByRole('button', { name: /^Bières/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ouvrir : Essai de saison' })).toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);

    view.rerender(<React.StrictMode><CreativeLabTab openSectionRequest={{ section: 'event', at: 2 }} onOpenSectionRequestHandled={handled} /></React.StrictMode>);
    expect(screen.getByRole('button', { name: /^À faire/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ouvrir : Préparer le marché' })).toBeInTheDocument();
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
    expect(await screen.findByRole('button', { name: /^À faire/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ouvrir : Préparer le marché' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir : Rincer les fûts' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Bières/ }));
    expect(screen.getByRole('button', { name: 'Ouvrir : Essai de saison' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));
    fireEvent.click(within(screen.getByRole('region', { name: 'Agenda', exact: true })).getByRole('button', { name: 'Gérer', exact: true }));
    expect(screen.getByRole('button', { name: /^À faire/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ouvrir : Préparer le marché' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));
    fireEvent.click(screen.getByRole('button', { name: 'Menu', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /^Atelier R&D/ }));
    // e9na : l'entrée générique de l'Atelier ouvre « Tout » (le carnet entier), plus la seule rubrique Matériel.
    expect(screen.getByRole('button', { name: /^Tout/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^À faire/ })).toHaveAttribute('aria-pressed', 'false');
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
    expect(within(catalog).getByRole('button', { name: `Ouvrir le brassin ${oldBatch.id}` })).toBeInTheDocument(); // en garde : visible sous toute période
    expect(within(catalog).queryByRole('button', { name: `Ouvrir le brassin ${finiBatch.id}` })).not.toBeInTheDocument(); // fini hors du mois : la période le juge encore

    view.rerender(<ProductionTab {...props} openBatchRequest={request} />);
    let dialog = screen.getByRole('dialog', { name: oldBatch.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.050');
    expect(handled).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Carnet', exact: true }));
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Fermer', exact: true })[0]);

    const updated = { ...oldBatch, name: 'Garde actualisée', og: '1.052' };
    view.rerender(<ProductionTab {...props} batches={[updated, finiBatch, currentBatch]} openBatchRequest={{ ...request }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handled).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Liste des brassins')).toHaveTextContent(currentBatch.name);
    expect(screen.getByLabelText('Liste des brassins')).toHaveTextContent(updated.name); // en garde : reste listé
    expect(screen.getByLabelText('Liste des brassins')).not.toHaveTextContent(finiBatch.name); // fini hors période : jamais élargi

    view.rerender(<ProductionTab {...props} batches={[updated, finiBatch, currentBatch]} openBatchRequest={{ id: oldBatch.id, at: 2 }} />);
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

  it('wires App to the live detail, consumes navigation across tab changes and keeps the floating action on every tab', async () => {
    vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
    vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([oldBatch, finiBatch, currentBatch]);
    const { App } = await import('../../src/App');
    render(<App />);

    const open = await screen.findByRole('button', { name: new RegExp(oldBatch.name) });
    // Le tableau de bord n'a plus ses propres raccourcis : tout passe par le bouton flottant.
    expect(screen.queryByRole('button', { name: 'Saisie rapide', exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    // BX-4 (09.11) : au Bord, l'action de l'écran est « Nouvelle écriture » ; « Entrer une facture » n'est plus répétée dans le menu. La vente passe par la même saisie rapide.
    fireEvent.click(await screen.findByRole('menuitem', { name: /Encaisser une vente/ }));
    expect(await screen.findByRole('dialog', { name: 'Saisie rapide' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la saisie rapide' }));
    fireEvent.click(open);
    let dialog = await screen.findByRole('dialog', { name: oldBatch.name });
    expect(within(dialog).getByLabelText('Densité initiale')).toHaveValue('1.050');
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Fermer', exact: true })[0]);
    // L'action de l'écran reste la première du menu du bouton flottant.
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    expect(screen.getByRole('menuitem', { name: /Nouveau brassin/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Actions rapides' }));
    expect(screen.getByLabelText('Liste des brassins')).not.toHaveTextContent(finiBatch.name);

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
