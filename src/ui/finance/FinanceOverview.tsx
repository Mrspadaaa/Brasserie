import React, { useMemo, useState } from 'react';
import type { Batch, Recipe, Transaction } from '../../types';
import type { FinancialAsset, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { todayISO, type LedgerSummary } from '../../domain/finance/ledger';
import { periodeSynthese } from '../../domain/finance/periodeSynthese';
import type { TvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import type { JournalRequest } from './TransactionJournal';
import { Periode, Scene } from './synthese/Scene';
import { Caisse } from './synthese/Caisse';
import { AlerteTva, LigneLitre, Replie, Verifier } from './synthese/Lignes';
import { Pourquoi } from './synthese/Pourquoi';
import { titreMois } from './synthese/libelles';
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
}

/**
 * Synthèse (g3a, choisie le 09.11) : entré contre dépensé, l'à-payer hachuré, le gain, la caisse, le litre.
 * Remplace entièrement « Situation » et « Coûts ». Tous les nombres viennent de `periodeSynthese` (domaine) et du grand livre ; l'écran ne calcule rien.
 */
export function FinanceOverview(props: Props) {
  const { transactions, payments, plans, assets, batches, recipes, ledger, month, allDates } = props;
  const aujourdhui = todayISO();
  const periode = useMemo(() => periodeSynthese({ transactions, payments, mois: allDates ? null : month, aujourdhui, assets }), [transactions, payments, allDates, month, aujourdhui, assets]);
  const [pourquoi, setPourquoi] = useState(false);
  const nomPeriode = allDates ? 'tout l’historique' : titreMois(month, aujourdhui.slice(0, 4)).toLowerCase();
  const mois = allDates ? null : month;
  const ouvrir = (extra: Omit<JournalRequest, 'key' | 'scope'>) => props.onJournal({ scope: 'all', ...extra });

  return <div className="syn">
    <div className="syn-wrap">
      <section aria-label="Entré et dépensé">
        <Periode courant={aujourdhui.slice(0, 7)} choix={{ mois: month, tout: allDates }} onMois={m => { props.onMonth(m); }} onTout={props.onAllDates}/>
        <Scene periode={periode} nomPeriode={nomPeriode}
          onCategorie={categorie => ouvrir({ category: categorie, month: mois ?? undefined, allDates })}
          onPiece={props.onTransaction}
          onVentes={() => ouvrir({ category: 'recettes', month: mois ?? undefined, allDates })}
          onMateriel={() => ouvrir({ category: 'materiel', month: mois ?? undefined, allDates })}
          onPourquoi={() => setPourquoi(true)}/>
      </section>
      <section aria-label="Caisse et coût du litre">
        <Caisse ledger={ledger} openingCashReady={props.openingCashReady} openingCash={props.openingCash} onProfile={props.onProfile} onJournal={props.onJournal} onTransaction={props.onTransaction} onPayment={props.onPayment}/>
        <AlerteTva tvaThreshold={props.tvaThreshold} onJournal={props.onJournal}/>
        <Verifier periode={periode} ledger={ledger} tvaThreshold={props.tvaThreshold} onJournal={props.onJournal}/>
        <LigneLitre plans={plans} batches={batches} recipes={recipes} onOpenBudget={props.onOpenBudget} onAbsent={props.onNotice} onPicker={props.onBudgetPicker}/>
        <Replie transactions={transactions} payments={payments} plans={plans} mois={mois} onJournal={props.onJournal} onUpgrade={props.onUpgrade} onBrowseProjects={props.onBrowseProjects}/>
        {props.assistant}
      </section>
    </div>
    {pourquoi && <Pourquoi periode={periode} nomPeriode={nomPeriode} onClose={() => setPourquoi(false)}/>}
  </div>;
}
