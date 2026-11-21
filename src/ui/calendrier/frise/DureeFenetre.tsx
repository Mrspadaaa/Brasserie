import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MARGE_BOUTS_PX, borner, roleSous, useGlisse } from '../../geste';
import { ajouterJours, etiquetteS, jourLisible, lundiDe, type Rangee } from '../../../domain/calendrier';
import { CLASSE_TEINTE } from './Marque';

/**
 * D404 (21.11) : la durée d'une chose qui dure (fête, achat mis de côté, travaux, activité), dans la feuille d'ajout. L'horizon pose le début ;
 * la fin s'étire au geste de la frise B (`src/ui/geste`, réglage temps) : R1 (un toucher ne pose rien), R2 (la fin suit le déplacement, jamais
 * la position du doigt), R3 (le bord de fin se saisit à 22 px, et tout ce qui est à sa droite), R7 (au bord droit, l'échelle s'étend et la fin
 * avance), R10 (au lâcher, l'échelle se recale ; Échap rend la durée d'avant). Clavier (motif WAI-ARIA « slider ») : flèches ±1 semaine,
 * Page ±4, Origine : une semaine, Fin : le plus long.
 */
export interface DureeFenetreProps {
  rangee: Rangee;
  /** Lundi ISO du début (posé par l'horizon). */
  debut: string;
  /** Lundi ISO de la dernière semaine ; `null` : une seule semaine. */
  fin: string | null;
  onFin: (fin: string | null) => void;
  /** Le plus long, en semaines. */
  max?: number;
}

/** Au repos, au moins treize semaines sur la largeur : une semaine seule reste lisible, la fin se saisit loin du début. */
const SPAN_MIN = 13;
/** Sans mesure (jsdom, premier rendu) : la largeur de la feuille à 390. */
const LARGEUR_DEFAUT = 366;
const MS_SEMAINE = 7 * 86_400_000;

const semainesEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_SEMAINE);
/** La vue : la semaine (fractionnaire, 0 = le début) au bord gauche et le nombre de semaines sur la largeur. */
interface Vue { v0: number; span: number }
interface Saisie { n0: number; fin0: string | null; vue0: Vue; vue: Vue; off: number; w: number }

/** R4 : le début à 56 px du bord gauche ; la fin (le dimanche de sa semaine) à 56 px du bord droit, sauf sous treize semaines. */
function cadrer(n: number, w: number): Vue {
  const marge = Math.min(MARGE_BOUTS_PX, w / 4);
  const span = Math.max(SPAN_MIN, n * w / (w - 2 * marge));
  return { span, v0: -marge * span / w };
}

export function DureeFenetre({ rangee, debut, fin, onFin, max = 104 }: DureeFenetreProps) {
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
  const n = fin ? Math.max(1, semainesEntre(debut, fin) + 1) : 1;
  const [tenue, setTenue] = useState<Vue | null>(null);
  const vue = tenue ?? cadrer(n, w);
  const x = (semaine: number) => (semaine - vue.v0) / vue.span * w;
  const xa = x(0), xb = x(n);

  const poser = (k: number) => {
    const m = borner(Math.round(k), 1, max);
    const f = m > 1 ? lundiDe(ajouterJours(debut, (m - 1) * 7)) : null;
    if (f !== fin) onFin(f);
  };

  const ref = useGlisse<Saisie, HTMLDivElement>({
    cadre: () => piste.current,
    saisir: (px) => {
      if (roleSous(px, xa, xb) !== 'b') return null;
      const v = cadrer(n, w);
      setTenue(v);
      return { n0: n, fin0: fin, vue0: v, vue: v, off: 0, w };
    },
    suivre: (dx, s) => poser(s.n0 + dx * s.vue0.span / s.w + s.off),
    bord: (sens, vitesse, dt, s) => {
      if (sens < 0) return;
      const pas = vitesse * s.vue.span * dt;
      s.off += pas;
      s.vue = { ...s.vue, span: Math.min(max * 1.2, s.vue.span + pas) };
      setTenue(s.vue);
    },
    lacher: () => setTenue(null),
    annuler: (s) => { setTenue(null); if (s.fin0 !== fin) onFin(s.fin0); }
  });

  /* une ref stable : une ref neuve à chaque rendu détacherait le geste en cours (le rendu de la saisie l'annulait) */
  const refPiste = useCallback((el: HTMLDivElement | null) => { piste.current = el; ref(el); }, [ref]);

  const clavier = (e: React.KeyboardEvent) => {
    const pas: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 4, PageDown: -4 };
    if (e.key in pas) poser(n + pas[e.key]);
    else if (e.key === 'Home') poser(1);
    else if (e.key === 'End') poser(max);
    else return;
    e.preventDefault();
  };

  /* les repères : un trait par semaine quand il y a la place (8 px), sinon un par quatre ; le mois sous la semaine qui l'ouvre */
  const pxSemaine = w / vue.span;
  const tous = pxSemaine >= 8;
  const premiere = Math.ceil(vue.v0), derniere = Math.floor(vue.v0 + vue.span);
  const reperes: Array<{ k: number; lundi: string; mois: string | null }> = [];
  for (let k = premiere; k <= derniere; k++) {
    const lundi = ajouterJours(debut, k * 7);
    const jour = Number(lundi.slice(8));
    const mois = jour <= 7 ? jourLisible(lundi).split(' ').slice(1).join(' ') : null;
    if (tous || mois || k % 4 === 0) reperes.push({ k, lundi, mois });
  }
  const finTexte = fin ?? debut;

  return (
    <div className="cal-f-duree" data-duree data-vaul-no-drag>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-sm text-cave-200">Durée</span>
        <b className="text-sm font-semibold text-cave-50" data-duree-texte>{n === 1 ? '1 semaine' : `${n} sem.`}</b>
        <span className="text-sm text-cave-50">jusqu’à {etiquetteS(finTexte)}, {jourLisible(ajouterJours(finTexte, 6))}</span>
      </div>
      <div
        ref={refPiste}
        className={`cal-f-duree-piste ${CLASSE_TEINTE[rangee]}${tenue ? ' cal-f-duree-tenue' : ''}`}
        data-px-semaine={pxSemaine.toFixed(3)} data-x-fin={xb.toFixed(1)}
      >
        {reperes.map(r => (
          <span key={r.k} aria-hidden="true" className={`cal-f-duree-rep${r.mois ? ' cal-f-duree-rep-mois' : ''}`} style={{ left: x(r.k) }}>
            {r.mois && <small>{r.mois}</small>}
          </span>
        ))}
        <span aria-hidden="true" className="cal-f-duree-barre" style={{ left: xa, width: Math.max(2, xb - xa) }} />
        <div
          role="slider" tabIndex={0} aria-label="Fin" aria-orientation="horizontal"
          aria-valuemin={1} aria-valuemax={max} aria-valuenow={n}
          aria-valuetext={`${n === 1 ? '1 semaine' : `${n} semaines`}, jusqu’à ${etiquetteS(finTexte)}`}
          onKeyDown={clavier} data-fin-duree className="cal-f-duree-fin" style={{ left: xb }}
        />
      </div>
    </div>
  );
}
