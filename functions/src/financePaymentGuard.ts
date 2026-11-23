/** Rebuild trusted settlement state from the immutable register during a restore. */
export function paymentGuardFromRegister(transaction: Record<string, any>, payments: Record<string, any>[]) {
  const finance = transaction.finance ?? {};
  const kind = finance.kind ?? (transaction.category === 'recettes' ? 'income' : transaction.category === 'apports' ? 'contribution' : 'expense');
  const direction = kind === 'refund' ? finance.refundDirection ?? 'in' : ['income', 'contribution'].includes(kind) ? 'in' : 'out';
  const amount = finance.version === 1 && Number.isSafeInteger(finance.amountCents) ? finance.amountCents : Math.round((transaction.amountTTC ?? transaction.amountHT ?? 0) * 100);
  const rows = payments.filter(payment => payment.transactionId === transaction.id);
  if (rows.some(p => !Number.isSafeInteger(p.amountCents) || p.amountCents <= 0 || !['in', 'out'].includes(p.direction))) throw new Error(`Paiements invalides pour ${transaction.id}.`);
  const balance = rows.reduce((sum, payment) => sum + (payment.direction === direction ? payment.amountCents : -payment.amountCents), 0);
  if (!Number.isSafeInteger(balance) || balance < 0 || balance > amount || finance.voidedAt && balance !== 0) throw new Error(`Le registre des paiements est incompatible avec la pièce ${transaction.id}.`);
  const ordered = [...rows].sort((a, b) => String(a.recordedAt ?? a.date ?? '').localeCompare(String(b.recordedAt ?? b.date ?? '')) || String(a.id).localeCompare(String(b.id)));
  const last = ordered[ordered.length - 1];
  return { settlementBalanceCents: balance, lastPaymentId: last?.id ?? '' };
}
