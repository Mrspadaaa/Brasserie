import React from 'react';
import { ChevronRight, Plus, Settings2, Wheat, Wrench } from 'lucide-react';
import type { ForecastItem } from '../../../domain/finance/forecast';
import type { FinancialPlan } from '../../../domain/finance/types';
import { isUpgradePlan } from '../../../domain/finance/upgrades';
import { Feuille } from './Feuille';
import type { Marche } from './escalier';
import { jourCourt, montant } from './format';
import type { StyleEtiquette } from './EscalierSvg';

/** L'annexe de p5b : la liste de p4a (numérotée, pastille de source, montant, « → solde après »), et au second plan les gestes de l'ancien écran. */
interface Props {
  marches: Marche[]; styleDe: (i: ForecastItem) => StyleEtiquette; titreDe: (i: ForecastItem) => string;
  plansListes: FinancialPlan[]; undated: { id: string; label: string; amountCents: number; direction: 'in' | 'out' }[];
  /** CP-18 : une pièce sans échéance ouvre sa pièce, où la dater ; absent, la ligne reste une phrase. */
  onUndated?: (id: string) => void;
  onItem: (i: ForecastItem) => void; onPlan: (p: FinancialPlan) => void; onAdd: () => void; onBudget: () => void; onProjets: () => void; onProfile: () => void; onClose: () => void;
}
const PASTILLE: Record<StyleEtiquette, string> = { facture: 'facture', prevu: 'prévu', brassin: 'brassin', projet: 'projet', entree: 'entrée' };

export function ListeSorties({ marches, styleDe, titreDe, plansListes, undated, onUndated, onItem, onPlan, onAdd, onBudget, onProjets, onProfile, onClose }: Props) {
  const lignes = marches.flatMap(m => m.items.map((item, k) => ({ item, apres: k === m.items.length - 1 ? m.soldeApresCents : null })));
  return <Feuille titre="Sorties et entrées prévues" onClose={onClose} haute>
    <div className="prv-outils">
      <button type="button" className="prv-sec" onClick={onAdd}><Plus size={14} aria-hidden="true" /> Ajouter une prévision</button>
      <button type="button" className="prv-sec" onClick={onBudget}><Wheat size={14} aria-hidden="true" /> Budget d’un brassin</button>
      <button type="button" className="prv-sec" onClick={onProjets}><Wrench size={14} aria-hidden="true" /> Mes projets de matériel</button>
      <button type="button" className="prv-sec" onClick={onProfile} aria-label="Solde et paramètres financiers"><Settings2 size={14} aria-hidden="true" /> Solde et paramètres</button>
    </div>
    {lignes.length === 0 && <p className="prv-note">Aucune sortie ni entrée prévue sur cet horizon.</p>}
    <ol className="prv-liste">{lignes.map(({ item, apres }, i) => <li key={item.id}><button type="button" onClick={() => onItem(item)}>
      <span className="prv-num">{i + 1}</span><span className={`prv-pastille prv-${styleDe(item)}`} title={PASTILLE[styleDe(item)]} aria-hidden="true" />
      <span className="prv-nom">{titreDe(item)}<small>{jourCourt(item.date)} · {PASTILLE[styleDe(item)]}</small></span>
      <b className="prv-m">{item.direction === 'out' ? montant(-item.amountCents) : `+${montant(item.amountCents)}`}</b>
      {apres != null && <span className={`prv-apres${apres < 0 ? ' prv-rt' : ''}`}>→ {montant(apres)}</span>}<ChevronRight size={14} aria-hidden="true" /></button></li>)}</ol>
    {undated.length > 0 && <section><h4>Échéance à préciser</h4><ul className="prv-sans" style={onUndated ? { listStyle: 'none', paddingLeft: 0 } : undefined}>{undated.map(u => <li key={u.id}>{onUndated
      ? <button type="button" className="prv-plan" onClick={() => onUndated(u.id)}><span>{u.label}<small>échéance à préciser : hors des mois prévus</small></span><b>{montant(u.direction === 'out' ? -u.amountCents : u.amountCents)}</b><ChevronRight size={14} aria-hidden="true" /></button>
      : <>{u.label} · {montant(u.direction === 'out' ? -u.amountCents : u.amountCents)}</>}</li>)}</ul></section>}
    {plansListes.length > 0 && <details className="prv-lim"><summary>Toutes mes prévisions ({plansListes.length})</summary>{plansListes.map(p => <button type="button" className="prv-plan" key={p.id} onClick={() => onPlan(p)}>
      <span>{p.title}<small>{p.status === 'active' ? 'À venir' : p.status === 'cancelled' ? 'Annulée' : 'Terminée'}</small></span><b>{montant(p.amountCents)}</b><ChevronRight size={14} aria-hidden="true" /></button>)}</details>}
  </Feuille>;
}
export const plansHorsProjets = (plans: FinancialPlan[]) => plans.filter(p => p.status !== 'draft' && !isUpgradePlan(p));
