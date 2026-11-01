// Le pied de 52 px de p3c-3 : la bascule Catégorie / Papier et le bouton principal (« Confirmer » jamais bloqué, sauf pendant la lecture).
// Il porte aussi ce que portait la bande collante : quand le bandeau est sorti de l'écran, le point courant et son « y aller », ou « ✓ points revus ».
import React, { useEffect, useState } from 'react';
import { Check, FileText, Loader2, X } from 'lucide-react';

export interface BoutonPied { texte: string; aria: string; disabled: boolean; titre?: string; icone: 'check' | 'x' | 'file' | 'spin'; onClick: () => void }

export function Pied(p: {
  ordre: 'cat' | 'papier' | null; onOrdre: (o: 'cat' | 'papier') => void; statut: { texte: string; attention?: boolean } | null;
  courant: { numero: number; nom: string } | null; tout: boolean; onAllerCourant: () => void; bouton: BoutonPied;
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
    : p.courant ? <button type="button" data-dp="pied-courant" onClick={p.onAllerCourant} className="inline-flex min-h-8 min-w-0 max-w-[60%] flex-none items-center gap-1 truncate rounded-control border border-dashed border-attention bg-attention/5 px-2 text-sm text-cave-50"><span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-dashed border-attention font-mono text-xs text-attention">{p.courant.numero}</span><span className="truncate">{p.courant.nom}</span></button> : null) : null;
  return <footer className={`flex h-[52px] shrink-0 items-center gap-2 border-t border-cave-800 bg-cave-950 px-2${p.keyboardInset ? '' : ' pb-safe'}`}>
    {p.statut ? <div className={`min-w-0 flex-1 text-xs ${p.statut.attention ? 'text-attention' : 'text-cave-200'}`}><span>{p.statut.texte}</span></div>
      : <>{p.ordre ? <div role="group" aria-label="Ordre des lignes" className="inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600">
        {(['cat', 'papier'] as const).map(o => <button key={o} type="button" data-ordre={o} aria-pressed={p.ordre === o} onClick={() => p.onOrdre(o)} className={`min-h-8 px-2.5 text-sm ${p.ordre === o ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}`}>{o === 'cat' ? 'Catégorie' : 'Papier'}</button>)}</div> : null}
        {milieu}<span className="min-w-0 flex-1"/></>}
    <button type="button" data-primary aria-label={p.bouton.aria} title={p.bouton.titre} disabled={p.bouton.disabled} onClick={p.bouton.onClick}
      className="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-ebc-straw bg-ebc-straw px-3.5 text-sm font-semibold text-cave-950 disabled:opacity-40">{icone} {p.bouton.texte}</button>
  </footer>;
}
