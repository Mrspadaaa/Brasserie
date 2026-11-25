/**
 * D451, voie liste : la saisie rapide (maquettes3/v01, écran `saisie`). La feuille « rangé pour toi » se pose sur la liste après un envoi : la note
 * (et sa photo) en bulle, puis la carte : picto et titre, « Domaine › sous-domaine », les jetons « nouveau problème » ou « rattaché : « citation » »
 * et l'état, la tâche proposée ; OK · Changer · Rattacher à… ; le champ « Ajouter à <court>… » dessous. Le rangement est appliqué et s'annule d'un
 * toucher (Annuler) ; la tâche reste proposée (elle se prend dans le carnet : OK · Non). Rien n'est lu dans une photo (accord du 17.11).
 * Honnêteté : sans IA (rangement local), la carte ne dit pas « pour toi » : « rangé ici, sans IA ». Un domaine ou un chemin absent ne s'écrit pas.
 */
import React from 'react';
import { Camera, Check, Sparkles, Undo2 } from 'lucide-react';
import type { CarnetDoc, MessageDoc } from '../../domain/carnets/modele';
import { DOMAINE_LIBELLE, DOMAINES, domaineDe, type DomaineCarnet } from '../../domain/carnets/domaines';
import { etatDe, genreDe, LIBELLE_ETAT } from '../../domain/carnets/suivi';
import type { GenreCarnet } from '../../domain/carnets/modele';
import { domaineParMots } from './domaineMots';
import { PictoDomaine } from './Domaines';
import { Photo, PictoObjet, pictoDe } from './pictos';
import { liesParNbsp } from './insecable';
import { titreLigne } from './listeRegles';
import './carnets-liste.css';

export type ModeFeuille = 'carte' | 'changer' | 'rattacher';

const GENRES: readonly { g: GenreCarnet; libelle: string }[] = [
  { g: 'probleme', libelle: 'problème' }, { g: 'memo', libelle: 'mémo' }, { g: 'recolte', libelle: 'récolte' }, { g: 'idee', libelle: 'idée' }
];
export const LIBELLE_GENRE: Record<GenreCarnet, string> = { probleme: 'problème', memo: 'mémo', recolte: 'récolte', idee: 'idée', achat: 'achat' };

/** « Domaine › sous-domaine » : seulement ce qui est posé ou lu ; rien d'inventé. */
export function cheminDit(c: CarnetDoc): string | null {
  const d = domaineDe(c, domaineParMots);
  const parts = [...(d ? [DOMAINE_LIBELLE[d]] : []), ...(c.carnet.categorie?.chemin ?? [])];
  return parts.length ? parts.join(' › ') : null;
}

export interface FeuilleRangementProps {
  message: MessageDoc;
  carnet: CarnetDoc;
  /** Les autres carnets (le plus proche d'abord), pour « Rattacher à… ». */
  autres: readonly { id: string; titre: string }[];
  mode: ModeFeuille;
  onMode: (m: ModeFeuille) => void;
  /** C68-1 : le carnet existant que l'IA désigne pour cette phrase (le carnet neuf qu'elle a créé reste le sien jusqu'au « Rattacher »). */
  cible?: { id: string; titre: string; chemin: string | null };
  /** C69-1 : aucun carnet neuf n'existe : la phrase attend son geste (Rattacher · Garder à part) ; `carnet` est le carnet existant que l'IA désigne. */
  enAttente?: boolean;
  /** « Garder à part » : crée le carnet (titre court) ; sans lui, le bouton ferme seulement (le carnet existe déjà). */
  onGarder?: () => void;
  /** Le voile : la feuille se ferme, rien de plus (la tâche reste proposée). */
  onFermer?: () => void;
  /** OK : la feuille se ferme, le rangement reste, la tâche proposée est posée. */
  onOK: () => void;
  /** Annuler : défait le rangement (l'inverse du retour) et ferme. */
  onAnnuler: () => void;
  onRattacher: (versId: string) => void;
  onDomaine: (d: DomaineCarnet) => void;
  onGenre: (g: GenreCarnet) => void;
  /** Le champ « Ajouter à … » : ouvre le carnet, champ pris (le message suivant reste dans ce carnet). */
  onAjouter: () => void;
}

export function FeuilleRangement(p: FeuilleRangementProps) {
  const { message: m, carnet: c } = p;
  const cm = m.carnetMessage;
  const neuf = !!p.enAttente || cm.effets.some(e => e.cible === 'carnet' && e.carnetId === c.id);
  const photoId = cm.effets.find(e => e.cible === 'photo' && e.carnetId === c.id)?.id;
  const photo = (photoId ? c.carnet.photos.find(x => x.id === photoId) : undefined)?.jpeg;
  const texte = cm.texte.trim() && cm.texte.trim() !== 'photo' ? cm.texte.trim() : '';
  const e = etatDe(c);
  const genre = genreDe(c);
  const chemin = cheminDit(c);
  const tache = (cm.propositionsSuivi ?? []).find(x => x.sorte === 'tache' && x.carnetId === c.id && x.texte)?.texte;
  const ia = cm.rangement === 'ia' || cm.rangement === 'simulee';
  const cible = neuf ? p.cible : undefined;
  const court = titreLigne(c).split('ZZ TEST — ').join('');
  const dom = domaineDe(c, domaineParMots);
  return (
    <div className="cnl-feuille-boite" data-feuille-rangement>
      <button type="button" className="cnl-voile" aria-label="Fermer : le rangement reste" onClick={p.onFermer ?? p.onOK} />
      <section className="cnl-feuille cn-page" role="dialog" aria-label="Rangé pour toi">
        <div className="cnl-poignee" aria-hidden />
        <div className="cnl-fil">
          <div className="cnl-bulle-vous">
            {photo && <Photo src={photo} className="cnl-bulle-photo" alt="Photo envoyée" repli={<span className="cnl-bulle-photo cnl-bulle-photo-vide"><Camera size={22} aria-hidden /></span>} />}
            {texte && <p>{texte}</p>}
          </div>
          <div className="cnl-carte-ia" data-rangement={cm.rangement}>
            <div className="cnl-carte-tete">
              <span className="cnl-ia-mot">{ia ? <><Sparkles size={16} aria-hidden /> rangé pour toi{cm.rangement === 'simulee' ? ' · exemple' : ''}</> : 'rangé ici, sans IA'}</span>
              <span className="cn-sp" />
              <button type="button" className="cn-lien cnl-annuler" onClick={p.onAnnuler}><Undo2 size={16} aria-hidden /> Annuler</button>
            </div>
            <div className="cnl-carte-corps">
              <span className="cnl-picto" aria-hidden><PictoObjet nom={pictoDe(c.title, c.carnet.categorie?.chemin.join(' '), c.carnet.phrase)} taille={22} /></span>
              <span className="cnl-tx"><b className="cnl-t">{liesParNbsp(cible ? titreLigne({ title: cible.titre } as CarnetDoc) : titreLigne(c))}</b>{(cible ? cible.chemin : chemin) && <span className="cnl-sub"><span className="cnl-pas">{cible ? cible.chemin : chemin}</span></span>}</span>
            </div>
            <div className="cnl-jetons">
              <span className="cnl-jeton">{cible ? 'Rattacher à ce carnet ?' : cm.rattache && !neuf ? <>rattaché : « {cm.rattache.citation} »</> : neuf ? (genre === 'probleme' ? 'nouveau problème' : `nouveau carnet · ${LIBELLE_GENRE[genre]}`) : <>ajouté à ce carnet</>}</span>
              {!cible && genre === 'probleme' && <span className="cnl-jeton cnl-jeton-etat" data-etat={e}>{LIBELLE_ETAT[e]}</span>}
            </div>
            {tache && <p className="cnl-tache"><b>Tâche proposée</b> : {tache}</p>}
          </div>
          {p.mode === 'carte' && (
            <div className="cnl-boutons">
              {cible && <button type="button" className="cnl-btn cnl-btn-ok" onClick={() => p.onRattacher(cible.id)}><Check size={18} aria-hidden /> Rattacher</button>}
              <button type="button" className={cible ? 'cnl-btn' : 'cnl-btn cnl-btn-ok'} onClick={cible ? (p.onGarder ?? p.onOK) : p.onOK}>{cible ? 'Garder à part' : <><Check size={18} aria-hidden /> OK</>}</button>
              {!p.enAttente && <button type="button" className="cnl-btn" onClick={() => p.onMode('changer')}>Changer</button>}
              <button type="button" className="cnl-btn" onClick={() => p.onMode('rattacher')}>Rattacher à…</button>
            </div>
          )}
          {p.mode === 'changer' && (
            <div className="cnl-changer" role="group" aria-label="Changer le rangement">
              <p className="cnl-changer-titre">Domaine</p>
              <div className="cnl-puces">
                {DOMAINES.map(d => <button key={d} type="button" className="cnl-puce" aria-pressed={dom === d} onClick={() => p.onDomaine(d)}><PictoDomaine d={d} /> {DOMAINE_LIBELLE[d]}</button>)}
              </div>
              <p className="cnl-changer-titre">Genre</p>
              <div className="cnl-puces">
                {GENRES.map(x => <button key={x.g} type="button" className="cnl-puce" aria-pressed={genre === x.g} onClick={() => p.onGenre(x.g)}>{x.libelle}</button>)}
              </div>
              <div className="cnl-boutons"><button type="button" className="cnl-btn cnl-btn-ok" onClick={() => p.onMode('carte')}>Terminé</button></div>
            </div>
          )}
          {p.mode === 'rattacher' && (
            <div className="cnl-changer" role="group" aria-label="Rattacher à un autre carnet">
              <p className="cnl-changer-titre">Rattacher à…</p>
              {p.autres.length === 0 ? <p className="cn-mut">Aucun autre carnet.</p> : (
                <ul className="cnl-autres">
                  {p.autres.slice(0, 12).map(a => <li key={a.id}><button type="button" className="cnl-autre-ligne" onClick={() => p.onRattacher(a.id)}>{liesParNbsp(titreLigne({ title: a.titre } as CarnetDoc))}</button></li>)}
                </ul>
              )}
              <div className="cnl-boutons"><button type="button" className="cnl-btn" onClick={() => p.onMode('carte')}>Retour</button></div>
            </div>
          )}
        </div>
        <button type="button" className="cnl-champ-faux" onClick={p.onAjouter}><span className="cnl-champ-texte">Ajouter à <b>{court}</b>…</span><Camera size={20} aria-hidden /></button>
      </section>
    </div>
  );
}
