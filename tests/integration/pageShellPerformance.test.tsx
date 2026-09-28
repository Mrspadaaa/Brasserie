import React, { lazy, Suspense, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PageShell } from '../../src/pages/PageShell';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function DocumentaryPage() {
  return <>
    <button>Navigation de fond</button>
    <PageShell title="Recette documentaire" onClose={() => {}}>
      <div><div><div><div><div>
        {Array.from({ length: 40 }, (_, index) => <p key={index} role="status">Repère {index}</p>)}
        <details><summary>Sources documentaires</summary>
          {Array.from({ length: 60 }, (_, index) => <div key={index} role="status"><button>Source {index}</button></div>)}
        </details>
      </div></div></div></div></div>
      <button>Dernière action</button>
    </PageShell>
  </>;
}

it('keeps style reads bounded when many announcements share ancestors, including on a subtree mutation', async () => {
  const styles = vi.spyOn(window, 'getComputedStyle');
  render(<DocumentaryPage />);
  // The former isolation walked every ancestor of every hidden documentary status.
  // A pass may read each distinct visible element once, not its ancestors repeatedly.
  expect(styles.mock.calls.length).toBeLessThan(300);
  expect(screen.getByRole('button', { name: 'Navigation de fond' }).closest('[inert]')).not.toBeNull();
  styles.mockClear();
  await act(async () => {
    document.querySelector('[data-page-shell]')!.setAttribute('data-state', 'updated');
    await Promise.resolve();
  });
  expect(styles.mock.calls.length).toBeLessThan(150);
  const last = screen.getByRole('button', { name: 'Dernière action' });
  last.focus();
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
});

it('rechecks visibility after a closed disclosure opens or a hidden global recovery action becomes visible', async () => {
  render(<DocumentaryPage />);
  const main = screen.getByRole('main');
  const details = document.querySelector('details')!;
  await act(async () => { details.open = true; await Promise.resolve(); });
  const source = screen.getByRole('button', { name: 'Source 59' });
  source.focus();
  expect(source).toHaveFocus();
  await act(async () => { details.open = false; await Promise.resolve(); });
  const last = screen.getByRole('button', { name: 'Dernière action' });
  last.focus();
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();

  const alert = document.createElement('div');
  alert.role = 'alert'; alert.hidden = true;
  const retry = document.createElement('button'); retry.textContent = 'Corriger la sauvegarde';
  alert.append(retry);
  await act(async () => { document.body.append(alert); await Promise.resolve(); });
  expect(alert.closest('[inert]')).not.toBeNull();
  await act(async () => { alert.hidden = false; await Promise.resolve(); });
  expect(alert.closest('[inert]')).toBeNull();
  retry.focus(); expect(retry).toHaveFocus();
  fireEvent.keyDown(retry, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
  await act(async () => { alert.remove(); await Promise.resolve(); });
  main.focus(); expect(main).toHaveFocus();
});

it('restores the catalogue trigger when a lazy page replaces a focused loading PageShell', async () => {
  let finish!: (module: { default: React.FC<{ onClose: () => void }> }) => void;
  const Loaded = lazy(() => new Promise<{ default: React.FC<{ onClose: () => void }> }>(resolve => { finish = resolve; }));
  function Harness() {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    return <>
      <button onClick={() => setOpen(true)}>Ouvrir la recette</button>
      {open && <Suspense fallback={<PageShell title="Chargement" onClose={close}><p role="status">Préparation</p></PageShell>}>
        <Loaded onClose={close} />
      </Suspense>}
    </>;
  }
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Ouvrir la recette' });
  trigger.focus(); fireEvent.click(trigger);
  expect(screen.getByRole('main', { name: 'Chargement' })).toHaveFocus();
  await act(async () => finish({ default: ({ onClose }) => <PageShell title="Recette chargée" onClose={onClose}><p>Données réelles du document</p></PageShell> }));
  expect(screen.getByRole('main', { name: 'Recette chargée' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(trigger).toHaveFocus();
});

it('keeps page keyboard navigation and Escape active with a desktop inline presentation dialog', () => {
  const close = vi.fn();
  render(<PageShell title="Brassin" onClose={close}>
    <dialog open role="presentation"><label>Note<textarea /></label></dialog>
    <button>Dernière action</button>
  </PageShell>);
  const last = screen.getByRole('button', { name: 'Dernière action' });
  last.focus();
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(close).toHaveBeenCalledOnce();
});

it('returns to the catalogue when a command overlay directly replaces one keyed recipe page with another', () => {
  function Harness() {
    const [page, setPage] = useState(''), [palette, setPalette] = useState(false);
    return <>
      <button onClick={() => setPage('A')}>Catalogue</button>
      {page && <PageShell key={page} title={page} onClose={() => setPage('')}>
        <button onClick={() => setPalette(true)}>Recherche</button>
      </PageShell>}
      {palette && <div data-page-overlay>
        <input aria-label="Recherche universelle" />
        <button onClick={() => { setPalette(false); setPage('B'); }}>Autre recette</button>
      </div>}
    </>;
  }
  render(<Harness />);
  const catalogue = screen.getByRole('button', { name: 'Catalogue' });
  catalogue.focus(); fireEvent.click(catalogue);
  const search = screen.getByRole('button', { name: 'Recherche' });
  search.focus(); fireEvent.click(search);
  const input = screen.getByRole('textbox', { name: 'Recherche universelle' });
  input.focus(); expect(input).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Autre recette' }));
  expect(screen.getByRole('main', { name: 'B' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(catalogue).toHaveFocus();
});
