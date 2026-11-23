// @vitest-environment node
// Voie h1, « Un doute ? Relire plus finement » : le handler `aiTask` reçoit `relecture: 'argon'` ; la 3ᵉ lecture part vers gemini-4-argon (réflexion basse), même quand les deux
// Flash-Lite concordent, sous sa propre clé de budget. Le client ne nomme jamais un modèle. Chaque appel externe est simulé : aucun Gemini réel.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeInvoiceScan, invoiceScanId, SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import { GEMINI_LITE_MODEL, INVOICE_ARGON_MODEL, INVOICE_STRONG_MAX_OUTPUT } from '../../functions/src/models';

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
const uid = 'synthetic-relecture-integration';
const ARGON = 'gemini-4-argon', HYDROGEN = 'gemini-4-hydrogen';
const invoice = (kind = 'equipment') => ({ vendor: 'Fournisseur fictif', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'F-2026-091', category: 'materiel', subcategory: 'Brassage', description: 'Fermenteur', amountHT: 500, tvaRate: .081, tvaAmount: 40.5, amountTTC: 540.5,
  items: [{ name: 'Fermenteur inox 30 litres', kind, quantity: 1, unit: 'piece', price: 500, amountTTC: 540.5, evidence: 'Fermenteur inox 30 litres — CHF 540.50', ambiguity: '' }] });
const answer = (value: unknown, finishReason = 'STOP') => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(value) }] } }], usageMetadata: { promptTokenCount: 700, candidatesTokenCount: 200, totalTokenCount: 900 } }) });
const down = () => ({ ok: false, status: 503, headers: new Headers(), json: async () => ({}) });
const modelOf = (index: number) => /\/models\/([^:]+):generateContent$/.exec(String(memory.provider.mock.calls[index][0]))?.[1];
const bodyOf = (index: number) => JSON.parse(memory.provider.mock.calls[index][1].body);
const request = (override: Record<string, unknown> = {}) => aiTask.run({ auth: { uid, token: { email: 'invoice-relecture@example.test', email_verified: true } }, data: { task: 'scanInvoice', file, ...override } } as any);
const monthly = () => [...memory.docs].find(([path]) => /^brewerAiCosts\/\d{4}-\d{2}$/.test(path))?.[1];
/** Les lectures données dans l'ordre des appels ; au-delà, le fournisseur est en panne. */
const arrange = (readings: Array<unknown | 'panne'>) => memory.provider.mockImplementation(async () => {
  const lecture = readings[memory.provider.mock.calls.length - 1];
  return lecture === undefined || lecture === 'panne' ? down() : answer(lecture);
});
beforeAll(async () => {
  vi.stubEnv('AUTHORIZED_ACCOUNTS', 'invoice-relecture@example.test'); vi.stubEnv('GEMINI_API_KEY', 'offline-synthetic-key');
  ({ aiTask } = await import('../../functions/src/ai'));
});
beforeEach(() => {
  memory.docs.clear(); memory.provider.mockReset(); memory.transactions = Promise.resolve();
  memory.docs.set('brewerAiControls/current', { paused: false, monthlyLimitMicroChf: 20_000_000 }); vi.stubGlobal('fetch', memory.provider);
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe('Relecture demandée par l’utilisateur : Argon, réflexion basse, derrière aiTask (voie h1)', () => {
  it('une pièce déjà lue (deux Flash-Lite d’accord, en cache) : la relecture part quand même, 3ᵉ lecture Argon LOW 12 000, et Argon tranche', async () => {
    arrange([invoice(), invoice()]);
    const premiere = await request();
    expect(premiere).toMatchObject({ ok: true, cached: false }); expect(memory.provider).toHaveBeenCalledTimes(2);
    // Argon lit autrement que les deux Flash-Lite : c'est lui qui a le dernier mot.
    memory.provider.mockReset(); arrange([invoice(), invoice(), invoice('maintenance')]);
    const relue = await request({ relecture: 'argon' });
    expect(relue).toMatchObject({ ok: true, cached: false, model: ARGON, data: { review: { readers: 3 }, items: [{ kind: 'maintenance' }] } });
    expect(memory.provider).toHaveBeenCalledTimes(3);
    expect([modelOf(0), modelOf(1), modelOf(2)]).toEqual([GEMINI_LITE_MODEL, GEMINI_LITE_MODEL, ARGON]);
    expect(bodyOf(2).generationConfig).toMatchObject({ thinkingConfig: { thinkingLevel: 'LOW' }, maxOutputTokens: INVOICE_STRONG_MAX_OUTPUT, temperature: 0 });
    expect(bodyOf(2).tools).toBeUndefined();
    // Les deux lectures ont chacune leur document de budget : la première n'est pas écrasée.
    expect(memory.docs.get(`invoiceScans/${invoiceScanId(uid, file)}`)).toMatchObject({ status: 'completed' });
    const documents = [...memory.docs.keys()].filter(path => path.startsWith('invoiceScans/'));
    expect(documents).toHaveLength(2);
  });

  it('le budget réserve et règle la lecture Argon à son tarif (2 $ / 10 $, jamais zéro)', async () => {
    arrange([invoice(), invoice(), invoice()]);
    expect((await request({ relecture: 'argon' })).ok).toBe(true);
    expect(monthly().usedMicroChf).toBeGreaterThan(0); expect(monthly().reservedMicroChf).toBe(0);
  });

  it('une deuxième relecture de la même pièce ressert la première : aucun appel, aucun coût de plus', async () => {
    arrange([invoice(), invoice(), invoice('maintenance')]);
    const premiere = await request({ relecture: 'argon' });
    const depense = monthly().usedMicroChf; memory.provider.mockClear();
    const seconde = await request({ relecture: 'argon' });
    expect(seconde).toMatchObject({ ok: true, cached: true, data: premiere.data }); expect(memory.provider).not.toHaveBeenCalled(); expect(monthly().usedMicroChf).toBe(depense);
  });

  it.each(['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-9', 'ARGON', 'hydrogen', '', 1, true, { model: 'gemini-4-argon' }, ['argon']])('une relecture %j n’est pas « argon » : ignorée, lecture ordinaire, aucun appel Argon', async valeur => {
    arrange([invoice(), invoice()]);
    const response = await request({ relecture: valeur });
    expect(response).toMatchObject({ ok: true }); expect(memory.provider).toHaveBeenCalledTimes(2);
    expect(memory.provider.mock.calls.map((_, i) => modelOf(i))).toEqual([GEMINI_LITE_MODEL, GEMINI_LITE_MODEL]);
    expect(JSON.stringify(memory.provider.mock.calls)).not.toContain(ARGON);
  });

  it('sans option : sur désaccord la 3ᵉ lecture reste Hydrogen (jamais Argon)', async () => {
    arrange([invoice('equipment'), invoice('maintenance'), invoice('maintenance')]);
    await request();
    expect(modelOf(2)).toBe(HYDROGEN); expect(JSON.stringify(memory.provider.mock.calls)).not.toContain(ARGON);
  });

  it('un morceau d’une longue pièce n’est jamais une relecture : l’option est ignorée', async () => {
    arrange([invoice(), invoice()]);
    await request({ relecture: 'argon', morceau: { k: 1, n: 2 } });
    expect(JSON.stringify(memory.provider.mock.calls)).not.toContain(ARGON);
  });

  it('Argon en panne : une seule nouvelle tentative, sur la 3.8, qui lit', async () => {
    arrange([invoice(), invoice(), 'panne', invoice('maintenance')]);
    const response = await request({ relecture: 'argon' });
    expect(memory.provider).toHaveBeenCalledTimes(4);
    expect([modelOf(2), modelOf(3)]).toEqual([ARGON, SCAN_MODEL]);
    expect(response).toMatchObject({ ok: true, model: SCAN_MODEL, data: { review: { readers: 3 } } });
  });

  it('Argon et la 3.8 en panne : erreur claire (jamais le vote des Flash-Lite rendu pour une relecture fine), la lecture d’avant reste', async () => {
    arrange([invoice(), invoice()]);
    const premiere = await request(); expect(premiere.ok).toBe(true);
    memory.provider.mockReset(); arrange([invoice(), invoice(), 'panne', 'panne']);
    const relue = await request({ relecture: 'argon' });
    expect(relue.ok).toBe(false); expect(relue.error).toContain('relecture plus fine n’a pas abouti');
    expect(memory.provider).toHaveBeenCalledTimes(4);
    const encore = await request();
    expect(encore).toMatchObject({ ok: true, cached: true, data: premiere.data });
  });

  it('IA suspendue : la relecture est refusée avant tout appel', async () => {
    memory.docs.set('brewerAiControls/current', { paused: true, monthlyLimitMicroChf: 20_000_000 });
    const response = await request({ relecture: 'argon' });
    expect(response.ok).toBe(false); expect(memory.provider).not.toHaveBeenCalled();
  });

  it('la lecture normalisée du banc reste celle d’une lecture ordinaire (même forme)', () => {
    expect(normalizeInvoiceScan(invoice()).items).toHaveLength(1);
  });
});
