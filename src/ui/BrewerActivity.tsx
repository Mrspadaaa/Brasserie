import React, { useEffect, useRef, useState, lazy } from 'react';
import { useMobileLayout } from './useViewport';
import { MessageCircle, LoaderCircle, Trash2, Check, X, RotateCw, RotateCcw, MoreHorizontal, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import { brewerJobs, useBrewerJobs, isBrewerWorking, brewerJobStatus, sameBrewerScope, type ClientBrewerJob } from '../services/brewerJobs';
import { BrewerNotifySwitch } from './BrewerNotifications';
import { BORNE_SERVEUR_S, NBSP, dureeTexte, estPlafondAtteint, etapeTexte, statutJob, statutsConversations, type StatutJob } from './companion/derive';
import './companion/limites.css';
import './companion/conversations.css';
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

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** Ce que la ligne d'une conversation dit en une demi-ligne : prête, en cours (chrono), à relancer. Rien d'inventé : seuls le statut et l'horloge du job parlent. */
function ligneStatut(jobs: ClientBrewerJob[], now: number): { statut: StatutJob; texte: string; secondes: number; etape: string } {
  const latest = jobs[0];
  const travail = jobs.filter(isBrewerWorking);
  const statut: StatutJob = travail.length ? 'cours' : statutJob(latest);
  const debut = Math.min(...travail.map((j) => j.startedAt ?? j.createdAt));
  const secondes = travail.length ? Math.max(0, Math.floor((now - debut) / 1000)) : 0;
  const echanges = jobs.length > 1 ? ` · ${jobs.length} échanges` : '';
  if (statut === 'cours')
    return {
      statut,
      secondes,
      etape: latest.sending ? 'Envoi de ta question' : etapeTexte(latest.stage),
      texte: `${travail.length > 1 ? pluriel(travail.length, 'question', 'questions') + ' en cours' : latest.sending ? 'Envoi' : 'En cours'} · ${dureeTexte(secondes)}${echanges}`
    };
  if (statut === 'echec') {
    // « rien compté » seulement quand le budget a refusé l'appel avant son départ ; les autres échecs : le serveur ne dit pas si un coût a été compté.
    const refuse = !latest.sendError && estPlafondAtteint(latest.error?.code);
    return { statut, secondes, etape: '', texte: `${latest.sendError ? 'Envoi à confirmer' : refuse ? 'Échec · rien compté' : 'Échec · à relancer'}${echanges}` };
  }
  // Le niveau du verdict vient du tour gardé sur l'appareil ; sans lui (réponse jamais ouverte ici), pas de niveau inventé.
  const niveau = latest.turn?.advice?.level;
  return { statut, secondes, etape: '', texte: `Réponse prête${niveau === 'attention' || niveau === 'urgent' ? ` · ${niveau}` : ''}${echanges}` };
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
  /* « Repartir à zéro » : la conversation de l'écran en cours, en attente de confirmation. */
  const [zero, setZero] = useState<{ job: ClientBrewerJob; operationId: string } | null>(null);
  const [origine, setOrigine] = useState<BrewerScope | null>(null);
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
      /* Hors connexion (?dev-local) : pas de relevé, mais « Mes conversations » s'ouvre quand même et dit l'état (d3p2, vue 8). */
      brewerJobs.stop();
      const showLocalInbox = () => { setFocus(null); setInbox(true); };
      window.addEventListener('brewer-inbox-open', showLocalInbox);
      return () => window.removeEventListener('brewer-inbox-open', showLocalInbox);
    }
    void brewerJobs.start();
    const refresh = () => { if (document.visibilityState !== 'hidden') void brewerJobs.refresh(); };
    // Le compagnon peut dire de quelle conversation il vient (`detail.scope`) : c'est celle que « Repartir à zéro » efface.
    const showInbox = (e?: Event) => {
      const scope = (e as CustomEvent<{ scope?: BrewerScope } | undefined> | undefined)?.detail?.scope;
      setOrigine(scope && typeof scope.id === 'string' ? scope : null);
      setFocus(null); setInbox(true); void brewerJobs.refresh();
    };
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
  /* Le chrono des questions en cours ne tourne que feuille ouverte. */
  const [now, setNow] = useState(() => Date.now());
  const working = pending.length > 0;
  useEffect(() => {
    if (!inbox || !working) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [inbox, working]);
  const badge = unread.length
    ? `${unread.length} ${unread.length > 1 ? 'réponses à consulter' : unread[0].status === 'error' ? 'analyse à relancer' : 'réponse prête'}`
    : unconfirmed.length ? `${unconfirmed.length} envois à confirmer`
    : pending.length ? `${pending.length} ${pending.length > 1 ? 'questions en cours' : 'question en cours'}`
    : 'Mes conversations';
  if (localOnly)
    /* b1r : « hors connexion » se lit dans l'entrée Compagnon du + et au pied du rail, plus dans une pastille flottante ;
       la boîte des conversations, elle, s'ouvre et dit « Compagnon hors connexion · mode local » (d3p2, vue 8). */
    return <ConversationsBoite open={inbox} onClose={() => setInbox(false)} lignes={[]} enLigne={false} erreurLien="" notice="" suppressionEnCours={false}
      onOuvrir={() => undefined} onChoisir={() => undefined} onConfirmer={() => undefined} onIndice={() => undefined} />;
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
  const fermer = () => { if (!deleting) { setInbox(false); setRemoval(null); setZero(null); } };
  const repartir = async () => {
    if (!zero || deleting) return;
    setDeleting(true);
    setNotice('');
    try {
      const { generation } = await api.reset(zero.job.scope, zero.job.generation, zero.operationId);
      brewerJobs.forget(zero.job.scope, generation);
      setZero(null); setInbox(false);
      if (!brewerLauncher.open()) setFocus(contextRef.current);
    } catch {
      setNotice('Remise à zéro non confirmée. Vérifie la connexion et réessaie ; la conversation reste affichée.');
    } finally { setDeleting(false); }
  };
  /* La conversation que « Repartir à zéro » efface : celle d'où l'on vient (portée dite par le compagnon dans l'événement), sinon
     celle de l'écran ; sans l'une ni l'autre, la ligne n'est pas montrée (jamais une conversation au hasard). La confirmation la nomme. */
  const vivantes = brewerConversations(state.jobs).filter(({ jobs }) => jobs.some((j) => j.status !== 'cancelled'));
  const courant = vivantes.find(({ latest }) => origine && sameBrewerScope(latest.scope, origine))
    ?? vivantes.find(({ latest }) => sameBrewerScope(latest.scope, context.scope));
  const statutsResume = statutsConversations(state.jobs);
  const partsResume = [
    { n: statutsResume.prets, cls: 'cmp-pv', texte: statutsResume.prets > 1 ? 'prêtes' : 'prête' },
    { n: statutsResume.enCours, cls: 'cmp-pa', texte: 'en cours' },
    { n: statutsResume.echecs, cls: 'cmp-pr', texte: 'à relancer' }
  ];
  return <>
    {!mobile && !hideActivityPill && !dialogOpen && !inbox && !focus &&
      (pending.length > 0 || unread.length > 0 || unconfirmed.length > 0) && <button type="button"
        className={`brewer-activity-pill${unread.length || unconfirmed.length ? ' has-answer' : ''}`}
        onClick={() => { setInbox(true); void brewerJobs.refresh(); }} aria-label={`Compagnon : ${badge}`}>
        {pending.length && !unread.length ? <LoaderCircle size={17} className="brewer-chat-spin" /> : <MessageCircle size={18} />}
        <span role="status">{badge}</span>
      </button>}
    <ConversationsBoite open={inbox} onClose={fermer}
      lignes={conversations.map(({ latest: j, jobs }) => {
        const l = ligneStatut(jobs, now);
        return {
          cle: cleConversation(j), label: j.label, question: j.question, createdAt: j.createdAt, kind: j.scope.kind, echanges: jobs.length,
          statut: l.texte, enAttente: Boolean(j.sendError), selected: Boolean(removal && sameBrewerScope(removal.job.scope, j.scope)),
          relancer: l.statut === 'echec' && !j.unsupportedReadOnly ? () => { if (j.sendError) brewerJobs.retry(j); else brewerJobs.retrySaved(j); } : undefined
        };
      })}
      enLigne={enLigne} erreurLien={state.connectionError} notice={notice} suppressionEnCours={deleting}
      onOuvrir={(cle) => { const j = conversations.find(g => cleConversation(g.latest) === cle)?.latest; if (!j) return; setInbox(false); setRemoval(null); setZero(null); if (!brewerLauncher.open(j.scope)) setFocus({ scope: j.scope, label: j.label, phase: j.scope.kind === 'app' ? j.label : undefined }); }}
      onChoisir={(cle) => { setNotice(''); setZero(null); const j = cle ? conversations.find(g => cleConversation(g.latest) === cle)?.latest : null; setRemoval(j ? { job: j, operationId: crypto.randomUUID() } : null); }}
      onConfirmer={() => void remove()}
      onIndice={() => setNotice('Glisse une conversation vers la gauche (au pointeur : survole-la), puis confirme ici.')}
      avant={<div className="cmp-lx">
        {state.jobs.length > 0 && <div className="cmp-carte cmp-resume">
          <div className="cmp-resume-b" role="img" aria-label={partsResume.map((x) => `${x.n} ${x.texte}`).join(', ')}>
            {partsResume.filter((x) => x.n > 0).map((x) => <i key={x.cls} className={x.cls} style={{ flex: x.n }} />)}
          </div>
          <div className="cmp-resume-l">
            {partsResume.map((x) => <span key={x.cls}><i className={`cmp-pt ${x.cls}`} /><span className="cmp-n">{x.n}</span>{NBSP}{x.texte}</span>)}
          </div>
        </div>}
        {courant && !zero && !removal && <button type="button" className="cmp-ligne-btn" disabled={deleting}
          onClick={() => { setNotice(''); setRemoval(null); setZero({ job: courant.latest, operationId: crypto.randomUUID() }); }}>
          <RotateCcw className="cmp-i" aria-hidden="true" /><span>Repartir à zéro · nouvelle conversation</span><ChevronRight className="cmp-i" aria-hidden="true" /></button>}
        {zero && <div className="cmp-carte"><div className="cmp-confirme">
          <p><b>Repartir à zéro ?</b> Les échanges de « {zero.job.label} » seront effacés et une nouvelle conversation s’ouvrira. Les analyses en cours seront arrêtées.</p>
          <div className="cmp-act"><button type="button" className="cmp-btn cmp-g" disabled={deleting} onClick={() => setZero(null)}>Annuler</button>
            <button type="button" className="cmp-btn cmp-d-plein" disabled={deleting} onClick={() => void repartir()}>{deleting ? 'Remise à zéro…' : 'Repartir à zéro'}</button></div>
        </div></div>}
      </div>}
      apres={<div className="cmp-lx"><BrewerNotifySwitch label="Me notifier à chaque réponse" /></div>} />
    {focus && <LazySurface fallback={<Sheet open title="Compagnon brasseur" onClose={() => setFocus(null)}><p role="status">Ouverture de la conversation…</p></Sheet>}><BrewerChat key={`${focus.scope.kind}:${focus.scope.id}`} {...focus} initialOpen hideLauncher onClose={() => {
      setFocus(null);
      const url = new URL(location.href);
      url.searchParams.delete('companion');
      window.history.replaceState(window.history.state, '', url);
    }} /></LazySurface>}
  </>;
}
