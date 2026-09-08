/** Small convex least-squares problem with x >= 0 and Cx <= upper.
 * The origin must be feasible. Primal active-set iterations keep every bound
 * satisfied; unlike rejecting unconstrained fits, this finds boundary optima.
 * A tiny ridge selects a stable solution when columns are dependent.
 * No water, salt, volume or style concepts belong in this module.
 */
export interface LeastSquaresResult {
  x: number[];
  squaredError: number;
  converged: boolean;
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function linearSolve(matrix: number[][], rhs: number[]): number[] | null {
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  const n = rhs.length;
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
    if (Math.abs(a[pivot][k]) < 1e-12) return null;
    [a[k], a[pivot]] = [a[pivot], a[k]];
    for (let i = k + 1; i < n; i++) {
      const factor = a[i][k] / a[k][k];
      for (let j = k + 1; j <= n; j++) a[i][j] -= factor * a[k][j];
      a[i][k] = 0;
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = (a[i][n] - a[i].slice(i + 1, n).reduce((s, v, j) => s + v * x[i + 1 + j], 0)) / a[i][i];
  }
  return x.every(Number.isFinite) ? x : null;
}

export function constrainedLeastSquares(
  A: number[][], b: number[], C: number[][] = [], upper: number[] = [], initial?: number[]
): LeastSquaresResult {
  const n = A[0]?.length ?? 0;
  if (A.length !== b.length || C.length !== upper.length ||
      [...A, ...C].some(r => r.length !== n || !r.every(Number.isFinite)) ||
      !b.every(Number.isFinite) || upper.some(v => !Number.isFinite(v)) ||
      (initial ? initial.length !== n || initial.some(v => !Number.isFinite(v) || v < -1e-8)
        || C.some((row, i) => dot(row, initial) > upper[i] + 1e-6) : upper.some(v => v < 0))) {
    throw new Error('Invalid least-squares dimensions, values or infeasible origin');
  }
  if (!n) return { x: [], squaredError: dot(b, b), converged: true };
  // Column scaling keeps grams, milligrams and dependent columns well conditioned.
  const scale = Array.from({ length: n }, (_, j) => Math.max(1e-8,
    Math.sqrt(A.reduce((s, r) => s + r[j] ** 2, 0)),
    Math.sqrt(C.reduce((s, r) => s + r[j] ** 2, 0))));
  const a = A.map(r => r.map((v, j) => v / scale[j]));
  const constraints: number[][] = Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, k) => j === k ? -1 : 0));
  const bounds = Array(n).fill(0);
  C.forEach((row, i) => {
    const scaled = row.map((v, j) => v / scale[j]);
    const norm = Math.sqrt(dot(scaled, scaled));
    if (norm > 1e-12) { constraints.push(scaled.map(v => v / norm)); bounds.push(upper[i] / norm); }
  });
  const H = Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, k) =>
    a.reduce((s, r) => s + r[j] * r[k], 0) + (j === k ? 1e-9 : 0)));
  const f = Array.from({ length: n }, (_, j) => a.reduce((s, r, i) => s + r[j] * b[i], 0));
  let x = initial ? initial.map((value, i) => value * scale[i]) : Array(n).fill(0);
  const active = Array.from({ length: n }, (_, i) => i).filter(i => x[i] <= 1e-9);
  let converged = false;
  for (let iteration = 0; iteration < 200; iteration++) {
    const gradient = H.map((r, j) => dot(r, x) - f[j]);
    const kkt = H.map((r, j) => [...r, ...active.map(i => constraints[i][j])]);
    active.forEach(i => kkt.push([...constraints[i], ...Array(active.length).fill(0)]));
    const result = linearSolve(kkt, [...gradient.map(v => -v), ...Array(active.length).fill(0)]);
    if (!result) break;
    const p = result.slice(0, n);
    if (Math.max(...p.map(Math.abs)) < 1e-7) {
      const lambda = result.slice(n);
      let remove = -1;
      lambda.forEach((v, i) => { if (v < -1e-7 && (remove < 0 || v < lambda[remove])) remove = i; });
      if (remove < 0) { converged = true; break; }
      active.splice(remove, 1);
    } else {
      let alpha = 1;
      let blocker = -1;
      constraints.forEach((row, i) => {
        if (active.includes(i)) return;
        const speed = dot(row, p);
        if (speed <= 1e-9) return;
        const step = Math.max(0, (bounds[i] - dot(row, x)) / speed);
        if (step < alpha - 1e-10) { alpha = step; blocker = i; }
      });
      x = x.map((v, j) => Math.max(0, v + alpha * p[j]));
      if (blocker >= 0) active.push(blocker);
    }
  }
  x = x.map((v, j) => v / scale[j]);
  return { x, squaredError: A.reduce((s, r, i) => s + (dot(r, x) - b[i]) ** 2, 0), converged };
}

/** Phase I finds a feasible starting point when lower bounds exclude the origin.
 * A single slack reduction r starts at 0 and must reach the largest violation.
 * The second solve keeps every bound, instead of merely penalizing shortfalls.
 */
export function leastSquaresWithBounds(A: number[][], b: number[], C: number[][], upper: number[]): LeastSquaresResult {
  if (upper.every(value => value >= 0)) return constrainedLeastSquares(A, b, C, upper);
  const n = A[0]?.length ?? 0;
  const slack = Math.max(0, ...upper.map(value => -value));
  const phase = constrainedLeastSquares(
    [Array.from({ length: n + 1 }, (_, i) => i === n ? 100 : 0)], [slack * 100],
    [...C.map(row => [...row, 1]), Array.from({ length: n + 1 }, (_, i) => i === n ? 1 : 0)],
    [...upper.map(value => value + slack), slack],
  );
  const initial = phase.x.slice(0, n);
  if (!phase.converged || phase.x[n] < slack - 1e-6 || C.some((row, i) => dot(row, initial) > upper[i] + 1e-6))
    return { x: initial, squaredError: Infinity, converged: false };
  return constrainedLeastSquares(A, b, C, upper, initial);
}
