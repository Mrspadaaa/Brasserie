// Le récap de p3c-3 : le bandeau (fournisseur, date, total, « dont port », barre, sceau QR z2), la preuve ouverte d'office et les comptes de liens.
// Présentation seulement : l'état, le statut, les chips et les ensembles de lignes arrivent calculés (`etat.ts`, `groupes.ts`). Jetons de l'app : le thème suit.
import React from 'react';
import { AlertCircle, Check, HelpCircle, RefreshCw } from 'lucide-react';
import type { StatutLecture } from '../../domain/finance/invoicePoints';
import { PictoLien, type LienStock } from './Pictos';
import { TITRES } from './Verdict';
import { POINT_FAMILLE, type GroupeCle } from './groupes';
import type { Niveau } from './confiance';
import './p3c.css';

const TEINTE: Record<GroupeCle, string> = POINT_FAMILLE;
export const POINT_GROUPE: Record<GroupeCle, string> = TEINTE;
export const motStatut = (statut: StatutLecture | null) => (statut ? TITRES[statut].title : 'Lecture');

export interface ItemBarre { id: string; cents: number; groupe: GroupeCle; ouvert: boolean; nom: string }
export function Bandeau(p: {
  vendor: string; date: string; doutes?: { date?: boolean; vendor?: boolean; devise?: boolean }; totalField: React.ReactNode; sommeDesLignes: boolean;
  /** D277 : le niveau des champs du bandeau (la date manquante est rouge à sa place ; des lignes à revoir, jaune sur « n lignes »). */
  niveaux?: { date?: Niveau; lignes?: Niveau; total?: Niveau };
  portCents: string | null; portOuvert: boolean; onPort: () => void; statut: StatutLecture | null; nLignes: number; onLignes: () => void; onDate: () => void;
  barre: ItemBarre[]; onBarre: (id: string) => void; sceau?: React.ReactNode; sousTotal?: React.ReactNode; drive: 'a-connecter' | null; onDrive: () => void;
  /** Lenteur D (défaut A, D315 ; sa maquette `choix-cas-38/q1-a`) : un champ d'en-tête que la 3.8 a corrigé est sur le bleu des corrections, l'ancienne valeur barrée à côté. */
  corriges?: { total?: string; date?: string; vendor?: string };
}) {
  const icone = p.statut === 'checked' ? <Check size={14} className="text-hop"/> : p.statut === 'corrected' ? <Check size={14} className="text-cave-400"/> : p.statut === 'unavailable' ? <HelpCircle size={14} className="text-attention"/> : <AlertCircle size={14} className="text-attention"/>;
  const libelle = `${motStatut(p.statut)}, ${p.nLignes} ligne${p.nLignes > 1 ? 's' : ''}`;
  const g = p.sceau ? 'col-start-1' : '';
  return <section data-dp="bandeau" className={`rounded-panel border border-cave-800 bg-cave-900/40 px-2.5 pb-[7px] pt-[5px] ${p.sceau ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-[3px]' : 'space-y-[3px]'}`}>
    <div className={`flex items-baseline justify-between gap-2 ${p.sceau ? 'col-span-2' : ''}`}>
      <span className={`min-w-0 truncate text-base font-semibold leading-6 ${p.doutes?.vendor ? 'text-attention border-b-2 border-dotted border-attention' : 'text-cave-50'}`}>{p.vendor || 'Fournisseur'}{p.corriges?.vendor ? <s data-dp="vendor-avant" className="ml-1.5 text-xs font-normal text-cave-400">{p.corriges.vendor}</s> : null}</span>
      {p.corriges?.date ? <s data-dp="date-avant" className="ml-auto shrink-0 font-mono text-xs text-cave-400">{p.corriges.date}</s> : null}
      {p.niveaux?.date === 'inconnu'
        ? <button type="button" data-dp-niveau="inconnu" aria-label="Date de l’achat à remplir" onClick={p.onDate} className="shrink-0 rounded-control border border-dashed border-alert px-1.5 font-mono text-sm min-h-6 text-alert">{p.date || 'date ?'}</button>
        : <button type="button" aria-label={`Achat du ${p.date}`} {...(p.niveaux?.date === 'repris' ? { 'data-dp-niveau': 'repris' } : {})} onClick={p.onDate} className={`shrink-0 border-b border-dashed font-mono text-sm min-h-6 ${p.doutes?.date || p.niveaux?.date === 'repris' ? 'text-attention border-b-2 border-dotted border-attention' : 'text-cave-200 border-cave-600'}`}>{p.date}</button>}
    </div>
    <div className={`${g} flex min-w-0 items-center gap-2`}>{/* Toujours le même porteur : le champ du total n'est jamais remonté quand son niveau change (une frappe en cours reste). */}
      <span data-dp="total-niveau" {...(p.niveaux?.total && p.niveaux.total !== 'sur' ? { 'data-dp-niveau': p.niveaux.total } : {})} {...(p.corriges?.total ? { 'data-dp-corrige': '1' } : {})} className={`inline-flex min-w-0 ${p.corriges?.total ? 'rounded-control bg-area-finances/15 px-1 text-area-finances' : ''} ${p.niveaux?.total === 'inconnu' ? 'border-b-2 border-dashed border-alert text-alert' : p.niveaux?.total === 'repris' ? 'border-b-2 border-dotted border-attention text-attention' : ''}`}>{p.totalField}</span><span className={`text-xs ${p.doutes?.devise ? 'text-attention border-b-2 border-dotted border-attention' : 'text-cave-400'}`}>CHF</span>{p.corriges?.total ? <s data-dp="total-avant" className="font-mono text-base text-cave-400">{p.corriges.total}</s> : null}
      {p.statut ? <button type="button" aria-label={libelle} title={libelle} onClick={p.onLignes} {...(p.niveaux?.lignes && p.niveaux.lignes !== 'sur' ? { 'data-dp-niveau': p.niveaux.lignes } : {})} className={`ml-auto inline-flex min-h-7 shrink-0 items-center gap-1 rounded-control border bg-cave-950 px-2 text-sm text-cave-200 ${p.niveaux?.lignes === 'inconnu' ? 'border-dashed border-alert' : p.niveaux?.lignes === 'repris' ? 'border-dashed border-attention' : 'border-cave-700'}`}>{icone}<span className="font-mono">{p.nLignes}</span>&nbsp;ligne{p.nLignes > 1 ? 's' : ''}</button> : null}</div>
    {p.sommeDesLignes ? <p className={`${g} text-xs text-cave-400`}>somme des lignes</p> : null}
    {p.portCents !== null ? <button type="button" data-dp="port" aria-expanded={p.portOuvert} onClick={p.onPort} className={`${g} min-h-6 self-start text-left text-xs text-cave-400 underline decoration-dotted underline-offset-2`}>dont port <span className="font-mono text-cave-200">{p.portCents}</span></button> : null}
    {p.drive === 'a-connecter' ? <button type="button" onClick={p.onDrive} className={`${g} min-h-7 inline-flex items-center self-start rounded-control border border-dashed border-attention px-2 text-sm text-attention`}>Drive à connecter</button> : null}
    {p.sousTotal ? <div className={`${g} min-w-0`}>{p.sousTotal}</div> : null}
    {p.barre.length > 0 ? <div data-dp="barre" className={`${g} flex h-2.5 overflow-hidden rounded-full border border-cave-800 bg-cave-950`} aria-label={`Les ${p.barre.length} lignes, à la largeur de leur montant`}>
      {p.barre.map(i => <i key={i.id} data-dp-groupe={i.groupe} title={i.nom} onClick={() => p.onBarre(i.id)} className={`block h-full cursor-pointer border-r-[1.5px] border-cave-950 last:border-r-0 ${TEINTE[i.groupe]} ${i.ouvert ? 'dp-p3c-hachure' : ''}`} style={{ flexGrow: Math.max(i.cents, 1) }}/>)}
    </div> : null}
    {p.sceau ? <div className="col-start-2 row-span-4 row-start-2 self-start">{p.sceau}</div> : null}
  </section>;
}

/** `lectures` : la rangée « Lectures ●●◌ » de l'attente (sa maquette d-06) : `faites` points pleins sur `sur` ; le dernier, pointillé, est la 3.8 en route. */
export interface Rang { ok: boolean | null; texte: string; valeur: string; lectures?: { faites: number; sur: number } }
export function Preuve(p: { rangees: Rang[]; corriges: string[]; remarques: string[]; cached: boolean; visee: boolean; onRangee: () => void; propositions?: string | null; children?: React.ReactNode }) {
  return <section data-dp="preuve" aria-label="Preuve de la lecture" data-dp-visee={p.visee ? '1' : undefined} className={`scroll-mt-12 rounded-panel border border-cave-800 px-2 pb-1 pt-0.5 ${p.visee ? 'dp-p3c-visee' : ''}`}>
    {/* B2 n° 15 : la première colonne prend la largeur de son contenu (au plus 62 %, sauf libellé sans retour à la ligne) : « Somme = imprimé 110,40 ≠ 110,04 » tient sur une ligne. */}
    <div className="grid grid-cols-[fit-content(62%)_minmax(0,1fr)] gap-x-2">
      {/* Une rangée ne sort jamais de sa case : le bouton rétrécit (`min-w-0`) et rogne (`overflow-hidden`), la valeur est tronquée d'abord, le libellé ne rétrécit qu'en dernier. */}
      {/* Une valeur longue (« 110,40 ≠ 110,04 ») prend la largeur entière : le libellé reste sur une ligne, sans chevaucher la valeur. */}
      {p.rangees.map((r, i) => <button key={i} type="button" onClick={p.onRangee} className={`flex min-h-[26px] w-full min-w-0 items-center gap-1 border-b border-cave-800 text-left text-sm ${r.valeur.length > 7 ? 'col-span-2' : ''}`}>
        {r.lectures ? null : r.ok === true ? <Check size={14} className="shrink-0 text-hop"/> : <span className="w-3.5 shrink-0 text-center text-cave-400">·</span>}
        {/* Sans valeur (non contrôlé), le libellé dit tout : il passe à la ligne plutôt que d'être rogné (« Qté × prix non contr… » à 390). */}
        <span className={`min-w-0 flex-1 ${r.valeur || r.lectures ? 'whitespace-nowrap' : 'whitespace-normal'} text-left leading-tight text-cave-200`}>{r.texte}</span>{r.lectures ? <span data-dp="lectures-points" role="img" aria-label={`${r.lectures.faites} lectures sur ${r.lectures.sur}`} className="ml-auto inline-flex items-center gap-[3px]">{Array.from({ length: r.lectures.sur }, (_, k) => <i key={k} className={`size-2 rounded-full ${k < r.lectures!.faites ? 'bg-cave-200' : 'border-[1.5px] border-dashed border-cave-200'}`}/>)}</span> : <b className="ml-auto shrink-0 whitespace-nowrap pl-1 font-mono font-medium text-cave-50">{r.valeur}</b>}</button>)}
      {/* Les propositions de la lecture (« 14 proposées par la lecture, à vérifier ») vivent ici, dans la case libre de la grille quand le nombre de rangées est impair (compact), sinon sur une rangée entière. */}
      {p.propositions ? <p data-dp="propositions" className={`flex items-center text-xs leading-[13px] text-attention ${p.rangees.length % 2 === 1 ? '' : 'col-span-2'}`}>{p.propositions}</p> : null}
    </div>
    {p.children}
    {/* A4 : aucun texte sous les puces (« Champs corrigés… », « Lecture déjà disponible… » : hors de sa maquette ; le second est au « Détail »). */}
    {p.remarques.length ? <ul className="mt-1 list-disc space-y-1 break-words pl-4 text-xs text-cave-200">{p.remarques.map(r => <li key={r}>{r}</li>)}</ul> : null}
  </section>;
}

export interface Rond { id: string; numero: number; nom: string; fait: boolean }
/** `niveau` : un compte de niveau (D277, « n à contrôler » jaune, « n à remplir » rouge), hors de la partition des liens. */
export interface CompteItem { cle: string; n: number; mot: string; lien: LienStock; ronds: Rond[]; fait: boolean; ids: string[]; extra?: string; actif: boolean; niveau?: Niveau; /** Lenteur D (sa maquette `d-lue`) : la puce « ↻ N corrigées », au geste de filtre des autres puces, sur le bleu des corrections. */ corrigee?: boolean }
/** Les comptes de liens : un toucher filtre la liste sur eux. Un point qui pèse y porte son rond numéroté (le même que sa chip). Un compte nul ne s'affiche pas (D275). */
export function Comptes({ items, onCompte }: { items: CompteItem[]; onCompte: (c: CompteItem) => void }) {
  return <div data-dp="compte-liens" className="flex flex-wrap gap-x-1 gap-y-0.5 pt-1">
    {items.filter(c => c.n > 0).map(c => <button key={c.cle} type="button" data-va={c.cle} {...(c.niveau ? { 'data-dp-niveau': c.niveau } : {})} aria-pressed={c.actif} onClick={() => onCompte(c)}
      className={`inline-flex min-h-6 items-center gap-0.5 rounded-control px-1 text-xs text-cave-200 ${c.actif ? `dp-p3c-on dp-p3c-on-${c.corrigee ? 'finances' : c.niveau === 'inconnu' ? 'alert' : c.niveau === 'repris' ? 'attention' : 'straw'}` : c.corrigee ? 'border-[1.5px] border-solid border-area-finances bg-area-finances/10 text-area-finances' : c.niveau === 'inconnu' ? 'border-[1.5px] border-dashed border-alert bg-alert/5 text-cave-50' : c.niveau === 'repris' ? 'border-[1.5px] border-dashed border-attention bg-attention/5 text-cave-50' : c.ronds.length ? `border-[1.5px] ${c.fait ? 'border-solid border-cave-700 bg-cave-950' : 'border-dashed border-attention bg-attention/5 text-cave-50'}` : ''}`}>
      {c.corrigee ? <RefreshCw size={14} strokeWidth={2.2} aria-hidden className="mr-0.5 shrink-0"/> : c.niveau ? <i aria-hidden className={`mx-0.5 size-2 shrink-0 rounded-full ${c.niveau === 'inconnu' ? 'bg-alert' : 'bg-attention'}`}/> : <PictoLien lien={c.lien} size={16}/>}<b className={`font-mono font-semibold ${c.niveau === 'inconnu' ? 'text-alert' : c.niveau === 'repris' ? 'text-attention' : 'text-cave-50'}`}>{c.n}</b> {c.mot}{c.extra && !c.fait ? <span className="font-mono"> {c.extra}</span> : null}
      {c.ronds.map(r => <span key={r.id} role="img" data-dp-rond={r.id} aria-label={`${r.numero} ${r.nom}${r.fait ? ' réglé' : ''}`}
        className={`inline-flex size-4 items-center justify-center rounded-full font-mono text-xs leading-none ${r.fait ? 'bg-hop text-cave-950' : 'border-[1.5px] border-dashed border-attention bg-cave-950 text-attention'}`}>{r.numero}</span>)}
    </button>)}
  </div>;
}
