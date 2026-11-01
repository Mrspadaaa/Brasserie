import type { StockItem } from '../../types';
import { contexteDe, donneesDeLigne, regleProduit, type LigneProduit, type MembreVirtuel, type RegleProduit } from '../../services/stockLineMatching';
import { isReadableUnit } from '../../services/ingredientIdentity';
import { linkUnit } from '../../services/stockLineMatching';
import { nomPropre } from './donnees';
import { ficheLaPlusProche, type Catalogues } from './fiche';

/**
 * L'article neuf d'une ligne dont le stock n'a pas le produit (voie s6-fiche, T3) : DÉRIVÉ, jamais gardé. L'écran l'appelle pour afficher (bouton « Créer »,
 * menu « Créer un nouvel article », champ nom, pastille) et l'enregistrement l'appelle sur la ligne et le stock courants : ce qui est montré est ce qui est écrit.
 * Seul le nom tapé par le brasseur est gardé (par ligne) ; il prime toujours. Les valeurs lues (α, EBC, origine) sont celles du libellé COURANT.
 */
export interface ArticleNeuf {
  regle: RegleProduit;
  /** Le nom de l'article : le nom tapé s'il y en a un, sinon le nom proposé (houblon ou malt) ou le libellé (le reste, comme avant). */
  name: string;
  /** Le nom proposé, sans le nom tapé : la tête de ligne le garde tant que le nom tapé est refusé (tri n° 13). */
  nomPropose: string;
  alphaPct?: number;
  colorEbc?: number;
  origin?: string;
  fiche?: { id: string; approchee: boolean };
  /** Le nom affiché de la fiche (« Cascade US »), seulement avec le catalogue ; non écrit. */
  nomFiche?: string;
  voisin?: StockItem;
  /** Houblon ou malt : le nom et les valeurs sont dérivés du libellé. Sinon, seul le nom tapé change HEAD. */
  derive: boolean;
}

export function articleNeufDe(ligne: LigneProduit, stock: readonly StockItem[], catalogues: Catalogues, nomTape?: string, brouillon: readonly MembreVirtuel[] = []): ArticleNeuf {
  const regle = regleProduit(ligne, stock, brouillon);
  const contexte = contexteDe(ligne);
  const derive = contexte === 'Houblon' || contexte === 'Malt';
  const lu = donneesDeLigne(ligne).donnees;
  const tape = nomTape?.trim();
  const libelle = ligne.description.trim();
  const name = tape || (derive ? (regle.cas === 'meme' ? regle.article.name : regle.nom) : libelle);
  const voisin = regle.cas === 'neuf' || regle.cas === 'incertain' ? regle.voisin : undefined;
  const nomPropose = derive ? (regle.cas === 'meme' ? regle.article.name : regle.nom) : libelle;
  const out: ArticleNeuf = { regle, name, nomPropose, derive, ...(voisin ? { voisin } : {}) };
  if (derive) {
    if (contexte === 'Houblon' && lu.alpha !== undefined) out.alphaPct = lu.alpha;
    if (contexte === 'Malt' && lu.ebc !== undefined) out.colorEbc = lu.ebc;
    if (lu.origine !== undefined) out.origin = lu.origine;
  }
  // La fiche : jamais pour un article qui existe déjà (`meme`), jamais pour une levure ; les ingrédients hors houblon et malt cherchent dans la table des fermentescibles.
  const cherche = regle.cas !== 'meme' && contexte !== 'Levure' && (derive || ligne.kind === undefined || ligne.kind === 'ingredient');
  if (cherche) {
    const unit = isReadableUnit(ligne.unit) ? linkUnit(ligne.unit) : undefined;
    const nom = nomPropre(ligne.description, contexte === 'autre' ? 'Malt' : contexte, { unit, quantity: ligne.quantity });
    const fiche = ficheLaPlusProche(nom, contexte === 'autre' ? 'Malt' : contexte, lu.origine, lu.alpha, lu.ebc, catalogues);
    if (fiche) { out.fiche = { id: fiche.id, approchee: fiche.approchee }; out.nomFiche = fiche.nom; }
  }
  return out;
}

/** La ligne du brouillon vue par la règle : mêmes champs que l'appariement de la feuille (catégorie lue, code article, nature). */
export const ligneDeBrouillon = (line: { description: string; unit: string; quantity?: number; kind?: string; stockCategory?: string; sourceReference?: string }, vendor?: string): LigneProduit =>
  ({ description: line.description, unit: line.unit, quantity: line.quantity, stockCategory: line.stockCategory, reference: line.sourceReference, kind: line.kind, ...(vendor?.trim() ? { vendor: vendor.trim() } : {}) });
