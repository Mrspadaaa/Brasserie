// Écriture des nombres à la suisse romande (virgule décimale), et des écarts simulés.
// Un formateur par nombre de d\u00e9cimales, mis en cache (t2, optimisation 3) ; m\u00eame texte que toLocaleString (ECMA-402).
const FORMATS = new Map<number, Intl.NumberFormat>();
const format = (decimales: number) => {
  let f = FORMATS.get(decimales);
  if (!f) { f = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: decimales, minimumFractionDigits: 0 }); FORMATS.set(decimales, f); }
  return f;
};
export const nombre = (x: number, decimales = 0) => format(decimales).format(x).split('\u2019').join('\u202f');
/** « +23 », « −4 » (vrai signe moins). */
export const signe = (x: number, decimales = 0) => {
  const r = Number(x.toFixed(decimales));
  return (r >= 0 ? '+' : '\u2212') + nombre(Math.abs(r), decimales);
};
/** α : « 12,7 » ; plage : « 9,5–14,9 ». */
export const plage = (min: number, max: number, decimales = 1) => (min === max ? nombre(min, decimales) : `${nombre(min, decimales)}\u2013${nombre(max, decimales)}`);
