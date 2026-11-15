import React from 'react';
import type { BandeBudget } from './piles';
import './budget.css';

const H_PILE = 80;
/** Déjà payé en or (la catégorie malt), part de l'année en violet : les couleurs de la maquette m4bb-a. « À payer » est la hachure `ops-hach` (hachure = à payer). */
const COULEUR: Record<string, string> = { stock: 'rgb(var(--c-d2b356))', an: 'rgb(var(--c-9856d2))' };

/**
 * m4bb-a, la bande « Quand tu paies » : trois piles (déjà payé, à payer, part de l'année) = la boîte du litre.
 * Les hauteurs sont une règle de trois sur la plus grande pile ; une pile sans montant (inconnue) n'a pas de hauteur, seulement un « ? » en pointillé.
 * La boîte du litre est le seul toucher vers le flux c3a (« Détail du litre »).
 */
export function BudgetBande({ bande, assujetti, onLitre, onManque, onVolumes }: { bande: BandeBudget; assujetti?: boolean; onLitre: () => void; /** CP-18 : une pile inconnue renvoie au premier manque. */ onManque?: () => void; /** CP-18 : « ÷ ? L » renvoie aux volumes. */ onVolumes?: () => void }) {
  const { piles, litre } = bande;
  const haut = litre.etat === 'complet' ? 'estimé' : litre.etat === 'minimum' ? 'au moins' : 'litres nets ?';
  return <section className="bbx-band" aria-label="Quand tu paies" data-booster="piles-quand-tu-paies">
    <div className="bbx-t"><span>Quand tu paies</span><span>ton litre ›</span></div>
    <div className="bbx-piles">
      {piles.map(p => <div key={p.id} className="bbx-p" data-pile={p.id} data-incomplete={p.incomplete ? 'true' : undefined}>
        {p.texte === '?' && onManque
          ? <button type="button" className="bbx-renvoi" onClick={onManque}><b className="ops-m" aria-label={`${p.nom} : inconnu`}>{p.texte}</b></button>
          : <b className="ops-m" aria-label={p.texte === '?' ? `${p.nom} : inconnu` : p.incomplete ? `${p.nom} : au moins ${p.texte} CHF` : `${p.nom} : ${p.texte} CHF`}>{p.texte}</b>}
        {p.cents > 0
          ? <span className={`bbx-st${p.id === 'now' ? ' ops-hach' : ''}`} style={{ height: Math.max(Math.round(p.ratio * H_PILE), 4), ...(p.id === 'now' ? {} : { background: COULEUR[p.id] }) }} />
          : <span className="bbx-st bbx-vide" style={{ height: 14 }} />}
      </div>)}
      <span className="bbx-eq" aria-hidden="true">=</span>
      <button type="button" className="bbx-lit" aria-label="Détail du litre" data-etat={litre.etat} onClick={onLitre}>
        <span>{haut}</span><b className="ops-m">{litre.texte}</b><span>CHF / L</span>
      </button>
    </div>
    <div className="bbx-base">
      {piles.map(p => <span key={p.id}>{p.nom}{p.id === 'now' && assujetti ? ' (HT)' : ''}{p.id === 'stock' && <><br />stock</>}</span>)}
      <span aria-hidden="true" />
      <span>{litre.division ? (() => { const [total, l] = litre.division.split(' ÷ '); return <><b className="ops-m">{total}</b> ÷ <b className="ops-m">{l}</b></>; })() : onVolumes ? <button type="button" className="bbx-renvoi" onClick={onVolumes}>÷ <b className="ops-m">? L</b></button> : <>÷ <b className="ops-m">? L</b></>}</span>
    </div>
  </section>;
}
