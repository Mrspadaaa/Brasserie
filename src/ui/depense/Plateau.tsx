// Le plateau de la ligne ouverte : sa maquette pu4d (`plateau/v3/pu4d/`, D361), reprise telle quelle. Présentation seulement : tout arrive calculé (`plateau.ts`, ExpenseSheet).
// Dans l'ordre de la maquette : imprimé · référence ; `[q] [unité en segment] × [prix] = [montant]` ; le face à face Facture | Stock d'une ligne en doute, puis sa décision ;
// la nature (segment) ; la ligne « article » (ou « hors stock » et ses types) ; la mouture ; une rangée discrète « extrait · supprimer ».
// D350 : aucun menu déroulant, chaque choix en un toucher. D277 : sûr = rien, jaune = repris, rouge = à remplir, sur le champ même.
import React, { useState } from 'react';
import { ArrowLeftRight, FileText, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { ChoixUnite } from './calculPlateau';

/** Un champ du plateau : 36 px, chiffres en mono, largeur de son contenu (maquette pu4d). */
export const CHAMP_PU4D = 'h-9 min-w-0 rounded-control border border-cave-600 bg-cave-950 px-2 text-right font-mono text-base text-cave-50 tabular-nums';
/** La largeur d'un champ selon la longueur de son texte (classes statiques : Tailwind ne lit pas les classes composées). */
export const largeur = (texte: string): string => { const n = texte.length; return n <= 2 ? 'w-12' : n <= 3 ? 'w-14' : n <= 4 ? 'w-16' : n <= 5 ? 'w-[4.75rem]' : 'w-24'; };
const BOUTON = 'inline-flex min-h-8 items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-50';
const ACTIF = 'bg-ebc-straw font-semibold text-cave-950';

export function Imprime({ texte, reference }: { texte: string; reference?: string }) {
  return <p data-dp-imprime className="flex min-h-5 items-center text-xs text-cave-400">imprimé «&nbsp;<span className="font-mono text-cave-50">{texte}</span>&nbsp;»{reference ? <span>&nbsp;· {reference}</span> : null}</p>;
}

/** `[q] [unité] × [prix] = [montant]` : une seule rangée, ses champs à la largeur de leur contenu. */
export function RangeeCalcul({ avant, children }: { avant?: string; children: React.ReactNode }) {
  return <div data-dp-calcul className="flex flex-wrap items-center gap-1 text-sm text-cave-400">{avant ? <s data-dp-avant className="font-mono text-xs">{avant}</s> : null}{children}</div>;
}
export const Op = ({ c }: { c: string }) => <span aria-hidden className="text-sm text-cave-400">{c}</span>;

/** D350, D353 : l'unité en segment de deux ou trois, la pièce toujours offerte. Un toucher choisit ; l'unité lue allume son bouton. */
export function SegmentUnite({ index, choix, active, repris, onChoisir }: { index: number; choix: ChoixUnite[]; active: string; repris?: boolean; onChoisir: (valeur: string) => void }) {
  return <span data-dp-unite-segments {...(repris ? { 'data-dp-niveau': 'repris' } : {})} role="group" aria-label={`Unité ligne ${index}`} className={`inline-flex h-9 overflow-hidden rounded-control ${repris ? 'border-2 border-dashed border-attention' : 'border border-cave-600'}`}>
    {choix.map(c => <button key={c.valeur} type="button" aria-pressed={c.valeur === active} onClick={() => onChoisir(c.valeur)} className={`min-w-8 px-1.5 font-mono text-sm ${c.valeur === active ? ACTIF : 'text-cave-200'}`}>{c.label}</button>)}
  </span>;
}
/** D369 : la quantité en un toucher, comme l'unité. Chaque toucher s'ajoute (1 puis 10 : 11) ; ✕ remet à vide. Les nombres suivent l'unité (`nombresRapides`). */
export function NombresRapides({ index, nombres, effacable, onAjouter, onEffacer }: { index: number; nombres: readonly number[]; effacable: boolean; onAjouter: (n: number) => void; onEffacer: () => void }) {
  return <span data-dp-nombres role="group" aria-label={`Quantité en un toucher, ligne ${index}`} className="inline-flex h-9 divide-x divide-cave-700 overflow-hidden rounded-control border border-cave-600">
    {nombres.map(n => <button key={n} type="button" data-val={n} aria-label={`ajouter ${n}`} onClick={() => onAjouter(n)} className="min-w-9 px-1.5 font-mono text-sm text-cave-200 active:bg-ebc-straw active:text-cave-950">+{n}</button>)}
    {effacable ? <button type="button" aria-label="effacer la quantité" onClick={onEffacer} className="min-w-9 px-1.5 text-sm text-cave-400">✕</button> : null}
  </span>;
}
/** D371 : l'unité de la ligne ne s'ajoute pas à l'article relié : dit sur-le-champ, au plateau, avec l'unité du stock en un toucher. */
export function AlerteUnite({ nom, unite, uniteStock, onCompter }: { nom: string; unite: string; uniteStock: string; onCompter: () => void }) {
  return <div role="alert" data-dp-alerte-unite data-dp-niveau="inconnu" className="flex flex-wrap items-center gap-1.5 rounded-control border-2 border-alert bg-alert/10 px-2 py-1.5 text-sm text-cave-50">
    <span className="min-w-0 flex-1">« {nom} » est compté en <b className="font-mono">{uniteStock}</b> au stock : <b className="font-mono">{unite}</b> ne s’y ajoute pas.</span>
    <button type="button" onClick={onCompter} className="inline-flex min-h-8 shrink-0 items-center rounded-control border border-alert bg-cave-950 px-2.5 text-sm font-semibold text-cave-50">Compter en {uniteStock}</button>
  </div>;
}
/** L'unité qui manque n'a pas de champ : une boîte rouge tiretée, et ses cinq cases juste dessous. */
export function BoiteUniteVide() {
  return <span data-dp-niveau="inconnu" aria-hidden className="inline-flex h-9 min-w-16 items-center justify-center rounded-control border-2 border-dashed border-alert bg-alert/10 font-mono text-base text-alert">▒</span>;
}
/** D277, D334 : « unité à remplir », cinq cases d'un toucher, le prix par unité dessous ; l'unité du stock est proposée (jaune tireté), jamais posée. */
export const CasesUnite = React.forwardRef<HTMLDivElement, { index: number; unites: readonly ChoixUnite[]; propose?: string; prix?: string; onChoisir: (valeur: string) => void }>(
  function CasesUnite({ index, unites, propose, prix, onChoisir }, ref) {
    const motPropose = propose ? unites.find(u => u.valeur === propose)?.label : undefined;
    return <div ref={ref} tabIndex={-1} role="group" aria-label={`Unité à remplir, ligne ${index}`} data-dp-cases-unite data-dp-niveau="inconnu" className="flex flex-col gap-1 rounded-control border-2 border-alert bg-alert/10 p-1.5 outline-none">
      <span className="text-xs font-semibold text-alert">unité à remplir{motPropose ? <> · <em className="not-italic text-attention">{motPropose} proposé, comme au stock</em></> : null}</span>
      <div className="grid grid-cols-[1fr_1fr_1.3fr_1.3fr_.9fr] gap-1">
        {unites.map(u => <button key={u.valeur} type="button" data-val={u.valeur} onClick={() => onChoisir(u.valeur)}
          className={`flex min-h-12 flex-col items-center justify-center rounded-control bg-cave-950 ${u.valeur === propose ? 'border-2 border-dashed border-attention bg-attention/10' : 'border border-alert'}`}>
          <b className="font-mono text-base font-normal text-cave-50">{u.label}</b>{prix ? <small className={`whitespace-nowrap text-xs ${u.valeur === propose ? 'text-attention' : 'text-cave-400'}`}>{prix} {u.le}</small> : null}</button>)}
      </div>
    </div>;
  });

export type EtatLien = 'sur' | 'repris' | 'inconnu';
/** Le face à face : la facture à gauche, le stock à droite, reliés par un trait d'état (= plein vert, ≈ tireté jaune, ? rompu rouge). Une carte est un `{ titre, lignes }`. */
export function Duel({ facture, stock, etat, symbole, note }: { facture: React.ReactNode; stock: React.ReactNode; etat: EtatLien; symbole: string; note?: string }) {
  const trait = etat === 'repris' ? 'border-dashed' : '';
  const couleur = etat === 'sur' ? 'bg-hop' : etat === 'repris' ? 'bg-attention' : 'bg-alert';
  const bordure = etat === 'sur' ? 'border-hop' : etat === 'repris' ? 'border-attention' : 'border-alert';
  return <div data-dp-duel data-dp-lien-etat={etat} className="grid grid-cols-[1fr_28px_1fr] items-stretch">
    <div className="flex min-w-0 flex-col gap-0.5 rounded-control border border-cave-700 bg-cave-950 px-2 pb-1.5 pt-1"><span className="text-xs font-semibold tracking-wide text-cave-400">FACTURE</span>{facture}</div>
    <span role="img" aria-label={note ?? symbole} className="relative flex items-center justify-center"><i aria-hidden className={`absolute -inset-x-0.5 top-1/2 border-t-[3px] ${bordure} ${trait}`}/><i aria-hidden className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full font-mono text-base font-bold not-italic text-cave-950 ${couleur}`}>{symbole}</i></span>
    <div className="flex min-w-0 flex-col gap-0.5 rounded-control border border-cave-700 bg-cave-900 px-2 pb-1.5 pt-1"><span className="text-xs font-semibold tracking-wide text-cave-400">STOCK</span>{stock}</div>
  </div>;
}
export const Petit = ({ children, ton, mono }: { children: React.ReactNode; ton?: 'attention' | 'alert' | 'bleu'; mono?: boolean }) =>
  <span className={`text-xs ${ton === 'alert' ? 'font-semibold text-alert' : ton === 'attention' ? 'text-attention' : ton === 'bleu' ? 'text-area-finances' : 'text-cave-400'} ${mono ? 'font-mono' : ''}`}>{children}</span>;
export const Nom = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => <span className={`text-sm leading-tight text-cave-50 ${mono ? 'font-mono font-medium' : 'font-semibold'}`}>{children}</span>;
/** « 4 → 7 sachets » : le stock avant → après réception, mono et lisible. */
export const Apres = ({ texte, aria }: { texte: string; aria?: string }) => <span data-dp-apres aria-label={aria} className="font-mono text-base font-semibold text-cave-50">{texte}</span>;
/** Le pastille de la ligne où le brasseur voit ce que la facture imprime d'écrit, mot du métier : « α 12,5 » tireté jaune quand il diffère. */
export const Marque = ({ children }: { children: React.ReactNode }) => <span className="rounded-control border border-dashed border-attention bg-attention/10 px-1 font-mono font-semibold text-attention">{children}</span>;

export interface SortieProps { id: string; titre: string; concordances: Array<{ mot: string; ton: 'ok' | 'ecart' | 'alert' | 'propose' }>; actif: boolean; propose?: boolean; onChoisir: () => void; extra?: React.ReactNode; ia?: boolean }
const SIGNE = { ok: '= ', ecart: '≠ ', alert: '≠ ', propose: '' } as const;
const TON = { ok: 'text-hop', ecart: 'font-semibold text-attention', alert: 'font-semibold text-alert', propose: 'font-semibold text-attention' } as const;
/** Une sortie du choix (case ronde, un toucher) : « Citra bis · α 12,5 », « Relier à Citra · 2024 », « Nouvel article », avec la concordance de chacune. */
export function Sortie({ id, titre, concordances, actif, propose, onChoisir, extra, ia }: SortieProps) {
  return <>
    <button type="button" role="radio" aria-checked={actif} data-dp-sortie={id} onClick={onChoisir}
      className={`flex min-h-11 w-full items-center gap-2 rounded-control px-2.5 py-1 text-left ${actif ? (propose ? 'border-2 border-dashed border-attention bg-attention/10' : 'border-2 border-cave-50') : 'border border-cave-600'} bg-cave-950`}>
      <span aria-hidden className={`h-4 w-4 shrink-0 rounded-full ${actif ? `border-[5px] ${propose ? 'border-attention' : 'border-cave-50'}` : 'border-2 border-cave-600'}`}/>
      <span className="flex min-w-0 flex-1 flex-col"><b className="text-sm font-semibold text-cave-50">{titre}</b>
        <small className="flex flex-wrap gap-x-2 text-xs">{concordances.map((c, i) => <em key={i} className={`not-italic ${TON[c.ton]}`}><span className="font-mono">{SIGNE[c.ton]}</span>{c.mot}</em>)}</small></span>
      {ia ? <span aria-hidden className="inline-flex items-center gap-0.5 font-mono text-xs text-cave-400"><Sparkles size={14}/></span> : null}
    </button>
    {extra}
  </>;
}

/** La nature en segment (D335 : toujours un mot allumé). */
export function SegmentNature({ index, nature, onChoisir, droite }: { index: number; nature: 'ingredient' | 'service' | 'equipment'; onChoisir: (k: 'ingredient' | 'service' | 'equipment') => void; droite?: React.ReactNode }) {
  const N: Array<['ingredient' | 'service' | 'equipment', string]> = [['ingredient', 'Ingrédient'], ['service', 'Service'], ['equipment', 'Matériel']];
  return <div className="flex flex-wrap items-center gap-1.5">
    <div data-dp-nature role="group" aria-label={`Type d’achat, ligne ${index}`} className="inline-flex overflow-hidden rounded-control border border-cave-600">
      {N.map(([k, mot]) => <button key={k} type="button" aria-pressed={nature === k} onClick={() => { if (nature !== k) onChoisir(k); }} className={`min-h-8 px-2.5 text-sm ${nature === k ? ACTIF : 'text-cave-200'}`}>{mot}</button>)}
    </div>{droite ? <span className="ml-auto">{droite}</span> : null}</div>;
}

/** La ligne « article » d'une ligne reliée : `article « Maris Otter » · relié ⇄ Retirer`. Le contenu vient de l'écran (nom, ⇄, Retirer, Garder). */
export const LigneArticle = ({ children }: { children: React.ReactNode }) => <div data-dp-stock className="flex min-h-8 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-cave-400">{children}</div>;
export const BoutonCarre = ({ aria, onClick }: { aria: string; onClick: () => void }) => <button type="button" aria-label={aria} title={aria} onClick={onClick} className="inline-flex h-8 w-9 items-center justify-center rounded-control border border-cave-600 text-cave-50"><ArrowLeftRight size={16} strokeWidth={2.25}/></button>;
export const BoutonTexte = ({ children, onClick, aria, attention }: { children: React.ReactNode; onClick: () => void; aria?: string; attention?: boolean }) =>
  <button type="button" aria-label={aria} onClick={onClick} className={`${BOUTON} ${attention ? 'border-dashed border-attention font-semibold text-attention' : ''}`}>{children}</button>;

/** « hors stock » : le type d'achat en pastilles d'un toucher (D350), et la greffe de pa1d : `article — · hors stock  + Suivre au stock`. */
export function HorsStock({ index, types, courant, onType, onSuivre, peutSuivre, autre }: { index: number; types: Array<{ valeur: string; mot: string }>; courant: string; onType: (valeur: string) => void; onSuivre?: () => void; peutSuivre: boolean; autre?: React.ReactNode }) {
  return <>
    <LigneArticle><span>article <b className="font-normal text-cave-50">—</b> · hors stock</span>
      {peutSuivre && onSuivre ? <button type="button" data-dp-suivre aria-label={`Suivre au stock, ligne ${index}`} onClick={onSuivre} className="inline-flex min-h-8 items-center gap-1 rounded-control border border-cave-600 px-2.5 text-sm text-cave-50"><Plus size={16} strokeWidth={2.25}/>Suivre au stock</button> : null}{autre}</LigneArticle>
    {types.length ? <div data-dp-types role="group" aria-label={`Type d’achat fin, ligne ${index}`} className="flex flex-wrap gap-1">
      {types.map(t => <button key={t.valeur} type="button" aria-pressed={t.valeur === courant} onClick={() => onType(t.valeur)} className={`min-h-7 rounded-control border px-2 text-xs ${t.valeur === courant ? `border-ebc-straw ${ACTIF}` : 'border-cave-600 text-cave-200'}`}>{t.mot}</button>)}
    </div> : null}
  </>;
}

/** La mouture du malt : `↳ mouture, ligne 2 · 6 Kg × 0,10 = 0,60  Rattacher`. */
export function RangeeMouture({ ligne, texte, liee, aria, onBascule, attr }: { ligne: number; texte: string; liee: boolean; aria: string; onBascule: () => void; attr?: string }) {
  return <div data-dp-mouture-ligne className="flex items-center gap-1.5 text-xs text-cave-200"><span>↳ mouture, ligne {ligne} · <b className="font-mono font-medium">{texte}</b></span>
    <button type="button" data-dp-mouture-plateau={attr} aria-label={aria} onClick={onBascule} className={`${BOUTON} ml-auto`}>{liee ? 'Détacher' : 'Rattacher'}</button></div>;
}

/** La rangée discrète, sous un filet : `extrait · supprimer` (D332 : le reste du plateau ne bouge pas). L'extrait montre l'imprimé de la ligne, surligné. */
export interface ChoixFamille { valeur: string; options: Array<{ valeur: string; mot: string }>; onChoisir: (valeur: string) => void }
export function RangeeRare({ index, extrait, onSupprimer, supprimable, famille }: { index: number; extrait?: string; onSupprimer: () => void; supprimable: boolean; famille?: ChoixFamille }) {
  const [ouvert, setOuvert] = useState(false);
  return <>
    <div className="flex items-center gap-1 border-t border-cave-800 pt-1">
      {extrait ? <button type="button" data-dp-extrait aria-expanded={ouvert} onClick={() => setOuvert(o => !o)} className={`inline-flex min-h-7 items-center gap-1 rounded-control px-2 text-xs ${ouvert ? 'bg-cave-800 text-cave-50' : 'text-cave-400'}`}><FileText size={16} strokeWidth={2.25}/>extrait</button> : null}
      {famille ? <label className="ml-auto inline-flex min-h-7 items-center gap-1 text-xs text-cave-400">Famille<select data-dp-famille aria-label={`Famille, ligne ${index}`} value={famille.valeur} onChange={e => famille.onChoisir(e.target.value)} className="h-7 rounded-control border border-cave-600 bg-cave-950 px-1 text-xs text-cave-50">{famille.options.map(o => <option key={o.valeur} value={o.valeur}>{o.mot}</option>)}</select></label> : null}
      {supprimable ? <button type="button" aria-label={`Retirer la ligne ${index}`} onClick={onSupprimer} className="inline-flex min-h-7 items-center gap-1 rounded-control px-2 text-xs text-cave-400 active:text-alert"><Trash2 size={16} strokeWidth={2.25}/>supprimer</button> : null}
    </div>
    {ouvert && extrait ? <pre data-dp-extrait-texte className="overflow-hidden whitespace-pre-wrap rounded-control border border-cave-800 bg-cave-950 px-2 py-1 font-mono text-xs leading-normal text-cave-50"><mark className="bg-attention/15 text-cave-50 outline outline-[1.5px] outline-attention">{extrait}</mark></pre> : null}
  </>;
}
