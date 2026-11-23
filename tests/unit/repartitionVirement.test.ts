import { describe, expect, it } from 'vitest';
import { cleDuTiers, ordreDImputation, piecesOuvertesDuTiers, refusDuVirement, repartirVirement, totalDu, type PieceAPayer } from '../../src/domain/finance/repartition';
import type { FinancialPayment } from '../../src/domain/finance/types';
import type { Transaction } from '../../src/types';

const piece = (id: string, resteCents: number, echeance: string | null, date: string | null = null): PieceAPayer => ({ id, resteCents, echeance, date });
const tx = (id: string, vendor: string | undefined, amountCents: number, dueDate: string | undefined, patch: Partial<Transaction> = {}): Transaction => ({
  id, description: `Pièce ${id}`, date: '2026-10-01', category: 'chargesFixes', subcategory: '', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'unpaid', dueDate, vendor, status: 'active', lines: [] } as unknown as Transaction['finance'], ...patch
});
const paiement = (transactionId: string, amountCents: number): FinancialPayment => ({ id: `P-${transactionId}`, transactionId, date: '2026-10-05', amountCents, direction: 'out', method: 'bank', recordedAt: '2026-10-05T10:00:00.000Z' });

describe('repartirVirement : un virement, plusieurs pièces (la plus ancienne d’abord)', () => {
  it('solde le retard d’abord, puis la suivante, qui reste en partie à payer (m5pa-d : 300 sur 60 + 400)', () => {
    const r = repartirVirement([piece('loyer', 40000, '2026-11-25'), piece('solde', 6000, '2025-12-20')], 30000);
    expect(r.parts).toEqual([
      { id: 'solde', partCents: 6000, resteApresCents: 0, soldee: true },
      { id: 'loyer', partCents: 24000, resteApresCents: 16000, soldee: false }
    ]);
    expect(r.totalCents).toBe(46000);
    expect(r.imputeCents).toBe(30000);
  });
  it('le montant juste solde tout ; un petit montant ne touche que la plus ancienne, et en partie', () => {
    const pieces = [piece('b', 40000, '2026-11-25'), piece('a', 6000, '2025-12-20')];
    expect(repartirVirement(pieces, 46000).parts.every(p => p.soldee && p.resteApresCents === 0)).toBe(true);
    const peu = repartirVirement(pieces, 2500);
    expect(peu.parts).toEqual([
      { id: 'a', partCents: 2500, resteApresCents: 3500, soldee: false },
      { id: 'b', partCents: 0, resteApresCents: 40000, soldee: false }
    ]);
  });
  it('une pièce seule : une seule rangée', () => {
    const r = repartirVirement([piece('seule', 15000, '2026-12-01')], 15000);
    expect(r.parts).toEqual([{ id: 'seule', partCents: 15000, resteApresCents: 0, soldee: true }]);
  });
  it('refuse un montant supérieur au total dû, nul, négatif ou non entier', () => {
    const pieces = [piece('a', 6000, '2025-12-20'), piece('b', 40000, '2026-11-25')];
    expect(() => repartirVirement(pieces, 46001)).toThrow(/dépasse ce qui reste à payer/);
    expect(() => repartirVirement(pieces, 0)).toThrow(RangeError);
    expect(() => repartirVirement(pieces, -100)).toThrow(RangeError);
    expect(() => repartirVirement(pieces, 100.5)).toThrow(RangeError);
    expect(() => repartirVirement(pieces, Number.NaN)).toThrow(RangeError);
    expect(refusDuVirement(pieces, undefined)).toMatch(/Indique le montant/);
    expect(refusDuVirement(pieces, 46000)).toBeNull();
    expect(refusDuVirement([], 100)).toMatch(/Aucune pièce/);
  });
  it('arrondis : des centimes entiers, la somme des parts vaut toujours le virement', () => {
    const trois = [piece('a', 3333, '2026-01-01'), piece('b', 3333, '2026-01-02'), piece('c', 3334, '2026-01-03')];
    for (const montant of [1, 3333, 3334, 6667, 9999, 10000]) {
      const r = repartirVirement(trois, montant);
      expect(r.parts.reduce((s, p) => s + p.partCents, 0)).toBe(montant);
      expect(r.parts.every(p => Number.isInteger(p.partCents) && Number.isInteger(p.resteApresCents) && p.partCents + p.resteApresCents === trois.find(x => x.id === p.id)!.resteCents)).toBe(true);
    }
    // 0,10 + 0,20 en flottants vaut 0,30000000000000004 : en centimes, 10 + 20 = 30 exactement.
    expect(repartirVirement([piece('a', 10, '2026-01-01'), piece('b', 20, '2026-01-02')], 30).parts.map(p => p.soldee)).toEqual([true, true]);
  });
  it('l’ordre suit l’échéance, à défaut la date, puis la date, puis l’identifiant ; l’entrée n’est pas modifiée', () => {
    const entree = [piece('z', 100, '2026-05-01', '2026-04-01'), piece('sans', 100, null, '2026-03-01'), piece('y', 100, '2026-05-01', '2026-02-01'), piece('a', 100, '2026-05-01', '2026-02-01'), piece('vide', 100, null, null)];
    const copie = entree.map(p => p.id);
    expect(ordreDImputation(entree).map(p => p.id)).toEqual(['sans', 'a', 'y', 'z', 'vide']);
    expect(entree.map(p => p.id)).toEqual(copie);
  });
  it('ignore une pièce sans reste ; un reste invalide est refusé', () => {
    const r = repartirVirement([piece('soldee', 0, '2026-01-01'), piece('due', 500, '2026-02-01')], 500);
    expect(r.parts.map(p => p.id)).toEqual(['due']);
    expect(totalDu([piece('x', 0, null), piece('y', 250, null)])).toBe(250);
    expect(refusDuVirement([piece('x', -5, null), piece('y', 500, null)], 100)).toMatch(/invalide/);
  });
});

describe('piecesOuvertesDuTiers : seules les pièces du même fournisseur', () => {
  const loyer = tx('loyer', 'Atelier du Lac', 40000, '2026-11-25');
  const solde = tx('solde', ' atelier  du lac ', 6000, '2025-12-20', { date: '2025-12-01' });
  const autre = tx('autre', 'Brasserie Müller', 9000, '2026-10-01');
  const soldeePayee = tx('payee', 'Atelier du Lac', 5000, '2026-09-01');
  const annulee = tx('annulee', 'Atelier du Lac', 7000, '2026-09-02', { finance: { version: 1, kind: 'expense', amountCents: 7000, paymentStatus: 'unpaid', vendor: 'Atelier du Lac', status: 'active', voidedAt: '2026-09-03T00:00:00.000Z', lines: [] } as unknown as Transaction['finance'] });
  const vente = tx('vente', 'Atelier du Lac', 3000, '2026-10-01', { finance: { version: 1, kind: 'income', amountCents: 3000, paymentStatus: 'unpaid', vendor: 'Atelier du Lac', status: 'active', lines: [] } as unknown as Transaction['finance'] });
  const toutes = [loyer, solde, autre, soldeePayee, annulee, vente];
  const paiements = [paiement('payee', 5000)];

  it('regroupe les pièces du même tiers (casse, accents, espaces ignorés), la plus ancienne d’abord, et exclut les autres', () => {
    const r = piecesOuvertesDuTiers(loyer, toutes, paiements);
    expect(r.map(p => [p.id, p.resteCents])).toEqual([['solde', 6000], ['loyer', 40000]]);
  });
  it('ouvert depuis la pièce ancienne, le même groupe', () => {
    expect(piecesOuvertesDuTiers(solde, toutes, paiements).map(p => p.id)).toEqual(['solde', 'loyer']);
  });
  it('un paiement partiel réduit le reste de la pièce', () => {
    const r = piecesOuvertesDuTiers(loyer, toutes, [...paiements, paiement('loyer', 15000)]);
    expect(r.find(p => p.id === 'loyer')!.resteCents).toBe(25000);
  });
  it('sans nom de tiers, la pièce reste seule ; un autre tiers aussi', () => {
    const sansNom = tx('sansnom', undefined, 1000, '2026-01-01');
    expect(piecesOuvertesDuTiers(sansNom, [sansNom, tx('x', undefined, 2000, '2026-01-02')], []).map(p => p.id)).toEqual(['sansnom']);
    expect(piecesOuvertesDuTiers(autre, toutes, paiements).map(p => p.id)).toEqual(['autre']);
  });
  it('une vente (encaissement) ne se mélange pas aux dépenses du même nom', () => {
    expect(piecesOuvertesDuTiers(vente, toutes, paiements).map(p => [p.id, p.entrant])).toEqual([['vente', true]]);
  });
  it('cleDuTiers ignore casse, accents et espaces multiples', () => {
    expect(cleDuTiers('  Brasserie  MÜLLER ')).toBe('brasserie muller');
    expect(cleDuTiers(undefined)).toBe('');
  });
});
