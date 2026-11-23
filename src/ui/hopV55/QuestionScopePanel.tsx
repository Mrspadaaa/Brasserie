import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import {
  HOP_V55_DECISION_READING_FORMAT_V3,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV3,
} from '../../services/hopV55/decisionArchive';
import type {
  HopV55QuestionScopeDispositionActionV1,
  HopV55QuestionScopeStatusV1,
  HopV55QuestionScopeV1,
  HopV55QuestionScopeCoverageV1,
} from '../../services/hopV55/questionScopeReading';
import { Textarea } from '../Input';
import './question-scope-panel.css';

export interface HopV55QuestionScopeConfirmInputV1 {
  sourceReadingReference: string;
  expectedScopeLedgerReference: string;
  actions: HopV55QuestionScopeDispositionActionV1[];
  reason: string;
  commandId: string;
}

export interface HopV55QuestionScopePanelProps {
  archiveV3: HopV55DecisionReadingArchiveV3;
  readOnly?: boolean;
  scopeCoverage?: readonly HopV55QuestionScopeCoverageV1[];
  onConfirm(input: HopV55QuestionScopeConfirmInputV1): Promise<HopV55DecisionReadingArchiveV3>;
}

interface ScopeDraft {
  status: Exclude<HopV55QuestionScopeStatusV1, 'open'> | null;
  relatedScopeIds: string[];
}

const scopeLabel = (scope: HopV55QuestionScopeV1) => scope.kind === 'employmentTiming'
  ? 'Quand l’employer' : 'Quelles matières examiner';

const statusLabel: Record<HopV55QuestionScopeStatusV1, string> = {
  open: 'Ouverte', retained: 'Retenue', excluded: 'Écartée',
};

function latestEntryByScope(archive: HopV55DecisionReadingArchiveV3) {
  const entries = new Map<string, HopV55DecisionReadingArchiveV3['scopeLedger']['entries'][number]>();
  for (const entry of archive.scopeLedger.entries) entries.set(entry.scopeId, entry);
  return entries;
}

function readError(value: unknown): string {
  return value instanceof Error && value.message.trim()
    ? value.message : 'La disposition n’a pas été enregistrée. Relis les portées et réessaie.';
}

function asArchiveV3(value: unknown): HopV55DecisionReadingArchiveV3 | undefined {
  const read = readHopV55DecisionReadingArchive(value);
  return read.status === 'available' && read.archive.format === HOP_V55_DECISION_READING_FORMAT_V3
    ? read.archive : undefined;
}

export function HopV55QuestionScopePanel({ archiveV3, readOnly = false, scopeCoverage, onConfirm }: HopV55QuestionScopePanelProps) {
  const [acceptedArchive, setAcceptedArchive] = useState<HopV55DecisionReadingArchiveV3>();
  const [drafts, setDrafts] = useState<Record<string, ScopeDraft>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const inputReference = useRef(archiveV3.contentReference);
  const acceptedReference = useRef<string | undefined>(undefined);
  const pendingCommand = useRef<{ fingerprint: string; commandId: string } | undefined>(undefined);
  const reasonInputId = useId();

  useEffect(() => {
    if (inputReference.current === archiveV3.contentReference) return;
    inputReference.current = archiveV3.contentReference;
    pendingCommand.current = undefined;
    const confirmsAcceptedSave = acceptedReference.current === archiveV3.contentReference;
    acceptedReference.current = undefined;
    setAcceptedArchive(undefined);
    setDrafts({});
    setReason('');
    setBusy(false);
    if (!confirmsAcceptedSave) {
      setNotice('');
      setError('');
    }
  }, [archiveV3.contentReference]);

  const archive = acceptedArchive ?? archiveV3;
  const archiveRead = useMemo(() => readHopV55DecisionReadingArchive(archive), [archive]);
  const current = archiveRead.status === 'available' && archiveRead.archive.format === HOP_V55_DECISION_READING_FORMAT_V3
    ? archiveRead.archive : undefined;
  const latestEntries = useMemo(() => current ? latestEntryByScope(current) : new Map(), [current]);
  const sourceScopes = current?.scopeLedger.sourceScopes ?? [];
  const coverageByScope = useMemo(() => new Map((acceptedArchive ? [] : scopeCoverage ?? []).map(row => [row.scopeId, row])), [acceptedArchive, scopeCoverage]);

  const baselineScope = (scope: HopV55QuestionScopeV1) => {
    const entry = latestEntries.get(scope.id);
    return entry?.status !== 'excluded' && entry?.activeScope ? entry.activeScope : scope;
  };
  const draftFor = (scope: HopV55QuestionScopeV1): ScopeDraft => drafts[scope.id] ?? {
    status: null,
    relatedScopeIds: [...baselineScope(scope).relatedScopeIds],
  };
  const effectiveStatus = (scope: HopV55QuestionScopeV1): HopV55QuestionScopeStatusV1 => {
    const draft = drafts[scope.id];
    return draft?.status ?? latestEntries.get(scope.id)?.status ?? 'open';
  };
  const activeAfterDraft = (scope: HopV55QuestionScopeV1) => effectiveStatus(scope) !== 'excluded';

  const actionDrafts = current ? sourceScopes.flatMap(scope => {
    const draft = drafts[scope.id];
    if (!draft?.status) return [];
    const action: HopV55QuestionScopeDispositionActionV1 = {
      scopeId: scope.id,
      status: draft.status,
      reason: reason.trim(),
      ...(draft.status === 'retained' ? {
        activeScope: {
          ...structuredClone(baselineScope(scope)),
          relatedScopeIds: [...draft.relatedScopeIds],
          origin: 'brasseur' as const,
        },
      } : {}),
    };
    return [action];
  }) : [];

  const activeIds = new Set(sourceScopes.filter(activeAfterDraft).map(scope => scope.id));
  const invalidLinks = current ? sourceScopes.flatMap(scope => {
    if (!activeAfterDraft(scope)) return [];
    const linkedIds = draftFor(scope).relatedScopeIds;
    return linkedIds.filter(id => !activeIds.has(id)).map(id => ({ scopeId: scope.id, linkedScopeId: id }));
  }) : [];
  const canSubmit = !!current && !readOnly && !busy && reason.trim().length > 0 && actionDrafts.length > 0 && invalidLinks.length === 0;

  function clearFeedback(resetCommand = false) {
    setNotice('');
    setError('');
    if (resetCommand) pendingCommand.current = undefined;
  }

  function chooseDisposition(scope: HopV55QuestionScopeV1, status: Exclude<HopV55QuestionScopeStatusV1, 'open'>) {
    clearFeedback(true);
    setDrafts(previous => ({
      ...previous,
      [scope.id]: {
        ...(previous[scope.id] ?? { status: null, relatedScopeIds: [...baselineScope(scope).relatedScopeIds] }),
        status,
      },
    }));
  }

  function setRelatedScope(scope: HopV55QuestionScopeV1, linkedScopeId: string, checked: boolean) {
    clearFeedback(true);
    setDrafts(previous => {
      const existing = previous[scope.id] ?? draftFor(scope);
      const relatedScopeIds = checked
        ? [...new Set([...existing.relatedScopeIds, linkedScopeId])]
        : existing.relatedScopeIds.filter(id => id !== linkedScopeId);
      return { ...previous, [scope.id]: { status: existing.status ?? 'retained', relatedScopeIds } };
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!current || !canSubmit) return;
    const fingerprint = hopAdviceContentReference('hop-v55-question-scope-panel-command-v1', {
      sourceReadingReference: current.contentReference,
      expectedScopeLedgerReference: current.scopeLedger.reference,
      actions: actionDrafts,
      reason: reason.trim(),
    });
    if (pendingCommand.current?.fingerprint !== fingerprint) {
      pendingCommand.current = { fingerprint, commandId: `scope-disposition:${crypto.randomUUID()}` };
    }
    const commandId = pendingCommand.current.commandId;
    setBusy(true);
    try {
      const returned = await onConfirm({
        sourceReadingReference: current.contentReference,
        expectedScopeLedgerReference: current.scopeLedger.reference,
        actions: structuredClone(actionDrafts),
        reason: reason.trim(),
        commandId,
      });
      const checked = asArchiveV3(returned);
      const appended = checked?.scopeLedger.entries.length === current.scopeLedger.entries.length + actionDrafts.length
        && JSON.stringify(checked.scopeLedger.entries.slice(0, current.scopeLedger.entries.length)) === JSON.stringify(current.scopeLedger.entries);
      if (!checked || checked.ownerKey !== current.ownerKey || checked.workspaceId !== current.workspaceId
        || checked.transition.kind !== 'reviseScopes' || checked.transition.parentReadingReference !== current.contentReference
        || checked.transition.actId !== commandId || !appended) {
        throw new Error('La réponse ne correspond pas à une révision append-only de ces portées.');
      }
      acceptedReference.current = checked.contentReference;
      pendingCommand.current = undefined;
      setAcceptedArchive(checked);
      setDrafts({});
      setReason('');
      setNotice('Les dispositions sont enregistrées dans la lecture suivante.');
    } catch (caught) {
      setError(`La disposition n’a pas été enregistrée. ${readError(caught)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    const message = archiveRead.status === 'unsupportedFormat'
      ? 'Cette lecture contient un format de portée futur. Elle reste en lecture seule.'
      : archiveRead.status === 'invalidRecord'
        ? 'La lecture ou ses portées ne passe pas la validation; aucune correction n’est proposée.'
        : 'Cette vue peut corriger uniquement une lecture V3 avec portée scellée.';
    return <section className="hop-question-scope" aria-labelledby="hop-question-scope-title" data-testid="hop-v55-question-scope-panel">
      <header className="hop-question-scope__header">
        <div><p className="hop-question-scope__eyebrow">Lecture de la demande</p><h2 id="hop-question-scope-title">Portées de la question</h2></div>
        <span className="hop-question-scope__badge">Lecture seule</span>
      </header>
      <p className="hop-question-scope__message" role="status">{message}</p>
      <details className="hop-question-scope__references">
        <summary>Référence et contenu reçus</summary>
        <code>{archiveV3.contentReference}</code>
        {archiveRead.status === 'unsupportedFormat' && <pre>{JSON.stringify(archiveRead.raw, null, 2)}</pre>}
        {archiveRead.status === 'invalidRecord' && <p>{archiveRead.reason}</p>}
      </details>
    </section>;
  }

  return <section className="hop-question-scope" aria-labelledby="hop-question-scope-title" data-testid="hop-v55-question-scope-panel">
    <header className="hop-question-scope__header">
      <div>
        <p className="hop-question-scope__eyebrow">Lecture de la demande</p>
        <h2 id="hop-question-scope-title">Portées de la question</h2>
        <p className="hop-question-scope__summary">Ces portées gardent les questions formulées. Elles ne créent ni critère sensoriel, ni calendrier, ni choix de matière.</p>
      </div>
      <span className={`hop-question-scope__badge${readOnly ? ' is-readonly' : ''}`}>{readOnly ? 'Lecture seule' : 'Lecture V3'}</span>
    </header>

    {notice && <p className="hop-question-scope__notice" role="status" aria-live="polite">{notice}</p>}
    {error && <p className="hop-question-scope__error" role="alert">{error}</p>}

    <form autoComplete="off" onSubmit={submit}>
      <div className="hop-question-scope__list">
        {sourceScopes.map(sourceScope => {
          const entry = latestEntries.get(sourceScope.id);
          const activeScope = baselineScope(sourceScope);
          const draft = draftFor(sourceScope);
          const status = effectiveStatus(sourceScope);
          const coverage = coverageByScope.get(sourceScope.id);
          const exactScope = entry?.activeScope ?? sourceScope;
          const isActive = status !== 'excluded';
          return <article className="hop-question-scope__item" key={sourceScope.id}>
            <div className="hop-question-scope__item-heading">
              <div>
                <h3>{scopeLabel(sourceScope)}</h3>
                <p className="hop-question-scope__state">Disposition actuelle : <strong>{statusLabel[entry?.status ?? 'open']}</strong>
                  {draft.status && <span className="hop-question-scope__pending"> · choix en attente : {draft.status === 'excluded' ? 'écarter' : entry?.status === 'excluded' ? 'réouvrir' : 'garder'}</span>}
                </p>
              </div>
              <span className={`hop-question-scope__coverage is-${coverage?.coverage ?? 'unknown'}`}>
                {coverage ? coverage.coverage === 'bounded' ? 'Couverture bornée' : coverage.coverage === 'unresolved' ? 'Non résolue' : 'Hors couverture'
                  : 'Couverture non fournie'}
              </span>
            </div>

            <div className="hop-question-scope__evidence">
              <p><span>Fragment exact</span><q>{sourceScope.sourceSpan.text}</q></p>
              {activeScope.contextSpans.length > 0 && <p><span>Contexte associé</span>{activeScope.contextSpans.map((item, index) => <q key={`${item.start}:${item.end}:${index}`}>{item.text}</q>)}</p>}
              {coverage && <p className="hop-question-scope__coverage-reason">{coverage.reason}</p>}
            </div>

            {coverage && <p className="hop-question-scope__coverage-count">
              {coverage.optionIds.length} option{coverage.optionIds.length === 1 ? '' : 's'} documentée{coverage.optionIds.length === 1 ? '' : 's'} dans la couverture.
              {coverage.materialIds.length > 0 && ` ${coverage.materialIds.length} matière${coverage.materialIds.length === 1 ? '' : 's'} mentionnée${coverage.materialIds.length === 1 ? '' : 's'}.`}
              {coverage.uses.length > 0 && ` ${coverage.uses.length} emploi${coverage.uses.length === 1 ? '' : 's'} documenté${coverage.uses.length === 1 ? '' : 's'}.`}
            </p>}

            <div className="hop-question-scope__actions" aria-label={`Disposition de ${scopeLabel(sourceScope)}`}>
              <button type="button" className="hop-question-scope__button"
                aria-label={`${entry?.status === 'excluded' ? 'Réouvrir' : 'Garder'} la portée «${scopeLabel(sourceScope)}»`}
                disabled={readOnly || busy || draft.status === 'retained'}
                onClick={() => chooseDisposition(sourceScope, 'retained')}>
                {entry?.status === 'excluded' ? 'Réouvrir cette portée' : 'Garder cette portée'}
              </button>
              <button type="button" className="hop-question-scope__button is-subtle"
                aria-label={`Écarter la portée «${scopeLabel(sourceScope)}»`}
                disabled={readOnly || busy || draft.status === 'excluded' || entry?.status === 'excluded' && !draft.status}
                onClick={() => chooseDisposition(sourceScope, 'excluded')}>Écarter cette portée</button>
            </div>

            {isActive && <fieldset className="hop-question-scope__relations" disabled={readOnly || busy}>
              <legend>Portées associées</legend>
              <p>Une liaison reste une relation de question, pas une preuve de cause ou de calendrier.</p>
              {sourceScopes.filter(other => other.id !== sourceScope.id).map(other => {
                const checked = draft.relatedScopeIds.includes(other.id);
                const unavailable = !activeAfterDraft(other);
                return <label key={other.id} className={`hop-question-scope__relation${unavailable ? ' is-unavailable' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={unavailable && !checked}
                    aria-label={`Associer «${scopeLabel(sourceScope)}» à «${scopeLabel(other)}»`}
                    onChange={event => setRelatedScope(sourceScope, other.id, event.currentTarget.checked)} />
                  <span>{scopeLabel(other)}{unavailable && !checked ? ' · écartée' : ''}</span>
                </label>;
              })}
              {sourceScopes.length < 2 && <p>Aucune autre portée à associer.</p>}
            </fieldset>}

            <details className="hop-question-scope__references">
              <summary>Références et liens exacts</summary>
              <dl>
                <dt>Type et ID</dt><dd><code>{sourceScope.kind} · {sourceScope.id}</code></dd>
                <dt>Référence d’entrée</dt><dd><code>{entry?.reference ?? 'Aucune entrée historique'}</code></dd>
                <dt>IDs de portée reliés</dt><dd><code>{exactScope.relatedScopeIds.join(' · ') || 'Aucun'}</code></dd>
                <dt>Annotations liées</dt><dd><code>{exactScope.relatedCriterionIds.join(' · ') || 'Aucune'}</code></dd>
                <dt>Opérations liées</dt><dd><code>{exactScope.relatedOperationIds.join(' · ') || 'Aucune'}</code></dd>
                {coverage && <>
                  <dt>Options de couverture</dt><dd><code>{coverage.optionIds.join(' · ') || 'Aucune'}</code></dd>
                  <dt>Matières mentionnées</dt><dd><code>{coverage.materialIds.join(' · ') || 'Aucune'}</code></dd>
                  <dt>Emplois candidats</dt><dd><code>{coverage.uses.join(' · ') || 'Aucun'}</code></dd>
                </>}
              </dl>
            </details>
          </article>;
        })}
      </div>

      <label className="hop-question-scope__reason-label" htmlFor={reasonInputId}>Motif de la disposition</label>
      <Textarea id={reasonInputId} rows={2} value={reason} disabled={readOnly || busy}
        autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
        onChange={event => { clearFeedback(true); setReason(event.currentTarget.value); }}
        aria-describedby="hop-question-scope-reason-help" />
      <p id="hop-question-scope-reason-help" className="hop-question-scope__help">Ce motif accompagne chaque portée modifiée et la transition append-only.</p>

      {invalidLinks.length > 0 && <p className="hop-question-scope__error" role="alert">
        Une liaison active pointe vers une portée écartée. Retire cette liaison ou réouvre la portée liée avant d’enregistrer.
      </p>}

      <details className="hop-question-scope__references hop-question-scope__archive-reference">
        <summary>Référence de la lecture et du ledger</summary>
        <dl><dt>Lecture source</dt><dd><code>{current.contentReference}</code></dd>
          <dt>Ledger actif</dt><dd><code>{current.scopeLedger.reference}</code></dd></dl>
      </details>

      <div className="hop-question-scope__footer">
        <span>{actionDrafts.length} portée{actionDrafts.length === 1 ? '' : 's'} prête{actionDrafts.length === 1 ? '' : 's'} à réviser</span>
        <button type="submit" className="hop-question-scope__confirm" disabled={!canSubmit}>
          {busy ? 'Enregistrement…' : 'Enregistrer les dispositions'}
        </button>
      </div>
    </form>
  </section>;
}
