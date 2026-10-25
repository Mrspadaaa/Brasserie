import './temoin'; // témoin négatif de check:engine (B3)
import { describe, expect, it } from 'vitest';
import { ecartTolerances, styleMasking, toleranceScale } from '../../../src/domain/hopIndex/v4/tolerance';

// D54 : « un peu plus résineux pour une stout est pas très problématique, pour une lager kolsch très ».
const resine = (code: string, a?: Parameters<typeof toleranceScale>[1]) => toleranceScale(code, a).familles.find((x) => x.family === 'resin')!;

describe('tolérance par style (D54)', () => {
  it('une stout export couvre plus qu’une Kölsch ou une lager tchèque', () => {
    const stout = styleMasking('16D'), kolsch = styleMasking('5B'), tcheque = styleMasking('3B');
    expect(stout.m!).toBeGreaterThan(0.75);
    expect(kolsch.m!).toBeLessThan(0.25);
    expect(stout.facteur).toBeGreaterThan(tcheque.facteur);
    expect(tcheque.facteur).toBeGreaterThan(kolsch.facteur);
  });

  it('la même résine reste dans la stout et sort nettement de la Kölsch', () => {
    // Avant D54, la résine avait la même bande neutre (0–30) dans les trois styles.
    expect(resine('16D').bandeStyle).toEqual(resine('5B').bandeStyle);
    expect(ecartTolerances(resine('16D'), 20)).toBe(0);
    expect(ecartTolerances(resine('5B'), 20)!).toBeGreaterThanOrEqual(1);
    expect(ecartTolerances(resine('3B'), 20)!).toBeGreaterThan(0);
    expect(ecartTolerances(resine('5B'), 35)!).toBeGreaterThan(ecartTolerances(resine('16D'), 35)!);
  });

  it('une famille nommée par le style garde sa bande du BJCP', () => {
    const t = toleranceScale('5B').familles.find((x) => x.family === 'floral')!;
    expect(t.bande).toEqual(t.bandeStyle);
  });

  it('mon a priori change l’échelle : libre élargit, strict resserre, banni ferme', () => {
    const normal = resine('5B'), libre = resine('5B', { resin: 'libre' }), strict = resine('5B', { resin: 'strict' }), banni = resine('16D', { resin: 'banni' });
    expect(libre.bande![1]).toBeGreaterThan(normal.bande![1]);
    expect(strict.bande![1]).toBeLessThan(normal.bande![1]);
    expect(ecartTolerances(libre, 20)!).toBeLessThan(ecartTolerances(normal, 20)!);
    expect(banni.bande).toEqual([0, 0]);
    expect(ecartTolerances(banni, 10)!).toBeGreaterThanOrEqual(1);
    expect(banni.depuis).toContain('mon a priori : banni');
  });

  it('un style sans statistiques garde ses bandes (facteur 1)', () => {
    expect(styleMasking('zz-inconnu')).toMatchObject({ m: null, facteur: 1 });
  });

  it('table de lecture (rapport)', () => {
    const rows = ['16D', '15B', '5B', '3B', '1A', '21A'].map((c) => {
      const t = toleranceScale(c), r = t.familles.find((x) => x.family === 'resin')!;
      return { style: c, m: t.masquage.m, f: t.masquage.facteur, resine: r.status, bande: r.bande?.join('–'), T: r.T, a20: ecartTolerances(r, 20), a35: ecartTolerances(r, 35) };
    });
    console.table(rows);
    expect(rows).toHaveLength(6);
  });
});
