import React, { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerChat } from '../../src/ui/BrewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import { BrewerChat as api } from '../../src/services/brewerChat';
import type { BrewerTurn } from '../../src/services/brewerChat';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: {
    userKey: vi.fn().mockResolvedValue('test-user'),
    history: vi.fn(),
    submit: vi.fn(),
    activity: vi.fn(),
    markRead: vi.fn(),
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
  brewerJobs.stop();
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.status).mockResolvedValue({});
  vi.mocked(api.activity).mockImplementation(async () => brewerJobs.snapshot().jobs);
  vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.reset).mockResolvedValue({ generation: 1 });
});
afterEach(() => {
  cleanup();
  brewerJobs.stop();
});
describe('Conversation dans la recette / le brassin', () => {
  it('ne transforme pas une réponse récupérée en erreur si le premier envoi expire ensuite', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((_, no) => {
          reject = no;
        })
    );
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Réponse récupérée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    const current = brewerJobs.snapshot().jobs[0];
    await act(async () =>
      brewerJobs.merge([
        {
          ...current,
          id: 'f'.repeat(64),
          status: 'done',
          sending: false,
          turn: turn(current.question, current.operationId),
          updatedAt: Date.now() + 1000
        }
      ])
    );
    await screen.findByText('Mesure avant de corriger.');
    await act(async () => reject(new Error('HTTP timeout')));
    expect(brewerJobs.snapshot().jobs[0].sendError).toBeUndefined();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('ignore un ancien accusé de réception arrivé après la réponse', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Un accusé retardé' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    const original = { ...brewerJobs.snapshot().jobs[0], id: 'f'.repeat(64), sending: false };
    await act(async () =>
      brewerJobs.merge([
        {
          ...original,
          status: 'done',
          turn: turn(original.question, original.operationId),
          updatedAt: Date.now() + 1000
        }
      ])
    );
    await act(async () => resolve({ job: original }));
    expect(brewerJobs.snapshot().jobs[0].status).toBe('done');
  });
  it('place les questions dans le fil immédiatement et laisse saisir la suivante sans attendre Gemini', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Trouve un nom' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    expect(screen.getByText('Trouve un nom')).toBeVisible();
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    expect(screen.queryByText('On regarde ça ensemble.')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Et si je remplace' } });
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(1));
    await act(async () =>
      resolve({ turn: turn('Trouve un nom', vi.mocked(api.submit).mock.calls[0][0].operationId) })
    );
    await screen.findByText('Mesure avant de corriger.');
    expect(screen.getByRole('textbox')).toHaveValue('Et si je remplace');
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(2));
  });
  it('suit une réponse après démontage de la page et la retrouve dans le bon fil', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const view = render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Une question en arrière-plan' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    view.unmount();
    await act(async () =>
      resolve({
        turn: turn(
          'Une question en arrière-plan',
          vi.mocked(api.submit).mock.calls[0][0].operationId
        )
      })
    );
    expect(brewerJobs.snapshot().jobs[0].status).toBe('done');
    render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByText('Mesure avant de corriger.')).toBeVisible();
  });
  it('affiche le modèle et la vraie étape, puis une erreur serveur explicite attachée à la question', async () => {
    const job: any = {
      id: 'a'.repeat(64),
      operationId: 'operation-server-1234',
      scope: props.scope,
      generation: 0,
      question: 'Vérifie ma recette',
      label: 'RecetteA',
      status: 'running',
      stage: 'review',
      detail: 'Vérification indépendante du conseil',
      model: 'gemini-3.1-pro-preview',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempt: 1
    };
    vi.mocked(api.activity).mockResolvedValue([job]);
    render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByText('Relecture du conseil')).toBeVisible();
    expect(screen.getByText('Gemini 3.1 Pro')).toBeVisible();
    await act(async () =>
      brewerJobs.merge([
        {
          ...job,
          status: 'error',
          error: {
            code: 'review-rejected',
            message: 'Réponse écartée à la relecture. Aucun champ changé.',
            retryable: true
          }
        }
      ])
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Réponse écartée à la relecture.');
    expect(screen.getByRole('button', { name: 'Relancer l’analyse' })).toBeEnabled();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('explique le plafond Google avec un accès aux dépenses, sans relancer automatiquement', async () => {
    vi.mocked(api.activity).mockResolvedValue([{
      id: 'a'.repeat(64),
      operationId: 'operation-spend-cap-1234',
      scope: props.scope,
      generation: 0,
      question: 'Vérifie ma recette et mon matériel',
      label: 'RecetteA',
      status: 'error',
      stage: 'error',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempt: 1,
      error: {
        code: 'gemini-spend-cap',
        message: 'Google bloque les appels : le plafond de dépenses Gemini du projet est atteint.',
        retryable: true
      }
    }]);
    render(<BrewerChat {...props} />);
    await open();
    expect(await screen.findByRole('alert')).toHaveTextContent('plafond de dépenses Gemini');
    expect(screen.getByRole('link', { name: 'Ouvrir les dépenses Google' })).toHaveAttribute('href', 'https://ai.studio/spend');
    expect(screen.getByRole('button', { name: 'Relancer l’analyse' })).toBeEnabled();
    expect(api.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('demande confirmation pour vider le chat et ignore une réponse arrivée après le reset', async () => {
    let complete!: (t: { turn: BrewerTurn }) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          complete = r;
        })
    );
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ma question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser la conversation' }));
    expect(api.reset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Effacer les échanges' }));
    await screen.findByText('Conversation réinitialisée.');
    await act(async () => {
      complete({ turn: turn('Ancienne réponse') });
    });
    expect(screen.queryByText('Ancienne réponse')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    vi.mocked(api.submit).mockImplementation(async (input) => ({
      turn: turn(input.question, input.operationId)
    }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nouvelle question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.submit).mock.calls[1][0].generation).toBe(1);
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
    vi.mocked(api.submit).mockImplementation(async (input) => ({
      turn: turn(input.question, input.operationId)
    }));
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
    expect(api.submit).toHaveBeenCalledWith(
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
    vi.mocked(api.submit)
      .mockRejectedValueOnce(new Error('network'))
      .mockImplementationOnce(async (input) => ({ turn: turn(input.question, input.operationId) }));
    render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chauffe bloquée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByRole('alert');
    const first = vi.mocked(api.submit).mock.calls[0][0];
    expect(JSON.parse(localStorage.getItem('brewer-jobs:test-user')!)[0].operationId).toBe(
      first.operationId
    );
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer l’envoi' }));
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.submit).mock.calls[1][0]).toEqual(first);
    expect(JSON.parse(localStorage.getItem('brewer-jobs:test-user')!)[0].input).toBeUndefined();
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
    expect(api.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('permet de forcer le modèle approfondi, avec le choix conservé pour une reprise', async () => {
    vi.mocked(api.submit).mockRejectedValueOnce(new Error('network'));
    render(<BrewerChat {...props} />);
    await open();
    const mode = screen.getByRole('radio', { name: 'Pro 3.1' });
    expect(mode).not.toBeChecked();
    fireEvent.click(mode);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Compare mes malts' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByRole('alert');
    expect(vi.mocked(api.submit).mock.calls[0][0].mode).toBe('deep');
    expect(mode).toBeEnabled();
    expect(JSON.parse(localStorage.getItem('brewer-jobs:test-user')!)[0].input.mode).toBe('deep');
  });
  it('mémorise le mode rapide entre recettes et le transmet sans bloquer la saisie', async () => {
    vi.mocked(api.submit).mockImplementation(() => new Promise(() => {}));
    const mounted = render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Rapide' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Propose un nom' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    expect(vi.mocked(api.submit).mock.calls[0][0].mode).toBe('fast');
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'Pro 3.1' })).toBeEnabled();
    mounted.unmount();
    render(<BrewerChat {...props} scope={{ kind: 'recipe', id: 'REC-B' }} />);
    await open();
    expect(screen.getByRole('radio', { name: 'Rapide' })).toBeChecked();
  });
  it('ignore une préférence de mode inconnue', async () => {
    localStorage.setItem('brewer-chat-mode', 'obsolete');
    render(<BrewerChat {...props} />);
    await open();
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
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
    vi.mocked(api.submit).mockResolvedValue({ turn: turn(pending.question, pending.operationId) });
    render(<BrewerChat {...props} />);
    await open();
    await screen.findByText('Mesure avant de corriger.');
    expect(vi.mocked(api.submit).mock.calls[0][0]).toEqual(pending);
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
    let resolve!: (value: { turn: BrewerTurn }) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const view = render(<BrewerChat {...props} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'RecetteA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    view.rerender(<BrewerChat scope={{ kind: 'recipe', id: 'REC-B' }} label="RecetteB" />);
    await open();
    await act(async () => resolve({ turn: turn('Ancien conseil') }));
    expect(screen.queryByText('Ancien conseil')).toBeNull();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
  it('signale un contexte modifié pendant l’analyse et ne prétend pas que le conseil est à jour', async () => {
    let resolve!: (value: BrewerTurn) => void;
    vi.mocked(api.submit).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const view = render(<BrewerChat {...props} draft={{ volumeL: 24 }} />);
    await open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Vérifie mon volume' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalled());
    view.rerender(<BrewerChat {...props} draft={{ volumeL: 23 }} />);
    await act(async () => resolve({ turn: turn() }));
    expect(screen.getByText(/contexte a changé pendant/)).toBeVisible();
  });
});
