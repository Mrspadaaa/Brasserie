import { describe, expect, it } from 'vitest';
import { messageSansSaccharification } from '../../../src/domain/fermentables/empatage';

// BR-31 (08.11) : retirer le seul palier laissait un empâtage de grain sans saccharification, sans alerte.
describe('messageSansSaccharification', () => {
  const sacc = { name: 'Saccharification', tempC: 67, durationMin: 60 };
  it('grain à l’empâtage et aucun palier : le dit', () => {
    expect(messageSansSaccharification([], 6.1)).toMatch(/Aucun palier de saccharification/);
  });
  it('des paliers, mais aucun dans la plage d’amylase (62–72 °C) : le dit aussi', () => {
    expect(messageSansSaccharification([{ name: 'Repos protéique', tempC: 52, durationMin: 20 }], 6.1)).toMatch(/62.{1,3}72/);
  });
  it('un palier de 67 °C pendant 60 min : rien', () => {
    expect(messageSansSaccharification([sacc], 6.1)).toBeNull();
  });
  it('un palier à 67 °C de 0 min (simple montée) ne convertit rien', () => {
    expect(messageSansSaccharification([{ ...sacc, durationMin: 0 }], 6.1)).not.toBeNull();
  });
  it('sans grain à l’empâtage (sucres, NOLO sans grain) : rien à dire', () => {
    expect(messageSansSaccharification([], 0)).toBeNull();
    expect(messageSansSaccharification([], Number.NaN)).toBeNull();
  });
  it('un palier à température illisible n’est pas compté', () => {
    expect(messageSansSaccharification([{ name: 'x', tempC: Number.NaN, durationMin: 60 }], 5)).not.toBeNull();
  });
});
