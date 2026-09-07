import React, { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerChat } from '../../src/ui/BrewerChat';
import { BrewerChat as api } from '../../src/services/brewerChat';
import type { BrewerTurn } from '../../src/services/brewerChat';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { userKey: vi.fn().mockResolvedValue('test-user'), history: vi.fn(), ask: vi.fn() },
  brewerChatError: () => 'Question conservée, réessaie.'
}));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer, onClose }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        {footer}
        <button onClick={onClose}>Fermer le compagnon</button>
      </div>
    ) : null
}));
const turn = (question = 'Question', operationId = 'operation-123456789'): BrewerTurn => ({
  id: 'turn1',
  operationId,
  question,
  createdAt: Date.now(),
  model: 'Gemini-test',
  reviewed: true,
  contextLabel: 'RecetteA · Brassage',
  evidence: [],
  advice: {
    level: 'info',
    summary: 'Mesure avant de corriger.',
    action: 'Refroidis un échantillon.',
    why: 'Le pH varie avec la température.',
    watch: 'Étalonne le pH-mètre.',
    question: 'Quelle valeur lis-tu ?',
    evidenceIds: []
  }
});
const props = { scope: { kind: 'recipe' as const, id: 'REC-A' }, label: 'RecetteA' };
async function open() {
  fireEvent.click(screen.getByRole('button', { name: /Compagnon brasseur/ }));
  await waitFor(() =>
    expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument()
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.history).mockResolvedValue([]);
});
afterEach(cleanup);
describe('Conversation dans la recette / le brassin', () => {
  it('reste discrète et ne charge aucun historique avant ouverture', async () => {
    render(<BrewerChat {...props} />);
    expect(api.history).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    await open();
    expect(screen.getByText('On regarde ça ensemble.')).toBeVisible();
  });
  it('envoie le brouillon actuel, continue la conversation et garde sur action explicite', async () => {
    const keep = vi.fn();
    vi.mocked(api.ask).mockImplementation(async (input) => turn(input.question, input.operationId));
    render(
      <StrictMode>
        <BrewerChat
          {...props}
          scope={{ kind: 'draft', id: 'REC-A' }}
          draft={{ name: 'Brouillon', volumeL: 24 }}
          onKeep={keep}
        />
      </StrictMode>
    );
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mon pH est trop bas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByText('Mesure avant de corriger.');
    expect(api.ask).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: { name: 'Brouillon', volumeL: 24 },
        question: 'Mon pH est trop bas'
      })
    );
    expect(keep).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Garder dans les notes du journal'));
    expect(keep).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('conserve exactement le même identifiant et les mêmes données à la relance', async () => {
    vi.mocked(api.ask)
      .mockRejectedValueOnce(new Error('network'))
      .mockImplementationOnce(async (input) => turn(input.question, input.operationId));
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chauffe bloquée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByRole('alert');
    const first = vi.mocked(api.ask).mock.calls[0][0];
    expect(
      JSON.parse(localStorage.getItem('brewer-chat-pending:test-user:recipe:REC-A')!).operationId
    ).toBe(first.operationId);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la question' }));
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.ask).mock.calls[1][0]).toEqual(first);
    expect(localStorage.getItem('brewer-chat-pending:test-user:recipe:REC-A')).toBeNull();
  });
  it('retrouve après rechargement une réponse déjà enregistrée sans renvoyer la question', async () => {
    const pending = {
      scope: props.scope,
      operationId: 'operation-123456789',
      question: 'Chauffe bloquée'
    };
    localStorage.setItem('brewer-chat-pending:test-user:recipe:REC-A', JSON.stringify(pending));
    vi.mocked(api.history).mockResolvedValue([turn(pending.question, pending.operationId)]);
    render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByText('Chauffe bloquée')).toBeVisible();
    expect(api.ask).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('ne place jamais une réponse tardive dans une autre recette', async () => {
    let resolve!: (value: BrewerTurn) => void;
    vi.mocked(api.ask).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const view = render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'RecetteA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    view.rerender(<BrewerChat scope={{ kind: 'recipe', id: 'REC-B' }} label="RecetteB" />);
    await open();
    await act(async () => resolve(turn('Ancien conseil')));
    expect(screen.queryByText('Ancien conseil')).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('signale un contexte modifié pendant l’analyse et ne prétend pas que le conseil est à jour', async () => {
    let resolve!: (value: BrewerTurn) => void;
    vi.mocked(api.ask).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const view = render(<BrewerChat {...props} draft={{ volumeL: 24 }} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Vérifie mon volume' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    view.rerender(<BrewerChat {...props} draft={{ volumeL: 23 }} />);
    await act(async () => resolve(turn()));
    expect(screen.getByText(/contexte a changé pendant/)).toBeVisible();
  });
});
