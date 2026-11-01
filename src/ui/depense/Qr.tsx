// Le sceau QR de z2 (D246), porté tel quel dans l'écran en ligne : le QR suisse dessiné à droite du total, son verdict en un mot dessous ; la feuille « Ce que dit le QR »
// (IBAN et référence à copier) ; le duel du total quand le QR et la page se contredisent ; « sans QR » (cercle vide en pointillé) distinct d'un sceau absent (pas vérifié).
// Présentation seulement : la vue (`qrVue.ts`) arrive calculée ; aucun champ de la dépense n'est changé ici sans un geste du brasseur (les gestes remontent par props).
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, X } from 'lucide-react';
import type { Duel, EtatSceau, LigneFiche, VueQr } from './qrVue';

const BORD: Record<EtatSceau, string> = { ok: 'border-hop', diff: 'border-attention', partiel: 'border-cave-200', off: 'border-cave-600', wait: 'border-cave-600', sans: 'border-cave-600' };
const BARRE: Record<EtatSceau, string> = {
  ok: 'bg-hop text-white', diff: 'bg-attention font-mono text-white shadow-[inset_0_0_0_100px_rgba(0,0,0,0.14)]', partiel: 'bg-cave-200 text-white', off: 'bg-cave-800 text-cave-50', wait: 'bg-cave-400 text-white', sans: '',
};

/** Le QR suisse dessiné (croix suisse au centre) : un dessin fixe, noir sur blanc comme un vrai QR, dans les deux thèmes. */
function DessinQr({ etat }: { etat: EtatSceau }) {
  return <svg viewBox="0 0 26 26" aria-hidden="true" className={`block h-auto w-full px-2 pb-0.5 pt-1 ${etat === 'off' ? 'opacity-30' : ''} ${etat === 'wait' ? 'animate-pulse' : ''}`}>
    <g fill="#111"><rect x="1" y="1" width="7" height="7" rx="1"/><rect x="18" y="1" width="7" height="7" rx="1"/><rect x="1" y="18" width="7" height="7" rx="1"/>
      <rect x="10" y="1" width="2" height="2"/><rect x="14" y="2" width="2" height="2"/><rect x="11" y="5" width="2" height="2"/><rect x="1" y="10" width="2" height="2"/><rect x="5" y="11" width="2" height="2"/><rect x="2" y="14" width="2" height="2"/><rect x="6" y="15" width="2" height="2"/>
      <rect x="19" y="10" width="2" height="2"/><rect x="23" y="11" width="2" height="2"/><rect x="20" y="14" width="2" height="2"/><rect x="24" y="15" width="2" height="2"/><rect x="10" y="19" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/><rect x="11" y="23" width="2" height="2"/><rect x="15" y="24" width="2" height="2"/><rect x="19" y="19" width="2" height="2"/><rect x="23" y="20" width="2" height="2"/><rect x="21" y="23" width="2" height="2"/></g>
    <g fill="#fff"><rect x="3" y="3" width="3" height="3"/><rect x="20" y="3" width="3" height="3"/><rect x="3" y="20" width="3" height="3"/></g>
    <rect x="9.5" y="9.5" width="7" height="7" fill="#111"/><path d="M13 11v4M11 13h4" stroke="#fff" strokeWidth="1.5"/>
  </svg>;
}

/** Le sceau : un bouton de 64 px (QR dessiné + verdict) ; il ouvre la feuille. Illisible : le QR est barré d'une croix rouge. */
export function Sceau({ vue, ouvert, onClick }: { vue: VueQr; ouvert: boolean; onClick: () => void }) {
  return <button type="button" data-dp="sceau-qr" data-q={vue.etat} aria-label={vue.aria} aria-expanded={ouvert} aria-controls="dp-qr-fiche" onClick={onClick}
    className={`relative flex w-16 flex-col self-start overflow-hidden rounded-control border-[1.5px] bg-white p-0 ${BORD[vue.etat]}`}>
    <DessinQr etat={vue.etat}/>
    {vue.etat === 'off' ? <svg aria-hidden="true" viewBox="0 0 50 40" className="pointer-events-none absolute left-1.5 top-1 h-10 w-[50px] text-alert-strong opacity-80"><path d="M1 1l48 38M49 1L1 39" stroke="currentColor" strokeWidth="1.6"/></svg> : null}
    <b className={`block whitespace-nowrap text-center text-xs font-semibold leading-[18px] ${BARRE[vue.etat]}`}>{vue.verdict}</b>
  </button>;
}

/** « sans QR » : un cercle vide en pointillé, à la place du sceau. Ce n'est pas un bouton : il n'y a rien à ouvrir. */
export function SansQr() {
  return <span data-dp="sans-qr" role="img" aria-label="Aucun QR-facture sur ce document" className="flex w-16 flex-col items-center gap-0.5 self-start pt-0.5 text-xs text-cave-400">
    <i aria-hidden="true" className="block size-10 rounded-full border-[1.5px] border-dashed border-cave-600"/>sans QR
  </span>;
}

/** Le duel du total : « lu sur la page » face à « QR-facture », la colonne fautive en pointillé d'attention. Un toucher choisit ; le champ ne change qu'à ce geste. */
export function DuelTotal({ duel, choix, onChoix }: { duel: Duel; choix: 'lu' | 'qr' | null; onChoix: (source: 'lu' | 'qr') => void }) {
  const tuile = (source: 'lu' | 'qr', titre: string, reste: string) => {
    const pris = choix === source;
    return <button type="button" data-dp-duel={source} aria-pressed={pris} aria-label={`${titre} ${duel.prefixe}${reste}`} onClick={() => onChoix(source)}
      className={`flex min-h-10 flex-col justify-center rounded-control border-[1.5px] px-2 py-0.5 text-left text-xs leading-tight ${pris ? 'border-cave-50 bg-cave-50 text-white/80' : source === 'qr' ? 'border-attention bg-attention/5 text-cave-200' : 'border-cave-600 text-cave-200'}`}>
      {titre}<b className={`font-mono text-lg font-semibold tabular-nums ${pris ? 'text-white' : 'text-cave-50'}`}>{duel.prefixe}<u className={`no-underline ${pris ? 'border-b-2 border-dotted border-white' : 'border-b-2 border-dotted border-attention text-attention'}`}>{reste}</u></b>
    </button>;
  };
  return <div data-dp="duel" role="group" aria-label="Le total : la page ou le QR ?" className="grid grid-cols-2 gap-1.5">{tuile('lu', 'lu sur la page', duel.resteLu)}{tuile('qr', 'QR-facture', duel.resteQr)}</div>;
}

/** Le témoin des lignes : quand leur somme est celle du QR, deux sources sur trois s'accordent. Dit seulement s'il est vrai. */
export function TemoinSomme({ somme }: { somme: string }) {
  return <p data-dp="temoin" className="flex min-h-[18px] items-center gap-1 text-xs text-cave-200"><Check size={12} className="text-hop"/>Somme des lignes <b className="font-mono font-medium text-cave-50">{somme}</b> · deux contre un</p>;
}

/** « Photographier le QR » : relit seulement le QR sur une photo ; ni la facture, ni la lecture ne changent. */
export function BoutonPhotoQr({ onClick }: { onClick: () => void }) {
  return <button type="button" data-dp="photographier-qr" onClick={onClick} className="inline-flex min-h-7 items-center gap-1.5 self-start whitespace-nowrap rounded-control border-[1.5px] border-dashed border-attention bg-attention/5 px-2.5 text-sm text-attention"><Camera size={14}/>Photographier le QR</button>;
}

async function copierTexte(texte: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(texte); return true; }
  } catch { /* repli ci-dessous */ }
  try {
    const zone = document.createElement('textarea');
    zone.value = texte; zone.setAttribute('readonly', ''); zone.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(zone); zone.select();
    const ok = document.execCommand('copy');
    zone.remove();
    return ok;
  } catch { return false; }
}

function IconeStatut({ statut }: { statut: LigneFiche['statut'] }) {
  if (statut === 'ok') return <Check size={14} className="text-hop" aria-label="d'accord"/>;
  if (statut === 'ko') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-attention" role="img" aria-label="écart"><path d="M3 5h8M3 9h8M9 3l-4 8"/></svg>;
  if (statut === 'vide') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-cave-400" aria-hidden="true"><path d="M3 7h8"/></svg>;
  return null;
}

/** La feuille « Ce que dit le QR » : en bas de l'écran au téléphone, en place sur ordinateur. IBAN et référence se copient (jamais remplacés par la lecture). */
export function FicheQr({ vue, ouvert, onFermer, onPhoto }: { vue: VueQr; ouvert: boolean; onFermer: () => void; onPhoto: () => void }) {
  const [copie, setCopie] = useState<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (minuterie.current) clearTimeout(minuterie.current); }, []);
  if (!ouvert) return null;
  const copier = async (cle: string, texte: string) => {
    if (await copierTexte(texte)) { setCopie(cle); if (minuterie.current) clearTimeout(minuterie.current); minuterie.current = setTimeout(() => setCopie(null), 1500); }
  };
  return <>
    <div data-dp="qr-voile" aria-hidden="true" onClick={onFermer} className="fixed inset-0 z-[70] bg-black/35 lg:hidden"/>
    <section id="dp-qr-fiche" data-dp="qr-fiche" aria-label="Ce que dit le QR" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onFermer(); } }}
      className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-w-[480px] rounded-t-panel border border-cave-800 bg-cave-950 px-3 pb-3 pt-2 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.4)] lg:static lg:z-auto lg:max-w-none lg:rounded-panel lg:px-2.5 lg:py-1.5 lg:shadow-none">
      <h2 className="flex min-h-8 items-center gap-2 text-base font-semibold text-cave-50">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="1.5" y="1.5" width="5" height="5"/><rect x="9.5" y="1.5" width="5" height="5"/><rect x="1.5" y="9.5" width="5" height="5"/><rect x="9.5" y="9.5" width="1.6" height="1.6" fill="currentColor" stroke="none"/><rect x="12.9" y="12.9" width="1.6" height="1.6" fill="currentColor" stroke="none"/><rect x="11.2" y="11.2" width="1.6" height="1.6" fill="currentColor" stroke="none"/></svg>
        <span>Ce que dit le QR</span>
        <button type="button" aria-label="Fermer ce que dit le QR" onClick={onFermer} className="ml-auto flex size-7 items-center justify-center rounded-control text-cave-400 lg:hidden"><X size={14}/></button>
      </h2>
      <div>{vue.lignes.map((ligne, i) => ligne.cle === 'probleme'
        ? <p key={i} className="border-b border-cave-800 py-1 text-xs text-cave-200 last:border-0">{ligne.valeur}</p>
        : <div key={ligne.cle} data-dp-qr-ligne={ligne.cle} className="grid min-h-[30px] grid-cols-[18px_5.25rem_1fr_auto] items-center gap-x-1.5 gap-y-1 border-b border-cave-800 py-0.5 text-sm last:border-0">
          <span className="flex items-center"><IconeStatut statut={ligne.statut === 'abs' ? null : ligne.statut}/></span>
          <span className="text-cave-200">{ligne.libelle}</span>
          <b className={ligne.statut === 'abs' ? 'justify-self-start self-center border-b border-dotted border-cave-600 font-normal text-cave-200' : ligne.statut === 'vide' ? 'font-normal text-cave-200' : 'break-words font-mono font-medium text-cave-50'} style={ligne.surDeuxLignes ? { whiteSpace: 'pre-line' } : undefined}>{ligne.valeur}</b>
          {ligne.copier
            ? <button type="button" data-dp="copier" aria-label={`Copier ${ligne.libelle}`} onClick={() => void copier(ligne.cle, ligne.copier!)} className={`inline-flex h-6 min-h-6 items-center gap-0.5 whitespace-nowrap rounded-control border px-2 text-xs ${copie === ligne.cle ? 'border-hop text-hop' : 'border-cave-600 text-cave-50'}`}>{copie === ligne.cle ? <><Check size={12}/>copié</> : 'Copier'}</button>
            : <em className={`whitespace-nowrap text-xs not-italic ${ligne.statut === 'ko' ? 'font-semibold text-attention' : 'text-cave-200'}`}>{ligne.note}</em>}
        </div>)}</div>
      {vue.photographier ? <div className="pt-1.5"><BoutonPhotoQr onClick={onPhoto}/></div> : null}
    </section>
  </>;
}
