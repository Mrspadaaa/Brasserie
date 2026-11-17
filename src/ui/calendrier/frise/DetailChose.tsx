import React from 'react';
import { Beer, Check, ChevronRight, Link2, ShoppingCart, Wheat, X } from 'lucide-react';
import { dateDeSemaine, etiquetteS, francsSignes, jourLisible, lundiDe, type ChoseCalendrier, type JalonBrassin } from '../../../domain/calendrier';
import { CLASSE_TEINTE } from './Marque';

/**
 * f4-b (E30) : toucher une chose ouvre son détail sous sa barre. Un brassin : ses étapes datées, les courses qui manquent, « Ouvrir le
 * brassin », « Commander », « Budget › » (D-71, nouveau, à valider). Une autre chose : sa semaine, sa date, le libre de la semaine, avec
 * Modifier et Retirer, et « Fait » pour une activité (D-93). Dans la poche « Sans date » (E46) : « Poser » et « Fait ». × fait 44 px.
 * Jamais « en retard de N j » (D-19) : des dates.
 */

export interface DetailChoseProps {
  chose: ChoseCalendrier;
  /** Le libre de la semaine de la chose, en centimes ; absent : courbe inconnue. */
  libreSemaine?: number | null;
  /** Une promesse liée à ce brassin (« 3 fûts promis le 15 déc. »). */
  promesse?: string | null;
  /** « Semaine courante » pour Poser depuis la poche. */
  onFermer: () => void;
  onOuvrir: () => void;
  onCommander?: () => void;
  onBudget?: () => void;
  onModifier?: () => void;
  onRetirer?: () => void;
  onFait?: () => void;
  onPoser?: () => void;
  onAccepter?: () => void;
  /** Une vente prévue : « Facturer › » (E37, D-99). */
  onFacturer?: () => void;
  onMettreDeCote?: (actif: boolean) => void;
}

const LIBELLE_OUVRIR: Record<ChoseCalendrier['ouvre']['ecran'], string> = {
  brassin: 'Ouvrir le brassin', piece: 'Ouvrir la pièce', plan: 'Ouvrir dans Finances', finances: 'Ouvrir dans Finances', agenda: 'Ouvrir dans l’agenda',
  atelier: 'Ouvrir dans l’atelier', materiel: 'Ouvrir dans le matériel', courses: 'Ouvrir les courses', fournisseur: 'Ouvrir le fournisseur', solde: 'Ouvrir Solde', carnets: 'Ouvrir dans les carnets'
};

/** Les trois temps d'un brassin, lus dans ses jalons : brassage, en cuve, prête (f4-b). */
function etapes(jalons: readonly JalonBrassin[] | undefined, chose: ChoseCalendrier) {
  const par = (id: JalonBrassin['id']) => jalons?.find(j => j.id === id);
  const brassage = par('brassage')?.jour ?? chose.debut;
  const cuve = par('fermentation')?.jour ?? par('garde')?.jour;
  const prete = par('conditionnement')?.jour ?? chose.preteLe ?? chose.fin;
  return [
    { id: 'brassage', libelle: 'Brassage', jour: brassage, icone: <Wheat size={16} aria-hidden="true" /> },
    ...(cuve && cuve !== brassage ? [{ id: 'cuve', libelle: 'En cuve', jour: cuve, icone: <Beer size={16} aria-hidden="true" /> }] : []),
    { id: 'prete', libelle: chose.finInconnue ? 'Fin' : 'Prête', jour: chose.finInconnue ? '' : prete, icone: <Check size={16} aria-hidden="true" /> }
  ];
}

export const DetailChose: React.FC<DetailChoseProps> = props => {
  const { chose, libreSemaine, promesse } = props;
  const brassin = chose.source.genre === 'batch';
  const commander = chose.jalons?.find(j => j.id === 'commander');
  const montant = chose.centimes !== undefined ? francsSignes(chose.centimes) : null;
  const semaine = chose.debut ? dateDeSemaine(lundiDe(chose.debut)) : null;
  const peutMiseDeCote = !!(chose.fenetre && chose.centimes && !brassin && (chose.source.genre === 'creative' || (chose.source.genre === 'plan' && chose.source.origine === 'manual')));
  const proposition = !!chose.proposition;

  return (
    <div role="region" aria-label={`Détail : ${chose.titre}`} className={`cal-det ${CLASSE_TEINTE[chose.rangee]}`} data-detail={chose.id}>
      <h4 className="cal-det-h">{chose.titre}{montant && <span className={chose.centimes !== undefined && chose.centimes < 0 ? 'cal-neg' : 'cal-pos'}>{montant}{chose.partiel ? ' +' : ''}</span>}</h4>
      <button type="button" className="cal-det-x" aria-label="Fermer" onClick={props.onFermer}><X size={22} aria-hidden="true" /></button>

      {brassin ? (
        <div className="cal-det-et">
          {etapes(chose.jalons, chose).map(e => (
            <div key={e.id}><span>{e.icone}{e.libelle}</span><b>{e.jour ? jourLisible(e.jour) : 'à préciser'}</b></div>
          ))}
        </div>
      ) : (
        <div className="cal-det-et">
          {semaine && <div><span>Semaine</span><b>{semaine}</b></div>}
          {chose.debut && <div><span>Date</span><b>{jourLisible(chose.debut)}{chose.fin && chose.fin !== chose.debut ? ` → ${jourLisible(chose.fin)}` : ''}</b></div>}
          {chose.fenetre && <div><span>Fenêtre</span><b>{etiquetteS(chose.fenetre.du)} → {etiquetteS(chose.fenetre.au)}</b></div>}
          {chose.joursActifs ? <div><span>Jours actifs</span><b>{chose.joursActifs} j</b></div> : null}
          {libreSemaine !== undefined && libreSemaine !== null && <div><span>Libre de la semaine</span><b>{francsSignes(libreSemaine).replace(/^\+/, '')}</b></div>}
          {!semaine && <div><span>Date</span><b>Sans date</b></div>}
        </div>
      )}

      {chose.detail && <p className="cal-det-p">{chose.detail}</p>}
      {brassin && (commander
        ? <p className="cal-det-p"><ShoppingCart size={16} aria-hidden="true" />Il manque des courses : à acheter avant le <b>{jourLisible(commander.jour)}</b>.</p>
        : null)}
      {brassin && chose.courses && <p className="cal-det-p" data-courses><ShoppingCart size={16} aria-hidden="true" /><span>Courses : {chose.courses}</span></p>}
      {promesse && <p className="cal-det-p">{promesse}</p>}
      {/* l'aperçu sur place d'une chose liée (D-113, D-126) : « La Cigogne · client ; Blonde d'automne · brassage 23 nov. · prête 21 déc. » */}
      {chose.lie && <p className="cal-det-p" data-apercu-lien><Link2 size={16} aria-hidden="true" /><span><b>{chose.lie.texte}</b> · {chose.lie.apercu}</span></p>}

      <div className="cal-det-bt">
        {props.onAccepter && <button type="button" className="cal-b cal-b-pri" onClick={props.onAccepter}>{proposition ? 'Accepter' : 'Vente confirmée'}</button>}
        {props.onPoser && <button type="button" className="cal-b cal-b-pri" onClick={props.onPoser}>Poser</button>}
        {props.onFacturer && <button type="button" className="cal-b cal-b-pri" onClick={props.onFacturer}>Facturer<ChevronRight size={16} aria-hidden="true" /></button>}
        {!props.onPoser && !props.onAccepter && !props.onFacturer && <button type="button" className="cal-b cal-b-pri" onClick={props.onOuvrir}>{LIBELLE_OUVRIR[chose.ouvre.ecran]}<ChevronRight size={16} aria-hidden="true" /></button>}
        {brassin && props.onCommander && commander && <button type="button" className="cal-b" onClick={props.onCommander}><ShoppingCart size={16} aria-hidden="true" />Commander</button>}
        {brassin && props.onBudget && <button type="button" className="cal-b" onClick={props.onBudget}>Budget ›</button>}
        {props.onFait && <button type="button" className="cal-b" onClick={props.onFait}><Check size={16} aria-hidden="true" />Fait</button>}
        {peutMiseDeCote && props.onMettreDeCote && (
          <button type="button" className="cal-b" aria-pressed={!!chose.miseDeCote} onClick={() => props.onMettreDeCote?.(!chose.miseDeCote)}>Mettre de côté</button>
        )}
        {props.onModifier && <button type="button" className="cal-b" onClick={props.onModifier}>Modifier</button>}
        {props.onRetirer && <button type="button" className="cal-b cal-b-ret" onClick={props.onRetirer}>Retirer</button>}
      </div>
    </div>
  );
};
