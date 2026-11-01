// Le premier écran de r2b : le bandeau du verdict, la preuve, les chips numérotées et la bande collante. Présentation seulement :
// l'état, le statut et les chips arrivent calculés (`etat.ts`). Les classes de couleur sont celles de l'app : le thème suit.
import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, HelpCircle } from 'lucide-react';
import type { StatutLecture } from '../../domain/finance/invoicePoints';
import type { ScannedInvoiceResult } from '../../services/geminiScanner';
import type { PurchaseLineDraft } from '../../services/purchaseEntry';
import { PictoLien, type LienStock } from './Pictos';
import type { Chip, CompteLiens } from './etat';

export const TITRES: Record<StatutLecture, { title: string; detail: string }> = {
  checked: { title: 'Lecture vérifiée', detail: 'Les lectures du justificatif concordent. Relis les champs avant d’enregistrer.' },
  corrected: { title: 'Corrections proposées', detail: 'Une relecture du document a corrigé des écarts. Confirme ces propositions sur l’original.' },
  disputed: { title: 'Lecture à confirmer', detail: 'Certains points restent à confirmer. Vérifie les points signalés sur l’original.' },
  unavailable: { title: 'Vérification incomplète', detail: 'La lecture reste une proposition. Vérifie les montants et les articles sur l’original.' },
};
const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
/** C15 : la barre est colorée par LIEN au stock (jetons de l'app, le thème suit). */
const COULEUR_LIEN: Record<LienStock, string> = { relie: 'bg-attention', neuf: 'bg-area-finances', precis: 'bg-attention/40', aucun: 'bg-cave-50', mouture: 'bg-hop' };
const LABELS_CORRIGES: Record<string, string> = { vendor: 'Fournisseur', date: 'Date', currency: 'Devise', invoiceNumber: 'N° de facture', amountHT: 'Total HT', tvaRate: 'Taux de TVA', tvaAmount: 'Montant de TVA', amountTTC: 'Total TTC', category: 'Catégorie', subcategory: 'Sous-catégorie', description: 'Description', items: 'Articles', documentType: 'Type de document', paymentEvidence: 'Paiement', orderNumber: 'N° de commande' };
const champCorrige = (f: string) => LABELS_CORRIGES[f] ?? (/^items(?:\[(\d+)\]|\.(\d+))/.exec(f) ? `Article ${Number((/^items(?:\[(\d+)\]|\.(\d+))/.exec(f) as RegExpExecArray)[1] ?? (/^items(?:\[(\d+)\]|\.(\d+))/.exec(f) as RegExpExecArray)[2]) + 1}` : 'Détail du document');

/** Le bandeau : fournisseur, date, total (le champ est celui de l'écran), chip « n lignes » qui ouvre la preuve, barre des lignes. */
export function Bandeau({ vendor, date, totalField, calcule, statut, lines, preuveOuverte, onPreuve, drive, onDrive, onLigne, liens, sceau, sousTotal }: {
  liens: Readonly<Record<string, LienStock>>;
  vendor: string; date: string; totalField: React.ReactNode; calcule: boolean; statut: StatutLecture | null; lines: readonly PurchaseLineDraft[];
  preuveOuverte: boolean; onPreuve: () => void; drive: 'ok' | 'a-connecter' | null; onDrive: () => void; onLigne: (id: string) => void;
  /** z2 : le sceau QR (ou « sans QR »), à droite du total et de la barre ; absent, le bandeau est celui de la base, au pixel. */
  sceau?: React.ReactNode;
  /** z2 : le duel du total, le témoin des lignes ou « Photographier le QR », sous le total et au-dessus de la barre. */
  sousTotal?: React.ReactNode;
}) {
  const icone = statut === 'checked' ? <Check size={14} className="text-hop"/> : statut === 'corrected' ? <Check size={14} className="text-cave-400"/> : statut === 'unavailable' ? <HelpCircle size={14} className="text-attention"/> : <AlertCircle size={14} className="text-attention"/>;
  return <section data-dp="bandeau" className={`rounded-panel border border-cave-800 bg-cave-900/40 px-2.5 py-1.5 ${sceau ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1' : 'space-y-1'}`}>
    <div className={`flex items-baseline justify-between gap-2 ${sceau ? 'col-span-2' : ''}`}><span className="truncate text-base font-semibold text-cave-50">{vendor || 'Fournisseur'}</span><span className="font-mono text-sm text-cave-200">{date}</span></div>
    <div className="flex items-center gap-2">{totalField}<span className="text-xs text-cave-400">CHF{calcule ? ' · somme des lignes' : ''}</span>
      {statut ? <button type="button" aria-label="Détails de la lecture" aria-expanded={preuveOuverte} onClick={onPreuve} className="ml-auto min-h-7 inline-flex items-center gap-1 rounded-control border border-cave-700 px-2 text-sm text-cave-200">{icone}<span className="font-mono">{lines.length}</span>&nbsp;lignes</button> : null}</div>
    {drive === 'a-connecter' || sousTotal || (lines.length > 1 && statut) ? <div className="flex min-w-0 flex-col gap-1">
      {drive === 'a-connecter' ? <button type="button" onClick={onDrive} className="min-h-7 inline-flex items-center self-start rounded-control border border-dashed border-attention px-2 text-sm text-attention">Drive à connecter</button> : null}
      {sousTotal}
      {lines.length > 1 && statut ? <div data-dp="barre" aria-label={`Les ${lines.length} lignes, à la largeur de leur montant`} className="flex h-2.5 overflow-hidden rounded-full border border-cave-800">{lines.map(l => <i key={l.id} onClick={() => onLigne(l.id)} className={`block h-full border-r border-cave-950 last:border-r-0 ${COULEUR_LIEN[liens[l.id] ?? 'aucun']}`} style={{ flexGrow: Math.max(l.amount ?? 0, 0.01) }}/>)}</div> : null}
    </div> : null}
    {sceau ? <div className="col-start-2 row-span-2 row-start-2 self-start">{sceau}</div> : null}
  </section>;
}

/** La preuve : le statut en titre, les rangées chiffrées lues dans `controls` (rien d'affirmé sans contrôle), le compte des liens, les remarques. */
export function Preuve({ ouverte, statut, result, lignes, comptes, remarques, cached, ecartTotal }: {
  ouverte: boolean; statut: StatutLecture; result: ScannedInvoiceResult; lignes: number; comptes: CompteLiens; remarques: string[]; cached?: boolean;
  /** z2 : quand le QR contredit le total de la page, la somme des lignes dit l'écart (« 110,40 ≠ 110,04 »). */
  ecartTotal?: { lignes: string; lu: string };
}) {
  const c = result.controls, lectures = result.review?.readers;
  const rang = (ok: boolean | null, texte: string, valeur: string) => <div className="grid grid-cols-[18px_1fr_auto] items-center gap-1.5 min-h-7 border-b border-cave-800 last:border-0 text-sm">{ok === true ? <Check size={14} className="text-hop"/> : <span className="text-cave-400">·</span>}<span className="text-cave-200">{texte}</span><b className="font-mono font-medium text-cave-50">{valeur}</b></div>;
  return <section data-dp="preuve" aria-label="Preuve de la lecture" className={`${ouverte ? 'block' : 'hidden lg:block'} scroll-mt-12 rounded-panel border border-cave-800 px-2.5 py-1.5`}>
    <p className="text-sm font-medium text-cave-50">{TITRES[statut].title}</p>
    {ecartTotal ? rang(false, 'Somme des lignes = imprimé', `${ecartTotal.lignes} ≠ ${ecartTotal.lu}`)
      : c ? rang(c.sum.statut === 'ok', 'Somme des lignes = imprimé', c.sum.statut === 'ok' ? money(result.amountTTC ?? 0) : 'non vérifiée') : rang(null, 'Somme des lignes', 'non contrôlée')}
    {c ? rang(c.lines.failed === 0 && c.lines.skipped === 0 && c.lines.checked > 0, 'Quantité × prix, au centime', `${c.lines.checked}/${lignes}`) : rang(null, 'Quantité × prix', 'non contrôlé')}
    {lectures ? ((result.points ?? []).some(p => p.origine === 'lecture' && p.pese !== false) ? rang(false, 'Lectures : désaccord sur certains points', `${lectures} lectures`) : rang(true, 'Lectures d’accord', `${lectures}/${lectures}`)) : null}
    {(result.linesLost ?? 0) > 0 ? rang(false, 'Lignes non gardées', String(result.linesLost)) : null}
    <div data-dp="compte-liens" className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 text-xs text-cave-200">
      <span className="inline-flex items-center gap-1"><PictoLien lien="relie" size={14}/><b className="font-mono">{comptes.relie}</b> {comptes.relie > 1 ? 'reliés' : 'relié'}</span>
      <span className="inline-flex items-center gap-1"><PictoLien lien="neuf" size={14}/><b className="font-mono">{comptes.neuf}</b> {comptes.neuf > 1 ? 'nouveaux' : 'nouveau'}</span>
      {comptes.precis ? <span className="inline-flex items-center gap-1"><PictoLien lien="precis" size={14}/><b className="font-mono">{comptes.precis}</b> unité ?</span> : null}
      {comptes.mouture ? <span className="inline-flex items-center gap-1"><PictoLien lien="mouture" size={14}/><b className="font-mono">{comptes.mouture}</b> {comptes.mouture > 1 ? 'moutures' : 'mouture'}</span> : null}
      {comptes.autre ? <span className="inline-flex items-center gap-1"><PictoLien lien="aucun" size={14}/><b className="font-mono">{comptes.autre}</b> sans stock</span> : null}
    </div>
    {(result.review?.correctedFields ?? []).length ? <p className="mt-1.5 text-xs text-cave-200">Champs corrigés : {[...new Set((result.review?.correctedFields ?? []).map(champCorrige))].join(' · ')}.</p> : null}
    {remarques.length ? <ul className="mt-1.5 list-disc pl-4 text-xs text-cave-200 space-y-1 break-words">{remarques.map(r => <li key={r}>{r}</li>)}</ul> : null}
    {cached ? <p className="text-xs text-cave-400">Lecture déjà disponible · aucun nouvel appel IA.</p> : null}
  </section>;
}

/** Les points qui pèsent, numérotés par risque ; un point réglé est barré (jamais par défaut ni par le temps). */
export function ChipsBar({ chips, reglees, onAller, tout, cacher }: { chips: readonly Chip[]; reglees: ReadonlySet<string>; onAller: (chip: Chip) => void; tout: boolean; cacher?: (chip: Chip) => boolean }) {
  if (!chips.length) return null;
  return <div data-dp="chips" aria-label="Points à régler" className="flex flex-wrap gap-1.5">
    {chips.map((chip, i) => { const fait = reglees.has(chip.id); if (cacher?.(chip)) return null;
      return <button key={chip.id} type="button" data-dp-chip={chip.id} aria-label={`${i + 1} ${chip.nom}${fait ? ' réglé' : ''}`} onClick={() => onAller(chip)}
        className={`min-h-7 inline-flex items-center gap-1 rounded-control px-2 text-sm border ${fait ? 'border-cave-700 text-cave-400 line-through' : 'border-dashed border-attention bg-attention/5 text-cave-50'}`}>
        <span className={`inline-flex size-[18px] items-center justify-center rounded-full font-mono text-xs ${fait ? 'bg-hop text-cave-950' : 'border border-dashed border-attention text-attention'}`}>{i + 1}</span>{chip.nom}</button>; })}
    {tout ? <span className="min-h-7 inline-flex items-center rounded-control border border-hop px-2 text-sm text-hop">✓ points revus</span> : null}
  </div>;
}

/** La bande collante (greffe z2b) : visible seulement quand le bandeau est sorti de l'écran défilant.
 *  D233 : elle ne prend AUCUNE place dans le flux. Le support est collant, haut de 0, et sa marge basse (-0,5 rem) annule celle que `space-y-2` donne au
 *  frère suivant ; la bande y est posée en `absolute`. Son apparition ne déplace donc rien (avant, elle poussait le contenu de sa hauteur, le bandeau
 *  rentrait à l'écran, elle se retirait, le contenu remontait : un sautillement d'image en image). */
export function BandeCollante({ cible, racine, chips, reglees, onAller }: { cible: React.RefObject<HTMLElement | null>; racine: React.RefObject<HTMLElement | null>; chips: readonly Chip[]; reglees: ReadonlySet<string>; onAller: (chip: Chip) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !cible.current) return;
    const obs = new IntersectionObserver(([entree]) => setVisible(!entree.isIntersecting), { root: racine.current ?? null });
    obs.observe(cible.current);
    return () => obs.disconnect();
  }, [cible, racine]);
  const courant = chips.find(c => !reglees.has(c.id));
  if (!chips.length) return null;
  return <div data-dp="bande-support" aria-hidden={visible ? undefined : true} className="sticky top-0 z-10 lg:hidden h-0 -mb-2 pointer-events-none">
    {visible ? <div data-dp="bande" className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-1.5 border-b border-cave-800 bg-cave-950 px-2 py-1 text-sm">
      {chips.map((c, i) => <span key={c.id} className={`inline-flex size-[22px] items-center justify-center rounded-full font-mono text-xs ${reglees.has(c.id) ? 'bg-hop text-cave-950' : 'border border-dashed border-attention text-attention'}`}>{i + 1}</span>)}
      <span className="min-w-0 flex-1 truncate text-cave-200">{courant ? courant.nom : 'points revus'}</span>
      {courant ? <button type="button" onClick={() => onAller(courant)} className="min-h-7 rounded-control border border-cave-600 px-2 text-cave-50">y aller</button> : null}
    </div> : null}
  </div>;
}
