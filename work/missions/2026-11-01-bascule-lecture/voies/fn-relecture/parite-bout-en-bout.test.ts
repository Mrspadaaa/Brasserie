// Voie fn-relecture : parité de BOUT EN BOUT entre `scanInvoiceSafely` (production, fetch simulé) et le banc (`finalOfStarVote` sur des lectures
// `withCodesNormalized`). Cas que les 55 tests de l'auteur ne couvrent pas : lecture vide, une seule ligne, devise absente d'un côté,
// total manquant, plafond de 35 lignes, 3.8 coupée, et un tirage pseudo-aléatoire. Aucun appel réel.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../../../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'h' }) }));
import { logger } from '../../../../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../../../../functions/src/ai';
import { INVOICE_SCAN_PROMPTS } from '../../../../../functions/src/invoiceScanPrompts';
import { GEMINI_LITE_MODEL } from '../../../../../functions/src/models';
import { LITE_MODEL, STRONG_MODEL, finalOfStarVote, needsThirdLite, readingFromError, readingFromResponse, withCodesNormalized, type Reading, type ReadMeta } from '../../../../../scripts/banc-lecture-facture';

const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const item = (i: number, over: Record<string, unknown> = {}) => ({ name: `Article ${i}`, kind: 'stock', quantity: 2, unit: 'pièce', price: 10, amountTTC: 20, ...over });
const invoice = (n = 1, over: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 20 * n, tvaAmount: 1.62 * n, amountTTC: 21.62 * n, tvaRate: .081,
  items: Array.from({ length: n }, (_, i) => item(i + 1)), ...over });

type Sim = { data: any } | { cut: true } | { refused: true } | { empty: true } | { timeout: true };
const answerOf = (sim: Sim): any => 'cut' in sim ? { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"items":[' }] } }] }
  : 'empty' in sim ? { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '' }] } }] }
  : { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify((sim as any).data) }] } }], usageMetadata: { totalTokenCount: 100 } };
const meta = (lecture: 1 | 2 | 3): ReadMeta => ({ id: `Csv8${lecture}`, doc: 'd', tirage: 1, variant: 'Csv8', lecture, model: lecture === 3 ? STRONG_MODEL : LITE_MODEL });
const bancRead = (lecture: 1 | 2 | 3, sim: Sim): Reading => withCodesNormalized('refused' in sim ? readingFromError(meta(lecture), Object.assign(new Error('refus'), { httpStatus: 503 }), 1, 0)
  : 'timeout' in sim ? readingFromError(meta(lecture), Object.assign(new Error('délai'), { name: 'AbortError' }), 1, 0)
  : readingFromResponse(meta(lecture), answerOf(sim), 1, 0));

const slot = (options: any) => ['l1', 'l2', 's3'][INVOICE_SCAN_PROMPTS.indexOf(JSON.parse(options.body).contents[0].parts[0].text)];
function jouer(plan: Record<string, Sim | undefined>) {
  fetchMock.mockImplementation(async (_url: string, options: any) => {
    const sim = plan[slot(options)!];
    if (!sim) throw new Error(`appel imprévu : ${slot(options)}`);
    if ('refused' in sim) return { ok: false, status: 503, json: async () => ({}) };
    if ('timeout' in sim) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    return { ok: true, json: async () => answerOf(sim) };
  });
}
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(logger, 'info').mockImplementation(() => undefined); vi.spyOn(logger, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

/** Rejoue (l1, l2, s3) dans la production ET dans le banc ; compare la finale champ par champ et le nombre d'appels. */
async function parite(l1: Sim, l2: Sim, s3: Sim | undefined) {
  fetchMock.mockReset();
  const b1 = bancRead(1, l1), b2 = bancRead(2, l2), needs = needsThirdLite(b1, b2);
  const b3 = needs && s3 ? bancRead(3, s3) : undefined;
  const banc = finalOfStarVote(b1, b2, b3);
  jouer({ l1, l2, s3: needs ? s3 : undefined });
  let prod: any, erreur: any;
  try { prod = (await scanInvoiceSafely('u', file, 'k') as any).data; } catch (error) { erreur = error; }
  const appelsLite = fetchMock.mock.calls.filter(([url]: any[]) => String(url).includes(GEMINI_LITE_MODEL)).length;
  expect(appelsLite).toBe(2);
  // la 3.8 est appelée exactement quand le banc la demande
  expect(fetchMock.mock.calls.length - 2).toBe(needs ? 1 : 0);
  if (banc.result === null) { expect(erreur).toBeDefined(); return; }
  expect(erreur).toBeUndefined();
  expect(prod).toEqual(banc.result);
  return { banc, prod };
}

const d = (data: any): Sim => ({ data });
describe('fn-relecture — cas non couverts par les 55 tests, de bout en bout contre le banc', () => {
  it('lecture vide (items: []) des deux côtés', async () => { await parite(d(invoice(0)), d(invoice(0)), d(invoice(0))); });
  it('lecture vide d\'un côté seulement', async () => { await parite(d(invoice(0)), d(invoice(1)), d(invoice(1))); });
  it('texte vide (non exploitable) d\'un côté : la 3.8 lit', async () => { await parite({ empty: true }, d(invoice(1)), d(invoice(1))); });
  it('texte vide des deux côtés, la 3.8 lit', async () => { await parite({ empty: true }, { empty: true }, d(invoice(1))); });
  it('rien de lisible : erreur, pas de finale', async () => { await parite({ empty: true }, { cut: true }, { refused: true }); });
  it('une seule ligne, deux lectures d\'accord', async () => { await parite(d(invoice(1)), d(invoice(1)), d(invoice(1))); });
  it('une seule ligne, désaccord de quantité', async () => { await parite(d(invoice(1)), d({ ...invoice(1), items: [item(1, { quantity: 3, amountTTC: 30 })] }), d(invoice(1))); });
  it('devise absente d\'un côté', async () => { const { currency: _c, ...sans } = invoice(2) as any; await parite(d(sans), d(invoice(2)), d(invoice(2))); });
  it('devise absente des deux côtés', async () => { const { currency: _c, ...sans } = invoice(2) as any; await parite(d(sans), d({ ...sans }), d(invoice(2))); });
  it('devise « Fr. » d\'un côté, absente de l\'autre', async () => { const { currency: _c, ...sans } = invoice(2) as any; await parite(d({ ...sans, currency: 'Fr.' }), d(sans), d(invoice(2))); });
  it('devise null / nombre / vide', async () => {
    await parite(d({ ...invoice(2), currency: null }), d({ ...invoice(2), currency: '' }), d(invoice(2)));
    await parite(d({ ...invoice(2), currency: 5 }), d({ ...invoice(2), currency: 5 }), d(invoice(2)));
  });
  it('devise « fr » (minuscule) et « S Fr. » et « chf.. »', async () => {
    await parite(d({ ...invoice(2), currency: 'fr' }), d({ ...invoice(2), currency: 'S Fr.' }), d(invoice(2)));
    await parite(d({ ...invoice(2), currency: 'chf..' }), d({ ...invoice(2), currency: 'Sfr' }), d(invoice(2)));
  });
  it('total absent d\'un côté', async () => { const { amountTTC: _t, ...sans } = invoice(2) as any; await parite(d(sans), d(invoice(2)), d(invoice(2))); });
  it('total null des deux côtés', async () => { await parite(d({ ...invoice(2), amountTTC: null }), d({ ...invoice(2), amountTTC: null }), d(invoice(2))); });
  it('total manquant et 3.8 coupée', async () => { await parite(d({ ...invoice(2), amountTTC: null }), d(invoice(2)), { cut: true }); });
  it('35 lignes exactement, deux lectures d\'accord', async () => { await parite(d(invoice(35)), d(invoice(35)), d(invoice(35))); });
  it('36 lignes lues des deux côtés (plafond de 35)', async () => { await parite(d(invoice(36)), d(invoice(36)), d(invoice(35))); });
  it('40 lignes d\'un côté, 35 de l\'autre (même résultat après plafond ?)', async () => { await parite(d(invoice(40)), d(invoice(35)), d(invoice(35))); });
  it('40 lignes contre 38 lignes', async () => { await parite(d(invoice(40)), d(invoice(38)), d(invoice(37))); });
  it('37 lignes dont une Flash-Lite coupée (le cas doc8) et la 3.8 lit 37', async () => { await parite(d(invoice(37)), { cut: true }, d(invoice(37))); });
  it('les deux Flash-Lite coupées à 37 lignes : la 3.8 seule', async () => { await parite({ cut: true }, { cut: true }, d(invoice(37))); });
  it('une Flash-Lite en délai (AbortError), la 3.8 lit', async () => { await parite(d(invoice(2)), { timeout: true }, d(invoice(2))); });
  it('deux Flash-Lite en délai, la 3.8 lit', async () => { await parite({ timeout: true }, { timeout: true }, d(invoice(2))); });
  it('désaccord et la 3.8 coupée', async () => { await parite(d(invoice(2)), d(invoice(3)), { cut: true }); });
  it('désaccord et la 3.8 lit une ligne vide', async () => { await parite(d(invoice(2)), d(invoice(3)), d(invoice(0))); });
  it('une Flash-Lite lisible, l\'autre vide, la 3.8 coupée', async () => { await parite(d(invoice(2)), { empty: true }, { cut: true }); });
  it('une Flash-Lite lisible, l\'autre en délai, la 3.8 en délai', async () => { await parite(d(invoice(2)), { timeout: true }, { timeout: true }); });
  it('N retire le désaccord de devise : pas de 3.8, finale identique', async () => { await parite(d({ ...invoice(2), currency: 'Fr.' }), d({ ...invoice(2), currency: 'CHF' }), undefined); });
});

// Tirage pseudo-aléatoire reproductible : des lectures perturbées sur une facture de base, des pannes variées.
function prng(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; }; }
describe('fn-relecture — tirage reproductible (300 triplets) : production == banc', () => {
  it('300 triplets', async () => {
    const rnd = prng(20261101), pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
    const currencies = ['CHF', 'Fr.', 'SFr.', 'chf', 'EUR', '', null, undefined, 'CHF.'];
    const mutate = (): any => {
      const n = pick([0, 1, 2, 3, 35, 36, 40]);
      const base: any = invoice(n);
      if (rnd() < .4) base.currency = pick(currencies);
      if (rnd() < .15) base.amountTTC = pick([null, undefined, 0, 99.99]);
      if (rnd() < .15) base.date = pick(['', '10.10.2026', null]);
      if (rnd() < .2 && base.items.length) base.items[0] = { ...base.items[0], kind: pick(['equipment', 'service', 'maintenance']) };
      if (rnd() < .2 && base.items.length) base.items[0] = { ...base.items[0], quantity: pick([1, 3, null, 60]), unit: pick(['kg', 'x', '']) };
      if (rnd() < .1) base.vat = [{ code: 'A', rate: pick([.081, 8.1, -1]), base: 20, amount: 1.62 }];
      return base;
    };
    const sim = (): Sim => { const r = rnd(); return r < .08 ? { cut: true } : r < .13 ? { refused: true } : r < .16 ? { empty: true } : r < .19 ? { timeout: true } : d(mutate()); };
    let troisieme = 0; const statuts = new Set<string>();
    for (let i = 0; i < 300; i++) {
      fetchMock.mockReset();
      const l1 = sim(), l2 = rnd() < .5 ? l1 : sim(), s3 = sim();
      const out = await parite(l1, l2, s3);
      if (fetchMock.mock.calls.length === 3) troisieme++;
      statuts.add(out ? `${out.prod.review.status}/${out.prod.review.readers}` : "erreur");
    }
    expect(troisieme).toBeGreaterThan(30);
    console.log("STATUTS", [...statuts].sort().join(" "));
    for (const s of ["checked/2", "disputed/3", "unavailable/1", "erreur"]) expect(statuts.has(s)).toBe(true);
  });
});
