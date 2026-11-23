/**
 * Voie ecr-saisie (23.11) : les règles de calcul derrière E35-5, 7, 11, 12 et 14 (sans écran). Fixtures simulées.
 */
import { describe, expect, it } from 'vitest';
import { propositionsTiers, tiersExiste, verbeEnregistrer, resumeReglement } from '../../src/ui/saisie/modele';
import { jourTouche } from '../../src/ui/toucherDate';
import { nomDeLaChose } from '../../src/ui/finance/nomDeLaChose';
import type { FinanceTransaction, FinancialPayment } from '../../src/domain/finance/types';

const vente = (id: string, description: string, vendor: string | undefined, extra: Record<string, unknown> = {}): FinanceTransaction => ({
  id, date: '2026-11-10', description, category: 'recettes', subcategory: 'Vente', amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'income', amountCents: 1000, lines: [], paymentStatus: 'paid', ...(vendor ? { vendor } : {}), ...extra } }) as FinanceTransaction;

describe('E35-7 : le bouton dit « À recevoir » quand c’est à recevoir', () => {
  it('une vente à recevoir : « À recevoir » (et non « À payer »)', () => { expect(verbeEnregistrer(true, 'in', 'vente')).toBe('À recevoir'); });
  it('une dépense à payer : « À payer »', () => { expect(verbeEnregistrer(true, 'out', 'achat')).toBe('À payer'); });
  it('réglé : Payé, Reçu, Retiré', () => {
    expect(verbeEnregistrer(false, 'out', 'achat')).toBe('Payé');
    expect(verbeEnregistrer(false, 'in', 'vente')).toBe('Reçu');
    expect(verbeEnregistrer(false, 'out', 'prel')).toBe('Retiré');
  });
});

describe('E35-5 : « + autre » propose les clients de l’onglet Clients et les fournisseurs connus', () => {
  const clients = [{ name: 'Café du Port', favorite: true }, { name: 'Zoé Bar' }, { name: 'Ancien', archivedAt: '2026-01-01T00:00:00Z' }, { name: 'Boulangerie Dupont' }];
  const achat = { ...vente('A1', 'Malt', 'Brau-Rauchshop'), category: 'brassage', subcategory: 'Achat', finance: { version: 1, kind: 'expense', amountCents: 500, lines: [], vendor: 'Brau-Rauchshop' } } as FinanceTransaction;
  const txs = [vente('V1', 'Vente 1', 'Café du Port'), vente('V2', 'Vente 2', 'Le Sapin'), achat];
  it('Vente : les clients actifs (épinglés d’abord), puis les clients déjà écrits sur des ventes, sans doublon ni archivé', () => {
    expect(propositionsTiers('vente', '', { clients, transactions: txs })).toEqual(['Café du Port', 'Boulangerie Dupont', 'Zoé Bar', 'Le Sapin']);
  });
  it('la frappe filtre sans tenir compte des accents ni de la casse ; « ZZ » ne trouve rien', () => {
    expect(propositionsTiers('vente', 'cafe', { clients, transactions: txs })).toEqual(['Café du Port']);
    expect(propositionsTiers('vente', 'ZZ', { clients, transactions: txs })).toEqual([]);
  });
  it('Achat : les fournisseurs déjà écrits, jamais les clients', () => {
    expect(propositionsTiers('achat', '', { clients, transactions: txs })).toEqual(['Brau-Rauchshop']);
  });
  it('un nom déjà proposé n’appelle pas « Créer » ; un nom neuf, si', () => {
    expect(tiersExiste('café du port', ['Café du Port'])).toBe(true);
    expect(tiersExiste('ZZ Client', ['Café du Port'])).toBe(false);
  });
});

describe('E35-11 : la fiche Modifier lit le règlement comme la saisie', () => {
  const paiement = (id: string, transactionId: string, date: string, method: FinancialPayment['method'], extra: Partial<FinancialPayment> = {}): FinancialPayment =>
    ({ id, transactionId, date, amountCents: 1000, direction: 'in', method, recordedAt: `${date}T10:00:00Z`, ...extra });
  it('payé : la date et le moyen du dernier paiement vivant', () => {
    const t = vente('V1', 'ZZ TEST — Vente', 'Café');
    expect(resumeReglement(t, [paiement('P1', 'V1', '2026-11-12', 'twint')])).toEqual({ etat: 'paye', moyen: 'twint', date: '2026-11-12' });
  });
  it('un paiement annulé ne compte pas', () => {
    const t = vente('V1', 'x', 'Café', { paymentStatus: 'paid' });
    const ps = [paiement('P1', 'V1', '2026-11-12', 'cash'), paiement('P2', 'V1', '2026-11-13', 'cash', { reversalOfId: 'P1' }), paiement('P0', 'V1', '2026-11-01', 'bank')];
    expect(resumeReglement(t, ps).moyen).toBe('bank');
  });
  it('à recevoir : l’échéance, pas de moyen inventé', () => {
    const t = vente('V1', 'x', 'Café', { paymentStatus: 'unpaid', dueDate: '2026-12-10' });
    expect(resumeReglement(t, [])).toEqual({ etat: 'apayer', echeance: '2026-12-10' });
  });
  it('sans statut ni paiement : inconnu (jamais « payé » par défaut)', () => {
    const t = vente('V1', 'x', 'Café'); delete (t.finance as { paymentStatus?: string }).paymentStatus;
    expect(resumeReglement(t, []).etat).toBe('inconnu');
  });
});

describe('E35-12 : la recherche des Opérations porte le nom de la chose, jamais un identifiant', () => {
  it('le nom de la pièce', () => { expect(nomDeLaChose({ description: ' ZZ TEST — Vente ' })).toBe('ZZ TEST — Vente'); });
  it('sans nom, le tiers ; sans rien, vide (pas de code à l’écran)', () => {
    expect(nomDeLaChose({ description: '', finance: { vendor: 'Café du Port' } })).toBe('Café du Port');
    expect(nomDeLaChose({})).toBe('');
  });
});

describe('E35-14 : le jour touché sur la piste', () => {
  it('la case contenant x : à droite du jour posé, les jours suivants ; à gauche, les précédents', () => {
    expect(jourTouche('2026-11-23', 150, 140, 20)).toBe('2026-11-23');
    expect(jourTouche('2026-11-23', 205, 140, 20)).toBe('2026-11-26');
    expect(jourTouche('2026-11-23', 100, 140, 20)).toBe('2026-11-21');
    expect(jourTouche('2026-11-23', 139, 140, 20)).toBe('2026-11-22');
  });
  it('frise sans mesures : aucun jour inventé', () => {
    expect(jourTouche('2026-11-23', 100, Number.NaN, 20)).toBeNull();
    expect(jourTouche('2026-11-23', 100, 0, 0)).toBeNull();
    expect(jourTouche('', 100, 0, 20)).toBeNull();
  });
});
