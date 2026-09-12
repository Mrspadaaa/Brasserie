import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), queue: Promise.resolve() as Promise<any>, failSettlement: false, watchers: new Map<string, (value: any) => void>(), afterCommit:undefined as undefined|(()=>void) }));
const snapshot = (path: string) => ({ data: () => structuredClone(state.docs.get(path)) });
function update(path: string, patch: any) {
  const value = structuredClone(state.docs.get(path));
  for (const [key, data] of Object.entries(patch)) {
    const parts = key.split('.'); let target = value;
    for (const part of parts.slice(0, -1)) target = target[part] ??= {};
    target[parts.at(-1)!] = structuredClone(data);
  }
  state.docs.set(path, value);
}
function doc(path: string): any { return { path, get: async () => snapshot(path), update: async (data: any) => update(path, data), onSnapshot: (next: any) => { state.watchers.set(path, next); next(snapshot(path)); return () => state.watchers.delete(path); } }; }
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ getFirestore: () => ({ doc, runTransaction: (work: any) => {
  // Serialize commits like Firestore's conflict/retry contract; concurrent calls
  // always see the preceding committed month reservation.
  const run = state.queue.then(async () => {
    const writes: Array<() => void> = []; let settles = false;
    const result = await work({ get: (ref: any) => ref.get(), set: (ref: any, data: any) => writes.push(() => state.docs.set(ref.path, structuredClone(data))), update: (ref: any, data: any) => { if (ref.path.includes('/calls/')) settles = true; writes.push(() => update(ref.path, data)); } });
    if (state.failSettlement && settles) throw Error('Offline settlement');
    writes.forEach(write => write()); state.afterCommit?.(); return result;
  }); state.queue = run.catch(() => undefined); return run;
} }) }));
vi.mock('../../functions/src/brewSession', () => ({ requireBrewer: () => 'test-brewer' }));
import { runWithMonthlyAiBudget } from '../../functions/src/monthlyAiBudget';
import { aiBudgetMonth, GEMINI_COST_POLICY, GEMINI_SEARCH_COST_POLICY, observedGeminiCost, observedGeminiCostDetails, pricesCurrent, quoteGeminiCost } from '../../functions/src/geminiCosts';
import { GeminiApiError, GeminiRequestNotSentError } from '../../functions/src/geminiErrors';
import { budgetedBrewerTransport, setBrewerAiBudget } from '../../functions/src/brewerBudget';
import { runBudgetedInvoiceScan } from '../../functions/src/invoiceScanBudget';
import { SCAN_MODEL } from '../../functions/src/invoiceScanCore';

const model = 'gemini-3.5-flash-lite';
const request = { contents: [{ parts: [{ text: 'Analyse locale de la brasserie' }] }], generationConfig: { maxOutputTokens: 128 } };
const response = { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 30, totalTokenCount: 150 } };
const searchRequest = { ...request, tools: [{ googleSearch: {} }] };
const searchResponse = (queries: unknown) => ({ ...response, candidates: [{ groundingMetadata: { webSearchQueries: queries } }] });
const month = () => state.docs.get(`brewerAiCosts/${aiBudgetMonth()}`);
const controls = (data: any = {}) => state.docs.set('brewerAiControls/current', { paused: false, monthlyLimitMicroChf: 5_000_000, ...data });
const signal = () => new AbortController().signal;
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-09-09T12:00:00Z')); state.docs.clear(); state.watchers.clear(); state.queue = Promise.resolve(); state.failSettlement = false; state.afterCommit=undefined; controls(); });
afterEach(() => vi.useRealTimers());
describe('Provision mensuelle Gemini, sans aucun réseau', () => {
  it('utilise des micro-CHF, inclut la réflexion, réserve les médias au contexte maximum', () => {
    const quote = quoteGeminiCost(model, request);
    expect(observedGeminiCost(quote, response)).toBe(194); // ceil((100×.30 +50×2.50)×1.25)
    expect(quote.reservedMicroChf).toBeGreaterThan(194);
    expect(quote.body.generationConfig).toMatchObject({ maxOutputTokens: 128, candidateCount: 1 });
    expect(quoteGeminiCost(model, { ...request, contents: [{ parts: [{ inlineData: { mimeType: 'application/pdf', data: 'tiny-compressed-file' } }] }] }).inputTokens).toBe(1_048_576);
    expect(observedGeminiCost(quote, { usageMetadata: { totalTokenCount: 150 } })).toBeNull();
  });
  it('applique les paliers Pro et provisionne déjà la fin de promotion Flash', () => {
    const pro = quoteGeminiCost('gemini-3.1-pro-preview', request);
    expect(observedGeminiCost(pro, { usageMetadata: { promptTokenCount: 200_001, candidatesTokenCount: 1, totalTokenCount: 200_002 } })).toBe(1_000_028);
    const flash = quoteGeminiCost('gemini-3.8-flash', request);
    expect(observedGeminiCost(flash, { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 1000, totalTokenCount: 2000 } })).toBe(11_250);
  });
  it('couvre le tarif audio du repli Flash Lite 3.1 à la réservation et au règlement', () => {
    const fallback = 'gemini-3.1-flash-lite';
    const mediaRequest = (part: unknown) => ({ ...request, contents: [{ parts: [{ text: 'Transcris mon brassin' }, part] }] });
    const usage = { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 100, totalTokenCount: 1100 } };
    const photo = quoteGeminiCost(fallback, mediaRequest({ inlineData: { mimeType: 'image/jpeg', data: 'mock' } }));
    expect(photo.audioInput).toBe(false);
    expect(observedGeminiCost(photo, usage)).toBe(500);
    for (const part of [
      { inlineData: { mimeType: 'audio/wav', data: 'mock' } },
      { fileData: { mimeType: 'audio/mpeg', fileUri: 'mock-upload' } },
      { inlineData: { mimeType: 'video/mp4', data: 'mock' } },
      { fileData: { mimeType: 'application/octet-stream', fileUri: 'mock-unknown-file' } },
      { fileData: { fileUri: 'mock-unknown-media' } }
    ]) {
      const audio = quoteGeminiCost(fallback, mediaRequest(part));
      expect(audio.audioInput).toBe(true);
      expect(audio.reservedMicroChf - photo.reservedMicroChf).toBe(327_680);
      expect(observedGeminiCost(audio, usage)).toBe(813);
    }
  });
  it('renouvelle au premier jour suisse, indépendamment du jour UTC', () => {
    expect(aiBudgetMonth(Date.parse('2026-09-30T21:59:59Z'))).toBe('2026-09');
    expect(aiBudgetMonth(Date.parse('2026-09-30T22:00:00Z'))).toBe('2026-10');
    expect(aiBudgetMonth(Date.parse('2026-12-31T23:00:00Z'))).toBe('2027-01');
  });
  it('conserve un avertissement de révision sans coupure arbitraire à 30 jours', () => {
    const later = Date.parse(GEMINI_COST_POLICY.validUntil) + 1;
    expect(pricesCurrent(later)).toBe(false);
    expect(quoteGeminiCost(model, request, later).reservedMicroChf).toBeGreaterThan(0);
  });
  it.each([
    ['missing', {}], ['zero', { monthlyLimitMicroChf: 0 }], ['invalid', { monthlyLimitMicroChf: -1 }], ['pause', { paused: true, monthlyLimitMicroChf: 5_000_000 }]
  ])('aucun fournisseur si budget %s', async (_name, data) => {
    state.docs.set('brewerAiControls/current', data); const provider = vi.fn();
    await expect(runWithMonthlyAiBudget(model, request, provider)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled(); expect(month()).toBeUndefined();
  });
  it('réserve atomiquement la dernière place parmi 12 analyses concurrentes', async () => {
    const quote = quoteGeminiCost(model, request); controls({ monthlyLimitMicroChf: quote.reservedMicroChf });
    const provider = vi.fn(async () => { throw Error('response lost'); });
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => runWithMonthlyAiBudget(model, request, provider)));
    expect(results.every(result => result.status === 'rejected')).toBe(true);
    expect(provider).toHaveBeenCalledOnce(); expect(month().reservedMicroChf).toBe(quote.reservedMicroChf);
  });
  it('règle le coût observé une fois et maintient le plafond quotidien des autres tâches', async () => {
    const provider = vi.fn(async () => response);
    await runWithMonthlyAiBudget(model, request, provider, { daily: true });
    expect(month()).toMatchObject({ usedMicroChf: 194, reservedMicroChf: 0 });
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage).toEqual({ calls: 1, proCalls: 0, tokens: 150 });
    controls({ limits: { dailyCalls: 1 } });
    await expect(runWithMonthlyAiBudget(model, request, provider, { daily: true })).rejects.toMatchObject({ code: 'ai-daily-limit' });
    expect(provider).toHaveBeenCalledOnce();
  });
  it.each([new Error('timeout'), new GeminiApiError(503, model, 'server')])('garde la réservation sur échec incertain', async error => {
    await expect(runWithMonthlyAiBudget(model, request, async () => { throw error; })).rejects.toBe(error);
    expect(month()).toMatchObject({ usedMicroChf: 0, reservedMicroChf: quoteGeminiCost(model, request).reservedMicroChf });
  });
  it('ne libère pas une réservation faute de métadonnées ou après perte du commit', async () => {
    await runWithMonthlyAiBudget(model, request, async () => ({ usageMetadata: { totalTokenCount: 150 } }));
    const prior = month().reservedMicroChf; state.failSettlement = true;
    const provider = vi.fn(async () => response);
    expect(await runWithMonthlyAiBudget(model, request, provider)).toEqual(response);
    expect(month().reservedMicroChf).toBe(prior * 2); expect(provider).toHaveBeenCalledOnce();
  });
  it('libère uniquement un rejet certain avant génération', async () => {
    await expect(runWithMonthlyAiBudget(model, request, async () => { throw new GeminiApiError(429, model, 'spend-cap'); }, { daily: true })).rejects.toBeInstanceOf(GeminiApiError);
    expect(month()).toMatchObject({ usedMicroChf: 0, reservedMicroChf: 0 });
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage).toEqual({ calls: 1, proCalls: 0, tokens: 0 });
  });

  it('libère le mois et le jour sur preuve serveur que le transport n’a pas été lancé',async()=>{
    const error=new GeminiRequestNotSentError(new Error('Annulation avant envoi'));
    await expect(runWithMonthlyAiBudget(model,request,async()=>{throw error;},{daily:true})).rejects.toBe(error);
    expect(month()).toMatchObject({usedMicroChf:0,reservedMicroChf:0});
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage).toEqual({calls:1,proCalls:0,tokens:0});
  });

  it('une annulation après démarrage du fournisseur ne prouve pas un coût nul',async()=>{
    const error=new DOMException('Aborted after fetch started','AbortError');
    const provider=vi.fn(async()=>{throw error;});
    await expect(runWithMonthlyAiBudget(model,request,provider,{daily:true})).rejects.toBe(error);
    expect(provider).toHaveBeenCalledOnce();
    expect(month()).toMatchObject({usedMicroChf:0,reservedMicroChf:quoteGeminiCost(model,request).reservedMicroChf});
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage.tokens).toBeGreaterThan(0);
  });

  it('un scan annulé pendant la réservation mensuelle rembourse les deux ledgers sans démarrer le fournisseur',async()=>{
    const abort=new AbortController(), provider=vi.fn();
    const file={mimeType:'image/jpeg',data:Buffer.from([255,216,255,217]).toString('base64')};
    const mediaRequest={...request,contents:[{parts:[{inlineData:file}]}]};
    state.afterCommit=()=>{if(month()?.reservedMicroChf>0)abort.abort(Error('Échéance atteinte avant envoi'));};
    await expect(runBudgetedInvoiceScan('scan-aborted',file,generate=>generate(mediaRequest,abort.signal),provider)).rejects.toBeInstanceOf(GeminiRequestNotSentError);
    expect(provider).not.toHaveBeenCalled();
    expect(month()).toMatchObject({usedMicroChf:0,reservedMicroChf:0});
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage).toEqual({calls:1,proCalls:0,tokens:0});
    const scan=[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    expect(scan.status).toBe('blocked');
  });

  it('un scan interrompu après démarrage conserve les deux réservations incertaines',async()=>{
    const abort=new AbortController();
    const error=new DOMException('Aborted after fetch started','AbortError');
    const provider=vi.fn(async()=>{abort.abort(error);throw error;});
    const file={mimeType:'image/jpeg',data:Buffer.from([255,216,255,217]).toString('base64')};
    const mediaRequest={...request,contents:[{parts:[{inlineData:file}]}]};
    await expect(runBudgetedInvoiceScan('scan-started',file,generate=>generate(mediaRequest,abort.signal),provider)).rejects.toBe(error);
    expect(provider).toHaveBeenCalledOnce();
    expect(month().reservedMicroChf).toBeGreaterThan(0);
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage.tokens).toBeGreaterThan(65000);
  });
  it('refuse modèles inconnus et outils sans provision avant toute réservation', async () => {
    const provider = vi.fn();
    await expect(runWithMonthlyAiBudget('gemini-unknown', request, provider)).rejects.toMatchObject({ code: 'ai-cost-unavailable' });
    await expect(runWithMonthlyAiBudget(model, { ...request, tools: [{ googleMaps: {} }] }, provider)).rejects.toMatchObject({ code: 'ai-cost-unavailable' });
    expect(provider).not.toHaveBeenCalled(); expect(month()).toBeUndefined();
  });
  it('provisionne 20 requêtes Search en plus des tokens, pour chaque recherche concurrente', async () => {
    const quote = quoteGeminiCost(model, searchRequest);
    const withoutSearch = quoteGeminiCost(model, { ...searchRequest, tools: [] });
    expect(quote.searchQueriesReserved).toBe(20);
    // Both request encodings have their own framing/token allowance.
    expect(quote.reservedMicroChf - withoutSearch.reservedMicroChf).toBeGreaterThanOrEqual(350_000);
    expect(quote.body.tools).toEqual([{ googleSearch: {} }]);
    expect(quoteGeminiCost(model, { ...request, tools: [{ google_search: {} }] }).searchQueriesReserved).toBe(20);
    controls({ monthlyLimitMicroChf: quote.reservedMicroChf });
    const provider = vi.fn(async () => searchResponse(undefined));
    const results = await Promise.allSettled(Array.from({ length: 3 }, () => runWithMonthlyAiBudget(model, searchRequest, provider)));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(provider).toHaveBeenCalledOnce();
    expect(month().reservedMicroChf).toBe(quote.reservedMicroChf);
  });
  it('compte les requêtes uniques non vides, pas un forfait par appel grounded', async () => {
    const result = searchResponse([' houblon citra 100g suisse ', '', 'houblon citra 100g suisse', '  ', 'houblon citra 1kg suisse']);
    const quote = quoteGeminiCost(model, searchRequest);
    expect(observedGeminiCostDetails(quote, result)).toEqual({ chargedMicroChf: 35_194, tokenMicroChf: 194, searchQueries: 2, searchMicroChf: 35_000 });
    await runWithMonthlyAiBudget(model, searchRequest, async () => result);
    expect(month()).toMatchObject({ usedMicroChf: 35_194, reservedMicroChf: 0 });
    const call = [...state.docs.entries()].find(([path]) => path.includes('/calls/'))![1];
    expect(call).toMatchObject({ searchQueriesReserved: 20, searchQueryMicroChf: 17_500, searchQueries: 2, searchMicroChf: 35_000, tokenMicroChf: 194, exceededReservation: false });
    expect(JSON.stringify(call)).not.toContain('houblon');
  });
  it.each([undefined, null, 'query', ['query', null], { query: 'houblon' }])('garde toute la réserve si métadonnées Search ambiguës : %j', async queries => {
    await runWithMonthlyAiBudget(model, searchRequest, async () => searchResponse(queries));
    expect(month()).toMatchObject({ usedMicroChf: 0, reservedMicroChf: quoteGeminiCost(model, searchRequest).reservedMicroChf });
  });
  it('garde la réserve si la réponse ne déclare aucune métadonnée Search', async () => {
    await runWithMonthlyAiBudget(model, searchRequest, async () => response);
    expect(month().reservedMicroChf).toBe(quoteGeminiCost(model, searchRequest).reservedMicroChf);
  });
  it('accepte zéro recherche uniquement quand le fournisseur renvoie un tableau explicite valide', () => {
    const quote = quoteGeminiCost(model, searchRequest);
    expect(observedGeminiCost(quote, searchResponse([]))).toBe(194);
    expect(observedGeminiCost(quote, searchResponse(['', ' ']))).toBe(194);
    expect(observedGeminiCost(quote, { ...response, candidates: [{ groundingMetadata: { webSearchQueries: [] } }, {}] })).toBeNull();
  });
  it('impute un fan-out supérieur à la provision sans le tronquer et bloque le prochain appel', async () => {
    const quote = quoteGeminiCost(model, searchRequest);
    controls({ monthlyLimitMicroChf: quote.reservedMicroChf });
    const provider = vi.fn(async () => searchResponse(Array.from({ length: 25 }, (_, i) => `query ${i}`)));
    await runWithMonthlyAiBudget(model, searchRequest, provider);
    expect(month()).toMatchObject({ usedMicroChf: 25 * GEMINI_SEARCH_COST_POLICY.microChfPerQuery + 194, reservedMicroChf: 0 });
    const call = [...state.docs.entries()].find(([path]) => path.includes('/calls/'))![1];
    expect(call).toMatchObject({ searchQueries: 25, exceededReservation: true });
    await expect(runWithMonthlyAiBudget(model, request, provider)).rejects.toMatchObject({ code: 'ai-monthly-limit' });
    expect(provider).toHaveBeenCalledOnce();
  });
  it.each([
    [{ googleSearch: null }], [{ googleSearch: [] }], [{ googleSearch: { unexpected: true } }],
    [{ googleSearch: {}, google_search: {} }], [{ googleSearch: {} }, { googleSearch: {} }]
  ])('refuse une configuration Search ambiguë %j', tools => {
    expect(() => quoteGeminiCost(model, { ...request, tools })).toThrow();
  });
  it('compte compagnon et scan dans le même mois et ne facture pas un cache de facture', async () => {
    state.docs.set('brewerJobs/test', { status: 'running', fence: 'f' });
    const provider = vi.fn(async () => response), guard = budgetedBrewerTransport(provider, 'test', 'f');
    await guard.generate(model, request, signal()); guard.close();
    const file = { mimeType: 'image/jpeg', data: Buffer.from([255,216,255,217]).toString('base64') };
    const work = async (generate: any) => { await generate(request, signal()); return { amount: 50 }; };
    await runBudgetedInvoiceScan('test', file, work, provider);
    expect(month().usedMicroChf).toBe(194+observedGeminiCost(quoteGeminiCost(SCAN_MODEL,request),response)!); expect(month().reservedMicroChf).toBe(0);
    controls({ paused: true });
    expect(await runBudgetedInvoiceScan('test', file, work, provider)).toMatchObject({ cached: true });
    expect(provider).toHaveBeenCalledTimes(2);
  });
  it('permet de reprendre une facture bloquée avant tout appel après configuration du budget', async () => {
    state.docs.set('brewerAiControls/current', { paused: false });
    const file = { mimeType: 'image/jpeg', data: Buffer.from([255,216,255,217]).toString('base64') };
    const provider = vi.fn(async () => response);
    const work = async (generate: any) => { await generate(request, signal()); return { amount: 50 }; };
    await expect(runBudgetedInvoiceScan('test', file, work, provider)).rejects.toMatchObject({ code: 'ai-monthly-unconfigured' });
    expect(provider).not.toHaveBeenCalled();
    expect(state.docs.get('brewerAiUsage/2026-09-09').usage.tokens).toBe(0);
    controls();
    expect(await runBudgetedInvoiceScan('test', file, work, provider)).toMatchObject({ cached: false, result: { amount: 50 } });
    expect(provider).toHaveBeenCalledOnce();
  });
  it('un changement de budget conserve la pause et les dépenses déjà comptées', async () => {
    controls({ paused: true });
    state.docs.set('brewerAiCosts/2026-09', { usedMicroChf: 4_000_000, reservedMicroChf: 500_000 });
    const result = await setBrewerAiBudget.run({ data: { monthlyLimitMicroChf: 2_000_000 } } as any);
    expect(result.paused).toBe(true);
    expect(result.monthly).toMatchObject({ limitMicroChf: 2_000_000, usedMicroChf: 4_000_000, reservedMicroChf: 500_000 });
  });
});
