import { describe, it } from 'vitest';
import fc from 'fast-check';
import * as C from '../../../src/domain/calendrier';
import { ajouterMois, colonnesDeLAxe, echelleEffective, uniteColonne, type Echelle } from '../../../src/ui/calendrier/echelle';
import { joursDuDoigt, joursJusquAuDoigt, pasDuDoigt, xDeDate, type AxeDoigt } from '../../../src/ui/calendrier/entete/alignement';
import { arbJours, enIso } from './_dates';

/**
 * CAL-LACHER-OU-DESSINE (23.11, « là j'ai mon événement au dessus de septembre, mais il est noté en avril ??? ») : la date écrite au lâcher, la
 * date annoncée pendant le geste et la date de l'axe sous le doigt sont la même pour toute échelle (jours, semaines, mois),
 * toute fenêtre (1 à 52 semaines), toute position du doigt, et quand la fenêtre a glissé ou grandi sous le doigt.
 * Le modèle : le doigt tient le bout de la barre (bord tiré) ou son début (barre glissée) ; ce bout suit le doigt sur l'axe dessiné.
 * CAL-JOUR-EXACT (23.11, « le choix d'un jour tombe pas exactement sur le jour ») et l'arrondi du lâcher (14 sem. : S3 sous le doigt, S4 écrit) :
 * plus de « à une colonne près ». Le bord tiré écrit le jour dont la colonne contient le doigt ; la barre glissée pose son début dans la colonne
 * sous le doigt. Exact, d'où que le bord ait été pris.
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
  return C.ajouterJours(c.debut, Math.floor(((xr - i * w) / w) * jours + 1e-7)); // une limite (à 1e-7 jour près) est le début du jour qui suit
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

/** La colonne (index) de l'axe qui contient le jour `iso`. */
const colonneDe = (a: AxeDoigt, iso: string) => a.colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
const colonneSous = (a: AxeDoigt, x: number) => Math.max(0, Math.min(a.colonnes.length - 1, Math.floor((x - a.gauche) / a.largeurColonne)));

describe('CAL-LACHER-OU-DESSINE et CAL-JOUR-EXACT : date écrite = date annoncée = date sous le doigt, sans tolérance', () => {
  it('bord tiré, pris où que ce soit : le bout va au jour dont la colonne contient le doigt', () => {
    fc.assert(fc.property(arbCas, fc.integer({ min: -3, max: 3 }), (c, prise) => {
      const { a0, a, x0, x } = prepare(c);
      /* le bout de la barre, à quelques jours du doigt qui l'a pris (la zone du bord fait 22 px) */
      const bout = C.ajouterJours(jourSous(a0, x0), prise);
      const ecrit = C.ajouterJours(bout, joursJusquAuDoigt(a, x, bout));
      const sous = jourSous(a, x);
      if (ecrit !== sous) throw new Error(`écrit ${ecrit}, sous le doigt ${sous} (${uniteColonne(a.colonnes[0])}, ${a.colonnes.length} col.)`);
    }), { numRuns: RUNS });
  });

  it('bord tiré relu par l’écart du doigt : pris dans le jour du bout, il écrit le jour sous le doigt', () => {
    fc.assert(fc.property(arbCas, c => {
      const { a0, a, x0, x } = prepare(c);
      const ecrit = C.ajouterJours(jourSous(a0, x0), joursDuDoigt(a0, x0, a, x));
      const sous = jourSous(a, x);
      if (ecrit !== sous) throw new Error(`écrit ${ecrit}, sous le doigt ${sous} (${uniteColonne(a.colonnes[0])}, ${a.colonnes.length} col.)`);
    }), { numRuns: RUNS });
  });

  it('barre glissée : son début se pose dans la colonne sous le doigt (annonce et écriture lisent le même pas)', () => {
    fc.assert(fc.property(arbCas, c => {
      const { a0, a, x0, x } = prepare(c);
      const debut = jourSous(a0, x0);
      const unite = uniteColonne(a.colonnes[0]);
      const k = pasDuDoigt(a0, x0, a, x);
      /* la date du pas, comme CalendrierTab l'annonce et l'écrit : un mois par colonne de mois, une semaine par colonne de semaine, un jour par jour */
      const ecrit = unite === 'mois' ? ajouterMois(debut, k) : C.ajouterJours(debut, unite === 'jour' ? k : k * 7);
      const ce = colonneDe(a, ecrit), cs = colonneSous(a, x);
      if (ce >= 0 && ce !== cs) throw new Error(`écrit ${ecrit} (colonne ${ce}), doigt dans la colonne ${cs} (${unite}, ${a.colonnes.length} col., k ${k})`);
    }), { numRuns: RUNS });
  });

  it('barre glissée au jour sur un axe de semaines (CAL-JOUR) : son début va au jour sous le doigt', () => {
    fc.assert(fc.property(arbCas, c => {
      const { a0, a, x0, x } = prepare(c);
      if (uniteColonne(a.colonnes[0]) !== 'semaine' || uniteColonne(a0.colonnes[0]) !== 'semaine') return; // CAL-JOUR : sur un axe de semaines seulement
      const ecrit = C.ajouterJours(jourSous(a0, x0), Math.round(pasDuDoigt(a0, x0, a, x, true) * 7));
      const sous = jourSous(a, x);
      if (ecrit !== sous) throw new Error(`écrit ${ecrit}, sous le doigt ${sous} (${uniteColonne(a.colonnes[0])}, ${a.colonnes.length} col.)`);
    }), { numRuns: RUNS });
  });
});
