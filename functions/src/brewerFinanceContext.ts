import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { buildFinanceAssistantContext } from './financeContext.js';

export const FINANCE_CONTEXT_COLLECTIONS: Record<string, { limit: number; fields: string[] }> = {
  transactions: { limit: 1500, fields: 'date description category subcategory amountTTC amountHT tvaRate settlementBalanceCents lastPaymentId proofFileName finance.version finance.kind finance.amountCents finance.lines finance.vendor finance.invoiceNumber finance.dueDate finance.planId finance.planAllocatedCents finance.occurrenceId finance.batchId finance.refundOfId finance.refundDirection finance.refundApplication finance.paymentStatus finance.recordedAt finance.excludedFromTrend finance.businessUsePct finance.voidedAt finance.proofDocumentId'.split(' ') },
  financialPayments: { limit: 3000, fields: 'transactionId date amountCents direction method reversalOfId recordedAt'.split(' ') },
  financialPlans: { limit: 250, fields: 'title date amountCents direction category source costAllocation status recurrence vendor batchId createdAt updatedAt brewEstimate upgrade notes'.split(' ') },
  creativeItems: { limit: 250, fields: 'title type status description estimatedCost date notes'.split(' ') },
  financialAssets: { limit: 250, fields: 'name equipmentRef transactionId capitalAdjustmentTransactionIds lineId acquisitionDate inServiceDate acquisitionCents businessUsePct category method ratePct openingYear openingValueCents openingConfirmed firstYearFraction disposedDate disposalProceedsCents disposalTransactionId'.split(' ') },
  financialClosings: { limit: 40, fields: 'year createdAt openingInventory closingInventory inventoriesConfirmed adjustments tax report.year report.generatedAt report.basis report.revenueCents report.operatingExpensesCents report.capitalPurchasesCents report.inventoryChangeCents report.depreciationCents report.resultCents report.missing report.categories report.tax'.split(' ') },
  financialArchives: { limit: 100, fields: 'year status archivedAt updatedAt operationId'.split(' ') },
  stockItems: { limit: 500, fields: 'ref name category unit currentStock minStock pricePerUnit inventoryValuation purchasePrice'.split(' ') },
  equipment: { limit: 200, fields: 'ref name category state purchaseDate purchasePrice'.split(' ') },
  recipes: { limit: 100, fields: 'name archivedAt volumeL style malts fermentables hops adjuncts yeast waterPlan efficiencyPct'.split(' ') },
  batches: { limit: 250, fields: 'name archivedAt style status brewDate volumeL volumeBrewedL packaging recipeRef recipeSnapshot stockConsumption'.split(' ') }
};
const iso = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const local = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  return local ? `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
};
export async function loadBrewerFinanceContext(db = getFirestore()) {
  const entries = await Promise.all(Object.entries(FINANCE_CONTEXT_COLLECTIONS).map(async ([collection, { limit, fields }]) => {
    try {
      // Document IDs work for legacy dates too. Do not pretend the capped prefix is recent history.
      const snapshot = await db.collection(collection).select(...fields).orderBy(FieldPath.documentId()).limit(limit + 1).get();
      const rows = snapshot.docs.slice(0, limit).map(doc => ({ ...doc.data(), id: doc.id }));
      const dates = rows.map(row => iso((row as any).date ?? (row as any).brewDate)).filter((date): date is string => !!date).sort();
      return [collection, rows, { loaded: rows.length, limit, complete: snapshot.size <= limit, totalAtLeast: snapshot.size, order: 'document-id', ...(dates.length ? { firstDate: dates[0], lastDate: dates[dates.length - 1] } : {}) }] as const;
    } catch {
      return [collection, [], { loaded: 0, limit, complete: false, totalAtLeast: 0, order: 'document-id', unavailable: true }] as const;
    }
  }));
  const [profile, fiscal] = await Promise.all([
    db.doc('financialProfiles/current').get().then(doc => doc.exists ? doc.data() : undefined).catch(() => undefined),
    db.collection('config').where(FieldPath.documentId(), '==', 'app').select('fiscal.isTvaRegistered').limit(1).get().then(rows => rows.docs[0]?.data()?.fiscal?.isTvaRegistered).catch(() => undefined)
  ]);
  const rows = Object.fromEntries(entries.map(([collection, values]) => [collection, values]));
  const coverage = Object.fromEntries(entries.map(([collection, , status]) => [collection, status]));
  return buildFinanceAssistantContext({ transactions: rows.transactions, payments: rows.financialPayments, plans: rows.financialPlans, assets: rows.financialAssets, closings: rows.financialClosings,
    archives: rows.financialArchives, profile, stock: rows.stockItems, equipment: rows.equipment, recipes: rows.recipes, batches: rows.batches, creativeItems: rows.creativeItems, coverage, configVatRegistered: fiscal, legacyProofsNotRead: true });
}
