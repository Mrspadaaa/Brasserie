import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { StockItem } from '../../src/types';
import { App } from '../../src/App';
import { YeastIngredientPicker } from '../../src/ui/YeastIngredientPicker';

// #114 : deux retours sur l'app en ligne. Le vrai rendu (390 et 1280 px) est
// contrôlé dans Chrome par scripts/check-fix114-ui.mjs ; ici, les contrats.

const ui = vi.hoisted(() => ({ activeTab: 'dashboard' }));

vi.mock('../../src/services/storage', () => {
  const config = {
    brewhouses: [],
    activeBrewhouseId: '',
    waterSources: [],
    activeWaterSourceId: '',
    geminiApiKey: '',
    fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081 }
  };
  const stocks = { rawMaterials: [], cleaning: [], equipment: [], kegs: [] };
  const empty = () => [];
  return {
    defaultConfig: config,
    StorageService: {
      getUiState: (key: string, fallback: unknown) => key === 'app_active_tab' ? ui.activeTab : fallback,
      setUiState: () => {},
      clearMemoryCache: () => {},
      startSync: () => {},
      getTransactions: empty,
      getStocks: () => stocks,
      getBatches: empty,
      getRecipes: empty,
      getClients: empty,
      getPlanning: empty,
      getBudgetLines: empty,
      getTarifs: empty,
      getConfig: () => config,
      getAuditLogs: empty,
      getCreativeItems: empty,
      getHopKnowledge: empty,
      isReady: () => true,
      subscribe: () => () => {},
      consumeWriteError: () => null
    }
  };
});

vi.mock('../../src/services/firebaseAuth', () => ({
  FirebaseAuthService: {
    onUserChange: (callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'fix114-user', email: 'fix114@example.test' });
      return () => {};
    },
    logout: async () => {}
  }
}));
vi.mock('../../src/services/migration', () => ({
  runMigrationIfNeeded: async () => ({ ran: false, source: 'test', counts: {} })
}));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/services/financialArchiveService', () => ({
  FinancialArchiveService: { getArchives: () => [] }
}));
vi.mock('../../functions/src/brewerAppScreens', () => ({
  brewerAppScreen: () => ({ label: 'Tableau de bord' })
}));
vi.mock('../../src/services/brewerJobs', () => ({
  useBrewerJobs: () => ({ jobs: [] }),
  isBrewerWorking: () => false
}));
vi.mock('../../src/pages/PageShell', async () => {
  const React = await import('react');
  return {
    ActionDock: () => React.createElement('div', { 'data-action-dock': 'nav', 'aria-hidden': 'true' }),
    PageShell: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    useActionDock: () => ({ dock: null }),
    useActionLauncherRegistration: () => {}
  };
});
vi.mock('../../src/pages/useFullScreenRoute', () => {
  const route = { route: { view: 'tabs' }, open: () => {}, close: () => {} };
  return { useFullScreenRoute: () => route };
});
vi.mock('../../src/pages/recipePageLoader', () => ({
  loadRecipePage: async () => ({ RecipePage: () => null }),
  preparedRecipePage: () => null
}));
vi.mock('../../src/ui/useViewport', () => ({
  useCoarsePointer: () => false,
  useKeyboardInset: () => 0,
  useDensity: () => 'compact'
}));
vi.mock('../../src/ui/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/FinancialLedgerLoading', () => ({ FinancialLedgerLoading: () => null }));
vi.mock('../../src/components/Header', () => ({ Header: () => null }));
vi.mock('../../src/components/BottomNav', async () => {
  const React = await import('react');
  return { BottomNav: () => React.createElement('nav', { 'aria-label': 'Navigation principale' }) };
});
vi.mock('../../src/components/LoginPage', () => ({ LoginPage: () => null }));
vi.mock('../../src/components/tabs/DashboardTab', () => ({ DashboardTab: () => null }));
vi.mock('../../src/components/tabs/FinancesTab', () => ({ FinancesTab: () => null }));
// La saisie s'ouvre au premier écran demandé ; `financeQuickActions.test.tsx`
// prouve déjà que `quick-expense` affiche directement le formulaire manuel.
vi.mock('../../src/components/QuickActionModal', async () => {
  const React = await import('react');
  return {
    QuickActionModal: (props: { isOpen: boolean; initialScreen: string }) => props.isOpen
      ? React.createElement('div', { role: 'dialog', 'aria-label': `Saisie ${props.initialScreen}` })
      : null
  };
});

beforeEach(() => { ui.activeTab = 'dashboard'; });
afterEach(() => { cleanup(); });

describe('#114 · le + du tableau de bord et de Finances ouvre la nouvelle écriture', () => {
  for (const tab of ['dashboard', 'finances']) {
    it(`${tab} : « Nouvelle écriture » en tête du menu, les autres saisies dessous`, async () => {
      ui.activeTab = tab;
      const user = userEvent.setup();
      render(<App />);
      await user.click(await screen.findByRole('button', { name: 'Actions rapides' }));
      const items = within(await screen.findByRole('menu', { name: 'Actions rapides' })).getAllByRole('menuitem');
      expect(items[0]).toHaveTextContent(/^Nouvelle écriture/);
      expect(items[0]).toHaveTextContent('Dépense saisie à la main');
      const labels = items.map(item => item.textContent ?? '');
      for (const other of ['Entrer une facture', 'Encaisser une vente', 'Créer une recette', 'Lancer un brassin']) {
        expect(labels.findIndex(label => label.startsWith(other))).toBeGreaterThan(0);
      }
      await user.click(items[0]);
      expect(await screen.findByRole('dialog', { name: 'Saisie quick-expense' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog', { name: 'Saisie menu' })).not.toBeInTheDocument();
    });
  }
});

describe('#114 · levure en stock au détail long', () => {
  const longDetail: StockItem = {
    id: 'doc-LEV-2026-0412-B', ref: 'LEV-2026-0412-B', name: 'American West Coast Ale', category: 'Levure',
    unit: 'g', currentStock: 11.5, minStock: 0, reorder: false, supplier: 'Brauerei-Bedarf Zürich',
    yeastLab: 'Fermentis by Lesaffre', yeastStrain: 'SafAle™ US-05®', yeastForm: 'sèche'
  };

  it('garde le nom et le détail complet dans la pastille « Disponibles »', () => {
    render(<YeastIngredientPicker items={[longDetail]} yeast={{ name: '' }} onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} personalChoice />);
    const chip = within(screen.getByRole('group', { name: 'Levures disponibles dans mon stock' })).getByRole('button');
    expect(chip).toHaveTextContent('American West Coast Ale');
    expect(chip).toHaveTextContent('Fermentis by Lesaffre · code SafAle™ US-05® · réf. LEV-2026-0412-B · 11,5 g');
  });

  // jsdom ne mesure rien : le contrat porte sur la règle qui causait le nom à
  // la verticale (détail rigide `flex-shrink: 0` sur une seule ligne).
  it('laisse le détail passer sous le nom au lieu d’écraser celui-ci', () => {
    const css = readFileSync(resolve(process.cwd(), 'src', 'ui', 'yeast-choice.css'), 'utf8');
    const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.yeast-choice .yc-stock-quick button')).toMatch(/flex-wrap:\s*wrap/);
    expect(rule('.yeast-choice .yc-stock-quick button > \\*')).toMatch(/min-width:\s*0/);
    expect(rule('.yeast-choice .yc-stock-quick small')).not.toMatch(/flex-shrink:\s*0/);
  });
});
