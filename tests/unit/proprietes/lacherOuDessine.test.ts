import { describe, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import { ajouterMois, colonnesDeLAxe, echelleEffective, uniteColonne, type Echelle } from '../../../src/ui/calendrier/echelle';
import { joursDuDoigt, pasDuDoigt, xDeDate, type AxeDoigt } from '../../../src/ui/calendrier/entete/alignement';
import { arbJours, enIso } from './_dates';

/**
 * CAL-LACHER-OU-DESSINE (23.11, « là j'ai mon événement au dessus de septembre, mais il est noté en avril ??? ») : la date écrite au lâcher, la
 * date annoncée pendant le geste et la date de l'axe sous le doigt sont la même, à une colonne près, pour toute échelle (jours, semaines, mois),
 * toute fenêtre (1 à 52 semaines), toute position du doigt, et quand la fenêtre a glissé ou grandi sous le doigt.
 * Le modèle : le doigt tient le bout de la barre (bord tiré) ou son début (barre glissée) ; ce bout suit le doigt sur l'axe dessiné.
 */
const PASSE = 52, TOTAL = 104, GAUCHE = 16;
const RUNS = 3000;

function axe(auj: number, i: number, n: number, voulue: Echelle, largeur: number): AxeDoigt {
  const iso = enIso(auj);
  const semaines = C.semainesDe(iso, TOTAL, PASSE).map(s => ({ debut: s.debut, numero: s.numero }));
  const mois = C.anneeEnMois(iso, TOTAL, PASSE).map(m => ({ debut: m.debut, fin: m.fin, court: m.court }));
  const du = semaines[i].debut;
  const colonnes = colonnesDeLAxe({ echelle: echelleEffective(voulue, n, false), semaines, mois, du, nombre: n });
  return { colonnes, largeurColonne: largeur / colonnes.length, gauche: GAUCHE };
}

/** Le jour de l'axe sous l'abscisse `x` (écran) : le jour dont la colonne dessinée contient x. */
function jourSous(a: AxeDoigt, x: number): string {
  const w = a.largeurColonne, xr = x - a.gauche, n = a.colonnes.length;
  const i = Math.max(0, Math.min(n - 1, Math.floor(xr / w))), c = a.colonnes[i];
  const jours = C.ecartJours(c.debut, c.fin) + 1;
  return C.ajouterJours(c.debut, Math.floor(((xr - i * w) / w) * jours));
}

const arbCas = fc.record({
  auj: arbJours,
  i: fc.integer({ min: 2, max: 60 }),
  n: fc.integer({ min: 1, max: 52 }),
  voulue: fc.constantFrom<Echelle>('jour', 'semaine', 'mois'),
  largeur: fc.integer({ min: 300, max: 1200 }),
  /* la fenêtre sous le doigt : la même, glissée de s semaines (51 sem. au bord), ou grandie de g semaines (le bord qui l'étend) */
  change: fc.oneof(fc.constant({ s: 0, g: 0 }), fc.integer({ min: -6, max: 6 }).map(s => ({ s, g: 0 })), fc.integer({ min: 1, max: 20 }).map(g => ({ s: 0, g }))),
  p0: fc.double({ min: 0.02, max: 0.98, noNaN: true }),
  p: fc.double({ min: 0.02, max: 0.98, noNaN: true })
}).filter(({ i, n, change }) => i + change.s >= 0 && i + change.s + n + change.g <= TOTAL && n + change.g <= 52);

function prepare(c: fc.RecordValue<typeof arbCas> extends never ? never : any) {
  const a0 = axe(c.auj, c.i, c.n, c.voulue, c.largeur);
  const a = axe(c.auj, c.i + c.change.s, c.n + c.change.g, c.voulue, c.largeur);
  const x0 = GAUCHE + c.p0 * c.largeur, x = GAUCHE + c.p * c.largeur;
  return { a0, a, x0, x };
}

const ecartEnColonnes = (a: AxeDoigt, j1: string, j2: string) => Math.abs(xDeDate(a.colonnes, a.largeurColonne, j1) - xDeDate(a.colonnes, a.largeurColonne, j2)) / a.largeurColonne;

describe('CAL-LACHER-OU-DESSINE : date écrite = date annoncée = date sous le doigt', () => {
  it('bord tiré : le bout de la barre se pose sous le doigt, à une colonne près', () => {
    fc.assert(fc.property(arbCas, c => {
      const { a0, a, x0, x } = prepare(c);
      const bout = jourSous(a0, x0);
      const ecrit = C.ajouterJours(bout, joursDuDoigt(a0, x0, a, x));
      const sous = jourSous(a, x);
      const e = ecartEnColonnes(a, ecrit, sous);
      if (!(e <= 1 + 1e-6)) throw new Error(`écrit ${ecrit}, sous le doigt ${sous} : ${e.toFixed(2)} colonnes (${uniteColonne(a.colonnes[0])}, ${a.colonnes.length} col.)`);
    }), { numRuns: RUNS });
  });

  it('barre glissée : son début se pose sous le doigt, à une colonne près (annonce et écriture lisent le même pas)', () => {
    fc.assert(fc.property(arbCas, c => {
      const { a0, a, x0, x } = prepare(c);
      const debut = jourSous(a0, x0);
      const unite = uniteColonne(a.colonnes[0]);
      const k = pasDuDoigt(a0, x0, a, x);
      /* la date du pas, comme CalendrierTab l'annonce et l'écrit : un mois par colonne de mois, une semaine par colonne de semaine, un jour par jour */
      const ecrit = unite === 'mois' ? ajouterMois(debut, k) : C.ajouterJours(debut, unite === 'jour' ? k : k * 7);
      const sous = jourSous(a, x);
      const e = ecartEnColonnes(a, ecrit, sous);
      if (!(e <= 1 + 1e-6)) throw new Error(`écrit ${ecrit}, sous le doigt ${sous} : ${e.toFixed(2)} colonnes (${unite}, ${a.colonnes.length} col., k ${k})`);
    }), { numRuns: RUNS });
  });
});
