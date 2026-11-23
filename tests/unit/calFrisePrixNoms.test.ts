import { describe, expect, it } from 'vitest';
import { courbeCaisse, type MouvementCaisse, type SoldeSemaine } from '../../src/domain/calendrierCaisse';
import { ajouterJours } from '../../src/domain/calendrier';
import { HAUTEUR_MOIS, avecAbscisses, geometrie, maxNoms, obstaclesZero, placerNoms, type Geo } from '../../src/ui/calendrier/entete/Courbe';

/**
 * CHASSE-visuel 21.11 (CHV-1, CHV-2, CHV-3) : les noms de la courbe du haut.
 * - CHV-1 : courbe alignée sur la frise (abscisses lues, décalées), aucun nom n'est traversé par le tracé (libre, caisse, leurs marches) ;
 * - CHV-2 : sous zéro, aucun nom ne traverse la ligne zéro ni ne finit contre son repère « 0 » ;
 * - CHV-3 : jamais plus de deux noms l'un au-dessus de l'autre.
 */
const LUNDI0 = '2026-10-26';
const jour = (semaine: number, plus = 2) => ajouterJours(LUNDI0, semaine * 7 + plus);
const mouvements: MouvementCaisse[] = [
  { id: 'a', jour: jour(1), centimes: -30000, nom: 'TVA T4' },
  { id: 'b', jour: jour(1), centimes: -4500, nom: 'Emballage' },
  { id: 'c', jour: jour(2), centimes: -60000, nom: 'lol' },
  { id: 'd', jour: jour(3), centimes: 12000, nom: 'Facture Café du Lac' },
  { id: 'e', jour: jour(3), centimes: -2400, nom: 'Impôt sur la bière · neipa v3' },
  { id: 'f', jour: jour(4), centimes: -90000, nom: 'Hotte' },
  { id: 'g', jour: jour(5), centimes: 9000, nom: 'La Cigogne, 3 fûts' },
  { id: 'h', jour: jour(5), centimes: -3200, nom: 'Sols : colle et joints' },
  { id: 'i', jour: jour(6), centimes: -6900, nom: 'Ttt' },
  { id: 'j', jour: jour(7), centimes: -4500, nom: 'Emballage bis' },
  { id: 'k', jour: jour(8), centimes: 50000, nom: 'Fête du village' },
  { id: 'l', jour: jour(9), centimes: -12000, nom: 'Malt' }
];

type Encre = { l: number; r: number; t: number; b: number };
const encre = (e: { y: number; boite: { l: number; r: number } }): Encre => ({ l: e.boite.l, r: e.boite.r, t: e.y - 11, b: e.y + 3 });

/** Le tracé dessiné (escalier libre et caisse) traverse-t-il l'encre ? Recompté ici, sans la fonction du composant. */
function traverse(s: readonly SoldeSemaine[], g: Geo, b: Encre): string | null {
  for (const serie of ['libre', 'caisse'] as const) {
    for (let j = 0; j < s.length; j++) {
      const y = g.y(s[j][serie]), x0 = g.x(j), x1 = g.x(j + 1);
      if (y > b.t && y < b.b && x1 > b.l && x0 < b.r) return `${serie} S${s[j].numero} (palier)`;
      if (j > 0) {
        const ya = g.y(s[j - 1][serie]);
        if (x0 > b.l && x0 < b.r && Math.min(ya, y) < b.b && Math.max(ya, y) > b.t) return `${serie} S${s[j].numero} (marche)`;
      }
    }
  }
  return null;
}

function cas(largeur: number, depart: number, aligne: boolean) {
  const c = courbeCaisse({ depart, lundi0: LUNDI0, mouvements })!;
  const n = c.semaines.length;
  const g0 = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), n, largeur, 120, 4, 120 - HAUTEUR_MOIS);
  // aligné : les bords lus dans la frise, décalés de 30 px et de largeurs inégales (comme une frise qui commence avant la courbe)
  const pas = (largeur - 40) / n;
  const abscisses = Array.from({ length: n + 1 }, (_, k) => 30 + k * pas + (k % 2 ? pas * 0.3 : 0) - (k === n ? pas * 0.3 * (n % 2) : 0));
  const g = aligne ? avecAbscisses(g0, abscisses) : g0;
  const noms = placerNoms(c.semaines, g, maxNoms(largeur), obstaclesZero(g, largeur));
  return { c, g, noms };
}

describe('CHV-1 à 3 : les noms de la courbe évitent le tracé, la ligne zéro, son « 0 », et ne s’empilent pas', () => {
  for (const largeur of [390, 1280]) for (const aligne of [false, true]) for (const depart of [100000, 20000]) {
    const lieu = `${largeur} px, ${aligne ? 'alignée' : 'libre'}, départ ${depart / 100}`;
    it(`CHV-1 : aucun nom traversé par le tracé (${lieu})`, () => {
      const { c, g, noms } = cas(largeur, depart, aligne);
      expect(noms.length).toBeGreaterThan(0);
      for (const e of noms) expect(traverse(c.semaines, g, encre(e)), `« ${e.nom} ${e.montant} »`).toBeNull();
    });
    it(`CHV-2 : ni sur la ligne zéro ni contre le « 0 » (${lieu})`, () => {
      const { g, noms } = cas(largeur, depart, aligne);
      if (g.lo >= 0) return;
      const y0 = g.y(0);
      for (const e of noms) {
        const b = encre(e);
        expect(b.t <= y0 + 2 && b.b >= y0 - 2, `« ${e.nom} ${e.montant} » traverse la ligne zéro`).toBe(false);
        // le « 0 » : ancré à droite à largeur − 3, 9 px de large, ligne de base y0 − 3 ; 6 px d'air au moins
        const zero = { l: largeur - 12, r: largeur - 3, t: y0 - 14, b: y0 };
        const pres = b.r > zero.l - 6 && b.l < zero.r + 6 && b.b > zero.t - 6 && b.t < zero.b + 6;
        expect(pres, `« ${e.nom} ${e.montant} » collé au « 0 »`).toBe(false);
      }
    });
    it(`CHV-3 : au plus deux noms l’un au-dessus de l’autre (${lieu})`, () => {
      const { noms } = cas(largeur, depart, aligne);
      for (let x = 0; x < largeur; x += 2) {
        const sur = noms.filter(e => e.boite.l <= x && x <= e.boite.r);
        expect(sur.length, `${sur.length} noms empilés à x = ${x} : ${sur.map(e => e.nom).join(', ')}`).toBeLessThanOrEqual(2);
      }
    });
  }
});
