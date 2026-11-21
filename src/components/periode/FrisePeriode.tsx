import React from 'react';
import type { Transaction } from '../../types';
import { messageDateHorsBornes } from '../../domain/finance/bornesFinance';
import { Frise } from '../../ui/finance/operations/Frise';
import { PREMIER_JOUR, estJour, jourMaxi, plageDuMois } from '../../ui/finance/operations/plage';
import { useDonneesFrise } from './useDonneesFrise';
import { aujourdhuiISO, bornes, depuisJours, enPeriode, type Periode, type PeriodeEntree } from './periode';
import '../../ui/finance/operations.css';
import './periode.css';

/** Ce que la frise lit des opérations (`useDonneesFrise`) : les jours dessinés, le nombre d'opérations d'une plage, l'étendue de l'historique. */
export type DonneesPeriode = ReturnType<typeof useDonneesFrise>;

export interface FriseDePeriodeProps {
  /** La période montrée : celle de l'app, ou celle d'un écran (mise en `Periode`). */
  periode: PeriodeEntree;
  /** Ce que posent les poignées (glisser), le clavier, « × mois entier » et les champs : toujours une `Periode` (`depuisJours`). */
  onChoisir: (p: Periode) => void;
  frise: DonneesPeriode;
  maintenant?: Date;
  /** Le dernier jour qu'une poignée peut atteindre (défaut : un an après aujourd'hui, comme Opérations). */
  jourMax?: string;
  /** Les deux champs « du … au » d'Opérations, pour taper la plage à l'ordinateur (cachés au téléphone par operations.css). */
  champs?: boolean;
}

/**
 * PERIODE-PARTOUT (21.11, « ça trigger pas la frise editavlble de l'autre vue ») : LA frise de période de l'app. C'est la frise de
 * Finances › Opérations (`Frise`, geste de la frise B, `src/ui/geste`), réemployée telle quelle, branchée sur une `Periode`.
 * Tout écran qui choisit une période libre la monte ; jamais deux listes de mois. Sans cadre : `FrisePeriode` ajoute le cadre `.ops`.
 */
export function FriseDePeriode({ periode, onChoisir, frise, maintenant = new Date(), jourMax: jm, champs = false }: FriseDePeriodeProps) {
  const p = enPeriode(periode, maintenant);
  const aujourdhui = aujourdhuiISO();
  const { du: debut, au: fin } = bornes(p);
  /* « Tout » n'a pas de jours : la frise couvre l'étendue réelle (première à dernière opération), sinon le mois en cours. */
  const mois = (debut ?? aujourdhui).slice(0, 7);
  const plage = p.genre === 'tout' ? (frise.etendue ?? null) : p.genre === 'mois' ? null : { du: debut as string, au: fin as string };
  const montree = plage ?? plageDuMois(mois);
  const nTout = p.genre === 'tout' ? frise.nombre(null, null) : 0;
  const jourMax = jm ?? jourMaxi(aujourdhui);
  /* Les champs d'Opérations : poser le début tire la fin avec lui, et inversement ; jamais de plage inversée. */
  const taper = (champ: 'du' | 'au', valeur: string) => {
    if (!estJour(valeur) || valeur < PREMIER_JOUR || valeur > jourMax || messageDateHorsBornes(valeur, aujourdhui) !== null) return;
    if (champ === 'du') onChoisir(depuisJours(valeur, valeur > montree.au ? valeur : montree.au));
    else onChoisir(depuisJours(valeur < montree.du ? valeur : montree.du, valeur));
  };
  return <>
    <Frise key={p.genre === 'tout' ? 'tout' : 'jours'} mois={mois} plage={plage} aujourdhui={aujourdhui} jourMax={jourMax} nbOperations={frise.nombre(montree.du, montree.au)} donnees={frise.donnees}
      resume={p.genre === 'tout' ? <span>Tout l’historique · {nTout === 0 ? 'aucune opération' : <><b className="ops-m">{nTout}</b> opération{nTout > 1 ? 's' : ''}</>}</span> : undefined}
      onPlage={(a, b) => onChoisir(depuisJours(a, b))} onMois={() => onChoisir({ genre: 'mois', annee: Number(mois.slice(0, 4)), mois: Number(mois.slice(5, 7)) })}/>
    {champs && <div className="ops-champs" role="group" aria-label="Plage du … au …">
      <label>du <input type="date" aria-label="Du" value={montree.du} min={PREMIER_JOUR} max={jourMax} onChange={e => taper('du', e.target.value)}/></label>
      <label>au <input type="date" aria-label="Au" value={montree.au} min={PREMIER_JOUR} max={jourMax} onChange={e => taper('au', e.target.value)}/></label>
    </div>}
  </>;
}

const VIDE: Transaction[] = [];

/** La frise de période, prête à monter : elle lit les opérations de l'app et porte son cadre `.ops` (les couleurs et la hauteur d'Opérations). */
export function FrisePeriode({ transactions = VIDE, className = '', ...props }: Omit<FriseDePeriodeProps, 'frise' | 'champs'> & { transactions?: Transaction[]; className?: string }) {
  const frise = useDonneesFrise(transactions);
  return <div className={`ops fp ${className}`.trim()} data-frise-periode><FriseDePeriode frise={frise} champs {...props}/></div>;
}
