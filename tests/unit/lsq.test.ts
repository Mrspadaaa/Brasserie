import { describe, it, expect } from 'vitest';
import { constrainedLeastSquares as solve } from '../../src/domain/water/lsq';

describe('Constrained least squares — independent analytic optima', () => {
  it('finds a joint boundary, rather than rejecting the unconstrained fit', () => {
    // Projection of (3,4) on x+y<=2 is (0.5,1.5), not (0,0) or (0,2).
    const r = solve([[1,0],[0,1]], [3,4], [[1,1]], [2]);
    expect(r.converged).toBe(true);
    expect(r.x[0]).toBeCloseTo(0.5, 6);
    expect(r.x[1]).toBeCloseTo(1.5, 6);
    expect(r.squaredError).toBeCloseTo(12.5, 6);
  });
  it('handles a zero room, redundant ceilings, dependent columns and negative deficits', () => {
    for (const C of [[[1,1]], [[1,1],[2,2]]]) {
      const r = solve([[1,1],[2,2]], [3,6], C, C.map(() => 0));
      expect(r.converged).toBe(true);
      expect(r.x).toEqual([0,0]);
    }
    const r = solve([[1,1],[2,2]], [3,6]);
    expect(r.converged).toBe(true);
    expect(r.x[0]+r.x[1]).toBeCloseTo(3,6);
    expect(solve([[1,0],[0,1]], [-1,4]).x[0]).toBeCloseTo(0);
  });
  it('agrees with exhaustive grid solutions for 40 different two-variable problems', () => {
    for(let seed=1;seed<=40;seed++) {
      const A=[[1,seed%7/3],[(seed%5)/2,1]], b=[seed%9-2,seed%11-1];
      const r=solve(A,b,[[1,1],[2,1]],[4,6]);
      expect(r.converged, String(seed)).toBe(true);
      expect(r.x.every(v=>v>=0)).toBe(true);
      expect(r.x[0]+r.x[1]).toBeLessThanOrEqual(4+1e-7);
      expect(2*r.x[0]+r.x[1]).toBeLessThanOrEqual(6+1e-7);
      let grid=Infinity;
      for(let i=0;i<=80;i++) for(let j=0;j<=80;j++) {
        const x=i/20,y=j/20;
        if(x+y>4 || 2*x+y>6) continue;
        grid=Math.min(grid,A.reduce((s,row,k)=>s+(row[0]*x+row[1]*y-b[k])**2,0));
      }
      expect(r.squaredError).toBeLessThanOrEqual(grid+1e-6);
    }
  });
  it('validates malformed problems and supports the empty support', () => {
    expect(()=>solve([[1]],[NaN])).toThrow();
    expect(()=>solve([[1]],[1],[[1]],[-1])).toThrow();
    expect(solve([[],[]],[3,4]).squaredError).toBe(25);
  });
});
