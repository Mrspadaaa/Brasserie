import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { axeDeLEchelle, echelleDeVue, fenetreDePeriode, joursEntre, lundi, periodeDeFenetre, plusSemaines, semainesEntre } from '../../src/domain/calendrier/temps';
import { lundiDe, numeroSemaine } from '../../src/domain/calendrier';
import { etatInitial, fenetreDuCadre, lire, reduire, SEMAINES_ANNEE, type ActionCadre, type EtatCadre, type Horizon } from '../../src/ui/calendrier/cadre/etat';
import { etiquetteSemainesAnnees, libelleDuree } from '../../src/ui/calendrier/entete/Fenetre';
import { nomRogne, periodesBande } from '../../src/ui/calendrier/entete/BandeSemaines';
import type { Periode } from '../../src/components/periode/periode';

/* D444 : le temps de la frise (d3-time, d3-scale) et le cœur à un seul état. */

const H: Horizon = { premier: '2025-11-24', total: 5 * 52 + 1 + 52, lundiAuj: '2026-11-23' };
const jourArb = fc.integer({ min: Date.UTC(2023, 0, 1) / 864e5, max: Date.UTC(2032, 11, 31) / 864e5 }).map((j) => new Date(j * 864e5).toISOString().slice(0, 10));

describe('temps de la frise (d3-time)', () => {
  it('lundi = lundiDe du domaine, semaines et jours comptés au calendrier (passage à l\'heure d\'été compris)', () => {
    fc.assert(fc.property(jourArb, jourArb, (a, b) => {
      expect(lundi(a)).toBe(lundiDe(a));
      expect(semainesEntre(a, b)).toBe(Math.round((Date.parse(lundiDe(b)) - Date.parse(lundiDe(a))) / (7 * 864e5)));
      expect(joursEntre(a, b)).toBe(Math.round((Date.parse(b) - Date.parse(a)) / 864e5));
    }));
    expect(semainesEntre('2026-03-23', '2026-03-30')).toBe(1); // l'heure d'été du 29 mars 2026
  });
  it('fenetreDePeriode : un mois montre 4 semaines au moins ; une plage avant l\'horizon garde sa durée (CHV-4) ; Tout : null', () => {
    expect(fenetreDePeriode({ genre: 'mois', annee: 2026, mois: 11 }, H.premier, H.total)).toEqual({ du: '2026-10-26', semaines: 6 });
    expect(fenetreDePeriode({ genre: 'dates', du: '2025-01-06', au: '2025-12-28' }, H.premier, H.total)).toEqual({ du: H.premier, semaines: 51 });
    expect(fenetreDePeriode({ genre: 'tout' }, H.premier, H.total)).toBeNull();
    expect(fenetreDePeriode({ genre: 'dates', du: '2040-01-01', au: '2040-02-01' }, H.premier, H.total)).toBeNull();
    const f = { du: '2026-11-23', semaines: 6 };
    expect(fenetreDePeriode(periodeDeFenetre(f), H.premier, H.total)).toEqual(f);
  });
  it('échelle de la vue (scaleUtc) : la date d\'un x, l\'axe montré', () => {
    const e = echelleDeVue(H.premier, { v0: 52 - 1, span: 8 }, 400);
    expect(axeDeLEchelle(e)).toEqual({ du: plusSemaines(H.premier, 51), au: '2027-01-10' });
    expect(Math.round(e(new Date(Date.UTC(2026, 10, 23))))).toBe(50);
  });
});

/* Le modèle : des suites aléatoires de gestes ; après chacun, la lecture dit une seule fenêtre. */
const periodeArb: fc.Arbitrary<Periode> = fc.oneof(
  fc.record({ genre: fc.constant('mois' as const), annee: fc.integer({ min: 2025, max: 2031 }), mois: fc.integer({ min: 1, max: 12 }) }),
  fc.constant({ genre: 'tout' } as const),
  fc.record({ genre: fc.constant('annee' as const), annee: fc.integer({ min: 2025, max: 2031 }) }),
  fc.tuple(jourArb, fc.integer({ min: 0, max: 5 * 365 })).map(([du, n]) => ({ genre: 'dates' as const, du, au: new Date(Date.parse(du) + n * 864e5).toISOString().slice(0, 10) }))
);
const actionArb: fc.Arbitrary<ActionCadre> = fc.oneof(
  periodeArb.map((periode) => ({ type: 'app' as const, periode })),
  fc.tuple(fc.integer({ min: -60, max: H.total + 60 }), fc.integer({ min: 1, max: H.total + 10 })).map(([i, n]) => ({ type: 'poser' as const, fenetre: { du: plusSemaines(H.premier, i), semaines: n } })),
  fc.constantFrom(6, 13, 26, 52).map((semaines) => ({ type: 'duree' as const, semaines })),
  fc.constant({ type: 'annee' as const }), fc.constant({ type: 'quitterAnnee' as const }),
  fc.constantFrom('semaines', 'annee', 'liste', 'graph').map((vue) => ({ type: 'vue' as const, vue: vue as 'liste' })),
  fc.constant({ type: 'debutGeste' as const }), fc.boolean().map((annule) => ({ type: 'finGeste' as const, annule })),
  fc.boolean().map((paysage) => ({ type: 'orientation' as const, paysage })),
  fc.tuple(fc.constantFrom('jour', 'semaine', 'mois'), fc.integer({ min: 0, max: H.total - 1 }), fc.constantFrom(2, 6, 26)).map(([echelle, i, n]) => ({ type: 'echelle' as const, echelle: echelle as 'jour', fenetre: { du: plusSemaines(H.premier, i), semaines: n } }))
);

function invariants(e: EtatCadre, a: ActionCadre | null, avant: EtatCadre | null) {
  const l = lire(e, H);
  const fin = semainesEntre(H.premier, l.fenetre.du) + l.fenetre.semaines;
  /* le cadre est dans l'horizon */
  expect(l.fenetre.du >= H.premier && fin <= H.total && l.fenetre.semaines >= 1).toBe(true);
  /* une seule fenêtre : la période du cadre se lit en cette fenêtre (hors paysage, qui en montre 13 au moins) */
  if (!e.paysage) expect(fenetreDePeriode(e.periode, H.premier, H.total)).toEqual(l.fenetre);
  /* l'An est toujours un cadre de 52 semaines et plus ; la vue gardée ne dit jamais l'An sur moins ; le libellé dit la durée du cadre */
  if (l.annee) expect(l.fenetre.semaines).toBeGreaterThanOrEqual(SEMAINES_ANNEE);
  if (!e.paysage && fenetreDuCadre(e, H).semaines < SEMAINES_ANNEE) expect(e.vue).not.toBe('annee');
  const lib = libelleDuree(l.fenetre.semaines, l.annee);
  if (l.fenetre.semaines < SEMAINES_ANNEE) expect(lib).toBe(l.fenetre.semaines === 13 ? '3 mois' : l.fenetre.semaines === 26 ? '6 mois' : `${l.fenetre.semaines} sem.`);
  /* du … au : du lundi au dimanche du cadre */
  expect(joursEntre(l.du, l.au) + 1).toBe(l.fenetre.semaines * 7);
  if (!a || !avant || e.paysage) return;
  /* une période de l'app qui se lit dans l'horizon devient le cadre */
  if (a.type === 'app' && a.periode && fenetreDePeriode(a.periode, H.premier, H.total)) expect(l.fenetre).toEqual(fenetreDePeriode(a.periode, H.premier, H.total));
  /* « Tout » ne change pas le cadre */
  if (a.type === 'app' && a.periode?.genre === 'tout') expect(l.fenetre).toEqual(lire(avant, H).fenetre);
  if (a.type === 'duree' && a.semaines < SEMAINES_ANNEE) expect(l.fenetre.semaines).toBe(a.semaines);
  if (a.type === 'annee') expect(l.fenetre.semaines).toBe(SEMAINES_ANNEE);
}

describe('le cœur de la frise : un seul état (CAL-ETAT-COHERENT)', () => {
  it('après chaque geste, une seule fenêtre : dans l\'horizon, libellé = cadre, An = 52 semaines et plus, période = cadre', () => {
    fc.assert(fc.property(fc.option(periodeArb, { nil: undefined }), fc.array(actionArb, { maxLength: 25 }), (app, actions) => {
      let e = etatInitial({ app, gardee: null, echelle: 'semaine', paysage: false }, H);
      invariants(e, null, null);
      for (const a of actions) { const avant = e; e = reduire(e, a, H); invariants(e, a, avant); }
    }), { numRuns: 2000, seed: 444 });
  });
  it('témoin du tour 22 : l\'An, puis une plage de deux mois de l\'app → deux mois, plus « An » (ancien cœur : « An » sur avr. – nov. 2031)', () => {
    let e = etatInitial({ app: undefined, gardee: null, echelle: 'semaine', paysage: false }, H);
    e = reduire(e, { type: 'duree', semaines: 52 }, H);
    expect(lire(e, H).annee).toBe(true);
    e = reduire(e, { type: 'app', periode: { genre: 'dates', du: '2026-04-01', au: '2026-06-01' } }, H);
    const l = lire(e, H);
    expect(l.annee).toBe(false);
    expect(l.fenetre).toEqual({ du: '2026-03-30', semaines: 10 });
    expect(libelleDuree(l.fenetre.semaines, l.annee)).toBe('10 sem.');
  });
  it('un geste annulé rend la fenêtre d\'avant ; quitter l\'An rend la fenêtre d\'avant l\'An ; la rotation rend celle d\'avant', () => {
    let e = etatInitial({ app: { genre: 'mois', annee: 2026, mois: 11 }, gardee: null, echelle: 'semaine', paysage: false }, H);
    const avant = lire(e, H).fenetre;
    e = reduire(e, { type: 'debutGeste' }, H);
    e = reduire(e, { type: 'poser', fenetre: { du: avant.du, semaines: avant.semaines + 3 } }, H);
    e = reduire(e, { type: 'finGeste', annule: true }, H);
    expect(lire(e, H).fenetre).toEqual(avant);
    e = reduire(e, { type: 'annee' }, H);
    e = reduire(e, { type: 'quitterAnnee' }, H);
    expect(lire(e, H).fenetre).toEqual(avant);
    e = reduire(e, { type: 'orientation', paysage: true }, H);
    expect(lire(e, H).fenetre.semaines).toBe(13);
    e = reduire(e, { type: 'orientation', paysage: false }, H);
    expect(lire(e, H).fenetre).toEqual(avant);
  });
  it('un saut vers une chose (centrerSur) pose la fenêtre sur elle sans la garder (CHN-6)', () => {
    const e = etatInitial({ app: undefined, gardee: null, centrerSur: '2027-03-10', echelle: 'semaine', paysage: false }, H);
    expect(lire(e, H).fenetre).toEqual({ du: '2027-02-22', semaines: 6 });
    expect(e.ephemere).toBe(true);
  });
});

describe('graduations de la bande (D444, point 3)', () => {
  const semainesDe = (du: string, n: number) => Array.from({ length: n }, (_, k) => { const l = plusSemaines(du, k); return { debut: l, numero: numeroSemaine(l) }; });
  it('CAL-ETIQUETTE-GRAIN-AU-DESSUS : « S52 2026 – S1 2027 », « S47 – S49 2026 », « S48 2026 »', () => {
    const l = semainesDe('2026-12-21', 3).map((s) => s.debut);
    expect(etiquetteSemainesAnnees(l, 0, 2)).toBe('S52 – S53 2026');
    expect(etiquetteSemainesAnnees(l, 1, 2)).toBe('S53 2026 – S1 2027');
    expect(etiquetteSemainesAnnees(semainesDe('2027-12-27', 2).map((s) => s.debut), 0, 2)).toBe('S52 2027 – S1 2028');
    expect(etiquetteSemainesAnnees(l, 1, 1)).toBe('S53 2026');
  });
  it('CAL-GRADUATION-ROGNEE : un nom qui ne tient pas dans sa part visible, ou sortirait de la courbe, se tait', () => {
    expect(nomRogne([0, 30, 60, 78], 2, 30, 23)).toBe(true); // 18 px visibles pour « S53 » (23 px)
    expect(nomRogne([0, 30, 60, 90], 2, 30, 23)).toBe(false);
    expect(nomRogne([5, 30, 60], 0, 30, 23)).toBe(false); // 25 px, le nom tient
  });
  it('3 ans : un mois sur plusieurs, janvier dit son année', () => {
    const s = semainesDe('2026-11-23', 156);
    const a = s.map((_, k) => k * 2.3).concat([156 * 2.3]);
    const noms = periodesBande(s, a, 'mois', 2.3, 23).noms.map((n) => n.texte);
    expect(noms.filter((t) => /^\d{4}$/.test(t))).toEqual(['2027', '2028', '2029']);
    expect(noms.every((t) => t.length === 1 || /^\d{4}$/.test(t))).toBe(true);
  });
});
