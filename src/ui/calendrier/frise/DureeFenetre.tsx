import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MARGE_BOUTS_PX, borner, poserPlage, roleSous, useGlisse } from '../../geste';
import { ajouterJours, etiquetteS, jourLisible, lundiDe, type Rangee } from '../../../domain/calendrier';
import { CLASSE_TEINTE } from './Marque';
import './feuille.css';

/**
 * D404 (21.11) : la durée d'une chose qui dure (fête, achat mis de côté, travaux, activité), dans la feuille d'ajout. L'horizon pose le début ;
 * la plage se règle au geste de la frise B (`src/ui/geste`, réglage temps) : R1 (un toucher ne pose rien), R2 (le bord suit le déplacement,
 * jamais la position du doigt), R3 (chaque bord se saisit à 22 px, et tout ce qui est de son côté ; entre les deux, le corps), R4 (au repos, les
 * deux bouts à 56 px des bords), R5 (le corps déplace la plage entière, l'échelle défile sous elle), R6 (chaque bord se tire seul, une semaine
 * au moins), R7 (au bord, l'échelle s'étend et le bord tiré avance, l'autre bout reste à sa place), R8 (6 janv. 2025 → fin 2029), R10 (au
 * lâcher, l'échelle se recale ; Échap rend la plage d'avant). Clavier (motif WAI-ARIA « slider ») : flèches ±1 semaine, Page ±4, Origine et
 * Fin sur la fin.
 *
 * Capture-11 (21.11, « j'aimerais aussi pouvoir lui donner une date dans le passé ») : le début se tire aussi, vers le passé (`onPlage`).
 * Capture-12 (21.11, « pour papier et vente … pas une durée mais une date. Si par exemple j'ai oublié de noter une vente ») : `seule`, une
 * chose à une seule date prend la même frise avec un seul repère, que l'on tire dans le passé ou plus tard ; les horizons restent au-dessus.
 */
export interface DureeFenetreProps {
  rangee: Rangee;
  /** Lundi ISO du début (posé par l'horizon). */
  debut: string;
  /** Lundi ISO de la dernière semaine ; `null` : une seule semaine. */
  fin: string | null;
  onFin: (fin: string | null) => void;
  /** Le début tiré (ou la plage glissée) : le nouveau début et la nouvelle fin. Sans lui, seule la fin se tire. */
  onPlage?: (debut: string, fin: string | null) => void;
  /** Une seule date (vente, papier…) : un seul repère, sans durée. */
  seule?: boolean;
  /** CAL-JOUR (21.11) : le dernier jour écrit (fenêtre rouverte au jour) ; dans la semaine de fin, « jusqu’à » le dit à la place du dimanche. */
  jourFin?: string | null;
  /** T9-3 (22.11, la fiche d'une Fête dit « 1 j », Modifier disait « 1 semaine · jusqu'à S52, 27 déc. ») : sans fin, la chose s'écrit sur ce SEUL
   *  jour ; la durée le dit comme la fiche (« 1 j · le S52, mar. 22 déc. »), jamais une semaine jusqu'au dimanche. */
  jourSeul?: string | null;
  /** Le plus long, en semaines. */
  max?: number;
  /** CAL-FICHE-FRISE (22.11) : l'unité de la frise. `semaine` (défaut, la feuille) ; `jour` (la fiche d'une chose, `seule`) : un repère par jour, 8 px au moins. */
  pas?: 'semaine' | 'jour';
  /** Au lâcher d'un geste (pas à son annulation) : la fiche écrit alors la date. */
  onLacher?: () => void;
  /** D425 (22.11) : le premier et le dernier LUNDI de la plage (défaut R8 : 6 janv. 2025 → 31 déc. 2029). `ChoixDate` les pose autour de la valeur, pour qu'une
   *  pièce ancienne se corrige au doigt sans retomber sur janv. 2025. Le Calendrier n'en passe pas : rien ne change pour lui. */
  epoque?: string;
  dernier?: string;
}

/** Au repos, au moins treize semaines sur la largeur : une semaine seule reste lisible, la fin se saisit loin du début. */
const SPAN_MIN = 13;
/** Au jour : 42 jours sur la largeur (≈ 8 px par jour à 366, comme CAL-JOUR). */
const SPAN_MIN_JOUR = 42;
/** Sans mesure (jsdom, premier rendu) : la largeur de la feuille à 390. */
const LARGEUR_DEFAUT = 366;
const MS_JOUR = 86_400_000;
/** R8 : bornes du temps (6 janv. 2025 → fin 2029) ; les semaines se comptent depuis la première. */
const EPOQUE = '2025-01-06';
const DERNIER_LUNDI = '2029-12-31';

/** `u` : la longueur de l'unité en jours (7 : la semaine, 1 : le jour) ; l'époque est un lundi, les deux comptes partent d'elle. */
const unitesEntre = (a: string, b: string, u: number) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / (u * MS_JOUR));
const K_MIN = 0;
const kMax = (u: number, epoque: string, dernier: string) => unitesEntre(epoque, dernier, u) + 7 / u;

/** La vue : la semaine (fractionnaire, comptée depuis `EPOQUE`) au bord gauche et le nombre de semaines sur la largeur. */
interface Vue { v0: number; span: number }
type Role = 'a' | 'b' | 'corps';
interface Saisie { role: Role; a0: number; b0: number; debut0: string; fin0: string | null; vue0: Vue; vue: Vue; off: number; w: number }

/** R4 : le début à 56 px du bord gauche ; la fin (le dimanche de sa semaine) à 56 px du bord droit, sauf sous treize semaines. Seule : au milieu. */
function cadrer(a: number, b: number, w: number, seule: boolean, spanMin: number): Vue {
  if (seule) return { span: spanMin, v0: a + 0.5 - spanMin / 2 };
  const marge = Math.min(MARGE_BOUTS_PX, w / 4);
  const span = Math.max(spanMin, (b - a) * w / (w - 2 * marge));
  return { span, v0: a - marge * span / w };
}

export function DureeFenetre({ rangee, debut, fin, onFin, onPlage, seule = false, jourFin, jourSeul = null, max = 104, pas = 'semaine', onLacher, epoque = EPOQUE, dernier = DERNIER_LUNDI }: DureeFenetreProps) {
  const jour = pas === 'jour';
  const u = jour ? 1 : 7, spanMin = jour ? SPAN_MIN_JOUR : SPAN_MIN, K_MAX = kMax(u, epoque, dernier);
  const kDe = (d: string) => unitesEntre(epoque, d, u);
  const lundiK = (k: number) => ajouterJours(epoque, k * u);
  const piste = useRef<HTMLDivElement | null>(null);
  const [largeur, setLargeur] = useState(0);
  useLayoutEffect(() => {
    const el = piste.current;
    if (!el) return undefined;
    const lire = () => { if (el.clientWidth > 0) setLargeur(el.clientWidth); };
    lire();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = largeur || LARGEUR_DEFAUT;
  const n = !seule && fin ? Math.max(1, unitesEntre(debut, fin, u) + 1) : 1;
  const a = kDe(debut), b = a + n;
  const [tenue, setTenue] = useState<Vue | null>(null);
  const vue = tenue ?? cadrer(a, b, w, seule, spanMin);
  const x = (semaine: number) => (semaine - vue.v0) / vue.span * w;
  const xa = x(a), xb = x(b), xp = x(a + 0.5);

  /** Pose la plage [a2, b2[ (semaines depuis EPOQUE) : la fin seule passe par `onFin`, un début changé par `onPlage`. */
  const poser = (a2: number, b2: number) => {
    const d = lundiK(a2), f = !seule && b2 - a2 > 1 ? lundiK(b2 - 1) : null;
    if (d !== debut && onPlage) onPlage(d, f);
    else if (d === debut && f !== fin) onFin(f);
  };
  const poserFin = (k: number) => poser(a, a + borner(Math.round(k), 1, max));
  const poserDebut = (k: number) => poser(borner(Math.round(k), Math.max(K_MIN, b - max), b - 1), b);
  const deplacer = (k: number) => { const dd = borner(Math.round(k), K_MIN - a, K_MAX - b); poser(a + dd, b + dd); };

  const ref = useGlisse<Saisie, HTMLDivElement>({
    cadre: () => piste.current,
    saisir: (px) => {
      const role: Role = seule ? 'corps' : roleSous(px, xa, xb);
      if (!onPlage && role !== 'b') return null;
      const v = cadrer(a, b, w, seule, spanMin);
      setTenue(v);
      return { role, a0: a, b0: b, debut0: debut, fin0: fin, vue0: v, vue: v, off: 0, w };
    },
    suivre: (dx, s) => {
      const d = dx * s.vue0.span / s.w + s.off;
      const lim = {
        min: s.role === 'a' ? Math.max(K_MIN, s.b0 - max) : K_MIN,
        max: s.role === 'b' ? Math.min(K_MAX, s.a0 + max) : K_MAX,
        minLarg: 1, pas: 1
      };
      const p = poserPlage(s.role, s.a0, s.b0, d, lim);
      // R5 : la plage glissée reste entière à l'écran ; arrivée à 56 px d'un bord, c'est l'échelle qui défile sous elle
      if (s.role === 'corps') {
        const M = Math.min(MARGE_BOUTS_PX, s.w / 4), q = s.w / s.vue.span;
        const ga = seule ? p.a + 0.5 : p.a, gb = seule ? p.a + 0.5 : p.b;
        if ((ga - s.vue.v0) * q < M) s.vue = { ...s.vue, v0: ga - M / q };
        else if ((gb - s.vue.v0) * q > s.w - M) s.vue = { ...s.vue, v0: gb - (s.w - M) / q };
        setTenue(s.vue);
      }
      poser(p.a, p.b);
    },
    bord: (sens, vitesse, dt, s) => {
      const pas = vitesse * s.vue.span * dt, span = Math.min(max * 1.2, s.vue.span + pas);
      if (s.role === 'corps') {
        // R7 : le corps avance dans le sens du doigt, l'échelle défile avec lui
        s.off += sens * pas;
        s.vue = { ...s.vue, v0: s.vue.v0 + sens * pas };
      } else if (s.role === 'b' && sens > 0) {
        // R7 : la fin tirée dehors ; l'échelle se resserre, le début reste à sa place à l'écran
        const xa0 = (s.a0 - s.vue.v0) / s.vue.span;
        s.off += pas;
        s.vue = { span, v0: s.a0 - xa0 * span };
      } else if (s.role === 'a' && sens < 0) {
        // R7 : le début tiré vers le passé ; la fin reste à sa place à l'écran
        const xb0 = (s.b0 - s.vue.v0) / s.vue.span;
        s.off -= pas;
        s.vue = { span, v0: s.b0 - xb0 * span };
      } else return;
      setTenue(s.vue);
    },
    lacher: () => { setTenue(null); onLacher?.(); },
    annuler: (s) => {
      setTenue(null);
      if (s.debut0 !== debut && onPlage) onPlage(s.debut0, s.fin0);
      else if (s.fin0 !== fin) onFin(s.fin0);
    }
  });

  /* une ref stable : une ref neuve à chaque rendu détacherait le geste en cours (le rendu de la saisie l'annulait) */
  const refPiste = useCallback((el: HTMLDivElement | null) => { piste.current = el; ref(el); }, [ref]);

  const PG = jour ? 7 : 4;
  const PAS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: PG, PageDown: -PG };
  const clavier = (e: React.KeyboardEvent) => {
    if (e.key in PAS) poserFin(n + PAS[e.key]);
    else if (e.key === 'Home') poserFin(1);
    else if (e.key === 'End') poserFin(max);
    else return;
    e.preventDefault();
  };
  const clavierDebut = (e: React.KeyboardEvent) => {
    if (!(e.key in PAS)) return;
    e.preventDefault();
    if (seule) deplacer(PAS[e.key]); else poserDebut(a + PAS[e.key]);
  };

  /* les repères : un trait par semaine quand il y a la place (8 px), sinon un par quatre ; le mois sous la semaine qui l'ouvre.
     Au jour : un trait court par jour (dès 4 px), plein aux lundis et au 1er du mois, le mois nommé sous son 1er */
  const pxUnite = w / vue.span;
  const tous = pxUnite >= (jour ? 4 : 8);
  const premiere = Math.ceil(vue.v0), derniere = Math.floor(vue.v0 + vue.span);
  const reperes: Array<{ k: number; plein: boolean; mois: string | null }> = [];
  for (let k = premiere; k <= derniere; k++) {
    const d = lundiK(k);
    const j1 = Number(d.slice(8));
    if (jour) {
      const plein = k % 7 === 0 || j1 === 1;
      if (tous || plein) reperes.push({ k, plein, mois: j1 === 1 ? jourLisible(d).split(' ').slice(1).join(' ') : null });
    } else {
      const mois = j1 <= 7 ? jourLisible(d).split(' ').slice(1).join(' ') : null;
      if (tous || mois || k % 4 === 0) reperes.push({ k, plein: !!mois, mois });
    }
  }
  const pxSemaine = pxUnite * 7 / u;
  const finTexte = fin ?? debut;

  return (
    <div className={`cal-f-duree${jour ? ' cal-f-duree-jour' : ''}`} data-duree={seule ? undefined : ''} data-date-seule={seule ? '' : undefined} data-pas={pas} data-vaul-no-drag>
      {!seule && (
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-sm text-cave-200">Durée</span>
          {n === 1 && !fin && jourSeul ? (
            <>
              <b className="text-sm font-semibold text-cave-50" data-duree-texte>1 j</b>
              <span className="text-sm text-cave-50">le {etiquetteS(lundiDe(jourSeul))}, {jourLisible(jourSeul)}</span>
            </>
          ) : (
            <>
              <b className="text-sm font-semibold text-cave-50" data-duree-texte>{n === 1 ? '1 semaine' : `${n} sem.`}</b>
              <span className="text-sm text-cave-50">jusqu’à {etiquetteS(finTexte)}, {jourLisible(jourFin && lundiDe(jourFin) === lundiDe(finTexte) ? jourFin : ajouterJours(finTexte, 6))}</span>
            </>
          )}
        </div>
      )}
      <div
        ref={refPiste}
        className={`cal-f-duree-piste ${CLASSE_TEINTE[rangee]}${tenue ? ' cal-f-duree-tenue' : ''}`}
        data-px-semaine={pxSemaine.toFixed(3)} data-px-jour={(pxUnite * (jour ? 1 : 1 / 7)).toFixed(3)} data-x-debut={xa.toFixed(1)} data-x-fin={xb.toFixed(1)}
      >
        {reperes.map(r => (
          <span key={r.k} aria-hidden="true" className={`cal-f-duree-rep${r.plein ? ' cal-f-duree-rep-mois' : jour ? ' cal-f-duree-rep-court' : ''}`} style={{ left: x(r.k) }}>
            {r.mois && <small>{r.mois}</small>}
          </span>
        ))}
        {seule ? (
          <div
            role="slider" tabIndex={0} aria-label="Date" aria-orientation="horizontal"
            aria-valuemin={K_MIN} aria-valuemax={K_MAX - 1} aria-valuenow={a} aria-valuetext={jour ? `${jourLisible(debut)}, ${etiquetteS(lundiDe(debut))}` : `${etiquetteS(debut)}, ${jourLisible(debut)}`}
            onKeyDown={clavierDebut} data-date-point className="cal-f-duree-poi" style={{ left: xp }}
          />
        ) : (
          <>
            <span aria-hidden="true" className="cal-f-duree-barre" style={{ left: xa, width: Math.max(2, xb - xa) }} />
            {onPlage && (
              <div
                role="slider" tabIndex={0} aria-label="Début" aria-orientation="horizontal"
                aria-valuemin={K_MIN} aria-valuemax={K_MAX - 1} aria-valuenow={a} aria-valuetext={`${etiquetteS(debut)}, ${jourLisible(debut)}`}
                onKeyDown={clavierDebut} data-debut-duree className="cal-f-duree-poi" style={{ left: xa }}
              />
            )}
            <div
              role="slider" tabIndex={0} aria-label="Fin" aria-orientation="horizontal"
              aria-valuemin={1} aria-valuemax={max} aria-valuenow={n}
              aria-valuetext={`${n === 1 ? '1 semaine' : `${n} semaines`}, jusqu’à ${etiquetteS(finTexte)}`}
              onKeyDown={clavier} data-fin-duree className="cal-f-duree-fin" style={{ left: xb }}
            />
          </>
        )}
      </div>
    </div>
  );
}
