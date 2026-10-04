import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { BrewerContext, BrewerScope, BrewerChatInput } from '../../functions/src/companionTypes';
import { BREWER_HOP_ADVICE_REQUEST_FORMAT, type BrewerHopAdviceRequest } from '../../functions/src/brewerHopAdviceProposal';
import { hopAdviceV1ClientPartitionKey } from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerChatAssistedRuntime } from '../../src/ui/BrewerChat';
import type { HopV55AssistedCompanionSession } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import type { Batch, BrewDayState, Recipe } from '../../src/types';

const hostMocks = vi.hoisted(() => ({
  pageProps: undefined as Record<string, any> | undefined,
  chatProps: [] as Array<Record<string, any>>,
  createServices: vi.fn(),
  closeServices: vi.fn(),
}));

vi.mock('../../src/services/hopV55/runtime', () => ({
  createHopV55Services: (...args: unknown[]) => {
    hostMocks.createServices(...args);
    return { close: hostMocks.closeServices };
  },
}));

vi.mock('../../src/pages/PageShell', () => ({ PageShell: ({ children }: { children?: React.ReactNode }) => children }));
vi.mock('../../src/ui/hopV55/Page', () => ({
  HopV55Page: (props: Record<string, any>) => { hostMocks.pageProps = props; return null; },
}));
vi.mock('../../src/ui/BrewerChat', async () => {
  const ReactModule = await import('react');
  return { BrewerChat: (props: Record<string, any>) => {
    hostMocks.chatProps.push(props);
    return ReactModule.createElement('div', { 'data-testid': 'hop-v55-brewer-chat' });
  } };
});

import { HopV55Host, type HopV55AssistedRuntimeFactoryInput, type HopV55HostAssistedRuntime } from '../../src/ui/hopV55/Host';

afterEach(() => cleanup());
beforeEach(() => {
  hostMocks.pageProps = undefined;
  hostMocks.chatProps = [];
  hostMocks.createServices.mockClear();
  hostMocks.closeServices.mockClear();
});

const ownerKey = 'fixture:hop-v55-host';
const recipe = (id: string): Recipe => ({ id, name: `Recette ${id}` } as Recipe);
const batch = (id: string, sourceRecipe: Recipe): Batch => ({
  id, recipeSnapshot: sourceRecipe, status: 'Fermentation',
} as Batch);

function assistedSession(id: string, question: string, scope: BrewerScope, sessionOwnerKey = ownerKey): HopV55AssistedCompanionSession {
  const request = {
    format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question, sourceReadingReference: `reading:${id}`,
    contextLaunch: { ownerKey: sessionOwnerKey, scope }, readerAnnotations: [], readerScopes: [],
  } as unknown as BrewerHopAdviceRequest;
  const context = {
    recipe: { id: `context-recipe-${id}`, name: `Recette contexte ${id}` },
    batch: { id: `context-batch-${id}` }, journal: { id: `journal-${id}` }, phase: `Phase ${id}`,
  } as unknown as BrewerContext;
  return {
    id, request, context, label: `Contexte ${id}`,
    onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}),
    onAssistedTurn: vi.fn(async () => {}),
  };
}

function assistedRuntime(id: string, sessionOwnerKey: string, scope: BrewerScope,
  options: { storeNamespace?: string; mode?: string } = {}): HopV55HostAssistedRuntime {
  return {
    mode: options.mode ?? 'hopAdviceReadonlyV1',
    storeNamespace: options.storeNamespace ?? hopAdviceV1ClientPartitionKey(sessionOwnerKey, scope),
    history: vi.fn(async () => ({ turns: [], length: 0, generation: 0 })),
    reset: vi.fn(async () => ({ generation: 0 })),
    jobs: {} as BrewerChatAssistedRuntime['jobs'],
    dispose: vi.fn(),
  } as BrewerChatAssistedRuntime;
}

function pageProps() {
  if (!hostMocks.pageProps) throw new Error('La Page V5.5 n’est pas encore montée.');
  return hostMocks.pageProps;
}

function latestChat() {
  const chat = hostMocks.chatProps.at(-1);
  if (!chat) throw new Error('Le compagnon n’est pas encore monté.');
  return chat;
}

describe('HopV55Host — session compagnon assistée', () => {
  it('garde le mode assisté fermé par défaut et laisse le compagnon normal disponible', async () => {
    const activeRecipe = recipe('recipe-active');
    const activeBatch = batch('batch-active', activeRecipe);
    const view = render(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());

    expect(pageProps().onOpenAssistedCompanion).toBeUndefined();
    expect(hostMocks.chatProps).toHaveLength(0);

    view.rerender(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}}
      hopAdviceTransportQualified />);
    expect(pageProps().onOpenAssistedCompanion).toBeUndefined();

    const normalQuestion = 'Question normale conservée exactement ?  ';
    const normalContext = { recipe: { name: 'Contexte normal' }, phase: 'Test normal' } as BrewerContext;
    act(() => pageProps().onOpenCompanion(normalQuestion, normalContext));

    expect(latestChat()).toMatchObject({
      scope: { kind: 'batch', id: 'batch-active' },
      label: 'Contexte normal',
      initialQuestion: normalQuestion,
      initialOpen: true,
      hideLauncher: true,
    });
    expect(latestChat().assistedAdvice).toBeUndefined();
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();
  });

  it('conserve la session A exacte lorsque le Host bascule sur la recette et le brassin B', async () => {
    const recipeA = recipe('recipe-A');
    const batchA = batch('batch-A', recipeA);
    const scopeA: BrewerScope = { kind: 'batch', id: 'batch-A' };
    const exactQuestion = '  Quand employer ce houblon avec cette levure ?\nSans modifier le programme.  ';
    const sessionA = assistedSession('session-A', exactQuestion, scopeA);
    const createdRuntimes: HopV55HostAssistedRuntime[] = [];
    const createRuntime = vi.fn((input: HopV55AssistedRuntimeFactoryInput) => {
      const runtime = assistedRuntime(`runtime-${createdRuntimes.length + 1}`, input.ownerKey, input.scope);
      createdRuntimes.push(runtime);
      return runtime;
    });
    const view = render(<HopV55Host ownerKey={ownerKey} recipe={recipeA} batch={batchA} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());

    act(() => pageProps().onOpenAssistedCompanion(sessionA));
    const opened = latestChat();
    const runtimeA = createdRuntimes[0];
    expect(createRuntime).toHaveBeenCalledTimes(1);
    expect(createRuntime).toHaveBeenCalledWith({ ownerKey, scope: scopeA });
    expect(opened.scope).toBe(sessionA.request.contextLaunch.scope);
    expect(opened.scope).toEqual(scopeA);
    expect(opened.assistedAdvice.id).toBe(sessionA.id);
    expect(opened.assistedAdvice.request).toBe(sessionA.request);
    expect(opened.assistedAdvice.request.question).toBe(exactQuestion);
    expect(opened.assistedAdvice.onBeforeSend).toBe(sessionA.onBeforeSend);
    expect(opened.assistedAdvice.onAssistedTurn).toBe(sessionA.onAssistedTurn);
    expect(opened.assistedRuntime).toBe(runtimeA);
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();
    expect(opened.draft).toBe(sessionA.context.recipe);
    expect(opened.localJournal).toBe(sessionA.context.journal);
    expect(opened.phase).toBe(sessionA.context.phase);
    expect(opened.label).toBe(sessionA.label);

    const recipeB = recipe('recipe-B');
    const batchB = batch('batch-B', recipeB);
    view.rerender(<HopV55Host ownerKey={ownerKey} recipe={recipeB} batch={batchB} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());

    const stillOpened = latestChat();
    expect(stillOpened.scope).toBe(sessionA.request.contextLaunch.scope);
    expect(stillOpened.scope).not.toEqual({ kind: 'batch', id: 'batch-B' });
    expect(stillOpened.assistedAdvice.onBeforeSend).toBe(sessionA.onBeforeSend);
    expect(stillOpened.assistedAdvice.onAssistedTurn).toBe(sessionA.onAssistedTurn);
    expect(stillOpened.assistedAdvice.request.question).toBe(exactQuestion);
    expect(stillOpened.assistedRuntime).toBe(runtimeA);
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();

    await stillOpened.assistedAdvice.onBeforeSend({ question: exactQuestion } as BrewerChatInput);
    await stillOpened.assistedAdvice.onAssistedTurn({} as never);
    expect(sessionA.onBeforeSend).toHaveBeenCalledTimes(1);
    expect(sessionA.onBeforeSend).toHaveBeenCalledWith({ question: exactQuestion });
    expect(sessionA.onAssistedTurn).toHaveBeenCalledTimes(1);

    const scopeB: BrewerScope = { kind: 'draft', id: 'future-draft-B' };
    const sessionB = assistedSession('session-B', 'Question exacte de B.', scopeB);
    act(() => pageProps().onOpenAssistedCompanion(sessionB));
    const runtimeB = createdRuntimes[1];
    expect(createRuntime).toHaveBeenCalledTimes(2);
    expect(createRuntime).toHaveBeenLastCalledWith({ ownerKey, scope: scopeB });
    expect(latestChat().scope).toBe(scopeB);
    expect(latestChat().assistedRuntime).toBe(runtimeB);
    expect(runtimeB.storeNamespace).toBe(hopAdviceV1ClientPartitionKey(ownerKey, scopeB));

    const sessionAAgain = assistedSession('session-A-again', 'Nouvelle question sur la même partition A.', scopeA);
    act(() => pageProps().onOpenAssistedCompanion(sessionAAgain));
    expect(createRuntime).toHaveBeenCalledTimes(2);
    expect(latestChat().assistedRuntime).toBe(runtimeA);
  });

  it('refuse un runtime de mauvaise partition, un mauvais mode et un owner différent', async () => {
    const activeRecipe = recipe('recipe-before-revocation');
    const activeBatch = batch('batch-before-revocation', activeRecipe);
    const scopeA: BrewerScope = { kind: 'batch', id: 'batch-before-revocation' };
    const scopeB: BrewerScope = { kind: 'recipe', id: 'recipe-wrong-mode' };
    const wrongNamespace = assistedRuntime('wrong-namespace', ownerKey, scopeA, { storeNamespace: 'foreign:hopAdviceReadonlyV1' });
    const wrongMode = assistedRuntime('wrong-mode', ownerKey, scopeB, { mode: 'ordinary' });
    const createRuntime = vi.fn()
      .mockReturnValueOnce(wrongNamespace)
      .mockReturnValueOnce(wrongMode);
    const view = render(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());

    act(() => pageProps().onOpenAssistedCompanion(assistedSession('bad-namespace', 'Question A.', scopeA)));
    expect(screen.queryByTestId('hop-v55-brewer-chat')).toBeNull();
    expect(wrongNamespace.dispose).toHaveBeenCalledTimes(1);

    act(() => pageProps().onOpenAssistedCompanion(assistedSession('bad-mode', 'Question B.', scopeB)));
    expect(screen.queryByTestId('hop-v55-brewer-chat')).toBeNull();
    expect(wrongMode.dispose).toHaveBeenCalledTimes(1);

    act(() => pageProps().onOpenAssistedCompanion(assistedSession('wrong-owner', 'Question foreign.', scopeA, 'owner-foreign')));
    expect(createRuntime).toHaveBeenCalledTimes(2);
    expect(hostMocks.chatProps).toHaveLength(0);
  });

  it('ne détruit pas le runtime A déjà mis en cache si une factory le réutilise à tort pour B', async () => {
    const sourceRecipe = recipe('recipe-shared-runtime');
    const scopeA: BrewerScope = { kind: 'recipe', id: 'recipe-shared-runtime' };
    const scopeB: BrewerScope = { kind: 'app', id: 'explore-other-source' };
    const runtimeA = assistedRuntime('shared', ownerKey, scopeA);
    const createRuntime = vi.fn().mockReturnValue(runtimeA);
    render(<HopV55Host ownerKey={ownerKey} recipe={sourceRecipe} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());

    act(() => pageProps().onOpenAssistedCompanion(assistedSession('session-A', 'Question A.', scopeA)));
    expect(latestChat().scope).toEqual(scopeA);
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();

    act(() => pageProps().onOpenAssistedCompanion(assistedSession('session-B', 'Question B.', scopeB)));
    expect(createRuntime).toHaveBeenCalledTimes(2);
    expect(latestChat().scope).toEqual(scopeA);
    expect(runtimeA.dispose).not.toHaveBeenCalled();
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();
  });

  it('dispose le cache au retrait du gate et à l’unmount, sans accepter l’ancien callback', async () => {
    const activeRecipe = recipe('recipe-before-revocation');
    const activeBatch = batch('batch-before-revocation', activeRecipe);
    const scope: BrewerScope = { kind: 'batch', id: 'batch-before-revocation' };
    const session = assistedSession('revoked-session', 'Question assistée exacte.', scope);
    const createdRuntimes: HopV55HostAssistedRuntime[] = [];
    const createRuntime = vi.fn((input: HopV55AssistedRuntimeFactoryInput) => {
      const runtime = assistedRuntime(`runtime-${createdRuntimes.length + 1}`, input.ownerKey, input.scope);
      createdRuntimes.push(runtime);
      return runtime;
    });
    const view = render(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(hostMocks.pageProps).toBeDefined());
    const capturedOpen = pageProps().onOpenAssistedCompanion as (value: HopV55AssistedCompanionSession) => void;
    act(() => capturedOpen(session));
    expect(hostMocks.chatProps).toHaveLength(1);
    expect(screen.getByTestId('hop-v55-brewer-chat')).toBeInTheDocument();

    view.rerender(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}}
      hopAdviceTransportQualified={false} createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(pageProps().onOpenAssistedCompanion).toBeUndefined());
    expect(screen.queryByTestId('hop-v55-brewer-chat')).toBeNull();
    await waitFor(() => expect(createdRuntimes[0].dispose).toHaveBeenCalledTimes(1));
    act(() => capturedOpen(session));

    expect(hostMocks.chatProps).toHaveLength(1);
    expect(screen.queryByTestId('hop-v55-brewer-chat')).toBeNull();

    view.rerender(<HopV55Host ownerKey={ownerKey} recipe={activeRecipe} batch={activeBatch} onClose={() => {}}
      hopAdviceTransportQualified createAssistedRuntimeForScope={createRuntime} />);
    await waitFor(() => expect(pageProps().onOpenAssistedCompanion).toBeDefined());
    act(() => pageProps().onOpenAssistedCompanion(assistedSession('runtime-after-reopen', 'Nouvelle question.', scope)));
    expect(createRuntime).toHaveBeenCalledTimes(2);
    const reopenedRuntime = createdRuntimes[1];
    view.unmount();
    await waitFor(() => expect(reopenedRuntime.dispose).toHaveBeenCalledTimes(1));
  });
});
