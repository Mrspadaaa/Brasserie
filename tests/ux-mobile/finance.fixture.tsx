import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { FinancialArchiveService } from '../../src/services/financialArchiveService';
import { todayISO } from '../../src/domain/finance/ledger';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import type { Transaction } from '../../src/types';

const today = todayISO();
const recordedAt = `${today}T12:00:00.000Z`;
const dateIn = (days: number) => {
  const date = new Date(`${today}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const fakeProof = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="white"/><text x="40" y="90" font-size="28" fill="#221D19">JUSTIFICATIF FACTURE FICTIVE</text><text x="40" y="145" font-size="20" fill="#574A42">Donnees synthetiques pour le controle UX</text></svg>')}`;

function invoice(id: string, description: string, amountCents: number, direction: 'in' | 'out', dueDate: string): Transaction {
  return {
    id, description, date: today, category: direction === 'in' ? 'recettes' : 'brassage', subcategory: '',
    amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
    proofUrl: fakeProof, proofType: 'image/svg+xml', proofFileName: `${id}.svg`,
    finance: { version: 1, kind: direction === 'in' ? 'income' : 'expense', amountCents, paymentStatus: 'unpaid', dueDate, recordedAt, lines: [] }
  };
}

function plan(id: string, title: string, days: number, amountCents: number, direction: 'in' | 'out'): FinancialPlan {
  return { id, title, date: dateIn(days), amountCents, direction, category: direction === 'in' ? 'recettes' : 'brassage', source: 'manual', status: 'active', createdAt: recordedAt };
}

const transactions: Transaction[] = [
  invoice('FACTURE-MALT', 'Facture de malt à régler', 15475, 'out', dateIn(18)),
  invoice('FACTURE-VENTE', 'Facture de vente à encaisser', 38000, 'in', dateIn(47)),
  {
    id: 'ACHAT-MOIS', description: 'Houblon Cascade', date: today, category: 'brassage', subcategory: '',
    amountHT: 68, amountTTC: 68, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'expense', amountCents: 6800, paymentStatus: 'unpaid', recordedAt, lines: [] }
  }
];
const plans = [
  plan('PLAN-SEPTEMBRE', 'Estimation emballages', 2, 4250, 'out'),
  plan('PLAN-OCTOBRE', 'Estimation levures', 28, 6200, 'out'),
  plan('PLAN-OCTOBRE-ENTREE', 'Vente prévue', 32, 9000, 'in'),
  plan('PLAN-NOVEMBRE', 'Estimation entretien', 63, 3150, 'out')
];
const profile: FinancialProfile = {
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified',
  openingCash: { date: today, amountCents: 825000, confirmed: true }, historyCompleteFrom: `${today.slice(0, 4)}-01-01`, annualProductionL: 1500
};

const snapshot = { profile, plans, payments: [], assets: [], closings: [] };
(FinanceService as unknown as { snapshot: () => typeof snapshot }).snapshot = () => snapshot;
(FinancialArchiveService as unknown as { getArchives: () => never[] }).getArchives = () => [];
(StorageService as unknown as { subscribe: (listener: () => void) => () => void }).subscribe = () => () => {};
StorageService.setUiState('finances_workspace', 'overview');

Object.assign(window, { __financeFixture: { today, transactionIds: transactions.map(tx => tx.id) } });

createRoot(document.getElementById('finance-fixture-root')!).render(
  <main style={{ maxWidth: 1100, margin: '0 auto', padding: '12px' }}>
    <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" />
  </main>
);
