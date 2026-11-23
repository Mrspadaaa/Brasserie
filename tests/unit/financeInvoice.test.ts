import { describe, expect, it } from 'vitest';
import { invoiceTotals, SwissQrBillService } from '../../src/services/swissQrBill';
import type { AppConfig, Client } from '../../src/types';
const client = { id: 'CLIENT-TEST', name: 'Client saisi', type: 'Pro', contact: 'Contact saisi', email: 'client@example.test' } as Client;
const config = { company: { name: 'Brasserie de test', address: 'Rue test 1', npa: '1700 Fribourg', iban: '' }, fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081, tvaReducedRate: 0.026 } } as AppConfig;
describe('Facture issue des articles réellement saisis', () => {
  it('utilise les lignes et les centimes sans TVA pour la raison individuelle non assujettie', () => {
    const items = [{ description: 'Fut saisi par le brasseur', quantity: 2, unitPriceHT: 73.25, tvaRate: 0.081 }];
    const invoice = SwissQrBillService.generateInvoicePdf(client, items, config, 'FAC-TEST', { date: '2026-09-09', dueDate: '2026-10-09', download: false });
    expect(invoice.totals).toMatchObject({ netCents: 14_650, vatCents: 0, totalCents: 14_650 });
    expect(invoice.doc.output()).toContain('Fut saisi par le brasseur');
    expect(invoice.doc.output()).toContain('FAC-TEST');
    expect(invoice.doc.output()).not.toContain('Swiss QR');
  });
  it('calcule la TVA normale des lignes de bière et refuse les articles incomplets', () => {
    expect(invoiceTotals([{ description: 'Biere', quantity: 1, unitPriceHT: 100, tvaRate: 0.081 }], true).totalCents).toBe(10_810);
    expect(() => invoiceTotals([{ description: '', quantity: 1, unitPriceHT: 100, tvaRate: 0.081 }], false)).toThrow();
    expect(() => invoiceTotals([{ description: 'Biere', quantity: 1e100, unitPriceHT: 100, tvaRate: 0.081 }], false)).toThrow('précision');
  });
});
