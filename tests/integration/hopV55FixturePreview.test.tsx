import React, { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const fixtureTracker = vi.hoisted(() => ({
  events: [] as string[],
  services: [] as Array<{ mode: string; closed: boolean }>,
  pageProps: undefined as Record<string, any> | undefined,
  chatProps: [] as Array<Record<string, any>>,
  runtimeCreations: [] as Array<{ namespace: string; delay: string }>,
  sessions: [] as Array<unknown>,
  releaseCalls: 0,
  activity: { jobs: [] as any[], connectionError: '' }
}));

vi.mock('../../src/services/hopV55/fixtureRuntime', () => ({
  createHopV55FixtureServices: (_namespace: string, options: { mode: string }) => {
    const mode = options.mode;
    const service = {
      mode,
      closed: false,
      close() { this.closed = true; fixtureTracker.events.push(`close:${mode}`); },
    };
    fixtureTracker.services.push(service);
    fixtureTracker.events.push(`create:${mode}`);
    return service;
  },
}));

vi.mock('../../src/ui/hopV55/Page', () => ({
  HopV55Page: (props: { services: { mode: string; closed: boolean }; onOpenAssistedCompanion?: (session: unknown) => void }) => {
    const { services } = props;
    fixtureTracker.pageProps = props;
    useEffect(() => {
      fixtureTracker.events.push(`page-mount:${services.mode}${services.closed ? ':closed' : ''}`);
      return () => fixtureTracker.events.push(`page-unmount:${services.mode}${services.closed ? ':closed' : ''}`);
    }, [services]);
    return React.createElement('div', { 'data-testid': 'fixture-page-mode' }, services.mode);
  },
}));

vi.mock('../../src/services/hopV55/assistedAdviceFixtureRuntime', () => ({
  createHopV55AssistedAdviceFixtureRuntime: (args: { namespace: string; delay: string }) => {
    fixtureTracker.runtimeCreations.push(args);
    return {
      runtime: {
        mode: 'hopAdviceReadonlyV1',
        storeNamespace: `assistantFixture:hopAdviceReadonlyV1:${args.namespace}`,
        history: async () => Object.assign([], { generation: 0 }),
        reset: async () => ({ generation: 1 }),
        jobs: {
          retainInputUntilRead: true,
          subscribe: () => () => {},
          snapshot: () => fixtureTracker.activity,
          start: () => {}, refresh: () => {}, submit: () => {}, retry: () => {}, markRead: () => {}, forget: () => {}
        }
      },
      setSession: (session: unknown) => fixtureTracker.sessions.push(session),
      pending: () => fixtureTracker.activity.jobs.filter(job => !!job.input?.hopAdvice && !job.turn
        && job.status === 'running' && !job.sendError),
      releaseNext: async () => { fixtureTracker.releaseCalls++; return true; },
      fixtureDoseGL: 3.86
    };
  }
}));

vi.mock('../../src/ui/BrewerChat', () => ({
  BrewerChat: (props: Record<string, any>) => {
    fixtureTracker.chatProps.push(props);
    return null;
  }
}));

import { HopV55FixturePreview } from '../../src/ui/hopV55/FixturePreview';

afterEach(() => {
  cleanup();
  fixtureTracker.events = [];
  fixtureTracker.services = [];
  fixtureTracker.pageProps = undefined;
  fixtureTracker.chatProps = [];
  fixtureTracker.runtimeCreations = [];
  fixtureTracker.sessions = [];
  fixtureTracker.releaseCalls = 0;
  fixtureTracker.activity = { jobs: [], connectionError: '' };
});

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('HopV55FixturePreview lifecycle', () => {
  it('remounts the selected mode with a fresh database service after the old Page unmounts', async () => {
    render(<React.StrictMode><HopV55FixturePreview /></React.StrictMode>);
    expect(await screen.findByTestId('fixture-page-mode')).toHaveTextContent('planning');

    fireEvent.change(screen.getByRole('combobox', { name: 'Parcours de vérification' }), { target: { value: 'unknown' } });
    await waitFor(() => expect(screen.getByTestId('fixture-page-mode')).toHaveTextContent('unknown'));

    expect(fixtureTracker.events).not.toContain('page-mount:planning:closed');
    expect(fixtureTracker.events).not.toContain('page-mount:unknown:closed');
    const planningUnmount = fixtureTracker.events.lastIndexOf('page-unmount:planning');
    const planningClose = fixtureTracker.events.lastIndexOf('close:planning');
    expect(planningUnmount).toBeGreaterThanOrEqual(0);
    expect(planningClose).toBeGreaterThan(planningUnmount);
    expect(fixtureTracker.events).toContain('page-mount:unknown');
  });

  it('n’active pas le transport simulé sans le paramètre explicite', async () => {
    window.history.replaceState({}, '', '/?fixture=not-assisted');
    render(<HopV55FixturePreview />);
    expect(await screen.findByTestId('fixture-page-mode')).toHaveTextContent('planning');
    expect(screen.queryByText('Réponse assistée simulée')).not.toBeInTheDocument();
    expect(fixtureTracker.runtimeCreations).toHaveLength(0);
    expect(fixtureTracker.pageProps?.onOpenAssistedCompanion).toBeUndefined();
  });

  it('ouvre le compagnon existant sur un geste de Page et ne transmet que le champ source du scope', async () => {
    window.history.replaceState({}, '', '/?fixture=isolated-qa&assistantFixture=1&assistantDelay=manual');
    fixtureTracker.activity = { jobs: [{ input: { hopAdvice: { question: 'A' } }, status: 'running' }], connectionError: '' };
    render(<HopV55FixturePreview />);
    expect(await screen.findByTestId('fixture-page-mode')).toHaveTextContent('planning');
    expect(screen.getByText('Réponse assistée simulée')).toBeInTheDocument();
    expect(fixtureTracker.runtimeCreations).toEqual([{ namespace: 'isolated-qa-planning', delay: 'manual' }]);

    const open = fixtureTracker.pageProps?.onOpenAssistedCompanion as (session: unknown) => void;
    expect(open).toBeTypeOf('function');
    const createSession = (kind: 'recipe' | 'draft' | 'batch') => ({
      id: `session:${kind}`,
      request: { contextLaunch: { scope: { kind, id: `scope:${kind}` } }, question: `Question ${kind}` },
      context: { recipe: { id: 'recipe-source' }, journal: { id: 'journal-source' }, phase: 'fermentation' },
      label: `Source ${kind}`, onBeforeSend: async () => {}, onAssistedTurn: async () => {}
    });

    act(() => open(createSession('recipe')));
    await waitFor(() => expect(fixtureTracker.chatProps.length).toBeGreaterThan(0));
    let chat = fixtureTracker.chatProps.at(-1)!;
    expect(chat.scope).toEqual({ kind: 'recipe', id: 'scope:recipe' });
    expect(chat).not.toHaveProperty('draft');
    expect(chat).not.toHaveProperty('localJournal');
    expect(chat.assistedAdvice.request.question).toBe('Question recipe');
    expect(screen.getByRole('button', { name: /Libérer la réponse assistée simulée/ })).toBeEnabled();

    act(() => open(createSession('draft')));
    await waitFor(() => expect(fixtureTracker.chatProps.at(-1)?.scope.kind).toBe('draft'));
    chat = fixtureTracker.chatProps.at(-1)!;
    expect(chat.draft).toEqual({ id: 'recipe-source' });
    expect(chat).not.toHaveProperty('localJournal');

    act(() => open(createSession('batch')));
    await waitFor(() => expect(fixtureTracker.chatProps.at(-1)?.scope.kind).toBe('batch'));
    chat = fixtureTracker.chatProps.at(-1)!;
    expect(chat).not.toHaveProperty('draft');
    expect(chat.localJournal).toEqual({ id: 'journal-source' });

    fireEvent.click(screen.getByRole('button', { name: /Libérer la réponse assistée simulée/ }));
    await waitFor(() => expect(fixtureTracker.releaseCalls).toBe(1));
  });
});
