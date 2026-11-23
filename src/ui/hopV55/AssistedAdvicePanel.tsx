import React, { useId, useRef, useState } from 'react';
import type { HopPropertyAdviceIntentV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import type { CompareHopV55AssistedContextAtReceptionResult } from '../../services/hopV55/assistedAdviceContext';
import type {
  HopV55AssistedAnnotationRow,
  HopV55AssistedV4Suggestion,
  HopV55BrewerConfirmation,
  PrepareHopV55AssistedAdviceResult,
} from '../../services/hopV55/assistedAdviceProposal';
import { AssistedColdContactCard } from './AssistedColdContactCard';
import { Textarea } from '../Input';
import './assisted-advice-panel.css';

type ReadyResult = Extract<PrepareHopV55AssistedAdviceResult, { status: 'ready' }>;
type Intent = HopPropertyAdviceIntentV3;
type SuggestionConfirmationRequest = {
  suggestion: HopV55AssistedV4Suggestion;
  confirmation: HopV55BrewerConfirmation;
  commandId: string;
};

export interface AssistedAdvicePanelProps {
  /** Exact result returned by prepareHopV55AssistedAdviceFromProposal; never reconstructed by the panel. */
  result: PrepareHopV55AssistedAdviceResult;
  /** Exact question and archive reference passed by the parent for the displayed A reading. */
  question: string;
  sourceReadingReference: string;
  /** The canonical reception comparison: history for A and applicability for current B. */
  contextCheckAtReception: CompareHopV55AssistedContextAtReceptionResult;
  /** Parent marks a historical view read-only even when its old context was once applicable. */
  readOnly: boolean;
  /** One explicit annotation at a time; the parent/controller performs all guards and persistence. */
  onConfirmSuggestion?(request: SuggestionConfirmationRequest): Promise<void>;
}

type SuggestionDraft = { reason: string; confirmed: boolean };
type FailedAttempt = { request: SuggestionConfirmationRequest; message: string };
interface StateIdentity {
  result: PrepareHopV55AssistedAdviceResult;
  question: string;
  sourceReadingReference: string;
  freshnessKey: string;
  readOnly: boolean;
}
interface PanelState {
  identity: StateIdentity;
  drafts: Record<string, SuggestionDraft | undefined>;
  failed: Record<string, FailedAttempt | undefined>;
  completed: string[];
  errors: Record<string, string | undefined>;
}

const roleLabels: Record<Intent['role'], string> = {
  target: 'Cible', reportedObservation: 'Constat', measurement: 'Mesure', investigation: 'Question à examiner', preference: 'Préférence', constraint: 'Garde',
};
const propertyLabels: Record<Intent['property'], string> = {
  aroma: 'Arôme', bitterness: 'Amertume', sweetness: 'Douceur', acidity: 'Acidité',
  bioContribution: 'Apport de culture', materialCharacter: 'Caractère de la matière', unresolved: 'À qualifier',
};
const directionLabels: Record<Exclude<Intent['direction'], null>, string> = {
  increase: 'À augmenter', decrease: 'À réduire', keep: 'À préserver', exclude: 'À exclure', investigate: 'À explorer',
};
const dispositionLabels: Record<HopV55AssistedAnnotationRow['disposition'], string> = {
  unchanged: 'Conservée sans changement', revised: 'Lecture proposée', disputed: 'Lecture à vérifier', added: 'Ajout proposé',
  refused: 'Non retenue par la validation', protected: 'Lecture locale protégée',
};
const optionKindLabels: Record<ReadyResult['answer']['options'][number]['kind'], string> = {
  intervention: 'Intervention proposée', characterization: 'Caractérisation', investigation: 'Piste à examiner', alternative: 'Alternative',
};
const provenanceLabels: Record<ReadyResult['answer']['options'][number]['provenance'], string> = {
  modelExplanation: 'Explication proposée', documentaryReference: 'Référence documentaire',
  toolExploration: 'Exploration d’outil', toolComputed: 'Résultat d’outil qualifié',
};
const openQuestionLabels: Record<ReadyResult['openQuestions'][number]['kind'], string> = {
  conditionalRisk: 'Risque conditionnel', alternativeAddition: 'Ajout alternatif', fermentationInteraction: 'Interaction de fermentation',
  processChoice: 'Choix de procédé', cause: 'Cause à éclaircir', other: 'Question ouverte',
};
const materialIdentityLabels: Record<ReadyResult['materials'][number]['identity'], string> = {
  unconfirmed: 'Identité non confirmée', personalUnidentified: 'Matière personnelle non identifiée',
};
const numberFr = (value: number) => new Intl.NumberFormat('fr-CH', { maximumSignificantDigits: 21 }).format(value);
const jsonText = (value: unknown) => {
  try { return JSON.stringify(value, null, 2) ?? String(value); }
  catch { return String(value); }
};

function freshnessKey(check: CompareHopV55AssistedContextAtReceptionResult): string {
  const history = check.history.status === 'matched' ? check.history
    : { status: check.history.status, reason: check.history.reason };
  const applicability = check.applicability.status === 'current'
    ? { status: check.applicability.status, recalculationRequired: check.applicability.recalculationRequired }
    : { status: check.applicability.status, reason: check.applicability.reason };
  return JSON.stringify([check.historicalSourceReadingReference, check.currentSourceReadingReference ?? null, history, applicability]);
}

function sameIdentity(left: StateIdentity, right: StateIdentity): boolean {
  return left.result === right.result && left.question === right.question && left.sourceReadingReference === right.sourceReadingReference
    && left.freshnessKey === right.freshnessKey && left.readOnly === right.readOnly;
}

function emptyState(identity: StateIdentity): PanelState {
  return { identity, drafts: {}, failed: {}, completed: [], errors: {} };
}

function suggestionKey(suggestion: HopV55AssistedV4Suggestion): string {
  return `${suggestion.kind}:${suggestion.annotationId}`;
}

function suggestionLabel(suggestion: HopV55AssistedV4Suggestion): string {
  return suggestion.kind === 'add' ? 'Ajouter ce terme'
    : suggestion.kind === 'revise' ? 'Réviser ce terme' : 'Écarter ce terme';
}

function intentTitle(intent: Intent): string {
  return `${roleLabels[intent.role]} · ${propertyLabels[intent.property]}${intent.direction ? ` · ${directionLabels[intent.direction]}` : ''}`;
}

function IntentProjection({ intent }: { intent: Intent }) {
  return <div className="hv-assisted-advice__intent">
    <strong>{intentTitle(intent)}</strong>
    <span>{intent.label}</span>
    {intent.qualification ? <small>{intent.qualification}</small> : null}
    <details><summary>Détails de cette lecture</summary>
      <p>{intent.basis}</p>
      <dl><div><dt>Sujet</dt><dd>{intent.subject.label}</dd></div>
        <div><dt>Base</dt><dd>{intent.comparisonBasis.kind === 'current' ? 'Faits liés à la lecture' : intent.comparisonBasis.kind === 'qualitativeTarget' ? 'Cible qualitative' : 'Aucune base déclarée'}</dd></div>
        {intent.comparisonBasis.assertionIds.length ? <div><dt>Faits liés</dt><dd>{intent.comparisonBasis.assertionIds.map(id => <code key={id}>{id}</code>)}</dd></div> : null}
        <div><dt>Unité d’analyse</dt><dd>{intent.metric}</dd></div>
      </dl>
    </details>
  </div>;
}

function SourceSpans({ spans }: { spans: readonly { start: number; end: number; text: string }[] }) {
  return spans.length ? <div className="hv-assisted-advice__spans" aria-label="Passages exacts conservés">
    {spans.map((span, index) => <blockquote key={`${span.start}-${span.end}-${index}`}>« {span.text} »</blockquote>)}
  </div> : <p className="hv-assisted-advice__muted">Aucun passage exact associé à cette ligne.</p>;
}

function AnnotationComparison({ result, row, suggestion }: {
  result: ReadyResult; row: HopV55AssistedAnnotationRow; suggestion?: HopV55AssistedV4Suggestion;
}) {
  const local = result.readerDraft?.requestSnapshot.propertyIntents.find(intent => intent.id === row.id);
  const proposed = row.proposedIntent
    ?? (suggestion?.kind === 'revise' ? suggestion.proposedIntent : suggestion?.kind === 'add' ? suggestion.sourceAnnotation : undefined);
  const projected = result.assistedDraft?.requestSnapshot.propertyIntents.find(intent => intent.id === row.id) ?? row.intent;
  const sourceAnnotation = result.envelope.proposal.annotations.find(annotation => annotation.id === row.id);
  const spans = sourceAnnotation?.spans ?? local?.sourceSpans ?? proposed?.sourceSpans ?? projected?.sourceSpans ?? [];
  return <article className="hv-assisted-advice__annotation">
    <header><strong>{local?.label ?? proposed?.label ?? projected?.label ?? row.id}</strong>
      <span className={`hv-assisted-advice__disposition is-${row.disposition}`}>{dispositionLabels[row.disposition]}</span></header>
    <SourceSpans spans={spans} />
    <div className="hv-assisted-advice__comparison">
      <section><h5>Lecture locale</h5>{local ? <IntentProjection intent={local} /> : <p className="hv-assisted-advice__muted">Aucune ligne locale liée à ce passage.</p>}</section>
      <section><h5>Projection proposée</h5>{projected ? <IntentProjection intent={projected} /> : <p className="hv-assisted-advice__muted">Aucune projection retenue dans le brouillon V3.</p>}</section>
    </div>
    {proposed ? <details><summary>Suggestion détaillée</summary><IntentProjection intent={proposed} /></details> : null}
    <p className="hv-assisted-advice__reason">{row.reason}</p>
  </article>;
}

function ContextStatus({ contextCheck, readOnly }: { contextCheck: CompareHopV55AssistedContextAtReceptionResult; readOnly: boolean }) {
  const history = contextCheck.history;
  const applicability = contextCheck.applicability;
  const historyLabel = readOnly
    ? history.status === 'matched' ? 'Statut enregistré · lecture de départ correspondante'
      : history.status === 'stale' ? 'Statut enregistré · lecture de départ à revoir' : 'Statut enregistré · lecture de départ non vérifiée'
    : history.status === 'matched' ? 'Correspond à la lecture de départ'
      : history.status === 'stale' ? 'Lecture de départ à revoir' : 'Lecture de départ non vérifiée';
  const applicabilityLabel = readOnly
    ? applicability.status === 'current'
      ? applicability.recalculationRequired ? 'Statut enregistré · recalcul nécessaire à la réception' : 'Statut enregistré · applicable à la réception'
      : applicability.status === 'stale' ? 'Statut enregistré · contexte différent à la réception' : 'Statut enregistré · comparaison indisponible à la réception'
    : applicability.status === 'current'
      ? applicability.recalculationRequired ? 'Dépendances à recalculer' : 'Applicable au contexte actuel'
      : applicability.status === 'stale' ? 'Contexte actuel différent' : 'Applicabilité actuelle indisponible';
  return <section className="hv-assisted-advice__context"
    aria-label={readOnly ? 'Lecture d’origine et contexte à la réception' : 'Lecture d’origine et contexte actuel'}>
    <h3>{readOnly ? 'Contexte à la réception' : 'Contexte de la proposition'}</h3>
    <div className="hv-assisted-advice__context-grid">
      <article><small>Lecture d’origine</small><strong>{historyLabel}</strong>
        {history.status !== 'matched' ? <p>{readOnly ? `Motif enregistré · ${history.reason}` : history.reason}</p>
          : readOnly ? <p>La lecture de départ correspondait au résultat reçu.</p> : <p>La vérification historique de la lecture A a réussi.</p>}</article>
      <article><small>{readOnly ? 'Contexte à la réception' : 'Contexte actuel'}</small><strong>{applicabilityLabel}</strong>
        {readOnly ? <>
          <p>Cette vérification est figée à la réception; elle ne vérifie pas la situation d’aujourd’hui et n’ouvre pas de confirmation depuis cette lecture.</p>
          {applicability.status !== 'current' ? <p>Motif enregistré · {applicability.reason}</p> : null}
        </>
          : applicability.status !== 'current' ? <p>{applicability.reason}</p>
          : applicability.recalculationRequired ? <p>Les dépendances ont changé; un nouveau calcul est nécessaire avant confirmation.</p>
            : <p>La proposition peut être présentée pour une confirmation individuelle.</p>}</article>
    </div>
    <details><summary>Références exactes A et B</summary>
      <div><dt>Lecture d’origine A</dt><dd><code>{contextCheck.historicalSourceReadingReference}</code></dd></div>
      {contextCheck.currentSourceReadingReference ? <div><dt>{readOnly ? 'Contexte à la réception B' : 'Contexte actuel B'}</dt>
        <dd><code>{contextCheck.currentSourceReadingReference}</code></dd></div> : null}
    </details>
  </section>;
}

function EvidenceReferences({ result, evidenceIds }: { result: ReadyResult; evidenceIds: readonly string[] }) {
  if (!evidenceIds.length) return <p className="hv-assisted-advice__muted">Aucun appui ou résultat d’outil n’est cité pour cette option.</p>;
  const records = new Map(result.evidenceRecords.map(record => [record.id, record]));
  return <details><summary>Appuis et résultats liés ({evidenceIds.length})</summary>
    <ul>{evidenceIds.map(id => {
      const record = records.get(id);
      return <li key={id}><code>{id}</code>{record ? <details><summary>{record.label} · {record.tool}</summary><pre>{jsonText(record)}</pre></details>
        : <small>Le résultat reçu ne contient pas de fiche détaillée pour cette référence exacte.</small>}</li>;
    })}</ul>
  </details>;
}

function SuggestionAction({ suggestion, canConfirm, state, disabled, retry = false, pending = false, onChange, onConfirm }: {
  suggestion: HopV55AssistedV4Suggestion;
  canConfirm: boolean;
  state: SuggestionDraft;
  disabled: boolean;
  retry?: boolean;
  pending?: boolean;
  onChange(value: SuggestionDraft): void;
  onConfirm(): void;
}) {
  const label = suggestionLabel(suggestion);
  return <form className="hv-assisted-advice__suggestion-action" autoComplete="off" onSubmit={event => { event.preventDefault(); onConfirm(); }}>
    <h5>{label}</h5>
    <p>{suggestion.reason}</p>
    <label><span>Motif de ta confirmation</span>
      <Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
        aria-label={`Motif de confirmation · ${suggestion.annotationId}`} value={state.reason} disabled={disabled}
        onChange={event => onChange({ ...state, reason: event.target.value, confirmed: false })} />
    </label>
    <label className="hv-assisted-advice__confirm-check">
      <input type="checkbox" aria-label={`Confirmer explicitement · ${suggestion.annotationId}`} checked={state.confirmed} disabled={disabled}
        onChange={event => onChange({ ...state, confirmed: event.target.checked })} />
      <span>J’ai relu cette suggestion et je confirme cette annotation seulement.</span>
    </label>
    <button type="submit" className="hv-assisted-advice__button" disabled={disabled || !canConfirm || !state.confirmed || !state.reason.trim()}>
      {pending ? 'Confirmation…' : retry ? 'Réessayer la même confirmation' : label}
    </button>
  </form>;
}

export function AssistedAdvicePanel({ result, question, sourceReadingReference, contextCheckAtReception, readOnly, onConfirmSuggestion }:
  AssistedAdvicePanelProps) {
  const rootId = useId();
  const contextKey = freshnessKey(contextCheckAtReception);
  const identity: StateIdentity = { result, question, sourceReadingReference, freshnessKey: contextKey, readOnly };
  const currentIdentityRef = useRef(identity);
  currentIdentityRef.current = identity;
  const [storedState, setStoredState] = useState<PanelState>(() => emptyState(identity));
  const [pendingOperation, setPendingOperation] = useState<{ identity: StateIdentity; key: string }>();
  const operationLock = useRef(false);
  const state = sameIdentity(storedState.identity, identity) ? storedState : emptyState(identity);

  const updateState = (update: (current: PanelState) => PanelState) => setStoredState(current =>
    update(sameIdentity(current.identity, identity) ? current : emptyState(identity)));
  const ready = result.status === 'ready' ? result : undefined;
  const propMismatch = !!ready && (ready.envelope.request.question !== question
    || ready.envelope.request.sourceReadingReference !== sourceReadingReference
    || contextCheckAtReception.historicalSourceReadingReference !== sourceReadingReference);
  const checkReady = contextCheckAtReception.history.status === 'matched'
    && contextCheckAtReception.applicability.status === 'current' && !contextCheckAtReception.applicability.recalculationRequired;
  const canConfirm = !!ready && !readOnly && !propMismatch && checkReady && !!onConfirmSuggestion;
  const blockedMessage = readOnly ? 'Cette proposition est conservée en lecture seule.'
    : propMismatch ? 'La question ou la référence de lecture ne correspond pas à cette proposition.'
      : !checkReady ? contextCheckAtReception.applicability.status === 'stale' || contextCheckAtReception.history.status === 'stale'
        ? 'Le contexte a changé; cette proposition reste consultable sans action.'
        : contextCheckAtReception.applicability.status === 'current' && contextCheckAtReception.applicability.recalculationRequired
          ? 'Les dépendances ont changé; recalcule avant toute confirmation.'
          : 'La vérification de contexte ne permet pas de confirmer cette proposition.'
        : !onConfirmSuggestion ? 'La page ne fournit pas de confirmation individuelle dans cette vue.' : '';

  const submitSuggestion = async (suggestion: HopV55AssistedV4Suggestion) => {
    if (!onConfirmSuggestion || !canConfirm || pendingOperation || operationLock.current || state.completed.includes(suggestionKey(suggestion))) return;
    const key = suggestionKey(suggestion);
    const draft = state.drafts[key] ?? { reason: '', confirmed: false };
    if (!draft.confirmed || !draft.reason.trim()) return;
    const failed = state.failed[key];
    const request: SuggestionConfirmationRequest = failed?.request ?? {
      suggestion: structuredClone(suggestion), commandId: `assisted-v4:${crypto.randomUUID()}`,
      confirmation: { kind: 'brewerConfirmation', reason: draft.reason.trim() },
    };
    const attemptIdentity = identity;
    operationLock.current = true;
    setPendingOperation({ identity, key });
    updateState(current => ({ ...current, errors: { ...current.errors, [key]: undefined } }));
    try {
      await onConfirmSuggestion(request);
      if (!sameIdentity(currentIdentityRef.current, attemptIdentity)) return;
      updateState(current => ({ ...current, completed: [...new Set([...current.completed, key])],
        failed: { ...current.failed, [key]: undefined }, errors: { ...current.errors, [key]: undefined } }));
    } catch (error) {
      if (!sameIdentity(currentIdentityRef.current, attemptIdentity)) return;
      updateState(current => ({ ...current, failed: { ...current.failed, [key]: { request, message: error instanceof Error ? error.message : 'Confirmation refusée.' } },
        errors: { ...current.errors, [key]: error instanceof Error ? error.message : 'Confirmation refusée.' } }));
    } finally {
      operationLock.current = false;
      setPendingOperation(current => current?.identity === attemptIdentity ? undefined : current);
    }
  };

  const answer = ready?.answer;
  const localIntents = ready?.readerDraft?.requestSnapshot.propertyIntents ?? [];
  const projectedIntents = ready?.assistedDraft?.requestSnapshot.propertyIntents ?? [];
  const localById = new Map(localIntents.map(intent => [intent.id, intent]));
  const suggestionsById = new Map((ready?.v4Suggestions ?? []).map(suggestion => [suggestion.annotationId, suggestion]));
  const operationBusy = !!pendingOperation;
  const readOnlyLabel = readOnly || result.status !== 'ready' || !canConfirm;

  return <section className="hv-assisted-advice" aria-labelledby={`${rootId}-title`}>
    <header className="hv-assisted-advice__header">
      <div><p className="hv-assisted-advice__eyebrow">Lecture assistée</p>
        <h2 id={`${rootId}-title`}>Proposition à examiner</h2>
      </div>
      <span className={`hv-assisted-advice__status ${readOnlyLabel ? 'is-readonly' : 'is-ready'}`}>
        {result.status === 'ready' ? readOnlyLabel ? 'Lecture seule' : 'À confirmer' : result.status === 'stale' ? 'Ancienne lecture' : 'Lecture indisponible'}
      </span>
    </header>

    <section className="hv-assisted-advice__question" aria-label="Question originale conservée">
      <h3>Question de départ</h3>
      <blockquote>{question}</blockquote>
      <details><summary>Référence exacte de la lecture</summary><code>{sourceReadingReference}</code></details>
    </section>

    <ContextStatus contextCheck={contextCheckAtReception} readOnly={readOnly} />
    {propMismatch ? <p className="hv-assisted-advice__warning" role="alert">La question ou la lecture d’origine transmise ne correspond pas à la proposition reçue; aucune suggestion ne peut être confirmée.</p> : null}
    {readOnly ? <p className="hv-assisted-advice__readonly" role="note">Cette proposition reste consultable; aucun changement n’est envoyé depuis cette vue.</p> : null}
    {result.status !== 'ready' ? <p className="hv-assisted-advice__warning" role="status">{result.reason}</p> : null}
    {!canConfirm && !readOnly && result.status === 'ready' && !propMismatch ? <p className="hv-assisted-advice__warning" role="status">{blockedMessage}</p> : null}

    {ready ? <>
      <section className="hv-assisted-advice__answer" aria-label="Réponse proposée par l’assistant">
        <h3>Réponse proposée</h3>
        <p className="hv-assisted-advice__summary">{answer.summary}</p>
        {answer.readingNote ? <p className="hv-assisted-advice__reading-note">{answer.readingNote}</p> : null}
      </section>

      <section className="hv-assisted-advice__reading" aria-label="Lecture locale et lecture proposée">
        <h3>Lecture locale et proposition assistée</h3>
        <div className="hv-assisted-advice__reading-counts">
          <div><span>Lecture locale A</span><strong>{localIntents.length} {localIntents.length === 1 ? 'terme' : 'termes'}</strong></div>
          <div><span>Projection assistée</span><strong>{projectedIntents.length} {projectedIntents.length === 1 ? 'terme' : 'termes'}</strong></div>
        </div>
        {ready.annotations.length ? <details><summary>Annotations, comparaisons et passages exacts ({ready.annotations.length})</summary>
          <div className="hv-assisted-advice__annotation-list">{ready.annotations.map(row => <AnnotationComparison key={row.id} result={ready} row={row}
            suggestion={suggestionsById.get(row.id)} />)}</div>
        </details> : <p className="hv-assisted-advice__muted">Aucune annotation n’est transmise pour cette question.</p>}
        <details><summary>Projections locales exactes</summary>
          <div className="hv-assisted-advice__projection-columns">
            <section><h4>Lecture locale</h4>{localIntents.length ? localIntents.map(intent => <IntentProjection key={intent.id} intent={intent} />)
              : <p className="hv-assisted-advice__muted">Aucune lecture locale préparée.</p>}</section>
            <section><h4>Lecture proposée</h4>{projectedIntents.length ? projectedIntents.map(intent => <IntentProjection key={intent.id} intent={intent} />)
              : <p className="hv-assisted-advice__muted">Aucune projection V3 proposée.</p>}</section>
          </div>
        </details>
      </section>

      {answer.options.length ? <section className="hv-assisted-advice__options" aria-label="Options proposées">
        <h3>Options proposées</h3>
        {answer.options.map(option => <article className="hv-assisted-advice__option" key={option.id}>
          <header><span>{optionKindLabels[option.kind]}</span><span>{provenanceLabels[option.provenance]}</span></header>
          <h4>{option.title}</h4>
          <p>{option.rationale}</p>
          {option.conditions.length ? <div><strong>Conditions</strong><ul>{option.conditions.map((condition, index) => <li key={`${index}-${condition}`}>{condition}</li>)}</ul></div> : null}
          {option.tradeoffs.length ? <div><strong>Compromis et réserves</strong><ul>{option.tradeoffs.map((tradeoff, index) => <li key={`${index}-${tradeoff}`}>{tradeoff}</li>)}</ul></div> : null}
          <EvidenceReferences result={ready} evidenceIds={option.evidenceIds} />
          {option.computed ? <details><summary>Référence d’un résultat d’outil</summary><pre>{jsonText(option.computed)}</pre></details> : null}
          {option.exploration?.length ? <details><summary>Limites de l’exploration</summary><ul>{option.exploration.map((item, index) => <li key={`${index}-${item.evidenceId}`}>{item.note} <code>{item.evidenceId}</code></li>)}</ul></details> : null}
        </article>)}
      </section> : null}

      <section className="hv-assisted-advice__questions" aria-label="Questions et réserves ouvertes">
        {answer.refusals.length ? <div><h3>Réserves du résultat</h3><ul>{answer.refusals.map((refusal, index) => <li key={`${index}-${refusal.text}`}>
          <p>{refusal.text}</p>{refusal.relatedIds.length ? <details><summary>Termes concernés</summary>{refusal.relatedIds.map(id => <code key={id}>{id}</code>)}</details> : null}
        </li>)}</ul></div> : null}
        {ready.openQuestions.length ? <div><h3>Questions à garder ouvertes</h3><ul>{ready.openQuestions.map(questionRow => <li key={questionRow.id}>
          <strong>{openQuestionLabels[questionRow.kind]}</strong><p>{questionRow.restatement}</p><p>{questionRow.whyOpen}</p>
          <SourceSpans spans={questionRow.spans} />
        </li>)}</ul></div> : null}
        {ready.conflicts.length ? <details><summary>Points à vérifier dans la lecture locale ({ready.conflicts.length})</summary>
          <ul>{ready.conflicts.map(conflict => <li key={conflict.annotationId}>{conflict.kind === 'negatedObjective'
            ? 'Un objectif semble lié à une formulation négative.' : 'Une observation semble hypothétique.'} · {conflict.resolved ? 'Résolu dans la lecture proposée' : 'À revoir'}
            <code>{conflict.annotationId}</code></li>)}</ul>
        </details> : null}
        {ready.openQuestions.length === 0 && answer.refusals.length === 0 ? <p className="hv-assisted-advice__muted">Aucune question ouverte ni réserve n’est transmise.</p> : null}
      </section>

      {ready.materials.length ? <details className="hv-assisted-advice__materials"><summary>Matières évoquées ({ready.materials.length})</summary>
        <ul>{ready.materials.map(material => <li key={material.id}><strong>{material.span.text}</strong><span>{materialIdentityLabels[material.identity]}</span><p>{material.note}</p>
          {material.candidates.length ? <details><summary>Identités candidates déjà citées ({material.candidates.length})</summary>
            <ul>{material.candidates.map(candidate => <li key={`${candidate.materialId}-${candidate.evidenceId}`}><code>{candidate.materialId}</code><code>{candidate.evidenceId}</code></li>)}</ul></details>
            : <p className="hv-assisted-advice__muted">Aucune identité candidate n’est fournie.</p>}
        </li>)}</ul>
      </details> : null}
      {ready.scopeDrafts.length ? <details><summary>Portées proposées ({ready.scopeDrafts.length})</summary>
        <ul>{ready.scopeDrafts.map(scope => {
          const proposedScope = ready.envelope.proposal.scopes.find(item => item.id === scope.id);
          return <li key={scope.id}><strong>{scope.kind === 'employmentTiming' ? 'Quand employer' : 'Choix de matière'}</strong>
          <SourceSpans spans={[scope.sourceSpan, ...(scope.focusSpan ? [scope.focusSpan] : []), ...scope.contextSpans]} />
          {proposedScope ? <p>{proposedScope.reason}</p> : null}<details><summary>Références liées</summary>
            {scope.relatedCriterionIds.map(id => <code key={`criterion-${id}`}>{id}</code>)}{scope.relatedOperationIds.map(id => <code key={`operation-${id}`}>{id}</code>)}
          </details></li>;
        })}</ul>
      </details> : null}

      {ready.coldContactEvidence.length ? <section className="hv-assisted-advice__cold" aria-label="Preuves du contact à froid">
        <h3>Références de contact à froid</h3>
        {ready.coldContactEvidence.map((evidence, index) => <AssistedColdContactCard key={`${evidence.evidenceId ?? 'preuve'}-${index}`} evidence={evidence} />)}
      </section> : null}

      {ready.evidenceRecords.length ? <details className="hv-assisted-advice__evidence"><summary>Sources et résultats reçus ({ready.evidenceRecords.length})</summary>
        <ul>{ready.evidenceRecords.map(record => <li key={`${record.id}-${record.kind}`}><strong>{record.label}</strong><span>{record.kind === 'reference' ? 'Référence' : record.kind === 'prediction'
          ? 'Prévision de matière' : record.kind === 'hopIdentity' ? 'Identité de houblon' : record.kind === 'scenarioResult' ? 'Résultat de scénario' : 'Requête de scénario'}</span>
          <details><summary>Contenu exact</summary><pre>{jsonText(record)}</pre></details>
        </li>)}</ul>
      </details> : null}
      {ready.notes.length ? <details><summary>Notes de vérification ({ready.notes.length})</summary><ul>{ready.notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul></details> : null}

      {ready.v4Suggestions.length ? <section className="hv-assisted-advice__suggestions" aria-label="Suggestions à confirmer individuellement">
        <h3>Suggestions pour la lecture enregistrée</h3>
        <p>Chaque geste concerne une seule annotation. Rien n’est appliqué sans motif et confirmation explicite.</p>
        {ready.v4Suggestions.map(suggestion => {
          const key = suggestionKey(suggestion);
          const draft = state.drafts[key] ?? { reason: '', confirmed: false };
          const failed = state.failed[key];
          const completed = state.completed.includes(key);
          const blockedByAnother = !!pendingOperation;
          return <article className="hv-assisted-advice__suggestion" key={key}>
            <header><strong>{suggestionLabel(suggestion)}</strong><span>{suggestion.annotationId}</span></header>
            <p>{suggestion.reason}</p>
            {state.errors[key] ? <p role="alert" className="hv-assisted-advice__error">{state.errors[key]}</p> : null}
            {completed ? <p role="status" className="hv-assisted-advice__success">Confirmation transmise pour cette annotation.</p>
              : onConfirmSuggestion ? <SuggestionAction suggestion={suggestion} canConfirm={canConfirm}
                state={draft} disabled={blockedByAnother} retry={!!failed} pending={pendingOperation?.key === key}
                onChange={value => updateState(current => ({ ...current,
                  drafts: { ...current.drafts, [key]: value }, failed: { ...current.failed, [key]: undefined }, errors: { ...current.errors, [key]: undefined } }))}
                onConfirm={() => void submitSuggestion(suggestion)} />
                : <p className="hv-assisted-advice__muted">Aucune commande de confirmation n’est disponible dans cette vue.</p>}
            {failed && !completed ? <small>La reprise renverra le même acte, le même motif et la même suggestion.</small> : null}
          </article>;
        })}
      </section> : <p className="hv-assisted-advice__muted">Aucune suggestion V4 individuelle n’est transmise.</p>}
    </> : null}
  </section>;
}

