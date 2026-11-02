// La rangée de p3c-3 : une ligne du papier en 28 px (picto · nom · α · état ou mouture · « qté × prix » en colonne fixe · montant), son plateau (les champs
// de l'écran) au toucher. `article[data-purchase-line][data-dp-ligne=<id>]` > `details` > un seul `summary` direct. Présentation seulement : tout arrive calculé.
// D275 : le nom est la base de la désignation ; l'état du malt est une pastille (« ↳ 0,20 », trait plein), jamais un produit. D277 : chaque valeur porte son
// niveau (`data-dp-niveau` : `repris` jaune, `inconnu` rouge ; rien quand c'est sûr) ; la barre sous la rangée n'existe que pour un geste à faire.
import React from 'react';
import { PictoLien, type LienStock } from './Pictos';
import { FILET_FAMILLE, type GroupeCle } from './groupes';
import { pastilleConversion } from './etat';
import type { Niveau } from './confiance';
import type { PastilleEtat } from './rangees';
import './p3c.css';

export interface PastilleMouture { id: string; montant: string; liee: boolean; parent: string; aria: string; onBascule: () => void }
export interface BoutonMouture { liee: boolean; parent: string; onBascule: () => void; attr: boolean }
export interface NiveauxAffiches { qte: Niveau; prix: Niveau; montant: Niveau; nom: Niveau; raisons: string[] }
export interface LigneP3cProps {
  id: string; rang: number; numeroPapier?: number; nom: string; lien: LienStock; groupe: GroupeCle; alpha?: string; ebc?: string; conversion?: string;
  qte: { texte: string }; prix: string; montant: string; prixKg?: { texte: string; aria: string }; niveaux: NiveauxAffiches;
  pastilleMouture?: PastilleMouture; etat?: PastilleEtat; boutonMouture?: BoutonMouture; douteux: boolean; garde: boolean; masquee: boolean; ouverte: boolean;
  fix?: React.ReactNode; fixNiveau?: Niveau;
  /** D277 : le lien proposé par la lecture, jaune tant qu’il n’est pas confirmé. */
  lienNiveau?: Niveau; plateau: React.ReactNode; moutureArticles?: React.ReactNode;
  onToggle: (id: string, ouvert: boolean) => void;
}

const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
/** La barre de couleur de la bande, à gauche de chaque rangée (jetons de l'app). */
const BARRE: Record<GroupeCle, string> = FILET_FAMILLE;
/** Un niveau à l'écran : jaune (`attention`) pour « repris », il contrôle ; rouge (`alert`, la seule couleur d'alerte) pour « inconnu », il remplit. */
const MARQUE: Record<Niveau, string> = { sur: '', repris: 'text-attention underline decoration-dotted decoration-attention underline-offset-2', inconnu: 'rounded-control border border-dashed border-alert px-0.5 text-alert' };
const niveau = (n: Niveau) => (n === 'sur' ? {} : { 'data-dp-niveau': n });

export function LigneP3c(p: LigneP3cProps) {
  const mout = p.boutonMouture, n = p.niveaux;
  const titre = n.raisons.length ? n.raisons.join(' · ') : undefined;
  return <article data-purchase-line data-dp-ligne={p.id} data-dp-groupe={p.groupe} hidden={p.masquee}
    className={`dp-p3c-li scroll-mt-9 border-b border-cave-800 ${p.boutonMouture ? "" : BARRE[p.groupe]} ${p.douteux ? (p.fixNiveau === 'inconnu' ? 'bg-alert/5' : 'bg-attention/5') : ''} ${p.garde ? 'dp-p3c-garde' : ''}`}>
    <details data-dp-plateau open={p.ouverte} onToggle={e => p.onToggle(p.id, (e.currentTarget as HTMLDetailsElement).open)}>
      <summary title={titre} className="dp-p3c-r relative list-none cursor-pointer flex items-center gap-1.5 px-2.5 min-h-7">
        {p.numeroPapier !== undefined ? <span data-dp-numero className="w-[18px] text-right font-mono text-xs text-cave-400">{p.numeroPapier}</span> : null}
        <i aria-hidden className="dp-no-chevron hidden"/><span data-dp-lien {...(p.lienNiveau && p.lienNiveau !== 'sur' ? { 'data-dp-niveau': p.lienNiveau, title: 'lien proposé par la lecture : à confirmer' } : {})} className="inline-flex shrink-0"><PictoLien lien={p.lien} size={18} propose={p.lienNiveau === 'repris'}/></span>
        <span className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 py-0.5">
          {/* Le nom et sa pastille d'équivalence forment un seul bloc : le nom se coupe entre deux mots (deux lignes au plus), la pastille « = 2 sachets » reste à sa droite. */}
          {mout ? null : <span className="flex min-w-0 items-center gap-x-1.5">
            <b data-dp-nom {...niveau(n.nom)} className={`dp-p3c-nom min-w-0 text-sm font-normal leading-tight ${n.nom === 'sur' ? 'text-cave-50' : n.nom === 'inconnu' ? 'text-alert underline decoration-dashed decoration-alert underline-offset-2' : MARQUE[n.nom]}`}>{p.nom || 'Ligne sans libellé'}</b>
            {p.conversion ? <span data-dp-conversion className="shrink-0 whitespace-nowrap rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-cave-200">{pastilleConversion(p.conversion)}</span> : null}</span>}
          {mout ? <span data-dp-nom className="sr-only">{p.nom}</span> : null}
          {mout ? <button type="button" data-dp-mouture={mout.attr ? p.id : undefined} data-dp-mouture-plateau={mout.attr ? undefined : p.id} aria-label={`${mout.liee ? 'Détacher la mouture de' : 'Rattacher la mouture à'} ${mout.parent}`}
            onClick={e => { stop(e); mout.onBascule(); }} className={`min-h-6 rounded-control border px-1.5 text-xs ${mout.liee ? 'border-cave-600 text-cave-200' : 'border-dashed border-attention font-semibold text-attention'}`}>{mout.liee ? `✓ ${mout.parent}` : 'mouture'}</button> : null}
          {p.prixKg ? <span data-dp-prixkg aria-label={p.prixKg.aria} className="rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-hop">{p.prixKg.texte}</span> : null}
          {p.alpha ? <span data-dp-alpha className="font-mono text-xs text-cave-400">α {p.alpha}</span> : null}
          {p.ebc ? <span data-dp-ebc className="font-mono text-xs text-cave-400">{p.ebc} EBC</span> : null}
          {mout && p.conversion ? <span data-dp-conversion className="whitespace-nowrap rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-cave-200">{pastilleConversion(p.conversion)}</span> : null}
        </span>
        {p.pastilleMouture ? <button type="button" data-dp-mouture={p.pastilleMouture.id} aria-label={p.pastilleMouture.aria} onClick={e => { stop(e); p.pastilleMouture!.onBascule(); }}
          className={`inline-flex h-6 shrink-0 items-center justify-center gap-0.5 rounded-control bg-cave-950 px-1 font-mono text-xs tabular-nums text-cave-50 ${p.pastilleMouture.liee ? 'border border-cave-600 text-cave-200' : 'border-[1.5px] border-dashed border-attention'}`}>
          {p.pastilleMouture.liee ? '✓ ' : <PictoLien lien="mouture" size={14}/>}{p.pastilleMouture.montant}</button>
          : p.etat ? <span role="img" data-dp-etat={p.etat.cle} aria-label={p.etat.aria} title={p.etat.aria}
            className="inline-flex h-6 shrink-0 items-center gap-0.5 rounded-control border border-cave-600 bg-cave-950 px-1 font-mono text-xs tabular-nums text-cave-200">
            {p.etat.cle === 'concasse' ? <><PictoLien lien="mouture" size={12}/>{p.etat.texte.replace(/^↳\s*/, '')}</> : p.etat.texte}</span> : null}
        <span className="dp-p3c-dq" aria-label={p.qte.texte ? `${p.qte.texte} × ${p.prix}` : p.prix}>
          <span data-dp-qte {...niveau(n.qte)} className={`font-semibold ${MARQUE[n.qte]}`}>{p.qte.texte}</span><i>{p.qte.texte || p.prix !== '—' ? '×' : ''}</i><span data-dp-prix {...niveau(n.prix)} className={MARQUE[n.prix]}>{p.qte.texte || p.prix !== '—' ? p.prix : ''}</span>
        </span>
        <span data-dp-montant {...niveau(n.montant)} className={`w-[54px] shrink-0 text-right font-mono text-sm text-cave-50 ${MARQUE[n.montant]}`}>{p.montant}</span>
      </summary>
      <div data-dp-corps className="space-y-2 border-t border-cave-800 bg-cave-900/60 py-2 pl-8 pr-2.5">{p.plateau}{p.moutureArticles}</div>
    </details>
    {p.fix ? <div data-dp-barre {...niveau(p.fixNiveau ?? 'repris')} className="dp-p3c-fix flex flex-wrap items-center gap-1.5 pb-1 pl-9 pr-2.5">{p.fix}</div> : null}
  </article>;
}
