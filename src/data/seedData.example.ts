import {
  Transaction,
  StockItem,
  EquipmentItem,
  KegItem,
  Recipe,
  Batch,
  Client,
  GanttTask,
  PricingItem,
  BudgetLine,
  AppConfig
} from '../types';

/**
 * GABARIT du jeu de données initial.
 *
 * ⚠️ Le vrai `seedData.ts` ne fait PAS partie de ce dépôt : il contient la
 * comptabilité réelle de la brasserie — apports personnels, références
 * bancaires, identité et adresse de l'exploitant, fichier clients. Rien de tout
 * cela n'a sa place dans un dépôt public.
 *
 * Pour faire tourner l'application après un clone :
 *
 *     cp src/data/seedData.example.ts src/data/seedData.ts
 *
 * `seedData.ts` est ignoré par git : les chiffres que vous y mettrez resteront
 * chez vous. Ce gabarit démarre à vide — l'application se remplit ensuite par
 * la saisie, et c'est le comportement voulu : rien n'est jamais prérempli avec
 * des valeurs inventées.
 */

export const initialCompany: AppConfig['company'] = {
  name: 'Ma Brasserie',
  owner: 'Propriétaire',
  activity: 'Brassage & vente bière artisanale',
  address: 'Rue de l’Exemple 1',
  npa: '1000 Ville',
  canton: 'Canton',
  communeContact: '',
  uid: 'CHE-XXX.XXX.XXX',
  founded: '01.01.2026'
};

/** Les huit catégories du plan comptable de l'application. */
export const initialFinances: Record<string, Transaction[]> = {
  apports: [],
  recettes: [],
  brassage: [],
  materiel: [],
  nettoyage: [],
  chargesFixes: [],
  renovation: [],
  divers: []
};

export const initialStocks: {
  rawMaterials: StockItem[];
  cleaning: StockItem[];
  equipment: EquipmentItem[];
  kegs: KegItem[];
} = {
  rawMaterials: [],
  cleaning: [],
  equipment: [],
  kegs: []
};

export const initialProduction: Batch[] = [];
export const initialRecipes: Recipe[] = [];
export const initialClients: Client[] = [];
export const initialPlanning: GanttTask[] = [];
export const initialTarifs: PricingItem[] = [];
export const initialBudgetLines: BudgetLine[] = [];

/**
 * Les installations de brassage.
 *
 * Conservées telles quelles : ce sont des caractéristiques de matériel, pas des
 * données privées, et elles portent une décision de brassage qui vaut d'être
 * expliquée.
 *
 * ⚠️ Épaisseur de maische portée de 3.0 à 4.2 L/kg. Les deux premières
 * installations sont des MONOCUVES : on empâte près du volume plein et on rince
 * le panier par-dessus la cuve. À 3 L/kg, le calcul réclamait 21 L de rinçage
 * pour un brassin de 30 L — on ne rince pas un lit de grain avec ça, on le
 * noie. À 4.2, le rinçage retombe à 12–13 L. La 300 L reste à 3.2 : trois cuves
 * séparées.
 */
export const initialBrewhouses = [
  { id: 'bh-30', name: 'Système 30L', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2 },
  { id: 'bh-50', name: 'Système 50L', volumeL: 50, efficiencyPct: 78, boilOffRatePct: 10, deadSpaceL: 2.0, mashRatioLPerKg: 4.2 },
  { id: 'bh-300', name: 'Brasserie 300L', volumeL: 300, efficiencyPct: 82, boilOffRatePct: 8, deadSpaceL: 15.0, mashRatioLPerKg: 3.2 }
];
