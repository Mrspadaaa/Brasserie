import React, { useRef, useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalShell } from '../../src/ui/ModalShell';
import { Sheet } from '../../src/ui/Sheet';

let ModalOpenerContext: React.Context<HTMLElement | null>;

beforeAll(async () => {
  const module = await import('../../src/ui/ModalShell');
  const candidate = (module as unknown as { ModalOpenerContext?: React.Context<HTMLElement | null> }).ModalOpenerContext;
  // Root03 has no context API. A local no-op provider lets the same DOM behavior run there;
  // the consumer components ignore it, so any red result must come from lost focus, not import failure.
  ModalOpenerContext = candidate ?? React.createContext<HTMLElement | null>(null);
});

afterEach(() => cleanup());

describe('ModalOpenerContext · déclencheur masqué avant autofocus', () => {
  it('restaure le déclencheur d’un ModalShell direct quand le focus est BODY à son ouverture', async () => {
    const user = userEvent.setup();
    let bodyAtCapture = false;

    function Scenario() {
      const openerRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      const [opener, setOpener] = useState<HTMLElement | null>(null);

      const openModal = () => {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpener(active?.isConnected ? active : null);
        active?.blur();
        bodyAtCapture = document.activeElement === document.body;
        setOpen(true);
      };

      return (
        <>
          <button
            ref={openerRef}
            type="button"
            style={open ? { display: 'none' } : undefined}
            onClick={openModal}
          >
            Ouvrir la vente
          </button>
          <ModalOpenerContext.Provider value={opener}>
            <ModalShell open={open} onClose={() => setOpen(false)} labelledBy="direct-title">
              <h2 id="direct-title">Enregistrer la vente</h2>
              <button type="button" onClick={() => setOpen(false)}>Fermer la vente</button>
            </ModalShell>
          </ModalOpenerContext.Provider>
        </>
      );
    }

    render(<Scenario />);
    const opener = screen.getByRole('button', { name: 'Ouvrir la vente' });
    await user.click(opener);
    expect(bodyAtCapture).toBe(true);
    expect(opener).not.toBeVisible();

    const dialog = await screen.findByRole('dialog', { name: 'Enregistrer la vente' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await user.click(screen.getByRole('button', { name: 'Fermer la vente' }));
    await waitFor(() => expect(opener).toHaveFocus());
    expect(opener).toBeVisible();
  });

  it('garde l’opener explicite pendant Sheet → ModalShell quand le focus est BODY au départ', async () => {
    const user = userEvent.setup();
    let bodyAtCapture = false;

    function Scenario() {
      const openerRef = useRef<HTMLButtonElement>(null);
      const [opener, setOpener] = useState<HTMLElement | null>(null);
      const [sheetOpen, setSheetOpen] = useState(false);
      const [modalOpen, setModalOpen] = useState(false);

      const openSheet = () => {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpener(active?.isConnected ? active : null);
        active?.blur();
        bodyAtCapture = document.activeElement === document.body;
        setSheetOpen(true);
      };

      return (
        <>
          <button
            ref={openerRef}
            type="button"
            style={sheetOpen || modalOpen ? { display: 'none' } : undefined}
            onClick={openSheet}
          >
            Rechercher une vente
          </button>
          <ModalOpenerContext.Provider value={opener}>
            <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Recherche de vente">
              <button
                type="button"
                onClick={() => {
                  setSheetOpen(false);
                  setModalOpen(true);
                }}
              >
                Continuer vers la vente
              </button>
            </Sheet>
            <ModalShell open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="handoff-title">
              <h2 id="handoff-title">Enregistrer la vente</h2>
              <button type="button" onClick={() => setModalOpen(false)}>Fermer le formulaire</button>
            </ModalShell>
          </ModalOpenerContext.Provider>
        </>
      );
    }

    render(<Scenario />);
    const opener = screen.getByRole('button', { name: 'Rechercher une vente' });
    await user.click(opener);
    expect(bodyAtCapture).toBe(true);
    expect(opener).not.toBeVisible();

    const sheet = await screen.findByRole('dialog', { name: 'Recherche de vente' });
    await waitFor(() => expect(sheet).toContainElement(document.activeElement as HTMLElement));
    await user.click(screen.getByRole('button', { name: 'Continuer vers la vente' }));

    const modal = await screen.findByRole('dialog', { name: 'Enregistrer la vente' });
    await waitFor(() => expect(modal).toContainElement(document.activeElement as HTMLElement));
    await user.click(screen.getByRole('button', { name: 'Fermer le formulaire' }));
    await waitFor(() => expect(opener).toHaveFocus());
    expect(opener).toBeVisible();
  });
});