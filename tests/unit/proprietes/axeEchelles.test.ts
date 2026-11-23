import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import {
  MOIS_SEMAINES_MIN, PERIODE_DE_L_ECHELLE, cibleDuGlisse, colonnesDeLAxe, echelleEffective, estWeekEnd, lettreDuJour, moisDeLaPeriode, uniteColonne, type Echelle
} from '../../../src/ui/calendrier/echelle';
import { alignerSemaines, semaineSous, xDeDate } from '../../../src/ui/calendrier/entete/alignement';
import type { Colonne } from '../../../src/ui/calendrier/frise/Rangee';
import { RUNS, arbJours, deIso, enIso, jourDeSemaine, semaineIso } from './_dates';

/**
 * Propriétés de l'axe de la frise (D385) : colonnes en jours, semaines, mois ; échelle effective ; abscisse d'une date ; alignement de la courbe.
 * La frise pose 104 semaines (52 de passé, 52 d'avenir) ; la fenêtre en montre de 1 à 52.
 */

const PASSE = 52, TOTAL = 104;

function modele(auj: number) {
  const iso = enIso(auj);
  return {
    semaines: C.semainesDe(iso, TOTAL, PASSE).map(s => ({ debut: s.debut, numero: s.numero })),
    mois: C.anneeEnMois(iso, TOTAL, PASSE).map(m => ({ debut: m.debut, fin: m.fin, court: m.court }))
  };
}

const arbAxe = fc.record({ auj: arbJours, i: fc.integer({ min: 0, max: TOTAL - 1 }), n: fc.integer({ min: 1, max: 52 }), deplie: fc.option(fc.integer({ min: 0, max: 51 }), { nil: undefined }) })
  .filter(({ i, n }) => i + n <= TOTAL);
const ECHELLES: Echelle[] = ['jour', 'semaine', 'mois'];

/** Une vérification sans l'appareil de `expect` : dans les boucles de plusieurs centaines de colonnes, `expect` coûte des secondes. */
const verifie = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

/** Les jours d'une liste de colonnes, dans l'ordre. */
const joursDe = (cols: readonly Colonne[]): number[] => cols.flatMap(c => Array.from({ length: deIso(c.fin) - deIso(c.debut) + 1 }, (_, k) => deIso(c.debut) + k));

describe('echelleEffective : l’échelle montrée est celle que la période permet', () => {
  it('Jour jusqu’à 3 semaines, Mois dès 13 semaines, au-delà de 26 semaines et dans l’An toujours Mois, sinon Semaine ; idempotente', () => {
    fc.assert(fc.property(fc.constantFrom(...ECHELLES), fc.integer({ min: 1, max: 104 }), fc.boolean(), (voulue, n, annee) => {
      const e = echelleEffective(voulue, n, annee);
      if (annee || n > PERIODE_DE_L_ECHELLE.mois) expect(e).toBe('mois');
      else if (voulue === 'jour' && n <= 3) expect(e).toBe('jour');
      else if (voulue === 'mois' && n >= 13) expect(e).toBe('mois');
      else expect(e).toBe('semaine');
      expect(echelleEffective(e, n, annee)).toBe(e);
    }), { numRuns: RUNS });
  });

  it('moisDeLaPeriode : au moins 1, croissant avec les semaines, 13 semaines = 3 mois et 26 = 6 mois', () => {
    expect(moisDeLaPeriode(13)).toBe(3);
    expect(moisDeLaPeriode(26)).toBe(6);
    fc.assert(fc.property(fc.integer({ min: 1, max: 103 }), n => {
      expect(moisDeLaPeriode(n)).toBeGreaterThanOrEqual(1);
      expect(moisDeLaPeriode(n + 1)).toBeGreaterThanOrEqual(moisDeLaPeriode(n));
    }), { numRuns: RUNS });
  });
});

describe('colonnesDeLAxe : jours, semaines, mois', () => {
  it('semaines : une colonne par semaine, sept jours chacune, étiquette S{n} = vraie semaine ISO, aucun jour perdu ni doublé', () => {
    fc.assert(fc.property(arbAxe, ({ auj, i, n }) => {
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle: 'semaine', semaines, mois, du, nombre: n });
      expect(cols).toHaveLength(n);
      cols.forEach((c, k) => {
        expect(c.debut).toBe(enIso(deIso(du) + k * 7));
        expect(c.fin).toBe(enIso(deIso(du) + k * 7 + 6));
        expect(c.etiquette).toBe(`S${semaineIso(deIso(c.debut)).numero}`);
        expect(uniteColonne(c)).toBe('semaine');
      });
    }), { numRuns: RUNS });
  });

  it('une semaine dépliée devient ses sept jours, à sa place, le reste de l’axe ne bouge pas', () => {
    fc.assert(fc.property(arbAxe, ({ auj, i, n, deplie }) => {
      fc.pre(deplie !== undefined && deplie < n);
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut, lundiDeplie = semaines[i + (deplie as number)].debut;
      const cols = colonnesDeLAxe({ echelle: 'semaine', semaines, mois, du, nombre: n, deplie: lundiDeplie });
      expect(cols).toHaveLength(n + 6);
      const jours = joursDe(cols);
      expect(jours).toHaveLength(n * 7);
      jours.forEach((j, k) => expect(j).toBe(deIso(du) + k));
      expect(cols.filter(c => uniteColonne(c) === 'jour')).toHaveLength(7);
    }), { numRuns: RUNS });
  });

  it('jour : sept colonnes d’un jour par semaine, des jours consécutifs depuis le début de la fenêtre', () => {
    fc.assert(fc.property(arbAxe, ({ auj, i, n }) => {
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle: 'jour', semaines, mois, du, nombre: n });
      expect(cols).toHaveLength(n * 7);
      cols.forEach((c, k) => verifie(c.debut === c.fin && c.debut === enIso(deIso(du) + k), `colonne ${k} : ${c.debut}…${c.fin}, attendu ${enIso(deIso(du) + k)}`));
    }), { numRuns: RUNS });
  });

  it('mois : des mois entiers, contigus, dans l’ordre, aucun jour perdu ni doublé entre deux colonnes ; autant de mois que la période en dit', () => {
    fc.assert(fc.property(arbAxe, ({ auj, i, n }) => {
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle: 'mois', semaines, mois, du, nombre: n });
      expect(cols.length).toBeGreaterThanOrEqual(1);
      cols.forEach((c, k) => {
        expect(c.debut.slice(8)).toBe('01');
        expect(c.debut.slice(0, 7)).toBe(c.fin.slice(0, 7));
        if (k + 1 < cols.length) expect(deIso(c.fin) + 1).toBe(deIso(cols[k + 1].debut));
        expect(enIso(deIso(c.fin) + 1).slice(8)).toBe('01');
      });
      // L-7 (FC-2) : du mois du premier jour au mois du dernier, tous (PC-140 en gardait autant que la période en dit, et perdait le dernier) ;
      // 13 semaines touchent 3 ou 4 mois, 26 en touchent 6 ou 7 : jamais moins que la période n'en dit
      const fin = enIso(deIso(du) + n * 7 - 1), m = (j: string) => Number(j.slice(0, 4)) * 12 + Number(j.slice(5, 7));
      if (n >= MOIS_SEMAINES_MIN) expect(cols.length).toBe(m(fin) - m(du) + 1);
      if (n >= MOIS_SEMAINES_MIN) expect(cols.length).toBeGreaterThanOrEqual(moisDeLaPeriode(n));
    }), { numRuns: RUNS });
  });

  /**
   * FC-2 (défaut probable, à confirmer sur l'écran, rapport d'abord) : l'axe en Mois prend les mois que la fenêtre TOUCHE, puis en garde les premiers
   * (PC-140). Quand la première semaine empiète sur le mois d'avant (le jeudi est dans le suivant), cette colonne-là est comptée et le DERNIER mois
   * de la fenêtre tombe : « Exercice 2026 » montre déc. 2025 → nov. 2026 (déc. 2026 absent) ; « 3 mois » dès le lundi 30 mars montre mars, avril, mai
   * et perd tout juin. Corrigé (L-7, T10 liste du 23.11) : l'axe prend tous les mois que la fenêtre touche (CAL-ECHELLE-COHERENTE).
   */
  it('FC-2 : chaque jour de la fenêtre tombe dans une colonne de l’axe en Mois', () => {
    fc.assert(fc.property(arbAxe, ({ auj, i, n }) => {
      fc.pre(n >= 13);
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle: 'mois', semaines, mois, du, nombre: n });
      const fin = deIso(du) + n * 7 - 1;
      expect(deIso(cols[cols.length - 1].fin), `fenêtre ${du} +${n} sem. → ${enIso(fin)}`).toBeGreaterThanOrEqual(fin);
    }), {
      numRuns: RUNS,
      examples: [[{ auj: deIso('2026-11-22'), i: 52 - 46, n: 13, deplie: undefined }]]
    });
  });
});

describe('xDeDate et alignerSemaines : une même date a le même x dans la courbe et dans la frise', () => {
  const arbCols = arbAxe.chain(a => fc.record({
    a: fc.constant(a),
    echelle: fc.constantFrom<Echelle>('jour', 'semaine', 'mois'),
    largeurColonne: fc.integer({ min: 4, max: 90 })
  }));

  it('l’abscisse croît avec la date, le début de la colonne k est à k × largeur, et une date reste dans sa colonne', () => {
    fc.assert(fc.property(arbCols, ({ a, echelle, largeurColonne }) => {
      const { semaines, mois } = modele(a.auj);
      const cols = colonnesDeLAxe({ echelle, semaines, mois, du: semaines[a.i].debut, nombre: a.n });
      cols.forEach((c, k) => {
        const debut = xDeDate(cols, largeurColonne, c.debut), dedans = xDeDate(cols, largeurColonne, c.fin);
        verifie(Math.abs(debut - k * largeurColonne) < 1e-6, `début de ${c.debut} : x=${debut}, attendu ${k * largeurColonne}`);
        verifie(dedans >= k * largeurColonne - 1e-9 && dedans < (k + 1) * largeurColonne + 1e-9, `fin de ${c.fin} : x=${dedans} hors de la colonne ${k}`);
      });
      let prec = -Infinity;
      for (const j of joursDe(cols)) {
        const x = xDeDate(cols, largeurColonne, enIso(j));
        verifie(x >= prec - 1e-9, `x décroît à ${enIso(j)}`);
        prec = x;
      }
    }), { numRuns: RUNS });
  });

  it('sur un axe en semaines, x = (date − début) / 7 × largeur, exactement', () => {
    fc.assert(fc.property(arbAxe, fc.integer({ min: 4, max: 90 }), ({ auj, i, n }, l) => {
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle: 'semaine', semaines, mois, du, nombre: n });
      for (let k = 0; k < n * 7; k++) {
        const x = xDeDate(cols, l, enIso(deIso(du) + k));
        verifie(Math.abs(x - (k / 7) * l) < 1e-6, `jour +${k} de ${du} : x=${x}, attendu ${(k / 7) * l}`);
      }
    }), { numRuns: RUNS });
  });

  it('alignerSemaines : des bords croissants dans [0, largeur], un de plus que de semaines ; semaineSous reste dans les semaines', () => {
    fc.assert(fc.property(arbAxe, fc.integer({ min: 4, max: 90 }), fc.integer({ min: -60, max: 0 }), ({ auj, i, n }, l, decalage) => {
      const { semaines } = modele(auj);
      const du = semaines[i].debut;
      const cols = Array.from({ length: n }, (_, k) => ({ debut: enIso(deIso(du) + k * 7), fin: enIso(deIso(du) + k * 7 + 6), etiquette: '' }));
      const largeur = n * l;
      const lundis = semaines.map(s => s.debut);
      const al = alignerSemaines(lundis, cols, l, decalage, largeur);
      if (!al) return;
      expect(al.abscisses.length).toBeGreaterThanOrEqual(2);
      al.abscisses.forEach((x, k) => { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(largeur); if (k) expect(x).toBeGreaterThanOrEqual(al.abscisses[k - 1]); });
      for (const x of [0, largeur / 3, largeur / 2, largeur - 0.01]) {
        const s = semaineSous(al, x);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(al.abscisses.length - 2);
      }
    }), { numRuns: RUNS });
  });
});

describe('cibleDuGlisse : où une barre glissée se pose', () => {
  it('la cible tombe dans la colonne visée et l’écart dit exactement le nombre de jours', () => {
    fc.assert(fc.property(arbAxe, fc.constantFrom<Echelle>('jour', 'semaine'), fc.integer({ min: 0, max: 40 }), fc.integer({ min: -10, max: 10 }), fc.integer({ min: 0, max: 6 }), ({ auj, i, n, deplie }, echelle, a, k, plus) => {
      const { semaines, mois } = modele(auj);
      const du = semaines[i].debut;
      const cols = colonnesDeLAxe({ echelle, semaines, mois, du, nombre: n, deplie: deplie !== undefined && deplie < n ? semaines[i + deplie].debut : undefined });
      fc.pre(a < cols.length);
      const ancre = enIso(deIso(cols[a].debut) + Math.min(plus, deIso(cols[a].fin) - deIso(cols[a].debut)));
      const r = cibleDuGlisse(cols, a, k, ancre);
      expect(r).not.toBeNull();
      const b = Math.max(0, Math.min(cols.length - 1, a + k));
      const cible = (r as NonNullable<typeof r>).cible;
      expect(cible >= cols[b].debut && cible <= cols[b].fin).toBe(true);
      expect((r as NonNullable<typeof r>).jours).toBe(deIso(cible) - deIso(ancre));
    }), { numRuns: RUNS });
  });
});

describe('lettre du jour et week-end (UTC, aucun glissement à l’heure d’été)', () => {
  it('lettreDuJour suit L M M J V S D ; estWeekEnd est vrai pour samedi et dimanche seulement', () => {
    fc.assert(fc.property(arbJours, j => {
      const d = jourDeSemaine(j);
      expect(lettreDuJour(enIso(j))).toBe('LMMJVSD'[d]);
      expect(estWeekEnd(enIso(j))).toBe(d >= 5);
    }), { numRuns: RUNS });
  });
});
