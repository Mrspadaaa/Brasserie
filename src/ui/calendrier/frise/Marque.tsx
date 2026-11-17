import React from 'react';
import { Beer, FileText, Hammer, ListChecks, PartyPopper, ShoppingCart, TrendingUp } from 'lucide-react';
import { etiquetteS, jourLisible, type ChoseCalendrier, type Rangee } from '../../../domain/calendrier';
import { usePointeur } from './usePointeur';

/**
 * La marque (E27, D-198, D-199 ; « les évènements sont trop petits, peut-être utiliser une icône ») : en 3 mois, 6 mois et An, une chose
 * qui ferait moins de 24 px de large devient l'icône de sa rangée, avec un vrai nom pour le lecteur d'écran. Son nom vient aussi au
 * toucher (le détail). Un appui long ouvre la vue 6 semaines centrée sur sa semaine, où elle se déplace (f1-a).
 * **Nouveau, à valider** : la forme de la marque.
 */

export const ICONE_RANGEE: Record<Rangee, typeof Beer> = {
  brassins: Beer, fetes: PartyPopper, ventes: TrendingUp, achats: ShoppingCart, travaux: Hammer, activites: ListChecks, papiers: FileText
};

/** Les couleurs de zone de l'app, une classe par rangée (`frise.css` pose `--c`). */
export const CLASSE_TEINTE: Record<Rangee, string> = {
  brassins: 'cal-t-brassins', fetes: 'cal-t-fetes', ventes: 'cal-t-ventes', achats: 'cal-t-achats', travaux: 'cal-t-travaux', activites: 'cal-t-activites', papiers: 'cal-t-papiers'
};

/** Le nom lu à l'écran : « Frigo, 14 déc., S51 ». Jamais seulement une icône. */
export function nomAccessible(chose: ChoseCalendrier): string {
  const jour = chose.debut ? `${jourLisible(chose.debut)}, ${etiquetteS(chose.debut)}` : 'sans date';
  const propose = chose.proposition || chose.probable ? ', proposé' : '';
  return `${chose.titre}${propose}, ${jour}`;
}

export interface MarqueProps {
  chose: ChoseCalendrier;
  /** Centre de la marque dans la rangée, en px. */
  centre: number;
  haut: number;
  largeurColonne: number;
  epinglee?: boolean;
  etoilee?: boolean;
  selectionnee?: boolean;
  onToucher: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  /** Appui long : la vue 6 semaines centrée sur cette chose. */
  onSixSemaines: (chose: ChoseCalendrier) => void;
}

export const Marque: React.FC<MarqueProps> = ({ chose, centre, haut, largeurColonne, epinglee, etoilee, selectionnee, onToucher, onSixSemaines }) => {
  const cible = React.useRef<HTMLButtonElement | null>(null);
  const Icone = ICONE_RANGEE[chose.rangee];
  const gestes = usePointeur({
    largeurColonne,
    onToucher: () => cible.current && onToucher(chose, cible.current),
    onAppuiLong: () => onSixSemaines(chose)
  });
  const proposee = !!(chose.proposition || chose.probable);
  return (
    <button
      ref={cible}
      type="button"
      data-chose={chose.id}
      data-marque
      data-rangee={chose.rangee}
      {...(chose.proposition ? { 'data-proposition': chose.proposition } : {})}
      aria-label={nomAccessible(chose)}
      aria-pressed={selectionnee || undefined}
      className={`cal-marque ${CLASSE_TEINTE[chose.rangee]}${proposee ? ' cal-pointille' : ''}${epinglee ? ' cal-epi' : ''}${selectionnee ? ' cal-sel' : ''}`}
      style={{ left: centre - 14, top: haut }}
      {...gestes}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cible.current) onToucher(chose, cible.current); } }}
    >
      <Icone size={16} aria-hidden="true" />
      {etoilee && <span className="cal-etoile" aria-hidden="true">★</span>}
    </button>
  );
};
