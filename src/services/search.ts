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

export interface SearchableCommand {
  label: string;
  detail?: string;
  keywords?: string[];
  /** Présentation uniquement : aucun effet sur le registre comptable. */
  archived?: boolean;
}

/** Recherche tout l'index avant de borner le rendu de chaque rubrique. */
export function searchCommandGroups<T extends SearchableCommand>(
  groups: { heading: string; items: T[] }[],
  query: string,
  includeArchives = false,
  limitPerGroup = 12
): { groups: { heading: string; items: T[] }[]; total: number; visible: number } {
  const needle = normalize(query.trim());
  const terms = needle.split(/\s+/).filter(Boolean);
  const limit = Number.isFinite(limitPerGroup) ? Math.max(1, Math.floor(limitPerGroup)) : 12;
  let total = 0;
  let visible = 0;
  const matchedGroups = groups.flatMap(group => {
    const matches = group.items.flatMap(item => {
      if (item.archived && !includeArchives) return [];
      const label = normalize(item.label);
      const haystack = normalize([item.label, item.detail, ...(item.keywords ?? [])].join(' '));
      if (!terms.every(term => haystack.includes(term))) return [];
      const score = !needle || label.startsWith(needle) ? 2 : label.includes(needle) ? 1 : 0;
      return [{ item, score }];
    });
    total += matches.length;
    if (!matches.length) return [];
    const items = matches.sort((a, b) => b.score - a.score).slice(0, limit).map(match => match.item);
    visible += items.length;
    return [{ heading: group.heading, items }];
  });
  return { groups: matchedGroups, total, visible };
}
