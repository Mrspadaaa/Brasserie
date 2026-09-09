import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Send,
  CheckCheck,
  Calculator,
  ArrowUpRight,
  LoaderCircle,
  RotateCcw
} from 'lucide-react';
import { Sheet } from './Sheet';
import { BrewerChat as api, brewerChatError } from '../services/brewerChat';
import type { BrewerChatInput, BrewerScope, BrewerTurn } from '../services/brewerChat';
import type { BrewerMode, BrewerProduct } from '../../functions/src/companionTypes';
import {
  brewerJobs,
  useBrewerJobs,
  sameBrewerScope,
  isBrewerWorking,
  brewerJobStatus,
  type ClientBrewerJob
} from '../services/brewerJobs';
import { BrewerNotificationOption } from './BrewerNotifications';
import { BrewerBudget } from './BrewerBudget';
import './brewer-chat.css';
import { BrewerProposalCard } from './BrewerProposalCard';
import { brewerLauncher } from '../services/brewerLauncher';
import type { BrewerProposal } from '../../functions/src/companionTypes';

interface Props {
  scope: BrewerScope;
  label: string;
  phase?: string;
  draft?: unknown;
  localJournal?: unknown;
  onKeep?: (text: string) => void;
  editableTargets?: BrewerProposal['target'][];
  onDraftApply?: (value: any) => void;
  beforeApply?: () => Promise<boolean>;
  onApplied?: () => void;
  initialOpen?: boolean;
  hideLauncher?: boolean;
  onClose?: () => void;
}
const merge = (a: BrewerTurn[], b: BrewerTurn[]) =>
  [
    ...new Map(
      [
        ...a,
        ...b.map((t) => {
          const previous = a.find((old) => old.id === t.id);
          return previous?.proposal?.status && t.proposal && !t.proposal.status
            ? { ...t, proposal: previous.proposal }
            : t;
        })
      ].map((t) => [t.id, t])
    ).values()
  ].sort((a, b) => a.createdAt - b.createdAt);
const prompts = (kind: string, phase = '') =>
  kind === 'app'
    ? ['Aide-moi sur cet écran', 'Que dois-je vérifier en priorité ?', 'Que puis-je améliorer ?']
    : kind === 'draft' || kind === 'recipe'
    ? [
        'Vérifie ma recette et mon matériel',
        'Quel malt puis-je remplacer ?',
        'Je manque d’eau osmosée'
      ]
    : /ferment|garde|condition|termin/.test(phase)
      ? [
          'La fermentation est très active',
          'Je sens un goût métallique',
          'Le houblon est trop herbeux'
        ]
      : [
          'Mon pH-mètre est en panne',
          'Ma chauffe est bloquée à 1000 W',
          'Je n’atteins pas la consigne'
        ];
const responseModes: Array<{ value: BrewerMode; label: string; description: string }> = [
  { value: 'fast', label: 'Rapide', description: 'Flash pour le conseil · Pro pour le web' },
  { value: 'auto', label: 'Auto', description: 'Le compagnon choisit Pro si nécessaire' },
  { value: 'deep', label: 'Pro 3.1', description: 'Pro pour toute l’analyse · plus de temps' }
];
const modePreference = (): BrewerMode => {
  try {
    const saved = localStorage.getItem('brewer-chat-mode');
    if (responseModes.some((m) => m.value === saved)) return saved as BrewerMode;
  } catch {
    /* Private browsing may disable preference storage. */
  }
  return 'auto';
};

/** Keying by scope prevents async responses and text drafts leaking into another recipe. */
export function BrewerChat(props: Props) {
  return <ScopedChat key={`${props.scope.kind}:${props.scope.id}`} {...props} />;
}
function ScopedChat({
  scope,
  label,
  phase,
  draft: currentDraft,
  localJournal,
  onKeep,
  editableTargets,
  onDraftApply,
  beforeApply,
  onApplied,
  initialOpen = false,
  hideLauncher = false,
  onClose
}: Props) {
  const [savedDraft, setSavedDraft] = useState<unknown>();
  const draft = currentDraft ?? savedDraft;
  const [open, setOpen] = useState(initialOpen),
    [turns, setTurns] = useState<BrewerTurn[]>([]),
    [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [more, setMore] = useState(false),
    [kept, setKept] = useState<string[]>([]);
  const [mode, setMode] = useState<BrewerMode>(modePreference);
  const activity = useBrewerJobs();
  const [confirmReset, setConfirmReset] = useState(false),
    [resetting, setResetting] = useState(false),
    [notice, setNotice] = useState('');
  const [applying, setApplying] = useState(false);
  const draftControl = useRef({ draft, onDraftApply });
  draftControl.current = { draft, onDraftApply };
  const generation = useRef(0),
    epoch = useRef(0),
    resetOperation = useRef('');
  const targets =
    editableTargets ??
    (scope.kind === 'app' ? [] : scope.kind === 'draft'
      ? onDraftApply
        ? (['recipe'] as const)
        : []
      : scope.kind === 'recipe'
        ? (['recipe'] as const)
        : (['batch'] as const));
  const alive = useRef(true),
    lock = useRef(false),
    end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return brewerLauncher.register(scope, () => setOpen(true));
  }, [scope.kind, scope.id]);
  useEffect(() => {
    if (open) return brewerLauncher.dialog();
  }, [open]);
  const jobs = activity.jobs.filter(
    (j) => sameBrewerScope(j.scope, scope) && j.generation === generation.current
  );
  const timeline: Array<{ turn?: BrewerTurn; job?: ClientBrewerJob; at: number }> = [
    ...turns.map((turn) => ({
      turn,
      at: jobs.find((j) => j.operationId === turn.operationId)?.createdAt ?? turn.createdAt
    })),
    ...jobs
      .filter((job) => !turns.some((t) => t.operationId === job.operationId))
      .map((job) => ({ job, at: job.createdAt }))
  ].sort((a, b) => a.at - b.at);
  useEffect(() => {
    alive.current = true;
    void brewerJobs.start();
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    void brewerJobs.refresh();
    let live = true;
    const version = epoch.current;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const history = await api.history(scope);
        if (!live || version !== epoch.current) return;
        const nextGeneration = history.generation ?? 0;
        if (history.draft) setSavedDraft(history.draft);
        const sameGeneration = nextGeneration === generation.current;
        generation.current = nextGeneration;
        brewerJobs.forget(scope, nextGeneration);
        setTurns((t) => (sameGeneration ? merge(t, history) : history));
        setMore(history.length === 20);
        // Move the old single-message outbox into the conversation after upgrading.
        const oldKey =
          'brewer-chat-pending:' + (await api.userKey()) + ':' + scope.kind + ':' + scope.id;
        const old = localStorage.getItem(oldKey);
        if (old && live && version === epoch.current) {
          try {
            const input = JSON.parse(old);
            if (
              sameBrewerScope(input.scope, scope) &&
              (input.generation ?? 0) === nextGeneration &&
              !history.some((t) => t.operationId === input.operationId)
            )
              brewerJobs.submit(input, label);
          } catch {
            /* Invalid legacy outbox. */
          }
          localStorage.removeItem(oldKey);
        }
      } catch (e) {
        if (live && version === epoch.current) setError(brewerChatError(e));
      } finally {
        if (live && version === epoch.current) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [open, scope.kind, scope.id]);
  useEffect(() => {
    const current = activity.jobs.filter(
      (j) => sameBrewerScope(j.scope, scope) && j.generation === generation.current
    );
    const received = current.flatMap((j) => (j.turn ? [j.turn] : []));
    if (received.length) setTurns((t) => merge(t, received));
    if (open && document.visibilityState !== 'hidden')
      current
        .filter(
          (j) =>
            j.status === 'error' ||
            (j.status === 'done' && (j.turn || turns.some((t) => t.operationId === j.operationId)))
        )
        .forEach((j) => brewerJobs.markRead(j));
  }, [activity.jobs, open, turns.length]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [turns.length, jobs.length, open]);
  const ask = () => {
    if (question.trim().length < 2 || loading || resetting || applying) return;
    brewerJobs.submit(
      {
        scope,
        operationId: crypto.randomUUID(),
        question: question.trim(),
        ...(draft ? { draft } : {}),
        ...(localJournal ? { localJournal } : {}),
        phase,
        mode,
        generation: generation.current,
        editableTargets: [...targets]
      },
      label
    );
    setQuestion('');
    setError('');
  };
  const older = async () => {
    const version = epoch.current;
    setLoading(true);
    setError('');
    try {
      const old = await api.history(scope, turns[0]?.createdAt);
      if (alive.current && version === epoch.current) {
        const nextGeneration = old.generation ?? 0;
        const sameGeneration = nextGeneration === generation.current;
        setTurns((t) => (sameGeneration ? merge(old, t) : old));
        generation.current = nextGeneration;
        setMore(old.length === 20);
      }
    } catch (e) {
      if (alive.current && version === epoch.current) setError(brewerChatError(e));
    } finally {
      if (alive.current && version === epoch.current) setLoading(false);
    }
  };
  const reset = async () => {
    if (resetting) return;
    epoch.current++;
    lock.current = true;
    setResetting(true);
    setLoading(false);
    setError('');
    resetOperation.current ||= crypto.randomUUID();
    try {
      const result = await api.reset(scope, generation.current, resetOperation.current);
      if (!alive.current) return;
      generation.current = result.generation;
      setTurns([]);
      setQuestion('');
      brewerJobs.forget(scope, result.generation);
      setMore(false);
      setKept([]);
      setConfirmReset(false);
      resetOperation.current = '';
      setNotice('Conversation réinitialisée.');
    } catch (e) {
      if (alive.current) setError(brewerChatError(e));
    } finally {
      lock.current = false;
      if (alive.current) setResetting(false);
    }
  };
  const decide = async (turn: BrewerTurn, ids: string[], decision: 'apply' | 'dismiss') => {
    if (resetting || lock.current) return;
    lock.current = true;
    const version = epoch.current;
    const signature = JSON.stringify(draftControl.current.draft);
    setApplying(true);
    try {
      if (decision === 'apply' && beforeApply && !(await beforeApply()))
        throw Error('Synchronise le journal avant de valider ces modifications.');
      const result = await api.apply(scope, turn.id, ids, decision, draft);
      if (!alive.current || epoch.current !== version) return;
      if (decision === 'apply' && scope.kind === 'draft') {
        if (JSON.stringify(draftControl.current.draft) !== signature)
          throw Error(
            'Le brouillon a changé pendant la validation. Aucun champ n’a été écrasé ; demande une proposition actualisée.'
          );
        draftControl.current.onDraftApply?.(result.value);
      }
      setTurns((t) => merge(t, [result.turn]));
      if (decision === 'apply') await onApplied?.();
    } catch (e) {
      throw new Error((e as { code?: string })?.code ? brewerChatError(e) : (e as Error).message);
    } finally {
      if (epoch.current === version) lock.current = false;
      if (alive.current) setApplying(false);
    }
  };
  return (
    <>
      {!hideLauncher && (
        <button type="button" className="brewer-chat-launch" onClick={() => setOpen(true)}>
          <span className="brewer-chat-mark">
            <MessageCircle size={19} />
          </span>
          <span>
            <strong>Compagnon brasseur</strong>
            <small>
              {phase && /ferment|garde/.test(phase)
                ? 'Fermentation, dégustation, imprévus'
                : 'Une question, un imprévu ?'}
            </small>
          </span>
          <span className="brewer-chat-badge">
            {jobs.some(isBrewerWorking)
              ? 'En cours'
              : jobs.some((j) => !j.readAt && j.status === 'done')
                ? 'Réponse prête'
                : 'Gemini'}
          </span>
          <ChevronRight size={17} />
        </button>
      )}
      <Sheet
        open={open}
        onClose={() => {
          if (!applying) {
            setOpen(false);
            onClose?.();
          }
        }}
        dismissible={!applying}
        title="Compagnon brasseur"
        subtitle={label}
        className="brewer-chat-sheet"
        footer={
          <form
            className="brewer-chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <div className="brewer-chat-mode">
              <fieldset
                disabled={applying || resetting}
                aria-describedby={`brewer-mode-${scope.id}`}
              >
                <legend className="sr-only">Mode de réponse</legend>
                {responseModes.map((option) => (
                  <label key={option.value} data-mode={option.value}>
                    <input
                      type="radio"
                      name={`brewer-mode-${scope.id}`}
                      value={option.value}
                      checked={mode === option.value}
                      onChange={() => {
                        setMode(option.value);
                        try {
                          localStorage.setItem('brewer-chat-mode', option.value);
                        } catch {
                          /* Optional preference. */
                        }
                      }}
                    />
                    <span>
                      {option.value === 'fast' ? (
                        <Zap size={14} />
                      ) : option.value === 'deep' ? (
                        <Sparkles size={14} />
                      ) : null}
                      {option.label}
                    </span>
                  </label>
                ))}
              </fieldset>
              <small id={`brewer-mode-${scope.id}`}>
                {responseModes.find((option) => option.value === mode)!.description}
              </small>
            </div>
            <label className="sr-only" htmlFor={`brewer-question-${scope.id}`}>
              Question au compagnon brasseur
            </label>
            <textarea
              id={`brewer-question-${scope.id}`}
              value={question}
              maxLength={3000}
              rows={2}
              placeholder="Décris ce que tu observes…"
              readOnly={applying || resetting}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              disabled={
                applying ||
                loading ||
                resetting ||
                question.trim().length < 2 ||
                (scope.kind === 'draft' && !draft)
              }
              aria-label="Envoyer la question"
            >
              <Send size={20} />
              <span>Envoyer</span>
            </button>
          </form>
        }
      >
        <div className="brewer-chat-context">
          <span className="brewer-chat-dot" />
          <span>
            {scope.kind === 'draft' ? 'Brouillon en cours' : phase || 'Recette'} · contexte
            actualisé à chaque question
          </span>
          <button
            type="button"
            className="brewer-chat-reset"
            aria-label="Mes conversations"
            title="Mes conversations"
            disabled={resetting || applying}
            onClick={() => { setOpen(false); onClose?.(); window.dispatchEvent(new Event('brewer-inbox-open')); }}
          >
            <MessageCircle size={17} />
          </button>
          <button
            type="button"
            className="brewer-chat-reset"
            aria-label="Réinitialiser la conversation"
            title="Réinitialiser la conversation"
            disabled={resetting || applying || loading}
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <BrewerNotificationOption />
        <BrewerBudget />
        {scope.kind === 'draft' && !currentDraft && (
          <p className="brewer-chat-status">
            Cette vue reprend le dernier brouillon analysé. Rouvre l’assistant recette pour valider
            des champs ou envoyer tes dernières modifications.
          </p>
        )}
        {confirmReset && (
          <div
            className="brewer-reset-confirm"
            role="group"
            aria-label="Confirmer la remise à zéro"
          >
            <strong>Repartir à zéro ?</strong>
            <p>
              Les échanges et la réponse en cours seront effacés. Ta recette et les notes déjà
              conservées restent intactes.
            </p>
            <div>
              <button type="button" disabled={resetting} onClick={() => setConfirmReset(false)}>
                Annuler
              </button>
              <button type="button" disabled={resetting} onClick={() => void reset()}>
                {resetting ? 'Remise à zéro…' : 'Effacer les échanges'}
              </button>
            </div>
          </div>
        )}
        {notice && (
          <p className="brewer-chat-notice" role="status">
            {notice}
          </p>
        )}
        {more && (
          <button
            type="button"
            className="brewer-chat-older"
            disabled={loading}
            onClick={() => void older()}
          >
            Échanges précédents
          </button>
        )}
        {!timeline.length && !loading && (
          <div className="brewer-chat-welcome">
            <Sparkles size={25} />
            <h3>On regarde ça ensemble.</h3>
            <p>
              Je m’appuie sur ta recette, ton matériel et tes relevés pour t’aider à décider du
              prochain geste.
            </p>
            <div className="brewer-chat-prompts">
              {prompts(scope.kind, phase).map((p) => (
                <button type="button" key={p} disabled={resetting} onClick={() => setQuestion(p)}>
                  {p}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
            <small>
              Les simulations restent des propositions. Les relevés et les gestes se consignent dans
              le journal.
            </small>
          </div>
        )}
        <div className="brewer-chat-history" aria-label="Conversation avec le compagnon">
          {timeline.map(({ turn: t, job }) =>
            !t && job ? (
              <BrewerWorkCard
                key={job.operationId}
                job={job}
                onRetry={() => {
                  if (job.sendError) brewerJobs.retry(job);
                  else if (scope.kind === 'draft' && !draft) {
                    brewerJobs.markRead(job);
                    brewerJobs.retrySaved(job);
                  } else {
                    brewerJobs.markRead(job);
                    brewerJobs.submit(
                      {
                        ...(job.input ?? {}),
                        scope,
                        operationId: crypto.randomUUID(),
                        question: job.question,
                        ...(draft ? { draft } : {}),
                        ...(localJournal ? { localJournal } : {}),
                        phase,
                        mode,
                        generation: generation.current,
                        editableTargets: [...targets]
                      },
                      label
                    );
                  }
                }}
                onEdit={() => {
                  setQuestion(job!.question);
                  document.getElementById('brewer-question-' + scope.id)?.focus();
                }}
              />
            ) : t ? (
              <article key={t.id} className="brewer-chat-turn">
                <p className="brewer-chat-question">{t.question}</p>
                <div className={`brewer-chat-answer is-${t.advice.level}`}>
                  <div className="brewer-chat-answer-meta">
                    <span>
                      <Sparkles size={14} /> Compagnon
                    </span>
                    <time dateTime={new Date(t.createdAt).toISOString()}>
                      {new Date(t.createdAt).toLocaleString('fr-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <h3>{t.advice.summary}</h3>
                  <p className="brewer-chat-action">{t.advice.action}</p>
                  {t.advice.why && <p>{t.advice.why}</p>}
                  {t.advice.watch && (
                    <p className="brewer-chat-watch">
                      <strong>Prochain contrôle</strong>
                      {t.advice.watch}
                    </p>
                  )}
                  {t.advice.question && <p className="brewer-chat-followup">{t.advice.question}</p>}
                  <SupplierCards products={t.evidence.flatMap((e) => e.products ?? [])} />
                  {t.proposal && (
                    <BrewerProposalCard
                      proposal={t.proposal}
                      draft={scope.kind === 'draft'}
                      disabled={applying || resetting || (scope.kind === 'draft' && !onDraftApply)}
                      onDecide={(ids, decision) => decide(t, ids, decision)}
                    />
                  )}
                  <details className="brewer-chat-proof">
                    <summary>
                      <CheckCheck size={15} />
                      {t.reviewed ? 'Conseil relu' : 'Conseil'}
                      {t.evidence.length > 0 ? ' · calculs et sources' : ''}
                    </summary>
                    <p>
                      {t.contextLabel} · {t.model}
                    </p>
                    {t.mode === 'fast' && <p>Mode rapide · calculs et relecture conservés.</p>}
                    {t.reviewModel && (
                      <p>
                        Relecture : {t.reviewModel}
                        {t.reviewReason === 'requested'
                          ? ' · analyse approfondie demandée'
                          : t.reviewReason === 'sensitive'
                            ? ' · situation sensible'
                            : t.reviewReason === 'research'
                              ? ' · recherche web avec Pro'
                              : t.reviewReason === 'complexity'
                                ? ' · analyse approfondie choisie par le compagnon'
                                : t.reviewReason === 'repair'
                                  ? ' · vérification renforcée'
                                  : ' · rapide'}
                        .
                      </p>
                    )}
                    <p>Seconde relecture IA. Les estimations restent à confirmer à la cuve.</p>
                    {t.evidence.map((e) => (
                      <div key={e.id}>
                        <strong>
                          <Calculator size={14} />
                          {e.label}
                        </strong>
                        {e.model && <small>Recherche : {e.model}</small>}
                        {e.facts.map((f, i) => (
                          <p key={i}>{f}</p>
                        ))}
                        {e.limits.map((l, i) => (
                          <small key={i}>{l}</small>
                        ))}
                        {e.sources
                          ?.filter((s) => /^https:\/\//.test(s.url))
                          .map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
                              {s.title}
                              <ArrowUpRight size={12} />
                            </a>
                          ))}
                      </div>
                    ))}
                  </details>
                  {onKeep && (
                    <button
                      className="brewer-chat-keep"
                      type="button"
                      disabled={kept.includes(t.id)}
                      onClick={() => {
                        onKeep(`Conseil IA — ${t.question}\n${t.advice.action}\n${t.advice.watch}`);
                        setKept((k) => [...k, t.id]);
                      }}
                    >
                      {kept.includes(t.id)
                        ? 'Ajouté aux notes du journal'
                        : 'Garder dans les notes du journal'}
                    </button>
                  )}
                </div>
              </article>
            ) : null
          )}
        </div>
        {loading && (
          <p className="brewer-chat-status" role="status">
            Chargement des échanges…
          </p>
        )}
        {activity.connectionError && (
          <p className="brewer-chat-error" role="status">
            {activity.connectionError}{' '}
            <button type="button" onClick={() => void brewerJobs.refresh()}>
              Actualiser
            </button>
          </p>
        )}
        {!hideLauncher &&
          jobs.some(
            (j) =>
              j.status === 'done' &&
              j.contextSignature &&
              j.contextSignature !== JSON.stringify([draft, localJournal, phase])
          ) && (
            <p className="brewer-chat-status">
              Le contexte a changé pendant ou depuis l’analyse. Pose une nouvelle question pour
              tenir compte de tes derniers changements.
            </p>
          )}
        {error && (
          <p role="alert" className="brewer-chat-error">
            {error}
          </p>
        )}
        <div ref={end} />
      </Sheet>
    </>
  );
}

function BrewerWorkCard({
  job,
  onRetry,
  onEdit
}: {
  job: ClientBrewerJob;
  onRetry: () => void;
  onEdit: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const failed = job.status === 'error' || !!job.sendError;
  const seconds = Math.max(0, Math.floor(((job.finishedAt ?? now) - job.createdAt) / 1000));
  return (
    <article className="brewer-chat-turn">
      <p className="brewer-chat-question">{job.question}</p>
      <div className={`brewer-work-card${failed ? ' is-error' : ''}`}>
        <div role="status" className="brewer-work-heading">
          {!failed && isBrewerWorking(job) && (
            <LoaderCircle size={17} className="brewer-chat-spin" />
          )}
          <strong>{brewerJobStatus(job)}</strong>
          <time aria-hidden="true">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </time>
        </div>
        {failed ? (
          <>
            <p role="alert">{job.sendError || job.error?.message}</p>
            {job.error?.code === 'gemini-spend-cap' && (
              <a href="https://ai.studio/spend" target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-touch items-center text-ebc-straw underline underline-offset-2">
                Ouvrir les dépenses Google
              </a>
            )}
            <div className="brewer-work-actions">
              {(job.sendError || job.error?.retryable) && (
                <button type="button" onClick={onRetry}>
                  {job.sendError ? 'Réessayer l’envoi' : 'Relancer l’analyse'}
                </button>
              )}
              <button type="button" onClick={onEdit}>
                Reformuler
              </button>
            </div>
          </>
        ) : (
          <>
            {job.detail && <p>{job.detail}</p>}
            <small>
              {job.model?.includes('pro')
                ? 'Gemini 3.1 Pro'
                : job.model
                  ? 'Gemini Flash'
                  : job.sending
                    ? 'En attente de l’accusé de réception'
                    : 'Enregistrée sur le serveur'}
              {job.attempt > 1 ? ' · reprise' : ''}
            </small>
            {!job.sending && (
              <p className="brewer-work-away">
                Tu peux continuer ailleurs. La réponse restera dans ce fil.
              </p>
            )}
            {job.status === 'running' && now - job.updatedAt > 90000 && (
              <p>
                Cette étape prend du temps. Le serveur poursuit l’analyse et signalera tout échec
                ici.
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function SupplierCards({ products }: { products: BrewerProduct[] }) {
  // Prefer useful small packs and an available variant, with one card per product URL.
  const sorted = [...products]
    .filter((p) => /^https:\/\//.test(p.url))
    .sort(
      (a, b) =>
        Number(b.availability === 'in_stock') - Number(a.availability === 'in_stock') ||
        Number(/25\s*kg/i.test(a.name)) - Number(/25\s*kg/i.test(b.name)) ||
        Number(/gramm/i.test(a.name)) - Number(/gramm/i.test(b.name))
    );
  const cards = [...new Map(sorted.reverse().map((p) => [p.url, p])).values()]
    .reverse()
    .slice(0, 4);
  if (!cards.length) return null;
  return (
    <div className="brewer-chat-suppliers" aria-label="Produits chez les fournisseurs suisses">
      <strong>Où trouver tes ingrédients</strong>
      {cards.map((p) => {
        const stale = Date.now() - p.checkedAt > 86400000;
        const status = stale ? 'unknown' : p.availability;
        return (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brewer-chat-product"
          >
            <span className="brewer-chat-product-name">
              <strong>{p.name}</strong>
              <ArrowUpRight size={17} />
            </span>
            <span className="brewer-chat-product-supplier">{p.supplier}</span>
            <span className={`brewer-chat-stock is-${status}`}>
              {status === 'in_stock'
                ? 'Annoncé en stock'
                : status === 'out_of_stock'
                  ? 'Indisponible'
                  : stale
                    ? 'Stock à revérifier'
                    : 'Stock non confirmé'}
            </span>
            <small>
              Page consultée le{' '}
              {new Date(p.checkedAt).toLocaleString('fr-CH', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </small>
          </a>
        );
      })}
      <small>
        Stock annoncé par le vendeur pour ce conditionnement, à confirmer à la commande.
      </small>
    </div>
  );
}
