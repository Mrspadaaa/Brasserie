// La liste de p3c-3 : bandes teintées à en-tête collant (sous-total, quantités en gras alignées sur la colonne des lignes), ordre du papier, filtre, pied de liste.
// Présentation seulement : les `LigneP3c` arrivent construits par `ExpenseSheet` (qui tient le plateau et les gardes) ; les ids retrouvent leur ligne.
import React from 'react';
import type { Bande } from './groupes';
import { fr2, texteQte } from './groupes';
import { POINT_GROUPE } from './Recap';
import './p3c.css';

const FOND: Record<string, string> = { malt: 'bg-ebc-gold/20', houblon: 'bg-hop/20', levure: 'bg-area-finances/20', autres: 'bg-cave-800' };

export interface FiltreListe { mot: string; ids: readonly string[] }
export function Liste(p: {
  ordre: 'cat' | 'papier'; bandes: Bande[]; papier: { ids: string[]; cents: number; incomplet: boolean; /** Le port, hors de l'ordre du papier : « 80,46 + port 12,00 » (VERDICT-f3, détail 7). */ port?: number } | null; lignes: ReadonlyMap<string, React.ReactNode>;
  filtre: FiltreListe | null; visibles: ReadonlySet<string> | null; nAffichees: number; onSansFiltre: () => void; rattacherTous: { n: number; onTous: () => void } | null;
  pied: { ajouterOff: boolean; ajouterTitre?: string; regrouper: boolean; detail: { lignes: string; total: string; ecart: boolean } | null };
  onAjouter: () => void; onRegrouper: () => void; children?: React.ReactNode;
}) {
  const nMasquees = p.filtre ? Math.max(0, p.nAffichees - p.filtre.ids.length) : 0;
  const vide = p.nAffichees === 0;
  return <section aria-label="Lignes de la facture" className="pb-2">
    {p.filtre ? <div data-dp="filtre" className="dp-p3c-filtre flex h-9 items-center gap-1.5 bg-ebc-straw px-2 text-sm font-semibold text-cave-950">
      <span>{p.filtre.ids.length} {p.filtre.mot} · {nMasquees} masquée{nMasquees > 1 ? 's' : ''}</span>
      <button type="button" onClick={p.onSansFiltre} className="ml-auto min-h-7 rounded-control bg-cave-950 px-2.5 text-sm font-semibold text-cave-50">✕ Toutes les lignes</button></div> : null}
    <div data-dp="liste">
      {vide ? <div data-dp="aucune-ligne" className="m-2 flex min-h-20 items-center justify-center rounded-panel border border-dashed border-cave-600 text-sm text-cave-400">Aucune ligne</div> : null}
      {p.ordre === 'cat' ? p.bandes.map(b => <div key={b.cle} data-dp-bande={b.cle} hidden={p.visibles ? !b.ids.some(id => p.visibles!.has(id)) : false}>
        <div data-dp-bande-entete className={`dp-p3c-bande-entete flex items-center gap-1.5 px-2.5 text-sm dp-p3c-t-${b.cle}`}>
          <i aria-hidden className={`size-2.5 shrink-0 rounded-full ${POINT_GROUPE[b.cle]}`}/>
          <strong className="font-semibold text-cave-50">{b.nom}</strong>
          <span className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{b.ids.length}{b.moutureIds.length ? ` +${b.moutureIds.length} ↳` : ''}</span>
          {b.cle === 'malt' && p.rattacherTous ? <button type="button" data-dp-mouture-tous onClick={p.rattacherTous.onTous} className="min-h-6 whitespace-nowrap rounded-control border border-ebc-straw bg-ebc-straw px-1.5 text-xs font-semibold text-cave-950">Rattacher les {p.rattacherTous.n}</button> : null}
          {b.eqb ? <span className="ml-auto whitespace-nowrap rounded-control bg-cave-950 px-1.5 text-xs leading-[18px] text-cave-200">{b.eqb}</span> : null}
          <span data-dp-sous-qte className={`${b.eqb ? '' : 'ml-auto'} mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200`}>{b.qte.map((e, i) => <React.Fragment key={i}>{i ? ' + ' : ''}{e.inconnue
            ? <i data-dp-niveau="inconnu" className="rounded-control border border-dashed border-alert bg-cave-950 px-1 font-normal not-italic text-alert" title="Unité à remplir sur une ligne">{`${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?`}</i>
            : e.niveau === 'repris' ? <i data-dp-niveau="repris" className="not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2" title="Unité déduite sur une ligne : à contrôler">{texteQte([e])}</i>
            : texteQte([e])}</React.Fragment>)}</span>
          <span data-dp-sous-montant {...(b.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${b.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(b.cents)}{b.incomplet ? ' + ?' : null}</span>
        </div>
        <div>{b.ids.map(id => <React.Fragment key={id}>{p.lignes.get(id)}</React.Fragment>)}</div>
      </div>) : p.papier ? <div data-dp-bande="papier">
        <div data-dp-bande-entete className="dp-p3c-bande-entete flex items-center gap-1.5 dp-p3c-t-papier px-2.5 text-sm">
          <strong className="font-semibold text-cave-50">Ordre du papier</strong>
          <span className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{p.papier.ids.length}</span>
          <span data-dp-sous-montant {...(p.papier.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`ml-auto min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${p.papier.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(p.papier.cents)}{p.papier.incomplet ? ' + ?' : null}{p.papier.port ? <span data-dp-papier-port className="font-normal text-cave-400"> + port {fr2(p.papier.port)}</span> : null}</span>
        </div>
        <div>{p.papier.ids.map(id => <React.Fragment key={id}>{p.lignes.get(id)}</React.Fragment>)}</div>
      </div> : null}
    </div>
    {p.children}
    <div data-dp="fin" className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
      <button type="button" disabled={p.pied.ajouterOff} title={p.pied.ajouterTitre} onClick={p.onAjouter} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200 disabled:opacity-40">+ Ajouter une ligne</button>
      {p.pied.regrouper ? <button type="button" onClick={p.onRegrouper} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">Regrouper en une dépense</button> : null}
      {p.pied.detail ? <span className={`ml-auto text-xs ${p.pied.detail.ecart ? 'text-attention' : 'text-cave-400'}`}>Détail <b className="font-mono font-medium">{p.pied.detail.lignes} / {p.pied.detail.total}</b></span> : null}
    </div>
  </section>;
}
