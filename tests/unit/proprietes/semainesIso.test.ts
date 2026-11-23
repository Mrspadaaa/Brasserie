import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import { ajouterMois } from '../../../src/ui/calendrier/echelle';
import {
  ANNEES_53, MOIS_COURTS, RUNS, TOUS_LES_JOURS, arbJour, arbJours, deIso, enIso, jourDeSemaine, joursDepuisCivil, joursDuMois, semaineIso, semainesDeLAnnee
} from './_dates';

/**
 * Propriétés de la semaine ISO, du lundi, des écarts et de la liste de semaines de la frise (src/domain/calendrier.ts).
 * Référence : `_dates.ts` (rata die, jamais `Date`). Dates de 2020 à 2035, 25 % de jours pièges (fins d'année, 53 semaines, changements d'heure).
 */

describe('semaine ISO : lundiDe, numeroSemaine', () => {
  it('exhaustif 2020-2035 : numeroSemaine et lundiDe égalent la référence ISO 8601 (5 844 jours)', () => {
    const faux: string[] = [];
    for (const j of TOUS_LES_JOURS) {
      const iso = enIso(j), ref = semaineIso(j);
      if (C.numeroSemaine(iso) !== ref.numero || C.lundiDe(iso) !== enIso(ref.lundi)) faux.push(`${iso} → S${C.numeroSemaine(iso)} ${C.lundiDe(iso)} (attendu S${ref.numero} ${enIso(ref.lundi)})`);
    }
    expect(faux.slice(0, 5)).toEqual([]);
  });

  it('les années à 53 semaines de 2020 à 2035 sont 2020, 2026 et 2032, et leur 28 décembre est en S53', () => {
    expect(ANNEES_53).toEqual([2020, 2026, 2032]);
    for (const a of ANNEES_53) expect(C.numeroSemaine(`${a}-12-28`)).toBe(53);
    for (const a of [2021, 2022, 2023, 2024, 2025, 2027, 2028, 2029, 2030, 2031, 2033, 2034, 2035]) expect(C.numeroSemaine(`${a}-12-28`)).toBe(52);
  });

  it('28 déc. 2026 → 4 janv. 2027 : S53 jusqu’au dimanche 3 janv., S1 dès le lundi 4 janv.', () => {
    const lus = ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04'].map(C.numeroSemaine);
    expect(lus).toEqual([53, 53, 53, 53, 53, 53, 53, 1]);
    expect(C.lundiDe('2027-01-01')).toBe('2026-12-28');
    expect(C.lundiDe('2027-01-04')).toBe('2027-01-04');
  });

  it('lundiDe : un lundi, jamais après le jour, au plus 6 jours avant, idempotent, constant dans la semaine', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 0, max: 6 }), (j, k) => {
      const iso = enIso(j), l = C.lundiDe(iso);
      expect(jourDeSemaine(deIso(l))).toBe(0);
      expect(deIso(iso) - deIso(l)).toBeGreaterThanOrEqual(0);
      expect(deIso(iso) - deIso(l)).toBeLessThanOrEqual(6);
      expect(C.lundiDe(l)).toBe(l);
      expect(C.lundiDe(enIso(deIso(l) + k))).toBe(l);
    }), { numRuns: RUNS });
  });

  it('numeroSemaine : entre 1 et 52 (53 seulement les années à 53 semaines), constant dans la semaine, +1 d’un lundi au suivant, 1 après la dernière', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 0, max: 6 }), (j, k) => {
      const l = deIso(C.lundiDe(enIso(j)));
      const n = C.numeroSemaine(enIso(l + k));
      const an = semaineIso(l).annee;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(semainesDeLAnnee(an));
      expect(n).toBe(C.numeroSemaine(enIso(l)));
      const suivant = C.numeroSemaine(enIso(l + 7));
      expect(suivant).toBe(n === semainesDeLAnnee(an) ? 1 : n + 1);
    }), { numRuns: RUNS });
  });

  it('le 4 janvier est toujours en S1 ; le 28 décembre est toujours dans la dernière semaine de l’année', () => {
    fc.assert(fc.property(fc.integer({ min: 2020, max: 2035 }), a => {
      expect(C.numeroSemaine(`${a}-01-04`)).toBe(1);
      expect(C.numeroSemaine(`${a}-12-28`)).toBe(semainesDeLAnnee(a));
    }), { numRuns: RUNS });
  });

  it('etiquetteS et etiquetteListe : « S{n} » et « {j} {mois} · S{n} » disent le vrai jour et la vraie semaine', () => {
    fc.assert(fc.property(arbJour, iso => {
      const ref = semaineIso(deIso(iso));
      expect(C.etiquetteS(iso)).toBe(`S${ref.numero}`);
      expect(C.jourLisible(iso)).toBe(`${Number(iso.slice(8))} ${MOIS_COURTS[Number(iso.slice(5, 7)) - 1]}`);
      expect(C.etiquetteListe(iso)).toBe(`${C.jourLisible(iso)} · S${ref.numero}`);
    }), { numRuns: RUNS });
  });
});

describe('jours : ajouterJours, ecartJours, ecartSemaines, dimancheDe', () => {
  it('ajouterJours égale la référence, aucun jour perdu ni doublé (changements d’heure compris)', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -800, max: 800 }), (j, n) => {
      expect(C.ajouterJours(enIso(j), n)).toBe(enIso(j + n));
      expect(C.ecartJours(enIso(j), enIso(j + n))).toBe(n);
      expect(C.ajouterJours(C.ajouterJours(enIso(j), n), -n)).toBe(enIso(j));
    }), { numRuns: RUNS });
  });

  it('une suite de jours consécutifs ne saute ni ne répète aucune date (tous les jours de 2020 à 2035, un par un)', () => {
    let courant = enIso(TOUS_LES_JOURS[0]);
    for (const j of TOUS_LES_JOURS) {
      if (courant !== enIso(j)) throw new Error(`jour ${enIso(j)} attendu, ${courant} lu`);
      courant = C.ajouterJours(courant, 1);
    }
  });

  it('ecartSemaines compte les semaines entières entre les lundis ; dimancheDe est le dimanche de la même semaine', () => {
    fc.assert(fc.property(arbJours, arbJours, (a, b) => {
      const la = a - jourDeSemaine(a), lb = b - jourDeSemaine(b);
      expect(C.ecartSemaines(enIso(a), enIso(b))).toBe((lb - la) / 7);
      const d = deIso(C.dimancheDe(enIso(a)));
      expect(jourDeSemaine(d)).toBe(6);
      expect(d - la).toBe(6);
    }), { numRuns: RUNS });
  });
});

describe('semainesDe : la liste de semaines de la frise', () => {
  const arbEntree = fc.record({ j: arbJours, nombre: fc.integer({ min: 1, max: 110 }), passe: fc.integer({ min: 0, max: 60 }) });

  it('longueur, premier lundi, pas de 7 jours, numéros ISO, aujourd’hui à l’index `passe`', () => {
    fc.assert(fc.property(arbEntree, ({ j, nombre, passe }) => {
      const s = C.semainesDe(enIso(j), nombre, passe);
      expect(s).toHaveLength(nombre);
      const lundi0 = j - jourDeSemaine(j) - passe * 7;
      s.forEach((w, i) => {
        expect(w.index).toBe(i);
        expect(w.debut).toBe(enIso(lundi0 + i * 7));
        expect(w.numero).toBe(semaineIso(lundi0 + i * 7).numero);
        expect(w.jourMois).toBe(`${w.debut.slice(8, 10)}.${w.debut.slice(5, 7)}`);
      });
      if (passe < nombre) {
        const aujourdhui = s[passe];
        expect(deIso(aujourdhui.debut)).toBeLessThanOrEqual(j);
        expect(j - deIso(aujourdhui.debut)).toBeLessThanOrEqual(6);
      }
    }), { numRuns: RUNS });
  });

  it('la numérotation passe de S52 (ou S53) à S1 exactement au changement d’année ISO, jamais ailleurs', () => {
    fc.assert(fc.property(arbEntree, ({ j, nombre, passe }) => {
      const s = C.semainesDe(enIso(j), nombre, passe);
      for (let i = 1; i < s.length; i++) {
        const an = semaineIso(deIso(s[i - 1].debut)).annee;
        const attendu = s[i - 1].numero === semainesDeLAnnee(an) ? 1 : s[i - 1].numero + 1;
        expect(s[i].numero).toBe(attendu);
      }
    }), { numRuns: RUNS });
  });

  it('indexSemaine : l’index de la semaine qui contient le jour, `null` hors liste, `null` pour une date illisible', () => {
    fc.assert(fc.property(arbEntree, arbJours, ({ j, nombre, passe }, cible) => {
      const s = C.semainesDe(enIso(j), nombre, passe);
      const i = C.indexSemaine(s, enIso(cible));
      const premier = deIso(s[0].debut), dernier = deIso(s[s.length - 1].debut) + 6;
      if (cible < premier || cible > dernier) expect(i).toBeNull();
      else {
        expect(i).not.toBeNull();
        expect(deIso(s[i as number].debut)).toBeLessThanOrEqual(cible);
        expect(cible - deIso(s[i as number].debut)).toBeLessThanOrEqual(6);
      }
    }), { numRuns: RUNS });
    expect(C.indexSemaine(C.semainesDe('2026-11-22', 6), 'pas une date')).toBeNull();
    expect(C.indexSemaine(C.semainesDe('2026-11-22', 6), null)).toBeNull();
  });

  it('fenetreSemaines : un tronçon non vide, borné aux semaines connues, de la longueur demandée quand elle tient', () => {
    fc.assert(fc.property(arbEntree, fc.integer({ min: -20, max: 130 }), fc.integer({ min: 1, max: 110 }), ({ j, nombre, passe }, debut, n) => {
      const s = C.semainesDe(enIso(j), nombre, passe);
      const f = C.fenetreSemaines(s, debut, n);
      expect(f.length).toBeGreaterThanOrEqual(1);
      expect(f.length).toBe(Math.min(n, s.length));
      f.forEach((w, k) => expect(w.index).toBe(f[0].index + k));
      expect(f[f.length - 1].index).toBeLessThan(s.length);
    }), { numRuns: RUNS });
  });
});

describe('dateDeSemaine : « S50, 7 – 13 déc. »', () => {
  it('dit les vrais lundi et dimanche de la semaine ISO, quel que soit le jour de la semaine reçu', () => {
    fc.assert(fc.property(arbJours, j => {
      const ref = semaineIso(j);
      const lundi = civil(ref.lundi), dimanche = civil(ref.lundi + 6);
      const m1 = MOIS_COURTS[lundi.m - 1], m2 = MOIS_COURTS[dimanche.m - 1];
      const plage = lundi.m === dimanche.m ? `${lundi.j} – ${dimanche.j} ${m2}` : `${lundi.j} ${m1} – ${dimanche.j} ${m2}`;
      expect(C.dateDeSemaine(enIso(j))).toBe(`S${ref.numero}, ${plage}`);
    }), { numRuns: RUNS });
  });
});

const civil = (j: number) => ({ m: Number(enIso(j).slice(5, 7)), j: Number(enIso(j).slice(8, 10)) });

describe('anneeEnMois et indexMois : les mois de l’année de la courbe', () => {
  const arbEntree = fc.record({ j: arbJours, nombre: fc.integer({ min: 1, max: 104 }), passe: fc.integer({ min: 0, max: 52 }) });

  it('des mois contigus (le lendemain d’une fin est le début du suivant), entiers, sans trou ni doublon', () => {
    fc.assert(fc.property(arbEntree, ({ j, nombre, passe }) => {
      const m = C.anneeEnMois(enIso(j), nombre, passe);
      m.forEach((mo, i) => {
        expect(mo.index).toBe(i);
        expect(mo.debut).toBe(`${String(mo.annee).padStart(4, '0')}-${String(mo.mois).padStart(2, '0')}-01`);
        expect(deIso(mo.fin) - deIso(mo.debut) + 1).toBe(joursDuMois(mo.annee, mo.mois));
        if (i > 0) expect(deIso(mo.debut)).toBe(deIso(m[i - 1].fin) + 1);
      });
    }), { numRuns: RUNS });
  });

  it('chaque semaine de la courbe est rangée dans le mois de son jeudi, et le premier et le dernier mois ne sont jamais vides', () => {
    fc.assert(fc.property(arbEntree, ({ j, nombre, passe }) => {
      const s = C.semainesDe(enIso(j), nombre, passe), m = C.anneeEnMois(enIso(j), nombre, passe);
      const comptes = new Array(m.length).fill(0);
      for (const w of s) {
        const jeudi = enIso(deIso(w.debut) + 3);
        const i = C.indexMois(m, jeudi);
        expect(i).not.toBeNull();
        comptes[i as number] += 1;
      }
      expect(comptes[0]).toBeGreaterThan(0);
      expect(comptes[comptes.length - 1]).toBeGreaterThan(0);
      if (nombre === 52) expect([12, 13]).toContain(m.length);
    }), { numRuns: RUNS });
  });

  it('indexMois : le mois qui contient le jour, `null` hors de l’année', () => {
    fc.assert(fc.property(arbEntree, arbJour, ({ j, nombre, passe }, cible) => {
      const m = C.anneeEnMois(enIso(j), nombre, passe);
      const i = C.indexMois(m, cible);
      if (cible < m[0].debut || cible > m[m.length - 1].fin) expect(i).toBeNull();
      else { expect(i).not.toBeNull(); expect(cible >= m[i as number].debut && cible <= m[i as number].fin).toBe(true); }
    }), { numRuns: RUNS });
  });
});

describe('ajouterMois (échelle Mois) : même jour du mois, ramené au dernier jour quand il manque', () => {
  it('le mois avance de n, le jour est min(jour, dernier jour du mois), 0 mois ne change rien', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -150, max: 150 }), (j, n) => {
      const iso = enIso(j), a = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)), jj = Number(iso.slice(8));
      const total = a * 12 + (m - 1) + n, an = Math.floor(total / 12), mois = total - an * 12 + 1;
      expect(ajouterMois(iso, n)).toBe(enIso(joursDepuisCivil(an, mois, Math.min(jj, joursDuMois(an, mois)))));
      expect(ajouterMois(iso, 0)).toBe(iso);
    }), { numRuns: RUNS });
  });

  it('suivre n puis m mois revient à n+m mois quand le jour existe dans tous les mois traversés (jour ≤ 28)', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -60, max: 60 }), fc.integer({ min: -60, max: 60 }), (j, n, k) => {
      const iso = enIso(j);
      fc.pre(Number(iso.slice(8)) <= 28);
      expect(ajouterMois(ajouterMois(iso, n), k)).toBe(ajouterMois(iso, n + k));
    }), { numRuns: RUNS });
  });
});
