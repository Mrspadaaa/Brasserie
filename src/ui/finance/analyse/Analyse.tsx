import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  budgetAnalyse, cascade, decalerMois, escalierCaisse, fenetreDe, pourquoiDepasse, plageDeFenetre, type ChoixPeriode, type EntreeAnalyse, type SerieFiltre, finDuMois,
} from '../../../domain/finance/analyse';
import { isUpgradePlan } from '../../../domain/finance/upgrades';
import { isoDate } from '../../../domain/finance/ledger';
import { CaisseVue } from './Caisse';
import { SourcesVue } from './Sources';
import { BudgetVue } from './Budget';
import { FiltrerVue, type EtatFiltre } from './Filtrer';
import { textePourquoiDepasse, type TextePourquoi } from './Pourquoi';
import { chf, jjmm, moisLong, plage as titrePlage, signe } from './format';
import '../analyse.css';

type Vue = 'caisse' | 'sources' | 'budget' | 'filtrer';
const VUES: Array<[Vue, string]> = [['caisse', 'Caisse'], ['sources', 'Sources'], ['budget', 'Budget'], ['filtrer', 'Filtrer']];
const PERIODES: Array<[ChoixPeriode, string, string]> = [['30j', '30 j', '30 jours'], ['90j', '90 j', '90 jours'], ['12mois', '12 mois', '12 mois']];

export interface AnalyseProps {
  entree: EntreeAnalyse;
  onBack: () => void;
  onJournal: (request: { scope: 'all'; category?: string; allDates?: boolean; filter?: string; month?: string }) => void;
  onTransaction: (id: string) => void;
  onProfile: () => void;
  onPrevisions: () => void;
  onBrowseProjects: () => void;
}

/**
 * L'outil d'analyse (a2a, choisi le 10.11) : « voir si je respecte mes budgets, voir l'évolution réelle en fonction de mes opérations, comparer d'année en année ».
 * Un outil à part, ouvert depuis la Synthèse (« Revoir le mois »). Quatre vues sous le titre : Caisse (l'escalier), Sources (la cascade), Budget (une règle par source), Filtrer
 * (les tuiles de douze mois). Tous les nombres viennent de `domain/finance/analyse.ts`.
 */
export function Analyse({ entree: e, onBack, onJournal, onTransaction, onProfile, onPrevisions, onBrowseProjects }: AnalyseProps) {
  const [vue, setVue] = useState<Vue>('caisse');
  const [periode, setPeriode] = useState<ChoixPeriode>('30j');
  const courant = e.aujourdhui.slice(0, 7), annee = courant.slice(0, 4);
  const [filtre, setFiltre] = useState<EtatFiltre>({ mode: 'plage', du: decalerMois(courant, -5) < `${annee}-01` ? `${annee}-01` : decalerMois(courant, -5), au: courant, source: null, fournisseur: null, brassinId: null, ancre: null });
  const fenetre = useMemo(() => fenetreDe(periode, e.aujourdhui), [periode, e.aujourdhui]);
  const plage = useMemo(() => plageDeFenetre(fenetre), [fenetre]);
  const duree = PERIODES.find(p => p[0] === periode)![2];
  const demo = typeof window !== 'undefined' && /finance-demo/.test(window.location.search);

  const esc = useMemo(() => escalierCaisse(e, fenetre), [e, fenetre]);
  const casc = useMemo(() => cascade(e, plage), [e, plage]);
  const budget = useMemo(() => budgetAnalyse(e, plage), [e, plage]);
  const pq = useMemo(() => pourquoiDepasse(e, plage), [e, plage]);
  const textePq: TextePourquoi | null = pq ? textePourquoiDepasse(pq) : null;
  const projetsSansDate = e.plans.filter(p => isUpgradePlan(p) && p.status !== 'cancelled' && !isoDate(p.date)).length;
  const finJour = [e.aujourdhui, finDuMois(plage.au)].reduce((a, b) => a < b ? a : b);
  const ventes = e.transactions.filter(t => t.finance?.kind === 'income' && !t.finance?.voidedAt && (isoDate(t.date) ?? '') >= esc.du && (isoDate(t.date) ?? '') <= esc.au).length;
  const brassins = useMemo(() => (e.batches ?? []).map(b => ({ id: b.id, nom: b.name })), [e.batches]);

  // Le titre dit la vraie fenêtre : le jour pour la Caisse, les mois ailleurs ; « Depuis le … » quand les écritures commencent après.
  const titre = vue === 'filtrer' ? titrePlage(filtre.du, filtre.au)
    : vue === 'caisse' ? (esc.depuis ? `Depuis le ${Number(esc.depuis.slice(8, 10))}.${esc.depuis.slice(5, 7)}` : `${jjmm(esc.du)} → ${jjmm(esc.au)}`)
    : casc.depuis ? `Depuis le ${Number(casc.depuis.slice(8, 10))}.${casc.depuis.slice(5, 7)}` : titrePlage(plage.du, plage.au);
  const commun = { duree, onJournal, onTransaction, onProfile, onPrevisions };
  const pourquoiCaisse: TextePourquoi | null = esc.pireBaisse ? {
    titre: 'Pourquoi cette baisse ?',
    phrases: [<>La plus grosse sortie : {esc.pireBaisse.libelle} <b className="ana-m">{signe(esc.pireBaisse.cents)}</b> le {jjmm(esc.pireBaisse.date)}{esc.pireBaisse.prevuCents !== null ? <>, prévu <b className="ana-m">{signe(esc.pireBaisse.prevuCents)}</b></> : esc.pireBaisse.pasPrevu ? ', pas prévu' : ''}.</>,
      ...(esc.pasPrevu.length ? [<>{esc.pasPrevu.length} {esc.pasPrevu.length > 1 ? 'paiements' : 'paiement'} sans plan : <b className="ana-m">{signe(esc.pasPrevu.reduce((n, m) => n + m.cents, 0))}</b> CHF.</>] : [])],
    source: `Sources : ${esc.marches.length} paiements de la période, journal des opérations` } : null;
  const pourquoiFiltre = (s: SerieFiltre): TextePourquoi | null => s.plusLourd ? {
    titre: `Pourquoi ${moisLong(s.plusLourd.mois)} ?`,
    phrases: [<>{moisLong(s.plusLourd.mois)} est le mois le plus lourd : <b className="ana-m">{signe(s.plusLourd.cents)}</b> CHF sur {s.points.length} mois, cumul <b className="ana-m">{signe(s.totalCents)}</b>.</>],
    source: `Sources : ${s.nombrePieces} ${s.nombrePieces > 1 ? 'pièces' : 'pièce'}, journal des opérations` } : null;

  return <div className="ana" data-vue={vue}>
    <div className="ana-tete">
      <button type="button" className="ana-retour" onClick={onBack} aria-label="Retour à la Synthèse"><ChevronLeft size={16} aria-hidden="true"/><span className="ana-retour-t">Synthèse</span></button>
      <h2 className="ana-h1">{titre}</h2>
      {demo && <span className="ana-ex">exemple</span>}
      {vue !== 'filtrer' && <div className="ana-seg" role="group" aria-label="Période">
        {PERIODES.map(([cle, court]) => <button type="button" key={cle} aria-pressed={periode === cle} onClick={() => setPeriode(cle)}>{court}</button>)}
      </div>}
    </div>
    <div className="ana-vues" role="tablist" aria-label="Vues de l’analyse">
      {VUES.map(([cle, l]) => <button type="button" role="tab" key={cle} aria-selected={vue === cle} onClick={() => setVue(cle)}>{l}</button>)}
    </div>
    <div className="ana-corps" role="tabpanel" aria-label={VUES.find(v => v[0] === vue)![1]}>
      {vue === 'caisse' && <CaisseVue {...commun} esc={esc} soldeNote={e.profile.openingCash} gagneCents={casc.gagneCents} ventes={ventes} projetsSansDate={projetsSansDate} onBrowseProjects={onBrowseProjects} pourquoi={pourquoiCaisse}/>}
      {vue === 'sources' && <SourcesVue {...commun} c={casc} aujourdhui={e.aujourdhui} finJour={finJour} pourquoi={textePq}/>}
      {vue === 'budget' && <BudgetVue {...commun} b={budget} pourquoi={textePq}/>}
      {vue === 'filtrer' && <FiltrerVue {...commun} e={e} annee={annee} etat={filtre} onEtat={setFiltre} brassins={brassins} pourquoi={pourquoiFiltre}/>}
    </div>
  </div>;
}
export { chf };
