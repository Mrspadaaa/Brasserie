// Le bloc de contrôles refait (voie t1) : même cadre, même grille que la « Preuve » de p3c-3, mais chaque ligne dit ses deux valeurs, son écart et son verdict, et une pastille d'erreur
// mène au geste. Plus la mini recherche dans les lignes et la bande « ce qui manque ». Aucune donnée n'est changée ici.
import React from 'react';
import { AlertCircle, Check, Flag, Plus, Search, X, FileText } from 'lucide-react';
import { Bandeau } from '../depense/Recap';
import type { RangControle, Renvoi } from './controlesCroises';

export interface PropsControles {
  rangs: RangControle[];
  drapeau: boolean;
  /** « 74,45 CHF · 2 articles » : l'en-tête du drapeau. */
  resume: string;
  remarques: string[];
  visee: boolean;
  /** Un toucher sur une ligne ordinaire mène à la liste ; une pastille d'erreur à son geste. */
  onRenvoi: (r: Renvoi, rang?: RangControle) => void;
}

function Rangee({ r, onRenvoi }: { r: RangControle; onRenvoi: (r: Renvoi, rang?: RangControle) => void }) {
  /* d2 (critique 12) : les contrôles « rien à signaler » ne méritent pas une rangée pleine : une petite ligne. */
  if (r.cle === 'verifies') return <p data-dp="controle-discret" data-dp-controle-cle="verifies" data-dp-verdict="ok" title={r.detail} className="col-span-2 flex items-center gap-1 py-0.5 text-xs leading-tight text-cave-400"><Check size={12} aria-hidden className="shrink-0 text-hop"/>{r.texte} : rien à signaler</p>;
  const erreur = r.verdict === 'ecart';
  const corps = <>
    {erreur ? <span aria-hidden className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-attention text-[10px] font-bold leading-none text-attention">!</span> : r.lectures ? null : r.verdict === 'ok' ? <Check size={14} aria-hidden className="shrink-0 text-hop"/> : <span aria-hidden className="w-3.5 shrink-0 text-center text-cave-400">·</span>}
    <span className={`min-w-0 flex-1 text-left leading-tight ${erreur ? 'font-medium text-cave-50' : 'text-cave-200'} ${r.valeurs || r.lectures ? 'whitespace-nowrap' : 'whitespace-normal'}`}>{r.texte}</span>
    {r.lectures ? <span data-dp="lectures-points" role="img" aria-label={`${r.lectures.faites} lectures sur ${r.lectures.sur}`} className="ml-auto inline-flex items-center gap-[3px]">{Array.from({ length: r.lectures.sur }, (_, k) => <i key={k} className={`size-2 rounded-full ${k < r.lectures!.faites ? 'bg-cave-200' : 'border-[1.5px] border-dashed border-cave-200'}`}/>)}</span>
      : <b className="ml-auto shrink-0 whitespace-nowrap pl-1 font-mono font-medium text-cave-50">{r.valeurs}{r.ecart ? <span data-dp="ecart" className="ml-1.5 text-attention">{r.ecart}</span> : null}</b>}
  </>;
  const verdict = erreur ? 'ne concorde pas' : r.verdict === 'ok' ? 'concorde' : 'non vérifiable';
  if (erreur && r.renvoi) return <button type="button" data-dp="controle" data-dp-controle-cle={r.cle} data-dp-verdict="ecart" data-dp-renvoi={r.renvoi} aria-label={`${r.texte} ${r.valeurs}${r.ecart ? `, écart ${r.ecart}` : ''} : ${verdict}. ${r.geste ?? ''}`} onClick={() => onRenvoi(r.renvoi!, r)}
    className="col-span-2 my-0.5 flex min-h-[34px] w-full min-w-0 flex-col justify-center gap-0 rounded-control border border-dashed border-attention/60 bg-attention/5 px-1.5 text-left text-sm">
    <span className="flex w-full min-w-0 items-center gap-1">{corps}</span>
    {r.detail ? <span data-dp="controle-detail" className="pl-[18px] text-xs leading-[14px] text-cave-300">{r.detail}</span> : null}
    {r.note ? <span data-dp="controle-note" className="pl-[18px] text-xs leading-[14px] text-cave-300">{r.note}</span> : null}
    {r.geste ? <span className="pl-[18px] text-xs leading-[14px] text-attention">{r.geste} ›</span> : null}
  </button>;
  const ligne = <button type="button" data-dp="controle" data-dp-controle-cle={r.cle} data-dp-verdict={r.verdict} aria-label={`${r.texte} ${r.valeurs} : ${verdict}${r.detail ? `. ${r.detail}` : ''}`} title={r.detail} onClick={() => onRenvoi('liste', r)} className="col-span-2 flex min-h-[26px] w-full min-w-0 items-center gap-1 border-b border-cave-800 text-left text-sm">{corps}</button>;
  return r.note ? <><div className="col-span-2">{ligne}</div><p data-dp="controle-note" className="col-span-2 border-b border-cave-800 pb-0.5 pl-[18px] text-xs leading-[14px] text-cave-300">{r.note}</p></> : ligne;
}

/** Le bloc « Somme ≠ imprimé · Qté × prix · Lectures » refait. `children` : les comptes de liens (inchangés). */
export function ControlesCroisesBloc(p: PropsControles & { children?: React.ReactNode }) {
  return <section data-dp="preuve" aria-label="Preuve de la lecture" data-dp-visee={p.visee ? '1' : undefined} data-dp-drapeau={p.drapeau ? '1' : undefined} className={`scroll-mt-12 rounded-panel border px-2 pb-1 pt-0.5 ${p.drapeau ? 'border-attention/50' : 'border-cave-800'} ${p.visee ? 'dp-p3c-visee' : ''}`}>
    {p.drapeau ? <p data-dp="drapeau" role="status" className="flex min-h-[26px] items-center gap-1.5 border-b border-attention/30 text-sm font-medium text-attention"><Flag size={14} aria-hidden className="shrink-0"/><span className="min-w-0">À vérifier{p.resume ? ` · ${p.resume}` : ''}</span></p> : null}
    <div className="grid grid-cols-2 gap-x-2">
      {p.rangs.map(r => <Rangee key={r.cle} r={r} onRenvoi={p.onRenvoi}/>)}
    </div>
    {p.children}
    {p.remarques.length ? <ul className="mt-1 list-disc space-y-1 break-words pl-4 text-xs text-cave-200">{p.remarques.map(r => <li key={r}>{r}</li>)}</ul> : null}
  </section>;
}

/** Le verdict de la lecture : le bandeau (inchangé) puis le bloc refait avec ses comptes. */
export function VerificationCroisee(p: { bandeau: React.ComponentProps<typeof Bandeau>; preuve: PropsControles; comptes: React.ReactNode; bandeauRef?: React.Ref<HTMLDivElement> }) {
  return <section aria-label="Vérification du justificatif" className="space-y-1.5">
    <div ref={p.bandeauRef}><Bandeau {...p.bandeau}/></div>
    <ControlesCroisesBloc {...p.preuve}>{p.comptes}</ControlesCroisesBloc>
  </section>;
}

/**
 * La mini recherche, dans la bande des lignes : une loupe, un champ discret, « × » (ou Échap) pour vider. Elle filtre la liste (les groupes s'ouvrent sur les trouvailles) ;
 * une saisie sans résultat dit que l'article manque. Jamais `type="number"` : un montant se tape en texte.
 */
export function RechercheLignes(p: { valeur: string; onChange: (v: string) => void; onFocus?: () => void; nTrouvees: number; nTotal: number; inputRef: React.Ref<HTMLInputElement>; zoneRef?: React.Ref<HTMLDivElement> }) {
  const saisie = p.valeur.trim();
  return <div ref={p.zoneRef} data-dp="recherche" role="search" className="flex flex-col gap-0.5 px-2 pb-1 pt-1.5">
    <label className="relative flex min-h-8 items-center">
      <Search size={14} aria-hidden className="pointer-events-none absolute left-2 text-cave-400"/>
      <input ref={p.inputRef} type="text" inputMode="search" enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false} value={p.valeur} placeholder="Chercher une ligne : nom, référence, montant" aria-label="Chercher dans les lignes lues"
        onChange={e => p.onChange(e.target.value)} onFocus={p.onFocus}
        onKeyDown={e => { if (e.key === 'Escape' && p.valeur) { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); p.onChange(''); } }}
        className="h-8 min-w-0 flex-1 rounded-control border border-cave-700 bg-cave-950 pl-7 pr-8 text-sm text-cave-50 placeholder:text-cave-400"/>
      {p.valeur ? <button type="button" aria-label="Vider la recherche" onClick={() => p.onChange('')} className="absolute right-0 flex size-8 items-center justify-center text-cave-300"><X size={14}/></button> : null}
    </label>
    {saisie ? <p data-dp="recherche-etat" role="status" className={`px-0.5 text-xs ${p.nTrouvees ? 'text-cave-300' : 'font-medium text-attention'}`}>
      {p.nTrouvees ? `${p.nTrouvees} ligne${p.nTrouvees > 1 ? 's' : ''} sur ${p.nTotal}` : `Aucune ligne ne contient « ${saisie} » : l’article manque dans les lignes lues`}</p> : null}
  </div>;
}

/** Ce qui manque et les gestes : rechercher, ajouter la ligne manquante, relire la photo. Une ligne, sans phrase longue. */
export function BandeManque(p: { texte: string; causes: string; onChercher?: () => void; onAjouter: () => void; onPhoto?: () => void; ajouterOff?: boolean }) {
  return <div data-dp="manque" role="status" className="mx-2 mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control border border-dashed border-attention/60 bg-attention/5 px-2 py-1 text-xs text-cave-50">
    <span className="flex min-w-0 items-center gap-1"><AlertCircle size={13} aria-hidden className="shrink-0 text-attention"/><span><strong className="font-semibold">{p.texte}</strong><span className="text-cave-300"> · {p.causes}</span></span></span>
    <span className="ml-auto flex items-center gap-1">
      {p.onChercher ? <button type="button" onClick={p.onChercher} className="inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-control border border-cave-600 px-2 text-cave-50"><Search size={12} aria-hidden/>Chercher</button> : null}
      <button type="button" disabled={p.ajouterOff} onClick={p.onAjouter} className="inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-control border border-cave-600 px-2 text-cave-50 disabled:opacity-50"><Plus size={12} aria-hidden/>Ajouter la ligne</button>
      {p.onPhoto ? <button type="button" onClick={p.onPhoto} className="inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-control border border-cave-600 px-2 text-cave-50"><FileText size={12} aria-hidden/>Photo</button> : null}
    </span>
  </div>;
}
