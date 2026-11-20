// @vitest-environment jsdom
/**
 * CAL-PASSE (20.11) : « je suis en négatif et on le voit même pas sur le graph ». En-tête « −683 CHF à dépenser » : la courbe était une bande bleue
 * dont le bord bas portait la ligne du solde (y = bas) et dont le bord haut était la ligne zéro : rien ne disait « sous zéro ».
 * Le domaine Y contient le minimum négatif ET zéro, avec de l'air sous la valeur la plus basse ; sous zéro, la ligne zéro se lit et la zone dessous se teinte.
 */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Courbe, geometrie, courbePlate, type SoldeSemaine } from '../../src/ui/calendrier/entete/Courbe';

afterEach(() => cleanup());

const semaine = (i: number, libre: number, caisse = libre): SoldeSemaine => ({
  index: i, lundi: `2026-11-${String(16 + i * 7).padStart(2, '0')}`, numero: 47 + i, libre, caisse, tendance: 0, mouvements: []
} as unknown as SoldeSemaine);

describe('geometrie : le domaine Y', () => {
  it('solde négatif constant (−683 CHF, courbe plate) : le domaine contient −68 300 ET 0, la valeur ne touche pas le bord bas, zéro ne touche pas le bord haut', () => {
    const g = geometrie([-68_300, -68_300], 20, 366, 88, 4, 74);
    expect(g.lo).toBeLessThan(-68_300);
    expect(g.hi).toBeGreaterThan(0);
    expect(g.y(-68_300)).toBeLessThan(g.bas - 2);
    expect(g.y(0)).toBeGreaterThan(g.haut + 1);
    expect(g.y(0)).toBeLessThan(g.y(-68_300));
  });

  it('solde qui passe sous zéro (le banc : +8 000 puis −641 700) : tout le domaine tient, avec de l’air sous le minimum', () => {
    const g = geometrie([800_000, 120_000, -641_700], 6, 366, 88, 4, 74);
    expect(g.lo).toBeLessThan(-641_700);
    expect(g.y(-641_700)).toBeLessThan(g.bas);
    expect(g.y(800_000)).toBeGreaterThanOrEqual(g.haut);
  });

  it('solde positif : le domaine ne change pas (0 en bas, aucun air ajouté)', () => {
    const g = geometrie([100_000, 250_000], 6, 366, 88, 4, 74);
    expect(g.lo).toBe(0);
    expect(g.y(0)).toBe(g.bas);
  });
});

describe('Courbe : la ligne zéro et la zone sous zéro', () => {
  const rendre = (valeurs: number[]) => render(<Courbe courbe={valeurs.map((v, i) => semaine(i, v))} largeur={366} hauteur={88} />);

  it('un minimum négatif : ligne zéro visible, repère « 0 », zone et aire sous zéro rendus', () => {
    const { container } = rendre([-68_300, -68_300, -68_300, -68_300]);
    expect(courbePlate([-68_300, -68_300].map((v, i) => semaine(i, v)))).toBe(true);
    expect(container.querySelector('[data-ligne-zero="visible"]')).not.toBeNull();
    expect(container.querySelector('[data-sous-zero="zone"]')).not.toBeNull();
    expect(container.querySelector('[data-sous-zero="aire"]')).not.toBeNull();
    expect(container.querySelector('[data-sous-zero="repere"]')?.textContent).toBe('0');
    /* la zone sous zéro commence à la ligne zéro et finit avant le bord bas du dessin, la ligne du solde reste à l'intérieur */
    const zero = container.querySelector('.ent-zero')!;
    const zone = container.querySelector('[data-sous-zero="zone"]')!;
    expect(Number(zone.getAttribute('y'))).toBeCloseTo(Number(zero.getAttribute('y1')), 1);
    expect(Number(zone.getAttribute('height'))).toBeGreaterThan(20);
  });

  it('un solde positif : aucune ligne zéro marquée, aucune zone sous zéro (rien ne change)', () => {
    const { container } = rendre([50_000, 80_000, 60_000]);
    expect(container.querySelector('[data-ligne-zero]')).toBeNull();
    expect(container.querySelector('[data-sous-zero]')).toBeNull();
    expect(container.querySelector('.ent-zero')).not.toBeNull();
  });
});
