// La lecture simulée de la facture 372765 (pro-forma payée, 23 lignes, 86,50 CHF) rend la vérité champ par champ,
// et son bloc TVA imprimé incohérent est signalé à sa place. Gemini est simulé : la « lecture » est un JSON (voir generer-fixture.mjs).
// Limite dite : la lecture simulée vient de la vérité transcrite à la main ; ce test prouve la chaîne de contrôle, pas la précision de Gemini.
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { lecture372765, verite372765 } from './aide';

const verite = verite372765();
const r = normalizeInvoiceScan(lecture372765()) as any;

describe('Facture 372765 : champ par champ contre la vérité', () => {
  it('en-tête', () => {
    expect(r).toMatchObject({
      vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: verite.numeroFacture, orderNumber: verite.numeroCommande, date: verite.date, currency: verite.devise,
      amountTTC: verite.totaux.ttc, amountHT: null, tvaRate: null, tvaAmount: verite.tva.tvaTotaleImprimee,
      proForma: true, documentType: 'invoice', documentTypeRetenu: 'invoice', paymentEvidence: 'paid', linesLost: 0, printedLineCount: verite.totaux.nombreDeLignes,
    });
  });

  it('les 23 lignes : référence, libellé, quantité, unité, prix, montant, code de TVA et α', () => {
    expect(r.items).toHaveLength(verite.lignes.length);
    verite.lignes.forEach((vraie: any, i: number) => {
      expect(r.items[i], `ligne ${vraie.n}`).toMatchObject({
        reference: vraie.code, name: vraie.libelle, quantity: vraie.quantite, unit: vraie.unite, price: vraie.prix, amountTTC: vraie.montant,
        vatCode: vraie.codeTva, alphaPct: vraie.attendu.alphaPct ?? null,
      });
    });
  });

  it('le bloc TVA imprimé est lu tel quel (rien n’est recalculé)', () => {
    const imprime = verite.tva.blocImprime;
    expect(r.vat).toEqual([
      { code: 'N', rate: 0.081, base: imprime['N 8.1%'].belegbetrag, amount: imprime['N 8.1%'].mwst },
      { code: 'R', rate: 0.026, base: imprime['R 2.6%'].belegbetrag, amount: imprime['R 2.6%'].mwst },
    ]);
  });
});

describe('Facture 372765 : ce que le code contrôle', () => {
  it('les montants et la somme sont justes ; seul le bloc TVA est signalé, par un seul point', () => {
    expect(r.controls).toEqual({
      lines: { checked: 23, failed: 0, skipped: 0, skippedIds: [] },
      sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'ecart', base: 'TTC' }, totals: { statut: 'non-verifiable' },
    });
    expect(r.points.map((p: any) => p.code)).toEqual(['tva-incoherente']);
    expect(r.issues.some((m: string) => m.startsWith('TVA imprimée incohérente'))).toBe(true);
  });

  it('les quatre avertissements libres du modèle restent (le code n’en supprime aucun)', () => {
    expect(r.fieldWarnings.map((w: any) => w.field)).toEqual(['documentType', 'tvaRate', 'amountHT', 'invoiceNumber']);
  });

  it('trois lectures identiques rapprochées : mêmes points, même contrôle, une seule phrase « Plus de 35 lignes » (aucune)', () => {
    const { result } = reconcileInvoiceVision([normalizeInvoiceScan(lecture372765()), normalizeInvoiceScan(lecture372765()), normalizeInvoiceScan(lecture372765())]) as any;
    expect(result.points.map((p: any) => p.code)).toEqual(['tva-incoherente']);
    expect(result.controls.sum.statut).toBe('ok');
    expect(result.amountTTC).toBe(86.5);
    expect(result.amountHT).toBeNull();
  });

  it('le résultat est stockable tel quel : aucune clé à undefined', () => {
    expect(JSON.parse(JSON.stringify(r))).toStrictEqual(r);
  });
});
