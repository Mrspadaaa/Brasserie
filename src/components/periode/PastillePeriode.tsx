import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import type { Transaction } from '../../types';
import { ChoixPlage } from './ChoixPlage';
import { avance, enPeriode, etiquetteCourte, pas, titre, type Periode, type PeriodeEntree } from './periode';
import './periode.css';

interface Props {
  periode: PeriodeEntree;
  onChoisir: (p: Periode) => void;
  transactions?: Transaction[];
  /** Dit d'un mot que le réglage vaut pour toute l'app (le toast de la maquette). */
  onAnnonce?: (message: string) => void;
}

/**
 * La pastille « ‹ Nov. › » de l'en-tête (m3r-a), la même sur chaque écran. Les flèches avancent d'un pas (un mois, ou un
 * trimestre si un trimestre est choisi), le centre ouvre la grille en feuille du bas.
 */
export const PastillePeriode: React.FC<Props> = ({ periode, onChoisir, transactions, onAnnonce }) => {
  const [ouverte, setOuverte] = useState(false);
  const p = enPeriode(periode);
  const choisir = (nouvelle: Periode) => { onChoisir(nouvelle); onAnnonce?.(`Période : ${titre(nouvelle)} · toute l’app`); };
  const ok = avance(p);
  return (
    <>
      <span className="pr pr-pill" role="group" aria-label="Période de l’application" data-periode-pastille>
        <button type="button" className="pr-fl" disabled={!ok} aria-label="Période précédente" onClick={() => choisir(pas(p, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" className="pr-ce" aria-haspopup="dialog" aria-label={`Période : ${titre(p)}. Choisir la plage`} onClick={() => setOuverte(true)}>
          {etiquetteCourte(p)}
        </button>
        <button type="button" className="pr-fl" disabled={!ok} aria-label="Période suivante" onClick={() => choisir(pas(p, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </span>
      <Sheet open={ouverte} onClose={() => setOuverte(false)} title={`Période · ${titre(p)}`} subtitle="Elle vaut pour toute l’application">
        <ChoixPlage periode={p} transactions={transactions} onChoisir={choisir} />
      </Sheet>
    </>
  );
};
