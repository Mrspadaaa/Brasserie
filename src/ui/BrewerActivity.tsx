import React, { useEffect, useState } from 'react';
import { MessageCircle, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { brewerJobs, useBrewerJobs, isBrewerWorking, brewerJobStatus, sameBrewerScope, type ClientBrewerJob } from '../services/brewerJobs';
import { BrewerChat as api } from '../services/brewerChat';
import { brewerLauncher, useBrewerDialogOpen } from '../services/brewerLauncher';
import { BrewerChat } from './BrewerChat';
import { Sheet } from './Sheet';
import { brewerAppScreen } from '../../functions/src/brewerAppScreens';
import type { BrewerScope } from '../../functions/src/companionTypes';
import './brewer-navigation.css';

type Focus = { scope: BrewerScope; label: string; phase?: string };
export function brewerConversations(jobs: ClientBrewerJob[]) {
  const groups: Array<{ latest: ClientBrewerJob; jobs: ClientBrewerJob[] }> = [];
  for (const job of [...jobs].sort((a, b) => b.createdAt - a.createdAt)) {
    const group = groups.find((item) => sameBrewerScope(item.latest.scope, job.scope));
    if (group) group.jobs.push(job);
    else groups.push({ latest: job, jobs: [job] });
  }
  return groups;
}

/** Root inbox and contextual shortcut survive page navigation. */
export function BrewerActivity({ context = brewerAppScreen('dashboard'), onQuickAction }: {
  context?: Focus;
  onQuickAction?: () => void;
}) {
  const state = useBrewerJobs(), dialogOpen = useBrewerDialogOpen();
  const [inbox, setInbox] = useState(false);
  const [deleting, setDeleting] = useState(false), [notice, setNotice] = useState('');
  const [removal, setRemoval] = useState<{ job: ClientBrewerJob; operationId: string } | null>(null);
  const [focus, setFocus] = useState<Focus | null>(() => {
    const value = new URLSearchParams(location.search).get('companion');
    const match = /^(recipe|draft|batch|app):([\w-]{1,100})$/.exec(value ?? '');
    return match ? { scope: { kind: match[1] as BrewerScope['kind'], id: match[2] }, label: 'Ta conversation' } : null;
  });
  useEffect(() => {
    void brewerJobs.start();
    const refresh = () => { if (document.visibilityState !== 'hidden') void brewerJobs.refresh(); };
    const showInbox = () => { setFocus(null); setInbox(true); void brewerJobs.refresh(); };
    window.addEventListener('brewer-inbox-open', showInbox);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    const open = (e: MessageEvent) => {
      if (e.data?.kind !== 'open-companion') return;
      const { scopeKind, scopeId } = e.data;
      if (['recipe', 'draft', 'batch', 'app'].includes(scopeKind) && /^[\w-]{1,100}$/.test(scopeId))
        setFocus({ scope: { kind: scopeKind, id: scopeId }, label: 'Ta conversation' });
    };
    navigator.serviceWorker?.addEventListener('message', open);
    return () => {
      window.removeEventListener('brewer-inbox-open', showInbox);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
      navigator.serviceWorker?.removeEventListener('message', open);
      brewerJobs.stop();
    };
  }, []);
  const pending = state.jobs.filter(isBrewerWorking),
    unread = state.jobs.filter((j) => !j.readAt && ['done', 'error'].includes(j.status)),
    unconfirmed = state.jobs.filter((j) => j.sendError);
  const badge = unread.length
    ? `${unread.length} ${unread.length > 1 ? 'réponses à consulter' : unread[0].status === 'error' ? 'analyse à relancer' : 'réponse prête'}`
    : unconfirmed.length ? `${unconfirmed.length} envois à confirmer`
    : pending.length ? `${pending.length} ${pending.length > 1 ? 'questions en cours' : 'question en cours'}`
    : 'Mes conversations';
  const remove = async () => {
    if (!removal || deleting) return;
    setDeleting(true);
    setNotice('');
    try {
      const { generation } = await api.reset(removal.job.scope, removal.job.generation, removal.operationId);
      brewerJobs.forget(removal.job.scope, generation);
      setRemoval(null);
      setNotice('Conversation supprimée.');
    } catch {
      setNotice('Suppression non confirmée. Vérifie la connexion et réessaie ; la conversation reste affichée.');
    } finally { setDeleting(false); }
  };
  return <>
    {!dialogOpen && !inbox && !focus && <>
      <button type="button" className="brewer-global-plus bg-ebc-straw text-cave-950" aria-label="Ouvrir le compagnon brasseur" title="Compagnon brasseur"
        onClick={() => { if (!brewerLauncher.open()) setFocus(context); }}
        onContextMenu={onQuickAction ? (e) => { e.preventDefault(); onQuickAction(); } : undefined}>
        <Plus size={28} strokeWidth={2.5} />
      </button>
      {state.jobs.length > 0 && <button type="button"
        className={`brewer-activity-pill${unread.length || unconfirmed.length ? ' has-answer' : ''}`}
        onClick={() => { setInbox(true); void brewerJobs.refresh(); }} aria-label={`Compagnon : ${badge}`}>
        {pending.length && !unread.length ? <LoaderCircle size={17} className="brewer-chat-spin" /> : <MessageCircle size={18} />}
        <span role="status">{badge}</span>
      </button>}
    </>}
    <Sheet open={inbox} onClose={() => { if (!deleting) { setInbox(false); setRemoval(null); } }} dismissible={!deleting}
      title="Mes conversations" subtitle="Tes questions continuent pendant que tu brasses">
      <div className="brewer-activity-list">
        {state.connectionError && <p role="status">{state.connectionError}</p>}
        {notice && <p role="status">{notice}</p>}
        {!state.jobs.length && <p className="brewer-inbox-empty">Aucune conversation. Le bouton + ouvre le compagnon sur l’écran en cours.</p>}
        {brewerConversations(state.jobs).map(({ latest: j, jobs }) => {
          const selected = removal && sameBrewerScope(removal.job.scope, j.scope);
          const working = jobs.filter(isBrewerWorking).length;
          return <div className="brewer-conversation" key={`${j.scope.kind === 'draft' ? 'recipe' : j.scope.kind}:${j.scope.id}`}>
            <div className="brewer-conversation-row">
              <button type="button" className="brewer-conversation-open" disabled={deleting}
                onClick={() => { setInbox(false); setRemoval(null); if (!brewerLauncher.open(j.scope)) setFocus({ scope: j.scope, label: j.label, phase: j.scope.kind === 'app' ? j.label : undefined }); }}>
                <strong>{j.label}</strong><span>{j.question}</span>
                <small>{working ? `${working} ${working > 1 ? 'questions en cours' : 'question en cours'}` : brewerJobStatus(j)}{jobs.length > 1 ? ` · ${jobs.length} échanges` : ''}</small>
              </button>
              <button type="button" className="brewer-conversation-delete" aria-label={`Supprimer la conversation ${j.label}`} disabled={deleting}
                onClick={() => { setNotice(''); setRemoval({ job: j, operationId: crypto.randomUUID() }); }}><Trash2 size={19} /></button>
            </div>
            {selected && <div className="brewer-conversation-confirm">
              <p>Supprimer les échanges de « {j.label} » ? Les analyses en cours seront arrêtées.</p>
              <div><button type="button" disabled={deleting} onClick={() => setRemoval(null)}>Annuler</button>
                <button type="button" className="is-destructive" disabled={deleting} onClick={() => void remove()}>{deleting ? 'Suppression…' : 'Supprimer les échanges'}</button></div>
            </div>}
          </div>;
        })}
      </div>
    </Sheet>
    {focus && <BrewerChat key={`${focus.scope.kind}:${focus.scope.id}`} {...focus} initialOpen hideLauncher onClose={() => {
      setFocus(null);
      const url = new URL(location.href);
      url.searchParams.delete('companion');
      window.history.replaceState(window.history.state, '', url);
    }} />}
  </>;
}
