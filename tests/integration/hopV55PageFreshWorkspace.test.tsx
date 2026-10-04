import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';

// Exercise the parent callback independently of the note editor: a second view
// can save a newer workspace while this Page keeps its original props.
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({
  HopV55ReferencePanel: ({ getWorkspace, workspace }: { getWorkspace(): Promise<HopV55Workspace>; workspace?: HopV55Workspace }) => {
    const [result, setResult] = useState('');
    return <div><p>Dossier courant : {workspace?.title}</p><button onClick={() => void getWorkspace().then(ws => setResult(`${ws.revision}:${ws.title}`))
      .catch(error => setResult(error.message))}>Relire le dossier avant la commande</button><output>{result}</output></div>;
  },
}));

import { HopV55Page } from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function harness() {
  const context = makeHopV55FixtureContext('unknown');
  const base: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: 'page-fresh-workspace', ownerKey: 'fixture-owner',
    revision: 1, title: 'Dossier initial', intent: { question: '', criteria: [] }, scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: new Date(context.now).toISOString() };
  const initial = ensureHopV55ReferenceJournal(base, context, prepareBrewingScenarioContext(context));
  let stored: HopV55Workspace | undefined = structuredClone(initial);
  const save = vi.fn();
  const read = vi.fn(async (_owner: string, _id: string) => stored ? structuredClone(stored) : undefined);
  const services = { ownerKey: base.ownerKey, scope: 'fixture', loadContext: vi.fn(async () => structuredClone(context)),
    workspaces: { list: vi.fn(async () => [structuredClone(initial)]), read, save }, scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;
  return { services, read, save, initial, replaceStored: (value?: HopV55Workspace) => { stored = value ? structuredClone(value) : undefined; } };
}

describe('Page V5.5 — source du dossier avant une commande', () => {
  it('relit la révision sauvée par une autre vue au lieu du cache React', async () => {
    const h = harness();
    render(<HopV55Page services={h.services} />);
    const button = await screen.findByRole('button', { name: 'Relire le dossier avant la commande' });
    h.replaceStored({ ...h.initial, revision: 2, title: 'Dossier modifié dans une autre vue' });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2:Dossier modifié dans une autre vue'));
    expect(h.read).toHaveBeenCalledWith('fixture-owner', 'page-fresh-workspace');
    expect(h.save).not.toHaveBeenCalled();
  });

  it('refuse un dossier disparu sans recréer un autre dossier depuis le cache', async () => {
    const h = harness();
    render(<HopV55Page services={h.services} />);
    const button = await screen.findByRole('button', { name: 'Relire le dossier avant la commande' });
    h.replaceStored(undefined);
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Le dossier exact n’est plus disponible'));
    expect(h.save).not.toHaveBeenCalled();
  });

  it('refuse une lecture tardive de A et ne partage pas sa promesse avec le dossier B', async () => {
    const h = harness();
    const other = ensureHopV55ReferenceJournal({ ...h.initial, id: 'page-fresh-workspace-B', title: 'Second dossier',
      sourceRecipeId: 'source-B', referenceJournal: undefined }, makeHopV55FixtureContext('unknown'),
    prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown')));
    h.services.workspaces.list = vi.fn(async () => [h.initial, other]);
    let releaseA!: (value: HopV55Workspace) => void;
    const pendingA = new Promise<HopV55Workspace>(resolve => { releaseA = resolve; });
    h.read.mockImplementation(async (_owner: string, id: string) => id === h.initial.id ? pendingA : structuredClone(other));
    render(<HopV55Page services={h.services} />);
    const reader = await screen.findByRole('button', { name: 'Relire le dossier avant la commande' });
    fireEvent.click(reader);
    await waitFor(() => expect(h.read).toHaveBeenCalledWith('fixture-owner', h.initial.id));
    fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByRole('button', { name: /Second dossier.*Exploration sans question/ }));
    await waitFor(() => expect(screen.getByText('Dossier courant : Second dossier')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: /Second dossier.*Exploration sans question/ })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Relire le dossier avant la commande' }));
    await waitFor(() => expect(screen.getByText('1:Second dossier')).toBeInTheDocument());
    releaseA(structuredClone(h.initial));
    await waitFor(() => expect(screen.getByText(/Le dossier actif a changé pendant cette lecture/)).toBeInTheDocument());
    expect(screen.getByText('Dossier courant : Second dossier')).toBeInTheDocument();
    expect(h.read.mock.calls.filter(call => call[1] === other.id)).toHaveLength(2);
    expect(h.save).not.toHaveBeenCalled();
  });
});
