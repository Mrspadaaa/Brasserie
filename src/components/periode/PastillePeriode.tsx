import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import type { Transaction } from '../../types';
import { ChoixPlage } from './ChoixPlage';
import { avance, bornes, enPeriode, etiquetteCourte, pas, titre, type Periode, type PeriodeEntree } from './periode';
import './periode.css';

/** « 12.10 » : le jour et le mois, comme dans les champs de la plage. */
const jj = (iso: string | null, avecAn = false) => (iso ? `${iso.slice(8)}.${iso.slice(5, 7)}${avecAn ? `.${iso.slice(2, 4)}` : ''}` : '');
/* CAL-PASSE (21.11, n° 11) : une plage hors de l'année en cours dit son année (« 05.07.27–14.11.27 »), sinon « 05.07–14.11 » se lit comme juillet de cette année. */
const horsAnneeEnCours = (du: string | null, au: string | null) => { const an = String(new Date().getFullYear()); return (!!du && du.slice(0, 4) !== an) || (!!au && au.slice(0, 4) !== an); };

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
        <button type="button" className="pr-ce" aria-haspopup="dialog" aria-label={`Période : ${titre(p).replace(/\.$/, '')}. Choisir la plage`} onClick={() => setOuverte(true)}>
          {p.genre === 'dates' ? <><span className="pr-long">{etiquetteCourte(p)}</span><span className="pr-court">{jj(bornes(p).du, horsAnneeEnCours(bornes(p).du, bornes(p).au))}–{jj(bornes(p).au, horsAnneeEnCours(bornes(p).du, bornes(p).au))}</span></> : etiquetteCourte(p)}
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
