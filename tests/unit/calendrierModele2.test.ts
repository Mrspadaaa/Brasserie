import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { lundi, plusSemaines, semainesEntre } from '../../src/domain/calendrier/temps';
import { semainesAvenir, semainesPassees } from '../../src/ui/calendrier/useDonneesCalendrier';
import { etatInitial, lire, reduire, SEMAINES_ANNEE, type ActionCadre, type EtatCadre, type Horizon } from '../../src/ui/calendrier/cadre/etat';
import { libelleDuree } from '../../src/ui/calendrier/entete/Fenetre';
import { semainesDe } from '../../src/domain/calendrier';
import { MARGE_AUJ, periodesBande } from '../../src/ui/calendrier/entete/BandeSemaines';
import type { Periode } from '../../src/components/periode/periode';

/* Voie modele2 (23.11 soir) : le test par modèle (e2e/calendrier/etat-coherent.spec.ts, graine 4444, 4e suite) disait « An » pour un cadre de 21,9 sem.
   (app plage 57 mois, 3 mois, après An et une poignée). Cause : un banc lancé sur un build périmé (`lotcal`, 12:14), pas le réducteur : sur le build de
   HEAD la même suite passe. Ce fichier tient le contrat côté réducteur, avec l'horizon que la période de l'app déplace (`useDonneesCalendrier`) :
   « An » ne se dit que d'un cadre de 52 semaines et plus, quelle que soit la suite de gestes et de périodes de l'app. */

const AUJ = '2026-11-23';
const dates = (du: string, au: string): Periode => ({ genre: 'dates', du, au });
/** L'horizon que le Calendrier construit pour une période de l'app : le passé et l'avenir que `useDonneesCalendrier` donne à la courbe. */
function horizonDe(periode?: Periode): Horizon {
  const passe = semainesPassees(periode, AUJ), avenir = semainesAvenir(periode, AUJ);
  return { premier: plusSemaines(lundi(AUJ), -passe), total: passe + avenir, lundiAuj: lundi(AUJ) };
}
const iso = (mois: number): string => { const t = 2026 * 12 + 10 + mois, an = Math.floor(t / 12); return `${an}-${String(t - an * 12 + 1).padStart(2, '0')}-01`; };
const plage = (dm: number, mois: number): Periode => dates(iso(dm), iso(dm + mois));

/** Un état + l'horizon courant : la période de l'app change l'horizon AVANT l'action `app` (le hook lit `hRef.current` au rendu). */
interface Monde { e: EtatCadre; h: Horizon }
const monde = (): Monde => { const h = horizonDe(undefined); return { e: etatInitial({ app: undefined, gardee: null, echelle: 'semaine', paysage: false }, h), h }; };
const appliquer = (m: Monde, a: ActionCadre): Monde => ({ ...m, e: reduire(m.e, a, m.h) });
const appPlage = (m: Monde, p: Periode): Monde => { const h = horizonDe(p); return { h, e: reduire(m.e, { type: 'app', periode: p }, h) }; };
const poignee = (m: Monde, dSem: number): Monde => {
  const f = lire(m.e, m.h).fenetre;
  return appliquer(m, { type: 'poser', fenetre: { du: plusSemaines(f.du, dSem), semaines: Math.max(1, f.semaines - dSem) } });
};

function dit(m: Monde) {
  const l = lire(m.e, m.h);
  return { l, libelle: libelleDuree(l.fenetre.semaines, l.annee) };
}

describe('modele2 : « An » ne se dit que d\'un cadre de 52 semaines et plus', () => {
  it('la suite de la graine 4444 : plage -47 mois, An, poignée, puis une plage de 3 mois en 2031 (hors de l\'horizon d\'avant)', () => {
    let m = monde();
    m = appPlage(m, plage(-47, 46));
    m = appliquer(m, { type: 'annee' });
    m = poignee(m, 4);
    m = appPlage(m, plage(57, 3));
    const { l, libelle } = dit(m);
    expect(l.fenetre.semaines).toBeGreaterThanOrEqual(13);
    expect(l.fenetre.semaines).toBeLessThanOrEqual(15);
    expect(l.annee).toBe(false);
    expect(libelle).toBe('14 sem.');
    expect(l.du).toBe('2031-07-28');
  });

  it('propriété : après toute suite de gestes et de périodes de l\'app, « An » = 52 semaines et plus, et le cadre reste dans l\'horizon', () => {
    const gestes = fc.oneof(
      fc.constantFrom(6, 13, 26, 52).map((s) => (m: Monde) => appliquer(m, { type: 'duree', semaines: s })),
      fc.constant((m: Monde) => appliquer(m, { type: 'annee' })),
      fc.integer({ min: -40, max: 40 }).map((d) => (m: Monde) => poignee(m, d)),
      fc.tuple(fc.integer({ min: -60, max: 60 }), fc.integer({ min: 2, max: 60 })).map(([dm, n]) => (m: Monde) => appPlage(m, plage(dm, n))),
      fc.constant((m: Monde) => appPlage(m, { genre: 'mois', annee: 2026, mois: 11 })),
      fc.constant((m: Monde) => appliquer(m, { type: 'quitterAnnee' })),
      fc.constant((m: Monde) => appliquer(m, { type: 'aujourdhui' }))
    );
    fc.assert(fc.property(fc.array(gestes, { minLength: 1, maxLength: 10 }), (suite) => {
      let m = monde();
      for (const g of suite) {
        m = g(m);
        const { l, libelle } = dit(m);
        if (libelle === 'An') expect(l.fenetre.semaines, `« An » pour ${l.fenetre.semaines} sem.`).toBeGreaterThanOrEqual(SEMAINES_ANNEE);
        if (l.annee) expect(l.fenetre.semaines).toBeGreaterThanOrEqual(SEMAINES_ANNEE);
        expect(semainesEntre(m.h.premier, l.du)).toBeGreaterThanOrEqual(0);
        expect(semainesEntre(m.h.premier, l.du) + l.fenetre.semaines).toBeLessThanOrEqual(m.h.total);
      }
    }), { numRuns: 400 });
  });
});

/* I6 du test par modèle, graines 4444 et 7 (build neuf de HEAD) : « 2027 » tient 277 px du cadre et n'est nommée nulle part. Le cadre est loin d'aujourd'hui :
   « ‹ auj. » couvre les 56 px de gauche (`tue`), et le janvier de l'axe d'avant le cadre y posait son année : posée, puis effacée. */
describe("modele2 : un nom d'année ne se pose pas sous « ‹ auj. »", () => {
  const W = 366, W_ETIQ = 23;
  /** L'axe du Calendrier à 390 px : 56 px de marge de chaque côté du cadre (`semaines` entières), les bords des semaines en px. */
  function axe(cadreDu: string, cadreSemaines: number) {
    const col = (W - 2 * 54) / cadreSemaines, marge = Math.ceil(54 / col);
    const sem = semainesDe(cadreDu, cadreSemaines + 2 * marge, marge).map((x) => ({ debut: x.debut, numero: x.numero }));
    const a = Array.from({ length: sem.length + 1 }, (_, k) => k * col);
    return { sem, a, col };
  }
  it('cadre du 1er févr. 2027 (44 sem.) : « 2027 » est nommée, hors de la marge muette', () => {
    const { sem, a, col } = axe('2027-02-01', 44);
    const noms = periodesBande(sem, a, 'mois', col, W_ETIQ, 'gauche').noms;
    const an = noms.find((n) => /^(2027|’27)$/.test(n.texte));
    expect(an, noms.map((n) => n.texte).join(' ')).toBeDefined();
    expect(an!.x - 10).toBeGreaterThanOrEqual(MARGE_AUJ);
    for (const n of noms) expect(n.x, n.texte).toBeGreaterThanOrEqual(MARGE_AUJ);
  });
  it('cadre du 28 juin 2027 (43 sem.) : « 2027 » est nommée', () => {
    const { sem, a, col } = axe('2027-06-28', 43);
    const noms = periodesBande(sem, a, 'mois', col, W_ETIQ, 'gauche').noms;
    expect(noms.some((n) => /^(2027|’27)$/.test(n.texte)), noms.map((n) => n.texte).join(' ')).toBe(true);
  });
  it('cadre du 18 juin 2029 (130 sem., 2,5 ans, un mois sur trois) : « 2029 » reste, l\'initiale qui la touche se tait', () => {
    const { sem, a, col } = axe('2029-06-18', 130);
    const noms = periodesBande(sem, a, 'mois', col, W_ETIQ, 'gauche').noms;
    expect(noms.some((n) => /^(2029|’29)$/.test(n.texte)), noms.map((n) => n.texte).join(' ')).toBe(true);
    for (const n of noms) expect(n.x, n.texte).toBeGreaterThanOrEqual(MARGE_AUJ);
  });
  it("propriété : sous « ‹ auj. » (gauche) ou « auj. › » (droite), aucun nom n'est posé", () => {
    fc.assert(fc.property(fc.integer({ min: 14, max: 120 }), fc.integer({ min: 0, max: 200 }), fc.constantFrom<'gauche' | 'droite'>('gauche', 'droite'), (n, decalSem, cote) => {
      const { sem, a, col } = axe(plusSemaines('2026-11-23', decalSem), n);
      const larg = a[a.length - 1];
      for (const p of periodesBande(sem, a, 'mois', col, W_ETIQ, cote).noms) {
        if (cote === 'gauche') expect(p.x, `${p.texte} à ${Math.round(p.x)}`).toBeGreaterThanOrEqual(MARGE_AUJ);
        else expect(p.x, `${p.texte} à ${Math.round(p.x)}`).toBeLessThanOrEqual(larg - MARGE_AUJ);
      }
    }), { numRuns: 300 });
  });
});
