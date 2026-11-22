import { StorageService } from './storage';

/**
 * RL-12 (rejeu 649bcc54) : « Créer « X » (stock à zéro) » dans l'assistant de recette crée AUSSITÔT un article de stock réel (la ligne de la recette
 * en a besoin pour son lien). Un brouillon abandonné ne doit rien laisser : l'assistant note ici les articles qu'IL a créés, par brouillon (sur l'appareil,
 * pour survivre à un rechargement), et « Abandonner » les retire s'ils ne sont liés à rien.
 *
 * Choix : plutôt que de différer la création à l'enregistrement (la ligne garderait un article « à créer » dans le brouillon). Ce report touche le format du
 * brouillon, l'attribution des références (MP-n) et chaque lecteur du stock de l'assistant ; la suppression à l'abandon laisse ces chemins intacts et réutilise la règle
 * d'AM-55 de `deleteStockItem` : un article cité par une recette ou réservé par un brassin n'est jamais supprimé.
 */
const cle = (draftKey: string) => `laffinee_recipe_draft_articles_v1:${draftKey}`;

function lire(draftKey: string): string[] {
  try {
    const brut = localStorage.getItem(cle(draftKey));
    const liste = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste.filter((r): r is string => typeof r === 'string') : [];
  } catch { return []; }
}

/** Note un article créé par ce brouillon. */
export function noterArticleCree(draftKey: string | undefined, ref: string): void {
  if (!draftKey) return;
  const liste = lire(draftKey);
  if (liste.includes(ref)) return;
  try { localStorage.setItem(cle(draftKey), JSON.stringify([...liste, ref])); } catch { /* Sans stockage local, l'abandon ne retire rien : l'article reste, comme avant. */ }
}

/** La recette est enregistrée : ses articles lui appartiennent désormais, l'abandon d'un brouillon ultérieur n'y touche plus. */
export function oublierArticlesCrees(draftKey: string | undefined): void {
  if (!draftKey) return;
  try { localStorage.removeItem(cle(draftKey)); } catch { /* rien à oublier */ }
}

/**
 * « Abandonner » : retire les articles créés par ce brouillon. Un article déjà touché (stock reçu, plus de zéro), cité par une recette ou réservé
 * par un brassin reste en place. Rend les références retirées et celles gardées.
 */
export function retirerArticlesDuBrouillon(draftKey: string | undefined): { retires: string[]; gardes: string[] } {
  const resultat = { retires: [] as string[], gardes: [] as string[] };
  if (!draftKey) return resultat;
  for (const ref of lire(draftKey)) {
    const article = StorageService.getStocks().rawMaterials.find((s) => s.ref === ref);
    if (!article) continue;
    if ((article.currentStock ?? 0) !== 0) { resultat.gardes.push(ref); continue; }
    const r = StorageService.deleteStockItem('rawMaterials', ref);
    (r.ok ? resultat.retires : resultat.gardes).push(ref);
  }
  oublierArticlesCrees(draftKey);
  return resultat;
}
