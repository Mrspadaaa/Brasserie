import type { StockItem, Batch } from '../../../types';
import type { AnnualReport, FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialPlan, FinancialProfile, FribourgTaxClosing, FribourgTaxReport } from '../../../domain/finance/types';
import type { TaxSection } from '../TaxClosingSheet';
import type { JournalRequest } from '../TransactionJournal';
import type { EtapeEtat } from './calculs';
import type { useDossier } from './dossier';

export interface OuvertureInventaire { cote?: 'openingInventory' | 'closingInventory'; proposer?: boolean; propositions?: Array<{ stockItemRef: string; valueCents: number; note: string }>; /** CP-10 : la nature visée par la case touchée (étape 3). */ nature?: 'malt' | 'houblons' | 'emballages' | 'biere' }
export interface Actions {
  /** Écrit dans `closing.tax` par la seule voie `ecrireTax`. */
  ecrire: (patch: (tax: FribourgTaxClosing) => void) => void;
  feuille: (section: TaxSection) => void;
  onProfile: () => void;
  onInventories: (ouverture?: OuvertureInventaire) => void;
  onAsset: (asset: FinancialAsset | null, initial?: Partial<FinancialAsset>) => void;
  onOperations: (request: Omit<JournalRequest, 'key'>) => void;
  onArchives: () => void;
  aller: (n: number) => void;
  assistant: (question: string) => void;
}
export interface Ctx {
  year: number; today: string; anneeCourante: boolean;
  report: AnnualReport; tax: FribourgTaxReport; closing?: FinancialClosing; profile: FinancialProfile;
  assets: FinancialAsset[]; plans: FinancialPlan[]; stockItems: StockItem[]; batches: Batch[]; transactions: FinanceTransaction[]; payments: FinancialPayment[];
  gele: boolean; perimees: boolean; etapes: EtapeEtat[];
  dossier: ReturnType<typeof useDossier>;
  act: Actions;
}
