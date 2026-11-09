import type { AnnualReport, FinancialClosing, FribourgTaxClosing } from '../../../domain/finance/types';
import { emptyTaxClosing, taxBasisKey, validateTaxClosing } from '../../../domain/finance/fribourgTax';
import { FinanceService } from '../../../services/financeService';
import { idFor } from '../FinanceForms';

/**
 * UNE seule voie d'écriture de l'Annuel dans `closing.tax` (revue A-B1, B-D10).
 * - lit la clôture AU MOMENT d'écrire (jamais une prop périmée) ;
 * - repart de `reviews = {}` si les relectures stockées portent sur d'autres comptes (le domaine les ignore à la lecture) ;
 * - une écriture de `balances` invalide `balance`, une de `corrections` invalide `privateUse` et `social` (comme `TaxClosingSheet`) ;
 * - `reviewedBasis` n'est posé que si `reviews` change ;
 * - une version figée n'est jamais réécrite : on la fork vers un brouillon neuf (comme `TaxClosingSheet` et `FinancesTab`) ;
 * - aucune attente réseau : l'écriture locale part dans la file de `FirestoreRepo`.
 */
export function ecrireTax(year: number, report: AnnualReport, closingId: string | undefined, patch: (tax: FribourgTaxClosing) => void): FinancialClosing {
  const existante = closingId ? FinanceService.getClosings().find(c => c.id === closingId) : undefined;
  const maintenant = new Date().toISOString();
  const base: FinancialClosing = existante?.report
    ? { ...structuredClone({ ...existante, report: undefined }), id: idFor(`CLOTURE-${year}`), createdAt: maintenant, report: undefined }
    : existante ?? FinanceService.getClosings().find(c => c.year === year && !c.report) ?? { id: `CLOTURE-${year}`, year, createdAt: maintenant, openingInventory: [], closingInventory: [], inventoriesConfirmed: false, adjustments: [] };
  const tax: FribourgTaxClosing = structuredClone(base.tax ?? emptyTaxClosing());
  const cle = taxBasisKey(report);
  if (tax.reviewedBasis !== cle) tax.reviews = {};
  const avant = JSON.stringify(tax.reviews), soldes = JSON.stringify(tax.balances), corrections = JSON.stringify(tax.corrections);
  patch(tax);
  if (JSON.stringify(tax.balances) !== soldes) tax.reviews = { ...tax.reviews, balance: false };
  if (JSON.stringify(tax.corrections) !== corrections) tax.reviews = { ...tax.reviews, privateUse: false, social: false };
  if (JSON.stringify(tax.reviews) !== avant) tax.reviewedBasis = cle;
  validateTaxClosing(tax);
  return FinanceService.saveClosing({ ...base, tax });
}
