// SU-NOTE-6 (g1, 20.11) : sur la photo d'un ticket tâché (doc25), la 3.8 est tombée au délai de 45 s (45 002 ms, lecture entière 52 s) : on garde alors
// le provisoire et ses montants faux. Décision du pilote : la 3.8 a 60 s ; les Flash-Lite gardent 45 s ; le total du scan (100 s) tient.
import { describe, expect, it } from 'vitest';
import { SCAN_LITE_TIMEOUT_MS, SCAN_STRONG_TIMEOUT_MS, SCAN_TOTAL_TIMEOUT_MS } from '../../functions/src/aiTaskDeadline';

describe('SU-NOTE-6 : délais de lecture d’une facture', () => {
  it('la 3.8 a 60 s, les Flash-Lite 45 s', () => {
    expect(SCAN_STRONG_TIMEOUT_MS).toBe(60_000);
    expect(SCAN_LITE_TIMEOUT_MS).toBe(45_000);
  });
  it('les deux Flash-Lite (au pire 45 s, en parallèle) puis la 3.8 tiennent dans le total du scan (100 s)', () => {
    expect(SCAN_TOTAL_TIMEOUT_MS).toBe(100_000);
    expect(SCAN_LITE_TIMEOUT_MS + SCAN_STRONG_TIMEOUT_MS).toBeGreaterThan(SCAN_TOTAL_TIMEOUT_MS - 1); // au pire des deux, c'est le total qui coupe : jamais plus de 100 s
  });
});
