import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { EscalierCaisse } from '../../../domain/finance/analyse';
import { compte } from '../../../services/plural';
import { Escalier } from './Escalier';
import { chf, jjmm, nomSource, pluriel, signe } from './format';
import { Pourquoi, type TextePourquoi } from './Pourquoi';

export interface VueProps {
  /** « 30 jours », « 90 jours », « 12 mois » : l'unité de la période, dite dans la phrase. */
  duree: string;
  onJournal: (request: { scope: 'all'; category?: string; allDates?: boolean; filter?: string; month?: string }) => void;
  onTransaction: (id: string) => void;
  onProfile: () => void;
  onPrevisions: () => void;
}
export interface CaisseVueProps extends VueProps {
  esc: EscalierCaisse;
  soldeNote?: { amountCents: number; date: string; confirmed: boolean };
  gagneCents: number;
  ventes: number;
  projetsSansDate: number;
  onBrowseProjects: () => void;
  pourquoi: TextePourquoi;
}

/** Figure 1 et 5 : la phrase-réponse, les trois cases (réel / prévu / l'an dernier), l'escalier, les renvois. Les nombres viennent de `escalierCaisse`. */
export function CaisseVue({ esc, duree, soldeNote, gagneCents, ventes, projetsSansDate, onBrowseProjects, onJournal, onTransaction, onProfile, onPrevisions, pourquoi }: CaisseVueProps) {
  const aCompleter = esc.incertains.length;
  const plus = esc.incertains.length > 0 ? '≤ ' : '';
  const prevu = esc.prevu;
  const refPrevu = prevu ? (esc.connu ? prevu.finCents : prevu.ecartCents) : null;
  const refAn = esc.connu ? esc.anDernier.finCents : esc.anDernier.ecartCents;
  const vide = esc.marches.length === 0;
  return <>
    <p className="ana-dit" aria-live="polite">
      {vide ? <>Aucun paiement noté sur {duree}.</> : esc.connu ? <>
        Sur {duree}, la caisse {esc.ecartCents >= 0 ? 'monte' : 'baisse'} de <b className={esc.ecartCents >= 0 ? 'ana-ok' : 'ana-mal'}>{signe(esc.ecartCents)} CHF</b>
        {prevu && <> (prévu <b>{signe(prevu.ecartCents)}</b>)</>}
        {esc.pireBaisse && <> · <span className="ana-n">1</span> pire baisse : {esc.pireBaisse.libelle} <b>{signe(esc.pireBaisse.cents)}</b></>}
        {esc.pasPrevu.length > 0 && <> · <span className="ana-n">2</span> {pluriel(esc.pasPrevu.length, 'paiement pas prévu', 'paiements pas prévus')}</>}
      </> : <>
        Écart de la caisse sur {duree} : <b className={esc.ecartCents >= 0 ? 'ana-ok' : 'ana-mal'}>{plus}{signe(esc.ecartCents)} CHF</b>
        {ventes > 0 && <> · {pluriel(ventes, 'vente', 'ventes')}</>}
        {aCompleter > 0 && <> · <button type="button" className="ana-lien" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'unknown' })}>{pluriel(aCompleter, 'achat', 'achats')} à compléter</button></>}
        <>, gagné <b>{signe(gagneCents)}</b> (matériel à part)</>
      </>}
    </p>
    <div className="ana-cases" role="group" aria-label="Réel, prévu, l’an dernier">
      <span className="ana-reel-case">{esc.connu ? 'En caisse' : 'Écart réel'}<b className="ana-m">{plus}{esc.connu && esc.finCents !== null ? chf(esc.finCents) : signe(esc.ecartCents)}</b></span>
      {refPrevu !== null
        ? <span>┄ Prévu<b className="ana-m">{esc.connu ? chf(refPrevu) : signe(refPrevu)}</b></span>
        : <button type="button" className="ana-case-renvoi" onClick={onPrevisions}>┄ Prévu<b>Fixer un budget</b></button>}
      <span className={refAn === null ? 'ana-hach' : ''}>{esc.du.slice(0, 4) === esc.au.slice(0, 4) ? Number(esc.au.slice(0, 4)) - 1 : 'L’an dernier'}<b className={refAn === null ? '' : 'ana-m ana-gris'}>{refAn === null ? 'rien noté' : esc.connu ? chf(refAn) : signe(refAn)}</b></span>
    </div>
    {!vide && <Escalier esc={esc} onTransaction={onTransaction} onJournal={() => onJournal({ scope: 'all', allDates: true })}/>}
    {!vide && <div className="ana-leg" aria-label="Légende">
      <span><i className="ana-s-ventes"/>Ventes</span><span><i className="ana-s-chargesFixes"/>Charges fixes</span><span><i className="ana-s-brassage"/>Brassage</span>
      {esc.marches.some(m => m.source === 'materiel') && <span><i className="ana-i-mat"/>Matériel, à part du gagné</span>}
      {prevu && <span><i className="ana-i-prevu"/>prévu</span>}
      {esc.anDernier.points.length > 0 && <span><i className="ana-i-an"/>l’an dernier</span>}
    </div>}
    {!esc.connu && <button type="button" className="ana-tache" onClick={onProfile}>
      <span>{soldeNote ? <>Départ <b className="ana-m">{chf(soldeNote.amountCents)}</b> au {jjmm(soldeNote.date)}, à confirmer : sans lui, pas de caisse</> : 'Solde de départ à noter : sans lui, pas de caisse'}</span><ChevronRight size={14} aria-hidden="true"/>
    </button>}
    {projetsSansDate > 0 && <button type="button" className="ana-tache" onClick={onBrowseProjects}><span>{compte(projetsSansDate, 'projet de matériel', 'projets de matériel')}, sans date : hors du prévu</span><ChevronRight size={14} aria-hidden="true"/></button>}
    {!prevu && <button type="button" className="ana-tache ana-tache-pointille" onClick={onPrevisions}><span>Budget, Sources : rien de prévu. Poser un prévu dans Prévisions</span><ChevronRight size={14} aria-hidden="true"/></button>}
    <div className="ana-pied">
      <Pourquoi texte={pourquoi}/>
      <button type="button" className="ana-ops" onClick={() => onJournal({ scope: 'all', allDates: true })}><b className="ana-m">{esc.marches.length}</b> {esc.marches.length > 1 ? 'opérations' : 'opération'} <ChevronRight size={14} aria-hidden="true"/></button>
    </div>
  </>;
}
export { nomSource };
