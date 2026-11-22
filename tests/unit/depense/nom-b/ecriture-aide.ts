import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

/**
 * Banc d'écriture de la voie n1-nom-fr (modèle : `fiche/ecriture.test.ts`) : Drive, Firestore et le stock sont simulés, aucune donnée réelle.
 * Ce module n'importe AUCUN module simulé (les tests le branchent par `vi.mock(..., async () => (await import('./ecriture-aide')).…)`).
 */
export const etat = { transactions: [] as any[], stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[] };

export const storageSimule = { StorageService: { getStocks: () => etat.stocks, getTransactions: () => etat.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }),
  addTransaction: (tx: any) => { etat.writes.push(['transaction', tx]); etat.transactions.push(tx); }, addStockItem: (type: string, item: any) => { etat.writes.push(['stock', type, item]); },
  addEquipment: () => undefined, updateTransaction: () => undefined } };
export const firestoreSimule = { isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...args: any[]) => etat.writes.push(['adjust', ...args]), put: (...args: any[]) => etat.writes.push(['put', ...args]) } };
export const financeSimule = { validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { etat.writes.push(['transaction', tx]); } } };
export const documentsSimules = { prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined };

let compteur = 0;
export const saisie = (lines: PurchaseLineDraft[]): PurchaseDraft => ({ submissionId: `nom-b-${String(++compteur).padStart(5, '0')}`, date: '27.04.2026', vendor: 'Fournisseur test', invoiceNumber: '1', description: 'Achat',
  category: 'brassage', amount: Math.round(lines.reduce((s, l) => s + (l.amount ?? 0) * 100, 0)) / 100, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF' });
export const avecStock = (...items: any[]) => { etat.stocks = { rawMaterials: items, cleaning: [], equipment: [] }; };
export const remettre = () => { etat.transactions = []; etat.writes = []; etat.stocks = { rawMaterials: [], cleaning: [], equipment: [] }; };
export const articlesEcrits = () => etat.writes.filter(w => w[0] === 'stock').map(w => w[2]);
export const putsStock = () => etat.writes.filter(w => w[0] === 'put' && w[1] === 'stockItems').map(w => ({ ref: w[2], data: w[3], options: w[4] }));
