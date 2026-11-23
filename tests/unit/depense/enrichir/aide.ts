/**
 * Banc des tests de f4-enrichir : un stock et un Firestore simulés (aucune donnée réelle, aucun réseau), partagés par les fichiers de test qui les
 * branchent par `vi.mock(..., async () => (await import('./aide')).storageSimule)`. Ce module n'importe AUCUN module simulé.
 * Fixtures synthétiques : aucun nom ni adresse du brasseur (fournisseur « Fournisseur du Banc »).
 */
import type { StockItem } from '../../../../src/types';

type Statut = 'unknown' | 'queued' | 'pending' | 'confirmed' | 'rejected';
export const etat = {
  stocks: [] as Array<StockItem & { kind?: string }>,
  transactions: [] as any[],
  puts: [] as Array<[string, string, any, any]>,
  journal: [] as any[][],
  statuts: new Map<string, Statut>(),
  pret: true,
  /** Ce que rend `waitForDocument` : par défaut, l'écriture est lue du serveur. */
  attendre: async (_nom: string, _id: string): Promise<unknown> => ({}),
};
export function remettre(): void {
  etat.stocks = []; etat.transactions = []; etat.puts = []; etat.journal = []; etat.statuts = new Map(); etat.pret = true;
  etat.attendre = async () => ({});
}

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** La fusion de `set(..., { merge: true })` : les cartes se fusionnent, les tableaux et valeurs sont remplacés. */
export function fusion(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = estObjet(v) && estObjet(a[k]) ? fusion(a[k] as Record<string, unknown>, v) : structuredClone(v);
  return out;
}

export class RejetEcriture extends Error { status = 'rejected' as const; }

export const storageSimule = {
  StorageService: {
    getStocks: () => ({ rawMaterials: etat.stocks.filter(s => s.kind !== 'cleaning').map(({ kind: _k, ...s }) => structuredClone(s) as StockItem), cleaning: [], equipment: [], kegs: [] }),
    getTransactions: () => etat.transactions,
    isReady: () => etat.pret,
    getConfig: () => ({ fiscal: { isTvaRegistered: false } }),
    logAction: (...args: any[]) => { etat.journal.push(args); },
    addTransaction: (tx: any) => { etat.transactions.push(tx); },
    addStockItem: (type: string, item: StockItem) => { etat.stocks.push({ ...structuredClone(item), kind: type }); },
    addEquipment: () => undefined,
    updateTransaction: () => undefined,
  },
};

export const firestoreSimule = {
  isConfirmedWriteRejection: (e: unknown) => e instanceof RejetEcriture,
  FirestoreRepo: {
    documentWriteState: (nom: string, id: string) => ({ status: etat.statuts.get(`${nom}/${id}`) ?? 'confirmed' }),
    waitForDocument: async (nom: string, id: string) => etat.attendre(nom, id),
    put: (nom: string, id: string, data: any, options: any = {}) => {
      etat.puts.push([nom, id, structuredClone(data), options]);
      if (nom !== 'stockItems') return;
      const i = etat.stocks.findIndex(s => s.ref === id);
      // Un `merge` sur un article absent est refusé par la règle de création (`currentStock` manquant) : rien n'arrive au cache.
      if (i >= 0) etat.stocks[i] = (options.merge ? fusion(etat.stocks[i] as any, data) : structuredClone(data)) as any;
      else if (!options.merge) etat.stocks.push(structuredClone(data));
    },
    adjustNumber: () => undefined,
    find: () => undefined,
    subscribe: () => () => undefined,
  },
};

export const financeSimule = { validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { etat.transactions.push(tx); } } };
export const documentsSimules = { prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined };

export const article = (ref: string, name: string, category: string, unit: string, more: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more }) as StockItem;
export const avecStock = (...items: StockItem[]) => { etat.stocks = items.map(i => ({ ...structuredClone(i), kind: 'rawMaterials' })); };
export const lu = (ref: string) => etat.stocks.find(s => s.ref === ref) as (StockItem & { fiche?: any }) | undefined;
/** Les écritures d'f4 sur le stock (celles de `savePurchase` passent par `addStockItem`). */
export const putsF4 = () => etat.puts.filter(p => p[0] === 'stockItems' && p[3]?.merge);
