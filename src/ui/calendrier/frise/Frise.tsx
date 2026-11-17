import React from 'react';
import { RANGEES, ecartJours, type ChoseCalendrier, type Rangee as IdRangee } from '../../../domain/calendrier';
import { MESURES_PAYSAGE, MESURES_PORTRAIT, Rangee, pastille, positionDans, texteRenvoi, type Colonne, type DragEtat, type Renvoi, type RangeeProps } from './Rangee';
import './frise.css';

/**
 * La frise (E20 à E23, E39) : les sept rangées, dans l'ordre choisi, sur les colonnes de la fenêtre (semaines, ou mois pour l'année). Elle
 * mesure sa largeur (une seule mesure, passée à la courbe : l'alignement vient de la construction, MISSION § État de l'art) et rend la main à
 * `CalendrierTab` pour toute écriture. Rien n'est inventé : une rangée sans chose reste visible et dit « vide ».
 *
 * Masquer (l'œil) garde le titre et dit « n choses cachées » ; un filtre de la visite (« Fêtes seules ») ne laisse que la rangée choisie.
 * Dans les deux cas une chose épinglée reste visible (D-36, D-37).
 *
 * Les courses d'un brassin (caddies d'Achats) sont reliées à leur brassin par un trait pointillé, comme dans sa maquette (as/p-repos, D-107).
 * Une vente liée à un brassin visible, mais hors de la vue, laisse un renvoi « Livraison La Cigogne · S1 › » dans Ventes (E32), posé en
 * bout de rangée (CRITIQUE-3 n° 21).
 *
 * Contrat (lot t3-d) : `onSixSemaines?: (chose) => void` est appelé par l'appui long d'une marque en 3 mois, 6 mois ou An ; `vueLarge?`
 * dit si la vue est l'une de ces trois (sinon déduit des colonnes).
 */

export const ORDRE_PAR_DEFAUT: readonly IdRangee[] = RANGEES.map(r => r.id);

/** L'ordre gardé, complété par les rangées que l'ordre ne cite pas (jamais une rangée perdue). */
export function ordreComplet(ordre: readonly string[] | undefined): IdRangee[] {
  const connus = new Set<string>(ORDRE_PAR_DEFAUT);
  const choisi = (ordre ?? []).filter((r, i, a): r is IdRangee => connus.has(r) && a.indexOf(r) === i);
  return [...choisi, ...ORDRE_PAR_DEFAUT.filter(r => !choisi.includes(r))];
}

/** E32 : les ventes liées à un brassin visible dans la fenêtre, mais posées après elle. */
export function renvoisHorsVue(choses: readonly ChoseCalendrier[], colonnes: readonly Colonne[]): Renvoi[] {
  if (!colonnes.length) return [];
  const finVue = colonnes[colonnes.length - 1].fin;
  const visibles = new Set(choses.filter(c => c.source.genre === 'batch' && positionDans(colonnes, c)).map(c => c.source.id));
  return choses
    .filter(c => c.rangee === 'ventes' && c.debut > finVue && c.liens?.batchId && visibles.has(c.liens.batchId))
    .map(c => ({ chose: c, texte: texteRenvoi(c) }));
}

export interface FriseProps extends Pick<RangeeProps, 'drag' | 'ici' | 'etiquetteDuree' | 'barre' | 'onAjouter' | 'onBasculerMasque' | 'onSixSemaines' | 'onRenvoi'> {
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
  /** Largeur, à droite, où aucun nom ne se pose : la zone du + volant au téléphone (D-135). En paysage, réservée sur toute la hauteur (n° 27). */
  reserveDroite?: number;
  /**
   * 3 mois, 6 mois, An (E27, D-199) : une chose de moins de 24 px devient une marque, et l'appui long sur une marque appelle `onSixSemaines`
   * au lieu du menu. Absent : déduit des colonnes (des mois, ou plus de 6 semaines ; plus de 13 en paysage, dont la vue de base a 13 semaines).
   */
  vueLarge?: boolean;
  /** La largeur mesurée et celle d'une colonne : partagées avec la courbe. */
  onMesure?: (m: { largeur: number; largeurColonne: number }) => void;
}

interface Trait { id: string; d: string }

export const Frise: React.FC<FriseProps> = props => {
  const { choses, colonnes, paysage, ordre, masquees, filtre, epingles, etoiles, selectionId, menuId, detail, largeurRepli = 360, reserveDroite = 0, onMesure } = props;
  const zone = React.useRef<HTMLDivElement | null>(null);
  const [mesuree, setMesuree] = React.useState(0);
  const [traits, setTraits] = React.useState<Trait[]>([]);

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

  /* le trait d'un caddie à son brassin : mesuré après le rendu (les deux vivent dans deux rangées), redessiné seulement s'il change */
  React.useLayoutEffect(() => {
    const el = zone.current;
    if (!el) return;
    const z = el.getBoundingClientRect();
    const suivants: Trait[] = [];
    el.querySelectorAll<HTMLElement>('[data-brassin-lie]').forEach(caddie => {
      const id = caddie.getAttribute('data-brassin-lie');
      const barre = id ? [...el.querySelectorAll<HTMLElement>('[data-chose]')].find(x => x.getAttribute('data-chose') === `brassin-${id}`) : undefined;
      if (!barre) return;
      const c = caddie.getBoundingClientRect(), b = barre.getBoundingClientRect();
      if (!c.width || !b.width) return;
      const cx = c.left + c.width / 2 - z.left, cy = c.top - z.top;
      const bas = b.bottom - z.top, bg = b.left - z.left, bd = b.right - z.left;
      if (cy <= bas) return;
      const x = Math.max(bg + 6, Math.min(bd - 6, cx));
      const d = x === cx ? `M${cx.toFixed(1)} ${cy.toFixed(1)}V${bas.toFixed(1)}` : `M${cx.toFixed(1)} ${cy.toFixed(1)}V${(bas + 8).toFixed(1)}H${x.toFixed(1)}V${bas.toFixed(1)}`;
      suivants.push({ id: `${caddie.getAttribute('data-chose')}`, d });
    });
    const cle = (t: Trait[]) => t.map(x => `${x.id}:${x.d}`).join('|');
    if (cle(suivants) !== cle(traits)) setTraits(suivants);
  });

  /* D-135 (CRITIQUE-2 n° 13) : au repos, les rangées qui passent à la hauteur du + volant gardent leurs noms hors de sa zone ; mesuré après
     le rendu, une rangée ajoutée n'est jamais retirée tant que la mise en page ne change pas (pas d'oscillation) */
  const cleMise = `${paysage}|${colonnes.map(c => c.debut).join(',')}|${choses.length}|${masquees.join(',')}|${filtre ?? ''}`;
  const [sousFab, setSousFab] = React.useState<{ cle: string; ids: IdRangee[] }>({ cle: '', ids: [] });
  const idsSousFab = sousFab.cle === cleMise ? sousFab.ids : [];
  React.useLayoutEffect(() => {
    const el = zone.current;
    if (!el || !reserveDroite || typeof document === 'undefined') return;
    const fab = [...document.querySelectorAll<HTMLElement>('.floating-actions button')].find(b => /Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
    const f = fab?.getBoundingClientRect();
    if (!f || !f.height) return;
    const ajout: IdRangee[] = [];
    el.querySelectorAll<HTMLElement>('section[data-rangee]').forEach(s => {
      const r = s.getBoundingClientRect();
      const haut = r.top + window.scrollY, bas = r.bottom + window.scrollY;
      const id = s.getAttribute('data-rangee') as IdRangee;
      if (bas > f.top - 4 && haut < f.bottom + 4 && !idsSousFab.includes(id)) ajout.push(id);
    });
    if (ajout.length) setSousFab({ cle: cleMise, ids: [...idsSousFab, ...ajout] });
  });

  const largeur = mesuree || largeurRepli;
  const n = Math.max(1, colonnes.length);
  const enMois = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  const vueLarge = props.vueLarge ?? (enMois || colonnes.length > (paysage ? 13 : 6));
  const largeurColonne = largeur / n;
  const mesures = paysage ? MESURES_PAYSAGE : MESURES_PORTRAIT;
  const onMesureRef = React.useRef(onMesure);
  onMesureRef.current = onMesure;
  React.useEffect(() => { onMesureRef.current?.({ largeur, largeurColonne }); }, [largeur, largeurColonne]);

  const rangees = ordreComplet(ordre);
  const parRangee = (r: IdRangee) => choses.filter(c => c.rangee === r);
  const pastilles = rangees.map(r => Math.abs(pastille(r, parRangee(r), colonnes).part));
  const partMax = Math.max(0, ...pastilles);
  const renvois = renvoisHorsVue(choses, colonnes);

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
      {traits.length > 0 && (
        <svg className="cal-traits" aria-hidden="true" data-traits>
          {traits.map(t => <path key={t.id} d={t.d} data-trait={t.id} />)}
        </svg>
      )}
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
            paysage={paysage}
            reserveDroite={paysage || idsSousFab.includes(r) ? reserveDroite : 0}
            vueLarge={vueLarge}
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
            renvois={r === 'ventes' && !masquee ? renvois : []}
            onRenvoi={props.onRenvoi}
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
