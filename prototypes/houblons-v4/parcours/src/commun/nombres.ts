// Écriture des nombres à la suisse romande (virgule décimale), et des écarts simulés.
export const nombre = (x: number, decimales = 0) =>
  x.toLocaleString('fr-CH', { maximumFractionDigits: decimales, minimumFractionDigits: 0 }).split('\u2019').join('\u202f');
/** « +23 », « −4 » (vrai signe moins). */
export const signe = (x: number, decimales = 0) => {
  const r = Number(x.toFixed(decimales));
  return (r >= 0 ? '+' : '\u2212') + nombre(Math.abs(r), decimales);
};
/** α : « 12,7 » ; plage : « 9,5–14,9 ». */
export const plage = (min: number, max: number, decimales = 1) => (min === max ? nombre(min, decimales) : `${nombre(min, decimales)}\u2013${nombre(max, decimales)}`);
