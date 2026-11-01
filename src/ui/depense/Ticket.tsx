// Le ticket de r2b : une ligne par ligne du papier, dans l'ordre, avec son montant. Chaque ligne du brouillon (mouture comprise) est un
// `article[data-purchase-line]` à UN seul `summary` direct ; le plateau (champs de l'ancien écran, mêmes libellés) s'ouvre au toucher.
import React from 'react';
import { PictoLien, type LienStock } from './Pictos';

const money = (n: number | undefined) => n === undefined ? '—' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');

export interface MoutureProps { liee: boolean; parent: string; onBascule: () => void; onTableau?: () => void; tous?: { n: number; onTous: () => void } }
export interface LigneProps {
  id: string; index: number; description: string; amount?: number; lien: LienStock; pastille: string | null; conversion?: string;
  quantite: string; alpha?: string; sr: string; prixKg?: string; douteux: boolean; ouverte: boolean; mouture?: MoutureProps; correction?: React.ReactNode; children: React.ReactNode;
}

export function LigneTicket(p: LigneProps) {
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
  const mout = p.mouture;
  return <article data-purchase-line data-dp-ligne={p.id} className={`border-t border-cave-800 ${p.douteux ? 'bg-attention/5' : ''}`}>
    <details open={p.ouverte} className="group">
      <summary className={`list-none cursor-pointer grid grid-cols-[24px_1fr_auto] items-center gap-x-2 px-1.5 ${mout ? 'min-h-8 ml-4 border-l-2 border-dashed border-attention/70' : 'min-h-[50px] py-1'}`}>
        <i aria-hidden className="dp-no-chevron hidden"/>{mout ? <PictoLien lien="mouture" size={18}/> : <PictoLien lien={p.lien}/>}
        {mout ? <span className="min-w-0 flex items-center gap-1.5 text-xs text-cave-200">
          <button type="button" data-dp-mouture={p.id} aria-label={`${mout.liee ? 'Détacher la mouture de' : 'Rattacher la mouture à'} ${mout.parent}`} onClick={e => { stop(e); mout.onBascule(); }} className={`min-h-6 rounded-control border px-2 text-xs ${mout.liee ? 'border-cave-600 text-cave-300' : 'border-dashed border-attention font-semibold text-attention'}`}>{mout.liee ? `✓ mouture → ${mout.parent}` : 'mouture'}</button>
          {mout.tous ? <button type="button" data-dp-mouture-tous onClick={e => { stop(e); mout.tous!.onTous(); }} className="min-h-6 rounded-control border border-ebc-straw bg-ebc-straw px-2 text-xs font-semibold text-cave-950">Rattacher les {mout.tous.n}</button> : null}
          {mout.onTableau ? <button type="button" aria-label="Tableau des moutures" onClick={e => { stop(e); mout.onTableau!(); }} className="min-h-6 min-w-6 rounded-control border border-cave-600 text-xs text-cave-100">⌄</button> : null}<span className="sr-only">{p.description}</span></span>
        : <span className="min-w-0 flex flex-col gap-px">
          <span className="flex min-w-0 items-center gap-1.5"><b className="truncate text-base font-semibold text-cave-50">{p.description || 'Ligne sans libellé'}</b>
            {p.pastille ? <span data-dp-pastille className="shrink-0 rounded-control bg-cave-800 px-1.5 text-xs text-cave-100">{p.pastille}</span> : null}</span>
          <span className="truncate text-xs text-cave-400"><span className="font-mono text-cave-200">{p.quantite}</span>{p.alpha ? <> · α <span className="font-mono text-cave-200">{p.alpha}</span></> : null}{p.conversion ? <span className="ml-1.5 rounded-control bg-cave-800 px-1 text-cave-200">{/[=→]/.test(p.conversion) ? p.conversion : `= ${p.conversion}`}</span> : null}<span className="sr-only"> {p.sr}</span></span>
        </span>}
        <span className="text-right font-mono text-sm text-cave-50">{money(p.amount)}{p.prixKg ? <small className="block text-xs text-hop">✓ {p.prixKg}</small> : null}</span>
      </summary>
      <div className="space-y-2 pb-2 pl-8 pr-1">{p.children}</div>
    </details>
    {p.correction ? <div className="flex flex-wrap items-center gap-1.5 pb-1.5 pl-9 pr-1">{p.correction}</div> : null}
  </article>;
}

/** « Mettre en stock : oui / non » (critique n° 4) : un interrupteur dont l'état se voit. */
export function Interrupteur({ actif, onChange, label }: { actif: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={actif} aria-label={label} onClick={() => onChange(!actif)} className="min-h-7 inline-flex items-center gap-2 text-sm text-cave-100">
    <span className={`inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors ${actif ? 'border-hop bg-hop/30 justify-end' : 'border-cave-600 bg-cave-800 justify-start'}`}><span className={`size-4 rounded-full ${actif ? 'bg-hop' : 'bg-cave-400'}`}/></span>
    <span>Mettre en stock : <b className="font-semibold">{actif ? 'oui' : 'non'}</b></span></button>;
}
