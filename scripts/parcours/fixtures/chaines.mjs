// Fixture du PARCOURS CHAINES (21.11) — « ZZ TEST », données simulées, rien de la vraie brasserie (jamais seedData.ts).
// Elle réunit ce que jouent les chaînes PRODUIRE (recette neuve, malt du stock, levure nommée), VENDRE (deux fûts à un pro, plan promis,
// bières en vente), ACHETER (commande de malt prévue) et le Calendrier (une Hotte à chercher). Dates RELATIVES à `aujourdhui` (ISO).
const MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
export const ajouter = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;

export function fixtureChaines(aujourdhui) {
  const at = `${ajouter(aujourdhui, -30)}T08:00:00.000Z`;
  const entrees = [];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });

  // stock : des malts (dont un seul reste, 600 g : la pastille « Ajouter … en stock » de WFR-3), houblon, levure, emballage
  article('ZZ-PILS', 'ZZ TEST Malt pilsner', 'Malt', 'kg', 60, { minStock: 10, supplier: 'ZZ TEST', pricePerUnit: 1.6 });
  article('ZZ-MUNICH', 'ZZ TEST Munich', 'Malt', 'kg', 10, { supplier: 'ZZ TEST', pricePerUnit: 1.9 });
  article('ZZ-CARA', 'ZZ TEST Caramünch Typ 2', 'Malt', 'kg', 0.6, { supplier: 'ZZ TEST', pricePerUnit: 2.8 });
  article('ZZ-CITRA', 'ZZ TEST Citra', 'Houblon', 'g', 500, { supplier: 'ZZ TEST', pricePerUnit: 0.09, alphaPct: 12.5 });
  article('ZZ-US05', 'ZZ TEST US-05', 'Levure', 'sachet', 4, { supplier: 'ZZ TEST', pricePerUnit: 4.5 });

  // installation figée dans la recette (BrewhouseProfile) : sans elle, WFR-9 ne se joue pas comme chez le brasseur
  const BH = { id: 'BH-ZZ', name: 'ZZ TEST Système 30 L', volumeL: 30, efficiencyPct: 72, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3, equipmentRefs: { fermenter: 'E-ZZ-FERM' } };
  const recetteIPA = {
    name: 'ZZ TEST IPA', volumeL: 100, ogTarget: 1.060, brewhouse: BH,
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 4, kind: 'grain' }],
    hops: [{ name: 'ZZ TEST Citra', weightG: 400, stage: 'boil', time: 10 }],
    yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, // levure NOMMÉE : WFR-9 (feuille Brasser « Écran indisponible »)
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }]
  };
  add('recipes', 'R-ZZ-IPA', { id: 'R-ZZ-IPA', name: 'ZZ TEST IPA', style: 'IPA', ingredients: [], ...recetteIPA });
  add('batches', 'B-ZZ-PLAN', { id: 'B-ZZ-PLAN', name: 'ZZ TEST IPA', style: 'IPA', volumeL: 100, brewDate: '', plannedBrewDate: suisse(ajouter(aujourdhui, 10)), status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-IPA', stockAccountingVersion: 1, recipeSnapshot: recetteIPA });
  add('equipment', 'E-ZZ-FERM', { id: 'E-ZZ-FERM', name: 'ZZ TEST Fermenteur 120 L', category: 'Fermentation', status: 'ok', purchaseDate: ajouter(aujourdhui, -400), purchasePrice: 900 });

  // brassin DU JOUR (WF2-1) : planifié aujourd'hui, levure liée au stock SANS nom (stockItemRef), sels d'eau prévus, deux malts du stock
  const rsJ = { name: 'ZZ TEST Saison', volumeL: 100, ogTarget: 1.050, brewhouse: BH,
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 18, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 2, kind: 'grain' }],
    hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }, { name: 'ZZ TEST Citra', weightG: 100, stage: 'whirlpool', time: 15 }],
    yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] };
  add('recipes', 'R-ZZ-SAISON', { id: 'R-ZZ-SAISON', name: 'ZZ TEST Saison', style: 'Saison', ingredients: [], ...rsJ });
  add('batches', 'B-ZZ-JOUR', { id: 'B-ZZ-JOUR', name: 'ZZ TEST Saison', style: 'Saison', volumeL: 100, brewDate: '', plannedBrewDate: suisse(aujourdhui), status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-SAISON',
    stockAccountingVersion: 1, recipeSnapshot: rsJ, waterSalts: { gypseG: 12, cacl2G: 6, mgso4G: 0, acidLacticMl: 4, isApplied: false } });
  article('ZZ-GYPSE', 'ZZ TEST Gypse (CaSO4)', 'Sels', 'g', 500, { supplier: 'ZZ TEST', pricePerUnit: 0.02 });
  article('ZZ-CACL2', 'ZZ TEST Chlorure de calcium', 'Sels', 'g', 400, { supplier: 'ZZ TEST', pricePerUnit: 0.02 });
  article('ZZ-LACT', 'ZZ TEST Acide lactique 80 %', 'Sels', 'ml', 250, { supplier: 'ZZ TEST', pricePerUnit: 0.05 });

  // bières en vente (VENDRE, WFV-5) : une conditionnée, une terminée, hors de la période par défaut « mois courant + en cours »
  const rs = (nom) => ({ name: nom, volumeL: 100, ogTarget: 1.052, fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }], hops: [{ name: 'ZZ TEST Citra', weightG: 200, stage: 'boil', time: 60 }], yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }] });
  const lot = (id, name, jour, status, extra = {}) => ({ id, name, style: name, volumeL: 100, brewDate: suisse(jour), actualBrewDate: suisse(jour), plannedBrewDate: suisse(jour), status, gravityLog: [], recipeRef: `R-${id}`, stockAccountingVersion: 1, recipeSnapshot: rs(name), ...extra });
  const lots = [
    lot('LOT-PA', 'ZZ TEST Pale Ale', ajouter(aujourdhui, -45), 'conditionne', { packaging: { bottles33: 120, bottles75: 0, kegIds: ['F-001', 'F-002', 'F-004'] }, volumePackagedL: 99.6, packagingDate: suisse(ajouter(aujourdhui, -20)) }),
    lot('LOT-NE', 'ZZ TEST NEIPA', ajouter(aujourdhui, -60), 'termine', { packaging: { bottles33: 0, bottles75: 24, kegIds: ['F-003'] }, volumePackagedL: 48, packagingDate: suisse(ajouter(aujourdhui, -35)) })
  ];
  for (const x of lots) { add('batches', x.id, x); add('recipes', x.recipeRef, { id: x.recipeRef, name: x.name, style: x.name, volumeL: 100, ingredients: [] }); }
  const H = (d, quoi, detail) => ({ date: suisse(d), quoi, ...(detail ? { detail } : {}) });
  const fut = (id, cap, state, extra = {}) => add('kegs', id, { capacityL: cap, state, ...extra });
  const plein = (id, cap, lotId, nom, jour) => fut(id, cap, 'plein', { batchRef: lotId, beerName: nom, style: nom, fillDate: suisse(jour), historique: [H(ajouter(aujourdhui, -90), 'ajoute'), H(jour, 'rempli', `${nom} ${lotId}`)] });
  plein('F-001', 20, 'LOT-PA', 'ZZ TEST Pale Ale', ajouter(aujourdhui, -20));
  plein('F-002', 20, 'LOT-PA', 'ZZ TEST Pale Ale', ajouter(aujourdhui, -20));
  plein('F-003', 30, 'LOT-NE', 'ZZ TEST NEIPA', ajouter(aujourdhui, -35));
  fut('F-004', 20, 'livre', { batchRef: 'LOT-PA', beerName: 'ZZ TEST Pale Ale', style: 'ZZ TEST Pale Ale', fillDate: suisse(ajouter(aujourdhui, -20)), clientId: 'CL-CIGOGNE', clientName: 'ZZ TEST La Cigogne', deliveryDate: suisse(ajouter(aujourdhui, -18)) });
  add('clients', 'CL-CIGOGNE', { name: 'ZZ TEST La Cigogne', type: 'Pro', contact: 'Paul', phone: '', email: '', adresse: { rue: 'Rue du Lac', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' }, address: 'Rue du Lac 4, 1700 Fribourg' });
  add('clients', 'CL-PONT', { name: 'ZZ TEST Café du Pont', type: 'Pro', contact: '', phone: '', email: '' });
  const tarif = (prod, biere, fid, vol, prix) => add('tarifs', prod.toLowerCase().replace(/[^a-z0-9]+/g, '-'), { product: prod, biere, format: { id: fid, volumeL: vol }, priceHT: prix });
  tarif('ZZ TEST Pale Ale 33 cl', 'ZZ TEST Pale Ale', '33cl', 0.33, 4.5);
  tarif('ZZ TEST Pale Ale fût 20 L', 'ZZ TEST Pale Ale', 'fut', 20, 140);

  // plans : la vente PROMISE (B5), la commande de malt prévue (WFA-15), la Hotte (B10)
  const plan = (id, title, date, amountCents, extra = {}) => add('financialPlans', id, { id, title, date, amountCents, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: at, ...extra });
  plan('P-VENTE-CIG', 'ZZ TEST La Cigogne, 2 fûts', ajouter(aujourdhui, 10), 28000, { direction: 'in', category: 'recettes', batchId: 'LOT-PA', clientId: 'CL-CIGOGNE' });
  plan('P-MALT', 'ZZ TEST Commande de malt', ajouter(aujourdhui, 5), 42000, { category: 'brassage', vendor: 'ZZ TEST' });
  plan('P-HOTTE', 'ZZ TEST Hotte', ajouter(aujourdhui, 18), 90000, { category: 'materiel' });
  add('transactions', 'T-ZZ-ANC', { id: 'T-ZZ-ANC', date: ajouter(aujourdhui, -40), description: 'ZZ TEST facture malt', vendor: 'ZZ TEST', category: 'brassage', subcategory: 'x', amountHT: 180, amountTTC: 180, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'expense', amountCents: 18000, lines: [], paymentStatus: 'paid', paymentDate: ajouter(aujourdhui, -40), recordedAt: `${ajouter(aujourdhui, -40)}T09:00:00.000Z` } });
  add('financialProfiles', 'current', { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false,
    historyCompleteFrom: `${aujourdhui.slice(0, 4)}-01-01`, openingCash: { date: `${aujourdhui.slice(0, 4)}-01-01`, amountCents: 250000, confirmed: true } });
  return { entrees };
}
