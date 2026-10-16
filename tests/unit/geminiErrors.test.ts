import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiApiError, isGeminiRequestUncharged, parseGeminiError } from '../../functions/src/geminiErrors';
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
    // The exit stays named (the AI Studio console), not the model provider (DESIGN.md, #100).
    expect(error.publicError().message).toMatch(/plafond mensuel.*AI Studio/);
    expect(error.publicError().message).toMatch(/distinctes/);
  });

  it.each(['spend-cap', 'daily-quota', 'rate-limit', 'authentication', 'invalid-request', 'model-unavailable', 'server'] as const)(
    'le message visible « %s » ne nomme ni le fournisseur ni le modèle (DESIGN.md)', kind => {
      const message = new GeminiApiError(429, 'gemini-3.8-flash', kind, 21500).publicError().message;
      expect(message).not.toMatch(/Gemini|Google|gemini-/);
      expect(message.length).toBeGreaterThan(20);
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

  it('keeps a schema 400 distinct from an explicitly classified invalid API key and retains only bounded structure', () => {
    const apiKey = 'AIza-FAKE-KEY-CANARY-481';
    const prompt = 'PRIVATE-PROMPT-CANARY-792';
    const field = 'tools[0].functionDeclarations[14].parameters.properties.answer.properties.options.maxItems';
    const schemaFailure = parseGeminiError(400, 'gemini-3.8-flash', { error: {
      code: 400, status: 'INVALID_ARGUMENT', message: `Invalid schema ${apiKey} ${prompt}`,
      details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [
        { field, description: `Rejected ${prompt} ${apiKey}` },
        { field: 'contents[0].parts[0].text.PROMPT-CANARY-792', description: `Echo ${prompt}` },
        { field: 'tools[0].parameters.properties.SECRET_CANARY', description: `Echo ${apiKey}` },
      ] }]
    } });
    const keyFailure = parseGeminiError(400, 'gemini-3.8-flash', { error: {
      code: 400, status: 'INVALID_ARGUMENT', message: `API key invalid ${apiKey} ${prompt}`,
      details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID',
        domain: 'googleapis.com', metadata: { service: 'generativelanguage.googleapis.com', key: apiKey, prompt } }]
    } });

    expect(schemaFailure.kind).toBe('invalid-request');
    expect(schemaFailure.diagnostic()).toEqual({
      httpStatus: 400, model: 'gemini-3.8-flash', kind: 'invalid-request',
      provider: { code: 400, status: 'INVALID_ARGUMENT', fieldPaths: [field] },
    });
    expect(keyFailure.kind).toBe('authentication');
    expect(keyFailure.diagnostic()).toEqual({
      httpStatus: 400, model: 'gemini-3.8-flash', kind: 'authentication',
      provider: { code: 400, status: 'INVALID_ARGUMENT', reasons: ['API_KEY_INVALID'] },
    });
    expect(schemaFailure.diagnostic()).not.toEqual(keyFailure.diagnostic());

    for (const error of [schemaFailure, keyFailure]) {
      expect(error.message).not.toContain(apiKey);
      expect(error.message).not.toContain(prompt);
      expect(JSON.stringify(error.diagnostic())).not.toContain(apiKey);
      expect(JSON.stringify(error.diagnostic())).not.toContain(prompt);
      expect(JSON.stringify(error.diagnostic())).not.toContain('metadata');
      expect(error.rejectedBeforeGeneration).toBe(true);
      expect(isGeminiRequestUncharged(error)).toBe(true);
      expect(error.canTryAnotherModel).toBe(false);
    }
    expect(schemaFailure.publicError()).toMatchObject({ code: 'gemini-invalid-request', retryable: false });
    expect(keyFailure.publicError()).toMatchObject({ code: 'gemini-authentication', retryable: true });
  });

  it('does not infer authentication or retain injected status, reason, field path, message, or metadata', () => {
    const apiKey = 'API-KEY-CANARY-318';
    const prompt = 'PROMPT-CANARY-642';
    const error = parseGeminiError(400, 'flash', { error: {
      code: 599, status: `INVALID_ARGUMENT-${apiKey}`, message: `API key invalid ${apiKey} ${prompt}`,
      details: [
        { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: `API_KEY_INVALID_${apiKey}`, metadata: { key: apiKey, prompt } },
        { '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [
          { field: `tools[0].properties.${apiKey}`, description: `Private ${prompt}` },
          { field: `contents[0].parts[0].text.${prompt}`, description: `Private ${apiKey}` },
        ] },
      ]
    } });

    expect(error.kind).toBe('invalid-request');
    expect(error.diagnostic()).toEqual({ httpStatus: 400, model: 'flash', kind: 'invalid-request' });
    const serialized = `${error.message} ${JSON.stringify(error.diagnostic())} ${JSON.stringify(error.publicError())}`;
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(prompt);
    expect(serialized).not.toContain('API_KEY_INVALID');
    expect(serialized).not.toContain('Private');
    expect(isGeminiRequestUncharged(error)).toBe(true);
  });

  it('caps retained provider field paths', () => {
    const violations = Array.from({ length: 12 }, (_, index) => ({
      field: `tools[0].functionDeclarations[${index}].parameters`,
      description: 'Description is not retained.',
    }));
    const error = parseGeminiError(400, 'flash', { error: {
      code: 400, status: 'INVALID_ARGUMENT',
      details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: violations }]
    } });

    expect(error.diagnostic().provider?.fieldPaths).toHaveLength(8);
    expect(error.diagnostic().provider?.fieldPaths?.every((field) => field.length <= 240)).toBe(true);
  });

  it('preserves the legacy diagnostic shape and retry delay for callers without structured details', () => {
    const error = new GeminiApiError(503, 'flash', 'server', 21500);
    expect(error.diagnostic()).toEqual({ httpStatus: 503, model: 'flash', kind: 'server', retryAfterMs: 21500 });
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
