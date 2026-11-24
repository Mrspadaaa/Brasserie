import { describe, expect, it } from 'vitest';
import * as C from '../../src/domain/calendrier';
import { buildForecast } from '../../src/domain/finance/forecast';
import { chosesPayees, marquerHorsVentes } from '../../src/domain/calendrierPaiements';
import type { FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { avecGenre, brouillonNeuf, preparer, type GenreId } from '../../src/ui/saisie/modele';

const profile: FinancialProfile = {
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01',
  openingCash: { date: '2026-01-01', amountCents: 100000, confirmed: true }
};

function saisir(genre: GenreId, cents: number, date = '2026-11-21') {
  const b = { ...avecGenre(brouillonNeuf(date), genre), cents, rythme: 'monthly' as const, nom: `ZZ ${genre}` };
  const e = preparer(b, { id: `TX-${genre}`, maintenant: '2026-11-21T10:00:00Z', transactions: [], tvaInscrit: false });
  return { tx: e.transaction, pay: e.paiement as FinancialPayment, plan: e.plan as FinancialPlan };
}
function choses(genre: GenreId, cents: number) {
  const { tx, pay, plan } = saisir(genre, cents);
  const f = buildForecast({ transactions: [tx], payments: [pay], plans: [plan], profile, asOf: '2026-11-23', months: 6 });
  const prevues = marquerHorsVentes(f.items.flatMap(i => { const c = C.choseArgent(i, [plan]); return c ? [c] : []; }), [tx]);
  const payees = chosesPayees({ payments: [pay], transactions: [tx], attendues: new Set(), depuis: '2026-11-16', aujourdhui: '2026-11-23' });
  return [...payees, ...prevues];
}

/* E41-3 (ecr4) : la bande d'un apport ne propose pas « Facturer » ; une vente prévue à un client oui */
describe('E41-3 : « Facturer » pas pour un apport', () => {
  it('la chose d’apport (plan) n’est pas facturable, une vente prévue l’est', () => {
    const cs = choses('apport', 500);
    expect(cs.some(c => c.source.genre === 'plan')).toBe(true);
    expect(cs.every(c => !C.peutFacturer(c))).toBe(true);
    const vente = { id: 'v1', titre: 'Vente', rangee: 'ventes', debut: '2026-11-25', fin: '2026-11-25', centimes: 480, source: { genre: 'plan', id: 'P1' } } as unknown as C.ChoseCalendrier;
    expect(C.peutFacturer(vente)).toBe(true);
  });
});

