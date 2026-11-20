import React from 'react';
import { nombreFr } from '../../../domain/nombreAffiche';
import type { ModeleFiche } from './modele';

/**
 * Le graphique de gfc : densité jour par jour, bande FG, « auj. », °C de la cuve face à la consigne, axe épais coloré par phase,
 * dry hop en losange or. Les couleurs viennent des jetons du thème (`rgb(var(--…))`) : clair et cave suivent.
 */
const C = {
  page: 'rgb(var(--cave-950))', bord: 'rgb(var(--cave-800))',
  t0: 'rgb(var(--cave-texte-50))', t1: 'rgb(var(--cave-texte-200))', t2: 'rgb(var(--cave-texte-400))',
  rep: 'rgb(var(--repere))', repT: 'rgb(var(--sur-paille))',
  hop: 'rgb(var(--hop))', hopT: 'rgb(var(--hop-texte))', hopFond: 'rgb(var(--hop) / .10)', bande: 'rgb(var(--hop) / .3)',
  or: 'rgb(var(--ebc-gold, 224 160 46))', orFond: 'rgb(var(--ebc-gold, 224 160 46) / .2)', orT: 'rgb(var(--ebc-gold-texte))',
  att: 'rgb(var(--attention))', attT: 'rgb(var(--attention-texte))', eau: 'rgb(var(--water))', eauT: 'rgb(var(--water-texte))'
};
const TON = { hop: [C.hop, C.hopT], attention: [C.att, C.attT], water: [C.eau, C.eauT] } as const;
const sg3 = (v: number) => nombreFr(v, 3).padEnd(5, '0').replace(/^(\d),(\d{0,3})$/, (_, a: string, b: string) => `${a},${b.padEnd(3, '0')}`);

export interface Geometrie { W: number; nb: number; cw: number; PH: number; TC: number; H: number; ya: number; cx: (j: number) => number }
export function geometrie(W: number, nb: number, large: boolean): Geometrie {
  const PH = large ? 190 : 170, TC = 64, AX = 58, cw = W / nb;
  return { W, nb, cw, PH, TC, H: PH + TC + AX, ya: PH + TC + 16, cx: j => (j + 0.5) * cw };
}

/** Jours qui portent un dry hop (distincts). */
export const joursDryHop = (m: ModeleFiche): number[] => [...new Set(m.houblons.map(h => h.jour).filter((j): j is number => j !== null && j >= 0 && j < m.nbJours))].sort((a, b) => a - b);

export const GrapheTemps: React.FC<{ m: ModeleFiche; g: Geometrie }> = ({ m, g }) => {
  const { W, nb, cw, PH, TC, ya, cx } = g, T = m.n;
  const mono = 'font-mono';
  const sgs = [...m.points.map(p => p.sg), ...(m.fg ? m.fg : [])];
  const top = Math.max(1.068, Math.max(...sgs) + 0.004), bot = Math.min(1.002, Math.min(...sgs) - 0.004);
  const y = (d: number) => 6 + (top - d) / (top - bot) * (PH - 10);
  const e: React.ReactNode[] = [];
  const colAuj = T >= 0 && T < nb;
  if (colAuj) {
    e.push(<rect key="aj" x={T * cw + 1} y={18} width={cw - 2} height={PH + TC - 18} rx={4} fill="none" stroke={C.rep} strokeWidth={1.5} strokeDasharray="4 3" />);
    e.push(<rect key="ajt" x={T * cw + 1} y={0} width={cw - 2} height={18} rx={4} fill={C.rep} />);
    e.push(<text key="ajl" x={cx(T)} y={13} textAnchor="middle" className={mono} fontSize={12} fontWeight={600} fill={C.repT}>auj.</text>);
  }
  for (let i = 0; i <= nb; i++) e.push(<line key={`l${i}`} x1={i * cw} y1={0} x2={i * cw} y2={PH + TC} stroke={C.bord} strokeDasharray={i ? '2 4' : '0'} />);
  const yb1 = m.fg ? y(m.fg[1]) : 0, yb2 = m.fg ? y(m.fg[0]) : 0, yc = (yb1 + yb2) / 2;
  if (m.fg) {
    e.push(<rect key="bd" x={0} y={yb1} width={W} height={yb2 - yb1} fill={C.bande} />);
    e.push(<text key="bdl" x={4} y={yb2 + 13} className={mono} fontWeight={600} fontSize={12} fill={C.hopT} wordSpacing={-4}>FG {sg3(m.fg[0])}–{sg3(m.fg[1])}</text>);
  }
  const mes = m.points.filter(p => !p.og), der = m.dernier;
  // attendu : du dernier relevé vers la bande FG (une trajectoire attendue, pas une mesure)
  const dj = der?.jour ?? 0, fin = Math.min(nb - 1, dj + 3);
  const attendu = !!(m.fg && der && !der.og && der.sg > m.fg[1] && fin > dj);
  const P0: [number, number] = der ? [cx(dj), y(der.sg)] : [0, 0], P1: [number, number] = [cx(dj + 1), yb1 - 3], P2: [number, number] = [cx(fin), yb1 + 2];
  const bez = (x: number) => { let a = 0, b = 1; for (let k = 0; k < 30; k++) { const mm = (a + b) / 2, u = 1 - mm, xx = u * u * P0[0] + 2 * u * mm * P1[0] + mm * mm * P2[0]; if (xx < x) a = mm; else b = mm; } const mm = (a + b) / 2, u = 1 - mm; return u * u * P0[1] + 2 * u * mm * P1[1] + mm * mm * P2[1]; };
  if (m.fg && !m.fgConfirmee) {
    const c1 = Math.max(0, nb - 3), c2 = Math.max(0, nb - 2), c3 = nb - 1;
    e.push(<g key="egaux"><circle cx={cx(c1)} cy={yc} r={5} fill={C.page} stroke={C.t0} strokeWidth={2.5} /><text x={(cx(c1) + cx(c2)) / 2} y={yc + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill={C.t0}>=</text><circle cx={cx(c2)} cy={yc} r={5} fill={C.page} stroke={C.t0} strokeWidth={2.5} />
      <path d={`M${cx(c2) + 7} ${yc}H${cx(c3) + 6}m-5 -4l5 4l-5 4`} fill="none" stroke={C.eau} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <text x={W - 2} y={yb1 - 10} textAnchor="end" fontSize={12} fontWeight={600} fill={C.t1}>2 relevés égaux</text></g>);
  }
  if (attendu) e.push(<path key="att" d={`M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke={C.t2} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round"><title>Attendu, pas mesuré</title></path>);
  if (mes.length || m.points.length) {
    const pts = m.points;
    const ligne = pts.map((p, i) => `${i ? 'L' : 'M'}${cx(p.jour)} ${y(p.sg)}`).join('');
    if (pts.length > 1) e.push(<path key="aire" d={`${ligne}V${PH}H${cx(pts[0].jour)}Z`} fill={C.hopFond} />);
    if (pts.length > 1) e.push(<path key="crb" d={ligne} fill="none" stroke={C.t0} strokeWidth={3.5} strokeLinejoin="round" />);
    pts.forEach((p, i) => {
      const dernier = i === pts.length - 1 && pts.length > 1, x = cx(p.jour), yy = y(p.sg), lab = sg3(p.sg);
      // Deux relevés voisins presque à la même hauteur : l'étiquette du dernier passe au-dessus à droite pour ne pas couvrir celle de l'avant-dernier.
      const veille = i > 0 ? pts[i - 1] : null, serre = dernier && !!veille && p.jour - veille.jour <= 1 && Math.abs(y(veille.sg) - yy) < 22;
      e.push(<circle key={`pt${i}`} cx={x} cy={yy} r={dernier ? 7 : p.og ? 4 : 5} fill={C.t0} />);
      // CT4-B-8 : la valeur ne se pose jamais sur la courbe qui arrive au point ni sous le pointillé « auj. » : le dernier relevé la met au-dessus de son point
      // (à droite, ou à gauche s'il n'y a plus la place), et chaque valeur porte un halo de la couleur du fond qui la détache de ce qui passe dessous.
      // Tour 2 (critique k4) : le texte ne chevauche jamais non plus un des deux bords pointillés de la colonne « auj. » (à 390 comme à 1280) : parmi les places
      // possibles (à droite, centré au-dessus, à gauche), la première dont la boîte n'enjambe aucun bord ; sinon la préférée.
      const fs = dernier ? 14 : 12, texte = p.og ? `DO ${lab}` : lab, larg = texte.length * 0.6 * fs;
      const hy = serre || dernier ? -12 : p.og ? -9 : -4;
      const places: { px: number; py: number; ancre: 'start' | 'middle' | 'end' }[] = [
        { px: x + (serre ? 12 : dernier ? 11 : 9), py: yy + hy, ancre: 'start' },
        { px: x, py: yy - 13, ancre: 'middle' },
        { px: x - (dernier ? 11 : 9), py: yy + hy, ancre: 'end' },
      ];
      const enjambe = (pl: typeof places[number]) => {
        const a = pl.ancre === 'start' ? pl.px : pl.ancre === 'end' ? pl.px - larg : pl.px - larg / 2, b = a + larg;
        if (a < 0 || b > W) return true;
        return colAuj && [T * cw + 1, (T + 1) * cw - 1].some(bord => a < bord - 1 && b > bord + 1);
      };
      const place = places.find(pl => !enjambe(pl)) ?? places[0];
      e.push(<text key={`pl${i}`} x={place.px} y={place.py} textAnchor={place.ancre} className={mono} fontWeight={600} fontSize={fs} fill={C.t0} wordSpacing={-4}
        stroke={C.page} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">{texte}</text>);
    });
  }
  // °C de la cuve (pas celui de l'échantillon : gfc n° 5), face à la consigne de la recette
  // Température du relevé : la cuve si elle est notée, sinon le °C du relevé de densité (décision du pilote) ; rien d'inventé.
  const tCuve = (p: { cuveC?: number; tempC?: number }) => p.cuveC ?? p.tempC;
  const consignes = m.phases.filter(p => p.ton !== 'water').map(p => p.tempC), temps = m.points.filter(p => tCuve(p) !== undefined).map(p => tCuve(p) as number);
  const tous = [...consignes, ...temps];
  const lo = (tous.length ? Math.min(...tous) : 18) - 0.4, hi = Math.max((tous.length ? Math.max(...tous) : 20) + 0.4, lo + 2.5);
  const yt = (c: number) => PH + TC - 6 - (c - lo) / (hi - lo) * (TC - 30);
  let consigneEnLegende = false;
  const indexLegende = e.push(<text key="tl" x={4} y={PH + 16} fontSize={12} fontWeight={600} fill={C.t1}>°C cuve</text>) - 1;
  if (colAuj && !m.tempAujourdhui) e.push(<text key="tn" x={W - 2} y={PH + 16} textAnchor="end" fontSize={12} fill={C.t2}>auj. <tspan fontWeight={600} fill={C.attT}>non relevée</tspan></text>);
  const chauds = m.phases.filter(p => p.ton !== 'water');
  if (chauds.length) {
    let d = `M0 ${yt(chauds[0].tempC)}`;
    chauds.forEach((p, i) => { if (i) d += `V${yt(p.tempC)}`; d += `H${Math.min(nb, p.a) * cw}`; });
    e.push(<path key="cs" d={d} fill="none" stroke={C.t2} strokeWidth={1.5} strokeDasharray="4 4" />);
    const dernierChaud = chauds[chauds.length - 1], premier = chauds[0];
    const cible = chauds.length > 1 ? dernierChaud : premier;
    if ((cible.a - cible.de) >= 2) {
      // Tour 2 (critique k4) : « consigne » ne se pose jamais sur le titre de la phase (« Fermenter 19 °C », à 390 les deux se recouvraient) : s'ils se
      // touchent, le mot passe à la légende « °C cuve · pointillé : consigne » au lieu de s'écraser sur la courbe.
      const cxm = cx((cible.de + Math.min(nb, cible.a) - 1) / 2), yc2 = yt(cible.tempC) + 15, wc = 8 * 0.6 * 12;
      const titre = `${cible.titre}`, t0 = cible.de * cw + 3, t1 = t0 + titre.length * 0.6 * 12;
      const touche = yc2 > ya - 22 && cxm - wc / 2 < t1 + 4 && cxm + wc / 2 > t0 - 4;
      if (touche) consigneEnLegende = true;
      else e.push(<text key="cl" x={cxm} y={yc2} textAnchor="middle" fontSize={12} fill={C.t2}>consigne</text>);
    }
  }
  if (consigneEnLegende) e[indexLegende] = <text key="tl" x={4} y={PH + 16} fontSize={12} fontWeight={600} fill={C.t1}>°C cuve <tspan fontWeight={400} fill={C.t2}>· tirets : consigne</tspan></text>;
  m.phases.filter(p => p.ton === 'water' && p.de < nb).forEach(p => {
    const x = cx(p.de), y0 = chauds.length ? yt(chauds[chauds.length - 1].tempC) : yt(p.tempC);
    e.push(<path key={`fl${p.de}`} d={`M${x} ${y0}V${PH + TC - 4}m-4 -5l4 5l4 -5`} fill="none" stroke={C.eau} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />);
  });
  const tp = m.points.filter(p => tCuve(p) !== undefined && p.jour < nb);
  if (tp.length > 1) e.push(<path key="tc" d={tp.map((p, i) => `${i ? 'L' : 'M'}${cx(p.jour)} ${yt(tCuve(p) as number)}`).join('')} fill="none" stroke={C.t0} strokeWidth={2} />);
  tp.forEach((p, i) => {
    e.push(<circle key={`tp${i}`} cx={cx(p.jour)} cy={yt(tCuve(p) as number)} r={3.5} fill={C.t0} />);
    e.push(<text key={`tt${i}`} x={cx(p.jour)} y={yt(tCuve(p) as number) - 7} textAnchor="middle" fontSize={12} fontWeight={600} fill={C.t0} style={{ fontVariantNumeric: 'tabular-nums' }}>{nombreFr(tCuve(p) as number, 1)}</text>);
  });
  // Aucune température sur les jours écoulés : le dire en mots, pas un trou muet.
  const ecoules = Math.min(T, nb - 1);
  if (ecoules >= 1 && !tp.some(p => p.jour <= T) && m.datesJm && m.datesJm[0] && m.datesJm[ecoules]) {
    const [d0] = m.datesJm[0].split('.'), [d1, mois] = m.datesJm[ecoules].split('.');
    const mois0 = m.datesJm[0].split('.')[1];
    const du = mois0 === mois ? d0 : m.datesJm[0];
    e.push(<text key="tv" x={Math.min(W - 96, Math.max(96, cx(ecoules / 2)))} y={PH + 40} textAnchor="middle" fontSize={12} fill={C.t1} stroke={C.page} strokeWidth={4} paintOrder="stroke">cuve non relevée du {du} au {d1}.{mois}</text>);
  }
  if (colAuj && !m.tempAujourdhui) {
    const c0 = m.phases.find(p => p.de <= T && T < p.a);
    e.push(<circle key="tj" cx={cx(T)} cy={c0 ? yt(c0.tempC) : PH + TC - 10} r={5} fill={C.page} stroke={C.att} strokeWidth={2} strokeDasharray="3 2" />);
  }
  // l'axe : trait épais coloré par phase, jours et dates dessous
  m.phases.filter(p => p.de < nb).forEach((p, i) => {
    const [fond, texte] = TON[p.ton], a = Math.min(nb, p.a), fin2 = (a - p.de) < 2.5 && p.ton === 'water';
    e.push(<rect key={`ph${i}`} x={p.de * cw} y={ya - 3} width={(a - p.de) * cw - 1} height={6} rx={3} fill={fond} />);
    e.push(<text key={`phl${i}`} x={fin2 ? a * cw - 2 : p.de * cw + 3} y={ya - 8} textAnchor={fin2 ? 'end' : 'start'} fontSize={12} fontWeight={600} fill={texte}>{fin2 ? p.titre.replace(/^\S+ /, '') : p.titre}</text>);
  });
  const jd = joursDryHop(m);
  const pas = nb > 12 ? 2 : 1;
  for (let j = 0; j < nb; j++) {
    const x = cx(j), t = j === T, dh = jd.includes(j), c = t ? C.repT : dh ? C.orT : C.t0;
    if (t) e.push(<rect key={`ft${j}`} x={x - cw / 2 + 1} y={ya + 6} width={cw - 2} height={38} rx={10} fill={C.rep} />);
    if (dh && !t) e.push(<rect key={`fd${j}`} x={x - cw / 2 + 1} y={ya + 6} width={cw - 2} height={38} rx={10} fill={C.orFond} />);
    if (j % pas && !t && !dh) continue;
    e.push(<text key={`j${j}`} x={x} y={ya + 22} textAnchor="middle" className={mono} fontSize={12} fontWeight={600} fill={c}>J+{j}</text>);
    e.push(<text key={`d${j}`} x={x} y={ya + 38} textAnchor="middle" className={mono} fontSize={12} fill={t || dh ? c : C.t2}>{t ? 'auj.' : m.dates[j]}</text>);
  }
  // le dry hop, marque de l'axe : losange or ; un nœud sur l'attendu d'où part le fil
  // un losange est vert quand tous les houblons de son jour sont sortis du stock ; un point vert marque le jour réel de chaque ajout
  jd.forEach(j => {
    const fait = m.houblons.filter(h => h.jour === j).every(h => h.statut === 'fait');
    const inAtt = attendu && cx(j) >= P0[0] && cx(j) <= P2[0];
    const yk = inAtt ? bez(cx(j)) : m.fg ? yc : null;
    if (yk !== null) {
      e.push(<line key={`fk${j}`} x1={cx(j)} y1={yk} x2={cx(j)} y2={ya - 8} stroke={fait ? C.hop : C.or} strokeWidth={2.5} />);
      e.push(<circle key={`nk${j}`} cx={cx(j)} cy={yk} r={5} fill={fait ? C.hop : C.or} stroke={C.page} strokeWidth={2} />);
    }
    e.push(<path key={`lz${j}`} d={`M${cx(j)} ${ya - 8}l7 8-7 8-7-8z`} fill={fait ? C.hop : C.or} stroke={C.page} strokeWidth={2} />);
  });
  const joursFaits = [...new Set(m.houblons.map(h => h.statut === 'fait' ? (h.ajout?.jour ?? T) : null).filter((x): x is number => x !== null && x >= 0 && x < nb))];
  joursFaits.forEach(a => e.push(<circle key={`aj-fait${a}`} cx={cx(a)} cy={ya} r={7} fill={C.hop} stroke={C.page} strokeWidth={2} />));
  return (
    <svg viewBox={`0 0 ${W} ${g.H}`} width={W} height={g.H} style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={`Densité jour par jour, de J+0 à J+${nb - 1}`}>
      {e}
    </svg>
  );
};

/** Hauteur (px) du nœud d'un dry hop sur l'attendu : exposée aux fils. */
export const nSgLabel = sg3;
