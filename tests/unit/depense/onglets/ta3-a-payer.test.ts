// TA3 : « à payer » de la Synthèse et « Factures à régler » des Prévisions suivent la même règle pour une pièce datée dans le futur.
import { describe, expect, it } from 'vitest';
import { buildForecast } from '../../../../src/domain/finance/forecast';
import { summarizeLedger } from '../../../../src/domain/finance/ledger';
import { buildAnnualReport } from '../../../../src/domain/finance/annual';
import { ASOF, pay, profile, tx } from './fixtures';

const withOption = { includeScheduled: true };
const invoiceTotal = (fc: ReturnType<typeof buildForecast>) => fc.items.filter(i => i.source === 'invoice').reduce((s, i) => s + i.amountCents, 0);

describe('TA3 : pièce à payer datée dans le futur', () => {
  it('sonde A : la Synthèse la compte comme les Prévisions (5 000 centimes)', () => {
    const t = [tx('A-futur', '2026-11-01', 5000, { paymentStatus: 'unpaid', dueDate: '2026-11-15' })];
    const ledger = summarizeLedger(t, [], profile, ASOF, withOption);
    const fc = buildForecast({ transactions: t, payments: [], plans: [], profile, asOf: ASOF });
    expect(ledger.payablesCents).toBe(5000);
    expect(ledger.payablesCents).toBe(invoiceTotal(fc));
    expect(ledger.outstanding).toHaveLength(1);
    expect(ledger.outstanding[0]).toMatchObject({ id: 'A-futur', remainingCents: 5000, dueDate: '2026-11-15', direction: 'out' });
  });

  it('sans l’option, le calcul d’avant est conservé (bilan annuel, tableau de bord, assistant)', () => {
    const t = [tx('A-futur', '2026-11-01', 5000, { paymentStatus: 'unpaid', dueDate: '2026-11-15' })];
    const ledger = summarizeLedger(t, [], profile, ASOF);
    expect(ledger.payablesCents).toBe(0);
    expect(ledger.outstanding).toEqual([]);
  });

  it('une vente future à encaisser compte de même', () => {
    const t = [tx('V-futur', '2026-11-03', 30000, { paymentStatus: 'unpaid', dueDate: '2026-12-03' }, 'income')];
    const ledger = summarizeLedger(t, [], profile, ASOF, withOption);
    const fc = buildForecast({ transactions: t, payments: [], plans: [], profile, asOf: ASOF });
    expect(ledger.receivablesCents).toBe(30000);
    expect(fc.items.filter(i => i.direction === 'in').reduce((s, i) => s + i.amountCents, 0)).toBe(30000);
  });

  it('pièce future partiellement réglée : le reste dans les deux vues', () => {
    const t = [tx('P-part', '2026-11-12', 30000, { paymentStatus: 'unpaid', dueDate: '2026-12-05' })];
    const p = [pay('P1', 'P-part', '2026-10-20', 5000)];
    const ledger = summarizeLedger(t, p, profile, ASOF, withOption);
    const fc = buildForecast({ transactions: t, payments: p, plans: [], profile, asOf: ASOF });
    expect(ledger.payablesCents).toBe(25000);
    expect(invoiceTotal(fc)).toBe(25000);
  });

  it('pièce future au règlement inconnu ou annulée : rien dans les deux vues', () => {
    const t = [tx('U-inconnue', '2026-11-05', 4000, {}), tx('U-annulee', '2026-11-06', 6000, { paymentStatus: 'unpaid', dueDate: '2026-11-20', voidedAt: '2026-10-30T10:00:00Z' })];
    const ledger = summarizeLedger(t, [], profile, ASOF, withOption);
    const fc = buildForecast({ transactions: t, payments: [], plans: [], profile, asOf: ASOF });
    expect(ledger.payablesCents).toBe(0);
    expect(invoiceTotal(fc)).toBe(0);
  });

  it('la trésorerie ne compte que les paiements faits : l’option ne la change pas', () => {
    const t = [tx('A-futur', '2026-11-01', 5000, { paymentStatus: 'unpaid', dueDate: '2026-11-15' }), tx('Fait', '2026-10-05', 3000, { paymentStatus: 'paid' })];
    const p = [pay('P1', 'Fait', '2026-10-05', 3000), pay('P2', 'A-futur', '2026-11-01', 5000)];
    const sans = summarizeLedger(t, p, profile, ASOF);
    const avec = summarizeLedger(t, p, profile, ASOF, withOption);
    expect(avec.cashCents).toBe(97000);
    expect(avec.cashCents).toBe(sans.cashCents);
    expect(avec.cashComplete).toBe(sans.cashComplete);
    expect(avec.unknownPaymentCount).toBe(sans.unknownPaymentCount);
    expect(avec.warnings).toEqual(sans.warnings);
    expect(avec.expenseCents).toBe(sans.expenseCents);
  });

  it('avoir futur bien lié : compté ; mal lié : rien d’ajouté et un avertissement ; montant invalide : rien d’ajouté', () => {
    const original = tx('FAC', '2026-10-10', 10000, { paymentStatus: 'paid' });
    const bon = tx('AVOIR-OK', '2026-11-05', 2000, { paymentStatus: 'unpaid', refundOfId: 'FAC', refundApplication: 'cash', dueDate: '2026-11-20' }, 'refund');
    const mal = tx('AVOIR-KO', '2026-11-06', 1500, { paymentStatus: 'unpaid', refundOfId: 'INCONNUE', dueDate: '2026-11-21' }, 'refund');
    const p = [pay('PF', 'FAC', '2026-10-10', 10000)];
    const ledger = summarizeLedger([original, bon, mal], p, profile, ASOF, withOption);
    expect(ledger.receivablesCents).toBe(2000);
    expect(ledger.outstanding.map(o => o.id)).toEqual(['AVOIR-OK']);
    expect(ledger.warnings.some(w => w.includes('AVOIR-KO'))).toBe(true);
    const invalide = tx('NEG', '2026-11-07', 100, { paymentStatus: 'unpaid', dueDate: '2026-11-22', amountCents: -100 });
    (invalide as unknown as { amountTTC: number }).amountTTC = -1;
    const l2 = summarizeLedger([invalide], [], profile, ASOF, withOption);
    expect(l2.payablesCents).toBe(0);
    expect(l2.warnings.some(w => w.includes('NEG'))).toBe(true);
  });

  it('identité entre vues : Synthèse = Σ factures de la prévision + pièces sans échéance, hors horizon nommé', () => {
    const t = [
      tx('J-passee', '2026-10-05', 10000, { paymentStatus: 'unpaid', dueDate: '2026-11-20' }),
      tx('J-presente', '2026-10-31', 20000, { paymentStatus: 'unpaid', dueDate: '2026-11-05' }),
      tx('J-future', '2026-11-10', 5000, { paymentStatus: 'unpaid', dueDate: '2026-11-25' }),
      tx('J-partielle', '2026-11-12', 30000, { paymentStatus: 'unpaid', dueDate: '2026-12-05' }),
      tx('J-vente', '2026-11-20', 12000, { paymentStatus: 'unpaid', dueDate: '2026-12-10' }, 'income'),
      tx('J-sans-echeance', '2026-10-20', 8650, { paymentStatus: 'unpaid' }),
      tx('J-vente-sans-echeance', '2026-10-25', 30000, { paymentStatus: 'unpaid' }, 'income'),
      tx('J-hors-horizon', '2027-12-01', 7000, { paymentStatus: 'unpaid', dueDate: '2028-01-15' }),
    ];
    const p = [pay('PJ', 'J-partielle', '2026-10-20', 5000)];
    const ledger = summarizeLedger(t, p, profile, ASOF, withOption);
    const fc = buildForecast({ transactions: t, payments: p, plans: [], profile, asOf: ASOF });
    const synthese = ledger.payablesCents + ledger.receivablesCents;
    const prevision = invoiceTotal(fc) + fc.undatedInCents + fc.undatedOutCents;
    expect(synthese - prevision).toBe(7000); // seul écart : la pièce hors de l'horizon de 12 mois
    expect(fc.undatedOutCents).toBe(8650);
    expect(fc.undatedInCents).toBe(30000);
  });

  it('cas vide : aucune pièce, aucun reste', () => {
    const ledger = summarizeLedger([], [], profile, ASOF, withOption);
    expect(ledger).toMatchObject({ payablesCents: 0, receivablesCents: 0, outstanding: [] });
  });

  it('bilan annuel : une dette datée après la clôture reste hors de l’exercice', () => {
    const t = [tx('APRES', '2027-01-10', 9000, { paymentStatus: 'unpaid', dueDate: '2027-02-10' }), tx('AVANT', '2026-12-10', 4000, { paymentStatus: 'unpaid', dueDate: '2027-01-10' })];
    const closing = { id: 'C1', year: 2026, createdAt: '2027-01-01T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] } as never;
    const report = buildAnnualReport({ year: 2026, transactions: t, payments: [], assets: [], profile, closing });
    expect(report.payablesCents).toBe(4000);
  });
});
