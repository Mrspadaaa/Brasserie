import { describe, expect, it } from 'vitest';
import { courbeCaisse, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { ajouterJours } from '../../src/domain/calendrier';
import { geometrie, obstaclesZero, placerNoms } from '../../src/ui/calendrier/entete/Courbe';

/**
 * K51-1 (tour 51, en ligne) : deux achats à payer le même jour (−79,95 et −80,00) font UNE marche de −159,95 sur la courbe de l'en-tête ;
 * l'étiquette ne nommait que « ZZ TEST — achat rond −80 » : un nom et un montant qui ne disent pas la marche. Attendu : l'étiquette dit la
 * somme de la marche et qu'il y a un autre mouvement (« + 1 autre »), jamais un seul des deux avec son montant.
 */
const LUNDI0 = '2026-11-16';
const jour = (semaine: number, plus = 2) => ajouterJours(LUNDI0, semaine * 7 + plus);
const g = (c: NonNullable<ReturnType<typeof courbeCaisse>>) => geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 6, 366, 88, 4, 70);
const courbe = (mouvements: MouvementCaisse[]) => courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 6, mouvements })!;

describe('K51-1 : deux mouvements du même jour, une marche, une étiquette qui en dit la somme', () => {
  const deux: MouvementCaisse[] = [
    { id: 'a', jour: jour(2), centimes: -7995, nom: 'ZZ TEST — achat' },
    { id: 'b', jour: jour(2), centimes: -8000, nom: 'ZZ TEST — achat rond' }
  ];

  it('la marche vaut −159,95 et l’étiquette la dit, avec le plus gros nom et « + 1 autre »', () => {
    const c = courbe(deux);
    expect(c.semaines[2].libre - c.semaines[1].libre).toBe(-15995);
    const e = placerNoms(c.semaines, g(c), 8, obstaclesZero(g(c), 366));
    const etiquettes = e.filter(x => x.i === 2);
    expect(etiquettes).toHaveLength(1);
    expect(etiquettes[0].montant).toBe('−159,95');
    expect(etiquettes[0].complet).toBe('ZZ TEST — achat rond + 1 autre');
  });

  it('trois mouvements du même jour : « + 2 autres » et la somme des trois', () => {
    const c = courbe([...deux, { id: 'c', jour: jour(2), centimes: -1000, nom: 'Port' }]);
    const e = placerNoms(c.semaines, g(c), 8, obstaclesZero(g(c), 366)).filter(x => x.i === 2);
    expect(e).toHaveLength(1);
    expect(e[0].montant).toBe('−169,95');
    expect(e[0].complet).toBe('ZZ TEST — achat rond + 2 autres');
  });

  it('deux jours différents : pas de fusion (chaque nom garde son montant)', () => {
    const c = courbe([deux[0], { ...deux[1], jour: jour(2, 4) }]);
    const e = placerNoms(c.semaines, g(c), 8, obstaclesZero(g(c), 366));
    expect(e.some(x => /autre/.test(x.complet))).toBe(false);
  });

  it('un nom qui revient dans une autre semaine (récurrent) n’est pas fondu dans une marche', () => {
    const c = courbe([...deux, { id: 'd', jour: jour(4), centimes: -7995, nom: 'ZZ TEST — achat' }]);
    const e = placerNoms(c.semaines, g(c), 8, obstaclesZero(g(c), 366));
    expect(e.some(x => /autre/.test(x.complet))).toBe(false);
  });

  it('une entrée et une sortie du même jour ne se fondent pas (signes opposés)', () => {
    const c = courbe([{ id: 'p', jour: jour(2), centimes: 5000, nom: 'Vente' }, { id: 'q', jour: jour(2), centimes: -8000, nom: 'Achat' }]);
    const e = placerNoms(c.semaines, g(c), 8, obstaclesZero(g(c), 366));
    expect(e.some(x => /autre/.test(x.complet))).toBe(false);
  });
});
