import { describe, expect, it } from 'vitest';
import { ClientStatsService } from '../../src/services/clientStats';
import type { Client, Transaction } from '../../src/types';

// AM-71 : « Bar » comptait « Barbier » ; une vente annulée et un avoir comptaient comme des ventes.
// TE-57 : une vente saisie au comptoir au nom du client (description + proofNotes de la quittance) doit se rattacher à sa fiche.

const client = (name: string, id = 'C-1'): Client => ({ id, name, type: 'Pro', contact: '', phone: '', email: '' } as Client);
const vente = (over: Partial<Transaction> = {}): Transaction => ({
  id: 'T-1', date: new Date().toISOString().slice(0, 10), description: 'Vente Bière artisanale — Bar du Pont', category: 'recettes', amountHT: 100, amountTTC: 100, tvaRate: 0, tvaAmount: 0,
  proofNotes: 'Client: Bar du Pont · Paiement: TWINT', ...over,
} as Transaction);

describe('Rattachement par nom', () => {
  it('« Bar » ne compte pas une vente au « Barbier »', () => {
    const t = vente({ description: 'Vente x — Barbier', proofNotes: 'Client: Barbier' });
    expect(ClientStatsService.matchesClient(t, client('Bar'))).toBe(false);
    expect(ClientStatsService.matchesClient(t, client('Barbier'))).toBe(true);
  });
  it('la vente va au nom le plus précis quand deux clients la citent', () => {
    const bar = client('Bar le Pont', 'C-1'), barDuPont = client('Bar le Pont du Rhône', 'C-2');
    const t = vente({ description: 'Vente x — Bar le Pont du Rhône', proofNotes: 'Client: Bar le Pont du Rhône' });
    const stats = ClientStatsService.forAll([bar, barDuPont], [t]);
    expect(stats.get('C-1')?.orderCount).toBe(0);
    expect(stats.get('C-2')?.orderCount).toBe(1);
  });
  it('les accents et les majuscules ne séparent pas un client de sa vente', () => {
    expect(ClientStatsService.matchesClient(vente({ description: 'Vente — ÉRIC SA', proofNotes: '' }), client('Eric SA'))).toBe(true);
  });
  it('un nom avec des signes de regex ne casse rien', () => {
    expect(() => ClientStatsService.matchesClient(vente(), client('Café (le) + [bar]'))).not.toThrow();
  });
});

describe('Ventes annulées et avoirs', () => {
  it('une vente annulée ne compte pas', () => {
    const t = vente({ finance: { version: 1, kind: 'income', amountCents: 10000, lines: [], paymentStatus: 'paid', recordedAt: 'x', voidedAt: '2026-11-09T10:00:00Z' } as any });
    const s = ClientStatsService.forClient(client('Bar du Pont'), [t]);
    expect(s.orderCount).toBe(0);
    expect(s.totalSales).toBe(0);
    expect(s.status).toBe('Prospect');
  });
  it('un avoir se déduit du chiffre d’affaires et n’est pas une commande', () => {
    const avoir = vente({ id: 'T-2', amountTTC: 30, finance: { version: 1, kind: 'refund', amountCents: 3000, lines: [], paymentStatus: 'unpaid', recordedAt: 'x', refundOfId: 'T-1' } as any });
    const s = ClientStatsService.forClient(client('Bar du Pont'), [vente(), avoir]);
    expect(s.orderCount).toBe(1);
    expect(s.totalSales).toBe(70);
  });
  it('TE-57 : la vente du comptoir au nom du client se rattache à sa fiche', () => {
    const t = vente({ description: 'Vente Bière artisanale — ZZ TEST — Clients', proofNotes: 'Client: ZZ TEST — Clients · Paiement: TWINT', amountTTC: 1 });
    const s = ClientStatsService.forClient(client('ZZ TEST — Clients'), [t]);
    expect(s.orderCount).toBe(1);
    expect(s.totalSales).toBe(1);
    expect(s.status).toBe('Actif');
  });
});
