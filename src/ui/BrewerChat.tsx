import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  ChevronRight,
  Sparkles,
  Send,
  CheckCheck,
  Calculator,
  ArrowUpRight,
  LoaderCircle
} from 'lucide-react';
import { Sheet } from './Sheet';
import { BrewerChat as api, brewerChatError } from '../services/brewerChat';
import type { BrewerChatInput, BrewerScope, BrewerTurn } from '../services/brewerChat';
import type { BrewerProduct } from '../../functions/src/companionTypes';
import type { BrewerProgress } from '../services/brewerRecovery';
import './brewer-chat.css';

interface Props {
  scope: BrewerScope;
  label: string;
  phase?: string;
  draft?: unknown;
  localJournal?: unknown;
  onKeep?: (text: string) => void;
}
const merge = (a: BrewerTurn[], b: BrewerTurn[]) =>
  [...new Map([...a, ...b].map((t) => [t.id, t])).values()].sort(
    (a, b) => a.createdAt - b.createdAt
  );
const prompts = (kind: string, phase = '') =>
  kind === 'draft' || kind === 'recipe'
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

/** Keying by scope prevents async responses and text drafts leaking into another recipe. */
export function BrewerChat(props: Props) {
  return <ScopedChat key={`${props.scope.kind}:${props.scope.id}`} {...props} />;
}
function ScopedChat({ scope, label, phase, draft, localJournal, onKeep }: Props) {
  const [open, setOpen] = useState(false),
    [turns, setTurns] = useState<BrewerTurn[]>([]),
    [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [more, setMore] = useState(false),
    [kept, setKept] = useState<string[]>([]);
  const [pending, setPending] = useState<BrewerChatInput | null>(null),
    [changed, setChanged] = useState(false);
  const [mode, setMode] = useState<'auto' | 'deep'>('auto'),
    [progress, setProgress] = useState<BrewerProgress>('answering');
  const alive = useRef(true),
    lock = useRef(false),
    storageKey = useRef(''),
    end = useRef<HTMLDivElement>(null),
    context = useRef(''),
    request = useRef<AbortController | null>(null);
  context.current = JSON.stringify([draft, localJournal, phase]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
    };
  }, []);
  const persist = (input: BrewerChatInput | null) => {
    setPending(input);
    if (storageKey.current)
      try {
        input
          ? localStorage.setItem(storageKey.current, JSON.stringify(input))
          : localStorage.removeItem(storageKey.current);
      } catch {
        /* Memory retry remains available. */
      }
  };
  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        storageKey.current = `brewer-chat-pending:${await api.userKey()}:${scope.kind}:${scope.id}`;
        const saved = localStorage.getItem(storageKey.current);
        let recovered: BrewerChatInput | null = null;
        try {
          const parsed = saved ? JSON.parse(saved) : null;
          if (
            parsed?.scope?.kind === scope.kind &&
            parsed?.scope?.id === scope.id &&
            typeof parsed.question === 'string' &&
            typeof parsed.operationId === 'string'
          )
            recovered = parsed;
        } catch {
          /* Ignore malformed device draft. */
        }
        if (recovered && live) {
          setPending(recovered);
          setQuestion(recovered.question);
          setMode(recovered.mode ?? 'auto');
        }
        const history = await api.history(scope);
        if (!live) return;
        setTurns((t) => merge(t, history));
        setMore(history.length === 20);
        if (recovered && history.some((t) => t.operationId === recovered.operationId)) {
          persist(null);
          setQuestion('');
        } else if (recovered && !lock.current) {
          const state = await api.status(recovered);
          if (!live) return;
          if (state.turn) {
            setTurns((t) => merge(t, [state.turn!]));
            persist(null);
            setQuestion('');
          } else if (state.pending) {
            // Rejoin work already running after reload; failed/idle requests keep an explicit retry.
            void requestAnswer(recovered);
          }
        }
      } catch (e) {
        if (live) setError(brewerChatError(e));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [open, scope.kind, scope.id]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [turns.length, busy, open]);
  const requestAnswer = async (input: BrewerChatInput) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setChanged(false);
    const signature = context.current;
    request.current = new AbortController();
    persist(input);
    try {
      const turn = await api.ask(input, {
        signal: request.current.signal,
        onProgress: (value) => {
          if (alive.current) setProgress(value);
        }
      });
      if (!alive.current) return;
      setTurns((t) => merge(t, [turn]));
      persist(null);
      setQuestion('');
      setChanged(context.current !== signature);
    } catch (e) {
      if (alive.current) setError(brewerChatError(e));
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const ask = () => {
    if (!question.trim()) return;
    return requestAnswer(
      pending ?? {
        scope,
        operationId: crypto.randomUUID(),
        question: question.trim(),
        ...(draft ? { draft } : {}),
        ...(localJournal ? { localJournal } : {}),
        phase,
        mode
      }
    );
  };
  const older = async () => {
    setLoading(true);
    setError('');
    try {
      const old = await api.history(scope, turns[0]?.createdAt);
      if (alive.current) {
        setTurns((t) => merge(old, t));
        setMore(old.length === 20);
      }
    } catch (e) {
      if (alive.current) setError(brewerChatError(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  };
  return (
    <>
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
        <span className="brewer-chat-badge">Gemini</span>
        <ChevronRight size={17} />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
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
              <label>
                <input
                  type="checkbox"
                  checked={mode === 'deep'}
                  disabled={busy || !!pending}
                  onChange={(e) => setMode(e.target.checked ? 'deep' : 'auto')}
                />
                <Sparkles size={14} />
                <span>Analyse approfondie</span>
              </label>
              <small>{mode === 'deep' ? 'Pro 3.1 · plus lent' : 'Auto · Pro selon besoin'}</small>
            </div>
            {pending && !busy && (
              <div className="brewer-chat-retry">
                <span>Question conservée</span>
                <button
                  type="button"
                  onClick={() => {
                    persist(null);
                    setError('');
                  }}
                >
                  Modifier la question
                </button>
              </div>
            )}
            <label className="sr-only" htmlFor={`brewer-question-${scope.id}`}>
              Question au compagnon brasseur
            </label>
            <textarea
              id={`brewer-question-${scope.id}`}
              value={question}
              maxLength={3000}
              rows={2}
              placeholder="Décris ce que tu observes…"
              readOnly={busy || !!pending}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy || loading || !question.trim()}
              aria-label={pending ? 'Réessayer la question' : 'Envoyer la question'}
            >
              {busy ? <LoaderCircle className="brewer-chat-spin" size={20} /> : <Send size={20} />}
              <span>{busy ? 'Analyse…' : pending ? 'Réessayer' : 'Envoyer'}</span>
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
        </div>
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
        {!turns.length && !loading && (
          <div className="brewer-chat-welcome">
            <Sparkles size={25} />
            <h3>On regarde ça ensemble.</h3>
            <p>
              Je m’appuie sur ta recette, ton matériel et tes relevés pour t’aider à décider du
              prochain geste.
            </p>
            <div className="brewer-chat-prompts">
              {prompts(scope.kind, phase).map((p) => (
                <button
                  type="button"
                  key={p}
                  disabled={busy || !!pending}
                  onClick={() => setQuestion(p)}
                >
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
          {turns.map((t) => (
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
                <details className="brewer-chat-proof">
                  <summary>
                    <CheckCheck size={15} />
                    {t.reviewed ? 'Conseil relu' : 'Conseil'}
                    {t.evidence.length > 0 ? ' · calculs et sources' : ''}
                  </summary>
                  <p>
                    {t.contextLabel} · {t.model}
                  </p>
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
          ))}
        </div>
        {loading && (
          <p className="brewer-chat-status" role="status">
            Chargement des échanges…
          </p>
        )}
        {busy && (
          <p className="brewer-chat-status" role="status">
            <LoaderCircle className="brewer-chat-spin" size={17} />
            {progress === 'waiting'
              ? 'La réponse précédente se termine. Ta question suivra automatiquement…'
              : progress === 'recovering'
                ? 'Reconnexion au serveur, ta question est conservée…'
                : mode === 'deep'
                  ? 'Analyse approfondie avec Gemini Pro, puis relecture…'
                  : 'Analyse, recherche si nécessaire et relecture…'}
          </p>
        )}
        {changed && (
          <p className="brewer-chat-status" role="status">
            Le contexte a changé pendant l’analyse. Le conseil ci-dessus utilise les données à
            l’envoi ; pose une nouvelle question pour l’actualiser.
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
