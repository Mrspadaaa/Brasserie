import Fuse, { IFuseOptions } from 'fuse.js';

/**
 * Recherche tolérante aux accents.
 *
 * ⚠️ Fuse.js ne normalise PAS les diacritiques. Sans ce module, taper
 * « caramunch » ne trouvait pas « Caramünch », et « rostgerste » ne trouvait pas
 * « Röstgerste » — or le catalogue de la brasserie est majoritairement en
 * allemand, avec des trémas partout. C'est exactement le cas où l'on renonce à
 * chercher.
 *
 * On normalise donc les deux côtés : les valeurs indexées via `getFn`, et la
 * requête avant de la soumettre.
 */

/** Minuscules sans diacritiques : « Caramünch » ➔ « caramunch ». */
export function normalize(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Lit une valeur imbriquée (« a.b.c ») et la normalise. */
function getNormalized(obj: any, path: string | string[]): string | string[] {
  const parts = Array.isArray(path) ? path : path.split('.');
  let current: any = obj;
  for (const p of parts) {
    if (current == null) return '';
    current = current[p];
  }
  if (Array.isArray(current)) return current.map((v) => normalize(String(v ?? '')));
  return normalize(String(current ?? ''));
}

const DEFAULTS = {
  // 0.4 tolère une faute de frappe ou un accent manquant sans tout ramener.
  threshold: 0.4,
  // Le terme cherché peut se trouver n'importe où dans le libellé.
  ignoreLocation: true,
  minMatchCharLength: 1
};

/** Construit un index insensible aux accents. */
export function createSearch<T>(items: T[], keys: string[], options: IFuseOptions<T> = {}) {
  return new Fuse(items, {
    ...DEFAULTS,
    ...options,
    keys,
    getFn: getNormalized as any
  });
}

/** Recherche : la requête est normalisée comme l'index. */
export function runSearch<T>(fuse: Fuse<T>, query: string): T[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return fuse.search(q).map((r) => r.item);
}
