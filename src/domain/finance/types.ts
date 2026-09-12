import type { FinanceCategory, Transaction } from '../../types';

/** CHF money is stored as integer cents. Legacy fields are never rewritten by an adapter. */
export type FinanceKind = 'expense' | 'income' | 'contribution' | 'withdrawal' | 'refund';
export type FinanceLineKind = 'ingredient' | 'packaging' | 'cleaning' | 'equipment' | 'service' | 'shipping' | 'discount' | 'other';
export interface FinanceLine {
  id: string;
  description: string;
  kind: FinanceLineKind;
  amountCents: number;
  quantity?: number;
  unit?: string;
  unitPriceCents?: number;
  sourceReference?: string;
  stockItemRef?: string;
  equipmentRef?: string;
  category?: FinanceCategory;
  assetId?: string;
  capitalTreatment?: 'expense' | 'asset';
}
export interface TransactionFinance {
  version: 1;
  kind: FinanceKind;
  amountCents: number;
  lines: FinanceLine[];
  vendor?: string;
  invoiceNumber?: string;
  dueDate?: string;
  planId?: string;
  planAllocatedCents?: number;
  occurrenceId?: string;
  batchId?: string;
  refundOfId?: string;
  refundDirection?: 'in' | 'out';
  /** Offset settles part of the original invoice without any cash movement. */
  refundApplication?: 'cash' | 'offset';
  paymentStatus?: 'unknown' | 'unpaid' | 'partial' | 'paid';
  recordedAt?: string;
  excludedFromTrend?: boolean;
  businessUsePct?: number;
  notes?: string;
  voidedAt?: string;
  sourceCurrency?: string;
  sourceAmount?: number;
  sourceDocumentType?: string;
  sourceOrderNumber?: string;
  sourceTotalBasis?: 'printed' | 'line_sum';
  exchangeRate?: number;
  sourceDocumentHash?: string;
  scanProvenance?: { model?: string; scannedAt: string; promptVersion?: string };
  sourceVatRate?: number;
  sourceVatAmount?: number;
  sourceNetAmount?: number;
  proofDocumentId?: string;
}
export type FinanceTransaction = Transaction & { finance?: TransactionFinance };
/** Filing policy only: original documents and financial calculations remain intact. */
export interface FinancialArchive {
  id: string;
  year: number;
  status: 'archived' | 'open';
  archivedAt?: string;
  updatedAt: string;
  operationId: string;
}
export interface FinancialPayment {
  id: string;
  transactionId?: string;
  date: string;
  amountCents: number;
  direction: 'in' | 'out';
  method: 'bank' | 'cash' | 'twint' | 'other';
  note?: string;
  reversalOfId?: string;
  recordedAt: string;
}
export interface FinancialPlan {
  id: string;
  title: string;
  date: string;
  amountCents: number;
  direction: 'in' | 'out';
  category: FinanceCategory;
  source: 'manual' | 'recurring' | 'brew' | 'equipment' | 'tax';
  /** Cost allocation only: cash still follows the recurring payment schedule. */
  costAllocation?: 'fixed' | 'brew';
  status: 'draft' | 'active' | 'cancelled' | 'completed';
  recurrence?: { frequency: 'monthly' | 'quarterly' | 'yearly'; endDate?: string };
  vendor?: string;
  batchId?: string;
  notes?: string;
  /** A saved estimate is documentary; it never books an expense or changes stock. */
  brewEstimate?: unknown;
  upgrade?: EquipmentUpgrade;
  createdAt: string;
  updatedAt?: string;
}
/** An equipment project is an intention. Only its linked invoices enter the ledger. */
export interface EquipmentUpgrade {
  version: 1;
  timing: 'soon' | 'next' | 'later';
  stage: 'idea' | 'research' | 'quote' | 'ready';
  budgetKnown: boolean;
  datePrecision: 'month' | 'day';
  purchaseCents?: number;
  deliveryCents?: number;
  installationCents?: number;
  estimateSource: 'estimate' | 'quote';
  purpose?: string;
  quoteReference?: string;
  sourceCreativeItemId?: string;
}
export type DepreciationCategory = 'tanks' | 'furniture' | 'production' | 'electronics' | 'tools' | 'custom';
export interface FinancialAsset {
  id: string;
  name: string;
  equipmentRef?: string;
  transactionId?: string;
  /** Supplier credit notes already included in the confirmed acquisition cost. */
  capitalAdjustmentTransactionIds?: string[];
  lineId?: string;
  acquisitionDate: string;
  inServiceDate: string;
  acquisitionCents: number;
  businessUsePct: number;
  category: DepreciationCategory;
  method: 'declining' | 'linear';
  ratePct: number;
  /** Required for an old asset: accepted opening book value, not recalculated past years. */
  openingYear: number;
  openingValueCents: number;
  openingConfirmed: boolean;
  firstYearFraction: number;
  disposedDate?: string;
  disposalProceedsCents?: number;
  disposalTransactionId?: string;
  notes?: string;
}
export interface FinancialProfile {
  id: 'current';
  canton: 'FR';
  legalForm: 'sole-proprietor';
  vatRegistered: boolean;
  accounting: 'simplified';
  openingCash?: { date: string; amountCents: number; confirmed: boolean };
  /** First month for which the operator confirms the expense journal is complete. */
  historyCompleteFrom?: string;
  annualProductionL?: number;
  notes?: string;
}
export interface FinancialInventoryLine {
  id: string;
  name: string;
  kind: 'raw' | 'cleaning' | 'packaging' | 'work-in-progress' | 'finished';
  quantity: number;
  unit: string;
  valueCents: number;
  stockItemRef?: string;
  batchId?: string;
  note?: string;
}
export interface AnnualAdjustment { id: string; label: string; amountCents: number; note: string }
export interface FinancialClosing {
  id: string;
  year: number;
  createdAt: string;
  openingInventory: FinancialInventoryLine[];
  closingInventory: FinancialInventoryLine[];
  inventoriesConfirmed: boolean;
  adjustments: AnnualAdjustment[];
  notes?: string;
  tax?: FribourgTaxClosing;
  report?: AnnualReport;
}
export type TaxReviewKey = 'journal' | 'privateUse' | 'social' | 'assets' | 'balance' | 'specialCases';
export interface TaxAttachment {
  id: string;
  label: string;
  kind: 'bank' | 'social' | 'inventory' | 'tax-form' | 'asset' | 'other';
  documentId: string;
  fileName: string;
  mimeType: string;
  assetId?: string;
}
export interface TaxBalanceLine {
  id: string;
  kind: 'bank' | 'cash' | 'other-asset' | 'loan' | 'other-liability';
  label: string;
  address?: string;
  reference?: string;
  amountCents: number;
  note?: string;
}
export interface TaxCorrection {
  id: string;
  kind: 'social' | 'private-use' | 'non-deductible' | 'other';
  label: string;
  amountCents: number;
  treatment: 'included' | 'add' | 'deduct';
  note: string;
  /** A reference to the accounting entry/annual adjustment prevents a second correction. */
  sourceId?: string;
}
export interface FribourgTaxClosing {
  version: 1;
  activity?: 'main' | 'secondary';
  reviewedBasis?: string;
  reviews: Partial<Record<TaxReviewKey, boolean>>;
  corrections: TaxCorrection[];
  balances: TaxBalanceLine[];
  counterparties: Record<string, { name: string; address: string }>;
  attachments: TaxAttachment[];
  /** Must be read from the official annex: never equated blindly with net assets. */
  movableWealth?: { amountCents?: number; note: string; confirmed: boolean };
  specialCaseNote?: string;
}
export interface AnnualOutstanding {
  id: string; date: string; description: string; counterparty: string; address: string;
  direction: 'in' | 'out'; amountCents: number;
}
export interface AnnualDocument {
  id: string; date: string; description: string; amountCents: number; category: string;
  hasProof: boolean; vendor: string; proofDocumentId?: string; proofFileName?: string;
  proofSource?: 'document' | 'legacy-inline' | 'external'; proofUrl?: string;
  required?: boolean;
}
export interface TaxCopyField {
  id: string; label: string; destination: string; code?: string; amountCents: number | null;
  explanation: string; ready: boolean;
}
export interface FribourgTaxReport {
  version: 1; sourceYear: number; mappingVerified: boolean; sourceUrl: string;
  activity?: 'main' | 'secondary'; reviews: Partial<Record<TaxReviewKey, boolean>>;
  corrections: TaxCorrection[]; correctionCents: number; taxableResultCents: number | null;
  balances: TaxBalanceLine[]; outstanding: AnnualOutstanding[];
  totalAssetsCents: number | null; totalLiabilitiesCents: number; netAssetsCents: number | null;
  cashDifferenceCents: number | null; fields: TaxCopyField[];
  attachments: TaxAttachment[]; missing: string[]; ready: boolean;
  specialCaseNote?: string;
}
export interface DepreciationRow {
  assetId: string;
  name: string;
  openingCents: number;
  additionCents: number;
  depreciationCents: number;
  closingCents: number;
  disposalBookValueCents: number;
  disposalProceedsCents: number;
  method: string;
  ratePct: number;
  missing: string[];
}
export interface AnnualReport {
  year: number;
  generatedAt: string;
  basis: 'invoice-with-inventory-adjustments';
  revenueCents: number;
  operatingExpensesCents: number;
  capitalPurchasesCents: number;
  inventoryChangeCents: number | null;
  depreciationCents: number;
  adjustmentCents: number;
  disposalResultCents: number;
  resultCents: number | null;
  receivedCents: number;
  paidCents: number;
  contributionsCents: number;
  withdrawalsCents: number;
  cashCents: number | null;
  receivablesCents: number;
  payablesCents: number;
  openingInventory: FinancialInventoryLine[];
  closingInventory: FinancialInventoryLine[];
  depreciation: DepreciationRow[];
  categories: Array<{ category: string; amountCents: number }>;
  documents: AnnualDocument[];
  supportingDocuments?: AnnualDocument[];
  outstanding?: AnnualOutstanding[];
  adjustments?: AnnualAdjustment[];
  assetEvidence?: Array<{ id: string; name: string; transactionId?: string; hasLinkedProof: boolean }>;
  tax?: FribourgTaxReport;
  missing: string[];
  notes: string[];
}
