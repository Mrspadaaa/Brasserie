// @vitest-environment jsdom
/**
 * Voie saisie (reprise du soir, 23.11) : les quatre plaintes du brasseur sur « Saisir à la main ».
 *  1. Apport : la même structure que les autres « Ça rentre », coche « sans justificatif, c'est normal » comprise.
 *  2. Un apport se voit au Calendrier, dans la rangée Ventes comme les autres entrées d'argent encaissées.
 *  3. La pastille de date suit le doigt pendant le tirage du curseur.
 *  4. L'avis « Nouvelle version » se pose au-dessus de la barre du bas, jamais sur l'en-tête ni sur le contenu.
 * Fixtures simulées.
 */
import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';
import { justificatifManquant } from '../../src/domain/finance/ledger';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { avecGenre, brouillonNeuf, dateMontree, preparer } from '../../src/ui/saisie/modele';
import { basDeLAvis, hautDesBarresBasses } from '../../src/services/miseAJour';

const J = '2026-11-23';
const ctx = { id: 'MAIN-1', maintenant: `${J}T10:00:00.000Z`, transactions: [] as FinanceTransaction[], tvaInscrit: false };

describe('1. la coche « sans justificatif, c’est normal » de la saisie à la main', () => {
  const brouillon = (genre: 'apport' | 'vente' | 'autrei', plus: Record<string, unknown> = {}) => ({ ...avecGenre(brouillonNeuf(J), genre), cents: 120000, ...plus });

  it('un brouillon neuf ne la porte pas : sans coche, la pièce reste « sans justificatif » (l’inconnu n’est pas un oui)', () => {
    const e = preparer(brouillon('apport'), ctx);
    expect(e.transaction.finance?.proofNotNeeded).toBeUndefined();
    expect(justificatifManquant(e.transaction)).toBe(true);
  });
  it('cochée : l’apport, la vente et l’autre recette écrivent proofNotNeeded, et la pièce ne compte plus comme sans justificatif', () => {
    for (const g of ['apport', 'vente', 'autrei'] as const) {
      const e = preparer(brouillon(g, { sansJustificatif: true }), ctx);
      expect(e.transaction.finance?.proofNotNeeded).toBe(true);
      expect(justificatifManquant(e.transaction)).toBe(false);
    }
  });
  it('l’apport reste un apport : contribution, hors résultat, paiement entrant, avec la coche', () => {
    const e = preparer(brouillon('apport', { sansJustificatif: true }), ctx);
    expect(e.transaction.finance).toMatchObject({ kind: 'contribution', proofNotNeeded: true });
    expect(e.paiement).toMatchObject({ direction: 'in', amountCents: 120000 });
  });
});

describe('2. un apport encaissé est une chose de la rangée Ventes du Calendrier', () => {
  const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01', openingCash: { date: '2026-01-01', amountCents: 500000, confirmed: true } };
  const apport = (id: string, kind: 'contribution' | 'withdrawal', extra: Record<string, unknown> = {}): FinanceTransaction => ({
    id, date: J, description: 'De ma poche', category: 'apports', subcategory: 'Apport privé', amountHT: 1200, amountTTC: 1200, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind, amountCents: 120000, lines: [], paymentStatus: 'paid', ...extra }
  }) as FinanceTransaction;
  const paiement = (id: string, direction: 'in' | 'out', date = J): FinancialPayment => ({ id: `PAY-${id}`, transactionId: id, date, amountCents: 120000, direction, method: 'bank', recordedAt: `${date}T10:00:00.000Z` }) as FinancialPayment;
  const entrees = (transactions: FinanceTransaction[], payments: FinancialPayment[]): EntreesModele => ({
    aujourdhui: J, transactions: transactions as unknown as Transaction[], payments, plans: [], profile: profil, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES
  });
  const deMaPoche = (m: ReturnType<typeof construireModele>) => m.choses.filter(c => c.titre === 'De ma poche');

  it('apport payé aujourd’hui : une chose Ventes à son jour, au montant, qui ouvre la pièce, dite « apport »', () => {
    const c = deMaPoche(construireModele(entrees([apport('APP-1', 'contribution')], [paiement('APP-1', 'in')])));
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ rangee: 'ventes', id: 'paiement-PAY-APP-1', debut: J, fin: J, centimes: 120000, ouvre: { ecran: 'piece', id: 'APP-1' } });
    expect(c[0].detail).toMatch(/apport/i);
  });
  it('un prélèvement privé (sortie) n’entre pas dans Ventes', () => {
    expect(deMaPoche(construireModele(entrees([apport('PREL-1', 'withdrawal')], [paiement('PREL-1', 'out')])))).toHaveLength(0);
  });
  it('un apport annulé, ou sans paiement : rien d’inventé', () => {
    const annule = apport('APP-2', 'contribution', { voidedAt: `${J}T11:00:00.000Z` });
    expect(deMaPoche(construireModele(entrees([annule], [paiement('APP-2', 'in')])))).toHaveLength(0);
    expect(deMaPoche(construireModele(entrees([apport('APP-3', 'contribution')], [])))).toHaveLength(0);
  });
});

describe('3. la pastille de date suit le doigt', () => {
  it('pendant le tirage, la pastille de la frise touchée dit le jour tiré, pas celui d’avant', () => {
    expect(dateMontree('date', '2026-10-14', { cle: 'date', iso: '2026-10-22' })).toBe('2026-10-22');
  });
  it('une autre pastille (échéance, début) garde sa valeur ; au repos, la valeur écrite', () => {
    expect(dateMontree('echeance', '2026-12-01', { cle: 'date', iso: '2026-10-22' })).toBe('2026-12-01');
    expect(dateMontree('date', '2026-10-14', null)).toBe('2026-10-14');
  });
  it('un jour tiré illisible n’écrase jamais la valeur', () => {
    expect(dateMontree('date', '2026-10-14', { cle: 'date', iso: '' })).toBe('2026-10-14');
  });
});

describe('4. l’avis « Nouvelle version » ne couvre ni l’en-tête ni le contenu', () => {
  const H = 800;
  const rect = (top: number, bottom: number, left = 0, right = 390) => ({ top, bottom, left, right, width: right - left, height: bottom - top });

  it('les barres du bas : celles qui touchent le bas de la fenêtre ; l’en-tête et les blocs du milieu n’en sont pas', () => {
    const entete = rect(0, 56), contenu = rect(100, 700), nav = rect(740, 800), pied = rect(730, 800);
    expect(hautDesBarresBasses([entete, contenu], H)).toEqual([]);
    expect(hautDesBarresBasses([entete, contenu, nav], H)).toEqual([740]);
    expect(hautDesBarresBasses([nav, pied], H)).toEqual([740, 730]);
  });
  it('une barre invisible (hauteur 0) ou hors fenêtre n’en est pas une', () => {
    expect(hautDesBarresBasses([rect(800, 800), rect(900, 960)], H)).toEqual([]);
  });
  it('l’avis se pose juste au-dessus de la barre la plus haute, jamais sur elle', () => {
    expect(basDeLAvis(H, [740, 730])).toBe(H - 730 + 8);
    expect(basDeLAvis(H, [740])).toBe(H - 740 + 8);
  });
  it('sans barre, il se pose au bas de l’écran avec sa marge', () => {
    expect(basDeLAvis(H, [])).toBe(8);
  });
  it('une barre qui monte avec le clavier (pied de la saisie) fait monter l’avis avec elle', () => {
    const sansClavier = basDeLAvis(H, hautDesBarresBasses([rect(740, 800)], H));
    const avecClavier = basDeLAvis(500, hautDesBarresBasses([rect(440, 500)], 500));
    expect(sansClavier).toBe(68);
    expect(avecClavier).toBe(68);
  });
});
