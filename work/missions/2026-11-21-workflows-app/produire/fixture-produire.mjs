// Fixture de la chaîne PRODUIRE (21.11) — « ZZ TEST », données simulées, rien de la vraie brasserie.
// Forme calquée sur fixtures/calendrier.mjs et acheter/fixture-achat.mjs. Dates RELATIVES à `aujourdhui` (ISO).
// Contenu : stock avec prix (malts, houblons, levure, emballage, sucre) ; une recette FIGÉE (R-ZZ-IPA) ; un brassin
// planifié (B-ZZ-PLAN) ; un brassin en fermentation depuis 14 jours, primaire 12 j, avec un relevé de densité (B-ZZ-FERM) ;
// trois fûts propres vides ; l'équipement ; le profil financier.
const MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
export const ajouter = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;

export function fixtureProduire(aujourdhui) {
  const at = `${ajouter(aujourdhui, -30)}T08:00:00.000Z`;
  const entrees = [];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });

  article('ZZ-PILS', 'ZZ TEST Malt pilsner', 'Malt', 'kg', 60, { minStock: 10, supplier: 'ZZ TEST', pricePerUnit: 1.6 });
  article('ZZ-MUNICH', 'ZZ TEST Munich', 'Malt', 'kg', 10, { supplier: 'ZZ TEST', pricePerUnit: 1.9 });
  article('ZZ-CARA', 'ZZ TEST Caramünch', 'Malt', 'kg', 5, { supplier: 'ZZ TEST', pricePerUnit: 2.8 });
  article('ZZ-CITRA', 'ZZ TEST Citra', 'Houblon', 'g', 500, { supplier: 'ZZ TEST', pricePerUnit: 0.09, alphaPct: 12.5 });
  article('ZZ-SAAZ', 'ZZ TEST Saaz', 'Houblon', 'g', 300, { supplier: 'ZZ TEST' });
  article('ZZ-US05', 'ZZ TEST US-05', 'Levure', 'sachet', 4, { supplier: 'ZZ TEST', pricePerUnit: 4.5 });
  article('ZZ-BOUT33', 'ZZ TEST Bouteille 33 cl', 'Emballage', 'pièce', 200, { supplier: 'ZZ TEST', pricePerUnit: 0.35 });
  article('ZZ-CAPS', 'ZZ TEST Capsule', 'Emballage', 'pièce', 300, { supplier: 'ZZ TEST' });
  article('ZZ-SUCRE', 'ZZ TEST Sucre de conditionnement', 'Sucre', 'kg', 3, { supplier: 'ZZ TEST' });

  // Installation figée dans la recette (BrewhouseProfile). Sans elle, la feuille Brasser lève une erreur (21.11, voir BUGS-produire.md).
  const BH = { id: 'BH-ZZ', name: 'ZZ TEST Système 30 L', volumeL: 30, efficiencyPct: 72, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3, equipmentRefs: { fermenter: 'E-ZZ-FERM' } };
  const recette = { name: 'ZZ TEST IPA', volumeL: 100, ogTarget: 1.060, brewhouse: BH,
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 4, kind: 'grain' }],
    hops: [{ name: 'ZZ TEST Citra', weightG: 400, stage: 'boil', time: 10 }],
    yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' }, // sans « name » : la recherche de levure par nom lève WFR-9 (BUGS-produire.md)
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] };
  add('recipes', 'R-ZZ-IPA', { id: 'R-ZZ-IPA', name: 'ZZ TEST IPA', style: 'IPA', volumeL: 100, ingredients: [], ...recette });

  add('batches', 'B-ZZ-PLAN', { id: 'B-ZZ-PLAN', name: 'ZZ TEST IPA', style: 'IPA', volumeL: 100, brewDate: '', plannedBrewDate: suisse(ajouter(aujourdhui, 10)),
    status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-IPA', stockAccountingVersion: 1, recipeSnapshot: recette });
  add('batches', 'B-ZZ-FERM', { id: 'B-ZZ-FERM', name: 'ZZ TEST Blonde', style: 'Blonde', volumeL: 100, brewDate: suisse(ajouter(aujourdhui, -14)), actualBrewDate: suisse(ajouter(aujourdhui, -14)),
    plannedBrewDate: suisse(ajouter(aujourdhui, -14)), status: 'fermentation', gravityLog: [{ date: ajouter(aujourdhui, -12), sg: 1.031, tempC: 19 }],
    recipeRef: 'R-ZZ-BLONDE', stockAccountingVersion: 1,
    recipeSnapshot: { name: 'ZZ TEST Blonde', volumeL: 100, ogTarget: 1.050, brewhouse: BH,
      fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 5, kind: 'grain' }], hops: [], yeast: { stockItemRef: 'ZZ-US05', qty: 1, unit: 'sachet' },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] } });
  add('recipes', 'R-ZZ-BLONDE', { id: 'R-ZZ-BLONDE', name: 'ZZ TEST Blonde', style: 'Blonde', volumeL: 100, ingredients: [] });

  for (const n of [1, 2, 3]) add('kegs', `F-00${n}`, { id: `F-00${n}`, capacityL: 20, state: 'propre' });
  add('equipment', 'E-ZZ-FERM', { id: 'E-ZZ-FERM', name: 'ZZ TEST Fermenteur 120 L', category: 'Fermentation', status: 'ok', purchaseDate: ajouter(aujourdhui, -400), purchasePrice: 900 });
  add('financialProfiles', 'current', { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false,
    historyCompleteFrom: `${aujourdhui.slice(0, 4)}-01-01`, openingCash: { date: `${aujourdhui.slice(0, 4)}-01-01`, amountCents: 30000, confirmed: true } });
  void at;
  return { entrees };
}
