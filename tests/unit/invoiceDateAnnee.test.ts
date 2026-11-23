// LT-2 (08.11.2026) : deux vrais tickets Bauhaus (doc16 : « 02.11.2026 » dans le corps, « 02.11.25 » au pied ; doc21 : 07.11) partaient dans l'exercice 2025,
// clos : le vote gardait la lecture « 2025 ». Règle posée, sans IA : (1) année à 4 chiffres > année à 2 chiffres ; (2) à défaut, la date plausible aujourd'hui
// (ni future, ni de plus de 11 mois dans le passé) ; le désaccord reste un point visible. Aucun appel Gemini : lectures simulées.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { choisirDate, normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../functions/src/invoiceVisionReview';
import { finalOfStarVote, type LectureVote } from '../../functions/src/invoiceScanVote';

const AUJOURDHUI = new Date(Date.UTC(2026, 10, 8)); // 08.11.2026
const item = { name: 'Cascade 100 g', kind: 'stock', quantity: 2, unit: 'pièces', price: 5, amountTTC: 10, stockCategory: 'Houblon', evidence: '2 × Cascade 100 g : CHF 10.00', ambiguity: '' };
const read = (date: string) => normalizeInvoiceScan({
  vendor: 'Bauhaus', date, currency: 'CHF', invoiceNumber: 'F-17', amountHT: 10, tvaRate: 0, tvaAmount: 0, amountTTC: 10, category: 'brassage', subcategory: 'Houblon', items: [item],
});
const vote = (date: string): LectureVote => ({ normalized: read(date), cause: null });
const pointDate = (r: ReturnType<typeof reconcileInvoiceVision>) => (r.result as any).points.find((p: any) => p.code === 'lectures-divergentes' && p.champ === 'date');

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-08T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('LT-2 · choisirDate : règle pure', () => {
  it('l’année à 4 chiffres l’emporte sur celle à 2 chiffres', () => {
    expect(choisirDate(['02.11.2025', '02.11.26'], '02.11.26', AUJOURDHUI)).toBe('02.11.2025');
    expect(choisirDate(['02.11.25', '02.11.2026'], '02.11.25', AUJOURDHUI)).toBe('02.11.2026');
  });
  it('à défaut, la date plausible aujourd’hui l’emporte : jamais plus de 11 mois dans le passé', () => {
    expect(choisirDate(['02.11.2026', '02.11.2025'], '02.11.2025', AUJOURDHUI)).toBe('02.11.2026');
    expect(choisirDate(['07.11.2026', '07.11.2025'], '07.11.2025', AUJOURDHUI)).toBe('07.11.2026');
  });
  it('jamais une date future quand une autre lecture est plausible', () => {
    expect(choisirDate(['02.11.2027', '02.11.2026'], '02.11.2027', AUJOURDHUI)).toBe('02.11.2026');
    expect(choisirDate(['15.12.2026', '15.12.2025'], '15.12.2026', AUJOURDHUI)).toBe('15.12.2025');
  });
  it('ne touche à rien d’autre : accord, jour ou mois différents, aucune lecture plausible', () => {
    expect(choisirDate(['02.11.2025', '02.11.2025'], '02.11.2025', AUJOURDHUI)).toBe('02.11.2025'); // une facture ancienne lue pareil reste ancienne
    expect(choisirDate(['02.11.2026', '03.11.2025'], '03.11.2025', AUJOURDHUI)).toBe('03.11.2025'); // pas qu’une affaire d’année
    expect(choisirDate(['02.11.2024', '02.11.2025'], '02.11.2024', AUJOURDHUI)).toBe('02.11.2024'); // aucune plausible : le vote garde
    expect(choisirDate(['', '02.11.2026'], '', AUJOURDHUI)).toBe(''); // rien n'est inventé
  });
});

describe('LT-2 · le vote des lectures', () => {
  it('doc16 : 2026 / 2025 → 2026 retenu, le désaccord reste un point visible', () => {
    const r = reconcileInvoiceVision([read('02.11.2026'), read('02.11.2025')]);
    expect(r.result.date).toBe('02.11.2026');
    expect(r.needsCorrection).toBe(true);
    const p = pointDate(r);
    expect(p.valeurs.map((v: any) => v.valeur)).toEqual(['02.11.2026', '02.11.2025']);
    expect(p.valeurs.map((v: any) => v.retenue)).toEqual([true, false]);
  });
  it('doc16 dans l’ordre inverse : 2025 / 2026 → 2026', () => {
    expect(reconcileInvoiceVision([read('02.11.2025'), read('02.11.2026')]).result.date).toBe('02.11.2026');
  });
  it('doc21 : 07.11.2025 / 07.11.2026 → 2026', () => {
    expect(reconcileInvoiceVision([read('07.11.2025'), read('07.11.2026')]).result.date).toBe('07.11.2026');
  });
  it('trois lectures : la majorité 2025 cède à la date plausible, l’écart reste noté', () => {
    const r = reconcileInvoiceVision([read('02.11.2026'), read('02.11.2025'), read('02.11.2025')]);
    expect(r.result.date).toBe('02.11.2026');
    expect(r.review.correctedFields).not.toContain('items');
    const p = pointDate(r);
    expect(p).toBeTruthy();
    expect(p.valeurs.map((v: any) => v.valeur)).toEqual(['02.11.2026', '02.11.2025', '02.11.2025']);
  });
  it('une année imprimée à 2 chiffres (« 02.11.25 ») cède à celle à 4 chiffres de l’autre lecture', () => {
    const r = reconcileInvoiceVision([read('02.11.25'), read('02.11.2026')]);
    expect(r.result.date).toBe('02.11.2026');
    expect((r.result as any).dateCourte).toBeUndefined();
  });
  it('une facture ancienne lue pareil par toutes les lectures garde sa date (rien d’inventé)', () => {
    const r = reconcileInvoiceVision([read('02.11.2025'), read('02.11.2025')]);
    expect(r.result.date).toBe('02.11.2025');
    expect(r.needsCorrection).toBe(false);
  });
  it('un désaccord de jour ou de mois reste au vote d’avant (première lecture gardée)', () => {
    expect(reconcileInvoiceVision([read('03.11.2025'), read('02.11.2026')]).result.date).toBe('03.11.2025');
  });
  it('la 3.8 qui tranche seule avec 2025 ne l’emporte pas sur 2026 lu ailleurs', () => {
    const final = finalOfStarVote(vote('02.11.2026'), vote('02.11.2025'), vote('02.11.2025'));
    expect(final.used).toHaveLength(3);
    expect(final.result.date).toBe('02.11.2026');
    expect(final.result.points.some((p: any) => p.code === 'lectures-divergentes' && p.champ === 'date')).toBe(true);
  });
});
