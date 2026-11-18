import { describe, expect, it } from 'vitest';
import { cheminDePoints, obstaclesTraverses, routerFil, type BoiteRoute } from '../../src/ui/calendrier/frise/routageFil';
import { cheminFil } from '../../src/ui/calendrier/frise/Frise';

/*
 * Paquet D n° 1 (18.11, « La ligne doit pas être dessus l'info ») : au toucher de la Foire, le fil de la tireuse passait tout droit sous Dédé,
 * « +130 » et les pastilles (banc 390 : `M161.2 927.0V290.0`, 9 infos traversées). Le fil se trace dans une voie libre.
 */
const B = (left: number, top: number, right: number, bottom: number): BoiteRoute => ({ left, top, right, bottom });
const points = (d: string): Array<[number, number]> => {
  const pts: Array<[number, number]> = []; let x = 0, y = 0;
  for (const m of d.matchAll(/([MHV])(-?[\d.]+)(?: (-?[\d.]+))?/g)) {
    if (m[1] === 'M') { x = Number(m[2]); y = Number(m[3]); } else if (m[1] === 'H') x = Number(m[2]); else y = Number(m[2]);
    pts.push([x, y]);
  }
  return pts;
};

describe('Paquet D n° 1 : le fil passe à côté des infos, pas à travers', () => {
  /* la Foire (barre) en haut, la tireuse (jalon) en bas ; entre les deux, Dédé et « +130 » à l'aplomb de la tireuse */
  const foire = B(130, 100, 200, 120), tireuse = B(150, 400, 172, 428);
  const dede = B(140, 250, 230, 266), montant = B(232, 250, 262, 266);
  const infos = [dede, montant, B(10, 180, 120, 196)];

  it('le fil droit d’avant traversait Dédé (contrôle de la version rejetée)', () => {
    const d = cheminFil(tireuse, foire) as string;
    expect(obstaclesTraverses(points(d), infos)).toBeGreaterThan(0);
  });

  it('le fil routé ne traverse aucune info, part du bord du jalon et arrive au bord de la barre', () => {
    const pts = routerFil(tireuse, foire, infos, 390) as Array<[number, number]>;
    expect(pts).not.toBeNull();
    expect(obstaclesTraverses(pts, infos.map(o => B(o.left - 1, o.top - 1, o.right + 1, o.bottom + 1)))).toBe(0);
    expect(pts[0]).toEqual([161, 400]);
    const fin = pts[pts.length - 1];
    expect(fin[1]).toBe(120);
    expect(fin[0]).toBeGreaterThanOrEqual(136);
    expect(fin[0]).toBeLessThanOrEqual(194);
    /* orthogonal, peu de coudes */
    for (let k = 1; k < pts.length; k++) expect(pts[k][0] === pts[k - 1][0] || pts[k][1] === pts[k - 1][1]).toBe(true);
    expect(pts.length).toBeLessThanOrEqual(6);
    expect(cheminDePoints(pts)).toMatch(/^M161\.0 400\.0V/);
  });

  it('rien entre les deux : le fil reste droit', () => {
    const pts = routerFil(tireuse, foire, [B(10, 180, 120, 196)], 390) as Array<[number, number]>;
    expect(cheminDePoints(pts)).toBe('M161.0 400.0V120.0');
  });

  it('une info qui couvre toute la largeur (la fiche ouverte) : le fil passe dessous au plus court, jamais de détour sans fin', () => {
    const fiche = B(0, 200, 390, 300);
    const pts = routerFil(tireuse, foire, [fiche, dede], 390) as Array<[number, number]>;
    expect(pts).not.toBeNull();
    expect(obstaclesTraverses(pts, [dede])).toBe(0);
  });

  it('les infos du jalon et de la barre eux-mêmes ne bloquent pas', () => {
    const nomJalon = B(148, 398, 260, 430), nomBarre = B(128, 98, 300, 122);
    const pts = routerFil(tireuse, foire, [nomJalon, nomBarre], 390) as Array<[number, number]>;
    expect(cheminDePoints(pts)).toBe('M161.0 400.0V120.0');
  });

  it('jalon et barre à la même hauteur : pas de fil', () => {
    expect(routerFil(B(150, 100, 172, 118), foire, [], 390)).toBeNull();
  });
});
