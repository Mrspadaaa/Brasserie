// Lot 6 du Carnet (23.11) : la lecture des montants suisses (L-36, L-38) et le plan soldé dont on retire la pièce (L-37).
import { describe, expect, it } from 'vitest';
import { decimalesSaisies, parseDecimal } from '../../src/ui/numericInput';
import { parsePrix, planApresRetrait } from '../../src/domain/finance/upgradeRing';
import type { FinanceTransaction, FinancialPlan } from '../../src/domain/finance/types';

describe('L-36, L-38 : un montant tapé au clavier suisse ou collé en notation anglaise', () => {
  it('« 12,345.67 » (milliers anglais) se lit 12 345,67, jamais 12,34', () => {
    expect(parseDecimal('12,345.67')).toBe(12345.67);
    expect(decimalesSaisies('12,345.67')).toBe(2);
  });
  it('« 12’345,50 » (apostrophe du clavier iPhone) se lit comme « 12\'345,50 »', () => {
    expect(parseDecimal('12’345,50')).toBe(12345.5);
    expect(parseDecimal("12'345.50")).toBe(12345.5);
    expect(parseDecimal('1’234’567')).toBe(1234567);
    expect(decimalesSaisies('12’345,50')).toBe(2);
  });
  it('« 12.345,67 » (milliers allemands) et « 1 234,5 » (espace insécable)', () => {
    expect(parseDecimal('12.345,67')).toBe(12345.67);
    expect(parseDecimal('1 234,5')).toBe(1234.5);
    expect(parseDecimal('1.234.567')).toBe(1234567);
  });
  it('ce qui était lu le reste : une seule virgule ou un seul point est la décimale', () => {
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('1.234')).toBe(1.234);
    expect(parseDecimal('12,')).toBe(12);
    expect(parseDecimal(',5')).toBe(0.5);
    expect(parseDecimal('-3,5')).toBe(-3.5);
    expect(parseDecimal("1'250")).toBe(1250);
  });
  it('un groupement faux est refusé, jamais deviné', () => {
    for (const t of ["1'23", '12’34,5', '1,2,3', '12,34.5.6', "1'234,567.5", '12.34,5', '-', ',', '.', 'abc'])
      expect(parseDecimal(t), t).toBeNull();
  });
  it('parsePrix (À venir, prix trouvé) suit la même lecture', () => {
    expect(parsePrix('12,345.67')).toBe(1234567);
    expect(parsePrix('12’345,50')).toBe(1234550);
    expect(parsePrix('1 234,5')).toBe(123450);
    expect(parsePrix('12,345')).toBeNull(); // trois décimales : pas un prix en francs
    expect(parsePrix('0')).toBeNull();
  });
});

describe('L-37 : retirer la pièce qui avait soldé le plan le rend à À venir', () => {
  const plan = { id: 'p1', title: 'Moulin', direction: 'out', status: 'completed', source: 'equipment', amountCents: 50000, date: '2026-11-01',
    upgrade: { stage: 'ready', timing: 'soon', budgetKnown: true, purchaseCents: 50000 } } as unknown as FinancialPlan;
  const piece = (id: string, cents: number, annulee = false) => ({ id, date: '2026-11-23', category: 'materiel',
    finance: { version: 1, kind: 'expense', planId: 'p1', amountCents: cents, lines: [], ...(annulee ? { voidedAt: '2026-11-23T10:00:00Z' } : {}) } }) as unknown as FinanceTransaction;

  it('plus aucune pièce active : le plan redevient actif (prix et mois connus)', () => {
    const apres = planApresRetrait(plan, [piece('t1', 50000, true)], 'maintenant');
    expect(apres.status).toBe('active');
  });
  it('sans mois ou sans prix, il revient en idée (brouillon), jamais compté à faux', () => {
    expect(planApresRetrait({ ...plan, date: '' }, [piece('t1', 50000, true)], 'maintenant').status).toBe('draft');
  });
  it('une autre pièce active couvre encore le montant : rien ne bouge', () => {
    expect(planApresRetrait(plan, [piece('t1', 50000, true), piece('t2', 50000)], 'maintenant')).toBe(plan);
  });
  it('un plan réalisé sans achat (aucune pièce liée, jamais) reste réalisé', () => {
    expect(planApresRetrait(plan, [], 'maintenant')).toBe(plan);
  });
});
