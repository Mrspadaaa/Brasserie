// c2a (choix du brasseur, 15.11) : la liste « Créer un brassin » et l'état « après ». Aucune donnée inventée : le stock vient de `besoinsDe` (r2a),
// la cuve des brassins (brasser/cuveModel). Ce que le modèle ne porte pas (annuler UN effet seul) est dit en ACCORD, jamais simulé.
import type { Batch, Recipe, StockItem } from '../../../types';
import { isCurrent } from '../../../domain/catalogOrganization';
import { recipeEntries } from '../../../domain/productionCatalog';
import { besoinsDe, dateCourte, grouper, lignees, type EtatStock, type Lignee } from '../recettes/recettesModel';
import { evenements, occupations, premierLibre, jourBouton, jourLong, type Contexte } from '../brasser/cuveModel';

export type Trait = 'ok' | 'manque' | 'inconnu';
export interface CarteCreer {
  id: string;
  nom: string;
  style: string;
  etat: EtatStock;
  /** Malts, houblons, levure : plein = en stock, creux = à acheter, pointillé = à vérifier. */
  traits: [Trait, Trait, Trait];
  mot: string;
  ton: 'hop' | 'attention' | 'eteint';
  chiffres: Array<{ nom: string; valeur: string }>;
  levure: string;
  levureManque: boolean;
  dernier: string;
  prevu?: Batch;
  ordre: number;
  derniere?: string;
}

const virgule = (n: number, d: number) => n.toFixed(d).replace('.', ',');
const norm = (t: string) => t.trim().toLowerCase();
const nombre = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);

function traitsDe(r: Recipe, l: Lignee): [Trait, Trait, Trait] {
  const groupes = [
    new Set((r.fermentables ?? r.malts ?? []).map((x) => norm(x.name))),
    new Set((r.hops ?? []).map((x) => norm(x.name))),
    new Set(r.yeast?.name ? [norm(r.yeast.name)] : [])
  ];
  const de = (g: Set<string>): Trait => {
    const b = l.besoins.filter((x) => g.has(norm(x.article)));
    return b.some((x) => x.etat === 'manque') ? 'manque' : b.some((x) => x.etat === 'inconnu') ? 'inconnu' : 'ok';
  };
  return [de(groupes[0]), de(groupes[1]), de(groupes[2])];
}

function carte(l: Lignee, ordre: number): CarteCreer {
  const r = l.entree.recipe!;
  const traits = traitsDe(r, l);
  const manque = l.manques[0];
  const mot = l.prevu ? 'prévue'
    : l.etat === 'pret' ? 'prête'
    : l.etat === 'inconnu' ? 'à vérifier'
    : traits[2] === 'manque' ? 'levure' : traits[1] === 'manque' ? manque.article : 'malts';
  const abv = nombre(r.abvTarget), og = nombre(r.ogTarget), vol = nombre(r.volumeL);
  const levureManque = l.manques.some((m) => norm(m.article) === norm(r.yeast?.name ?? '\u0000'));
  const lot = [...l.entree.linkedBatches].filter((b) => b.status !== 'planifie' && b.status !== 'annule').sort((a, b) => (b.brewDate ?? '').localeCompare(a.brewDate ?? ''))[0];
  const dernier = l.prevu ? `prévue ${dateCourte(l.prevu.plannedBrewDate) || 'sans date'}`
    : lot ? `${lot.id}${dateCourte(lot.brewDate) ? ' · ' + dateCourte(lot.brewDate) : ''}` : 'jamais brassée';
  return {
    id: r.id, nom: l.nom, style: r.style, etat: l.etat, traits, mot, ordre, derniere: l.derniere, prevu: l.prevu, levureManque,
    ton: l.prevu ? 'eteint' : l.etat === 'pret' ? 'hop' : 'attention',
    chiffres: [
      abv !== undefined ? { nom: 'Alcool', valeur: `${virgule(abv, 1)} %` } : og !== undefined ? { nom: 'OG', valeur: virgule(og, 3) } : { nom: 'Alcool', valeur: '—' },
      { nom: 'Volume', valeur: vol !== undefined ? `${virgule(vol, vol % 1 ? 1 : 0)} L` : '—' }
    ],
    levure: levureManque ? `${r.yeast?.name ?? 'levure'} : à acheter` : (r.yeast?.name?.trim() || 'levure non renseignée'),
    dernier
  };
}

export type TriCreer = 'pretes' | 'derniere';

/** Les cartes de c2a : « Prêtes d'abord » (les prêtes, puis les autres, chaque groupe par dernière brassée), ou « Dernière brassée ». */
export function cartesCreer(recipes: Recipe[], batches: Batch[], stock: StockItem[], tri: TriCreer = 'pretes', rendement = 75): { cartes: CarteCreer[]; pretes: number; acompleter: number } {
  const entrees = recipeEntries(recipes.filter(isCurrent), batches, rendement).filter((e) => !!e.recipe);
  const toutes = lignees(entrees, batches, stock);
  const g = grouper(toutes);
  const ordonnees = [...g.pretes, ...g.presque, ...g.loin, ...g.inconnues];
  const cartes = ordonnees.map(carte);
  const pretes = g.pretes.length;
  if (tri === 'derniere') cartes.sort((a, b) => (b.derniere ?? '').localeCompare(a.derniere ?? '') || a.nom.localeCompare(b.nom, 'fr'));
  return { cartes, pretes, acompleter: cartes.length - pretes };
}

/** « La cuve est libre dès aujourd'hui » / « libre mer. 18 » : sur le volume de la première recette prête ; vide si la capacité est inconnue. */
export function phraseCuve(batches: Batch[], volumeL: number, capaciteL: number | undefined, maintenant = Date.now()): { gras: string; reste: string } | null {
  if (!capaciteL) return null;
  const ctx: Contexte = { occ: occupations(batches), evts: evenements(batches), capaciteL, volumeL, aujourdhui: new Date(new Date(maintenant).setHours(0, 0, 0, 0)).getTime() };
  const j = premierLibre(ctx);
  if (j === undefined) return { gras: 'La cuve', reste: ' n\'est libre à aucune date connue dans 12 semaines' };
  return j === ctx.aujourdhui ? { gras: 'La cuve', reste: ' est libre dès aujourd\'hui' } : { gras: 'La cuve', reste: ` est libre ${jourBouton(j)}` };
}

export interface Effet {
  cle: 'date' | 'stock' | 'achats';
  titre: string;
  detail: string;
  ton: 'hop' | 'attention' | 'neutre';
}

/**
 * Les effets de la création, tels que le modèle les porte. Le stock se compare SANS le brassin neuf (il compterait sa propre réservation comme un manque).
 * « Réservé » : un brassin planifié compte dans les réservations (`compareRecipeWithStock`) ; « aux achats » : le manque restant. Rien d'autre n'est dit.
 */
export function effetsDe(batch: Batch, recipe: Recipe | undefined, batches: Batch[], stock: StockItem[]): Effet[] {
  const effets: Effet[] = [];
  const t = batch.plannedBrewDate ? new Date(Number(batch.plannedBrewDate.slice(6, 10)), Number(batch.plannedBrewDate.slice(3, 5)) - 1, Number(batch.plannedBrewDate.slice(0, 2))).getTime() : undefined;
  effets.push({
    cle: 'date', ton: 'neutre',
    titre: t !== undefined ? `Brassage ${jourLong(t)}` : 'Date à définir',
    detail: t !== undefined ? 'la cuve est prise à partir de ce jour ; sa fin dépend de la mise en bouteille' : 'tu la poses sur la fiche du brassin'
  });
  if (!recipe) return effets;
  const sans = besoinsDe(recipe, batches.filter((b) => b.id !== batch.id), stock);
  const ok = sans.filter((b) => b.etat === 'ok');
  const manques = sans.filter((b) => b.etat === 'manque');
  // La maquette range les malts en un mot (« Malts, Citra 100 g, Verdant IPA ») : une ligne, pas la liste du stock (qui reste dans la feuille Brasser).
  const noms = new Set((recipe.fermentables ?? []).map((f) => f.name.trim().toLowerCase()));
  const malts = ok.filter((b) => noms.has(b.article.trim().toLowerCase()));
  const autres = ok.filter((b) => !malts.includes(b));
  // La levure se dit par son nom seul (la maquette : « Verdant IPA »), sans quantité qui se coupe en fin de ligne.
  const levure = (recipe.yeast?.name ?? '').trim().toLowerCase();
  const titreStock = [...(malts.length ? [malts.length > 1 ? 'Malts' : malts[0].texte] : []), ...autres.map((b) => (levure && b.article.trim().toLowerCase() === levure ? b.article : b.texte))].join(', ');
  if (ok.length) effets.push({ cle: 'stock', ton: 'hop', titre: titreStock, detail: 'réservés au brassin planifié' });
  if (manques.length) effets.push({ cle: 'achats', ton: 'attention', titre: `${manques.map((m) => m.manque ?? m.article).join(', ')} aux achats`, detail: 'ce qui manque au stock, à commander' });
  return effets;
}
