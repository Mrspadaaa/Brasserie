import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  BUDGET_CAP_CHF, Budget, BudgetStop, DEFAULT_PASS_CAP_CHF, FAULT_PLAN, FULL_VOTE_GROUPS, GROUP_OF, LITE_MODEL, STRONG_MODEL, VARIANTS, ZOOM_ID, addWasted, callSpec, estimateBench, foldZoom,
  mergeReadings, parseArgs, parseReadResponse, readingFromResponse, reservationMicro, runBench, spentInJournal, syntheticResponse, thirdCallDuplicates, buildReadBody,
  type BenchCase, type Final, type ReadMeta, type Reading, type Transport
} from '../../scripts/banc-lecture-facture';
import { judgeResult, renderDurations, judgeBench, variantIds } from '../../scripts/banc-lecture-facture-juger';
import {
  OutilManquant, PDF_OPEN_OPTIONS, makePdfjsRenderer, bandNote, dedupeOverlap, estimateBandCount, imageSize, inkRows, inkedCuts, isTall, loadJimp, mergeDecoded, pageNote, planBands, type Band, type Bander, type Bitmap
} from '../../scripts/banc-lecture-bandes';
import { boxToPixels, parseAmountText, parseBox, parseZoomValue, patchDecoded, zoomTargets, type Cropper } from '../../scripts/banc-lecture-zoom';
import { QR_PDF_OPEN_OPTIONS, guardWithQr, makePdfRenderer, qrContradictions, qrOfTexts, replayQr, withProposals, zxingSource, type PdfjsLike } from '../../scripts/banc-lecture-qr';
import { parseSwissQr } from '../../src/services/qrFacture';

// ---------------------------------------------------------------------------------------------------------------------
// Données fabriquées : aucune valeur d'un vrai document
// ---------------------------------------------------------------------------------------------------------------------
const pdfOf = (pages: number) => ({ mimeType: 'application/pdf', data: Buffer.from(`%PDF-1.4\n<< /Type /Pages /Count ${pages} >>\n${'<< /Type /Page >>\n'.repeat(pages)}`).toString('base64') });
const img = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const item = (name: string, amount: number, extra: Record<string, unknown> = {}) => ({ name, kind: 'stock', quantity: 1, unit: 'pièce', price: amount, amountTTC: amount, ...extra });
const header = { vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', documentType: 'invoice', paymentEvidence: 'unknown' };
const totals = { amountHT: 60, tvaAmount: 0, amountTTC: 60, tvaRate: null };
/** Une facture de trois lignes (10, 20, 30) au format de production. */
const whole = (extra: Record<string, unknown> = {}) => ({ ...header, ...totals, items: [item('Article un', 10), item('Article deux', 20), item('Article trois', 30)], ...extra });
const answer = (data: any, finishReason = 'STOP', usage = { promptTokenCount: 2000, candidatesTokenCount: 800, thoughtsTokenCount: 0, totalTokenCount: 2800 }) =>
  ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: usage });
const meta = (lecture: 1 | 2 | 3, variant = 'Pv', extra: Partial<ReadMeta> = {}): ReadMeta => ({ id: `${variant}${lecture}`, doc: 'tdoc', tirage: 1, variant, lecture, model: LITE_MODEL, ...extra });
const truthCase = (id = 'tdoc', mimeType = 'application/pdf'): BenchCase => ({ id, file: 'inexistant', mimeType, expected: { vendor: 'fournisseur', date: '09.09.2026', currency: 'CHF', invoiceNumber: ['F-42'], amountTTC: 60,
  items: [{ name: 'article un', amountTTC: 10 }, { name: 'article deux', amountTTC: 20 }, { name: 'article trois', amountTTC: 30 }] } });

let work: string;
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 'k5-test-')); });
afterEach(() => { vi.unstubAllGlobals(); rmSync(work, { recursive: true, force: true }); });
const base = (extra: Record<string, unknown> = {}) => ({ mode: 'payant' as const, repeat: 1, budgetChf: BUDGET_CAP_CHF, faults: false, out: path.join(work, 'sortie'), ...extra });
const deps = (transport: Transport, extra: Record<string, unknown> = {}) =>
  ({ plan: [], readKey: () => 'k', optIn: () => {}, transport, journalPath: path.join(work, 'journal.md'), log: () => {}, ...extra });

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — Csv8, Avl : les réglages', () => {
  it('Csv8 lit à 8 192 jetons de sortie, Avl avec l’outil d’exécution de code ; les deux sur Flash-Lite, la 3ᵉ lecture est la 3.8 de production', () => {
    expect(callSpec('Csv8', 1)).toMatchObject({ model: LITE_MODEL, maxOut: 8192 });
    expect(callSpec('Avl', 2)).toMatchObject({ model: LITE_MODEL, codeExecution: true, maxOut: 8192 });
    expect(callSpec('Avl', 1).prompt).toContain('outil d’exécution de code');
    expect(callSpec('Avl', 3)).toMatchObject({ model: STRONG_MODEL });
    expect(callSpec('Avl', 3).codeExecution).toBeUndefined();
    expect(callSpec('Csv8', 3)).toMatchObject({ model: STRONG_MODEL });
    expect(GROUP_OF.Zv).toBe('C');
    expect(FULL_VOTE_GROUPS.has('Csv8') && FULL_VOTE_GROUPS.has('Pv') && !FULL_VOTE_GROUPS.has('Hv')).toBe(true);
  });
  it('une lecture Avl se lit sur la dernière partie texte (le code et son résultat s’intercalent)', () => {
    const response = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Je zoome.' }, { executableCode: { language: 'PYTHON', code: 'x' } }, { codeExecutionResult: { outcome: 'OUTCOME_OK', output: 'ok' } }, { text: JSON.stringify(whole()) }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, thoughtsTokenCount: 0, totalTokenCount: 150 } };
    const read = readingFromResponse(meta(1, 'Avl'), response, 1000, 10);
    expect(read.ok).toBe(true);
    expect(read.normalized!.items).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — Pv : un PDF lu page par page', () => {
  it('construit N corps (tout le PDF joint) avec la consigne de la page k : en-tête sur la première, totaux sur la dernière ; deux lectures, vote', async () => {
    const calls: Array<{ meta: ReadMeta; text: string; parts: any[] }> = [];
    const pages = [
      { ...header, amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, items: [item('Article un', 10)] },
      { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, items: [item('Article deux', 20)] },
      { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', ...totals, items: [item('Article trois', 30)] }
    ];
    const transport: Transport = async (_model, body: any, m) => {
      calls.push({ meta: m, text: body.contents[0].parts[0].text, parts: body.contents[0].parts });
      return { json: answer(pages[m.part!.k - 1]), ms: 1000 + 100 * m.part!.k };
    };
    const { records } = await runBench(base({ variantes: ['Pv'] }), deps(transport, { cases: [truthCase()], readFile: () => pdfOf(3) }));
    expect(calls).toHaveLength(6);
    expect(calls.map(call => `${call.meta.id}`).sort()).toEqual(['Pv1-p1', 'Pv1-p2', 'Pv1-p3', 'Pv2-p1', 'Pv2-p2', 'Pv2-p3']);
    for (const call of calls) {
      const k = call.meta.part!.k;
      expect(call.text).toContain(`Ce PDF compte 3 pages`);
      expect(call.text).toContain(`imprimées sur la page ${k},`);
      expect(call.parts).toHaveLength(2);
      expect(call.parts[1].inlineData.mimeType).toBe('application/pdf');
      expect(call.text.includes('Lis aussi l’en-tête')).toBe(k === 1);
      expect(call.text.includes('Lis aussi les totaux')).toBe(k === 3);
    }
    // la lecture 1 et la lecture 2 partent ensemble : la durée est la plus longue des six, pas leur somme
    const pv = records[0].variants.Pv;
    expect(pv.ms).toBe(1300);
    expect(pv.calls).toBe(6);
    const verdict = judgeResult(pv.result, truthCase().expected);
    expect(verdict.wrong).toEqual([]);
    expect(pv.result.items.map((line: any) => line.name)).toEqual(['Article un', 'Article deux', 'Article trois']);
    expect(pv.result.amountTTC).toBe(60);
    expect(pv.result.vendor).toBe('Fournisseur');
  });
  it('une page coupée rend la lecture entière inexploitable : la 3.8 est appelée (repli de finalOfLite), jamais un total inventé', async () => {
    const blankHeader = { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown' };
    const none = { amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null };
    const pages = [{ ...header, ...none, items: [item('Article un', 10)] }, { ...blankHeader, ...totals, items: [item('Article deux', 20), item('Article trois', 30)] }];
    const transport: Transport = async (_model, _body, m) => {
      if (m.lecture === 3) return { json: answer(whole()), ms: 5000 };
      const cut = m.lecture === 2 && m.part!.k === 2;
      return { json: answer(pages[m.part!.k - 1], cut ? 'MAX_TOKENS' : 'STOP'), ms: 900 };
    };
    const { records } = await runBench(base({ variantes: ['Pv'] }), deps(transport, { cases: [truthCase()], readFile: () => pdfOf(2) }));
    const pv = records[0].variants.Pv;
    expect(pv.ids).toEqual(['Pv1', 'Pv2', 'Pv3']);
    expect(pv.thirdFrom).toBe('neuf');
    // le repli de finalOfLite : la lecture entière de Pv qui reste et la 3.8 votent à deux (une page coupée ne laisse ni un total inventé ni une panne)
    expect(pv.result.review.readers).toBe(2);
    expect(judgeResult(pv.result, truthCase().expected).wrong).toEqual([]);
  });
  it('un cas qui n’est pas un PDF de 2 pages ou plus n’a pas de parcours Pv (aucun appel)', async () => {
    const transport = vi.fn<Transport>(async () => ({ json: answer(whole()), ms: 1 }));
    const { records } = await runBench(base({ variantes: ['Pv'] }), deps(transport, { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img }));
    expect(transport).not.toHaveBeenCalled();
    expect(records[0].variants.Pv).toBeUndefined();
  });
  it('mergeReadings : durée = la plus longue, coût = somme, un coût inconnu rend la somme inconnue (jamais zéro)', () => {
    const part = (k: number, ms: number, cost: number | null) => readingFromResponse(meta(1, 'Pv', { id: `Pv1-p${k}`, part: { k, n: 2 } }), answer(k === 1 ? { ...header, amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, items: [item('Article un', 10)] } : { ...totals, vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', items: [item('Article deux', 20)] }), ms, cost);
    const merged = mergeReadings([part(1, 1000, 300), part(2, 2500, 400)], meta(1), { dedupe: false });
    expect(merged).toMatchObject({ ok: true, ms: 2500, costMicroChf: 700, calls: 2 });
    expect(merged.normalized!.amountTTC).toBe(60);
    expect(mergeReadings([part(1, 1000, null), part(2, 2500, 400)], meta(1), { dedupe: false }).costMicroChf).toBeNull();
    const cut = readingFromResponse(meta(1, 'Pv', { part: { k: 2, n: 2 } }), answer({}, 'MAX_TOKENS'), 800, 100);
    const broken = mergeReadings([part(1, 1000, 300), cut], meta(1), { dedupe: false });
    expect(broken).toMatchObject({ ok: false, cause: 'sortie', calls: 2 });
    expect(broken.normalized).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — Bv : les bandes sur des rangées vides', () => {
  /** Une page blanche de 100 px de large : des lignes de texte de 6 px tous les 20 px (rangées 10-15, 30-35…), le reste vide. */
  const page = (height: number, inked: (y: number) => boolean = y => y % 20 >= 10 && y % 20 < 16): Bitmap => {
    const width = 100, gray = new Uint8Array(width * height).fill(255);
    for (let y = 0; y < height; y++) if (inked(y)) for (let x = 20; x < 80; x++) gray[y * width + x] = 0;
    return { width, height, gray };
  };
  const clean = (bands: Band[], rows: number[]) => { const bad = inkedCuts(bands, rows); if (bad.length) throw new Error(`coupe à travers l’encre : rangées ${bad.map(one => one.row).join(', ')}`); };

  it('coupe sur les rangées vides : hauteur de bande ≤ 1,4 × la largeur, recouvrement d’environ 8 %, jamais à travers une rangée encrée', () => {
    const bitmap = page(700), rows = inkRows(bitmap);
    expect(isTall(bitmap.width, bitmap.height)).toBe(true);
    const bands = planBands(rows, bitmap.width);
    expect(bands.length).toBeGreaterThanOrEqual(5);
    expect(bands[0].top).toBe(0);
    expect(bands[bands.length - 1].bottom).toBe(700);
    const maxH = Math.floor(1.4 * bitmap.width);
    for (const band of bands) expect(band.bottom - band.top).toBeLessThanOrEqual(maxH);
    for (let i = 1; i < bands.length; i++) {
      const overlap = bands[i - 1].bottom - bands[i].top;
      expect(overlap).toBeGreaterThanOrEqual(Math.round(0.08 * maxH) / 2);
      expect(overlap).toBeLessThanOrEqual(Math.round(0.08 * maxH) * 2);
    }
    expect(inkedCuts(bands, rows)).toEqual([]);
    expect(() => clean(bands, rows)).not.toThrow();
    expect(bands.some(band => band.forcedTop || band.forcedBottom)).toBe(false);
    // chaque rangée encrée est dans au moins une bande entière : aucune ligne n'est perdue
    for (let y = 0; y < 700; y++) if (rows[y] > 0) expect(bands.some(band => y >= band.top && y < band.bottom)).toBe(true);
  });
  it('TÉMOIN NÉGATIF : une coupe qui traverse une rangée encrée fait échouer le test', () => {
    const bitmap = page(700), rows = inkRows(bitmap);
    // la rangée 133 est encrée (130-135) : une coupe « à 134 » (hauteur de bande 134) traverse une ligne de texte
    const naive: Band[] = [{ top: 0, bottom: 134, forcedTop: false, forcedBottom: false }, { top: 123, bottom: 257, forcedTop: false, forcedBottom: false }];
    expect(rows[133]).toBeGreaterThan(0);
    expect(inkedCuts(naive, rows).length).toBeGreaterThan(0);
    expect(() => clean(naive, rows)).toThrow('coupe à travers l’encre');
    // le même contrôle accepte le plan du banc : ce n'est pas un test qui échoue toujours
    expect(() => clean(planBands(rows, bitmap.width), rows)).not.toThrow();
  });
  it('un texte sans aucune rangée vide : la coupe est faite à la rangée la moins encrée et déclarée `forced`', () => {
    const dense = page(500, y => y % 7 !== 0), rows = inkRows(dense);
    const bands = planBands(rows, dense.width);
    expect(bands.length).toBeGreaterThan(2);
    expect(bands.slice(0, -1).every(band => band.forcedBottom)).toBe(true);
  });
  it('une image qui tient dans une bande n’est pas coupée ; le rapport 2 est le seuil', () => {
    expect(planBands(inkRows(page(120)), 100)).toHaveLength(1);
    expect(isTall(100, 199)).toBe(false);
    expect(isTall(100, 200)).toBe(true);
    expect(estimateBandCount(100, 199)).toBe(1);
    expect(estimateBandCount(1280, 5230)).toBe(4);
  });
  it('imageSize lit les en-têtes PNG et JPEG sans outil', () => {
    const png = Buffer.alloc(33); png.writeUInt32BE(0x89504e47, 0); png.write('IHDR', 12, 'latin1'); png.writeUInt32BE(1280, 16); png.writeUInt32BE(5230, 20);
    expect(imageSize(png)).toEqual({ width: 1280, height: 5230 });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x13, 0x88, 0x04, 0xb0, 0x03, 0x01, 0x22, 0x00]);
    expect(imageSize(jpeg)).toEqual({ width: 1200, height: 5000 });
    expect(imageSize(Buffer.from([1, 2, 3]))).toBeNull();
  });
  it('le recollage garde une seule fois la ligne du recouvrement (même recopie, même montant) et laisse les lignes voulues identiques', () => {
    const a = item('Article A', 10), b = item('Article B', 20), c = item('Article C', 30), d = item('Article D', 40);
    expect(dedupeOverlap([a, b, c], [c, d]).map(line => line.name)).toEqual(['Article D']);
    expect(dedupeOverlap([a, b, c], [{ ...c, name: '  article c ' }, d]).map(line => line.name)).toEqual(['Article D']);
    // même désignation, autre montant : une autre ligne
    expect(dedupeOverlap([a, b, c], [{ ...c, amountTTC: 31 }, d])).toHaveLength(2);
    // deux lignes identiques voulues : le bord n'en relit qu'une
    expect(dedupeOverlap([a, c], [c, c, d]).map(line => line.name)).toEqual(['Article C', 'Article D']);
    expect(dedupeOverlap([a, b], [c, d]).map(line => line.name)).toEqual(['Article C', 'Article D']);
    const merged = mergeDecoded([
      { ...header, amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, printedLineCount: 3, items: [a, b, c] },
      { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', ...totals, printedLineCount: 2, items: [c, d] }
    ], { dedupe: true });
    expect(merged.items.map((line: any) => line.name)).toEqual(['Article A', 'Article B', 'Article C', 'Article D']);
    expect(merged.vendor).toBe('Fournisseur');
    expect(merged.amountTTC).toBe(60);
    expect(merged.printedLineCount).toBe(5);
    // un total absent de toutes les parties reste null, jamais zéro
    expect(mergeDecoded([{ items: [] }, { items: [] }], { dedupe: false }).amountTTC).toBeNull();
  });
  it('Bv dans le banc : une lecture par bande avec son rang, recollées ; la ligne relue sur deux bandes n’est comptée qu’une fois', async () => {
    const parts = [1, 2, 3].map(k => ({ file: { mimeType: 'image/jpeg', data: Buffer.from([255, 216, k, 217]).toString('base64') }, k, n: 3, source: 0, top: 0, bottom: 0, forced: false }));
    const bander: Bander = async () => parts;
    const bands = [
      { ...header, amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, items: [item('Article un', 10), item('Article deux', 20)] },
      { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', amountHT: null, tvaAmount: null, amountTTC: null, tvaRate: null, items: [item('Article deux', 20), item('Article trois', 30)] },
      { vendor: '', currency: '', date: '', invoiceNumber: '', documentType: 'invoice', paymentEvidence: 'unknown', ...totals, items: [item('Article trois', 30)] }
    ];
    const texts: string[] = [];
    const transport: Transport = async (_model, body: any, m) => { texts.push(body.contents[0].parts[0].text); return { json: answer(bands[m.part!.k - 1]), ms: 500 }; };
    const { records } = await runBench(base({ variantes: ['Bv'] }), deps(transport, { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, bander }));
    expect(texts).toHaveLength(6);
    expect(texts.filter(text => text.includes('partie 2 sur 3'))).toHaveLength(2);
    expect(texts.filter(text => text.includes('Lis aussi l’en-tête'))).toHaveLength(2);
    expect(texts.filter(text => text.includes('Lis aussi les totaux'))).toHaveLength(2);
    const bv = records[0].variants.Bv;
    expect(bv.result.items.map((line: any) => line.name)).toEqual(['Article un', 'Article deux', 'Article trois']);
    expect(judgeResult(bv.result, truthCase('tdoc', 'image/jpeg').expected).wrong).toEqual([]);
  });
  it('sans l’outil de découpe, la variante est sautée avec un message clair, sans appel', async () => {
    const logs: string[] = [];
    const bander: Bander = async () => { throw new OutilManquant('jimp', 'absent'); };
    const transport = vi.fn<Transport>(async () => ({ json: answer(whole()), ms: 1 }));
    const { records } = await runBench(base({ variantes: ['Bv'] }), deps(transport, { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, bander, log: (line: string) => logs.push(line) }));
    expect(transport).not.toHaveBeenCalled();
    expect(records[0].variants.Bv).toBeUndefined();
    expect(logs.join('\n')).toContain('Outil du banc absent : jimp');
  });
  it('un outil installé ailleurs se charge ; un dossier d’outils absent lève OutilManquant (npm test n’en dépend jamais)', async () => {
    const before = process.env.BANC_OUTILS;
    process.env.BANC_OUTILS = path.join(work, 'rien-ici');
    try { await expect(loadJimp()).rejects.toBeInstanceOf(OutilManquant); } finally { if (before === undefined) delete process.env.BANC_OUTILS; else process.env.BANC_OUTILS = before; }
  });
  it('les phrases de rang : en-tête sur la première, totaux sur la dernière, aucune valeur', () => {
    expect(bandNote(1, 3)).toContain('partie 1 sur 3');
    expect(bandNote(1, 3)).toContain('en-tête');
    expect(bandNote(1, 3)).toContain('Laisse null les totaux');
    expect(bandNote(3, 3)).toContain('Lis aussi les totaux');
    expect(bandNote(2, 3)).toContain('Laisse vides les champs d’en-tête');
    expect(pageNote(2, 3)).toContain('page 2');
    expect(pageNote(1, 1)).toContain('en-tête');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — Zv : le zoom ciblé', () => {
  it('convertit box_2d en pixels avec une marge de 15 % (16 px au moins), et agrandit une zone de moins de 600 px', () => {
    const small = boxToPixels([100, 200, 150, 600], 1000, 2000);
    expect(small).toEqual({ x: 140, y: 184, w: 520, h: 132, scale: 1.16, outW: 603, outH: 153 });
    const corner = boxToPixels([0, 0, 10, 10], 1000, 1000);
    expect(corner).toMatchObject({ x: 0, y: 0, w: 26, h: 26 });
    expect(corner.outW).toBe(600);
    const wide = boxToPixels([0, 0, 1000, 1000], 1000, 2000);
    expect(wide).toEqual({ x: 0, y: 0, w: 1000, h: 2000, scale: 1, outW: 1000, outH: 2000 });
    // l'ordre est [ymin, xmin, ymax, xmax] : une boîte haute et étroite ne devient pas large
    const tall = boxToPixels([100, 450, 900, 550], 1000, 1000);
    expect(tall.h).toBeGreaterThan(tall.w);
  });
  it('parseBox refuse ce qui n’est pas une boîte', () => {
    expect(parseBox([100, 200, 150, 600])).toEqual([100, 200, 150, 600]);
    expect(parseBox([100, 200, 150])).toBeNull();
    expect(parseBox([150, 200, 100, 600])).toBeNull();
    expect(parseBox([100, 600, 150, 200])).toBeNull();
    expect(parseBox([100, 200, 150, 'x'])).toBeNull();
    expect(parseBox([100, 200, 150, 2000])).toBeNull();
    expect(parseBox([-3, 200, 150, 1003])).toEqual([0, 200, 150, 1000]);
    expect(parseBox(undefined)).toBeNull();
  });
  it('zoomTargets : seulement le total, la date, le n° et le montant d’une ligne ; tout autre désaccord, ou aucun, rend null', () => {
    const point = (champs: string[], extra: Record<string, unknown> = {}) => ({ source: 'désaccord', pese: true, champs, ...extra });
    expect(zoomTargets([point(['amountTTC']), point(['date']), point(['items.3.amountTTC'])])).toEqual([
      { cell: 'amountTTC', field: 'amountTTC' }, { cell: 'date', field: 'date' }, { cell: 'items.3.amountTTC', field: 'lineAmount', line: 3 }]);
    expect(zoomTargets([point(['invoiceNumber'])])).toEqual([{ cell: 'invoiceNumber', field: 'invoiceNumber' }]);
    expect(zoomTargets([point(['amountTTC']), point(['vendor'])])).toBeNull();
    expect(zoomTargets([point(['items.2.quantity'])])).toBeNull();
    expect(zoomTargets([point(['items'])])).toBeNull();
    expect(zoomTargets([point(['amountTTC', 'date'])])).toBeNull();
    expect(zoomTargets([])).toBeNull();
    expect(zoomTargets([point(['amountTTC'], { pese: false })])).toBeNull();
    expect(zoomTargets([point(['amountTTC']), point(['date']), point(['invoiceNumber']), point(['items.1.amountTTC'])])).toBeNull();
  });
  it('la valeur relue : montants suisses, dates, numéros ; l’illisible est null, jamais 0', () => {
    expect(parseAmountText("1'234.50")).toBe(1234.5);
    expect(parseAmountText('1.234,50')).toBe(1234.5);
    expect(parseAmountText('CHF 12,5')).toBe(12.5);
    expect(parseAmountText('-8.00')).toBe(-8);
    expect(parseAmountText('abc')).toBeNull();
    expect(parseZoomValue('amountTTC', '108.10')).toBe(108.1);
    expect(parseZoomValue('lineAmount', '')).toBeNull();
    expect(parseZoomValue('date', '9.9.2026')).toBe('09.09.2026');
    expect(parseZoomValue('date', '2026-09-09')).toBe('09.09.2026');
    expect(parseZoomValue('date', 'hier')).toBeNull();
    expect(parseZoomValue('invoiceNumber', ' F-42 ')).toBe('F-42');
    expect(parseZoomValue('invoiceNumber', 'x'.repeat(41))).toBeNull();
  });
  it('patchDecoded remplace les seules cellules en cause et ne touche pas la lecture d’origine', () => {
    const original = whole();
    const patched = patchDecoded(original, [{ target: { cell: 'amountTTC', field: 'amountTTC' }, value: 61 }, { target: { cell: 'items.2.amountTTC', field: 'lineAmount', line: 2 }, value: 21 }]);
    expect(patched.amountTTC).toBe(61);
    expect(patched.items[1].amountTTC).toBe(21);
    expect(patched.items[0].amountTTC).toBe(10);
    expect(original.amountTTC).toBe(60);
    expect(patchDecoded(original, [{ target: { cell: 'items.9.amountTTC', field: 'lineAmount', line: 9 }, value: 1 }])).toBeNull();
  });

  // Deux Flash-Lite qui ne divergent que sur le total TTC ; la 3.8 localise et relit.
  const zoomTransport = (opts: { box?: unknown; value?: string; log?: ReadMeta[] }): Transport => async (_model, _body, m) => {
    opts.log?.push(m);
    if (m.zoom?.etape === 'loc') return { json: answer({ found: opts.box !== undefined, image: 1, box_2d: opts.box ?? [] }), ms: 2000 };
    if (m.zoom?.etape === 'lec') return { json: answer({ value: opts.value ?? '' }), ms: 1500 };
    if (m.lecture === 3) return { json: answer(whole()), ms: 6000 };
    return { json: answer(whole({ amountTTC: m.lecture === 2 ? 70 : 60 })), ms: 800 };
  };
  const cropper: Cropper = async (_files, _index, box) => ({ file: img, pixels: boxToPixels(box, 1000, 1000), source: { width: 1000, height: 1000 } });

  it('le zoom : la 3.8 localise puis relit ce seul champ ; Zv ne relit pas toute la pièce', async () => {
    const log: ReadMeta[] = [];
    const { records } = await runBench(base({ variantes: ['Csv', 'Zv'] }), deps(zoomTransport({ box: [300, 100, 340, 900], value: '60.00', log }), { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, cropper }));
    const zv = records[0].variants.Zv, csv = records[0].variants.Csv;
    expect(log.filter(m => m.zoom).map(m => m.id)).toEqual(['Zv-loc-amountTTC', 'Zv-lec-amountTTC']);
    expect(zv.thirdFrom).toBe('zoom');
    expect(zv.ids).toEqual(['C1', 'C2', ZOOM_ID]);
    expect(zv.calls).toBe(4);
    expect(zv.result.amountTTC).toBe(60);
    // la zone relue vaut la première lecture : deux lectures sur trois s'accordent, comme avec une 3.8 complète
    expect(zv.result.review.readers).toBe(3);
    // la 3.8 complète de Csv n'est pas celle de Zv ; la durée de Zv compte localiser puis relire (2000 + 1500), pas une lecture complète
    expect(zv.ms).toBe(800 + 2000 + 1500);
    expect(csv.ms).toBe(800 + 6000);
    expect(thirdCallDuplicates(log.map(m => ({ ...m })))).toEqual([]);
  });
  it('sans boîte, la 3ᵉ lecture complète : les appels de zoom perdus comptent dans la durée et le coût', async () => {
    const { records } = await runBench(base({ variantes: ['Zv'] }), deps(zoomTransport({}), { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, cropper }));
    const zv = records[0].variants.Zv;
    expect(zv.thirdFrom).toBe('neuf');
    expect(zv.ids).toEqual(['C1', 'C2', 'Zv3', 'Zv-perdu']);
    expect(zv.ms).toBe(800 + 6000 + 2000);
    expect(zv.calls).toBe(4);
    expect(zv.costMicroChf).toBeGreaterThan(0);
    expect(judgeResult(zv.result, truthCase('tdoc', 'image/jpeg').expected).wrong).toEqual([]);
  });
  it('une relecture illisible, ou un recadrage impossible : le même repli', async () => {
    const unreadable = await runBench(base({ variantes: ['Zv'], out: path.join(work, 'a') }), deps(zoomTransport({ box: [300, 100, 340, 900], value: '??' }), { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, cropper }));
    expect(unreadable.records[0].variants.Zv.ids).toEqual(['C1', 'C2', 'Zv3', 'Zv-perdu']);
    const noCrop: Cropper = async () => null;
    const none = await runBench(base({ variantes: ['Zv'], out: path.join(work, 'b') }), deps(zoomTransport({ box: [300, 100, 340, 900], value: '60' }), { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, cropper: noCrop }));
    expect(none.records[0].variants.Zv.thirdFrom).toBe('neuf');
  });
  it('un désaccord ailleurs que sur le total, la date, le n° ou une ligne : pas de zoom, la 3ᵉ lecture complète', async () => {
    const log: ReadMeta[] = [];
    const transport: Transport = async (_model, _body, m) => { log.push(m); return { json: answer(m.lecture === 3 ? whole() : whole({ vendor: m.lecture === 2 ? 'Autre' : 'Fournisseur' })), ms: 500 }; };
    const { records } = await runBench(base({ variantes: ['Zv'] }), deps(transport, { cases: [truthCase('tdoc', 'image/jpeg')], readFile: () => img, cropper }));
    expect(log.some(m => m.zoom)).toBe(false);
    expect(records[0].variants.Zv.ids).toEqual(['C1', 'C2', 'Zv3']);
  });
  it('foldZoom : les cellules en parallèle, chacune en deux temps successifs', () => {
    const read = (ms: number, cost: number | null) => ({ ms, costMicroChf: cost, inputTokens: 10, outputTokens: 5 }) as Reading;
    expect(foldZoom([[read(2000, 100), read(1500, 50)], [read(1000, 70)]])).toMatchObject({ ms: 3500, costMicroChf: 220, calls: 3 });
    expect(foldZoom([[read(2000, null)]]).costMicroChf).toBeNull();
    const final: Final = { result: {}, used: [], ms: 1000, costMicroChf: 10, costUnknown: 0 };
    expect(addWasted(final, { ms: 300, costMicroChf: 5 } as Reading)).toMatchObject({ ms: 1300, costMicroChf: 15 });
    expect(addWasted(final, undefined)).toBe(final);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — +Q : le QR-facture comme garde-fou', () => {
  // Charge construite à la main d'après les exemples PUBLICS des Swiss Implementation Guidelines QR-bill (SIX) : aucune pièce du brasseur.
  const QR_IBAN = 'CH4431999123000889012', QRR = '210000000003139471430009017', S1 = '//S1/10/10201409/11/190512/20/1400.000-53/30/106017086/31/180508/32/7.7/40/2:10;0:30';
  const charge = (montant = '1949.75', s1 = S1, iban = QR_IBAN) => [
    'SPC', '0200', '1', iban, 'S', 'Robert Schneider AG', 'Rue du Lac', '1268', '2501', 'Biel', 'CH', '', '', '', '', '', '', '', montant, 'CHF',
    'S', 'Pia-Maria Rutschmann-Schnyder', 'Grosse Marktgasse', '28', '9400', 'Rorschach', 'CH', 'QRR', QRR, 'Instruction of 03.04.2019', 'EPD', s1].join('\n');
  const lecture = (extra: Record<string, unknown> = {}) => ({ vendor: 'Robert Schneider AG', date: '12.05.2019', currency: 'CHF', invoiceNumber: '10201409', amountTTC: 1949.75, ...extra });
  const expected = { vendor: 'robert schneider', date: '12.05.2019', currency: 'CHF', invoiceNumber: ['10201409'], amountTTC: 1949.75 };

  it('un QR valide qui contredit le total interdit `checked` et propose sa valeur ; un QR qui s’accorde ne change rien', () => {
    const qrs = qrOfTexts([charge()]);
    expect(qrs).toHaveLength(1);
    expect(qrs[0].valid).toBe(true);
    const wrong = qrContradictions(qrs, lecture({ amountTTC: 1949.57 }) as any);
    expect(wrong).toEqual([{ field: 'montant', path: 'amountTTC', qr: 1949.75, lecture: 1949.57 }]);
    const result = { ...lecture({ amountTTC: 1949.57 }), review: { status: 'checked', findings: [] }, items: [] };
    const guarded = guardWithQr(result, wrong);
    expect(guarded.review.status).toBe('disputed');
    expect(guarded.qrProposals).toEqual([{ field: 'montant', valeur: 1949.75 }]);
    expect(guarded.amountTTC).toBe(1949.57);
    expect(withProposals(result, wrong).amountTTC).toBe(1949.75);
    expect(qrContradictions(qrs, lecture() as any)).toEqual([]);
    expect(guardWithQr({ ...result, review: { status: 'checked' } }, [])).toEqual({ ...result, review: { status: 'checked' } });
  });
  it('le n° de facture et la date que le QR porte sont aussi gardés ; la date proposée est en JJ.MM.AAAA', () => {
    const qrs = qrOfTexts([charge()]);
    const proposals = qrContradictions(qrs, lecture({ invoiceNumber: '10201499', date: '13.05.2019' }) as any);
    expect(proposals.map(one => `${one.field}:${one.qr}`)).toEqual(['numero:10201409', 'date:12.05.2019']);
  });
  it('un QR invalide, ou un champ que le QR ne porte pas, ne contredit rien ; deux QR (bulletins) : contredit seulement si aucun ne confirme', () => {
    expect(qrContradictions(qrOfTexts([charge('1949.75', S1, 'CH0000000000000000000')]), lecture({ amountTTC: 5 }) as any)).toEqual([]);
    expect(qrContradictions(qrOfTexts([charge('1949.75', '')]), lecture({ invoiceNumber: 'zzz', date: '01.01.2000' }) as any)).toEqual([]);
    expect(qrContradictions(qrOfTexts(['pas un QR suisse']), lecture({ amountTTC: 5 }) as any)).toEqual([]);
    const two = qrOfTexts([charge('1000.00'), charge('949.75')]);
    expect(qrContradictions(two, lecture({ amountTTC: 949.75 }) as any)).toEqual([]);
    expect(qrContradictions(two, lecture({ amountTTC: 500 }) as any).map(one => one.field)).toEqual(['montant']);
  });
  it('replayQr compte avant et après : le faux vert devient une alerte, la valeur proposée corrige le champ, une alerte sur un résultat juste est « inutile »', () => {
    const cases: BenchCase[] = [{ id: 'q1', file: 'x', mimeType: 'image/jpeg', expected }, { id: 'q2', file: 'x', mimeType: 'image/jpeg', expected }, { id: 'q3', file: 'x', mimeType: 'image/jpeg', expected }];
    const run = (result: any) => ({ ids: ['C1'], calls: 2, ms: 1, costMicroChf: 1, costUnknown: 0, result });
    const checked = (extra: Record<string, unknown>) => ({ ...lecture(extra), review: { status: 'checked', findings: [] }, items: [] });
    const records = [
      { doc: 'q1', tirage: 1, readings: [], variants: { X: run(checked({ amountTTC: 1949.57 })) } },
      { doc: 'q2', tirage: 1, readings: [], variants: { X: run(checked({})) } },
      { doc: 'q3', tirage: 1, readings: [], variants: { X: run(checked({ amountTTC: 1949.57 })) } }
    ];
    const qrs = qrOfTexts([charge()]);
    const counts = replayQr(records as any, cases, new Map([['q1', qrs], ['q2', qrs]]));
    const x = counts.get('X')!;
    // q1 : faux vert avant, alerte juste après, champ corrigé ; q2 : juste, aucune alerte ; q3 : pas de QR, le faux vert reste
    expect(x).toMatchObject({ draws: 3, withQr: 2, fvBefore: 2, fvAfter: 1, alerts: 1, alertsRight: 1, alertsUseless: 0, fixed: 1, broken: 0 });
    expect(x.rightAfter - x.rightBefore).toBe(1);
    // un QR qui contredit un résultat JUSTE (autre montant de bulletin) : alerte inutile, champ gâté si l'on adoptait sa valeur
    const other = replayQr([{ doc: 'q2', tirage: 1, readings: [], variants: { X: run(checked({})) } }] as any, cases, new Map([['q2', qrOfTexts([charge('100.00')])]])).get('X')!;
    expect(other).toMatchObject({ alerts: 1, alertsRight: 0, alertsUseless: 1, fixed: 0, broken: 1 });
  });
});

describe('k5-Q — le rendu d’un PDF pour le QR (aucun outil chargé)', () => {
  // pdf.js fabriqué : la page 3 ne dessine son QR que si le document est ouvert SANS `standardFontDataUrl` — le défaut vu le 01.11 sur un vrai PDF de 3 pages (0 texte lu).
  const fakePdfjs = (seen: any[]) => ({
    getDocument: (params: any) => {
      seen.push(params);
      const draws = params.standardFontDataUrl === undefined;
      return { promise: Promise.resolve({ numPages: 3, getPage: async (n: number) => ({
        getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 200 * scale }),
        render: ({ canvasContext }: any) => ({ promise: Promise.resolve().then(() => { canvasContext.drawn = n === 3 && draws; }) }) }) }) };
    }
  });
  const fakeCanvas = (width: number, height: number) => { const context: any = { fillRect: () => {}, drawn: false }; return { width, height, getContext: () => context, toBuffer: () => Buffer.from(context.drawn ? 'PNG+QR' : 'PNG') }; };
  const reader = async (bytes: Buffer) => (bytes.toString().includes('QR') ? ['SPC-fabriqué'] : []);

  it('une page de PDF rendue avec les paramètres du banc QR donne son QR ; les paramètres sont ceux de pdf-qr.mjs, sans police standard', async () => {
    const seen: any[] = [];
    const file = path.join(work, 'trois-pages.pdf');
    writeFileSync(file, pdfOf(3).data, 'base64');
    const texts = await zxingSource({ reader, renderer: makePdfRenderer(fakePdfjs(seen), fakeCanvas) })({ id: 'x', file, mimeType: 'application/pdf', expected: {} });
    expect(texts).toEqual(['SPC-fabriqué']);
    expect(seen.length).toBeGreaterThan(0);
    for (const params of seen) {
      expect(params.isEvalSupported).toBe(false);
      expect(params).not.toHaveProperty('standardFontDataUrl');
    }
    expect(QR_PDF_OPEN_OPTIONS).toEqual({ isEvalSupported: false, verbosity: 0 });
  });
  it('le rendu du recadreur de Zv (loadPdfRenderer) ouvre le PDF sans police standard : la page 3 garde son QR', async () => {
    const seen: any[] = [];
    const renderer = makePdfjsRenderer(fakePdfjs(seen), fakeCanvas);
    expect((await renderer.render(Buffer.from('%PDF'), 3, 3)).toString()).toBe('PNG+QR');
    expect((await renderer.render(Buffer.from('%PDF'), 2, 3)).toString()).toBe('PNG');
    expect(await renderer.pages(Buffer.from('%PDF'))).toBe(3);
    for (const params of seen) expect(params).not.toHaveProperty('standardFontDataUrl');
    expect(PDF_OPEN_OPTIONS).toEqual({ isEvalSupported: false, verbosity: 0 });
  });
  it('TÉMOIN : le défaut d’origine (police standard demandée) rend la page sans QR — le test ci-dessus l’aurait vu', async () => {
    const withFonts: PdfjsLike = { getDocument: params => fakePdfjs([]).getDocument({ ...params, standardFontDataUrl: 'x/' }) };
    const file = path.join(work, 'trois-pages-2.pdf');
    writeFileSync(file, pdfOf(3).data, 'base64');
    expect(await zxingSource({ reader, renderer: makePdfRenderer(withFonts, fakeCanvas) })({ id: 'x', file, mimeType: 'application/pdf', expected: {} })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — le budget : 24,5 CHF cumulés, 3 CHF par passe', () => {
  it('BUDGET_CAP_CHF est 24,5 ; le plafond de passe par défaut est 3 et se règle', () => {
    expect(BUDGET_CAP_CHF).toBe(24.5);
    expect(DEFAULT_PASS_CAP_CHF).toBe(3);
    expect(parseArgs(['--payant', '--budget-chf', '10']).plafondPasse).toBe(3);
    expect(parseArgs(['--payant', '--budget-chf', '10', '--plafond-passe', '1.5']).plafondPasse).toBe(1.5);
    expect(parseArgs(['--simuler']).plafondPasse).toBeUndefined();
    expect(() => parseArgs(['--payant', '--budget-chf', '10', '--plafond-passe', '0'])).toThrow('--plafond-passe');
    expect(() => parseArgs(['--payant', '--budget-chf', '25'])).toThrow('--budget-chf');
    expect(parseArgs(['--estimer', '--reprendre', 'a,b']).reprendre).toBe('a,b');
  });
  it('le plafond de passe arrête AVANT le dépassement ; le budget cumulé reste l’autre garde', () => {
    const budget = new Budget(10_000_000, 1_000_000, 500_000);
    const a = budget.reserve(300_000);
    expect(() => budget.reserve(300_000)).toThrow(BudgetStop);
    expect(() => budget.reserve(300_000)).toThrow('Plafond de passe');
    budget.settle(a, 120_000);
    expect(budget.passMicro()).toBe(120_000);
    expect(() => budget.reserve(300_000)).not.toThrow();
    expect(() => new Budget(1_200_000, 1_000_000, 5_000_000).reserve(300_000)).toThrow('Budget atteint');
    expect(new Budget(10_000_000, 9_000_000).reserve(900_000)).toBe(900_000);
  });
  it('une passe payante s’arrête net quand la réserve du prochain appel dépasserait son plafond', async () => {
    const one = reservationMicro(LITE_MODEL, 5100) / 1e6;
    const transport = vi.fn<Transport>(async () => ({ json: answer(whole()), ms: 10 }));
    const { records, stopped } = await runBench(base({ variantes: ['C'], plafondPasse: one * 1.5 }), deps(transport, { cases: [truthCase('tdoc', 'image/jpeg'), truthCase('tdoc2', 'image/jpeg')], readFile: () => img }));
    expect(stopped).toContain('Plafond de passe atteint');
    expect(records).toHaveLength(0);
    expect(transport.mock.calls.length).toBeLessThanOrEqual(1);
    const journal = spentInJournal(path.join(work, 'journal.md'));
    expect(journal / 1e6).toBeLessThanOrEqual(one * 1.5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('k5 — --estimer, durées, simulation', () => {
  it('--estimer compte les appels de Pv (2 × pages), de Bv (2 × bandes) et le zoom de Zv, avec le plafond de passe', () => {
    const pdfCase = truthCase('tp');
    const text = estimateBench({ mode: 'payant', repeat: 1, budgetChf: 10, plafondPasse: 3, faults: false, variantes: ['Pv', 'Zv'] }, [pdfCase], undefined, 0);
    expect(text.text.join('\n')).toContain('BANC ESTIME');
    expect(text.text.join('\n')).toContain('Plafond de passe 3 CHF');
    expect(text.lines.map(line => line.variant).sort()).toEqual(['C', 'Pv']);
    // un fichier absent est remplacé par un faux PDF de deux pages : Pv = 2 lectures × 2 pages
    expect(text.lines.find(line => line.variant === 'Pv')!.fresh).toBe(4);
    expect(text.lines.find(line => line.variant === 'C')!.fresh).toBe(2);
    expect(text.thirds.some(line => line.variant.startsWith('Zv'))).toBe(true);
    expect(text.freshCalls).toBeGreaterThan(8);
  });
  it('la durée murale par pièce et par genre : les appels parallèles comptés une fois', () => {
    const record = (doc: string, tirage: number, ms: number) => ({ doc, tirage, readings: [], variants: { Pv: { ids: ['Pv1', 'Pv2'], calls: 6, ms, costMicroChf: 1, costUnknown: 0, result: { ...whole(), review: { status: 'checked' } } } } });
    const cases = [truthCase('d8'), { ...truthCase('d9'), mimeType: 'application/pdf' }];
    const { draws } = judgeBench([record('d8', 1, 4000), record('d8', 2, 6000), record('d9', 1, 3000)] as any, cases);
    const text = renderDurations(draws, ['Pv']).join('\n');
    expect(text).toContain('| d8 | 5,0 s |');
    expect(text).toContain('| d9 | 3,0 s |');
    expect(text).toContain('| PDF | 4,0 s |');
  });
  it('les variantes de k5 sont connues du banc, avec leur plan de fautes simulé', () => {
    for (const id of ['Csv8', 'Avl', 'Pv', 'Bv', 'Zv']) expect(VARIANTS).toContain(id);
    const ids = FAULT_PLAN.map(fault => fault.id);
    expect(ids).toEqual(expect.arrayContaining(['unite-x-k5', 'coupure-sortie-relevee', 'coupure-page', 'total-diverge-zoom', 'zoom-sans-boite']));
  });
  it('la simulation retrouve chaque fausse réponse fabriquée sur les variantes de k5 (PDF, bande, zoom)', async () => {
    const docs: BenchCase[] = ['doc2', 'doc4', 'doc6', 'doc8', 'doc9'].map(id => ({ ...truthCase(id), mimeType: id === 'doc8' || id === 'doc9' ? 'application/pdf' : 'image/jpeg' }));
    const bander: Bander = async () => null;
    const { records, faults } = await runBench({ mode: 'simuler', repeat: 3, out: path.join(work, 'sim'), faults: true, variantes: ['C', 'Csv', 'Csv8', 'Avl', 'Pv', 'Bv', 'Zv'] },
      { cases: docs, plan: FAULT_PLAN, log: () => {}, readFile: c => (c.mimeType === 'application/pdf' ? pdfOf(3) : img), bander });
    expect(variantIds(records)).toEqual(expect.arrayContaining(['Csv8', 'Avl', 'Pv', 'Zv']));
    const zoomed = records.filter(record => record.variants.Zv?.thirdFrom === 'zoom').map(record => `${record.doc}/${record.tirage}`).sort();
    expect(zoomed).toEqual(['doc2/1', 'doc4/1', 'doc6/3']);
    expect(records.find(record => record.doc === 'doc2' && record.tirage === 2)!.variants.Zv.ids).toContain('Zv-perdu');
    expect(faults.length).toBeGreaterThan(0);
    expect(buildReadBody).toBeTypeOf('function');
    expect(parseReadResponse).toBeTypeOf('function');
    expect(syntheticResponse({ items: [] }, { input: 1, output: 1 }).candidates[0].finishReason).toBe('STOP');
  });
});
