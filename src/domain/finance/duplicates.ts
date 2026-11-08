import { normalize } from '../../services/search';
import { isActiveTransaction, transactionKind } from './ledger';
import type { FinanceTransaction } from './types';

/**
 * AM n° 7 : une facture s'identifie par le couple (fournisseur normalisé, n°) ou par sa référence QR de paiement, quel que soit son total.
 * Ce module est pur : il lit des écritures, n'en écrit aucune. Un doublon est un avertissement à lire, jamais une suppression.
 */
const LEGAL_FORMS = new Set(['sa', 'ag', 'gmbh', 'sarl', 'sagl', 'snc', 'sas', 'srl', 'spa', 'ltd', 'llc', 'inc', 'kg', 'co', 'cie', 'ohg', 'ug', 'se', 'bv', 'nv', 'plc']);
/** « MALTERIE DU BANC » et « Malterie du Banc SA » désignent le même fournisseur : casse, accents, ponctuation et forme juridique finale ne comptent pas
 * (« Moulin Co Brasserie » garde son « co »). Les initiales séparées (« S.à r.l. ») forment une seule forme juridique. */
export function vendorKey(vendor: string): string {
  const tokens = normalize(vendor).split(/[^a-z0-9]+/).filter(Boolean);
  const merged = tokens.reduce<string[]>((out, token, index) => {
    if (token.length === 1 && index > 0 && tokens[index - 1].length === 1) out[out.length - 1] += token; else out.push(token);
    return out;
  }, []);
  while (merged.length > 1 && LEGAL_FORMS.has(merged[merged.length - 1])) merged.pop();
  return merged.join(' ');
}
/** « MB-131 », « mb 131 » et « MB.131 » sont le même numéro de facture ; une lecture « MB-1O1 » vaut « MB-101 ». */
export const invoiceKey = (invoice: string | undefined): string => normalize(invoice ?? '').replace(/[^a-z0-9]/g, '').replace(/o/g, '0').replace(/[il]/g, '1');
/** Référence de paiement (QRR de 27 chiffres, SCOR « RF… ») sans espaces ni casse. Moins de 10 caractères : pas une référence. */
export const paymentReferenceKey = (reference: string | undefined): string => {
  const key = (reference ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return key.length >= 10 ? key : '';
};
/** Chiffres d'un numéro de commande : « Onlinebestellung-686863 » donne 686863. Moins de 5 chiffres : trop courant pour identifier. */
export const orderNumbers = (order: string | undefined): string[] => (order ?? '').match(/\d{5,}/g) ?? [];

export interface LedgerDuplicate {
  ids: string[]; reason: string;
  /** Clé stable du groupe (« facture|…», « reference|… », « commande|686863 ») : sert à écarter un avertissement (« Ce n'est pas un doublon »). */
  key: string;
  /** « commande » : de petites lignes anciennes d'une même commande déjà reprise par une facture saisie. */
  kind: 'facture' | 'reference' | 'commande';
}

const isExpense = (tx: FinanceTransaction): boolean => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.sourceDocumentType !== 'credit_note';

/**
 * Les doublons DÉJÀ au grand livre. Trois recoupements, sur les dépenses non annulées :
 * 1. même fournisseur normalisé et même n° de facture ;
 * 2. même référence QR de paiement ;
 * 3. une écriture ancienne (B-001…, sans n° de commande lu) dont le libellé porte le n° de commande d'une facture saisie ensuite
 *    (« Cmd 686863 » contre « Onlinebestellung-686863 ») : l'achat est au registre deux fois.
 */
export function ledgerDuplicates(transactions: FinanceTransaction[]): LedgerDuplicate[] {
  const expenses = transactions.filter(isExpense);
  const groups = new Map<string, { ids: Set<string>; reason: string }>();
  const add = (key: string, reason: string, ...ids: string[]) => {
    const group = groups.get(key) ?? { ids: new Set<string>(), reason };
    ids.forEach(id => group.ids.add(id));
    groups.set(key, group);
  };
  const byInvoice = new Map<string, FinanceTransaction[]>(), byReference = new Map<string, FinanceTransaction[]>();
  for (const tx of expenses) {
    const finance = tx.finance;
    if (!finance) continue;
    const vendor = vendorKey(finance.vendor ?? ''), invoice = invoiceKey(finance.invoiceNumber), reference = paymentReferenceKey(finance.paymentReference);
    if (vendor && invoice) byInvoice.set(`${vendor}|${invoice}`, [...(byInvoice.get(`${vendor}|${invoice}`) ?? []), tx]);
    // RF-2 : la référence n'identifie une facture qu'avec le même fournisseur normalisé et le même n° (ou aucun n° des deux côtés) : un créancier à référence constante n'est pas un doublon.
    if (reference) { const cle = `${reference}|${vendor}|${invoice}`; byReference.set(cle, [...(byReference.get(cle) ?? []), tx]); }
  }
  for (const [key, list] of byInvoice) if (list.length > 1) add(`facture|${key}`, `Même facture n° ${(list[0].finance?.invoiceNumber ?? '').trim()} chez le même fournisseur`, ...list.map(tx => tx.id));
  for (const [key, list] of byReference) if (list.length > 1) add(`reference|${key}`, 'Même référence de paiement QR', ...list.map(tx => tx.id));
  const ordered = new Map<string, FinanceTransaction[]>();
  for (const tx of expenses) for (const number of orderNumbers(tx.finance?.sourceOrderNumber)) ordered.set(number, [...(ordered.get(number) ?? []), tx]);
  for (const [number, invoices] of ordered) {
    const old = expenses.filter(tx => !tx.finance?.sourceOrderNumber && !invoices.includes(tx) && new RegExp(`(^|\\D)${number}(\\D|$)`).test(tx.description ?? ''));
    if (old.length) add(`commande|${number}`, `Même commande ${number} : ${old.length} ${old.length > 1 ? 'petites lignes anciennes' : 'petite ligne ancienne'} (libellé « Cmd ${number} ») et ${invoices.length > 1 ? 'les factures saisies' : 'la facture saisie'} qui la reprend`, ...invoices.map(tx => tx.id), ...old.map(tx => tx.id));
  }
  return [...groups.entries()].map(([key, { ids, reason }]) => ({ ids: [...ids], reason, key, kind: key.split('|')[0] as LedgerDuplicate['kind'] }));
}
export const ledgerDuplicateIds = (transactions: FinanceTransaction[]): Set<string> => new Set(ledgerDuplicates(transactions).flatMap(group => group.ids));
