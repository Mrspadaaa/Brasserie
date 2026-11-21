// Fixture du PARCOURS CHAINES (21.11) — « ZZ TEST », données simulées, rien de la vraie brasserie (jamais seedData.ts).
// Elle réunit ce que jouent les chaînes PRODUIRE (recette neuve, malt du stock, levure nommée), VENDRE (deux fûts à un pro, plan promis,
// bières en vente), ACHETER (commande de malt prévue) et le Calendrier (une Hotte à chercher). Dates RELATIVES à `aujourdhui` (ISO).
const MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
export const ajouter = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;

/**
 * Les ajouts de W0b (21.11) sont À LA DEMANDE : chaque étape de la file « port » (A2…C1-RECETTE) nomme ce qu'elle veut, et les 13 étapes
 * des bugs gardent la fixture qu'elles ont toujours eue.
 *   sansJour  : sans le brassin du jour B-ZZ-JOUR (WF2-1 et N2 le gardent)
 *   cuve      : un lot EN CUVE depuis 14 j, courbe à deux relevés (1,050 → 1,022), FG visée 1,010 (E2)
 *   garde     : un lot en garde fini (96 L) et quatre fûts vides : 2 propres, 2 à laver (K7)
 *   retours   : trois fûts livrés chez La Cigogne en plus de F-004 (N4)
 *   rayons    : un stock en six rayons, une douzaine d'articles, jamais recomptés (F2)
 *   manques   : un brassin planifié dont un malt manque au stock (K3-COURSES)
 *   caisseBasse : caisse de départ 600 CHF : les prévus la mènent sous zéro (K4)
 *   marge     : un tarif 33 cl pour la bière du brassin planifié (N6)
 *   achatPompe: l'achat passé « ZZ TEST Pompe 2025 » à 420 (D2, prix « dernier achat semblable »)
 *   rebrasser : une recette passée dont les lignes ne sont pas reliées au stock (N3)
 */
export function fixtureChaines(aujourdhui, { sansJour = false, cuve = false, garde = false, retours = false, rayons = false, manques = false, caisseBasse = false, marge = false, achatPompe = false, rebrasser = false } = {}) {
  const at = `${ajouter(aujourdhui, -30)}T08:00:00.000Z`;
  const entrees = [];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });

  // stock : des malts (dont un seul reste, 600 g : la pastille « Ajouter … en stock » de WFR-3), houblon, levure, emballage
  article('ZZ-PILS', 'ZZ TEST Malt pilsner', 'Malt', 'kg', 60, { minStock: 10, supplier: 'ZZ TEST', pricePerUnit: 1.6 });
  article('ZZ-MUNICH', 'ZZ TEST Munich', 'Malt', 'kg', 10, { supplier: 'ZZ TEST', pricePerUnit: 1.9 });
  article('ZZ-CARA', 'ZZ TEST Caramünch Typ 2', 'Malt', 'kg', 0.6, { supplier: 'ZZ TEST', pricePerUnit: 2.8 });
  article('ZZ-CITRA', 'ZZ TEST Citra', 'Houblon', 'g', 500, { supplier: 'ZZ TEST', pricePerUnit: 0.09, alphaPct: 12.5, fiche: { id: 'beermaverick-citra', approchee: false } }); // D403 : relié par son identifiant
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
  if (!sansJour) { const rsJ = { name: 'ZZ TEST Saison', volumeL: 100, ogTarget: 1.050, brewhouse: BH,
    fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 18, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 2, kind: 'grain' }],
    hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }, { name: 'ZZ TEST Citra', weightG: 100, stage: 'whirlpool', time: 15 }],
    yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] };
  add('recipes', 'R-ZZ-SAISON', { id: 'R-ZZ-SAISON', name: 'ZZ TEST Saison', style: 'Saison', ingredients: [], ...rsJ });
  add('batches', 'B-ZZ-JOUR', { id: 'B-ZZ-JOUR', name: 'ZZ TEST Saison', style: 'Saison', volumeL: 100, brewDate: '', plannedBrewDate: suisse(aujourdhui), status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-SAISON',
    stockAccountingVersion: 1, recipeSnapshot: rsJ, waterSalts: { gypseG: 12, cacl2G: 6, mgso4G: 0, acidLacticMl: 4, isApplied: false } }); }
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
  plan('P-POMPE', 'ZZ TEST Pompe de transfert', ajouter(aujourdhui, 8), 45000, { category: 'materiel', source: 'equipment', vendor: 'ZZ TEST Brewferm' }); // WFA-12 : matériel prévu, aucun achat lié
  add('transactions', 'T-ZZ-ANC', { id: 'T-ZZ-ANC', date: ajouter(aujourdhui, -40), description: 'ZZ TEST facture malt', vendor: 'ZZ TEST', category: 'brassage', subcategory: 'x', amountHT: 180, amountTTC: 180, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'expense', amountCents: 18000, lines: [], paymentStatus: 'paid', paymentDate: ajouter(aujourdhui, -40), recordedAt: `${ajouter(aujourdhui, -40)}T09:00:00.000Z` } });
  add('financialProfiles', 'current', { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false,
    historyCompleteFrom: `${aujourdhui.slice(0, 4)}-01-01`, openingCash: { date: `${aujourdhui.slice(0, 4)}-01-01`, amountCents: caisseBasse ? 60000 : 250000, confirmed: true } });

  // ───────────── W0b : les ajouts à la demande ─────────────
  const hist = (jours) => [{ date: suisse(ajouter(aujourdhui, jours)), quoi: 'ajoute' }];
  const bh = BH; // même installation figée que les autres recettes
  if (cuve) {
    const jF = ajouter(aujourdhui, -14);
    const rsF = { name: 'ZZ TEST Blonde', volumeL: 100, ogTarget: 1.050, fgTarget: 1.010, brewhouse: bh,
      fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }], hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }],
      yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }, { kind: 'garde', name: 'Garde', tempC: 2, days: 7 }] };
    add('recipes', 'R-ZZ-BLONDE', { id: 'R-ZZ-BLONDE', name: 'ZZ TEST Blonde', style: 'Blonde', ingredients: [], ...rsF });
    add('batches', 'B-ZZ-FERM', { id: 'B-ZZ-FERM', name: 'ZZ TEST Blonde', style: 'Blonde', volumeL: 100, volumeBrewedL: 98, brewDate: suisse(jF), actualBrewDate: suisse(jF), plannedBrewDate: suisse(jF),
      status: 'fermentation', og: '1.050', recipeRef: 'R-ZZ-BLONDE', stockAccountingVersion: 1, recipeSnapshot: rsF,
      gravityLog: [{ date: jF, sg: 1.050, tempC: 19 }, { date: ajouter(aujourdhui, -7), sg: 1.022, tempC: 19 }] });
  }
  if (garde) {
    const jG = ajouter(aujourdhui, -24);
    const rsG = { name: 'ZZ TEST Ambrée', volumeL: 100, ogTarget: 1.052, fgTarget: 1.011, brewhouse: bh, fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }],
      hops: [{ name: 'ZZ TEST Citra', weightG: 150, stage: 'boil', time: 60 }], yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }, { kind: 'garde', name: 'Garde', tempC: 2, days: 7 }] };
    add('recipes', 'R-ZZ-AMBREE', { id: 'R-ZZ-AMBREE', name: 'ZZ TEST Ambrée', style: 'Ambrée', ingredients: [], ...rsG });
    add('batches', 'B-ZZ-GARDE', { id: 'B-ZZ-GARDE', name: 'ZZ TEST Ambrée', style: 'Ambrée', volumeL: 100, volumeBrewedL: 96, brewDate: suisse(jG), actualBrewDate: suisse(jG), plannedBrewDate: suisse(jG),
      status: 'garde', og: '1.052', fg: '1.011', recipeRef: 'R-ZZ-AMBREE', stockAccountingVersion: 1, recipeSnapshot: rsG,
      gravityLog: [{ date: jG, sg: 1.052 }, { date: ajouter(aujourdhui, -14), sg: 1.012 }, { date: ajouter(aujourdhui, -10), sg: 1.011 }] });
    for (const [id, state] of [['F-005', 'propre'], ['F-006', 'propre'], ['F-007', 'lavage'], ['F-008', 'lavage']]) fut(id, 20, state, { historique: hist(-90) });
  }
  if (retours) {
    for (const [id, jours] of [['F-009', -30], ['F-010', -12]]) fut(id, 20, 'livre', { batchRef: 'LOT-PA', beerName: 'ZZ TEST Pale Ale', style: 'ZZ TEST Pale Ale', fillDate: suisse(ajouter(aujourdhui, -40)),
      clientId: 'CL-CIGOGNE', clientName: 'ZZ TEST La Cigogne', deliveryDate: suisse(ajouter(aujourdhui, jours)), historique: hist(-90) });
  }
  if (rayons) {
    // six rayons (familles) : le stock de base en tient quatre (Malt, Houblon, Levure, Sels) ; on ajoute Emballage et Sucre, et de quoi remplir chaque rayon
    article('ZZ-MOSAIC', 'ZZ TEST Mosaic', 'Houblon', 'g', 300, { supplier: 'ZZ TEST', pricePerUnit: 0.11, alphaPct: 11.5 });
    article('ZZ-SAAZ', 'ZZ TEST Saaz', 'Houblon', 'g', 250, { supplier: 'ZZ TEST', pricePerUnit: 0.07, alphaPct: 3.5 });
    article('ZZ-B33', 'ZZ TEST Bouteille 33 cl', 'Emballage', 'pièce', 200, { supplier: 'ZZ TEST', pricePerUnit: 0.35, minStock: 100 });
    article('ZZ-CAPS', 'ZZ TEST Capsule 26 mm', 'Emballage', 'pièce', 300, { supplier: 'ZZ TEST', pricePerUnit: 0.03 });
    article('ZZ-SUCRE', 'ZZ TEST Sucre de resucrage', 'Sucre', 'kg', 3, { supplier: 'ZZ TEST', pricePerUnit: 1.2 });
    article('ZZ-DEXTROSE', 'ZZ TEST Dextrose', 'Sucre', 'kg', 2, { supplier: 'ZZ TEST', pricePerUnit: 2.1 });
  }
  if (manques) {
    // un brassin planifié dans 9 jours (avant celui de la fixture de base) qui veut 3 kg de Caramünch pour 600 g au stock : il manque 2,4 kg
    const rsM = { name: 'ZZ TEST Brune', volumeL: 100, ogTarget: 1.056, brewhouse: bh,
      fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 15, kind: 'grain' }, { name: 'ZZ TEST Caramünch Typ 2', weightKg: 3, kind: 'grain' }],
      hops: [{ name: 'ZZ TEST Citra', weightG: 100, stage: 'boil', time: 60 }], yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] };
    add('recipes', 'R-ZZ-BRUNE', { id: 'R-ZZ-BRUNE', name: 'ZZ TEST Brune', style: 'Brune', ingredients: [], ...rsM });
    add('batches', 'B-ZZ-MANQUE', { id: 'B-ZZ-MANQUE', name: 'ZZ TEST Brune', style: 'Brune', volumeL: 100, brewDate: '', plannedBrewDate: suisse(ajouter(aujourdhui, 9)), status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-BRUNE', stockAccountingVersion: 1, recipeSnapshot: rsM });
  }
  if (marge) { tarif('ZZ TEST IPA 33 cl', 'ZZ TEST IPA', '33cl', 0.33, 4.8); tarif('ZZ TEST Blonde 33 cl', 'ZZ TEST Blonde', '33cl', 0.33, 4.6); }
  if (achatPompe) {
    const d = ajouter(aujourdhui, -300);
    add('transactions', 'T-ZZ-POMPE', { id: 'T-ZZ-POMPE', date: d, description: 'ZZ TEST Pompe 2025', vendor: 'ZZ TEST Brewferm', category: 'materiel', subcategory: 'x', amountHT: 420, amountTTC: 420, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: 42000, vendor: 'ZZ TEST Brewferm', paymentStatus: 'paid', paymentDate: d, recordedAt: `${d}T09:00:00.000Z`,
        lines: [{ id: 'L-ZZ-POMPE', description: 'ZZ TEST Pompe', kind: 'equipment', amountCents: 42000, quantity: 1, unit: 'pièce', unitPriceCents: 42000 }] } });
  }
  if (rebrasser) {
    // une recette passée « ZZ TEST Pale Ale v1 » dont les lignes portent un nom, jamais le lien au stock ; son houblon à un α de 9 % alors que le stock en a 12,5
    add('recipes', 'R-ZZ-PA-V1', { id: 'R-ZZ-PA-V1', name: 'ZZ TEST Pale Ale v1', style: 'Pale Ale', volumeL: 100, ogTarget: 1.052, brewhouse: bh, ingredients: [],
      fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 4, kind: 'grain' }],
      hops: [{ name: 'ZZ TEST Citra', weightG: 300, stage: 'boil', time: 60, alphaPct: 9 }], yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] });
  }
  // la caisse basse (K4) : ni la facture « à confirmer » (le solde ne serait pas connu) ni la Pompe (son prévu est optionnel, deux points bas) ;
  // 600 − 420 (malt) + 280 (vente promise) − 900 (Hotte) : le point le plus bas est −440, au jour de la Hotte
  if (caisseBasse) return { entrees: entrees.filter((e) => e.id !== 'T-ZZ-ANC' && e.id !== 'P-POMPE') };
  return { entrees };
}
