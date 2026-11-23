/**
 * Les étapes de la lecture d'un lien (IA-ETAPES-VISIBLES, CARNET-ETAPES-DENSE ; son choix écran par écran : CHOIX.md, D448).
 *  - Début, le lien vient d'être collé : v05 + v06 (la vignette en attente, « lien collé à 14:02 », les six étapes, Replier, 20 à 35 s) ;
 *  - Milieu, des étapes faites dont une douteuse : v03 (« Lecture · 3 sur 6 », la barre par étape, chaque étape avec ce qu'elle a lu) ;
 *  - Barre repliée, l'app peut se fermer : v01, plus compacte (une ligne au-dessus du champ, `BarreLecture`) ;
 *  - Fin, retrouvée à la réouverture : v01, v03, v05 fusionnées (« Lu pendant que l'app était fermée · 34 s », l'article, ce qui reste
 *    douteux ou absent avec son geste, « 6 étapes sur 6 · lu en 34 s » qui déplie les contrôles) ;
 *  - Échec, lien introuvable : base + v03 (« Lien introuvable · arrêté à 1 sur 6 », rien d'inventé, Escalader, Autre lien, Compléter, Retirer).
 * Tout est plus serré que ses maquettes (« ça manque un peu de compact ») : une ligne d'étape tient sur 24 px, la barre repliée sur 32 px
 * (docs/ui-compacte.md, mesuré par scripts/controles/controle-etapes-dense.mjs). Classes préfixées `cnl-` (L26).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRightToLine, Check, ChevronDown, ChevronUp, CircleAlert, CircleCheck, CircleDashed, CircleMinus, CircleX, Link2, LoaderCircle, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import { compterEtapes, duree, lignesEtapes, type LigneEtape, type StatutVu } from '../../domain/carnets/lecture';
import type { LectureEnCours } from './rangement';
import { montant, type ArticleV } from './EtatIA';
import { boutonEscalader, type Relecture } from './lectureRegles';
import './carnets.css';
import './lecture-lien.css';

/** L'horloge de la lecture : une seconde, tant qu'elle tourne. */
function useMaintenant(actif: boolean): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!actif) return;
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, [actif]);
  return t;
}

const MOT: Record<StatutVu, string> = {
  trouve: 'trouvé', douteux: 'douteux', absent: 'absent', echec: 'non lue', 'en-cours': 'en cours', 'a-faire': 'à faire', 'pas-lancee': 'pas lancée'
};

function Icone({ s }: { s: StatutVu }) {
  const p = { size: 16, 'aria-hidden': true } as const;
  if (s === 'trouve') return <CircleCheck {...p} className="cnl-ico" />;
  if (s === 'douteux') return <CircleAlert {...p} className="cnl-ico" />;
  if (s === 'absent') return <CircleMinus {...p} className="cnl-ico" />;
  if (s === 'echec') return <CircleX {...p} className="cnl-ico" />;
  if (s === 'en-cours') return <LoaderCircle {...p} className="cnl-ico cnl-tourne" />;
  return <CircleDashed {...p} className="cnl-ico" />;
}

/** « gastro-lueftung.de/fr/hotte-murale… » : le lien sans schéma ni `www.`. */
function lienLisible(url: string): string {
  try { const u = new URL(url); return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`; } catch { return url; }
}
const domaineDe = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
const heure = (ms?: number) => (ms ? new Date(ms).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }) : null);

/** La barre par étape (v03) : un segment par étape, sa couleur dit son état ; lue d'un coup d'œil, sans texte. */
function Segments({ lignes }: { lignes: readonly LigneEtape[] }) {
  return (
    <span className="cnl-segments" data-booster="segments-etapes" role="img" aria-label={`${compterEtapes(lignes).faites} étapes faites sur ${lignes.length}`}>
      {lignes.map(l => <i key={l.cle} data-statut={l.statut} />)}
    </span>
  );
}

/** Les comptes de la barre repliée (v01) : trouvées, douteuses, absentes. */
function Comptes({ lignes }: { lignes: readonly LigneEtape[] }) {
  const c = compterEtapes(lignes);
  return (
    <span className="cnl-comptes" aria-label={`${c.trouves} trouvées, ${c.douteux} douteuses, ${c.absents} absentes`}>
      {c.trouves > 0 && <span data-k="trouve">{c.trouves}<Check size={12} aria-hidden /></span>}
      {c.douteux > 0 && <span data-k="douteux">{c.douteux}?</span>}
      {c.absents > 0 && <span data-k="absent">{c.absents}–</span>}
    </span>
  );
}

function LigneEtapeV({ l, mot = true }: { l: LigneEtape; mot?: boolean }) {
  return (
    <li className="cnl-etape" data-lecture-etape data-statut={l.statut} data-cle={l.cle} data-google={l.viaGoogle ? '' : undefined}>
      <Icone s={l.statut} />
      <span className="cnl-nom">{l.libelle}</span>
      <span className="cnl-detail">
        {l.viaGoogle && <span className="cnl-google"><ArrowRightToLine size={12} aria-hidden /> via Google</span>}
        {l.detail ? <span>{l.detail}</span> : null}
      </span>
      {mot && <span className="cnl-mot">{MOT[l.statut]}</span>}
    </li>
  );
}

export interface LectureLienProps {
  lecture: LectureEnCours;
  phase: 'en-cours' | 'fin' | 'echec';
  /** Banc : la pastille « exemple » (données simulées). */
  exemple?: boolean;
  /** Fin retrouvée à la réouverture : l'article lu (v01, v03, v05). */
  article?: ArticleV | null;
  onReplier?: () => void;
  onFermer?: () => void;
  onOuvrirArticle?: () => void;
  onEscalader?: () => void;
  onAutreLien?: () => void;
  onCompleter?: () => void;
  onRetirer?: () => void;
  /** T28-4 : l'échec relu avec l'IA plus forte : en cours (bouton éteint, étape qui tourne) ou finie (toujours introuvable). */
  relecture?: Relecture;
  /** T28-2 : le carnet où le lien a été collé, dit sur la carte de fin quand on la voit d'ailleurs. */
  carnet?: string;
}

/** La carte des étapes, à la place du cadre « ↓ arrive ici » (pendant), puis de l'avis (fin, échec). */
export function LectureLien(p: LectureLienProps) {
  const { lecture: l, phase } = p;
  /* comme l'état de l'IA (EtatIA) : la carte paraît en haut du carnet, le champ est en bas ; à son arrivée (ou dépliée), elle vient dans la vue */
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView?.({ block: 'nearest' }); }, [phase]);
  const enCours = phase === 'en-cours';
  const maintenant = useMaintenant(enCours);
  const lignes = lignesEtapes(l.etapes, { fini: !enCours, enCours: l.enCours, escalade: !!l.escalade });
  const c = compterEtapes(lignes);
  const ecoule = duree((enCours ? maintenant : l.fin ?? maintenant) - (l.debut ?? maintenant));
  const exemple = p.exemple ? <span className="cn-exemple">exemple</span> : null;

  if (phase === 'echec') {
    const page = lignes.find(x => x.cle === 'page');
    const rel: Relecture = p.relecture ?? 'aucune';
    const pasLancees = lignes.filter(x => x.statut === 'pas-lancee' && x.cle !== 'ia').length;
    const bouton = boutonEscalader(rel);
    return (
      <section ref={ref} className="cnl cnl-echec" data-lecture="echec" data-relecture={rel} aria-label={rel === 'en-cours' ? 'Lecture du lien : relue par une IA plus forte' : 'Lecture du lien : lien introuvable'} aria-busy={rel === 'en-cours'} aria-live="polite">
        <header className="cnl-tete">
          <b className={`cnl-titre${rel === 'en-cours' ? '' : ' cn-rouge'}`}>{rel === 'en-cours' ? 'Relecture · IA plus forte' : rel === 'finie' ? 'Toujours introuvable' : 'Lien introuvable'}</b>
          {rel === 'en-cours' ? <span className="cnl-temps cn-mono">{ecoule}</span> : <span className="cn-mut">arrêté à {c.arreteA ?? 1} sur {c.total}</span>}
          <span className="cn-sp" />
          {p.onFermer && <button type="button" className="cnl-x" aria-label="Fermer" onClick={p.onFermer}><X size={16} aria-hidden /></button>}
        </header>
        <p className="cnl-url"><Link2 size={14} aria-hidden /><span>{lienLisible(l.url)}</span>{exemple}</p>
        <Segments lignes={lignes} />
        <ol className="cnl-etapes">
          {page && <LigneEtapeV l={{ ...page, ...(l.statut === 'introuvable' ? {} : {}) }} />}
          {rel !== 'aucune' && (
            <li className="cnl-etape" data-lecture-etape data-escalade data-statut={rel === 'en-cours' ? 'en-cours' : 'echec'}>
              <Icone s={rel === 'en-cours' ? 'en-cours' : 'echec'} />
              <span className="cnl-nom">Relu par une IA plus forte</span>
              <span className="cnl-detail"><span>{rel === 'en-cours' ? `en cours · ${ecoule}` : 'le lien ne mène toujours à rien'}</span></span>
              <span className="cnl-mot">{rel === 'en-cours' ? 'en cours' : 'non lue'}</span>
            </li>
          )}
          {pasLancees > 0 && rel !== 'en-cours' && <li className="cnl-etape cnl-pas-lancees" data-lecture-etape data-statut="pas-lancee"><CircleDashed size={16} aria-hidden className="cnl-ico" /><span className="cnl-nom">{pasLancees} étapes pas lancées : rien n’est inventé</span></li>}
        </ol>
        <div className="cnl-actions">
          {p.onEscalader && bouton === 'actif' && (
            <button type="button" className="cnl-bouton cnl-escalader" data-booster="escalader" onClick={p.onEscalader}>
              <Sparkles size={16} aria-hidden /> Escalader <span className="cnl-sous">IA plus forte</span>
            </button>
          )}
          {bouton === 'attente' && (
            <button type="button" className="cnl-bouton cnl-escalader" data-booster="escalader" disabled aria-disabled="true">
              <LoaderCircle size={16} aria-hidden className="cnl-tourne" /> Relecture… <span className="cnl-sous">IA plus forte</span>
            </button>
          )}
          {p.onAutreLien && rel !== 'en-cours' && <button type="button" className="cnl-bouton" onClick={p.onAutreLien}><Link2 size={16} aria-hidden /> Autre lien</button>}
          {p.onCompleter && rel !== 'en-cours' && <button type="button" className="cnl-bouton" onClick={p.onCompleter}><Pencil size={16} aria-hidden /> Compléter</button>}
          {p.onRetirer && rel !== 'en-cours' && <button type="button" className="cnl-bouton" onClick={p.onRetirer}><Trash2 size={16} aria-hidden /> Retirer</button>}
        </div>
      </section>
    );
  }

  if (phase === 'fin') return <div ref={ref}><FinLecture {...p} lignes={lignes} ecoule={ecoule} pastille={exemple} /></div>;

  /* Début (v05 + v06) : rien n'est encore lu ; la vignette attend, l'heure du collage, les étapes à venir. */
  if (c.faites === 0) {
    const page = lignes.map(x => (x.cle === 'page' && x.statut === 'en-cours' && !x.detail ? { ...x, detail: `ouverture de ${domaineDe(l.url)}…` } : x));
    return (
      <section ref={ref} className="cnl cnl-cours" data-lecture="debut" aria-label="Lecture du lien" aria-live="polite" aria-busy="true">
        <header className="cnl-tete cnl-tete-debut">
          <span className="cnl-vignette cnl-attend" aria-hidden />
          <span className="cnl-qui">
            <b className="cnl-lien">{lienLisible(l.url)}</b>
            <span className="cn-mut">{l.escalade ? 'relu avec l’IA forte' : `lien collé${heure(l.debut) ? ` à ${heure(l.debut)}` : ''}`} {exemple}</span>
          </span>
          <span className="cnl-temps cn-mono">{ecoule}</span>
        </header>
        <ol className="cnl-etapes">{page.map(x => <LigneEtapeV key={x.cle} l={x} mot={x.statut !== 'a-faire'} />)}</ol>
        <footer className="cnl-pied">
          {p.onReplier && <button type="button" className="cnl-replier" onClick={p.onReplier}><ChevronDown size={16} aria-hidden /> Replier</button>}
          <span className="cn-mut">lu par le serveur, 20 à 35&nbsp;s</span>
        </footer>
      </section>
    );
  }

  /* Milieu (v03) : « Lecture · 3 sur 6 », la barre par étape, chaque étape dit ce qu'elle a lu. */
  return (
    <section ref={ref} className="cnl cnl-cours" data-lecture="milieu" aria-label="Lecture du lien" aria-live="polite" aria-busy="true">
      <header className="cnl-tete">
        <b className="cnl-titre">Lecture · {c.faites} sur {c.total}</b>
        <span className="cnl-temps cn-mono">{ecoule}</span>
        <span className="cn-sp" />
        {p.onReplier && <button type="button" className="cnl-replier" onClick={p.onReplier}><ChevronDown size={16} aria-hidden /> Replier</button>}
      </header>
      <p className="cnl-url"><Link2 size={14} aria-hidden /><span>{lienLisible(l.url)}</span>{exemple}</p>
      <Segments lignes={lignes} />
      <ol className="cnl-etapes">{lignes.map(x => <LigneEtapeV key={x.cle} l={x} />)}</ol>
    </section>
  );
}

/** Fin (v01, v03, v05) : l'article lu, puis seulement ce qui reste à voir (douteux, absent), chacun avec son geste ; le reste se déplie. */
function FinLecture(p: LectureLienProps & { lignes: LigneEtape[]; ecoule: string; pastille: React.ReactNode }) {
  const { lecture: l, lignes, article: a } = p;
  const [deplie, setDeplie] = useState(false);
  const [bons, setBons] = useState<string[]>([]);
  const c = compterEtapes(lignes);
  const aVoir = lignes.filter(x => (x.statut === 'douteux' || x.statut === 'absent') && x.cle !== 'ia' && !bons.includes(x.cle));
  const prix = a ? montant(a.prixCentimes) : null;
  return (
    <section className="cnl cnl-fin" data-lecture="fin" aria-label="Lecture du lien finie">
      <header className="cnl-tete">
        <CircleCheck size={16} aria-hidden className="cnl-ico cnl-ok" />
        <b className="cnl-titre">{l.reouverture ? 'Lu pendant que l’app était fermée' : 'Lu'}</b>
        <span className="cn-mut">· {p.ecoule}</span>
        {p.carnet && <span className="cn-mut cnl-carnet" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· dans « {p.carnet} »</span>}
        <span className="cn-sp" />
        {p.onFermer && <button type="button" className="cnl-x" aria-label="Fermer" onClick={p.onFermer}><X size={16} aria-hidden /></button>}
      </header>
      {a && (
        <button type="button" className="cnl-article" onClick={p.onOuvrirArticle} disabled={!p.onOuvrirArticle}>
          {a.photo ? <img className="cnl-vignette" src={a.photo} alt="" /> : <span className="cnl-vignette" aria-hidden />}
          <span className="cnl-qui">
            <b className="cnl-lien">{a.nom ?? lienLisible(l.url)}</b>
            <span className="cn-mut">{[a.vendeur, a.pays].filter(Boolean).join(' · ') || domaineDe(l.url)} {p.pastille}</span>
          </span>
          {prix && <span className="cn-mono cnl-prix">{prix}&nbsp;{a.devise ?? 'CHF'}</span>}
        </button>
      )}
      {aVoir.length > 0 && (
        <ul className="cnl-revoir">
          {aVoir.map(x => (
            <li key={x.cle} data-statut={x.statut}>
              <Icone s={x.statut} />
              <span className="cnl-revoir-txt"><b>{x.libelle}</b> · {MOT[x.statut]}{x.detail ? <span className="cn-mut"> — {x.detail}</span> : null}</span>
              <span className="cnl-revoir-gestes">
                {x.statut === 'douteux' && <button type="button" className="cnl-bouton" onClick={() => setBons(b => [...b, x.cle])}><Check size={14} aria-hidden /> C’est le bon</button>}
                {p.onOuvrirArticle && <button type="button" className="cnl-bouton" onClick={p.onOuvrirArticle}><Pencil size={14} aria-hidden /> {x.statut === 'douteux' ? 'Corriger' : 'Compléter'}</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="cnl-resume" aria-expanded={deplie} onClick={() => setDeplie(d => !d)}>
        <Segments lignes={lignes} />
        <span><b>{c.faites} étapes sur {c.total}</b><span className="cn-mut"> · lu en {p.ecoule}</span></span>
        {deplie ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
      </button>
      {deplie && <ol className="cnl-etapes">{lignes.map(x => <LigneEtapeV key={x.cle} l={x} />)}</ol>}
    </section>
  );
}

/** La barre repliée (v01, plus compacte) : au-dessus du champ, une ligne ; la lecture continue côté serveur, l'app peut se fermer. */
export function BarreLecture(p: { lecture: LectureEnCours; phase: 'en-cours' | 'fin'; titre?: string; nom?: string; onDeplier: () => void; onFermer?: () => void }) {
  const enCours = p.phase === 'en-cours';
  const maintenant = useMaintenant(enCours);
  const lignes = lignesEtapes(p.lecture.etapes, { fini: !enCours, enCours: p.lecture.enCours, escalade: !!p.lecture.escalade });
  const c = compterEtapes(lignes);
  const ecoule = duree((enCours ? maintenant : p.lecture.fin ?? maintenant) - (p.lecture.debut ?? maintenant));
  const quoi = enCours ? `Lecture du lien${p.titre ? ` · ${p.titre}` : ''}` : `Lu · ${p.nom ?? p.titre ?? domaineDe(p.lecture.url)}`;
  return (
    <div className="cnl-dock" data-phase={p.phase}>
      <button type="button" className="cnl-barre" data-lecture-barre data-booster="barre-lecture" onClick={p.onDeplier}
        aria-label={`${quoi}, ${c.faites} étapes sur ${c.total} : déplier`} aria-live="polite">
        {enCours ? <LoaderCircle size={16} aria-hidden className="cnl-ico cnl-tourne" /> : <CircleCheck size={16} aria-hidden className="cnl-ico cnl-ok" />}
        <b className="cnl-barre-quoi">{quoi}</b>
        <Comptes lignes={lignes} />
        {enCours && <span className="cn-mono cn-mut">{c.faites}/{c.total}</span>}
        <span className="cn-mono cn-mut">{ecoule}</span>
        <ChevronUp size={16} aria-hidden />
      </button>
      {!enCours && p.onFermer && <button type="button" className="cnl-x" aria-label="Fermer" onClick={p.onFermer}><X size={16} aria-hidden /></button>}
    </div>
  );
}
