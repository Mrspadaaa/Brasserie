import React, { useId, useMemo, useState } from 'react';
import type { Batch } from '../types';
import { escalierDe, geometrieEscalier, mouvementsDeFamille, ESC, type ArticleDeFamille, type MouvementArticle, type MouvementBrut } from '../domain/stock/mouvementsArticle';
import { jourSemaine, nomDuMois, nombreSuisse, quantiteArticle, variation } from '../domain/stock/ficheArticle';

/**
 * « Ce qui a bougé » (voie p1, 12.11) : la carte de la maquette B4 choisie par le brasseur, nourrie par les vrais mouvements
 * (achat, brassage, inventaire, correction) de l'article et de ses lots, par le besoin de `disponibilites()` et par le seuil.
 * Le dessin est celui de B4 : escalier d'une marche par mouvement, besoin en rouge pointillé, seuil en ocre tireté,
 * hachures du manque, dates sous les marches, puis les mouvements « avant → après » et « Tout voir ».
 * Ce qui manque est dit (« seuil à fixer », « aucun besoin », « besoin inconnu »), jamais tracé à 0.
 */
export interface StockFicheBougeProps {
  /** Nom de l’article, pour la description de la courbe. */
  nom: string;
  famille: ArticleDeFamille[];
  unite: string;
  movements: MouvementBrut[];
  batches: Pick<Batch, 'id' | 'name'>[];
  /** Besoin de la famille : nombre, 0 = aucun, null = inconnu. */
  besoin: number | null;
  seuil: number | undefined;
  aujourdhui: string;
  onOpenTransaction?: (id: string) => void;
  onOpenBatch?: (id: string) => void;
}

const TROIS = 4; // B4 montre quatre mouvements avant « Tout voir »

const Icone: Record<MouvementArticle['genre'], React.ReactNode> = {
  achat: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.8h9v12.4l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z M6 5.5h4M6 8.5h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  annulation: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.8h9v12.4l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z M5.5 6l5 4M10.5 6l-5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  brassage: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6.5h9v5.5a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 12z M2.5 6.5h11 M3.5 8.5H1.8 M12.5 8.5h1.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.3 4.5c-.6-.8.6-1.4 0-2.3 M9.7 4.5c-.6-.8.6-1.4 0-2.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  inventaire: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2" width="11" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 6l1.2 1.2L8.5 5 M5 10.5h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  correction: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13l.8-3.2L10.6 3 13 5.4 6.2 12.2z M9.2 4.4l2.4 2.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
};
const Chevron = <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function Escalier({ e, unite, nom }: { e: NonNullable<ReturnType<typeof escalierDe>>; unite: string; nom: string }) {
  const motif = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const g = useMemo(() => geometrieEscalier(e), [e]);
  const { W, H, x0, x1, yb } = { ...ESC };
  const { y, xs } = g;
  const dernier = e.pts.length - 1;
  // Une étiquette sans ligne (« seuil à fixer » en bas, « aucun besoin » en haut) : décalée de 14 si elle croise celle d'une ligne tracée.
  const yEtiquette = (bas: boolean) => {
    const autre = bas ? (e.besoin !== null && e.besoin > 0 ? y(e.besoin) + 4 : null) : (e.seuil !== null ? y(e.seuil) + 4 : null);
    const propre = bas ? yb : 16;
    return autre !== null && Math.abs(propre - autre) < 14 ? (bas ? autre - 14 : autre + 14) : propre;
  };
  const sansLigne = [e.seuilEtat === 'a-fixer' && 'seuil à fixer', e.besoinEtat === 'aucun' ? 'aucun besoin' : e.besoinEtat === 'inconnu' ? 'besoin inconnu' : false].filter(Boolean) as string[];
  const ligne = (v: number | null, cl: string, lab: string) => v === null ? null : <>
    <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} className={`sfp-${cl}`}/>
    <text x={x1 + 4} y={y(v) + 4} className={`sfp-${cl}t`}>{lab}</text></>;
  const fin = e.pts[dernier];
  return <svg className="sfp-esc" viewBox={`0 0 ${W} ${H}`} role="img" data-escalier
    aria-label={`Stock de ${nom} : ${e.pts.map(v => quantiteArticle(v, unite)).join(' → ')}${sansLigne.length ? ` · ${sansLigne.join(', ')}` : ''}`}>
    <defs><pattern id={motif} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" className="sfp-hfond"/><rect width="1.6" height="4" className="sfp-htrait"/></pattern></defs>
    <path d={g.aire} className="sfp-esca"/><path d={g.d} className="sfp-escl"/>
    {ligne(e.seuil, 'escs', `seuil ${quantiteArticle(e.seuil, unite)}`)}
    {e.manque && e.besoin !== null && <rect x={xs[dernier]} y={y(e.besoin)} width={x1 - xs[dernier]} height={y(fin) - y(e.besoin)} className="sfp-escm" style={{ fill: `url(#${motif})` }}/>}
    {e.besoinEtat === 'connu' && ligne(e.besoin, 'escb', `besoin ${quantiteArticle(e.besoin, unite)}`)}
    {e.pts.slice(1).map((v, i) => <circle key={i} cx={xs[i + 1]} cy={y(v)} r={3.2} className="sfp-escp"/>)}
    {e.dates.map((d, i) => d && <text key={i} x={xs[i + 1]} y={H - 2} className="sfp-escd" textAnchor="middle">{d.slice(8, 10)}.{d.slice(5, 7)}</text>)}
    {sansLigne.map(lab => <text key={lab} x={x1 + 4} y={yEtiquette(lab.startsWith('seuil'))} className="sfp-escn" data-manque={lab.startsWith('seuil') ? 'seuil' : 'besoin'}>{lab}</text>)}
  </svg>;
}

export const StockFicheBouge: React.FC<StockFicheBougeProps> = ({ nom, famille, unite, movements, batches, besoin, seuil, aujourdhui, onOpenTransaction, onOpenBatch }) => {
  const [toutVoir, setToutVoir] = useState(false);
  const { liste, avantLePlusAncien, ecartFinal } = useMemo(() => mouvementsDeFamille(famille, movements, batches), [famille, movements, batches]);
  const e = useMemo(() => escalierDe([...liste].reverse(), { besoin: besoin === null ? 'inconnu' : besoin, seuil }), [liste, besoin, seuil]);
  const montres = toutVoir ? liste : liste.slice(0, TROIS);
  const plusAncien = liste.at(-1)?.date ?? null;
  const depuis = nomDuMois(plusAncien);
  return <section className="sfp-fs" data-ce-qui-a-bouge aria-label="Ce qui a bougé">
    <h3 className="sfp-fh">Ce qui a bougé<small>avant → après</small></h3>
    {liste.length === 0
      ? <p className="sfp-vide-m" data-mouvements-vides>Aucun mouvement enregistré pour cet article : la courbe se trace dès le premier achat, brassage ou inventaire.</p>
      : <>
        {e ? <Escalier e={e} unite={unite} nom={nom}/>
          : <p className="sfp-vide-m" data-courbe-non-tracee>Courbe non tracée : le stock avant le premier mouvement est inconnu.</p>}
        <ol className="sfp-mv" data-mouvements>{montres.map(m => {
          const lien = m.lien && (m.lien.genre === 'facture' ? onOpenTransaction : onOpenBatch) ? m.lien : null;
          const ouvrir = () => { if (lien) (lien.genre === 'facture' ? onOpenTransaction : onOpenBatch)?.(lien.id); };
          const jour = jourSemaine(m.date, aujourdhui) ?? 'date inconnue';
          const suite = m.genre === 'achat' && lien ? ' · voir la facture' : m.genre === 'brassage' && lien ? ' · voir le bilan' : m.detail ? ` · ${m.detail}` : '';
          const corps = <>
            <span className={`sfp-mvi${m.genre === 'achat' ? ' sfp-mvif' : ''}`}>{Icone[m.genre]}</span>
            <span className="sfp-mvt">{m.titre}<small>{jour}{suite}{m.ecart !== null && <> · <b className="sfp-rouge">écart {variation(m.ecart)} {unite}</b></>}</small></span>
            <span className="sfp-mvq">{m.avant === null ? '?' : nombreSuisse(m.avant)} → <b>{quantiteArticle(m.apres, unite)}</b></span>
            {m.delta === null ? <em className="sfp-d0">?</em> : <em className={m.delta > 0 ? 'sfp-dp' : m.delta < 0 ? 'sfp-dm' : 'sfp-d0'}>{variation(m.delta)}</em>}
            <span className="sfp-mvc">{lien ? Chevron : null}</span></>;
          return <li key={m.id}>{lien
            ? <button type="button" className="sfp-mvr" data-mouvement={m.genre} onClick={ouvrir}>{corps}</button>
            : <div className="sfp-mvr" data-mouvement={m.genre}>{corps}</div>}</li>;
        })}</ol>
        {avantLePlusAncien !== null && (toutVoir || liste.length <= TROIS) && plusAncien && <p className="sfp-mva">{quantiteArticle(avantLePlusAncien, unite)} avant le {plusAncien.slice(8, 10)}.{plusAncien.slice(5, 7)}</p>}
        {ecartFinal !== null && <p className="sfp-mva" data-ecart-final>Depuis le dernier mouvement, la fiche a été changée à la main : {variation(ecartFinal)} {unite}.</p>}
        {liste.length > TROIS && <button type="button" className="sfp-lien" aria-expanded={toutVoir} onClick={() => setToutVoir(v => !v)}>
          {toutVoir ? 'Réduire' : `Tout voir · ${liste.length} mouvements${depuis ? ` depuis ${depuis}` : ''}`}{Chevron}</button>}
      </>}
  </section>;
};
