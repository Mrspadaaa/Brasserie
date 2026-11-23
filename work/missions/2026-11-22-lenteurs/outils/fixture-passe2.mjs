// Fixture de la passe 2 (21.11) : « ZZ TEST », simulée, jamais seedData.ts. Base = fixture du parcours chaînes de port-carnet
// (copie `fixture-base.mjs`, HEAD aaecde10f), plus l'état qui passe B1 et B3 sans geste contourné dans les chaînes mesurées :
// un brassin DÉMARRÉ en fermentation (Calendrier s'ouvre, mesures et dry hop jouables), un brassin à conditionner (garde finie),
// le matériel d'emballage, des sels, du matériel à entretenir, l'historique d'un client pro et d'un fournisseur (commandes récurrentes).
import { fixtureChaines, ajouter } from './fixture-base.mjs';
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;

export function fixturePasse2(aujourdhui) {
  const { entrees } = fixtureChaines(aujourdhui);
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });
  article('ZZ-B33', 'ZZ TEST Bouteille 33 cl', 'Emballage', 'pièce', 200, { supplier: 'ZZ TEST', pricePerUnit: 0.35, minStock: 100 });
  article('ZZ-CAPS', 'ZZ TEST Capsule 26 mm', 'Emballage', 'pièce', 300, { supplier: 'ZZ TEST', pricePerUnit: 0.03 });
  article('ZZ-SUCRE', 'ZZ TEST Sucre de resucrage', 'Sucre', 'kg', 3, { supplier: 'ZZ TEST', pricePerUnit: 1.2 });
  article('ZZ-GYPSE', 'ZZ TEST Gypse (CaSO4)', 'Sels', 'g', 500, { supplier: 'ZZ TEST', pricePerUnit: 0.02 });
  article('ZZ-CACL2', 'ZZ TEST Chlorure de calcium', 'Sels', 'g', 400, { supplier: 'ZZ TEST', pricePerUnit: 0.02 });
  article('ZZ-LACT', 'ZZ TEST Acide lactique 80 %', 'Sels', 'ml', 250, { supplier: 'ZZ TEST', pricePerUnit: 0.05 });
  article('ZZ-SOUDE', 'ZZ TEST Soude caustique', 'Nettoyage', 'kg', 0.5, { supplier: 'ZZ TEST', pricePerUnit: 6, minStock: 2 });

  // brassin démarré il y a 14 j, en fermentation (primaire 12 j puis garde 7 j), deux densités, dry hop prévu
  const rsF = { name: 'ZZ TEST Blonde', volumeL: 100, ogTarget: 1.050, brewhouse: { id: 'BH-ZZ', name: 'ZZ TEST Système 30 L', volumeL: 30, efficiencyPct: 72, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3, equipmentRefs: { fermenter: 'E-ZZ-FERM' } },
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }],
    hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }, { name: 'ZZ TEST Citra', weightG: 200, stage: 'dryHop', time: 3 }],
    yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }, { kind: 'garde', name: 'Garde', tempC: 2, days: 7 }] };
  const jF = ajouter(aujourdhui, -14);
  add('recipes', 'R-ZZ-BLONDE', { id: 'R-ZZ-BLONDE', name: 'ZZ TEST Blonde', style: 'Blonde', ingredients: [], ...rsF });
  add('batches', 'B-ZZ-FERM', { id: 'B-ZZ-FERM', name: 'ZZ TEST Blonde', style: 'Blonde', volumeL: 100, volumeBrewedL: 98, brewDate: suisse(jF), actualBrewDate: suisse(jF), plannedBrewDate: suisse(jF),
    status: 'fermentation', og: '1.050', recipeRef: 'R-ZZ-BLONDE', stockAccountingVersion: 1, recipeSnapshot: rsF,
    gravityLog: [{ date: jF, sg: 1.050, tempC: 19 }, { date: ajouter(aujourdhui, -7), sg: 1.022, tempC: 19 }] });

  // brassin en garde, fini : à conditionner aujourd'hui (bouteilles + fûts)
  const jG = ajouter(aujourdhui, -24);
  const rsG = { ...rsF, name: 'ZZ TEST Ambrée', hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }] };
  add('recipes', 'R-ZZ-AMBREE', { id: 'R-ZZ-AMBREE', name: 'ZZ TEST Ambrée', style: 'Ambrée', ingredients: [], ...rsG });
  add('batches', 'B-ZZ-GARDE', { id: 'B-ZZ-GARDE', name: 'ZZ TEST Ambrée', style: 'Ambrée', volumeL: 100, volumeBrewedL: 96, brewDate: suisse(jG), actualBrewDate: suisse(jG), plannedBrewDate: suisse(jG),
    status: 'garde', og: '1.052', fg: '1.011', recipeRef: 'R-ZZ-AMBREE', stockAccountingVersion: 1, recipeSnapshot: rsG,
    gravityLog: [{ date: jG, sg: 1.052 }, { date: ajouter(aujourdhui, -14), sg: 1.012 }, { date: ajouter(aujourdhui, -10), sg: 1.011 }] });
  const fut = (id, cap, state) => add('kegs', id, { capacityL: cap, state, historique: [{ date: suisse(ajouter(aujourdhui, -90)), quoi: 'ajoute' }] });
  fut('F-005', 20, 'propre'); fut('F-006', 20, 'propre'); fut('F-007', 20, 'lavage'); fut('F-008', 20, 'lavage');

  // matériel : un instrument à étalonner (échéance dépassée), un entretien au brassin, une panne
  const mat = (id, name, category, extra) => add('equipment', id, { id, ref: id, name, category, state: 'Bon', purchaseDate: ajouter(aujourdhui, -500), ...extra });
  mat('E-ZZ-DENSI', 'ZZ TEST Densimètre', 'Mesure', { task: 'Étalonner', rhythm: { every: 1, unit: 'mois' }, lastDone: ajouter(aujourdhui, -45), purchasePrice: 40 });
  mat('E-ZZ-PH', 'ZZ TEST pH-mètre', 'Mesure', { task: 'Étalonner', rhythm: { every: 2, unit: 'semaine' }, lastDone: ajouter(aujourdhui, -20), purchasePrice: 120 });
  mat('E-ZZ-ECH', 'ZZ TEST Échangeur à plaques', 'Brassage', { task: 'Détartrer', rhythm: { every: 5, unit: 'brassin' }, lastDone: ajouter(aujourdhui, -60), purchasePrice: 350 });
  mat('E-ZZ-POMPE', 'ZZ TEST Pompe de transfert', 'Brassage', { task: 'Nettoyer', rhythm: { every: 3, unit: 'mois' }, lastDone: ajouter(aujourdhui, -30), purchasePrice: 450 });

  // historique : La Cigogne prend 2 fûts de Pale Ale chaque mois (3 factures payées) ; deux factures fournisseur ZZ TEST Brouwland
  for (const [k, n] of [[-75, 'F-2026-031'], [-45, 'F-2026-038'], [-16, 'F-2026-044']]) {
    const d = ajouter(aujourdhui, k);
    add('transactions', `T-ZZ-V${-k}`, { id: `T-ZZ-V${-k}`, date: d, description: `ZZ TEST La Cigogne ${n}`, vendor: 'ZZ TEST La Cigogne', category: 'recettes', subcategory: 'ventes', amountHT: 280, amountTTC: 280, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'income', amountCents: 28000, vendor: 'ZZ TEST La Cigogne', invoiceNumber: n, paymentStatus: 'paid', paymentDate: ajouter(d, 20), recordedAt: `${d}T10:00:00.000Z`, batchId: 'LOT-PA',
        lines: [{ id: `L-${n}`, description: 'ZZ TEST Pale Ale fût 20 L', kind: 'other', amountCents: 28000, quantity: 2, unit: 'fût', unitPriceCents: 14000 }] } });
  }
  for (const [k, n, kg] of [[-70, 'BW-2026-0901', 50], [-35, 'BW-2026-1010', 25]]) {
    const d = ajouter(aujourdhui, k); const cents = kg * 160 + 20000 + 2700;
    add('transactions', `T-ZZ-A${-k}`, { id: `T-ZZ-A${-k}`, date: d, description: `ZZ TEST Brouwland ${n}`, vendor: 'ZZ TEST Brouwland', category: 'brassage', subcategory: 'matieres', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: cents, vendor: 'ZZ TEST Brouwland', invoiceNumber: n, paymentStatus: 'paid', paymentDate: d, recordedAt: `${d}T09:00:00.000Z`,
        lines: [
          { id: `${n}-1`, description: 'ZZ TEST Malt pilsner', kind: 'ingredient', amountCents: kg * 160, quantity: kg, unit: 'kg', unitPriceCents: 160, stockItemRef: 'ZZ-PILS' },
          { id: `${n}-2`, description: 'ZZ TEST Citra', kind: 'ingredient', amountCents: 20000, quantity: 500, unit: 'g', unitPriceCents: 40, stockItemRef: 'ZZ-CITRA' },
          { id: `${n}-3`, description: 'ZZ TEST US-05', kind: 'ingredient', amountCents: 2700, quantity: 6, unit: 'sachet', unitPriceCents: 450, stockItemRef: 'ZZ-US05' }] } });
  }
  // brassin du jour : levure liée au stock SANS nom (WFR-9/B2 non corrigé dans HEAD lève « Écran indisponible » sur une levure nommée)
  const rsJ = { ...rsF, name: 'ZZ TEST Saison', yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' }, hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }, { name: 'ZZ TEST Citra', weightG: 100, stage: 'whirlpool', time: 15 }],
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 18, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 2, kind: 'grain' }] };
  add('recipes', 'R-ZZ-SAISON', { id: 'R-ZZ-SAISON', name: 'ZZ TEST Saison', style: 'Saison', ingredients: [], ...rsJ });
  add('batches', 'B-ZZ-JOUR', { id: 'B-ZZ-JOUR', name: 'ZZ TEST Saison', style: 'Saison', volumeL: 100, brewDate: '', plannedBrewDate: suisse(aujourdhui), status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-SAISON', stockAccountingVersion: 1, recipeSnapshot: rsJ,
    waterSalts: { gypseG: 12, cacl2G: 6, mgso4G: 0, acidLacticMl: 4, isApplied: false } });
  return { entrees };
}
