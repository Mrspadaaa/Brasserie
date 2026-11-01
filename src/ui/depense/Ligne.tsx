// La rangée de p3c-3 : une ligne du papier en 28 px (picto · nom · α · conversion · « qté × prix » en colonne fixe · montant), son plateau (les champs
// de l'écran) au toucher. `article[data-purchase-line][data-dp-ligne=<id>]` > `details` > un seul `summary` direct. Présentation seulement : tout arrive calculé.
import React from 'react';
import { PictoLien, type LienStock } from './Pictos';
import type { GroupeCle } from './groupes';
import { pastilleConversion } from './etat';
import './p3c.css';

export interface PastilleMouture { id: string; montant: string; liee: boolean; parent: string; aria: string; onBascule: () => void }
export interface BoutonMouture { liee: boolean; parent: string; onBascule: () => void; attr: boolean }
export interface LigneP3cProps {
  id: string; rang: number; numeroPapier?: number; nom: string; lien: LienStock; groupe: GroupeCle; alpha?: string; ebc?: string; conversion?: string; unitePrecis: boolean;
  qte: { texte: string; inconnue: boolean }; prix: string; montant: string; prixKg?: { texte: string; aria: string };
  pastilleMouture?: PastilleMouture; boutonMouture?: BoutonMouture; douteux: boolean; garde: boolean; masquee: boolean; ouverte: boolean;
  fix?: React.ReactNode; plateau: React.ReactNode; moutureArticles?: React.ReactNode;
  onToggle: (id: string, ouvert: boolean) => void;
}

const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
/** La barre de couleur de la bande, à gauche de chaque rangée (jetons de l'app). */
const BARRE: Record<GroupeCle, string> = { malt: 'border-l-4 border-l-ebc-gold', houblon: 'border-l-4 border-l-hop', levure: 'border-l-4 border-l-area-finances', autres: 'border-l-4 border-l-cave-400' };

export function LigneP3c(p: LigneP3cProps) {
  const mout = p.boutonMouture;
  return <article data-purchase-line data-dp-ligne={p.id} data-dp-groupe={p.groupe} hidden={p.masquee}
    className={`dp-p3c-li scroll-mt-9 border-b border-cave-800 ${p.boutonMouture ? "" : BARRE[p.groupe]} ${p.douteux ? 'bg-attention/5' : ''} ${p.garde ? 'dp-p3c-garde' : ''}`}>
    <details data-dp-plateau open={p.ouverte} onToggle={e => p.onToggle(p.id, (e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="dp-p3c-r relative list-none cursor-pointer flex items-center gap-1.5 px-2.5 min-h-7">
        {p.numeroPapier !== undefined ? <span data-dp-numero className="w-[18px] text-right font-mono text-xs text-cave-400">{p.numeroPapier}</span> : null}
        <i aria-hidden className="dp-no-chevron hidden"/><PictoLien lien={p.lien} size={18}/>
        <span className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 py-0.5">
          {/* Le nom et sa pastille d'équivalence forment un seul bloc : le nom se coupe (il passe à la ligne), la pastille « = 2 sachets » reste à sa droite sur la même ligne. */}
          {mout ? null : <span className="flex min-w-0 items-center gap-x-1.5">
            <b data-dp-nom className="min-w-0 text-sm font-normal leading-tight text-cave-50 [overflow-wrap:normal]">{p.nom || 'Ligne sans libellé'}</b>
            {p.conversion ? <span data-dp-conversion className="shrink-0 whitespace-nowrap rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-cave-200">{pastilleConversion(p.conversion)}</span> : null}</span>}
          {mout ? <span data-dp-nom className="sr-only">{p.nom}</span> : null}
          {mout ? <button type="button" data-dp-mouture={mout.attr ? p.id : undefined} data-dp-mouture-plateau={mout.attr ? undefined : p.id} aria-label={`${mout.liee ? 'Détacher la mouture de' : 'Rattacher la mouture à'} ${mout.parent}`}
            onClick={e => { stop(e); mout.onBascule(); }} className={`min-h-6 rounded-control border px-1.5 text-xs ${mout.liee ? 'border-cave-600 text-cave-200' : 'border-dashed border-attention font-semibold text-attention'}`}>{mout.liee ? `✓ ${mout.parent}` : 'mouture'}</button> : null}
          {p.prixKg ? <span data-dp-prixkg aria-label={p.prixKg.aria} className="rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-hop">{p.prixKg.texte}</span> : null}
          {p.alpha ? <span data-dp-alpha className="font-mono text-xs text-cave-400">α {p.alpha}</span> : null}
          {p.ebc ? <span data-dp-ebc className="font-mono text-xs text-cave-400">{p.ebc} EBC</span> : null}
          {mout && p.conversion ? <span data-dp-conversion className="whitespace-nowrap rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-cave-200">{pastilleConversion(p.conversion)}</span> : null}
          {p.unitePrecis ? <span className="whitespace-nowrap rounded-control border border-dashed border-attention bg-cave-950 px-1.5 text-xs leading-[18px] text-attention">unité ?</span> : null}
        </span>
        {p.pastilleMouture ? <span aria-hidden className="w-[62px] shrink-0"/> : null}
        {p.pastilleMouture ? <button type="button" data-dp-mouture={p.pastilleMouture.id} aria-label={p.pastilleMouture.aria} onClick={e => { stop(e); p.pastilleMouture!.onBascule(); }}
          className={`absolute right-[170px] top-1/2 inline-flex h-6 w-[62px] -translate-y-1/2 items-center justify-center gap-0.5 rounded-control bg-cave-950 font-mono text-xs tabular-nums text-cave-50 ${p.pastilleMouture.liee ? 'w-[50px] border border-cave-600 text-cave-200' : 'border-[1.5px] border-dashed border-attention'}`}>
          {p.pastilleMouture.liee ? '✓ ' : <PictoLien lien="mouture" size={14}/>}{p.pastilleMouture.montant}</button> : null}
        <span className="dp-p3c-dq" aria-label={`${p.qte.texte} × ${p.prix}`}>
          <span data-dp-qte className={`font-semibold ${p.qte.inconnue ? 'text-attention' : ''}`}>{p.qte.texte}</span><i>×</i><span data-dp-prix>{p.prix}</span>
        </span>
        <span data-dp-montant className="w-[54px] shrink-0 text-right font-mono text-sm text-cave-50">{p.montant}</span>
      </summary>
      <div data-dp-corps className="space-y-2 border-t border-cave-800 bg-cave-900/60 py-2 pl-8 pr-2.5">{p.plateau}{p.moutureArticles}</div>
    </details>
    {p.fix ? <div className="dp-p3c-fix flex flex-wrap items-center gap-1.5 pb-1 pl-9 pr-2.5">{p.fix}</div> : null}
  </article>;
}
