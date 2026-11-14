import React, { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputElement } from '../../Input';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { messageDateHorsBornes } from '../../../domain/finance/bornesFinance';
import { amountOnly, shiftMonth } from '../financeFormat';
import { moisCourt } from './calculs';
import { Piles } from './Piles';
import { Frise, type DonneesFrise } from './Frise';
import { PREMIER_JOUR, duree, estJour, glisser, peutGlisser, titreJours, type Plage } from './plage';

/** Le « 1er » de la pilule s'écrit « 1<sup>er</sup> » (s2ap2). */
function TitrePlage({ texte }: { texte: string }) {
  const [avant, apres] = texte.split('1er');
  return apres === undefined ? <>{texte}</> : <>{avant}1<sup>er</sup>{apres}</>;
}

/** BE-70 : un mois hors des bornes d'une pièce (2000 à +1 an) n'est pas retenu ; le champ revient au mois courant. */
const moisValide = (mois: string, today: string) => /^\d{4}-\d{2}$/.test(mois) && messageDateHorsBornes(`${mois}-01`, today) === null;

export interface Actif { cle: string; libelle: string; retirer: () => void }

/**
 * La bande du haut (v6b) : la pastille de mois, la pastille « en retard », la loupe, puis les piles du mois et leur légende.
 * Tout filtre actif se dit ici, hors du panneau « Filtres » : une liste qui change ne doit jamais changer sans le dire.
 */
export function Bande({ libellePeriode, contexte, moisActif, month, today, onMonth, retardCents, onRetard, rechercheOuverte, onLoupe, query, onQuery, searchRef, searchId, actifs, piles, plage, onPlage, nomPiles, apportsCents, jours, donneesFrise, nbOperations, jourMax }: {
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
}) {
  const [friseOuverte, setFriseOuverte] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const libelle = moisActif ? moisCourt(month, today) : libellePeriode;
  const montrerFrise = !!plage || (moisActif && friseOuverte);
  const glissable = (sens: -1 | 1) => !plage || peutGlisser(plage, sens, PREMIER_JOUR, jourMax);
  const decaler = (sens: -1 | 1) => { if (plage) { const g = glisser(plage, sens, PREMIER_JOUR, jourMax); onPlage(g.du, g.au); } else onMonth(shiftMonth(month, sens)); };
  /** Deux champs date pour taper la plage (ordinateur) : poser le début tire la fin avec lui, et inversement, jamais de plage inversée. */
  const taper = (champDate: 'du' | 'au', valeur: string) => {
    if (!estJour(valeur) || valeur < PREMIER_JOUR || valeur > jourMax || messageDateHorsBornes(valeur, today) !== null) return;
    const du0 = jours?.du ?? valeur, au0 = jours?.au ?? valeur;
    if (champDate === 'du') onPlage(valeur, valeur > au0 ? valeur : au0); else onPlage(valeur < du0 ? valeur : du0, valeur);
  };
  const titre = plage ? titreJours(plage, today) : '';
  // s2ap2 : la frise se pose sous les piles et au-dessus de la légende (payé · à payer · dépensé) ; sans piles, elle est seule.
  const frise = montrerFrise ? <Frise mois={month} plage={plage ?? null} aujourdhui={today} jourMax={jourMax} nbOperations={nbOperations} donnees={donneesFrise}
    onPlage={onPlage} onMois={() => { setFriseOuverte(true); if (plage) onMonth(plage.au.slice(0, 7)); }}/> : null;
  return <div className="ops-bande" role="group" aria-label="La période en cours">
    <div className="ops-haut" data-serre={libelle.length > 12 || undefined}>
      <span className="ops-pill" data-plage={plage ? '' : undefined}>
        <button type="button" aria-label={plage ? `${duree(plage)} jours plus tôt` : 'Mois précédent'} disabled={!glissable(-1)} onClick={() => decaler(-1)}>‹</button>
        {plage
          ? <b className="ops-plage-titre" aria-label={`Plage du ${titre}`}><TitrePlage texte={titre}/></b>
          : <button type="button" className="ops-mois" aria-label={moisActif ? `${friseOuverte ? 'Replier' : 'Déplier'} les jours de ${libelle}` : `Choisir le mois, ${libelle}`}
            aria-expanded={moisActif ? friseOuverte : undefined}
            onClick={() => { if (moisActif) setFriseOuverte(open => !open); else { try { champ.current?.showPicker?.(); } catch { champ.current?.focus(); } } }}>
            <b>{libelle}</b>{moisActif && <svg className="ops-ico-frise" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M3 19h18M8 19v-6M12 19v-10M16 19v-4"/><circle cx="4" cy="19" r="2.4"/><circle cx="20" cy="19" r="2.4"/></svg>}</button>}
        <input ref={champ} type="month" className="ops-mois-champ" aria-label="Période du journal" value={month} min="2000-01"
          onChange={e => { if (e.target.value && moisValide(e.target.value, today)) onMonth(e.target.value); }}/>
        <button type="button" aria-label={plage ? `${duree(plage)} jours plus tard` : 'Mois suivant'} disabled={!glissable(1)} onClick={() => decaler(1)}>›</button>
      </span>
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
    {piles ? <Piles periode={piles} nom={nomPiles} apports={apportsCents ?? null} frise={frise}/> : frise}
  </div>;
}
