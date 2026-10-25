// Radar m4 de Ma bière, tel que sa base v4.10 le dessine (consolide/biere.html, radar.js : RADAR.biere ; capture
// consolide-biere-radar-390.png ; « Radar: m4 h4 très bien, attention à pas surchargé en texte ni en légende »,
// 19.10). Ce que j'ai goûté (ma dégustation, notée dans la grille dessous) face à la zone du style :
// - 12 axes, agrumes en haut ; échelle −1 → 3 : « pas senti » (0) sur l'anneau clair du zéro, faible 1, moyen 2,
//   marqué 3 ; anneaux en polygones, sans nom ;
// - la zone du style en gris, du centre au haut de la bande du style (bande du moteur ÷ 33,33) ;
// - ma dégustation pleine en bleu (#0072B2, la couleur de sa base), points aux sommets ; l'orangé sur le seul sommet
//   au-dessus du style ;
// - pas goûté = inconnu (D65) : libellé gris suivi de « ? », secteur hachuré, marque creuse dans le disque du centre,
//   jamais un zéro ; les familles que le style attend en gras ;
// - au toucher d'un sommet, la famille et la valeur en mots dans une bulle (« Résineux : marqué, au-dessus du style »).
// Sans légende écrite (le « ? » de l'onglet l'ouvre, D113). Classes préfixées pq-biere- (L26).
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { COURT, ROUE } from '../../commun';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';

/** Une note de dégustation : 0 pas senti, 1 faible, 2 moyen, 3 marqué ; null pas goûté (inconnu, jamais 0). */
export type Note = 0 | 1 | 2 | 3 | null;
export const NIVEAUX_DEGUSTATION = ['pas senti', 'faible', 'moyen', 'marqué'] as const;
/** Une note au-dessus du haut de la bande du style (même seuil que la base : 0,05). */
export const auDessus = (v: Note, haut: number) => v != null && v > haut + 0.05;

// Couleurs de sa base (radar.js) : ma bière en bleu, l'accent orangé ; les gris sont ceux du thème de ses maquettes.
const MOI = '#0072B2', ACC = '#c2410c';
const W = 358, PX = 12, GAP = 8, PAD = 3, DEBORDE = 12, MIN = -1, MAX = 3;
const ANNEAUX = [1, 2, 3];

interface Cible { f: FamilyId; x: number; y: number; nom: string; mots: string }

export function RadarBiere({ notes, haut, attendues, etatSommet, ouvrirSur = null }: {
  notes: Record<FamilyId, Note>;
  /** Haut de la bande du style par famille, sur l'échelle 0 à 3. */
  haut: Record<FamilyId, number>;
  attendues: FamilyId[];
  /** data-etat posé sur le sommet de la première famille au-dessus du style (contrat de controle-etats.mjs). */
  etatSommet?: string;
  /** Famille dont la bulle s'ouvre à l'arrivée (l'alerte touchée : sa famille, en mots). */
  ouvrirSur?: FamilyId | null;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boite = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const bulleRef = useRef<HTMLDivElement>(null);
  const [bulle, setBulle] = useState<Cible | null>(null);
  const [placeBulle, setPlaceBulle] = useState<{ left: number; top: number } | null>(null);

  // Les libellés mesurés à la police de la page, pour que le rayon les laisse tenir (radar.js : largeur()).
  const g = useMemo(() => {
    const n = ROUE.length, pas = (2 * Math.PI) / n;
    const ang = (k: number) => k * pas;
    const xy = (a: number, rr: number) => [Math.sin(a) * rr, -Math.cos(a) * rr] as const;
    const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    const police = typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'sans-serif';
    const largeur = (t: string, gras: boolean) => {
      if (!ctx) return t.length * 6.5;
      ctx.font = `${gras ? 650 : 400} ${PX}px ${police}`;
      return ctx.measureText(t).width;
    };
    const lib = ROUE.map((f) => {
      const inconnu = notes[f] == null, gras = attendues.includes(f);
      const t = COURT[f] + (inconnu ? '?' : '');
      return { f, t, gras, inconnu, larg: largeur(t, gras) };
    });
    const demi = W / 2 + DEBORDE;
    let R = 150;
    lib.forEach((l, k) => { const s = Math.abs(Math.sin(ang(k))); if (s > 0.1) R = Math.min(R, (demi - 2 - l.larg) / s - GAP); });
    const pos = lib.map((l, k) => {
      const a = ang(k), s = Math.sin(a), c = Math.cos(a);
      const [x, y] = xy(a, R + GAP);
      const y0 = c > 0.9 ? y - 3 : c < -0.9 ? y + 12 : y + 4;
      const ancre: 'middle' | 'start' | 'end' = Math.abs(s) < 0.1 ? 'middle' : s > 0 ? 'start' : 'end';
      return { x, y0, ancre, y1: y0 - 10, y2: y0 + 3 };
    });
    const hautY = Math.min(-R, ...pos.map((p) => p.y1)), basY = Math.max(R, ...pos.map((p) => p.y2));
    const H = Math.round(basY - hautY + 2 * PAD);
    const cx = W / 2, cy = PAD - hautY;
    const r = (v: number) => (Math.max(0, Math.min(1, (v - MIN) / (MAX - MIN)))) * R;
    // Une note vide se pose dans le disque du centre, à mi-chemin du zéro : jamais sur l'anneau du zéro (« pas senti »).
    const RC = r(-0.5);
    const P = (k: number, v: number | null) => xy(ang(k), v == null ? RC : r(v));
    const poly = (vals: (number | null)[]) => vals.map((v, k) => P(k, v)).map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('') + 'Z';
    return { n, pas, ang, xy, lib, pos, R, H, cx, cy, r, RC, P, poly };
  }, [notes, attendues]);

  const vals = ROUE.map((f) => notes[f]);
  const cibles: Cible[] = ROUE.map((f, k) => {
    const v = notes[f];
    const [x, y] = g.P(k, v);
    if (v == null) return { f, x, y, nom: COURT[f], mots: ' : pas goûté, inconnu (ce n’est pas zéro), posé au centre' };
    const ou = auDessus(v, haut[f]) ? 'au-dessus du style' : 'dans le style';
    return { f, x, y, nom: COURT[f], mots: ` : ${NIVEAUX_DEGUSTATION[v]}, ${ou}` };
  });
  const premierDessus = ROUE.find((f) => auDessus(notes[f], haut[f]));
  // L'arrivée par l'alerte : la bulle de sa famille ouverte d'emblée (une fois par demande).
  useEffect(() => { if (ouvrirSur) setBulle(cibles.find((c) => c.f === ouvrirSur) ?? null); }, [ouvrirSur]); // eslint-disable-line react-hooks/exhaustive-deps

  // La bulle : au-dessus du sommet (dessous près du haut), dans la largeur du radar (radar.js : g.montrer).
  useEffect(() => {
    if (!bulle || !svg.current || !bulleRef.current) { setPlaceBulle(null); return; }
    const s = svg.current.getBoundingClientRect(), b = boite.current!.getBoundingClientRect();
    const k = s.width / W, dx = s.left - b.left;
    const bw = bulleRef.current.offsetWidth, bh = bulleRef.current.offsetHeight;
    const X = dx + (g.cx + bulle.x) * k, Y = (g.cy + bulle.y) * k;
    setPlaceBulle({ left: Math.max(0, Math.min(b.width - bw, X - bw / 2)), top: Y - bh - 12 < 0 ? Y + 14 : Y - bh - 12 });
  }, [bulle, g]);
  // Un toucher hors du radar referme sa bulle.
  useEffect(() => {
    if (!bulle) return;
    const fermer = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setBulle(null); };
    document.addEventListener('pointerdown', fermer, true);
    return () => document.removeEventListener('pointerdown', fermer, true);
  }, [bulle]);

  const proche = (clientX: number, clientY: number, rayon: number) => {
    const b = svg.current!.getBoundingClientRect(), k = W / b.width;
    const x = (clientX - b.left) * k - g.cx, y = (clientY - b.top) * k - g.cy;
    let best: Cible | null = null, d0 = rayon;
    for (const c of cibles) { const d = Math.hypot(c.x - x, c.y - y); if (d < d0) { d0 = d; best = c; } }
    return best;
  };
  const toucher = (clientX: number, clientY: number) => setBulle(proche(clientX, clientY, 22));

  const dessus = ROUE.map((f) => auDessus(notes[f], haut[f]));
  const pasGoute = ROUE.filter((f) => notes[f] == null);
  const rb = g.R * Math.cos(g.pas / 2);
  const pt = (a: number, rr: number) => `${(Math.sin(a) * rr).toFixed(1)},${(-Math.cos(a) * rr).toFixed(1)}`;
  const label = 'Ma dégustation face à la zone du style, de pas senti à marqué'
    + (dessus.some(Boolean) ? ` ; au-dessus du style : ${ROUE.filter((_, k) => dessus[k]).map((f) => COURT[f].toLowerCase()).join(', ')}` : '')
    + (pasGoute.length ? ` ; pas goûté, inconnu : ${pasGoute.map((f) => COURT[f].toLowerCase()).join(', ')}` : '');

  return (
    <div ref={boite} className="pq-biere-radar relative">
      <svg ref={svg} data-radar="" data-objet="biere" data-composant="radar" viewBox={`0 0 ${W} ${g.H}`} width={W} height={g.H}
        className="block w-full max-w-[358px] mx-auto h-auto overflow-visible select-none" role="img" aria-label={label}
        onPointerDown={(e) => toucher(e.clientX, e.clientY)} onClick={(e) => toucher(e.clientX, e.clientY)}>
        <defs>
          <pattern id={`${id}-hach`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(0 0 0 / 0.16)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <g transform={`translate(${g.cx.toFixed(1)},${g.cy.toFixed(1)})`}>
          {/* Anneaux sans nom : le zéro (pas senti) en trait clair, puis faible, moyen, marqué ; rayons. */}
          <path d={g.poly(ROUE.map(() => 0))} fill="none" stroke="rgb(var(--cave-800))" strokeWidth="1" />
          {ANNEAUX.map((v) => <path key={v} d={g.poly(ROUE.map(() => v))} fill="none" stroke="rgb(var(--cave-700))" strokeWidth="1" />)}
          {ROUE.map((f, k) => { const [x, y] = g.xy(g.ang(k), g.R); return <line key={f} x1="0" y1="0" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgb(var(--cave-800))" strokeWidth="1" />; })}
          {/* La zone du style : un fond gris jusqu'au haut de la bande. */}
          <path data-serie="zone" d={g.poly(ROUE.map((f) => haut[f]))} fill="rgb(0 0 0 / 0.10)" stroke="rgb(var(--cave-700))" strokeWidth="1" />
          {/* Pas goûté : secteur hachuré. */}
          {pasGoute.map((f) => {
            const a = ROUE.indexOf(f) * g.pas;
            return <path key={f} data-inconnu={f} d={`M0,0L${pt(a - g.pas / 2, rb)}L${pt(a, g.R)}L${pt(a + g.pas / 2, rb)}Z`} fill={`url(#${id}-hach)`} />;
          })}
          {/* Ma dégustation, pleine en bleu. */}
          <path data-serie="ma dégustation" data-couleur={MOI} d={g.poly(vals)} fill={MOI} fillOpacity="0.18" stroke={MOI} strokeWidth="2" strokeLinejoin="round" />
          {/* Les libellés : « ? » et gris si pas goûté, gras si le style l'attend. */}
          {g.lib.map((l, k) => {
            const p = g.pos[k];
            return (
              <text key={l.f} data-fam={l.f} x={p.x.toFixed(1)} y={p.y0.toFixed(1)} textAnchor={p.ancre} fontSize={PX} fontWeight={l.gras ? 650 : 400}
                fill={l.inconnu ? 'rgb(var(--cave-texte-400))' : l.gras ? 'rgb(var(--cave-texte-50))' : 'rgb(var(--cave-texte-200))'}>{l.t}</text>
            );
          })}
          {/* Les sommets : l'orangé au-dessus du style, le bleu ailleurs ; pas goûté, une marque creuse au centre. */}
          {cibles.map((c, k) => {
            const v = notes[c.f];
            return v == null
              ? <circle key={c.f} data-inconnu={c.f} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r="3.5" fill="rgb(var(--cave-950))" stroke="rgb(var(--cave-texte-400))" strokeWidth="1.5" />
              : <circle key={c.f} data-sommet={c.f} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={dessus[k] ? 5 : v === 0 ? 3 : 4} fill={dessus[k] ? ACC : MOI} stroke="#fff" strokeWidth="1.5" />;
          })}
          {/* Les cibles du doigt sur les sommets goûtés (le toucher cherche le plus proche à 22 px). */}
          {cibles.filter((c) => notes[c.f] != null).map((c) => (
            <circle key={c.f} data-cible-sommet={c.f} {...(etatSommet && c.f === premierDessus ? { 'data-etat': etatSommet } : {})}
              cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r="14" fill="transparent" />
          ))}
        </g>
      </svg>
      <div ref={bulleRef} role="status" aria-live="polite" hidden={!bulle} data-role="bulle-radar"
        className="pq-biere-bulle absolute z-10" style={placeBulle ? { left: placeBulle.left, top: placeBulle.top } : { left: 0, top: 0, visibility: 'hidden' }}>
        {bulle && <><b>{bulle.nom}</b>{bulle.mots}</>}
      </div>
    </div>
  );
}
