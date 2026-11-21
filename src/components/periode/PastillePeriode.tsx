import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import type { Transaction } from '../../types';
import { ChoixPlage } from './ChoixPlage';
import { avance, bornes, enPeriode, etiquetteCourte, pas, peutPasser, titre, type Periode, type PeriodeEntree } from './periode';
import './periode.css';

/** « 12.10 » : le jour et le mois, comme dans les champs de la plage. */
const jj = (iso: string | null, avecAn = false) => (iso ? `${iso.slice(8)}.${iso.slice(5, 7)}${avecAn ? `.${iso.slice(2, 4)}` : ''}` : '');
/* CAL-PASSE (21.11, n° 11) : une plage hors de l'année en cours dit son année (« 05.07.27–14.11.27 »), sinon « 05.07–14.11 » se lit comme juillet de cette année. */
const horsAnneeEnCours = (du: string | null, au: string | null) => { const an = String(new Date().getFullYear()); return (!!du && du.slice(0, 4) !== an) || (!!au && au.slice(0, 4) !== an); };
/* CRN-20 (21.11) : la flèche « → » de la police, fine à 14 px, perdait sa pointe en clair (gris clair sur blanc) et se lisait « — », pas en
   cave. Elle se dessine (même tracé dans les deux thèmes) ; le caractère reste pour le texte lu (innerText, copier), sans être peint. */
const avecFleche = (texte: string): React.ReactNode => {
  const [du, au] = texte.split(' → ');
  if (au === undefined) return texte;
  return <>{du}<span className="pr-sep"><span className="pr-sep-t">{' → '}</span><ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>{au}</>;
};

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
        <button type="button" className="pr-fl" disabled={!ok || !peutPasser(p, -1)} aria-label="Période précédente" onClick={() => choisir(pas(p, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" className="pr-ce" aria-haspopup="dialog" aria-label={`Période : ${titre(p).replace(/\.$/, '')}. Choisir la plage`} onClick={() => setOuverte(true)}>
          {p.genre === 'dates' ? <><span className="pr-long">{avecFleche(etiquetteCourte(p))}</span><span className="pr-court">{jj(bornes(p).du, horsAnneeEnCours(bornes(p).du, bornes(p).au))}–{jj(bornes(p).au, horsAnneeEnCours(bornes(p).du, bornes(p).au))}</span></> : etiquetteCourte(p)}
        </button>
        <button type="button" className="pr-fl" disabled={!ok || !peutPasser(p, 1)} aria-label="Période suivante" onClick={() => choisir(pas(p, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </span>
      <Sheet open={ouverte} onClose={() => setOuverte(false)} title={`Période · ${titre(p)}`} subtitle="Elle vaut pour toute l’application">
        <ChoixPlage periode={p} transactions={transactions} onChoisir={choisir} />
      </Sheet>
    </>
  );
};
