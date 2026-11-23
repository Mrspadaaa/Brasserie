import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ajouterAnnees, plageDate } from '../../../src/ui/plageDate';
import { ajouterMois } from '../../../src/ui/calendrier/echelle';
import { ecartJours, lundiDe } from '../../../src/domain/calendrier';
import { RUNS, arbJour, arbJours, deIso, enIso, estBissextile, jourDeSemaine, joursDuMois } from './_dates';

/**
 * D425 (22.11, GESTE-DATE-PARTOUT) : la plage de la frise d'un champ de date (`ChoixDate`, qui la passe à `DureeFenetre` en `epoque` / `dernier`) =
 * [min(valeur, aujourd'hui − 5 ans), max(valeur, aujourd'hui + 5 ans)], en lundis. Une date ne sort jamais de la plage de sa propre frise.
 */

const arbValeur = fc.oneof(arbJour, fc.integer({ min: 2000, max: 2045 }).chain(a => fc.integer({ min: 1, max: 12 }).map(m => `${a}-${String(m).padStart(2, '0')}-01`)));

describe('plageDate : la frise d’un champ de date', () => {
  it('epoque et dernier sont des lundis, dans l’ordre, et la valeur est toujours dans la plage (jusqu’au dimanche du dernier lundi)', () => {
    fc.assert(fc.property(arbValeur, arbJour, (valeur, aujourdhui) => {
      const { epoque, dernier } = plageDate(valeur, aujourdhui);
      expect(jourDeSemaine(deIso(epoque))).toBe(0);
      expect(jourDeSemaine(deIso(dernier))).toBe(0);
      expect(deIso(epoque)).toBeLessThanOrEqual(deIso(dernier));
      expect(deIso(valeur)).toBeGreaterThanOrEqual(deIso(epoque));
      expect(deIso(valeur)).toBeLessThanOrEqual(deIso(dernier) + 6);
      // « aujourd'hui ± 5 ans » reste atteignable en toute circonstance
      expect(deIso(epoque)).toBeLessThanOrEqual(deIso(ajouterAnnees(aujourdhui, -5)));
      expect(deIso(dernier) + 6).toBeGreaterThanOrEqual(deIso(ajouterAnnees(aujourdhui, 5)));
    }), { numRuns: RUNS });
  });

  it('une valeur dans aujourd’hui ± 5 ans ne déplace pas la plage (l’échelle ne bouge pas sous le doigt) ; une valeur plus ancienne ou plus lointaine l’étend', () => {
    fc.assert(fc.property(arbJour, arbJour, arbJour, (aujourdhui, v1, v2) => {
      const base = plageDate(aujourdhui, aujourdhui);
      const bas = ajouterAnnees(aujourdhui, -5), haut = ajouterAnnees(aujourdhui, 5);
      for (const v of [v1, v2]) {
        const p = plageDate(v, aujourdhui);
        if (v >= bas && v <= haut) expect(p).toEqual(base);
        else if (v < bas) { expect(p.epoque).toBe(lundiDe(v)); expect(p.dernier).toBe(base.dernier); }
        else { expect(p.dernier).toBe(lundiDe(v)); expect(p.epoque).toBe(base.epoque); }
      }
    }), { numRuns: RUNS });
  });

  it('une valeur absente ou illisible retombe sur aujourd’hui ; la position du repère (en jours depuis epoque) reste dans [0, étendue de la frise]', () => {
    fc.assert(fc.property(fc.constantFrom('', 'n’importe quoi', '2026-13-45x', '26.11.2026'), arbJour, (valeur, aujourdhui) => {
      expect(plageDate(valeur, aujourdhui)).toEqual(plageDate(aujourdhui, aujourdhui));
    }), { numRuns: RUNS });
    fc.assert(fc.property(arbValeur, arbJour, (valeur, aujourdhui) => {
      const { epoque, dernier } = plageDate(valeur, aujourdhui);
      const k = ecartJours(epoque, valeur), kMax = ecartJours(epoque, dernier) + 7;
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(kMax);
    }), { numRuns: RUNS });
  });
});

describe('ajouterAnnees : ce même jour, n années plus tôt ou plus tard', () => {
  it('une date réelle, la même année ± n, le même jour et mois, sauf le 29 févr. ramené au 28 les années non bissextiles', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -12, max: 12 }), (j, n) => {
      const iso = enIso(j), a = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)), jj = Number(iso.slice(8));
      const r = ajouterAnnees(iso, n);
      expect(r.slice(0, 4)).toBe(String(a + n));
      expect(Number(r.slice(5, 7))).toBe(m);
      expect(Number(r.slice(8))).toBe(Math.min(jj, joursDuMois(a + n, m)));
      expect(enIso(deIso(r))).toBe(r);
      if (!(m === 2 && jj === 29)) expect(ajouterAnnees(r, -n)).toBe(iso);
      if (m === 2 && jj === 29 && estBissextile(a + n)) expect(r.slice(8)).toBe('29');
    }), { numRuns: RUNS });
  });

  it('douze mois = une année (même règle de repli du 29 févr. que ajouterMois)', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -10, max: 10 }), (j, n) => {
      expect(ajouterAnnees(enIso(j), n)).toBe(ajouterMois(enIso(j), 12 * n));
    }), { numRuns: RUNS });
  });
});
