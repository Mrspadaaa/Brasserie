import React, { useState } from 'react';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import type { Transaction } from '../../types';
import { TransactionDetails } from '../finance/TransactionDetails';
import { PaymentSheet } from '../finance/FinanceForms';
import { MovementSheet } from '../finance/MovementSheet';
import { EditTransactionModal } from '../../components/EditTransactionModal';
import '../finance/finance.css';

const lireFinance = () => FinanceService.snapshot();

/**
 * « Ouvrir la vente » (Atelier › Tarifs, prix à vérifier) : la vente s'ouvre ICI, dans sa feuille par-dessus Tarifs, avec les mêmes gestes que
 * dans Finances › Opérations (Modifier, Payer, Rembourser). On ne quitte pas l'Atelier : fermer la feuille, ou enregistrer la correction,
 * laisse Tarifs sous les yeux, et la frise relit les ventes en direct (le point corrigé revient sur l'axe). Aucune recherche n'est posée dans Finances.
 */
export function VenteDeTarifs({ id, onClose }: { id: string; onClose: () => void }) {
  const transactions = useStorageValue(StorageService.getTransactions);
  const data = useStorageValue(lireFinance);
  const [courante, setCourante] = useState(id);
  const [edition, setEdition] = useState<Transaction | null>(null);
  const [paiement, setPaiement] = useState<Transaction | null>(null);
  const [mouvement, setMouvement] = useState<Transaction | null | undefined>(undefined);
  const tx = transactions.find((t) => t.id === courante);
  const vivante = (t: Transaction) => transactions.find((x) => x.id === t.id) ?? t;
  return <>
    {tx && !edition && !paiement && mouvement === undefined && <TransactionDetails transaction={tx} transactions={transactions} payments={data.payments} plans={data.plans}
      onClose={onClose} onEdit={() => setEdition(tx)} onPay={() => setPaiement(tx)} onRefund={() => setMouvement(tx)} onOpenTransaction={(t) => setCourante(t.id)} />}
    {edition && <EditTransactionModal isOpen transaction={vivante(edition)} onClose={() => setEdition(null)} onSave={() => { setEdition(null); onClose(); }} />}
    {paiement && <PaymentSheet transaction={vivante(paiement)} payments={data.payments} transactions={transactions} onClose={() => setPaiement(null)} />}
    {mouvement !== undefined && <MovementSheet original={mouvement ?? undefined} onClose={() => setMouvement(undefined)} onSaved={() => setMouvement(undefined)} />}
  </>;
}
