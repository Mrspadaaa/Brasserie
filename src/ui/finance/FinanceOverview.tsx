import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Batch, Recipe, StockItem, Transaction } from '../../types';
import type { FinancialAsset, FinancialPayment, FinancialPlan, FinancialProfile } from '../../domain/finance/types';
import { todayISO, type LedgerSummary } from '../../domain/finance/ledger';
import { periodeSynthese } from '../../domain/finance/periodeSynthese';
import type { TvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import type { JournalRequest } from './TransactionJournal';
import { Periode, Scene, titrePeriode } from './synthese/Scene';
import { Caisse } from './synthese/Caisse';
import { AlerteTva, LigneLitre, Replie, Verifier } from './synthese/Lignes';
import { Pourquoi } from './synthese/Pourquoi';
import { Analyse } from './analyse/Analyse';
import './synthese.css';

interface Props {
  transactions: Transaction[];
  payments: FinancialPayment[];
  plans: FinancialPlan[];
  assets: FinancialAsset[];
  batches: Batch[];
  recipes: Recipe[];
  ledger: LedgerSummary;
  /** AM n° 10 : chiffre d'affaires sur 12 mois contre le seuil d'assujettissement à la TVA ; `null` si déjà assujettie ou seuil inconnu. */
  tvaThreshold?: TvaThresholdStatus | null;
  openingCashReady: boolean;
  /** BE-72 : le solde saisi mais pas encore confirmé se montre (avec son statut) au lieu de disparaître de l'écran. */
  openingCash?: { amountCents: number; date: string; confirmed: boolean };
  /** Période : le mois (`AAAA-MM`) ou toutes les dates. */
  month: string;
  allDates: boolean;
  onMonth: (month: string) => void;
  onAllDates: () => void;
  /** Ligne « Compagnon brasseur » (le composant de l'assistant, question préparée). */
  assistant?: React.ReactNode;
  onProfile: () => void;
  onJournal: (request: Omit<JournalRequest, 'key'>) => void;
  onTransaction: (id: string) => void;
  onPayment: (id: string) => void;
  onOpenBudget: (cible: { batch?: Batch; recipe?: Recipe }) => void;
  onBudgetPicker: () => void;
  onUpgrade: (plan: FinancialPlan) => void;
  onBrowseProjects: () => void;
  onNotice: (message: string) => void;
  /** L'outil d'analyse (a2a) : le profil (solde de départ) et le stock servent ses calculs ; sans profil, l'entrée « Revoir le mois » n'est pas offerte. */
  profile?: FinancialProfile;
  stockItems?: StockItem[];
  onPrevisions?: () => void;
}

/**
 * Synthèse (g3a, choisie le 09.11) : entré contre dépensé, l'à-payer hachuré, le gain, la caisse, le litre.
 * Remplace entièrement « Situation » et « Coûts ». Tous les nombres viennent de `periodeSynthese` (domaine) et du grand livre ; l'écran ne calcule rien.
 */
export function FinanceOverview(props: Props) {
  const { transactions, payments, plans, assets, batches, recipes, ledger, month, allDates } = props;
  const aujourdhui = todayISO();
  // CP-9 : la plage choisie avec « … » vit ici, en état local. Elle remplace le mois ou « tout » tant qu'on ne touche pas l'un d'eux.
  // À brancher dans FinancesTab (voie sd) pour la garder en quittant l'onglet : `plage` à côté de `month` et `allDates`.
  const [plage, setPlage] = useState<{ du: string; au: string } | null>(null);
  const periode = useMemo(() => periodeSynthese({ transactions, payments, mois: plage ? plage.du : allDates ? null : month, jusqua: plage?.au, aujourdhui, assets }), [transactions, payments, plage, allDates, month, aujourdhui, assets]);
  const [pourquoi, setPourquoi] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const choix = { mois: month, tout: allDates && !plage, plage };
  const nomPeriode = titrePeriode(choix, aujourdhui.slice(0, 4)).toLowerCase();
  const mois = plage ? plage.du : allDates ? null : month;
  // Le journal ne filtre pas encore une plage : il s'ouvre sur toutes les dates, la catégorie reste filtrée.
  const jusqua = plage?.au;
  const portee = plage ? { allDates: true } : { month: mois ?? undefined, allDates };
  const ouvrir = (extra: Omit<JournalRequest, 'key' | 'scope'>) => props.onJournal({ scope: 'all', ...extra });
  const choisirPlage = (du: string, au: string) => {
    if (du === au) { setPlage(null); props.onMonth(du); } else setPlage({ du, au });
  };

  if (analyse && props.profile) {
    return <Analyse entree={{ transactions, payments, plans, profile: props.profile, assets, batches, stockItems: props.stockItems, aujourdhui }}
      onBack={() => setAnalyse(false)} onJournal={props.onJournal} onTransaction={props.onTransaction} onProfile={props.onProfile}
      onPrevisions={props.onPrevisions ?? (() => setAnalyse(false))} onBrowseProjects={props.onBrowseProjects}/>;
  }

  return <div className="syn">
    <div className="syn-wrap">
      <section aria-label="Entré et dépensé">
        <Periode courant={aujourdhui.slice(0, 7)} choix={choix}
          onMois={m => { setPlage(null); props.onMonth(m); }} onTout={() => { setPlage(null); props.onAllDates(); }} onPlage={choisirPlage}/>
        <Scene periode={periode} nomPeriode={nomPeriode}
          onCategorie={categorie => ouvrir({ category: categorie, ...portee })}
          onPiece={props.onTransaction}
          onVentes={() => ouvrir({ category: 'recettes', ...portee })}
          onMateriel={() => ouvrir({ category: 'materiel', ...portee })}
          onPourquoi={() => setPourquoi(true)}/>
        {props.profile && <button type="button" className="syn-row" data-ligne="analyse" onClick={() => setAnalyse(true)}>
          <span className="syn-t">Revoir le mois<small>Caisse jour par jour, sources, budgets, 12 mois</small></span>
          <ChevronRight size={16} aria-hidden="true"/>
        </button>}
      </section>
      <section aria-label="Caisse et coût du litre">
        <Caisse ledger={ledger} openingCashReady={props.openingCashReady} openingCash={props.openingCash} onProfile={props.onProfile} onJournal={props.onJournal} onTransaction={props.onTransaction} onPayment={props.onPayment}/>
        <AlerteTva tvaThreshold={props.tvaThreshold} onJournal={props.onJournal}/>
        <Verifier periode={periode} ledger={ledger} tvaThreshold={props.tvaThreshold} onJournal={props.onJournal}/>
        <LigneLitre plans={plans} batches={batches} recipes={recipes} onOpenBudget={props.onOpenBudget} onAbsent={props.onNotice} onPicker={props.onBudgetPicker}/>
        <Replie sansRegistre={periode.aVerifier.materielSansRegistre} transactions={transactions} payments={payments} plans={plans} mois={mois} jusqua={jusqua} onJournal={props.onJournal} onUpgrade={props.onUpgrade} onBrowseProjects={props.onBrowseProjects}/>
        {props.assistant}
      </section>
    </div>
    {pourquoi && <Pourquoi periode={periode} nomPeriode={nomPeriode} onClose={() => setPourquoi(false)}/>}
  </div>;
}
