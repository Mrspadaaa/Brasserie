// LR3-1 (g1, 20.11) : un ticket de caisse qui n'imprime que le MONTANT de chaque ligne (BAUHAUS, doc25) : le « 1 » imprimé après le montant est le code de TVA, jamais une quantité (B1) ;
// la quantité restait donc NULL sur les 22 lignes, les 3 lectures divergeaient sur « prix : vide / égal au montant » (24 points), 22 lignes sautées par le contrôle, d'où « ? × — » et « à remplir ».
// Règle : sur un ticket, une ligne qui n'a qu'un montant (prix absent ou égal au montant, aucune quantité, aucune marque de multiplication dans l'extrait) vaut UNE unité : quantité 1, prix = montant,
// dits « déduits » (`quantityDeduced`). Jamais sur une remise, jamais si l'extrait montre « 2 x 4.50 » ou « 3 * », jamais sur une facture.
// Réponses RÉELLES du modèle (lot 1 du 20.11, anonymisées : `tests/unit/depense/g1/brut/`), rejouées par la lecture de production (`lireCsv8`).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan, quantiteUnDeTicket } from '../../functions/src/invoiceScanCore';
import { lireFixture, normaliser } from './depense/g1/lire';

describe('LR3-1 : ticket sans quantité imprimée (doc25, lecture réelle)', () => {
  it('chaque lecture rend quantité 1 et prix = montant sur les 22 lignes, marquées déduites', () => {
    for (const lecture of normaliser('doc25-ticket-t1')) {
      for (const ligne of lecture.items) {
        expect(ligne.quantity, ligne.name).toBe(1);
        expect(ligne.price, ligne.name).toBe(ligne.amountTTC);
        expect((ligne as any).quantityDeduced, ligne.name).toBe(true);
      }
    }
  });
  it('la lecture finale : aucune quantité nulle, 22 lignes contrôlées (0 sautée), plus de désaccord sur le prix ni la quantité', async () => {
    const r = await lireFixture('doc25-ticket-t1');
    expect(r.items).toHaveLength(22);
    expect(r.items.every((i: any) => i.quantity === 1)).toBe(true);
    expect(r.controls.lines).toMatchObject({ checked: 22, skipped: 0, failed: 0 });
    const bruit = r.points.filter((p: any) => p.code === 'lectures-divergentes' && /\.(price|quantity)$/.test(p.champs[0]));
    // reste, légitime, la ligne 1 (VITRIFIC) : les lectures lisent vraiment 69,95 / 0,95 / 6,95 ; son prix suit son montant
    expect(bruit.map((p: any) => p.ligne)).toEqual([1]);
  });
  it('les garde-fous : une quantité lue reste, une facture, une remise et un extrait « 2 x 4.50 » ne sont jamais déduits', () => {
    const ticket = { documentType: 'receipt' };
    expect(quantiteUnDeTicket(null, ticket.documentType, 'LAME 4.40 1', null, 4.4, 'maintenance')).toBe(1);
    expect(quantiteUnDeTicket(3, ticket.documentType, 'LAME 4.40', 1.2, 3.6, 'maintenance')).toBe(3);
    expect(quantiteUnDeTicket(null, 'invoice', 'LAME 4.40', null, 4.4, 'maintenance')).toBeNull();
    expect(quantiteUnDeTicket(null, ticket.documentType, 'RABAIS -4.40', null, -4.4, 'discount')).toBeNull();
    expect(quantiteUnDeTicket(null, ticket.documentType, 'LAME 2 x 2.20 4.40', null, 4.4, 'maintenance')).toBeNull();
    expect(quantiteUnDeTicket(null, ticket.documentType, 'LAME 4.40', 2.2, 4.4, 'maintenance')).toBeNull(); // prix ≠ montant : la quantité n'est pas 1
    expect(quantiteUnDeTicket(null, ticket.documentType, 'LAME', null, null, 'maintenance')).toBeNull(); // pas de montant : rien n'est déduit
    const n = normalizeInvoiceScan({ documentType: 'invoice', items: [{ name: 'Lame', kind: 'other', quantity: null, price: null, amountTTC: 4.4, evidence: 'Lame 4.40' }], amountTTC: 4.4 });
    expect(n.items[0].quantity).toBeNull();
  });
});
