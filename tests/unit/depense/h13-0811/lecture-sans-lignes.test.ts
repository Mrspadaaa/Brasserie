// @vitest-environment jsdom
/**
 * Lecture en ligne du 08.11 (LO-3, gravité G) : doc12, commande d'un fournisseur de brasserie en 3 captures d'écran (25 lignes d'articles, TVA imprimée « Tax 2,6 % 1,00 » + « 8,1 % 11,25 », total 203,95).
 * L'app a rendu une seule ligne (le fournisseur, 203,95, quantité « ? ») et une TVA « — », sans aucune alerte.
 *
 * Ce que le rejeu hors ligne a établi (sorties réelles du banc k7, variante Csv8, 3 lectures de doc12, jamais d'appel Gemini) :
 *  - le banc lit 23 à 24 lignes et le bloc TVA : la même lecture, passée par la chaîne du serveur (`lireCsv8`) puis par celle de l'écran (`normalizeResult`, `brouillonDeLecture`, `appliquerFinale`),
 *    pose 24 lignes et une TVA de 12,25 (premier test : ni le serveur, ni la fusion, ni l'écran ne perdent les lignes) ;
 *  - ce que l'app a reçu n'avait donc ni lignes ni TVA, mais l'en-tête (fournisseur, date, n° de commande, total) : c'est exactement ce que porte la PREMIÈRE capture seule (l'en-tête et le total de la commande ;
 *    le tableau des articles et le bloc de TVA sont dans les deux suivantes) ;
 *  - cette lecture d'en-tête seul sortait « checked », sans point ni phrase : un total sans aucune ligne se présentait comme une lecture complète. C'est le défaut corrigé ici : une lecture sans ligne
 *    mais avec un total imprimé dit « aucune ligne lue » (point `lignes-absentes`, la lecture reste à confirmer).
 * La lecture complète est une vraie sortie du banc ANONYMISÉE (fournisseur et n° de commande fictifs ; articles, quantités, montants, taux inchangés) : ./doc12.json. L'en-tête seul s'en déduit (lignes et TVA retirées).
 * Aucune donnée personnelle dans Git. Aucun appel à Gemini.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('firebase/functions', () => ({ httpsCallable: () => vi.fn() }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));
import doc12 from './doc12.json';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { lireCsv8 } from '../../../../functions/src/invoiceScanVote';
import { GeminiScannerService } from '../../../../src/services/geminiScanner';
import { brouillonDeLecture } from '../../../../src/ui/depense/finale';
import { ciblesDuPoint } from '../../../../src/ui/depense/confiance';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';

const copie = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const ligneVide = () => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' }) as any;
const vide = () => ({ submissionId: 'S1', date: '08.11.2026', vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: '08.11.2026', dueDate: '' }) as any;

/** Ce que Gemini rend d'une SEULE capture d'en-tête : fournisseur, date, n° de commande, total ; ni tableau d'articles, ni bloc de TVA. */
const enteteSeul = (plus: Record<string, unknown> = {}): any => ({
  vendor: doc12.vendor, documentType: 'invoice', paymentEvidence: 'paid', fieldWarnings: [], date: doc12.date, currency: 'CHF', invoiceNumber: '', orderNumber: doc12.orderNumber, proForma: false,
  vat: [], printedLineCount: null, amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: doc12.amountTTC, category: 'brassage', description: '', items: [], ...plus,
});
const codes = (r: any): string[] => (r.points ?? []).map((p: any) => p.code);
const deuxLectures = (lue: () => any) => lireCsv8({ readLite: async () => normalizeInvoiceScan(lue()), readStrong: async () => normalizeInvoiceScan(lue()), causeOf: () => null, deadlineReached: () => false });

describe('doc12 : la lecture complète (vraie sortie du banc) arrive entière à l’écran', () => {
  it('24 lignes, TVA 12,25, total 203,95 : le serveur et l’écran ne perdent ni lignes ni TVA', () => {
    const r = GeminiScannerService.normalizeResult(copie(doc12));
    const { draft } = brouillonDeLecture(vide(), r, { stockItems: [], today: '08.11.2026', ligneVide });
    expect(draft.lines.length).toBe(24);
    expect(draft.sourceVatAmount).toBe(12.25);
    expect(draft.amount).toBe(203.95);
    expect(codes(r)).not.toContain('lignes-absentes');
  });
});

describe('doc12 : l’en-tête seul (une capture sur trois) n’est jamais présenté comme une lecture complète', () => {
  it('un total imprimé et aucune ligne : le point « aucune ligne lue » existe, il pèse, il ne bloque pas', () => {
    const lu = normalizeInvoiceScan(enteteSeul());
    const p = lu.points.find(x => x.code === 'lignes-absentes');
    expect(p).toBeTruthy();
    expect(p).toMatchObject({ champ: 'items', ligne: null, gravite: 'inverifiable', enjeu: 'argent', bloque: false });
    expect(p!.message).toMatch(/aucune ligne/i);
    expect(lu.issues.some(m => /aucune ligne/i.test(m))).toBe(true);
  });
  it('le final de deux lectures concordantes est « à confirmer » (disputed), plus « checked »', async () => {
    const final = await deuxLectures(() => enteteSeul());
    expect(final.items).toHaveLength(0);
    expect(final.review.status).toBe('disputed');
    expect(final.review.findings.some((m: string) => /aucune ligne/i.test(m))).toBe(true);
    expect(codes(final)).toContain('lignes-absentes');
  });
  it('l’écran le dit : un indice sur les lignes, et le point vise la liste des lignes (jamais le total)', () => {
    const r = GeminiScannerService.normalizeResult(normalizeInvoiceScan(enteteSeul()));
    expect(invoiceFieldHints(r).items).toMatch(/aucune ligne/i);
    const cibles = ciblesDuPoint(r.points!.find(p => p.code === 'lignes-absentes')!);
    expect(cibles.map(c => c.champ)).toEqual(['lignes']);
  });
  it('les lignes que le modèle annonce déjà (printedLineCount) gardent leur point, sans doublon', () => {
    const lu = normalizeInvoiceScan(enteteSeul({ printedLineCount: 25 }));
    expect(codes(lu)).toContain('lignes-perdues');
    expect(codes(lu)).not.toContain('lignes-absentes');
  });
  it('sans total imprimé, c’est « total absent » qui parle : pas de point de lignes en plus', () => {
    expect(codes(normalizeInvoiceScan(enteteSeul({ amountTTC: null })))).not.toContain('lignes-absentes');
  });
  it('une lecture qui porte des lignes n’a jamais ce point', () => {
    expect(codes(normalizeInvoiceScan(copie(doc12)))).not.toContain('lignes-absentes');
  });
});
