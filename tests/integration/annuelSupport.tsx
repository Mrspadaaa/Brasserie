/* Aide des tests de l'Annuel (voie ug) : la démo `financeDemoEntries()` (une brasserie complète, datée du jour) chargée dans le dépôt mémoire,
   et un banc qui monte `TaxWorkspace` comme `FinancesTab` le fait (rapport par `buildAnnualReport`, mêmes props). Aucun réseau, aucun Gemini. */
import React, { useMemo, useState } from 'react';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import { TaxWorkspace } from '../../src/ui/finance/TaxWorkspace';

export const AUJOURDHUI = '2026-11-09';
export const seedDemo = () => { for (const e of financeDemoEntries().entries) FirestoreRepo.put(e.name, e.id, e.data); };
export const demoData = () => {
  const entries = financeDemoEntries().entries;
  const de = (name: string) => entries.filter(e => e.name === name).map(e => e.data);
  return { transactions: de('transactions'), payments: de('financialPayments'), assets: de('financialAssets'), plans: de('financialPlans'), stockItems: de('stockItems'), batches: de('batches'), profile: de('financialProfiles')[0] };
};
const read = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions(), stock: FirestoreRepo.all<any>('stockItems'), batches: FirestoreRepo.all<any>('batches') });

export function Banc({ year = 2026, today = AUJOURDHUI, spies = {} }: { year?: number; today?: string; spies?: Record<string, any> }) {
  const d = useStorageValue(read);
  const [closingId, setClosingId] = useState('');
  const yearClosings = d.closings.filter(c => c.year === year), closing = yearClosings.find(c => c.id === closingId) ?? yearClosings[0];
  const report = useMemo(() => closing?.report ?? buildAnnualReport({ year, transactions: d.transactions, payments: d.payments, assets: d.assets, profile: d.profile, closing }), [year, d, closing]);
  return <TaxWorkspace report={report} closing={closing} closings={yearClosings} year={year} transactions={d.transactions} payments={d.payments} assets={d.assets} plans={d.plans} stockItems={d.stock} batches={d.batches}
    profile={d.profile} companyName="Brasserie · Démonstration" today={today} onProfile={spies.onProfile ?? (() => {})} onInventories={spies.onInventories ?? (() => {})} onAsset={spies.onAsset ?? (() => {})}
    onVersion={id => { spies.onVersion?.(id); setClosingId(id); }} onOperations={spies.onOperations ?? (() => {})} onArchives={spies.onArchives ?? (() => {})}/>;
}
