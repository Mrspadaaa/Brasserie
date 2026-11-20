import { describe, expect, it } from 'vitest';
import { courbeCaisse, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { ajouterJours } from '../../src/domain/calendrier';
import { HAUTEUR_MOIS, geometrie, maxNoms, placerNoms } from '../../src/ui/calendrier/entete/Courbe';

/**
 * CAL-PASSE (21.11, n° 7) : les étiquettes de la courbe du haut ne se chevauchent jamais, comme le navigateur les mesure. Un texte de 14 px
 * (Source Sans 3) occupe 20 px de haut au rendu (getBBox : 14,3 au-dessus de la ligne de base, 5,6 dessous), pas les 14 px de son encre : deux
 * noms sur deux lignes voisines à 16 px d'écart se recouvraient de 4 px (« TVA T4 −300 » sur « Impôt sur la bière · Jhhh −24 », mesuré en Chrome).
 */
const LUNDI0 = '2026-10-26';
const jour = (semaine: number, plus = 2) => ajouterJours(LUNDI0, semaine * 7 + plus);
const BOITE = (e: { x: number; y: number; ancre: string; boite: { l: number; r: number } }) => ({ l: e.boite.l, r: e.boite.r, t: e.y - 15, b: e.y + 5 });

/** Beaucoup de mouvements nommés dans quelques semaines : de quoi forcer des noms sur des lignes voisines. */
const dense: MouvementCaisse[] = [
  { id: 'a', jour: jour(8), centimes: -30000, nom: 'TVA T4' },
  { id: 'b', jour: jour(8), centimes: -2400, nom: 'Impôt sur la bière · Jhhh' },
  { id: 'c', jour: jour(9), centimes: -60000, nom: 'lol' },
  { id: 'd', jour: jour(7), centimes: 120000, nom: 'Facture Café du Lac' },
  { id: 'e', jour: jour(10), centimes: -2400, nom: 'Impôt sur la bière · neipa v3' },
  { id: 'f', jour: jour(11), centimes: -90000, nom: 'Hotte' },
  { id: 'g', jour: jour(12), centimes: 90000, nom: 'La Cigogne, 3 fûts' },
  { id: 'h', jour: jour(6), centimes: -32000, nom: 'Sols : colle et joints' }
];

describe('CAL-PASSE n° 7 : placerNoms rend des boîtes que le navigateur mesure', () => {
  for (const largeur of [390, 844, 1280]) {
    it(`à ${largeur} px, aucune boîte de 20 px n’en croise une autre, aucune ne sort de la courbe`, () => {
      const c = courbeCaisse({ depart: 100000, lundi0: LUNDI0, mouvements: dense })!;
      const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), c.semaines.length, largeur, 120, 4, 120 - HAUTEUR_MOIS);
      const noms = placerNoms(c.semaines, g, maxNoms(largeur));
      expect(noms.length).toBeGreaterThan(0);
      const boites = noms.map(BOITE);
      for (let i = 0; i < boites.length; i++) {
        expect(boites[i].l).toBeGreaterThanOrEqual(0);
        expect(boites[i].r).toBeLessThanOrEqual(largeur);
        for (let j = i + 1; j < boites.length; j++) {
          const a = boites[i], b = boites[j];
          const croise = a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
          expect(croise, `« ${noms[i].nom} ${noms[i].montant} » et « ${noms[j].nom} ${noms[j].montant} » se recouvrent`).toBe(false);
        }
      }
    });
  }

  it('un nom trop long pour sa place se raccourcit (avant « · ») avant de se taire', () => {
    const c = courbeCaisse({ depart: 100000, lundi0: LUNDI0, mouvements: [{ id: 'z', jour: jour(2), centimes: -2400, nom: 'Impôt sur la bière · un lot au nom très très long' }] })!;
    const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), c.semaines.length, 200, 120, 4, 120 - HAUTEUR_MOIS);
    const noms = placerNoms(c.semaines, g, maxNoms(200));
    expect(noms).toHaveLength(1);
    expect(noms[0].nom.length).toBeLessThan('Impôt sur la bière · un lot au nom très très long'.length);
    expect(noms[0].nom).toMatch(/^Impôt sur la bière/);
    expect(noms[0].montant).toBe('−24');
  });
});
