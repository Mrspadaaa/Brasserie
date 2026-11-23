import { useMemo } from 'react';
import type { Transaction } from '../../types';
import { isActiveTransaction, isoDate, paymentState } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { dansJours, joursDeCompte } from '../../ui/finance/operations/plage';
import { donneesFriseDe } from '../../ui/finance/operations/donneesFrise';
import { aujourdhuiISO } from './periode';

const lireFinance = () => FinanceService.snapshot();

/**
 * Ce que la frise de la période de l'app lit : les opérations et paiements de Finances, par les mêmes règles que la frise d'Opérations
 * (`donneesFriseDe`, `joursDeCompte` : une pièce à payer compte à son échéance, une pièce payée à son dernier paiement).
 * Limite : les archives ne sont pas écartées ; sur les jours qu'on voit (l'exercice en cours) cela ne change rien.
 */
export function useDonneesFrise(transactions: Transaction[]) {
  const finance = useStorageValue(lireFinance);
  const payments = finance.payments;
  const aujourdhui = aujourdhuiISO();
  return useMemo(() => {
    const entrees = transactions.map(transaction => ({
      transaction, payment: paymentState(transaction, payments, transactions, aujourdhui), date: isoDate(transaction.date)
    }));
    const jours = joursDeCompte(entrees, payments, aujourdhui);
    return {
      donnees: donneesFriseDe(entrees, payments, aujourdhui, jours),
      /** Opérations actives comptées dans [du, au] (jour où elles comptent). */
      nombre: (du: string | null, au: string | null) => entrees.filter(e => {
        const j = jours.get(e.transaction.id) ?? e.date;
        return !!j && isActiveTransaction(e.transaction) && dansJours(j, du, au);
      }).length,
      /** v1 (33) : premier et dernier jour des opérations actives (« Tout l'historique » dit d'où à où) ; `null` sans opération datée. */
      etendue: (() => {
        const js = entrees.filter(e => isActiveTransaction(e.transaction)).map(e => jours.get(e.transaction.id) ?? e.date).filter((j): j is string => !!j).sort();
        return js.length ? { du: js[0], au: js[js.length - 1] } : null;
      })()
    };
  }, [transactions, payments, aujourdhui]);
}
