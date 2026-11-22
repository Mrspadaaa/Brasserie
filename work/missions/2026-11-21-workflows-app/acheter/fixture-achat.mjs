// Fixture de la chaîne ACHETER (21.11) — données simulées, rien de la vraie brasserie. Dates relatives à `aujourdhui`.
// Un brassin planifié dont la recette manque de malt, houblon et levure ; un produit de nettoyage sous son seuil ;
// un besoin de matériel (pompe) chiffré ; une caisse de départ POSITIVE (+300 CHF) qu'une facture de 420 CHF fera passer sous zéro.
const MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
export const ajouter = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;
export function fixtureAchat(aujourdhui) {
  const at = `${ajouter(aujourdhui, -30)}T08:00:00.000Z`;
  const entrees = []; const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });
  article('S-PILS', 'Malt pilsner', 'Malt', 'kg', 5, { minStock: 10, supplier: 'Brouwland', pricePerUnit: 1.6 });
  article('S-CITRA', 'Citra', 'Houblon', 'g', 150, { supplier: 'Brouwland', pricePerUnit: 0.09, alphaPct: 12.5 });
  article('S-US05', 'SafAle US-05', 'Levure', 'sachet', 1, { supplier: 'Brouwland', pricePerUnit: 4.5 });
  article('S-SOUDE', 'Soude caustique', 'CIP alcalin', 'kg', 0.5, { minStock: 2, supplier: 'Hygiène Pro', pricePerUnit: 6 });
  article('S-MUNICH', 'Malt Munich', 'Malt', 'kg', 12, { supplier: 'Brouwland', pricePerUnit: 1.9 });
  const recette = { name: 'IPA de Noël', volumeL: 100, ogTarget: 1.060,
    fermentables: [{ name: 'Malt pilsner', weightKg: 20, kind: 'grain' }, { name: 'Malt Munich', weightKg: 4, kind: 'grain' }],
    hops: [{ name: 'Citra', weightG: 400, stage: 'boil', time: 10 }],
    yeast: { name: 'SafAle US-05', qty: 2, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] };
  const brew = ajouter(aujourdhui, 10);
  add('batches', 'B-IPA', { id: 'B-IPA', name: 'IPA de Noël', style: 'IPA', volumeL: 100, brewDate: '', plannedBrewDate: suisse(brew), status: 'planifie', gravityLog: [], recipeRef: 'R-IPA', stockAccountingVersion: 1, recipeSnapshot: recette });
  add('recipes', 'R-IPA', { id: 'R-IPA', name: 'IPA de Noël', style: 'IPA', volumeL: 100, ingredients: [], ...recette });
  add('equipment', 'E-FERM', { id: 'E-FERM', name: 'Fermenteur 120 L', category: 'Fermentation', status: 'ok', purchaseDate: ajouter(aujourdhui, -400), purchasePrice: 900 });
  const plan = (id, title, date, amountCents, extra = {}) => add('financialPlans', id, { id, title, date, amountCents, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: at, ...extra });
  plan('P-POMPE', 'Pompe de transfert', ajouter(aujourdhui, 20), 45000, { category: 'materiel', source: 'equipment', vendor: 'Brewferm' });
  plan('P-MALT', 'Commande de malt', ajouter(aujourdhui, 5), 42000, { category: 'brassage', vendor: 'Brouwland' });
  plan('P-VENTE', 'Café du Pont, 2 fûts', ajouter(aujourdhui, 25), 26000, { direction: 'in', category: 'recettes' });
  const facture = (id, cents, date, nom, vendor) => add('transactions', id, {
    id, date, description: nom, vendor, category: 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'paid', paymentDate: date, recordedAt: `${date}T09:00:00.000Z` } });
  facture('F-ANC', 18000, ajouter(aujourdhui, -40), 'Brouwland · malt', 'Brouwland');
  add('financialProfiles', 'current', { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false,
    historyCompleteFrom: `${aujourdhui.slice(0, 4)}-01-01`, openingCash: { date: `${aujourdhui.slice(0, 4)}-01-01`, amountCents: 30000, confirmed: true } });
  return { entrees };
}
// La lecture SIMULÉE d'une facture Brouwland (jamais Gemini) : 25 kg de pilsner, 500 g de Citra, 2 sachets d'US-05 ; 420 CHF TTC.
export const lectureBrouwland = (aujourdhui) => ({
  documentType: 'invoice', paymentEvidence: 'unpaid', paymentMethod: 'bank_transfer', vendor: 'Brouwland', date: aujourdhui, currency: 'CHF', invoiceNumber: 'BW-2026-1142',
  amountHT: 389.98, tvaRate: 0.081, tvaAmount: 31.59, amountTTC: 421.57, category: 'brassage', description: 'Matières premières',
  items: [
    { name: 'Malt Pilsner 25 kg', kind: 'stock', quantity: 1, unit: 'sac 25 kg', price: 49.5, amountTTC: 53.51, stockCategory: 'Malt' },
    { name: 'Citra T90 2025', kind: 'stock', quantity: 500, unit: 'g', price: 0.62, amountTTC: 335.11, stockCategory: 'Houblon', alphaPct: 12.8 },
    { name: 'SafAle US-05 11,5 g', kind: 'stock', quantity: 6, unit: 'sachet', price: 5.2, amountTTC: 32.95, stockCategory: 'Levure' }
  ], issues: [] });
