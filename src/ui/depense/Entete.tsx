// L'en-tête de 40 px de p3c-3 (×, titre, « hors ligne », picto du justificatif) et le petit panneau du picto : « Voir l'original » et « Changer ».
// Le panneau est monté en permanence (classe `hidden` quand il est fermé) : convention de l'app pour ses panneaux, et le test `changer-fichier` y trouve « Changer ».
// n2-pages : un justificatif de plusieurs pages montre la pile « N » à la place de l'icône, et le panneau des pages (vignettes, « Changer » qui rouvre l'entrée).
import React, { useState } from 'react';
import { FileText, X, ZoomIn } from 'lucide-react';
import { Loupe } from './Loupe';
import { PanneauPages, PilePages, type VignettePage } from './Pages';

export interface FichierJustif { nom: string; url: string; type: string }

export function Entete(p: { titleId: string; titre: string; horsLigne: boolean; fichier: FichierJustif | null; ouvert: boolean; fermerOff: boolean; onFermer: () => void; onBasculer: () => void; recapRef?: React.Ref<HTMLElement>;
  /** Le nombre de pages du justificatif joint (2 et plus) : la pile « N » remplace l'icône du document. */
  pages?: number;
  /** D311 : ce qui se pose entre le titre et le justificatif (le segment « Plié | Déplié » de son choix E) ; rien par défaut. */
  milieu?: React.ReactNode }) {
  const plusieurs = (p.pages ?? 0) > 1;
  return <header className="flex h-10 shrink-0 items-center gap-1 border-b border-cave-800 bg-cave-950 pl-1 pr-1">
    <button type="button" disabled={p.fermerOff} onClick={p.onFermer} aria-label="Fermer" className="flex size-8 items-center justify-center rounded-control text-cave-200 disabled:opacity-40"><X size={20}/></button>
    <h2 id={p.titleId} className="min-w-0 flex-1 truncate text-base font-semibold text-cave-50">{p.titre}</h2>
    {p.milieu ?? null}
    {p.horsLigne ? <span data-dp="hors-ligne" title="Hors ligne · brouillon gardé" className="shrink-0 rounded-control border border-cave-600 px-1.5 text-xs leading-5 text-cave-200">hors ligne</span> : null}
    {p.fichier ? plusieurs
      ? <button type="button" aria-label={`Justificatif, ${p.pages} pages : voir les pages, changer`} aria-expanded={p.ouvert} onClick={p.onBasculer} className={`flex h-8 min-w-8 items-center justify-center rounded-control px-1 text-cave-200 ${p.ouvert ? 'bg-cave-800' : ''}`}><PilePages n={p.pages!}/></button>
      : <button type="button" aria-label="Justificatif : voir l’original, changer" aria-expanded={p.ouvert} onClick={p.onBasculer} className="flex size-8 items-center justify-center rounded-control text-cave-200"><FileText size={20}/></button> : null}
  </header>;
}

export function Justificatif(p: { fichier: FichierJustif | null; ouvert: boolean; changerOff: boolean; onChanger: () => void; pages?: VignettePage[] }) {
  const [loupe, setLoupe] = useState(false);
  if (!p.fichier) return null;
  if (p.pages && p.pages.length > 1) return <div data-dp="justificatif" className={`${p.ouvert ? 'block' : 'hidden'} rounded-panel border border-cave-800 bg-cave-900/60 p-2`}>
    <PanneauPages pages={p.pages} changerOff={p.changerOff} onChanger={p.onChanger}/>
  </div>;
  const image = p.fichier.type.startsWith('image/');
  return <div data-dp="justificatif" className={`${p.ouvert ? 'block' : 'hidden'} space-y-1.5 rounded-panel border border-cave-800 bg-cave-900/60 p-2`}>
    <div className="flex flex-wrap items-center gap-1.5">
      {image ? <span className="text-sm text-cave-200">Voir l’original <span className="text-xs text-cave-400">· toucher pour agrandir</span></span> : <a href={p.fichier.url} download={p.fichier.nom} className="inline-flex min-h-7 items-center rounded-control border border-cave-600 px-2.5 text-sm text-ebc-straw">Ouvrir le PDF original</a>}
      <button type="button" aria-label="Changer" title="Changer le fichier" disabled={p.changerOff} onClick={p.onChanger} className="ml-auto inline-flex min-h-7 items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-50 disabled:opacity-40"><FileText size={14}/>Changer</button>
    </div>
    {image ? <button type="button" data-dp="agrandir" aria-label="Agrandir le justificatif" onClick={() => setLoupe(true)} className="relative block w-full"><img src={p.fichier.url} alt="Justificatif source" className="max-h-[40dvh] w-full rounded-panel object-contain"/><span aria-hidden className="absolute bottom-1.5 right-1.5 flex size-8 items-center justify-center rounded-control bg-cave-950/80 text-cave-50"><ZoomIn size={18}/></span></button> : null}
    {image && loupe ? <Loupe url={p.fichier.url} nom={p.fichier.nom} onFermer={() => setLoupe(false)}/> : null}
  </div>;
}
