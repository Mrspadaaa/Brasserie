import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputElement } from '../../Input';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { messageDateHorsBornes } from '../../../domain/finance/bornesFinance';
import { amountOnly, shiftMonth } from '../financeFormat';
import { moisCourt } from './calculs';
import { Piles } from './Piles';

/** BE-70 : un mois hors des bornes d'une pièce (2000 à +1 an) n'est pas retenu ; le champ revient au mois courant. */
const moisValide = (mois: string, today: string) => /^\d{4}-\d{2}$/.test(mois) && messageDateHorsBornes(`${mois}-01`, today) === null;

export interface Actif { cle: string; libelle: string; retirer: () => void }

/**
 * La bande du haut (v6b) : la pastille de mois, la pastille « en retard », la loupe, puis les piles du mois et leur légende.
 * Tout filtre actif se dit ici, hors du panneau « Filtres » : une liste qui change ne doit jamais changer sans le dire.
 */
export function Bande({ libellePeriode, contexte, moisActif, month, today, onMonth, retardCents, onRetard, rechercheOuverte, onLoupe, query, onQuery, searchRef, searchId, actifs, piles }: {
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
}) {
  const champ = useRef<HTMLInputElement>(null);
  const libelle = moisActif ? moisCourt(month, today) : libellePeriode;
  return <div className="ops-bande" role="group" aria-label="Le mois en cours">
    <div className="ops-haut">
      <span className="ops-pill">
        <button type="button" aria-label="Mois précédent" disabled={!moisActif} onClick={() => onMonth(shiftMonth(month, -1))}>‹</button>
        <button type="button" className="ops-mois" disabled={!moisActif} aria-label={`Choisir le mois, ${libelle}`}
          onClick={() => { try { champ.current?.showPicker?.(); } catch { champ.current?.focus(); } }}><b>{libelle}</b></button>
        <input ref={champ} type="month" className="ops-mois-champ" aria-label="Période du journal" value={month} disabled={!moisActif} min="2000-01"
          onChange={e => { if (e.target.value && moisValide(e.target.value, today)) onMonth(e.target.value); }}/>
        <button type="button" aria-label="Mois suivant" disabled={!moisActif} onClick={() => onMonth(shiftMonth(month, 1))}>›</button>
      </span>
      {retardCents > 0 && <button type="button" className="ops-due" onClick={onRetard} aria-label={`En retard ${amountOnly(retardCents)} CHF : voir les factures échues`}>
        <i aria-hidden="true"/>en retard <b className="ops-m">{amountOnly(retardCents)}</b></button>}
      <button type="button" className="ops-loupe" aria-label="Rechercher" aria-expanded={rechercheOuverte} onClick={onLoupe}><Search size={16} aria-hidden="true"/></button>
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
    {piles && <Piles periode={piles}/>}
  </div>;
}
