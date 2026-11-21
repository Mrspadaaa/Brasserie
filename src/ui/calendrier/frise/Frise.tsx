import React from 'react';
import { RANGEES, barreLiee, ecartJours, estPonctuel, type ChoseCalendrier, type Rangee as IdRangee } from '../../../domain/calendrier';
import { colonneCourante, MESURES_PAYSAGE, MESURES_PAYSAGE_BRASSINS, MESURES_PORTRAIT, Rangee, pastille, positionDans, texteRenvoi, type Colonne, type DragEtat, type Renvoi, type RangeeProps } from './Rangee';
import { todayISO } from '../../../domain/finance/ledger';
import { GrilleJours } from './GrilleJours';
import { posee } from './posee';
import { usePincement } from './usePincement';
import { cheminDePoints, routerFil } from './routageFil';
import { aDesJours, type SensPincement } from '../echelle';
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

export interface FriseProps extends Pick<RangeeProps, 'drag' | 'ici' | 'etiquetteDuree' | 'barre' | 'onAjouter' | 'onToucherVide' | 'onBasculerMasque' | 'onSixSemaines' | 'onRenvoi'> {
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
  /** CRITIQUE-13 n° 1 : l'alerte f6-b et la rangée de la vente promise, où elle se pose dans le flux (sous la vente, elle pousse la suite). */
  alerte?: { rangee: IdRangee; noeud: React.ReactNode } | null;
  /** PC-109 (E33) : un message sans chose (l'échelle qui change la période) et sans place libre, posé en tête de la frise, dans le flux. */
  tete?: React.ReactNode;
  /** Largeur de repli quand rien ne se mesure (jsdom). */
  largeurRepli?: number;
  /** Largeur, à droite, où aucun nom ne se pose : la zone du + volant au téléphone (D-135). En paysage, réservée sur toute la hauteur (n° 27). */
  reserveDroite?: number;
  /**
   * 3 mois, 6 mois, An (E27, D-199) : une chose de moins de 24 px devient une marque, et l'appui long sur une marque appelle `onSixSemaines`
   * au lieu du menu. Absent : déduit des colonnes (des mois, ou plus de 6 semaines, en paysage aussi : CRITIQUE-4 n° 4).
   */
  vueLarge?: boolean;
  /** La largeur mesurée et celle d'une colonne : partagées avec la courbe. */
  onMesure?: (m: { largeur: number; largeurColonne: number }) => void;
  /** D385 (variante B) : deux doigts écartés ou pincés sur la frise ; `xClient` : le milieu des deux doigts. */
  onPincer?: (sens: SensPincement, xClient: number) => void;
  /** L'échelle montrée (`data-echelle`), pour les contrôles. */
  echelle?: string;
  /** Aujourd'hui (ISO) : son trait sur la grille des jours. */
  aujourdhui?: string;
  /** E44 : un calendrier de section ne montre que ces rangées. */
  seulement?: readonly IdRangee[];
}

interface Trait { id: string; d: string; fil?: 'repos' | 'allume' | 'pale'; auj?: boolean }

/** Une boîte à l'écran, dans le repère de la frise ; `texte` : un trou d'un texte (la ligne d'aujourd'hui ne s'interrompt que sous eux). */
export interface BoiteFil { left: number; top: number; right: number; bottom: number; texte?: boolean }

/**
 * CAL-FIL-SOUS-INFO (18.11, « La ligne doit pas être dessus l'info ») : ce que le fil et le trait d'un caddie ne traversent jamais. Le calque
 * des traits est déjà sous toute la frise (frise.css, z-index −1 dans une frise isolée) ; un texte laisse pourtant voir le fil entre ses
 * lettres, et un nom pâli (0,35) le laisse voir à travers lui. Chaque boîte listée ici devient un trou du masque des traits, comme le halo
 * d'une étiquette sur une carte : le fil s'interrompt sous l'info et reprend entre les éléments. Un texte reçoit 2 px de marge sur les côtés, 1 px en haut et en bas (ses lettres débordent sa ligne de 14 px).
 */
export const INFO_SOUS_FIL = [
  '.cal-lbl-t', '.cal-lbl-m', '.cal-lbl-j', '.cal-lie', '.cal-nom', '.cal-conf', '.cal-vide', '.cal-cachees', '.cal-cachees-f',
  '.cal-pastille-p', '.cal-oeil', '.cal-plus', '.cal-duree', '.cal-renvoi', '.cal-caddie', '.cal-commander', '.cal-badges', '.cal-etoile',
  '.cal-grille b', '.cal-point-bulle', '.cal-lie-ap', '.cal-ici', '.cal-msg', '.cal-filtre',
  /* les choses elles-mêmes (une barre est translucide) et la fiche ouverte : sans marge, le fil touche le bord de sa barre et de son jalon */
  '.cal-barre', '.cal-marque', '.cal-det', '.cal-fantome'
] as const;
const SANS_MARGE = new Set(['.cal-barre', '.cal-marque', '.cal-det', '.cal-fantome']);

/** Le trou d'une boîte dans le masque (repère de la frise), marge comprise ; `null` pour une boîte vide. */
export function trouMasque(r: BoiteFil, marge: number, margeHaut = 0): BoiteFil | null {
  if (r.right - r.left <= 0 || r.bottom - r.top <= 0) return null;
  return { left: r.left - marge, top: r.top - margeHaut, right: r.right + marge, bottom: r.bottom + margeHaut };
}

/**
 * D386 : le fil discret d'un jalon à sa barre liée (une autre rangée) : il part du bord du jalon tourné vers la barre, monte (ou descend)
 * jusqu'au bord de la barre, à l'aplomb du jalon s'il tombe sous elle, sinon par un coude à 8 px de la barre. `null` : les deux se touchent.
 */
export function cheminFil(jalon: BoiteFil, barre: BoiteFil): string | null {
  const cx = (jalon.left + jalon.right) / 2;
  const x = Math.max(barre.left + 6, Math.min(barre.right - 6, cx));
  const f = (n: number) => n.toFixed(1);
  if (jalon.top > barre.bottom) {
    const y0 = jalon.top, y1 = barre.bottom;
    return x === cx ? `M${f(cx)} ${f(y0)}V${f(y1)}` : `M${f(cx)} ${f(y0)}V${f(y1 + 8)}H${f(x)}V${f(y1)}`;
  }
  if (jalon.bottom < barre.top) {
    const y0 = jalon.bottom, y1 = barre.top;
    return x === cx ? `M${f(cx)} ${f(y0)}V${f(y1)}` : `M${f(cx)} ${f(y0)}V${f(y1 - 8)}H${f(x)}V${f(y1)}`;
  }
  return null;
}

/**
 * D386 et D390 : la barre touchée allume ses jalons liés ; un jalon lié touché s'allume lui-même ; les autres jalons pâlissent. `null` : rien
 * n'est allumé (pas de sélection, une barre sans jalon lié, un jalon sans barre à l'écran) ; aucun fil ne se dessine alors.
 */
export function jalonsAllumes(choses: readonly ChoseCalendrier[], selection: ChoseCalendrier | undefined): Set<string> | null {
  if (!selection) return null;
  if (estPonctuel(selection)) {
    const cible = barreLiee(selection);
    return cible && choses.some(c => c.id === cible && !estPonctuel(c)) ? new Set([selection.id]) : null;
  }
  const ids = choses.filter(c => estPonctuel(c) && barreLiee(c) === selection.id).map(c => c.id);
  return ids.length ? new Set(ids) : null;
}

export const Frise: React.FC<FriseProps> = props => {
  const { choses, colonnes, paysage, ordre, masquees, filtre, epingles, etoiles, selectionId, menuId, detail, largeurRepli = 360, reserveDroite = 0, onMesure } = props;
  const zone = React.useRef<HTMLDivElement | null>(null);
  const [mesuree, setMesuree] = React.useState(0);
  const [traits, setTraits] = React.useState<Trait[]>([]);
  const [trous, setTrous] = React.useState<BoiteFil[]>([]);
  const idMasque = `cal-masque-fil-${React.useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

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
  const clesTraits = React.useRef({ traits: '', trous: '' });
  const routes = React.useRef(new Map<string, { k: string; d: string | null }>());
  const mesurerTraits = React.useCallback(() => {
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
    /* D386, D390 : le fil d'un jalon à sa barre liée ne se dessine qu'allumé (barre ou jalon touché) ; au repos, le jalon porte un point
       de la couleur de sa barre (Marque). Au repos, un fil traversait une vente non liée et semblait la relier (test en ligne du lot A). */
    const demandes: Array<{ id: string; j: BoiteFil; b: BoiteFil }> = [];
    el.querySelectorAll<HTMLElement>('[data-lie-a][data-ton="allume"]').forEach(jalon => {
      const cible = jalon.getAttribute('data-lie-a');
      const barre = [...el.querySelectorAll<HTMLElement>('[data-chose]')].find(x => x.getAttribute('data-chose') === cible && !x.hasAttribute('data-marque'));
      if (!barre) return;
      const j = jalon.getBoundingClientRect(), b = barre.getBoundingClientRect();
      if (!j.width || !b.width) return;
      const rel = (r: DOMRect): BoiteFil => ({ left: r.left - z.left, right: r.right - z.left, top: r.top - z.top, bottom: r.bottom - z.top });
      demandes.push({ id: `fil-${jalon.getAttribute('data-chose')}`, j: rel(j), b: rel(b) });
    });
    /* Lot C (test en ligne, n° 2) : la ligne d'aujourd'hui (vue Jour, semaine dépliée) coupait le « J » de « J0 / 15 ». Elle se trace ici, sous
       un masque troué par les textes seuls, comme le fil : elle passe sous chaque nom et reprend entre eux. Sa place vient de la grille (`data-auj`). */
    el.querySelectorAll<HTMLElement>('[data-auj]').forEach((a, i) => {
      const r = a.getBoundingClientRect();
      if (!r.height || r.height >= z.height && r.width >= z.width) return;
      const x = r.left + r.width / 2 - z.left;
      suivants.push({ id: `auj-${i}`, d: `M${x.toFixed(1)} ${(r.top - z.top).toFixed(1)}V${(r.bottom - z.top).toFixed(1)}`, auj: true });
    });
    /* CAL-FIL-SOUS-INFO : les trous du masque, mesurés seulement s'il y a un trait à dessiner */
    const trousSuivants: BoiteFil[] = [];
    if (suivants.length || demandes.length) {
      for (const sel of INFO_SOUS_FIL) {
        const marge = SANS_MARGE.has(sel) ? 0 : 2;
        el.querySelectorAll<HTMLElement>(sel).forEach(x => {
          const r = x.getBoundingClientRect();
          const t = trouMasque({ left: r.left - z.left, right: r.right - z.left, top: r.top - z.top, bottom: r.bottom - z.top }, marge, marge ? 1 : 0);
          /* une boîte qui couvre toute la frise (jsdom, ou un élément sans place) ne fait pas de trou : elle effacerait tout le fil */
          if (t && !(r.width >= z.width && r.height >= z.height)) trousSuivants.push(marge && sel !== '.cal-grille b' ? { ...t, texte: true } : t);
        });
      }
      /* un nom est un seul bloc : son texte, son montant, sa durée, sa pastille « lié à » et l'icône posée contre lui. Sans cela, le fil
         passait entre « 2 cartons » et « +180 » (vu au banc à 390) : dans l'info, pas entre deux infos */
      el.querySelectorAll<HTMLElement>('.cal-lbl').forEach(lbl => {
        if (lbl.classList.contains('cal-lbl-cede')) return;
        const boites = [...lbl.querySelectorAll<HTMLElement>('.cal-lbl-t, .cal-lbl-m, .cal-lbl-j, .cal-lie')].map(x => x.getBoundingClientRect())
          .filter(r => r.width > 0 && r.height > 0 && !(r.width >= z.width && r.height >= z.height));
        if (!boites.length) return;
        const bloc = { left: Math.min(...boites.map(r => r.left)), right: Math.max(...boites.map(r => r.right)), top: Math.min(...boites.map(r => r.top)), bottom: Math.max(...boites.map(r => r.bottom)) };
        const icone = [...(lbl.parentElement?.children ?? [])].find(x => x.classList.contains('cal-marque'))?.getBoundingClientRect();
        if (icone && icone.width && icone.width < z.width && icone.top < bloc.bottom && icone.bottom > bloc.top && Math.max(icone.left - bloc.right, bloc.left - icone.right) <= 10) {
          bloc.left = Math.min(bloc.left, icone.left); bloc.right = Math.max(bloc.right, icone.right);
        }
        const t = trouMasque({ left: bloc.left - z.left, right: bloc.right - z.left, top: bloc.top - z.top, bottom: bloc.bottom - z.top }, 2, 1);
        if (t) trousSuivants.push({ ...t, texte: true });
      });
    }
    const cle = (t: Trait[]) => t.map(x => `${x.id}:${x.d}:${x.fil ?? ''}`).join('|');
    const cleTrous = (t: BoiteFil[]) => t.map(b => `${b.left.toFixed(1)},${b.top.toFixed(1)},${b.right.toFixed(1)},${b.bottom.toFixed(1)}${b.texte ? 't' : ''}`).join('|');
    const trousCle = cleTrous(trousSuivants);
    /* paquet D n° 1 : le fil se trace dans une voie libre, à côté des infos (routageFil) ; calculé seulement quand la frise ou le fil changent */
    for (const q of demandes) {
      const r = (b: BoiteFil) => `${b.left.toFixed(1)},${b.top.toFixed(1)},${b.right.toFixed(1)},${b.bottom.toFixed(1)}`;
      const k = `${r(q.j)}>${r(q.b)}|${Math.round(z.width)}|${trousCle}`;
      let d = routes.current.get(q.id);
      if (!d || d.k !== k) {
        const pts = routerFil(q.j, q.b, trousSuivants, z.width);
        d = { k, d: pts ? cheminDePoints(pts) : cheminFil(q.j, q.b) };
        routes.current.set(q.id, d);
      }
      if (d.d) suivants.push({ id: q.id, d: d.d, fil: 'allume' });
    }
    const k = { traits: cle(suivants), trous: trousCle };
    if (k.traits !== clesTraits.current.traits) setTraits(suivants);
    if (k.trous !== clesTraits.current.trous) setTrous(trousSuivants);
    clesTraits.current = k;
  }, []);
  React.useLayoutEffect(() => { mesurerTraits(); });
  /* CAL-FIL-SOUS-INFO : une rangée repose ses noms dans son propre rendu (`disposer`), sans rendre la frise ; le masque suit donc aussi chaque
     changement de place ou de classe dans la frise (hors du calque des traits), au plus une fois par image */
  React.useEffect(() => {
    const el = zone.current;
    if (!el || typeof MutationObserver === 'undefined') return undefined;
    let image = 0;
    let repos: ReturnType<typeof setTimeout> | null = null;
    /* à l'image suivante, puis une fois la page reposée (250 ms sans nouvel événement) : un nom reposé après coup est rattrapé */
    const plusTard = () => {
      if (!image) image = requestAnimationFrame(() => { image = 0; mesurerTraits(); });
      if (repos) clearTimeout(repos);
      repos = setTimeout(() => { repos = null; mesurerTraits(); }, 250);
    };
    window.addEventListener('focusin', plusTard);
    window.addEventListener('pointerup', plusTard, { capture: true });
    const mo = new MutationObserver(liste => {
      if (!liste.every(m => (m.target as Element).closest?.('svg.cal-traits'))) plusTard();
    });
    mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });
    /* une police arrivée après coup élargit les noms sans rien changer au DOM ; au banc, un nom repose aussi sa place juste après un
       défilement (fiche ouverte puis amenée à l'écran) sans mutation dans la frise : on remesure au défilement et au changement de taille */
    const polices = typeof document !== 'undefined' ? document.fonts : undefined;
    polices?.addEventListener?.('loadingdone', plusTard);
    window.addEventListener('scroll', plusTard, { passive: true, capture: true });
    window.addEventListener('resize', plusTard);
    return () => {
      mo.disconnect();
      polices?.removeEventListener?.('loadingdone', plusTard);
      window.removeEventListener('scroll', plusTard, { capture: true });
      window.removeEventListener('resize', plusTard);
      window.removeEventListener('focusin', plusTard);
      window.removeEventListener('pointerup', plusTard, { capture: true });
      if (image) cancelAnimationFrame(image);
      if (repos) clearTimeout(repos);
    };
  }, [mesurerTraits]);

  /* D-135 (CRITIQUE-2 n° 13) : au repos, les rangées qui passent à la hauteur du + volant gardent leurs noms hors de sa zone ; mesuré après
     le rendu, une rangée ajoutée n'est jamais retirée tant que la mise en page ne change pas (pas d'oscillation) */
  const cleMise = `${paysage}|${colonnes.map(c => c.debut).join(',')}|${choses.length}|${masquees.join(',')}|${filtre ?? ''}`;
  const [sousFab, setSousFab] = React.useState<{ cle: string; ids: IdRangee[]; reserve: number }>({ cle: '', ids: [], reserve: 0 });
  const idsSousFab = sousFab.cle === cleMise ? sousFab.ids : [];
  /*
   * CRITIQUE-7 n° 7 : « Brouwland · malt −42 », son 0 sous le + après la rotation revenue en portrait. Le + est fixe : la rangée qui passe sous
   * lui change quand la page défile ou tourne, sans nouveau rendu de la frise. La mesure se refait donc aussi au repos du défilement, au
   * changement de taille et d'orientation. La zone gardée est celle du + mesuré (du bord gauche du + moins 8 px au bord droit de la frise),
   * jamais moins que `reserveDroite`. Une rangée gardée le reste tant que la mise en page ne change pas : un nom ne saute pas d'un côté à
   * l'autre en défilant (pas d'oscillation).
   */
  const sousFabRef = React.useRef({ cle: cleMise, ids: idsSousFab, reserve: sousFab.reserve });
  sousFabRef.current = { cle: cleMise, ids: idsSousFab, reserve: sousFab.cle === cleMise ? sousFab.reserve : 0 };
  const mesurerSousFab = React.useCallback(() => {
    const el = zone.current;
    if (!el || !reserveDroite || typeof document === 'undefined') return;
    const fab = [...document.querySelectorAll<HTMLElement>('button[aria-label]')].find(b => /^Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
    const f = fab?.getBoundingClientRect();
    if (!f || !f.height) return;
    const { cle, ids, reserve } = sousFabRef.current;
    const z = el.getBoundingClientRect();
    const zoneFab = z.width > 0 ? Math.ceil(z.right - (f.left - 8)) : 0;
    const ajout: IdRangee[] = [];
    el.querySelectorAll<HTMLElement>('section[data-rangee]').forEach(s => {
      const r = s.getBoundingClientRect();
      const id = s.getAttribute('data-rangee') as IdRangee;
      /* le + et la rangée sont mesurés dans le même repère (l'écran) : la rangée passe-t-elle à sa hauteur, maintenant ? */
      if (r.bottom > f.top - 4 && r.top < f.bottom + 4 && !ids.includes(id)) ajout.push(id);
    });
    const nouvelle = Math.max(reserve, zoneFab > 0 && zoneFab < (z.width || Infinity) ? zoneFab : 0);
    if (ajout.length || nouvelle > reserve) setSousFab({ cle, ids: [...ids, ...ajout], reserve: nouvelle });
  }, [reserveDroite]);
  React.useLayoutEffect(() => { mesurerSousFab(); });
  /* CAL-PASSE Q n° 8 (21.11, « −420 » de Brouwland sous le + après l'étirement à 390) : la mise en page d'une rangée change sans nouveau rendu de
     la frise (une rangée du dessus grandit, la hauteur se pose après la mesure) et la page ne défile pas : la mesure se refait donc aussi quand
     la frise ou une de ses rangées change de taille */
  const veilleur = React.useRef<ResizeObserver | null>(null);
  React.useLayoutEffect(() => {
    const el = zone.current;
    if (!reserveDroite || !el || typeof ResizeObserver === 'undefined') return undefined;
    veilleur.current ??= new ResizeObserver(() => mesurerSousFab());
    veilleur.current.disconnect();
    veilleur.current.observe(el);
    el.querySelectorAll('section[data-rangee]').forEach(s => veilleur.current?.observe(s));
    return undefined;
  });
  React.useEffect(() => () => { veilleur.current?.disconnect(); veilleur.current = null; }, []);
  React.useEffect(() => {
    if (!reserveDroite || typeof window === 'undefined') return undefined;
    let t: ReturnType<typeof setTimeout> | null = null;
    /* au repos du défilement (120 ms sans bouger), et après une rotation, le temps que la page se repose */
    const plusTard = () => { if (t) clearTimeout(t); t = setTimeout(() => { t = null; mesurerSousFab(); }, 120); };
    window.addEventListener('scroll', plusTard, { passive: true, capture: true });
    window.addEventListener('resize', plusTard);
    window.addEventListener('orientationchange', plusTard);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener('scroll', plusTard, { capture: true });
      window.removeEventListener('resize', plusTard);
      window.removeEventListener('orientationchange', plusTard);
    };
  }, [reserveDroite, mesurerSousFab]);
  const reserveSousFab = Math.max(reserveDroite, sousFab.cle === cleMise ? sousFab.reserve : 0);

  const largeur = mesuree || largeurRepli;
  const n = Math.max(1, colonnes.length);
  const enMois = colonnes.length > 0 && ecartJours(colonnes[0].debut, colonnes[0].fin) >= 14;
  /* CRITIQUE-4 n° 4 (D-199, E27) : le paysage montre 13 semaines, c'est déjà une vue large. Plus de 6 semaines, au téléphone comme tourné :
     une marque prend l'appui long et ouvre les 6 semaines centrées sur elle, jamais le menu f5-a (qui reste aux barres et aux 6 semaines). */
  /* D385 : en vue Jour (14 colonnes d'un jour), la vue est étroite : on compte les jours couverts, pas les colonnes */
  const joursCouverts = colonnes.length ? ecartJours(colonnes[0].debut, colonnes[colonnes.length - 1].fin) + 1 : 0;
  const vueLarge = props.vueLarge ?? (enMois || joursCouverts > 6.5 * 7);
  usePincement(zone, props.onPincer);
  const avecJours = aDesJours(colonnes);
  const largeurColonne = largeur / n;
  /* CAL-PASSE (V-16, r2-c `.col.now`) : la semaine en cours, teintée d'UN bloc sur toute la hauteur de la frise (une teinte par rangée sortait
     de l'écran dans les lignes de rangées vides, plus étroites que la frise : scrollWidth 505 à 390) */
  const courante = colonneCourante(colonnes, props.aujourdhui ?? todayISO());
  const mesures = paysage ? MESURES_PAYSAGE : MESURES_PORTRAIT;
  const onMesureRef = React.useRef(onMesure);
  onMesureRef.current = onMesure;
  React.useEffect(() => { onMesureRef.current?.({ largeur, largeurColonne }); }, [largeur, largeurColonne]);

  /* CAL-PASSE : `ordreComplet` rend les rangées absentes de l'ordre gardé ; un calendrier de section (E44) n'en montre que les siennes */
  const rangees = ordreComplet(ordre).filter(r => !props.seulement || props.seulement.includes(r));
  const parRangee = (r: IdRangee) => choses.filter(c => c.rangee === r);
  const pastilles = rangees.map(r => Math.abs(pastille(r, parRangee(r), colonnes).part));
  const partMax = Math.max(0, ...pastilles);
  const renvois = renvoisHorsVue(choses, colonnes);

  const selection = selectionId ? choses.find(c => c.id === selectionId) : undefined;
  const eclairage = jalonsAllumes(choses, selection);
  /* D390 : la rangée de chaque barre, pour le point du jalon qui lui est lié (couleur de sa barre) */
  const rangeeDeBarre = React.useMemo(() => new Map(choses.filter(c => !estPonctuel(c)).map(c => [c.id, c.rangee] as const)), [choses]);
  /* le mot « auj. » au pied de la dernière piste qui montre quelque chose (une seule fois, comme la maquette) */
  const derniereAvecPiste = avecJours ? [...rangees].reverse().find(r => {
    if (filtre && filtre !== r && !parRangee(r).some(c => epingles.includes(c.id))) return false;
    const vues = parRangee(r).filter(c => positionDans(colonnes, c));
    return (masquees.includes(r) || (!!filtre && filtre !== r) ? vues.filter(c => epingles.includes(c.id)) : vues).length > 0;
  }) : undefined;
  /* D406 et D408 (21.11) : à une même échelle, chaque piste garde le plus grand nombre de lignes qu'elle a montré ; une
     rangée qui a montré quelque chose ne se range plus parmi les vides. Changer de période ou déplier une semaine ne fait plus bouger le
     calendrier ; changer d'échelle (un autre geste, un autre rendu) repart de zéro. */
  /* la semaine dépliée (`semaine-depliee`) reste l'échelle d'où on l'a dépliée : la replier, ou passer à une période où elle n'est plus, n'est
     pas un changement d'échelle */
  const echelleBase = React.useRef(props.echelle);
  if (props.echelle !== 'semaine-depliee') echelleBase.current = props.echelle;
  const cleHauteurs = `${echelleBase.current ?? ''}:${paysage ? 'p' : ''}`;
  /* la mémoire vaut pour une largeur mesurée : rien n'est retenu au premier rendu (largeur de repli, avant mesure : 2 lignes posées à
     360 px gardaient une ligne vide de 30 px dans Travaux au repos) ; elle repart de zéro quand la largeur change vraiment (> 1 px,
     rotation, fenêtre), jamais quand la mesure repasse à 0 */
  const hauteurs = React.useRef<{ cle: string; largeur: number; lignes: Map<IdRangee, number> }>({ cle: cleHauteurs, largeur: mesuree, lignes: new Map() });
  if (hauteurs.current.cle !== cleHauteurs || (mesuree > 0 && Math.abs(mesuree - hauteurs.current.largeur) > 1)) {
    hauteurs.current = { cle: cleHauteurs, largeur: mesuree, lignes: new Map() };
  }
  const lignesGardees = hauteurs.current.lignes;
  /* dépend de `mesuree` : une nouvelle mesure relance le relevé de chaque rangée, même si son nombre de lignes n'a pas changé */
  const noterLignes = React.useCallback((r: IdRangee, n: number) => {
    if (!mesuree) return;
    const m = hauteurs.current.lignes;
    if (n > (m.get(r) ?? 0)) m.set(r, n);
  }, [mesuree]);

  return (
    <div
      ref={zone}
      className={`cal-frise${paysage ? ' cal-paysage' : ''}`}
      data-frise
      data-nb-colonnes={n}
      data-echelle={props.echelle}
      data-largeur-colonne={largeurColonne.toFixed(2)}
      data-largeur={largeur}
      /* CRITIQUE-10, doute m22 : le cadre de focus (pastille « lié à », barres, marques) est pour le clavier seul ; après un toucher, aucun cadre
         (comme la bande des semaines, `data-doigt`). La touche suivante du clavier le rend. */
      /* CAL-LENT : posé une seule fois (le reposer à chaque toucher recalculait le style de toute la frise) */
      onPointerDownCapture={e => { if (!e.currentTarget.hasAttribute('data-doigt')) e.currentTarget.setAttribute('data-doigt', ''); }}
      onKeyDownCapture={e => { if (e.currentTarget.hasAttribute('data-doigt')) e.currentTarget.removeAttribute('data-doigt'); }}
    >
      {traits.length > 0 && (
        <svg className="cal-traits" aria-hidden="true" data-traits>
          {/* CAL-FIL-SOUS-INFO : blanc, le trait se voit ; noir (une info), il passe dessous et ne se voit pas */}
          <mask id={idMasque} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%" data-masque-fil>
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {trous.map((b, i) => (
              <rect key={i} x={b.left.toFixed(1)} y={b.top.toFixed(1)} width={(b.right - b.left).toFixed(1)} height={(b.bottom - b.top).toFixed(1)} fill="#000" data-trou />
            ))}
          </mask>
          <mask id={`${idMasque}-t`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%" data-masque-auj>
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {trous.filter(b => b.texte).map((b, i) => (
              <rect key={i} x={b.left.toFixed(1)} y={b.top.toFixed(1)} width={(b.right - b.left).toFixed(1)} height={(b.bottom - b.top).toFixed(1)} fill="#000" data-trou />
            ))}
          </mask>
          {/* la ligne d'aujourd'hui : sous les textes seulement (elle reste visible à travers une barre translucide, comme avant) */}
          <g mask={`url(#${idMasque}-t)`}>
            {traits.filter(t => t.auj).map(t => <path key={t.id} d={t.d} className="cal-auj-trait" data-auj-trait />)}
          </g>
          <g mask={`url(#${idMasque})`}>
            {traits.filter(t => !t.auj).map(t => (t.fil
              ? <path key={t.id} d={t.d} className={`cal-fil cal-fil-${t.fil}`} data-fil={t.id.slice(4)} />
              : <path key={t.id} d={t.d} data-trait={t.id} />))}
          </g>
        </svg>
      )}
      {courante && <i className="cal-col-now" aria-hidden="true" data-col-now style={{ ...posee(courante.debut * largeurColonne), width: courante.n * largeurColonne }} />}
      {props.tete}
      {grouperVides(rangees.map(r => {
        const dedans = parRangee(r);
        const filtreeParFiltre = !!filtre && filtre !== r;
        const masqueeParOeil = masquees.includes(r);
        const masquee = filtreeParFiltre || masqueeParOeil;
        const epinglees = dedans.filter(c => epingles.includes(c.id) && positionDans(colonnes, c));
        /* un filtre sans rien d'épinglé ne laisse pas la rangée : « Tout afficher » la rend */
        if (filtreeParFiltre && !masqueeParOeil && epinglees.length === 0) return null;
        /* paquet G n° 3 : une rangée vide (rien dans la fenêtre, ni renvoi, ni alerte), affichée, se range avec ses voisines vides */
        const vide = !masquee && !dedans.some(c => positionDans(colonnes, c)) && !(r === 'ventes' && renvois.length) && !(props.alerte && props.alerte.rangee === r) && !lignesGardees.get(r);
        return { r, vide, noeud: (
          <Rangee
            key={r}
            id={r}
            choses={dedans}
            colonnes={colonnes}
            largeurColonne={largeurColonne}
            largeur={largeur}
            mesures={paysage && r === 'brassins' ? MESURES_PAYSAGE_BRASSINS : mesures}
            paysage={paysage}
            reserveDroite={paysage ? reserveDroite : idsSousFab.includes(r) ? reserveSousFab : 0}
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
            {...(props.onToucherVide ? { onToucherVide: props.onToucherVide } : {})}
            onBasculerMasque={props.onBasculerMasque}
            barre={props.barre}
            onSixSemaines={props.onSixSemaines}
            detail={selection && selection.rangee === r && detail ? detail(selection) : undefined}
            alerte={props.alerte && props.alerte.rangee === r && !masquee ? props.alerte.noeud : undefined}
            eclairage={eclairage}
            rangeeDeBarre={rangeeDeBarre}
            lignesMin={masquee ? 0 : lignesGardees.get(r) ?? 0}
            onLignes={noterLignes}
            grille={avecJours ? <GrilleJours colonnes={colonnes} largeurColonne={largeurColonne} aujourdhui={props.aujourdhui} mot={r === derniereAvecPiste} /> : undefined}
          />
        ) };
      }), groupe => {
        /* pas de zone gardée sous le + volant ici (D-135 vaut pour les noms posés dans une piste) : la zone, prise au défilement et gardée,
           renvoyait le groupe à la ligne en cours de route (24 → 54 px) et la suite sautait */
        return (
          <div key={`vides-${groupe[0].r}`} className={`cal-vides${groupe.length > 1 ? ' cal-vides-n' : ''}`} data-rangees-vides={groupe.map(g => g.r).join(' ')}>
            {/* en tête du groupe : posé au bout, « vides » renvoyait à la ligne six rangées qui tiennent sur deux */}
            {groupe.length > 1 && <span className="cal-vides-mot" aria-hidden="true" data-vides-mot>vides</span>}
            {groupe.map(g => g.noeud)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * CAL-PLACE-GACHEE c (paquet G n° 3, 19.11) : Fêtes, Ventes, Achats « vide » prenaient chacune une rangée pleine. Les rangées vides
 * consécutives se rangent sur une même ligne compacte, dans l'ordre des rangées ; chacune garde son +, son nom, son œil et « vide ». Une
 * rangée non vide coupe le groupe ; au-delà de la largeur, la ligne revient à la ligne (frise.css, `.cal-vides`).
 */
export function grouperVides<T extends { r: IdRangee; vide: boolean; noeud: React.ReactNode }>(
  entrees: ReadonlyArray<T | null>, groupe: (g: T[]) => React.ReactNode
): React.ReactNode[] {
  const sortie: React.ReactNode[] = [];
  let courant: T[] = [];
  const fermer = () => { if (courant.length) sortie.push(groupe(courant)); courant = []; };
  for (const e of entrees) {
    if (!e) continue;
    if (e.vide) { courant.push(e); continue; }
    fermer();
    sortie.push(e.noeud);
  }
  fermer();
  return sortie;
}

export type { Colonne, DragEtat };
