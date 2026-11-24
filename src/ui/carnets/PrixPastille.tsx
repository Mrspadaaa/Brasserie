/**
 * La pastille de prix de la liste des articles (maquette B1, D419) et le détail du prix rendu en euros (D421 : aucun chiffre inventé).
 * Connu : « 3 350 / CHF ✎ » (saisi) ou « CHF 🔗 » (lu), « dès » au-dessus d'un plancher. Inconnu : pointillée « CHF ? / saisir ».
 * En euros : l'euro se dit en euros tant que le taux manque (« 2 513 € / taux ? ») ; le taux posé, la pastille dit « ≈ … CHF rendu » et,
 * au toucher, la décomposition : article, port, TVA d'import 8,1 %, frais. Port et frais inconnus s'écrivent « ? » (jamais 60) et le rendu
 * devient un plancher (« dès »).
 * D447 (23.11) : l'euro devient « toute devise hors franc ». Taux : la facture ou le taux posé pour l'euro, sinon le cours du jour lu avec la
 * page (BCE) ; la devise d'origine reste dite sur la pastille, « HT » quand la page le dit, le port vers la Suisse quand elle le publie, et
 * la mention « douane, port et envoi non comptés » au détail.
 */
import React, { useState } from 'react';
import { ChevronUp, Link2, Pencil } from 'lucide-react';
import { articleHonnete, quantiteArticle, texteParUnite } from '../../domain/carnets/prixUnitaire';
import { convertiChf, estEtranger, mentionFrais, portCentimes, renduArticle, tauxLu, tauxVersChf, TVA_IMPORT, type PrixRendu } from '../../domain/carnets/prixRendu';
import { dateCourte, mentionTaxe, montant, type ArticleV } from './EtatIA';

const nb = (centimes?: number) => montant(centimes === undefined ? undefined : Math.round(centimes / 100) * 100) ?? '?';
const pourcent = (x: number) => String(Math.round(x * 1000) / 10).replace('.', ',');

export interface PrixPastilleProps { article: ArticleV; taux?: number; onTaux?: (t: number) => void; ouvert?: boolean; onBascule?: () => void; onOuvrir?: () => void }

/** Le prix d'origine tel que la page le donne : « 1 450 USD », `€` pour l'euro ; avec « HT » quand la page le dit. */
export function prixOrigine(a: ArticleV): string {
  const d = (a.devise ?? 'CHF').toUpperCase();
  return `${montant(a.prixCentimes) ?? '?'} ${d === 'EUR' ? '€' : d}${mentionTaxe(a.taxe)}`;
}
/** Le port vers la Suisse, dit quand la page le publie : « port 4,90 CHF », « port offert » ; absent sinon (jamais inventé). */
export function portDit(a: ArticleV): string | null {
  if (a.livraison?.refusee) return 'livraison CH refusée';
  const c = portCentimes(a);
  if (c === undefined) return null;
  return c === 0 ? 'port offert' : `port ${montant(c)} ${(a.livraison?.devise ?? a.devise ?? 'CHF').toUpperCase()}`;
}

export function rendu(a: ArticleV, taux?: number): PrixRendu | null {
  return renduArticle(a, taux);
}

export function PrixPastille(p: PrixPastilleProps) {
  const a = articleHonnete(p.article);
  /* T28-6 : la quantité se dit à côté du prix (« 100 g », « 1 kg ») ; le prix par kilo est dans la ligne de détail */
  const quantite = quantiteArticle(a);
  const parUnite = a.prixCentimes === undefined ? null : texteParUnite(a, a.prixCentimes, a.devise ?? 'CHF');
  const eur = estEtranger(a);
  const r = rendu(a, p.taux);
  const port = portDit(a);
  if (a.prixCentimes === undefined) {
    return <button type="button" className="cn-pastille-prix cn-pastille-pd" onClick={p.onOuvrir} aria-label="Prix inconnu : à saisir"><b>CHF ?</b><small><Pencil size={12} aria-hidden /> saisir</small></button>;
  }
  if (eur && r) {
    const connu = r.totalChf !== undefined;
    return (
      <button type="button" className={`cn-pastille-prix cn-pastille-est${connu ? '' : ' cn-pastille-pd'}`} data-eur aria-expanded={!!p.ouvert} onClick={p.onBascule}
        aria-label={connu ? `Prix rendu estimé, ${prixOrigine(a)}, détail` : `Prix en ${a.devise}, ${a.devise === 'EUR' ? 'taux à poser' : 'cours du jour non lu'}`}>
        {connu
          ? <><small>{r.manque.length ? 'dès' : 'estimé'}</small><span className="cn-mono">≈{nb(r.totalChf)}</span><small>CHF rendu <ChevronUp size={12} aria-hidden /></small><small className="cn-mono cn-pastille-orig">{prixOrigine(a)}</small></>
          : <><span className="cn-mono">{prixOrigine(a)}</span><small>{a.devise === 'EUR' ? 'taux ?' : 'cours ?'}</small></>}
      </button>
    );
  }
  return (
    <span className="cn-pastille-prix">
      {a.prixDes ? <small>dès</small> : null}
      <span className="cn-mono">{montant(a.prixCentimes)}</span>
      <small>{a.devise ?? 'CHF'}{mentionTaxe(a.taxe)} {a.origine === 'vous' ? <Pencil size={12} aria-label="saisi" /> : <Link2 size={12} aria-label="lu" />}</small>
      {/* C52-2 : la quantité ne se glisse jamais entre le montant et sa devise (« 520 / 50 L / CHF ») : elle se dit avec le prix unitaire entier, « 50 L · 10,40 CHF/L » */}
      {quantite && parUnite && <small className="cn-pastille-qte" data-quantite>{quantite.texte} · {parUnite}</small>}
      {port ? <small className="cn-pastille-port">{port}</small> : null}
    </span>
  );
}

/** Le détail sous la ligne : la décomposition en CHF, ou le champ où poser le taux une fois (gardé ensuite). */
export function PrixRenduDetail({ article: a, taux, onTaux }: { article: ArticleV; taux?: number; onTaux?: (t: number) => void }) {
  const [saisie, setSaisie] = useState('');
  const [change, setChange] = useState(false);
  const port = portDit(a);
  const r = rendu(a, taux);
  const t = tauxVersChf(a, taux);
  const euro = a.devise === 'EUR';
  if (!r || a.prixCentimes === undefined) return null;
  const poser = () => { const t = tauxLu(saisie); if (t !== null) { onTaux?.(t); setChange(false); setSaisie(''); } };
  const formulaire = (
    <form className="cn-rendu-taux" onSubmit={e => { e.preventDefault(); poser(); }}>
      <label>1 € = <input inputMode="decimal" aria-label="Taux EUR vers CHF" placeholder="0,94" value={saisie} onChange={e => setSaisie(e.target.value)} /> CHF</label>
      <button type="submit" className="cn-second" disabled={tauxLu(saisie) === null}>Poser le taux</button>
    </form>
  );
  if (r.totalChf === undefined) {
    if (!euro) return null;
    return <div className="cn-rendu" role="group" aria-label="Taux de change à poser"><p className="cn-mut">Pas de facture en euros dans Finances : posez le taux une fois, il est gardé.</p>{formulaire}</div>;
  }
  return (
    <div className="cn-rendu" role="group" aria-label="Prix rendu, détail">
      <span className="cn-rendu-ligne">
        <span className="cn-mono">{nb(r.baseChf)}</span>+<span>port <span className="cn-mono">{r.portChf === undefined ? '?' : nb(r.portChf)}</span></span>
        +<span>TVA <span className="cn-mono">{nb(r.tvaChf)}</span></span>+<span>frais <span className="cn-mono">{r.fraisChf === undefined ? '?' : nb(r.fraisChf)}</span></span>
        =<span className="cn-rendu-total cn-mono">{r.manque.length ? 'dès ' : ''}≈{nb(r.totalChf)}</span>
      </span>
      <small className="cn-mut">en CHF · estimé · de {prixOrigine(a)} à {String(Math.round((t?.taux ?? 0) * 10000) / 10000).replace('.', ',')}{t?.source === 'BCE' ? ` (cours BCE${a.change?.date ? ` du ${dateCourte(a.change.date) ?? a.change.date}` : ''})` : ''} · TVA d'import {pourcent(TVA_IMPORT)} %{port ? ` · ${port}` : ''} · {mentionFrais(a)}</small>
      {!euro ? null : change ? formulaire : <button type="button" className="cn-lien" onClick={() => setChange(true)}>Changer le taux</button>}
    </div>
  );
}

/**
 * D447 : le prix d'un article en texte (cartes, fiche, choix). Hors franc et converti : « ≈ 1 360 CHF », l'original dit à côté
 * (`detailPrix`) ; sans cours : le prix tel que la page le donne, dans sa devise. En francs : « 690 CHF », « HT » dit quand la page le dit.
 */
export function prixTexteArticle(a: ArticleV, taux?: number): { montant: string; devise: string; approx: boolean } | null {
  if (a.prixCentimes === undefined) return null;
  const conv = convertiChf(a, taux);
  const m = conv !== undefined ? montant(Math.round(conv / 100) * 100) : montant(a.prixCentimes);
  return m ? { montant: m, devise: conv !== undefined ? 'CHF' : (a.devise ?? 'CHF'), approx: conv !== undefined } : null;
}
/**
 * C59-7 (R37) : UN prix par article, dit pareil dans Comparer, la feuille Articles, le tableau et la fiche. Hors franc, avec un cours : le rendu estimé (celui de la
 * pastille et de la cellule de Comparer, maquette B1), arrondi au franc ; sans cours : le prix dans sa devise ; en francs : le prix. `rendu` dit que le montant est le rendu.
 */
export function prixUnique(a: ArticleV, taux?: number): { montant: string; devise: string; approx: boolean; rendu: boolean } | null {
  const r = renduArticle(a, taux);
  if (r && r.totalChf !== undefined) return { montant: montant(Math.round(r.totalChf / 100) * 100) ?? '?', devise: 'CHF', approx: true, rendu: true };
  const t = prixTexteArticle(a, taux);
  return t ? { ...t, rendu: false } : null;
}
export function PrixTexte({ a, taux, muet }: { a: ArticleV; taux?: number; muet?: boolean }) {
  const t = prixTexteArticle(a, taux);
  if (!t) return null;
  return (
    <span className="cn-nowrap">
      <span className="cn-mono cn-prix">{t.approx ? '≈' : ''}{t.montant}</span> <span className={muet ? 'cn-mut' : undefined}>{t.devise}</span>
    </span>
  );
}
/**
 * La ligne qui accompagne le prix (D447) : l'original et sa devise quand il est converti, « HT », le port vers la Suisse quand la page le
 * donne, la mention des frais non comptés. Vide quand il n'y a rien à dire (jamais un « port ? » inventé en francs).
 */
export function detailPrix(a: ArticleV, taux?: number): string | null {
  if (a.prixCentimes === undefined) return null;
  const converti = convertiChf(a, taux) !== undefined;
  /* T28-6 : « 1 kg · 72,50 CHF/kg » : deux offres de quantités différentes se lisent à la même mesure */
  const q = quantiteArticle(a);
  const parUnite = q ? texteParUnite(a, converti ? convertiChf(a, taux) : a.prixCentimes, converti ? 'CHF' : (a.devise ?? 'CHF')) : null;
  const parts = [q ? q.texte : null, parUnite, converti ? prixOrigine(a) : mentionTaxe(a.taxe).trim() || null, portDit(a), converti || estEtranger(a) ? mentionFrais(a) : null];
  const t = parts.filter(Boolean).join(' · ');
  return t || null;
}
