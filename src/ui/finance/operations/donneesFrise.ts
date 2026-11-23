import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { isActiveTransaction } from '../../../domain/finance/ledger';
import { periodeSynthese, type PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import type { DonneesFrise } from './Frise';
import { redater } from './plage';

/**
 * Les données de la frise (s2ap2), extraites de `TransactionJournal` pour que la frise de la période de l'app (en-tête, Plus) lise
 * exactement ce que lit celle d'Opérations : un jour à la fois, par `periodeSynthese` (une seule règle de « dépensé »). Un mois sans
 * aucune opération saisie est inconnu, pas vide. Un mois est « saisi » par la date d'une pièce ou par le jour où elle compte
 * (l'échéance d'une facture d'octobre à payer en novembre).
 */
export function donneesFriseDe(
  sources: ReadonlyArray<{ transaction: Transaction; date: string | null }>,
  payments: FinancialPayment[], aujourdhui: string, joursCompte: Map<string, string>,
  /** Les pièces que la liste garde (filtre de catégorie, recherche) : elles seules font les barres ; `sources` dit quels mois sont saisis. */
  dessinees: ReadonlyArray<{ transaction: Transaction }> = sources,
): DonneesFrise {
  const cache = new Map<string, PeriodeSynthese>(), saisis = new Set<string>();
  const tx = redater(dessinees.map(e => e.transaction), joursCompte);
  for (const e of sources) if (e.date && isActiveTransaction(e.transaction)) { saisis.add(e.date.slice(0, 7)); const j = joursCompte.get(e.transaction.id); if (j) saisis.add(j.slice(0, 7)); }
  return {
    periodeJour: (jour: string) => { let p = cache.get(jour); if (!p) { p = periodeSynthese({ transactions: tx, payments, mois: jour, aujourdhui }); cache.set(jour, p); } return p; },
    moisSaisi: (m: string) => saisis.has(m),
  };
}
