import { describe, expect, it } from 'vitest';
import { observedGeminiCost, quoteGeminiCost } from '../../functions/src/geminiCosts';
import { GEMINI_MODEL, GEMINI_MODELS, INVOICE_ARGON_MODEL, assertGeminiModel, invoiceRelecture } from '../../functions/src/models';

// Voie h1 : Argon (relecture demandée) est chiffré à son tarif officiel, qui suit la DATE : 2 $ / 10 $ le million jusqu'au 30.11.2026, 4 $ / 20 $ dès le 1.12.2026 (Europe/Zurich).
// Jamais zéro, jamais le tarif d'un autre modèle. Les noms et les prix sont écrits en clair : un test qui importerait la constante passerait aussi sur une constante fausse.
const image = { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } };
const body = { contents: [{ parts: [{ text: 'Lis la facture' }, image] }], generationConfig: { maxOutputTokens: 12000 } };
const usage = { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 800, thoughtsTokenCount: 200, totalTokenCount: 2000 } };
const avant = Date.parse('2026-11-30T23:59:59+01:00'), apres = Date.parse('2026-12-01T00:00:00+01:00'), loin = Date.parse('2027-03-15T12:00:00+01:00');
const micro = (entree: number, sortie: number, input: number, output: number) => Math.ceil((input * entree + output * sortie) * 5 / 4_000_000);

describe('Tarif d’Argon (relecture demandée par l’utilisateur)', () => {
  it('est dans la liste blanche et se nomme gemini-4-argon', () => {
    expect(INVOICE_ARGON_MODEL).toBe('gemini-4-argon');
    expect(GEMINI_MODELS).toContain('gemini-4-argon');
    expect(() => assertGeminiModel('gemini-4-argon')).not.toThrow();
    expect(() => assertGeminiModel('gemini-4-argon-latest')).toThrow('Aucune requête n’est envoyée');
  });
  it('jusqu’au 30.11.2026 : 2 $ / 10 $ le million (réserve = contexte entier en entrée, 12 000 jetons de sortie)', () => {
    const quote = quoteGeminiCost(INVOICE_ARGON_MODEL, body, avant);
    expect(quote).toMatchObject({ model: 'gemini-4-argon', inputTokens: 1_048_576, outputTokens: 12000, at: avant });
    expect(quote.reservedMicroChf).toBe(micro(2_000_000, 10_000_000, 1_048_576, 12000));
    expect(quote.reservedMicroChf).toBeGreaterThan(quoteGeminiCost(GEMINI_MODEL, body, avant).reservedMicroChf);
  });
  it('dès le 1.12.2026 : 4 $ / 20 $, le double, et pour toujours ensuite', () => {
    for (const at of [apres, loin]) {
      const quote = quoteGeminiCost(INVOICE_ARGON_MODEL, body, at);
      expect(quote.reservedMicroChf).toBe(micro(4_000_000, 20_000_000, 1_048_576, 12000));
    }
    expect(quoteGeminiCost(INVOICE_ARGON_MODEL, body, apres).reservedMicroChf).toBeGreaterThanOrEqual(2 * quoteGeminiCost(INVOICE_ARGON_MODEL, body, avant).reservedMicroChf - 1);
  });
  it('le règlement suit le tarif du jour du devis, pas celui du jour où il est écrit', () => {
    expect(observedGeminiCost(quoteGeminiCost(INVOICE_ARGON_MODEL, body, avant), usage)).toBe(micro(2_000_000, 10_000_000, 1000, 1000));
    expect(observedGeminiCost(quoteGeminiCost(INVOICE_ARGON_MODEL, body, apres), usage)).toBe(micro(4_000_000, 20_000_000, 1000, 1000));
  });
  it('le changement de tarif ne touche aucun autre modèle', () => {
    for (const model of [GEMINI_MODEL, 'gemini-4-hydrogen', 'gemini-3.5-flash-lite']) expect(quoteGeminiCost(model, body, loin).reservedMicroChf).toBe(quoteGeminiCost(model, body, avant).reservedMicroChf);
  });
  it('jamais zéro, jamais inconnu', () => {
    expect(quoteGeminiCost(INVOICE_ARGON_MODEL, body).reservedMicroChf).toBeGreaterThan(0);
    expect(() => quoteGeminiCost('gemini-4-argonn', body)).toThrow('Tarif de ce modèle Gemini inconnu');
  });
});

describe('Option de relecture du client', () => {
  it('seule la valeur exacte « argon » est admise ; un nom de modèle ou toute autre valeur est ignoré', () => {
    expect(invoiceRelecture('argon')).toBe('argon');
    for (const v of ['gemini-4-argon', 'gemini-4-hydrogen', 'gemini-9', 'ARGON', ' argon', 'hydrogen', '', 0, 1, true, null, undefined, {}, ['argon'], { relecture: 'argon' }]) expect(invoiceRelecture(v), String(JSON.stringify(v))).toBeUndefined();
  });
});
