import React, { useEffect, useState } from 'react';
import { MessageCircle, LoaderCircle } from 'lucide-react';
import {
  brewerJobs,
  useBrewerJobs,
  isBrewerWorking,
  brewerJobStatus
} from '../services/brewerJobs';
import { BrewerChat } from './BrewerChat';
import { Sheet } from './Sheet';
import type { BrewerScope } from '../../functions/src/companionTypes';

/** Mounted at the application root: navigating away from a brew day never drops its inbox. */
export function BrewerActivity() {
  const state = useBrewerJobs();
  const [inbox, setInbox] = useState(false);
  const [focus, setFocus] = useState<{ scope: BrewerScope; label: string } | null>(() => {
    const value = new URLSearchParams(location.search).get('companion');
    const match = /^(recipe|draft|batch):([\w-]{1,100})$/.exec(value ?? '');
    return match
      ? { scope: { kind: match[1] as BrewerScope['kind'], id: match[2] }, label: 'Ta conversation' }
      : null;
  });
  useEffect(() => {
    void brewerJobs.start();
    const refresh = () => {
      if (document.visibilityState !== 'hidden') void brewerJobs.refresh();
    };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    const open = (e: MessageEvent) => {
      if (e.data?.kind !== 'open-companion') return;
      const { scopeKind, scopeId } = e.data;
      if (['recipe', 'draft', 'batch'].includes(scopeKind) && /^[\w-]{1,100}$/.test(scopeId))
        setFocus({ scope: { kind: scopeKind, id: scopeId }, label: 'Ta conversation' });
    };
    navigator.serviceWorker?.addEventListener('message', open);
    return () => {
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
      navigator.serviceWorker?.removeEventListener('message', open);
      brewerJobs.stop();
    };
  }, []);
  const pending = state.jobs.filter(isBrewerWorking),
    unread = state.jobs.filter((j) => !j.readAt && ['done', 'error'].includes(j.status));
  const unconfirmed = state.jobs.filter((j) => j.sendError);
  const badge = unread.length
    ? `${unread.length} ${unread.length > 1 ? 'réponses à consulter' : unread[0].status === 'error' ? 'analyse à relancer' : 'réponse prête'}`
    : unconfirmed.length
      ? `${unconfirmed.length} ${unconfirmed.length > 1 ? 'envois à confirmer' : 'envoi à confirmer'}`
      : `${pending.length} ${pending.length > 1 ? 'questions en cours' : 'question en cours'}`;
  return (
    <>
      {(pending.length > 0 || unread.length > 0 || unconfirmed.length > 0) && (
        <button
          type="button"
          className={`brewer-activity-pill${unread.length || unconfirmed.length ? ' has-answer' : ''}`}
          onClick={() => setInbox(true)}
          aria-label={`Compagnon : ${badge}`}
        >
          {unread.length ? (
            <MessageCircle size={18} />
          ) : (
            <LoaderCircle size={17} className="brewer-chat-spin" />
          )}
          <span role="status">{badge}</span>
        </button>
      )}
      <Sheet
        open={inbox}
        onClose={() => setInbox(false)}
        title="Ton compagnon"
        subtitle="Tes questions continuent pendant que tu brasses"
      >
        <div className="brewer-activity-list">
          {state.connectionError && <p role="status">{state.connectionError}</p>}
          {[...state.jobs].reverse().map((j) => (
            <button
              type="button"
              key={j.operationId}
              onClick={() => {
                setInbox(false);
                setFocus({ scope: j.scope, label: j.label });
              }}
            >
              <strong>{j.label}</strong>
              <span>{j.question}</span>
              <small>
                {brewerJobStatus(j)}
                {j.readAt ? ' · consultée' : ''}
              </small>
            </button>
          ))}
        </div>
      </Sheet>
      {focus && (
        <BrewerChat
          key={`${focus.scope.kind}:${focus.scope.id}`}
          scope={focus.scope}
          label={focus.label}
          initialOpen
          hideLauncher
          onClose={() => {
            setFocus(null);
            const url = new URL(location.href);
            url.searchParams.delete('companion');
            window.history.replaceState(window.history.state, '', url);
          }}
        />
      )}
    </>
  );
}
