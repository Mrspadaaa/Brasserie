import React, { useId, useMemo } from 'react';
import type { ForecastItem } from '../../../domain/finance/forecast';
import { graduations, joursEntre, type Escalier as EscalierDonnees } from './escalier';
import { largeurTexte, placerEtiquettes, pointDAccroche, type Demande, type Rect } from './placement';
import { jourCourt, montant, montantEntier, montantSigne, moisCourt } from './format';

/** Style d'une étiquette, par source (D8) : seule la facture est neutre pleine ; plan, récurrent, tendance, projet non testé = pointillé bleu « Prévu ». */
export type StyleEtiquette = 'facture' | 'prevu' | 'brassin' | 'projet' | 'entree';
export const styleDe = (item: ForecastItem, testeId?: string | null): StyleEtiquette =>
  item.direction === 'in' ? 'entree' : item.source === 'invoice' ? 'facture' : item.source === 'brew' ? 'brassin' : item.source === 'equipment' && testeId && item.planId === testeId ? 'projet' : 'prevu';

const HAUTEUR = 500, G = 48, D = 8, H = 16, B = 30;
const nomCourt = (item: ForecastItem) => {
  if (item.source === 'trend') return 'dépenses courantes';
  if (item.source === 'brew') { const p = item.label.split(' · '); return `${p[0]} · ${p[1] ?? ''}`.trim(); }
  return item.label.split(' · ')[0];
};
export const texteEtiquette = (item: ForecastItem) => `${nomCourt(item)} ${item.direction === 'out' ? montant(-item.amountCents) : montantSigne(item.amountCents)}, ${jourCourt(item.date)}`;

interface Props { e: EscalierDonnees; fantome?: EscalierDonnees | null; largeur: number; testeId?: string | null; sousLignes?: Record<string, string>; asOf: string;
  onEtiquette: (item: ForecastItem) => void; onReste: () => void }

export function EscalierSvg({ e, fantome, largeur, testeId, sousLignes = {}, asOf, onEtiquette, onReste }: Props) {
  const uid = useId().replace(/:/g, '');
  const vue = useMemo(() => {
    const W = Math.max(280, Math.round(largeur)), connu = e.departCents !== null;
    const val = (m: { soldeApresCents: number | null; ecartCents: number }) => (connu ? m.soldeApresCents! : m.ecartCents);
    const depart = connu ? e.departCents! : 0;
    const g = graduations(Math.min(e.min, fantome?.min ?? e.min), Math.max(e.max, fantome?.max ?? e.max));
    const bas = H + 0, haut = HAUTEUR - B;
    const y = (v: number) => H + (g.haut - v) / (g.haut - g.bas) * (haut - H);
    const totalJ = joursEntre(e.debut, e.fin) + 1, xFin = W - D;
    const x = (d: string) => G + joursEntre(e.debut, d) / totalJ * (xFin - G);
    const chemin = (s: EscalierDonnees) => {
      const dep = s.departCents === null ? 0 : s.departCents;
      let p = `M${G} ${y(dep).toFixed(1)}`;
      for (const m of s.marches) p += ` H${x(m.date).toFixed(1)} V${y(s.departCents === null ? m.ecartCents : m.soldeApresCents!).toFixed(1)}`;
      return `${p} H${xFin}`;
    };
    // mois : séparateurs aux 1er, noms au milieu de chaque mois
    const mois: Array<{ x: number; nom: string; sep: number | null }> = [];
    let courant = e.debut, prochain = '';
    while (courant <= e.fin) {
      const d = new Date(`${courant.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); prochain = d.toISOString().slice(0, 10);
      const finMois = prochain <= e.fin ? prochain : null, x0 = x(courant), x1 = finMois ? x(finMois) : xFin;
      if (x1 - x0 > 26) mois.push({ x: (x0 + x1) / 2, nom: moisCourt(courant), sep: finMois ? x1 : null }); else if (finMois) mois.push({ x: -1, nom: '', sep: x1 });
      courant = prochain;
    }
    // étiquettes
    const demandes: Demande[] = [], infos = new Map<string, { item: ForecastItem; style: StyleEtiquette; l1: string; l2?: string; avant: number }>();
    let ordre = 0, avant = depart;
    for (const m of e.marches) {
      const apres = val(m);
      for (const item of m.items) {
        const style = styleDe(item, testeId), l1 = texteEtiquette(item);
        const l2 = style === 'projet' ? sousLignes[item.id] : item.partial?.length ? `partiel : ${item.partial.join(', ')}` : item.source === 'brew' && item.label.includes('date estimée') ? 'date estimée' : undefined;
        const w = Math.max(largeurTexte(l1, style === 'projet' ? 15 : 13), l2 ? largeurTexte(l2, 12) : 0) + 20, h = l2 ? 38 : 20;
        const poids = Math.min(99, Math.round(item.amountCents / 1000));
        demandes.push({ id: item.id, priorite: style === 'projet' ? 100 : style === 'brassin' ? 80 : style === 'entree' ? 60 : 10, poids, ordre: ordre++, w, h, ancre: { x: x(m.date), y: (y(avant) + y(apres)) / 2 } });
        infos.set(item.id, { item, style, l1, l2, avant });
      }
      avant = apres;
    }
    const xFinal = e.marches.length ? val(e.marches[e.marches.length - 1]) : depart;
    const libFin = connu ? montant(e.soldeFinCents!) : `${montantSigne(e.ecartFinCents)} depuis aujourd’hui`;
    const wAuj = largeurTexte(connu ? `aujourd’hui ${montant(depart)}` : 'aujourd’hui', 13) + 10, wFin = largeurTexte(libFin, 16, true) + 8;
    // le solde final se pose sous le point quand il y a la place avant les noms de mois, sinon au-dessus (jamais sur « févr. »)
    const dessous = xFinal < 0 && y(xFinal) + 28 < haut;
    const obstacles: Rect[] = [{ x: 0, y: 0, w: G - 2, h: HAUTEUR }, { x: 0, y: haut, w: W, h: B }, { x: G, y: 0, w: wAuj, h: H + 2 },
      { x: xFin - wFin, y: y(xFinal) + (dessous ? 4 : -26), w: wFin, h: 24 }];
    const { placees, reste } = placerEtiquettes(demandes, { w: W, h: HAUTEUR }, obstacles);
    return { W, g, y, x, xFin, haut, chemin, mois, placees, reste, infos, y0: y(0), connu, depart, libFin, wAuj, xFinal, bas, dessous };
  }, [e, fantome, largeur, testeId, sousLignes]);
  const { W, g, y, xFin, haut, chemin, mois, placees, reste, infos, y0, connu, depart, libFin, xFinal, dessous } = vue;
  const sousZero = connu && e.soldeFinCents! < 0;
  const clipPos = `${uid}p`, clipNeg = `${uid}n`;
  const aire = `${chemin(e)} V${y0.toFixed(1)} H${G} Z`;
  return <svg className="prv-svg" viewBox={`0 0 ${W} ${HAUTEUR}`} width={W} height={HAUTEUR} role="img" aria-label={`Escalier de trésorerie du ${e.debut.slice(8)}.${e.debut.slice(5, 7)} au ${e.fin.slice(8)}.${e.fin.slice(5, 7)}`}>
    <defs><clipPath id={clipPos}><rect x={G} y={0} width={W} height={Math.max(0, y0)} /></clipPath><clipPath id={clipNeg}><rect x={G} y={y0} width={W} height={HAUTEUR} /></clipPath></defs>
    {g.ticks.map(t => <g key={t}><line className={t === 0 ? 'prv-zero' : 'prv-grid'} x1={G} x2={xFin} y1={y(t)} y2={y(t)} /><text className={`prv-ax${t === 0 ? ' prv-z' : ''}`} x={G - 4} y={y(t) + 3.5} textAnchor="end">{t === 0 ? '0' : montantEntier(t)}</text></g>)}
    {mois.map((m, i) => <g key={i}>{m.sep !== null && <line className="prv-sep" x1={m.sep} x2={m.sep} y1={H} y2={haut} />}{m.nom && <text className="prv-mois" x={m.x} y={HAUTEUR - 10} textAnchor="middle">{m.nom}</text>}</g>)}
    {fantome && <path className="prv-ghost" d={chemin(fantome)} />}
    <path className="prv-aire" d={aire} clipPath={`url(#${clipPos})`} />
    {connu && <path className="prv-aire-neg" d={aire} clipPath={`url(#${clipNeg})`} />}
    <path className="prv-step" d={chemin(e)} clipPath={`url(#${clipPos})`} />
    <path className={connu ? 'prv-step-neg' : 'prv-step'} d={chemin(e)} clipPath={`url(#${clipNeg})`} />
    <line className="prv-ici" x1={G} x2={G} y1={H} y2={y(depart)} />
    <text className="prv-et" x={G + 4} y={H - 3}>aujourd’hui{connu && <> <tspan className="prv-mt">{montant(depart)}</tspan></>}</text>
    {placees.map(p => {
      const info = infos.get(p.id)!, a = pointDAccroche(p.rect, p.ancre), hit = Math.max(0, (32 - p.rect.h) / 2);
      return <g key={p.id} className={`prv-etq prv-${info.style}`} role="button" tabIndex={0} aria-label={info.l2 ? `${info.l1} ; ${info.l2}` : info.l1} onClick={() => onEtiquette(info.item)}
        onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onEtiquette(info.item); } }}>
        <line className="prv-fil" x1={p.ancre.x} y1={p.ancre.y} x2={a.x} y2={a.y} />
        <circle className="prv-pt" cx={p.ancre.x} cy={p.ancre.y} r={2.5} />
        <rect className="prv-chip" x={p.rect.x} y={p.rect.y} width={p.rect.w} height={p.rect.h} rx={p.rect.h > 24 ? 12 : 10} />
        <text className="prv-tx" x={p.rect.x + 10} y={p.rect.y + (info.l2 ? 15 : 14)}>{info.l1}</text>
        {info.l2 && <text className="prv-sub" x={p.rect.x + 10} y={p.rect.y + 31}>{info.l2}</text>}
        <rect x={p.rect.x} y={p.rect.y - hit} width={p.rect.w} height={p.rect.h + 2 * hit} fill="transparent" />
      </g>;
    })}
    {reste.length > 0 && <g className="prv-reste" role="button" tabIndex={0} aria-label={`${reste.length} sorties de plus : ouvrir la liste`} onClick={onReste} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onReste(); } }}>
      <rect x={G + 6} y={haut - 28} width={56} height={22} rx={11} /><text x={G + 34} y={haut - 13} textAnchor="middle">+ {reste.length}</text></g>}
    <circle className={sousZero ? 'prv-pt-neg' : 'prv-pt'} cx={xFin} cy={y(xFinal)} r={4} />
    <text className={`prv-fin${sousZero ? ' prv-rt' : ''}`} x={xFin} y={y(xFinal) + (dessous ? 22 : -10)} textAnchor="end">{libFin}</text>
  </svg>;
}
