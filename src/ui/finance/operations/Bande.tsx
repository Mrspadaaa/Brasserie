import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputElement } from '../../Input';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { messageDateHorsBornes } from '../../../domain/finance/bornesFinance';
import { amountOnly } from '../financeFormat';
import { moisCourt } from './calculs';
import { Piles } from './Piles';
import { Frise, type DonneesFrise } from './Frise';
import { PREMIER_JOUR, estJour, titreJours, type Plage } from './plage';

/** Le « 1er » de la pilule s'écrit « 1<sup>er</sup> » (s2ap2). */
function TitrePlage({ texte }: { texte: string }) {
  const [avant, apres] = texte.split('1er');
  return apres === undefined ? <>{texte}</> : <>{avant}1<sup>er</sup>{apres}</>;
}


export interface Actif { cle: string; libelle: string; retirer: () => void }

/**
 * La bande du haut (v6b) : la pastille de mois, la pastille « en retard », la loupe, puis les piles du mois et leur légende.
 * Tout filtre actif se dit ici, hors du panneau « Filtres » : une liste qui change ne doit jamais changer sans le dire.
 */
export function Bande({ libellePeriode, contexte, moisActif, month, today, onMonth, retardCents, onRetard, rechercheOuverte, onLoupe, query, onQuery, searchRef, searchId, actifs, piles, plage, onPlage, nomPiles, apportsCents, jours, donneesFrise, nbOperations, jourMax, videTexte, pileChoisie = null, onPile }: {
  libellePeriode: string;
  /** Ce que la période contient en plus de son intitulé, quand ce n'est pas évident (suivi sur tous les exercices, archives comprises). */
  contexte?: string;
  /** Vrai quand la période est un mois civil : les flèches et le champ de mois sont alors actifs. */
  moisActif: boolean;
  month: string;
  today: string;
  onMonth: (mois: string) => void;
  retardCents: number;
  onRetard: () => void;
  rechercheOuverte: boolean;
  onLoupe: () => void;
  query: string;
  onQuery: (texte: string) => void;
  searchRef: React.RefObject<InputElement>;
  searchId: string;
  actifs: Actif[];
  piles: PeriodeSynthese | null;
  /** Apports (+) et prélèvements (−) de la période, à part du graphe ; null s'il n'y en a pas. */
  apportsCents?: number | null;
  /** La plage « du … au … » en cours (s2ap2) : jours `AAAA-MM-JJ`, bornes incluses ; absente = un mois, tout ou un exercice. */
  plage?: Plage | null;
  onPlage: (du: string, au: string) => void;
  /** Les jours que les deux champs de l'ordinateur montrent : la plage, ou le mois ; null pour tout, un exercice, les archives. */
  jours?: Plage | null;
  donneesFrise: DonneesFrise;
  /** Opérations actives dans la plage (ou le mois) montrée par la frise. */
  nbOperations: number;
  /** Dernier jour qu'on peut demander (un an après aujourd'hui). */
  jourMax: string;
  /** Ce que les piles couvrent, pour le lecteur d'écran (« le mois », « la période », « tout l'historique »). */
  nomPiles?: string;
  /** La phrase de la bande quand la période n'a ni vente ni dépense (par défaut « Ni vente ni dépense sur … ») ; les archives disent ce qu'elles contiennent. */
  videTexte?: string;
  /** La pile qui filtre la liste (FIN-BARRES-MORTES), ou null. */
  pileChoisie?: string | null;
  /** Toucher une pile : poser ou retirer le filtre de sa catégorie. */
  onPile?: (cle: string) => void;
}) {
  /* FIN-DEUX-PERIODES (19.11, « Ces différents en fonction de son je click sur le milieu ou < > ??? ») : la période se choisit dans l'en-tête
     de l'app, seul ‹ milieu › ; la page n'a plus sa pastille. La frise (« vraiment bien ») reste, toujours ouverte sur un mois ou une plage, et pose la même période. */
  const libelle = moisActif ? moisCourt(month, today) : libellePeriode;
  const montrerFrise = !!plage || moisActif;
  /** Deux champs date pour taper la plage (ordinateur) : poser le début tire la fin avec lui, et inversement, jamais de plage inversée. */
  const taper = (champDate: 'du' | 'au', valeur: string) => {
    if (!estJour(valeur) || valeur < PREMIER_JOUR || valeur > jourMax || messageDateHorsBornes(valeur, today) !== null) return;
    const du0 = jours?.du ?? valeur, au0 = jours?.au ?? valeur;
    if (champDate === 'du') onPlage(valeur, valeur > au0 ? valeur : au0); else onPlage(valeur < du0 ? valeur : du0, valeur);
  };
  const titre = plage ? titreJours(plage, today) : '';
  // s2ap2 : la frise se pose sous les piles et au-dessus de la légende (payé · à payer · dépensé) ; sans piles, elle est seule.
  const frise = montrerFrise ? <Frise mois={month} plage={plage ?? null} aujourdhui={today} jourMax={jourMax} nbOperations={nbOperations} donnees={donneesFrise}
    onPlage={onPlage} onMois={() => { if (plage) onMonth(plage.au.slice(0, 7)); }}/> : null;
  /* Tour 2 (19.11) : la bande n'est plus un « choix de période » (le seul est l'en-tête de l'app) : elle se nomme par ce qu'elle filtre,
     et la lecture de la plage reste au lecteur d'écran sans se donner pour un second choix. */
  return <div className="ops-bande" role="group" aria-label="Filtres des opérations">
    <div className="ops-haut" data-serre={libelle.length > 12 || undefined}>
      {/* Ce qui est montré se dit au lecteur d'écran ; à l'œil, l'en-tête et la frise le montrent. */}
      <p className="sr-only" role="status" aria-label={plage ? `Plage du ${titre}` : `Opérations : ${libelle}`}>{plage ? <TitrePlage texte={titre}/> : libelle}</p>
      {retardCents > 0 && <button type="button" className="ops-due" onClick={onRetard} aria-label={`En retard ${amountOnly(retardCents)} CHF : voir les factures échues`}>
        <i aria-hidden="true"/><span className="ops-en">en </span>retard <b className="ops-m">{amountOnly(retardCents)}</b></button>}
      <button type="button" className="ops-loupe" aria-label="Rechercher" aria-expanded={rechercheOuverte} onClick={onLoupe}><Search size={16} aria-hidden="true"/></button>
    </div>
    {/* Ordinateur : deux champs « du … au … » toujours là pour taper la plage (« toujours un endroit pour mettre des chiffres »). */}
    <div className="ops-champs" role="group" aria-label="Plage du … au …">
      <label>du <input type="date" aria-label="Du" value={jours?.du ?? ''} min={PREMIER_JOUR} max={jourMax} onChange={e => taper('du', e.target.value)}/></label>
      <label>au <input type="date" aria-label="Au" value={jours?.au ?? ''} min={PREMIER_JOUR} max={jourMax} onChange={e => taper('au', e.target.value)}/></label>
    </div>
    {contexte && <p className="ops-contexte">{contexte}</p>}
    {rechercheOuverte && <div className="ops-recherche">
      <label className="sr-only" htmlFor={searchId}>Rechercher une opération</label>
      <Search size={15} aria-hidden="true"/>
      <Input id={searchId} ref={searchRef} aria-label="Rechercher une opération" placeholder="Libellé, tiers, montant…" value={query} onChange={e => onQuery(e.target.value)}/>
      {query && <button type="button" aria-label="Effacer la recherche" onClick={() => onQuery('')}><X size={14} aria-hidden="true"/></button>}
    </div>}
    {actifs.length > 0 && <div className="ops-actifs" role="group" aria-label="Filtres actifs">
      {actifs.map(a => <button type="button" key={a.cle} className="ops-actif" aria-label={`Retirer le filtre : ${a.libelle}`} onClick={a.retirer}>{a.libelle}<X size={12} aria-hidden="true"/></button>)}
    </div>}
    {piles ? <Piles periode={piles} nom={nomPiles} apports={apportsCents ?? null} frise={frise} videTexte={videTexte} choisie={pileChoisie} onChoisir={onPile}/> : frise}
  </div>;
}
