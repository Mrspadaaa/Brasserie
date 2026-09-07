import React, { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerChat } from '../../src/ui/BrewerChat';
import { BrewerChat as api } from '../../src/services/brewerChat';
import type { BrewerTurn } from '../../src/services/brewerChat';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: {
    userKey: vi.fn().mockResolvedValue('test-user'),
    history: vi.fn(),
    ask: vi.fn(),
    status: vi.fn(),
    reset: vi.fn(),
    apply: vi.fn()
  },
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
  vi.mocked(api.status).mockResolvedValue({});
  vi.mocked(api.reset).mockResolvedValue({ generation: 1 });
});
afterEach(cleanup);
describe('Conversation dans la recette / le brassin', () => {
  it('demande confirmation pour vider le chat et ignore une réponse arrivée après le reset', async () => {
    let complete!: (t: BrewerTurn) => void;
    vi.mocked(api.ask).mockImplementation(
      () =>
        new Promise((r) => {
          complete = r;
        })
    );
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ma question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser la conversation' }));
    expect(api.reset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Effacer les échanges' }));
    await screen.findByText('Conversation réinitialisée.');
    await act(async () => {
      complete(turn('Ancienne réponse'));
    });
    expect(screen.queryByText('Ancienne réponse')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    vi.mocked(api.ask).mockResolvedValue(turn('Nouvelle question'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nouvelle question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.ask).mock.calls[1][0].generation).toBe(1);
  });
  it('ne remplit aucun champ avant validation et transmet seulement les cases cochées', async () => {
    const apply = vi.fn(),
      t = turn();
    t.proposal = {
      target: 'recipe',
      title: 'Allonger l’ébullition',
      basis: 'test',
      changes: [
        {
          id: 'C1',
          path: 'boilMin',
          label: 'Ébullition',
          before: 60,
          value: 70,
          reason: 'Durée souhaitée',
          unit: 'min'
        },
        {
          id: 'C2',
          path: 'name',
          label: 'Nom',
          before: 'Pale',
          value: 'Pale v2',
          reason: 'Nouveau nom'
        }
      ]
    };
    vi.mocked(api.history).mockResolvedValue([t]);
    vi.mocked(api.apply).mockResolvedValue({
      turn: { ...t, proposal: { ...t.proposal, status: 'applied', acceptedIds: ['C1'] } },
      value: { name: 'Pale', boilMin: 70 }
    });
    render(
      <BrewerChat
        {...props}
        scope={{ kind: 'draft', id: 'REC-A' }}
        draft={{ name: 'Pale', boilMin: 60 }}
        onDraftApply={apply}
      />
    );
    await open();
    expect(screen.getByText('60 min')).toBeVisible();
    expect(screen.getByText('70 min')).toBeVisible();
    expect(api.apply).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Nom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider 1 modification' }));
    await screen.findByText('Champs appliqués au brouillon');
    expect(api.apply).toHaveBeenCalledWith({ kind: 'draft', id: 'REC-A' }, t.id, ['C1'], 'apply', {
      name: 'Pale',
      boilMin: 60
    });
    expect(apply).toHaveBeenCalledWith({ name: 'Pale', boilMin: 70 });
  });
  it('écarte une proposition sans appliquer de champ', async () => {
    const t = turn();
    t.proposal = {
      target: 'recipe',
      title: 'Ajuster',
      basis: 'test',
      changes: [
        { id: 'C1', path: 'boilMin', label: 'Ébullition', before: 60, value: 70, reason: 'Test' }
      ]
    };
    vi.mocked(api.history).mockResolvedValue([t]);
    vi.mocked(api.apply).mockResolvedValue({
      turn: { ...t, proposal: { ...t.proposal, status: 'dismissed' } }
    });
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    await screen.findByText('Proposition écartée');
    expect(api.apply).toHaveBeenCalledWith(props.scope, t.id, [], 'dismiss', undefined);
  });
  it('ne remplace pas un brouillon changé pendant la validation réseau', async () => {
    const apply = vi.fn(),
      t = turn();
    t.proposal = {
      target: 'recipe',
      title: 'Ajuster',
      basis: 'test',
      changes: [
        { id: 'C1', path: 'boilMin', label: 'Ébullition', before: 60, value: 70, reason: 'Test' }
      ]
    };
    vi.mocked(api.history).mockResolvedValue([t]);
    let finish!: (v: any) => void;
    vi.mocked(api.apply).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const base = { ...props, scope: { kind: 'draft' as const, id: 'REC-A' }, onDraftApply: apply };
    const view = render(<BrewerChat {...base} draft={{ boilMin: 60 }} />);
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Valider 1 modification' }));
    view.rerender(<BrewerChat {...base} draft={{ boilMin: 80 }} />);
    await act(async () =>
      finish({
        turn: { ...t, proposal: { ...t.proposal, status: 'applied' } },
        value: { boilMin: 70 }
      })
    );
    expect(apply).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Aucun champ n’a été écrasé');
  });
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
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal), onProgress: expect.any(Function) })
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
  it('permet de forcer le modèle approfondi, avec le choix conservé pour une reprise', async () => {
    vi.mocked(api.ask).mockRejectedValueOnce(new Error('network'));
    render(<BrewerChat {...props} />);
    await open();
    const mode = screen.getByRole('checkbox', { name: /Analyse approfondie/ });
    expect(mode).not.toBeChecked();
    fireEvent.click(mode);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Compare mes malts' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByRole('alert');
    expect(vi.mocked(api.ask).mock.calls[0][0].mode).toBe('deep');
    expect(mode).toBeDisabled();
    expect(
      JSON.parse(localStorage.getItem('brewer-chat-pending:test-user:recipe:REC-A')!).mode
    ).toBe('deep');
  });
  it('rejoint automatiquement la question qui tourne encore après rechargement', async () => {
    const pending = {
      scope: props.scope,
      operationId: 'operation-running-12345',
      question: 'Un substitut en Suisse ?',
      mode: 'deep'
    };
    localStorage.setItem('brewer-chat-pending:test-user:recipe:REC-A', JSON.stringify(pending));
    vi.mocked(api.status).mockResolvedValue({ pending: { ...pending, until: Date.now() + 60000 } });
    vi.mocked(api.ask).mockResolvedValue(turn(pending.question, pending.operationId));
    render(<BrewerChat {...props} />);
    await open();
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.ask).mock.calls[0][0]).toEqual(pending);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('affiche les vrais liens d’achat et ne présente pas un ancien stock comme actuel', async () => {
    const t = turn();
    t.evidence = [
      {
        id: 'E1',
        name: 'find_brewing_suppliers',
        label: 'Suisse',
        facts: [],
        limits: [],
        data: {},
        products: [
          {
            name: 'Maris Otter, Kg',
            supplier: 'Brau- und Rauchshop',
            url: 'https://www.brauundrauchshop.ch/maris-otter',
            availability: 'in_stock',
            availabilityText: 'En stock',
            checkedAt: Date.now()
          },
          {
            name: 'Röstgerste, Kg',
            supplier: 'Brau- und Rauchshop',
            url: 'https://www.brauundrauchshop.ch/r%C3%B6stgerste',
            availability: 'in_stock',
            availabilityText: 'En stock',
            checkedAt: Date.now() - 172800000
          }
        ]
      }
    ];
    vi.mocked(api.history).mockResolvedValue([t]);
    render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByRole('link', { name: /Maris Otter/ })).toHaveAttribute(
      'href',
      'https://www.brauundrauchshop.ch/maris-otter'
    );
    expect(screen.getByText('Annoncé en stock')).toBeVisible();
    expect(screen.getByText('Stock à revérifier')).toBeVisible();
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
