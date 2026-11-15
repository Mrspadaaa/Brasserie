// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { largeurTexte, placerEtiquettes, seRecouvrent, type Demande, type Rect } from '../../src/ui/finance/previsions/placement';

/** Obstacles fixes de l'escalier (graduations à gauche, noms de mois en bas, « aujourd'hui » en haut, solde final à droite). */
const obstacles = (w: number, h: number): Rect[] => [{ x: 0, y: 0, w: 46, h }, { x: 0, y: h - 30, w, h: 30 }, { x: 46, y: 0, w: 150, h: 18 }, { x: w - 100, y: 380, w: 96, h: 24 }];
const demande = (i: number, w: number, h: number, x: number, y: number, priorite = 10): Demande => ({ id: `e${i}`, priorite, ancre: { x, y }, w, h, ordre: i, poids: 1000 - i });

function verifie(demandes: Demande[], cadre: { w: number; h: number }, obs: Rect[]) {
  const { placees, reste } = placerEtiquettes(demandes, cadre, obs);
  for (const p of placees) {
    expect(p.rect.x).toBeGreaterThanOrEqual(0); expect(p.rect.y).toBeGreaterThanOrEqual(0);
    expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(cadre.w); expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(cadre.h);
    expect(obs.some(o => seRecouvrent(p.rect, o))).toBe(false);
  }
  for (let i = 0; i < placees.length; i++) for (let j = i + 1; j < placees.length; j++) expect(seRecouvrent(placees[i].rect, placees[j].rect, 0)).toBe(false);
  expect(placees.length + reste.length).toBe(demandes.length);
  return { placees, reste };
}
const dix = (echelle = 1) => Array.from({ length: 10 }, (_, i) => demande(i, Math.round(largeurTexte(i === 1 ? 'frigo −3 000, 15.11, estimé' : 'loyer −400,00, 25.11', 13) * echelle) + 20, i === 1 ? 40 : 20, 60 + i * 28, 90 + i * 30, i === 1 ? 100 : 10));

describe('placement des étiquettes : jamais de recouvrement, jamais hors cadre, jamais sur un obstacle fixe', () => {
  it.each([320, 370, 560])('largeur %i, deux mesures de texte', largeur => {
    for (const echelle of [1, 1.3]) { const r = verifie(dix(echelle), { w: largeur, h: 500 }, obstacles(largeur, 500)); expect(r.placees.length).toBeGreaterThan(0); }
  });
  it('25 sorties : ce qui ne tient pas passe dans « + N », rien ne se recouvre', () => {
    const d = Array.from({ length: 25 }, (_, i) => demande(i, 130, 20, 60 + (i % 9) * 30, 60 + i * 15));
    const r = verifie(d, { w: 370, h: 500 }, obstacles(370, 500));
    expect(r.reste.length).toBeGreaterThan(0);
    expect(r.placees.length + r.reste.length).toBe(25);
  });
  it('« 12 mois réaliste » : 4 sorties de brassin ×3, 12 loyers, factures en retard empilées à aujourd’hui', () => {
    const d = Array.from({ length: 30 }, (_, i) => demande(i, i < 4 ? 200 : 110, 20, i < 4 ? 50 : 50 + i * 9, i < 4 ? 40 : 100 + (i % 6) * 40, i < 3 ? 80 : 10));
    verifie(d, { w: 370, h: 500 }, obstacles(370, 500));
  });
  it('déterministe : mêmes entrées, même sortie ; le projet testé passe en premier', () => {
    const d = dix();
    expect(placerEtiquettes(d, { w: 370, h: 500 }, obstacles(370, 500))).toEqual(placerEtiquettes([...d].reverse(), { w: 370, h: 500 }, obstacles(370, 500)));
    expect(placerEtiquettes(d, { w: 370, h: 500 }, obstacles(370, 500)).placees.some(p => p.id === 'e1')).toBe(true);
  });
  it('rapide à froid (moins de 50 ms pour 30 étiquettes, garde large)', () => {
    const t = performance.now(); placerEtiquettes(Array.from({ length: 30 }, (_, i) => demande(i, 120, 20, 60 + i * 8, 60 + i * 12)), { w: 370, h: 500 }, obstacles(370, 500));
    expect(performance.now() - t).toBeLessThan(50);
  });
});
