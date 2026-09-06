import fs from 'fs';

let raw = fs.readFileSync('seed_data.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.substring(1);
}
const seed = JSON.parse(raw);

// Clean finances: keep ONLY real transactions (amountHT > 0 or real apports/purchases)
const cleanFinances = {};
const validCats = ['apports', 'recettes', 'brassage', 'materiel', 'nettoyage', 'chargesFixes', 'renovation', 'divers'];

validCats.forEach((cat) => {
  const items = Array.isArray(seed.finances?.[cat]) ? seed.finances[cat] : [];
  cleanFinances[cat] = items
    .filter((item) => {
      // Keep real apports
      if (cat === 'apports') return typeof item.amountHT === 'number' && item.amountHT > 0;
      // Filter out zero-CHF placeholders in expenses and revenues
      return typeof item.amountHT === 'number' && item.amountHT > 0;
    })
    .map((item, idx) => ({
      id: item.id || `${cat.toUpperCase().slice(0, 3)}-${idx + 1}`,
      date: item.date || '01.01.2026',
      description: item.description || '',
      amountHT: item.amountHT,
      tvaRate: typeof item.tvaRate === 'number' ? item.tvaRate : 0,
      tvaAmount: typeof item.tvaAmount === 'number' ? item.tvaAmount : 0,
      amountTTC: typeof item.amountTTC === 'number' ? item.amountTTC : item.amountHT,
      category: cat,
      subcategory: item.subcategory || 'Général',
      proofNotes: item.proofNotes || '',
      syncedToDrive: true
    }));
});

// Clean stocks
seed.stocks.rawMaterials = (seed.stocks.rawMaterials || []).map((item, idx) => ({
  id: `MP-${idx + 1}`,
  ref: item.ref || `MP-${idx + 1}`,
  name: item.name || '',
  category: item.category || 'Malt',
  unit: item.unit || 'kg',
  currentStock: typeof item.currentStock === 'number' ? item.currentStock : 0,
  minStock: typeof item.minStock === 'number' ? item.minStock : 0,
  reorder: Boolean(item.reorder),
  supplier: item.supplier || ''
}));

seed.stocks.cleaning = (seed.stocks.cleaning || []).map((item, idx) => ({
  id: `NT-${idx + 1}`,
  ref: item.ref || `NT-${idx + 1}`,
  name: item.name || '',
  category: item.category || 'CIP',
  unit: item.unit || 'L',
  currentStock: typeof item.currentStock === 'number' ? item.currentStock : 0,
  minStock: typeof item.minStock === 'number' ? item.minStock : 0,
  reorder: Boolean(item.reorder)
}));

seed.stocks.equipment = (seed.stocks.equipment || []).map((item, idx) => ({
  id: `EQ-${idx + 1}`,
  ref: item.ref || `EQ-${idx + 1}`,
  name: item.name || '',
  category: item.category || 'Brassage',
  state: item.state || 'Bon',
  purchaseDate: item.purchaseDate || '',
  purchasePrice: item.purchasePrice || '',
  maintenance: item.maintenance || '',
  notes: item.notes || ''
}));

seed.stocks.kegs = (seed.stocks.kegs || []).map((item) => ({
  id: item.id || 'F-001',
  capacityL: item.capacityL || 30,
  state: 'lavage',
  batchRef: item.batchRef || '',
  beerName: item.beerName || '',
  style: item.style || '',
  fillDate: item.fillDate || '',
  notes: item.notes || ''
}));

// Clean production batches: only keep LOT-001 and LOT-002
seed.production = (seed.production || [])
  .filter((b) => b.name && b.name.trim() !== '')
  .map((b) => {
    let cleanStatus = 'planifie';
    if (b.status?.includes('Fermentation')) cleanStatus = 'fermentation';
    else if (b.status?.includes('Annul')) cleanStatus = 'annule';
    else if (b.status?.includes('Garde')) cleanStatus = 'garde';
    else if (b.status?.includes('Embouteill')) cleanStatus = 'embouteille';
    else if (b.status?.includes('Termin')) cleanStatus = 'termine';

    return {
      ...b,
      status: cleanStatus,
      gravityLog: b.id === 'LOT-001' ? [
        { date: '01.05.2026', sg: 1.062, tempC: 18.5, notes: 'Ensemencement Windsor' },
        { date: '05.05.2026', sg: 1.032, tempC: 19.0, notes: 'Fermentation active vigoureuse' }
      ] : []
    };
  });

// Clean clients
seed.clients = (seed.clients || []).map((c) => {
  let cleanStatus = 'Prospect';
  if (c.status?.includes('Fidèle')) cleanStatus = 'Fidèle';
  else if (c.status?.includes('Actif')) cleanStatus = 'Actif';

  return {
    ...c,
    status: cleanStatus
  };
});

// Clean planning
seed.planning = (seed.planning || []).map((t) => ({
  id: t.id || 'T-0',
  category: t.category || '',
  description: t.description || '',
  cost: typeof t.cost === 'number' ? t.cost : 0,
  startDate: t.startDate || '',
  endDate: t.endDate || '',
  isMilestone: Boolean(t.isMilestone)
}));

// Clean budgetLines
seed.budgetLines = (seed.budgetLines || []).map((bl) => ({
  line: bl.line || '',
  row: bl.row || 0,
  months: (bl.months || []).map((m) => (typeof m === 'number' ? m : 0)),
  totalPrevu: typeof bl.totalPrevu === 'number' ? bl.totalPrevu : 0,
  realiseYTD: typeof bl.realiseYTD === 'number' ? bl.realiseYTD : 0
}));

// Format as TypeScript file
const tsContent = `import { Transaction, StockItem, EquipmentItem, KegItem, Recipe, Batch, Client, GanttTask, PricingItem, BudgetLine, AppConfig } from "../types";

export const initialCompany: AppConfig["company"] = ${JSON.stringify(seed.company, null, 2)};

export const initialFinances: Record<string, Transaction[]> = ${JSON.stringify(cleanFinances, null, 2)};

export const initialStocks: { rawMaterials: StockItem[]; cleaning: StockItem[]; equipment: EquipmentItem[]; kegs: KegItem[] } = ${JSON.stringify(seed.stocks, null, 2)};

export const initialProduction: Batch[] = ${JSON.stringify(seed.production, null, 2)};

export const initialRecipes: Recipe[] = ${JSON.stringify(seed.recipes, null, 2)};

export const initialClients: Client[] = ${JSON.stringify(seed.clients, null, 2)};

export const initialPlanning: GanttTask[] = ${JSON.stringify(seed.planning, null, 2)};

export const initialTarifs: PricingItem[] = ${JSON.stringify(seed.tarifs, null, 2)};

export const initialBudgetLines: BudgetLine[] = ${JSON.stringify(seed.budgetLines, null, 2)};

export const initialBrewhouses = [
  { id: "bh-30", name: "Système 30L (Actuel)", volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 3.0 },
  { id: "bh-50", name: "Système 50L (Intermédiaire)", volumeL: 50, efficiencyPct: 78, boilOffRatePct: 10, deadSpaceL: 2.0, mashRatioLPerKg: 3.0 },
  { id: "bh-300", name: "Brasserie 300L Pro (Future extension)", volumeL: 300, efficiencyPct: 82, boilOffRatePct: 8, deadSpaceL: 15.0, mashRatioLPerKg: 3.2 }
];
`;

fs.writeFileSync('src/data/seedData.ts', tsContent, 'utf8');
console.log('src/data/seedData.ts cleansed of placeholders! Size: ' + fs.statSync('src/data/seedData.ts').size);
