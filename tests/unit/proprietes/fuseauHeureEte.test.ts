import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import { aujourdhuiISO, bornes, jourSaisi, lire, serialiser, type Periode } from '../../../src/components/periode/periode';
import { todayISO } from '../../../src/domain/finance/ledger';
import { RUNS, TOUS_LES_JOURS, deIso, enIso, jourDeSemaine, joursDepuisCivil, joursDuMois, semaineIso } from './_dates';

/**
 * Fuseau Europe/Zurich et passage heure d'été/hiver : aucun jour perdu ni doublé, « aujourd'hui » juste à minuit.
 * Les calculs de la frise sont en UTC (jamais de glissement) ; seuls `aujourdhuiISO`, `jourSaisi`, `bornes` (mois) lisent l'heure locale.
 * Se joue sous n'importe quel fuseau (`TZ=Europe/Zurich`, `TZ=America/Los_Angeles`, `TZ=Pacific/Auckland` : voir FAST-CHECK.md) ; la machine du
 * brasseur est en Europe/Zurich : les tests de « même date qu'ailleurs dans l'app » ne se jouent que là.
 */

const FUSEAU = Intl.DateTimeFormat().resolvedOptions().timeZone;
const enZurich = FUSEAU === 'Europe/Zurich';
const dernierDimanche = (a: number, m: number) => { const f = joursDepuisCivil(a, m, 31); return f - ((jourDeSemaine(f) + 1) % 7); };
const DIMANCHES_HEURE: number[] = Array.from({ length: 16 }, (_, i) => 2020 + i).flatMap(a => [dernierDimanche(a, 3), dernierDimanche(a, 10)]);

describe('changement d’heure : aucun jour perdu ni doublé', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('les dimanches de changement d’heure (mars et octobre, 2020-2035) : semaine, lundi, index et numéro restent ceux de la référence ISO', () => {
    for (const d of DIMANCHES_HEURE) {
      for (const k of [-2, -1, 0, 1, 2]) {
        const iso = enIso(d + k), ref = semaineIso(d + k);
        expect(C.lundiDe(iso)).toBe(enIso(ref.lundi));
        expect(C.numeroSemaine(iso)).toBe(ref.numero);
        const s = C.semainesDe(iso, 104, 52);
        expect(s[52].debut).toBe(enIso(ref.lundi));
        expect(C.indexSemaine(s, iso)).toBe(52);
        expect(C.dateDeSemaine(iso)).toMatch(new RegExp(`^S${ref.numero}, `));
      }
    }
  });

  it('une semaine qui contient un changement d’heure a toujours 7 jours : lundi → dimanche = 6 jours, lundi suivant = +7', () => {
    for (const d of DIMANCHES_HEURE) {
      const lundi = C.lundiDe(enIso(d));
      expect(C.ecartJours(lundi, C.dimancheDe(enIso(d)))).toBe(6);
      expect(C.ecartJours(lundi, C.ajouterJours(lundi, 7))).toBe(7);
      expect(C.ecartSemaines(lundi, C.ajouterJours(lundi, 7))).toBe(1);
    }
  });

  it('jourSaisi (heure locale) rend pour chacun des 5 844 jours de 2020 à 2035 le même jour, jamais celui d’avant ou d’après', () => {
    const faux: string[] = [];
    for (const j of TOUS_LES_JOURS) {
      const iso = enIso(j);
      const lu = jourSaisi(`${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.${iso.slice(0, 4)}`, 2000);
      if (lu !== iso) faux.push(`${iso} → ${lu}`);
    }
    expect(faux.slice(0, 5)).toEqual([]);
    expect(jourSaisi('31.04.2026', 2026)).toBeNull();
    expect(jourSaisi('29.02.2027', 2027)).toBeNull();
    expect(jourSaisi('29.02.2028', 2028)).toBe('2028-02-29');
  });

  it('bornes d’un mois, d’un trimestre, d’une année : du premier au vrai dernier jour (heure locale), 2000-2040', () => {
    fc.assert(fc.property(fc.integer({ min: 2000, max: 2040 }), fc.integer({ min: 1, max: 12 }), fc.constantFrom(1, 2, 3, 4), (a, m, t) => {
      const mois = bornes({ genre: 'mois', annee: a, mois: m });
      expect(mois).toEqual({ du: `${a}-${String(m).padStart(2, '0')}-01`, au: `${a}-${String(m).padStart(2, '0')}-${String(joursDuMois(a, m)).padStart(2, '0')}` });
      const tri = bornes({ genre: 'trimestre', annee: a, trimestre: t as 1 | 2 | 3 | 4 });
      const m3 = (t - 1) * 3 + 3;
      expect(tri).toEqual({ du: `${a}-${String((t - 1) * 3 + 1).padStart(2, '0')}-01`, au: `${a}-${String(m3).padStart(2, '0')}-${String(joursDuMois(a, m3)).padStart(2, '0')}` });
      expect(bornes({ genre: 'annee', annee: a })).toEqual({ du: `${a}-01-01`, au: `${a}-12-31` });
    }), { numRuns: RUNS });
  });

  it('serialiser puis lire rend la même période (mois, trimestre, année, plage de dates)', () => {
    fc.assert(fc.property(fc.integer({ min: 2000, max: 2040 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 0, max: 400 }), (a, m, n) => {
      const du = joursDepuisCivil(a, m, 1);
      const periodes: Periode[] = [
        { genre: 'mois', annee: a, mois: m }, { genre: 'trimestre', annee: a, trimestre: (Math.floor((m - 1) / 3) + 1) as 1 | 2 | 3 | 4 },
        { genre: 'annee', annee: a }, { genre: 'dates', du: enIso(du), au: enIso(du + n) }, { genre: 'tout' }
      ];
      for (const p of periodes) expect(lire(serialiser(p))).toEqual(p);
    }), { numRuns: RUNS });
  });
});

describe('« aujourd’hui » à minuit, autour des changements d’heure', () => {
  afterEach(() => { vi.useRealTimers(); });
  /** Des instants à ± 14 h de chaque minuit UTC piège : couvre tous les décalages possibles de minuit local. */
  const arbInstant = fc.oneof(
    fc.integer({ min: Date.UTC(2020, 0, 1), max: Date.UTC(2035, 11, 31) }),
    fc.constantFrom(...DIMANCHES_HEURE).chain(d => fc.integer({ min: -14 * 3600_000, max: 14 * 3600_000 }).map(ms => (d + 0) * 86_400_000 + ms)),
    fc.constantFrom(...DIMANCHES_HEURE).chain(d => fc.integer({ min: -3 * 3600_000, max: 3 * 3600_000 }).map(ms => (d + 1) * 86_400_000 + ms))
  );

  it('aujourdhuiISO est le jour local (Intl, même fuseau) de l’instant, jamais le jour UTC d’avant ou d’après', () => {
    const local = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' });
    fc.assert(fc.property(arbInstant, t => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(t);
      expect(aujourdhuiISO()).toBe(local.format(t));
    }), { numRuns: RUNS });
  });

  it.skipIf(!enZurich)('en Europe/Zurich, la date d’aujourd’hui de la barre de période (aujourdhuiISO) est celle du Calendrier (todayISO) à toute heure, minuit et changements d’heure compris', () => {
    fc.assert(fc.property(arbInstant, t => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(t);
      expect(aujourdhuiISO()).toBe(todayISO());
    }), { numRuns: RUNS });
  });

  it('todayISO (Calendrier) est le jour d’Europe/Zurich de l’instant, quel que soit le fuseau de l’appareil', () => {
    const zurich = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' });
    fc.assert(fc.property(arbInstant, t => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(t);
      expect(todayISO()).toBe(zurich.format(t));
      // et le lundi de cette date est un lundi de la référence
      expect(jourDeSemaine(deIso(C.lundiDe(todayISO())))).toBe(0);
    }), { numRuns: RUNS });
  });
});
