import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiApiError, parseGeminiError } from '../../functions/src/geminiErrors';
import { geminiTransport, runBrewerHarness } from '../../functions/src/brewerHarness';
import type { BrewerContext } from '../../functions/src/companionTypes';

const context: BrewerContext = { phase: 'Recette', inventory: [], material: [], waterSources: [], provenance: [], now: 0 };
const cap = () => parseGeminiError(429, 'gemini-3.8-flash', { error: {
  code: 429, status: 'RESOURCE_EXHAUSTED',
  message: 'Your project has exceeded its monthly spending cap. Please go to AI Studio at https://ai.studio/spend to manage your project spend cap.'
} });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Google failures remain distinct from app limits (mocked provider)', () => {
  it('identifies the actual monthly spending-cap response and gives an actionable message', () => {
    const error = cap();
    expect(error.kind).toBe('spend-cap');
    expect(error.rejectedBeforeGeneration).toBe(true);
    expect(error.canTryAnotherModel).toBe(false);
    expect(error.publicError()).toMatchObject({ code: 'gemini-spend-cap', retryable: true });
    expect(error.publicError().message).toMatch(/plafond mensuel.*Google AI Studio/);
    expect(error.publicError().message).toMatch(/distinctes/);
  });

  it('keeps project RPM throttling distinct and preserves Google’s retry delay', () => {
    const error = parseGeminiError(429, 'flash', { error: {
      message: 'Your project reached its requests per minute limit.',
      details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '21.5s' }]
    } });
    expect(error.kind).toBe('rate-limit');
    expect(error.retryAfterMs).toBe(21500);
    expect(error.publicError().message).toContain('22 secondes');
  });

  it('detects a daily Google quota from structured quota details', () => {
    const error = parseGeminiError(429, 'flash', { error: { details: [{
      '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
      violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel' }]
    }] } });
    expect(error.kind).toBe('daily-quota');
    expect(error.canTryAnotherModel).toBe(false);
  });

  it.each([400, 401, 403, 404, 413, 429])('releases the unused reservation for an HTTP %s rejection', status => {
    expect(parseGeminiError(status, 'flash', {}).rejectedBeforeGeneration).toBe(true);
  });
  it.each([500, 502, 503, 504])('keeps a conservative reservation for an uncertain HTTP %s failure', status => {
    expect(parseGeminiError(status, 'flash', {}).rejectedBeforeGeneration).toBe(false);
  });

  it('handles malformed error details without losing the HTTP status', () => {
    const error = parseGeminiError(429, 'flash', { error: { details: [null, { '@type': 12 }, { '@type': [] }] } }, '10');
    expect(error.kind).toBe('rate-limit');
    expect(error.retryAfterMs).toBe(10000);
  });

  it('captures only safe diagnostic fields, never a key, recipe text or provider body', async () => {
    const secret = 'AIza-test-secret';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: {
      message: `Your project has exceeded its monthly spending cap. ${secret} Private recipe text`
    } }, { status: 429 })));
    let failure: GeminiApiError | undefined;
    try { await geminiTransport(secret)('gemini-3.8-flash', {}, AbortSignal.timeout(1000)); }
    catch (error) { failure = error as GeminiApiError; }
    expect(failure).toBeInstanceOf(GeminiApiError);
    expect(failure!.kind).toBe('spend-cap');
    expect(JSON.stringify(failure)).not.toContain(secret);
    expect(JSON.stringify(failure)).not.toContain('Private recipe');
  });

  it.each(['fast', 'auto', 'deep'] as const)('stops immediately on a spending cap in %s mode', async mode => {
    const failure = cap();
    const generate = vi.fn().mockRejectedValue(failure);
    const diagnostic = vi.fn();
    await expect(runBrewerHarness(context, 'Question', [], generate, { mode, onDiagnostic: diagnostic })).rejects.toBe(failure);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(diagnostic).toHaveBeenCalledWith(expect.objectContaining({ providerErrors: [failure.diagnostic()] }));
  });

  it('preserves the spending-cap error during web lookup instead of hiding it as unavailable Pro', async () => {
    const failure = cap();
    const generate = vi.fn().mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{
      functionCall: { name: 'lookup_brewing_reference', args: { query: 'Levure' } }
    }] } }] }).mockRejectedValue(failure);
    await expect(runBrewerHarness(context, 'Cherche une référence', [], generate)).rejects.toBe(failure);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
