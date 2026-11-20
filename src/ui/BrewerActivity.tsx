import React, { useEffect, useRef, useState, lazy } from 'react';
import { useMobileLayout } from './useViewport';
import { MessageCircle, LoaderCircle, Trash2, Check, X, RotateCw, RotateCcw, MoreHorizontal, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import { brewerJobs, useBrewerJobs, isBrewerWorking, sameBrewerScope, type ClientBrewerJob } from '../services/brewerJobs';
import { BrewerNotifySwitch } from './BrewerNotifications';
import { BORNE_SERVEUR_S, NBSP, dureeTexte, estPlafondAtteint, etapeTexte, statutJob, statutsConversations, type StatutJob } from './companion/derive';
import './companion/limites.css';
import './companion/conversations.css';
import { BrewerChat as api } from '../services/brewerChat';
import { brewerLauncher, useBrewerDialogOpen } from '../services/brewerLauncher';
import { LazySurface } from './LazySurface';
const BrewerChat = lazy(() => import('./BrewerChat').then(module => ({ default: module.BrewerChat })));
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
      brewerJobs.stop();
      return;
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
  const [now, setNow] = useState(() => Date.now()), [menu, setMenu] = useState<string | null>(null);
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
    /* CT4-A-17 : la pastille ne flotte plus au milieu du contenu (elle couvrait « Fournisseurs, matériel », la barre « Charges fixes », les Papiers) :
       posée sur la barre d'onglets, au coin bas gauche, courte ; le texte entier reste dit au lecteur d'écran et au survol. */
    /* CT4C-7 (critique tour 4) : même à 102 × 16 px, la pastille couvrait la ligne « libre 3 721,60 » de la carte En caisse. Elle devient un point de 10 px au coin bas gauche, sur la barre, hors de toute colonne de texte ; le sens reste dit au survol et au lecteur d'écran. */
    return <p role="status" title="Compagnon hors connexion · mode local" data-compagnon-local className="pointer-events-none fixed bottom-[calc(var(--main-navigation-height,2.5rem)+2px)] left-1 z-30 whitespace-nowrap flex h-2.5 w-2.5 items-center justify-center rounded-full bg-cave-850/90"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-attention" /><span className="sr-only">Compagnon hors connexion · mode local</span></p>;
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
  const fermer = () => { if (!deleting) { setInbox(false); setRemoval(null); setZero(null); setMenu(null); } };
  const repartir = async () => {
    if (!zero || deleting) return;
    setDeleting(true);
    setNotice('');
    try {
      const { generation } = await api.reset(zero.job.scope, zero.job.generation, zero.operationId);
      brewerJobs.forget(zero.job.scope, generation);
      setZero(null); setInbox(false); setMenu(null);
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
  return <>
    {!mobile && !hideActivityPill && !dialogOpen && !inbox && !focus &&
      (pending.length > 0 || unread.length > 0 || unconfirmed.length > 0) && <button type="button"
        className={`brewer-activity-pill${unread.length || unconfirmed.length ? ' has-answer' : ''}`}
        onClick={() => { setInbox(true); void brewerJobs.refresh(); }} aria-label={`Compagnon : ${badge}`}>
        {pending.length && !unread.length ? <LoaderCircle size={17} className="brewer-chat-spin" /> : <MessageCircle size={18} />}
        <span role="status">{badge}</span>
      </button>}
    <Sheet open={inbox} onClose={fermer} dismissible={!deleting}
      title="Mes conversations" className="cmp-conv-sheet"
      footer={<div className="cmp-lx"><div className="cmp-pied cmp-pied-fixe">
        <span className="cmp-pied-t">Tes questions continuent pendant que tu brasses.</span>
        <button type="button" className="cmp-btn cmp-p" disabled={deleting}
          onClick={() => { setInbox(false); setRemoval(null); setZero(null); setMenu(null); if (!brewerLauncher.open()) setFocus(contextRef.current); }}>
          <Plus className="cmp-i" size={16} aria-hidden="true" />Nouvelle question</button>
      </div></div>}>
      <div className="cmp-lx">
        <div className="cmp-tete-l">
          <button type="button" className="cmp-retour" aria-label="Retour au fil" disabled={deleting} onClick={fermer}><ArrowLeft className="cmp-i" size={20} aria-hidden="true" /></button>
          <b aria-hidden="true">Mes conversations</b>
        </div>
        {courant && !zero && <button type="button" className="cmp-ligne-btn" disabled={deleting}
          onClick={() => { setNotice(''); setRemoval(null); setMenu(null); setZero({ job: courant.latest, operationId: crypto.randomUUID() }); }}>
          <RotateCcw className="cmp-i" aria-hidden="true" /><span>Repartir à zéro · nouvelle conversation</span><ChevronRight className="cmp-i" aria-hidden="true" /></button>}
        {zero && <div className="cmp-carte"><div className="cmp-confirme">
          <p><b>Repartir à zéro ?</b> Les échanges de « {zero.job.label} » seront effacés et une nouvelle conversation s’ouvrira. Les analyses en cours seront arrêtées.</p>
          <div className="cmp-act"><button type="button" className="cmp-btn cmp-g" disabled={deleting} onClick={() => setZero(null)}>Annuler</button>
            <button type="button" className="cmp-btn cmp-d-plein" disabled={deleting} onClick={() => void repartir()}>{deleting ? 'Remise à zéro…' : 'Repartir à zéro'}</button></div>
        </div></div>}
        {state.connectionError && <p role="status" className="cmp-note">{state.connectionError}</p>}
        {notice && <p role="status" className="cmp-note">{notice}</p>}
        {!state.jobs.length && <p className="cmp-vide">Aucune conversation. Le bouton + ouvre le compagnon sur l’écran en cours.</p>}
        {state.jobs.length > 0 && (() => {
          const s = statutsConversations(state.jobs);
          const parts = [
            { n: s.prets, cls: 'cmp-pv', texte: s.prets > 1 ? 'prêtes' : 'prête' },
            { n: s.enCours, cls: 'cmp-pa', texte: 'en cours' },
            { n: s.echecs, cls: 'cmp-pr', texte: 'à relancer' }
          ];
          return <div className="cmp-carte cmp-resume">
            <div className="cmp-resume-b" role="img" aria-label={parts.map((p) => `${p.n} ${p.texte}`).join(', ')}>
              {parts.filter((p) => p.n > 0).map((p) => <i key={p.cls} className={p.cls} style={{ flex: p.n }} />)}
            </div>
            <div className="cmp-resume-l">
              {parts.map((p) => <span key={p.cls}><i className={`cmp-pt ${p.cls}`} /><span className="cmp-n">{p.n}</span>{NBSP}{p.texte}</span>)}
            </div>
          </div>;
        })()}
        {brewerConversations(state.jobs).filter(({ jobs }) => jobs.some((j) => j.status !== 'cancelled')).map(({ latest: j, jobs }) => {
          const cle = `${j.scope.kind === 'draft' ? 'recipe' : j.scope.kind}:${j.scope.id}`;
          const selected = removal && sameBrewerScope(removal.job.scope, j.scope);
          const l = ligneStatut(jobs, now);
          const ouvert = menu === cle || Boolean(selected);
          const finances = j.scope.kind === 'app' && /financ/i.test(j.scope.id);
          return <div className={`cmp-conv cmp-c-${l.statut}${finances ? ' cmp-c-fin' : ''}${ouvert ? ' cmp-ouvert' : ''}`} key={cle}>
            <button type="button" className="cmp-conv-ouvre" disabled={deleting}
              onClick={() => { setInbox(false); setRemoval(null); setMenu(null); if (!brewerLauncher.open(j.scope)) setFocus({ scope: j.scope, label: j.label, phase: j.scope.kind === 'app' ? j.label : undefined }); }}>
              {l.statut === 'cours'
                ? <span className="cmp-etat cmp-anneau" role="img" aria-label={`En cours, ${dureeTexte(l.secondes)} · ${l.etape}`}
                    style={{ ['--tour' as string]: `${Math.min(100, Math.max(6, (l.secondes / BORNE_SERVEUR_S) * 100))}%` } as React.CSSProperties}><i /></span>
                : <span className="cmp-etat" aria-hidden="true">{l.statut === 'pret' ? <Check className="cmp-i" /> : <X className="cmp-i" />}</span>}
              <span className="cmp-conv-t"><b>{j.label}</b><span>{j.question}</span><small>{l.texte}</small></span>
            </button>
            {l.statut === 'echec' && !j.unsupportedReadOnly && <button type="button" className="cmp-btn cmp-s" disabled={deleting}
              aria-label={`Relancer la conversation ${j.label}`} onClick={() => { if (j.sendError) brewerJobs.retry(j); else brewerJobs.retrySaved(j); }}>
              <RotateCw className="cmp-i" aria-hidden="true" />Relancer</button>}
            <button type="button" className="cmp-ic" aria-label={`Plus d’actions : ${j.label}`} aria-expanded={ouvert} disabled={deleting}
              onClick={() => { setNotice(''); setRemoval(null); setMenu(menu === cle ? null : cle); }}><MoreHorizontal className="cmp-i" aria-hidden="true" /></button>
            {menu === cle && !selected && <div className="cmp-menu">
              <button type="button" className="cmp-btn cmp-g cmp-suppr" aria-label={`Supprimer la conversation ${j.label}`} disabled={deleting}
                onClick={() => { setNotice(''); setRemoval({ job: j, operationId: crypto.randomUUID() }); }}>
                <Trash2 className="cmp-i" aria-hidden="true" />Supprimer</button>
            </div>}
            {selected && <div className="cmp-confirme">
              <p>Supprimer les échanges de « {j.label} » ? Les analyses en cours seront arrêtées.</p>
              <div className="cmp-act"><button type="button" className="cmp-btn cmp-g" disabled={deleting} onClick={() => setRemoval(null)}>Annuler</button>
                <button type="button" className="cmp-btn cmp-d-plein" disabled={deleting} onClick={() => void remove()}>{deleting ? 'Suppression…' : 'Supprimer les échanges'}</button></div>
            </div>}
          </div>;
        })}
        <BrewerNotifySwitch label="Me notifier à chaque réponse" />
      </div>
    </Sheet>
    {focus && <LazySurface fallback={<Sheet open title="Compagnon" onClose={() => setFocus(null)}><p role="status">Ouverture de la conversation…</p></Sheet>}><BrewerChat key={`${focus.scope.kind}:${focus.scope.id}`} {...focus} initialOpen hideLauncher onClose={() => {
      setFocus(null);
      const url = new URL(location.href);
      url.searchParams.delete('companion');
      window.history.replaceState(window.history.state, '', url);
    }} /></LazySurface>}
  </>;
}
