// Le pied de 52 px de p3c-3 : la bascule Catégorie / Papier et le bouton principal (« Confirmer » jamais bloqué, sauf pendant la lecture).
// Il porte aussi ce que portait la bande collante : quand le bandeau est sorti de l'écran, le point courant et son « y aller », ou « ✓ points revus ».
import React, { useEffect, useState } from 'react';
import { Check, FileText, Loader2, RefreshCw, X } from 'lucide-react';

export interface BoutonPied { texte: string; aria: string; disabled: boolean; titre?: string; icone: 'check' | 'x' | 'file' | 'spin'; onClick: () => void }

export function Pied(p: {
  ordre: 'cat' | 'papier' | null; onOrdre: (o: 'cat' | 'papier') => void; statut: { texte: string; attention?: boolean } | null;
  courant: { numero: number; nom: string; niveau?: "repris" | "inconnu" } | null; tout: boolean; onAllerCourant: () => void; bouton: BoutonPied;
  cible: React.RefObject<HTMLElement | null>; racine: React.RefObject<HTMLElement | null>; keyboardInset: boolean; aPoints: boolean;
}) {
  const [recapSorti, setRecapSorti] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !p.cible.current) return;
    const obs = new IntersectionObserver(([e]) => setRecapSorti(!e.isIntersecting), { root: p.racine.current ?? null });
    obs.observe(p.cible.current);
    return () => obs.disconnect();
  }, [p.cible, p.racine, p.aPoints, p.ordre]);
  const icone = p.bouton.icone === 'spin' ? <Loader2 size={14} className="animate-spin"/> : p.bouton.icone === 'x' ? <X size={14}/> : p.bouton.icone === 'file' ? <FileText size={14}/> : <Check size={14}/>;
  const milieu = recapSorti && p.aPoints ? (p.tout
    ? <span data-dp="pied-revus" className="min-w-0 flex-1 truncate text-sm text-hop">✓ points revus</span>
    : p.courant ? <button type="button" data-dp="pied-courant" data-dp-niveau={p.courant.niveau ?? 'repris'} onClick={p.onAllerCourant} className={`inline-flex min-h-8 min-w-0 max-w-[60%] flex-none items-center gap-1 truncate rounded-control border border-dashed px-2 text-sm text-cave-50 ${p.courant.niveau === 'inconnu' ? 'border-alert bg-alert/5' : 'border-attention bg-attention/5'}`}><span className={`inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-dashed font-mono text-xs ${p.courant.niveau === 'inconnu' ? 'border-alert text-alert' : 'border-attention text-attention'}`}>{p.courant.numero}</span><span className="truncate">{p.courant.nom}</span></button> : null) : null;
  return <footer className={`flex h-[52px] shrink-0 items-center gap-2 border-t border-cave-800 bg-cave-950 px-2${p.keyboardInset ? '' : ' pb-safe'}`}>
    {p.statut ? <div className={`min-w-0 flex-1 text-xs ${p.statut.attention ? 'text-attention' : 'text-cave-200'}`}><span>{p.statut.texte}</span></div>
      : <>{p.ordre ? <div role="group" aria-label="Ordre des lignes" className="inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600">
        {(['cat', 'papier'] as const).map(o => <button key={o} type="button" data-ordre={o} aria-pressed={p.ordre === o} onClick={() => p.onOrdre(o)} className={`min-h-8 px-2.5 text-sm ${p.ordre === o ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}`}>{o === 'cat' ? 'Catégorie' : 'Papier'}</button>)}</div> : null}
        {milieu}<span className="min-w-0 flex-1"/></>}
    <button type="button" data-primary aria-label={p.bouton.aria} title={p.bouton.titre} disabled={p.bouton.disabled} onClick={p.bouton.onClick}
      className="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-ebc-straw bg-ebc-straw px-3.5 text-sm font-semibold text-cave-950 disabled:opacity-40">{icone} {p.bouton.texte}</button>
  </footer>;
}

/**
 * Lenteur D, son choix 2 D et son choix B de « Tout valider » (`choix-valider/b-arrivee`, `b-garder`, `tout`) : le bandeau au-dessus du pied, au pouce, pour les lignes que la 3.8 ne lit plus. UNE ligne : le nom, le montant et « pas retrouvée »
 * à gauche, « ✓ Garder » et « ✕ Retirer » à droite (`q2-d-arrivee`). PLUSIEURS : le bandeau défile (« pas retrouvée · 1/2 »), « ↻ Tout valider » à droite du nom, « Garder » et « Retirer » dessous ; un geste passe à la suivante.
 * « Tout valider » : toutes les lignes pas retrouvées partent d'un toucher ; chacune garde Garder / Retirer. Confirmer sans trancher : elles partent. Isolé dans ce composant : la forme se remplace sans toucher la logique.
 */
export function BandeauPerdues(p: { nom: string; montant: string; rang: number; total: number; onGarder: () => void; onRetirer: () => void; onToutValider: () => void }) {
  const ch = 'inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border border-cave-600 bg-cave-950 px-2.5 text-[13px] font-semibold text-cave-50';
  const garder = <button type="button" data-dp-perdue-geste="garder" onClick={p.onGarder} className={ch}><Check size={14} strokeWidth={2.4}/>Garder</button>;
  const retirer = <button type="button" data-dp-perdue-geste="retirer" onClick={p.onRetirer} className={ch}><X size={13} strokeWidth={2.4}/>Retirer</button>;
  const texte = <span className="flex min-w-0 flex-1 flex-col leading-[1.15]"><b className="flex min-w-0 items-baseline gap-1 text-sm font-semibold text-cave-50"><span data-dp-perdue-nom className="min-w-0 truncate">{p.nom}</span>{' '}<span data-dp-perdue-montant className="shrink-0 font-mono">{p.montant}</span></b>
    <small className="text-xs font-semibold text-attention">pas retrouvée{p.total > 1 ? <> · <span className="font-mono" data-dp-perdue-rang>{p.rang}/{p.total}</span></> : null}</small></span>;
  return <div data-dp="perdues-cadre" className="shrink-0 lg:grid lg:grid-cols-[420px_minmax(0,760px)] lg:justify-center lg:gap-x-4 lg:px-3">{/* À 1280 le bandeau suit la colonne de la liste (la droite), comme la liste ; à 390 il est pleine largeur. */}
  <div data-dp="perdues" role="group" aria-label="Lignes que la 3e lecture n’a pas retrouvées" className="mx-2 mb-1.5 min-w-0 space-y-1 rounded-panel border-[1.5px] border-dashed border-attention bg-attention/10 px-2.5 py-1.5 lg:col-start-2 lg:mx-0">
    {p.total > 1 ? <>
      <div className="flex min-h-7 items-center gap-1.5">{texte}<button type="button" data-dp-perdue-geste="tout" onClick={p.onToutValider} className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border-[1.5px] border-attention bg-cave-950 px-2.5 text-[13px] font-bold text-attention"><RefreshCw size={15} strokeWidth={2.2}/>Tout valider</button></div>
      <div className="flex items-center gap-1.5">{garder}{retirer}</div></>
      : <div className="flex min-h-7 items-center gap-1.5">{texte}{garder}{retirer}</div>}
  </div></div>;
}
