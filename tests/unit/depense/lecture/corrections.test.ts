// @vitest-environment node
// Corrections de la relecture de l1 (constats 1 à 4). Chaque test a été lancé AVANT la correction et a échoué (L13).
import { describe, expect, it } from 'vitest';
import { countPdfPages, normalizeInvoiceScan, validateInvoiceFile } from '../../../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { entete, ligne, trouve } from './aide';

const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const enPdf = (texte: string) => ({ mimeType: 'application/pdf', data: Buffer.from(texte, 'latin1').toString('base64') });

// ---------------------------------------------------------------------------------------------------------------------
// 1 — PDF : le travail est linéaire en taille d'entrée
// ---------------------------------------------------------------------------------------------------------------------
describe('relecture n° 1 — countPdfPages ne se fige pas sur une entrée pathologique', () => {
  const duree = (action: () => void) => { const t0 = performance.now(); try { action(); } catch { /* un refus est attendu */ } return performance.now() - t0; };

  it('280 Ko de « stream\\n » sans « obj » ni « endstream » : refusé en moins d’une seconde', () => {
    const octets = Buffer.from(`%PDF-1.5\n${'stream\n'.repeat(40_000)}`, 'latin1');
    expect(duree(() => countPdfPages(octets))).toBeLessThan(1000);
    expect(() => validateInvoiceFile(enPdf(octets.toString('latin1')))).toThrow();
  });

  it('1 Mo de « /Type /Pages » : refusé (on ne sait pas compter), en moins d’une seconde', () => {
    const octets = Buffer.from(`%PDF-1.4 ${'/Type /Pages '.repeat(80_000)}`, 'latin1');
    expect(duree(() => countPdfPages(octets))).toBeLessThan(1000);
    expect(() => validateInvoiceFile(enPdf(octets.toString('latin1')))).toThrow(/compter/);
  });

  it('1 Mo de « /Type /ObjStm » sans flux : refusé en moins d’une seconde', () => {
    const octets = Buffer.from(`%PDF-1.5 ${'/Type /ObjStm '.repeat(70_000)}`, 'latin1');
    expect(duree(() => countPdfPages(octets))).toBeLessThan(1000);
    expect(() => validateInvoiceFile(enPdf(octets.toString('latin1')))).toThrow(/compter/);
  });

  it('1 Mo de « << » sans « >> » autour de quelques pages : refusé ou compté, mais en moins d’une seconde', () => {
    const octets = Buffer.from(`%PDF-1.4 ${'<< '.repeat(300_000)}/Type /Pages /Count 1 /Type /Page`, 'latin1');
    expect(duree(() => countPdfPages(octets))).toBeLessThan(1000);
  });

  it('un PDF ordinaire à deux pages reste compté', () => {
    const texte = '%PDF-1.4\n1 0 obj\n<</Type/Pages/Count 2/Kids[2 0 R 3 0 R]>>\nendobj\n2 0 obj\n<</Type/Page/Parent 1 0 R>>\nendobj\n3 0 obj\n<</Type/Page/Parent 1 0 R>>\nendobj\n%%EOF';
    expect(countPdfPages(Buffer.from(texte, 'latin1'))).toEqual({ pages: 2, treeCounts: [2] });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 2 — « lignes-annoncees » ne déclenche jamais la troisième lecture
// ---------------------------------------------------------------------------------------------------------------------
describe('relecture n° 2 — lignes-annoncees n’achète pas de troisième lecture', () => {
  const annonce = () => lire(entete({ amountTTC: 1, printedLineCount: 2, items: [ligne({ price: 1, amountTTC: 1 })] }));

  it('le résultat ne porte que le point lignes-annoncees (le cas de la sonde)', () => {
    const r = annonce();
    expect(r.points.map((p: any) => p.code)).toEqual(['lignes-annoncees']);
    expect(r.controls.sum.statut).toBe('ok');
  });

  it('dans le déclencheur réel de invoiceVisionReview.ts, aucune troisième lecture n’est demandée', () => {
    const { needsCorrection, result } = reconcileInvoiceVision([annonce(), annonce()]);
    expect(trouve((result as any).points, 'lignes-annoncees')).toHaveLength(1);
    expect(needsCorrection).toBe(false);
  });

  it('la phrase ne contient aucun des mots du déclencheur, et ne se range pas sous le total de l’écran', () => {
    const phrase = annonce().issues.find((m: string) => /lignes imprimées/.test(m));
    expect(phrase).toBeTruthy();
    expect(phrase).not.toMatch(/totaux HT \+ TVA|somme des lignes|Taux TVA incohérent/);
    const hints = invoiceFieldHints({ ...annonce(), issues: [phrase], fieldWarnings: [], review: { status: 'checked', findings: [] } });
    expect(hints.amountTTC).toBeUndefined();
    expect(hints.items).toBeTruthy();
  });

  // l2 (P5, option A du pilote, 31.10) : deux lectures qui lisent la MÊME somme fausse n'achètent pas de troisième lecture (le même modèle sur
  // la même image relirait la même chose) ; le point somme-ecart pèse et le statut est « à confirmer ». Une divergence entre lectures en achète une.
  it('un vrai écart de somme lu à l’identique : le point somme-ecart pèse, statut disputed, pas de troisième lecture', () => {
    const faux = () => lire(entete({ amountTTC: 5, items: [ligne({ price: 1, amountTTC: 1 })] }));
    const { needsCorrection, result, review } = reconcileInvoiceVision([faux(), faux()]);
    expect(needsCorrection).toBe(false);
    expect(review.status).toBe('disputed');
    expect((result as any).points.find((p: any) => p.code === 'somme-ecart')).toMatchObject({ pese: true });
  });
  it('un vrai écart de somme dont une valeur diverge entre les lectures déclenche la troisième lecture', () => {
    const faux = (total: number) => lire(entete({ amountTTC: total, items: [ligne({ price: 1, amountTTC: 1 })] }));
    expect(reconcileInvoiceVision([faux(5), faux(6)]).needsCorrection).toBe(true);
  });

  it('garde : une annonce de lignes avec une somme fausse reste « lignes-perdues », sans troisième lecture', () => {
    const perte = () => lire(entete({ amountTTC: 5, printedLineCount: 2, items: [ligne({ price: 1, amountTTC: 1 })] }));
    expect(trouve(perte().points, 'lignes-perdues')).toHaveLength(1);
    expect(reconcileInvoiceVision([perte(), perte()]).needsCorrection).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 3 — port ou remise sans code de TVA, compris dans la base imprimée
// ---------------------------------------------------------------------------------------------------------------------
describe('relecture n° 3 — une ligne sans code de TVA ne fabrique pas de tva-incoherente', () => {
  const malt = (over: Record<string, unknown> = {}) => ligne({ name: 'Malt fictif', price: 100, amountTTC: 100, vatCode: 'R', ...over });
  const port = (over: Record<string, unknown> = {}) => ligne({ name: 'Port', kind: 'shipping', unit: '', price: 10, amountTTC: 10, vatCode: '', ...over });
  const remise = (over: Record<string, unknown> = {}) => ligne({ name: 'Remise', kind: 'discount', unit: '', price: -10, amountTTC: -10, vatCode: '', ...over });

  it('sonde H : Malt R 100,00 + Port sans code 10,00, base R 110,00, TVA 2,78, TTC 110,00 → aucun point', () => {
    const r = lire(entete({ amountTTC: 110, tvaAmount: 2.78, items: [malt(), port()], vat: [{ code: 'R', rate: 0.026, base: 110, amount: 2.78 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(r.controls.vat.statut).not.toBe('ecart');
    expect(r.issues.join(' ')).not.toContain('TVA imprimée incohérente');
  });

  it('sonde I : Malt R 100,00 + Remise sans code −10,00, base R 90,00, TVA 2,28, TTC 90,00 → aucun point', () => {
    const r = lire(entete({ amountTTC: 90, tvaAmount: 2.28, items: [malt(), remise()], vat: [{ code: 'R', rate: 0.026, base: 90, amount: 2.28 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(r.controls.vat.statut).not.toBe('ecart');
  });

  it('témoin : avec le même port sans code, une TVA du taux fausse reste un écart', () => {
    const r = lire(entete({ amountTTC: 110, tvaAmount: 9, items: [malt(), port()], vat: [{ code: 'R', rate: 0.026, base: 110, amount: 9 }] }));
    const [p] = trouve(r.points, 'tva-incoherente');
    expect(p).toBeTruthy();
    expect(p.details.map((d: any) => d.relation)).toContain('tva-du-taux:R');
    expect(r.controls.vat.statut).toBe('ecart');
  });

  it('témoin : avec le même port sans code, une somme des TVA fausse reste un écart', () => {
    const r = lire(entete({ amountTTC: 110, tvaAmount: 3.5, items: [malt(), port()], vat: [{ code: 'R', rate: 0.026, base: 110, amount: 2.78 }] }));
    const [p] = trouve(r.points, 'tva-incoherente');
    expect(p).toBeTruthy();
    expect(p.details.map((d: any) => d.relation)).toContain('somme-tva');
  });

  it('témoin : sans aucune ligne sans code, une base qui ne recoupe pas les lignes reste un écart', () => {
    const r = lire(entete({ amountTTC: 100, tvaAmount: 2.53, items: [malt()], vat: [{ code: 'R', rate: 0.026, base: 95, amount: 2.53 }] }));
    const [p] = trouve(r.points, 'tva-incoherente');
    expect(p).toBeTruthy();
    expect(p.details.map((d: any) => d.relation)).toContain('base-par-code:R');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 4 — ligne d'arrondi (Rundung)
// ---------------------------------------------------------------------------------------------------------------------
describe('relecture n° 4 — la ligne d’arrondi est tolérée dans somme-bases', () => {
  const malt = ligne({ name: 'Malt fictif', price: 100.02, amountTTC: 100.02, vatCode: 'R' });
  const rundung = (over: Record<string, unknown> = {}) => ligne({ name: 'Rundung', kind: 'discount', quantity: null, unit: '', price: null, amountTTC: -0.02, vatCode: '', ...over });
  const facture = (base: number, amountTTC = 100, items: unknown[] = [malt, rundung()]) =>
    lire(entete({ amountTTC, tvaAmount: 2.53, items, vat: [{ code: 'R', rate: 0.026, base, amount: 2.53 }] }));

  it('sonde C : la somme des lignes est ok, et la base imprimée avant arrondi (100,02) ne donne pas de point', () => {
    const r = facture(100.02);
    expect(r.controls.sum.statut).toBe('ok');
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
  });

  it('l’autre sens : la base imprimée après arrondi (100,00) ne donne pas de point non plus', () => {
    const r = facture(100);
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
  });

  it('même chose avec « Arrondi » et un arrondi positif', () => {
    const r = lire(entete({ amountTTC: 100, tvaAmount: 2.53, items: [ligne({ name: 'Malt', price: 99.98, amountTTC: 99.98, vatCode: 'R' }), rundung({ name: 'Arrondi', kind: 'other', amountTTC: 0.02 })], vat: [{ code: 'R', rate: 0.026, base: 99.98, amount: 2.53 }] }));
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
  });

  it('témoin : un écart plus grand que l’arrondi reste un écart (base 100,50 pour un TTC de 100,00)', () => {
    const [p] = trouve(facture(100.5).points, 'tva-incoherente');
    expect(p).toBeTruthy();
    expect(p.details.map((d: any) => d.relation)).toContain('somme-bases');
  });

  it('témoin : une ligne « Rundung » de 0,50 n’est pas un arrondi (plus de 5 centimes) : l’écart de 0,02 reste un écart', () => {
    const r = facture(100.02, 100, [ligne({ name: 'Malt fictif', price: 100.5, amountTTC: 100.5, vatCode: 'R' }), rundung({ amountTTC: -0.5 })]);
    expect(trouve(r.points, 'tva-incoherente')).toHaveLength(1);
  });
});
