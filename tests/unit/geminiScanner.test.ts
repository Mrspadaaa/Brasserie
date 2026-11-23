// R1 — le client garde les points typés, les contrôles, la TVA par taux et le type retenu (voie l2-rapprochement). Gemini n'est jamais appelé.
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
import { GeminiScannerService } from '../../src/services/geminiScanner';
import { reconcileInvoiceVision } from '../../functions/src/invoiceVisionReview';
import { lectureA, lectureB, lire } from './depense/rapprochement/aide';

const serveur = () => JSON.parse(JSON.stringify(reconcileInvoiceVision([lire(lectureA()), lire(lectureB())]).result));

describe('R1 — normalizeResult ne jette plus ce que le serveur a calculé', () => {
  it('un résultat serveur complet traverse sans perte', () => {
    const brut = serveur();
    const r = GeminiScannerService.normalizeResult(brut) as any;
    expect(r.points).toEqual(brut.points);
    expect(r.points.find((p: any) => p.code === 'lectures-divergentes').valeurs).toHaveLength(2);
    expect(r.controls).toEqual(brut.controls);
    expect(r.vat).toEqual(brut.vat);
    expect(r.remarques).toEqual(brut.remarques);
    expect(r).toMatchObject({ proForma: true, documentType: 'invoice', documentTypeRetenu: 'invoice', linesLost: 0, printedLineCount: brut.printedLineCount, rejets: [] });
    expect(r.items[0]).toMatchObject({ vatCode: 'R', alphaPct: null });
    expect(r.items.find((i: any) => i.name.startsWith('Target'))).toMatchObject({ alphaPct: 11.3, alphaPctLu: 11.3 });
  });

  it('les unités restent telles qu\'imprimées (Kg, g, Stk) : aucune conversion', () => {
    const r = GeminiScannerService.normalizeResult(serveur()) as any;
    expect(new Set(r.items.map((i: any) => i.unit))).toEqual(new Set(['Kg', 'g', 'Stk']));
  });

  it('un ancien résultat sort sans aucune des nouvelles clés', () => {
    const r = GeminiScannerService.normalizeResult({ vendor: 'X', items: [{ name: 'A', kind: 'stock', quantity: 1, unit: 'kg', amountTTC: 1 }], review: { status: 'checked', findings: [], readers: 2, correctedFields: [] } }) as any;
    for (const cle of ['points', 'controls', 'vat', 'proForma', 'documentTypeRetenu', 'documentTypeLu', 'linesLost', 'printedLineCount', 'rejets', 'remarques']) expect(r, cle).not.toHaveProperty(cle);
    expect(r.items[0]).not.toHaveProperty('vatCode');
    expect(r.review).toEqual({ status: 'checked', findings: [], readers: 2, correctedFields: [] });
  });

  it('un point mal formé est assaini : texte coupé, nombre non fini → null, « » → null, valeurs bornées', () => {
    const long = 'x'.repeat(400);
    const r = GeminiScannerService.normalizeResult({ items: [], points: [
      { code: 'lectures-divergentes', cle: 'k', message: long, champ: 'tvaAmount', champs: ['tvaAmount'], ligne: null, lu: Infinity, calcule: null, ecart: null, unite: 'nombre', gravite: 'ecart', origine: 'lecture', enjeu: 'info', bloque: false, regle: 'r',
        valeurs: [{ lecture: 1, valeur: '', retenue: true }, { lecture: 2, valeur: 4, retenue: false }, { lecture: 3, valeur: null, retenue: false }, { lecture: 4, valeur: 9, retenue: false }] },
      { code: 'code-futur', cle: 'f', message: 'ok', champ: 'items', champs: [], ligne: 2, lu: 1, calcule: 2, ecart: -1, unite: 'texte', gravite: 'ecart', origine: 'controle', enjeu: 'info', bloque: false, regle: '' },
      'nimporte quoi', null,
    ] }) as any;
    expect(r.points).toHaveLength(2);
    expect(r.points[0].message.length).toBeLessThanOrEqual(250);
    expect(r.points[0].lu).toBeNull();
    // relecture l2, point 1 : les valeurs ne sont plus coupées à 3 (un point par ligne sans vis-à-vis en porte autant)
    expect(r.points[0].valeurs).toHaveLength(4);
    expect(r.points[0].valeurs[0].valeur).toBeNull();
    expect(r.points[1].code).toBe('code-futur');
  });

  it('dix lignes non rapprochées (dix valeurs) traversent intactes', () => {
    const a = lectureA(), b = { ...lectureA(), items: lectureA().items.slice(10) };
    const brut = JSON.parse(JSON.stringify(reconcileInvoiceVision([lire(a), lire(b)]).result));
    const point = brut.points.find((p: any) => p.code === 'lignes-non-rapprochees');
    expect(point.valeurs).toHaveLength(10);
    const r = GeminiScannerService.normalizeResult(brut) as any;
    expect(r.points.find((p: any) => p.code === 'lignes-non-rapprochees').valeurs).toEqual(point.valeurs);
    expect(r.points.find((p: any) => p.code === 'lignes-non-rapprochees').lignes).toEqual(point.lignes);
  });

  it('les points qui pèsent passent d\'abord ; au-delà de la limite, un point qui pèse perdu rend la lecture « à confirmer » (point 6)', () => {
    const muet = (n: number) => ({ code: 'lectures-divergentes', cle: `m:${n}`, message: 'm', champ: 'items', champs: [], ligne: null, lu: null, calcule: null, ecart: null, unite: 'texte', gravite: 'ecart', origine: 'lecture', enjeu: 'info', bloque: false, regle: '', pese: false });
    const lourd = { ...muet(0), code: 'somme-ecart', cle: 'lourd', pese: true };
    const points = [...Array.from({ length: 70 }, (_, i) => muet(i + 1)), lourd];
    const r = GeminiScannerService.normalizeResult({ items: [], points, review: { status: 'checked', findings: [], readers: 2, correctedFields: [] } }) as any;
    expect(r.points.length).toBeLessThanOrEqual(60);
    expect(r.points.some((p: any) => p.cle === 'lourd')).toBe(true);
    // coupure qui perd un point lourd : le statut ne peut plus être « vérifié »
    const lourds = Array.from({ length: 70 }, (_, i) => ({ ...muet(i), code: 'somme-ecart', cle: `l:${i}`, pese: true }));
    const trop = GeminiScannerService.normalizeResult({ items: [], points: lourds, review: { status: 'checked', findings: [], readers: 2, correctedFields: [] } }) as any;
    expect(trop.points).toHaveLength(60);
    expect(trop.review.status).toBe('disputed');
  });

  it('un documentTypeRetenu inconnu retombe sur documentType', () => {
    const r = GeminiScannerService.normalizeResult({ items: [], documentType: 'quote', documentTypeRetenu: 'pizza' }) as any;
    expect(r.documentTypeRetenu).toBe('quote');
  });
});
