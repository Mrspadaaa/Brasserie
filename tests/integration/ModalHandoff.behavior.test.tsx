import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalShell } from '../../src/ui/ModalShell';
import { Sheet } from '../../src/ui/Sheet';

afterEach(() => cleanup());

describe('Sheet → ModalShell · transfert asynchrone du focus', () => {
  it('garde le dialogue visible pendant le relais et restitue le déclencheur de la feuille', async () => {
    const user = userEvent.setup();
    const outsideFocus: string[] = [];
    const focusTrace: Array<Record<string, unknown>> = [];
    const mutationTrace: Array<Record<string, unknown>> = [];
    const startedAt = performance.now();
    const describeElement = (element: HTMLElement) => ({
      tag: element.tagName,
      id: element.id || null,
      role: element.getAttribute('role'),
      label: element.getAttribute('aria-labelledby'),
      state: element.dataset.state ?? null,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.hasAttribute('inert'),
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility,
      text: element.textContent?.trim().slice(0, 60) ?? null
    });
    const snapshotDialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].map(describeElement);
    const snapshotAncestors = (panel: HTMLElement) => {
      const result: Array<Record<string, unknown>> = [];
      for (let node: HTMLElement | null = panel; node; node = node.parentElement) {
        if (node === panel || node.hasAttribute('aria-hidden') || node.hasAttribute('inert') || node.dataset.state) {
          result.push(describeElement(node));
        }
      }
      return result;
    };
    const trackFocus = (event: FocusEvent) => {
      const finalPanel = document.querySelector<HTMLElement>('[data-testid="sale-final-content"]')?.closest<HTMLElement>('[role="dialog"]');
      if (!finalPanel) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const item = {
        atMs: Math.round(performance.now() - startedAt),
        target: target ? describeElement(target) : null,
        insideFinal: !!target && finalPanel.contains(target),
        activeTag: document.activeElement instanceof HTMLElement ? document.activeElement.tagName : null,
        dialogs: snapshotDialogs()
      };
      focusTrace.push(item);
      if (!target || !finalPanel.contains(target)) outsideFocus.push(target?.textContent?.trim().slice(0, 60) ?? 'unknown');
    };
    const observer = new MutationObserver(() => {
      const finalPanel = document.querySelector<HTMLElement>('[data-testid="sale-final-content"]')?.closest<HTMLElement>('[role="dialog"]');
      if (!finalPanel) return;
      mutationTrace.push({
        atMs: Math.round(performance.now() - startedAt),
        activeTag: document.activeElement instanceof HTMLElement ? document.activeElement.tagName : null,
        activeText: document.activeElement instanceof HTMLElement ? document.activeElement.textContent?.trim().slice(0, 60) ?? null : null,
        dialogs: snapshotDialogs(),
        finalAncestors: snapshotAncestors(finalPanel)
      });
      if (mutationTrace.length > 40) mutationTrace.shift();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden', 'inert', 'data-state', 'style'] });
    document.addEventListener('focusin', trackFocus);

    function Scenario() {
      const [sheetOpen, setSheetOpen] = useState(false);
      const [finalOpen, setFinalOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setSheetOpen(true)}>Ouvrir la recherche</button>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Recherche de vente">
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                setFinalOpen(true);
              }}
            >
              Continuer vers le formulaire
            </button>
          </Sheet>
          <ModalShell open={finalOpen} onClose={() => setFinalOpen(false)} labelledBy="sale-final-title">
            <div data-testid="sale-final-content">
              <h2 id="sale-final-title">Enregistrer la vente</h2>
              <button type="button" onClick={() => setFinalOpen(false)}>Terminer la vente</button>
            </div>
          </ModalShell>
        </>
      );
    }

    try {
      render(<Scenario />);
      const opener = screen.getByRole('button', { name: 'Ouvrir la recherche' });
      await user.click(opener);
      const sheetDialog = await screen.findByRole('dialog', { name: 'Recherche de vente' });
      expect(sheetDialog).toHaveAttribute('data-state', 'open');
      await waitFor(() => expect(sheetDialog).toContainElement(document.activeElement as HTMLElement));

      await user.click(screen.getByRole('button', { name: 'Continuer vers le formulaire' }));
      const finalContent = await screen.findByTestId('sale-final-content');
      const finalDialog = finalContent.closest<HTMLElement>('[role="dialog"]');
      expect(finalDialog).not.toBeNull();
      expect(finalDialog).toBeVisible();
      expect(finalDialog?.dataset.state).not.toBe('closed');

      const allDialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
      const visibleDialog = allDialogs
        .filter(panel =>
          panel.dataset.state !== 'closed' &&
          !panel.closest('[aria-hidden="true"], [inert]') &&
          getComputedStyle(panel).display !== 'none' &&
          getComputedStyle(panel).visibility !== 'hidden'
        )
        .at(-1);
      expect(visibleDialog).toBe(finalDialog);
      const closedSheet = allDialogs.find(panel => panel.dataset.state === 'closed');
      if (closedSheet) expect(visibleDialog).not.toBe(closedSheet);
      await waitFor(() => {
        if (!finalDialog?.contains(document.activeElement)) {
          const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].map(panel => ({
            label: panel.getAttribute('aria-labelledby'),
            state: panel.dataset.state ?? null,
            display: getComputedStyle(panel).display,
            visibility: getComputedStyle(panel).visibility,
            ariaHidden: panel.closest('[aria-hidden="true"]') !== null,
            active: panel === document.activeElement
          }));
          const active = document.activeElement as HTMLElement | null;
          throw new Error('Le dialogue final visible ne possède pas le focus. ' + JSON.stringify({
            activeTag: active?.tagName ?? null,
            activeText: active?.textContent?.trim().slice(0, 80) ?? null,
            activeConnected: active?.isConnected ?? false,
            dialogs,
            finalAncestors: snapshotAncestors(finalDialog),
            closedSheetPresent: !!closedSheet,
            outsideFocus,
            focusTrace,
            mutationTrace: mutationTrace.slice(-12)
          }));
        }
      });
      expect(outsideFocus).toEqual([]);

      await user.click(screen.getByRole('button', { name: 'Terminer la vente' }));
      await waitFor(() => expect(opener).toHaveFocus());
    } finally {
      observer.disconnect();
      document.removeEventListener('focusin', trackFocus);
    }
  });

  it('récupère le déclencheur connecté après fermeture du formulaire final', async () => {
    const user = userEvent.setup();

    function Scenario() {
      const [sheetOpen, setSheetOpen] = useState(false);
      const [finalOpen, setFinalOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setSheetOpen(true)}>Ouvrir la recherche</button>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Recherche de vente">
            <button type="button" onClick={() => { setSheetOpen(false); setFinalOpen(true); }}>
              Continuer vers le formulaire
            </button>
          </Sheet>
          <ModalShell open={finalOpen} onClose={() => setFinalOpen(false)} labelledBy="sale-final-title">
            <h2 id="sale-final-title">Enregistrer la vente</h2>
            <button type="button" onClick={() => setFinalOpen(false)}>Terminer la vente</button>
          </ModalShell>
        </>
      );
    }

    render(<Scenario />);
    const opener = screen.getByRole('button', { name: 'Ouvrir la recherche' });
    await user.click(opener);
    await screen.findByRole('dialog', { name: 'Recherche de vente' });
    await user.click(screen.getByRole('button', { name: 'Continuer vers le formulaire' }));
    expect(await screen.findByRole('dialog', { name: 'Enregistrer la vente' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Terminer la vente' }));
    await waitFor(() => expect(opener).toHaveFocus());
  });
  it('ne remplace pas un autre opener valide et connecté par le déclencheur transféré', async () => {
    const user = userEvent.setup();

    function Scenario() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Ouvrir le formulaire</button>
          <ModalShell open={open} onClose={() => setOpen(false)} labelledBy="simple-title">
            <h2 id="simple-title">Formulaire</h2>
            <button type="button" onClick={() => setOpen(false)}>Fermer le formulaire</button>
          </ModalShell>
        </>
      );
    }

    render(<Scenario />);
    const validOpener = screen.getByRole('button', { name: 'Ouvrir le formulaire' });
    await user.click(validOpener);
    const dialog = screen.getByRole('dialog', { name: 'Formulaire' });
    const incomingOpener = document.createElement('button');
    incomingOpener.textContent = 'Déclencheur précédent';
    document.body.appendChild(incomingOpener);

    try {
      const modalModule = await import('../../src/ui/ModalShell');
      expect(typeof modalModule.transferModalReturnFocus).toBe('function');
      modalModule.transferModalReturnFocus(dialog as HTMLElement, incomingOpener);
      await user.click(screen.getByRole('button', { name: 'Fermer le formulaire' }));
      await waitFor(() => expect(validOpener).toHaveFocus());
    } finally {
      incomingOpener.remove();
    }
  });
});