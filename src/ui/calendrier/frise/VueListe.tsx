import React from 'react';
import { dateDeSemaine, francsSignes, jourLisible, nomRangee, type ChoseCalendrier } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ICONE_RANGEE } from './Marque';

/**
 * Vue liste (E40, D-204 ; « une vue pas calendrier avec juste des dates à venir serait bien utile ») : les mêmes choses, à venir, par date,
 * sans grille. Un toucher ouvre le même détail. La liste finit par la poche « Sans date » (E46) : jamais « Sans date · 0 », elle n'apparaît
 * pas vide. **Nouveau, à valider.**
 */

export interface VueListeProps {
  /** Les choses posées de la frise, propositions comprises. */
  choses: readonly ChoseCalendrier[];
  /** La poche (E46) : les choses sans date. */
  sansDate: readonly ChoseCalendrier[];
  aujourdhui: string;
  /** `'sans-date'` : ouverte sur la poche (le lien « Sans date › » du message de Retirer, la ligne du menu). */
  ancre?: 'sans-date';
  selectionId?: string | null;
  onChose: (chose: ChoseCalendrier, cible: HTMLElement) => void;
  /** Le détail de la chose touchée, sous sa ligne. */
  detail?: (chose: ChoseCalendrier) => React.ReactNode;
}

const montantDe = (c: ChoseCalendrier) => (c.centimes !== undefined ? francsSignes(c.centimes) : c.joursActifs ? `${c.joursActifs} j` : null);

function Ligne({ c, selectionId, onChose, detail }: { c: ChoseCalendrier } & Pick<VueListeProps, 'selectionId' | 'onChose' | 'detail'>) {
  const Icone = ICONE_RANGEE[c.rangee];
  const montant = montantDe(c);
  const proposee = !!(c.proposition || c.probable);
  return (
    <li className={`cal-li ${CLASSE_TEINTE[c.rangee]}`} data-liste-chose={c.id}>
      <button
        type="button"
        className={`cal-li-b${proposee ? ' cal-pointille' : ''}`}
        aria-expanded={selectionId === c.id}
        onClick={e => onChose(c, e.currentTarget)}
      >
        <span className="cal-li-i" aria-hidden="true"><Icone size={18} /></span>
        <span className="cal-li-t">
          <b>{c.titre}{proposee ? ' · proposé' : ''}</b>
          <small>{nomRangee(c.rangee)}{c.debut ? ` · ${dateDeSemaine(c.debut)}` : ''}</small>
        </span>
        {montant && <span className={`cal-li-m${c.centimes !== undefined && c.centimes < 0 ? ' cal-neg' : ''}`}>{montant}</span>}
      </button>
      {selectionId === c.id && detail?.(c)}
    </li>
  );
}

export const VueListe: React.FC<VueListeProps> = ({ choses, sansDate, aujourdhui, ancre, selectionId, onChose, detail }) => {
  const poche = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (ancre === 'sans-date') poche.current?.scrollIntoView?.({ block: 'start' });
  }, [ancre]);

  const aVenir = React.useMemo(
    () => choses.filter(c => c.debut && (c.fin || c.debut) >= aujourdhui).slice().sort((a, b) => a.debut.localeCompare(b.debut) || a.titre.localeCompare(b.titre, 'fr')),
    [choses, aujourdhui]
  );
  /* par date : un titre de jour quand le mois change, jamais une grille */
  const groupes = React.useMemo(() => {
    const m = new Map<string, ChoseCalendrier[]>();
    for (const c of aVenir) { const cle = c.debut.slice(0, 7); m.set(cle, [...(m.get(cle) ?? []), c]); }
    return [...m.entries()];
  }, [aVenir]);

  return (
    <div className="cal-liste" data-vue-liste>
      {groupes.length === 0 && <p className="cal-li-vide">Rien à venir. Le + pose un brassin, une fête, une vente…</p>}
      {groupes.map(([cle, lignes]) => (
        <section key={cle} aria-label={cle}>
          <h3 className="cal-li-mois">{jourLisible(`${cle}-01`).split(' ').slice(1).join(' ')} {cle.slice(0, 4)}</h3>
          <ul>{lignes.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      ))}
      {sansDate.length > 0 && (
        <section ref={poche} id="cal-sans-date" aria-label="Sans date" data-poche>
          <h3 className="cal-li-mois">Sans date · {sansDate.length}</h3>
          <ul>{sansDate.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      )}
    </div>
  );
};
