import { describe, expect, it } from 'vitest';
import { observedGeminiCost, quoteGeminiCost } from '../../functions/src/geminiCosts';
import { GEMINI_MODEL, INVOICE_STRONG_MODEL, assertGeminiModel } from '../../functions/src/models';

// Voie h1 : Hydrogen est chiffré à son tarif officiel (1,50 $ / 7,50 $ le million, sortie réflexion comprise, lu le 14.11.2026), jamais à zéro, jamais inconnu.
const image = { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } };
const body = { contents: [{ parts: [{ text: 'Lis la facture' }, image] }], generationConfig: { maxOutputTokens: 12000 } };
const usage = { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 800, thoughtsTokenCount: 200, totalTokenCount: 2000 } };

describe('Tarif d’Hydrogen (3ᵉ lecture des justificatifs)', () => {
  it('la réserve : le contexte entier en entrée (média) et 12 000 jetons de sortie, à 1,50 $ / 7,50 $ × 1,25 CHF/USD', () => {
    const quote = quoteGeminiCost(INVOICE_STRONG_MODEL, body);
    expect(quote).toMatchObject({ model: 'gemini-4-hydrogen', inputTokens: 1_048_576, outputTokens: 12000 });
    expect(quote.reservedMicroChf).toBe(Math.ceil((1_048_576 * 1_500_000 + 12000 * 7_500_000) * 5 / 4_000_000));
    expect(quote.reservedMicroChf).toBeGreaterThan(0);
  });
  it('le coût réglé suit les jetons annoncés : 1000 en entrée, 1000 en sortie (réflexion comprise)', () => {
    const quote = quoteGeminiCost(INVOICE_STRONG_MODEL, body);
    expect(observedGeminiCost(quote, usage)).toBe(Math.ceil((1000 * 1_500_000 + 1000 * 7_500_000) * 5 / 4_000_000));
  });
  it('au même prix que la 3.8, mais jamais le tarif d’une Flash-Lite ni d’un modèle inconnu', () => {
    expect(quoteGeminiCost(INVOICE_STRONG_MODEL, body).reservedMicroChf).toBe(quoteGeminiCost(GEMINI_MODEL, body).reservedMicroChf);
    expect(() => quoteGeminiCost('gemini-4-inconnu', body)).toThrow('Tarif de ce modèle Gemini inconnu');
  });
  it('est sur la liste blanche du serveur ; un autre modèle 4 n’y est pas encore', () => {
    expect(() => assertGeminiModel(INVOICE_STRONG_MODEL)).not.toThrow();
    expect(() => assertGeminiModel('gemini-4-carbon')).toThrow('refusé');
  });
});
