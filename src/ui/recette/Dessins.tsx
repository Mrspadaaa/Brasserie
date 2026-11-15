import React from 'react';
import { nombreFr } from '../../domain/stock/regles';

/** Les résumés dessinés de la fiche de recette (maquette r1). Tout vient des données de la recette ; l'inconnu ne se dessine pas. */

/** Piste d'une mesure sur la plage de son style : null si la plage du style n'est pas documentée. */
export function Piste({ valeur, plage, etiquette }: { valeur: number; plage: [number, number] | null | undefined; etiquette: string }) {
  if (!plage || !(plage[1] > plage[0]) || !Number.isFinite(valeur)) return null;
  const [lo, hi] = plage, marge = (hi - lo) / 2, min = lo - marge, max = hi + marge;
  const pc = (x: number) => Math.max(0, Math.min(100, ((x - min) / (max - min)) * 100));
  return <span className="rc-piste" role="img" aria-label={`${etiquette} : style ${nombreFr(lo, hi < 2 ? 3 : 0)}–${nombreFr(hi, hi < 2 ? 3 : 0)}, valeur ${nombreFr(valeur, hi < 2 ? 3 : 0)}`}>
    <b style={{ left: `${pc(lo)}%`, width: `${pc(hi) - pc(lo)}%` }} /><em style={{ left: `${pc(valeur)}%` }} />
  </span>;
}

/** Valeur CSS en pour cent (teinte HSL), pas un nombre lu par le brasseur. */
const pourCent = (n: number) => String(n).concat('%');

/** Barre des parts de grain : une couleur par malt (de la couleur EBC si elle est connue, sinon neutre). */
export function BarreGrain({ parts, noms, ebc }: { parts: number[]; noms: string[]; ebc: (number | undefined)[] }) {
  const total = parts.reduce((s, p) => s + p, 0);
  if (!(total > 0)) return null;
  const teinte = (e?: number) => e == null || !Number.isFinite(e) ? 'rgb(var(--cave-600))'
    : `hsl(${Math.max(18, 44 - Math.min(e, 80) * 0.45)} ${pourCent(Math.max(40, 70 - e * 0.2))} ${pourCent(Math.max(22, 68 - e * 0.35))})`;
  return <span className="rc-barre" style={{ width: 84 }} role="img" aria-label={parts.map((p, i) => `${noms[i]} ${nombreFr((p / total) * 100, 0)} %`).join(', ')}>
    {/* Un segment par malt, séparés d'un filet : des malts clairs de couleur voisine (2 à 6 EBC) restent des parts distinctes. */}
    {parts.map((p, i) => p > 0 && <i key={i} style={{ width: `${(p / total) * 100}%`, background: teinte(ebc[i]), boxShadow: i < parts.length - 1 ? 'inset -2px 0 0 rgb(var(--cave-950))' : undefined, filter: i % 2 ? 'brightness(.9)' : undefined }} />)}
  </span>;
}

/** Barre à deux parts (osmosée / réseau). */
export function BarrePart({ part, a, b, libelle }: { part: number; a: string; b: string; libelle: string }) {
  const p = Math.max(0, Math.min(100, part));
  return <span className="rc-barre" style={{ width: 56 }} role="img" aria-label={libelle}><i style={{ width: `${p}%`, background: a }} /><i style={{ width: `${100 - p}%`, background: b }} /></span>;
}

export interface PointCourbe { x: number; y: number }
/** Mini courbe en palier (60×18) : les points viennent d'une durée (x) et d'une température (y) réelles. */
export function MiniCourbe({ points, couleur }: { points: PointCourbe[]; couleur: string }) {
  if (points.length < 2) return null;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (x: number) => 1 + (x1 > x0 ? ((x - x0) / (x1 - x0)) * 58 : 0), Y = (y: number) => 16 - (y1 > y0 ? ((y - y0) / (y1 - y0)) * 14 : 7);
  return <svg viewBox="0 0 60 18" width="60" height="18" aria-hidden="true" className="shrink-0">
    <path d={points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('')} fill="none" stroke={couleur} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>;
}

export interface SegmentEmpatage { nom: string; tempC: number; fromC?: number; rampMin?: number; durationMin: number }
/** Points x (minutes) / y (°C) d'un programme d'empâtage : départ à la 1re température connue (rien n'est inventé en dessous). */
export function pointsEmpatage(segments: SegmentEmpatage[]): PointCourbe[] {
  const pts: PointCourbe[] = []; let t = 0;
  segments.forEach((s, i) => {
    if (i > 0) t += s.rampMin ?? 5; // montée non mesurée : pente de dessin fixe, jamais un temps annoncé
    pts.push({ x: t, y: s.tempC }); t += s.durationMin; pts.push({ x: t, y: s.tempC });
  });
  return pts;
}

/**
 * Légende d'un palier sous la courbe : le nom de la recette en minuscules (« mash-out »). Le maintien le plus long, entre 60 et 72 °C
 * (la plage où les amylases saccharifient), sous un nom générique (« Empâtage », « Palier »), s'appelle « saccharification » (maquette r1).
 */
export function legendesEmpatage(segments: SegmentEmpatage[]): string[] {
  const plusLong = segments.reduce((m, s, i) => (s.durationMin > segments[m].durationMin ? i : m), 0);
  return segments.map((s, i) => {
    const nom = s.nom.trim().toLocaleLowerCase('fr-FR');
    return i === plusLong && s.tempC >= 60 && s.tempC <= 72 && /^(emp[âa]tage|palier|mash)(\s*\d+)?$/.test(nom) ? 'saccharification' : nom;
  });
}

const L = 350, H = 120, GAUCHE = 26, DROITE = 340, HAUT = 12, BAS = 104, DEPART = 14;
/** Géométrie de la courbe (SVG 350×120) : l'axe va du plancher (3 °C sous la dizaine qui suit le palier le plus froid) à la dizaine au-dessus du plus chaud. */
export function geometrieEmpatage(segments: SegmentEmpatage[]) {
  const pts = pointsEmpatage(segments);
  const temps = segments.map((s) => s.tempC);
  const dmin = Math.floor((Math.min(...temps) - 6) / 10) * 10 - 3, dmax = Math.ceil((Math.max(...temps) + 3) / 10) * 10;
  const tmax = Math.max(...pts.map((p) => p.x)) || 1;
  const X = (x: number) => GAUCHE + DEPART + (x / tmax) * (DROITE - GAUCHE - DEPART);
  const Y = (y: number) => BAS - ((y - dmin) / (dmax - dmin)) * (BAS - HAUT);
  const graduations: { t: number; y: number }[] = [];
  for (let g = Math.ceil(dmin / 10) * 10; g <= dmax; g += 10) graduations.push({ t: g, y: Y(g) });
  // Montée de départ : du plancher de l'axe au premier palier (la température de départ n'est pas connue : elle n'est pas chiffrée).
  const courbe = `M${GAUCHE} ${BAS}` + pts.map((p) => `L${X(p.x)} ${Y(p.y)}`).join('');
  let t = 0;
  const paliers = segments.map((s, i) => {
    if (i > 0) t += s.rampMin ?? 5;
    const x0 = X(t), x1 = X(t + s.durationMin); t += s.durationMin;
    return { s, x0, x1, y: Y(s.tempC) };
  });
  return { courbe, graduations, paliers, plancher: BAS };
}

/** Courbe graduée de l'empâtage (état « geste » de la maquette) : montée de départ, aplat sous chaque palier, « 67 °C · 60′ » et sa légende. */
export function CourbeEmpatage({ segments }: { segments: SegmentEmpatage[] }) {
  if (!segments.length) return null;
  const { courbe, graduations, paliers, plancher } = geometrieEmpatage(segments), legendes = legendesEmpatage(segments);
  const centre = (p: { x0: number; x1: number }) => (p.x0 + p.x1) / 2;
  return <svg viewBox={`0 0 ${L} ${H}`} style={{ width: '100%', maxWidth: 480, height: 'auto', aspectRatio: `${L} / ${H}` }} role="img" data-booster="courbe-empatage"
    aria-label={segments.map((s) => `${s.nom} ${nombreFr(s.tempC, 1)} °C pendant ${s.durationMin} minutes`).join(', ')}>
    <g fontFamily="IBM Plex Mono" fontSize="12" fill="rgb(var(--cave-texte-400))">{graduations.map((g) => <text key={g.t} x="0" y={g.y + 4}>{g.t}</text>)}</g>
    <path d={graduations.map((g) => `M${GAUCHE} ${g.y}H${L}`).join('')} stroke="rgb(var(--cave-700))" strokeWidth="1" />
    <path d={`M${GAUCHE} ${plancher}H${L}`} stroke="rgb(var(--cave-600))" strokeWidth="1" />
    {paliers.map((p, i) => <path key={i} data-role="aplat" d={`M${p.x0} ${p.y}H${p.x1}V${plancher}H${p.x0}Z`} fill="rgb(232 141 104)" opacity={paliers.length > 1 && i === paliers.length - 1 ? 0.28 : 0.16} />)}
    <path d={courbe} fill="none" stroke="rgb(var(--ebc-copper-texte))" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    <g fontFamily="IBM Plex Mono" fontSize="14" fontWeight="600" fill="rgb(var(--cave-texte-50))" stroke="rgb(var(--cave-950))" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">
      {paliers.map((p, i) => <text key={i} x={Math.min(Math.max(centre(p), GAUCHE + 48), L - 48)} y={p.y - 6} textAnchor="middle">{nombreFr(p.s.tempC, 1)} °C · {p.s.durationMin}′</text>)}
    </g>
    <g fontFamily="Source Sans 3" fontSize="12" fill="rgb(var(--cave-texte-400))">
      {paliers.map((p, i) => <text key={i} x={Math.min(Math.max(centre(p), GAUCHE + 28), L - 28)} y={H - 2} textAnchor="middle">{legendes[i]}</text>)}
    </g>
  </svg>;
}
