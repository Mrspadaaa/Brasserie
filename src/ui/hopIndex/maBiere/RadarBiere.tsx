// Le radar de Ma bière, sur le radar commun (commun/RadarBase.tsx, porté de cmc2h : « Ensuite utiliser ce radar graph comme
// Baseline et l'utiliser partout dans les vue où il y en a », 25.10, voie rb2-ma-biere). Ce qu'il garde de m4, son
// choix dans cet écran (consolide/biere.html, radar.js : RADAR.biere ; « Radar: m4 h4 très bien, attention à pas
// surchargé en texte ni en légende », 19.10) :
// - ma dégustation (notée dans la grille dessous) face à la zone du style, 12 axes, agrumes en haut ;
// - une note en mots : « pas senti » (0) sur l'anneau du zéro, faible 1, moyen 2, marqué 3. Une échelle commune
//   (jamais normalisée par axe : D68), les anneaux nommés sur l'axe du haut ;
// - ma dégustation pleine en bleu (#0072B2, sa base), l'orangé sur le sommet au-dessus du style (même seuil que la
//   grille : 0,05) ; les familles que le style attend cernées ;
// - pas goûté = inconnu (D65), jamais un zéro : le secteur hachuré à sa place, le picto pâli et « ? », AUCUN point
//   (m4 posait une marque creuse au centre ; la baseline n'en pose aucune) ;
// - au toucher d'un secteur, la famille en mots dans une bulle (« Résineux : marqué, au-dessus du style »).
// Le radar n'a pas de bascule visible (la base replie « Au style / Absolu » en vue Radar, et dessine le même radar) :
// il reste au style. Sans légende écrite (le « ? » de l'onglet l'ouvre, D113). Classes préfixées pq-biere- (L26).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { COURT, ROUE } from './commun';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { RadarBase } from '../commun/RadarBase';

/** Une note de dégustation : 0 pas senti, 1 faible, 2 moyen, 3 marqué ; null pas goûté (inconnu, jamais 0). */
export type Note = 0 | 1 | 2 | 3 | null;
export const NIVEAUX_DEGUSTATION = ['pas senti', 'faible', 'moyen', 'marqué'] as const;
/** Une note au-dessus du haut de la bande du style (même seuil que la base : 0,05). */
export const auDessus = (v: Note, haut: number) => v != null && v > haut + 0.05;

// Le bleu de ma bière, celui de sa base (radar.js).
const MOI = '#0072B2';
/** L'échelle des notes : 4 anneaux, de « pas senti » à « marqué », communs à tous les axes. */
const ECHELLE = { pas: 1, nb: 3, etiquettes: [...NIVEAUX_DEGUSTATION] };

/** Ce que la bulle dit d'une famille. */
export function motsRadar(f: FamilyId, v: Note, haut: number) {
  if (v == null) return ' : pas goûté, inconnu (ce n’est pas zéro)';
  return ` : ${NIVEAUX_DEGUSTATION[v]}, ${auDessus(v, haut) ? 'au-dessus du style' : 'dans le style'}`;
}

/** La bulle, posée par le radar commun à son ancre (fractions du radar) : au-dessus (dessous près du haut), dans la
 *  largeur du radar (radar.js : g.montrer). */
function BulleRadar({ ancre, children }: { ancre: { x: number; y: number }; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current, boite = el?.parentElement, svg = boite?.querySelector('svg[data-radar]');
    if (!el || !boite || !svg) return;
    const s = svg.getBoundingClientRect(), b = boite.getBoundingClientRect();
    const X = s.left - b.left + ancre.x * s.width, Y = s.top - b.top + ancre.y * s.height;
    setPlace({ left: Math.max(0, Math.min(b.width - el.offsetWidth, X - el.offsetWidth / 2)), top: Y - el.offsetHeight - 12 < 0 ? Y + 14 : Y - el.offsetHeight - 12 });
  }, [ancre.x, ancre.y, children]);
  return (
    <div ref={ref} role="status" aria-live="polite" data-role="bulle-radar" className="pq-biere-bulle absolute z-10"
      style={place ? { left: place.left, top: place.top } : { left: 0, top: 0, visibility: 'hidden' }}>{children}</div>
  );
}

export function RadarBiere({ notes, haut, attendues, etatSommet, ouvrirSur = null }: {
  notes: Record<FamilyId, Note>;
  /** Haut de la bande du style par famille, sur l'échelle 0 à 3. */
  haut: Record<FamilyId, number>;
  attendues: FamilyId[];
  /** data-etat posé sur le secteur de la première famille au-dessus du style (contrat de controle-etats.mjs). */
  etatSommet?: string;
  /** Famille dont la bulle s'ouvre à l'arrivée (l'alerte touchée : sa famille, en mots). */
  ouvrirSur?: FamilyId | null;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const [bulle, setBulle] = useState<FamilyId | null>(null);

  // L'arrivée par l'alerte : la bulle de sa famille ouverte d'emblée (une fois par demande).
  useEffect(() => { if (ouvrirSur) setBulle(ouvrirSur); }, [ouvrirSur]);
  // Un toucher hors du radar referme sa bulle.
  useEffect(() => {
    if (!bulle) return;
    const fermer = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setBulle(null); };
    document.addEventListener('pointerdown', fermer, true);
    return () => document.removeEventListener('pointerdown', fermer, true);
  }, [bulle]);

  const premierDessus = ROUE.find((f) => auDessus(notes[f], haut[f]));
  const dessus = ROUE.filter((f) => auDessus(notes[f], haut[f]));
  const pasGoute = ROUE.filter((f) => notes[f] == null);
  const label = 'Ma dégustation face à la zone du style, de pas senti à marqué'
    + (dessus.length ? ` ; au-dessus du style : ${dessus.map((f) => COURT[f].toLowerCase()).join(', ')}` : '')
    + (pasGoute.length ? ` ; pas goûté, inconnu : ${pasGoute.map((f) => COURT[f].toLowerCase()).join(', ')}` : '');

  return (
    <div ref={boite} className="pq-biere-radar select-none">
      <RadarBase familles={[...ROUE]} mode="style" objet="biere" label={label} enPlace echelleCommune={ECHELLE} seuilHors={0.05}
        zone={haut} marquees={attendues}
        series={[{ cle: 'moi', nom: 'ma dégustation', couleur: MOI, role: 'retenu', valeurs: notes }]}
        cibles={{ toucher: (f) => setBulle(f), etats: etatSommet && premierDessus ? { [premierDessus]: etatSommet } : undefined }}
        bulle={bulle ? { famille: bulle, rendu: (a) => <BulleRadar ancre={a}><b>{COURT[bulle]}</b>{motsRadar(bulle, notes[bulle], haut[bulle])}</BulleRadar> } : undefined} />
    </div>
  );
}
