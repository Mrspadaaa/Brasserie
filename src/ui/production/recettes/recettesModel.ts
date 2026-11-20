// r2a (choix du brasseur, 15.11) : le carnet de recettes dit d'abord si le stock suffit pour brasser, et ce qui manque.
// Aucun calcul neuf : `compareRecipeWithStock` (domain/stockLevel) compare la recette au stock et aux réservations, en lecture seule.
// L'inconnu n'est jamais 0 : un ingrédient sans article de stock, ou dont le stock est illisible, est « à vérifier », jamais « en stock ».
import type { Batch, Recipe, StockItem } from '../../../types';
import type { CatalogEntry } from '../../../domain/productionCatalog';
import { compareRecipeWithStock, pendingStockQuantity, type RecipeStockComparison } from '../../../domain/stockLevel';
import { isArchived } from '../../../domain/catalogOrganization';
import { Units } from '../../../services/units';
import { reparerNomAbime } from '../../../domain/recipeIngredientsAbimes';
import { retardDe } from '../volumes/phrase';

export type EtatStock = 'pret' | 'presque' | 'loin' | 'inconnu';

export interface LigneBesoin {
  cle: string;
  /** Le nom de l’article (« Citra »). */
  article: string;
  /** « Citra 250 g » ou « Levure Verdant, 1 sachet » : l'article et la quantité que la recette demande. */
  texte: string;
  etat: 'ok' | 'manque' | 'inconnu';
  /** Colonne de droite : « 160 g libres », « manque 250 g », ou la raison de l'inconnu. */
  droite: string;
  /** Pour « manque » : la quantité qui manque, dite avec l'article (« Citra 250 g »). */
  manque?: string;
  /** La part de `manque` qui se met en gras : le nom seul quand la quantité est comptée en pièces (« levure Belle Saison », puis « , 1 sachet »). */
  manqueGras?: string;
  /** Stock physique entièrement pris par d'autres brassins : « les 100 g du stock vont au LOT-019 ». */
  reservePar?: { lots: string[]; stock: string };
}

export interface Lignee {
  id: string;
  nom: string;
  /** La version la plus récente de la lignée (celle qu'on brasse). */
  entree: CatalogEntry;
  version: number;
  /** Nombre de versions de la lignée (le métro). */
  nbVersions: number;
  archivee: boolean;
  etat: EtatStock;
  besoins: LigneBesoin[];
  manques: LigneBesoin[];
  inconnus: LigneBesoin[];
  brassees: number;
  derniere?: string;
  prevu?: Batch;
  retard?: number;
}

const nombreFr = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const MESURES = new Set(['g', 'kg', 'mg', 'l', 'ml', 'cl']);
const estMesure = (unite?: string | null) => MESURES.has((unite ?? '').trim().toLowerCase());
/** Une quantité à la française : « 0,6 kg » (le malt reste en kg, dans l'unité du stock), « 2 sachets » (le pluriel s'accorde). */
function dire(q: number, unite: string): string {
  const u = unite.trim();
  if (u.toLowerCase() === 'kg') return `${nombreFr(q)} kg`;
  if (estMesure(u)) return Units.format(q, u);
  return `${nombreFr(q)} ${q > 1 && !/s$/i.test(u) ? u + 's' : u}`;
}
/** Le nom puis la quantité : « Citra 250 g » (une mesure se colle), « Levure Belle Saison, 1 sachet » (une pièce se détache). */
const lier = (nom: string, qte: string, unite?: string | null) => (qte ? `${nom}${estMesure(unite) ? ' ' : ', '}${qte}` : nom);
const quantite = (c: RecipeStockComparison): string => (c.quantity !== null && c.unit ? dire(c.quantity, c.unit) : '');

const CATEGORIES_JUGEES = ['houblon', 'malt', 'levure'];
const norm = (t: string) => t.trim().toLowerCase();

/**
 * Le carnet ne juge que le houblon, le malt et la levure (décision du pilote, 15.11) : un adjuvant (sel, sucre…) absent du stock
 * n'est jamais « à vérifier ». Filtre local au modèle ; `compareRecipeWithStock` n'est pas changé.
 */
function estJuge(c: RecipeStockComparison, adjuvants: Set<string>, coeur: Set<string>): boolean {
  const noms = c.ingredientNames.map(norm);
  if (noms.some((n) => coeur.has(n))) return true;
  if (c.stockItem) return CATEGORIES_JUGEES.includes(norm(c.stockItem.category ?? ''));
  return !(noms.length > 0 && noms.every((n) => adjuvants.has(n)));
}

/** Les lignes de besoin d'une recette face au stock : chaque ingrédient est « en stock », « manque » ou « à vérifier ». */
export function besoinsDe(recipe: Recipe, batches: Batch[], stock: StockItem[], recipes: Recipe[] = []): LigneBesoin[] {
  const nomsDuStock = stock.map((s) => s.name);
  const adjuvants = new Set((recipe.adjuncts ?? []).map((l) => norm(l.name)));
  const coeur = new Set([
    ...(recipe.fermentables ?? recipe.malts ?? []).map((l) => norm(l.name)),
    ...(recipe.hops ?? []).map((l) => norm(l.name)),
    ...(recipe.yeast?.name ? [norm(recipe.yeast.name)] : [])
  ]);
  return compareRecipeWithStock(recipe, batches, stock, recipes).filter((c) => estJuge(c, adjuvants, coeur)).map((c): LigneBesoin => {
    // T4-4 : le nom DIT (liste, « manque ») rend ses accents perdus (le même nom que la fiche : recipeIngredientsAbimes) ; `article` reste la clé de la recette.
    const label = reparerNomAbime(c.label, nomsDuStock);
    const dit = lier(label, quantite(c), c.unit);
    if (c.match !== 'linked' || c.shortage === null || !c.stockItem) {
      // Un stock négatif est une donnée fausse : jamais un manque gonflé, signalé à part (point 37).
      const negatif = c.match === 'linked' && !!c.stockItem && Number.isFinite(c.stockItem.currentStock) && c.stockItem.currentStock < 0;
      return { cle: c.key, article: c.label, texte: dit, etat: 'inconnu', droite: negatif ? 'stock négatif : à corriger' : c.match === 'linked' ? 'stock à vérifier' : c.match === 'ambiguous' ? 'plusieurs articles' : 'non relié' };
    }
    // Point 37 : `shortage` est le chiffre de « À commander » (besoin de cette recette + prévu ailleurs − stock) et peut dépasser ce que
    // CETTE recette demande (« 49 kg » pour 5 kg). Sur la recette : manque = max(0, besoin − disponible), jamais au-delà du besoin.
    // Même unité : `quantity` et `shortage` sont tous deux dans l'unité de l'article.
    const manque = c.quantity !== null ? Math.min(c.shortage, c.quantity) : c.shortage;
    if (manque > 0) {
      const unite = c.stockItem.unit;
      const physique = c.physical ?? 0;
      const lots = batches.filter((b) => pendingStockQuantity(c.stockItem!, b) > 0).map((b) => b.id);
      return {
        cle: c.key,
        article: c.label,
        texte: dit,
        etat: 'manque',
        droite: `manque ${dire(manque, unite)}`,
        manque: lier(label, dire(manque, unite), unite),
        manqueGras: estMesure(unite) ? lier(label, dire(manque, unite), unite) : label,
        ...(physique > 0 && (c.available ?? 0) === 0 && lots.length ? { reservePar: { lots, stock: dire(physique, unite) } } : {})
      };
    }
    return { cle: c.key, article: c.label, texte: dit, etat: 'ok', droite: c.available !== null ? `${dire(c.available, c.unit ?? '')} libres` : 'en stock' };
  });
}

/**
 * 37 (16.11, jeu en ligne) : un manque sûr passe avant un stock inconnu. Avant, une recette à 3 manques et 1 inconnu était rangée
 * « 1 à vérifier » alors que sa fiche disait « il manque 3 ingrédients ». La liste et la fiche disent maintenant la même chose ;
 * l'inconnu reste dit dans la fiche, sous les manques. Sans manque, l'inconnu garde « À vérifier » (jamais « Prête »).
 */
export function etatDe(manques: number, inconnus: number): EtatStock {
  if (manques > 0) return manques === 1 ? 'presque' : 'loin';
  return inconnus > 0 ? 'inconnu' : 'pret';
}

const jour = (iso?: string | number): number | undefined => {
  if (iso === undefined || iso === '') return undefined;
  const t = typeof iso === 'number' ? iso : /^(\d{4})-(\d{2})-(\d{2})/.test(iso) ? new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).getTime() : Date.parse(iso);
  return Number.isFinite(t) ? t : undefined;
};
const dd = (n: number) => String(n).padStart(2, '0');
export const dateCourte = (iso?: string, avecAnnee = false): string => {
  const t = jour(iso);
  if (t === undefined) return '';
  const d = new Date(t);
  return `${dd(d.getDate())}.${dd(d.getMonth() + 1)}${avecAnnee ? '.' + d.getFullYear() : ''}`;
};

/** Les lignées : les versions d'une même recette (`family`) en une ligne, la dernière version devant. */
export function lignees(entries: CatalogEntry[], batches: Batch[], stock: StockItem[], now = Date.now()): Lignee[] {
  const familles = new Map<string, CatalogEntry[]>();
  entries.forEach((e) => familles.set(e.family, [...(familles.get(e.family) ?? []), e]));
  return [...familles.entries()].map(([id, membres]): Lignee => {
    const ordre = [...membres].sort((a, b) => b.version - a.version);
    const entree = ordre[0];
    const besoins = besoinsDe(entree.recipe!, batches, stock);
    const manques = besoins.filter((b) => b.etat === 'manque');
    const inconnus = besoins.filter((b) => b.etat === 'inconnu');
    const lies = [...new Map(membres.flatMap((m) => m.linkedBatches).map((b) => [b.id, b])).values()];
    const faits = lies.filter((b) => b.status !== 'planifie' && b.status !== 'annule');
    const derniere = faits.map((b) => b.brewDate).filter((d): d is string => !!jour(d)).sort().at(-1);
    const prevu = lies.filter((b) => b.status === 'planifie').sort((a, b) => (a.plannedBrewDate ?? '').localeCompare(b.plannedBrewDate ?? ''))[0];
    return {
      id,
      nom: entree.name,
      entree,
      version: entree.version,
      nbVersions: membres.length,
      archivee: isArchived(entree),
      etat: etatDe(manques.length, inconnus.length),
      besoins,
      manques,
      inconnus,
      brassees: faits.length,
      derniere,
      prevu,
      retard: prevu ? retardDe(prevu, now) : undefined
    };
  });
}

export interface Groupes { pretes: Lignee[]; presque: Lignee[]; loin: Lignee[]; inconnues: Lignee[] }

export function grouper(l: Lignee[]): Groupes {
  const tri = (a: Lignee, b: Lignee) => (b.derniere ?? '').localeCompare(a.derniere ?? '') || a.nom.localeCompare(b.nom, 'fr');
  const par = (e: EtatStock) => l.filter((x) => x.etat === e).sort(tri);
  // Les prêtes à brasser d'abord, celles qui ont déjà un brassin planifié en dernier (r2a).
  const pretes = par('pret').sort((a, b) => Number(!!a.prevu) - Number(!!b.prevu));
  return { pretes, presque: par('presque'), loin: par('loin'), inconnues: par('inconnu') };
}

const ETAPE: Record<string, string> = { boil: 'à l’ébullition', whirlpool: 'au whirlpool', dryHop: 'en dry hop', mash: 'à l’empâtage', firstWort: 'en first wort' };
const nombre = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** « Depuis la v2 » : ce qui change entre la version précédente de la lignée et celle-ci, en phrases courtes (levure, houblons, grains). */
export function changementsDepuis(recette: Recipe, precedente: Recipe | undefined): string[] {
  if (!precedente) return [];
  const sortie: string[] = [];
  const ly = recette.yeast?.name?.trim(), lyp = precedente.yeast?.name?.trim();
  if (ly && ly !== lyp) sortie.push(ly.toLowerCase().split(/[^a-zà-ÿ]+/).includes('levure') ? ly : `levure ${ly}`);
  const cle = (n: string, e?: string) => `${n.trim().toLowerCase()}|${e ?? ''}`;
  const poids = (l: { name: string; stage?: string; weightG: number }[]) => new Map(l.map((h) => [cle(h.name, h.stage), h]));
  const avant = poids(precedente.hops ?? []), apres = poids(recette.hops ?? []);
  apres.forEach((h, k) => {
    const p = avant.get(k);
    const etape = ETAPE[h.stage ?? ''] ?? h.stage ?? '';
    if (!p) sortie.push(`+ ${h.name} ${nombre(h.weightG)} g${etape ? ' ' + etape : ''}`);
    else if (Math.abs(p.weightG - h.weightG) > 0.5) sortie.push(`${h.name}${etape ? ' ' + etape : ''} ${nombre(p.weightG)} → ${nombre(h.weightG)} g`);
  });
  avant.forEach((p, k) => { if (!apres.has(k)) sortie.push(`− ${p.name} ${nombre(p.weightG)} g`); });
  const fer = (l: { name: string; weightKg: number }[]) => new Map(l.map((f) => [f.name.trim().toLowerCase(), f]));
  const fa = fer(precedente.fermentables ?? []), fb = fer(recette.fermentables ?? []);
  fb.forEach((f, k) => {
    const p = fa.get(k);
    if (!p) sortie.push(`+ ${f.name} ${nombre(f.weightKg)} kg`);
    else if (Math.abs(p.weightKg - f.weightKg) > 0.05) sortie.push(`${f.name} ${nombre(p.weightKg)} → ${nombre(f.weightKg)} kg`);
  });
  fa.forEach((p, k) => { if (!fb.has(k)) sortie.push(`− ${p.name}`); });
  return sortie;
}

/** La version juste avant celle-ci dans la lignée (la plus haute version inférieure). */
export function versionPrecedente(entree: CatalogEntry, toutes: CatalogEntry[]): CatalogEntry | undefined {
  return toutes.filter((e) => e.family === entree.family && e.version < entree.version).sort((a, b) => b.version - a.version)[0];
}
