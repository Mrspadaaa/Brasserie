import { afterEach, describe, expect, it } from 'vitest';
import { callSpec, parseArgs } from '../../scripts/banc-lecture-facture';
import { etiquetteLectures, parseLectures, poserFort, poserLectures } from '../../scripts/banc-lecture-modeles';
import { GEMINI_LITE_MODEL, INVOICE_STRONG_MODEL } from '../../functions/src/models';

// Voie t2b : `--lectures` remplace le modèle des deux lectures parallèles de Csv8. Aucun appel réseau ici.
afterEach(() => { poserLectures(null); poserFort(null); });

describe('--lectures (voie t2b)', () => {
  it('accepte un modèle 4 ou Flash-Lite, refuse le reste', () => {
    expect(parseLectures('gemini-4-hydrogen@low')).toEqual({ model: 'gemini-4-hydrogen', thinking: 'LOW' });
    expect(etiquetteLectures(parseLectures(`${GEMINI_LITE_MODEL}@minimal`))).toBe(`${GEMINI_LITE_MODEL}@minimal`);
    expect(() => parseLectures('gemini-4-argon@xhigh')).toThrow(/niveaux acceptés/);
    expect(() => parseLectures(`${GEMINI_LITE_MODEL}@high`)).toThrow(/niveaux acceptés/);
    expect(() => parseLectures('gemini-3.8-flash@low')).toThrow(/--lectures attend/);
  });
  it('sans option : la production inchangée (Flash-Lite low, 8 192 jetons)', () => {
    for (const lecture of [1, 2] as const) expect(callSpec('Csv8', lecture)).toMatchObject({ model: GEMINI_LITE_MODEL, thinking: 'LOW', maxOut: 8192 });
  });
  it('avec option : lectures 1 et 2 de Csv8 seulement, plafond et délai relevés pour un modèle 4', () => {
    poserLectures(parseLectures('gemini-4-hydrogen@low'));
    for (const lecture of [1, 2] as const) expect(callSpec('Csv8', lecture)).toMatchObject({ model: 'gemini-4-hydrogen', thinking: 'LOW', maxOut: 12000, timeoutMs: 90000 });
    expect(callSpec('Csv8', 3).model).toBe(INVOICE_STRONG_MODEL);
    expect(callSpec('C', 1).model).toBe(GEMINI_LITE_MODEL);
  });
  it('Flash-Lite minimal garde son plafond et son délai', () => {
    poserLectures(parseLectures(`${GEMINI_LITE_MODEL}@minimal`));
    expect(callSpec('Csv8', 1)).toMatchObject({ model: GEMINI_LITE_MODEL, thinking: 'MINIMAL', maxOut: 8192, timeoutMs: 45000 });
  });
  it('parseArgs lit --lectures et refuse un modèle inconnu', () => {
    expect(parseArgs(['--simuler', '--lectures', 'gemini-4-hydrogen@low']).lectures).toBe('gemini-4-hydrogen@low');
    expect(parseArgs(['--simuler']).lectures).toBeUndefined();
    expect(() => parseArgs(['--simuler', '--lectures', 'gemini-9@low'])).toThrow();
  });
});
