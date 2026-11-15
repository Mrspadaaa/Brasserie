import React, { useEffect, useRef, useState, lazy } from 'react';
import { useMobileLayout } from './useViewport';
import { MessageCircle, LoaderCircle } from 'lucide-react';
import { brewerJobs, useBrewerJobs, isBrewerWorking, brewerJobStatus, sameBrewerScope, type ClientBrewerJob } from '../services/brewerJobs';
import { BrewerChat as api } from '../services/brewerChat';
import { brewerLauncher, useBrewerDialogOpen } from '../services/brewerLauncher';
import { LazySurface } from './LazySurface';
const BrewerChat = lazy(() => import('./BrewerChat').then(module => ({ default: module.BrewerChat })));
import { Sheet } from './Sheet';
import { ConversationsBoite } from '../components/feuilles/ConversationsBoite';
import { brewerAppScreen } from '../../functions/src/brewerAppScreens';
import type { BrewerScope } from '../../functions/src/companionTypes';
import './brewer-navigation.css';

type Focus = { scope: BrewerScope; label: string; phase?: string };
const cleConversation = (j: ClientBrewerJob) => `${j.scope.kind === 'draft' ? 'recipe' : j.scope.kind}:${j.scope.id}`;
const useEnLigne = () => {
  const [en, setEn] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const maj = () => setEn(navigator.onLine !== false);
    window.addEventListener('online', maj); window.addEventListener('offline', maj);
    return () => { window.removeEventListener('online', maj); window.removeEventListener('offline', maj); };
  }, []);
  return en;
};
export function brewerConversations(jobs: ClientBrewerJob[]) {
  const groups: Array<{ latest: ClientBrewerJob; jobs: ClientBrewerJob[] }> = [];
  for (const job of [...jobs].sort((a, b) => b.createdAt - a.createdAt)) {
    const group = groups.find((item) => sameBrewerScope(item.latest.scope, job.scope));
    if (group) group.jobs.push(job);
    else groups.push({ latest: job, jobs: [job] });
  }
  return groups;
}

/**
 * Root inbox and conversations survive page navigation.
 *
 * ⚠️ Le compagnon n'a plus de bouton à lui : `FloatingActions` l'ouvre pour
 * tous les écrans, par l'événement `brewer-companion-open`. Ce composant garde
 * ce que le bouton ne peut pas porter — la boîte des conversations, et la
 * pastille d'activité qui suit une question en cours sur ordinateur.
 */
export function BrewerActivity({ context = brewerAppScreen('dashboard'), hideActivityPill = false, localOnly = false }: {
  context?: Focus;
  hideActivityPill?: boolean;
  localOnly?: boolean;
}) {
  const state = useBrewerJobs(), dialogOpen = useBrewerDialogOpen();
  const mobile = useMobileLayout();
  const [inbox, setInbox] = useState(false);
  const enLigne = useEnLigne();
  const [deleting, setDeleting] = useState(false), [notice, setNotice] = useState('');
  const [removal, setRemoval] = useState<{ job: ClientBrewerJob; operationId: string } | null>(null);
  const [focus, setFocus] = useState<Focus | null>(() => {
    const value = new URLSearchParams(location.search).get('companion');
    const match = /^(recipe|draft|batch|app):([\w-]{1,100})$/.exec(value ?? '');
    return match ? { scope: { kind: match[1] as BrewerScope['kind'], id: match[2] }, label: 'Ta conversation' } : null;
  });
  /* L'événement traverse l'arbre ; la portée, elle, doit rester celle de l'écran affiché. */
  const contextRef = useRef(context);
  contextRef.current = context;
  useEffect(() => {
    if (localOnly) {
      brewerJobs.stop();
      return;
    }
    void brewerJobs.start();
    const refresh = () => { if (document.visibilityState !== 'hidden') void brewerJobs.refresh(); };
    const showInbox = () => { setFocus(null); setInbox(true); void brewerJobs.refresh(); };
    // La fiche, l'assistant ou la feuille de brassin ouverts gardent la main sur
    // leur propre conversation : leurs brouillons et leurs retours y vivent.
    const showCompanion = () => { if (!brewerLauncher.open()) setFocus(contextRef.current); };
    window.addEventListener('brewer-inbox-open', showInbox);
    window.addEventListener('brewer-companion-open', showCompanion);
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
      window.removeEventListener('brewer-companion-open', showCompanion);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
      navigator.serviceWorker?.removeEventListener('message', open);
      brewerJobs.stop();
    };
  }, [localOnly]);
  const pending = state.jobs.filter(isBrewerWorking),
    unread = state.jobs.filter((j) => !j.readAt && ['done', 'error'].includes(j.status)),
    unconfirmed = state.jobs.filter((j) => j.sendError);
  const badge = unread.length
    ? `${unread.length} ${unread.length > 1 ? 'réponses à consulter' : unread[0].status === 'error' ? 'analyse à relancer' : 'réponse prête'}`
    : unconfirmed.length ? `${unconfirmed.length} envois à confirmer`
    : pending.length ? `${pending.length} ${pending.length > 1 ? 'questions en cours' : 'question en cours'}`
    : 'Mes conversations';
  if (localOnly)
    /* b1r : « hors connexion » se lit dans l'entrée Compagnon du + et au pied du rail, plus dans une pastille flottante. */
    return null;
  const conversations = brewerConversations(state.jobs);
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
    {!mobile && !hideActivityPill && !dialogOpen && !inbox && !focus &&
      (pending.length > 0 || unread.length > 0 || unconfirmed.length > 0) && <button type="button"
        className={`brewer-activity-pill${unread.length || unconfirmed.length ? ' has-answer' : ''}`}
        onClick={() => { setInbox(true); void brewerJobs.refresh(); }} aria-label={`Compagnon : ${badge}`}>
        {pending.length && !unread.length ? <LoaderCircle size={17} className="brewer-chat-spin" /> : <MessageCircle size={18} />}
        <span role="status">{badge}</span>
      </button>}
    <ConversationsBoite open={inbox} onClose={() => { if (!deleting) { setInbox(false); setRemoval(null); } }}
      lignes={conversations.map(({ latest: j, jobs }) => {
        const enCours = jobs.filter(isBrewerWorking).length;
        return {
          cle: cleConversation(j), label: j.label, question: j.question, createdAt: j.createdAt, kind: j.scope.kind, echanges: jobs.length,
          statut: enCours ? `${enCours} ${enCours > 1 ? 'questions en cours' : 'question en cours'}` : brewerJobStatus(j),
          enAttente: Boolean(j.sendError), selected: Boolean(removal && sameBrewerScope(removal.job.scope, j.scope))
        };
      })}
      enLigne={enLigne} erreurLien={state.connectionError} notice={notice} suppressionEnCours={deleting}
      onOuvrir={(cle) => { const j = conversations.find(g => cleConversation(g.latest) === cle)?.latest; if (!j) return; setInbox(false); setRemoval(null); if (!brewerLauncher.open(j.scope)) setFocus({ scope: j.scope, label: j.label, phase: j.scope.kind === 'app' ? j.label : undefined }); }}
      onChoisir={(cle) => { setNotice(''); const j = cle ? conversations.find(g => cleConversation(g.latest) === cle)?.latest : null; setRemoval(j ? { job: j, operationId: crypto.randomUUID() } : null); }}
      onConfirmer={() => void remove()}
      onIndice={() => setNotice('Glisse une conversation vers la gauche (au pointeur : survole-la), puis confirme ici.')} />
    {focus && <LazySurface fallback={<Sheet open title="Compagnon brasseur" onClose={() => setFocus(null)}><p role="status">Ouverture de la conversation…</p></Sheet>}><BrewerChat key={`${focus.scope.kind}:${focus.scope.id}`} {...focus} initialOpen hideLauncher onClose={() => {
      setFocus(null);
      const url = new URL(location.href);
      url.searchParams.delete('companion');
      window.history.replaceState(window.history.state, '', url);
    }} /></LazySurface>}
  </>;
}
