// @vitest-environment node
// Full local callable -> independent vision -> budget -> reconciliation. Every external I/O is simulated.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeInvoiceScan, invoiceScanId, SCAN_MODEL } from '../../functions/src/invoiceScanCore';

const memory = vi.hoisted(() => ({ docs: new Map<string, any>(), provider: vi.fn(), transactions: Promise.resolve() as Promise<unknown> }));
function update(path: string, patch: any) {
  const result = structuredClone(memory.docs.get(path) ?? {});
  for (const [key, value] of Object.entries(patch)) {
    const parts = key.split('.'); let target = result;
    for (const part of parts.slice(0, -1)) target = target[part] ??= {};
    target[parts.at(-1)!] = structuredClone(value);
  }
  memory.docs.set(path, result);
}
function doc(path: string): any {
  return { path, get: async () => ({ data: () => structuredClone(memory.docs.get(path)) }), update: async (patch: any) => update(path, patch),
    onSnapshot: (next: any) => { next({ data: () => structuredClone(memory.docs.get(path)) }); return () => {}; } };
}
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ getFirestore: () => ({ doc,
  // Real Firestore conflicts/retries. Serializing fake transactions prevents lost reservations.
  runTransaction: (work: any) => {
    const transaction = memory.transactions.then(async () => {
      const writes: Array<() => void> = [];
      const result = await work({ get: (ref: any) => ref.get(), set: (ref: any, value: any) => writes.push(() => memory.docs.set(ref.path, structuredClone(value))), update: (ref: any, patch: any) => writes.push(() => update(ref.path, patch)) });
      writes.forEach(write => write()); return result;
    });
    memory.transactions = transaction.catch(() => undefined);
    return transaction;
  }
}) }));
let aiTask: typeof import('../../functions/src/ai')['aiTask'];
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const uid = 'synthetic-review-integration';
const invoice = (patch: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur fictif', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'F-2026-091', category: 'materiel', subcategory: 'Brassage', description: 'Fermenteur et entretien', amountHT: 508.79, tvaRate: .081, tvaAmount: 41.21, amountTTC: 550,
  items: [
    { name: 'Fermenteur inox 30 litres', kind: 'equipment', quantity: 1, unit: 'piece', price: 500, amountTTC: 500, evidence: 'Fermenteur inox 30 litres — CHF 500.00, page 1', ambiguity: '' },
    { name: 'Reparation de la pompe existante', kind: 'maintenance', quantity: null, unit: '', price: null, amountTTC: 50, evidence: 'Reparation pompe — CHF 50.00, page 1', ambiguity: '' },
    { name: 'Frais de livraison', kind: 'shipping', quantity: null, unit: '', price: null, amountTTC: 12, evidence: 'Livraison — CHF 12.00, page 1', ambiguity: '' },
    { name: 'Remise commerciale', kind: 'discount', quantity: null, unit: '', price: null, amountTTC: -12, evidence: 'Remise — CHF -12.00, page 1', ambiguity: '' }
  ], ...patch });
const withLine = (patch: Record<string, unknown>, index = 0) => {
  const result = invoice(); Object.assign(result.items[index], patch); return result;
};
const providerResult = (value: unknown, tokens: number, finishReason = 'STOP') => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(value) }] } }], usageMetadata: { promptTokenCount: Math.floor(tokens * .7), candidatesTokenCount: tokens - Math.floor(tokens * .7), thoughtsTokenCount: 0, totalTokenCount: tokens } }) });
const monthly = () => [...memory.docs].find(([path]) => /^brewerAiCosts\/\d{4}-\d{2}$/.test(path))?.[1];
const daily = () => [...memory.docs].find(([path]) => path.startsWith('brewerAiUsage/'))?.[1];
const documentScan = () => memory.docs.get(`invoiceScans/${invoiceScanId(uid, file)}`);
function arrangeReadings(readings: unknown[], options: { finishReasons?: string[]; holdFirstUntilSecond?: boolean } = {}) {
  let releaseFirst!: () => void;
  const secondStarted = new Promise<void>(resolve => { releaseFirst = resolve; });
  memory.provider.mockImplementation(async (url, init) => {
    const count = memory.provider.mock.calls.length;
    expect(String(url)).toContain(`/${SCAN_MODEL}:generateContent`);
    expect(SCAN_MODEL).toContain('flash'); expect(String(url)).not.toContain('pro');
    expect(documentScan().calls).toBeGreaterThanOrEqual(count);
    expect(documentScan().calls).toBeLessThanOrEqual(3);
    expect(monthly().reservedMicroChf).toBeGreaterThan(0);
    const request = JSON.parse(init.body);
    expect(request.contents[0].parts[1].inlineData).toEqual(file);
    expect(request.generationConfig).toMatchObject({ maxOutputTokens: 4500, mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel: 'LOW' } });
    if (count > readings.length || count > 3) throw new Error('Unexpected additional vision call.');
    if (count === 2) releaseFirst();
    if (count === 1 && options.holdFirstUntilSecond) await secondStarted;
    return providerResult(readings[count - 1], [1378, 424, 600][count - 1], options.finishReasons?.[count - 1] ?? 'STOP');
  });
}
const requestScan = (override: Record<string, unknown> = {}) => aiTask.run({ auth: { uid, token: { email: 'invoice-review@example.test', email_verified: true } }, data: { task: 'scanInvoice', file, ...override } } as any);
const scan = async () => {
  const response = await requestScan();
  expect(response.ok).toBe(true); return response as typeof response & { data: ReturnType<typeof normalizeInvoiceScan> & { review: { readers?: number; correctedFields?: string[] } } };
};
beforeAll(async () => {
  vi.stubEnv('AUTHORIZED_ACCOUNTS', 'invoice-review@example.test'); vi.stubEnv('GEMINI_API_KEY', 'offline-synthetic-key');
  ({ aiTask } = await import('../../functions/src/ai'));
});
beforeEach(() => {
  memory.docs.clear(); memory.provider.mockReset(); memory.transactions = Promise.resolve();
  memory.docs.set('brewerAiControls/current', { paused: false, monthlyLimitMicroChf: 20_000_000 }); vi.stubGlobal('fetch', memory.provider);
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe('Vision complète intégrée au handler et au budget, sans réseau', () => {
  it('lit deux fois l’original en parallèle, conserve les quatre natures et règle le budget avant de mettre en cache', async () => {
    arrangeReadings([invoice(), invoice()], { holdFirstUntilSecond: true });
    const result = await scan();
    expect(result.data.review).toEqual({ status: 'checked', findings: [], readers: 2, correctedFields: [] });
    expect(result.data.issues).toEqual([]);
    expect(result.data.items).toEqual(normalizeInvoiceScan(invoice()).items);
    expect(result.data.items.map(line => line.kind)).toEqual(['equipment', 'maintenance', 'shipping', 'discount']);
    expect(result.data.items[1]).toMatchObject({ quantity: null, unit: '', price: null });
    expect(result.data.items[3].amountTTC).toBe(-12);
    const requests = memory.provider.mock.calls.map(([, init]) => JSON.parse(init.body));
    for (const request of requests) {
      expect(request.generationConfig.responseSchema.required).toEqual(expect.arrayContaining(['vendor', 'date', 'currency', 'invoiceNumber', 'amountHT', 'tvaRate', 'tvaAmount', 'amountTTC', 'items']));
      expect(request.generationConfig.responseSchema.properties.items.items.required).toEqual(expect.arrayContaining(['name', 'kind', 'quantity', 'unit', 'price', 'amountTTC', 'evidence', 'ambiguity']));
      expect(request.contents[0].parts[0].text).not.toContain('500');
      expect(request.contents[0].parts[0].text).not.toContain('F-2026-091');
    }
    expect(requests[0].contents[0].parts[0].text).not.toEqual(requests[1].contents[0].parts[0].text);
    const cached = await scan();
    expect(cached.cached).toBe(true); expect(cached.data).toEqual(result.data); expect(memory.provider).toHaveBeenCalledTimes(2);
    expect(daily().usage).toEqual({ calls: 2, tokens: 1802, proCalls: 0 });
    expect(monthly().usedMicroChf).toBeGreaterThan(0); expect(monthly().reservedMicroChf).toBe(0);
    expect(Object.values(documentScan().reservations)).toHaveLength(2);
    expect(Object.values(documentScan().reservations).every((reservation: any) => reservation.status === 'completed')).toBe(true);
  });

  it.each(['pce', 'pièce', 'pièces', 'pcs'])('accepte l’alias %s uniquement pour comparer, sans réécrire la source', async unit => {
    arrangeReadings([invoice(), withLine({ unit })]);
    const { data } = await scan();
    expect(data.review.status).toBe('checked'); expect(data.items[0].unit).toBe('piece'); expect(data.items[0].quantity).toBe(1);
    expect(memory.provider).toHaveBeenCalledTimes(2);
  });

  it.each([{ kind: 'maintenance' }, { quantity: 2 }, { unit: 'kg' }, { amountTTC: 500.01 }])('utilise un troisième vote indépendant pour résoudre le désaccord %j', async patch => {
    arrangeReadings([invoice(), withLine(patch), invoice()]);
    const { data } = await scan();
    expect(data.review).toEqual({ status: 'checked', findings: [], readers: 3, correctedFields: [] });
    expect(data.items[0]).toMatchObject({ kind: 'equipment', quantity: 1, unit: 'piece', amountTTC: 500 });
    expect(memory.provider).toHaveBeenCalledTimes(3);
    const correction = JSON.parse(memory.provider.mock.calls[2][1].body);
    expect(correction.contents[0].parts[0].text).not.toContain('500');
    expect(correction.contents[0].parts[0].text).not.toContain('Fournisseur fictif');
    expect(daily().usage).toEqual({ calls: 3, tokens: 2402, proCalls: 0 });
    expect(monthly().reservedMicroChf).toBe(0);
  });

  it('corrige les en-têtes et la nature uniquement avec deux transcriptions concordantes', async () => {
    const wrong = withLine({ kind: 'maintenance' }); wrong.invoiceNumber = 'F-2026-019'; wrong.amountTTC = 5500;
    arrangeReadings([wrong, invoice(), invoice()]);
    const { data } = await scan();
    expect(data.review).toMatchObject({ status: 'corrected', readers: 3, correctedFields: expect.arrayContaining(['invoiceNumber', 'amountTTC', 'items.0.kind']) });
    expect(data).toMatchObject({ invoiceNumber: 'F-2026-091', amountTTC: 550 });
    expect(data.items[0].kind).toBe('equipment'); expect(data.issues).toEqual([]);
    expect(documentScan().result).toEqual(data);
  });

  it.each(['vendor', 'date', 'currency', 'invoiceNumber'])('garde le champ %s initial si les trois lectures divergent', async field => {
    const alternative: Record<string, [string, string]> = { vendor: ['Autre SA', 'Troisième SA'], date: ['10.09.2026', '11.09.2026'], currency: ['EUR', 'USD'], invoiceNumber: ['F-92', 'F-93'] };
    arrangeReadings([invoice(), invoice({ [field]: alternative[field][0] }), invoice({ [field]: alternative[field][1] })]);
    const { data } = await scan();
    expect(data.review.status).toBe('disputed'); expect(data.review.readers).toBe(3);
    expect(data.review.findings.join(' ')).toContain('lectures divergentes');
    expect(data[field as keyof typeof data]).toEqual(invoice()[field as keyof ReturnType<typeof invoice>]);
    expect(memory.provider).toHaveBeenCalledTimes(3);
  });

  it('conserve une ambiguïté explicite même après trois lectures, sans transformer null en quantité', async () => {
    const ambiguous = withLine({ ambiguity: 'La quantité est illisible.' }, 1);
    arrangeReadings([invoice(), ambiguous, invoice()]);
    const { data } = await scan();
    expect(data.review.status).toBe('disputed'); expect(data.review.readers).toBe(3);
    expect(data.issues.join(' ')).toContain('La quantité est illisible');
    expect(data.items[1]).toMatchObject({ quantity: null, unit: '' });
    expect(memory.provider).toHaveBeenCalledTimes(3);
  });

  it.each([{ quantity: undefined }, { unit: undefined }, { amountTTC: undefined }])('ne valide pas une valeur manquante %j à partir d’une seule lecture', async patch => {
    const first = withLine(patch);
    arrangeReadings([first, invoice(), first]);
    const { data } = await scan();
    const field = Object.keys(patch)[0] as 'quantity' | 'unit' | 'amountTTC';
    expect(data.items[0][field]).toEqual(field === 'unit' ? '' : null);
    expect(data.review.correctedFields).not.toContain(`items.0.${field}`);
    expect(memory.provider).toHaveBeenCalledTimes(3);
  });

  it.each([null, {}, { lines: [] }, { lines: [{ id: 'line-1', uncertain: false }] }])('rejette l’ancien format partiel ou une lecture inexploitable %j', async raw => {
    arrangeReadings([invoice(), raw]);
    const { data } = await scan();
    expect(data.review.status).toBe('unavailable'); expect(data.review.readers).toBe(1);
    expect(data.items).toEqual(normalizeInvoiceScan(invoice()).items);
    expect(data.issues.join(' ')).toContain('double lecture n’a pas abouti');
    expect(memory.provider).toHaveBeenCalledTimes(2);
  });

  it('ne fusionne pas deux articles de même nom quand leurs quantités sont interverties', async () => {
    const first = invoice(); first.items[1] = { ...first.items[0], quantity: 2, amountTTC: 50 };
    const second = structuredClone(first); second.items[0].quantity = 2; second.items[1].quantity = 1;
    const third = structuredClone(first); third.items[0].quantity = 3; third.items[1].quantity = 4;
    arrangeReadings([first, second, third]);
    const { data } = await scan();
    expect(data.review.status).toBe('disputed');
    expect(data.items.slice(0, 2).map(line => line.quantity)).toEqual([1, 2]);
    expect(data.issues.join(' ')).toContain('rapprochées');
  });

  it.each([0, 1])('préserve l’autre transcription si la lecture %i est tronquée, sans quatrième tentative', async index => {
    const finishes = ['STOP', 'STOP']; finishes[index] = 'MAX_TOKENS';
    arrangeReadings([invoice(), invoice()], { finishReasons: finishes });
    const { data } = await scan();
    expect(data.review.status).toBe('unavailable'); expect(data.review.readers).toBe(1);
    expect(data.items).toEqual(normalizeInvoiceScan(invoice()).items); expect(memory.provider).toHaveBeenCalledTimes(2);
    expect(monthly().reservedMicroChf).toBe(0); expect(daily().usage.tokens).toBe(1802);
  });

  it('conserve les divergences si la correction est tronquée et borne strictement les trois appels', async () => {
    arrangeReadings([invoice(), withLine({ quantity: 2 }), invoice()], { finishReasons: ['STOP', 'STOP', 'MAX_TOKENS'] });
    const { data } = await scan();
    expect(data.review.status).toBe('disputed'); expect(data.review.readers).toBe(2);
    expect(data.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
    expect(data.items[0].quantity).toBe(1); expect(memory.provider).toHaveBeenCalledTimes(3);
  });

  it('ne paie pas de correction pour une devise étrangère concordante', async () => {
    arrangeReadings([invoice({ currency: 'EUR' }), invoice({ currency: 'EUR' })]);
    const { data } = await scan();
    expect(data.review.status).toBe('disputed'); expect(data.currency).toBe('EUR'); expect(data.amountTTC).toBe(550);
    expect(data.issues.join(' ')).toContain('montant réellement payé en CHF'); expect(memory.provider).toHaveBeenCalledTimes(2);
  });

  it('respecte le plafond de deux appels si le contrôle complémentaire est refusé', async () => {
    memory.docs.set('brewerAiControls/current', { paused: false, monthlyLimitMicroChf: 20_000_000, limits: { questionCalls: 2 } });
    arrangeReadings([invoice(), withLine({ quantity: 2 })]);
    const { data } = await scan();
    expect(data.review.status).toBe('disputed'); expect(data.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
    expect(memory.provider).toHaveBeenCalledTimes(2); expect(documentScan().calls).toBe(2);
    expect(daily().usage).toEqual({ calls: 2, tokens: 1802, proCalls: 0 }); expect(monthly().reservedMicroChf).toBe(0);
  });

  it('bloque avant le fournisseur quand le budget mensuel est épuisé', async () => {
    memory.docs.set('brewerAiControls/current', { paused: false, monthlyLimitMicroChf: 0 });
    const result = await requestScan();
    expect(result.ok).toBe(false); expect(result.error).toContain('Budget mensuel');
    expect(memory.provider).not.toHaveBeenCalled(); expect(documentScan().status).toBe('blocked');
    expect(daily().usage.tokens).toBe(0);
  });

  it('ne relance pas un document qui a consommé ses deux lectures inexploitablement', async () => {
    arrangeReadings([null, {}]);
    expect((await requestScan()).ok).toBe(false); expect(documentScan().status).toBe('failed');
    const retry = await requestScan();
    expect(retry.ok).toBe(false); expect(retry.error).toContain('déjà été analysé'); expect(memory.provider).toHaveBeenCalledTimes(2);
  });

  it('laisse un résultat déjà en cache inchangé même lorsque l’IA est suspendue', async () => {
    const existing = normalizeInvoiceScan(invoice());
    existing.review = { status: 'disputed', findings: ['Fermenteur inox 30 litres : note descriptive historique'] };
    existing.issues = [...existing.review.findings];
    memory.docs.set(`invoiceScans/${invoiceScanId(uid, file)}`, { status: 'completed', result: existing, calls: 2 });
    memory.docs.set('brewerAiControls/current', { paused: true, monthlyLimitMicroChf: 0 });
    const response = await scan();
    expect(response.cached).toBe(true); expect(response.data).toEqual(existing); expect(memory.provider).not.toHaveBeenCalled();
  });
});
