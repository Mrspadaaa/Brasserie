// D441 (CAL-UN-SEUL-AXE) : une seule transformation date → x pour la courbe, la bande et les rangées. Propriétés : la vue au repos est posée sur
// des unités entières (jours sous 5 semaines, semaines au-delà), contient le cadre avec la même marge des deux côtés ; une vue tirée posée sur
// ses unités ne bouge plus (idempotent) ; les colonnes des rangées bâties sur cette vue donnent à chaque date le x de la courbe.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { uniteDeVue, vueDeFenetre, vueEnUnites } from '../../../src/ui/calendrier/entete/Fenetre';
import { xDeDate } from '../../../src/ui/calendrier/entete/alignement';
import { ajouterJours } from '../../../src/domain/calendrier';

const entier = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;

describe('D441 : un seul axe', () => {
  it('la vue au repos : unités entières, cadre dedans, marges égales et d\'au moins une unité', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 300 }), fc.integer({ min: 1, max: 260 }), fc.integer({ min: 300, max: 1400 }), (index, nombre, largeur) => {
      const v = vueDeFenetre(index, nombre, largeur), u = uniteDeVue(v.span);
      expect(entier(v.v0 * u) && entier(v.span * u)).toBe(true);
      const gauche = index - v.v0, droite = v.v0 + v.span - (index + nombre);
      expect(gauche).toBeGreaterThanOrEqual(1 / u - 1e-9);
      expect(Math.abs(gauche - droite)).toBeLessThan(1e-9);
    }));
  });
  it('une vue tirée posée sur ses unités ne bouge plus', () => {
    fc.assert(fc.property(fc.double({ min: -20, max: 300, noNaN: true }), fc.double({ min: 0.2, max: 400, noNaN: true }), (v0, span) => {
      const a = vueEnUnites({ v0, span }), b = vueEnUnites(a);
      expect(b.v0).toBeCloseTo(a.v0, 9); expect(b.span).toBeCloseTo(a.span, 9);
    }));
  });
  it('les colonnes des rangées sur la vue : chaque date au x de la courbe', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 200 }), fc.integer({ min: 1, max: 120 }), fc.integer({ min: 300, max: 1400 }), fc.integer({ min: -30, max: 900 }), (index, nombre, largeur, jour) => {
      const lundi0 = '2025-11-17', v = vueDeFenetre(index, nombre, largeur), u = uniteDeVue(v.span);
      const du = ajouterJours(lundi0, Math.round(v.v0 * 7)), n = Math.round(v.span * u), w = largeur / n;
      const cols = Array.from({ length: n }, (_, k) => (u === 7 ? { debut: ajouterJours(du, k), fin: ajouterJours(du, k), etiquette: '' } : { debut: ajouterJours(du, 7 * k), fin: ajouterJours(du, 7 * k + 6), etiquette: '' }));
      const date = ajouterJours(du, jour);
      const xCourbe = (jour / 7 + Math.round(v.v0 * 7) / 7 - v.v0) * (largeur / v.span);
      expect(Math.abs(xDeDate(cols, w, date) - xCourbe)).toBeLessThan(1e-6);
    }));
  });
});
