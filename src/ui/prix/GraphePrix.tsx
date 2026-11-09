import React from 'react';
import { seuilsRegle, r2, resteAnnuel } from './calculPrix';
import { echelles, REPERE_390, xDe, yDe } from './geometrie';
import { montantChf } from '../../domain/finance/ledger';
import { largeurTexte } from '../finance/previsions/placement';

/**
 * Le graphe de c7c : colonnes pâles (à perte, mince, il te reste) sur une pente, aiguille franche au prix, deux échelles côte à côte à gauche
 * (« /an » dehors, « /bouteille » contre l'axe ; l'échelle lue est en gras). SVG pur : aucune bibliothèque. Les valeurs viennent de `calculPrix`.
 * Classes `prx-` ; couleurs du graphe fixes (colonnes pâles comme la maquette), texte via les jetons.
 */
const chf = (n: number) => montantChf(n);
const entier = (n: number) => (n === 0 ? '0' : n >= 1000 ? `${n / 1000} k` : String(n)).replace('.', ',');

export interface GrapheProps {
  cout: number; coutExact: boolean; prix: number | null; unites: number | null; an: boolean;
  /** Prix de vente réellement pratiqués (≤ 2) : les crans de la règle. */
  reels: number[]; libelleUnite: string; bureau?: boolean;
}
export function GraphePrix({ cout, coutExact, prix, unites, an, reels, libelleUnite, bureau }: GrapheProps) {
  const e = echelles(cout, prix, unites);
  const r = REPERE_390;
  const x = xDe(e, r), y = yDe(e, r);
  const s = seuilsRegle(cout);
  const hasAn = unites !== null && unites > 0;
  const lectureAn = an && hasAn;
  const val = (v: number) => (lectureAn ? resteAnnuel(v, unites!) : v);
  const txt = (v: number) => chf(val(v));
  const R = r.YB + 8, RH = 34;
  const xMax = x(e.xMax);
  const resteDe = (p: number) => r2(p - cout);
  const pointsReels = reels.filter(p => p > 0 && p < e.xMax).slice(0, 2);
  const sty = (on: boolean, c = '#111') => ({ fontWeight: on ? 700 : 400, fill: on ? c : '#666' });
  const dessous = r.YB;
  const pas = e.yPas;
  const pBas = Math.max(0, cout - pas);
  const aigu = prix !== null && prix > 0 && prix <= e.xMax ? prix : null;
  return (
    <svg className={bureau ? 'prx-g prx-g-bureau' : 'prx-g'} viewBox="0 0 390 318" role="img" aria-label={`Prix et reste, ${libelleUnite}`} data-booster="pente-sur-regle">
      <rect x={x(0)} y={r.T} width={x(s.perte) - x(0)} height={dessous - r.T} fill="#F8DCDA" opacity=".5" />
      <rect x={x(s.perte)} y={r.T} width={x(s.mince) - x(s.perte)} height={dessous - r.T} fill="#F8EBCD" opacity=".55" />
      <rect x={x(s.mince)} y={r.T} width={xMax - x(s.mince)} height={dessous - r.T} fill="#E3F2E8" opacity=".55" />
      <g data-booster="double-echelle" className="prx-ech">
        <text x="52" y="18" textAnchor="end" fontSize="13" style={sty(lectureAn, '#256B42')}>/an</text>
        <text x="60" y="18" fontSize="13" style={sty(!lectureAn)}>/{libelleUnite}</text>
        {hasAn && <path d={`M56 ${r.T} V${dessous}`} stroke={lectureAn ? '#256B42' : '#BBBBBB'} strokeWidth={lectureAn ? 1.5 : 1} />}
        {e.yCrans.map(v => <text key={`b${v}`} x={r.X0 - 6} y={y(v) + 4} textAnchor="end" className="prx-m" fontSize={lectureAn ? 12 : 13} style={sty(!lectureAn)}>{String(v).replace('.', ',')}</text>)}
        {hasAn && e.anCrans.map(v => { const yy = y(v / unites!); return <g key={`a${v}`}><path d={`M52 ${yy} H56`} stroke="#256B42" /><text x="49" y={yy + 4} textAnchor="end" className="prx-m" fontSize={lectureAn ? 13 : 12} style={sty(lectureAn, '#256B42')}>{entier(v)}</text></g>; })}
      </g>
      <path d={`M${r.X0} ${r.Y0} H${xMax}`} stroke="#111" strokeWidth="1.2" />
      <path d={`M${r.X0} ${r.T} V${dessous}`} stroke={lectureAn ? '#BBBBBB' : '#111'} strokeWidth="1.5" />
      <path d={`M${x(pBas)} ${y(resteDe(pBas))} L${x(cout)} ${r.Y0}`} stroke="#D6453D" strokeWidth="3.5" />
      <path d={`M${x(cout)} ${r.Y0} L${xMax} ${y(Math.min(resteDe(e.xMax), e.yMax))}`} stroke="#2F8A55" strokeWidth="3.5" />
      <circle cx={x(cout)} cy={r.Y0} r="5" fill="#fff" stroke="#D6453D" strokeWidth="2.5" />
      {pointsReels.map(p => {
        const cx = x(p), cy = y(resteDe(p)), t = txt(resteDe(p)), w = largeurTexte(t, 12, true) + 12;
        return <g key={p} data-cran={p}><circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#2F8A55" strokeWidth="2.5" />
          <rect x={cx - 10 - w} y={cy - 20} width={w} height="20" rx="6" fill="#fff" stroke="#BBBBBB" /><text x={cx - 10 - w / 2} y={cy - 6} textAnchor="middle" className="prx-m" fontSize="12" fontWeight="500" fill="#256B42">{t}</text></g>;
      })}
      {aigu !== null && (() => {
        const rv = resteDe(aigu), py = y(rv), act = lectureAn ? '#256B42' : '#111', t = txt(rv), wm = largeurTexte(t, 13, true) + 14, lx = Math.min(x(aigu) + 10, 388 - wm);
        return <g data-booster="aiguille">
          <path d={`M${lectureAn ? 56 : r.X0} ${py} H${x(aigu)}`} stroke={act} strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x={x(aigu) - 2.5} y={py} width="5" height={R + RH + 4 - py} rx="2" fill="#111" />
          <circle cx={x(aigu)} cy={py} r="7" fill="#111" />
          <rect x={lx} y={py + 4} width={wm} height="22" rx="6" fill={act} /><text x={lx + wm / 2} y={py + 19} textAnchor="middle" className="prx-m" fontSize="13" fontWeight="600" fill="#fff">{t}</text></g>;
      })()}
      {aigu !== null && hasAn && (() => { const dix = r2(0.1), t = `+${chf(resteAnnuel(dix, unites!))}`; return <g data-booster="dix-centimes"><rect x={r.X0 + 4} y={y(e.yMax * 0.32) - 2} width="104" height="38" rx="8" fill="#fff" stroke="#BBBBBB" /><text x={r.X0 + 12} y={y(e.yMax * 0.32) + 13} className="prx-m" fontSize="12" fill="#111">+0,10 →</text><text x={r.X0 + 12} y={y(e.yMax * 0.32) + 29} className="prx-m" fontSize="12" fontWeight="600" fill="#256B42">{t} /an</text></g>; })()}
      <rect x={x(0)} y={R} width={x(s.perte) - x(0)} height={RH} rx="8" fill="#F8DCDA" /><rect x={x(s.perte)} y={R} width={x(s.mince) - x(s.perte)} height={RH} fill="#F8EBCD" /><rect x={x(s.mince)} y={R} width={xMax - x(s.mince)} height={RH} rx="8" fill="#E3F2E8" />
      <rect x={x(s.perte) - 3} y={R} width="3" height={RH} fill="#D6453D" /><rect x={x(s.mince) - 1} y={R} width="1.5" height={RH} fill="#B98A2E" />
      {pointsReels.map(p => <rect key={`c${p}`} x={x(p) - 1} y={R} width="2" height="8" fill="#3E6B4F" />)}
      <text x={x(s.perte / 2)} y={R + 22} textAnchor="middle" fontSize="13" fontWeight="600" fill="#8E2A24">à perte</text>
      <text x={(x(s.perte) + x(s.mince)) / 2} y={R + 15} textAnchor="middle" fontSize="13" fontWeight="600" fill="#6B4C0C">mince</text><text x={(x(s.perte) + x(s.mince)) / 2} y={R + 29} textAnchor="middle" fontSize="12" fill="#6B4C0C">⅓ ex.</text>
      <text x={(x(s.mince) + xMax) / 2} y={R + 24} textAnchor="middle" fontSize="13" fontWeight="600" fill="#256B42">il te reste</text>
      {e.xCrans.filter(v => v < e.xMax).map(v => <text key={`x${v}`} x={x(v)} y={R + RH + 18} textAnchor="middle" className="prx-m" fontSize="12" fill="#666">{String(v).replace('.', ',')}</text>)}
      <text x={xMax} y={R + RH + 18} textAnchor="end" className="prx-m" fontSize="12" fill="#666">{String(e.xMax).replace('.', ',')}</text>
      {aigu !== null && <><rect x={x(aigu) - 28} y={R + RH + 4} width="56" height="22" rx="6" fill="#111" /><text x={x(aigu)} y={R + RH + 19} textAnchor="middle" className="prx-m" fontSize="13" fontWeight="600" fill="#fff">{chf(aigu)}</text></>}
      <text x={r.X0} y={R + RH + 42} className="prx-m" fontSize="13" fontWeight="600" fill="#8E2A24">{coutExact ? 'coût' : 'coût ≥'} {chf(cout)}</text>
    </svg>
  );
}
