import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FloatingActions } from '../../src/ui/FloatingActions';
import { resetFakeJobs } from './stubs/brewerJobs';

afterEach(() => cleanup());

beforeEach(() => {
  resetFakeJobs();
});

function renderActions(action: React.ComponentProps<typeof FloatingActions>['action'] = {
  intent: 'newEquipment',
  label: 'Nouveau matériel'
}) {
  const callbacks = {
    screen: vi.fn(),
    invoice: vi.fn(),
    sale: vi.fn(),
    recipe: vi.fn(),
    brew: vi.fn()
  };

  render(
    <FloatingActions
      action={action}
      onAction={callbacks.screen}
      companionLabel="Matériel"
      onInvoice={callbacks.invoice}
      onSale={callbacks.sale}
      onRecipe={callbacks.recipe}
      onBrew={callbacks.brew}
      anchor="nav"
    />
  );

  return callbacks;
}

function openMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions rapides' });
  fireEvent.click(trigger);
  const menu = screen.getByRole('menu', { name: 'Actions rapides' });
  const items = screen.getAllByRole('menuitem');
  return { trigger, menu, items };
}

describe('FloatingActions · contrat DOM et clavier', () => {
  it('publie son menu et exécute l’action de l’écran avant les actions globales', () => {
    const callbacks = renderActions();
    const trigger = screen.getByRole('button', { name: 'Actions rapides' });

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    const opened = openMenu();
    expect(opened.trigger.getAttribute('aria-expanded')).toBe('true');
    expect(opened.trigger.getAttribute('aria-controls')).toBe(opened.menu.id);
    expect(opened.items).toHaveLength(6);
    expect(opened.items[0].textContent).toContain('Nouveau matériel');
    expect(opened.items[1].textContent).toContain('Compagnon brasseur');
    expect(document.activeElement).toBe(opened.items[0]);

    fireEvent.click(opened.items[0]);
    expect(callbacks.screen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('route chaque choix du menu vers son callback ou événement précis', () => {
    const callbacks = renderActions(null);
    const destinations = [
      { label: /Entrer une facture/, run: callbacks.invoice },
      { label: /Encaisser une vente/, run: callbacks.sale },
      { label: /Créer une recette/, run: callbacks.recipe },
      { label: /Lancer un brassin/, run: callbacks.brew }
    ];

    for (const destination of destinations) {
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: destination.label }));
      expect(destination.run).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    }

    const companionOpen = vi.fn();
    window.addEventListener('brewer-companion-open', companionOpen);
    try {
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: /Compagnon brasseur/ }));
      expect(companionOpen).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    } finally {
      window.removeEventListener('brewer-companion-open', companionOpen);
    }
  });

  it('rend le focus au lanceur connecté avant d’exécuter une action d’écran', () => {
    let launcher: HTMLButtonElement | undefined;
    let focusAtRun: Element | null = null;
    let launcherConnectedAtRun = false;
    const screenAction = vi.fn(() => {
      focusAtRun = document.activeElement;
      launcherConnectedAtRun = launcher?.isConnected ?? false;
    });

    render(
      <FloatingActions
        action={{ intent: 'newEquipment', label: 'Nouveau matériel' }}
        onAction={screenAction}
        companionLabel="Matériel"
        onInvoice={vi.fn()}
        onSale={vi.fn()}
        onRecipe={vi.fn()}
        onBrew={vi.fn()}
        anchor="nav"
      />
    );
    launcher = screen.getByRole('button', { name: 'Actions rapides' }) as HTMLButtonElement;

    const { items } = openMenu();
    expect(document.activeElement).toBe(items[0]);
    fireEvent.click(items[0]);

    expect(screenAction).toHaveBeenCalledTimes(1);
    expect(launcherConnectedAtRun).toBe(true);
    expect(focusAtRun).toBe(launcher);
  });
  it('garde le focus dans le menu avec flèches/Home/End, puis Escape le rend au déclencheur', () => {
    renderActions();
    const { trigger, items } = openMenu();

    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: 'End' });
    expect(document.activeElement).toBe(items.at(-1));
    fireEvent.keyDown(items.at(-1)!, { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items.at(-1));

    fireEvent.keyDown(items.at(-1)!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('ferme par Tab et au pointeur extérieur sans déclencher une action de menu', () => {
    const callbacks = renderActions();
    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'Continuer la page';
    document.body.appendChild(outside);
    const outsideClick = vi.fn();
    outside.addEventListener('click', outsideClick);

    try {
      const first = openMenu();
      fireEvent.keyDown(first.items[0], { key: 'Tab' });
      expect(screen.queryByRole('menu')).toBeNull();

      openMenu();
      fireEvent.pointerDown(outside);
      expect(screen.queryByRole('menu')).toBeNull();
      fireEvent.click(outside);
      expect(outsideClick).toHaveBeenCalledTimes(1);
      expect(callbacks.screen).not.toHaveBeenCalled();
    } finally {
      outside.removeEventListener('click', outsideClick);
      outside.remove();
    }
  });

});
