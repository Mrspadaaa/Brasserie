// L'en-tête de 40 px de p3c-3 (×, titre, « hors ligne », picto du justificatif) et le petit panneau du picto : « Voir l'original » et « Changer ».
// Le panneau est monté en permanence (classe `hidden` quand il est fermé) : convention de l'app pour ses panneaux, et le test `changer-fichier` y trouve « Changer ».
import React from 'react';
import { FileText, X } from 'lucide-react';

export interface FichierJustif { nom: string; url: string; type: string }

export function Entete(p: { titleId: string; titre: string; horsLigne: boolean; fichier: FichierJustif | null; ouvert: boolean; fermerOff: boolean; onFermer: () => void; onBasculer: () => void; recapRef?: React.Ref<HTMLElement> }) {
  return <header className="flex h-10 shrink-0 items-center gap-1 border-b border-cave-800 bg-cave-950 pl-1 pr-1">
    <button type="button" disabled={p.fermerOff} onClick={p.onFermer} aria-label="Fermer" className="flex size-8 items-center justify-center rounded-control text-cave-200 disabled:opacity-40"><X size={20}/></button>
    <h2 id={p.titleId} className="min-w-0 flex-1 truncate text-base font-semibold text-cave-50">{p.titre}</h2>
    {p.horsLigne ? <span data-dp="hors-ligne" title="Hors ligne · brouillon gardé" className="shrink-0 rounded-control border border-cave-600 px-1.5 text-xs leading-5 text-cave-200">hors ligne</span> : null}
    {p.fichier ? <button type="button" aria-label="Justificatif : voir l’original, changer" aria-expanded={p.ouvert} onClick={p.onBasculer} className="flex size-8 items-center justify-center rounded-control text-cave-200"><FileText size={20}/></button> : null}
  </header>;
}

export function Justificatif(p: { fichier: FichierJustif | null; ouvert: boolean; changerOff: boolean; onChanger: () => void }) {
  if (!p.fichier) return null;
  const image = p.fichier.type.startsWith('image/');
  return <div data-dp="justificatif" className={`${p.ouvert ? 'block' : 'hidden'} space-y-1.5 rounded-panel border border-cave-800 bg-cave-900/60 p-2`}>
    <div className="flex flex-wrap items-center gap-1.5">
      {image ? <span className="text-sm text-cave-200">Voir l’original</span> : <a href={p.fichier.url} download={p.fichier.nom} className="inline-flex min-h-7 items-center rounded-control border border-cave-600 px-2.5 text-sm text-ebc-straw">Ouvrir le PDF original</a>}
      <button type="button" aria-label="Changer" title="Changer le fichier" disabled={p.changerOff} onClick={p.onChanger} className="ml-auto inline-flex min-h-7 items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-50 disabled:opacity-40"><FileText size={14}/>Changer</button>
    </div>
    {image ? <img src={p.fichier.url} alt="Justificatif source" className="max-h-[40dvh] w-full rounded-panel object-contain"/> : null}
  </div>;
}
