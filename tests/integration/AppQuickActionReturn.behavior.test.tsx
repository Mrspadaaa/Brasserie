import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from '../../src/App';

const releaseEvent = 'luna:quick-action-modal-released';

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
      getUiState: (_key: string, fallback: unknown) => fallback,
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
      isReady: () => true,
      subscribe: () => () => {},
      consumeWriteError: () => null
    }
  };
});

vi.mock('../../src/services/firebaseAuth', () => ({
  FirebaseAuthService: {
    onUserChange: (callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'fab-test-user', email: 'fab-test@example.test' });
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
vi.mock('../../src/domain/fabActions', () => ({
  fabActionFor: () => ({ intent: 'newEquipment', label: 'Nouveau matériel' })
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
vi.mock('../../src/ui/CommandPalette', async () => {
  const React = await import('react');
  return { CommandPalette: () => null };
});
vi.mock('../../src/ui/PersistenceStatus', async () => ({
  PersistenceStatus: () => null
}));
vi.mock('../../src/ui/BrewerActivity', async () => ({
  BrewerActivity: () => null
}));
vi.mock('../../src/ui/FinancialLedgerLoading', async () => ({
  FinancialLedgerLoading: () => null
}));
vi.mock('../../src/components/Header', async () => ({
  Header: () => null
}));
vi.mock('../../src/components/BottomNav', async () => {
  const React = await import('react');
  return { BottomNav: () => React.createElement('nav', { 'aria-label': 'Navigation principale' }) };
});
vi.mock('../../src/components/LoginPage', async () => ({
  LoginPage: () => null
}));
vi.mock('../../src/components/tabs/DashboardTab', async () => {
  const React = await import('react');
  return {
    DashboardTab: () => React.createElement(
      'button',
      { type: 'button', 'data-testid': 'other-focus-target' },
      'Autre foyer valide'
    )
  };
});

// Keep the real App, FloatingActions, Sheet and fallback lifecycle. Only the
// lazy quick-action content is stubbed; its portal remains modal through a
// short close delay, then drops its dialog and inert scope before App receives onClose.
vi.mock('../../src/components/QuickActionModal', async () => {
  await new Promise(resolve => setTimeout(resolve, 250));
  const React = await import('react');
  const { createPortal, flushSync } = await import('react-dom');

  function QuickActionModal(props: { isOpen: boolean; onClose: () => void }) {
    const [visible, setVisible] = React.useState(props.isOpen);
    React.useEffect(() => {
      if (props.isOpen) setVisible(true);
    }, [props.isOpen]);
    React.useLayoutEffect(() => {
      const appRoot = document.querySelector<HTMLElement>('[data-testid="app-root"]');
      if (!appRoot) return;
      if (props.isOpen && visible) appRoot.setAttribute('inert', '');
      else appRoot.removeAttribute('inert');
    }, [props.isOpen, visible]);

    const close = () => {
      window.setTimeout(() => {
        flushSync(() => setVisible(false));
        document.dispatchEvent(new Event(releaseEvent));
        window.setTimeout(props.onClose, 0);
      }, 35);
    };

    if (!props.isOpen || !visible) return null;
    return createPortal(
      <div role="dialog" aria-modal="true" aria-labelledby="luna-quick-title" data-testid="luna-quick-dialog">
        <h2 id="luna-quick-title">Saisie rapide</h2>
        <button type="button" onClick={close}>Fermer la saisie rapide</button>
      </div>,
      document.body
    );
  }

  return { QuickActionModal };
});

const floatingActionsCss = readFileSync(resolve(process.cwd(), 'src', 'ui', 'floating-actions.css'), 'utf8');
let styleElement: HTMLStyleElement | null = null;

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  styleElement = document.createElement('style');
  styleElement.dataset.testFloatingActions = '';
  styleElement.textContent = floatingActionsCss;
  document.head.append(styleElement);
});

afterEach(() => {
  cleanup();
  styleElement?.remove();
  styleElement = null;
  window.history.replaceState({}, '', '/');
});

describe('App réelle · retour du lanceur après les saisies rapides', () => {
  async function mountAndOpenSale(expectLoadingSheet: boolean) {
    const user = userEvent.setup();
    render(<div data-testid="app-root"><App /></div>);
    const launcher = await screen.findByRole('button', { name: 'Actions rapides' });
    await user.click(launcher);
    const saleAction = await screen.findByRole('menuitem', { name: 'Encaisser une vente' });

    let lostFocusToBody = false;
    const loseFocusWhenLauncherReturns = (event: FocusEvent) => {
      if (event.target !== launcher) return;
      document.removeEventListener('focusin', loseFocusWhenLauncherReturns);
      launcher.blur();
      lostFocusToBody = document.activeElement === document.body;
    };
    document.addEventListener('focusin', loseFocusWhenLauncherReturns);
    await user.click(saleAction);

    if (expectLoadingSheet) {
      const loadingSheet = await screen.findByRole('dialog', { name: 'Chargement…' });
      expect(loadingSheet).toBeVisible();
    }
    const modal = await screen.findByRole('dialog', { name: 'Saisie rapide' });
    expect(modal).toBeVisible();
    expect(launcher).not.toBeVisible();
    expect(getComputedStyle(launcher.closest('.floating-actions') as HTMLElement).display).toBe('none');
    expect(document.querySelector('[data-testid="app-root"]')).toHaveAttribute('inert');
    return { user, launcher, modal, lostFocusToBody };
  }

  it('restaure le lanceur de App quand le modal et inert sont réellement retirés', async () => {
    const { user, launcher, modal, lostFocusToBody } = await mountAndOpenSale(true);
    expect(lostFocusToBody).toBe(true);

    let releaseSnapshot: { modalPresent: boolean; inert: boolean; active: Element | null } | null = null;
    const onReleased = () => {
      const appRoot = document.querySelector<HTMLElement>('[data-testid="app-root"]');
      releaseSnapshot = {
        modalPresent: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
        inert: !!appRoot?.hasAttribute('inert'),
        active: document.activeElement
      };
    };
    document.addEventListener(releaseEvent, onReleased, { once: true });

    await user.click(screen.getByRole('button', { name: 'Fermer la saisie rapide' }));
    await new Promise(resolve => setTimeout(resolve, 8));
    expect(modal).toBeInTheDocument();
    expect(document.querySelector('[data-testid="app-root"]')).toHaveAttribute('inert');

    await waitFor(() => expect(releaseSnapshot).not.toBeNull());
    expect(releaseSnapshot).toMatchObject({ modalPresent: false, inert: false, active: document.body });
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(launcher).toBeVisible();
  });

  it('ne reprend pas le focus si un autre contrôle valide l’a reçu après la libération du modal', async () => {
    const { user, launcher } = await mountAndOpenSale(false);
    const other = screen.getByTestId('other-focus-target');
    let releasedWithoutModal = false;
    const onReleased = () => {
      releasedWithoutModal =
        !document.querySelector('[role="dialog"][aria-modal="true"]') &&
        !document.querySelector('[data-testid="app-root"]')?.hasAttribute('inert');
      other.focus();
    };
    document.addEventListener(releaseEvent, onReleased, { once: true });

    await user.click(screen.getByRole('button', { name: 'Fermer la saisie rapide' }));
    await waitFor(() => expect(releasedWithoutModal).toBe(true));
    await waitFor(() => expect(other).toHaveFocus());
    expect(launcher).not.toHaveFocus();
  });
});