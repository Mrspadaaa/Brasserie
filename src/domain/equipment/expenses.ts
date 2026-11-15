import type { EquipmentItem } from '../../types';
import type { FinanceTransaction } from '../finance/types';
import { isActiveTransaction, transactionKind } from '../finance/ledger';
import { lireDate } from './dates';

export interface EquipmentExpenseLine {
  /** ISO ; null = date inconnue (l'achat saisi sans date). */
  date: string | null;
  label: string;
  /** Centimes ; null = prix inconnu, jamais 0. */
  amountCents: number | null;
  kind: 'achat' | 'entretien' | 'autre';
  txId?: string;
  lineId?: string;
}
export interface EquipmentExpenses { lines: EquipmentExpenseLine[]; totalCents: number; known: number; count: number }

/**
 * Dépenses reliées à l'appareil : les lignes (équipement, entretien, autre) des factures actives qui portent son `equipmentRef`,
 * plus son achat saisi sur la fiche s'il n'est pas déjà porté par une facture. Seules les dépenses comptent (pas avoirs ni
 * recettes). `totalCents` = somme des montants connus ; `known` = combien ; `count` = nombre de lignes, prix inconnu compris
 * (à l'écran : « 37,40 CHF · 2 prix connus »). Plus récent d'abord, l'inconnu en dernier.
 */
export function relatedExpenses(item: EquipmentItem, transactions: FinanceTransaction[]): EquipmentExpenses {
  const lines: EquipmentExpenseLine[] = [];
  for (const tx of transactions) {
    if (!isActiveTransaction(tx) || transactionKind(tx) !== 'expense') continue;
    for (const line of tx.finance?.lines ?? []) {
      if (!line.equipmentRef || (line.equipmentRef !== item.ref && line.equipmentRef !== item.id)) continue;
      lines.push({
        date: lireDate(tx.date),
        label: line.description?.trim() || tx.description,
        amountCents: Number.isSafeInteger(line.amountCents) ? line.amountCents : null,
        kind: line.kind === 'equipment' ? 'achat' : line.kind === 'service' ? 'entretien' : 'autre',
        txId: tx.id,
        lineId: line.id,
      });
    }
  }
  if (!lines.some(l => l.kind === 'achat')) {
    const prix = typeof item.purchasePrice === 'number' && Number.isFinite(item.purchasePrice) && item.purchasePrice > 0 ? Math.round(item.purchasePrice * 100) : null;
    lines.push({ date: lireDate(item.purchaseDate), label: 'Achat', amountCents: prix, kind: 'achat' });
  }
  lines.sort((a, b) => (a.date && b.date ? b.date.localeCompare(a.date) : a.date ? -1 : b.date ? 1 : 0));
  const connus = lines.filter(l => l.amountCents !== null);
  return { lines, totalCents: connus.reduce((sum, l) => sum + (l.amountCents as number), 0), known: connus.length, count: lines.length };
}

/** Valeur du parc : somme des prix d'achat connus (> 0) des appareils en service ; l'inconnu n'est pas compté comme 0. */
export function parcValue(items: EquipmentItem[]): { totalCents: number; known: number } {
  let totalCents = 0, known = 0;
  for (const item of items) {
    if (item.retired) continue;
    const p = item.purchasePrice;
    if (typeof p === 'number' && Number.isFinite(p) && p > 0) { totalCents += Math.round(p * 100); known += 1; }
  }
  return { totalCents, known };
}
