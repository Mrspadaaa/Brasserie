import { useMemo } from 'react';
import type { FinanceLine, FinanceTransaction, FinancialPayment } from '../../../domain/finance/types';
import { effetPiece, type EffetPiece, type PieceEnSaisie } from '../../../domain/finance/effetPiece';
import { isoDate, todayISO } from '../../../domain/finance/ledger';
import { arrondiDuTotal, type PurchaseDraft } from '../../../services/purchaseEntry';

/**
 * La pièce de la Nouvelle dépense telle que l'enregistrement l'écrira : mêmes lignes (`savePurchase`), même catégorie, même règlement.
 * Le règlement est lu dans le brouillon, jamais copié : « Payé » sans date valide reste « inconnu » (compté plein, jamais supposé à payer).
 */
const cents = (valeur: number | undefined) => Math.round((valeur ?? 0) * 100);

export function pieceDeDepense(draft: PurchaseDraft): PieceEnSaisie {
  const lignes: FinanceLine[] = draft.lines.map(l => ({ id: l.id, description: l.description.trim(), kind: (l.kind === 'maintenance' ? 'service' : l.kind) as FinanceLine['kind'], amountCents: cents(l.amount) }));
  const arrondi = arrondiDuTotal(draft);
  if (arrondi) lignes.push({ id: 'arrondi-5ct', description: 'Arrondi à 5 centimes', kind: arrondi < 0 ? 'discount' : 'other', amountCents: arrondi });
  const reglee = draft.paymentStatus === 'paid' && !!isoDate(draft.paymentDate || draft.date);
  return {
    sens: 'out', date: draft.date, montantCents: cents(draft.amount), categorie: draft.category, description: draft.description, lignes,
    reglement: reglee ? 'paye' : draft.paymentStatus === 'unpaid' ? 'a-payer' : 'inconnu',
    dateReglement: draft.paymentDate || draft.date, moyen: draft.paymentMethod, echeance: draft.dueDate,
  };
}

/** L'effet de la pièce sur son mois, recalculé seulement quand la pièce ou le nombre d'écritures change. */
export function useEffetPiece(piece: PieceEnSaisie, transactions: FinanceTransaction[], payments: FinancialPayment[], idFinal?: string): EffetPiece | null {
  const cle = JSON.stringify(piece);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => effetPiece({ piece, transactions, payments, aujourdhui: todayISO(), idFinal }), [cle, transactions, payments, idFinal]);
}
