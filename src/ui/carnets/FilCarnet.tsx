/**
 * D451 (maquettes3/v01) : le fil d'un carnet. Le jour en pastille (plages « 21 – 22 nov. »), ses bulles à droite, la bulle de l'IA à gauche, les jetons
 * sous chaque bulle, les plus anciens repliés (« ▴ 4 notes du 3 au 6 nov. »). Projection du domaine (`filDe`) : rien n'est écrit ici.
 * Une note du Planning (« À faire du … au … (Planning, …) ») est une bulle de ce fil, plus une carte à part (n° 8). Les propositions de l'IA
 * (tâche, retenir, dater, résoudre, veiller, rattacher) sont des cartes « OK · Non » : rien n'est écrit sans son geste.
 * Honnêteté : une veille dit « demandée · pas encore relevée » (la relève réelle n'existe pas encore) ; un montant absent n'est jamais 0.
 */
import React, { useState } from 'react';
import { Bell, Calculator, Check, Ellipsis, RotateCcw, Sparkles, X } from 'lucide-react';
import type { EntreeFil, FilCarnet as FilVu } from '../../domain/carnets/fil';
import type { CarnetDoc, Etiquette, EvenementSuivi, MessageDoc, Note, PropositionSuivi } from '../../domain/carnets/modele';
import { notePlanningDe } from '../../domain/carnets/taches';
import { LIBELLE_ETAT, optionRetenue } from '../../domain/carnets/suivi';
import { GENRE_LIBELLE } from './EtatIA';
import { heureDe, jetonDe, libelleJour, libellePlage, libelleRepli, plagesDe, rangsEcart, texteMontant } from './filRegles';
import type { RappelsSuivi } from './carnetOuvertTypes';

export interface PropsFil {
  c: CarnetDoc;
  fil: FilVu;
  messages: readonly MessageDoc[];
  /** L'année courante : une autre année se dit dans les pastilles. */
  annee?: number;
  rappels?: RappelsSuivi;
  /** Le titre d'un autre carnet (carte « Rattacher à … ? »). */
  titreCarnet?: (id: string) => string | undefined;
  /** Les gestes de la note (⋯) : absent, pas de ⋯. */
  onNote?: (noteId: string) => void;
  /** Ce qui entoure une bulle de note : la ligne rangée, la feuille ⋯, la suppression annulable (CarnetOuvert les pose). */
  entourer?: (noteId: string, noeud: React.ReactNode) => React.ReactNode;
  doublons?: ReadonlySet<string>;
  /** Archivé : ce qui était « à faire » est fait. */
  fait?: boolean;
}

/** C69-4 : un jeton par valeur : deux étiquettes de même sorte et de même montant (l'analyse locale, avec son option, et l'IA, sans) n'en font qu'un ; celle qui vise l'option est gardée. */
const jetonsDe = (m: MessageDoc, carnetId: string): { e: Etiquette; i: number }[] => {
  const tous = (m.carnetMessage.etiquettes ?? []).map((e, i) => ({ e, i })).filter(x => x.e.carnetId === carnetId);
  const cle = (e: Etiquette) => (e.montantCentimes !== undefined ? `${e.sorte}|${e.montantCentimes}|${e.devise ?? 'CHF'}` : null);
  return tous.filter(x => {
    const k = cle(x.e);
    if (!k) return true;
    const jumeaux = tous.filter(y => cle(y.e) === k);
    const garde = jumeaux.find(y => y.e.optionId) ?? jumeaux[0];
    return garde === x;
  });
};

/** Un jeton. Posé par l'IA, il s'annule d'un toucher : le toucher dit « Retirer » (un second toucher), rien ne se retire d'un effleurement. */
function Jeton({ classe, texte, retirer }: { classe: string; texte: string; retirer?: () => void }) {
  const [arme, setArme] = useState(false);
  if (!retirer) return <span className="cnp-jeton" data-j={classe}>{texte}</span>;
  return arme
    ? <span className="cnp-jeton cnp-jeton-arme" data-j={classe}>{texte}<button type="button" className="cnp-jeton-x" aria-label={`Retirer le jeton « ${texte} »`} onClick={retirer}>Retirer <X size={12} aria-hidden /></button></span>
    : <button type="button" className="cnp-jeton cnp-jeton-bouton" data-j={classe} aria-label={`Jeton « ${texte} », poser par l'IA : toucher pour le retirer`} onClick={() => setArme(true)}>{texte}</button>;
}

function CartePropositionIA({ p, index, messageId, rappels, titreCarnet, c }: { p: PropositionSuivi; index: number; messageId: string; rappels?: RappelsSuivi; titreCarnet?: (id: string) => string | undefined; c: CarnetDoc }) {
  const opt = p.optionId ? c.carnet.facons.find(f => f.id === p.optionId)?.nom : undefined;
  const somme = p.coutCentimes !== undefined ? texteMontant({ montantCentimes: p.coutCentimes, devise: p.devise, estime: undefined }) : null;
  const cible = p.sorte === 'deplacer' ? (p.versCarnetId ? titreCarnet?.(p.versCarnetId) : undefined) : undefined;
  const [titre, corps] = ((): [string, string] => {
    switch (p.sorte) {
      case 'tache': return ['tâche proposée', `${p.texte ?? ''}${somme ? ` · ${somme}` : ''}`];
      case 'retenir': return ['à retenir ?', opt ? `Retenir ${opt} ?` : 'Retenir cette option ?'];
      case 'dater': return ['à dater ?', `${opt ?? p.texte ?? 'Cette option'} : ${p.echeance ? `${p.precision === 'mois' ? 'fin ' : 'semaine du '}${libelleJour(p.echeance)}` : 'sans date'} ?`];
      case 'resoudre': return ['résolu ?', opt ? `Fermer grâce à l'achat de ${opt} ?` : 'Marquer résolu ?'];
      case 'veiller': return ['veille ?', opt ? `Veiller ${opt} ?` : 'Veiller cette option ?'];
      case 'deplacer': return ['ailleurs ?', cible ? `Rattacher à ${cible} ?` : 'Rattacher à un autre carnet ?'];
    }
  })();
  const geste = rappels?.onProposition;
  return (
    <div className="cnp-b cnp-b-ia cnp-carte" data-proposition={p.sorte} role="group" aria-label={titre}>
      <span className="cnp-ia-tete">{p.origine === 'ia' ? <Sparkles size={16} aria-hidden /> : <Calculator size={16} aria-hidden />} {titre}
        {geste && <button type="button" className="cnp-x" aria-label="Non, écarter la proposition" onClick={() => geste(messageId, index, 'non')}><X size={16} aria-hidden /></button>}
      </span>
      <p>{corps}</p>
      {geste && (
        <div className="cnp-carte-gestes">
          {p.sorte === 'tache'
            ? <><button type="button" className="cnp-btn" onClick={() => geste(messageId, index, 'ok')}>À faire</button><button type="button" className="cnp-btn" onClick={() => geste(messageId, index, 'plus-tard')}>Plus tard</button></>
            : <><button type="button" className="cnp-btn cnp-btn-plein" onClick={() => geste(messageId, index, 'ok')}>OK</button><button type="button" className="cnp-btn" onClick={() => geste(messageId, index, 'non')}>Non</button></>}
        </div>
      )}
    </div>
  );
}

function LigneEvenement({ e, c, rappels }: { e: EvenementSuivi; c: CarnetDoc; rappels?: RappelsSuivi }) {
  const opt = e.optionId ? c.carnet.facons.find(f => f.id === e.optionId)?.nom : undefined;
  if (e.sorte === 'veille') {
    return <div className="cnp-b cnp-b-ia" data-evenement="veille"><span className="cnp-ia-tete"><Bell size={16} aria-hidden /> veille demandée{opt ? ` · ${opt}` : ''}</span><p className="cn-mut">pas encore relevée</p></div>;
  }
  if (e.sorte === 'tache') {
    const t = (c.carnet.taches ?? []).find(x => x.id === e.tacheId);
    if (!t) return null;
    return (
      <div className="cnp-ev" data-evenement="tache">
        {rappels?.onCocherTache
          ? <label className="cnp-ev-case"><input type="checkbox" checked={!!t.faiteLe} onChange={ev => rappels.onCocherTache!(t.id, ev.target.checked)} /> <span className={t.faiteLe ? 'cnp-barre' : undefined}>tâche : {t.texte}</span></label>
          : <span>tâche : {t.texte}</span>}
      </div>
    );
  }
  if (e.sorte === 'etat' || e.sorte === 'resolu' || e.sorte === 'rouvert') {
    const vers = LIBELLE_ETAT[e.vers as keyof typeof LIBELLE_ETAT] ?? e.vers;
    return <div className="cnp-ev" data-evenement={e.sorte}>{e.sorte === 'resolu' ? <Check size={14} aria-hidden /> : e.sorte === 'rouvert' ? <RotateCcw size={14} aria-hidden /> : null} {e.sorte === 'rouvert' ? `rouvert · ${vers}` : vers}{e.raison ? ` · ${e.raison}` : ''}</div>;
  }
  return null;
}

export function FilCarnetVue(p: PropsFil) {
  const { c, fil, messages, annee, rappels, titreCarnet, onNote, entourer, doublons, fait } = p;
  const [replieOuvert, setReplieOuvert] = useState(false);
  const jours = replieOuvert && fil.replie ? [...fil.replie.jours, ...fil.jours] : fil.jours;
  const plages = plagesDe(jours);
  const options = new Map(c.carnet.facons.map(f => [f.id, f] as const));
  const rangs = rangsEcart(messages, c.id);
  const photosDe = (id: string) => c.carnet.photos.filter(ph => ph.messageId === id);
  const notesDe = (id: string): Note[] => c.carnet.notes.filter(n => n.messageId === id);

  const rendreEntree = (e: EntreeFil, plusieurs: boolean): React.ReactNode => {
    if (e.sorte === 'evenement') {
      if (e.evenement.messageId) return null;
      if (e.evenement.sorte === 'option' || e.evenement.sorte === 'pourquoi' || e.evenement.sorte === 'relu') return null;
      return <LigneEvenement key={e.id} e={e.evenement} c={c} rappels={rappels} />;
    }
    if (e.sorte === 'note') {
      const n = e.note;
      const planning = e.planning;
      const genreMot = fait && n.genre === 'a-faire' ? 'fait' : n.genre !== 'note' ? GENRE_LIBELLE[n.genre] : null;
      const noeud = (
        <div className="cnp-b cnp-b-vous" data-note={n.genre} {...(planning ? { 'data-planning': '' } : {})}>
          <p>{planning ? `À faire du ${libelleJour(planning.du, annee)}${planning.au ? ` au ${libelleJour(planning.au, annee)}` : ''}` : n.texte}</p>
          <div className="cnp-pd">
            {planning && <span className="cnp-jeton" data-j="constat">Planning · {planning.categorie}</span>}
            {genreMot && <span className="cnp-jeton" data-j={genreMot === 'fait' ? 'trouve' : 'afaire'}>{genreMot}</span>}
            {doublons?.has(n.id) && <span className="cnp-jeton" data-j="constat">doublon ?</span>}
            <span className="cn-sp" />
            {onNote && <button type="button" className="cnp-ico" aria-label={`Note : ${n.texte}, actions`} onClick={() => onNote(n.id)}><Ellipsis size={20} aria-hidden /></button>}
          </div>
        </div>
      );
      return <React.Fragment key={e.id}>{entourer ? entourer(n.id, noeud) : noeud}</React.Fragment>;
    }
    const m = e.message;
    const liees = notesDe(m.id);
    const texte = liees.length === 1 && liees[0].modifieeLe && liees[0].modifieeLe > m.carnetMessage.le ? liees[0].texte : m.carnetMessage.texte;
    const jetons = jetonsDe(m, c.id);
    const heure = plusieurs ? heureDe(m.carnetMessage.le) : null;
    const photos = photosDe(m.id);
    const props = (m.carnetMessage.propositionsSuivi ?? []).map((pr, i) => ({ pr, i })).filter(x => x.pr.carnetId === c.id && !(x.pr.sorte === 'retenir' && x.pr.optionId !== undefined && x.pr.optionId === optionRetenue(c)?.id)); /* C71-2 : jamais « à retenir ? » d'une option déjà retenue */
    const noeud = (
      <div className="cnp-b cnp-b-vous" data-message={m.id}>
        {photos.map(ph => <img key={ph.id} className="cnp-photo" src={ph.jpeg} alt={`Photo du ${libelleJour(m.carnetMessage.le.slice(0, 10), annee)}`} loading="lazy" />)}
        <p>{texte}</p>
        {e.rattache && <p className="cnp-rattache cn-mut">rattaché : « {e.rattache.citation} »</p>}
        {(jetons.length > 0 || heure || (liees.length === 1 && onNote)) && (
          <div className="cnp-pd">
            {jetons.map(({ e: et, i }) => {
              const j = jetonDe(et, options, rangs.get(`${m.id}:${i}`) ?? 1);
              return <Jeton key={i} classe={j.classe} texte={j.texte} retirer={rappels?.onRetirerEtiquette && et.origine !== 'vous' ? () => rappels.onRetirerEtiquette!(m.id, i) : undefined} />;
            })}
            <span className="cn-sp" />
            {heure && <time className="cnp-heure">{heure}</time>}
            {liees.length === 1 && onNote && <button type="button" className="cnp-ico" aria-label={`Note : ${liees[0].texte}, actions`} onClick={() => onNote(liees[0].id)}><Ellipsis size={20} aria-hidden /></button>}
          </div>
        )}
      </div>
    );
    return (
      <React.Fragment key={e.id}>
        {liees.length === 1 && entourer ? entourer(liees[0].id, noeud) : noeud}
        {props.map(({ pr, i }) => <CartePropositionIA key={`${m.id}:${i}`} p={pr} index={i} messageId={m.id} rappels={rappels} titreCarnet={titreCarnet} c={c} />)}
      </React.Fragment>
    );
  };

  return (
    <div className="cnp-fil" role="log" aria-label="Fil du carnet">
      {fil.replie && (
        <button type="button" className="cnp-replie" aria-expanded={replieOuvert} onClick={() => setReplieOuvert(o => !o)}>
          {replieOuvert ? '▾ Replier les plus anciennes' : libelleRepli(fil.replie, annee)}
        </button>
      )}
      {plages.map(pl => {
        const nbMessages = pl.entrees.filter(x => x.sorte !== 'evenement').length;
        const sansDate = pl.entrees.length > 0 && pl.entrees.every(x => x.sorte === 'note' && !x.dateConnue);
        return (
          <React.Fragment key={pl.du}>
            <div className="cnp-j"><span>{sansDate ? 'anciennes notes' : libellePlage(pl.du, pl.au, annee)}</span></div>
            {pl.entrees.map(en => rendreEntree(en, pl.du === pl.au && nbMessages >= 2))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
