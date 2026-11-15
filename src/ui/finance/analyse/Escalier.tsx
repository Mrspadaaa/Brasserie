import React, { useMemo, useState } from 'react';
import { graduations, placerEtiquettes, type EscalierCaisse, type Marche, type PointCourbe } from '../../../domain/finance/analyse';
import { chf, jjmm, moisCourt, signe } from './format';

const L = 50, R = 8, T = 16, B = 26, W = 370, H = 430;
const PW = W - L - R, PH = H - T - B;
const jours = (iso: string) => Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86400000);

/** Une série en marches (date, solde après) : un trait plat jusqu'à la date, puis la contremarche. */
function marchesPath(depart: number, points: PointCourbe[], x: (d: string) => number, y: (v: number) => number, finX: number): string {
  let p = `M${L},${y(depart)}`, prev = depart;
  for (const pt of points) { p += `H${x(pt.date).toFixed(1)}V${y(pt.apres).toFixed(1)}`; prev = pt.apres; }
  return p + `H${finX}`;
}
const tronque = (t: string, n: number) => t.length > n ? `${t.slice(0, n - 1)}…` : t;

export interface EscalierProps {
  esc: EscalierCaisse;
  /** Couleur de chaque source (variable CSS). */
  onTransaction: (id: string) => void;
  onJournal: () => void;
}

/**
 * L'escalier réel (a2a, figure 1) : une marche par paiement, sa contremarche à la couleur de sa source ; le prévu en pointillé, l'an dernier en trait gris ;
 * une étiquette accrochée à chaque marche qui a de la place (`placerEtiquettes`), le reste dans « + N ». Les nombres viennent de `escalierCaisse`.
 */
export function Escalier({ esc, onTransaction }: EscalierProps) {
  const [liste, setListe] = useState(false);
  const g = useMemo(() => {
    const depart = esc.debutCents ?? 0;
    const valeurs = [depart, ...esc.marches.map(m => m.apres), ...(esc.prevu?.points.map(p => p.apres) ?? []), ...esc.anDernier.points.map(p => p.apres)];
    const lo = Math.min(...valeurs), hi = Math.max(...valeurs), marge = Math.max(1000, (hi - lo) * 0.08);
    const gr = graduations(lo - marge, hi + marge, 5);
    const bas = Math.min(lo - marge, gr.bas), haut = Math.max(hi + marge, gr.haut);
    const j0 = jours(esc.du), span = Math.max(1, jours(esc.au) - j0);
    const x = (d: string) => L + Math.min(1, Math.max(0, (jours(d) - j0) / span)) * PW;
    const y = (v: number) => T + (1 - (v - bas) / (haut - bas)) * PH;
    return { depart, ticks: gr.valeurs.filter(v => v >= bas && v <= haut), x, y, span, j0 };
  }, [esc]);
  const { x, y } = g;
  const numero = (m: Marche) => m.id === esc.pireBaisse?.id ? 1 : m.pasPrevu ? 2 : 0;
  const etiquettes = useMemo(() => {
    const entrees = esc.marches.map((m, i) => {
      const texte1 = `${tronque(m.libelle, 15)} ${signe(m.cents)}`;
      const w = Math.min(206, Math.max(104, Math.ceil(tronque(m.libelle, 15).length * 6.8 + (signe(m.cents).length + 1) * 8 + 38)));
      const avant = i === 0 ? g.depart : esc.marches[i - 1].apres;
      return { id: m.id, x: x(m.date), y: (g.y(avant) + g.y(m.apres)) / 2, w, h: 36, priorite: (m.id === esc.pireBaisse?.id ? 1e12 : m.pasPrevu ? 1e11 : 0) + Math.abs(m.cents) };
    });
    const bout = esc.marches.length ? y(esc.marches[esc.marches.length - 1].apres) : y(g.depart);
    const obstacles = [{ x: W - 112, y: bout - 28, w: 112, h: 26 }, ...(esc.prevu?.finCents != null ? [{ x: W - 112, y: y(esc.prevu.finCents) - 2, w: 112, h: 18 }] : [])];
    return placerEtiquettes(entrees, { w: W, h: H }, obstacles, 8);
  }, [esc, g, x, y]);
  // L'an dernier ne se trace que sur la même base que l'escalier : en caisse connue, il faut son solde de l'an dernier ; sinon l'écart des deux années.
  const anVisible = esc.anDernier.points.length > 0 && (!esc.connu || esc.anDernier.finCents !== null);
  const baseAn = esc.anDernier.finCents !== null && esc.anDernier.ecartCents !== null ? esc.anDernier.finCents - esc.anDernier.ecartCents : 0;
  const parId = new Map(esc.marches.map(m => [m.id, m]));
  const finX = L + PW, yFin = esc.marches.length ? y(esc.marches[esc.marches.length - 1].apres) : y(g.depart);
  // « rien noté » : un trou d'au moins 40 % de la fenêtre sans aucun paiement.
  const trous = useMemo(() => {
    const bornes = [esc.du, ...esc.marches.map(m => m.date), esc.au];
    const t: Array<{ du: string; au: string }> = [];
    for (let i = 1; i < bornes.length; i++) if ((jours(bornes[i]) - jours(bornes[i - 1])) / g.span >= 0.4) t.push({ du: bornes[i - 1], au: bornes[i] });
    return t;
  }, [esc, g.span]);
  const moisRepere = useMemo(() => {
    const sortie: Array<{ d: string; t: string }> = [];
    for (let m = esc.du.slice(0, 7); m <= esc.au.slice(0, 7) && sortie.length < 14; m = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 1)).toISOString().slice(0, 7))
      sortie.push({ d: `${m}-01` < esc.du ? esc.du : `${m}-01`, t: moisCourt(m) });
    const pas = sortie.length > 7 ? 2 : 1;
    return sortie.filter((_, i) => i % pas === 0);
  }, [esc]);
  const label = (m: Marche) => `${m.libelle} ${signe(m.cents)}, ${jjmm(m.date)}${m.pasPrevu ? ', pas prévu' : m.prevuCents !== null ? `, prévu ${signe(m.prevuCents)}` : ''}`;

  return <div className="ana-gr">
    <svg className="ana-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Escalier de la caisse, une marche par paiement">
      <defs>
        <pattern id="ana-hb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" className="ana-p-fond-mat"/><line x1="0" y1="0" x2="0" y2="6" className="ana-p-trait-mat"/></pattern>
        <pattern id="ana-hg" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" className="ana-p-fond-gris"/><line x1="0" y1="0" x2="0" y2="8" className="ana-p-trait-gris"/></pattern>
      </defs>
      {g.ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="ana-grille"/><text x={L - 4} y={y(v) + 4} textAnchor="end" className="ana-axe">{chf(v).replace(/[,.]00$/, '')}</text></g>)}
      {trous.map(t => <g key={t.du}><rect x={x(t.du)} y={y(g.depart) - 40} width={Math.max(2, x(t.au) - x(t.du))} height={40} fill="url(#ana-hg)"/>
        <text x={(x(t.du) + x(t.au)) / 2} y={y(g.depart) - 20} textAnchor="middle" className="ana-sous">rien noté</text>
        <text x={(x(t.du) + x(t.au)) / 2} y={y(g.depart) - 7} textAnchor="middle" className="ana-sous">{jjmm(t.du)} → {jjmm(t.au)}</text></g>)}
      {anVisible && <path className="ana-an" d={marchesPath(baseAn, esc.anDernier.points, x, y, finX)}><title>Même période l’an dernier</title></path>}
      {esc.prevu && <path className="ana-prevu" d={marchesPath(g.depart, esc.prevu.points, x, y, finX)}><title>Prévu : les plans et les brassins</title></path>}
      <path className="ana-reel" d={marchesPath(g.depart, esc.marches, x, y, finX)}/>
      {esc.marches.map((m, i) => {
        const avant = i === 0 ? g.depart : esc.marches[i - 1].apres;
        return <line key={m.id} x1={x(m.date)} x2={x(m.date)} y1={y(avant)} y2={y(m.apres)} className={`ana-cm ana-s-${m.source}`} stroke={m.source === 'materiel' ? 'url(#ana-hb)' : undefined}/>;
      })}
      {etiquettes.placees.map(p => {
        const m = parId.get(p.id)!, n = numero(m), cx = Math.min(Math.max(x(m.date), p.x), p.x + p.w);
        const i = esc.marches.indexOf(m), ay = (y(i === 0 ? g.depart : esc.marches[i - 1].apres) + y(m.apres)) / 2;
        const cy = Math.min(Math.max(ay, p.y), p.y + p.h);
        return <g key={p.id}>
          <line x1={x(m.date)} y1={ay} x2={cx} y2={cy} className="ana-fil"/>
          <g role="button" tabIndex={0} aria-label={`${label(m)}, ouvrir la pièce`} className={`ana-et${m.pasPrevu ? ' ana-et-pp' : ''}`} onClick={() => m.txId && onTransaction(m.txId)}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && m.txId) { e.preventDefault(); onTransaction(m.txId); } }}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="8"/>
            <circle cx={p.x + 9} cy={p.y + 12} r="4" className={`ana-pt ana-s-${m.source}`}/>
            <text x={p.x + 18} y={p.y + 16} className="ana-et-t">{tronque(m.libelle, 15)} <tspan className="ana-m">{signe(m.cents)}</tspan></text>
            <text x={p.x + 8} y={p.y + 30} className="ana-et-s">{m.pasPrevu ? `pas prévu, ${jjmm(m.date)}` : <>{jjmm(m.date)}{m.prevuCents !== null && <tspan className="ana-m"> ┄ {signe(m.prevuCents)}</tspan>}</>}</text>
          </g>
          {n > 0 && <g aria-hidden="true"><circle cx={x(m.date)} cy={ay} r="8" className="ana-num"/><text x={x(m.date)} y={ay + 4} textAnchor="middle" className="ana-num-t">{n}</text></g>}
        </g>;
      })}
      {esc.prevu?.finCents != null && <text x={W - R} y={y(esc.prevu.finCents) + 14} textAnchor="end" className="ana-fin-prevu ana-m">┄ {chf(esc.prevu.finCents)}</text>}
      <text x={W - R} y={yFin - 8} textAnchor="end" className="ana-fin ana-m">{esc.finCents !== null ? `${esc.incertains.length ? '≤ ' : ''}${chf(esc.finCents)}` : `${esc.incertains.length ? '≤ ' : ''}${signe(esc.ecartCents)}`}</text>
      {moisRepere.map(m => <text key={m.d} x={Math.min(Math.max(x(m.d), L + 14), W - 20)} y={H - 8} textAnchor="middle" className="ana-axe-x">{m.t}</text>)}
    </svg>
    {etiquettes.reste.length > 0 && <div className="ana-reste">
      <button type="button" className="ana-pastille" aria-expanded={liste} onClick={() => setListe(!liste)}>+ {etiquettes.reste.length} {etiquettes.reste.length > 1 ? 'autres opérations' : 'autre opération'}</button>
      {liste && <ul className="ana-liste">{etiquettes.reste.map(id => parId.get(id)!).sort((a, b) => a.date.localeCompare(b.date)).map(m =>
        <li key={m.id}><button type="button" onClick={() => m.txId && onTransaction(m.txId)}><span>{jjmm(m.date)} · {m.libelle}</span><span className="ana-m">{signe(m.cents)}</span></button></li>)}</ul>}
    </div>}
  </div>;
}
