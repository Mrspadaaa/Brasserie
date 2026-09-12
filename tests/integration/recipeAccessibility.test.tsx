import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageShell } from '../../src/pages/PageShell';
import { ModalShell } from '../../src/ui/ModalShell';
import { RecipeReview } from '../../src/ui/RecipeReview';
import { WaterAcidity } from '../../src/ui/water/WaterAcidity';
import { useWaterWorkshop } from '../../src/ui/water/useWaterWorkshop';
import { type WaterState } from '../../src/ui/water/types';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';

const run = vi.hoisted(() => vi.fn());
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run } }));

afterEach(() => {
  cleanup();
  run.mockReset();
});

function PageHarness({ inertDialog = false }: { inertDialog?: boolean }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [alert, setAlert] = useState(false);
  const [step, setStep] = useState(1);
  return <>
    <nav aria-label="Navigation principale"><button onClick={() => setOpen(true)}>Nouvelle recette</button><button>Clients</button></nav>
    <aside data-testid="already-inert" inert>
      Autre contenu déjà désactivé
      {inertDialog && <div role="dialog" aria-label="Ancien dialogue"><button>Ancienne commande</button></div>}
    </aside>
    {alert && <div role="alert">Sauvegarde interrompue <button>Réessayer</button></div>}
    {open && <PageShell title="Nouvelle recette" subtitle={`Étape ${step}`} scrollKey={String(step)} onClose={() => setOpen(false)}>
      <button onClick={() => setDialog(true)}>Importer</button>
      <button onClick={() => setAlert(true)}>Afficher une alerte</button>
      {step === 1 ? <input aria-label="Nom" onKeyDown={event => { if (event.key === 'Enter') setStep(2); }} /> : <p>Fermentescibles</p>}
      <details><summary>Détails</summary><button>Commande masquée</button></details>
      <button onClick={() => setStep(value => value + 1)}>Changer d’étape</button>
      <button>Dernière commande</button>
      {createPortal(<ModalShell open={dialog} onClose={() => setDialog(false)} labelledBy="import-title">
        <h2 id="import-title">Importer la recette</h2>
        <input aria-label="Texte importé" />
        <button onClick={() => setDialog(false)}>Fermer l’import</button>
      </ModalShell>, document.body)}
    </PageShell>}
  </>;
}

function openPage() {
  render(<PageHarness />);
  const opener = screen.getByRole('button', { name: 'Nouvelle recette' });
  const clients = screen.getByRole('button', { name: 'Clients' });
  screen.getByTestId('already-inert').setAttribute('inert', 'prior');
  opener.focus();
  fireEvent.click(opener);
  return { opener, clients };
}

describe('Fullscreen recipe focus', () => {
  it('isolates the background, wraps Tab within visible controls and restores focus and previous inert state', () => {
    const { opener, clients } = openPage();
    const main = screen.getByRole('main', { name: 'Étape 1' });
    expect(main).toHaveFocus();
    expect(clients.closest('[inert]')).not.toBeNull();
    expect(main.closest('[inert]')).toBeNull();
    const close = screen.getByRole('button', { name: 'Fermer', exact: true });
    const last = screen.getByRole('button', { name: 'Dernière commande' });
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
    // jsdom does not implement native inert: the focus guard is tested independently.
    clients.focus();
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(opener).toHaveFocus();
    expect(clients.closest('[inert]')).toBeNull();
    expect(screen.getByTestId('already-inert')).toHaveAttribute('inert', 'prior');
  });

  it('returns a removed field’s focus to the new step but keeps a surviving navigation control focused', () => {
    openPage();
    const input = screen.getByRole('textbox', { name: 'Nom' });
    input.focus();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('main', { name: 'Étape 2' })).toHaveFocus();
    const next = screen.getByRole('button', { name: 'Changer d’étape' });
    next.focus();
    fireEvent.click(next);
    expect(next).toHaveFocus();
    expect(screen.getByRole('main', { name: 'Étape 3' })).toBeInTheDocument();
  });

  it('leaves a portaled modal in charge of focus and Escape, then returns to the page trigger', async () => {
    openPage();
    const trigger = screen.getByRole('button', { name: 'Importer', exact: true });
    trigger.focus();
    fireEvent.click(trigger);
    const modal = screen.getByRole('dialog', { name: 'Importer la recette' });
    await waitFor(() => expect(modal.closest('[inert]')).toBeNull());
    expect(modal).toHaveFocus();
    const input = within(modal).getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('main', { name: 'Étape 1' })).toBeInTheDocument();
  });

  it('keeps a new global error and its recovery action accessible without enabling the background', async () => {
    const { clients } = openPage();
    fireEvent.click(screen.getByRole('button', { name: 'Afficher une alerte' }));
    const retry = screen.getByRole('button', { name: 'Réessayer' });
    await waitFor(() => expect(retry.closest('[inert]')).toBeNull());
    retry.focus();
    expect(retry).toHaveFocus();
    expect(clients.closest('[inert]')).not.toBeNull();
    const last = screen.getByRole('button', { name: 'Dernière commande' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(retry).toHaveFocus();
    fireEvent.keyDown(retry, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('does not revive a dialog whose ancestor was already inert before opening the page', () => {
    render(<PageHarness inertDialog />);
    const opener = screen.getByRole('button', { name: 'Nouvelle recette' });
    opener.focus();
    fireEvent.click(opener);
    const main = screen.getByRole('main', { name: 'Étape 1' });
    expect(main).toHaveFocus();
    const oldAction = screen.getByRole('button', { name: 'Ancienne commande' });
    expect(oldAction.closest('[inert]')).not.toBeNull();
    oldAction.focus();
    expect(main).toHaveFocus();
    fireEvent.keyDown(main, { key: 'Escape' });
    expect(opener).toHaveFocus();
    expect(oldAction.closest('[inert]')).not.toBeNull();
  });
});

function WaterHarness({ noSparge = false }: { noSparge?: boolean }) {
  const [state, setState] = useState<WaterState>({
    diRatioPct: 50, styleCode: 'NEIPA', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 20, spargeWaterL: 10
  });
  const model = useWaterWorkshop({
    source: DEFAULT_WATER_SOURCE, onSourceChange: () => {}, beerEbc: null, beerVolumeL: 30,
    state, onChange: setState, noSparge, onNoSpargeChange: () => {}
  });
  return <WaterAcidity {...model} />;
}

describe('Water acidity tabs', () => {
  it('moves focus and selection together, links both panels and supports arrows and Home/End', () => {
    render(<WaterHarness />);
    const mash = screen.getByRole('tab', { name: 'Empâtage' });
    const sparge = screen.getByRole('tab', { name: 'Rinçage' });
    for (const tab of [mash, sparge]) {
      const panel = document.getElementById(tab.getAttribute('aria-controls')!);
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    }
    mash.focus();
    fireEvent.keyDown(mash, { key: 'ArrowRight' });
    expect(sparge).toHaveFocus();
    expect(sparge).toHaveAttribute('aria-selected', 'true');
    expect(mash).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel', { name: 'Rinçage' })).toBeVisible();
    expect(screen.queryByRole('tabpanel', { name: 'Empâtage' })).toBeNull();
    fireEvent.keyDown(sparge, { key: 'ArrowRight' });
    expect(mash).toHaveFocus();
    fireEvent.keyDown(mash, { key: 'End' });
    expect(sparge).toHaveFocus();
    fireEvent.keyDown(sparge, { key: 'Home' });
    expect(mash).toHaveFocus();
    fireEvent.keyDown(mash, { key: 'ArrowLeft' });
    expect(sparge).toHaveFocus();
  });

  it('keeps one reachable tab and its panel when there is no sparge water', () => {
    render(<WaterHarness noSparge />);
    const mash = screen.getByRole('tab', { name: 'Empâtage' });
    mash.focus();
    fireEvent.keyDown(mash, { key: 'End' });
    fireEvent.keyDown(mash, { key: 'ArrowRight' });
    expect(mash).toHaveFocus();
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tabpanel', { name: 'Empâtage' })).toBeVisible();
  });
});

function pendingReview() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise(result => { resolve = result; });
  run.mockReturnValueOnce(promise);
  return resolve;
}

describe('Recipe review announcements', () => {
  it('announces progress then a successful result without reading the entire report aloud', async () => {
    const resolve = pendingReview();
    render(<RecipeReview buildText={() => 'Recette de test'} />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    expect(status).toHaveTextContent('Relecture de la recette en cours.');
    await act(async () => resolve({ ok: true, data: { verdict: 'La recette est cohérente.', findings: [
      { severity: 'detail', topic: 'Température', observation: 'Prévoir le refroidissement.', suggestion: 'Préparer la cuve.' }
    ] } }));
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toHaveTextContent('Relecture terminée. La recette est cohérente. 1 point signalé.');
    expect(status).not.toHaveTextContent('Préparer la cuve.');
    expect(screen.getByText('Prévoir le refroidissement.')).toBeVisible();
  });

  it('announces a service error and keeps the retry control usable', async () => {
    run.mockResolvedValueOnce({ ok: false, error: 'Service indisponible. Réessaie.' });
    render(<RecipeReview buildText={() => 'Recette de test'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Service indisponible. Réessaie.');
    expect(screen.getByRole('button', { name: 'Faire relire la recette' })).toBeEnabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('announces an interrupted request and discards a stale successful announcement after editing', async () => {
    run.mockRejectedValueOnce(new Error('offline'));
    const view = render(<RecipeReview buildText={() => 'Première recette'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Analyse interrompue. Tu peux réessayer.');
    const resolve = pendingReview();
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    view.rerender(<RecipeReview buildText={() => 'Recette modifiée'} />);
    await act(async () => resolve({ ok: true, data: { verdict: 'Ancien résultat', findings: [] } }));
    expect(screen.queryByText('Ancien résultat')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
