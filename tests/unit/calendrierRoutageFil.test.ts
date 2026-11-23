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

/*
 * PC-126 (20.11, banc 844 × 340, 13 semaines) : la tireuse a, une rangée au-dessus d'elle à 1 px, l'icône et le nom de la Hotte. Le fil partait
 * du haut de la tireuse, donc dans cette rangée : `M166.7 629.0V626.5H26.7…` traversait l'icône de la Hotte (« Hotte » et « Achats » aussi).
 * Un fil qui ne peut sortir par le haut sort par le côté du jalon.
 */
describe('PC-126 : le fil sort du jalon par le côté quand le haut est pris par la rangée voisine', () => {
  const foire = B(140, 91, 199, 109), tireuse = B(157, 629, 177, 649);
  const hotteIcone = B(133, 609, 153, 629), hotteNom = B(163, 610, 196, 628);
  const achats = B(38, 548, 79, 566), pastille = B(117, 445, 173, 465), hopfen = B(40, 585, 60, 605);
  const infos = [hotteIcone, hotteNom, achats, pastille, hopfen];

  it('la version d’avant traversait la rangée voisine (contrôle de la version rejetée)', () => {
    /* le chemin relevé au banc avant la correction */
    const avant = [[166.7, 629], [166.7, 626.5], [26.7, 626.5], [26.7, 470.5], [158.7, 470.5], [158.7, 462.5], [166.7, 462.5], [166.7, 200]] as Array<[number, number]>;
    expect(obstaclesTraverses(avant, infos)).toBeGreaterThan(0);
  });

  it('le fil ne traverse ni l’icône, ni le nom de la rangée voisine, ni les autres infos', () => {
    const pts = routerFil(tireuse, foire, infos, 844) as Array<[number, number]>;
    expect(pts).not.toBeNull();
    expect(obstaclesTraverses(pts, infos)).toBe(0);
    expect(pts[0]).toEqual([167, 629]);
    const fin = pts[pts.length - 1];
    expect(fin[1]).toBe(109);
    expect(fin[0]).toBeGreaterThanOrEqual(146);
    expect(fin[0]).toBeLessThanOrEqual(193);
    for (let k = 1; k < pts.length; k++) expect(pts[k][0] === pts[k - 1][0] || pts[k][1] === pts[k - 1][1]).toBe(true);
  });

  it('jalon sous la barre, rien entre : toujours droit, parti du haut du jalon', () => {
    const pts = routerFil(tireuse, foire, [], 844) as Array<[number, number]>;
    expect(cheminDePoints(pts)).toBe('M167.0 629.0V109.0');
  });

  it('le jalon au-dessus de la barre : la sortie par le côté marche aussi vers le bas', () => {
    const jalonHaut = B(157, 91, 177, 111), barreBas = B(140, 629, 199, 647);
    const voisin = B(133, 112, 153, 132), voisinNom = B(163, 113, 196, 131);
    const pts = routerFil(jalonHaut, barreBas, [voisin, voisinNom], 844) as Array<[number, number]>;
    expect(pts).not.toBeNull();
    expect(obstaclesTraverses(pts, [voisin, voisinNom])).toBe(0);
    expect(pts[0]).toEqual([167, 111]);
    expect(pts[pts.length - 1][1]).toBe(629);
  });
});
