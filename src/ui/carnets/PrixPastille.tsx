/**
 * La pastille de prix de la liste des articles (maquette B1, D419) et le détail du prix rendu en euros (D421 : aucun chiffre inventé).
 * Connu : « 3 350 / CHF ✎ » (saisi) ou « CHF 🔗 » (lu), « dès » au-dessus d'un plancher. Inconnu : pointillée « CHF ? / saisir ».
 * En euros : l'euro se dit en euros tant que le taux manque (« 2 513 € / taux ? ») ; le taux posé, la pastille dit « ≈ … CHF rendu » et,
 * au toucher, la décomposition : article, port, TVA d'import 8,1 %, frais. Port et frais inconnus s'écrivent « ? » (jamais 60) et le rendu
 * devient un plancher (« dès »).
 */
import React, { useState } from 'react';
import { ChevronUp, Link2, Pencil } from 'lucide-react';
import { prixRendu, tauxLu, TVA_IMPORT, type PrixRendu } from '../../domain/carnets/prixRendu';
import { montant, type ArticleV } from './EtatIA';

const nb = (centimes?: number) => montant(centimes === undefined ? undefined : Math.round(centimes / 100) * 100) ?? '?';
const pourcent = (x: number) => String(Math.round(x * 1000) / 10).replace('.', ',');

export interface PrixPastilleProps { article: ArticleV; taux?: number; onTaux?: (t: number) => void; ouvert?: boolean; onBascule?: () => void; onOuvrir?: () => void }

export function rendu(a: ArticleV, taux?: number): PrixRendu | null {
  return a.devise === 'EUR' && a.prixCentimes !== undefined ? prixRendu({ eurCentimes: a.prixCentimes, taux }) : null;
}

export function PrixPastille(p: PrixPastilleProps) {
  const a = p.article;
  const eur = a.devise === 'EUR' && a.prixCentimes !== undefined;
  const r = rendu(a, p.taux);
  if (a.prixCentimes === undefined) {
    return <button type="button" className="cn-pastille-prix cn-pastille-pd" onClick={p.onOuvrir} aria-label="Prix inconnu : à saisir"><b>CHF ?</b><small><Pencil size={12} aria-hidden /> saisir</small></button>;
  }
  if (eur && r) {
    const connu = r.totalChf !== undefined;
    return (
      <button type="button" className={`cn-pastille-prix cn-pastille-est${connu ? '' : ' cn-pastille-pd'}`} data-eur aria-expanded={!!p.ouvert} onClick={p.onBascule}
        aria-label={connu ? `Prix rendu estimé, détail` : `Prix en euros, taux à poser`}>
        {connu
          ? <><small>{r.manque.length ? 'dès' : 'estimé'}</small><span className="cn-mono">≈{nb(r.totalChf)}</span><small>CHF rendu <ChevronUp size={12} aria-hidden /></small></>
          : <><span className="cn-mono">{nb(a.prixCentimes)} €</span><small>taux ?</small></>}
      </button>
    );
  }
  return (
    <span className="cn-pastille-prix">
      {a.prixDes ? <small>dès</small> : null}
      <span className="cn-mono">{montant(a.prixCentimes)}</span>
      <small>{a.devise ?? 'CHF'} {a.origine === 'vous' ? <Pencil size={12} aria-label="saisi" /> : <Link2 size={12} aria-label="lu" />}</small>
    </span>
  );
}

/** Le détail sous la ligne : la décomposition en CHF, ou le champ où poser le taux une fois (gardé ensuite). */
export function PrixRenduDetail({ article: a, taux, onTaux }: { article: ArticleV; taux?: number; onTaux?: (t: number) => void }) {
  const [saisie, setSaisie] = useState('');
  const [change, setChange] = useState(false);
  const r = rendu(a, taux);
  if (!r || a.prixCentimes === undefined) return null;
  const poser = () => { const t = tauxLu(saisie); if (t !== null) { onTaux?.(t); setChange(false); setSaisie(''); } };
  const formulaire = (
    <form className="cn-rendu-taux" onSubmit={e => { e.preventDefault(); poser(); }}>
      <label>1 € = <input inputMode="decimal" aria-label="Taux EUR vers CHF" placeholder="0,94" value={saisie} onChange={e => setSaisie(e.target.value)} /> CHF</label>
      <button type="submit" className="cn-second" disabled={tauxLu(saisie) === null}>Poser le taux</button>
    </form>
  );
  if (r.totalChf === undefined) {
    return <div className="cn-rendu" role="group" aria-label="Taux de change à poser"><p className="cn-mut">Pas de facture en euros dans Finances : posez le taux une fois, il est gardé.</p>{formulaire}</div>;
  }
  return (
    <div className="cn-rendu" role="group" aria-label="Prix rendu, détail">
      <span className="cn-rendu-ligne">
        <span className="cn-mono">{nb(r.baseChf)}</span>+<span>port <span className="cn-mono">{r.portChf === undefined ? '?' : nb(r.portChf)}</span></span>
        +<span>TVA <span className="cn-mono">{nb(r.tvaChf)}</span></span>+<span>frais <span className="cn-mono">{r.fraisChf === undefined ? '?' : nb(r.fraisChf)}</span></span>
        =<span className="cn-rendu-total cn-mono">{r.manque.length ? 'dès ' : ''}≈{nb(r.totalChf)}</span>
      </span>
      <small className="cn-mut">en CHF · estimé · de {nb(a.prixCentimes)} € à {String(taux).replace('.', ',')} · TVA d'import {pourcent(TVA_IMPORT)} % · port et frais : « ? » tant qu'inconnus</small>
      {change ? formulaire : <button type="button" className="cn-lien" onClick={() => setChange(true)}>Changer le taux</button>}
    </div>
  );
}
