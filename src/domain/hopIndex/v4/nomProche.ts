/**
 * Rapprochement d'un nom de houblon saisi (« Nuget », « Hallertauer Mittelfruh ») d'une variété du catalogue (test en ligne n° 9).
 *
 * Problème d'école : correspondance approximative de chaînes (faute de frappe, accent manquant, forme adjective allemande). Méthode standard :
 * recherche floue de Fuse.js (bitap, déjà une dépendance de l'app : `services/search.ts`), sur les noms et alias pliés. Rien n'est réécrit à la main.
 * Garde-fous, parce qu'un rapprochement n'est pas une identité : une seule variété doit sortir, la première lettre est la même, le nom saisi et le nom
 * trouvé ont une longueur voisine (jamais un nom partiel) et au moins cinq lettres (« Saaz » ne devient pas « Saaz (US) » par proximité).
 * Le résultat est toujours dit à l'écran comme « lu comme X » : jamais une donnée du brasseur remplacée en silence.
 */
import Fuse from 'fuse.js';

const plier = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

export interface VarieteNommee { id: string; name: string; aliases?: readonly string[] }
interface Entree { cle: string; id: string; nom: string }

const index = new WeakMap<readonly VarieteNommee[], Fuse<Entree>>();
function fuseDe(catalogue: readonly VarieteNommee[]): Fuse<Entree> {
  let f = index.get(catalogue);
  if (f) return f;
  const entrees: Entree[] = catalogue.flatMap((v) => [v.name, ...(v.aliases ?? [])].map((n) => ({ cle: plier(n), id: v.id, nom: n })).filter((e) => e.cle));
  f = new Fuse(entrees, { keys: ['cle'], includeScore: true, ignoreLocation: true, threshold: 0.25, isCaseSensitive: true });
  index.set(catalogue, f);
  return f;
}

/** La variété que ce nom approche de très près ; null s'il n'y en a aucune, ou plusieurs. */
export function varieteProche(saisi: string, catalogue: readonly VarieteNommee[]): { id: string; nom: string } | null {
  const cle = plier(saisi);
  if (cle.length < 5) return null;
  const tolerance = Math.max(2, Math.round(cle.length * 0.1));
  const proches = fuseDe(catalogue).search(cle)
    .filter((r) => r.item.cle[0] === cle[0] && Math.abs(r.item.cle.length - cle.length) <= tolerance && r.item.cle !== cle)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
  if (!proches.length) return null;
  const meilleur = proches[0];
  const concurrent = proches.find((r) => r.item.id !== meilleur.item.id && (r.score ?? 1) - (meilleur.score ?? 1) < 0.08);
  return concurrent ? null : { id: meilleur.item.id, nom: meilleur.item.nom };
}
