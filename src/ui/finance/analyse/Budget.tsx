import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { BudgetAnalyse, RegleBudget } from '../../../domain/finance/analyse';
import { chf, categorieDeSource, moisCourt, nomSource, pluriel } from './format';
import { Pourquoi, type TextePourquoi } from './Pourquoi';
import type { VueProps } from './Caisse';

const Barre = ({ reel, prevu, an, ventes }: { reel: number; prevu: number | null; an: number | null; ventes: boolean }) => {
  const max = Math.max(1, reel, prevu ?? 0, an ?? 0) * 1.04;
  const p = (v: number) => `${(v / max * 100).toFixed(2)}%`;
  const fin = prevu !== null ? Math.min(reel, prevu) : reel;
  return <span className="ana-piste ana-regle-piste" aria-hidden="true">
    <span className="ana-regle-fond"/>
    <span className="ana-regle-reel" style={{ width: p(fin) }}/>
    {prevu !== null && reel > prevu && <span className={ventes ? 'ana-regle-plus' : 'ana-depasse'} style={{ left: p(prevu), width: p(reel - prevu) }}/>}
    {prevu !== null && <span className="ana-regle-prevu" style={{ left: p(prevu) }}/>}
    {an !== null && <span className="ana-encoche" style={{ left: p(an) }}/>}
  </span>;
};

function Regle({ r, onOuvrir }: { r: RegleBudget; onOuvrir: () => void }) {
  const ventes = r.source === 'ventes';
  const ecart = r.ecartCents;
  const dit = r.prevuCents === null ? 'rien de prévu'
    : ventes ? (ecart! >= 0 ? `+${chf(ecart!)} sur le prévu` : `${chf(-ecart!)} sous le prévu`)
    : r.depasse ? `dépassé de ${chf(ecart!)}` : `reste ${chf(-ecart!)}`;
  return <button type="button" className={`ana-regle ana-s-${r.source}`} aria-label={`${nomSource(r.source)} ${chf(r.reelCents)} CHF, ${dit}, voir ces opérations`} onClick={onOuvrir}>
    <span className="ana-regle-t"><span className={`ana-pt ana-s-${r.source}`}/><b>{nomSource(r.source)}</b><span className="ana-sp"/><span className="ana-m ana-regle-v">{chf(r.reelCents)}</span><span className={r.depasse ? 'ana-mal' : 'ana-t2'}> · {dit}</span></span>
    <Barre reel={r.reelCents} prevu={r.prevuCents} an={r.anCents} ventes={ventes}/>
  </button>;
}

export interface BudgetVueProps extends VueProps { b: BudgetAnalyse; pourquoi: TextePourquoi | null; onOuvrirBrassin?: (id: string) => void }

/** Figure 3 : une règle par source, réel contre prévu, dépassement hachuré, encoche de l'an dernier ; les brassins prévu → réel. */
export function BudgetVue({ b, duree, pourquoi, onJournal, onPrevisions }: BudgetVueProps) {
  const rien = b.regles.length === 0;
  return <>
    {rien ? <p className="ana-vide">Aucune pièce sur cette période.</p> : <p className="ana-gros">
      <b className="ana-m">{chf(b.depenseCents)}</b> <span className="ana-t2">CHF dépensé sur {duree}</span>
      {b.prevuDepenseCents !== null
        ? <span className="ana-t2"> sur <b className="ana-m">{chf(b.prevuDepenseCents)}</b> prévus{b.moisComptes > 0 && (b.moisAuDela > 0 ? <> · {b.moisAuDela} mois sur {b.moisComptes} au-delà</> : <> · dans le prévu</>)}</span>
        : <span className="ana-t2"> · rien de prévu</span>}
    </p>}
    {b.prevuDepenseCents !== null && b.depenseComparableCents !== b.depenseCents && <p className="ana-note">Le prévu ne couvre que {pluriel(b.regles.filter(r => r.prevuCents !== null && r.source !== 'ventes').length, 'source', 'sources')} : {chf(b.depenseComparableCents)} dépensé contre {chf(b.prevuDepenseCents)} prévus.</p>}
    {!rien && <div className="ana-regles">{b.regles.map(r => <Regle key={r.source} r={r} onOuvrir={() => onJournal({ scope: 'all', allDates: true, category: categorieDeSource(r.source) })}/>)}</div>}
    {b.brassins.length > 0 && <>
      <h3 className="ana-h3">Brassins, prévu → réel</h3>
      <div className="ana-regles">{b.brassins.map(x => <div key={x.batchId} className="ana-regle ana-s-brassage">
        <span className="ana-regle-t"><span className="ana-pt ana-s-brassage"/><b>{x.nom}, {moisCourt(x.mois)}</b><span className="ana-sp"/>
          {x.reelCents !== null ? <span className="ana-m ana-regle-v">{chf(x.reelCents)}</span> : <span className="ana-t2">pas de pièce rattachée</span>}
          {x.ecartCents !== null && <span className={x.depasse ? 'ana-mal' : 'ana-t2'}> · {x.depasse ? `dépassé de ${chf(x.ecartCents)}` : `reste ${chf(-x.ecartCents)}`}</span>}
          {x.prevuCents === null && <span className="ana-t2"> · rien de prévu</span>}</span>
        {x.reelCents !== null && <Barre reel={x.reelCents} prevu={x.prevuCents} an={null} ventes={false}/>}
      </div>)}</div>
    </>}
    <div className="ana-leg" aria-label="Légende">
      {b.prevuDepenseCents !== null && <span><i className="ana-i-tic"/>prévu</span>}
      {b.regles.some(r => r.anCents !== null) && <span><i className="ana-i-encoche"/>même période l’an dernier</span>}
      {b.regles.some(r => r.depasse) && <span><i className="ana-i-depasse"/>dépassé</span>}
      {b.regles.some(r => r.source === 'ventes' && r.prevuCents !== null && r.reelCents > r.prevuCents) && <span><i className="ana-i-vente"/>ventes au-delà du prévu</span>}
    </div>
    {!b.aPrevu && <button type="button" className="ana-tache ana-tache-pointille" onClick={onPrevisions}><span>Budget : rien de prévu. Poser un prévu dans Prévisions</span><ChevronRight size={14} aria-hidden="true"/></button>}
    <div className="ana-pied"><Pourquoi texte={pourquoi}/><button type="button" className="ana-ops" onClick={() => onJournal({ scope: 'all', allDates: true })}><b className="ana-m">{b.nombrePieces}</b> {b.nombrePieces > 1 ? 'opérations' : 'opération'} <ChevronRight size={14} aria-hidden="true"/></button></div>
  </>;
}
