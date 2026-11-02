// Plusieurs pages pour une seule dépense (n2-pages, son choix D291) : le bouton noir coupé en deux, la rangée de pages, la frise, la pile de l'en-tête et le panneau des pages.
// Maquette reprise telle quelle : `work/missions/2026-10-31-ecran-depense/choix-captures/retenue/` (forme 3 : « Un document » | « Plusieurs »). Jetons de l'app seulement (le thème rend `bg-ebc-straw` noir).
import React from 'react';
import { FileText, Files, Plus, X } from 'lucide-react';

export interface VignettePage { id: string; url: string; nom: string }

/** Le bouton noir coupé en deux : « Un document » (large, le geste d'aujourd'hui : la lecture part tout de suite) | « Plusieurs » (étroit, picto pages). */
export function EntreeFendue(p: { onUn: () => void; onPlusieurs: () => void }) {
  return <div data-dp="entree" className="flex min-h-8 overflow-hidden rounded-control bg-ebc-straw text-cave-950">
    <button data-primary type="button" onClick={p.onUn} className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[13px] font-semibold"><FileText size={16}/>Un document</button>
    <button type="button" onClick={p.onPlusieurs} style={{ borderLeftColor: 'color-mix(in srgb, currentColor 38%, transparent)' }} className="flex w-[124px] shrink-0 items-center justify-center gap-2 border-l text-[13px] font-semibold"><Files size={15}/>Plusieurs</button>
  </div>;
}

function Numero({ n, petit }: { n: number; petit?: boolean }) {
  return <span aria-hidden className={`absolute bottom-0.5 left-0.5 flex items-center justify-center rounded-full bg-ebc-straw font-mono font-bold text-cave-950 ring-2 ring-cave-950 ${petit ? 'size-4 text-[10px]' : 'size-5 text-xs'}`}>{n}</span>;
}
function Miniature({ url, grand }: { url: string; grand?: boolean }) {
  return url ? <img src={url} alt="" className={`size-full ${grand ? 'object-cover' : 'object-cover'}`}/> : <span aria-hidden className="block size-full bg-cave-900"/>;
}

/** La rangée : vignettes numérotées avec ×, tuile « + page », « Lire N pages », sans délai. Elle est aussi la cible d'un fichier lâché (une page de plus). */
export function RangeePages(p: { pages: VignettePage[]; max: number; onRetirer: (id: string) => void; onAjouter: () => void; onLire: () => void;
  onDragOver: React.DragEventHandler; onDragLeave: React.DragEventHandler; onDrop: React.DragEventHandler; depose: boolean;
  /** Après un échec d'assemblage seulement : le lien de l'entrée, sous le message, pour saisir à la main sans devoir retirer toutes les pages. */
  sansJustificatif?: () => void }) {
  const n = p.pages.length;
  return <section data-dp="rangee-pages" aria-label="Pages du justificatif" onDragOver={p.onDragOver} onDragLeave={p.onDragLeave} onDrop={p.onDrop}
    className={`space-y-2 rounded-panel border border-dashed px-2 py-2 transition-colors ${p.depose ? 'border-ebc-straw bg-ebc-straw/10' : 'border-cave-700'}`}>
    <div className="flex gap-2 overflow-x-auto">
      {p.pages.map((page, i) => <div key={page.id} data-dp="page" data-dp-nom={page.nom} className="relative h-[116px] w-[62px] shrink-0 overflow-hidden rounded-control border border-cave-600 bg-cave-950">
        <Miniature url={page.url} grand/>
        <button type="button" aria-label={`Retirer la page ${i + 1}`} onClick={() => p.onRetirer(page.id)} className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full border border-cave-600 bg-cave-950 text-cave-50"><X size={12}/></button>
        <Numero n={i + 1}/>
      </div>)}
      {n < p.max ? <button type="button" onClick={p.onAjouter} className="flex h-[116px] w-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-control border border-dashed border-cave-600 text-xs font-medium text-cave-200">
        <span className="flex size-6 items-center justify-center rounded-full border border-cave-400"><Plus size={14}/></span>+ page</button> : null}
    </div>
    <button type="button" onClick={p.onLire} className="min-h-9 w-full rounded-control bg-ebc-straw text-[13px] font-semibold text-cave-950">Lire {n} page{n > 1 ? 's' : ''}</button>
    <p className="text-center text-xs text-cave-400">ajoute la suivante, puis Lire</p>
    {p.sansJustificatif ? <button type="button" onClick={p.sansJustificatif} className="min-h-7 w-full text-sm text-cave-200 underline underline-offset-4">Saisir sans justificatif</button> : null}
  </section>;
}

/** La rangée compacte de la carte de lecture : 1 · 2 · 3, vignettes de 56 px. */
export function MiniPages({ pages }: { pages: VignettePage[] }) {
  return <div data-dp="mini-pages" className="mt-1 flex gap-1.5">{pages.map((page, i) => <div key={page.id} className="relative h-14 w-[30px] shrink-0 overflow-hidden rounded-control border border-cave-600 bg-cave-950"><Miniature url={page.url}/><Numero n={i + 1} petit/></div>)}</div>;
}

/**
 * La frise « … · lecture · vérification ». Plusieurs pages (`pages` = N) : dès qu'une page est posée, le premier segment est plein et dit « N pages ✓ » (« 1 page ✓ ») ;
 * `repos` : « lecture » et « vérification » grises ; `lecture` : « lecture » en gras et pointillée. « envoi » n'y paraît jamais (maquettes 3, 4 et 5 de `retenue`).
 * Un document seul (`pages` absent) : la frise d'aujourd'hui, « envoi ✓ » plein, « lecture » qui défile.
 */
export function FrisePages({ etat, pages }: { etat: 'repos' | 'lecture'; pages?: number }) {
  const repos = etat === 'repos';
  return <div data-dp="frise" data-etat={etat} aria-hidden className="mt-[3px] flex gap-1.5 text-xs text-cave-400">
    <span className="flex flex-1 flex-col gap-[3px] text-cave-200"><i className="block h-1.5 rounded-control bg-cave-200"/>{pages ? `${pages} page${pages > 1 ? 's' : ''} ✓` : 'envoi ✓'}</span>
    <span className={`flex flex-1 flex-col gap-[3px] ${repos ? '' : 'font-semibold text-cave-50'}`}><i className={`block h-1.5 rounded-control ${repos ? 'bg-cave-800' : 'dp-p3c-frise-cours'}`}/>lecture</span>
    <span className="flex flex-1 flex-col gap-[3px]"><i className="block h-1.5 rounded-control bg-cave-800"/>vérification</span>
  </div>;
}

/** Le bas des états « rangée » et « lecture » : le cadre « Les lignes arrivent ici », puis « Pour quoi ? » et « Règlement » (verrouillés tant que la lecture écrit le brouillon). */
export function ResteDeLecture() {
  return <>
    <div data-dp="lignes-arrivent" className="flex min-h-[118px] items-center justify-center rounded-panel border border-dashed border-cave-600 text-sm text-cave-400">Les lignes arrivent ici</div>
    <div className="px-1 pb-3 pt-1">{[['Pour quoi ?', 'après la lecture'], ['Règlement', 'Déjà payé · À payer']].map(([titre, valeur]) => <div key={titre} className="flex min-h-9 items-center gap-2 border-b border-cave-800 text-sm text-cave-200"><span>{titre}</span><em className="ml-auto truncate text-xs not-italic text-cave-400">{valeur}</em></div>)}</div>
  </>;
}

/** La pile « N » à la place de l'icône du document, dans l'en-tête. */
export function PilePages({ n }: { n: number }) {
  return <span className="flex items-center gap-1"><Files size={20}/><span className="font-mono text-sm font-bold">{n}</span></span>;
}

/** Au toucher de la pile : vignettes de 56 px sur une ligne (un lien vers l'image) et « Changer » (rouvre l'entrée, ne détruit rien). */
export function PanneauPages(p: { pages: VignettePage[]; changerOff: boolean; onChanger: () => void }) {
  return <div data-dp="pages-panneau" className="flex items-center gap-1.5">
    <div className="flex gap-1.5">{p.pages.map((page, i) => <a key={page.id} data-dp="vignette" href={page.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Voir la page ${i + 1}`} className="relative block h-14 w-[40px] shrink-0 overflow-hidden rounded-control border border-cave-600 bg-cave-950"><Miniature url={page.url}/><Numero n={i + 1} petit/></a>)}</div>
    <button type="button" aria-label="Changer" title="Changer les pages" disabled={p.changerOff} onClick={p.onChanger} className="ml-auto inline-flex min-h-7 items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-50 disabled:opacity-40"><FileText size={14}/>Changer</button>
  </div>;
}

/**
 * Lenteur D (sa maquette `choix-lenteur/d-06`) : le fil de 22 px sous l'en-tête pendant la vérification, qui reprend la frise d'aujourd'hui (« envoi » et « lecture » faits, « vérification » en cours). Il part quand la 3.8 est arrivée.
 * Hors du défilement : il reste sous l'en-tête. Le cadre bleu épais des captures de la page de choix n'en fait pas partie.
 */
export function FilVerification() {
  return <div data-dp="fil" role="status" aria-label="Vérification en cours" className="flex h-[22px] shrink-0 items-center gap-1.5 border-b border-cave-800 bg-cave-950 px-2.5 text-xs font-semibold text-cave-50">
    <i aria-hidden className="block h-1 w-9 rounded-full bg-cave-200"/><i aria-hidden className="block h-1 w-9 rounded-full bg-cave-200"/><i aria-hidden className="dp-p3c-frise-cours block h-1 w-24 rounded-full" style={{ backgroundSize: '12px 4px' }}/>
    <span>vérification</span>
  </div>;
}
