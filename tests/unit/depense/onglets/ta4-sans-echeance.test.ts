// TA4 : une pièce à payer ou à encaisser sans échéance n'est plus placée aujourd'hui ; elle va dans `undated`, comptée à part.
import { describe, expect, it } from 'vitest';
import { buildForecast } from '../../../../src/domain/finance/forecast';
import { ASOF, pay, plan, profile, tx } from './fixtures';

const run = (transactions: ReturnType<typeof tx>[], plans: ReturnType<typeof plan>[] = [], payments: ReturnType<typeof pay>[] = []) =>
  buildForecast({ transactions, payments, plans, profile, asOf: ASOF });

describe('TA4 : pièce sans échéance', () => {
  it('sonde E : une vente à encaisser sans échéance sort des entrées prévues et va à part', () => {
    const fc = run([tx('E-vente', '2026-10-25', 30000, { paymentStatus: 'unpaid' }, 'income')]);
    expect(fc.items.filter(i => i.direction === 'in')).toEqual([]);
    expect(fc.months[0].incomeCents).toBe(0);
    expect(fc.undated).toHaveLength(1);
    expect(fc.undated[0]).toMatchObject({ id: 'invoice:E-vente', label: 'E-vente', amountCents: 30000, direction: 'in', pieceDate: '2026-10-25' });
    expect(fc.undatedInCents).toBe(30000);
    expect(fc.undatedOutCents).toBe(0);
  });

  it('sonde B : une facture à payer sans échéance sort du premier mois, l’avertissement donne le montant', () => {
    const fc = run([tx('B-facture', '2026-10-20', 8650, { paymentStatus: 'unpaid' })]);
    expect(fc.items).toEqual([]);
    expect(fc.months[0].expenseCents).toBe(0);
    expect(fc.undatedOutCents).toBe(8650);
    const warning = fc.warnings.find(w => w.startsWith('Échéance à préciser'));
    expect(warning).toContain('B-facture');
    expect(warning).toMatch(/86,50/);
    expect(warning).not.toMatch(/placé aujourd/);
  });

  it('une échéance invalide vaut une échéance absente', () => {
    const fc = run([tx('INV', '2026-10-20', 1000, { paymentStatus: 'unpaid', dueDate: '31.02.2026' })]);
    expect(fc.items).toEqual([]);
    expect(fc.undated.map(u => u.amountCents)).toEqual([1000]);
  });

  it('une échéance future est placée à sa date ; une échéance passée reste due aujourd’hui ; aucune date inventée', () => {
    const fc = run([tx('FUT', '2026-10-20', 1000, { paymentStatus: 'unpaid', dueDate: '2026-11-15' }), tx('PAS', '2026-09-01', 2000, { paymentStatus: 'unpaid', dueDate: '2026-10-01' })]);
    expect(fc.undated).toEqual([]);
    expect(fc.items.map(i => [i.id, i.date]).sort()).toEqual([['invoice:FUT', '2026-11-15'], ['invoice:PAS', ASOF]]);
    expect(fc.items.some(i => i.date === '2026-11-19' || i.date === '2026-11-24')).toBe(false); // ni +30 jours de la pièce, ni d'aujourd'hui
  });

  it('une pièce soldée sans échéance n’apparaît ni dans les mois ni à part', () => {
    const t = [tx('SOLDEE', '2026-10-10', 4000, { paymentStatus: 'paid' })];
    const fc = run(t, [], [pay('P', 'SOLDEE', '2026-10-10', 4000)]);
    expect(fc.items).toEqual([]);
    expect(fc.undated).toEqual([]);
  });

  it('une pièce partielle sans échéance : le reste à payer, pas le total', () => {
    const t = [tx('PART', '2026-10-10', 10000, { paymentStatus: 'unpaid' })];
    const fc = run(t, [], [pay('P', 'PART', '2026-10-12', 3000)]);
    expect(fc.undated[0].amountCents).toBe(7000);
    expect(fc.undatedOutCents).toBe(7000);
  });

  it('une ancienne pièce sans finance n’est ni dans les mois ni à part', () => {
    const legacy = { ...tx('OLD', '2026-03-01', 5000), finance: undefined } as unknown as ReturnType<typeof tx>;
    const fc = run([legacy]);
    expect(fc.items).toEqual([]);
    expect(fc.undated).toEqual([]);
  });

  it('pièce au règlement inconnu liée à un plan actif : à part, marquée non confirmée', () => {
    const fc = run([tx('LIE', '2026-10-10', 5000, { planId: 'PLAN' })], [plan({ date: '2026-11-15', amountCents: 5000 })]);
    expect(fc.undated).toHaveLength(1);
    expect(fc.undated[0]).toMatchObject({ id: 'invoice:LIE', unconfirmed: true, planId: 'PLAN' });
  });

  it('une pièce sans échéance liée à un plan ne remplace pas l’occurrence du plan : le plan reste dans le mois', () => {
    const fc = run([tx('LIE', '2026-10-10', 5000, { planId: 'PLAN', paymentStatus: 'unpaid' })], [plan({ date: '2026-11-15', amountCents: 5000 })]);
    expect(fc.undated.map(u => u.id)).toEqual(['invoice:LIE']);
    expect(fc.items.map(i => [i.source, i.date, i.amountCents])).toEqual([['plan', '2026-11-15', 5000]]);
    expect(fc.warnings.some(w => w.includes('la prévision reste réservée'))).toBe(true);
  });

  it('un plan non projeté (brouillon) et une facture sans échéance : la facture se voit à part', () => {
    const fc = run([tx('LIE', '2026-10-10', 5000, { planId: 'PLAN', paymentStatus: 'unpaid' })], [plan({ status: 'draft' })]);
    expect(fc.items).toEqual([]);
    expect(fc.undated.map(u => u.id)).toEqual(['invoice:LIE']);
  });

  it('non-régression : une pièce liée soldée sans échéance remplace toujours l’occurrence', () => {
    const t = [tx('LIEE-SOLDEE', '2026-10-10', 5000, { planId: 'PLAN', paymentStatus: 'paid' })];
    const fc = run(t, [plan({ date: '2026-11-15', amountCents: 5000 })], [pay('P', 'LIEE-SOLDEE', '2026-10-10', 5000)]);
    expect(fc.items).toEqual([]);
    expect(fc.undated).toEqual([]);
  });

  it('cas vide et centimes entiers', () => {
    const vide = run([]);
    expect(vide.undated).toEqual([]);
    expect([vide.undatedInCents, vide.undatedOutCents]).toEqual([0, 0]);
    const fc = run([tx('a', '2026-10-01', 3333, { paymentStatus: 'unpaid' }), tx('b', '2026-10-02', 3333, { paymentStatus: 'unpaid' }), tx('c', '2026-10-03', 3334, { paymentStatus: 'unpaid' })]);
    expect(fc.undatedOutCents).toBe(10000);
    expect(Number.isSafeInteger(fc.undatedOutCents)).toBe(true);
  });
});
