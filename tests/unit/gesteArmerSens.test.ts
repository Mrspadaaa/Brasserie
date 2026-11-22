// T9-1 (tour 9, 22.11) : le sens du doigt tenu au bord ne bascule pas sur un tremblement de ±1 px (hystérésis de 6 px).
import { describe, expect, it } from 'vitest';
import { armerSens, vitesseBord } from '../../src/ui/geste';

const jouer = (xs: number[]) => xs.reduce((e, x) => armerSens(e.arme, e.pivot, x), { arme: 0 as -1 | 0 | 1, pivot: xs[0] });

describe('armerSens', () => {
  it('un tremblement de ±1 px au bord droit garde le sens et le défilement', () => {
    const e = jouer([200, 260, 320, 384, 383, 384, 385, 384, 383, 384, 385]);
    expect(e.arme).toBe(1);
    expect(vitesseBord(384, 390, e.arme).sens).toBe(1);
  });
  it('un retour de 7 px retourne le sens ; de 5 px, non', () => {
    expect(jouer([100, 200, 195]).arme).toBe(1);
    expect(jouer([100, 200, 193]).arme).toBe(-1);
    expect(jouer([300, 100, 107]).arme).toBe(1);
  });
  it('le premier pas de plus de 0,5 px arme', () => {
    expect(jouer([100, 100.4]).arme).toBe(0);
    expect(jouer([100, 99]).arme).toBe(-1);
  });
});
