// C1 : quantité × prix unitaire = montant de la ligne, au centime. Ecrit AVANT la correction (L13).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { avecLigne, entete, lecture372765, ligne, trouve } from './aide';

const lire = (items: any[], over: Record<string, unknown> = {}) => normalizeInvoiceScan(entete({ items, ...over })) as any;

describe('C1 — quantité × prix = montant de ligne', () => {
  it('quantité 60 au lieu de 6 : un point sur la ligne 1, en centimes, et la phrase dans issues', () => {
    const r = normalizeInvoiceScan(avecLigne(lecture372765(), 0, { quantity: 60 })) as any;
    const [p] = trouve(r.points, 'ligne-montant');
    expect(p).toMatchObject({ code: 'ligne-montant', gravite: 'ecart', champ: 'items', ligne: 1, unite: 'centimes', lu: 1380, calcule: 13800, ecart: -12420, cle: 'ligne-montant:1:items' });
    expect(p.regle).toContain('quantité × prix');
    expect(r.issues.join(' ')).toContain('Ligne 1');
    expect(r.controls.lines).toMatchObject({ failed: 1 });
  });

  it('les 23 lignes vraies de sa facture : aucun point de ligne, 23 vérifiées', () => {
    const r = normalizeInvoiceScan(lecture372765()) as any;
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
    expect(r.controls.lines).toEqual({ checked: 23, failed: 0, skipped: 0, skippedIds: [] });
  });

  it('une remise (montant négatif) se compare en valeur absolue', () => {
    const r = lire([ligne({ name: 'Rabais', kind: 'discount', quantity: 1, unit: '', price: 2, amountTTC: -2 })]);
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
    expect(r.controls.lines.checked).toBe(1);
  });

  it('une ligne sans prix n’est pas vérifiable : pas de point, mais comptée et nommée', () => {
    const r = lire([ligne({ kind: 'shipping', name: 'Port', quantity: null, unit: '', price: null, amountTTC: 5 }), ligne({ price: null, amountTTC: 3 })]);
    expect(r.points.filter((p: any) => p.code === 'ligne-montant')).toEqual([]);
    expect(r.controls.lines).toMatchObject({ checked: 0, skipped: 2, skippedIds: ['line-1', 'line-2'] });
  });

  it('0,045 × 30 = 1,35 passe ; 0,045 × 5 = 0,225 : 0,22 et 0,23 passent (arrondi du fournisseur inconnu), 0,24 non', () => {
    const un = (quantity: number, amountTTC: number) => lire([ligne({ quantity, unit: 'g', price: 0.045, amountTTC })]);
    expect(trouve(un(30, 1.35).points, 'ligne-montant')).toEqual([]);
    expect(trouve(un(5, 0.22).points, 'ligne-montant')).toEqual([]);
    expect(trouve(un(5, 0.23).points, 'ligne-montant')).toEqual([]);
    expect(trouve(un(5, 0.24).points, 'ligne-montant')).toHaveLength(1);
  });

  it('prix probablement par 100 g : 250 g × 8,00 = 20,00 est un point inverifiable, jamais un écart', () => {
    const r = lire([ligne({ quantity: 250, unit: 'g', price: 8, amountTTC: 20 })]);
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
    expect(trouve(r.points, 'ligne-prix-par-lot')).toEqual([expect.objectContaining({ gravite: 'inverifiable', ligne: 1 })]);
    expect(r.controls.lines).toMatchObject({ failed: 0, skipped: 1 });
  });

  it('un montant à fraction de centime (1,345) n’est pas arrondi sans trace : ligne non vérifiée', () => {
    const r = lire([ligne({ quantity: 1, price: 1.345, amountTTC: 1.345 })]);
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
    expect(r.controls.lines).toMatchObject({ skipped: 1, skippedIds: ['line-1'] });
  });

  it('le routage de invoiceFieldHints (purchasePrefill) range la phrase sur « items », pas sur le total', () => {
    const r = normalizeInvoiceScan(avecLigne(lecture372765(), 0, { quantity: 60, amountTTC: 13.8 })) as any;
    const phrase = r.issues.find((m: string) => m.startsWith('Ligne 1'));
    expect(phrase).toBeTruthy();
    expect(phrase.length).toBeLessThanOrEqual(250);
    const hints = invoiceFieldHints({ ...r, issues: [phrase], fieldWarnings: [], review: { status: 'checked', findings: [] } } as any);
    expect(hints.items).toBe(phrase);
    expect(hints.amountTTC).toBeUndefined();
  });
});
