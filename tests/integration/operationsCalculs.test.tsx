import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';
import { paymentState } from '../../src/domain/finance/ledger';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';
import { contrePaiement, dernierPaiementAnnulable, echeance, enRetard, etatDeLigne, joursEntre, paiementRapide, pieceDe, retardTotal } from '../../src/ui/finance/operations/calculs';
import { groupeDe } from '../../src/ui/finance/operations/groupes';

/** Règles pures de l'écran Opérations (v6b). « Aujourd'hui » est un paramètre : le 9 novembre 2026. */
const TODAY = '2026-11-09';
// shortDate() compare l'année à l'horloge : on la fige au 9 novembre 2026 (UO-10), seule la date est simulée.
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-09T10:00:00')); });
afterAll(() => { vi.useRealTimers(); });
const NOW = '2026-11-09T10:00:00.000Z';
const tx = (id: string, cents: number, patch: Partial<Transaction> = {}, finance: Record<string, unknown> = {}): Transaction => ({
  id, description: id, date: TODAY, category: 'brassage', subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'unpaid', recordedAt: NOW, lines: [], ...finance }, ...patch,
} as Transaction);
const paiement = (t: Transaction, cents = t.finance!.amountCents, date = TODAY, id = `PAI-${t.id}`): FinancialPayment =>
  ({ id, transactionId: t.id, date, amountCents: cents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: NOW });

describe('échéance et retard', () => {
  it('dit la date et le délai, « aujourd’hui », ou depuis quand ; sans échéance, jamais 0 jour', () => {
    expect(joursEntre('2026-11-09', '2026-11-25')).toBe(16);
    expect(echeance('2026-11-25', TODAY)).toMatchObject({ texte: '25 nov. · dans 16 j', retard: false, jours: 16 });
    expect(echeance('2026-11-09', TODAY)).toMatchObject({ texte: 'aujourd’hui', retard: false });
    expect(echeance('2025-12-20', TODAY)).toMatchObject({ texte: 'depuis le 20 déc. 2025', retard: true });
    expect(echeance(undefined, TODAY)).toMatchObject({ texte: 'sans échéance', retard: false, jours: null });
    expect(echeance('pas une date', TODAY).texte).toBe('sans échéance');
  });
  it('le retard total ne compte que le reste dû des écritures actives échues, toutes années', () => {
    const loyer = tx('LOYER', 40000, {}, { dueDate: '2026-11-25' });
    const solde = tx('SOLDE-2025', 6000, { date: '2025-12-20' }, { dueDate: '2025-12-20' });
    const partiel = tx('PARTIEL', 10000, { date: '2026-09-01' }, { dueDate: '2026-10-01' });
    const annule = tx('ANNULE', 9999, { date: '2026-01-01' }, { dueDate: '2026-02-01', voidedAt: NOW });
    const payes = [paiement(partiel, 4000, '2026-09-15')];
    const toutes = [loyer, solde, partiel, annule];
    const lignes = toutes.map(transaction => ({ transaction, payment: paymentState(transaction, payes, toutes, TODAY) }));
    expect(enRetard(loyer, lignes[0].payment, TODAY)).toBe(false);
    expect(retardTotal(lignes, TODAY)).toEqual({ totalCents: 6000 + 6000, annees: ['2025', '2026'] });
  });
});

describe('paiement rapide et contre-écriture', () => {
  it('le paiement rapide est le reste dû exact, aujourd’hui, par banque ; jamais sur un état inconnu ni sur une pièce réglée', () => {
    const partiel = tx('P', 10000);
    const deja = paiement(partiel, 4000, '2026-11-01');
    const etat = paymentState(partiel, [deja], [partiel], TODAY);
    expect(paiementRapide(partiel, etat, 'out', TODAY, 'PAI-NEUF', NOW)).toEqual({ id: 'PAI-NEUF', transactionId: 'P', date: TODAY, amountCents: 6000, direction: 'out', method: 'bank', recordedAt: NOW });
    const inconnue = tx('I', 5000, {}, { paymentStatus: undefined });
    expect(paymentState(inconnue, [], [inconnue], TODAY).state).toBe('unknown');
    expect(paiementRapide(inconnue, paymentState(inconnue, [], [inconnue], TODAY), 'out', TODAY, 'X', NOW)).toBeNull();
    const reglee = tx('R', 5000);
    expect(paiementRapide(reglee, paymentState(reglee, [paiement(reglee)], [reglee], TODAY), 'out', TODAY, 'X', NOW)).toBeNull();
    const annulee = tx('A', 5000, {}, { voidedAt: NOW });
    expect(paiementRapide(annulee, paymentState(annulee, [], [annulee], TODAY), 'out', TODAY, 'X', NOW)).toBeNull();
  });
  it('une vente non encaissée donne un paiement dans le sens « entrée »', () => {
    const vente = tx('V', 7200, { category: 'recettes' }, { kind: 'income' });
    const etat = paymentState(vente, [], [vente], TODAY);
    expect(paiementRapide(vente, etat, 'in', TODAY, 'PAI-V', NOW)?.direction).toBe('in');
  });
  it('la contre-écriture inverse exactement le paiement (id CONTRE-, même montant, date d’origine) et le remet à payer', () => {
    const loyer = tx('LOYER', 40000);
    const p = paiement(loyer);
    const c = contrePaiement(p, NOW);
    expect(c).toMatchObject({ id: 'CONTRE-PAI-LOYER', reversalOfId: 'PAI-LOYER', direction: 'in', amountCents: 40000, date: TODAY });
    expect(paymentState(loyer, [p], [loyer], TODAY).state).toBe('paid');
    expect(paymentState(loyer, [p, c], [loyer], TODAY)).toMatchObject({ state: 'unpaid', remainingCents: 40000 });
  });
  it('« Annuler » n’existe que pour le paiement du jour, non annulé ; après le jour, la correction passe par la fiche', () => {
    const loyer = tx('LOYER', 40000);
    const p = paiement(loyer);
    expect(dernierPaiementAnnulable(loyer, [p], TODAY)?.id).toBe('PAI-LOYER');
    expect(dernierPaiementAnnulable(loyer, [p, contrePaiement(p, NOW)], TODAY)).toBeNull();
    expect(dernierPaiementAnnulable(loyer, [paiement(loyer, 40000, '2026-11-01')], TODAY)).toBeNull();
  });
});

describe('état et pièce d’une ligne', () => {
  it('payé : la date et le mode ; aujourd’hui ; à payer : l’échéance ; en retard : depuis quand ; l’inconnu se dit', () => {
    const elec = tx('ELEC', 6800);
    const p = paiement(elec, 6800, '2026-11-09');
    expect(etatDeLigne(elec, paymentState(elec, [p], [elec], TODAY), false, [p], TODAY)).toMatchObject({ texte: '✓ payé aujourd’hui · banque', ton: 'ok', regle: true });
    const ancien = paiement(elec, 6800, '2026-11-02');
    expect(etatDeLigne(elec, paymentState(elec, [ancien], [elec], TODAY), false, [ancien], TODAY).texte).toBe('✓ payé 2 nov. · banque');
    const loyer = tx('LOYER', 40000, {}, { dueDate: '2026-11-25' });
    expect(etatDeLigne(loyer, paymentState(loyer, [], [loyer], TODAY), false, [], TODAY)).toMatchObject({ texte: 'à payer · 25 nov. · dans 16 j', ton: 'pay', retard: false });
    const solde = tx('SOLDE', 6000, { date: '2025-12-20' }, { dueDate: '2025-12-20' });
    expect(etatDeLigne(solde, paymentState(solde, [], [solde], TODAY), false, [], TODAY)).toMatchObject({ texte: 'à payer depuis le 20 déc. 2025', ton: 'late', retard: true });
    const vente = tx('VENTE', 7200, { category: 'recettes' }, { kind: 'income' });
    expect(etatDeLigne(vente, paymentState(vente, [], [vente], TODAY), true, [], TODAY).texte).toBe('à encaisser · sans échéance');
    const inconnue = tx('INC', 5000, {}, { paymentStatus: undefined });
    expect(etatDeLigne(inconnue, paymentState(inconnue, [], [inconnue], TODAY), false, [], TODAY)).toMatchObject({ texte: 'Paiement à confirmer', ton: 'unknown' });
    const annulee = tx('ANN', 5000, {}, { voidedAt: NOW });
    expect(etatDeLigne(annulee, paymentState(annulee, [], [annulee], TODAY), false, [], TODAY).texte).toBe('Annulé');
  });
  it('la pièce : « sans pièce » seulement s’il n’y en a aucune ; un envoi en cours n’est pas une absence ; type et détail si connus', () => {
    expect(pieceDe(tx('A', 100))).toEqual({ texte: 'sans pièce', manque: true });
    expect(pieceDe(tx('B', 100, {}, { proofUpload: { state: 'queued', uid: 'u', at: NOW } }))).toEqual({ texte: 'envoi en cours', manque: false });
    expect(pieceDe(tx('C', 100, {}, { proofUpload: { state: 'failed', uid: 'u', at: NOW } }))).toEqual({ texte: 'à renvoyer', manque: true });
    expect(pieceDe(tx('D', 100, {}, { proofDocumentId: 'DOC', sourceDocumentType: 'invoice' }))).toEqual({ texte: 'facture', manque: false });
    expect(pieceDe(tx('E', 100, {}, { proofDocumentId: 'DOC', sourceDocumentType: 'invoice',
      lines: [{ id: 'l', description: 'Pilsner', kind: 'ingredient', quantity: 25, unit: 'kg', amountCents: 100 }] }))).toEqual({ texte: 'facture · Pilsner 25 kg', manque: false });
    expect(pieceDe(tx('F', 100, { proofUrl: 'data:x' })).texte).toBe('pièce');
  });
});

describe('groupes et piles : une seule règle du domaine', () => {
  it('une écriture paraît une fois, sous sa catégorie ; le matériel et les travaux vont à part ; échue hors du mois : en retard', () => {
    expect(groupeDe(tx('A', 1, { category: 'chargesFixes' }), { retardHorsMois: false })).toBe('chargesFixes');
    expect(groupeDe(tx('B', 1, { category: 'materiel' }), { retardHorsMois: false })).toBe('part');
    expect(groupeDe(tx('C', 1, { category: 'renovation' }), { retardHorsMois: false })).toBe('part');
    expect(groupeDe(tx('D', 1, { category: 'divers' }), { retardHorsMois: false })).toBe('divers');
    expect(groupeDe(tx('E', 1, { category: 'chargesFixes' }), { retardHorsMois: true })).toBe('retard');
    expect(groupeDe(tx('F', 1, { date: '' as never }), { retardHorsMois: false })).toBe('sansDate');
  });
  it('la fixture v6b : payé + à payer = dépensé (hors matériel), avant et après « ✓ Payé » ; une ouverte d’un autre mois n’y entre pas', () => {
    const loyer = tx('LOYER', 40000, { category: 'chargesFixes' }, { dueDate: '2026-11-25' });
    const elec = tx('ELEC', 6800, { category: 'chargesFixes' });
    const malt = tx('MALT', 18680, { category: 'brassage' });
    const nettoyant = tx('NETT', 4200, { category: 'nettoyage' });
    const joints = tx('JOINTS', 2860, { category: 'materiel' });
    const solde = tx('SOLDE-2025', 6000, { category: 'chargesFixes', date: '2025-12-20' }, { dueDate: '2025-12-20' });
    const toutes = [loyer, elec, malt, nettoyant, joints, solde];
    const reglees = [elec, malt, nettoyant, joints].map(t => paiement(t));
    const avant = periodeSynthese({ transactions: toutes, payments: reglees, mois: '2026-11', aujourdhui: TODAY });
    expect(avant).toMatchObject({ depenseCents: 69680, aPayerCents: 40000, payeCents: 29680, materielCents: 2860 });
    expect(avant.payeCents + avant.aPayerCents).toBe(avant.depenseCents);
    const apres = periodeSynthese({ transactions: toutes, payments: [...reglees, paiement(loyer)], mois: '2026-11', aujourdhui: TODAY });
    expect(apres).toMatchObject({ depenseCents: 69680, aPayerCents: 0, payeCents: 69680 });
    // L'ouverte de 2025 n'entre ni dans la barre du mois, ni dans le dépensé : elle se dit dans « en retard ».
    expect(periodeSynthese({ transactions: toutes.filter(t => t.id !== 'SOLDE-2025'), payments: reglees, mois: '2026-11', aujourdhui: TODAY }).depenseCents).toBe(avant.depenseCents);
  });
  it('une annulée n’entre ni dans une pile ni dans un total ; une facture à 26 lignes compte une fois', () => {
    const lignes = Array.from({ length: 26 }, (_, i) => ({ id: `L${i}`, description: `Ligne ${i}`, kind: 'ingredient' as const, amountCents: i === 25 ? 11040 - 25 * 100 : 100 }));
    const facture = tx('FACTURE', 11040, {}, { lines: lignes });
    const annulee = tx('ANNULEE', 99900, {}, { voidedAt: NOW });
    const p = periodeSynthese({ transactions: [facture, annulee], payments: [], mois: '2026-11', aujourdhui: TODAY });
    expect(p.depenseCents).toBe(11040);
    expect(p.lignes).toBe(1);
    expect(p.postes.reduce((n, x) => n + x.cents, 0)).toBe(11040);
  });
});
