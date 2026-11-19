import React from 'react';
import { etiquetteListe, francsSignes, jourLisible, nomRangee, type ChoseCalendrier } from '../../../domain/calendrier';
import { CLASSE_TEINTE, ICONE_RANGEE, champ, dureeVue } from './Marque';
import './feuille.css';
import './liste.css';

/**
 * Vue liste (E40, D-204 ; « une vue pas calendrier avec juste des dates à venir serait bien utile ») : les mêmes choses, à venir, par date,
 * sans grille. Un toucher ouvre le même détail. La liste finit par la poche « Sans date » (E46) : jamais « Sans date · 0 », elle n'apparaît
 * pas vide. **Nouveau, à valider.**
 *
 * CRITIQUE-5 n° 4 (E40, D-19) : une chose en retard garde sa date d'échéance (« 10 nov. · S46 », jamais le jour où on la regarde) et va en
 * tête de « En cours » avec « en retard ». N° 22 : une bière pas brassée va avec elles, une seule date (« pas brassée · prévue le 10 nov. ·
 * S46 »). N° 21 : une échéance récurrente (E47 c) est « à payer », jamais « proposé ». N° 27 : le bas de la liste réserve la hauteur du +
 * volant, le montant de la dernière ligne reste lisible.
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

/** Les champs du retard (lot 1, CRITIQUE-5 n° 4) : lus sans les exiger, une chose sans eux n'est pas en retard. */
const enRetard = (c: ChoseCalendrier): boolean => champ(c, 'enRetard') === true;
const echeanceDe = (c: ChoseCalendrier): string | null => {
  const e = champ(c, 'echeance');
  return typeof e === 'string' && /^\d{4}-\d{2}-\d{2}/.test(e) ? e.slice(0, 10) : null;
};
const pasBrassee = (c: ChoseCalendrier): boolean => c.rangee === 'brassins' && champ(c, 'pasBrassee') === true;
/** Le jour où le brassage était prévu (lot A, `brassagePrevu`) ; sans lui, rien n'est dit (jamais aujourd'hui sous le mot « prévue »). */
const brassagePrevuDe = (c: ChoseCalendrier): string | null => {
  const j = champ(c, 'brassagePrevu');
  return typeof j === 'string' && /^\d{4}-\d{2}-\d{2}/.test(j) ? j.slice(0, 10) : null;
};
/** En tête de « En cours » : ce qui attend un geste (une pièce due, une bière pas brassée). */
const enAttente = (c: ChoseCalendrier): boolean => enRetard(c) || pasBrassee(c);
/** La date que la liste montre : l'échéance d'une chose en retard, sinon son début. */
const dateDe = (c: ChoseCalendrier): string => (enRetard(c) ? echeanceDe(c) ?? c.debut : c.debut);

const montantDe = (c: ChoseCalendrier) => (c.centimes !== undefined ? `${c.reste ? 'reste ' : ''}${francsSignes(c.centimes)}` : c.coutAVenir ? 'coût à venir' : c.joursActifs ? `${c.joursActifs} j` : null);

/** « · proposé », sauf une échéance récurrente (un loyer) : « · à payer » jusqu'au paiement (E47 c, n° 21). */
function marqueProposee(c: ChoseCalendrier): string | null {
  if (c.proposition === 'echeance') return 'à payer';
  return c.proposition || c.probable ? 'proposé' : null;
}

/**
 * CRITIQUE-11 n° 7 (E40, D-204) : à 390, « prête 7 » restait en fin de ligne et « déc. » passait seul à la suivante. Chaque morceau entre deux
 * « · » (une date, une plage « 30 nov. – 6 déc. », « J9 / 28 », « prête 7 déc. », « S46 ») est un seul nœud insécable (`cal-nowrap`,
 * `data-date`) ; seuls les « · » qui les séparent passent à la ligne.
 */
function insecables(texte: string): React.ReactNode {
  return texte.split(' · ').map((m, i) => (
    <React.Fragment key={i}>{i > 0 ? ' · ' : ''}<span className="cal-nowrap" data-date>{m}</span></React.Fragment>
  ));
}

/** La ligne grise sous le nom : la rangée, puis une seule date. */
function sousTitre(c: ChoseCalendrier): React.ReactNode {
  const jour = dateDe(c);
  if (pasBrassee(c)) {
    /* « pas brassée · prévue le 10 nov. · S46 » : la date une fois (n° 22). CRITIQUE-10 n° 3 (E08, D-19, E40) : le jour prévu réel
       (`brassagePrevu`), celui du détail (« Brassage 10 nov. · pas brassée »), jamais `debut`, ramené à aujourd'hui (« prévue le 18 nov. ») */
    const prevu = brassagePrevuDe(c);
    return <>{nomRangee(c.rangee)} · <span className="cal-li-retard cal-nowrap">pas brassée</span>{prevu ? <> · {insecables(`prévue le ${etiquetteListe(prevu)}`)}</> : ''}</>;
  }
  const duree = dureeVue(c);
  return (
    <>
      {nomRangee(c.rangee)}{jour ? <> · {insecables(etiquetteListe(jour))}</> : ''}{duree ? <> · {insecables(duree)}</> : ''}
      {enRetard(c) && <> · <span className="cal-li-retard cal-nowrap">en retard</span></>}
    </>
  );
}

/** « Décembre 2026 » : la majuscule est écrite, aucun text-transform (« Sans Date », CRITIQUE-3 n° 37). */
function nomMois(cle: string): string {
  const mois = jourLisible(`${cle}-01`).split(' ').slice(1).join(' ');
  return `${mois.charAt(0).toLocaleUpperCase('fr')}${mois.slice(1)} ${cle.slice(0, 4)}`;
}

function Ligne({ c, selectionId, onChose, detail }: { c: ChoseCalendrier } & Pick<VueListeProps, 'selectionId' | 'onChose' | 'detail'>) {
  const Icone = ICONE_RANGEE[c.rangee];
  const montant = montantDe(c);
  const marque = marqueProposee(c);
  return (
    <li className={`cal-li ${CLASSE_TEINTE[c.rangee]}`} data-liste-chose={c.id} data-retard={enAttente(c) ? '' : undefined}>
      <button
        type="button"
        className={`cal-li-b${marque ? ' cal-pointille' : ''}`}
        aria-expanded={selectionId === c.id}
        onClick={e => onChose(c, e.currentTarget)}
      >
        <span className="cal-li-i" aria-hidden="true"><Icone size={18} /></span>
        <span className="cal-li-t">
          <b>{c.titre}{marque ? ` · ${marque}` : ''}</b>
          <small>{sousTitre(c)}</small>
        </span>
        {montant && <span className={`cal-li-m${c.centimes !== undefined && c.centimes < 0 ? ' cal-neg' : ''}`}>{montant}</span>}
      </button>
      {selectionId === c.id && detail?.(c)}
    </li>
  );
}

/**
 * N° 27 : la place qui manque au bas de la liste pour que sa dernière ligne passe au-dessus du + volant (sa hauteur mesurée, lecture seule),
 * déduction faite de ce que la page réserve déjà sous la liste (le pied de l'onglet). 0 sans + volant.
 */
function useReserveVolant(liste: React.RefObject<HTMLElement | null>): number {
  const [reserve, setReserve] = React.useState(0);
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const lire = () => {
      const r = document.querySelector('.floating-actions')?.getBoundingClientRect();
      const fin = liste.current?.lastElementChild?.getBoundingClientRect();
      const page = document.scrollingElement;
      if (!r || r.height === 0 || r.top >= window.innerHeight || !fin || !page) { setReserve(0); return; }
      const besoin = Math.ceil(window.innerHeight - r.top) + 8;
      /* sous la dernière ligne : le reste de la page, moins la réserve déjà posée */
      const dessous = page.scrollHeight - (fin.bottom + window.scrollY);
      setReserve(actuelle => Math.max(0, Math.ceil(besoin - (dessous - actuelle))));
    };
    lire();
    const t = setTimeout(lire, 300);
    window.addEventListener('resize', lire);
    return () => { clearTimeout(t); window.removeEventListener('resize', lire); };
  }, []);
  return reserve;
}

export const VueListe: React.FC<VueListeProps> = ({ choses, sansDate, aujourdhui, ancre, selectionId, onChose, detail }) => {
  const poche = React.useRef<HTMLElement | null>(null);
  const racine = React.useRef<HTMLDivElement | null>(null);
  const reserve = useReserveVolant(racine);
  /* ouverte sur la poche (« Sans date · n » du menu, « Sans date › » du message de Retirer) : la poche vient sous l'en-tête et prend le focus */
  React.useEffect(() => {
    if (ancre !== 'sans-date' || !poche.current) return;
    poche.current.scrollIntoView?.({ block: 'start' });
    poche.current.focus({ preventScroll: true });
  }, [ancre]);

  /* CRITIQUE-3 n° 35 : ce qui a commencé et court encore (un brassin en cuve) va dans « En cours », en tête ; « À venir » commence
     aujourd'hui. En tête de « En cours » : les retards et les bières pas brassées (n° 4, n° 22), par date ; puis les brassins, puis par date. */
  const parDate = (a: ChoseCalendrier, b: ChoseCalendrier) => dateDe(a).localeCompare(dateDe(b)) || a.titre.localeCompare(b.titre, 'fr');
  /* PC-112 (CRITIQUE-13 n° 6, E40, E08) : une bière pas brassée ou une pièce due n'est pas « en cours » : elles ont leur section, « En retard »,
     en tête ; « En cours » ne garde que ce qui a commencé et court encore (un brassin en cuve) */
  const enRetard = React.useMemo(() => choses.filter(c => c.debut && enAttente(c)).slice().sort(parDate), [choses]);
  const enCours = React.useMemo(
    () => choses.filter(c => c.debut && !enAttente(c) && c.debut < aujourdhui && (c.fin || c.debut) >= aujourdhui).slice()
      .sort((a, b) => Number(b.rangee === 'brassins') - Number(a.rangee === 'brassins') || parDate(a, b)),
    [choses, aujourdhui]
  );
  const aVenir = React.useMemo(() => choses.filter(c => c.debut && !enAttente(c) && c.debut >= aujourdhui).slice().sort(parDate), [choses, aujourdhui]);
  /* par date : un titre quand le mois change, jamais une grille */
  const groupes = React.useMemo(() => {
    const m = new Map<string, ChoseCalendrier[]>();
    for (const c of aVenir) { const cle = c.debut.slice(0, 7); m.set(cle, [...(m.get(cle) ?? []), c]); }
    return [...m.entries()];
  }, [aVenir]);

  return (
    <div ref={racine} className="cal-liste" data-vue-liste style={reserve ? { paddingBottom: reserve } : undefined} data-reserve-volant={reserve || undefined}>
      {groupes.length === 0 && enCours.length === 0 && enRetard.length === 0 && <p className="cal-li-vide">Rien à venir. Le + pose un brassin, une fête, une vente…</p>}
      {enRetard.length > 0 && (
        <section aria-label="En retard" data-en-retard>
          <h3 className="cal-li-mois">En retard · {enRetard.length}</h3>
          <ul>{enRetard.map(c => <Ligne key={c.id} c={c} selectionId={selectionId} onChose={onChose} detail={detail} />)}</ul>
        </section>
      )}
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
