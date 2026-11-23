// Voie e1-banc-eval (#181) : les métriques du banc d'évaluation (scripts/eval-hop/metriques.ts) sur un mini jeu à réponse connue.
// Ce test n'appelle pas le banc (qui prend ~1 min) : il vérifie seulement ses formules.
import { describe, expect, it } from 'vitest';
import { echantillon, mediane, melanger, mulberry32, premierRang, rangMoyenGroupe, rangReciproque, rappelA, resume } from '../../../scripts/eval-hop/metriques';

describe('métriques du banc d’évaluation', () => {
  // Trois houblons : A a ses 2 substituts aux rangs 1 et 8 ; B a un seul substitut au rang 4 ; C n'a rien de classé.
  const A = { rangs: [1, 8] }, B = { rangs: [4] }, C = { rangs: [null, null] as (number | null)[] };

  it('le rappel est la part des substituts dans les k premiers', () => {
    expect(rappelA(A, 5)).toBe(0.5);
    expect(rappelA(A, 10)).toBe(1);
    expect(rappelA(B, 3)).toBe(0);
    expect(rappelA(C, 10)).toBe(0);
  });
  it('le premier rang et le rang réciproque ignorent les absents', () => {
    expect(premierRang(A)).toBe(1);
    expect(premierRang(C)).toBeNull();
    expect(rangReciproque(B)).toBe(0.25);
    expect(rangReciproque(C)).toBe(0);
  });
  it('le résumé donne rappels, médiane, MRR et houblons sans rang', () => {
    const r = resume([A, B, C]);
    expect(r.n).toBe(3);
    expect(r.rappel5).toBe(0.5);          // (0,5 + 1 + 0) / 3 : B est au rang 4, dans les 5
    expect(r.rappel10).toBe(0.667);       // (1 + 1 + 0) / 3
    expect(r.touche10).toBe(0.667);
    expect(r.rangMedian).toBe(2.5);       // médiane de [1, 4]
    expect(r.mrr).toBe(0.417);            // (1 + 0,25 + 0) / 3
    expect(r.sansRang).toBe(1);
  });
  it('un rang moyen de groupe à égalité reste fractionnaire et compte pour un rang ≤ k', () => {
    expect(rangMoyenGroupe(1, 4)).toBe(2.5);
    expect(rappelA({ rangs: [rangMoyenGroupe(9, 4)] }, 10)).toBe(0);   // 10,5 > 10
    expect(rappelA({ rangs: [rangMoyenGroupe(8, 4)] }, 10)).toBe(1);   // 9,5 ≤ 10
  });
  it('la médiane d’une liste vide est nulle', () => {
    expect(mediane([])).toBeNull();
    expect(mediane([3, 1, 2])).toBe(2);
  });
  it('le mélange et l’échantillon sont déterministes et dépendent de la graine', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `h${String(i).padStart(2, '0')}`);
    expect(echantillon(ids, 181, 10)).toEqual(echantillon([...ids].reverse(), 181, 10));  // l'ordre d'entrée ne compte pas
    expect(echantillon(ids, 181, 10)).not.toEqual(echantillon(ids, 182, 10));
    expect([...melanger(ids, 181)].sort()).toEqual(ids);
    const a = mulberry32(7), b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
