/** Part du sulfate dans SO₄ + Cl, en pour cent : 1:1 correspond à 50 %. */
export function ratioToShare(ratio: number): number {
  if (ratio === Infinity) return 100;
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return 100 * (ratio / (1 + ratio));
}

/** Rapport SO₄/Cl depuis sa part : 100 % signifie sans chlorure. */
export function shareToRatio(sharePct: number): number {
  const share = Number.isNaN(sharePct) ? 0 : Math.max(0, Math.min(100, sharePct));
  return share === 100 ? Infinity : share / (100 - share);
}
