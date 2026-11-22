import { describe, expect, it } from 'vitest';
import { GEMINI_MODEL, GEMINI_MODELS, INVOICE_STRONG_MODEL, brewerAnalysisAttempts, geminiAttempts } from '../../functions/src/models';

// Voie h3 (14.11) : l'analyse du compagnon passe à Hydrogen en réflexion basse, repli une fois sur 3.8 ; rien d'autre ne change de modèle.
describe('modèles du compagnon : ordre d’essai de l’analyse', () => {
  it('l’analyse essaie Hydrogen en réflexion basse, puis une seule fois 3.8', () => {
    expect(brewerAnalysisAttempts()).toEqual([
      { model: 'gemini-4-hydrogen', thinkingLevel: 'low' },
      { model: 'gemini-3.8-flash', thinkingLevel: 'low' }
    ]);
    expect(brewerAnalysisAttempts()[0].model).toBe(INVOICE_STRONG_MODEL);
    expect(GEMINI_MODELS).toContain(brewerAnalysisAttempts()[0].model);
  });
  it('la relecture, la recherche et les autres usages gardent leur route : 3.8 deux fois, ou Flash-Lite puis 3.8', () => {
    for (const usage of ['review', 'research', 'find_brewing_suppliers', 'analysis'])
      expect(geminiAttempts(usage).map(a => a.model)).toEqual([GEMINI_MODEL, GEMINI_MODEL]);
    expect(geminiAttempts('lookup_brewing_reference').map(a => a.model)).toEqual(['gemini-3.5-flash-lite', GEMINI_MODEL]);
    expect(geminiAttempts('analysis', 'max').map(a => a.model)).toEqual([GEMINI_MODEL, GEMINI_MODEL]);
  });
  it('voie h4 : le diagnostic de brassin en Rapide essaie Hydrogen, puis Flash-Lite, puis 3.8 ; Max et les autres usages ne bougent pas', () => {
    expect(geminiAttempts('diagnoseBatch', 'fast')).toEqual([
      { model: 'gemini-4-hydrogen', thinkingLevel: 'low' },
      { model: 'gemini-3.5-flash-lite', thinkingLevel: 'low' },
      { model: GEMINI_MODEL, thinkingLevel: 'low' }
    ]);
    expect(geminiAttempts('diagnoseBatch', 'fast')[0].model).toBe(INVOICE_STRONG_MODEL);
    expect(geminiAttempts('diagnoseBatch', 'max')).toEqual([{ model: GEMINI_MODEL, thinkingLevel: 'high' }, { model: GEMINI_MODEL, thinkingLevel: 'high' }]);
    expect(geminiAttempts('readHopCoa').map(a => a.model)).toEqual(['gemini-3.5-flash-lite', GEMINI_MODEL]);
    expect(geminiAttempts('importRecipe').map(a => a.model)).toEqual([GEMINI_MODEL, GEMINI_MODEL]);
  });
});
