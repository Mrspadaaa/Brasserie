// Voie d2-import-bm (#180) : la couverture du catalogue des 318 houblons, mesurée sur ce que le cache Beer Maverick publie.
// Seuils posés sur la couverture réelle de la source, pas sur un souhait : ce que Beer Maverick écrit « Unknown » (31 cohumulones,
// 11 farnésènes) ou ne publie pas (58 pages sans la ventilation de l'huile) reste inconnu, jamais 0.
//   cohumulone : 287 / 318 = 90,3 %  (seuil 90 %)      farnésène : 249 / 318 = 78,3 %  (seuil 75 %)
//   usage (Aroma, Bittering, Dual) : 318 / 318 = 100 % (seuil 90 %)
// Rouge sur HEAD : aucun de ces champs n'existait dans le catalogue.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';

const N = CATALOGUE.length;
const part = (n: number) => (100 * n) / N;
const plageOk = (r: unknown): r is [number, number] => Array.isArray(r) && r.length === 2 && r.every((x) => typeof x === 'number' && Number.isFinite(x));

describe('couverture du catalogue (Beer Maverick, cache du 2026-09-08)', () => {
  it('318 variétés', () => expect(N).toBe(318));
  it('cohumulone ≥ 90 % des variétés', () => {
    expect(part(CATALOGUE.filter((h) => plageOk(h.cohumulone)).length)).toBeGreaterThanOrEqual(90);
  });
  it('farnésène ≥ 75 % des variétés', () => {
    expect(part(CATALOGUE.filter((h) => plageOk(h.oils.farnesene)).length)).toBeGreaterThanOrEqual(75);
  });
  it('usage (Aroma, Bittering, Dual) ≥ 90 % des variétés', () => {
    expect(part(CATALOGUE.filter((h) => h.purpose === 'aroma' || h.purpose === 'bittering' || h.purpose === 'dual').length)).toBeGreaterThanOrEqual(90);
  });
});
