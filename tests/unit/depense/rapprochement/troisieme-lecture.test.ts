// LE1 — la troisième lecture ne part que sur une vraie divergence (P4, P5). La mesure avant/après est le jeu `corpus` (20 paires).
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { corpus, lectureA, lire, malt, propre, simple } from './aide';

const part = (a: any, b: any) => reconcileInvoiceVision([lire(a), lire(b)]).needsCorrection;
const fermenteur = (quantity: number, amountTTC: number) => malt({ name: 'Fermenteur', reference: '', quantity, price: amountTTC / quantity, amountTTC });

describe('LE1 — le jeu de 20 paires simulées', () => {
  it.each(corpus())('%s', (_nom, a, b, attendu) => { expect(part(a, b)).toBe(attendu); });
  it('6 troisièmes lectures sur 20 après l2 (15 sur 20 avant, mesuré sur HEAD)', () => {
    const departs = corpus().filter(([, a, b]) => part(a, b)).length;
    expect(departs).toBe(6);
  });
});

describe('LE1 — champs qui ne déclenchent pas', () => {
  it('deux lectures qui ne diffèrent que par stockCategory : needsCorrection=false', () => {
    expect(part(simple({}, [malt({ stockCategory: 'Malt' })]), simple({}, [malt({ stockCategory: 'Houblon' })]))).toBe(false);
  });
  it.each([['variant', '30 L', '50 L'], ['vatCode', 'R', 'N'], ['price', 2.5, 2.4]])('%s seul', (champ, x, y) => {
    expect(part(simple({}, [malt({ [champ]: x })]), simple({}, [malt({ [champ]: y })]))).toBe(false);
  });
  it('tvaAmount seul, tvaRate seul, vat[] seul', () => {
    expect(part(simple({ tvaAmount: 1 }), simple({ tvaAmount: 2 }))).toBe(false);
    expect(part(simple({ tvaRate: 0.081 }), simple({ tvaRate: 0.026 }))).toBe(false);
    const rangee = (amount: number) => ({ vat: [{ code: 'R', rate: 0.026, base: 5, amount }] });
    expect(part(simple(rangee(0.13)), simple(rangee(0.12)))).toBe(false);
  });
  it('le nom : une coquille ou les mêmes mots dans un autre ordre ne déclenchent pas', () => {
    expect(part(simple({}, [malt({ name: 'Pilsner Malz' })]), simple({}, [malt({ name: 'Pilsner Malt' })]))).toBe(false);
    expect(part(simple({}, [malt({ name: 'Malt Pils fictif' })]), simple({}, [malt({ name: 'Pils Malt fictif' })]))).toBe(false);
  });
  it('sans référence : mêmes chiffres, ancre unique → les noms différents se rapprochent sans troisième lecture', () => {
    expect(part(simple({}, [malt({ reference: '', name: 'Pils Malz' })]), simple({}, [malt({ reference: '', name: 'Pils Malt' })]))).toBe(false);
  });
  it('trois lectures : jamais de quatrième', () => {
    expect(reconcileInvoiceVision([simple(), simple({ amountTTC: 6 }), simple({ amountTTC: 7 })].map(lire)).needsCorrection).toBe(false);
  });
  it('tva-incoherente, lignes-perdues, lignes-annoncees, prix par 100 g lus à l\'identique', () => {
    expect(part(lectureA(), lectureA())).toBe(false);
    expect(part(propre({ amountTTC: 5, printedLineCount: 2 }), propre({ amountTTC: 5, printedLineCount: 2 }))).toBe(false);
    expect(part(propre({ printedLineCount: 2 }), propre({ printedLineCount: 2 }))).toBe(false);
    const lot = () => propre({ amountTTC: 20, items: [{ ...malt(), quantity: 250, unit: 'g', price: 8, amountTTC: 20 }] });
    expect(part(lot(), lot())).toBe(false);
  });
});

describe('LE1 — champs qui déclenchent', () => {
  it.each([['vendor', 'Autre SA'], ['date', '10.09.2026'], ['currency', 'EUR'], ['invoiceNumber', 'F-71'], ['amountTTC', 11], ['amountHT', 9], ['category', 'materiel']])('en-tête : %s', (champ, valeur) => {
    expect(part(simple(), simple({ [champ]: valeur }))).toBe(true);
  });
  it.each([['quantity', 3], ['unit', 'g'], ['amountTTC', 6], ['kind', 'equipment'], ['reference', 'MA9']])('ligne : %s', (champ, valeur) => {
    expect(part(simple(), simple({}, [malt({ [champ]: valeur })]))).toBe(true);
  });
  it('une ligne manquante ou en plus', () => {
    expect(part(simple({}, [malt(), malt({ name: 'Autre', reference: 'MA2' })]), simple())).toBe(true);
  });
  it('un autre mot (pas une coquille) sur une ligne rapprochée par la référence', () => {
    expect(part(simple({}, [malt({ name: 'Cascade 5.5%' })]), simple({}, [malt({ name: 'Hallertau 4.0%' })]))).toBe(true);
  });
  it("écart ligne-montant dont le prix diverge et que la lecture retenue ne tient pas", () => {
    expect(part(simple({}, [malt({ price: 2.4 })]), simple({}, [malt({ price: 2.6 })]))).toBe(true);
  });
  it("une ambiguïté d'une seule lecture", () => {
    expect(part(simple(), simple({}, [malt({ ambiguity: 'Illisible.' })]))).toBe(true);
  });
});

describe('P4 — jamais de rapprochement par la seule position', () => {
  it('deux « Fermenteur » aux quantités échangées : non rapprochés, 3e lecture, phrase « rapprochées »', () => {
    const a = simple({ amountTTC: 550 }, [fermenteur(1, 500), fermenteur(2, 50)]);
    const b = simple({ amountTTC: 550 }, [fermenteur(2, 500), fermenteur(1, 50)]);
    const r = reconcileInvoiceVision([lire(a), lire(b)]);
    expect(r.needsCorrection).toBe(true);
    expect(r.review.findings.join(' ')).toContain('rapprochées');
    expect((r.result as any).points.some((p: any) => p.code === 'lignes-non-rapprochees')).toBe(true);
  });
  it('cinq lignes identiques sur les cinq champs se rapprochent dans l\'ordre', () => {
    const cinq = () => simple({ amountTTC: 5 }, Array.from({ length: 5 }, () => malt({ name: 'Zuschlag Schrotung', quantity: 1, price: 1, amountTTC: 1 })));
    const r = reconcileInvoiceVision([lire(cinq()), lire(cinq())]);
    expect(r.needsCorrection).toBe(false);
    expect(r.review.status).toBe('checked');
  });
});
