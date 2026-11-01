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
import { checkSimulation, judgeBench, judgeResult } from '../../scripts/banc-lecture-facture-juger';

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
