import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ call: vi.fn(), options: [] as unknown[] }));
vi.mock('firebase/functions', () => ({ httpsCallable: (_functions: unknown, _name: string, options?: unknown) => { mocked.options.push(options); return mocked.call; } }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { withManualEntry } from '../../src/ui/manualEntry';
import { AI_CLIENT_TIMEOUT_MS, AI_TASK_DEADLINE_MS } from '../../functions/src/aiTaskDeadline';

/** #100.2 et #100.4 : le client attend la réponse du serveur et rend lisible une erreur sans corps. */
const functionsError = (code: string, message = code) => Object.assign(new Error(message), { code: `functions/${code}` });
// Braces: a hook that returns the mock would have Vitest call it again as a cleanup.
beforeEach(() => { mocked.call.mockReset(); });

describe('Délais client et serveur alignés', () => {
  it('le client attend plus longtemps que le délai total de la tâche serveur, marge comprise', () => {
    expect(mocked.options).toHaveLength(1);
    expect(mocked.options[0]).toEqual({ timeout: AI_CLIENT_TIMEOUT_MS });
    // 70 s was the Firebase SDK default: the import kept running and billing after the client gave up.
    expect(AI_CLIENT_TIMEOUT_MS).toBeGreaterThanOrEqual(AI_TASK_DEADLINE_MS + 20_000);
    expect(AI_CLIENT_TIMEOUT_MS).toBeGreaterThan(70_000);
    // The Function itself must outlive the client (timeoutSeconds: 300 in ai.ts).
    expect(AI_CLIENT_TIMEOUT_MS).toBeLessThan(300_000);
  });
});

describe('Erreur sans corps rendue lisible', () => {
  it.each(['unknown', 'not-found', 'aborted', 'unimplemented', 'invalid-argument', 'cancelled'])(
    'une FunctionsError réduite à son code « %s » devient un message français', async code => {
      mocked.call.mockRejectedValue(functionsError(code));
      const result = await AiClient.run({ task: 'reviewRecipe', context: { recette: 'x' } });
      expect(result.ok).toBe(false);
      expect(result.error).not.toBe(code);
      expect(result.error).toMatch(/serveur IA/);
      expect(result.error).toMatch(/saisie manuelle reste disponible/);
      // V2 Chrome 390 px: guillemets keep their code on the same line (non-breaking spaces).
      expect(result.error).toContain(`(code « ${code} »)`);
    });

  it('garde le message français d’une erreur serveur explicite', async () => {
    mocked.call.mockRejectedValue(functionsError('invalid-argument', 'Fichier trop volumineux (8 Mo maximum).'));
    expect((await AiClient.run({ task: 'importRecipe', instruction: 'x' })).error).toBe('Fichier trop volumineux (8 Mo maximum).');
  });

  it('un dépassement côté client ne propose plus un niveau que l’écran n’offre pas, et dit que l’appel a pu être compté', async () => {
    mocked.call.mockRejectedValue(functionsError('deadline-exceeded'));
    const error = (await AiClient.run({ task: 'importRecipe', instruction: 'x' })).error!;
    expect(error).not.toMatch(/niveau Rapide/);
    expect(error).toMatch(/compté dans le budget IA/);
  });

  it('les autres codes connus gardent leur message', async () => {
    mocked.call.mockRejectedValue(functionsError('internal'));
    expect((await AiClient.run({ task: 'reviewRecipe' })).error).toBe('Service IA momentanément indisponible.');
    mocked.call.mockRejectedValue(functionsError('resource-exhausted'));
    // DESIGN.md: no provider name on screen (V3 REV-D100, same rule as the server messages).
    expect((await AiClient.run({ task: 'reviewRecipe' })).error).toBe('Quota IA atteint. Réessaie plus tard.');
  });

  it('la sortie manuelle des écrans de fiche est une phrase, jamais un fragment accolé', () => {
    expect(withManualEntry('Rien n’est appliqué.')).toBe('Rien n’est appliqué. À saisir à la main.');
    expect(withManualEntry('Lecture indisponible')).toBe('Lecture indisponible. À saisir à la main.');
    expect(withManualEntry('Réessaie plus tard.  ')).toBe('Réessaie plus tard. À saisir à la main.');
  });
});
