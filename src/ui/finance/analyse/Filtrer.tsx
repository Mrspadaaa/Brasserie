import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { fournisseursDe, graduations, serieFiltre, tuilesAnnee, type EntreeAnalyse, type PlageMois, type SourceCle, type SerieFiltre, type TuileMois } from '../../../domain/finance/analyse';
import { PlageMois as ChampsPlage } from '../PlageMois';
import { chf, categorieDeSource, moisCourt, moisLong, nomSource, plage as titrePlage, signe } from './format';
import { Pourquoi, type TextePourquoi } from './Pourquoi';
import type { VueProps } from './Caisse';

export type ModeFiltre = 'mois' | 'plage' | 'annee';
export interface EtatFiltre { mode: ModeFiltre; du: string; au: string; source: SourceCle | null; fournisseur: string | null; brassinId: string | null; ancre: string | null }
const SOURCES: SourceCle[] = ['ventes', 'chargesFixes', 'brassage', 'nettoyage', 'autres'];

function Tuile({ t, choisie, maxAbs, onChoisir }: { t: TuileMois; choisie: boolean; maxAbs: number; onChoisir: () => void }) {
  const nom = moisCourt(t.mois);
  if (t.futur) return <span className="ana-tuile ana-tuile-futur" aria-label={`${moisLong(t.mois)}, à venir`}><b>{nom}</b><span>à venir</span></span>;
  if (t.gainCents === null) return <button type="button" className="ana-tuile ana-tuile-vide" aria-pressed={choisie} aria-label={`${moisLong(t.mois)}, rien noté`} onClick={onChoisir}><b>{nom}</b><span>rien noté</span></button>;
  const force = Math.round(18 + 62 * Math.min(1, Math.abs(t.gainCents) / Math.max(1, maxAbs)));
  const base = t.gainCents >= 0 ? 'var(--ana-vert)' : 'var(--ana-rouge)';
  const fond = `color-mix(in srgb, ${base} ${force}%, var(--ana-page))`;
  const grand = Math.max(t.depenseCents, t.prevuCents ?? 0, 1);
  const trop = t.prevuCents !== null && t.depenseCents > t.prevuCents;
  return <button type="button" className={`ana-tuile${force > 55 ? ' ana-tuile-fort' : ''}`} style={{ background: fond }} aria-pressed={choisie}
    aria-label={`${moisLong(t.mois)} ${t.gainCents >= 0 ? 'gagné' : 'perdu'} ${chf(Math.abs(t.gainCents))} CHF${t.prevuCents !== null ? `, dépensé ${chf(t.depenseCents)} pour ${chf(t.prevuCents)} prévus` : ''}${t.anGainCents !== null ? `, l’an dernier ${signe(t.anGainCents)}` : ''}`} onClick={onChoisir}>
    <b>{nom}</b><span className="ana-m">{signe(Math.round(t.gainCents / 100) * 100).replace(/,00$/, '')}</span>
    {t.prevuCents !== null && <span className="ana-regle-mini" aria-hidden="true"><span className={trop ? 'ana-mini-trop' : ''} style={{ width: `${Math.min(100, t.depenseCents / grand * 100)}%` }}/><i style={{ left: `${t.prevuCents / grand * 100}%` }}/></span>}
    {t.anGainCents !== null && <span className="ana-coin" aria-hidden="true"/>}
  </button>;
}

const WG = 370, HG = 250, LG = 52, RG = 8, TG = 16, BG = 40;
function Courbe({ s, source, nom }: { s: SerieFiltre; source: SourceCle | null; nom: string }) {
  const n = s.points.length;
  const vals = [0, ...s.points.flatMap(p => [p.cumulCents, p.prevuCumulCents ?? 0, p.anCumulCents ?? 0])];
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = Math.max(1000, (hi - lo) * 0.08);
  const gr = graduations(lo - (lo < 0 ? pad : 0), hi + (hi > 0 ? pad : 0), 5);
  const bas = Math.min(lo, gr.bas), haut = Math.max(hi, gr.haut);
  const y = (v: number) => TG + (1 - (v - bas) / Math.max(1, haut - bas)) * (HG - TG - BG);
  const px = (i: number) => LG + (i + 0.5) / Math.max(1, n) * (WG - LG - RG);
  const pas = (cle: 'cumulCents' | 'prevuCumulCents' | 'anCumulCents') => {
    let d = `M${LG},${y(0)}`;
    s.points.forEach((p, i) => { const v = p[cle]; if (v === null) return; d += `H${px(i).toFixed(1)}V${y(v).toFixed(1)}`; });
    return d + `H${WG - RG}`;
  };
  const dernier = s.points[n - 1], xi = n > 1 ? px(n - 1) : LG;
  const lourd = s.plusLourd ? s.points.findIndex(p => p.mois === s.plusLourd!.mois) : -1;
  const aire = pas('cumulCents') + `V${y(0)}Z`;
  const pasMois = n > 8 ? 2 : 1;
  return <svg className="ana-svg" viewBox={`0 0 ${WG} ${HG}`} role="img" aria-label={`${nom} : cumul de ${signe(s.totalCents)} CHF sur ${n} mois`}>
    <defs><pattern id="ana-hr" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" className="ana-p-fond-rouge"/><line x1="0" y1="0" x2="0" y2="6" className="ana-p-trait-rouge"/></pattern></defs>
    {gr.valeurs.filter(v => v >= bas && v <= haut).map(v => <g key={v}><line x1={LG} x2={WG - RG} y1={y(v)} y2={y(v)} className={v === 0 ? 'ana-zero' : 'ana-grille'}/><text x={LG - 4} y={y(v) + 4} textAnchor="end" className="ana-axe">{chf(v).replace(/[,.]00$/, '')}</text></g>)}
    <path d={aire} className={`ana-aire ana-aire-${source ?? 'gagne'}`}/>
    {s.anTotalCents !== null && <path d={pas('anCumulCents')} className="ana-an"><title>Même période l’an dernier</title></path>}
    {s.prevuTotalCents !== null && <path d={pas('prevuCumulCents')} className="ana-prevu"><title>Prévu</title></path>}
    <path d={pas('cumulCents')} className={`ana-reel ana-reel-${source ?? 'gagne'}`}/>
    {s.depasseCents !== null && s.depasseCents > 0 && s.prevuTotalCents !== null && <rect x={xi} y={Math.min(y(dernier.cumulCents), y(s.prevuTotalCents))} width={WG - RG - xi} height={Math.abs(y(dernier.cumulCents) - y(s.prevuTotalCents))} fill="url(#ana-hr)"/>}
    {lourd >= 0 && <g aria-hidden="true"><circle cx={px(lourd)} cy={y(s.points[lourd].cumulCents)} r="8" className="ana-num"/><text x={px(lourd)} y={y(s.points[lourd].cumulCents) + 4} textAnchor="middle" className="ana-num-t">1</text>
      <text x={px(lourd) > WG - RG - 130 ? px(lourd) + 8 : px(lourd) + 12} y={y(s.points[lourd].cumulCents) + (px(lourd) > WG - RG - 130 ? -14 : 4)} textAnchor={px(lourd) > WG - RG - 130 ? 'end' : 'start'} className="ana-et-t ana-m">{moisCourt(s.points[lourd].mois)} {signe(s.points[lourd].cents)}</text></g>}
    {s.prevuTotalCents !== null && <text x={WG - RG - 60} y={y(s.prevuTotalCents) + (s.prevuTotalCents <= dernier.cumulCents ? -6 : 14)} textAnchor="end" className="ana-fin-prevu ana-m">┄ {signe(s.prevuTotalCents)}</text>}
    {s.anTotalCents !== null && <text x={LG + 4} y={y(s.anTotalCents) - 5} className="ana-sous ana-m">l’an dernier {signe(s.anTotalCents)}</text>}
    <text x={WG - RG} y={Math.min(HG - BG - 4, Math.max(TG + 14, y(dernier.cumulCents) + (dernier.cumulCents <= 0 ? 16 : -6)))} textAnchor="end" className="ana-fin ana-m">{signe(s.totalCents)}</text>
    {s.points.map((p, i) => i % pasMois === 0 && <text key={p.mois} x={px(i)} y={HG - 12} textAnchor="middle" className="ana-axe-x">{moisCourt(p.mois)}</text>)}
  </svg>;
}

export interface FiltrerProps extends VueProps {
  e: EntreeAnalyse; annee: string; etat: EtatFiltre; onEtat: (e: EtatFiltre) => void;
  brassins: Array<{ id: string; nom: string }>; pourquoi: (s: SerieFiltre) => TextePourquoi | null;
}
export const plageDeEtat = (e: EtatFiltre): PlageMois => ({ du: e.du, au: e.au });

/** Figure 4 : les tuiles de douze mois (gagné ou perdu, règle du budget au pied, l'an dernier au coin) sont le sélecteur de période ; pastilles source / fournisseur / brassin ; la courbe cumulée suit. */
export function FiltrerVue({ e, annee, etat, onEtat, brassins, pourquoi, onJournal }: FiltrerProps) {
  const tuiles = useMemo(() => tuilesAnnee(e, annee), [e, annee]);
  const plage = plageDeEtat(etat);
  const serie = useMemo(() => serieFiltre(e, { plage, source: etat.source, fournisseur: etat.fournisseur, brassinId: etat.brassinId }), [e, plage.du, plage.au, etat.source, etat.fournisseur, etat.brassinId]);
  const fournisseurs = useMemo(() => fournisseursDe(e, plage), [e, plage.du, plage.au]);
  const maxAbs = Math.max(1, ...tuiles.map(t => Math.abs(t.gainCents ?? 0)));
  const choisir = (mois: string) => {
    if (etat.mode === 'mois' || etat.mode === 'annee') return onEtat({ ...etat, mode: 'mois', du: mois, au: mois, ancre: null });
    if (!etat.ancre) return onEtat({ ...etat, du: mois, au: mois, ancre: mois });
    const [du, au] = mois < etat.ancre ? [mois, etat.ancre] : [etat.ancre, mois];
    onEtat({ ...etat, du, au, ancre: null });
  };
  const courant = e.aujourdhui.slice(0, 7);
  const dansAnnee = (m: string) => m >= plage.du && m <= plage.au;
  const nom = etat.source ? nomSource(etat.source) : 'Gagné ou perdu';
  const decrit = `${nom}, ${titrePlage(plage.du, plage.au)}`;
  const txt = pourquoi(serie);
  const mode = (m: ModeFiltre) => m === 'annee' ? onEtat({ ...etat, mode: m, du: `${annee}-01`, au: `${annee}-12` < courant ? `${annee}-12` : courant, ancre: null }) : onEtat({ ...etat, mode: m, ancre: null });
  return <>
    <div className="ana-seg ana-seg-mode" role="group" aria-label="Choisir la période par les tuiles">
      {([['mois', 'Mois'], ['plage', 'Du … au'], ['annee', 'Année']] as const).map(([m, l]) => <button type="button" key={m} aria-pressed={etat.mode === m} onClick={() => mode(m)}>{l}</button>)}
    </div>
    <div className="ana-tuiles" role="group" aria-label={`Mois de ${annee}`}>
      {tuiles.map(t => <Tuile key={t.mois} t={t} choisie={dansAnnee(t.mois)} maxAbs={maxAbs} onChoisir={() => choisir(t.mois)}/>)}
    </div>
    {etat.mode === 'plage' && <ChampsPlage key={`${plage.du}-${plage.au}`} courant={courant} du={plage.du} au={plage.au} onPlage={(du, au) => onEtat({ ...etat, du, au, ancre: null })}/>}
    <div className="ana-pastilles">
      <label className={`ana-chip${etat.source ? ' ana-chip-on' : ''}`}>
        {etat.source ? <><span className={`ana-pt ana-s-${etat.source}`}/>{nomSource(etat.source)} ✓</> : '+ source'}
        <select aria-label="Source" value={etat.source ?? ''} onChange={ev => onEtat({ ...etat, source: (ev.target.value || null) as SourceCle | null })}>
          <option value="">Toutes (gagné ou perdu)</option>{SOURCES.map(s => <option key={s} value={s}>{nomSource(s)}</option>)}
        </select>
      </label>
      <label className="ana-chip">Fournisseur : {etat.fournisseur ?? 'tous'} <span aria-hidden="true">⌄</span>
        <select aria-label="Fournisseur" value={etat.fournisseur ?? ''} onChange={ev => onEtat({ ...etat, fournisseur: ev.target.value || null })}>
          <option value="">Tous</option>{fournisseurs.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      <label className="ana-chip">Brassin : {brassins.find(b => b.id === etat.brassinId)?.nom ?? 'tous'} <span aria-hidden="true">⌄</span>
        <select aria-label="Brassin" value={etat.brassinId ?? ''} onChange={ev => onEtat({ ...etat, brassinId: ev.target.value || null })}>
          <option value="">Tous</option>{brassins.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </label>
    </div>
    <p className="ana-dit" aria-live="polite">
      {decrit} : <b className={serie.totalCents >= 0 ? 'ana-ok' : 'ana-mal'}>{signe(serie.totalCents)} CHF</b>
      {serie.depasseCents !== null && serie.depasseCents > 0 && <>, <b className="ana-mal">{chf(serie.depasseCents)}</b> au-delà du prévu</>}
      {serie.plusLourd && <> ; {moisLong(serie.plusLourd.mois)} le plus lourd</>}.
    </p>
    {serie.nombrePieces === 0 ? <p className="ana-vide">Aucune pièce ne passe ce filtre sur cette période.</p> : <div className="ana-gr"><Courbe s={serie} source={etat.source} nom={decrit}/></div>}
    <div className="ana-pied"><Pourquoi texte={txt}/><button type="button" className="ana-ops" onClick={() => onJournal({ scope: 'all', allDates: plage.du !== plage.au, month: plage.du === plage.au ? plage.du : undefined, category: etat.source ? categorieDeSource(etat.source) : undefined })}><b className="ana-m">{serie.nombrePieces}</b> {serie.nombrePieces > 1 ? 'opérations' : 'opération'} <ChevronRight size={14} aria-hidden="true"/></button></div>
  </>;
}
