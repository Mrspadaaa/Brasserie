// Nombres en français de Suisse (#164, t2 « Optimisations » n° 3) : un Intl.NumberFormat par jeu d'options, mis en
// cache, au lieu d'un toLocaleString par appel. Même texte : Number.prototype.toLocaleString(l, o) est défini comme
// new Intl.NumberFormat(l, o).format(x) (ECMA-402). Les jeux d'options sont en nombre fini (écrits dans le code).
const FORMATS = new Map<string, Intl.NumberFormat>();
export function formatFr(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const k = options ? JSON.stringify(options) : '';
  let f = FORMATS.get(k);
  if (!f) { f = new Intl.NumberFormat('fr-CH', options); FORMATS.set(k, f); }
  return f;
}
/** x.toLocaleString('fr-CH', options), formateur en cache. */
export const nombreFr = (x: number, options?: Intl.NumberFormatOptions): string => formatFr(options).format(x);
