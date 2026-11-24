import { describe, expect, it } from 'vitest';
import * as C from '../../src/domain/calendrier';
import { buildForecast } from '../../src/domain/finance/forecast';
import { chosesPayees, marquerHorsVentes } from '../../src/domain/calendrierPaiements';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { pastille, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { avecGenre, brouillonNeuf, preparer, type GenreId } from '../../src/ui/saisie/modele';
import { enIso } from './proprietes/_dates';

/* E40-2 / E40-3 : un apport (récurrent) et un « Pour moi » (récurrent) ne comptent ni dans le total des Ventes ni dans celui des Papiers ; ils restent visibles, à leur jour. */
const profile: FinancialProfile = {
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01',
  openingCash: { date: '2026-01-01', amountCents: 100000, confirmed: true }
};
const cols = (debut: string, n: number): Colonne[] => C.semainesDe(debut, n).map(s => ({ debut: s.debut, fin: enIso(Date.parse(`${s.debut}T00:00:00Z`) / 864e5 + 6), etiquette: `S${s.numero}` }) as Colonne);

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

describe('E40-2 : l’apport récurrent est hors du total des Ventes, sur les deux chemins', () => {
  it('chaque chose d’apport (payée ou prévue) porte horsVentes ; la pastille ne compte aucune vente', () => {
    const cs = choses('apport', 500);
    expect(cs.length).toBeGreaterThanOrEqual(3);
    expect(cs.every(c => c.rangee === 'ventes' && c.horsVentes === 'apport')).toBe(true);
    const vente = { id: 'v1', titre: 'Vente', rangee: 'ventes', debut: '2026-11-25', fin: '2026-11-25', centimes: 480, source: { genre: 'facture', id: 'F1' } } as unknown as C.ChoseCalendrier;
    const p = pastille('ventes', [vente, ...cs], cols('2026-11-23', 6));
    expect(p.solde).toBe(480);
  });
});

describe('E40-3 : « Pour moi » est hors des totaux de Papiers', () => {
  it('chaque chose de prélèvement (payée ou prévue) est marquée privée ; la pastille Papiers ne la compte pas', () => {
    const cs = choses('prel', 250);
    expect(cs.length).toBeGreaterThanOrEqual(3);
    expect(cs.every(c => c.rangee === 'papiers' && c.prive === true)).toBe(true);
    const loyer = { id: 'l1', titre: 'Loyer', rangee: 'papiers', debut: '2026-11-27', fin: '2026-11-27', centimes: -60000, source: { genre: 'plan', id: 'P' }, proposition: 'echeance' } as unknown as C.ChoseCalendrier;
    const p = pastille('papiers', [loyer, ...cs], cols('2026-11-23', 6));
    expect(p.solde).toBe(-60000);
    expect(p.lecture).toMatch(/privé/);
  });
});
