import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// Même montage que invoiceScanTransport.test.ts : le budget Firestore est remplacé, le fournisseur est simulé.
vi.mock('../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { scanInvoiceSafely } from '../../functions/src/ai';
import { SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import { INVOICE_SCAN_PROMPTS } from '../../functions/src/invoiceScanPrompts';
import { quoteGeminiCost } from '../../functions/src/geminiCosts';
import {
  BUDGET_CAP_CHF, Budget, BudgetStop, LITE_MODEL, STRONG_MODEL, appendJournal, buildReadBody, finalOfB, finalOfCprime, finalOfTwo, needsThird, parseArgs,
  readingFromError, readingFromResponse, realTransport, reservationMicro, runBench, simulateResponse, spentInJournal, type BenchCase, type Fault, type ReadMeta
} from '../../scripts/banc-lecture-facture';
import { checkSimulation, fieldDiff, judgeBench, judgeResult, perDocument, renderHorsLigne, renderTable, variantIds } from '../../scripts/banc-lecture-facture-juger';
import {
  FAULT_PLAN, K1_VARIANTS, LITE_RAISED_OUTPUT, THIRD_IDS, VARIANTS, callSpec, deriveVariants, finalOfStar, finalOfStarPrime, finalOfStarVote, isoCurrency, loadCases, loadLender, mapReads,
  orderVariants, withCodesNormalized, type DrawReads, type VariantId
} from '../../scripts/banc-lecture-facture';
import { LITE_RULES, LITE_RULES_BLOCK, LITE_RULES_TITLE, liteConsigne } from '../../scripts/banc-lecture-consignes-lite';

// ---------------------------------------------------------------------------------------------------------------------
// Données fabriquées : aucune valeur d'un vrai document
// ---------------------------------------------------------------------------------------------------------------------
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const invoice = (kind = 'stock', extra: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081,
  items: [{ name: 'Article', kind, quantity: 2, unit: 'pièce', price: 54.05, amountTTC: 108.1 }], ...extra });
const answer = (data: any, finishReason = 'STOP') => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { promptTokenCount: 2000, candidatesTokenCount: 800, thoughtsTokenCount: 0, totalTokenCount: 2800 } });
const fetched = (data: any, finishReason = 'STOP') => ({ ok: true, json: async () => answer(data, finishReason) });
const refused = (status: number) => ({ ok: false, status, json: async () => ({}) });
const meta = (lecture: 1 | 2 | 3, model = STRONG_MODEL, variant = 'A'): ReadMeta => ({ id: `${variant}${lecture}`, doc: 'tdoc', tirage: 1, variant, lecture, model });
const reading = (lecture: 1 | 2 | 3, data: any, model = STRONG_MODEL, ms = 1000, finishReason = 'STOP') => readingFromResponse(meta(lecture, model), answer(data, finishReason), ms, 1000);
const failedReading = (lecture: 1 | 2 | 3, status = 503, model = STRONG_MODEL) => readingFromError(meta(lecture, model), Object.assign(new Error('refus'), { httpStatus: status }), 500, 0);

const truth: BenchCase = { id: 'tdoc', file: 'inexistant.jpg', mimeType: 'image/jpeg', expected: {
  vendor: 'fournisseur', documentType: 'invoice', date: '09.09.2026', currency: 'CHF', invoiceNumber: ['F-42'], orderNumber: '', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: 0.081,
  paymentEvidence: ['unknown'], items: [{ name: 'article', kind: ['stock'], quantity: 2, unit: 'pièce', price: 54.05, amountTTC: 108.1 }] } };
const truthOf = (id: string): BenchCase => ({ ...truth, id });

const fetchMock = vi.fn();
let work: string;
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); work = mkdtempSync(path.join(tmpdir(), 'k1-test-')); });
afterEach(() => { vi.unstubAllGlobals(); rmSync(work, { recursive: true, force: true }); });

// ---------------------------------------------------------------------------------------------------------------------
describe('k1 — les consignes ne sont pas copiées, elles sont déplacées', () => {
  it('garde le texte de HEAD à l’octet près (empreintes sha256 prises sur ai.ts avant le déplacement)', () => {
    const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
    expect(INVOICE_SCAN_PROMPTS.map(sha)).toEqual([
      'ccd964275fa2279f9cacc360e071bf782a2da0658d8b973064fc170c1aaf5e54',
      'c9a5c2abd55ad83ba80ed74c74904b0635c3a3eb28249e8af6321f17a83bff13',
      '86cd62a5f11f3e0f4148ad69c7ae4a1948eb503684c0cec3511117fa690ca9f9'
    ]);
  });
  it('ai.ts importe le module et ne porte plus aucune consigne en littéral', () => {
    const source = readFileSync(path.join(__dirname, '../../functions/src/ai.ts'), 'utf8');
    expect(source).toContain("from './invoiceScanPrompts.js'");
    for (const prompt of INVOICE_SCAN_PROMPTS) expect(source).not.toContain(prompt.slice(0, 40));
  });
});

describe('k1 — le corps du banc pour A est celui de scanInvoiceSafely, champ par champ', () => {
  it('lectures 1, 2 et 3 : même JSON, même ordre de clés, même URL de modèle', async () => {
    fetchMock.mockResolvedValueOnce(fetched(invoice())).mockResolvedValueOnce(fetched({ ...invoice(), amountTTC: 118.1 })).mockResolvedValueOnce(fetched({ ...invoice(), amountTTC: 128.1 }));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    INVOICE_SCAN_PROMPTS.forEach((prompt, index) => {
      const [url, options] = fetchMock.mock.calls[index];
      expect(url).toContain(`${SCAN_MODEL}:generateContent`);
      const expected = buildReadBody(file, prompt);
      expect(JSON.parse(options.body)).toEqual(expected);
      expect(options.body).toBe(JSON.stringify(expected));
      expect(JSON.parse(options.body).contents[0].parts[0].text).toBe(prompt);
    });
  });
  it('envoyé après la normalisation du budget mensuel : le corps de la production plus candidateCount, rien d’autre', () => {
    const body = buildReadBody(file, INVOICE_SCAN_PROMPTS[0]) as any;
    const sent = quoteGeminiCost(SCAN_MODEL, body).body as any;
    expect(sent).toEqual({ ...body, generationConfig: { ...body.generationConfig, candidateCount: 1 } });
  });
});

describe('k1 — le parcours A du banc rend ce que rend la production, sur les mêmes réponses', () => {
  const scenarios: Array<[string, any[]]> = [
    ['deux lectures qui concordent', [invoice(), invoice()]],
    ['majorité de deux sur trois', [invoice('equipment'), invoice('maintenance'), invoice('maintenance')]],
    ['divergence non résolue après trois lectures', [invoice(), { ...invoice(), amountTTC: 118.1 }, { ...invoice(), amountTTC: 128.1 }]],
    ['devise étrangère transcrite à l’identique', [{ ...invoice(), currency: 'EUR' }, { ...invoice(), currency: 'EUR' }]]
  ];
  for (const [name, payloads] of scenarios) {
    it(name, async () => {
      payloads.forEach(payload => fetchMock.mockResolvedValueOnce(fetched(payload)));
      const production: any = await scanInvoiceSafely('u', file, 'fake-test-key');
      const reads = payloads.map((payload, index) => reading((index + 1) as 1 | 2 | 3, payload));
      const banc = finalOfTwo(reads[0], reads[1], reads[2]);
      expect(banc.result).toEqual(production.data);
      expect(banc.used).toHaveLength(payloads.length);
      expect(needsThird(reads[0], reads[1])).toBe(payloads.length === 3);
    });
  }
  it('une lecture refusée par le fournisseur : « unavailable », une seule lecture', async () => {
    fetchMock.mockResolvedValueOnce(fetched(invoice())).mockResolvedValueOnce(refused(503));
    const production: any = await scanInvoiceSafely('u', file, 'fake-test-key');
    const banc = finalOfTwo(reading(1, invoice()), failedReading(2));
    expect(banc.result).toEqual(production.data);
    expect(banc.result.review).toMatchObject({ status: 'unavailable', readers: 1 });
  });
  it('une lecture coupée par la limite de sortie : la phrase de coupure et le point', async () => {
    fetchMock.mockResolvedValueOnce(fetched(invoice())).mockResolvedValueOnce(fetched(invoice(), 'MAX_TOKENS'));
    const production: any = await scanInvoiceSafely('u', file, 'fake-test-key');
    const banc = finalOfTwo(reading(1, invoice()), reading(2, invoice(), STRONG_MODEL, 1000, 'MAX_TOKENS'));
    expect(banc.result).toEqual(production.data);
    expect(banc.result.points.some((point: any) => point.code === 'lecture-coupee')).toBe(true);
  });
  it('un arbitrage refusé : les divergences restent explicites', async () => {
    fetchMock.mockResolvedValueOnce(fetched(invoice('equipment'))).mockResolvedValueOnce(fetched(invoice('maintenance'))).mockResolvedValueOnce(refused(503));
    const production: any = await scanInvoiceSafely('u', file, 'fake-test-key');
    const banc = finalOfTwo(reading(1, invoice('equipment')), reading(2, invoice('maintenance')), failedReading(3));
    expect(banc.result).toEqual(production.data);
  });
});

describe('k1 — B, C et C′ se déduisent des mêmes lectures', () => {
  const ok = invoice();
  const wrongTotal = { ...invoice(), amountTTC: 118.1 }; // HT + TVA ≠ TTC : l'arithmétique le voit
  it('B : une lecture juste suffit (une seule lecture, sa durée)', () => {
    const final = finalOfB(reading(1, ok, STRONG_MODEL, 8000), reading(2, ok, STRONG_MODEL, 9000));
    expect(final.used.map(read => read.meta.id)).toEqual(['A1']);
    expect(final.ms).toBe(8000);
    expect(final.result.review).toMatchObject({ status: 'checked', readers: 1 });
  });
  it('B : l’arithmétique en échec appelle la lecture 2, durée en séquence', () => {
    const final = finalOfB(reading(1, wrongTotal, STRONG_MODEL, 8000), reading(2, wrongTotal, STRONG_MODEL, 9000));
    expect(final.used.map(read => read.meta.id)).toEqual(['A1', 'A2']);
    expect(final.ms).toBe(17000);
    expect(final.result.review.readers).toBe(2);
  });
  it('B : la date absente seule ne déclenche pas la lecture 2', () => {
    const final = finalOfB(reading(1, { ...ok, date: '' }), reading(2, ok));
    expect(final.used).toHaveLength(1);
    expect(final.result.review.status).toBe('disputed');
  });
  it('B : divergence après deux lectures, lecture 3 et vote ; durée = somme', () => {
    const a1 = reading(1, { ...wrongTotal }, STRONG_MODEL, 8000), a2 = reading(2, { ...ok }, STRONG_MODEL, 9000), a3 = reading(3, ok, STRONG_MODEL, 7000);
    const final = finalOfB(a1, a2, a3);
    expect(final.used.map(read => read.meta.id)).toEqual(['A1', 'A2', 'A3']);
    expect(final.ms).toBe(24000);
    expect(final.result.amountTTC).toBe(108.1);
  });
  it('A : le plus long des deux appels parallèles, puis la 3ᵉ lecture', () => {
    const final = finalOfTwo(reading(1, wrongTotal, STRONG_MODEL, 8000), reading(2, ok, STRONG_MODEL, 9000), reading(3, ok, STRONG_MODEL, 7000));
    expect(final.ms).toBe(16000);
  });
  it('C : deux lectures lite qui concordent n’appellent pas la 3.8 ; C′ l’appelle si l’arithmétique échoue', () => {
    const l1 = reading(1, wrongTotal, LITE_MODEL, 3000), l2 = reading(2, wrongTotal, LITE_MODEL, 3500), s3 = reading(3, ok, STRONG_MODEL, 7000);
    expect(needsThird(l1, l2)).toBe(false);
    expect(finalOfTwo(l1, l2).used).toHaveLength(2);
    const cp = finalOfCprime(l1, l2, s3);
    expect(cp.used.map(read => read.meta.lecture)).toEqual([1, 2, 3]);
    expect(cp.ms).toBe(3500 + 7000);
  });
  it('C′ sans arithmétique en échec ne prend pas la 3.8', () => {
    const l1 = reading(1, ok, LITE_MODEL), l2 = reading(2, ok, LITE_MODEL), s3 = reading(3, ok);
    expect(finalOfCprime(l1, l2, s3).used).toHaveLength(2);
  });
});

describe('k1 — le jugement', () => {
  const good = { vendor: 'Fournisseur SA', documentType: 'invoice', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'f-42', orderNumber: '', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: 0.081, paymentEvidence: 'unknown',
    items: [{ name: 'ARTICLE rouge', kind: 'stock', quantity: 2, unit: 'Pièce', price: 54.05, amountTTC: 108.1 }] };
  it('un résultat juste n’a aucun champ faux (casse, accents, pièces, centime)', () => {
    const verdict = judgeResult({ ...good, vendor: 'FOURNISSEUR', amountTTC: 108.1000001, items: [{ ...good.items[0], unit: 'pce' }] }, truth.expected);
    expect(verdict.wrong).toEqual([]);
    expect(verdict.lineRight).toBe(1);
  });
  it('une date inventée, un total faux, une unité fausse sont retrouvés par leur chemin', () => {
    const verdict = judgeResult({ ...good, date: '01.01.2000', amountTTC: 108.2, items: [{ ...good.items[0], unit: 'x' }] }, truth.expected);
    expect(verdict.wrong.sort()).toEqual(['amountTTC', 'date', 'items.0.unit']);
    expect(verdict.lineRight).toBe(0);
  });
  it('null attendu = rien d’inventé ; une alternative de fournisseur suffit ; une date non imprimée reste vide', () => {
    const expected = { vendor: ['alpha', 'beta'], date: null, amountHT: null, tvaAmount: null, amountTTC: 10, items: [{ name: 'x', amountTTC: 10 }] };
    expect(judgeResult({ vendor: 'Beta SA', date: '', amountHT: null, tvaAmount: null, amountTTC: 10, items: [{ name: 'x', amountTTC: 10 }] }, expected).wrong).toEqual([]);
    expect(judgeResult({ vendor: 'Gamma', date: '01.01.2026', amountHT: 5, tvaAmount: null, amountTTC: 10, items: [{ name: 'x', amountTTC: 10 }] }, expected).wrong.sort()).toEqual(['amountHT', 'date', 'vendor']);
  });
  it('un paiement affirmé sans être attendu est inventé, « unknown » est prudent', () => {
    expect(judgeResult({ ...good, paymentEvidence: 'paid' }, truth.expected).wrong).toEqual(['paymentEvidence']);
    expect(judgeResult({ ...good, paymentEvidence: 'unknown' }, { ...truth.expected, paymentEvidence: ['paid'] }).wrong).toEqual([]);
  });
  it('le nombre de lignes compte', () => {
    expect(judgeResult({ ...good, items: [] }, truth.expected).wrong).toEqual(expect.arrayContaining(['items.count', 'items.0']));
  });
});

describe('k1 — la simulation éprouve le jugement (témoin négatif) sans réseau ni clé', () => {
  const cases = ['doc2', 'doc5'].map(truthOf);
  const plan: Fault[] = [
    { id: 'date-fausse', doc: 'doc2', tirage: 1, families: ['f1', 'f2'], edits: [{ path: 'date', value: '01.01.2000' }], note: 'fausse date lue deux fois' },
    { id: 'unite-x', doc: 'doc5', tirage: 1, families: ['l1', 'l2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'unité inventée' },
    { id: 'total-diverge', doc: 'doc5', tirage: 2, families: ['f1'], edits: [{ path: 'amountTTC', delta: 10 }], note: 'un total lu autrement, la 3ᵉ lecture tranche' }
  ];
  it('les fausses réponses fabriquées sont comptées fausses, les parcours propres ne le sont pas', async () => {
    const readKey = vi.fn(() => { throw new Error('la clé ne se lit jamais en simulation'); });
    const before = globalThis.fetch;
    const out = path.join(work, 'sim');
    const { records, faults } = await runBench({ mode: 'simuler', repeat: 3, out, faults: true }, { cases, plan, readKey, log: () => {} });
    expect(readKey).not.toHaveBeenCalled();
    expect(globalThis.fetch).toBe(before);
    expect(fetchMock).not.toHaveBeenCalled();
    const { draws } = judgeBench(records, cases);
    const check = checkSimulation(records, draws, faults);
    expect(check.present).toBeGreaterThan(0);
    expect(check.found).toBe(check.present);
    expect(check.cleanWrong).toEqual([]);
    // la fausse date de doc2 traverse A et B en « checked » : deux faux verts au moins ; l'unité x traverse C et C′
    const fauxVerts = draws.filter(item => item.status === 'checked' && item.wrong.length);
    expect(fauxVerts.map(item => `${item.doc}/${item.variant}`)).toEqual(expect.arrayContaining(['doc2/A', 'doc2/B', 'doc5/C', 'doc5/Cp']));
    expect(check.ok).toBe(true);
    expect(existsSync(path.join(out, 'results.json'))).toBe(true);
    expect(readFileSync(path.join(out, 'journal-gemini.md'), 'utf8')).toContain('SIMULÉ');
  });
  it('sans faute fabriquée, le jugement ne trouve rien à redire', async () => {
    const { records } = await runBench({ mode: 'simuler', repeat: 2, out: path.join(work, 'propre'), faults: false }, { cases, log: () => {} });
    const { stats } = judgeBench(records, cases);
    for (const variant of ['A', 'B', 'C', 'Cp'] as const) {
      expect(stats[variant].right).toBe(stats[variant].judged);
      expect(stats[variant].fauxVerts + stats[variant].alertesJustes).toBe(0);
      expect(stats[variant].vraisVerts).toBe(records.length);
    }
  });
  it('un banc qui recopie l’image absente ne lit jamais functions/.env ni .secret.local', () => {
    const source = readFileSync(path.join(__dirname, '../../scripts/banc-lecture-facture.ts'), 'utf8');
    expect(source).not.toMatch(/\.env['"`]/);
    expect(source).not.toContain('.secret.local');
  });
});

describe('k1 — le transport réel (fetch simulé : aucun réseau)', () => {
  it('appelle generateContent d’un modèle admis, clé en en-tête seulement, jamais dans l’URL ni dans l’erreur', async () => {
    const key = 'cle-123-de-test';
    const refusal = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: { message: `${key} refusée` } }) }));
    const transport = realTransport(key, refusal as any);
    const error: any = await transport(STRONG_MODEL, { a: 1 }, meta(1), new AbortController().signal).catch(e => e);
    expect(error.httpStatus).toBe(429);
    expect(String(error.message)).not.toContain(key);
    const [url, init] = refusal.mock.calls[0] as any;
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${STRONG_MODEL}:generateContent`);
    expect(url).not.toContain(key);
    expect(init.headers['x-goog-api-key']).toBe(key);
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
    await expect(transport('gemini-9-inconnu', {}, meta(1), new AbortController().signal)).rejects.toThrow('refusé');
    expect(refusal).toHaveBeenCalledTimes(1);
  });
  it('rend la réponse et la durée mesurée', async () => {
    const ok = vi.fn(async () => ({ ok: true, status: 200, json: async () => answer(invoice()) }));
    const result = await realTransport('k', ok as any)(LITE_MODEL, {}, meta(1, LITE_MODEL, 'C'), new AbortController().signal);
    expect(result.json.candidates[0].finishReason).toBe('STOP');
    expect(result.ms).toBeGreaterThanOrEqual(0);
  });
});

describe('k1 — le budget : réservé avant, arrêt net, clé jamais écrite', () => {
  const cases = [truthOf('doc2')];
  it('réserve au pire avant l’appel et refuse ce qui dépasserait', () => {
    expect(reservationMicro(STRONG_MODEL)).toBeGreaterThan(reservationMicro(LITE_MODEL));
    const budget = new Budget(100_000);
    budget.reserve(60_000);
    expect(() => budget.reserve(60_000)).toThrow(BudgetStop);
    budget.settle(60_000, 10_000);
    expect(budget.spentMicro).toBe(10_000);
    budget.reserve(60_000);
    budget.settle(60_000, null);
    expect(budget.spentMicro).toBe(70_000);
  });
  it('un budget trop petit arrête le banc avant le deuxième appel de la paire, sans dépassement', async () => {
    const calls: string[] = [];
    const key = 'cle-secrete-de-test-ne-doit-jamais-apparaitre';
    const out = path.join(work, 'payant'), journalPath = path.join(work, 'journal.md');
    const transport = vi.fn(async (model: string, _body: any, m: ReadMeta) => { calls.push(m.id); return simulateResponse(cases[0], m, [], []); });
    const run = await runBench({ mode: 'payant', repeat: 3, out, budgetChf: 0.1, faults: false }, { cases, plan: [], readKey: () => key, optIn: () => {}, readFile: () => file, transport, journalPath, log: () => {} });
    expect(run.stopped).toMatch(/Budget atteint/);
    expect(calls).toEqual(['A1']);
    const results = JSON.parse(readFileSync(path.join(out, 'results.json'), 'utf8'));
    expect(results.meta.spentChf).toBeLessThanOrEqual(0.1);
    expect(results.meta.stopped).toMatch(/Budget atteint/);
    const journal = readFileSync(journalPath, 'utf8');
    expect(journal.split('\n').filter(line => line.startsWith('| 20'))).toHaveLength(1);
    for (const name of [journalPath, path.join(out, 'results.json'), ...readdirSync(path.join(out, 'raw')).map(item => path.join(out, 'raw', item))]) expect(readFileSync(name, 'utf8')).not.toContain(key);
  });
  it('un budget suffisant mène tout à terme ; la dépense journalisée est reprise par la passe suivante', async () => {
    const out = path.join(work, 'plein'), journalPath = path.join(work, 'journal-plein.md');
    const transport = async (_model: string, _body: any, m: ReadMeta) => simulateResponse(cases[0], m, [], []);
    const first = await runBench({ mode: 'payant', repeat: 2, out, budgetChf: BUDGET_CAP_CHF, faults: false }, { cases, plan: [], readKey: () => 'k', optIn: () => {}, readFile: () => file, transport, journalPath, log: () => {} });
    expect(first.stopped).toBeUndefined();
    expect(first.records).toHaveLength(2);
    const spent = spentInJournal(journalPath);
    expect(spent).toBeGreaterThan(0);
    const results = JSON.parse(readFileSync(path.join(out, 'results.json'), 'utf8'));
    expect(Math.round(results.meta.spentChf * 1e6)).toBe(spent);
    const again = await runBench({ mode: 'payant', repeat: 1, out: path.join(work, 'suite'), budgetChf: BUDGET_CAP_CHF, faults: false }, { cases, plan: [], readKey: () => 'k', optIn: () => {}, readFile: () => file, transport, journalPath, log: () => {} });
    expect(again.records).toHaveLength(1);
    expect(spentInJournal(journalPath)).toBeGreaterThan(spent);
  });
  it('trois échecs d’affilée arrêtent le banc', async () => {
    const transport = vi.fn(async () => { throw Object.assign(new Error('Gemini HTTP 429'), { httpStatus: 429 }); });
    const run = await runBench({ mode: 'payant', repeat: 3, out: path.join(work, 'echecs'), budgetChf: BUDGET_CAP_CHF, faults: false }, { cases, plan: [], readKey: () => 'k', optIn: () => {}, readFile: () => file, transport, journalPath: path.join(work, 'j.md'), log: () => {} });
    expect(transport.mock.calls.length).toBeLessThanOrEqual(4);
    expect(run.stopped).toMatch(/Trois appels en échec/);
  });
  it('une clé absente refuse tout appel', async () => {
    await expect(runBench({ mode: 'payant', repeat: 1, out: path.join(work, 'sans-cle'), budgetChf: 1, faults: false }, { cases, readKey: () => undefined, optIn: () => {}, readFile: () => file, journalPath: path.join(work, 'j2.md'), log: () => {} })).rejects.toThrow('Aucune clé');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('--payant exige un budget, au plus 4,5 CHF ; les deux modes s’excluent', () => {
    expect(() => parseArgs(['--payant'])).toThrow('--budget-chf');
    expect(() => parseArgs(['--payant', '--budget-chf', '5'])).toThrow('--budget-chf');
    expect(() => parseArgs(['--payant', '--simuler', '--budget-chf', '4.5'])).toThrow('s’excluent');
    expect(parseArgs(['--', '--payant', '--budget-chf', '4.5']).budgetChf).toBe(4.5);
    expect(parseArgs(['--', '--simuler', '--out', 'x']).mode).toBe('simuler');
    expect(parseArgs(['--simuler']).repeat).toBe(3);
  });
  it('le journal de la passe suivante relit les coûts qu’il a écrits', () => {
    const journal = path.join(work, 'journal-relu.md');
    appendJournal(journal, reading(1, invoice()), 1000, false);
    appendJournal(journal, reading(2, invoice()), 2000, false);
    expect(spentInJournal(journal)).toBe(2000);
    const lines = readFileSync(journal, 'utf8').split('\n').filter(line => line.startsWith('| 20'));
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toContain('Fournisseur');
  });
});

// =====================================================================================================================
// k2 — Flash-Lite mieux lu : la 3.8 qui tranche seule (C★, C★′), la réflexion (Lm, Lh), la consigne (Lp), la normalisation (N)
// =====================================================================================================================
const liteRead = (lecture: 1 | 2, data: any, ms = 3000, group = 'C') => readingFromResponse(meta(lecture, LITE_MODEL, group), answer(data), ms, 1000);
const strongThird = (data: any, ms = 7000) => readingFromResponse(meta(3, STRONG_MODEL, 'A'), answer(data), ms, 1000);

describe('k2 — C★ et C★′ : le résultat de la 3.8 tranche seul', () => {
  const ok = invoice(), wrongTotal = { ...invoice(), amountTTC: 118.1 };
  const wrongQty = { ...invoice(), items: [{ ...invoice().items[0], quantity: 7 }] };
  it('C★ : une divergence appelle la 3.8, dont le résultat remplace le vote ; durée = le plus long des deux Flash-Lite puis la 3.8', () => {
    const l1 = liteRead(1, ok, 3000), l2 = liteRead(2, wrongQty, 3500), third = strongThird(ok, 7000);
    expect(needsThird(l1, l2)).toBe(true);
    const star = finalOfStar(l1, l2, third);
    expect(star.used.map(read => read.meta.id)).toEqual(['C1', 'C2', 'A3']);
    expect(star.ms).toBe(3500 + 7000);
    expect(star.result.items[0].quantity).toBe(2);
    expect(star.result.review).toMatchObject({ status: 'checked', readers: 3 });
  });
  it('la 3.8 tranche SEULE : quand les trois lectures diffèrent, le vote garde la première, C★ prend la 3.8', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, wrongTotal), third = strongThird({ ...invoice(), amountTTC: 128.1 });
    const vote = finalOfTwo(l1, l2, third), star = finalOfStar(l1, l2, third);
    expect(vote.result.amountTTC).toBe(108.1);
    expect(vote.result.review.status).toBe('disputed');
    expect(star.result.amountTTC).toBe(128.1);
  });
  it('C★′ : deux Flash-Lite qui concordent à tort mais dont l’arithmétique échoue — la 3.8 gagne seule, là où le vote de C′ garde les deux Flash-Lite', () => {
    const l1 = liteRead(1, wrongTotal), l2 = liteRead(2, wrongTotal), third = strongThird(ok);
    expect(needsThird(l1, l2)).toBe(false);
    const cp = finalOfCprime(l1, l2, third), csp = finalOfStarPrime(l1, l2, third);
    expect(cp.used).toHaveLength(3);
    expect(cp.result.amountTTC).toBe(118.1);
    expect(csp.used.map(read => read.meta.id)).toEqual(['C1', 'C2', 'A3']);
    expect(csp.result.amountTTC).toBe(108.1);
    expect(csp.result.review.status).toBe('checked');
    // C★ (sans la garde arithmétique) n’appelle pas la 3.8 : même 2 lectures que C
    const star = finalOfStar(l1, l2, third);
    expect(star.used).toHaveLength(2);
    expect(star.result.amountTTC).toBe(118.1);
  });
  it('sans 3.8 exploitable, le repli est le parcours de C : la coupure est comptée, jamais un résultat inventé', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, wrongQty), refused = failedReading(3);
    const star = finalOfStar(l1, l2, refused), vote = finalOfTwo(l1, l2, refused);
    expect(star.result).toEqual(vote.result);
    expect(star.result.points.some((point: any) => point.code === 'lecture-coupee')).toBe(true);
    expect(finalOfStar(l1, l2, undefined).result).toEqual(finalOfTwo(l1, l2).result);
  });
  it('sans désaccord ni contrôle en échec, C★ et C★′ rendent le parcours de C', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, ok), third = strongThird(ok);
    expect(finalOfStar(l1, l2, third).result).toEqual(finalOfTwo(l1, l2).result);
    expect(finalOfStarPrime(l1, l2, third).used).toHaveLength(2);
  });
  it('la 3.8 qui tranche est une lecture seule : un point qui pèse reste « disputed »', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, wrongQty), third = strongThird({ ...ok, date: '' });
    expect(finalOfStar(l1, l2, third).result.review.status).toBe('disputed');
  });
});

describe('k2 — C★v : les valeurs de la 3.8, le statut du vote', () => {
  const ok = invoice(), wrongTotal = { ...invoice(), amountTTC: 118.1 };
  // une lecture de la 3.8 dont l’arithmétique tient : aucun point ne pèse, elle seule finirait « checked »
  const consistent = { ...invoice(), amountHT: 111, tvaAmount: 8.99, amountTTC: 119.99, items: [{ name: 'Article', kind: 'stock', quantity: 1, unit: 'pièce', price: 119.99, amountTTC: 119.99 }] };
  const wrongQty = { ...invoice(), items: [{ ...invoice().items[0], quantity: 7 }] };
  it('les trois lectures divergent : la 3.8 donne les valeurs (comme C★) et le statut « disputed » du vote est gardé (comme C)', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, wrongTotal), third = strongThird(consistent);
    const star = finalOfStar(l1, l2, third), vote = finalOfTwo(l1, l2, third), v = finalOfStarVote(l1, l2, third);
    expect(star.result.review.status).toBe('checked'); // C★ efface le désaccord : le faux vert
    expect(vote.result.review.status).toBe('disputed');
    expect(v.result.amountTTC).toBe(119.99);
    expect(v.result.review.status).toBe('disputed');
    expect(v.result.review.findings).toEqual(vote.result.review.findings);
    expect(v.used.map(read => read.meta.id)).toEqual(['C1', 'C2', 'A3']);
    expect(v.ms).toBe(star.ms);
    expect(v.result.points.some((point: any) => point.source === 'désaccord' && point.pese)).toBe(true);
  });
  it('la 3.8 tranche un désaccord : les valeurs sont les siennes, le statut celui du vote (jamais plus vert que C)', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, wrongQty), third = strongThird(ok);
    const star = finalOfStar(l1, l2, third), vote = finalOfTwo(l1, l2, third), v = finalOfStarVote(l1, l2, third);
    expect(star.result.review.status).toBe('checked');
    expect(v.result.review.status).toBe(vote.result.review.status);
    expect(v.result.items[0].quantity).toBe(2);
  });
  it('sans 3.8 appelée ou sans 3.8 exploitable, C★v rend exactement le parcours de C', () => {
    const l1 = liteRead(1, ok), l2 = liteRead(2, ok);
    expect(finalOfStarVote(l1, l2, strongThird(ok)).result).toEqual(finalOfTwo(l1, l2).result);
    const d1 = liteRead(1, ok), d2 = liteRead(2, wrongQty);
    expect(finalOfStarVote(d1, d2, failedReading(3)).result).toEqual(finalOfTwo(d1, d2, failedReading(3)).result);
  });
  it('deriveVariants rend Csv (et sa version N) à côté de C et C★', () => {
    const reads: DrawReads = { l1: liteRead(1, ok), l2: liteRead(2, { ...ok, amountTTC: 118.1 }), cThird: strongThird(consistent), lite: {} };
    const out = deriveVariants(mapReads(reads, withCodesNormalized), new Set(['C', 'Cs', 'Csv']));
    expect(out.Csv!.final.result.review.status).toBe('disputed');
    expect(out.Cs!.final.result.review.status).toBe('checked');
    expect(out.C!.final.result.review.status).toBe('disputed');
  });
});

describe('k2 — N : la devise en code ISO, rien d’autre', () => {
  it('« Fr. », « SFr. », « CHF. » deviennent « CHF » ; une devise étrangère et l’inconnu restent tels quels', () => {
    for (const value of ['Fr.', 'SFr.', 'sfr', 'CHF.', ' chf ', 'FR']) expect(isoCurrency(value)).toBe('CHF');
    expect(isoCurrency('EUR')).toBe('EUR');
    expect(isoCurrency('Fr.s')).toBe('Fr.s');
    expect(isoCurrency(null)).toBeNull();
    expect(isoCurrency(undefined)).toBeUndefined();
  });
  it('une lecture relue avec N garde sa réponse, sa durée et son coût ; elle ne change que la devise', () => {
    const abbreviated = reading(1, { ...invoice(), currency: 'Fr.' }, LITE_MODEL, 4321);
    expect(abbreviated.normalized!.currency).toBe('FR.');
    const again = withCodesNormalized(abbreviated);
    expect(again.normalized!.currency).toBe('CHF');
    expect({ ms: again.ms, cost: again.costMicroChf, id: again.meta.id }).toEqual({ ms: 4321, cost: 1000, id: abbreviated.meta.id });
    expect({ ...again.normalized!, currency: 'x', issues: [], points: [] }).toEqual({ ...abbreviated.normalized!, currency: 'x', issues: [], points: [] });
    expect(withCodesNormalized(failedReading(1))).toBeDefined();
  });
  it('une abréviation d’un côté, « CHF » de l’autre : un désaccord sans N, un accord avec N — la 3.8 n’est plus demandée', () => {
    const l1 = liteRead(1, { ...invoice(), currency: 'Fr.' }), l2 = liteRead(2, invoice());
    expect(needsThird(l1, l2)).toBe(true);
    const reads: DrawReads = { l1, l2, cThird: strongThird(invoice()), cpThird: strongThird(invoice()), lite: {} };
    const plain = deriveVariants(reads, new Set(['C', 'Cs'])), normalised = deriveVariants(mapReads(reads, withCodesNormalized), new Set(['C', 'Cs']));
    expect(plain.C!.final.used).toHaveLength(3);
    expect(normalised.C!.final.used).toHaveLength(2);
    expect(normalised.Cs!.final.result.currency).toBe('CHF');
  });
});

describe('k2 — les réglages d’appel : plafond relevé et réflexion pour Lm et Lh seuls', () => {
  it('A, C et Lp gardent le plafond de production ; Lm et Lh le relèvent à 8 192, avec medium et high', () => {
    expect(callSpec('A', 1)).toMatchObject({ model: STRONG_MODEL, thinking: 'LOW', maxOut: 5100 });
    expect(callSpec('C', 2)).toMatchObject({ model: LITE_MODEL, thinking: 'LOW', maxOut: 5100 });
    expect(callSpec('Lp', 1)).toMatchObject({ model: LITE_MODEL, thinking: 'LOW', maxOut: 5100 });
    expect(callSpec('Lm', 1)).toMatchObject({ model: LITE_MODEL, thinking: 'MEDIUM', maxOut: LITE_RAISED_OUTPUT });
    expect(callSpec('Lh', 2)).toMatchObject({ model: LITE_MODEL, thinking: 'HIGH', maxOut: LITE_RAISED_OUTPUT });
    expect(LITE_RAISED_OUTPUT).toBe(8192);
    for (const group of ['A', 'C', 'Lm', 'Lh', 'Lp']) expect(callSpec(group, 3)).toMatchObject({ model: STRONG_MODEL, thinking: 'LOW', maxOut: 5100, prompt: INVOICE_SCAN_PROMPTS[2] });
    expect(() => callSpec('Z', 1)).toThrow('Groupe inconnu');
  });
  it('le corps de production ne bouge pas : LOW et 5 100 par défaut ; la réflexion et le plafond ne changent que ces deux champs', () => {
    const base = buildReadBody(file, INVOICE_SCAN_PROMPTS[0]) as any, high = buildReadBody(file, INVOICE_SCAN_PROMPTS[0], 8192, 'HIGH') as any;
    expect(base.generationConfig).toMatchObject({ maxOutputTokens: 5100, thinkingConfig: { thinkingLevel: 'LOW' } });
    expect(high.generationConfig).toMatchObject({ maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: 'HIGH' } });
    expect({ ...high, generationConfig: { ...high.generationConfig, maxOutputTokens: 5100, thinkingConfig: base.generationConfig.thinkingConfig } }).toEqual(base);
  });
  it('la réserve du budget suit le plafond de CET appel', () => {
    expect(reservationMicro(LITE_MODEL, LITE_RAISED_OUTPUT)).toBeGreaterThan(reservationMicro(LITE_MODEL));
    expect(reservationMicro(LITE_MODEL)).toBe(reservationMicro(LITE_MODEL, 5100));
  });
});

describe('k2 — la consigne propre à Flash-Lite (Lp)', () => {
  it('des règles génériques : aucune valeur, aucun chiffre, courtes ; la consigne de production d’abord', () => {
    expect(LITE_RULES.length).toBeGreaterThanOrEqual(5);
    for (const rule of LITE_RULES) { expect(rule).not.toMatch(/[0-9]/); expect(rule.length).toBeLessThan(300); }
    expect(liteConsigne(1).startsWith(INVOICE_SCAN_PROMPTS[0])).toBe(true);
    expect(liteConsigne(2).startsWith(INVOICE_SCAN_PROMPTS[1])).toBe(true);
    expect(liteConsigne(1)).toContain(LITE_RULES_BLOCK);
  });
  it('ne recopie aucune valeur des documents du banc (fournisseur, numéro, désignation de ligne)', () => {
    const cases = (() => { try { return loadCases(); } catch { return []; } })();
    const words: string[] = [];
    for (const c of cases) {
      const e = c.expected;
      for (const value of [...(Array.isArray(e.vendor) ? e.vendor : [e.vendor]), ...(Array.isArray(e.invoiceNumber) ? e.invoiceNumber : [e.invoiceNumber]), e.orderNumber, ...(e.items ?? []).map((item: any) => item.name)])
        if (typeof value === 'string' && value.trim().length >= 5) words.push(value.trim().toLowerCase());
    }
    const block = LITE_RULES_BLOCK.toLowerCase();
    for (const word of words) expect(block).not.toContain(word);
  });
  it('n’est jamais envoyée à A ni à la 3ᵉ lecture ; seules les lectures 1 et 2 de Lp la portent ; la production ne l’importe pas', async () => {
    const cases = [truthOf('doc2')];
    const sent: Array<{ id: string; group: string; lecture: number; text: string; max: number; thinking: string }> = [];
    const transport = async (_model: string, body: any, m: ReadMeta) => { sent.push({ id: m.id, group: m.variant, lecture: m.lecture, text: body.contents[0].parts[0].text, max: body.generationConfig.maxOutputTokens, thinking: body.generationConfig.thinkingConfig.thinkingLevel }); return simulateResponse(cases[0], m, plan, []); };
    // Lp : les deux lectures divergent (la 3.8 est appelée) ; A : les deux 3.8 divergent aussi (sa 3ᵉ lecture est appelée)
    const plan: Fault[] = [{ id: 'p', doc: 'doc2', tirage: 1, families: ['p2'], edits: [{ path: 'items.0.quantity', value: 7 }], note: '' }, { id: 'f', doc: 'doc2', tirage: 1, families: ['f2'], edits: [{ path: 'items.0.quantity', value: 7 }], note: '' }];
    await runBench({ mode: 'simuler', repeat: 1, out: path.join(work, 'lp'), faults: true, variantes: ['A', 'B', 'Lp'] }, { cases, plan, transport, log: () => {} });
    expect(sent.map(item => item.id)).toEqual(expect.arrayContaining(['A1', 'A2', 'A3', 'Lp1', 'Lp2']));
    for (const item of sent.filter(call => call.group === 'A' || call.lecture === 3)) {
      expect(item.text).toBe(INVOICE_SCAN_PROMPTS[item.lecture - 1]);
      expect(item.text).not.toContain(LITE_RULES_TITLE);
    }
    for (const item of sent.filter(call => call.group === 'Lp' && call.lecture !== 3)) expect(item.text).toBe(liteConsigne(item.lecture as 1 | 2));
    expect(sent.filter(call => call.text.includes(LITE_RULES_TITLE)).every(call => call.group === 'Lp' && call.lecture !== 3)).toBe(true);
    expect(sent.some(call => call.text.includes(LITE_RULES_TITLE))).toBe(true);
    // la production ne connaît pas le module
    for (const name of readdirSync(path.join(__dirname, '../../functions/src'), { recursive: true }) as string[])
      if (/\.ts$/.test(name)) expect(readFileSync(path.join(__dirname, '../../functions/src', name), 'utf8')).not.toContain('banc-lecture-consignes-lite');
  });
  it('seuls Lm et Lh relèvent le plafond de sortie et lisent en medium et en high ; la 3.8 reste LOW à 5 100', async () => {
    const cases = [truthOf('doc2')];
    const seen = new Map<string, string>();
    const plan: Fault[] = ['m2', 'h2', 'p2', 'l2'].map(family => ({ id: family, doc: 'doc2', tirage: 1, families: [family as any], edits: [{ path: 'items.0.quantity', value: 7 }], note: '' }));
    const transport = async (_model: string, body: any, m: ReadMeta) => { seen.set(m.id, `${m.model}|${body.generationConfig.thinkingConfig.thinkingLevel}|${body.generationConfig.maxOutputTokens}`); return simulateResponse(cases[0], m, plan, []); };
    await runBench({ mode: 'simuler', repeat: 1, out: path.join(work, 'plafonds'), faults: true, variantes: ['C', 'Lm', 'Lh', 'Lp'] }, { cases, plan, transport, log: () => {} });
    expect(Object.fromEntries(seen)).toMatchObject({
      C1: `${LITE_MODEL}|LOW|5100`, C2: `${LITE_MODEL}|LOW|5100`, Lm1: `${LITE_MODEL}|MEDIUM|8192`, Lm2: `${LITE_MODEL}|MEDIUM|8192`,
      Lh1: `${LITE_MODEL}|HIGH|8192`, Lh2: `${LITE_MODEL}|HIGH|8192`, Lp1: `${LITE_MODEL}|LOW|5100`, Lp2: `${LITE_MODEL}|LOW|5100`
    });
    // une seule 3.8 pour les quatre groupes qui divergent (partagée), toujours LOW à 5 100
    const thirds = [...seen].filter(([id]) => /3$/.test(id));
    expect(thirds).toHaveLength(1);
    expect(thirds[0][1]).toBe(`${STRONG_MODEL}|LOW|5100`);
  });
});

describe('k2 — le prêt d’appels (--reprendre) et le hors-ligne', () => {
  const cases = [truthOf('doc2')];
  // doc2, tirage 1 : la lecture 2 de C diverge → C appelle la 3.8 (neuve, 'C3')
  const plan: Fault[] = [{ id: 'c', doc: 'doc2', tirage: 1, families: ['l2'], edits: [{ path: 'items.0.quantity', value: 7 }], note: '' },
    { id: 'm', doc: 'doc2', tirage: 1, families: ['m2'], edits: [{ path: 'items.0.quantity', value: 7 }], note: '' }];
  async function firstPass() {
    const out = path.join(work, 'k1');
    const run = await runBench({ mode: 'simuler', repeat: 2, out, faults: true }, { cases, plan, log: () => {} }); // les quatre de k1 par défaut
    return { out, run };
  }
  it('Cs et Lm : les Flash-Lite de C et la 3.8 sont prêtées (ni payées ni journalisées) ; seuls Lm1 et Lm2 sont appelés', async () => {
    const { out } = await firstPass();
    const calls: string[] = [];
    const transport = async (_model: string, _body: any, m: ReadMeta) => { calls.push(m.id); return simulateResponse(cases[0], m, plan, []); };
    const second = path.join(work, 'k2');
    const { records } = await runBench({ mode: 'simuler', repeat: 2, out: second, faults: true, variantes: ['Cs', 'Lm'], reprendre: out }, { cases, plan, transport, log: () => {} });
    expect(calls.sort()).toEqual(['Lm1', 'Lm1', 'Lm2', 'Lm2']);
    const first = records.find(record => record.tirage === 1)!;
    expect(first.readings.filter(read => read.lent).map(read => read.meta.id).sort()).toEqual(['C1', 'C2', 'C3']);
    expect(first.variants.Cs.thirdFrom).toBe('k1');
    expect(first.variants.Lm.thirdFrom).toBe('k1');
    expect(first.variants.Lm.calls).toBe(3);
    const journal = readFileSync(path.join(second, 'journal-gemini.md'), 'utf8').split('\n').filter(line => line.startsWith('| 20'));
    expect(journal).toHaveLength(4);
    expect(journal.join('\n')).not.toMatch(/\| C \| [123] \|/);
    const results = JSON.parse(readFileSync(path.join(second, 'results.json'), 'utf8'));
    expect(results.meta.reprendre).toBe('k1');
    expect(JSON.stringify(results)).not.toContain('"raw"');
  });
  it('--hors-ligne : aucune clé lue, aucun réseau, aucun appel ; A et C rendent exactement le résultat de la passe prêtée', async () => {
    const { out, run } = await firstPass();
    const readKey = vi.fn(() => 'jamais');
    const transport = vi.fn();
    const offline = await runBench({ mode: 'hors-ligne', repeat: 2, out: path.join(work, 'hl'), faults: false, variantes: ['A', 'B', 'C', 'Cp', 'Cs', 'Csp'], normaliser: true, reprendre: out }, { cases, readKey, transport: transport as any, log: () => {} });
    expect(readKey).not.toHaveBeenCalled();
    expect(transport).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    for (const record of offline.records) {
      const before = run.records.find(item => item.doc === record.doc && item.tirage === record.tirage)!;
      for (const id of ['A', 'B', 'C', 'Cp'] as const) expect(record.variants[id].result).toEqual(before.variants[id].result);
      expect(record.variants['Cs+N']).toBeDefined();
    }
  });
  it('--hors-ligne : une lecture absente de la sortie prêtée est une erreur, jamais un appel', async () => {
    const { out } = await firstPass();
    await expect(runBench({ mode: 'hors-ligne', repeat: 1, out: path.join(work, 'hl2'), faults: false, variantes: ['Lm'], reprendre: out }, { cases, log: () => {} })).rejects.toThrow('Hors ligne');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('le prêteur rend A, C et la 3ᵉ lecture (A3, C3…) du même document et du même tirage, rien d’autre', async () => {
    const { out } = await firstPass();
    const lender = loadLender(out);
    expect(lender('doc2', 1, ['C1'])?.id).toBe('C1');
    expect(lender('doc2', 1, THIRD_IDS)?.id).toBe('C3');
    expect(lender('doc2', 2, THIRD_IDS)).toBeUndefined();
    expect(lender('doc9', 1, ['C1'])).toBeUndefined();
    expect(lender('doc2', 1, ['Lm1'])).toBeUndefined();
  });
});

describe('k2 — payant : la réserve suit le plafond relevé et l’arrêt est net', () => {
  it('un budget qui ne couvre qu’une réserve de Lm arrête le banc avant la seconde lecture, sans dépassement', async () => {
    const cases = [truthOf('doc2')];
    const calls: string[] = [];
    const transport = async (_model: string, _body: any, m: ReadMeta) => { calls.push(m.id); return simulateResponse(cases[0], m, [], []); };
    const budget = (reservationMicro(LITE_MODEL, LITE_RAISED_OUTPUT) * 1.5) / 1e6;
    const run = await runBench({ mode: 'payant', repeat: 1, out: path.join(work, 'lm'), budgetChf: budget, faults: false, variantes: ['Lm'] }, { cases, plan: [], readKey: () => 'k', optIn: () => {}, readFile: () => file, transport, journalPath: path.join(work, 'jl.md'), log: () => {} });
    expect(run.stopped).toMatch(/Budget atteint/);
    expect(calls).toEqual(['Lm1']);
  });
  it('--variantes, --reprendre, --hors-ligne et --normaliser se lisent ; une variante inconnue ou un hors-ligne sans prêt est refusé', () => {
    expect(parseArgs(['--simuler']).variantes).toBeUndefined();
    expect(parseArgs(['--simuler', '--variantes', 'Cs,Csp,Lm,Lm']).variantes).toEqual(['Cs', 'Csp', 'Lm']);
    expect(parseArgs(['--payant', '--budget-chf', '3', '--variantes', 'Lm,Lh', '--reprendre', 'x', '--normaliser'])).toMatchObject({ mode: 'payant', reprendre: 'x', normaliser: true, budgetChf: 3 });
    expect(() => parseArgs(['--simuler', '--variantes', 'Z'])).toThrow('--variantes');
    expect(() => parseArgs(['--hors-ligne'])).toThrow('--reprendre');
    expect(parseArgs(['--hors-ligne', '--reprendre', 'x']).mode).toBe('hors-ligne');
    expect(() => parseArgs(['--hors-ligne', '--simuler', '--reprendre', 'x'])).toThrow('s’excluent');
    expect(K1_VARIANTS).toEqual(['A', 'B', 'C', 'Cp']);
    expect(orderVariants(['Lm+N', 'Cs', 'A+N', 'A', 'Cp'])).toEqual(['A', 'A+N', 'Cp', 'Cs', 'Lm+N']);
  });
});

describe('k2 — la simulation éprouve le jugement sur toutes les variantes (témoin négatif)', () => {
  const docs = ['doc1', 'doc3', 'doc4', 'doc5', 'doc6', 'doc7'].map(truthOf);
  it('retrouve chaque fausse réponse fabriquée, aucune sur les parcours propres ; l’unité inventée par Lm est un faux vert ; N rattrape « Fr. »', async () => {
    const out = path.join(work, 'toutes');
    const { records, faults } = await runBench({ mode: 'simuler', repeat: 3, out, faults: true, variantes: [...VARIANTS], normaliser: true }, { cases: docs, plan: FAULT_PLAN, log: () => {} });
    expect(variantIds(records)).toHaveLength(VARIANTS.length * 2);
    const { draws, stats } = judgeBench(records, docs);
    const check = checkSimulation(records, draws, faults);
    expect(check.present).toBeGreaterThan(0);
    expect(check.found).toBe(check.present);
    expect(check.cleanWrong).toEqual([]);
    expect(check.ok).toBe(true);
    expect(draws.filter(item => item.status === 'checked' && item.wrong.length).map(item => `${item.doc}/${item.variant}`)).toEqual(expect.arrayContaining(['doc5/Lm', 'doc5/C', 'doc5/Cs']));
    // N : « Fr. » faux sans N sur doc4 au tirage 3, juste avec N
    expect(draws.find(item => item.doc === 'doc4' && item.tirage === 3 && item.variant === 'C')!.wrong).toContain('currency');
    expect(draws.find(item => item.doc === 'doc4' && item.tirage === 3 && item.variant === 'C+N')!.wrong).not.toContain('currency');
    expect(fieldDiff(draws, 'C', 'C+N').fixed).toContain('doc4 : currency');
    expect(fieldDiff(draws, 'C', 'C+N').broken).toEqual([]);
    // N ne coûte aucun appel de plus
    expect(stats['C+N'].calls.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(stats.C.calls.reduce((a, b) => a + b, 0));
    // Lm et Lh ont un plafond relevé, donc une coupure simulée « high » est comptée dans le tableau
    const table = renderTable({ meta: JSON.parse(readFileSync(path.join(out, 'results.json'), 'utf8')).meta, records }, stats, check, draws);
    expect(table).toContain('Par document');
    expect(table).toMatch(/- Lh : \d+ lectures, 1 coupée\(s\)/);
    expect(table).toContain('C★');
  });
  it('HORS-LIGNE.md : par document, C★ et N, sans aucun montant à deux décimales de trois chiffres ou plus', async () => {
    const out = path.join(work, 'hl-sim');
    const { records } = await runBench({ mode: 'simuler', repeat: 3, out, faults: true, variantes: ['A', 'C', 'Cp', 'Cs', 'Csp'], normaliser: true }, { cases: docs, plan: FAULT_PLAN, log: () => {} });
    const { draws, stats } = judgeBench(records, docs);
    const meta = JSON.parse(readFileSync(path.join(out, 'results.json'), 'utf8')).meta;
    const text = renderHorsLigne({ meta, records }, stats, draws);
    expect(text).toContain('C★′ + N');
    expect(text).toContain('| doc4 |');
    expect(text).not.toMatch(/[0-9]{3,}[.,][0-9]{2}/);
    expect([...perDocument(draws).keys()].sort()).toEqual(['doc1', 'doc3', 'doc4', 'doc5', 'doc6', 'doc7']);
  });
});
