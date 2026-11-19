import { describe, expect, it, vi } from 'vitest';
/**
 * AM-69 : espèces sans arrondi aux 5 centimes. Règle suisse : un paiement en espèces s'arrondit au multiple de 5 ct le plus proche
 * (`Math.round(x * 20) / 20`) ; l'écart est une ligne « Arrondi à 5 centimes » (comme la Dépense), jamais une TVA ni un prix modifié.
 * TWINT et facture : montant exact.
 */
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
import { arrondiEspeces } from '../../src/ui/vente/panier';
import { preparerVente } from '../../src/ui/vente/enregistrerVente';
import { validateFinanceTransaction } from '../../src/domain/finance/ledger';
import type { AppConfig } from '../../src/types';

const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: 0 }, company: { name: 'Brasserie Test', owner: '', uid: '' }, brewhouses: [] } as unknown as AppConfig;
const aujourdhui = new Date().toISOString().slice(0, 10);
const ligne = (quantite: number, prixHT: number) => ({ cle: 'B1:33cl', batchId: 'B1', formatId: '33cl', designation: 'Pale Ale · 33 cl', litresUnite: 0.33, quantite, prixHT });
const vente = (moyen: 'cash' | 'twint', quantite: number, prixHT: number) =>
  preparerVente({ mode: 'paye', lignes: [ligne(quantite, prixHT)], client: null, dateIso: aujourdhui, echeance: 30, moyen, config, numero: 'FAC-2026-0001' });

describe('arrondiEspeces : le multiple de 5 ct le plus proche', () => {
  it.each([[1185, 1185, 0], [1187, 1185, -2], [1188, 1190, 2], [1182, 1180, -2], [1183, 1185, 2], [1175, 1175, 0], [3, 5, 2]])(
    '%i ct → %i ct (écart %i)', (total, attendu, ecart) => {
      expect(arrondiEspeces(total)).toEqual({ totalCents: attendu, ecartCents: ecart });
      expect(attendu / 100).toBe(Math.round((total / 100) * 20) / 20);
    });
  it('un total de 1 ou 2 ct ne tombe pas à 0 : pas d\'arrondi', () => {
    expect(arrondiEspeces(2)).toEqual({ totalCents: 2, ecartCents: 0 });
    expect(arrondiEspeces(1)).toEqual({ totalCents: 1, ecartCents: 0 });
  });
});

describe('Vente en espèces : arrondie, écart en ligne', () => {
  it('3 × 3,95 = 11,85 : rien à arrondir', async () => {
    const v = await vente('cash', 3, 3.95);
    expect(v.totalCents).toBe(1185);
    expect(v.entry.transaction.finance!.lines.some(l => /arrondi/i.test(l.description))).toBe(false);
  });
  it('3 × 3,96 = 11,88 → 11,90 en espèces, ligne « Arrondi à 5 centimes » +0,02, paiement 11,90', async () => {
    const v = await vente('cash', 3, 3.96);
    const f = v.entry.transaction.finance!;
    expect(v.totalCents).toBe(1190);
    expect(f.amountCents).toBe(1190);
    expect(v.entry.transaction.amountTTC).toBe(11.9);
    const arrondi = f.lines.find(l => /arrondi/i.test(l.description));
    expect(arrondi).toMatchObject({ description: 'Arrondi à 5 centimes', amountCents: 2, kind: 'other' });
    expect(f.lines.reduce((s, l) => s + l.amountCents, 0)).toBe(1190);
    expect(v.entry.payment!.amountCents).toBe(1190);
    expect(() => validateFinanceTransaction(v.entry.transaction as never)).not.toThrow();
  });
  it('3 × 3,94 = 11,82 → 11,80 : écart négatif en ligne « discount »', async () => {
    const v = await vente('cash', 3, 3.94);
    const f = v.entry.transaction.finance!;
    expect(f.amountCents).toBe(1180);
    expect(f.lines.find(l => /arrondi/i.test(l.description))).toMatchObject({ amountCents: -2, kind: 'discount' });
    expect(v.entry.payment!.amountCents).toBe(1180);
    expect(() => validateFinanceTransaction(v.entry.transaction as never)).not.toThrow();
  });
  it('TWINT : montant exact, aucune ligne d\'arrondi', async () => {
    const v = await vente('twint', 3, 3.96);
    expect(v.totalCents).toBe(1188);
    expect(v.entry.transaction.finance!.lines.some(l => /arrondi/i.test(l.description))).toBe(false);
    expect(v.entry.payment!.amountCents).toBe(1188);
  });
});
