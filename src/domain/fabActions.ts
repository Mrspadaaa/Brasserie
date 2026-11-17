import { TabType } from '../components/BottomNav';

/**
 * Ce que crée le bouton d'action, selon l'endroit où l'on se trouve.
 *
 * ⚠️ Ce que ça règle : le bouton ouvrait TOUJOURS le même menu de saisie
 * rapide — achat, vente, brassin — quel que soit l'écran. Sur l'onglet Fûts, il
 * proposait donc d'enregistrer une facture ; sur Tarifs, de brasser. Le geste le
 * plus visible de l'application ne créait jamais ce qu'on avait sous les yeux.
 *
 * Le tableau est un `Record` exhaustif par onglet : ajouter un sous-onglet sans
 * dire ce que le bouton y crée casse la compilation. C'est la même garantie que
 * pour les statuts de brassin — un chemin oublié se voit à la compilation, pas
 * en production.
 */

export type FabIntent =
  | 'quickAction'
  | 'newTransaction'
  | 'newBatch'
  | 'newRecipe'
  | 'newIdea'
  | 'newStockItem'
  | 'newHopVariety'
  | 'newKeg'
  | 'newEquipment'
  | 'newClient'
  | 'newTarif'
  // Pas de `newPlanning` : aucun onglet ne montre le planning aujourd'hui. Une
  // intention que personne ne produit finit par être branchée sur le menu par
  // défaut sans que ça se voie — on la déclarera le jour où l'écran existera.
  | 'copyShoppingList';

export interface FabAction {
  intent: FabIntent;
  /** Lu par les lecteurs d'écran, et affiché au survol. */
  label: string;
  /** Seconde ligne dans le menu ; « Sur cet écran » par défaut. */
  hint?: string;
  /** e11a : le + dit ce qu'il crée (« + Brassin », « + Recette ») ; absent, il reste un « + » seul. */
  court?: string;
  /** e11a : menu de l'onglet Brassins : action de l'écran, Créer une recette, Outils houblons, puis facture, vente, Compagnon. */
  menu?: 'brassins';
}

/** Événement que le menu du + émet pour « Outils houblons » ; l'onglet Brassins l'écoute et ouvre l'atelier. */
export const OUTILS_HOUBLONS_EVENT = 'brassins-outils-houblons-open';

/** Sous-onglets connus, par onglet. `null` = l'onglet n'en a pas. */
export type SubTabOf = {
  dashboard: null;
  finances: null;
  calendrier: null;
  production: 'batches' | 'recipes' | 'lab' | 'scaler';
  stocks: 'stock' | 'courses' | 'futs' | 'materiel' | 'hops';
  clients: 'crm' | 'ofdf' | 'tarifs';
};

export type AnySubTab = SubTabOf[keyof SubTabOf];

const A = (intent: FabIntent, label: string, hint?: string): FabAction => ({ intent, label, hint });
/** Entrée de l'onglet Brassins : nom court sur le bouton, menu de la maquette e11a, ligne « Sur … ». */
const B = (intent: FabIntent, label: string, court: string | undefined, sur?: string): FabAction =>
  ({ intent, label, hint: sur, ...(court ? { court } : {}), menu: 'brassins' });

/** Le formulaire ouvert est celui d'une dépense : la seconde ligne le dit avant l'appui. */
const NEW_TRANSACTION = A('newTransaction', 'Nouvelle écriture', 'Facture ou saisie à la main');

/**
 * Le tableau complet. Chaque onglet donne soit une action unique, soit une
 * action par sous-onglet.
 */
const ACTIONS: {
  [K in TabType]: FabAction | Record<NonNullable<SubTabOf[K]>, FabAction>;
} = {
  // #114 : sur le tableau de bord comme sur Finances, le + crée d'abord une
  // écriture comptable ; vente, facture, recette et brassin restent dessous.
  dashboard: NEW_TRANSACTION,
  finances: NEW_TRANSACTION,
  // Calendrier (onglet/v1, 16.11) : ce qui se pose dans le temps est d'abord un brassin ; écriture, facture et vente restent sous « Partout ».
  // Les trois gestes (brassin, fête, dépense) viennent de l'écran lui-même (`usePlusPage`), avec la semaine touchée : pas d'action pleine ici.
  calendrier: A('quickAction', 'Saisie rapide'),

  production: {
    batches: B('newBatch', 'Nouveau brassin', 'Brassin', 'Sur Brassins'),
    recipes: B('newRecipe', 'Nouvelle recette', 'Recette', 'Sur Recettes'),
    lab: B('newIdea', 'Nouvelle idée', undefined, undefined),
    // Le calculateur ne crée rien : il met une recette existante à l'échelle. BX-4 (09.11) : pas d'action d'écran (« Nouvelle recette » ici n'était pas la bonne).
    scaler: A('quickAction', 'Saisie rapide')
  },

  stocks: {
    stock: A('newStockItem', 'Nouvel article'),
    // Sur la liste de courses, ce qu'on veut n'est pas créer mais emporter.
    courses: A('copyShoppingList', 'Copier la liste'),
    futs: A('newKeg', 'Nouveau fût'),
    materiel: A('newEquipment', 'Nouveau matériel'),
    hops: A('newHopVariety', 'Nouvelle variété')
  },

  clients: {
    crm: A('newClient', 'Nouveau client'),
    // La fiscalité OFDF se calcule depuis les brassins : rien à y créer (BX-4 : pas de « Nouveau client » ici).
    ofdf: A('quickAction', 'Saisie rapide'),
    tarifs: A('newTarif', 'Nouveau tarif')
  }
};

/**
 * L'action du bouton, ici et maintenant.
 *
 * Un sous-onglet inconnu retombe sur la saisie rapide plutôt que de planter :
 * un bouton qui fait quelque chose de générique vaut mieux qu'un écran blanc.
 */
export function fabActionFor(tab: TabType, subTab?: AnySubTab | null): FabAction {
  const entry = ACTIONS[tab];
  if ('intent' in entry) return entry;
  if (!subTab) return Object.values(entry)[0] as FabAction;
  return (entry as Record<string, FabAction>)[subTab] ?? A('quickAction', 'Saisie rapide');
}
