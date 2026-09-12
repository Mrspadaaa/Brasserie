import type { AnnualReport, DepreciationCategory, DepreciationRow, FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialProfile } from './types';
import { isoDate, isActiveTransaction, paymentState, refundLinkIssue, summarizeLedger, transactionAmount, transactionDirection, transactionKind, transactionVendor, validPayment } from './ledger';
import { buildFribourgTaxReport } from './fribourgTax';

export const DEPRECIATION_SOURCE = 'https://www.estv.admin.ch/dam/fr/sd-web/Qyxr5xBfdWDp/dbst-mb-a-1995-geschbetriebe-fr.pdf';
export const DEPRECIATION_CATEGORIES: Array<{ id: DepreciationCategory; label: string; decliningRate: number; linearRate: number }> = [
  { id: 'tanks', label: 'Réservoirs et conteneurs', decliningRate: 20, linearRate: 10 },
  { id: 'furniture', label: 'Mobilier et installations d’atelier', decliningRate: 25, linearRate: 12.5 },
  { id: 'production', label: 'Machines de production', decliningRate: 30, linearRate: 15 },
  { id: 'electronics', label: 'Informatique et mesure électronique', decliningRate: 40, linearRate: 20 },
  { id: 'tools', label: 'Outillage, instruments et récipients', decliningRate: 45, linearRate: 22.5 },
  { id: 'custom', label: 'Taux confirmé séparément', decliningRate: 0, linearRate: 0 }
];
export function validateAsset(asset: FinancialAsset): void {
  if (!asset.id || !asset.name.trim() || !isoDate(asset.acquisitionDate) || !isoDate(asset.inServiceDate)) throw new Error('Nom et dates du matériel requis.');
  if (!Number.isSafeInteger(asset.acquisitionCents) || asset.acquisitionCents < 0 || !Number.isSafeInteger(asset.openingValueCents) || asset.openingValueCents < 0) throw new Error('Valeur du matériel invalide.');
  if (!(asset.businessUsePct >= 0 && asset.businessUsePct <= 100) || !(asset.ratePct >= 0 && asset.ratePct <= 100) || !(asset.firstYearFraction >= 0 && asset.firstYearFraction <= 1)) throw new Error('Part professionnelle, taux ou fraction de première année invalide.');
  if (!Number.isInteger(asset.openingYear) || asset.openingYear < 1900 || asset.openingYear > 2200) throw new Error('Exercice de reprise invalide.');
  if (asset.openingValueCents > Math.round(asset.acquisitionCents * asset.businessUsePct / 100)) throw new Error('La valeur de reprise dépasse le coût professionnel.');
  if (asset.disposedDate && (!isoDate(asset.disposedDate) || isoDate(asset.disposedDate)! < isoDate(asset.acquisitionDate)!)) throw new Error('Date de cession invalide.');
  if (asset.disposalProceedsCents != null && (!Number.isSafeInteger(asset.disposalProceedsCents) || asset.disposalProceedsCents < 0)) throw new Error('Produit de cession invalide.');
}
export function assetDisposalIssues(asset: FinancialAsset, transactions: FinanceTransaction[], assets: FinancialAsset[] = [asset]): string[] {
  if (!asset.disposedDate && !asset.disposalTransactionId) return [];
  if (!asset.disposalTransactionId) return (asset.disposalProceedsCents ?? 0) > 0 ? [`${asset.name} : relier la vente du matériel pour éviter de compter deux fois le produit de cession.`] : [];
  const sale = transactions.find(t => t.id === asset.disposalTransactionId);
  if (!sale || !isActiveTransaction(sale) || transactionKind(sale) !== 'income') return [`${asset.name} : la cession doit être liée à une vente existante et active.`];
  if (!isoDate(asset.disposedDate) || isoDate(sale.date)?.slice(0, 4) !== isoDate(asset.disposedDate)?.slice(0, 4)) return [`${asset.name} : la vente et la cession doivent appartenir au même exercice.`];
  if (asset.disposalProceedsCents == null) return [`${asset.name} : confirmer le produit de cession affecté à ce matériel.`];
  const allocated = assets.filter(a => a.disposalTransactionId === sale.id).reduce((n, a) => n + (a.disposalProceedsCents ?? 0), 0);
  if (allocated > transactionAmount(sale)) return [`${asset.name} : les produits de cession affectés dépassent le montant de la vente liée.`];
  return [];
}
/** Official rate is a suggestion; classification, opening value and first year fraction are explicit. */
export function depreciationForYear(asset: FinancialAsset, year: number): DepreciationRow {
  const row: DepreciationRow = { assetId: asset.id, name: asset.name, openingCents: 0, additionCents: 0, depreciationCents: 0, closingCents: 0, disposalBookValueCents: 0, disposalProceedsCents: 0, method: asset.method, ratePct: asset.ratePct, missing: [] };
  try { validateAsset(asset); } catch (error) { row.missing.push(`${asset.name} : ${(error as Error).message}`); return row; }
  const acquisitionYear = Number(isoDate(asset.acquisitionDate)!.slice(0, 4));
  if (year < acquisitionYear) return row;
  if (!asset.openingConfirmed) { row.missing.push(`${asset.name} : valeur de reprise et méthode à confirmer.`); return row; }
  if (year < asset.openingYear) { row.missing.push(`${asset.name} : valeur comptable de ${year} antérieure à la reprise.`); return row; }
  const disposalYear = asset.disposedDate ? Number(isoDate(asset.disposedDate)!.slice(0, 4)) : null;
  if (disposalYear != null && disposalYear < asset.openingYear) return row;
  let book = asset.openingValueCents;
  const cost = Math.round(asset.acquisitionCents * asset.businessUsePct / 100);
  const serviceYear = Number(isoDate(asset.inServiceDate)!.slice(0, 4));
  for (let currentYear = asset.openingYear; currentYear <= year; currentYear++) {
    if (disposalYear != null && currentYear > disposalYear) { book = 0; continue; }
    const opening = currentYear === acquisitionYear ? 0 : book;
    const addition = currentYear === acquisitionYear ? cost : 0;
    if (addition) book = cost;
    const fraction = currentYear === serviceYear ? asset.firstYearFraction : currentYear < serviceYear ? 0 : 1;
    const depreciation = Math.min(book, Math.max(0, Math.round((asset.method === 'linear' ? cost : book) * asset.ratePct / 100 * fraction)));
    book -= depreciation;
    const disposed = disposalYear === currentYear;
    if (currentYear === year) {
      Object.assign(row, { openingCents: opening, additionCents: addition, depreciationCents: depreciation,
        closingCents: disposed ? 0 : book, disposalBookValueCents: disposed ? book : 0,
        disposalProceedsCents: disposed ? Math.round((asset.disposalProceedsCents ?? 0) * asset.businessUsePct / 100) : 0 });
      if (disposed && asset.disposalProceedsCents == null) row.missing.push(`${asset.name} : prix de cession à confirmer, y compris zéro.`);
    }
    if (disposed) book = 0;
  }
  return row;
}
export function buildAnnualReport(input: { year: number; transactions: FinanceTransaction[]; payments: FinancialPayment[]; assets: FinancialAsset[]; profile: FinancialProfile; closing?: FinancialClosing; generatedAt?: string }): AnnualReport {
  const { year, transactions, payments, assets, profile, closing } = input;
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('Exercice invalide.');
  if (closing?.report) return JSON.parse(JSON.stringify(closing.report));
  const start = `${year}-01-01`, end = `${year}-12-31`, missing: string[] = [], notes: string[] = [];
  const txs = transactions.filter(isActiveTransaction).filter(tx => { const date = isoDate(tx.date); return date && date >= start && date <= end; });
  const report: AnnualReport = { year, generatedAt: input.generatedAt ?? new Date().toISOString(), basis: 'invoice-with-inventory-adjustments',
    revenueCents: 0, operatingExpensesCents: 0, capitalPurchasesCents: 0, inventoryChangeCents: null, depreciationCents: 0, adjustmentCents: 0, disposalResultCents: 0, resultCents: null,
    receivedCents: 0, paidCents: 0, contributionsCents: 0, withdrawalsCents: 0, cashCents: null, receivablesCents: 0, payablesCents: 0,
    openingInventory: closing?.openingInventory ?? [], closingInventory: closing?.closingInventory ?? [], depreciation: [], categories: [], documents: [], missing, notes };
  const categoryTotals = new Map<string, number>();
  let unclassifiedCapital = false;
  let invalidRefund = false;
  for (const tx of txs) {
    const amount = transactionAmount(tx), kind = transactionKind(tx), business = tx.finance?.businessUsePct ?? 100;
    if (kind === 'contribution') report.contributionsCents += amount;
    if (kind === 'withdrawal') report.withdrawalsCents += amount;
    if (kind === 'income') {
      const allocatedDisposals = assets.filter(a => a.disposalTransactionId === tx.id && !assetDisposalIssues(a, transactions, assets).length).reduce((n, a) => n + (a.disposalProceedsCents ?? 0), 0);
      report.revenueCents += amount - allocatedDisposals;
    }
    if (kind === 'refund') {
      const issue = refundLinkIssue(tx, transactions);
      if (issue) { missing.push(issue); invalidRefund = true; }
      else if (transactionDirection(tx, transactions) === 'out') report.revenueCents -= amount;
      else {
        const original = transactions.find(t => t.id === tx.finance?.refundOfId);
        const originalAssets = assets.filter(a => a.transactionId === original?.id);
        const capitalRefund = originalAssets.length > 0 || original?.finance?.lines.some(l => l.kind === 'equipment' && l.capitalTreatment !== 'expense') || !original?.finance && original && ['materiel', 'renovation'].includes(original.category);
        if (capitalRefund) {
          report.capitalPurchasesCents -= amount;
          const reviewed = originalAssets.some(a => a.capitalAdjustmentTransactionIds?.includes(tx.id));
          const credits = transactions.filter(t => isActiveTransaction(t) && transactionKind(t) === 'refund' && t.finance?.refundOfId === original?.id && transactionDirection(t, transactions) === 'in').reduce((n, t) => n + transactionAmount(t), 0);
          const adjustedCost = originalAssets.reduce((n, a) => n + a.acquisitionCents, 0);
          if (!reviewed || !original || adjustedCost > Math.max(0, transactionAmount(original) - credits)) {
            missing.push(`${tx.id} : avoir sur immobilisation — ajuster le coût du registre et y relier cet avoir avant de calculer le résultat.`);
            unclassifiedCapital = true;
          }
        } else {
          const chargeCredit = Math.round(amount * (original?.finance?.businessUsePct ?? 100) / 100);
          report.operatingExpensesCents -= chargeCredit;
          const category = original?.category ?? tx.category;
          categoryTotals.set(category, (categoryTotals.get(category) ?? 0) - chargeCredit);
        }
      }
    }
    if (kind === 'expense') {
      const assetRows = assets.filter(a => a.transactionId === tx.id);
      const allEquipmentLines = tx.finance?.lines.filter(l => l.kind === 'equipment') ?? [];
      const equipmentLines = allEquipmentLines.filter(l => l.capitalTreatment !== 'expense');
      const adjustedCredits = transactions.filter(t => isActiveTransaction(t) && transactionKind(t) === 'refund' && t.finance?.refundOfId === tx.id && assetRows.some(a => a.capitalAdjustmentTransactionIds?.includes(t.id))).reduce((n, t) => n + transactionAmount(t), 0);
      const capex = Math.min(amount, allEquipmentLines.length ? equipmentLines.reduce((sum, l) => sum + l.amountCents, 0) : assetRows.reduce((sum, a) => sum + a.acquisitionCents, 0) + adjustedCredits);
      report.capitalPurchasesCents += capex;
      const charge = Math.round((amount - capex) * business / 100);
      report.operatingExpensesCents += charge;
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + charge);
      if ((equipmentLines.length && equipmentLines.some(l => !assets.some(a => a.id === l.assetId || a.transactionId === tx.id && a.lineId === l.id))) || !tx.finance && ['materiel', 'renovation'].includes(tx.category)) {
        missing.push(`${tx.description} : confirmer charge ou immobilisation et compléter le registre.`);
        unclassifiedCapital = true;
      }
      if (allEquipmentLines.some(l => l.capitalTreatment === 'expense' && assetRows.some(a => a.lineId === l.id))) {
        missing.push(`${tx.description} : une ligne passée en charge figure aussi dans le registre des immobilisations. Corriger son affectation.`);
        unclassifiedCapital = true;
      }
    }
    if (!tx.proofUrl && !tx.finance?.proofDocumentId && ['income', 'expense', 'refund'].includes(kind)) missing.push(`Justificatif manquant : ${tx.id} — ${tx.description}.`);
    report.documents.push({ id: tx.id, date: isoDate(tx.date)!, description: tx.description, amountCents: amount, category: tx.category, hasProof: !!tx.proofUrl || !!tx.finance?.proofDocumentId, vendor: transactionVendor(tx),
      required: ['income', 'expense', 'refund'].includes(kind), proofDocumentId: tx.finance?.proofDocumentId, proofFileName: tx.proofFileName,
      proofSource: tx.finance?.proofDocumentId ? 'document' : tx.proofUrl?.startsWith('data:') ? 'legacy-inline' : tx.proofUrl ? 'external' : undefined,
      proofUrl: tx.proofUrl && /^https?:\/\//i.test(tx.proofUrl) ? tx.proofUrl : undefined });
  }
  const yearPayments = payments.filter(p => validPayment(p) && isoDate(p.date)! >= start && isoDate(p.date)! <= end);
  report.receivedCents = yearPayments.filter(p => p.direction === 'in').reduce((sum, p) => sum + p.amountCents, 0);
  report.paidCents = yearPayments.filter(p => p.direction === 'out').reduce((sum, p) => sum + p.amountCents, 0);
  const ledger = summarizeLedger(transactions, payments, profile, end);
  report.cashCents = ledger.cashCents;
  report.receivablesCents = ledger.receivablesCents;
  report.payablesCents = ledger.payablesCents;
  report.outstanding = ledger.outstanding.map(row => ({ id: row.id, date: row.date ?? '', description: row.description,
    counterparty: transactionVendor(transactions.find(t => t.id === row.id)!), address: '', direction: row.direction, amountCents: row.remainingCents }));
  report.adjustments = structuredClone(closing?.adjustments ?? []);
  const supportIds = new Set([...ledger.outstanding.map(r => r.id), ...assets.filter(a => isoDate(a.acquisitionDate)! <= end).flatMap(a => [a.transactionId, ...(a.capitalAdjustmentTransactionIds ?? [])].filter((id): id is string => !!id))]);
  report.supportingDocuments = transactions.filter(t => supportIds.has(t.id) && !report.documents.some(d => d.id === t.id)).map(tx => ({
    id: tx.id, date: isoDate(tx.date) ?? '', description: tx.description, amountCents: transactionAmount(tx), category: tx.category, hasProof: !!tx.proofUrl || !!tx.finance?.proofDocumentId,
    vendor: transactionVendor(tx), required: true, proofDocumentId: tx.finance?.proofDocumentId, proofFileName: tx.proofFileName,
    proofSource: tx.finance?.proofDocumentId ? 'document' as const : tx.proofUrl?.startsWith('data:') ? 'legacy-inline' as const : tx.proofUrl ? 'external' as const : undefined,
    proofUrl: tx.proofUrl && /^https?:\/\//i.test(tx.proofUrl) ? tx.proofUrl : undefined }));
  missing.push(...report.supportingDocuments.filter(d => !d.hasProof).map(d => `Justificatif antérieur à joindre : ${d.id} — ${d.description}.`));
  if (!ledger.cashComplete) missing.push('Trésorerie incomplète : confirmer le solde initial et les paiements depuis sa date.');
  if (payments.some(p => !validPayment(p))) missing.push('Des paiements ont une date ou un montant invalide ; corriger ces mouvements pour vérifier la trésorerie.');
  const unknown = transactions.filter(isActiveTransaction).filter(t => isoDate(t.date) && isoDate(t.date)! <= end && paymentState(t, payments, transactions, end).state === 'unknown');
  if (unknown.length) missing.push(`${unknown.length} pièce(s) sans paiement vérifiable : créances et dettes incomplètes.`);
  if (transactions.some(tx => isActiveTransaction(tx) && !isoDate(tx.date))) missing.push('Des pièces sans date valide ne peuvent pas être affectées à un exercice.');
  report.depreciation = assets.map(a => depreciationForYear(a, year));
  report.assetEvidence = assets.filter(a => isoDate(a.acquisitionDate) && isoDate(a.acquisitionDate)! <= end && (!a.disposedDate || isoDate(a.disposedDate)! >= start)).map(a => ({
    id: a.id, name: a.name, transactionId: a.transactionId,
    hasLinkedProof: !![...report.documents, ...(report.supportingDocuments ?? [])].find(d => d.id === a.transactionId && d.hasProof) }));
  assets.filter(a => a.disposedDate && Number(isoDate(a.disposedDate)?.slice(0, 4)) === year).forEach(a => {
    const row = report.depreciation.find(r => r.assetId === a.id);
    row?.missing.push(...assetDisposalIssues(a, transactions, assets));
  });
  report.depreciationCents = report.depreciation.reduce((sum, a) => sum + a.depreciationCents, 0);
  report.disposalResultCents = report.depreciation.reduce((sum, a) => sum + a.disposalProceedsCents - a.disposalBookValueCents, 0);
  missing.push(...report.depreciation.flatMap(a => a.missing));
  if (closing?.inventoriesConfirmed) {
    report.inventoryChangeCents = report.closingInventory.reduce((sum, row) => sum + row.valueCents, 0) - report.openingInventory.reduce((sum, row) => sum + row.valueCents, 0);
  } else missing.push('Inventaires d’ouverture et de clôture à confirmer : matières, emballages, production en cours et bière finie.');
  report.adjustmentCents = closing?.adjustments.reduce((sum, a) => sum + a.amountCents, 0) ?? 0;
  if (report.inventoryChangeCents != null && !unclassifiedCapital && !invalidRefund && !report.depreciation.some(a => a.missing.length)) {
    report.resultCents = report.revenueCents - report.operatingExpensesCents + report.inventoryChangeCents - report.depreciationCents + report.adjustmentCents + report.disposalResultCents;
  }
  report.categories = [...categoryTotals].map(([category, amountCents]) => ({ category, amountCents })).sort((a, b) => b.amountCents - a.amountCents);
  report.documents.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  notes.push('Dossier préparatoire pour une raison individuelle à Fribourg. Les comptes et annexes doivent être vérifiés et signés avant leur transmission.');
  notes.push('Résultat établi à la date des pièces, ajusté des inventaires et amortissements. Les encaissements et décaissements sont présentés séparément ; aucune variation de créances ou dettes n’est ajoutée une seconde fois.');
  notes.push('Les coûts du temps personnel du propriétaire sont exclus. Les apports et prélèvements privés ne modifient pas le résultat.');
  notes.push('Non-assujettissement : coûts TTC, sans récupération de TVA. Les montants historiques sont conservés.');
  if (profile.vatRegistered) missing.push('Le dossier simplifié sans TVA nécessite une adaptation pour une activité assujettie.');
  if (report.revenueCents >= 50_000_000) missing.push('Chiffre d’affaires d’au moins 500 000 CHF : vérifier l’obligation de comptabilité selon le CO avant d’utiliser ce dossier simplifié.');
  if (closing?.notes) notes.push(closing.notes);
  report.missing = [...new Set(missing)];
  report.tax = buildFribourgTaxReport(report, closing?.tax);
  return report;
}
