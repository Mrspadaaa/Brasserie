import { describe, expect, it } from 'vitest';
import { courbeCaisse, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { ajouterJours } from '../../src/domain/calendrier';
import { geometrie, obstaclesZero, placerNiveau, placerNoms } from '../../src/ui/calendrier/entete/Courbe';

/**
 * Chasse Calendrier 21.11, voie V10 :
 * - CHD-2 : deux mouvements de même nom dans la semaine (deux « Emballage · Jhhh » de −45) : une étiquette, leur somme (−90) ;
 * - CHV-17 : sur une petite hauteur, le trait du solde reste à 10 px du bord bas ; sans mouvement nommé, le niveau du solde s'écrit.
 */
const LUNDI0 = '2026-11-16';
const jour = (semaine: number, plus = 2) => ajouterJours(LUNDI0, semaine * 7 + plus);

describe('CHD-2 : l’étiquette dit la somme de la semaine', () => {
  const mouvements: MouvementCaisse[] = [
    { id: 'a', jour: jour(1), centimes: -4500, nom: 'Emballage · Jhhh' },
    { id: 'b', jour: jour(1, 3), centimes: -4500, nom: 'Emballage · Jhhh' },
    { id: 'c', jour: jour(2), centimes: -4500, nom: 'Emballage · Jhhh' }
  ];
  const c = courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 6, mouvements })!;
  const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 6, 366, 88, 4, 70);

  it('deux mouvements de même nom dans la semaine : « ×2 » et −90, jamais −45', () => {
    const e = placerNoms(c.semaines, g, 8, obstaclesZero(g, 366));
    const emb = e.filter(x => x.nom.startsWith('Emballage'));
    expect(emb).toHaveLength(1);
    expect(emb[0].montant).toBe('−90');
    expect(emb[0].nom).toMatch(/×2$/);
    expect(emb[0].complet).toBe('Emballage · Jhhh ×2');
    expect(emb[0].i).toBe(1);
    // la marche de la courbe (libre) à cette semaine vaut bien −90 : le nom et la marche disent la même somme
    expect(c.semaines[1].libre - c.semaines[0].libre).toBe(-9000);
  });

  it('un récurrent d’une autre semaine reste un seul nom, à sa première semaine, avec son montant (−45), sans « ×2 »', () => {
    const seul = courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 6, mouvements: [mouvements[0], mouvements[2]] })!;
    const e = placerNoms(seul.semaines, g, 8, obstaclesZero(g, 366));
    const emb = e.filter(x => x.nom.startsWith('Emballage'));
    expect(emb).toHaveLength(1);
    expect(emb[0].montant).toBe('−45');
    expect(emb[0].nom).not.toMatch(/×/);
    expect(emb[0].semaines).toHaveLength(2);
  });

  it('deux mouvements opposés qui s’annulent ne font aucune étiquette', () => {
    const nul = courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 6, mouvements: [
      { id: 'p', jour: jour(1), centimes: 4500, nom: 'Remboursement' }, { id: 'q', jour: jour(1, 3), centimes: -4500, nom: 'Remboursement' }] })!;
    expect(placerNoms(nul.semaines, g, 8, [])).toHaveLength(0);
  });
});

describe('CHV-17 : une fenêtre de 2 semaines sans mouvement', () => {
  const plat = courbeCaisse({ depart: -734500, lundi0: LUNDI0, nbSemaines: 4, mouvements: [] })!;
  const valeurs = plat.semaines.flatMap(s => [s.libre, s.caisse]);

  it('le trait du solde reste à 7 px au moins du bord bas du dessin, sur 70 px comme sur 160 px', () => {
    for (const [haut, bas] of [[4, 70], [18, 86], [4, 160]] as const) {
      const g = geometrie(valeurs, 4, 366, bas + 2, haut, bas);
      expect(bas - g.y(plat.semaines[0].libre)).toBeGreaterThanOrEqual(7 - 1e-9);
    }
  });

  it('un solde positif garde sa géométrie (la ligne zéro en bas, pas d’air ajouté)', () => {
    const g = geometrie([100000, 120000], 2, 366, 88, 4, 86);
    expect(g.lo).toBe(0);
  });

  it('sans mouvement nommé, le niveau du solde trouve une place hors du tracé et des exclusions', () => {
    const g = geometrie(valeurs, 4, 366, 88, 18, 86);
    const ty = g.y(plat.semaines[0].libre);
    const exclusions = [{ l: 120, r: 250, t: 68, b: 86 }, ...obstaclesZero(g, 366)];
    const p = placerNiveau('Solde', '−7 345', ty, g, exclusions, plat.semaines, 183);
    expect(p).not.toBeNull();
    expect(p!.boite.b).toBeLessThanOrEqual(ty - 3);
    for (const e of exclusions) expect(p!.boite.r <= e.l - 2 || p!.boite.l >= e.r + 2 || p!.boite.b <= e.t - 2 || p!.boite.t >= e.b + 2).toBe(true);
  });

  it('un nom d’un autre mouvement n’est pas remplacé : placerNoms garde la main sur les mouvements', () => {
    const avec = courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 4, mouvements: [{ id: 'z', jour: jour(1), centimes: -90000, nom: 'Hotte' }] })!;
    const g = geometrie(avec.semaines.flatMap(s => [s.libre, s.caisse]), 4, 366, 88, 18, 86);
    expect(placerNoms(avec.semaines, g, 8, [])).toHaveLength(1);
  });
});
