import React from 'react';
import { RANGEES, type ChoseCalendrier, type Rangee as IdRangee } from '../../../domain/calendrier';
import { MESURES_PAYSAGE, MESURES_PORTRAIT, Rangee, pastille, positionDans, type Colonne, type DragEtat, type RangeeProps } from './Rangee';
import './frise.css';

/**
 * La frise (E20 à E23, E39) : les sept rangées, dans l'ordre choisi, sur les colonnes de la fenêtre (semaines, ou mois pour l'année). Elle mesure
 * sa largeur (une seule mesure, passée à la courbe : l'alignement vient de la construction, MISSION § État de l'art) et rend la main à
 * `CalendrierTab` pour toute écriture. Rien n'est inventé : une rangée sans chose reste visible et dit « vide ».
 *
 * Masquer (l'œil) garde le titre et dit « n choses cachées » ; un filtre de la visite (« Fêtes seules ») ne laisse que la rangée choisie.
 * Dans les deux cas une chose épinglée reste visible (D-36, D-37).
 */

export const ORDRE_PAR_DEFAUT: readonly IdRangee[] = RANGEES.map(r => r.id);

/** L'ordre gardé, complété par les rangées que l'ordre ne cite pas (jamais une rangée perdue). */
export function ordreComplet(ordre: readonly string[] | undefined): IdRangee[] {
  const connus = new Set<string>(ORDRE_PAR_DEFAUT);
  const choisi = (ordre ?? []).filter((r, i, a): r is IdRangee => connus.has(r) && a.indexOf(r) === i);
  return [...choisi, ...ORDRE_PAR_DEFAUT.filter(r => !choisi.includes(r))];
}

export interface FriseProps extends Pick<RangeeProps, 'drag' | 'ici' | 'etiquetteDuree' | 'barre' | 'onAjouter' | 'onBasculerMasque' | 'onSixSemaines'> {
  choses: readonly ChoseCalendrier[];
  colonnes: readonly Colonne[];
  paysage: boolean;
  ordre: readonly IdRangee[];
  masquees: readonly IdRangee[];
  /** « Fêtes seules » : une rangée seule, le temps de la visite ; `null` : toutes. */
  filtre: IdRangee | null;
  epingles: readonly string[];
  etoiles: readonly string[];
  selectionId?: string | null;
  menuId?: string | null;
  /** Le détail de la chose choisie, posé sous sa rangée. */
  detail?: (chose: ChoseCalendrier) => React.ReactNode;
  /** Largeur de repli quand rien ne se mesure (jsdom). */
  largeurRepli?: number;
  /** La largeur mesurée et celle d'une colonne : partagées avec la courbe. */
  onMesure?: (m: { largeur: number; largeurColonne: number }) => void;
}

export const Frise: React.FC<FriseProps> = props => {
  const { choses, colonnes, paysage, ordre, masquees, filtre, epingles, etoiles, selectionId, menuId, detail, largeurRepli = 360, onMesure } = props;
  const zone = React.useRef<HTMLDivElement | null>(null);
  const [mesuree, setMesuree] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = zone.current;
    if (!el) return undefined;
    const lire = () => { const w = Math.round(el.getBoundingClientRect().width); if (w > 0) setMesuree(w); };
    lire();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const largeur = mesuree || largeurRepli;
  const n = Math.max(1, colonnes.length);
  const largeurColonne = largeur / n;
  const mesures = paysage ? MESURES_PAYSAGE : MESURES_PORTRAIT;
  const onMesureRef = React.useRef(onMesure);
  onMesureRef.current = onMesure;
  React.useEffect(() => { onMesureRef.current?.({ largeur, largeurColonne }); }, [largeur, largeurColonne]);

  const rangees = ordreComplet(ordre);
  const parRangee = (r: IdRangee) => choses.filter(c => c.rangee === r);
  const pastilles = rangees.map(r => Math.abs(pastille(r, parRangee(r), colonnes).part));
  const partMax = Math.max(0, ...pastilles);

  const selection = selectionId ? choses.find(c => c.id === selectionId) : undefined;

  return (
    <div
      ref={zone}
      className={`cal-frise${paysage ? ' cal-paysage' : ''}`}
      data-frise
      data-nb-colonnes={n}
      data-largeur-colonne={largeurColonne.toFixed(2)}
      data-largeur={largeur}
    >
      {rangees.map(r => {
        const dedans = parRangee(r);
        const filtreeParFiltre = !!filtre && filtre !== r;
        const masqueeParOeil = masquees.includes(r);
        const masquee = filtreeParFiltre || masqueeParOeil;
        const epinglees = dedans.filter(c => epingles.includes(c.id) && positionDans(colonnes, c));
        /* un filtre sans rien d'épinglé ne laisse pas la rangée : « Tout afficher » la rend */
        if (filtreeParFiltre && !masqueeParOeil && epinglees.length === 0) return null;
        return (
          <Rangee
            key={r}
            id={r}
            choses={dedans}
            colonnes={colonnes}
            largeurColonne={largeurColonne}
            largeur={largeur}
            mesures={mesures}
            masquee={masquee}
            cause={masqueeParOeil ? 'oeil' : filtreeParFiltre ? 'filtre' : null}
            epingles={epingles}
            etoiles={etoiles}
            partMax={partMax}
            selectionId={selectionId}
            menuId={menuId}
            drag={props.drag}
            ici={props.ici}
            etiquetteDuree={props.etiquetteDuree}
            onAjouter={props.onAjouter}
            onBasculerMasque={props.onBasculerMasque}
            barre={props.barre}
            onSixSemaines={props.onSixSemaines}
            detail={selection && selection.rangee === r && detail ? detail(selection) : undefined}
          />
        );
      })}
    </div>
  );
};

export type { Colonne, DragEtat };
