import React from 'react';
import { etiquetteListe, francsSignes, jourLisible, nomRangee, type ChoseCalendrier } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ICONE_RANGEE, dureeVue } from './Marque';
import './feuille.css';

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

const montantDe = (c: ChoseCalendrier) => (c.centimes !== undefined ? `${c.reste ? 'reste ' : ''}${francsSignes(c.centimes)}` : c.coutAVenir ? 'coût à venir' : c.joursActifs ? `${c.joursActifs} j` : null);

/** « Décembre 2026 » : la majuscule est écrite, aucun text-transform (« Sans Date », CRITIQUE-3 n° 37). */
function nomMois(cle: string): string {
  const mois = jourLisible(`${cle}-01`).split(' ').slice(1).join(' ');
  return `${mois.charAt(0).toLocaleUpperCase('fr')}${mois.slice(1)} ${cle.slice(0, 4)}`;
}

function Ligne({ c, selectionId, onChose, detail }: { c: ChoseCalendrier } & Pick<VueListeProps, 'selectionId' | 'onChose' | 'detail'>) {
  const Icone = ICONE_RANGEE[c.rangee];
  const montant = montantDe(c);
  const proposee = !!(c.proposition || c.probable);
  /* un brassin : « J7 / 28 · prête 7 déc. » (ou « durée inconnue »), comme sur la frise */
  const duree = dureeVue(c);
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
          <small>{nomRangee(c.rangee)}{c.debut ? ` · ${etiquetteListe(c.debut)}` : ''}{duree ? ` · ${duree}` : ''}</small>
        </span>
        {montant && <span className={`cal-li-m${c.centimes !== undefined && c.centimes < 0 ? ' cal-neg' : ''}`}>{montant}</span>}
      </button>
      {selectionId === c.id && detail?.(c)}
    </li>
  );
}

export const VueListe: React.FC<VueListeProps> = ({ choses, sansDate, aujourdhui, ancre, selectionId, onChose, detail }) => {
  const poche = React.useRef<HTMLElement | null>(null);
  /* ouverte sur la poche (« Sans date · n » du menu, « Sans date › » du message de Retirer) : la poche vient sous l'en-tête et prend le focus */
  React.useEffect(() => {
    if (ancre !== 'sans-date' || !poche.current) return;
    poche.current.scrollIntoView?.({ block: 'start' });
    poche.current.focus({ preventScroll: true });
  }, [ancre]);

  /* CRITIQUE-3 n° 35 : ce qui a commencé et court encore (un brassin en cuve) va dans « En cours », en tête ; « À venir » commence
     aujourd'hui. Les brassins d'abord, puis par date. */
  const parDate = (a: ChoseCalendrier, b: ChoseCalendrier) => a.debut.localeCompare(b.debut) || a.titre.localeCompare(b.titre, 'fr');
  const enCours = React.useMemo(
    () => choses.filter(c => c.debut && c.debut < aujourdhui && (c.fin || c.debut) >= aujourdhui).slice()
      .sort((a, b) => Number(b.rangee === 'brassins') - Number(a.rangee === 'brassins') || parDate(a, b)),
    [choses, aujourdhui]
  );
  const aVenir = React.useMemo(() => choses.filter(c => c.debut && c.debut >= aujourdhui).slice().sort(parDate), [choses, aujourdhui]);
  /* par date : un titre quand le mois change, jamais une grille */
  const groupes = React.useMemo(() => {
    const m = new Map<string, ChoseCalendrier[]>();
    for (const c of aVenir) { const cle = c.debut.slice(0, 7); m.set(cle, [...(m.get(cle) ?? []), c]); }
    return [...m.entries()];
  }, [aVenir]);

  return (
    <div className="cal-liste" data-vue-liste>
      {groupes.length === 0 && enCours.length === 0 && <p className="cal-li-vide">Rien à venir. Le + pose un brassin, une fête, une vente…</p>}
      {enCours.length > 0 && (
        <section aria-label="En cours" data-en-cours>
          <h3 className="cal-li-mois">En cours · {enCours.length}</h3>
          <ul>{enCours.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      )}
      {groupes.length > 0 && <h3 className="cal-li-tete" data-a-venir>À venir</h3>}
      {groupes.map(([cle, lignes]) => (
        <section key={cle} aria-label={cle} data-a-venir-mois={cle}>
          <h3 className="cal-li-mois">{nomMois(cle)}</h3>
          <ul>{lignes.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      ))}
      {sansDate.length > 0 && (
        <section ref={poche} id="cal-sans-date" aria-label="Sans date" data-poche tabIndex={-1}>
          <h3 className="cal-li-mois">Sans date · {sansDate.length}</h3>
          <ul>{sansDate.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      )}
    </div>
  );
};
