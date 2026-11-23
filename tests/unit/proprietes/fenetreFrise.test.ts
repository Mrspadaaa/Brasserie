import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import * as F from '../../../src/ui/calendrier/entete/Fenetre';
import { bornes, etiquetteCourte, peutPasser, pas, type Periode } from '../../../src/components/periode/periode';
import { PREMIER_JOUR, duree, glisser, titreJours } from '../../../src/ui/finance/operations/plage';
import { MOIS_COURTS, RUNS, arbJours, deIso, enIso, jourDeSemaine, joursDuMois, semaineIso } from './_dates';

/**
 * Propriétés de la fenêtre de la frise (E06/E07), de son étiquette et de ses flèches ‹ › (reculer / avancer).
 * Le Calendrier pose 52 semaines de passé + 52 d'avenir : `total` = 104, `premierLundi` = lundi d'aujourd'hui − 52 semaines (useDonneesCalendrier).
 */

const PASSE = 52, TOTAL = 104;
const lundiDeJ = (j: number) => j - jourDeSemaine(j);
const horizon = (aujourdhui: number) => ({ premier: lundiDeJ(aujourdhui) - PASSE * 7, dernier: lundiDeJ(aujourdhui) - PASSE * 7 + (TOTAL - 1) * 7 });

/* ---------- périodes ---------- */

const arbEntree = arbJours.chain(auj => fc.record({ auj: fc.constant(auj), periode: arbPeriode(auj) }));
function arbPeriode(auj: number): fc.Arbitrary<Periode> {
  const annee = Number(enIso(auj).slice(0, 4));
  return fc.oneof(
    fc.record({ genre: fc.constant('mois' as const), annee: fc.integer({ min: annee - 3, max: annee + 3 }), mois: fc.integer({ min: 1, max: 12 }) }),
    fc.record({ genre: fc.constant('trimestre' as const), annee: fc.integer({ min: annee - 3, max: annee + 3 }), trimestre: fc.constantFrom(1, 2, 3, 4) as fc.Arbitrary<1 | 2 | 3 | 4> }),
    fc.record({ genre: fc.constant('annee' as const), annee: fc.integer({ min: annee - 3, max: annee + 3 }) }),
    fc.record({ debut: fc.integer({ min: -700, max: 520 }), longueur: fc.integer({ min: 0, max: 420 }) })
      .map(({ debut, longueur }): Periode => ({ genre: 'dates', du: enIso(auj + debut), au: enIso(auj + debut + longueur) })),
    fc.constant({ genre: 'tout' as const })
  );
}

/* ---------- fenetreDePeriode ---------- */

describe('fenetreDePeriode : une période de l’app lue comme une fenêtre de semaines', () => {
  it('null ou une fenêtre NON VIDE qui commence un lundi et reste dans l’horizon de la courbe', () => {
    fc.assert(fc.property(arbEntree, ({ auj, periode }) => {
      const { premier } = horizon(auj);
      const f = F.fenetreDePeriode(periode, enIso(premier), TOTAL);
      if (!f) return;
      expect(jourDeSemaine(deIso(f.du))).toBe(0);
      expect(f.semaines).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(f.semaines)).toBe(true);
      expect(deIso(f.du)).toBeGreaterThanOrEqual(premier);
      expect((deIso(f.du) - premier) / 7 + f.semaines).toBeLessThanOrEqual(TOTAL);
    }), { numRuns: RUNS });
  });

  /**
   * FC-1 (défaut connu, rapport d'abord : pas corrigé) : « Exercice 2026 » (1 janv. → 31 déc.) tient en 53 semaines ISO, et tout plage de 12 mois
   * qui ne commence pas un lundi en prend 53 ; `fenetreDePeriode` ne plafonne qu'à l'horizon (104), alors que le geste du cadre plafonne à 52 (T9-2).
   * Corrigé (L-44, liste du 23.11) : la fenêtre d'une période est plafonnée à l'An (52 semaines), son début gardé.
   */
  it('FC-1 : la fenêtre ne dépasse jamais 52 semaines (l’An, T9-2 : « la fenêtre ne dépasse jamais l’An »)', () => {
    fc.assert(fc.property(arbEntree, ({ auj, periode }) => {
      const f = F.fenetreDePeriode(periode, enIso(horizon(auj).premier), TOTAL);
      if (f) expect(f.semaines).toBeLessThanOrEqual(F.SEMAINES_ANNEE);
    }), { numRuns: RUNS, examples: [[{ auj: deIso('2026-11-22'), periode: { genre: 'annee', annee: 2026 } as Periode }]] });
  });

  it('« tout » n’a pas de bornes : null ; une période entièrement passée (avant l’horizon) : null ; une période qui touche l’horizon : jamais null', () => {
    fc.assert(fc.property(arbEntree, ({ auj, periode }) => {
      const { premier, dernier } = horizon(auj);
      const f = F.fenetreDePeriode(periode, enIso(premier), TOTAL);
      if (periode.genre === 'tout') {
        expect(f).toBeNull();
        return;
      }
      const b = bornes(periode);
      const du = deIso(b.du as string), au = deIso(b.au as string);
      if (au < premier) expect(f).toBeNull();
      else if (du <= dernier + 6) expect(f).not.toBeNull();
    }), { numRuns: RUNS });
  });

  it('une plage de dates dans l’horizon : la fenêtre va du lundi de son début au lundi de sa fin (exactement), et la contient', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 0, max: 400 }), fc.integer({ min: 0, max: 51 * 7 }), (auj, debut, longueur) => {
      const { premier, dernier } = horizon(auj);
      const du = premier + debut, au = du + longueur;
      fc.pre(au <= dernier + 6);
      const f = F.fenetreDePeriode({ genre: 'dates', du: enIso(du), au: enIso(au) }, enIso(premier), TOTAL) as F.FenetreSemaines;
      expect(f).not.toBeNull();
      expect(f.du).toBe(enIso(lundiDeJ(du)));
      expect(deIso(f.du) + f.semaines * 7 - 1).toBeGreaterThanOrEqual(au);
      expect(f.semaines).toBe((lundiDeJ(au) - lundiDeJ(du)) / 7 + 1);
    }), { numRuns: RUNS });
  });

  it('CHV-4 : une plage qui commence avant l’horizon et finit dedans garde sa durée en semaines (posée au début de l’horizon), sans jamais dépasser l’horizon', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 1, max: 300 }), fc.integer({ min: 0, max: 40 * 7 }), (auj, avant, longueur) => {
      const { premier } = horizon(auj);
      const du = premier - avant, au = du + longueur;
      fc.pre(au >= premier);
      const f = F.fenetreDePeriode({ genre: 'dates', du: enIso(du), au: enIso(au) }, enIso(premier), TOTAL) as F.FenetreSemaines;
      expect(f).not.toBeNull();
      expect(f.du).toBe(enIso(premier));
      expect(f.semaines).toBe(Math.min(TOTAL, (lundiDeJ(au) - lundiDeJ(du)) / 7 + 1));
    }), { numRuns: RUNS });
  });

  it('un mois (lu depuis aujourd’hui) montre au moins 4 semaines et contient ses jours dans l’horizon', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -10, max: 14 }), (auj, delta) => {
      const { premier, dernier } = horizon(auj);
      const base = Number(enIso(auj).slice(0, 4)) * 12 + Number(enIso(auj).slice(5, 7)) - 1 + delta;
      const annee = Math.floor(base / 12), mois = base - annee * 12 + 1;
      const f = F.fenetreDePeriode({ genre: 'mois', annee, mois }, enIso(premier), TOTAL);
      const du = deIso(`${annee}-${String(mois).padStart(2, '0')}-01`), au = du + joursDuMois(annee, mois) - 1;
      fc.pre(du >= premier && au <= dernier + 6);
      expect(f).not.toBeNull();
      expect((f as F.FenetreSemaines).semaines).toBeGreaterThanOrEqual(Math.min(F.MOIS_MIN_SEMAINES, TOTAL));
      expect(deIso((f as F.FenetreSemaines).du)).toBe(lundiDeJ(du));
    }), { numRuns: RUNS });
  });

  it('periodeDeFenetre puis fenetreDePeriode rend la même fenêtre (aller-retour barre ↔ cadre), du lundi au dimanche', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 0, max: TOTAL - 1 }), fc.integer({ min: 1, max: 52 }), (auj, i, n) => {
      const { premier } = horizon(auj);
      fc.pre(i + n <= TOTAL);
      const f: F.FenetreSemaines = { du: enIso(premier + i * 7), semaines: n };
      const p = F.periodeDeFenetre(f);
      expect(p.genre).toBe('dates');
      const { du, au } = bornes(p);
      expect(jourDeSemaine(deIso(du as string))).toBe(0);
      expect(jourDeSemaine(deIso(au as string))).toBe(6);
      expect((deIso(au as string) - deIso(du as string) + 1) / 7).toBe(n);
      expect(F.fenetreDePeriode(p, enIso(premier), TOTAL)).toEqual(f);
    }), { numRuns: RUNS });
  });
});

/* ---------- libellés de la fenêtre ---------- */

describe('libelleDuree et libellePeriode : le bouton dit exactement la fenêtre', () => {
  it('« N sem. » dit N ; « 3 mois » = 13 semaines ; « 6 mois » = 26 ; « An » = 52 semaines ou plus', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 52 }), n => {
      const t = F.libelleDuree(n, false);
      if (n === 13) expect(t).toBe('3 mois');
      else if (n === 26) expect(t).toBe('6 mois');
      else if (n >= 52) expect(t).toBe('An');
      else expect(t).toBe(`${n} sem.`);
    }), { numRuns: RUNS });
    expect(F.libelleDuree(6, true)).toBe('An');
  });

  it('libellePeriode : « Nov. », « T4 » ou « 2026 » seulement quand la fenêtre est exactement celle de la période ; sinon la durée', () => {
    fc.assert(fc.property(arbEntree, fc.integer({ min: 0, max: 60 }), fc.integer({ min: 1, max: 52 }), ({ auj, periode }, i, n) => {
      const { premier } = horizon(auj);
      const fen: F.FenetreSemaines = { du: enIso(premier + i * 7), semaines: n };
      const t = F.libellePeriode(periode, fen, enIso(premier), TOTAL, false);
      const propre = F.fenetreDePeriode(periode, enIso(premier), TOTAL);
      if (periode.genre === 'mois' || periode.genre === 'trimestre' || periode.genre === 'annee') {
        const memeFenetre = !!propre && propre.du === fen.du && propre.semaines === fen.semaines;
        expect(t).toBe(memeFenetre ? etiquetteCourte(periode) : F.libelleDuree(n, false));
      } else expect(t).toBe(F.libelleDuree(n, false));
    }), { numRuns: RUNS });
  });
});

/* ---------- l'étiquette du cadre ---------- */

/** Lit « S47 2025 – S52 2026 » comme le brasseur : l'année absente est celle d'aujourd'hui ; au début, elle est celle de la fin quand la fin la dit et que l'ordre le permet. */
function lireEtiquette(t: string, refAnnee: number): { a: { n: number; an: number }; b: { n: number; an: number } } | null {
  const m = /^S(\d+)(?: (\d{4}))?(?: – S(\d+)(?: (\d{4}))?)?$/.exec(t);
  if (!m) return null;
  const na = Number(m[1]), ya = m[2] ? Number(m[2]) : undefined;
  if (m[3] === undefined) { const an = ya ?? refAnnee; return { a: { n: na, an }, b: { n: na, an } }; }
  const nb = Number(m[3]), yb = m[4] ? Number(m[4]) : refAnnee;
  const anA = ya ?? (na <= nb ? yb : yb - 1);
  return { a: { n: na, an: anA }, b: { n: nb, an: yb } };
}

describe('etiquetteCadre : « S47 2025 – S52 2026 » dit la vraie fenêtre, années comprises', () => {
  const arbCadre = fc.record({ auj: arbJours, i: fc.integer({ min: 0, max: TOTAL - 1 }), n: fc.integer({ min: 1, max: 52 }) });

  it('les numéros de début et de fin sont ceux des semaines de la courbe ; une semaine seule se dit une fois', () => {
    fc.assert(fc.property(arbCadre, ({ auj, i, n }) => {
      fc.pre(i + n <= TOTAL);
      const s = C.semainesDe(enIso(auj), TOTAL, PASSE);
      const t = F.etiquetteCadre(s.map(w => w.numero), i, n, false, undefined, s.map(w => w.debut), enIso(auj));
      const lu = lireEtiquette(t, semaineIso(auj).annee);
      expect(lu, t).not.toBeNull();
      expect((lu as NonNullable<typeof lu>).a.n).toBe(s[i].numero);
      expect((lu as NonNullable<typeof lu>).b.n).toBe(s[i + n - 1].numero);
      if (n === 1) expect(t).not.toContain('–');
    }), { numRuns: RUNS });
  });

  it('lue comme le brasseur (année absente = cette année), l’étiquette redonne l’année ISO exacte du début et de la fin (courbe d’un an avant à un an après)', () => {
    fc.assert(fc.property(arbCadre, ({ auj, i, n }) => {
      fc.pre(i + n <= TOTAL);
      const s = C.semainesDe(enIso(auj), TOTAL, PASSE);
      const t = F.etiquetteCadre(s.map(w => w.numero), i, n, false, undefined, s.map(w => w.debut), enIso(auj));
      const lu = lireEtiquette(t, semaineIso(auj).annee) as NonNullable<ReturnType<typeof lireEtiquette>>;
      expect(lu.a.an, `${t} (début ${s[i].debut})`).toBe(semaineIso(deIso(s[i].debut)).annee);
      expect(lu.b.an, `${t} (fin ${s[i + n - 1].debut})`).toBe(semaineIso(deIso(s[i + n - 1].debut)).annee);
    }), { numRuns: RUNS });
  });

  it('dans l’année, l’étiquette est celle des mois, telle que donnée', () => {
    expect(F.etiquetteCadre([1, 2], 0, 2, true, 'nov. – oct.')).toBe('nov. – oct.');
  });

  it('une fenêtre d’une semaine (au repos) dit ses jours : « 16–22 févr. », les vrais lundi et dimanche', () => {
    if (!F.etiquetteRepos || !F.joursSemaine) return;
    fc.assert(fc.property(arbJours, j => {
      const l = lundiDeJ(j);
      const lundi = enIso(l), dim = enIso(l + 6);
      const attendu = lundi.slice(5, 7) === dim.slice(5, 7)
        ? `${Number(lundi.slice(8))}–${Number(dim.slice(8))} ${MOIS_COURTS[Number(dim.slice(5, 7)) - 1]}`
        : `${Number(lundi.slice(8))} ${MOIS_COURTS[Number(lundi.slice(5, 7)) - 1]}–${Number(dim.slice(8))} ${MOIS_COURTS[Number(dim.slice(5, 7)) - 1]}`;
      expect(F.joursSemaine(lundi)).toBe(attendu);
    }), { numRuns: RUNS });
  });
});

/* ---------- la vue du cadre sur la courbe ---------- */

describe('vueDeFenetre et semainesDeVue : le cadre posé sur la courbe', () => {
  /* D441 (23.11) : les marges se posent en unités entières (jours, semaines) pour que les rangées partagent l'axe : 56 px à une demi-unité près,
     une unité au moins, les mêmes des deux côtés (avant : 56 px exactement) */
  it('au repos, le début et la fin à 56 px des bords, à une demi-unité près, en unités entières, les mêmes des deux côtés', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 52 }), fc.integer({ min: 168, max: 1600 }), (index, nombre, largeur) => {
      const v = F.vueDeFenetre(index, nombre, largeur), u = F.uniteDeVue(v.span), pxU = largeur / (v.span * u);
      const x = (semaine: number) => ((semaine - v.v0) / v.span) * largeur;
      const g = x(index), d = largeur - x(index + nombre);
      expect(Math.abs(g - d)).toBeLessThan(1e-6);
      expect(g).toBeGreaterThanOrEqual(Math.min(56 - pxU / 2, pxU) - 1e-6);
      expect(g).toBeLessThanOrEqual(Math.max(56 + pxU / 2, pxU) + 1e-6);
    }), { numRuns: RUNS });
  });

  it('semainesDeVue : des bords croissants, dans [0, largeur], une abscisse de plus que de semaines, aucune semaine de la vue omise', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 104 }), fc.double({ min: -20, max: 110, noNaN: true }), fc.double({ min: 1, max: 60, noNaN: true }), fc.integer({ min: 100, max: 1600 }), (total, v0, span, largeur) => {
      const r = F.semainesDeVue(total, { v0, span }, largeur);
      const visibles = Array.from({ length: total }, (_, i) => i).filter(i => i + 1 > v0 && i < v0 + span);
      if (!r) { expect(visibles).toHaveLength(0); return; }
      expect(r.abscisses.length).toBeGreaterThanOrEqual(2);
      for (let k = 0; k < r.abscisses.length; k++) {
        expect(r.abscisses[k]).toBeGreaterThanOrEqual(0);
        expect(r.abscisses[k]).toBeLessThanOrEqual(largeur);
        if (k > 0) expect(r.abscisses[k]).toBeGreaterThanOrEqual(r.abscisses[k - 1]);
      }
      expect(r.debut).toBeLessThanOrEqual(visibles[0] ?? r.debut);
      expect(r.debut + r.abscisses.length - 2).toBeGreaterThanOrEqual(visibles[visibles.length - 1] ?? 0);
    }), { numRuns: RUNS });
  });
});

/* ---------- reculer / avancer : les flèches ‹ › de la période ---------- */

describe('pas, peutPasser, glisser : reculer puis avancer revient au départ, jamais hors des bornes', () => {
  afterEach(() => { vi.useRealTimers(); });
  const fixerAujourdhui = (j: number) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${enIso(j)}T12:00:00`)); };
  /** Dernier jour que les flèches atteignent : la fin de la 52e semaine depuis la semaine courante (CHN-1). */
  const finHorizon = (auj: number) => lundiDeJ(auj) + 52 * 7 - 1;
  const arbCalendaire = arbJours.chain(auj => fc.record({
    auj: fc.constant(auj),
    periode: fc.oneof(
      fc.record({ genre: fc.constant('mois' as const), annee: fc.integer({ min: 1999, max: 2037 }), mois: fc.integer({ min: 1, max: 12 }) }),
      fc.record({ genre: fc.constant('trimestre' as const), annee: fc.integer({ min: 1999, max: 2037 }), trimestre: fc.constantFrom(1, 2, 3, 4) as fc.Arbitrary<1 | 2 | 3 | 4> }),
      fc.record({ genre: fc.constant('annee' as const), annee: fc.integer({ min: 1999, max: 2037 }) })
    ) as fc.Arbitrary<Periode>
  }));

  it('mois, trimestre, année : la période suivante commence le lendemain de la fin, la précédente finit la veille du début (aucun jour perdu ni doublé)', () => {
    fc.assert(fc.property(arbCalendaire, fc.constantFrom<-1 | 1>(-1, 1), ({ auj, periode }, sens) => {
      fixerAujourdhui(auj);
      const q = pas(periode, sens);
      if (q === periode) return;
      const bp = bornes(periode), bq = bornes(q);
      if (sens === 1) expect(deIso(bq.du as string)).toBe(deIso(bp.au as string) + 1);
      else expect(deIso(bq.au as string)).toBe(deIso(bp.du as string) - 1);
      expect(q.genre).toBe(periode.genre);
    }), { numRuns: RUNS });
  });

  it('peutPasser est vrai exactement quand pas change la période', () => {
    fc.assert(fc.property(arbCalendaire, fc.constantFrom<-1 | 1>(-1, 1), ({ auj, periode }, sens) => {
      fixerAujourdhui(auj);
      expect(peutPasser(periode, sens)).toBe(JSON.stringify(pas(periode, sens)) !== JSON.stringify(periode));
    }), { numRuns: RUNS });
  });

  it('reculer puis avancer (ou l’inverse) revient à la période de départ dès qu’elle est dans les bornes (2000-01-01 → fin de l’horizon)', () => {
    fc.assert(fc.property(arbCalendaire, fc.constantFrom<-1 | 1>(-1, 1), ({ auj, periode }, sens) => {
      fixerAujourdhui(auj);
      const b = bornes(periode);
      fc.pre(deIso(b.du as string) <= finHorizon(auj) && deIso(b.au as string) >= deIso(PREMIER_JOUR));
      const q = pas(periode, sens);
      fc.pre(q !== periode);
      expect(pas(q, -sens as -1 | 1)).toEqual(periode);
    }), { numRuns: RUNS });
  });

  it('en avançant jour après jour la flèche s’éteint au bout de l’horizon (52 semaines), jamais au-delà ; en reculant, au 1er janv. 2000', () => {
    fc.assert(fc.property(arbJours, auj => {
      fixerAujourdhui(auj);
      const d = enIso(auj);
      let p = { genre: 'mois' as const, annee: Number(d.slice(0, 4)), mois: Number(d.slice(5, 7)) };
      let pas1 = 0;
      while (peutPasser(p, 1) && pas1++ < 40) p = pas(p, 1) as typeof p;
      expect(pas1).toBeLessThan(40);
      expect(deIso(bornes(p).du as string)).toBeLessThanOrEqual(finHorizon(auj));
      // le mois suivant commencerait après l'horizon : la flèche est donc bien éteinte
      const suivant = { genre: 'mois' as const, annee: p.annee + (p.mois === 12 ? 1 : 0), mois: (p.mois % 12) + 1 };
      expect(deIso(bornes(suivant).du as string)).toBeGreaterThan(finHorizon(auj));
    }), { numRuns: 200 });
  });

  it('glisser une plage de jours garde sa durée, reste dans les bornes ; reculer puis avancer revient au départ quand rien n’est ramené contre un bord', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: 1, max: 400 }), fc.integer({ min: -3000, max: 3000 }), fc.constantFrom<-1 | 1>(-1, 1), (auj, n, decal, sens) => {
      const min = PREMIER_JOUR, max = enIso(finHorizon(auj));
      const du = deIso(max) - n + 1 + decal;
      fc.pre(du >= deIso(min) && du + n - 1 <= deIso(max));
      const p = { du: enIso(du), au: enIso(du + n - 1) };
      const g = glisser(p, sens, min, max);
      expect(duree(g)).toBe(n);
      expect(g.du >= min && g.au <= max).toBe(true);
      const avant = deIso(g.du) === du + sens * n;
      if (avant) expect(glisser(g, -sens as -1 | 1, min, max)).toEqual(p);
    }), { numRuns: RUNS });
  });

  it('titreJours (« 12 oct. → 3 nov. ») dit exactement les deux bornes : mêmes jours, mêmes mois, l’année quand elle n’est pas celle d’aujourd’hui', () => {
    fc.assert(fc.property(arbJours, fc.integer({ min: -900, max: 900 }), fc.integer({ min: 0, max: 700 }), (auj, d0, n) => {
      const du = auj + d0, au = du + n, aujIso = enIso(auj);
      const t = titreJours({ du: enIso(du), au: enIso(au) }, aujIso);
      const jetons = t.split(' → ');
      expect(jetons.length).toBe(du === au ? 1 : 2);
      const lire = (s: string) => /^(1er|\d+)(?: (\D+?))?(?: (\d{4}))?$/.exec(s);
      const fin = lire(jetons[jetons.length - 1]) as RegExpExecArray;
      expect(fin, t).not.toBeNull();
      const jourFin = fin[1] === '1er' ? 1 : Number(fin[1]);
      expect(jourFin).toBe(Number(enIso(au).slice(8)));
      expect(MOIS_COURTS.indexOf(fin[2] as (typeof MOIS_COURTS)[number]) + 1, t).toBe(Number(enIso(au).slice(5, 7)));
      const anneeFin = fin[3] ? Number(fin[3]) : Number(aujIso.slice(0, 4));
      expect(anneeFin, t).toBe(Number(enIso(au).slice(0, 4)));
      if (jetons.length === 2) {
        const deb = lire(jetons[0]) as RegExpExecArray;
        expect(deb, t).not.toBeNull();
        expect(deb[1] === '1er' ? 1 : Number(deb[1])).toBe(Number(enIso(du).slice(8)));
        const moisDeb = deb[2] ? MOIS_COURTS.indexOf(deb[2] as (typeof MOIS_COURTS)[number]) + 1 : Number(enIso(au).slice(5, 7));
        expect(moisDeb, t).toBe(Number(enIso(du).slice(5, 7)));
        const anDeb = deb[3] ? Number(deb[3]) : anneeFin;
        expect(anDeb, t).toBe(Number(enIso(du).slice(0, 4)));
      }
    }), { numRuns: RUNS });
  });
});
