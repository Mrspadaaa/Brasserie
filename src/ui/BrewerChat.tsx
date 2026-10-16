import { Textarea } from './Input';
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
import type { BrewerChatInput, BrewerHistory, BrewerScope, BrewerTurn } from '../services/brewerChat';
import type { HopAdviceV1ClientEntryV3, HopAdviceV1WizardClientEntryV1 } from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerMode, BrewerProduct } from '../../functions/src/companionTypes';
import { stableBrewerHopAdviceJson } from '../../functions/src/brewerHopAdviceProposal';
import {
  brewerJobs,
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
import type { HopV55AssistedCompanionSession, HopV55SemanticCompanionRuntimeV3, HopV55SemanticCompanionRuntimeWizardV1,
  HopV55SemanticCompanionSessionV3, HopV55SemanticCompanionSessionWizardV1 } from './hopV55/assistedAdviceUiContracts';
import type { HopV55AssistedAdviceRecordV2, HopV55AssistedAdviceWizardRecordV1 } from '../services/hopV55/assistedSemanticAdviceArchiveV2';
import type { HopV55SemanticJobSnapshotV3, HopV55SemanticSubmissionResultV3,
  HopV55SemanticWizardSubmissionResultV1 } from '../services/hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticAdoptionHeadV1, HopV55SemanticAdoptionPlanV1,
  HopV55SemanticAdoptionReceiptV1 } from '../services/hopV55/assistedSemanticAdviceAdoptionV6';
import type { HopV55SemanticJobActivityV3 } from '../services/brewerJobs';
import { hopAdviceSemanticV3ClientPartitionKey, hopAdviceWizardClientPartitionKey } from '../services/brewerHopAdviceRuntime';

export type BrewerChatAssistedAdvice = Pick<HopV55AssistedCompanionSession,
  'id' | 'request' | 'onBeforeSend' | 'onAssistedTurn'>;

export interface BrewerChatJobActivity {
  jobs: ClientBrewerJob[];
  connectionError: string;
}

export interface BrewerChatAssistedJobStore {
  /** True only when a DONE input remains retained until the UI attaches its exact receipt. */
  retainInputUntilRead?: boolean;
  subscribe(listener: () => void): () => void;
  snapshot(): BrewerChatJobActivity;
  start(): void | Promise<void>;
  refresh(): void | Promise<void>;
  submit(input: BrewerChatInput, label: string): void;
  retry(job: ClientBrewerJob): void;
  markRead(job: ClientBrewerJob): void;
  forget(scope: BrewerScope, generation: number): void;
}

/** Dedicated frontend façade; its backend and local recovery namespace are supplied by the host. */
export interface BrewerChatAssistedRuntime {
  mode: 'hopAdviceReadonlyV1';
  /** Supplied by the façade's mode-aware key factory; must be isolated from ordinary chat storage. */
  storeNamespace: string;
  history(scope: BrewerScope, before?: number): Promise<BrewerHistory>;
  reset(scope: BrewerScope, generation: number, operationId: string): Promise<{ generation: number }>;
  jobs: BrewerChatAssistedJobStore;
}

export type BrewerChatSemanticRuntimeV3 = HopV55SemanticCompanionRuntimeV3;

interface AssistedTicket {
  requestKey: string;
  input: BrewerChatInput;
  label: string;
  onBeforeSend: BrewerChatAssistedAdvice['onBeforeSend'];
  onAssistedTurn: BrewerChatAssistedAdvice['onAssistedTurn'];
  prepared: boolean;
  submitted: boolean;
}

const sameJson = (left: unknown, right: unknown) => stableBrewerHopAdviceJson(left) === stableBrewerHopAdviceJson(right);
const assistedSessionKey = (session?: Pick<HopV55AssistedCompanionSession, 'id' | 'request'>) =>
  session ? stableBrewerHopAdviceJson({ id: session.id, request: session.request }) : '';
const sameScopeExactly = (left: BrewerScope, right: BrewerScope) =>
  left.kind === right.kind && left.id === right.id;
const sameBrewerChatInput = (left: BrewerChatInput, right: BrewerChatInput) =>
  sameJson(left, right);
const isRecoverableAssistedJob = (job: ClientBrewerJob, scope: BrewerScope,
  request: BrewerChatAssistedAdvice['request'] | undefined, generation: number) => {
  if (!request || job.unsupportedReadOnly || !job.input || job.turn || job.status === 'done' || job.status === 'cancelled') return false;
  return job.operationId === job.input.operationId && job.question === request.question
    && job.input.question === request.question && job.generation === generation
    && job.input.generation === generation && sameScopeExactly(job.scope, scope)
    && sameScopeExactly(job.input.scope, scope) && sameJson(job.input.hopAdvice, request);
};
const isRecoverableAssistedReceipt = (job: ClientBrewerJob, scope: BrewerScope,
  request: BrewerChatAssistedAdvice['request'] | undefined) => {
  const turn = job.turn;
  const envelope = turn?.hopAdviceProposal;
  return !!request && !job.unsupportedReadOnly && !!job.input?.hopAdvice && !!turn && !!envelope && job.status === 'done' && !job.readAt
    && job.operationId === job.input.operationId && turn.operationId === job.operationId
    && job.question === job.input.question && turn.question === job.input.question
    && job.generation === job.input.generation
    && sameScopeExactly(job.scope, scope) && sameScopeExactly(job.input.scope, scope)
    && sameJson(job.input.hopAdvice, request) && sameJson(envelope.request, request)
    && Array.isArray(turn.evidence);
};
const isUnsupportedAssistedJob = (job: ClientBrewerJob, scope: BrewerScope,
  request: BrewerChatAssistedAdvice['request'] | undefined) => !!request && !!job.unsupportedReadOnly
  && !!job.input?.hopAdvice && sameScopeExactly(job.scope, scope) && sameScopeExactly(job.input.scope, scope)
  && sameJson(job.input.hopAdvice, request);
const jsonText = (value: unknown) => {
  try { return JSON.stringify(value, null, 2) ?? String(value); }
  catch { return String(value); }
};
/** The fixture transport reserves this namespace; host partitions use the canonical JSON partition key. */
function isLocalAssistedFixture(runtime?: BrewerChatAssistedRuntime): boolean {
  return runtime?.mode === 'hopAdviceReadonlyV1'
    && typeof runtime.storeNamespace === 'string'
    && runtime.storeNamespace.startsWith('assistantFixture:hopAdviceReadonlyV1:');
}
function localAssistedFixtureStatus(job: ClientBrewerJob): string {
  if (job.sendError || job.status === 'error') return 'Simulation locale interrompue';
  if (job.status === 'done') return 'Réponse simulée prête';
  if (job.sending || job.status === 'running') return 'Réponse simulée en attente';
  if (job.status === 'cancelled') return 'Simulation locale annulée';
  return 'Question conservée dans la fixture locale';
}
const EMPTY_ACTIVITY: BrewerChatJobActivity = { jobs: [], connectionError: '' };
const emptySnapshot = () => EMPTY_ACTIVITY;
const emptySubscribe = () => () => {};

interface CommonProps {
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
  initialQuestion?: string;
  suggestedPrompts?: Array<{ label: string; question: string }>;
  hideLauncher?: boolean;
  onClose?: () => void;
}

interface LegacyProps extends CommonProps {
  protocol?: 'hopAdviceReadonlyV1';
  assistedAdvice?: BrewerChatAssistedAdvice;
  assistedRuntime?: BrewerChatAssistedRuntime;
  semanticSession?: never;
  semanticRuntime?: never;
  wizardSession?: never;
  wizardRuntime?: never;
}

interface SemanticProps extends CommonProps {
  protocol: 'hopAdviceRequest3';
  semanticSession: HopV55SemanticCompanionSessionV3;
  semanticRuntime?: BrewerChatSemanticRuntimeV3;
  assistedAdvice?: never;
  assistedRuntime?: never;
  wizardSession?: never;
  wizardRuntime?: never;
}

/** Unsaved recipe-creator draft: its own session, runtime and local protocol; the wire stays Request3. */
interface WizardSemanticProps extends CommonProps {
  protocol: 'hopAdviceWizardRequest3V1';
  wizardSession: HopV55SemanticCompanionSessionWizardV1;
  wizardRuntime?: HopV55SemanticCompanionRuntimeWizardV1;
  semanticSession?: never;
  semanticRuntime?: never;
  assistedAdvice?: never;
  assistedRuntime?: never;
}
type Props = LegacyProps | SemanticProps | WizardSemanticProps;

/** One companion surface, two explicit lanes; no lane is cast into the other. */
type SemanticLaneV1 =
  | { kind: 'classic'; session: HopV55SemanticCompanionSessionV3; runtime?: BrewerChatSemanticRuntimeV3 }
  | { kind: 'wizard'; session: HopV55SemanticCompanionSessionWizardV1; runtime?: HopV55SemanticCompanionRuntimeWizardV1 };
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
  { value: 'fast', label: 'Rapide', description: 'Conseil concis, vérifié avec Flash' },
  { value: 'auto', label: 'Auto', description: 'Flash adapte ses recherches et vérifie le conseil' },
  { value: 'deep', label: 'Approfondi', description: 'Réflexion plus poussée · budget plus élevé' }
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
  if (props.protocol === 'hopAdviceRequest3') {
    return <SemanticCompanionChat key={`${props.scope.kind}:${props.scope.id}:${props.semanticSession.id}`}
      scope={props.scope} label={props.label} phase={props.phase} draft={props.draft} localJournal={props.localJournal}
      initialOpen={props.initialOpen} onClose={props.onClose}
      lane={{ kind: 'classic', session: props.semanticSession, runtime: props.semanticRuntime }} />;
  }
  if (props.protocol === 'hopAdviceWizardRequest3V1') {
    return <SemanticCompanionChat key={`${props.scope.kind}:${props.scope.id}:${props.wizardSession.id}`}
      scope={props.scope} label={props.label} phase={props.phase}
      initialOpen={props.initialOpen} onClose={props.onClose}
      lane={{ kind: 'wizard', session: props.wizardSession, runtime: props.wizardRuntime }} />;
  }
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
  initialQuestion = '',
  suggestedPrompts,
  assistedAdvice,
  assistedRuntime,
  hideLauncher = false,
  onClose
}: LegacyProps) {
  const [savedDraft, setSavedDraft] = useState<unknown>();
  const draft = currentDraft ?? savedDraft;
  const [open, setOpen] = useState(initialOpen),
    [turns, setTurns] = useState<BrewerTurn[]>([]),
    [question, setQuestion] = useState(assistedAdvice?.request.question ?? initialQuestion);
  const assistedRequestKey = assistedSessionKey(assistedAdvice);
  const hasAssistedSession = !!assistedAdvice;
  const finance = scope.kind === 'app' && scope.id === 'finances';
  const questions = suggestedPrompts ?? (finance ? [
    'Explique mes principaux postes de dépenses et les variations.',
    'Quels paiements dois-je anticiper pour mes prochains brassins ?',
    'Aide-moi à préparer un investissement de matériel.',
    'Quelles opérations ou valeurs d’amortissement faut-il vérifier ?'
  ] : prompts(scope.kind, phase)).map((text) => ({ label: text, question: text }));
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [more, setMore] = useState(false),
    [kept, setKept] = useState<string[]>([]);
  const [mode, setMode] = useState<BrewerMode>(modePreference);
  const assistedRuntimeReady = !!assistedAdvice && assistedRuntime?.mode === 'hopAdviceReadonlyV1'
    && typeof assistedRuntime.storeNamespace === 'string'
    && assistedRuntime.storeNamespace.includes('hopAdviceReadonlyV1');
  const localAssistedFixture = !!assistedAdvice && isLocalAssistedFixture(assistedRuntime);
  const activeJobsStore = assistedAdvice
    ? (assistedRuntimeReady ? assistedRuntime.jobs : undefined)
    : brewerJobs;
  const assistedReceiptsRetained = hasAssistedSession && assistedRuntimeReady
    && assistedRuntime?.jobs.retainInputUntilRead === true;
  const activity = useSyncExternalStore(
    activeJobsStore?.subscribe ?? emptySubscribe,
    activeJobsStore?.snapshot ?? emptySnapshot,
    activeJobsStore?.snapshot ?? emptySnapshot
  );
  const [confirmReset, setConfirmReset] = useState(false),
    [resetting, setResetting] = useState(false),
    [notice, setNotice] = useState('');
  const [applying, setApplying] = useState(false);
  const [assistedSubmitting, setAssistedSubmitting] = useState(false);
  const [completedAssistedKeys, setCompletedAssistedKeys] = useState<Set<string>>(() => new Set());
  const draftControl = useRef({ draft, onDraftApply });
  draftControl.current = { draft, onDraftApply };
  const assistedTicketsByKey = useRef(new Map<string, AssistedTicket>());
  const assistedTicketsByOperation = useRef(new Map<string, AssistedTicket>());
  const deliveredAssistedTurns = useRef(new Set<string>());
  const attachedAssistedReceipts = useRef(new Set<string>());
  const assistedRequestKeyRef = useRef(assistedRequestKey);
  const assistedAdviceRef = useRef(assistedAdvice);
  assistedAdviceRef.current = assistedAdvice;
  const assistedSubmitLock = useRef(false);
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
    if (assistedRequestKeyRef.current === assistedRequestKey) return;
    assistedRequestKeyRef.current = assistedRequestKey;
    epoch.current++;
    if (assistedAdvice) {
      setQuestion(assistedAdvice.request.question);
      setError('');
    }
  }, [assistedAdvice, assistedRequestKey]);
  useEffect(() => {
    return brewerLauncher.register(scope, () => setOpen(true));
  }, [scope.kind, scope.id]);
  useEffect(() => {
    if (open) return brewerLauncher.dialog();
  }, [open]);
  const jobs = activity.jobs.filter((j) => {
    if (!sameBrewerScope(j.scope, scope)) return false;
    if (!hasAssistedSession) return j.generation === generation.current;
    const ticket = assistedTicketsByOperation.current.get(j.operationId);
    if (ticket && ticket.requestKey === assistedRequestKey) return j.generation === generation.current;
    const unsupported = isUnsupportedAssistedJob(j, scope, assistedAdvice?.request);
    const receiptRecovery = assistedReceiptsRetained && isRecoverableAssistedReceipt(j, scope, assistedAdvice?.request)
      && !attachedAssistedReceipts.current.has(`operation:${j.operationId}`);
    if (ticket) return !!receiptRecovery;
    return unsupported || receiptRecovery || isRecoverableAssistedJob(j, scope, assistedAdvice?.request, generation.current);
  });
  const visibleTurns = assistedAdvice
    ? turns.filter((turn) => {
        const ticket = assistedTicketsByOperation.current.get(turn.operationId);
        return ticket ? ticket.requestKey === assistedRequestKey : !turn.hopAdviceProposal;
      })
    : turns;
  const timeline: Array<{ turn?: BrewerTurn; job?: ClientBrewerJob; at: number }> = [
    ...visibleTurns.map((turn) => ({
      turn,
      at: jobs.find((j) => j.operationId === turn.operationId)?.createdAt ?? turn.createdAt
    })),
    ...jobs
      .filter((job) => !visibleTurns.some((t) => t.operationId === job.operationId))
      .map((job) => ({ job, at: job.createdAt }))
  ].sort((a, b) => a.at - b.at);
  useEffect(() => {
    alive.current = true;
    if (activeJobsStore) void activeJobsStore.start();
    return () => {
      alive.current = false;
    };
  }, [activeJobsStore]);
  useEffect(() => {
    if (!open) return;
    if (assistedAdvice && !assistedRuntimeReady) {
      setLoading(false);
      setError('Le transport dédié à la lecture assistée est indisponible. Aucune question ne sera envoyée au compagnon standard.');
      return;
    }
    if (!activeJobsStore) {
      setLoading(false);
      return;
    }
    void activeJobsStore.refresh();
    let live = true;
    const version = epoch.current;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const history = hasAssistedSession
          ? await assistedRuntime!.history(scope)
          : await api.history(scope);
        if (!live || version !== epoch.current) return;
        const nextGeneration = history.generation ?? 0;
        if (history.draft) setSavedDraft(history.draft);
        const sameGeneration = nextGeneration === generation.current;
        generation.current = nextGeneration;
        activeJobsStore.forget(scope, nextGeneration);
        setTurns((t) => (sameGeneration ? merge(t, history) : history));
        setMore(history.length === 20);
        if (!hasAssistedSession) {
          // Migrate only the ordinary chat's legacy outbox. The assisted facade owns recovery separately.
          const oldKey =
            'brewer-chat-pending:' + (await api.userKey()) + ':' + scope.kind + ':' + scope.id;
          const old = localStorage.getItem(oldKey);
          if (old && live && version === epoch.current) {
            try {
              const input = JSON.parse(old);
              if (
                sameBrewerScope(input.scope, scope) &&
                !input.hopAdvice &&
                (input.generation ?? 0) === nextGeneration &&
                !history.some((t) => t.operationId === input.operationId)
              )
                activeJobsStore.submit(input, label);
            } catch {
              /* Invalid legacy outbox. */
            }
            localStorage.removeItem(oldKey);
          }
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
  }, [activeJobsStore, assistedRequestKey, assistedRuntime, assistedRuntimeReady, hasAssistedSession, label, open, scope.kind, scope.id]);
  useEffect(() => {
    const current = activity.jobs.filter((job) => {
      if (!sameBrewerScope(job.scope, scope)) return false;
      if (!hasAssistedSession) return job.generation === generation.current;
      const ticket = assistedTicketsByOperation.current.get(job.operationId);
      return job.generation === generation.current || !!ticket
        || assistedReceiptsRetained && isRecoverableAssistedReceipt(job, scope, assistedAdviceRef.current?.request);
    });
    const received = current.flatMap((job) => {
      const ticket = assistedTicketsByOperation.current.get(job.operationId);
      if (ticket && assistedAdviceRef.current && ticket.requestKey !== assistedRequestKey) return [];
      if (assistedAdviceRef.current && !ticket && (job.input?.hopAdvice || job.turn?.hopAdviceProposal)) return [];
      if (assistedAdviceRef.current && ticket && job.turn
        && !attachedAssistedReceipts.current.has(`operation:${job.operationId}`)) return [];
      return job.turn ? [job.turn] : [];
    });
    if (received.length) setTurns((t) => merge(t, received));
    for (const job of current) {
      const ticket = assistedTicketsByOperation.current.get(job.operationId);
      const turn = job.turn;
      if (!ticket || !turn || job.status !== 'done' || !ticket.submitted) continue;
      const envelope = turn.hopAdviceProposal;
      if (!envelope || turn.operationId !== ticket.input.operationId || job.operationId !== ticket.input.operationId
        || turn.question !== ticket.input.question || job.question !== ticket.input.question
        || job.generation !== ticket.input.generation || !sameScopeExactly(job.scope, ticket.input.scope)
        || (job.input && !sameBrewerChatInput(job.input, ticket.input))
        || !sameJson(envelope.request, ticket.input.hopAdvice)) continue;
      const operationKey = `operation:${turn.operationId}`;
      const turnKey = `turn:${turn.id}`;
      if (deliveredAssistedTurns.current.has(operationKey) || deliveredAssistedTurns.current.has(turnKey)) continue;
      deliveredAssistedTurns.current.add(operationKey);
      deliveredAssistedTurns.current.add(turnKey);
      const inputSnapshot = structuredClone(ticket.input);
      const turnSnapshot = structuredClone(turn);
      const envelopeSnapshot = turnSnapshot.hopAdviceProposal;
      if (!envelopeSnapshot) continue;
      void Promise.resolve(ticket.onAssistedTurn({
        input: inputSnapshot,
        job: { ...structuredClone(job), input: inputSnapshot, turn: turnSnapshot },
        turn: turnSnapshot,
        envelope: envelopeSnapshot,
        evidence: turnSnapshot.evidence
      })).then(() => {
        attachedAssistedReceipts.current.add(operationKey);
        activeJobsStore?.markRead({ ...job, input: inputSnapshot, turn: turnSnapshot });
        if (ticket.requestKey === assistedSessionKey(assistedAdviceRef.current)) {
          setTurns((rows) => merge(rows, [turnSnapshot]));
        }
      }).catch((error) => {
        deliveredAssistedTurns.current.delete(operationKey);
        deliveredAssistedTurns.current.delete(turnKey);
        const currentKey = assistedSessionKey(assistedAdviceRef.current);
        if (currentKey === ticket.requestKey) setError(brewerChatError(error));
      });
    }
    if (hasAssistedSession) return;
    if (open && document.visibilityState !== 'hidden')
      current
        .filter(
          (j) =>
            !j.unsupportedReadOnly && (j.status === 'error' ||
            (j.status === 'done' && (j.turn || turns.some((t) => t.operationId === j.operationId)))
            )
        )
        .forEach((j) => activeJobsStore?.markRead(j));
  }, [activity.jobs, activeJobsStore, assistedRequestKey, hasAssistedSession, open, turns.length]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [turns.length, jobs.length, open]);
  const ask = async () => {
    if (loading || resetting || applying || assistedSubmitting || assistedSubmitLock.current) return;
    if (assistedAdvice) {
      if (!assistedRuntimeReady || !activeJobsStore) {
        setError('Le transport dédié à la lecture assistée est indisponible. Aucune question ne sera envoyée au compagnon standard.');
        return;
      }
      const request = assistedAdvice.request;
      if (!sameScopeExactly(scope, request.contextLaunch.scope)) {
        setError('La lecture assistée est liée à une autre portée. Reprends-la depuis sa source dans l’atelier.');
        return;
      }
      if (question !== request.question || request.question.length < 2) {
        setError('Cette question ne correspond plus à la lecture. Reprends une nouvelle lecture dans l’atelier avant de l’envoyer.');
        return;
      }
      if (completedAssistedKeys.has(assistedRequestKey)) return;
      let ticket = assistedTicketsByKey.current.get(assistedRequestKey);
      if (!ticket) {
        const requestSnapshot = structuredClone(request);
        const input: BrewerChatInput = {
          scope: structuredClone(scope),
          operationId: crypto.randomUUID(),
          question: requestSnapshot.question,
          mode,
          generation: generation.current,
          hopAdvice: requestSnapshot
        };
        ticket = {
          requestKey: assistedRequestKey,
          input,
          label,
          onBeforeSend: assistedAdvice.onBeforeSend,
          onAssistedTurn: assistedAdvice.onAssistedTurn,
          prepared: false,
          submitted: false
        };
        assistedTicketsByKey.current.set(assistedRequestKey, ticket);
        assistedTicketsByOperation.current.set(input.operationId, ticket);
      }
      if (ticket.submitted) return;
      assistedSubmitLock.current = true;
      setAssistedSubmitting(true);
      setError('');
      try {
        if (!ticket.prepared) {
          await ticket.onBeforeSend(ticket.input);
          ticket.prepared = true;
        }
        // The ticket and request stay frozen even if the parent displays another reading meanwhile.
        activeJobsStore.submit(ticket.input, ticket.label);
        ticket.submitted = true;
        setCompletedAssistedKeys((keys) => new Set(keys).add(ticket!.requestKey));
      } catch (error) {
        const currentKey = assistedSessionKey(assistedAdviceRef.current);
        if (currentKey === ticket.requestKey) {
          setError((error as Error)?.message || 'La lecture n’a pas pu être préparée. Réessaie sans modifier la question.');
        }
      } finally {
        assistedSubmitLock.current = false;
        setAssistedSubmitting(false);
      }
      return;
    }
    if (question.trim().length < 2) return;
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
    if (hasAssistedSession && !assistedRuntimeReady) {
      setError('Le transport dédié à l’historique assisté est indisponible.');
      return;
    }
    const version = epoch.current;
    setLoading(true);
    setError('');
    try {
      const old = hasAssistedSession
        ? await assistedRuntime!.history(scope, turns[0]?.createdAt)
        : await api.history(scope, turns[0]?.createdAt);
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
    if (hasAssistedSession && !assistedRuntimeReady) {
      setError('Le transport dédié à la réinitialisation assistée est indisponible.');
      return;
    }
    epoch.current++;
    lock.current = true;
    setResetting(true);
    setLoading(false);
    setError('');
    resetOperation.current ||= crypto.randomUUID();
    try {
      const result = hasAssistedSession
        ? await assistedRuntime!.reset(scope, generation.current, resetOperation.current)
        : await api.reset(scope, generation.current, resetOperation.current);
      if (!alive.current) return;
      generation.current = result.generation;
      setTurns([]);
      setQuestion('');
      activeJobsStore?.forget(scope, result.generation);
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
    if (hasAssistedSession) throw new Error('Les propositions de lecture assistée ne passent pas par les décisions du compagnon standard.');
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
  const retryAssistedJob = async (job: ClientBrewerJob) => {
    if (job.unsupportedReadOnly || !hasAssistedSession || !assistedAdvice || !assistedRuntimeReady || !activeJobsStore
      || resetting || applying || assistedSubmitLock.current) return;
    let ticket = assistedTicketsByOperation.current.get(job.operationId);
    const exactJob = ticket ? { ...job, input: structuredClone(ticket.input) } : job;
    if (!isRecoverableAssistedJob(exactJob, scope, assistedAdvice.request, generation.current)) return;
    if (!ticket) {
      ticket = {
        requestKey: assistedRequestKey,
        input: structuredClone(job.input!),
        label,
        onBeforeSend: assistedAdvice.onBeforeSend,
        onAssistedTurn: assistedAdvice.onAssistedTurn,
        prepared: false,
        submitted: false
      };
      assistedTicketsByKey.current.set(assistedRequestKey, ticket);
      assistedTicketsByOperation.current.set(job.operationId, ticket);
    }
    if (ticket.requestKey !== assistedRequestKey) return;
    assistedSubmitLock.current = true;
    setAssistedSubmitting(true);
    setError('');
    try {
      // Explicit retry rechecks the existing operation ticket; it never captures a new dated ticket.
      await ticket.onBeforeSend(ticket.input);
      ticket.prepared = true;
      activeJobsStore.retry({ ...job, input: structuredClone(ticket.input) });
      ticket.submitted = true;
      setCompletedAssistedKeys((keys) => new Set(keys).add(ticket!.requestKey));
    } catch (error) {
      const currentKey = assistedSessionKey(assistedAdviceRef.current);
      if (currentKey === ticket.requestKey) {
        setError((error as Error)?.message || 'La reprise de cette question n’a pas été vérifiée. Tu peux réessayer sans changer la lecture.');
      }
    } finally {
      assistedSubmitLock.current = false;
      setAssistedSubmitting(false);
    }
  };
  const attachAssistedReceipt = async (job: ClientBrewerJob) => {
    if (job.unsupportedReadOnly || !hasAssistedSession || !assistedAdvice || !assistedRuntimeReady || !activeJobsStore
      || !assistedReceiptsRetained || resetting || applying || assistedSubmitLock.current
      || !isRecoverableAssistedReceipt(job, scope, assistedAdvice.request)) return;
    let ticket = assistedTicketsByOperation.current.get(job.operationId);
    if (!ticket) {
      ticket = {
        requestKey: assistedRequestKey,
        input: structuredClone(job.input!),
        label,
        onBeforeSend: assistedAdvice.onBeforeSend,
        onAssistedTurn: assistedAdvice.onAssistedTurn,
        prepared: true,
        submitted: true
      };
      assistedTicketsByOperation.current.set(job.operationId, ticket);
      assistedTicketsByKey.current.set(ticket.requestKey, ticket);
    }
    if (!sameBrewerChatInput(job.input!, ticket.input)) return;
    if (ticket.submitted !== true) return;
    const turn = job.turn!;
    const operationKey = `operation:${turn.operationId}`;
    const turnKey = `turn:${turn.id}`;
    if (deliveredAssistedTurns.current.has(operationKey) || deliveredAssistedTurns.current.has(turnKey)) return;
    const inputSnapshot = structuredClone(ticket.input);
    const turnSnapshot = structuredClone(turn);
    const envelopeSnapshot = turnSnapshot.hopAdviceProposal;
    if (!envelopeSnapshot) return;
    const jobSnapshot = { ...structuredClone(job), input: inputSnapshot, turn: turnSnapshot };
    deliveredAssistedTurns.current.add(operationKey);
    deliveredAssistedTurns.current.add(turnKey);
    assistedSubmitLock.current = true;
    setAssistedSubmitting(true);
    setError('');
    try {
      // This is attachment of an existing DONE receipt, never a new send or a fresh Page capture.
      await ticket.onAssistedTurn({ input: inputSnapshot, job: jobSnapshot, turn: turnSnapshot,
        envelope: envelopeSnapshot, evidence: turnSnapshot.evidence });
      attachedAssistedReceipts.current.add(operationKey);
      activeJobsStore.markRead(jobSnapshot);
      if (ticket.requestKey === assistedSessionKey(assistedAdviceRef.current)) {
        setCompletedAssistedKeys(keys => new Set(keys).add(ticket!.requestKey));
        setTurns(rows => merge(rows, [turnSnapshot]));
      }
    } catch (error) {
      deliveredAssistedTurns.current.delete(operationKey);
      deliveredAssistedTurns.current.delete(turnKey);
      if (ticket.requestKey === assistedSessionKey(assistedAdviceRef.current)) setError(brewerChatError(error));
    } finally {
      assistedSubmitLock.current = false;
      setAssistedSubmitting(false);
    }
  };
  const assistedScopeMatches = !assistedAdvice || sameScopeExactly(scope, assistedAdvice.request.contextLaunch.scope);
  const assistedQuestionMatches = !assistedAdvice || question === assistedAdvice.request.question;
  const assistedAlreadySubmitted = !!assistedAdvice && completedAssistedKeys.has(assistedRequestKey);
  const activeAssistedTicket = assistedAdvice ? assistedTicketsByKey.current.get(assistedRequestKey) : undefined;
  const assistedTicketLocked = !!activeAssistedTicket && !activeAssistedTicket.submitted;
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
          {/*
            La pastille dit l'ÉTAT du compagnon, et rien d'autre.
            Au repos elle affichait « Gemini » : le nom du fournisseur du
            modèle, qui n'apprend rien au brasseur et que le système de design
            interdit d'afficher (`DESIGN.md`, « Rédaction »). Au repos il n'y a
            pas d'état à annoncer — le bouton dit déjà « Compagnon brasseur » —
            donc la pastille disparaît.
          */}
          {(() => {
            const etat = jobs.some(isBrewerWorking)
              ? 'En cours'
              : jobs.some((j) => !j.readAt && j.status === 'done')
                ? 'Réponse prête'
                : null;
            return etat && <span className="brewer-chat-badge">{etat}</span>;
          })()}
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
          <form autoComplete="off"
            className="brewer-chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <div className="brewer-chat-mode">
              <fieldset
                disabled={applying || resetting || assistedSubmitting || assistedTicketLocked}
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
            <Textarea
              id={`brewer-question-${scope.id}`}
              value={question}
              maxLength={assistedAdvice ? 4000 : 3000}
              rows={2}
              placeholder={finance ? 'Une dépense à comprendre, un achat à préparer…' : 'Décris ce que tu observes…'}
              readOnly={applying || resetting || assistedSubmitting}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (assistedAdvice) setError('');
              }}
            />
            {assistedAdvice && !assistedRuntimeReady && (
              <p className="brewer-chat-status" role="status">
                Le transport dédié de cette lecture n’est pas disponible. Aucune question ne partira par le compagnon standard.
              </p>
            )}
            {assistedAdvice && !assistedScopeMatches && (
              <p className="brewer-chat-status" role="status">
                Cette lecture est liée à une autre portée. Reprends-la depuis sa source dans l’atelier.
              </p>
            )}
            {assistedAdvice && assistedScopeMatches && !assistedQuestionMatches && (
              <p className="brewer-chat-status" role="status">
                La question a changé. Reprends une nouvelle lecture dans l’atelier avant de l’envoyer.
              </p>
            )}
            {assistedAlreadySubmitted && (
              <p className="brewer-chat-status" role="status">
                Cette lecture a déjà été envoyée. Reprends une lecture dans l’atelier pour poser une autre question.
              </p>
            )}
            <button
              type="submit"
              disabled={
                applying ||
                loading ||
                assistedSubmitting ||
                resetting ||
                (!!assistedAdvice && !assistedRuntimeReady) ||
                (assistedAdvice
                  ? !assistedScopeMatches || !assistedQuestionMatches || assistedAlreadySubmitted || question.length < 2
                  : question.trim().length < 2) ||
                (!assistedAdvice && scope.kind === 'draft' && !draft)
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
            {assistedAdvice
              ? 'Lecture assistée liée à sa question et à sa source'
              : `${scope.kind === 'draft' ? 'Brouillon en cours' : phase || 'Recette'} · contexte actualisé à chaque question`}
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
        {!assistedAdvice && <BrewerNotificationOption />}
        {!assistedAdvice && <BrewerBudget />}
        {finance && <p className="brewer-chat-status">Gemini reçoit un résumé de tes comptes, paiements, prévisions, budgets de brassins et matériel. Les limites des données sont signalées ; les corrections restent à valider.</p>}
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
              {finance ? 'Les échanges et la réponse en cours seront effacés. Tes opérations, paiements et budgets restent conservés.' : 'Les échanges et la réponse en cours seront effacés. Ta recette et les notes déjà conservées restent intactes.'}
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
        {finance && timeline.length > 0 && <details className="brewer-chat-proof">
          <summary>Autres questions utiles</summary>
          <div className="brewer-chat-prompts">{questions.map((p) => <button type="button" key={p.label} disabled={resetting} onClick={() => setQuestion(p.question)}>{p.label}<ArrowUpRight size={15}/></button>)}</div>
        </details>}
        {!timeline.length && !loading && (
          <div className="brewer-chat-welcome">
            <Sparkles size={25} />
            <h3>{hasAssistedSession ? 'Lecture assistée' : 'On regarde ça ensemble.'}</h3>
            <p>
              {hasAssistedSession ? 'Cette question reste liée à la lecture enregistrée et à son contexte exact. Pour changer sa formulation, relis une nouvelle demande dans l’atelier.'
                : finance ? 'Comprendre où va ton argent, anticiper un brassin ou décider d’un achat utile à ta brasserie.'
                  : 'Je m’appuie sur ta recette, ton matériel et tes relevés pour t’aider à décider du prochain geste.'}
            </p>
            {!hasAssistedSession && <div className="brewer-chat-prompts">
              {questions.map((p) => (
                <button type="button" key={p.label} disabled={resetting} onClick={() => setQuestion(p.question)}>
                  {p.label}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>}
            <small>
              {hasAssistedSession ? 'Le conseil reste une proposition. Rien n’est confirmé tant que tu n’as pas choisi une suggestion dans l’atelier.'
                : finance ? 'Choisis une question, adapte-la puis envoie-la. Ouvrir cette aide ne lance aucune analyse.'
                  : 'Les simulations restent des propositions. Les relevés et les gestes se consignent dans le journal.'}
            </small>
          </div>
        )}
        <div className="brewer-chat-history" aria-label="Conversation avec le compagnon">
          {timeline.map(({ turn: t, job }) =>
            !t && job ? (
              <BrewerWorkCard
                key={job.operationId}
                job={job}
                localFixture={localAssistedFixture}
                onRecover={assistedReceiptsRetained
                  && isRecoverableAssistedReceipt(job, scope, assistedAdvice?.request)
                  && !attachedAssistedReceipts.current.has(`operation:${job.operationId}`)
                  ? () => void attachAssistedReceipt(job) : undefined}
                recoverDisabled={assistedSubmitting || resetting || applying}
                onRetry={job.unsupportedReadOnly ? undefined : () => {
                  const ticket = assistedTicketsByOperation.current.get(job.operationId);
                  if (hasAssistedSession) { void retryAssistedJob(job); return; }
                  if (ticket || job.input?.hopAdvice || job.turn?.hopAdviceProposal) return;
                  if (job.sendError) activeJobsStore?.retry(job);
                  else if (scope.kind === 'draft' && !draft) {
                    activeJobsStore?.markRead(job);
                    brewerJobs.retrySaved(job);
                  } else {
                    activeJobsStore?.markRead(job);
                    activeJobsStore?.submit(
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
                onEdit={job.unsupportedReadOnly ? undefined : () => {
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
                  <SupplierCards products={t.evidence.flatMap((e) => e.products ?? [])} selectedUrls={t.advice.productUrls} />
                  {t.proposal && !hasAssistedSession && (
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
                              ? ' · contrôle des sources web'
                              : t.reviewReason === 'complexity'
                                ? ' · analyse détaillée'
                                : t.reviewReason === 'repair'
                                  ? ' · vérification renforcée'
                                  : ' · rapide'}
                        .
                      </p>
                    )}
                    <p>{finance ? 'Seconde relecture IA. Vérifie les hypothèses et les montants avant toute décision.' : 'Seconde relecture IA. Les estimations restent à confirmer à la cuve.'}</p>
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
            <button type="button" onClick={() => void activeJobsStore?.refresh()}>
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

const EMPTY_SEMANTIC_ACTIVITY_V3: HopV55SemanticJobActivityV3 = {
  format: 'hop-v55-semantic-job-activity-v3', jobs: [], connectionError: '',
};
const emptySemanticActivityV3 = () => EMPTY_SEMANTIC_ACTIVITY_V3;

function semanticRuntimeMatchesV3(session: HopV55SemanticCompanionSessionV3,
  runtime: HopV55SemanticCompanionRuntimeV3 | undefined): runtime is HopV55SemanticCompanionRuntimeV3 {
  if (!runtime || runtime.format !== 'hop-v55-semantic-companion-runtime-v3' || runtime.protocol !== 'hopAdviceRequest3'
    || runtime.ownerKey !== session.ownerKey || runtime.workspaceId !== session.workspaceId
    || runtime.providerKind !== runtime.jobs.providerKind || runtime.jobs.kind !== 'hopAdviceRequest3'
    || typeof runtime.readGeneration !== 'function'
    || !sameScopeExactly(runtime.scope, session.scope)) return false;
  try { return runtime.storeNamespace === hopAdviceSemanticV3ClientPartitionKey(session.ownerKey, session.workspaceId, session.scope); }
  catch { return false; }
}

/** The Wizard runtime must be the distinct Wizard lane of this exact owner, dossier and draft scope. */
function semanticRuntimeMatchesWizardV1(session: HopV55SemanticCompanionSessionWizardV1,
  runtime: HopV55SemanticCompanionRuntimeWizardV1 | undefined): runtime is HopV55SemanticCompanionRuntimeWizardV1 {
  if (!runtime || runtime.format !== 'hop-v55-semantic-companion-runtime-wizard-v1' || runtime.protocol !== 'hopAdviceWizardRequest3V1'
    || runtime.ownerKey !== session.ownerKey || runtime.workspaceId !== session.workspaceId
    || runtime.providerKind !== runtime.jobs.providerKind || runtime.jobs.kind !== 'hopAdviceWizardRequest3V1'
    || typeof runtime.readGeneration !== 'function' || session.scope.kind !== 'draft'
    || !sameScopeExactly(runtime.scope, session.scope)) return false;
  try {
    const partition = hopAdviceWizardClientPartitionKey(session.ownerKey, session.workspaceId, session.scope);
    return runtime.storeNamespace === partition && runtime.jobs.storeNamespace === partition;
  } catch { return false; }
}

/** The wire carries the snapshot sealed with this reading, never the editor's later state nor a saved Recipe. */
function semanticEntryWizardV1(input: {
  session: HopV55SemanticCompanionSessionWizardV1;
  operationId: string;
  generation: number;
  mode: BrewerMode;
  phase?: string;
}): HopAdviceV1WizardClientEntryV1 {
  const { session, operationId, generation, mode, phase } = input;
  return { operationId, question: session.request.question, generation, ...(phase === undefined ? {} : { phase }),
    hopAdvice: session.request, analysisMode: mode, scope: { kind: 'draft', id: session.scope.id }, draft: session.snapshot.recipe };
}

function semanticEntryV3(input: {
  session: HopV55SemanticCompanionSessionV3;
  operationId: string;
  generation: number;
  mode: BrewerMode;
  phase?: string;
  draft?: unknown;
  localJournal?: unknown;
}): HopAdviceV1ClientEntryV3 {
  const { session, operationId, generation, mode, phase, draft, localJournal } = input;
  const common = { operationId, question: session.request.question, generation,
    ...(phase === undefined ? {} : { phase }), hopAdvice: session.request, analysisMode: mode };
  const scope = session.scope;
  switch (scope.kind) {
    case 'draft':
      if (draft === undefined) throw new Error('Le brouillon exact de cette lecture n’est plus disponible; aucune demande n’est reconstruite.');
      if (localJournal !== undefined) throw new Error('Un brouillon ne transmet pas de journal de brassin.');
      return { ...common, scope: { kind: 'draft', id: scope.id }, draft };
    case 'batch':
      if (draft !== undefined) throw new Error('Une lecture de brassin n’emporte pas de brouillon de recette.');
      return { ...common, scope: { kind: 'batch', id: scope.id }, ...(localJournal === undefined ? {} : { localJournal }) };
    case 'recipe':
      if (draft !== undefined || localJournal !== undefined) throw new Error('Une portée recipe/app ne transmet ni draft ni journal.');
      return { ...common, scope: { kind: 'recipe', id: scope.id } };
    case 'app':
      if (draft !== undefined || localJournal !== undefined) throw new Error('Une portée recipe/app ne transmet ni draft ni journal.');
      return { ...common, scope: { kind: 'app', id: scope.id } };
  }
}

type SemanticSubmissionResultAnyV1 = HopV55SemanticSubmissionResultV3 | HopV55SemanticWizardSubmissionResultV1;
/** Both lanes archive the same verified V6 turn shape for display; their records stay distinct types. */
type SemanticRecordViewV1 = HopV55AssistedAdviceRecordV2 | HopV55AssistedAdviceWizardRecordV1;
/** Local progress of the current operation: the classic store snapshot, or the Wizard submission result. */
interface SemanticProgressV1 {
  operationId: string;
  generation: number;
  status: 'pending' | 'received' | 'failed' | 'unsupportedReadOnly';
  reason?: string;
}

function semanticResultMessage(result: SemanticSubmissionResultAnyV1): string | undefined {
  return 'reason' in result ? result.reason : undefined;
}

type SemanticRowV3 = Record<string, unknown>;
const semanticRowV3 = (value: unknown): SemanticRowV3 | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as SemanticRowV3 : undefined;
const semanticRowsV3 = (value: unknown): SemanticRowV3[] =>
  Array.isArray(value) ? value.flatMap(row => { const read = semanticRowV3(row); return read ? [read] : []; }) : [];
const semanticTextV3 = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value : undefined;
const semanticTextsV3 = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((row): row is string => typeof row === 'string' && !!row.trim()) : [];

interface SemanticChoiceV3 {
  key: string;
  optionId: string;
  proposalId: string;
  title: string;
  rationale?: string;
  conditions: string[];
  tradeoffs: string[];
  suggestion: string;
  motive?: string;
  evidence: Array<{ id: string; label?: string }>;
  /** Only an added property intent enters the documentary answer; other links stay readable with this reason. */
  refusal?: string;
}

/** Display of a strictly received V6 record: the choices are its sealed option→suggestion links, nothing else. */
function semanticChoicesV3(record: SemanticRecordViewV1) {
  const proposal = semanticRowV3(semanticRowV3((record.turn as { hopAdviceProposal?: unknown }).hopAdviceProposal)?.proposal);
  const answer = semanticRowV3(proposal?.answer);
  const options = new Map(semanticRowsV3(answer?.options).map(row => [semanticTextV3(row.id) ?? '', row] as const));
  const intents = new Map(semanticRowsV3(proposal?.propertyIntentProposals).map(row => [semanticTextV3(row.proposalId) ?? '', row] as const));
  const revisions = new Map(semanticRowsV3(proposal?.semanticRevisionProposals).map(row => [semanticTextV3(row.proposalId) ?? '', row] as const));
  const labels = new Map(record.fullEvidence.map(evidence => [evidence.id, evidence.label] as const));
  const choices: SemanticChoiceV3[] = semanticRowsV3(proposal?.optionProposalLinks).flatMap(link => {
    const optionId = semanticTextV3(link.optionId);
    const proposalId = semanticTextV3(link.proposalId);
    if (!optionId || !proposalId) return [];
    const option = options.get(optionId);
    const intent = intents.get(proposalId);
    const revision = revisions.get(proposalId);
    const intentLabel = semanticTextV3(semanticRowV3(intent?.intent)?.label);
    const revisionText = semanticRowsV3(revision?.sourceSpans).flatMap(span => semanticTextV3(span.text) ?? []).join(' · ');
    return [{
      key: `${optionId}\u0000${proposalId}`, optionId, proposalId,
      title: semanticTextV3(option?.title) ?? 'Option de la réponse',
      rationale: semanticTextV3(option?.rationale),
      conditions: semanticTextsV3(option?.conditions), tradeoffs: semanticTextsV3(option?.tradeoffs),
      suggestion: intent ? `${intent.kind === 'add' ? 'Ajouter' : 'Réviser'} : ${intentLabel ?? 'intention proposée'}`
        : revision ? `Relire la question : ${revisionText || 'fragment proposé'}` : 'Suggestion absente de cette réponse',
      motive: semanticTextV3(intent?.motive ?? revision?.motive),
      evidence: semanticTextsV3(link.evidenceIds).map(id => ({ id, label: labels.get(id) })),
      refusal: intent?.kind === 'add' ? undefined
        : intent ? 'Une révision d’intention passe par la correction de la réponse documentaire, pas par ce choix.'
          : 'Une révision de la lecture d’origine reste consultable; elle ne s’ajoute pas à la réponse documentaire.',
    }];
  });
  const unknowns = semanticRowsV3(answer?.unknowns).flatMap(row => {
    const question = semanticTextV3(row.question);
    return question ? [{ id: semanticTextV3(row.id) ?? question, question, changesChoice: semanticTextV3(row.changesChoice) }] : [];
  });
  return { choices, unknowns };
}

function semanticHeadLabelV3(head: HopV55SemanticAdoptionHeadV1): string {
  return head.kind === 'none' ? 'Première version documentaire de cette lecture'
    : head.kind === 'recordV3' ? 'Nouvelle version qui reprend la réponse documentaire actuelle'
      : 'Nouvelle version de la réponse documentaire actuelle';
}
function semanticHeadReferenceV3(head: HopV55SemanticAdoptionHeadV1): string {
  return head.kind === 'none' ? 'none' : head.kind === 'recordV3' ? `recordV3 ${head.reference}`
    : `recordV4 ${head.reference} · ${head.ledgerReference}`;
}
const semanticInstantV3 = (value: string) => new Date(value).toLocaleString('fr-CH',
  { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Read-only view of an archived semantic answer (classic or Wizard record): the same answer, evidence, options,
 * tradeoffs and unknowns as the companion, rebuilt from the strictly read record only. No session, runtime, choice
 * control or command is attached; the context it came from is stated by the caller.
 */
export function HopV55SemanticArchivedAnswerV1({ record }: { record: SemanticRecordViewV1 }) {
  if (record.semantic.kind !== 'verifiedV6') {
    return <p role="status" className="brewer-chat-status">Réponse conservée en lecture seule, sans conversion : {record.semantic.reason}</p>;
  }
  const view = semanticChoicesV3(record);
  return <article className="brewer-chat-turn" data-testid="semantic-archived-answer">
    <p className="brewer-chat-question">{record.turn.question}</p>
    <div className={`brewer-chat-answer is-${record.turn.advice.level}`}>
      <div className="brewer-chat-answer-meta"><span><Sparkles size={14} /> Réponse liée à cette lecture · conservée</span>
        <time dateTime={record.recordedAt}>{semanticInstantV3(record.recordedAt)}</time></div>
      <h3>{record.turn.advice.summary}</h3>
      {record.turn.advice.action ? <p className="brewer-chat-action">{record.turn.advice.action}</p> : null}
      {record.turn.advice.why ? <p>{record.turn.advice.why}</p> : null}
      {record.turn.advice.watch ? <p className="brewer-chat-watch"><strong>À surveiller</strong>{record.turn.advice.watch}</p> : null}
      <details className="brewer-chat-proof"><summary><CheckCheck size={15} /> Réponse et preuves conservées</summary>
        <p>{record.turn.contextLabel} · {record.turn.model}</p>
        <p>Format de la réponse vérifié : <code>V6</code>.</p>
        {record.fullEvidence.map(evidence => <div key={evidence.id}><strong><Calculator size={14} /> {evidence.label}</strong>
          {evidence.facts.map((fact, index) => <p key={index}>{fact}</p>)}
          {evidence.limits.map((limit, index) => <small key={index}>{limit}</small>)}
          {evidence.sources?.filter(source => /^https:\/\//.test(source.url)).map(source => <a key={source.url}
            href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}
        </div>)}
      </details>
      {view.choices.length ? <div className="brewer-work-card" data-testid="semantic-archived-options">
        <strong>Options de cette réponse</strong>
        {view.choices.map(choice => <div key={choice.key}>
          <p><strong>{choice.title}</strong> → {choice.suggestion}</p>
          {choice.rationale ? <p>{choice.rationale}</p> : null}
          {choice.motive ? <p>Motif de la suggestion : {choice.motive}</p> : null}
          {choice.conditions.length ? <p>Conditions : {choice.conditions.join(' · ')}</p> : null}
          {choice.tradeoffs.length ? <p>Compromis : {choice.tradeoffs.join(' · ')}</p> : null}
          <p>Preuves liées : {choice.evidence.length
            ? choice.evidence.map(row => row.label ?? 'preuve sans libellé').join(' · ') : 'aucune, hypothèse non calculée'}</p>
        </div>)}
      </div> : <p className="brewer-chat-status">Cette réponse ne relie aucune option à une suggestion.</p>}
      {view.unknowns.length ? <div className="brewer-chat-watch"><strong>Ce qui reste inconnu</strong>
        <ul>{view.unknowns.map(row => <li key={row.id}>{row.question}{row.changesChoice ? ` — ${row.changesChoice}` : ''}</li>)}</ul>
      </div> : null}
      <p className="brewer-chat-status">Relecture d’archive : rien n’est envoyé, appliqué ou enregistré depuis cette vue.</p>
    </div>
  </article>;
}

type SemanticPreviewArgsV1 = Parameters<HopV55SemanticCompanionSessionWizardV1['preview']>[0];

function SemanticCompanionChat({ scope, label, phase, draft, localJournal, initialOpen = false, lane, onClose }: {
  scope: BrewerScope; label: string; phase?: string; draft?: unknown; localJournal?: unknown;
  initialOpen?: boolean; onClose?: () => void; lane: SemanticLaneV1;
}) {
  const session = lane.session;
  const [open, setOpen] = useState(initialOpen);
  const [mode, setMode] = useState<BrewerMode>(modePreference);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<SemanticRecordViewV1 | undefined>(session.resumedRecord);
  const [operationId, setOperationId] = useState(session.resumedOperationId ?? '');
  const [wizardProgress, setWizardProgress] = useState<SemanticProgressV1>();
  const recoveryStarted = useRef('');
  const scopeReady = sameScopeExactly(session.scope, scope) && sameScopeExactly(session.request.contextLaunch.scope, scope);
  const classicRuntime = lane.kind === 'classic' && scopeReady && semanticRuntimeMatchesV3(lane.session, lane.runtime) ? lane.runtime : undefined;
  const wizardRuntime = lane.kind === 'wizard' && scopeReady && semanticRuntimeMatchesWizardV1(lane.session, lane.runtime) ? lane.runtime : undefined;
  const runtimeReady = !!classicRuntime || !!wizardRuntime;
  // Only the classic store exposes an activity feed; the Wizard lane follows its own submission results.
  const activity = useSyncExternalStore(
    classicRuntime ? classicRuntime.jobs.subscribe : emptySubscribe,
    classicRuntime ? classicRuntime.jobs.snapshot : emptySemanticActivityV3,
    classicRuntime ? classicRuntime.jobs.snapshot : emptySemanticActivityV3,
  );
  const classicJob = activity.jobs.find(row => row.operationId === operationId);
  const progress: SemanticProgressV1 | undefined = lane.kind === 'classic'
    ? classicJob ? { operationId: classicJob.operationId, generation: classicJob.generation, status: classicJob.status,
      ...(classicJob.reason === undefined ? {} : { reason: classicJob.reason }) } : undefined
    : wizardProgress && wizardProgress.operationId === operationId ? wizardProgress : undefined;
  const previewLane = (args: SemanticPreviewArgsV1) => lane.kind === 'classic' ? lane.session.preview(args) : lane.session.preview(args);
  const confirmLane = (plan: HopV55SemanticAdoptionPlanV1) => lane.kind === 'classic' ? lane.session.confirm(plan) : lane.session.confirm(plan);
  const historyLane = (commandId: string) => lane.kind === 'classic' ? lane.session.readHistory(commandId) : lane.session.readHistory(commandId);
  const verified = record?.semantic.kind === 'verifiedV6' ? record : undefined;
  const semanticView = useMemo(() => verified ? semanticChoicesV3(verified) : undefined, [verified]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [motive, setMotive] = useState('');
  const [adopting, setAdopting] = useState(false);
  const [refused, setRefused] = useState(false);
  const [preview, setPreview] = useState<{ fingerprint: string; plan: HopV55SemanticAdoptionPlanV1 }>();
  const [adoption, setAdoption] = useState<{ plan: HopV55SemanticAdoptionPlanV1; receipt: HopV55SemanticAdoptionReceiptV1;
    mode: 'committed' | 'replay'; workspaceRevision: number; check?: string }>();
  // One command per exact choice and motive: a retry keeps its IDs, any correction gets new ones.
  const adoptionCommand = useRef<{ fingerprint: string; commandId: string; recordId: string; requestId: string } | undefined>(undefined);
  const selectionFingerprint = stableBrewerHopAdviceJson({ keys: [...selectedKeys].sort(), motive: motive.trim() });
  const selectionFingerprintRef = useRef(selectionFingerprint);
  selectionFingerprintRef.current = selectionFingerprint;
  const selectedChoices = (semanticView?.choices ?? []).filter(choice => selectedKeys.includes(choice.key) && !choice.refusal);

  const notifyDurable = async () => {
    try { await session.onDurableChange?.(); }
    catch { /* The durable rows stay readable from the workshop history. */ }
  };
  // Any change of choice or motive invalidates the preview: confirmation needs a new one.
  const changeSelection = (update: () => void) => { update(); setPreview(undefined); setRefused(false); };
  const toggleChoice = (choice: SemanticChoiceV3) => changeSelection(() => setSelectedKeys(keys => keys.includes(choice.key)
    ? keys.filter(key => key !== choice.key)
    // A suggestion is adopted once; choosing it through another option replaces that link.
    : [...keys.filter(key => !key.endsWith(`\u0000${choice.proposalId}`)), choice.key]));

  const previewChoice = async () => {
    if (!verified || adopting || !selectedChoices.length || !motive.trim()) return;
    const fingerprint = selectionFingerprint;
    if (adoptionCommand.current?.fingerprint !== fingerprint) {
      const id = crypto.randomUUID();
      adoptionCommand.current = { fingerprint, commandId: `semantic-adoption:${id}`, recordId: `semantic-answer:${id}`,
        requestId: `semantic-request:${id}` };
    }
    const command = adoptionCommand.current;
    const reason = motive.trim();
    setAdopting(true); setError(''); setPreview(undefined); setRefused(false);
    try {
      const result = await previewLane({ operationId: verified.operationId, commandId: command.commandId,
        recordId: command.recordId, requestId: command.requestId, reason,
        selection: selectedChoices.map(choice => ({ optionId: choice.optionId, proposalId: choice.proposalId, reason })) });
      if (result.status !== 'ready') { setError(result.reason); return; }
      if (selectionFingerprintRef.current !== fingerprint) return;
      setPreview({ fingerprint, plan: result.plan });
    } catch (cause) { setError(brewerChatError(cause)); }
    finally { setAdopting(false); }
  };

  const confirmChoice = async () => {
    const current = preview;
    if (!current || adopting || current.fingerprint !== selectionFingerprintRef.current) return;
    setAdopting(true); setError('');
    try {
      const result = await confirmLane(current.plan);
      if (result.status !== 'committed' && result.status !== 'replay') {
        setError(result.reason);
        // Source, head, generation or authority moved: this preview proves nothing anymore.
        if (result.status !== 'pending') setPreview(undefined);
        return;
      }
      if (result.receipt.commandId !== current.plan.commandId || result.recipeEffect !== 'none') {
        setError('Le reçu ne correspond pas à cet aperçu; il reste dans l’historique sans être présenté comme confirmé.');
        return;
      }
      setAdoption({ plan: current.plan, receipt: result.receipt, mode: result.status, workspaceRevision: result.workspaceRevision });
      setPreview(undefined); setSelectedKeys([]); setMotive('');
      await notifyDurable();
      const history = await historyLane(result.receipt.commandId);
      const check = history.status === 'readOnly' && history.commit.receipt.reference === result.receipt.reference
        && history.record.reference === result.receipt.record.reference
        ? 'Relecture : reçu, plan et version documentaire concordent.'
        : `Relecture à reprendre : ${history.status === 'readOnly' ? 'le reçu relu diffère.' : history.reason}`;
      setAdoption(previous => previous?.receipt.reference === result.receipt.reference ? { ...previous, check } : previous);
    } catch (cause) { setError(brewerChatError(cause)); }
    finally { setAdopting(false); }
  };

  const replayChoice = async () => {
    const current = adoption;
    if (!current || adopting) return;
    setAdopting(true); setError('');
    try {
      const result = await confirmLane(current.plan);
      if (result.status === 'replay' && result.receipt.reference === current.receipt.reference
        && result.receipt.effectiveAt === current.receipt.effectiveAt) {
        setAdoption({ ...current, mode: 'replay', check: 'Rejeu : même reçu et même instant d’effet, aucun second enregistrement.' });
        await notifyDurable();
      } else {
        setError(result.status === 'replay' || result.status === 'committed'
          ? 'Le rejeu n’a pas rendu le reçu original; l’historique reste la référence.' : result.reason);
      }
    } catch (cause) { setError(brewerChatError(cause)); }
    finally { setAdopting(false); }
  };

  const refuseChoice = () => {
    adoptionCommand.current = undefined;
    setPreview(undefined); setSelectedKeys([]); setMotive(''); setError(''); setRefused(true);
  };

  const acceptResult = (result: SemanticSubmissionResultAnyV1) => {
    if (result.status === 'received') {
      setRecord(result.record);
      setOperationId(result.ticket.operationId);
      setWizardProgress(undefined);
      setError('');
      void notifyDurable();
    } else if (result.status === 'pending') {
      setOperationId(result.ticket.operationId);
      if (lane.kind === 'wizard') setWizardProgress({ operationId: result.ticket.operationId,
        generation: result.ticket.generation, status: 'pending' });
      setError('');
    } else {
      const durable = 'durable' in result ? result.durable : undefined;
      if (durable) setOperationId(durable.operationId);
      else setOperationId('');
      const message = semanticResultMessage(result);
      // The Wizard store has no activity feed: its durable failure stays visible with the exact retry it allows.
      if (lane.kind === 'wizard') setWizardProgress(durable ? { operationId: durable.operationId, generation: durable.generation,
        status: result.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed',
        ...(message === undefined ? {} : { reason: message }) } : undefined);
      if (message) setError(message);
    }
  };

  const recover = async () => {
    if (!runtimeReady) {
      setError('Cette lecture assistée est indisponible. Aucun envoi ne partira par le compagnon standard.');
      return;
    }
    const operation = operationId || session.resumedOperationId;
    if (!operation) { setError('Aucun ticket enregistré n’est lié à cette lecture.'); return; }
    setLoading(true); setError('');
    try {
      if (lane.kind === 'classic' && classicRuntime) acceptResult(await lane.session.recover({ operationId: operation, store: classicRuntime.jobs }));
      else if (lane.kind === 'wizard' && wizardRuntime) acceptResult(await lane.session.recover({ operationId: operation, store: wizardRuntime.jobs }));
    }
    catch (cause) { setError(brewerChatError(cause)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!runtimeReady) {
      setError('Le compagnon assisté est indisponible pour cette lecture.');
      return;
    }
    if (classicRuntime) void classicRuntime.jobs.start();
    if (session.resumedRecord) return;
    if (!session.resumedOperationId || recoveryStarted.current === session.id) return;
    recoveryStarted.current = session.id;
    setOperationId(session.resumedOperationId);
    void recover();
  // A mounted resume reads only the exact persisted ticket; the host rechecks current authority.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeReady, session.id, session.resumedOperationId, session.resumedRecord, lane.runtime]);

  const ask = async () => {
    if (submitting || loading || operationId || session.resumedOperationId || record) return;
    if (!runtimeReady) {
      setError('Cette lecture assistée est indisponible. Aucune question ne sera envoyée au compagnon standard.');
      return;
    }
    setSubmitting(true); setError('');
    const nextOperationId = crypto.randomUUID();
    try {
      if (lane.kind === 'classic' && classicRuntime) {
        const generation = await classicRuntime.readGeneration(scope);
        if (!Number.isSafeInteger(generation) || generation < 0) throw new Error('La génération de conversation lue est invalide.');
        const entry = semanticEntryV3({ session: lane.session, operationId: nextOperationId, generation, mode,
          phase: phase ?? lane.session.context?.phase,
          draft: scope.kind === 'draft' ? draft ?? lane.session.context?.recipe : undefined,
          localJournal: scope.kind === 'batch' ? localJournal ?? lane.session.context?.journal : undefined });
        setOperationId(nextOperationId);
        acceptResult(await lane.session.submit({ entry, store: classicRuntime.jobs }));
      } else if (lane.kind === 'wizard' && wizardRuntime) {
        const generation = await wizardRuntime.readGeneration(scope);
        if (!Number.isSafeInteger(generation) || generation < 0) throw new Error('La génération de conversation lue est invalide.');
        const entry = semanticEntryWizardV1({ session: lane.session, operationId: nextOperationId, generation, mode,
          phase: phase ?? lane.session.context?.phase });
        setOperationId(nextOperationId);
        acceptResult(await lane.session.submit({ entry, store: wizardRuntime.jobs }));
      }
    } catch (cause) { setError(brewerChatError(cause)); }
    finally { setSubmitting(false); }
  };

  const retry = async () => {
    if (!runtimeReady || !progress || progress.status !== 'failed' || submitting || loading) return;
    setSubmitting(true); setError('');
    try {
      if (lane.kind === 'classic' && classicRuntime) acceptResult(await lane.session.retry({ operationId: progress.operationId,
        generation: progress.generation, store: classicRuntime.jobs }));
      else if (lane.kind === 'wizard' && wizardRuntime) acceptResult(await lane.session.retry({ operationId: progress.operationId,
        generation: progress.generation, store: wizardRuntime.jobs }));
    }
    catch (cause) { setError(brewerChatError(cause)); }
    finally { setSubmitting(false); }
  };

  const resubmit = async () => {
    if (!runtimeReady || !operationId || submitting || loading || progress || record) return;
    setSubmitting(true); setError('');
    try {
      if (lane.kind === 'classic' && classicRuntime) acceptResult(await lane.session.resubmit({ operationId, store: classicRuntime.jobs }));
      else if (lane.kind === 'wizard' && wizardRuntime) acceptResult(await lane.session.resubmit({ operationId, store: wizardRuntime.jobs }));
    }
    catch (cause) { setError(brewerChatError(cause)); }
    finally { setSubmitting(false); }
  };

  const locked = !!operationId || !!session.resumedOperationId || !!record;
  return <Sheet open={open} onClose={() => { if (!submitting) { setOpen(false); onClose?.(); } }}
    dismissible={!submitting} title="Compagnon brasseur" subtitle={label} className="brewer-chat-sheet"
    footer={<form autoComplete="off" className="brewer-chat-compose" onSubmit={event => { event.preventDefault(); void ask(); }}>
      <div className="brewer-chat-mode">
        <fieldset disabled={locked || submitting || loading} aria-describedby={`brewer-mode-v3-${scope.id}`}>
          <legend className="sr-only">Mode de réponse</legend>
          {responseModes.map(option => <label key={option.value} data-mode={option.value}>
            <input type="radio" name={`brewer-mode-v3-${scope.id}`} value={option.value} checked={mode === option.value}
              onChange={() => { setMode(option.value); try { localStorage.setItem('brewer-chat-mode', option.value); } catch { /* Optional preference. */ } }} />
            <span>{option.value === 'fast' ? <Zap size={14} /> : option.value === 'deep' ? <Sparkles size={14} /> : null}{option.label}</span>
          </label>)}
        </fieldset>
        <small id={`brewer-mode-v3-${scope.id}`}>{responseModes.find(option => option.value === mode)!.description}</small>
      </div>
      <label className="sr-only" htmlFor={`brewer-question-v3-${scope.id}`}>Question de la lecture archivée</label>
      <Textarea id={`brewer-question-v3-${scope.id}`} value={session.request.question} maxLength={4000} rows={2}
        readOnly placeholder="Question de la lecture archivée" />
      {session.resumedOperationId ? <p className="brewer-chat-status" role="status">Cette ouverture reprend le ticket archivé exact; la question et son périmètre sont verrouillés.</p> : null}
      <button type="submit" disabled={!runtimeReady || locked || submitting || loading || session.request.question.length < 2}
        aria-label="Envoyer la lecture assistée"><Send size={20} /><span>{submitting ? 'Envoi…' : 'Envoyer'}</span></button>
    </form>}>
    <div className="brewer-chat-context">
      <span className="brewer-chat-dot" /><span>{lane.kind === 'wizard'
        ? 'Brouillon en cours · version figée pour cette lecture · aucune modification de recette'
        : 'Lecture enregistrée · contexte conservé · aucune modification de recette'}</span>
      {operationId && !record ? <button type="button" className="brewer-chat-reset" aria-label="Récupérer la réponse exacte"
        title="Récupérer la réponse exacte" disabled={loading || submitting} onClick={() => void recover()}><RotateCcw size={17} /></button> : null}
    </div>
    <details className="brewer-chat-proof"><summary>Détails de la lecture</summary><dl>
      <div><dt>Version de l’envoi</dt><dd><code>{lane.kind === 'wizard' ? 'Request3 · brouillon' : 'Request3'}</code></dd></div>
      <div><dt>Périmètre exact</dt><dd><code>{session.scope.kind}:{session.scope.id}</code></dd></div>
      {lane.kind === 'wizard' ? <div><dt>Version du brouillon</dt><dd><code>{lane.session.snapshot.reference}</code></dd></div> : null}
    </dl></details>
    {!runtimeReady ? <p role="status" className="brewer-chat-status">Le transport dédié est indisponible. Aucune question ne sera envoyée par le compagnon standard.</p> : null}
    {progress?.status === 'pending' ? <p role="status" className="brewer-chat-status">Question conservée sous son ticket exact; traitement en cours.</p> : null}
    {progress?.status === 'unsupportedReadOnly' ? <p role="status" className="brewer-chat-status">Réponse future conservée en lecture seule : {progress.reason}</p> : null}
    {progress?.status === 'failed' ? <div role="status" className="brewer-chat-status">
      <p>{progress.reason ?? 'La lecture assistée n’a pas abouti.'}</p>
      <button type="button" disabled={submitting || loading} onClick={() => void retry()}>Réessayer le même ticket</button>
    </div> : null}
    {operationId && !progress && !record ? <div className="brewer-chat-status" role="status">
      <p>Le ticket local reste lié à cette question. La reprise réutilise les données d’envoi conservées sans reconstruire la demande.</p>
      <button type="button" disabled={submitting || loading} onClick={() => void resubmit()}>Réémettre le ticket exact</button>
    </div> : null}
    {activity.connectionError ? <p role="status" className="brewer-chat-status">{activity.connectionError}</p> : null}
    {record?.semantic.kind === 'verifiedV6' ? <article className="brewer-chat-turn" data-testid="semantic-v6-turn">
      <p className="brewer-chat-question">{record.turn.question}</p>
      <div className={`brewer-chat-answer is-${record.turn.advice.level}`}>
        <div className="brewer-chat-answer-meta"><span><Sparkles size={14} /> Réponse liée à cette lecture</span>
          <time dateTime={record.recordedAt}>{new Date(record.recordedAt).toLocaleString('fr-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></div>
        <h3>{record.turn.advice.summary}</h3><p className="brewer-chat-action">{record.turn.advice.action}</p>
        {record.turn.advice.why ? <p>{record.turn.advice.why}</p> : null}
        {record.turn.advice.watch ? <p className="brewer-chat-watch"><strong>À surveiller</strong>{record.turn.advice.watch}</p> : null}
        {record.turn.advice.question ? <p className="brewer-chat-followup">{record.turn.advice.question}</p> : null}
        <details className="brewer-chat-proof"><summary><CheckCheck size={15} /> Réponse et preuves reçues</summary>
          <p>{record.turn.contextLabel} · {record.turn.model}</p>
          <p>Format de la réponse vérifié : <code>V6</code>.</p>
          {record.fullEvidence.map(evidence => <div key={evidence.id}><strong><Calculator size={14} /> {evidence.label}</strong>
            {evidence.facts.map((fact, index) => <p key={index}>{fact}</p>)}
            {evidence.limits.map((limit, index) => <small key={index}>{limit}</small>)}
            {evidence.sources?.filter(source => /^https:\/\//.test(source.url)).map(source => <a key={source.url}
              href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={12} /></a>)}
          </div>)}
        </details>
        <p className="brewer-chat-status">Proposition conservée dans la lecture assistée. Rien n’a été appliqué à la recette, au brassin ou au stock.</p>
        {semanticView?.unknowns.length ? <div className="brewer-chat-watch"><strong>Ce qui reste inconnu</strong>
          <ul>{semanticView.unknowns.map(row => <li key={row.id}>{row.question}{row.changesChoice ? ` — ${row.changesChoice}` : ''}</li>)}</ul>
        </div> : null}
      </div>
    </article> : null}
    {verified && semanticView?.choices.length ? <fieldset className="brewer-work-card" disabled={adopting} data-testid="semantic-v6-choices">
      <legend>Choisir ce que tu retiens</legend>
      {semanticView.choices.map(choice => <div key={choice.key}>
        <label>
          <input type="checkbox" checked={selectedKeys.includes(choice.key)} disabled={!!choice.refusal}
            aria-label={`Retenir « ${choice.title} » avec « ${choice.suggestion} »`} onChange={() => toggleChoice(choice)} />
          <span><strong>{choice.title}</strong> → {choice.suggestion}</span>
        </label>
        {choice.rationale ? <p>{choice.rationale}</p> : null}
        {choice.motive ? <p>Motif de la suggestion : {choice.motive}</p> : null}
        {choice.conditions.length ? <p>Conditions : {choice.conditions.join(' · ')}</p> : null}
        {choice.tradeoffs.length ? <p>Compromis : {choice.tradeoffs.join(' · ')}</p> : null}
        <p>Preuves liées : {choice.evidence.length
          ? choice.evidence.map(row => row.label ?? 'preuve sans libellé').join(' · ') : 'aucune, hypothèse non calculée'}</p>
        {choice.refusal ? <p role="status">{choice.refusal}</p> : null}
      </div>)}
      <label className="sr-only" htmlFor={`semantic-motive-${session.id}`}>Motif de ton choix</label>
      <Textarea id={`semantic-motive-${session.id}`} className="w-full" rows={2} value={motive} placeholder="Pourquoi retiens-tu ce choix ?"
        onChange={event => { const value = event.target.value; changeSelection(() => setMotive(value)); }} />
      <p className="brewer-chat-status">Seront conservés : la lecture d’origine, cette réponse et ses preuves. Confirmer ajoute une version documentaire de ta demande; recette, brouillon, stock et brassin ne changent pas.</p>
      <div className="brewer-work-actions">
        <button type="button" disabled={adopting || !selectedChoices.length || !motive.trim()} onClick={() => void previewChoice()}>Prévisualiser ce choix</button>
        <button type="button" disabled={adopting} onClick={refuseChoice}>Refuser cette proposition</button>
      </div>
    </fieldset> : verified ? <p className="brewer-chat-status">Cette réponse ne relie aucune option à une suggestion; elle reste consultable sans choix à confirmer.</p> : null}
    {preview && preview.fingerprint === selectionFingerprint ? <section className="brewer-work-card" aria-label="Aperçu avant confirmation">
      <strong>Aperçu · rien n’est encore enregistré</strong>
      <ul>{preview.plan.selection.map(row => <li key={row.proposalId}>{row.activeIntent.label}</li>)}</ul>
      <p>Motif : {preview.plan.reason}</p>
      <p>{semanticHeadLabelV3(preview.plan.expectedHead)} · aucun effet sur la recette, le brouillon, le stock ou le brassin.</p>
      <div className="brewer-work-actions">
        <button type="button" disabled={adopting} onClick={() => void confirmChoice()}>Confirmer ce choix</button>
      </div>
      <details className="brewer-chat-proof"><summary>Provenance de l’aperçu</summary><dl>
        <div><dt>Commande</dt><dd><code>{preview.plan.commandId}</code></dd></div>
        <div><dt>Version prévue</dt><dd><code>{preview.plan.recordId}</code></dd></div>
        <div><dt>Demande</dt><dd><code>{preview.plan.requestId}</code></dd></div>
        <div><dt>Tête attendue</dt><dd><code>{semanticHeadReferenceV3(preview.plan.expectedHead)}</code></dd></div>
        <div><dt>Plan</dt><dd><code>{preview.plan.reference}</code></dd></div>
        <div><dt>Réponse</dt><dd><code>{preview.plan.envelopeReference}</code></dd></div>
        <div><dt>Ticket</dt><dd><code>{preview.plan.ticket.ticketId}</code> · <code>{preview.plan.ticket.operationId}</code> · génération {preview.plan.ticket.generation}</dd></div>
        <div><dt>Périmètre</dt><dd><code>{JSON.stringify(preview.plan.candidatePolicy)}</code></dd></div>
      </dl></details>
    </section> : null}
    {adoption ? <section className="brewer-work-card" aria-label="Reçu de confirmation">
      <strong>{adoption.mode === 'replay' ? 'Choix déjà confirmé · même reçu' : 'Choix confirmé dans la réponse documentaire'}</strong>
      <p>Effectif le <time dateTime={adoption.receipt.effectiveAt}>{semanticInstantV3(adoption.receipt.effectiveAt)}</time> · aucun effet sur la recette, le brouillon, le stock ou le brassin.</p>
      <p role="status">{adoption.check ?? 'Relecture du reçu en cours…'}</p>
      <div className="brewer-work-actions">
        <button type="button" disabled={adopting} onClick={() => void replayChoice()}>Rejouer la même confirmation</button>
      </div>
      <details className="brewer-chat-proof"><summary>Provenance du reçu</summary><dl>
        <div><dt>Commande</dt><dd><code>{adoption.receipt.commandId}</code></dd></div>
        <div><dt>Reçu</dt><dd><code>{adoption.receipt.reference}</code></dd></div>
        <div><dt>Empreinte</dt><dd><code>{adoption.receipt.fingerprint}</code></dd></div>
        <div><dt>Version documentaire</dt><dd><code>{adoption.receipt.record.id}</code> · <code>{adoption.receipt.record.reference}</code></dd></div>
        <div><dt>Demande</dt><dd><code>{adoption.plan.requestId}</code></dd></div>
        <div><dt>Tête attendue</dt><dd><code>{semanticHeadReferenceV3(adoption.receipt.expectedHead)}</code></dd></div>
        <div><dt>Effet recette</dt><dd><code>{adoption.receipt.recipeEffect}</code></dd></div>
        <div><dt>Révision du dossier</dt><dd><code>{adoption.workspaceRevision}</code></dd></div>
      </dl></details>
    </section> : null}
    {refused ? <p role="status" className="brewer-chat-status">Proposition refusée : la réponse reste conservée telle quelle, sans nouvelle version documentaire.</p> : null}
    {record?.semantic.kind === 'opaqueReadOnly' ? <p role="status" className="brewer-chat-status">
      Réponse conservée en lecture seule : {record.semantic.reason}
    </p> : null}
    {error ? <p role="alert" className="brewer-chat-error">{error}</p> : null}
  </Sheet>;
}

function BrewerWorkCard({
  job,
  onRetry,
  onRecover,
  recoverDisabled = false,
  localFixture = false,
  onEdit
}: {
  job: ClientBrewerJob;
  onRetry?: () => void;
  onRecover?: () => void;
  recoverDisabled?: boolean;
  localFixture?: boolean;
  onEdit?: () => void;
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
          <strong>{job.unsupportedReadOnly ? 'Format futur conservé · lecture seule'
            : localFixture ? localAssistedFixtureStatus(job) : brewerJobStatus(job)}</strong>
          <time aria-hidden="true">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </time>
        </div>
        {job.unsupportedReadOnly ? (
          <>
            <p role="status">Source conservée sans conversion · {job.unsupportedReadOnly.source}</p>
            <p>{job.unsupportedReadOnly.reason}</p>
            <details><summary>Données brutes conservées (lecture seule)</summary>
              <pre>{jsonText(job.unsupportedReadOnly.snapshot)}</pre>
            </details>
          </>
        ) : failed ? (
          <>
            <p role="alert">{job.sendError || job.error?.message}</p>
            {job.error?.code === 'gemini-spend-cap' && (
              <a href="https://ai.studio/spend" target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-touch items-center text-ebc-straw underline underline-offset-2">
                Ouvrir les dépenses Google
              </a>
            )}
            <div className="brewer-work-actions">
              {(job.sendError || job.error?.retryable) && onRetry && (
                <button type="button" onClick={onRetry}>
                  {localFixture ? 'Relancer la simulation locale'
                    : job.sendError ? 'Réessayer l’envoi' : 'Relancer l’analyse'}
                </button>
              )}
              {onEdit ? <button type="button" onClick={onEdit}>
                Reformuler
              </button> : null}
            </div>
          </>
        ) : (
          <>
            {job.detail && <p>{job.detail}</p>}
            <small>
              {localFixture
                ? job.status === 'done' && !job.sending ? 'Réponse simulée · fixture locale' : 'Traitement local · réponse simulée'
                : job.model?.includes('pro')
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
                {localFixture ? 'Tu peux continuer; cette fixture garde le parcours local dans ce navigateur.'
                  : 'Tu peux continuer ailleurs. La réponse restera dans ce fil.'}
              </p>
            )}
            {job.status === 'running' && now - job.updatedAt > 90000 && (
              <p>
                {localFixture ? 'La simulation locale reste en attente; aucun modèle distant n’est appelé.'
                  : 'Cette étape prend du temps. Le serveur poursuit l’analyse et signalera tout échec ici.'}
              </p>
            )}
            {onRecover && (
              <div className="brewer-work-actions">
                <p>La réponse reçue reste liée à sa question d’origine. Vérifie son ticket avant de la rattacher.</p>
                <button type="button" disabled={recoverDisabled} onClick={onRecover}>Rattacher la réponse assistée</button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function SupplierCards({ products, selectedUrls }: { products: BrewerProduct[]; selectedUrls?: string[] }) {
  // Prefer useful small packs and an available variant, with one card per product URL.
  const packGrams = (product: BrewerProduct) => {
    const label = product.packageLabel || product.name;
    const weight = label.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilogramm(?:e)?s?|gramm(?:e)?s?|g)\b/i);
    if (weight) return Number(weight[1].replace(',', '.')) * (/^(kg|kilo)/i.test(weight[2]) ? 1000 : 1);
    if (/\b(?:gramm(?:e)?s?|g)\b/i.test(label)) return 1;
    if (/\b(?:kg|kilogramm(?:e)?s?)\b/i.test(label)) return 1000;
    return Number.MAX_SAFE_INTEGER;
  };
  const sorted = [...products]
    .filter((p) => {
      if (selectedUrls && !selectedUrls.includes(p.url)) return false;
      try { const url = new URL(p.url); return url.protocol === 'https:' && !url.username && !url.password; }
      catch { return false; }
    })
    .sort(
      (a, b) =>
        (selectedUrls ? selectedUrls.indexOf(a.url) - selectedUrls.indexOf(b.url) : 0) ||
        Number(b.verifiedBy === 'product-page') - Number(a.verifiedBy === 'product-page') ||
        Number(b.availability === 'in_stock') - Number(a.availability === 'in_stock') ||
        packGrams(a) - packGrams(b)
    );
  const unique = [...new Map(sorted.reverse().map((p) => [p.url, p])).values()].reverse();
  const suppliers = new Set<string>();
  const firstPerSupplier = unique.filter(p => {
    if (suppliers.has(p.supplier)) return false;
    suppliers.add(p.supplier); return true;
  });
  const cards = [...firstPerSupplier, ...unique.filter(p => !firstPerSupplier.includes(p))].slice(0, 6);
  if (!cards.length) return null;
  return (
    <div className="brewer-chat-suppliers" aria-label="Produits chez les fournisseurs suisses">
      <strong>Où acheter</strong>
      {cards.map((p) => {
        const dated = Number.isFinite(p.checkedAt) && p.checkedAt > 0 && p.checkedAt <= Date.now() + 300000;
        const stale = !dated || Date.now() - p.checkedAt > 86400000;
        const status = stale || (p.verifiedBy === 'product-page' && p.stockEvidence === 'none') ? 'unknown' : p.availability;
        return (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brewer-chat-product"
          >
            <span className="brewer-chat-product-name">
              <strong style={{ overflowWrap: 'anywhere' }}>{p.name}</strong>
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
            {(p.packageLabel || p.priceText) && <small>
              {[p.packageLabel, p.priceText ? `${p.priceText} · prix annoncé` : ''].filter(Boolean).join(' · ')}
            </small>}
            <small>
              {p.verifiedBy === 'product-page' ? 'Lien produit vérifié' : 'Page consultée'}
              {dated ? ` · ${new Date(p.checkedAt).toLocaleString('fr-CH', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}` : ' · date de contrôle inconnue'}
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
