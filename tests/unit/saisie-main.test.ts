// Saisie à la main v01s (D426) : le modèle (genre → nature, sens, catégorie, prévision ; habituels ; pièces remboursables). Fixtures simulées.
import { describe, expect, it } from 'vitest';
import { achatPrevu, avecGenre, brouillonNeuf, chf, grouper, dateDeFin, derniersNoms, echeances, habituels, lireMontant, piecesRemboursables, preparer, sommeDouzeMois } from '../../src/ui/saisie/modele';
import { planOccurrences } from '../../src/domain/finance/forecast';
import { validateFinanceTransaction } from '../../src/domain/finance/ledger';
import type { FinanceTransaction, FinancialPlan } from '../../src/domain/finance/types';

const J = '2026-11-22';
const ctx = (transactions: FinanceTransaction[] = []) => ({ id: 'MAIN-1', maintenant: `${J}T10:00:00.000Z`, transactions, tvaInscrit: false });
const tx = (id: string, date: string, description: string, kind: 'expense' | 'income' | 'contribution', cents: number, extra: Partial<FinanceTransaction> = {}, fin: Record<string, unknown> = {}): FinanceTransaction => ({
  id, date, description, category: kind === 'income' ? 'recettes' : kind === 'contribution' ? 'apports' : 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
  ...extra, finance: { version: 1, kind, amountCents: cents, lines: [], ...fin } });

describe('saisie à la main : montant', () => {
  it('lit les formes du clavier Gboard, refuse l’illisible et le nul', () => {
    expect(lireMontant('400')).toBe(40000);
    expect(lireMontant('29,9')).toBe(2990);
    expect(lireMontant('29.90')).toBe(2990);
    expect(lireMontant('2 000,50')).toBe(200050);
    expect(lireMontant('0')).toBeUndefined();
    expect(lireMontant('1,234')).toBeUndefined();
    expect(lireMontant('')).toBeUndefined();
    expect(chf(200000)).toBe('2 000,00');
    expect(grouper('2000')).toBe('2 000');
    expect(grouper('2000.5')).toBe('2 000,5');
    expect(grouper('29,905')).toBe('29,90');
    expect(grouper('0040')).toBe('40');
    expect(lireMontant(grouper('12345,6'))).toBe(1234560);
  });
});

describe('saisie à la main : le genre pose le sens et la nature', () => {
  it('(a) loyer payé chaque mois : dépense en charges fixes, paiement sortant, prévision mensuelle liée à sa première échéance', () => {
    const b = { ...avecGenre(brouillonNeuf(J), 'loyer'), cents: 40000 };
    expect(b.rythme).toBe('monthly');
    const e = preparer(b, ctx());
    validateFinanceTransaction(e.transaction);
    expect(e.transaction).toMatchObject({ category: 'chargesFixes', subcategory: 'Loyer', description: 'Loyer', amountTTC: 400 });
    expect(e.transaction.finance).toMatchObject({ kind: 'expense', paymentStatus: 'paid', planId: 'PLAN-MAIN-1', occurrenceId: `PLAN-MAIN-1:${J}` });
    expect(e.paiement).toMatchObject({ direction: 'out', amountCents: 40000, method: 'bank' });
    expect(e.plan).toMatchObject({ source: 'recurring', status: 'active', direction: 'out', recurrence: { frequency: 'monthly' }, date: J });
    expect(e.plan!.recurrence!.endDate).toBeUndefined();
    expect(planOccurrences(e.plan!, J, '2027-02-28').map((o) => o.date)).toEqual([J, '2026-12-22', '2027-01-22', '2027-02-22']);
  });
  it('(b) apport : contribution en apports, paiement entrant, jamais de rythme', () => {
    const b = { ...avecGenre(brouillonNeuf(J), 'apport'), cents: 200000 };
    expect(b.rythme).toBe('une');
    const e = preparer(b, ctx());
    expect(e.transaction).toMatchObject({ category: 'apports', description: 'De ma poche' });
    expect(e.transaction.finance!.kind).toBe('contribution');
    expect(e.paiement!.direction).toBe('in');
    expect(e.plan).toBeUndefined();
  });
  it('(c) abonnement « 1 an · 12 fois » : la dernière échéance tombe 11 mois après', () => {
    const b = { ...avecGenre(brouillonNeuf(J), 'abo'), cents: 2990, fin: '1an' as const };
    const e = preparer(b, ctx());
    expect(e.plan!.recurrence).toEqual({ frequency: 'monthly', endDate: '2027-10-22' });
    expect(echeances(J, 'monthly', '2027-10-22', 400)).toHaveLength(12);
    expect(sommeDouzeMois(2990, J, 'monthly', '2027-10-22')).toBe(35880);
    expect(sommeDouzeMois(40000, J, 'monthly', undefined)).toBe(480000);
  });
  it('(d) achat ponctuel : dépense de la catégorie choisie, sans prévision', () => {
    const b = { ...avecGenre(brouillonNeuf(J), 'achat'), cents: 8650, categorie: 'materiel' as const };
    const e = preparer(b, ctx());
    expect(e.transaction).toMatchObject({ category: 'materiel', description: 'Achat du 22.11' });
    expect(e.transaction.finance!.planId).toBeUndefined();
    expect(e.plan).toBeUndefined();
  });
  it('« À payer » : pièce ouverte avec échéance, aucun paiement ; prélèvement : withdrawal payé par défaut', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf(J), 'achat'), cents: 18640, reglement: 'apayer' }, ctx());
    expect(e.paiement).toBeUndefined();
    expect(e.transaction.finance).toMatchObject({ paymentStatus: 'unpaid', dueDate: '2026-12-22' });
    const p = preparer({ ...avecGenre(brouillonNeuf(J), 'prel'), cents: 30000 }, ctx());
    expect(p.transaction.finance!.kind).toBe('withdrawal');
    expect(p.paiement!.direction).toBe('out');
  });
  it('vente : income en recettes, paiement entrant', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf(J), 'vente'), cents: 25000, vendor: 'Bar du Port', nom: 'Bar du Port' }, ctx());
    expect(e.transaction.finance).toMatchObject({ kind: 'income', vendor: 'Bar du Port' });
    expect(e.paiement!.direction).toBe('in');
  });
  it('une fin avant le début est refusée ; « 6 mois » trimestriel = 2 fois', () => {
    expect(() => preparer({ ...avecGenre(brouillonNeuf(J), 'loyer'), cents: 100, fin: 'date', finDate: '2026-01-01' }, ctx())).toThrow(/avant le début/);
    expect(dateDeFin(J, 'quarterly', '6m')).toBe('2027-02-22');
  });
});

describe('saisie à la main : remboursement', () => {
  const achat = tx('T-1', '2026-11-14', 'Malt', 'expense', 18640, {}, { vendor: 'Malterie' });
  const vente = tx('T-2', '2026-11-08', 'Marché', 'income', 32000);
  it('prend le sens inverse de la pièce, la lie, et « reste » retire les avoirs déjà faits', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf(J), 'rembt'), cents: 1840, pieceId: 'T-1' }, ctx([achat, vente]));
    expect(e.transaction.finance).toMatchObject({ kind: 'refund', refundOfId: 'T-1', refundDirection: 'in', refundApplication: 'cash' });
    expect(e.transaction.description).toBe('Remboursement Malterie');
    expect(e.paiement!.direction).toBe('in');
    const r = preparer({ ...avecGenre(brouillonNeuf(J), 'rembt'), cents: 5000, pieceId: 'T-2' }, ctx([achat, vente]));
    expect(r.paiement!.direction).toBe('out');
    const avoir = { ...e.transaction, id: 'T-3' };
    const p = piecesRemboursables([achat, vente, avoir]);
    expect(p.map((x) => x.id)).toEqual(['T-1', 'T-2']);
    expect(p[0].reste).toBe(18640 - 1840);
  });
});

describe('saisie à la main : habituels et derniers noms', () => {
  it('la prochaine échéance non soldée d’un loyer récurrent, puis les derniers mouvements uniques ; vide sans historique', () => {
    expect(habituels([], [], J)).toEqual([]);
    const plan: FinancialPlan = { id: 'P-L', title: 'Loyer de l’atelier', date: '2026-10-22', amountCents: 40000, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly' }, createdAt: J };
    const loyerOct = tx('T-L1', '2026-10-22', 'Loyer de l’atelier', 'expense', 40000, { category: 'chargesFixes', subcategory: 'Loyer' }, { planId: 'P-L', occurrenceId: 'P-L:2026-10-22' });
    const loyerNov = tx('T-L2', '2026-11-22', 'Loyer de l’atelier', 'expense', 40000, { category: 'chargesFixes', subcategory: 'Loyer' }, { planId: 'P-L', occurrenceId: 'P-L:2026-11-22' });
    const apport = tx('T-A', '2026-10-03', 'De ma poche', 'contribution', 150000);
    const malt = tx('T-M', '2026-10-27', 'Malt Pilsner', 'expense', 8650, {}, { vendor: 'Malterie' });
    const h = habituels([loyerOct, loyerNov, apport, malt], [plan], J);
    expect(h.map((x) => [x.genre, x.nom, x.sous])).toEqual([
      ['loyer', 'Loyer de l’atelier', 'échéance le 22.12 · à enregistrer'],
      ['achat', 'Malt Pilsner', 'achat · dernier le 27.10'],
      ['apport', 'De ma poche', 'apport · dernier le 03.10']]);
    expect(h[0].solde).toEqual({ planId: 'P-L', occurrenceId: 'P-L:2026-12-22', date: '2026-12-22' });
    expect(derniersNoms([malt, tx('T-Q', '2026-11-01', 'Vis', 'expense', 4200, {}, { vendor: 'Quincaillerie' })], 'achat')).toEqual(['Quincaillerie', 'Malterie']);
  });
  it('payer un habituel solde son échéance sans créer de nouvelle prévision', () => {
    const e = preparer({ ...avecGenre(brouillonNeuf(J), 'loyer'), cents: 40000, nom: 'Loyer de l’atelier', solde: { planId: 'P-L', occurrenceId: 'P-L:2026-12-22', date: '2026-12-22' } }, ctx());
    expect(e.plan).toBeUndefined();
    expect(e.transaction.finance).toMatchObject({ planId: 'P-L', occurrenceId: 'P-L:2026-12-22' });
  });
});

describe('saisie à la main : l’achat prévu soldé (WFA-15)', () => {
  const malt: FinancialPlan = { id: 'P-MALT', title: 'Commande de malt', date: '2026-11-27', amountCents: 42000, direction: 'out', category: 'brassage', source: 'manual', status: 'active', vendor: 'Malterie Suisse', createdAt: `${J}T08:00:00.000Z` };
  const achat = (p: Partial<ReturnType<typeof brouillonNeuf>>) => ({ ...avecGenre(brouillonNeuf(J), 'achat'), ...p });
  it('le nom tapé tient lieu de fournisseur ; montant à 10 % près ; la pièce porte le lien au plan', () => {
    expect(achatPrevu(achat({ nom: 'Malterie Suisse pilsner' }), 42157, [malt])?.id).toBe('P-MALT');
    expect(achatPrevu(achat({ vendor: 'Malterie Suisse' }), 42157, [malt])?.id).toBe('P-MALT');
    expect(achatPrevu(achat({ nom: 'Malterie Suisse' }), 50000, [malt])).toBeNull();
    expect(achatPrevu(achat({ nom: 'Brouwland' }), 42157, [malt])).toBeNull();
    const e = preparer({ ...achat({ nom: 'Malterie Suisse pilsner' }), cents: 42157, prevu: 'P-MALT' }, ctx());
    expect(e.transaction.finance?.planId).toBe('P-MALT');
    expect(e.plan).toBeUndefined();
  });
  it('jamais pour une écriture qui revient, un prélèvement privé ni une entrée', () => {
    expect(achatPrevu(achat({ nom: 'Malterie Suisse', rythme: 'monthly' }), 42000, [malt])).toBeNull();
    expect(achatPrevu({ ...avecGenre(brouillonNeuf(J), 'prel'), nom: 'Malterie Suisse' }, 42000, [malt])).toBeNull();
    expect(achatPrevu({ ...avecGenre(brouillonNeuf(J), 'vente'), nom: 'Malterie Suisse' }, 42000, [malt])).toBeNull();
  });
});
