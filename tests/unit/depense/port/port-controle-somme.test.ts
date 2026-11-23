// Voie port-total, P2 (D249, D258) : le contrôle « somme des lignes = total imprimé » compte le port, à la lecture et au recalcul client.
// Épingles : ces tests passent sur HEAD. Données fictives (aide.ts de la lecture, importé sans le modifier) ; Gemini jamais appelé.
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { recomputeInvoicePoints } from '../../../../src/domain/finance/invoicePoints';
import { entete, ligne, trouve } from '../lecture/aide';

const stock1 = () => ligne({ name: 'Malt fictif', quantity: 1, price: 10, amountTTC: 10 });
const stock2 = () => ligne({ name: 'Houblon fictif', quantity: 1, price: 20, amountTTC: 20 });
const port = (over: Record<string, unknown> = {}) => ligne({ name: 'Port', kind: 'shipping', quantity: null, unit: '', price: null, amountTTC: 5, ...over });
const lire = (items: any[]) => normalizeInvoiceScan(entete({ items, amountTTC: 35 })) as any;

describe('P2 n° 1 — la lecture compte le port dans la somme', () => {
  it('deux lignes de stock (10,00 et 20,00) + port 5,00 = 35,00 : somme ok', () => {
    const r = lire([stock1(), stock2(), port()]);
    expect(r.controls.sum).toEqual({ statut: 'ok', base: 'TTC' });
    expect(trouve(r.points, 'somme-ecart')).toEqual([]);
    expect(trouve(r.points, 'somme-incomplete')).toEqual([]);
  });
});

describe('P2 n° 2 — sans la ligne du port, la somme accuse l’écart du port', () => {
  it('c’est pourquoi le port reste une ligne : écart de 5,00', () => {
    const r = lire([stock1(), stock2()]);
    expect(r.controls.sum.statut).toBe('ecart');
    const [p] = trouve(r.points, 'somme-ecart');
    expect(p).toMatchObject({ lu: 3500, calcule: 3000 });
  });
});

describe('P2 n° 3 — le recalcul client compte le port', () => {
  it('mêmes trois lignes (ids `line-n`) : somme ok, aucun point de somme', () => {
    const items = [
      { id: 'line-1', name: 'Malt fictif', kind: 'stock', quantity: 1, unit: 'Kg', price: 10, amountTTC: 10 },
      { id: 'line-2', name: 'Houblon fictif', kind: 'stock', quantity: 1, unit: 'Kg', price: 20, amountTTC: 20 },
      { id: 'line-3', name: 'Port', kind: 'shipping', quantity: null, unit: '', price: null, amountTTC: 5 },
    ];
    const r = recomputeInvoicePoints({ items, amountTTC: 35, amountHT: null, tvaAmount: null, linesLost: 0 });
    expect(r.controls.sum).toEqual({ statut: 'ok', base: 'TTC' });
    expect(r.points.filter(p => p.code === 'somme-ecart' || p.code === 'somme-incomplete')).toEqual([]);
  });
});

describe('P2 n° 4 — un port sans montant lu n’est jamais compté 0', () => {
  it('amountTTC absent : somme incomplète, pas de somme fausse', () => {
    const r = lire([stock1(), stock2(), port({ amountTTC: null })]);
    expect(r.controls.sum.statut).toBe('incomplet');
    expect(trouve(r.points, 'somme-incomplete')).toHaveLength(1);
  });
});
