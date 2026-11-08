/**
 * Rejeu en ligne ff0f822e, RL-8 : le ticket imprime « TWINT CHF 165.20 Paye » et l'écran propose « Compte bancaire / carte ». La lecture ne portait aucun moyen de paiement
 * (seulement « payé / à payer ») et le brouillon gardait son défaut. Aujourd'hui : la lecture rend `paymentMethod` (schéma et consigne du serveur, normalisation, recollage des
 * morceaux), le client le range (`MOYEN_LU` : TWINT → twint, espèces → cash, carte et virement → compte), et un moyen non imprimé laisse le défaut. Fixtures fictives, aucun appel IA.
 */
import { describe, expect, it } from 'vitest';
import { TASKS } from '../../../functions/src/prompts';
import { normalizeInvoiceScan } from '../../../functions/src/invoiceScanCore';
import { mergeDecoded } from '../../../functions/src/invoiceMorceaux';
import { GeminiScannerService } from '../../../src/services/geminiScanner';
import { scannedPayment, applyScannedPayment } from '../../../src/services/purchasePrefill';

const lu = (paymentMethod: string | undefined, paymentEvidence = 'paid') => GeminiScannerService.normalizeResult({ vendor: 'Brassi-Shop Fictif Sarl', date: '27.09.2026', amountTTC: 165.2, paymentEvidence, ...(paymentMethod === undefined ? {} : { paymentMethod }), items: [] });

describe('RL-8 : le moyen de paiement imprimé arrive jusqu\'au règlement', () => {
  it('le schéma et la consigne du serveur demandent le moyen imprimé (TWINT compris), sans le deviner', () => {
    const schema: any = (TASKS.scanInvoice as any).schema;
    expect(schema.properties.paymentMethod.enum).toEqual(expect.arrayContaining(['twint', 'cash', 'card', 'bank_transfer', 'unknown']));
    expect(schema.required).toContain('paymentMethod');
    expect((TASKS.scanInvoice as any).system).toMatch(/paymentMethod[^.]*IMPRIMÉ[^]*TWINT/);
  });
  it('serveur : le moyen lu est gardé, une valeur inconnue du schéma devient unknown, les morceaux gardent le dernier moyen lu', () => {
    expect((normalizeInvoiceScan({ paymentMethod: 'twint' }) as any).paymentMethod).toBe('twint');
    expect((normalizeInvoiceScan({ paymentMethod: 'bitcoin' }) as any).paymentMethod).toBe('unknown');
    expect((normalizeInvoiceScan({}) as any).paymentMethod).toBe('unknown');
    expect(mergeDecoded([{ items: [], paymentMethod: 'unknown' }, { items: [], paymentMethod: 'twint' }, { items: [], paymentMethod: 'unknown' }], { dedupe: false }).paymentMethod).toBe('twint');
    expect(mergeDecoded([{ items: [] }, { items: [] }], { dedupe: false }).paymentMethod).toBe('unknown');
  });
  it('client : « twint » lu et payé → moyen TWINT au brouillon (et non « Compte bancaire / carte »)', () => {
    expect(lu('twint').paymentMethod).toBe('twint');
    expect(scannedPayment(lu('twint'), '2026-11-08')).toMatchObject({ paymentStatus: 'paid', paymentMethod: 'twint' });
    expect(scannedPayment(lu('cash'), '2026-11-08').paymentMethod).toBe('cash');
    expect(scannedPayment(lu('card'), '2026-11-08').paymentMethod).toBe('bank');
    expect(scannedPayment(lu('bank_transfer'), '2026-11-08').paymentMethod).toBe('bank');
  });
  it('un moyen non imprimé, inconnu ou sur une dépense à payer ne pose rien (l\'inconnu n\'est jamais deviné)', () => {
    expect(scannedPayment(lu('unknown'), '2026-11-08')).not.toHaveProperty('paymentMethod');
    expect(scannedPayment(lu(undefined), '2026-11-08')).not.toHaveProperty('paymentMethod');
    expect(scannedPayment(lu('twint', 'unpaid'), '2026-11-08')).not.toHaveProperty('paymentMethod');
  });
  it('applyScannedPayment : le patch du brouillon porte le moyen lu', () => {
    const avant: any = { paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: '2026-11-08', paymentDateBasis: undefined };
    expect(applyScannedPayment(avant, lu('twint'), '2026-11-08')).toMatchObject({ paymentMethod: 'twint' });
  });
});
