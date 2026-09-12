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
}

/** Sous-onglets connus, par onglet. `null` = l'onglet n'en a pas. */
export type SubTabOf = {
  dashboard: null;
  finances: null;
  production: 'batches' | 'recipes' | 'lab' | 'scaler';
  stocks: 'stock' | 'courses' | 'futs' | 'materiel' | 'hops';
  clients: 'crm' | 'ofdf' | 'tarifs';
};

export type AnySubTab = SubTabOf[keyof SubTabOf];

const A = (intent: FabIntent, label: string): FabAction => ({ intent, label });

/**
 * Le tableau complet. Chaque onglet donne soit une action unique, soit une
 * action par sous-onglet.
 */
const ACTIONS: {
  [K in TabType]: FabAction | Record<NonNullable<SubTabOf[K]>, FabAction>;
} = {
  dashboard: A('quickAction', 'Saisir un achat, une vente ou un brassin'),
  finances: A('newTransaction', 'Nouvelle écriture'),

  production: {
    batches: A('newBatch', 'Nouveau brassin'),
    recipes: A('newRecipe', 'Nouvelle recette'),
    lab: A('newIdea', 'Nouvelle idée'),
    // Le calculateur ne crée rien : il met une recette existante à l'échelle.
    scaler: A('newRecipe', 'Nouvelle recette')
  },

  stocks: {
    stock: A('newStockItem', 'Nouvel article de stock'),
    // Sur la liste de courses, ce qu'on veut n'est pas créer mais emporter.
    courses: A('copyShoppingList', 'Copier la liste de courses'),
    futs: A('newKeg', 'Nouveau fût'),
    materiel: A('newEquipment', 'Nouveau matériel'),
    hops: A('newHopVariety', 'Nouvelle variété de houblon')
  },

  clients: {
    crm: A('newClient', 'Nouveau client'),
    // La fiscalité OFDF se calcule depuis les brassins : rien à y créer.
    ofdf: A('newClient', 'Nouveau client'),
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
