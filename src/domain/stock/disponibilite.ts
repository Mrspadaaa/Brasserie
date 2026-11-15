import type { Batch, Recipe, StockItem } from '../../types';
import { Units } from '../../services/units';
import { ingredientsOf, normalizeRecipe } from '../recipeSnapshot';

/**
 * UNE seule disponibilité du stock (voie k2, R1, mission 2026-11-11-stock).
 *
 * Problème d'école : « disponible à promettre » d'un MRP simple. Besoins bruts (ce que les ordres de fabrication prévus vont
 * consommer) moins le stock en main = besoin net, le manque. Un manque ne se compte qu'une fois : tous les lecteurs (À commander,
 * badge, Bord, fiche, comparaison d'une recette) appellent cette fonction et nulle autre (voir « ## État de l'art » de RESULTAT.md).
 *
 * Mots de l'écran : « en stock », « besoin », « manque ». « Réservé » et « libre » restent internes (conseil du 11.11).
 *
 * Le besoin d'un article est la somme de ses SOURCES, chacune nommée :
 *  - un brassin planifié pas encore déstocké (`appliedAt` absent) : sa recette figée ;
 *  - les ajouts restants d'un brassin déjà brassé (dry hop, sucre de fermentation) : encore en rayon, pas encore consommés ;
 *  - une recette écrite, jamais brassée (aucun brassin ne la cite), non archivée.
 * Une source sort du besoin quand son brassin est déstocké, annulé ou terminé, ou quand sa recette est archivée.
 * Il n'y a PAS de « recette en cours » ici : c'est un tri d'affichage, pas un besoin.
 *
 * Honnêteté : une quantité ou une unité qui manque, une conversion impossible, un stock illisible : le besoin ou le manque est
 * « inconnu » (`null`), jamais 0. La somme des lignes lisibles reste donnée (`besoinConnu`, `manqueAuMoins`) pour dire « au moins ».
 */

export type GenreSource = 'brassin' | 'ajouts-restants' | 'recette';

export interface SourceBesoin {
  genre: GenreSource;
  /** Identifiant du brassin ou de la recette. */
  id: string;
  /** Nom à afficher à côté du chiffre (« IPA écrite le 09.11 »). */
  nom: string;
  /** Date telle qu'elle est connue (brassin : prévue ; recette : lue dans son identifiant) ; `null` si inconnue. Jamais inventée. */
  date: string | null;
  /** Dans l'unité de l'article ; `null` si la ligne est illisible. */
  quantite: number | null;
  /** Pourquoi la quantité est inconnue. */
  raison?: string;
}

export interface Disponibilite {
  ref: string;
  unite: string;
  /** Stock en main ; `null` si illisible (jamais 0). */
  enStock: number | null;
  /** Somme des sources ; `null` si une source est inconnue. */
  besoin: number | null;
  /** Somme des seules sources lisibles. */
  besoinConnu: number;
  sources: SourceBesoin[];
  /** Besoin − stock s'il est positif, 0 sinon ; `null` si inconnu. */
  manque: number | null;
  /** Quand le manque est inconnu mais que le connu dépasse déjà le stock : le plancher (« au moins »). */
  manqueAuMoins: number | null;
  inconnu: boolean;
  raisons: string[];
}

export interface LigneSansArticle {
  source: SourceBesoin;
  nomIngredient: string;
  quantite: number | null;
  unite: string | null;
  raison: string;
}

export interface Disponibilites {
  parArticle: Map<string, Disponibilite>;
  /** Lignes citées par une source mais sans article dans le stock : hors de tout article, dites ici. */
  sansArticle: LigneSansArticle[];
}

export interface OptionsDisponibilite {
  /** La comparaison d'UNE recette exclut sa propre source (la recette, et ses brassins) : elle l'ajoute elle-même. */
  sauf?: { recetteId: string };
}

interface LigneBesoin {
  nom: string;
  stockItemRef?: string;
  quantite: number | null;
  unite: string | null;
}

const lisible = (q: unknown): q is number => typeof q === 'number' && Number.isFinite(q) && q >= 0;

/** Les lignes d'une recette (ou de la recette figée d'un brassin) : grains, houblons, ajouts, levure. */
function lignesDeRecette(
  fermentables: Array<{ name: string; stockItemRef?: string; weightKg?: number }>,
  hops: Array<{ name: string; stockItemRef?: string; weightG?: number }>,
  adjuncts: Array<{ name: string; stockItemRef?: string; amount?: number; unit?: string }> | undefined,
  yeast: { name?: string; stockItemRef?: string; qty?: number; unit?: string } | undefined
): LigneBesoin[] {
  const lignes: LigneBesoin[] = [
    ...fermentables.map(l => ({ nom: l.name, stockItemRef: l.stockItemRef, quantite: lisible(l.weightKg) ? l.weightKg : null, unite: 'kg' })),
    ...hops.map(l => ({ nom: l.name, stockItemRef: l.stockItemRef, quantite: lisible(l.weightG) ? l.weightG : null, unite: 'g' })),
    ...(adjuncts ?? []).map(l => ({ nom: l.name, stockItemRef: l.stockItemRef, quantite: lisible(l.amount) ? l.amount : null, unite: l.unit?.trim() || null }))
  ];
  if (yeast?.name?.trim() || yeast?.stockItemRef) {
    lignes.push({ nom: yeast.name ?? '', stockItemRef: yeast.stockItemRef, quantite: lisible(yeast.qty) ? yeast.qty : null, unite: yeast.unit?.trim() || null });
  }
  // Une ligne vide (ni nom, ni lien) n'est pas un besoin : c'est une rangée de saisie.
  return lignes.filter(l => l.nom?.trim() || l.stockItemRef);
}

function lignesDeBrassin(batch: Batch): LigneBesoin[] {
  const { fermentables, hops, yeast } = ingredientsOf(batch);
  return lignesDeRecette(fermentables, hops, batch.recipeSnapshot?.adjuncts ?? batch.adjuncts, yeast);
}

const jourMois = (date: string | null): string => {
  const m = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
  return m ? `${m[3]}.${m[2]}` : (date ?? '');
};

/** La source en mots du brasseur, à côté du chiffre : « IPA écrite le 09.11 », « Pale Ale prévu le 14.11 ». */
export function libelleSource(s: Pick<SourceBesoin, 'genre' | 'nom' | 'date'>): string {
  const jour = jourMois(s.date);
  if (s.genre === 'recette') return `${s.nom} écrite${jour ? ` le ${jour}` : ''}`;
  if (s.genre === 'ajouts-restants') return `${s.nom} : ajouts restants`;
  return `${s.nom} prévu${jour ? ` le ${jour}` : ''}`;
}

/** « REC-<horodatage en base 36> » (App.tsx) : la date de création s'y lit ; tout autre identifiant n'en donne aucune. */
export function dateDepuisIdRecette(id: string): string | null {
  const m = /^REC-([0-9A-Z]{7,9})$/.exec(id);
  if (!m) return null;
  const ms = parseInt(m[1].toLowerCase(), 36);
  // Entre 2020 et 2100 : sinon ce n'est pas un horodatage.
  if (!Number.isFinite(ms) || ms < 1577836800000 || ms > 4102444800000) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Une recette est « jamais brassée » si aucun brassin (quel que soit son statut) ne la cite. */
function recetteJamaisBrassee(recipe: Recipe, batches: Batch[]): boolean {
  if (recipe.archivedAt) return false;
  if (batches.some(b => b.recipeRef === recipe.id || b.recipeSnapshot?.sourceRecipeId === recipe.id)) return false;
  if (recipe.batchRef && batches.some(b => b.id === recipe.batchRef)) return false;
  return true;
}

function brassinCite(batch: Batch, recetteId: string): boolean {
  return batch.recipeRef === recetteId || batch.recipeSnapshot?.sourceRecipeId === recetteId;
}

interface Accumulateur {
  item: StockItem;
  sources: SourceBesoin[];
  connu: number;
  raisons: string[];
}

export function disponibilites(
  items: StockItem[],
  batches: Batch[],
  recipes: Recipe[],
  options: OptionsDisponibilite = {}
): Disponibilites {
  const parRef = new Map<string, Accumulateur>();
  for (const item of items) parRef.set(item.ref, { item, sources: [], connu: 0, raisons: [] });
  const sansArticle: LigneSansArticle[] = [];
  const parNom = new Map<string, StockItem[]>();
  for (const item of items) {
    const cle = item.name.trim().toLowerCase();
    if (!cle) continue;
    parNom.set(cle, [...(parNom.get(cle) ?? []), item]);
  }

  const poser = (source: Omit<SourceBesoin, 'quantite' | 'raison'>, ligne: LigneBesoin) => {
    let article: StockItem | undefined;
    let pourquoi = '';
    if (ligne.stockItemRef) {
      article = parRef.get(ligne.stockItemRef)?.item;
      if (!article) pourquoi = 'La référence liée est absente du stock.';
    } else {
      const trouves = parNom.get(ligne.nom.trim().toLowerCase()) ?? [];
      if (trouves.length === 1) article = trouves[0];
      else pourquoi = trouves.length > 1 ? 'Plusieurs articles ont ce nom : article à associer.' : 'Aucun article correspondant dans le stock.';
    }
    if (!article) {
      sansArticle.push({ source: { ...source, quantite: ligne.quantite, raison: pourquoi }, nomIngredient: ligne.nom, quantite: ligne.quantite, unite: ligne.unite, raison: pourquoi });
      return;
    }
    const acc = parRef.get(article.ref)!;
    let quantite: number | null = null;
    let raison: string | undefined;
    if (ligne.quantite === null) raison = `Quantité de « ${ligne.nom} » non renseignée ou invalide.`;
    else if (!ligne.unite) raison = `Unité de « ${ligne.nom} » non renseignée.`;
    else {
      const convertie = Units.convert(ligne.quantite, ligne.unite, article.unit);
      if (convertie === null || !Number.isFinite(convertie)) raison = `Unité incompatible : ${ligne.unite} vers ${article.unit}.`;
      else quantite = convertie;
    }
    if (quantite !== null) acc.connu += quantite;
    else acc.raisons.push(raison!);
    // Un même brassin ou une même recette peut citer l'article deux fois (Citra au whirlpool et à cru) : une source, une quantité.
    const deja = acc.sources.find(s => s.genre === source.genre && s.id === source.id);
    if (deja) {
      if (deja.quantite !== null && quantite !== null) deja.quantite += quantite;
      else { deja.quantite = null; deja.raison = deja.raison ?? raison; }
    } else acc.sources.push({ ...source, quantite, ...(raison ? { raison } : {}) });
  };

  const sauf = options.sauf?.recetteId;

  for (const batch of batches) {
    if (sauf && brassinCite(batch, sauf)) continue;
    const nom = batch.name || batch.id;
    if (batch.stockConsumption?.appliedAt) {
      // Brassin déstocké : il ne reste dû que les ajouts restants encore en rayon.
      if (batch.status === 'annule' || batch.status === 'termine') continue;
      for (const ligne of batch.stockConsumption.pendingItems ?? []) {
        poser(
          { genre: 'ajouts-restants', id: batch.id, nom, date: batch.brewDate || batch.plannedBrewDate || null },
          { nom: parRef.get(ligne.stockItemRef)?.item.name ?? ligne.stockItemRef, stockItemRef: ligne.stockItemRef, quantite: lisible(ligne.quantity) ? ligne.quantity : null, unite: ligne.unit?.trim() || null }
        );
      }
    } else if (batch.status === 'planifie') {
      for (const ligne of lignesDeBrassin(batch)) {
        poser({ genre: 'brassin', id: batch.id, nom, date: batch.plannedBrewDate || batch.brewDate || null }, ligne);
      }
    }
  }

  for (const recipe of recipes) {
    if (recipe.id === sauf) continue;
    if (!recetteJamaisBrassee(recipe, batches)) continue;
    const n = normalizeRecipe(recipe);
    for (const ligne of lignesDeRecette(n.fermentables ?? [], n.hops ?? [], n.adjuncts, n.yeast)) {
      poser({ genre: 'recette', id: recipe.id, nom: recipe.name || recipe.id, date: dateDepuisIdRecette(recipe.id) }, ligne);
    }
  }

  const parArticle = new Map<string, Disponibilite>();
  for (const [ref, acc] of parRef) {
    const { item } = acc;
    const enStock = lisible(item.currentStock) ? item.currentStock : null;
    const inconnuBesoin = acc.sources.some(s => s.quantite === null);
    const raisons = [...new Set(acc.raisons)];
    const besoinConnu = Units.round(acc.connu, item.unit);
    const besoin = inconnuBesoin ? null : besoinConnu;
    let manque: number | null = null;
    let manqueAuMoins: number | null = null;
    if (enStock === null) {
      if (!raisons.length && acc.sources.length > 0) raisons.push('Stock en main non renseigné ou invalide.');
    } else if (besoin !== null) {
      manque = Math.max(0, Units.round(besoin - enStock, item.unit));
    } else if (besoinConnu > enStock) {
      manqueAuMoins = Units.round(besoinConnu - enStock, item.unit);
    }
    // Aucune source : rien n'est dû, même si le stock est illisible.
    if (acc.sources.length === 0) { manque = 0; manqueAuMoins = null; }
    parArticle.set(ref, {
      ref, unite: item.unit, enStock, besoin, besoinConnu, sources: acc.sources, manque, manqueAuMoins,
      inconnu: manque === null, raisons
    });
  }
  return { parArticle, sansArticle };
}
