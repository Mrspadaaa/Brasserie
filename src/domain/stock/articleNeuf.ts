import type { StockItem } from '../../types';
import { contexteDe, donneesDeLigne, regleProduit, type LigneProduit, type MembreVirtuel, type RegleProduit } from '../../services/stockLineMatching';
import { hasHopWord, hasYeastWord, isReadableUnit, readProductLabel } from '../../services/ingredientIdentity';
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

/**
 * Le nom français propre d'une désignation traduite (`nameFr`) : le même nettoyage que la rangée (`nomAffiche`, `ui/depense/etat.ts` : nom lu sans options, deux-points final ôté).
 * Recopié ici pour ne pas importer l'écran dans le domaine ; `tests/unit/depense/nom-b/nom.test.ts` vérifie l'égalité des deux.
 */
export const nomFrPropre = (nameFr: string): string => (readProductLabel(nameFr, { hop: hasHopWord(nameFr), yeast: hasYeastWord(nameFr), side: 'line' }).name || nameFr).replace(/\s*:\s*$/u, '');

/** Le nom imprimé lu d'une ligne (base sans options, gardée à la lecture) ; rien pour une saisie à la main ou un brouillon d'avant B : « Sur la facture » ne ment jamais. */
export const nomImprimeDe = (line: { nomLu?: string }): string | undefined => line.nomLu?.trim().slice(0, 80) || undefined;

export function articleNeufDe(ligne: LigneProduit, stock: readonly StockItem[], catalogues: Catalogues, nomTape?: string, brouillon: readonly MembreVirtuel[] = []): ArticleNeuf {
  const regle = regleProduit(ligne, stock, brouillon);
  const contexte = contexteDe(ligne);
  const derive = contexte === 'Houblon' || contexte === 'Malt';
  const lu = donneesDeLigne(ligne).donnees;
  const tape = nomTape?.trim();
  // Choix B : l'article neuf se nomme en français quand la ligne a son `nomFr`, pour toute catégorie (dérivée ou non) ; sans lui, le nom imprimé comme avant.
  const nomFr = ligne.nomFr?.trim() || undefined;
  const libelle = nomFr ?? ligne.description.trim();
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
    const famille = contexte === 'autre' ? 'Malt' : contexte;
    // Le nom imprimé d'abord ; le nom français seulement s'il ne trouve rien (jamais l'inverse : un article qui a sa fiche ne change pas).
    const fiche = ficheLaPlusProche(nom, famille, lu.origine, lu.alpha, lu.ebc, catalogues)
      ?? (nomFr ? ficheLaPlusProche(nomPropre(nomFr, famille, { unit, quantity: ligne.quantity }), famille, lu.origine, lu.alpha, lu.ebc, catalogues) : undefined);
    if (fiche) { out.fiche = { id: fiche.id, approchee: fiche.approchee }; out.nomFiche = fiche.nom; }
  }
  return out;
}

/** La ligne du brouillon vue par la règle : mêmes champs que l'appariement de la feuille (catégorie lue, code article, nature). */
export const ligneDeBrouillon = (line: { description: string; unit: string; quantity?: number; kind?: string; stockCategory?: string; sourceReference?: string; nameFr?: string; nomLu?: string }, vendor?: string): LigneProduit => {
  const nomFr = line.nameFr?.trim() ? nomFrPropre(line.nameFr) : '';
  const nomLu = nomImprimeDe(line);
  return { description: line.description, unit: line.unit, quantity: line.quantity, stockCategory: line.stockCategory, reference: line.sourceReference, kind: line.kind, ...(vendor?.trim() ? { vendor: vendor.trim() } : {}),
    ...(nomFr ? { nomFr } : {}), ...(nomLu ? { nomLu } : {}) };
};
