/**
 * p5 (jeu en ligne 9, bloquant 2) : « Idaho 7 » face à PLUSIEURS « Idaho 7 » au stock. Chaque article candidat se reconnaît à ce qui le sépare des autres : l'α, la récolte, l'origine (données de l'article, sinon lues sur
 * son nom), puis ce qu'il en reste au stock. Une donnée que tous partagent ne distingue rien et ne s'écrit pas ; une donnée absente n'est jamais écrite (l'inconnu n'est pas 0).
 */
import type { StockItem } from '../../types';
import { donneesDArticle } from '../../services/stockLineMatching';
import { motUnite, nombreFr } from './calculPlateau';

export interface CandidatDistingue {
  article: StockItem;
  /** « α 13 », « récolte 2025 », « origine CH » : seulement ce qui varie d'un candidat à l'autre et que le nom ne dit pas déjà. */
  parties: string[];
  /** « 40 g » : ce qu'il en reste au stock. */
  stock: string;
}

const virgule = (n: number) => String(n).replace('.', ',');

export function distinguerCandidats(items: readonly StockItem[]): CandidatDistingue[] {
  const facettes = items.map(article => {
    const d = donneesDArticle(article).donnees;
    return {
      alpha: d.alpha !== undefined ? `α ${virgule(d.alpha)}` : undefined,
      recolte: d.recolte !== undefined ? `récolte ${d.recolte}` : undefined,
      origine: d.origine ? `origine ${d.origine}` : undefined,
    };
  });
  const cles = ['alpha', 'recolte', 'origine'] as const;
  const varie = (cle: typeof cles[number]) => new Set(facettes.map(f => f[cle] ?? '')).size > 1;
  const dansLeNom = (article: StockItem, valeur: string) => { const nombre = valeur.replace(/^\S+\s/, ''); return new RegExp(`(?:^|[^\\d,.])${nombre.replace(/[.,]/g, '[.,]')}(?![\\d])`).test(article.name); };
  return items.map((article, i) => {
    const parties = cles.filter(varie).map(c => facettes[i][c]).filter((v): v is string => Boolean(v) && !dansLeNom(article, v!));
    return { article, parties, stock: `${nombreFr(article.currentStock)} ${motUnite(article.unit, article.currentStock)}` };
  });
}

/** Les noms des candidats se distinguent-ils déjà ? (« Idaho 7 2025 », « Idaho 7 2026 ») : sinon le titre de chaque sortie a besoin de ses parties ou, à défaut, de son stock. */
export function titreDeSortie(c: CandidatDistingue, tous: readonly CandidatDistingue[]): string {
  const memeNom = tous.filter(t => t.article.name === c.article.name).length > 1;
  const plus = c.parties.length ? c.parties : memeNom ? [c.stock] : [];
  return [`Relier à ${c.article.name}`, ...plus].join(' · ');
}
