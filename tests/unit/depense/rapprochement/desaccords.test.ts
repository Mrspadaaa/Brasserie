// U1 — chaque doute est typé et garde ses valeurs concurrentes ; la première lecture n'est plus retenue en silence. P4 et P6.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { avec, lectureA, lectureB, lire, malt, propre, simple } from './aide';

const points = (readings: any[]) => (reconcileInvoiceVision(readings.map(lire)).result as any).points as any[];

describe('U1 — les valeurs concurrentes sont gardées', () => {
  it('tvaAmount 2,80 / 4,15 → un point de désaccord qui porte les deux valeurs', () => {
    const p = points([lectureA(), lectureB()]).find(x => x.code === 'lectures-divergentes' && x.champ === 'tvaAmount');
    expect(p).toMatchObject({ source: 'désaccord', pese: true, ligne: null, lu: null, calcule: null, ecart: null, origine: 'lecture' });
    expect(p.valeurs).toEqual([{ lecture: 1, valeur: 2.8, retenue: true }, { lecture: 2, valeur: 4.15, retenue: false }]);
    expect(p.cle).toBe('lectures-divergentes:-:tvaAmount');
    expect(p.message).toMatch(/Montant TVA : lectures divergentes \(2,80 \/ 4,15\)/);
  });

  it('trois valeurs différentes → trois entrées, la première lecture reste retenue', () => {
    const r = reconcileInvoiceVision([propre({ tvaAmount: 1 }), propre({ tvaAmount: 2 }), propre({ tvaAmount: 3 })].map(lire));
    const p = (r.result as any).points.find((x: any) => x.champ === 'tvaAmount');
    expect(p.valeurs.map((v: any) => [v.lecture, v.valeur, v.retenue])).toEqual([[1, 1, true], [2, 2, false], [3, 3, false]]);
    expect(r.result.tvaAmount).toBe(1);
  });

  it("une valeur absente est null, jamais 0 ; une chaîne vide devient null", () => {
    const a = points([propre({ tvaAmount: null }), propre({ tvaAmount: 1 })]).find(x => x.champ === 'tvaAmount');
    expect(a.valeurs.map((v: any) => v.valeur)).toEqual([null, 1]);
    const b = points([propre({ invoiceNumber: '' }), propre({ invoiceNumber: 'F-9' })]).find(x => x.champ === 'invoiceNumber');
    expect(b.valeurs.map((v: any) => v.valeur)).toEqual([null, 'F-9']);
  });

  it('gabarit des phrases : en-tête et ligne', () => {
    const e = reconcileInvoiceVision([lire(propre({ amountTTC: 1 })), lire(propre({ amountTTC: 2 }))]);
    expect(e.review.findings.join(' ')).toContain('Montant TTC : lectures divergentes');
    const l = reconcileInvoiceVision([lire(simple({}, [malt({ quantity: 2 })])), lire(simple({}, [malt({ quantity: 3 })]))]);
    expect(l.review.findings.join(' ')).toContain('Malt fictif — quantité : lectures divergentes');
    const p = (l.result as any).points.find((x: any) => x.code === 'lectures-divergentes' && x.champs[0] === 'items.1.quantity');
    expect(p).toMatchObject({ champ: 'items', ligne: 1, enjeu: 'argent', unite: 'nombre', cle: 'lectures-divergentes:1:quantity' });
  });

  it("prix divergent où seule la lecture 2 tient quantité × prix : la valeur retenue est celle de la lecture 2 (recoupée)", () => {
    const r = reconcileInvoiceVision([lire(simple({}, [malt({ price: 2.4 })])), lire(simple())]);
    expect(r.result.items[0].price).toBe(2.5);
    const p = (r.result as any).points.find((x: any) => x.champs?.[0] === 'items.1.price');
    expect(p.valeurs).toEqual([{ lecture: 1, valeur: 2.4, retenue: false }, { lecture: 2, valeur: 2.5, retenue: true, motif: 'recoupée' }]);
    expect((r.result as any).points.some((x: any) => x.code === 'ligne-montant')).toBe(false);
  });

  it('relecture point 3 : une cellule qui a une majorité n\'est jamais écrasée par la lecture « recoupée », et les points disent la valeur réellement retenue', () => {
    // L1 12 × 5 = 60 ; L2 10 × 6 = 50 ; L3 10 × 7 = 50 : quantité (10) et montant (50) ont une majorité, le prix n'en a pas
    const ligneTrois = (quantity: number, price: number, amountTTC: number) => simple({ amountTTC: 50 }, [malt({ quantity, price, amountTTC })]);
    const r = reconcileInvoiceVision([lire(ligneTrois(12, 5, 60)), lire(ligneTrois(10, 6, 50)), lire(ligneTrois(10, 7, 50))]);
    const item = r.result.items[0] as any;
    expect(item.quantity).toBe(10);
    expect(item.amountTTC).toBe(50);
    const pts = (r.result as any).points.filter((p: any) => p.code === 'lectures-divergentes');
    for (const cellule of ['quantity', 'price', 'amountTTC']) {
      const p = pts.find((x: any) => x.champs[0] === `items.1.${cellule}`);
      expect(p, cellule).toBeTruthy();
      expect(p.valeurs.find((v: any) => v.retenue).valeur, `retenue ${cellule}`).toBe(item[cellule]);
    }
  });

  it('nom, unité, taille, catégorie de stock en désaccord : enjeu stock et pas de liaison automatique', () => {
    const p = points([simple({}, [malt({ stockCategory: 'Malt' })]), simple({}, [malt({ stockCategory: 'Houblon' })])]).find(x => x.champs?.[0] === 'items.1.stockCategory');
    expect(p).toMatchObject({ enjeu: 'stock', bloqueLiaison: true, unite: 'texte', luTexte: 'Malt' });
    const n = points([simple({}, [malt({ name: 'Malt Pils' })]), simple({}, [malt({ name: 'Malt Pale' })])]).find(x => x.champs?.[0] === 'items.1.name');
    expect(n).toMatchObject({ enjeu: 'stock', bloqueLiaison: true });
  });

  it('une ligne manquante : 22 lignes votées, la 23e nommée dans lignes-non-rapprochees', () => {
    const a = lectureA();
    const b = { ...avec(a, 2, { quantity: 2 }), items: avec(a, 2, { quantity: 2 }).items.slice(1) };
    const pts = points([a, b]);
    expect(pts.find(x => x.champs?.[0] === 'items.3.quantity')).toMatchObject({ code: 'lectures-divergentes', pese: true });
    const orphelin = pts.find(x => x.code === 'lignes-non-rapprochees');
    expect(orphelin).toMatchObject({ pese: true, source: 'désaccord', unite: 'lignes', lu: 1 });
    expect(orphelin.message).toContain('rapprochées');
    expect(JSON.stringify(orphelin.valeurs)).toContain('Maris Otter');
  });

  it("N3 : la ligne orpheline de la seule lecture minoritaire ne pèse pas (deux lectures sur trois s'accordent)", () => {
    const bonne = () => simple();
    const minoritaire = simple({}, [malt({ name: 'Cascadc 100 g', reference: '', quantity: 20, price: 0.25 })]);
    const r = reconcileInvoiceVision([lire(minoritaire), lire(bonne()), lire(bonne())]);
    expect(r.review.status).toBe('corrected');
    expect(r.review.correctedFields).toContain('items');
    const pts = (r.result as any).points;
    expect(pts.some((p: any) => p.code === 'lignes-non-rapprochees')).toBe(false);
    expect(pts.find((p: any) => p.code === 'lectures-divergentes' && p.champ === 'items')).toMatchObject({ pese: false, source: 'désaccord' });
    expect(r.review.findings).toEqual([]);
  });

  it('les points sont du JSON pur et les lectures ne sont pas mutées', () => {
    const a = lire(lectureA()), b = lire(lectureB());
    const avant = JSON.stringify([a, b]);
    const r = reconcileInvoiceVision([a, b]);
    expect(JSON.stringify([a, b])).toBe(avant);
    const pts = (r.result as any).points;
    expect(JSON.parse(JSON.stringify(pts))).toStrictEqual(pts);
  });
});
