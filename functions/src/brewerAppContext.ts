import { getFirestore } from 'firebase-admin/firestore';
import { BREWER_APP_SCREENS } from './brewerAppScreens.js';
import { pick } from './brewerContext.js';
import { loadBrewerFinanceContext } from './brewerFinanceContext.js';

const fields: Record<string, string[]> = {
  recipes: 'name style volumeL malts hops yeast efficiencyPct'.split(' '),
  batches: 'name style status brewDate volumeL volumeBrewedL og fg recipeRef'.split(' '),
  planning: 'category description cost startDate endDate isMilestone completed'.split(' '),
  transactions: 'date category subcategory description amountTTC amountHT tvaRate tvaAmount'.split(' '),
  budgetLines: 'line category row months totalPrevu realiseYTD'.split(' '),
  clients: 'name type notes'.split(' '),
  tarifs: 'product costIngredients costLabor costFixed costTotal priceHT marginCHF marginPercent'.split(' '),
  kegs: 'capacityL state batchRef beerName style fillDate clientName notes'.split(' '),
  creativeItems: 'title type status description estimatedCost targetPrice date notes'.split(' ')
};
const datasets: Record<string, string[]> = {
  dashboard: ['batches', 'recipes', 'planning'],
  finances: [],
  'production-batches': ['batches'],
  'production-recipes': ['recipes'],
  'production-lab': ['creativeItems', 'recipes'],
  'production-scaler': ['recipes'],
  'stocks-stock': [],
  'stocks-courses': ['recipes', 'batches'],
  'stocks-futs': ['kegs'],
  'stocks-materiel': [],
  'clients-crm': ['clients'],
  'clients-ofdf': ['batches'],
  'clients-tarifs': ['tarifs']
};

/** Only selected business fields for the current screen, never the entire config. */
export async function loadBrewerAppContext(id: string) {
  const db = getFirestore(), truncated: string[] = [];
  const financialScreen = ['finances', 'dashboard', 'production-lab', 'stocks-materiel', 'stocks-courses', 'clients-tarifs'].includes(id);
  const [entries, finance] = await Promise.all([Promise.all((datasets[id] ?? []).map(async (collection) => {
    const rows = await db.collection(collection).select(...fields[collection]).limit(81).get();
    if (rows.size > 80) truncated.push(collection);
    return [collection, rows.docs.slice(0, 80).map((doc) => ({ id: doc.id, ...pick(doc.data(), fields[collection]) }))] as const;
  })), financialScreen ? loadBrewerFinanceContext() : Promise.resolve(undefined)]);
  return { screen: BREWER_APP_SCREENS[id], records: Object.fromEntries(entries), truncated,
    ...(finance ? { finance, coverage: finance.coverage } : {}) };
}
