import React, { useRef, useState } from 'react';
import { Archive, Wrench, Wheat } from 'lucide-react';
import type { ForecastItem } from '../../../domain/finance/forecast';
import type { FinancialPlan } from '../../../domain/finance/types';
import { upgradeDetails } from '../../../domain/finance/upgrades';
import { FinanceService } from '../../../services/financeService';
import { Feuille } from './Feuille';
import type { MesureProjet } from './mesureProjet';
import { centimesDeSaisie, jourCourt, litreFr, montant } from './format';

const DUREES = [3, 5, 8] as const;
type Etat = { kind: 'ok' | 'attente' | 'erreur'; texte: string } | null;

/** Écriture d'un projet : écrite en local tout de suite, confirmée par le serveur ensuite (`saveUpgrade` attend jusqu'à 15 s). Hors ligne, c'est « en attente », pas une erreur. */
function useEcriture() {
  const verrou = useRef(false);
  const [occupe, setOccupe] = useState(false), [etat, setEtat] = useState<Etat>(null);
  const ecrire = async (plan: FinancialPlan, apres?: () => void) => {
    if (verrou.current) return;
    verrou.current = true; setOccupe(true); setEtat(null);
    try { await FinanceService.saveUpgrade(plan); setEtat({ kind: 'ok', texte: 'Enregistré.' }); apres?.(); }
    catch (e) {
      const enAttente = e instanceof Error && e.name === 'DocumentWriteError' && /pending/i.test(`${(e as { status?: string }).status ?? ''}`);
      setEtat(enAttente ? { kind: 'attente', texte: 'Enregistré sur cet appareil, en attente de synchro.' } : { kind: 'erreur', texte: e instanceof Error ? e.message : 'Le projet n’a pas pu être enregistré.' });
    } finally { verrou.current = false; setOccupe(false); }
  };
  return { ecrire, occupe, etat };
}

interface ProjetProps { plan: FinancialPlan; mesure: MesureProjet; titreFin: string; prix: string; onPrix: (saisie: string) => void; onClose: () => void; onOuvrir: () => void }
export function FicheProjet({ plan, mesure, titreFin, prix, onPrix, onClose, onOuvrir }: ProjetProps) {
  const detail = upgradeDetails(plan), { ecrire, occupe, etat } = useEcriture();
  const [deplace, setDeplace] = useState(false), [mois, setMois] = useState(plan.date.slice(0, 7));
  const prixC = centimesDeSaisie(prix);
  const duree = detail.usefulLifeYears;
  const bas = mesure.pointBas, fin = mesure.soldeFinCents;
  return <Feuille titre={<><Wrench size={16} aria-hidden="true" /> {plan.title}, {montant(plan.amountCents)} CHF</>} onClose={onClose}>
    <p className="prv-note">{detail.estimateSource === 'quote' ? 'devis' : 'estimé'} · {plan.date ? jourCourt(plan.date) : 'date à choisir'}</p>
    <div className="prv-row"><span>Usure sur</span>
      <span className="prv-sel" role="group" aria-label="Durée d’usure">{DUREES.map(a => <button key={a} type="button" disabled={occupe} aria-pressed={duree === a} onClick={() => void ecrire({ ...plan, upgrade: { ...detail, usefulLifeYears: a } })}>{a} ans</button>)}</span></div>
    <div className="prv-gr">
      <div className="prv-k"><span>Usure par an</span><b>{mesure.usureParAnCents == null ? 'à renseigner' : montant(mesure.usureParAnCents)}</b></div>
      <div className="prv-k"><span>Mon litre</span><b>{mesure.litreAvant == null ? '—' : litreFr(mesure.litreAvant)}{' → '}{mesure.litreApres == null ? '—' : litreFr(mesure.litreApres)}</b></div>
      <div className="prv-k"><span>{titreFin}</span><b className={fin != null && fin < 0 ? 'prv-rt' : ''}>{fin == null ? 'à compléter' : montant(fin)}</b></div>
      <div className="prv-k"><span>Plus bas</span><b className={bas && bas.soldeCents < 0 ? 'prv-rt' : ''}>{bas ? montant(bas.soldeCents) : 'à compléter'}{bas && <small> le {jourCourt(bas.date)}</small>}</b></div>
      <div className="prv-k prv-l"><span>Pour rester à zéro</span>
        {bas && bas.soldeCents >= 0 ? <b>Tu restes au-dessus de zéro</b> : <>
          <b>{mesure.bouteillesPourZero == null ? 'à compléter' : `${mesure.bouteillesPourZero} bouteilles 33 cl${prixC ? ` à ${montant(prixC)}` : ''}`}</b>
          <small>en trésorerie, avant coût de production</small></>}
        <label className="prv-prix">Prix d’une bouteille 33 cl (CHF)<input inputMode="decimal" value={prix} onChange={e => onPrix(e.target.value)} placeholder="5,00" autoComplete="off" /></label>
        {mesure.bouteillesPourPayer != null && <small>Pour payer le matériel (sur la marge) : {mesure.bouteillesPourPayer} bouteilles</small>}
      </div>
    </div>
    {mesure.avertissements.length > 0 && <details className="prv-lim"><summary>Limites ({mesure.avertissements.length})</summary><ul>{mesure.avertissements.map(a => <li key={a}>{a}</li>)}</ul></details>}
    {deplace && <div className="prv-row"><label>Payer en <input type="month" value={mois} onChange={e => setMois(e.target.value)} /></label>
      <button type="button" className="prv-prim" disabled={occupe || !/^\d{4}-\d{2}$/.test(mois)} onClick={() => void ecrire({ ...plan, date: `${mois}-01`, upgrade: { ...detail, datePrecision: 'month' } }, () => setDeplace(false))}>Valider</button></div>}
    {etat && <p className={`prv-etat prv-${etat.kind}`} role="status">{etat.texte}</p>}
    <div className="prv-acts">
      <button type="button" className="prv-sec" disabled={occupe} onClick={() => void ecrire({ ...plan, status: 'draft' }, onClose)}><Archive size={14} aria-hidden="true" /> Retirer</button>
      <button type="button" className="prv-sec" disabled={occupe} aria-expanded={deplace} onClick={() => setDeplace(!deplace)}>Déplacer</button>
      <button type="button" className="prv-prim" onClick={onOuvrir}>Ouvrir le projet</button></div>
  </Feuille>;
}

interface BrassinProps { titre: string; items: ForecastItem[]; litre: string | null; onClose: () => void; onOuvrir: () => void }
/** La fiche du brassin : ses sorties à leurs dates (domaine d2), d'où vient chaque montant ; la somme est le total de c3a. */
export function FicheBrassin({ titre, items, litre, onClose, onOuvrir }: BrassinProps) {
  const total = items.reduce((n, i) => n + i.amountCents, 0);
  return <Feuille titre={<><Wheat size={16} aria-hidden="true" /> {titre}, brassin prévu</>} onClose={onClose}>
    <p className="prv-note">estimé · se met à jour seul (recette, stock, factures)</p>
    <ul className="prv-lignes">{items.map(i => <li key={i.id}><div className="prv-lg"><span>{i.label.split(' · ').slice(1).filter(p => p !== 'date estimée' && !p.startsWith('partiel')).join(' · ')}{i.label.includes('date estimée') ? ' · date estimée' : ''}</span><b>{montant(-i.amountCents)}</b><small>{jourCourt(i.date)}</small></div>
      {i.lines?.map(l => <div className="prv-lg prv-o" key={l.label}><span>{l.label} · {l.origin}</span><b>{montant(l.amountCents)}</b></div>)}
      {i.partial?.length ? <p className="prv-etat prv-attente">partiel, à compléter : {i.partial.join(', ')}</p> : null}</li>)}</ul>
    <div className="prv-gr"><div className="prv-k prv-l"><span>Total en caisse</span><b>{montant(-total)}</b>{litre && <small>Mon litre : {litre} le litre</small>}</div></div>
    <div className="prv-acts"><button type="button" className="prv-prim" onClick={onOuvrir}>Ouvrir le budget</button></div>
  </Feuille>;
}
