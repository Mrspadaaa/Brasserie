// Fixture du parcours Calendrier — « données simulées », rien ne vient de la vraie brasserie. Elle imite la FORME des
// données que le brasseur a montrées dans ses captures du 20.11 (work/missions/2026-11-20-calendrier-plainte/) :
// brassins homonymes (« neipa v3 » ×3, « Ttt » ×2, « Jhhh » ×2), un « pas brassé » au passé, des brassins en cuve sans date
// de fin (« Milk Stout », « NEIPA Test »), un solde de départ négatif (−683 CHF), des achats liés à un brassin, des ventes, des
// fêtes, des papiers mensuels et d'un jour, des travaux, des idées. Dates RELATIVES à `aujourdhui` (ISO), jamais figées.
//
// Sortie : { entrees: [{ name, id, data }], ids } — `entrees` va dans localStorage (voir entree-app.mjs) ; `ids` nomme les
// choses que le parcours joue (titre → id) pour ne pas deviner à l'écran.

const MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
export const ajouter = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
export const lundiDe = (j) => { const d = new Date(`${j}T12:00:00Z`); return ajouter(j, -((d.getUTCDay() + 6) % 7)); };
const suisse = (j) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;

export function fixtureCalendrier(aujourdhui) {
  const L = lundiDe(aujourdhui);
  const s = (n, j = 0) => ajouter(L, n * 7 + j);
  const at = `${ajouter(aujourdhui, -30)}T08:00:00.000Z`;
  const entrees = [];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });

  const recetteFigee = (nom, primaire, garde, volume = 100) => ({
    name: nom, volumeL: volume, ogTarget: 1.055,
    fermentables: [{ name: 'Malt pilsner', weightKg: 20, kind: 'grain' }],
    hops: [{ name: 'Citra', weightG: 200, stage: 'boil', time: 60 }],
    yeast: { name: 'SafAle US-05', qty: 2, unit: 'sachet' },
    ...(primaire ? { fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: primaire }, ...(garde ? [{ kind: 'garde', name: 'Garde', tempC: 4, days: garde }] : [])] } : {})
  });
  const brassin = (id, name, prevu, extra = {}, jours = [14, 14]) => ({
    id, name, style: name, volumeL: 100, brewDate: '', plannedBrewDate: suisse(prevu), status: 'planifie', gravityLog: [],
    recipeRef: `R-${id}`, stockAccountingVersion: 1, recipeSnapshot: recetteFigee(name, jours[0], jours[1]), ...extra
  });
  const enCuve = (id, name, jour, extra = {}, jours = [14, 14]) => brassin(id, name, jour, {
    status: 'fermentation', brewDate: suisse(jour), actualBrewDate: suisse(jour), gravityLog: [{ date: ajouter(jour, 2), sg: 1.031, tempC: 19 }], ...extra
  }, jours);

  const batches = [
    // « neipa v3 » ×3 : deux en cuve (J10/12, J9/12 : cycle court de 12 j) et un planifié (J0/12)
    enCuve('B-NEIPA-1', 'neipa v3', ajouter(aujourdhui, -10), {}, [12, 0]),
    enCuve('B-NEIPA-2', 'neipa v3', ajouter(aujourdhui, -9), {}, [12, 0]),
    brassin('B-NEIPA-3', 'neipa v3', s(1, 2), {}, [12, 0]),
    brassin('B-BLONDE', 'Blonde d’automne', s(1), {}, [14, 14]),
    // un « pas brassé » au passé (3 semaines) : pas brassée, prête selon sa date
    brassin('B-HEFE', 'Hefe', s(-3, 1), {}, [10, 0]),
    brassin('B-SSR', 'Ssr', s(-2), {}),
    // « Ttt » ×2 (homonymes) et « Fruty » (le brassin que le brasseur glisse dans sa capture 1)
    brassin('B-TTT-1', 'Ttt', s(2), {}, [14, 14]),
    brassin('B-TTT-2', 'Ttt', s(-1, 3), {}),
    brassin('B-FRUTY', 'Fruty', s(3), {}, [14, 14]),
    // « Jhhh » ×2, brassés dans le passé (en cuve), avec un emballage prévu dans le futur chacun (achats liés à un brassin)
    enCuve('B-JHHH-1', 'Jhhh', ajouter(aujourdhui, -40), {}, [20, 14]),
    enCuve('B-JHHH-2', 'Jhhh', ajouter(aujourdhui, -33), {}, [20, 14]),
    brassin('B-JHHH-3', 'Jhhh', s(2, 4), {}, [8, 7]),
    // sans date de fin : en cuve depuis 203 et 78 jours, aucune recette qui dise les jours, aucune fin prévue (« fin non renseignée »)
    enCuve('B-MILK', 'Milk Stout', ajouter(aujourdhui, -203), {}, [0, 0]),
    enCuve('B-NEIPA-TEST', 'NEIPA Test', ajouter(aujourdhui, -78), {}, [0, 0])
  ];
  for (const b of batches) {
    add('batches', b.id, b);
    add('recipes', b.recipeRef, { id: b.recipeRef, name: b.name, style: b.name, volumeL: 100, ingredients: [] });
  }

  // budget d'un brassin (comme `BrewBudgetSheet` l'enregistre) : donne ses sorties (emballage, courses, impôt) à la prévision
  const planBudget = (b, jourBrasse, emballage) => ({
    id: `P-BREW-${b.id}`, title: `${b.name} · budget`, date: jourBrasse, amountCents: 0, direction: 'out', category: 'brassage', source: 'brew', status: 'active', batchId: b.id, createdAt: at,
    brewEstimate: {
      id: `EST-${b.id}`, createdAt: at, batchId: b.id, recipeId: b.recipeRef, title: b.name, brewDate: jourBrasse, volumeL: 100, netVolumeL: 95, netVolumeSource: 'saisi',
      recipeSnapshot: b.recipeSnapshot, bindings: {}, prices: {}, cashTreatments: {},
      settings: { costs: { energy: { enabled: true, amountTTC: 18 }, cleaning: { enabled: true, amountTTC: 6 }, packaging: { enabled: true, amountTTC: emballage } } },
      lines: [], ingredientsCost: 0, purchasesTTC: 0, operatingCashTTC: 0, operatingCost: 0, cashRequiredTTC: 0, fixedAllocation: 0, depreciationAllocation: 0, totalCost: 0, costPerL: null, complete: false, issues: []
    }
  });
  for (const b of batches.filter((x) => ['B-JHHH-1', 'B-JHHH-2', 'B-NEIPA-3', 'B-TTT-1'].includes(x.id))) {
    add('financialPlans', `P-BREW-${b.id}`, planBudget(b, ajouter(aujourdhui, b.id === 'B-JHHH-1' ? -40 : b.id === 'B-JHHH-2' ? -33 : 10), 45));
  }

  const plan = (id, title, date, amountCents, extra = {}) => add('financialPlans', id, {
    id, title, date, amountCents, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: at, ...extra
  });
  // ventes (entrée d'argent), dont une promesse liée à un brassin
  plan('P-VENTE-1', 'Café du Pont, 1 fût', s(3), 13000, { direction: 'in', category: 'recettes' });
  plan('P-VENTE-2', 'La Cigogne, 3 fûts', s(4, 2), 90000, { direction: 'in', category: 'recettes', batchId: 'B-FRUTY', clientId: 'CL-CIGOGNE' });
  // achats (sortie ni travaux ni papier), dont un lié à un brassin
  plan('P-ACHAT-1', 'Commande de malt', s(2, 1), 54000, { category: 'brassage' });
  plan('P-ACHAT-2', 'Fûts de rechange', s(5), 24000, { category: 'divers', batchId: 'B-TTT-1' });
  // travaux : un projet de matériel (fenêtre) et une rénovation d'un jour
  plan('P-TRAVAUX-1', 'Sols : colle et joints', s(6), 32000, { category: 'renovation', fenetre: { du: s(6), au: s(7, 6), joursActifs: 4 } });
  plan('P-TRAVAUX-2', 'Hotte', s(3, 2), 90000, { category: 'materiel' });
  // papiers : une charge mensuelle (récurrente), la TVA (d'un jour), un papier d'un jour
  plan('P-LOYER', 'Loyer du local', s(1, 3), 40000, { category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' } });
  plan('P-TVA', 'TVA T4', s(9, 1), 30000, { category: 'chargesFixes', source: 'tax' });
  plan('P-PAPIER', 'lol', s(2, 3), 60000, { category: 'chargesFixes' });

  // fêtes et activités (CreativeItem), idées datées
  const item = (id, data) => add('creativeItems', id, { status: 'todo', ...data });
  item('CR-NOEL', { type: 'event', title: 'Marché de Noël', date: s(5, 1), estimatedRevenue: 1180 });
  item('CR-FOIRE', { type: 'event', title: 'Foire du Valais', date: s(8, 4), estimatedRevenue: 2400, fenetre: { du: s(8, 4), au: s(8, 6) } });
  item('CR-RANGER', { type: 'event', title: 'Ranger la réserve', date: s(4), activite: true, fenetre: { du: s(4), au: s(4, 6), joursActifs: 3 } });
  item('CR-IDEE', { type: 'recipe-idea', title: 'IPA brume', status: 'idea', date: s(6, 2) });

  // pièces : un papier d'un jour (« Impôt sur la bière ») déjà facturé, une facture de matières, une vente encaissée
  const facture = (id, due, cents, kind, date, nom, extra = {}) => add('transactions', id, {
    id, date, description: nom, category: kind === 'income' ? 'recettes' : 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'unpaid', dueDate: due, recordedAt: `${date}T09:00:00.000Z` }, ...extra
  });
  facture('F-IMPOT', s(3, 4), 5500, 'expense', ajouter(aujourdhui, -12), 'Impôt sur la bière · 4 brassins');
  facture('F-BROUWLAND', s(2, 2), 42000, 'expense', ajouter(aujourdhui, -9), 'Brouwland · malt');
  facture('F-LAC', s(6, 1), 120000, 'income', ajouter(aujourdhui, -5), 'Facture Café du Lac');
  // B11 (WFV-3) : une vente encaissée aujourd'hui à la caisse, comme `enregistrerVente` l'écrit : la pièce payée et son paiement
  facture('REC-ZZ-VENTE', aujourdhui, 2700, 'income', aujourdhui, 'Vente 6 × Pale Ale — Comptoir', { subcategory: 'Vente directe' });
  { const t = entrees.find((x) => x.id === 'REC-ZZ-VENTE'); t.data.finance = { ...t.data.finance, paymentStatus: 'paid', dueDate: undefined }; }
  add('financialPayments', 'PAY-REC-ZZ-VENTE', { transactionId: 'REC-ZZ-VENTE', date: aujourdhui, amountCents: 2700, direction: 'in', method: 'twint', recordedAt: `${aujourdhui}T10:00:00.000Z` });

  // D2-CAL (W0c) : un achat de matériel payé il y a ≈ 300 jours, « ZZ TEST Pompe de brassage » à 420 CHF : le dernier achat semblable
  // que la feuille Travaux propose (« … Pompe … : 420 », estimé). Même forme que la fixture principes.mjs (ligne de facture `equipment`).
  {
    const d = ajouter(aujourdhui, -300);
    add('transactions', 'T-ZZ-POMPE', {
      id: 'T-ZZ-POMPE', date: d, description: 'ZZ TEST Pompe de brassage', vendor: 'ZZ TEST', category: 'materiel', subcategory: '', amountHT: 420, amountTTC: 420, tvaAmount: 0, tvaRate: 0,
      finance: { version: 1, kind: 'expense', amountCents: 42000, lines: [{ id: 'L-ZZ-POMPE', description: 'ZZ TEST Pompe de brassage', kind: 'equipment', amountCents: 42000 }], paymentStatus: 'paid', paymentDate: d, recordedAt: `${d}T09:00:00.000Z` }
    });
    /* son paiement (CHD-1, 21.11) : une pièce payée sans paiement rend la caisse incomplète, donc solde et courbe inconnus */
    add('financialPayments', 'PAY-T-ZZ-POMPE', { transactionId: 'T-ZZ-POMPE', date: d, amountCents: 42000, direction: 'out', method: 'card', recordedAt: `${d}T10:00:00.000Z` });
  }
  // K2 (W0c) : un projet du Carnet daté à +3 mois (son lundi), forme de `carnetDepuisPhrase` (src/domain/carnets/modele.ts) : il va
  // « Au calendrier » depuis Brassins › Atelier R&D.
  {
    const lundi = lundiDe(ajouter(aujourdhui, 91));
    add('creativeItems', 'CARNET-ZZ-K2', {
      type: 'carnet', title: 'ZZ TEST Projet chambre froide', status: 'idea', date: lundi,
      carnet: { version: 1, creeLe: at, phrase: 'ZZ TEST Projet chambre froide', criteres: [], facons: [], articles: [], notes: [], photos: [] }
    });
  }

  add('clients', 'CL-CIGOGNE', { id: 'CL-CIGOGNE', name: 'La Cigogne', type: 'Pro', contact: '' });
  // solde de départ négatif (≈ −683 CHF) : le brasseur « est en négatif » (capture 3)
  add('financialProfiles', 'current', {
    id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false,
    historyCompleteFrom: `${aujourdhui.slice(0, 4)}-01-01`, openingCash: { date: `${aujourdhui.slice(0, 4)}-01-01`, amountCents: -68300, confirmed: true }
  });

  return {
    entrees,
    ids: {
      brassin: 'B-FRUTY', brassinHomonyme: 'B-NEIPA-1', fete: 'CR-NOEL', vente: 'P-VENTE-1', achat: 'P-ACHAT-1', papier: 'P-PAPIER', travaux: 'P-TRAVAUX-2', idee: 'CR-IDEE'
    }
  };
}
